/**
 * Contact Controller for FixRx
 * Handles contact management API endpoints
 */

const ContactService = require('../services/contactService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/contacts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `contacts-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.vcf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, VCF, and TXT files are allowed'));
    }
  }
});

class ContactController {
  /**
   * Get contacts with pagination and filtering
   * GET /api/v1/contacts
   */
  static async getContacts(req, res) {
    try {
      const userId = req.user.userId;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 50, 100),
        search: req.query.search || '',
        tags: req.query.tags ? req.query.tags.split(',') : [],
        source: req.query.source || null,
        favorites: req.query.favorites === 'true' ? true : req.query.favorites === 'false' ? false : null,
        sortBy: req.query.sortBy || 'first_name',
        sortOrder: req.query.sortOrder || 'ASC'
      };

      const result = await ContactService.getContacts(userId, options);

      res.json({
        success: true,
        data: result.contacts,
        pagination: result.pagination,
        message: `Retrieved ${result.contacts.length} contacts`
      });
    } catch (error) {
      console.error('Get contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contacts',
        error: error.message
      });
    }
  }

  /**
   * Get single contact by ID
   * GET /api/v1/contacts/:id
   */
  static async getContact(req, res) {
    try {
      const userId = req.user.userId;
      const contactId = req.params.id;

      const result = await ContactService.getContacts(userId, {
        page: 1,
        limit: 1
      });

      const contact = result.contacts.find(c => c.id === contactId);
      
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      res.json({
        success: true,
        data: contact,
        message: 'Contact retrieved successfully'
      });
    } catch (error) {
      console.error('Get contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contact',
        error: error.message
      });
    }
  }

  /**
   * Create new contact
   * POST /api/v1/contacts
   */
  static async createContact(req, res) {
    try {
      const userId = req.user.userId;
      const contactData = req.body;

      const contact = await ContactService.createContact(userId, contactData);

      res.status(201).json({
        success: true,
        data: contact,
        message: 'Contact created successfully'
      });
    } catch (error) {
      console.error('Create contact error:', error);
      
      if (error.message.includes('Validation failed') || error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create contact',
        error: error.message
      });
    }
  }

  /**
   * Update contact
   * PUT /api/v1/contacts/:id
   */
  static async updateContact(req, res) {
    try {
      const userId = req.user.userId;
      const contactId = req.params.id;
      const updateData = req.body;

      const contact = await ContactService.updateContact(userId, contactId, updateData);

      res.json({
        success: true,
        data: contact,
        message: 'Contact updated successfully'
      });
    } catch (error) {
      console.error('Update contact error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update contact',
        error: error.message
      });
    }
  }

  /**
   * Delete contact
   * DELETE /api/v1/contacts/:id
   */
  static async deleteContact(req, res) {
    try {
      const userId = req.user.userId;
      const contactId = req.params.id;

      const result = await ContactService.deleteContact(userId, contactId);

      res.json({
        success: true,
        data: result,
        message: 'Contact deleted successfully'
      });
    } catch (error) {
      console.error('Delete contact error:', error);
      
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete contact',
        error: error.message
      });
    }
  }

  /**
   * Bulk create contacts
   * POST /api/v1/contacts/bulk
   */
  static async bulkCreateContacts(req, res) {
    try {
      const userId = req.user.userId;
      const { contacts, batchName } = req.body;

      if (!Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Contacts array is required and must not be empty'
        });
      }

      if (contacts.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 1000 contacts allowed per batch'
        });
      }

      const results = await ContactService.bulkCreateContacts(userId, contacts);

      res.json({
        success: true,
        data: {
          successful: results.successful.length,
          failed: results.failed.length,
          duplicates: results.duplicates.length,
          details: results
        },
        message: `Bulk operation completed: ${results.successful.length} created, ${results.failed.length} failed, ${results.duplicates.length} duplicates`
      });
    } catch (error) {
      console.error('Bulk create contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create contacts in bulk',
        error: error.message
      });
    }
  }

  /**
   * Import contacts from file
   * POST /api/v1/contacts/import
   */
  static async importContacts(req, res) {
    const uploadSingle = upload.single('contactFile');
    
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      try {
        const userId = req.user.userId;
        const filePath = req.file.path;
        const batchName = req.body.batchName || `Import ${new Date().toISOString()}`;

        let results;
        
        if (path.extname(req.file.originalname).toLowerCase() === '.csv') {
          results = await ContactService.importContactsFromCSV(userId, filePath, batchName);
        } else {
          throw new Error('Unsupported file format. Only CSV is currently supported.');
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
          success: true,
          data: {
            batchId: results.batchId,
            totalProcessed: results.totalProcessed,
            successful: results.results.successful.length,
            failed: results.results.failed.length,
            duplicates: results.results.duplicates.length
          },
          message: `Import completed: ${results.results.successful.length} contacts imported successfully`
        });
      } catch (error) {
        console.error('Import contacts error:', error);
        
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
          success: false,
          message: 'Failed to import contacts',
          error: error.message
        });
      }
    });
  }

  /**
   * Export contacts to CSV
   * GET /api/v1/contacts/export
   */
  static async exportContacts(req, res) {
    try {
      const userId = req.user.userId;
      const options = {
        search: req.query.search || '',
        tags: req.query.tags ? req.query.tags.split(',') : [],
        source: req.query.source || null,
        favorites: req.query.favorites === 'true' ? true : req.query.favorites === 'false' ? false : null
      };

      const csvData = await ContactService.exportContactsToCSV(userId, options);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="contacts-${Date.now()}.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error('Export contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export contacts',
        error: error.message
      });
    }
  }

  /**
   * Get import batches
   * GET /api/v1/contacts/import-batches
   */
  static async getImportBatches(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);

      const batches = await ContactService.getImportBatches(userId, page, limit);

      res.json({
        success: true,
        data: batches,
        message: `Retrieved ${batches.length} import batches`
      });
    } catch (error) {
      console.error('Get import batches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve import batches',
        error: error.message
      });
    }
  }

  /**
   * Get contact statistics
   * GET /api/v1/contacts/stats
   */
  static async getContactStats(req, res) {
    try {
      const userId = req.user.userId;
      const stats = await ContactService.getContactStats(userId);

      res.json({
        success: true,
        data: stats,
        message: 'Contact statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Get contact stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contact statistics',
        error: error.message
      });
    }
  }

  /**
   * Search contacts by phone or email
   * GET /api/v1/contacts/search/:identifier
   */
  static async searchByIdentifier(req, res) {
    try {
      const userId = req.user.userId;
      const identifier = req.params.identifier;

      const contacts = await ContactService.searchContactsByIdentifier(userId, identifier);

      res.json({
        success: true,
        data: contacts,
        message: `Found ${contacts.length} contacts matching identifier`
      });
    } catch (error) {
      console.error('Search contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search contacts',
        error: error.message
      });
    }
  }

  /**
   * Sync contacts from device
   * POST /api/v1/contacts/sync
   */
  static async syncContacts(req, res) {
    try {
      const userId = req.user.userId;
      const { deviceContacts } = req.body;

      if (!Array.isArray(deviceContacts)) {
        return res.status(400).json({
          success: false,
          message: 'Device contacts array is required'
        });
      }

      if (deviceContacts.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 5000 contacts allowed per sync'
        });
      }

      const results = await ContactService.syncContacts(userId, deviceContacts);

      res.json({
        success: true,
        data: {
          successful: results.successful.length,
          failed: results.failed.length,
          duplicates: results.duplicates.length,
          details: results
        },
        message: `Sync completed: ${results.successful.length} contacts synced successfully`
      });
    } catch (error) {
      console.error('Sync contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync contacts',
        error: error.message
      });
    }
  }
}

module.exports = ContactController;
