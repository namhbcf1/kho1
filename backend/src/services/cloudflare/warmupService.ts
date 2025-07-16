/**
 * Cloudflare Worker Warmup Service
 * Fixes: Cold start death spiral issues
 * Implements: Predictive warming, keepalive, performance monitoring
 */

import { z } from 'zod';

export interface WarmupConfig {
  enabled: boolean;
  warmupInterval: number; // minutes
  criticalEndpoints: string[];
  warmupPeriods: Array<{
    start: string; // HH:MM format
    end: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
  maxConcurrentWarmups: number;
}

export interface PerformanceMetrics {
  endpoint: string;
  coldStartTime: number;
  warmStartTime: number;
  timestamp: string;
  location: string;
  success: boolean;
}

export interface WarmupResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  wasColdStart: boolean;
  error?: string;
}

/**
 * Worker Warmup Scheduler
 */
export class WorkerWarmupService {
  private config: WarmupConfig;
  private isWarming = false;
  private warmupHistory = new Map<string, number>();
  private performanceMetrics: PerformanceMetrics[] = [];

  constructor(
    private kv: any,
    private scheduledEvent?: any,
    config?: Partial<WarmupConfig>
  ) {
    this.config = {
      enabled: true,
      warmupInterval: 5, // 5 minutes
      criticalEndpoints: [
        '/api/v1/auth/login',
        '/api/v1/pos/quick-sale',
        '/api/v1/payments/process',
        '/api/v1/products/search',
        '/api/v1/inventory/check'
      ],
      warmupPeriods: [
        { start: '08:00', end: '12:00', intensity: 'high' },   // Morning rush
        { start: '12:00', end: '14:00', intensity: 'medium' }, // Lunch
        { start: '17:00', end: '21:00', intensity: 'high' },   // Evening rush
        { start: '21:00', end: '08:00', intensity: 'low' }     // Overnight
      ],
      maxConcurrentWarmups: 3,
      ...config
    };
  }

  /**
   * Schedule warmup based on business hours
   */
  async scheduleWarmup(): Promise<void> {
    if (!this.config.enabled || this.isWarming) {
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const currentPeriod = this.config.warmupPeriods.find(period => {
      return this.isTimeInPeriod(currentTime, period.start, period.end);
    });

    if (!currentPeriod) {
      return;
    }

    const intensity = this.getWarmupIntensity(currentPeriod.intensity);
    await this.performWarmup(intensity);
  }

  /**
   * Perform warmup with intelligent endpoint selection
   */
  private async performWarmup(intensity: { frequency: number; endpoints: number }): Promise<WarmupResult[]> {
    this.isWarming = true;
    const results: WarmupResult[] = [];

    try {
      // Select endpoints based on priority and last warmup time
      const endpointsToWarm = this.selectEndpointsForWarmup(intensity.endpoints);
      
      // Warm endpoints with controlled concurrency
      const warmupPromises = endpointsToWarm.map(endpoint => 
        this.warmupEndpoint(endpoint)
      );

      const warmupResults = await Promise.allSettled(warmupPromises);
      
      warmupResults.forEach((result, index) => {
        const endpoint = endpointsToWarm[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            endpoint,
            success: false,
            responseTime: 0,
            wasColdStart: false,
            error: result.reason?.message || 'Warmup failed'
          });
        }
      });

      // Store performance metrics
      await this.storePerformanceMetrics(results);
      
      // Update warmup history
      endpointsToWarm.forEach(endpoint => {
        this.warmupHistory.set(endpoint, Date.now());
      });

    } finally {
      this.isWarming = false;
    }

    return results;
  }

  /**
   * Smart endpoint warmup with cold start detection
   */
  private async warmupEndpoint(endpoint: string): Promise<WarmupResult> {
    const startTime = Date.now();
    
    try {
      // Add warmup headers to identify the request
      const response = await fetch(`${this.getWorkerUrl()}${endpoint}`, {
        method: 'GET',
        headers: {
          'X-Warmup-Request': 'true',
          'X-Warmup-Timestamp': startTime.toString(),
          'User-Agent': 'CloudflareWorkerWarmup/1.0'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Detect cold start based on response time and headers
      const wasColdStart = this.detectColdStart(responseTime, response.headers);
      
      return {
        endpoint,
        success: response.ok,
        responseTime,
        wasColdStart,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };

    } catch (error) {
      return {
        endpoint,
        success: false,
        responseTime: Date.now() - startTime,
        wasColdStart: false,
        error: error.message
      };
    }
  }

  /**
   * Predictive warmup based on usage patterns
   */
  async predictiveWarmup(): Promise<void> {
    // Get historical usage patterns
    const usagePatterns = await this.getUsagePatterns();
    
    // Predict which endpoints will be needed soon
    const predictedEndpoints = this.predictEndpointUsage(usagePatterns);
    
    // Warm predicted endpoints
    if (predictedEndpoints.length > 0) {
      await this.performTargetedWarmup(predictedEndpoints);
    }
  }

  /**
   * Emergency warmup for critical operations
   */
  async emergencyWarmup(): Promise<WarmupResult[]> {
    const criticalEndpoints = [
      '/api/v1/payments/process',
      '/api/v1/pos/quick-sale',
      '/api/v1/auth/login'
    ];

    const warmupPromises = criticalEndpoints.map(endpoint => 
      this.warmupEndpoint(endpoint)
    );

    return await Promise.all(warmupPromises);
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(hours = 24): Promise<{
    averageColdStartTime: number;
    averageWarmStartTime: number;
    coldStartRate: number;
    endpointPerformance: Array<{
      endpoint: string;
      avgResponseTime: number;
      coldStartRate: number;
      successRate: number;
    }>;
  }> {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentMetrics = this.performanceMetrics.filter(
      m => new Date(m.timestamp).getTime() > cutoffTime
    );

    const coldStarts = recentMetrics.filter(m => m.coldStartTime > 0);
    const warmStarts = recentMetrics.filter(m => m.warmStartTime > 0);

    // Group by endpoint
    const endpointGroups = new Map<string, PerformanceMetrics[]>();
    recentMetrics.forEach(metric => {
      if (!endpointGroups.has(metric.endpoint)) {
        endpointGroups.set(metric.endpoint, []);
      }
      endpointGroups.get(metric.endpoint)!.push(metric);
    });

    const endpointPerformance = Array.from(endpointGroups.entries()).map(([endpoint, metrics]) => {
      const successful = metrics.filter(m => m.success);
      const coldStartMetrics = metrics.filter(m => m.coldStartTime > 0);
      
      return {
        endpoint,
        avgResponseTime: successful.reduce((sum, m) => sum + (m.coldStartTime || m.warmStartTime), 0) / successful.length || 0,
        coldStartRate: (coldStartMetrics.length / metrics.length) * 100,
        successRate: (successful.length / metrics.length) * 100
      };
    });

    return {
      averageColdStartTime: coldStarts.reduce((sum, m) => sum + m.coldStartTime, 0) / coldStarts.length || 0,
      averageWarmStartTime: warmStarts.reduce((sum, m) => sum + m.warmStartTime, 0) / warmStarts.length || 0,
      coldStartRate: (coldStarts.length / recentMetrics.length) * 100,
      endpointPerformance
    };
  }

  /**
   * Cron job handler for scheduled warmup
   */
  async handleScheduledWarmup(event: any): Promise<void> {
    console.log('Executing scheduled warmup:', new Date().toISOString());
    
    try {
      await this.scheduleWarmup();
      
      // Also run predictive warmup
      await this.predictiveWarmup();
      
      // Clean up old performance metrics
      await this.cleanupOldMetrics();
      
    } catch (error) {
      console.error('Scheduled warmup failed:', error);
    }
  }

  private selectEndpointsForWarmup(count: number): string[] {
    const now = Date.now();
    
    // Sort endpoints by priority and last warmup time
    const endpointPriority = this.config.criticalEndpoints.map(endpoint => {
      const lastWarmup = this.warmupHistory.get(endpoint) || 0;
      const timeSinceWarmup = now - lastWarmup;
      
      return {
        endpoint,
        priority: this.getEndpointPriority(endpoint),
        timeSinceWarmup,
        score: this.calculateWarmupScore(endpoint, timeSinceWarmup)
      };
    });

    return endpointPriority
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.endpoint);
  }

  private getWarmupIntensity(level: 'low' | 'medium' | 'high'): { frequency: number; endpoints: number } {
    switch (level) {
      case 'low':
        return { frequency: 10, endpoints: 2 }; // Every 10 minutes, 2 endpoints
      case 'medium':
        return { frequency: 5, endpoints: 3 };  // Every 5 minutes, 3 endpoints
      case 'high':
        return { frequency: 2, endpoints: 5 };  // Every 2 minutes, 5 endpoints
      default:
        return { frequency: 5, endpoints: 3 };
    }
  }

  private detectColdStart(responseTime: number, headers: Headers): boolean {
    // Cold start indicators:
    // 1. Response time > 100ms
    // 2. Specific headers from worker
    // 3. First request in a while
    
    const coldStartThreshold = 100; // ms
    const hasColdStartHeader = headers.get('CF-Ray') && !headers.get('CF-Cache-Status');
    
    return responseTime > coldStartThreshold || hasColdStartHeader;
  }

  private async storePerformanceMetrics(results: WarmupResult[]): Promise<void> {
    const timestamp = new Date().toISOString();
    
    for (const result of results) {
      const metric: PerformanceMetrics = {
        endpoint: result.endpoint,
        coldStartTime: result.wasColdStart ? result.responseTime : 0,
        warmStartTime: result.wasColdStart ? 0 : result.responseTime,
        timestamp,
        location: 'auto', // Could be enhanced with actual location
        success: result.success
      };
      
      this.performanceMetrics.push(metric);
    }

    // Store in KV for persistence
    await this.kv.put(
      `warmup_metrics_${Date.now()}`,
      JSON.stringify(results),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );
  }

  private async getUsagePatterns(): Promise<any[]> {
    // Get historical usage data from KV
    const keys = await this.kv.list({ prefix: 'usage_pattern_' });
    const patterns = [];
    
    for (const key of keys.keys) {
      try {
        const data = await this.kv.get(key.name);
        if (data) {
          patterns.push(JSON.parse(data));
        }
      } catch (error) {
        console.error('Failed to parse usage pattern:', error);
      }
    }
    
    return patterns;
  }

  private predictEndpointUsage(patterns: any[]): string[] {
    // Simple prediction based on time patterns
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Find patterns for similar times
    const relevantPatterns = patterns.filter(pattern => {
      const patternTime = new Date(pattern.timestamp);
      const hourDiff = Math.abs(patternTime.getHours() - currentHour);
      return hourDiff <= 1; // Within 1 hour
    });
    
    // Count endpoint usage
    const endpointCounts = new Map<string, number>();
    relevantPatterns.forEach(pattern => {
      pattern.endpoints?.forEach((endpoint: string) => {
        endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
      });
    });
    
    // Return top endpoints
    return Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([endpoint]) => endpoint);
  }

  private async performTargetedWarmup(endpoints: string[]): Promise<void> {
    const warmupPromises = endpoints.slice(0, this.config.maxConcurrentWarmups).map(endpoint => 
      this.warmupEndpoint(endpoint)
    );
    
    await Promise.all(warmupPromises);
  }

  private getEndpointPriority(endpoint: string): number {
    const priorities: Record<string, number> = {
      '/api/v1/payments/process': 10,
      '/api/v1/pos/quick-sale': 9,
      '/api/v1/auth/login': 8,
      '/api/v1/products/search': 7,
      '/api/v1/inventory/check': 6
    };
    
    return priorities[endpoint] || 1;
  }

  private calculateWarmupScore(endpoint: string, timeSinceWarmup: number): number {
    const priority = this.getEndpointPriority(endpoint);
    const timeWeight = Math.min(timeSinceWarmup / (5 * 60 * 1000), 1); // 5 minutes max
    
    return priority * (1 + timeWeight);
  }

  private isTimeInPeriod(currentTime: string, start: string, end: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    
    if (startMinutes <= endMinutes) {
      return current >= startMinutes && current <= endMinutes;
    } else {
      // Crosses midnight
      return current >= startMinutes || current <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getWorkerUrl(): string {
    // Get from environment or use default
    return process.env.WORKER_URL || 'https://kho1-api-production.bangachieu2.workers.dev';
  }

  private async cleanupOldMetrics(): Promise<void> {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    this.performanceMetrics = this.performanceMetrics.filter(
      metric => new Date(metric.timestamp).getTime() > cutoff
    );
  }
}