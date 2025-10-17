import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization utilities for user inputs to prevent XSS attacks
 */

/**
 * Sanitize text input by removing all HTML tags and scripts
 * @param input - The string to sanitize
 * @returns Sanitized string safe for storage and display
 */
export const sanitizeText = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove all HTML tags and potentially malicious content
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
  
  // Additional cleaning: remove extra whitespace and control characters
  return sanitized
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Sanitize HTML content (for rich text fields)
 * @param input - The HTML string to sanitize
 * @returns Sanitized HTML safe for display
 */
export const sanitizeHtml = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Allow only safe HTML tags and attributes
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize email address
 * @param email - Email to sanitize
 * @returns Sanitized email in lowercase
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return sanitizeText(email).toLowerCase();
};

/**
 * Sanitize phone number (remove all non-digit characters except +)
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export const sanitizePhone = (phone: string | null | undefined): string => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Keep only digits, plus sign, parentheses, dashes, and spaces
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
};

/**
 * Sanitize URL
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const sanitized = sanitizeText(url);
  
  // Check if it's a valid URL format
  try {
    const urlObj = new URL(sanitized);
    // Only allow http and https protocols
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlObj.toString();
    }
  } catch {
    // Invalid URL format
  }
  
  return '';
};

/**
 * Sanitize business name or similar fields
 * @param name - Name to sanitize
 * @returns Sanitized name
 */
export const sanitizeName = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  const sanitized = sanitizeText(name);
  
  // Remove excessive length (business names shouldn't be too long)
  return sanitized.slice(0, 100);
};

/**
 * Sanitize numeric string input
 * @param input - Numeric string input
 * @returns Sanitized numeric string
 */
export const sanitizeNumeric = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Keep only digits, decimal point, and minus sign
  return input.replace(/[^\d.-]/g, '');
};

/**
 * Sanitize object with multiple string fields
 * @param obj - Object to sanitize
 * @param textFields - Array of field names to sanitize as text
 * @param emailFields - Array of field names to sanitize as email
 * @param urlFields - Array of field names to sanitize as URL
 * @returns Sanitized object
 */
export const sanitizeObject = (
  obj: any,
  options: {
    textFields?: string[];
    emailFields?: string[];
    urlFields?: string[];
    nameFields?: string[];
    phoneFields?: string[];
  } = {}
): any => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  const sanitized = { ...obj };
  
  // Sanitize text fields
  options.textFields?.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeText(sanitized[field]);
    }
  });
  
  // Sanitize email fields
  options.emailFields?.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeEmail(sanitized[field]);
    }
  });
  
  // Sanitize URL fields
  options.urlFields?.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeUrl(sanitized[field]);
    }
  });
  
  // Sanitize name fields
  options.nameFields?.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizeName(sanitized[field]);
    }
  });
  
  // Sanitize phone fields
  options.phoneFields?.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitizePhone(sanitized[field]);
    }
  });
  
  return sanitized;
};
