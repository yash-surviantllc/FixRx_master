class MockEnhancedInvitationService {
  constructor() {
    this.mockUsers = new Map();
    this.mockInvitations = new Map();
    this.mockContacts = new Map();
    this.mockLogs = new Map();
  }

  async getReferralCode(userId) {
    if (!this.mockUsers.has(userId)) {
      const code = `TEST${Math.floor(1000 + Math.random() * 9000)}`;
      this.mockUsers.set(userId, { referralCode: code });
    }
    return this.mockUsers.get(userId).referralCode;
  }

  async createEnhancedInvitation(userId, invitationData) {
    const invitationId = `inv_${Date.now()}`;
    const referralCode = await this.getReferralCode(userId);
    
    const invitation = {
      id: invitationId,
      inviter_id: userId,
      recipient_phone: invitationData.recipientPhone,
      recipient_email: invitationData.recipientEmail,
      recipient_name: invitationData.recipientName,
      invitation_type: invitationData.invitationType || 'FRIEND',
      delivery_method: invitationData.recipientPhone ? 'SMS' : 'EMAIL',
      referral_code: referralCode,
      custom_message: invitationData.customMessage,
      service_category: invitationData.serviceCategory,
      status: 'sent',
      created_at: new Date(),
      inviter_name: 'Test User'
    };
    
    this.mockInvitations.set(invitationId, invitation);
    
    // Mock SMS/Email sending
    if (invitation.delivery_method === 'SMS') {
      console.log(`MOCK SMS: Sending to ${invitationData.recipientPhone}`);
      console.log(`Message: Hi ${invitationData.recipientName}! Test User invited you to FixRx. Use code: ${referralCode}`);
    } else {
      console.log(`MOCK EMAIL: Sending to ${invitationData.recipientEmail}`);
    }
    
    return invitation;
  }

  async importContacts(userId, contactData, source) {
    const importId = `import_${Date.now()}`;
    const imported = contactData.map((contact, index) => ({
      id: `contact_${Date.now()}_${index}`,
      user_id: userId,
      first_name: contact.firstName || contact.first_name || 'Unknown',
      last_name: contact.lastName || contact.last_name || 'User',
      phone: contact.phone || contact.phoneNumber,
      email: contact.email,
      contact_type: contact.contactType || 'FRIEND',
      source: source,
      created_at: new Date()
    }));
    
    // Store contacts
    imported.forEach(contact => {
      this.mockContacts.set(contact.id, contact);
      console.log(`DEBUG: Stored contact with ID: ${contact.id}`);
    });
    
    console.log(`DEBUG: Total contacts stored: ${this.mockContacts.size}`);
    
    return {
      importId,
      summary: {
        total: contactData.length,
        imported: imported.length,
        duplicates: 0,
        errors: 0
      },
      contacts: imported,
      duplicates: [],
      errors: []
    };
  }

  async getContacts(userId, options = {}) {
    const contacts = Array.from(this.mockContacts.values())
      .filter(c => c.user_id === userId);
    
    return {
      contacts,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 50,
        total: contacts.length,
        totalPages: Math.ceil(contacts.length / (options.limit || 50))
      }
    };
  }

  async inviteContacts(userId, contactIds, invitationData) {
    console.log('DEBUG: inviteContacts called with:', { userId, contactIds, invitationData });
    console.log('DEBUG: Available contact IDs:', Array.from(this.mockContacts.keys()));
    console.log('DEBUG: Looking for contact IDs:', contactIds);
    
    const contacts = [];
    for (const id of contactIds) {
      const contact = this.mockContacts.get(id);
      if (contact) {
        contacts.push(contact);
        console.log(`DEBUG: Found contact: ${contact.first_name} ${contact.last_name}`);
      } else {
        console.log(`DEBUG: Contact not found for ID: ${id}`);
      }
    }
    
    console.log(`DEBUG: Found ${contacts.length} contacts out of ${contactIds.length} requested`);
    
    const results = {
      total: contacts.length,
      successful: [],
      failed: [],
      duplicates: []
    };

    for (const contact of contacts) {
      try {
        // Mock duplicate check
        const existingInvitations = Array.from(this.mockInvitations.values())
          .filter(inv => inv.inviter_id === userId && 
                        (inv.recipient_phone === contact.phone || inv.recipient_email === contact.email));
        
        if (existingInvitations.length > 0) {
          results.duplicates.push({
            contactId: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            reason: 'Already invited'
          });
          continue;
        }

        const invitation = await this.createEnhancedInvitation(userId, {
          recipientPhone: contact.phone,
          recipientEmail: contact.email,
          recipientName: `${contact.first_name} ${contact.last_name}`,
          invitationType: invitationData.invitationType || contact.contact_type,
          customMessage: invitationData.customMessage
        });

        results.successful.push({
          contactId: contact.id,
          invitationId: invitation.id,
          name: `${contact.first_name} ${contact.last_name}`,
          deliveryMethod: invitation.delivery_method,
          status: 'sent'
        });

      } catch (error) {
        results.failed.push({
          contactId: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          error: error.message
        });
      }
    }

    console.log(`DEBUG: Final results:`, results);
    return results;
  }

  // Add this alias method for the controller
  async sendBulkContactInvitations(userId, contactIds, invitationData) {
    return await this.inviteContacts(userId, contactIds, invitationData);
  }

  async trackInvitationClick(referralCode, phoneNumber = null, email = null) {
    // Find invitation by referral code
    const invitation = Array.from(this.mockInvitations.values())
      .find(inv => inv.referral_code === referralCode);
    
    if (invitation) {
      invitation.status = 'clicked';
      
      // Log the action
      const logId = `log_${Date.now()}`;
      this.mockLogs.set(logId, {
        id: logId,
        invitation_id: invitation.id,
        action: 'clicked',
        metadata: {
          clicked_at: new Date().toISOString(),
          referral_code: referralCode,
          phone_number: phoneNumber,
          email: email
        },
        created_at: new Date()
      });
      
      console.log(`MOCK: Invitation click tracked for referral code: ${referralCode}`);
    }
  }

  async getInvitationAnalytics(userId, options = {}) {
    const userInvitations = Array.from(this.mockInvitations.values())
      .filter(inv => inv.inviter_id === userId);
    
    // Group by type and status
    const stats = [];
    const grouped = userInvitations.reduce((acc, inv) => {
      const key = `${inv.invitation_type}_${inv.delivery_method}_${inv.status}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    Object.entries(grouped).forEach(([key, count]) => {
      const [invitation_type, delivery_method, status] = key.split('_');
      stats.push({ invitation_type, delivery_method, status, count: count.toString() });
    });

    const totalClicks = Array.from(this.mockLogs.values())
      .filter(log => log.action === 'clicked').length;

    return {
      stats,
      totalClicks,
      period: options
    };
  }

  // ADDITIONAL METHODS FOR REGULAR INVITATION SERVICE COMPATIBILITY

  async getInvitations(userId, options = {}) {
    const userInvitations = Array.from(this.mockInvitations.values())
      .filter(inv => inv.inviter_id === userId);
    
    return {
      invitations: userInvitations,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 50,
        total: userInvitations.length,
        totalPages: Math.ceil(userInvitations.length / (options.limit || 50))
      }
    };
  }

  async getInvitation(userId, invitationId) {
    const invitation = this.mockInvitations.get(invitationId);
    return invitation && invitation.inviter_id === userId ? invitation : null;
  }

  async createInvitation(userId, invitationData) {
    // Redirect to enhanced invitation creation
    return await this.createEnhancedInvitation(userId, invitationData);
  }

  async createBulkInvitations(userId, invitations, options = {}) {
    const results = {
      batchId: `batch_${Date.now()}`,
      successful: [],
      failed: [],
      duplicates: []
    };

    for (const invitationData of invitations) {
      try {
        const invitation = await this.createEnhancedInvitation(userId, invitationData);
        results.successful.push({
          invitationId: invitation.id,
          recipientPhone: invitationData.recipientPhone,
          recipientEmail: invitationData.recipientEmail,
          status: 'sent'
        });
      } catch (error) {
        results.failed.push({
          recipientPhone: invitationData.recipientPhone,
          recipientEmail: invitationData.recipientEmail,
          error: error.message
        });
      }
    }

    return results;
  }

  async resendInvitation(userId, invitationId, options = {}) {
    const invitation = this.mockInvitations.get(invitationId);
    if (!invitation || invitation.inviter_id !== userId) {
      throw new Error('Invitation not found');
    }

    invitation.status = 'sent';
    invitation.resent_count = (invitation.resent_count || 0) + 1;
    invitation.last_resent_at = new Date();

    console.log(`MOCK: Resending invitation ${invitationId}`);
    
    return invitation;
  }

  // HELPER METHODS FOR TESTING
  clearMockData() {
    this.mockUsers.clear();
    this.mockInvitations.clear();
    this.mockContacts.clear();
    this.mockLogs.clear();
  }

  getMockData() {
    return {
      users: Array.from(this.mockUsers.entries()),
      invitations: Array.from(this.mockInvitations.entries()),
      contacts: Array.from(this.mockContacts.entries()),
      logs: Array.from(this.mockLogs.entries())
    };
  }
}

module.exports = new MockEnhancedInvitationService();