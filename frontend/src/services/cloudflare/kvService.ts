// KV Store service for Cloudflare Workers integration
import { apiClient } from '../api/client';
import type { ApiResponse } from '../api/types';

export interface KVPutOptions {
  expirationTtl?: number; // seconds
  expiration?: number; // Unix timestamp
  metadata?: any;
}

export interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface KVKey {
  name: string;
  expiration?: number;
  metadata?: any;
}

export interface KVListResult {
  keys: KVKey[];
  list_complete: boolean;
  cursor?: string;
}

class KVService {
  private readonly baseUrl = '/api/kv';

  /**
   * Get value from KV store
   */
  async get<T = any>(
    key: string,
    type: 'text' | 'json' | 'arrayBuffer' | 'stream' = 'json'
  ): Promise<T | null> {
    try {
      const response = await apiClient.get<ApiResponse<T>>(
        `${this.baseUrl}/keys/${encodeURIComponent(key)}?type=${type}`
      );

      if (!response.success) {
        if (response.message?.includes('not found')) {
          return null;
        }
        throw new Error(response.message || 'Failed to get value');
      }

      return response.data!;
    } catch (error) {
      console.error('KV get error:', error);
      throw error;
    }
  }

  /**
   * Get value with metadata
   */
  async getWithMetadata<T = any>(
    key: string,
    type: 'text' | 'json' | 'arrayBuffer' | 'stream' = 'json'
  ): Promise<{ value: T | null; metadata: any | null }> {
    try {
      const response = await apiClient.get<ApiResponse<{ value: T; metadata: any }>>(
        `${this.baseUrl}/keys/${encodeURIComponent(key)}/with-metadata?type=${type}`
      );

      if (!response.success) {
        if (response.message?.includes('not found')) {
          return { value: null, metadata: null };
        }
        throw new Error(response.message || 'Failed to get value with metadata');
      }

      return response.data!;
    } catch (error) {
      console.error('KV get with metadata error:', error);
      throw error;
    }
  }

  /**
   * Put value into KV store
   */
  async put<T = any>(
    key: string,
    value: T,
    options: KVPutOptions = {}
  ): Promise<boolean> {
    try {
      const response = await apiClient.put<ApiResponse>(
        `${this.baseUrl}/keys/${encodeURIComponent(key)}`,
        {
          value,
          options,
        }
      );

      return response.success;
    } catch (error) {
      console.error('KV put error:', error);
      throw error;
    }
  }

  /**
   * Delete key from KV store
   */
  async delete(key: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `${this.baseUrl}/keys/${encodeURIComponent(key)}`
      );

      return response.success;
    } catch (error) {
      console.error('KV delete error:', error);
      throw error;
    }
  }

  /**
   * List keys in KV store
   */
  async list(options: KVListOptions = {}): Promise<KVListResult> {
    try {
      const params = new URLSearchParams();
      
      if (options.prefix) params.append('prefix', options.prefix);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.cursor) params.append('cursor', options.cursor);

      const response = await apiClient.get<ApiResponse<KVListResult>>(
        `${this.baseUrl}/keys?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to list keys');
      }

      return response.data!;
    } catch (error) {
      console.error('KV list error:', error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.get(key, 'text');
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async getMultiple<T = any>(
    keys: string[],
    type: 'text' | 'json' | 'arrayBuffer' | 'stream' = 'json'
  ): Promise<Record<string, T | null>> {
    try {
      const response = await apiClient.post<ApiResponse<Record<string, T | null>>>(
        `${this.baseUrl}/keys/batch`,
        {
          keys,
          type,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get multiple keys');
      }

      return response.data!;
    } catch (error) {
      console.error('KV get multiple error:', error);
      throw error;
    }
  }

  /**
   * Put multiple key-value pairs
   */
  async putMultiple<T = any>(
    entries: Array<{ key: string; value: T; options?: KVPutOptions }>
  ): Promise<{ success: string[]; errors: string[] }> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: string[]; errors: string[] }>>(
        `${this.baseUrl}/keys/batch-put`,
        { entries }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to put multiple keys');
      }

      return response.data!;
    } catch (error) {
      console.error('KV put multiple error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMultiple(keys: string[]): Promise<{ deleted: string[]; errors: string[] }> {
    try {
      const response = await apiClient.post<ApiResponse<{ deleted: string[]; errors: string[] }>>(
        `${this.baseUrl}/keys/batch-delete`,
        { keys }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete multiple keys');
      }

      return response.data!;
    } catch (error) {
      console.error('KV delete multiple error:', error);
      throw error;
    }
  }

  // Convenience methods for common patterns

  /**
   * Cache with TTL
   */
  async cache<T = any>(
    key: string,
    value: T,
    ttlSeconds = 3600
  ): Promise<boolean> {
    return this.put(key, value, { expirationTtl: ttlSeconds });
  }

  /**
   * Get cached value or compute and cache
   */
  async getOrSet<T = any>(
    key: string,
    computeFn: () => Promise<T> | T,
    ttlSeconds = 3600
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null) {
      value = await computeFn();
      await this.cache(key, value, ttlSeconds);
    }
    
    return value;
  }

  /**
   * Increment counter
   */
  async increment(key: string, delta = 1): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<{ value: number }>>(
        `${this.baseUrl}/keys/${encodeURIComponent(key)}/increment`,
        { delta }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to increment');
      }

      return response.data!.value;
    } catch (error) {
      console.error('KV increment error:', error);
      throw error;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, delta = 1): Promise<number> {
    return this.increment(key, -delta);
  }

  /**
   * Set with expiration timestamp
   */
  async setWithExpiration<T = any>(
    key: string,
    value: T,
    expirationTimestamp: number
  ): Promise<boolean> {
    return this.put(key, value, { expiration: expirationTimestamp });
  }

  /**
   * Get namespace usage statistics
   */
  async getUsageStats(): Promise<{
    totalKeys: number;
    totalSize: number;
    namespace: string;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        totalKeys: number;
        totalSize: number;
        namespace: string;
      }>>(
        `${this.baseUrl}/usage`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get usage stats');
      }

      return response.data!;
    } catch (error) {
      console.error('KV get usage stats error:', error);
      throw error;
    }
  }

  /**
   * Clear all keys with prefix
   */
  async clearPrefix(prefix: string): Promise<number> {
    try {
      const response = await apiClient.delete<ApiResponse<{ deletedCount: number }>>(
        `${this.baseUrl}/keys/prefix/${encodeURIComponent(prefix)}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to clear prefix');
      }

      return response.data!.deletedCount;
    } catch (error) {
      console.error('KV clear prefix error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const kvService = new KVService();

// Export class for custom instances
export { KVService };
