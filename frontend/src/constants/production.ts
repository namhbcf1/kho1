// Production environment validation and constants
// Validate required environment variables at startup
const requiredEnvVars = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
} as const;

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env file and ensure all required variables are set.'
  );
}

// Validate API URL format
try {
  new URL(requiredEnvVars.VITE_API_BASE_URL);
} catch (error) {
  throw new Error(`Invalid VITE_API_BASE_URL format: ${requiredEnvVars.VITE_API_BASE_URL}`);
}

// Production constants
export const PRODUCTION_CONFIG = {
  API_BASE_URL: requiredEnvVars.VITE_API_BASE_URL,
  APP_NAME: requiredEnvVars.VITE_APP_NAME,
  
  // Cloudflare Workers limits
  REQUEST_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 120000, // 2 minutes
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 100,
    BURST_LIMIT: 20,
  },
  
  // Vietnamese business constants
  VIETNAM: {
    VAT_RATE: 0.1, // 10% VAT
    CURRENCY: 'VND',
    LOCALE: 'vi-VN',
    TIMEZONE: 'Asia/Ho_Chi_Minh',
  },
  
  // Security
  SECURITY: {
    JWT_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  },
  
  // Performance
  PERFORMANCE: {
    SLOW_REQUEST_THRESHOLD: 5000, // 5 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },
} as const;

// Validate production configuration
export const validateProductionConfig = (): void => {
  // Check if running in production
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // Production-specific validations
    if (PRODUCTION_CONFIG.API_BASE_URL.includes('localhost')) {
      throw new Error('Production build cannot use localhost API URL');
    }
    
    if (PRODUCTION_CONFIG.API_BASE_URL.startsWith('http://')) {
      console.warn('Warning: Using HTTP in production. HTTPS is recommended.');
    }
  }
  
  // Validate numeric constants
  if (PRODUCTION_CONFIG.REQUEST_TIMEOUT <= 0) {
    throw new Error('REQUEST_TIMEOUT must be positive');
  }
  
  if (PRODUCTION_CONFIG.VIETNAM.VAT_RATE < 0 || PRODUCTION_CONFIG.VIETNAM.VAT_RATE > 1) {
    throw new Error('VAT_RATE must be between 0 and 1');
  }
};

// Run validation on import
validateProductionConfig();
