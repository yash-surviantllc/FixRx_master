const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    
    this.stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Use the latest stable version
      maxNetworkRetries: 2,
      timeout: 20000, // 20 second timeout
    });
    
    this.commissionRate = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '10') / 100;
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    
    // Verify Stripe connection on startup
    this.verifyStripeConnection().catch(error => {
      if (logger && typeof logger.error === 'function') {
        logger.error('Failed to verify Stripe connection:', { error: error.message });
      } else {
        console.error('Failed to verify Stripe connection:', error);
      }
      throw new Error(`Stripe connection failed: ${error.message}`);
    });
  }
  
  /**
   * Verify Stripe API connection
   * @private
   */
  async verifyStripeConnection() {
    try {
      await this.stripe.balance.retrieve();
      logger.info('Successfully connected to Stripe API');
      return true;
    } catch (error) {
      logger.error('Stripe connection check failed:', error);
      throw new Error(`Failed to connect to Stripe: ${error.message}`);
    }
  }

  /**
   * Calculate platform fee and vendor amount
   * @param {number} amount - Total amount in smallest currency unit (e.g., cents)
   * @returns {{platformFee: number, vendorAmount: number}}
   */
  calculateFees(amount) {
    const platformFee = Math.round(amount * this.commissionRate);
    const vendorAmount = amount - platformFee;
    return { platformFee, vendorAmount };
  }

  /**
   * Create a new customer in Stripe
   * @param {string} email - Customer email
   * @param {string} userId - Internal user ID
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(email, userId) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: { userId }
      });
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a payment intent
   * @param {number} amount - Amount in smallest currency unit (e.g., cents)
   * @param {string} customerId - Stripe customer ID
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Full Stripe payment intent object
   * @throws {Error} If the payment intent creation fails
   */
  async createPaymentIntent(amount, customerId, metadata = {}) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const { platformFee } = this.calculateFees(amount);
      
      logger.info('Creating payment intent', { 
        amount, 
        customerId, 
        platformFee,
        metadata: JSON.stringify(metadata) 
      });
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        metadata: {
          ...metadata,
          platform_fee: platformFee,
          vendor_amount: amount - platformFee,
          created_by: 'fixrx-api',
          environment: process.env.NODE_ENV || 'development'
        },
        automatic_payment_methods: {
          enabled: true,
        },
        // Use statement_descriptor_suffix instead of statement_descriptor for card payments
        statement_descriptor_suffix: 'FIXRX',
        // Add receipt email if available
        receipt_email: metadata.email,
      });

      logger.info('Successfully created payment intent', {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret ? '***' : 'missing',
        status: paymentIntent.status
      });

      // Return the full payment intent object
      return paymentIntent;
      
    } catch (error) {
      const errorMessage = `Failed to create payment intent: ${error.message}`;
      logger.error(errorMessage, { 
        error: error.type || 'stripe_error',
        code: error.code,
        amount,
        customerId: customerId ? '***' + customerId.slice(-4) : 'missing'
      });
      
      // Rethrow with more context
      error.message = errorMessage;
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Confirmed payment intent
   */
  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  /**
   * Retrieve a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  async retrievePayment(paymentIntentId) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error('Error retrieving payment intent:', error);
      throw new Error('Failed to retrieve payment');
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature
   * @returns {Promise<Object>} Webhook event
   */
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw new Error('Invalid signature');
    }
  }

  /**
   * Create a payment method
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Payment method details
   */
  async createPaymentMethod(paymentMethodId) {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      logger.error('Error retrieving payment method:', error);
      throw new Error('Failed to retrieve payment method');
    }
  }
}

module.exports = new StripeService();
