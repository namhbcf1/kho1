// R2 Storage service for Cloudflare Workers integration
import { apiClient } from '../api/client';
import type { ApiResponse } from '../api/types';

export interface R2UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  expires?: Date;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

export interface R2ListOptions {
  prefix?: string;
  delimiter?: string;
  cursor?: string;
  limit?: number;
  include?: ('httpMetadata' | 'customMetadata')[];
}

export interface R2ListResult {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export interface R2PresignedUrlOptions {
  expiresIn?: number; // seconds
  method?: 'GET' | 'PUT' | 'DELETE';
  contentType?: string;
}

class R2Service {
  private readonly baseUrl = '/api/r2';

  /**
   * Upload file to R2
   */
  async upload(
    key: string,
    file: File | Blob,
    options: R2UploadOptions = {}
  ): Promise<R2Object> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', key);
      
      if (options.contentType) {
        formData.append('contentType', options.contentType);
      }
      
      if (options.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata));
      }
      
      if (options.customMetadata) {
        formData.append('customMetadata', JSON.stringify(options.customMetadata));
      }

      const response = await apiClient.post<ApiResponse<R2Object>>(
        `${this.baseUrl}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: Array<{ key: string; file: File | Blob; options?: R2UploadOptions }>
  ): Promise<R2Object[]> {
    try {
      const formData = new FormData();
      
      files.forEach((item, index) => {
        formData.append(`files[${index}]`, item.file);
        formData.append(`keys[${index}]`, item.key);
        
        if (item.options?.contentType) {
          formData.append(`contentTypes[${index}]`, item.options.contentType);
        }
        
        if (item.options?.metadata) {
          formData.append(`metadata[${index}]`, JSON.stringify(item.options.metadata));
        }
      });

      const response = await apiClient.post<ApiResponse<R2Object[]>>(
        `${this.baseUrl}/upload-multiple`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Multiple upload failed');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 multiple upload error:', error);
      throw error;
    }
  }

  /**
   * Get object metadata
   */
  async getObject(key: string): Promise<R2Object | null> {
    try {
      const response = await apiClient.get<ApiResponse<R2Object>>(
        `${this.baseUrl}/objects/${encodeURIComponent(key)}`
      );

      if (!response.success) {
        if (response.message?.includes('not found')) {
          return null;
        }
        throw new Error(response.message || 'Failed to get object');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 get object error:', error);
      throw error;
    }
  }

  /**
   * Delete object
   */
  async deleteObject(key: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `${this.baseUrl}/objects/${encodeURIComponent(key)}`
      );

      return response.success;
    } catch (error) {
      console.error('R2 delete object error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple objects
   */
  async deleteObjects(keys: string[]): Promise<{ deleted: string[]; errors: string[] }> {
    try {
      const response = await apiClient.post<ApiResponse<{ deleted: string[]; errors: string[] }>>(
        `${this.baseUrl}/delete-multiple`,
        { keys }
      );

      if (!response.success) {
        throw new Error(response.message || 'Multiple delete failed');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 delete multiple objects error:', error);
      throw error;
    }
  }

  /**
   * List objects
   */
  async listObjects(options: R2ListOptions = {}): Promise<R2ListResult> {
    try {
      const params = new URLSearchParams();
      
      if (options.prefix) params.append('prefix', options.prefix);
      if (options.delimiter) params.append('delimiter', options.delimiter);
      if (options.cursor) params.append('cursor', options.cursor);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.include) {
        options.include.forEach(item => params.append('include', item));
      }

      const response = await apiClient.get<ApiResponse<R2ListResult>>(
        `${this.baseUrl}/objects?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to list objects');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 list objects error:', error);
      throw error;
    }
  }

  /**
   * Get presigned URL for direct upload/download
   */
  async getPresignedUrl(
    key: string,
    options: R2PresignedUrlOptions = {}
  ): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<{ url: string }>>(
        `${this.baseUrl}/presigned-url`,
        {
          key,
          expiresIn: options.expiresIn || 3600, // 1 hour default
          method: options.method || 'GET',
          contentType: options.contentType,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get presigned URL');
      }

      return response.data!.url;
    } catch (error) {
      console.error('R2 get presigned URL error:', error);
      throw error;
    }
  }

  /**
   * Copy object
   */
  async copyObject(
    sourceKey: string,
    destinationKey: string,
    options: R2UploadOptions = {}
  ): Promise<R2Object> {
    try {
      const response = await apiClient.post<ApiResponse<R2Object>>(
        `${this.baseUrl}/copy`,
        {
          sourceKey,
          destinationKey,
          options,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Copy failed');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 copy object error:', error);
      throw error;
    }
  }

  /**
   * Get public URL for object
   */
  getPublicUrl(key: string, domain?: string): string {
    const baseDomain = domain || 'https://storage.khoaugment.com';
    return `${baseDomain}/${key}`;
  }

  /**
   * Upload image with automatic optimization
   */
  async uploadImage(
    key: string,
    file: File,
    options: {
      resize?: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' };
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
      generateThumbnail?: boolean;
    } = {}
  ): Promise<{ original: R2Object; thumbnail?: R2Object }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', key);
      formData.append('options', JSON.stringify(options));

      const response = await apiClient.post<ApiResponse<{ original: R2Object; thumbnail?: R2Object }>>(
        `${this.baseUrl}/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Image upload failed');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 upload image error:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getUsageStats(): Promise<{
    totalObjects: number;
    totalSize: number;
    bucketName: string;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        totalObjects: number;
        totalSize: number;
        bucketName: string;
      }>>(
        `${this.baseUrl}/usage`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get usage stats');
      }

      return response.data!;
    } catch (error) {
      console.error('R2 get usage stats error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const r2Service = new R2Service();

// Export class for custom instances
export { R2Service };
