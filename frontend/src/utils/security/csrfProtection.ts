// CSRF Protection utilities for secure API requests
export interface CSRFTokenResponse {
  token: string;
  expiresAt: number;
}

class CSRFProtection {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly TOKEN_HEADER = 'X-CSRF-Token';
  private readonly TOKEN_META_NAME = 'csrf-token';

  /**
   * Get CSRF token from meta tag (set by backend)
   */
  private getTokenFromMeta(): string | null {
    const metaTag = document.querySelector(`meta[name="${this.TOKEN_META_NAME}"]`);
    return metaTag?.getAttribute('content') || null;
  }

  /**
   * Store CSRF token in memory
   */
  private storeToken(token: string, expiresAt: number): void {
    this.token = token;
    this.tokenExpiresAt = expiresAt;
  }

  /**
   * Check if current token is valid and not expired
   */
  private isTokenValid(): boolean {
    if (!this.token) return false;
    return Date.now() < this.tokenExpiresAt;
  }

  /**
   * Fetch CSRF token from backend
   */
  private async fetchTokenFromBackend(): Promise<string | null> {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data: CSRFTokenResponse = await response.json();
      this.storeToken(data.token, data.expiresAt);
      return data.token;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return null;
    }
  }

  /**
   * Get valid CSRF token (from cache, meta tag, or backend)
   */
  async getToken(): Promise<string | null> {
    // Check if we have a valid cached token
    if (this.isTokenValid()) {
      return this.token;
    }

    // Try to get from meta tag first (faster)
    const metaToken = this.getTokenFromMeta();
    if (metaToken) {
      // Assume meta token is valid for 1 hour
      this.storeToken(metaToken, Date.now() + 3600000);
      return metaToken;
    }

    // Fetch from backend as last resort
    return await this.fetchTokenFromBackend();
  }

  /**
   * Add CSRF token to request headers
   */
  async addTokenToHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
    const token = await this.getToken();
    if (token) {
      return {
        ...headers,
        [this.TOKEN_HEADER]: token,
      };
    }
    return headers;
  }

  /**
   * Validate CSRF token on form submission
   */
  async validateFormToken(formData: FormData): Promise<FormData> {
    const token = await this.getToken();
    if (token) {
      formData.append('_csrf', token);
    }
    return formData;
  }

  /**
   * Create CSRF-protected fetch wrapper
   */
  async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Add CSRF token to headers
    const headers = await this.addTokenToHeaders(options.headers);
    
    // Add credentials for session cookies
    const secureOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    // For POST/PUT/DELETE requests, ensure we have a token
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
      const token = await this.getToken();
      if (!token) {
        throw new Error('CSRF token not available for protected request');
      }
    }

    return fetch(url, secureOptions);
  }

  /**
   * Clear cached token (e.g., on logout)
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Initialize CSRF protection
   */
  async initialize(): Promise<void> {
    // Pre-fetch token on initialization
    await this.getToken();
  }
}

// Create singleton instance
export const csrfProtection = new CSRFProtection();

// Export class for testing
export { CSRFProtection };

// Utility function to create CSRF-protected fetch
export const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return csrfProtection.secureRequest(url, options);
};

// React hook for CSRF protection
export const useCSRFProtection = () => {
  const addCSRFToken = async (headers: HeadersInit = {}): Promise<HeadersInit> => {
    return csrfProtection.addTokenToHeaders(headers);
  };

  const validateForm = async (formData: FormData): Promise<FormData> => {
    return csrfProtection.validateFormToken(formData);
  };

  const secureRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
    return csrfProtection.secureRequest(url, options);
  };

  return {
    addCSRFToken,
    validateForm,
    secureRequest,
  };
};