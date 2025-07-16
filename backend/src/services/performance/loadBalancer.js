/**
 * Intelligent Load Balancer Service
 * Fixes: Single point of failure, poor resource utilization
 * Implements: Round-robin, weighted, health-based load balancing
 */
import { z } from 'zod';
/**
 * Advanced Load Balancer with Health Monitoring
 */
export class LoadBalancerService {
    servers = new Map();
    config;
    metrics;
    circuitBreakers = new Map();
    currentIndex = 0; // For round-robin
    requestQueue = [];
    constructor(config) {
        this.config = {
            algorithm: 'weighted',
            healthCheckInterval: 30000, // 30 seconds
            healthCheckTimeout: 5000, // 5 seconds
            maxRetries: 3,
            retryDelay: 1000, // 1 second
            enableFailover: true,
            enableCircuitBreaker: true,
            circuitBreakerThreshold: 50, // 50% error rate
            enableMetrics: true,
            ...config
        };
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            throughput: 0,
            errorRate: 0,
            serversStatus: {
                active: 0,
                inactive: 0,
                healthy: 0,
                unhealthy: 0
            }
        };
        this.initializeLoadBalancer();
    }
    /**
     * Add server to the load balancer pool
     */
    addServer(server) {
        const fullServer = {
            ...server,
            isActive: true,
            isHealthy: true,
            currentConnections: 0,
            responseTime: 0,
            lastHealthCheck: new Date(),
            cpuUsage: 0,
            memoryUsage: 0,
            errorRate: 0,
            throughput: 0
        };
        this.servers.set(server.id, fullServer);
        // Initialize circuit breaker
        this.circuitBreakers.set(server.id, {
            serverId: server.id,
            state: 'closed',
            failureCount: 0,
            successCount: 0
        });
        console.log(`Server added to load balancer: ${server.id} (${server.host}:${server.port})`);
    }
    /**
     * Remove server from the load balancer pool
     */
    removeServer(serverId) {
        this.servers.delete(serverId);
        this.circuitBreakers.delete(serverId);
        console.log(`Server removed from load balancer: ${serverId}`);
    }
    /**
     * Get the next server for request routing
     */
    async getNextServer(context) {
        const availableServers = this.getAvailableServers();
        if (availableServers.length === 0) {
            throw new Error('No available servers');
        }
        let selectedServer = null;
        switch (this.config.algorithm) {
            case 'round-robin':
                selectedServer = this.selectRoundRobin(availableServers);
                break;
            case 'weighted':
                selectedServer = this.selectWeighted(availableServers);
                break;
            case 'least-connections':
                selectedServer = this.selectLeastConnections(availableServers);
                break;
            case 'ip-hash':
                selectedServer = this.selectIpHash(availableServers, context.clientIp);
                break;
            case 'health-based':
                selectedServer = this.selectHealthBased(availableServers);
                break;
            default:
                selectedServer = availableServers[0];
        }
        if (selectedServer) {
            // Check circuit breaker
            if (this.config.enableCircuitBreaker && !this.isCircuitBreakerClosed(selectedServer.id)) {
                // Try another server if this one's circuit breaker is open
                const alternativeServers = availableServers.filter(s => s.id !== selectedServer.id);
                if (alternativeServers.length > 0) {
                    selectedServer = alternativeServers[0];
                }
                else {
                    throw new Error('All servers circuit breakers are open');
                }
            }
            // Update connection count
            selectedServer.currentConnections++;
        }
        return selectedServer;
    }
    /**
     * Execute request with load balancing and failover
     */
    async executeRequest(requestFunction, context) {
        const startTime = performance.now();
        this.metrics.totalRequests++;
        let lastError = null;
        let attempt = 0;
        while (attempt < this.config.maxRetries) {
            try {
                const server = await this.getNextServer(context);
                if (!server) {
                    throw new Error('No available servers');
                }
                // Execute request
                const result = await this.executeWithTimeout(requestFunction, server, context.timeout);
                // Record success
                const responseTime = performance.now() - startTime;
                await this.recordSuccess(server, responseTime);
                return result;
            }
            catch (error) {
                lastError = error;
                attempt++;
                // Record failure
                const server = Array.from(this.servers.values())
                    .find(s => s.currentConnections > 0);
                if (server) {
                    await this.recordFailure(server, error);
                }
                // Wait before retry
                if (attempt < this.config.maxRetries) {
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }
        // All retries failed
        this.metrics.failedRequests++;
        throw lastError || new Error('Request failed after all retries');
    }
    /**
     * Perform health check on all servers
     */
    async performHealthChecks() {
        const healthCheckPromises = Array.from(this.servers.values()).map(server => this.performSingleHealthCheck(server));
        await Promise.allSettled(healthCheckPromises);
        this.updateServerStatus();
    }
    /**
     * Get current load balancer metrics
     */
    getMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }
    /**
     * Get server status information
     */
    getServerStatus() {
        return Array.from(this.servers.values()).map(server => ({
            ...server,
            circuitBreakerState: this.circuitBreakers.get(server.id)
        }));
    }
    /**
     * Scale servers based on load
     */
    async autoScale() {
        const activeServers = Array.from(this.servers.values()).filter(s => s.isActive && s.isHealthy);
        const totalLoad = activeServers.reduce((sum, server) => sum + (server.currentConnections / server.maxConnections), 0);
        const averageLoad = totalLoad / activeServers.length;
        // Scale up if average load > 80%
        if (averageLoad > 0.8) {
            return {
                action: 'scale-up',
                details: `High load detected: ${(averageLoad * 100).toFixed(1)}%. Consider adding more servers.`
            };
        }
        // Scale down if average load < 20% and we have more than 2 servers
        if (averageLoad < 0.2 && activeServers.length > 2) {
            return {
                action: 'scale-down',
                details: `Low load detected: ${(averageLoad * 100).toFixed(1)}%. Consider reducing servers.`
            };
        }
        return {
            action: 'no-action',
            details: `Load is optimal: ${(averageLoad * 100).toFixed(1)}%`
        };
    }
    // Private methods
    async initializeLoadBalancer() {
        // Start health check interval
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
        // Start metrics update interval
        if (this.config.enableMetrics) {
            setInterval(() => {
                this.updateMetrics();
            }, 10000); // Every 10 seconds
        }
        // Start circuit breaker maintenance
        if (this.config.enableCircuitBreaker) {
            setInterval(() => {
                this.maintainCircuitBreakers();
            }, 5000); // Every 5 seconds
        }
        console.log('Load balancer initialized successfully');
    }
    getAvailableServers() {
        return Array.from(this.servers.values())
            .filter(server => server.isActive && server.isHealthy);
    }
    selectRoundRobin(servers) {
        const server = servers[this.currentIndex % servers.length];
        this.currentIndex = (this.currentIndex + 1) % servers.length;
        return server;
    }
    selectWeighted(servers) {
        const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
        const random = Math.random() * totalWeight;
        let weightSum = 0;
        for (const server of servers) {
            weightSum += server.weight;
            if (random <= weightSum) {
                return server;
            }
        }
        return servers[0]; // Fallback
    }
    selectLeastConnections(servers) {
        return servers.reduce((prev, current) => current.currentConnections < prev.currentConnections ? current : prev);
    }
    selectIpHash(servers, clientIp) {
        const hash = this.hashString(clientIp);
        const index = hash % servers.length;
        return servers[index];
    }
    selectHealthBased(servers) {
        // Score based on response time, CPU usage, memory usage
        return servers.reduce((best, current) => {
            const currentScore = this.calculateHealthScore(current);
            const bestScore = this.calculateHealthScore(best);
            return currentScore > bestScore ? current : best;
        });
    }
    calculateHealthScore(server) {
        let score = 100;
        // Penalize high response time
        if (server.responseTime > 1000)
            score -= 30;
        else if (server.responseTime > 500)
            score -= 15;
        // Penalize high CPU usage
        if (server.cpuUsage > 80)
            score -= 25;
        else if (server.cpuUsage > 60)
            score -= 10;
        // Penalize high memory usage
        if (server.memoryUsage > 85)
            score -= 20;
        else if (server.memoryUsage > 70)
            score -= 8;
        // Penalize high connection utilization
        const connectionRatio = server.currentConnections / server.maxConnections;
        if (connectionRatio > 0.9)
            score -= 20;
        else if (connectionRatio > 0.7)
            score -= 10;
        // Penalize high error rate
        if (server.errorRate > 10)
            score -= 25;
        else if (server.errorRate > 5)
            score -= 10;
        return Math.max(0, score);
    }
    isCircuitBreakerClosed(serverId) {
        const breaker = this.circuitBreakers.get(serverId);
        if (!breaker)
            return true;
        const now = new Date();
        switch (breaker.state) {
            case 'closed':
                return true;
            case 'open':
                // Check if we should try half-open
                if (breaker.nextAttemptTime && now >= breaker.nextAttemptTime) {
                    breaker.state = 'half-open';
                    breaker.successCount = 0;
                    return true;
                }
                return false;
            case 'half-open':
                return true;
            default:
                return true;
        }
    }
    async executeWithTimeout(requestFunction, server, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);
            requestFunction(server)
                .then(result => {
                clearTimeout(timeoutId);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
            })
                .finally(() => {
                // Decrement connection count
                server.currentConnections = Math.max(0, server.currentConnections - 1);
            });
        });
    }
    async recordSuccess(server, responseTime) {
        server.responseTime = (server.responseTime + responseTime) / 2; // Moving average
        server.errorRate = Math.max(0, server.errorRate - 1); // Reduce error rate on success
        this.metrics.successfulRequests++;
        // Update circuit breaker
        const breaker = this.circuitBreakers.get(server.id);
        if (breaker) {
            breaker.failureCount = 0;
            if (breaker.state === 'half-open') {
                breaker.successCount++;
                if (breaker.successCount >= 3) { // 3 successful requests to close
                    breaker.state = 'closed';
                }
            }
        }
    }
    async recordFailure(server, error) {
        server.errorRate = Math.min(100, server.errorRate + 5); // Increase error rate
        // Update circuit breaker
        const breaker = this.circuitBreakers.get(server.id);
        if (breaker && this.config.enableCircuitBreaker) {
            breaker.failureCount++;
            breaker.lastFailureTime = new Date();
            // Open circuit breaker if failure threshold reached
            if (breaker.failureCount >= 5 || server.errorRate > this.config.circuitBreakerThreshold) {
                breaker.state = 'open';
                breaker.nextAttemptTime = new Date(Date.now() + 60000); // Try again in 1 minute
                console.warn(`Circuit breaker opened for server ${server.id}`);
            }
        }
    }
    async performSingleHealthCheck(server) {
        const startTime = performance.now();
        try {
            // Simulate health check (replace with actual HTTP request)
            const response = await this.simulateHealthCheck(server);
            const responseTime = performance.now() - startTime;
            server.isHealthy = response.healthy;
            server.responseTime = responseTime;
            server.cpuUsage = response.cpuUsage || 0;
            server.memoryUsage = response.memoryUsage || 0;
            server.lastHealthCheck = new Date();
            if (response.healthy) {
                // Reset circuit breaker on successful health check
                const breaker = this.circuitBreakers.get(server.id);
                if (breaker && breaker.state === 'open') {
                    breaker.state = 'half-open';
                    breaker.failureCount = 0;
                }
            }
        }
        catch (error) {
            server.isHealthy = false;
            server.lastHealthCheck = new Date();
            console.error(`Health check failed for server ${server.id}:`, error);
        }
    }
    async simulateHealthCheck(server) {
        // Simulate health check delay
        await this.delay(Math.random() * 100);
        // Simulate response (replace with actual health check logic)
        return {
            healthy: Math.random() > 0.1, // 90% healthy
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100
        };
    }
    updateServerStatus() {
        const servers = Array.from(this.servers.values());
        this.metrics.serversStatus = {
            active: servers.filter(s => s.isActive).length,
            inactive: servers.filter(s => !s.isActive).length,
            healthy: servers.filter(s => s.isHealthy).length,
            unhealthy: servers.filter(s => !s.isHealthy).length
        };
    }
    updateMetrics() {
        const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
        if (totalRequests > 0) {
            this.metrics.errorRate = (this.metrics.failedRequests / totalRequests) * 100;
        }
        // Calculate throughput (requests per second)
        // This would need a time-based calculation in a real implementation
        this.metrics.throughput = totalRequests / 60; // Simplified
    }
    maintainCircuitBreakers() {
        const now = new Date();
        for (const breaker of this.circuitBreakers.values()) {
            if (breaker.state === 'open' && breaker.nextAttemptTime && now >= breaker.nextAttemptTime) {
                breaker.state = 'half-open';
                breaker.successCount = 0;
                console.log(`Circuit breaker for server ${breaker.serverId} moved to half-open state`);
            }
        }
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Server node schema
 */
export const ServerNodeSchema = z.object({
    id: z.string(),
    host: z.string(),
    port: z.number().min(1).max(65535),
    weight: z.number().min(1).max(100),
    isActive: z.boolean(),
    isHealthy: z.boolean(),
    currentConnections: z.number().min(0),
    maxConnections: z.number().min(1),
    responseTime: z.number().min(0),
    lastHealthCheck: z.date(),
    cpuUsage: z.number().min(0).max(100),
    memoryUsage: z.number().min(0).max(100),
    errorRate: z.number().min(0).max(100),
    throughput: z.number().min(0)
});
/**
 * Load balancing config schema
 */
export const LoadBalancingConfigSchema = z.object({
    algorithm: z.enum(['round-robin', 'weighted', 'least-connections', 'ip-hash', 'health-based']),
    healthCheckInterval: z.number().positive(),
    healthCheckTimeout: z.number().positive(),
    maxRetries: z.number().min(1).max(10),
    retryDelay: z.number().positive(),
    enableFailover: z.boolean(),
    enableCircuitBreaker: z.boolean(),
    circuitBreakerThreshold: z.number().min(1).max(100),
    enableMetrics: z.boolean()
});
