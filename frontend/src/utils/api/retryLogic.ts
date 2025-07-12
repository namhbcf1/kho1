// API retry logic for Cloudflare Workers
import { ApiError, isRetryableError, getRetryDelay } from './errorHandler';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: ApiError) => boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: isRetryableError,
};

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig };
    let lastError: ApiError;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on last attempt
        if (attempt === config.maxAttempts - 1) {
          break;
        }

        // Check if error is retryable
        if (config.retryCondition && !config.retryCondition(error)) {
          break;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, config);
        
        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
    
    // Apply max delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter if enabled
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // ±10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay += jitter;
    }
    
    return Math.round(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default retry manager instance
export const retryManager = new RetryManager();

// Convenience function for simple retries
export const withRetry = <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> => {
  return retryManager.executeWithRetry(operation, config);
};

// Specialized retry configurations
export const RETRY_CONFIGS = {
  // For critical operations that must succeed
  CRITICAL: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffFactor: 2,
  },

  // For user-initiated actions
  USER_ACTION: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  },

  // For background operations
  BACKGROUND: {
    maxAttempts: 10,
    baseDelay: 5000,
    maxDelay: 300000, // 5 minutes
    backoffFactor: 1.5,
  },

  // For real-time operations (minimal retry)
  REALTIME: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2,
  },

  // For file uploads
  UPLOAD: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryCondition: (error: ApiError) => {
      // Retry on network errors and server errors, but not on client errors
      return error.status === undefined || error.status >= 500 || error.status === 0;
    },
  },

  // For payment operations
  PAYMENT: {
    maxAttempts: 2, // Be conservative with payments
    baseDelay: 3000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error: ApiError) => {
      // Only retry on network errors, not on payment-specific errors
      return error.code === 'NETWORK_ERROR' || error.code === 'NETWORK_OFFLINE';
    },
  },
};

// Retry with specific configurations
export const withCriticalRetry = <T>(operation: () => Promise<T>): Promise<T> => {
  return withRetry(operation, RETRY_CONFIGS.CRITICAL);
};

export const withUserActionRetry = <T>(operation: () => Promise<T>): Promise<T> => {
  return withRetry(operation, RETRY_CONFIGS.USER_ACTION);
};

export const withBackgroundRetry = <T>(operation: () => Promise<T>): Promise<T> => {
  return withRetry(operation, RETRY_CONFIGS.BACKGROUND);
};

export const withRealtimeRetry = <T>(operation: () => Promise<T>): Promise<T> => {
  return withRetry(operation, RETRY_CONFIGS.REALTIME);
};

export const withUploadRetry = <T>(operation: () => Promise<T>): Promise<T> => {
  return withRetry(operation, RETRY_CONFIGS.UPLOAD);
};

export const withPaymentRetry = <T>(operation: () => Promise<T>): Promise<T> => {
  return withRetry(operation, RETRY_CONFIGS.PAYMENT);
};

// Circuit breaker pattern for repeated failures
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  public getState(): string {
    return this.state;
  }

  public reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// Global circuit breaker for API calls
export const apiCircuitBreaker = new CircuitBreaker(5, 60000);

// Wrapper function with circuit breaker
export const withCircuitBreaker = <T>(operation: () => Promise<T>): Promise<T> => {
  return apiCircuitBreaker.execute(operation);
};
