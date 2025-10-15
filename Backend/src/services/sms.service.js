const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log('✅ Twilio SMS service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Twilio:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️ Twilio credentials not provided, SMS service disabled');
      this.isConfigured = false;
    }
  }

  async sendSMS(to, message, from = null) {
    if (!this.isConfigured || !this.client) {
      throw new Error('SMS service not configured');
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: from || process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      console.log(`📱 SMS sent successfully to ${to}`, {
        messageId: result.sid,
        status: result.status
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: to
      };

    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      throw error;
    }
  }

  validatePhoneNumber(phone) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  formatPhoneNumber(phone, defaultCountryCode = '+1') {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length > 10 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    if (cleaned.length === 10) {
      return `${defaultCountryCode}${cleaned}`;
    }
    
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return `${defaultCountryCode}${cleaned}`;
  }

  async getAccountBalance() {
    if (!this.isConfigured || !this.client) {
      return null;
    }

    try {
      // For development, return mock balance
      if (process.env.NODE_ENV !== 'production') {
        return 10.00;
      }
      
      const account = await this.client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return parseFloat(account.balance) || 0;
      
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return null;
    }
  }
}

module.exports = { SMSService: new SMSService() };