/**
 * Contact Service for FixRx Mobile
 * Handles contact management API calls with offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  source: 'manual' | 'imported' | 'synced' | 'invitation';
  isFavorite: boolean;
  tags: string[];
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  source?: string;
  favorites?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ContactStats {
  totalContacts: number;
  favorites: number;
  imported: number;
  manual: number;
  withPhone: number;
  withEmail: number;
}

export interface ImportBatch {
  id: string;
  batchName: string;
  totalContacts: number;
  processedContacts: number;
  successfulImports: number;
  failedImports: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  importSource: string;
  createdAt: string;
  completedAt?: string;
}

class ContactService {
  private static readonly CACHE_KEY = 'contacts_cache';
  private static readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Get contacts with caching support
   */
  static async getContacts(filters: ContactFilters = {}): Promise<ApiResponse<{
    contacts: Contact[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    try {
      // Check cache first for first page without filters
      if (!filters.page && !filters.search && !filters.tags?.length) {
        const cached = await this.getCachedContacts();
        if (cached) {
          return {
            success: true,
            data: cached,
            message: 'Contacts retrieved from cache'
          };
        }
      }

      const response = await apiClient.get<{
        contacts: Contact[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>('/contacts', { params: filters });
      
      // Cache first page results
      if (!filters.page || filters.page === 1) {
        await this.cacheContacts(response.data);
      }

      return response;
    } catch (error) {
      console.error('Get contacts error:', error);
      
      // Return cached data if available during offline
      const cached = await this.getCachedContacts();
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Contacts retrieved from cache (offline)'
        };
      }

      throw error;
    }
  }

  /**
   * Create a new contact
   */
  static async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Contact>> {
    try {
      const response = await apiClient.post('/contacts', contactData);
      
      // Update cache
      await this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Create contact error:', error);
      
      // Store for offline sync
      await this.storeOfflineAction('create', contactData);
      
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  static async updateContact(contactId: string, contactData: Partial<Contact>): Promise<ApiResponse<Contact>> {
    try {
      const response = await apiClient.put(`/contacts/${contactId}`, contactData);
      
      // Update cache
      await this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Update contact error:', error);
      
      // Store for offline sync
      await this.storeOfflineAction('update', { id: contactId, ...contactData });
      
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  static async deleteContact(contactId: string): Promise<ApiResponse<{ success: boolean; deletedId: string }>> {
    try {
      const response = await apiClient.delete(`/contacts/${contactId}`);
      
      // Update cache
      await this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Delete contact error:', error);
      
      // Store for offline sync
      await this.storeOfflineAction('delete', { id: contactId });
      
      throw error;
    }
  }

  /**
   * Search contacts by identifier (phone or email)
   */
  static async searchContactsByIdentifier(identifier: string): Promise<ApiResponse<Contact[]>> {
    try {
      return await apiClient.get(`/contacts/search/${encodeURIComponent(identifier)}`);
    } catch (error) {
      console.error('Search contacts error:', error);
      throw error;
    }
  }

  /**
   * Get contact statistics
   */
  static async getContactStats(): Promise<ApiResponse<ContactStats>> {
    try {
      return await apiClient.get('/contacts/stats');
    } catch (error) {
      console.error('Get contact stats error:', error);
      throw error;
    }
  }

  /**
   * Bulk create contacts
   */
  static async bulkCreateContacts(
    contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[],
    batchName?: string
  ): Promise<ApiResponse<{
    successful: number;
    failed: number;
    duplicates: number;
    details: any;
  }>> {
    try {
      const response = await apiClient.post('/contacts/bulk', {
        contacts,
        batchName
      });
      
      // Update cache
      await this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Bulk create contacts error:', error);
      throw error;
    }
  }

  /**
   * Sync device contacts
   */
  static async syncDeviceContacts(deviceContacts: any[]): Promise<ApiResponse<{
    successful: number;
    failed: number;
    duplicates: number;
    details: any;
  }>> {
    try {
      const response = await apiClient.post('/contacts/sync', {
        deviceContacts
      });
      
      // Update cache
      await this.invalidateCache();
      
      return response;
    } catch (error) {
      console.error('Sync device contacts error:', error);
      
      // Store for offline sync
      await this.storeOfflineAction('sync', { deviceContacts });
      
      throw error;
    }
  }

  /**
   * Export contacts
   */
  static async exportContacts(filters: ContactFilters = {}): Promise<string> {
    try {
      const response = await apiClient.get('/contacts/export', {
        params: filters,
        responseType: 'text'
      });
      
      return response.data;
    } catch (error) {
      console.error('Export contacts error:', error);
      throw error;
    }
  }

  /**
   * Get import batches
   */
  static async getImportBatches(page = 1, limit = 20): Promise<ApiResponse<ImportBatch[]>> {
    try {
      return await apiClient.get('/contacts/import-batches', {
        params: { page, limit }
      });
    } catch (error) {
      console.error('Get import batches error:', error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  private static async getCachedContacts() {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.CACHE_EXPIRY) {
        await AsyncStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get cached contacts error:', error);
      return null;
    }
  }

  private static async cacheContacts(data: any) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache contacts error:', error);
    }
  }

  private static async invalidateCache() {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Invalidate cache error:', error);
    }
  }

  /**
   * Offline support
   */
  private static async storeOfflineAction(action: string, data: any) {
    try {
      const offlineActions = await this.getOfflineActions();
      const newAction = {
        id: Date.now().toString(),
        action,
        data,
        timestamp: Date.now()
      };
      
      offlineActions.push(newAction);
      await AsyncStorage.setItem('offline_contact_actions', JSON.stringify(offlineActions));
    } catch (error) {
      console.error('Store offline action error:', error);
    }
  }

  private static async getOfflineActions(): Promise<any[]> {
    try {
      const actions = await AsyncStorage.getItem('offline_contact_actions');
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Get offline actions error:', error);
      return [];
    }
  }

  /**
   * Sync offline actions when back online
   */
  static async syncOfflineActions(): Promise<void> {
    try {
      const offlineActions = await this.getOfflineActions();
      
      if (offlineActions.length === 0) return;

      console.log(`Syncing ${offlineActions.length} offline contact actions...`);

      for (const action of offlineActions) {
        try {
          switch (action.action) {
            case 'create':
              await this.createContact(action.data);
              break;
            case 'update':
              const { id, ...updateData } = action.data;
              await this.updateContact(id, updateData);
              break;
            case 'delete':
              await this.deleteContact(action.data.id);
              break;
            case 'sync':
              await this.syncDeviceContacts(action.data.deviceContacts);
              break;
          }
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      // Clear offline actions after successful sync
      await AsyncStorage.removeItem('offline_contact_actions');
      console.log('Offline contact actions synced successfully');
    } catch (error) {
      console.error('Sync offline actions error:', error);
    }
  }

  /**
   * Device contact integration helpers
   */
  static normalizeDeviceContact(deviceContact: any): Partial<Contact> {
    return {
      firstName: deviceContact.firstName || deviceContact.givenName || '',
      lastName: deviceContact.lastName || deviceContact.familyName || '',
      phone: deviceContact.phoneNumbers?.[0]?.number || deviceContact.phone,
      email: deviceContact.emails?.[0]?.email || deviceContact.email,
      company: deviceContact.company || deviceContact.organization,
      source: 'synced',
      isFavorite: false,
      tags: ['device-sync'],
      notes: 'Imported from device contacts'
    };
  }

  /**
   * Validation helpers
   */
  static validateContact(contact: Partial<Contact>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contact.phone && !contact.email) {
      errors.push('Contact must have either phone or email');
    }

    if (contact.phone && !this.isValidPhoneNumber(contact.phone)) {
      errors.push('Invalid phone number format');
    }

    if (contact.email && !this.isValidEmail(contact.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidPhoneNumber(phone: string): boolean {
    // Basic E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format helpers
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Add + if not present and looks international
    if (!cleaned.startsWith('+') && cleaned.length > 10) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  static formatEmail(email: string): string {
    return email.toLowerCase().trim();
  }
}

export default ContactService;
