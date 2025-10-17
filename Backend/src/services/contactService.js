/**
 * Contact Service for FixRx
 * Handles contact operations, import/export, and synchronization
 */

const { dbManager } = require('../config/database');
const ContactModel = require('../models/contactModel');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class ContactService {
  /**
   * Get contacts for a user with pagination and filtering
   */
  static async getContacts(userId, options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      tags = [],
      source = null,
      favorites = null,
      sortBy = 'first_name',
      sortOrder = 'ASC'
    } = options;

    const offset = (page - 1) * limit;
    
    let whereConditions = ['user_id = $1'];
    let queryParams = [userId];
    let paramIndex = 2;

    // Search filter
    if (search) {
      whereConditions.push(`(
        LOWER(first_name) LIKE $${paramIndex} OR 
        LOWER(last_name) LIKE $${paramIndex} OR 
        LOWER(email) LIKE $${paramIndex} OR 
        phone LIKE $${paramIndex} OR
        LOWER(company) LIKE $${paramIndex}
      )`);
      queryParams.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    // Tags filter
    if (tags.length > 0) {
      whereConditions.push(`tags && $${paramIndex}`);
      queryParams.push(tags);
      paramIndex++;
    }

    // Source filter
    if (source) {
      whereConditions.push(`source = $${paramIndex}`);
      queryParams.push(source);
      paramIndex++;
    }

    // Favorites filter
    if (favorites !== null) {
      whereConditions.push(`is_favorite = $${paramIndex}`);
      queryParams.push(favorites);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Valid sort columns
    const validSortColumns = ['first_name', 'last_name', 'email', 'phone', 'company', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'first_name';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM contacts WHERE ${whereClause}`;
    const countResult = await dbManager.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get contacts
    const contactsQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        phone,
        email,
        company,
        job_title,
        source,
        is_favorite,
        tags,
        notes,
        avatar_url,
        created_at,
        updated_at,
        synced_at
      FROM contacts 
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const contactsResult = await dbManager.query(contactsQuery, queryParams);

    return {
      contacts: contactsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new contact
   */
  static async createContact(userId, contactData) {
    const validation = ContactModel.validateContact(contactData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const preparedData = ContactModel.prepareContactData(contactData, userId);
    
    const query = `
      INSERT INTO contacts (
        user_id, first_name, last_name, phone, email, company, 
        job_title, source, is_favorite, tags, notes, avatar_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      preparedData.user_id,
      preparedData.first_name,
      preparedData.last_name,
      preparedData.phone,
      preparedData.email,
      preparedData.company,
      preparedData.job_title,
      preparedData.source,
      preparedData.is_favorite,
      preparedData.tags,
      preparedData.notes,
      preparedData.avatar_url
    ];

    try {
      const result = await dbManager.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Contact with this phone or email already exists');
      }
      throw error;
    }
  }

  /**
   * Update a contact
   */
  static async updateContact(userId, contactId, updateData) {
    const validation = ContactModel.validateContact(updateData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const preparedData = ContactModel.prepareContactData(updateData, userId);
    
    const query = `
      UPDATE contacts 
      SET 
        first_name = $3,
        last_name = $4,
        phone = $5,
        email = $6,
        company = $7,
        job_title = $8,
        is_favorite = $9,
        tags = $10,
        notes = $11,
        avatar_url = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const values = [
      contactId,
      userId,
      preparedData.first_name,
      preparedData.last_name,
      preparedData.phone,
      preparedData.email,
      preparedData.company,
      preparedData.job_title,
      preparedData.is_favorite,
      preparedData.tags,
      preparedData.notes,
      preparedData.avatar_url
    ];

    const result = await dbManager.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Contact not found or access denied');
    }

    return result.rows[0];
  }

  /**
   * Delete a contact
   */
  static async deleteContact(userId, contactId) {
    const query = 'DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await dbManager.query(query, [contactId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Contact not found or access denied');
    }

    return { success: true, deletedId: contactId };
  }

  /**
   * Bulk create contacts
   */
  static async bulkCreateContacts(userId, contactsData, batchId = null) {
    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (const contactData of contactsData) {
      try {
        const contact = await this.createContact(userId, contactData);
        results.successful.push(contact);
      } catch (error) {
        if (error.message.includes('already exists')) {
          results.duplicates.push({
            contactData,
            error: error.message
          });
        } else {
          results.failed.push({
            contactData,
            error: error.message
          });
        }
      }
    }

    // Update batch if provided
    if (batchId) {
      await this.updateImportBatch(batchId, {
        processed_contacts: contactsData.length,
        successful_imports: results.successful.length,
        failed_imports: results.failed.length + results.duplicates.length,
        status: 'completed',
        completed_at: new Date()
      });
    }

    return results;
  }

  /**
   * Import contacts from CSV
   */
  static async importContactsFromCSV(userId, filePath, batchName = null) {
    const batchId = await this.createImportBatch(userId, {
      batch_name: batchName || `CSV Import ${new Date().toISOString()}`,
      import_source: 'csv'
    });

    return new Promise((resolve, reject) => {
      const contacts = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Map CSV columns to contact fields
          const contact = {
            firstName: row['First Name'] || row['firstName'] || row['first_name'],
            lastName: row['Last Name'] || row['lastName'] || row['last_name'],
            phone: row['Phone'] || row['phone'] || row['Phone Number'],
            email: row['Email'] || row['email'] || row['Email Address'],
            company: row['Company'] || row['company'] || row['Organization'],
            jobTitle: row['Job Title'] || row['jobTitle'] || row['job_title'] || row['Title'],
            source: 'imported'
          };

          // Only add if has phone or email
          if (contact.phone || contact.email) {
            contacts.push(contact);
          }
        })
        .on('end', async () => {
          try {
            // Update batch with total count
            await this.updateImportBatch(batchId, {
              total_contacts: contacts.length,
              status: 'processing'
            });

            const results = await this.bulkCreateContacts(userId, contacts, batchId);
            resolve({
              batchId,
              results,
              totalProcessed: contacts.length
            });
          } catch (error) {
            await this.updateImportBatch(batchId, {
              status: 'failed',
              error_log: [error.message]
            });
            reject(error);
          }
        })
        .on('error', async (error) => {
          await this.updateImportBatch(batchId, {
            status: 'failed',
            error_log: [error.message]
          });
          reject(error);
        });
    });
  }

  /**
   * Create import batch record
   */
  static async createImportBatch(userId, batchData) {
    const query = `
      INSERT INTO contact_import_batches (
        user_id, batch_name, import_source, status
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const values = [
      userId,
      batchData.batch_name,
      batchData.import_source,
      batchData.status || 'pending'
    ];

    const result = await dbManager.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Update import batch
   */
  static async updateImportBatch(batchId, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(updateData[key]);
      paramIndex++;
    });

    if (fields.length === 0) return;

    const query = `
      UPDATE contact_import_batches 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `;
    
    values.push(batchId);
    await dbManager.query(query, values);
  }

  /**
   * Get import batches for user
   */
  static async getImportBatches(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id,
        batch_name,
        total_contacts,
        processed_contacts,
        successful_imports,
        failed_imports,
        status,
        import_source,
        created_at,
        completed_at
      FROM contact_import_batches 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await dbManager.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Export contacts to CSV format
   */
  static async exportContactsToCSV(userId, options = {}) {
    const { contacts } = await this.getContacts(userId, { 
      ...options, 
      limit: 10000 // Large limit for export
    });

    const csvHeader = 'First Name,Last Name,Phone,Email,Company,Job Title,Tags,Notes,Created At\n';
    
    const csvRows = contacts.map(contact => {
      const row = [
        contact.first_name || '',
        contact.last_name || '',
        contact.phone || '',
        contact.email || '',
        contact.company || '',
        contact.job_title || '',
        (contact.tags || []).join(';'),
        (contact.notes || '').replace(/"/g, '""'), // Escape quotes
        contact.created_at
      ];
      
      return row.map(field => `"${field}"`).join(',');
    }).join('\n');

    return csvHeader + csvRows;
  }

  /**
   * Get contact statistics
   */
  static async getContactStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorites,
        COUNT(CASE WHEN source = 'imported' THEN 1 END) as imported,
        COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual,
        COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
        COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email
      FROM contacts 
      WHERE user_id = $1
    `;

    const result = await dbManager.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Search contacts by phone or email
   */
  static async searchContactsByIdentifier(userId, identifier) {
    const query = `
      SELECT * FROM contacts 
      WHERE user_id = $1 AND (phone = $2 OR email = $2)
      LIMIT 10
    `;

    const result = await dbManager.query(query, [userId, identifier]);
    return result.rows;
  }

  /**
   * Sync contacts (placeholder for device sync)
   */
  static async syncContacts(userId, deviceContacts) {
    // This would integrate with device contact APIs
    // For now, we'll treat it as a bulk import with sync source
    const contactsData = deviceContacts.map(contact => ({
      ...contact,
      source: 'synced'
    }));

    return await this.bulkCreateContacts(userId, contactsData);
  }
}

module.exports = ContactService;
