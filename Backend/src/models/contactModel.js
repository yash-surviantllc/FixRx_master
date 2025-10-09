/**
 * Contact Model for FixRx
 * Handles contact data structure and validation
 */

const { dbManager } = require('../config/database');

class ContactModel {
  /**
   * Create contacts table if not exists
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        company VARCHAR(255),
        job_title VARCHAR(255),
        source VARCHAR(50) DEFAULT 'manual', -- manual, imported, synced
        is_favorite BOOLEAN DEFAULT false,
        tags TEXT[], -- Array of tags for organization
        notes TEXT,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced_at TIMESTAMP,
        
        -- Indexes for performance
        UNIQUE(user_id, phone),
        UNIQUE(user_id, email)
      );
      
      CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
      CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
      CREATE INDEX IF NOT EXISTS idx_contacts_favorite ON contacts(user_id, is_favorite);
      CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
    `;
    
    await dbManager.query(query);
  }

  /**
   * Create contact import batches table
   */
  static async createImportBatchTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS contact_import_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        batch_name VARCHAR(255),
        total_contacts INTEGER DEFAULT 0,
        processed_contacts INTEGER DEFAULT 0,
        successful_imports INTEGER DEFAULT 0,
        failed_imports INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
        import_source VARCHAR(100), -- csv, vcf, google, apple, etc.
        error_log TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_import_batches_user_id ON contact_import_batches(user_id);
      CREATE INDEX IF NOT EXISTS idx_import_batches_status ON contact_import_batches(status);
    `;
    
    await dbManager.query(query);
  }

  /**
   * Validate contact data
   */
  static validateContact(contactData) {
    const errors = [];
    
    if (!contactData.phone && !contactData.email) {
      errors.push('Contact must have either phone or email');
    }
    
    if (contactData.phone && !/^\+?[\d\s\-\(\)]+$/.test(contactData.phone)) {
      errors.push('Invalid phone number format');
    }
    
    if (contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      errors.push('Invalid email format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalize phone number
   */
  static normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // Add + if not present and number looks international
    if (!normalized.startsWith('+') && normalized.length > 10) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  /**
   * Normalize email
   */
  static normalizeEmail(email) {
    return email ? email.toLowerCase().trim() : null;
  }

  /**
   * Prepare contact data for database
   */
  static prepareContactData(contactData, userId) {
    return {
      user_id: userId,
      first_name: contactData.firstName?.trim() || null,
      last_name: contactData.lastName?.trim() || null,
      phone: this.normalizePhone(contactData.phone),
      email: this.normalizeEmail(contactData.email),
      company: contactData.company?.trim() || null,
      job_title: contactData.jobTitle?.trim() || null,
      source: contactData.source || 'manual',
      is_favorite: contactData.isFavorite || false,
      tags: contactData.tags || [],
      notes: contactData.notes?.trim() || null,
      avatar_url: contactData.avatarUrl || null
    };
  }
}

module.exports = ContactModel;
