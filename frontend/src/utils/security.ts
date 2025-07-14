import DOMPurify from 'dompurify';

// XSS Prevention utilities for React components
export class SecurityUtils {
  
  /**
   * Sanitize HTML content to prevent XSS attacks
   * Uses DOMPurify for comprehensive XSS protection
   */
  static sanitizeHTML(dirty: string): string {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u', 'span', 'div', 'p', 'br',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ],
      ALLOWED_ATTR: ['class', 'style'],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true,
      USE_PROFILES: { html: true }
    });
  }

  /**
   * Sanitize text content to prevent XSS
   * Escapes HTML entities and removes dangerous characters
   */
  static sanitizeText(text: any): string {
    if (text === null || text === undefined) {
      return '';
    }

    const str = String(text);
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/`/g, '&#96;')
      .replace(/=/g, '&#61;');
  }

  /**
   * Validate and sanitize user input for display
   */
  static sanitizeUserInput(input: any): string {
    if (!input) return '';
    
    const text = String(input).trim();
    
    // Remove potential script injections
    const cleaned = text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/url\s*\(/gi, '')
      .replace(/vbscript:/gi, '');
    
    return this.sanitizeText(cleaned);
  }

  /**
   * Sanitize URL to prevent XSS through href attributes
   */
  static sanitizeURL(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('file:') ||
      trimmed.includes('<%') ||
      trimmed.includes('%3c')
    ) {
      return '';
    }

    // Allow only safe protocols
    if (trimmed.startsWith('http://') || 
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('/')) {
      return url.trim();
    }

    return '';
  }

  /**
   * Sanitize CSS values to prevent CSS injection
   */
  static sanitizeCSS(css: string): string {
    if (!css || typeof css !== 'string') {
      return '';
    }

    return css
      .replace(/expression\s*\(/gi, '')
      .replace(/javascript:/gi, '')
      .replace/url\s*\(/gi, '')
      .replace(/@import/gi, '')
      .replace(/behavior\s*:/gi, '')
      .replace(/-moz-binding/gi, '')
      .replace(/position\s*:\s*fixed/gi, '');
  }

  /**
   * Validate file names to prevent path traversal
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return '';
    }

    return fileName
      .replace(/[<>:"/\\|?*]/g, '') // Remove dangerous characters
      .replace(/\.\./g, '') // Remove path traversal
      .replace(/^\.+/, '') // Remove leading dots
      .trim()
      .substring(0, 255); // Limit length
  }

  /**
   * Validate and sanitize numeric input
   */
  static sanitizeNumber(value: any, min?: number, max?: number): number {
    const num = parseFloat(String(value));
    
    if (isNaN(num) || !isFinite(num)) {
      return 0;
    }

    let result = num;
    
    if (min !== undefined && result < min) {
      result = min;
    }
    
    if (max !== undefined && result > max) {
      result = max;
    }

    return result;
  }

  /**
   * Validate and sanitize integer input
   */
  static sanitizeInteger(value: any, min?: number, max?: number): number {
    const int = parseInt(String(value), 10);
    
    if (isNaN(int) || !isFinite(int)) {
      return 0;
    }

    let result = int;
    
    if (min !== undefined && result < min) {
      result = min;
    }
    
    if (max !== undefined && result > max) {
      result = max;
    }

    return result;
  }

  /**
   * Sanitize object properties recursively
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }

    const sanitized = { ...obj };

    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];
      
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeText(value);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'string' ? this.sanitizeText(item) : 
            typeof item === 'object' ? this.sanitizeObject(item) : item
          );
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
    });

    return sanitized;
  }

  /**
   * Create a safe innerHTML prop for React
   */
  static createSafeHTML(html: string): { __html: string } {
    return {
      __html: this.sanitizeHTML(html)
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate phone number format (Vietnamese)
   */
  static isValidVietnamesePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    const phoneRegex = /^(\+84|84|0)?([3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data for logging
   */
  static hashForLogging(data: string): string {
    if (!data) return '';
    
    const visible = data.length > 4 ? data.slice(0, 2) + '***' + data.slice(-2) : '***';
    return visible;
  }

  /**
   * Validate and sanitize Vietnamese business tax code
   */
  static sanitizeVietnameseTaxCode(taxCode: string): string {
    if (!taxCode || typeof taxCode !== 'string') {
      return '';
    }

    // Remove non-numeric characters
    const cleaned = taxCode.replace(/\D/g, '');
    
    // Vietnamese tax codes are 10 or 13 digits
    if (cleaned.length === 10 || cleaned.length === 13) {
      return cleaned;
    }

    return '';
  }

  /**
   * Sanitize Vietnamese currency input
   */
  static sanitizeVietnameseCurrency(amount: any): number {
    if (typeof amount === 'number') {
      return Math.max(0, Math.round(amount));
    }

    if (typeof amount === 'string') {
      // Remove Vietnamese currency symbols and separators
      const cleaned = amount
        .replace(/[₫\s]/g, '') // Remove VND symbol and spaces
        .replace(/\./g, '') // Remove thousand separators
        .replace(/,/g, '.'); // Convert comma to decimal point

      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : Math.max(0, Math.round(num));
    }

    return 0;
  }

  /**
   * Format Vietnamese currency safely
   */
  static formatVietnameseCurrency(amount: number): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0₫';
    }

    const sanitized = Math.max(0, Math.round(amount));
    return sanitized.toLocaleString('vi-VN') + '₫';
  }

  /**
   * Validate CSRF token format
   */
  static isValidCSRFToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // CSRF tokens should be UUID format or similar secure format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const hexRegex = /^[0-9a-f]{32,64}$/i;
    
    return uuidRegex.test(token) || hexRegex.test(token);
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    return query
      .trim()
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\\/g, '') // Remove backslashes
      .substring(0, 255); // Limit length
  }

  /**
   * Check if content contains potential XSS
   */
  static containsPotentialXSS(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Sanitize form data
   */
  static sanitizeFormData(formData: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.keys(formData).forEach(key => {
      const value = formData[key];
      const sanitizedKey = this.sanitizeText(key);

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeUserInput(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = this.sanitizeNumber(value);
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = value.map(item => 
          typeof item === 'string' ? this.sanitizeUserInput(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    });

    return sanitized;
  }
}

// Export default functions for easier import
export const {
  sanitizeHTML,
  sanitizeText,
  sanitizeUserInput,
  sanitizeURL,
  sanitizeObject,
  createSafeHTML,
  isValidEmail,
  generateSecureToken,
  sanitizeFormData
} = SecurityUtils;

// React hook for sanitizing data
export function useSanitize() {
  return {
    sanitizeText: SecurityUtils.sanitizeText,
    sanitizeHTML: SecurityUtils.sanitizeHTML,
    sanitizeUserInput: SecurityUtils.sanitizeUserInput,
    sanitizeObject: SecurityUtils.sanitizeObject,
    sanitizeFormData: SecurityUtils.sanitizeFormData
  };
}

export default SecurityUtils;