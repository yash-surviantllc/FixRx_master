const stripeService = require('../services/stripeService');
const { dbManager } = require('../config/database');

// Try to import logger, but don't fail if it's not available
let logger;
try {
  logger = require('../utils/logger');
} catch (e) {
  console.warn('Logger not found, using console.error as fallback');
  logger = {
    error: (...args) => console.error('ERROR:', ...args),
    warn: (...args) => console.warn('WARN:', ...args),
    info: (...args) => console.log('INFO:', ...args)
  };
}

// Simple error handler
const handleError = (res, error, message = 'An error occurred') => {
  const errorMessage = `${message}: ${error.message || error}`;
  
  // Log the error using logger if available, otherwise use console.error
  if (logger && typeof logger.error === 'function') {
    logger.error(errorMessage, { error });
  } else {
    console.error(errorMessage, error);
  }
  
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    code: 'INTERNAL_SERVER_ERROR'
  });
};

class PaymentController {
  /**
   * Create a payment intent
   * @route POST /api/v1/payments/create-intent
   * @access Private
   */
  async createPaymentIntent(req, res) {
    try {
      const { amount, serviceRequestId, vendorId } = req.body;
      const userId = req.user.id;

      // Get or create customer in Stripe
      let customer;
      const userResult = await dbManager.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0];
      
      if (user.stripe_customer_id) {
        customer = { id: user.stripe_customer_id };
      } else {
        customer = await stripeService.createCustomer(user.email, userId);
        // Save customer ID to user record
        await dbManager.query(
          'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
          [customer.id, userId]
        );
      }

      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        customer.id,
        {
          vendor_id: vendorId,
          consumer_id: userId,
        }
      );

      // Calculate platform fee and vendor amount
      const platformFee = Math.round(amount * 0.1); // 10% platform fee
      const vendorAmount = amount - platformFee;

      // Save payment to database
      const insertQuery = `
        INSERT INTO payments (
          payment_intent_id, amount, platform_fee, vendor_amount, 
          currency, status, consumer_id, vendor_id, 
          service_request_id, client_secret, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const values = [
        paymentIntent.id,   // $1
        paymentIntent.amount, // $2
        platformFee,        // $3
        vendorAmount,       // $4
        paymentIntent.currency, // $5
        paymentIntent.status,   // $6
        userId,             // $7 - consumerId
        vendorId,           // $8 - vendorId
        serviceRequestId,   // $9 - serviceRequestId
        paymentIntent.client_secret, // $10
        new Date(),         // $11
        new Date()          // $12
      ];
      await dbManager.query(insertQuery, values);

      res.status(200).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      });
    } catch (error) {
      return handleError(res, error, 'Error creating payment intent');
    }
  }

  /**
   * Confirm a payment
   * @route POST /api/v1/payments/confirm
   * @access Private
   */
  async confirmPayment(req, res) {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user.id;

      // Confirm payment with Stripe
      const confirmedPayment = await stripeService.confirmPayment(paymentIntentId);

      // Update payment status in database
      const updateQuery = `
        UPDATE payments 
        SET status = $1, updated_at = $2
        WHERE payment_intent_id = $3
        RETURNING *
      `;
      
      const result = await dbManager.query(updateQuery, [
        confirmedPayment.status,
        new Date(),
        paymentIntentId
      ]);

      res.status(200).json({
        success: true,
        data: {
          status: confirmedPayment.status,
          amount: confirmedPayment.amount,
          paymentMethod: confirmedPayment.payment_method_types ? 
            confirmedPayment.payment_method_types[0] : 'card'
        }
      });
    } catch (error) {
      return handleError(res, error, 'Error confirming payment');
    }
  }

  /**
   * Get payment details
   * @route GET /api/v1/payments/:paymentIntentId
   * @access Private
   */
  async getPayment(req, res) {
    try {
      const { paymentIntentId } = req.params;
      const userId = req.user.id;

      // Get payment from database
      const query = `
        SELECT * FROM payments 
        WHERE payment_intent_id = $1 
        AND (consumer_id = $2 OR vendor_id = $2)
        LIMIT 1
      `;
      const result = await dbManager.query(query, [paymentIntentId, userId]);
      const payment = result.rows[0];

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      // Get updated status from Stripe
      const stripePayment = await stripeService.retrievePayment(paymentIntentId);

      res.status(200).json({
        success: true,
        data: {
          id: payment.id,
          amount: payment.amount,
          status: stripePayment.status,
          platformFee: payment.platform_fee,
          vendorAmount: payment.vendor_amount,
          createdAt: payment.created_at,
          serviceRequestId: payment.service_request_id,
        },
      });
    } catch (error) {
      return handleError(res, error, 'Error getting payment');
    }
  }

  /**
   * Handle Stripe webhook events
   * @route POST /api/v1/payments/webhook
   * @access Public (called by Stripe)
   */
  async handleWebhook(req, res) {
    let event;
    
    try {
      const sig = req.headers['stripe-signature'];
      
      // Verify webhook signature and construct the event
      event = stripeService.stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      // Add more event types as needed
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  }

  /**
   * Handle successful payment
   * @private
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      const { id: paymentIntentId, amount, metadata } = paymentIntent;
      
      await db('payments')
        .where({ payment_intent_id: paymentIntentId })
        .update({
          status: 'succeeded',
          updated_at: new Date(),
        });

      // TODO: Send confirmation email to consumer
      // TODO: Notify vendor about the payment
      // TODO: Update service request status

      logger.info(`Payment succeeded: ${paymentIntentId}`);
    } catch (error) {
      logger.error('Error handling payment success:', error);
    }
  }

  /**
   * Handle failed payment
   * @private
   */
  async handlePaymentIntentFailed(paymentIntent) {
    try {
      const { id: paymentIntentId, last_payment_error } = paymentIntent;
      
      await db('payments')
        .where({ payment_intent_id: paymentIntentId })
        .update({
          status: 'failed',
          failure_reason: last_payment_error?.message || 'Payment failed',
          updated_at: new Date(),
        });

      logger.warn(`Payment failed: ${paymentIntentId}`, {
        reason: last_payment_error?.message,
      });
    } catch (error) {
      logger.error('Error handling payment failure:', error);
    }
  }

  /**
   * Get Stripe publishable key
   * @route GET /api/v1/payments/config
   * @access Private
   */
  getConfig(req, res) {
    res.status(200).json({
      success: true,
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
    });
  }
}

module.exports = new PaymentController();
