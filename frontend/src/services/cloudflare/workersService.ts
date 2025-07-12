// Cloudflare Workers utilities and service management
import { apiClient } from '../api/client';
import type { ApiResponse } from '../api/types';

export interface WorkerInfo {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  region: string;
  runtime: string;
  memoryUsage: number;
  cpuTime: number;
  requests: number;
  errors: number;
  lastDeployment: string;
}

export interface WorkerMetrics {
  requests: number;
  errors: number;
  duration: number;
  cpuTime: number;
  memoryUsage: number;
  timestamp: string;
}

export interface WorkerLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
  requestId?: string;
}

export interface EdgeLocation {
  colo: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

class WorkersService {
  private readonly baseUrl = '/api/workers';

  /**
   * Get worker information
   */
  async getWorkerInfo(): Promise<WorkerInfo> {
    try {
      const response = await apiClient.get<ApiResponse<WorkerInfo>>(
        `${this.baseUrl}/info`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get worker info');
      }

      return response.data!;
    } catch (error) {
      console.error('Get worker info error:', error);
      throw error;
    }
  }

  /**
   * Get worker metrics
   */
  async getMetrics(
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<WorkerMetrics[]> {
    try {
      const response = await apiClient.get<ApiResponse<WorkerMetrics[]>>(
        `${this.baseUrl}/metrics?range=${timeRange}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get metrics');
      }

      return response.data!;
    } catch (error) {
      console.error('Get worker metrics error:', error);
      throw error;
    }
  }

  /**
   * Get worker logs
   */
  async getLogs(
    options: {
      level?: 'info' | 'warn' | 'error' | 'debug';
      limit?: number;
      since?: string;
      search?: string;
    } = {}
  ): Promise<WorkerLog[]> {
    try {
      const params = new URLSearchParams();
      
      if (options.level) params.append('level', options.level);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.since) params.append('since', options.since);
      if (options.search) params.append('search', options.search);

      const response = await apiClient.get<ApiResponse<WorkerLog[]>>(
        `${this.baseUrl}/logs?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get logs');
      }

      return response.data!;
    } catch (error) {
      console.error('Get worker logs error:', error);
      throw error;
    }
  }

  /**
   * Get edge location information
   */
  async getEdgeLocation(): Promise<EdgeLocation> {
    try {
      const response = await apiClient.get<ApiResponse<EdgeLocation>>(
        `${this.baseUrl}/edge-location`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get edge location');
      }

      return response.data!;
    } catch (error) {
      console.error('Get edge location error:', error);
      throw error;
    }
  }

  /**
   * Get request context information
   */
  async getRequestContext(): Promise<{
    cf: any;
    headers: Record<string, string>;
    url: string;
    method: string;
    timestamp: string;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        cf: any;
        headers: Record<string, string>;
        url: string;
        method: string;
        timestamp: string;
      }>>(
        `${this.baseUrl}/request-context`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get request context');
      }

      return response.data!;
    } catch (error) {
      console.error('Get request context error:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    services: {
      d1: 'healthy' | 'unhealthy';
      r2: 'healthy' | 'unhealthy';
      kv: 'healthy' | 'unhealthy';
    };
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        status: 'healthy' | 'unhealthy';
        timestamp: string;
        version: string;
        uptime: number;
        services: {
          d1: 'healthy' | 'unhealthy';
          r2: 'healthy' | 'unhealthy';
          kv: 'healthy' | 'unhealthy';
        };
      }>>(
        `${this.baseUrl}/health`
      );

      if (!response.success) {
        throw new Error(response.message || 'Health check failed');
      }

      return response.data!;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Get environment variables (non-sensitive)
   */
  async getEnvironment(): Promise<Record<string, string>> {
    try {
      const response = await apiClient.get<ApiResponse<Record<string, string>>>(
        `${this.baseUrl}/environment`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get environment');
      }

      return response.data!;
    } catch (error) {
      console.error('Get environment error:', error);
      throw error;
    }
  }

  /**
   * Trigger worker deployment
   */
  async deploy(
    environment: 'development' | 'staging' | 'production' = 'production'
  ): Promise<{
    deploymentId: string;
    status: 'pending' | 'deploying' | 'deployed' | 'failed';
    timestamp: string;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<{
        deploymentId: string;
        status: 'pending' | 'deploying' | 'deployed' | 'failed';
        timestamp: string;
      }>>(
        `${this.baseUrl}/deploy`,
        { environment }
      );

      if (!response.success) {
        throw new Error(response.message || 'Deployment failed');
      }

      return response.data!;
    } catch (error) {
      console.error('Deploy worker error:', error);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<{
    deploymentId: string;
    status: 'pending' | 'deploying' | 'deployed' | 'failed';
    progress: number;
    logs: string[];
    timestamp: string;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        deploymentId: string;
        status: 'pending' | 'deploying' | 'deployed' | 'failed';
        progress: number;
        logs: string[];
        timestamp: string;
      }>>(
        `${this.baseUrl}/deployments/${deploymentId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get deployment status');
      }

      return response.data!;
    } catch (error) {
      console.error('Get deployment status error:', error);
      throw error;
    }
  }

  /**
   * Purge cache
   */
  async purgeCache(
    options: {
      everything?: boolean;
      files?: string[];
      tags?: string[];
      hosts?: string[];
    } = {}
  ): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse>(
        `${this.baseUrl}/purge-cache`,
        options
      );

      return response.success;
    } catch (error) {
      console.error('Purge cache error:', error);
      throw error;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    requests: number;
    bandwidth: number;
    errors: number;
    threats: number;
    pageViews: number;
    uniqueVisitors: number;
    countries: Array<{ country: string; requests: number }>;
    statusCodes: Array<{ code: number; count: number }>;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        requests: number;
        bandwidth: number;
        errors: number;
        threats: number;
        pageViews: number;
        uniqueVisitors: number;
        countries: Array<{ country: string; requests: number }>;
        statusCodes: Array<{ code: number; count: number }>;
      }>>(
        `${this.baseUrl}/analytics?range=${timeRange}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get analytics');
      }

      return response.data!;
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  }

  /**
   * Execute custom worker function
   */
  async executeFunction<T = any>(
    functionName: string,
    params: any = {}
  ): Promise<T> {
    try {
      const response = await apiClient.post<ApiResponse<T>>(
        `${this.baseUrl}/execute/${functionName}`,
        params
      );

      if (!response.success) {
        throw new Error(response.message || 'Function execution failed');
      }

      return response.data!;
    } catch (error) {
      console.error('Execute function error:', error);
      throw error;
    }
  }

  /**
   * Get worker limits and quotas
   */
  async getLimits(): Promise<{
    cpuTime: { used: number; limit: number };
    memory: { used: number; limit: number };
    requests: { used: number; limit: number };
    storage: { used: number; limit: number };
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        cpuTime: { used: number; limit: number };
        memory: { used: number; limit: number };
        requests: { used: number; limit: number };
        storage: { used: number; limit: number };
      }>>(
        `${this.baseUrl}/limits`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get limits');
      }

      return response.data!;
    } catch (error) {
      console.error('Get limits error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const workersService = new WorkersService();

// Export class for custom instances
export { WorkersService };
