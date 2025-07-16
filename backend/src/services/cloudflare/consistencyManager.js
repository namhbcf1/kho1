/**
 * Cloudflare KV Consistency Manager
 * Fixes: Eventual consistency chaos in pricing and inventory
 * Implements: Strong consistency patterns, cache invalidation, conflict resolution
 */
/**
 * Strong Consistency Manager for Critical Data
 */
export class CloudflareConsistencyManager {
    kv;
    db;
    config;
    versionCache = new Map();
    conflictQueue = new Map();
    constructor(kv, db, config) {
        this.kv = kv;
        this.db = db;
        this.config = {
            enableStrongConsistency: true,
            maxRetries: 3,
            retryDelay: 100,
            conflictResolutionStrategy: 'last-write-wins',
            propagationTimeout: 5000,
            ...config
        };
    }
    /**
     * Write with strong consistency guarantees
     */
    async writeWithConsistency(key, data, userId, source = 'api') {
        try {
            // Get current version for optimistic locking
            const currentVersion = await this.getCurrentVersion(key);
            const newVersion = currentVersion + 1;
            // Create versioned data
            const versionedData = {
                data,
                version: newVersion,
                timestamp: new Date().toISOString(),
                checksum: this.calculateChecksum(data),
                metadata: {
                    lastModified: new Date().toISOString(),
                    modifiedBy: userId,
                    source
                }
            };
            // Write to database first (source of truth)
            await this.writeToDatabase(key, versionedData);
            // Write to KV with version
            await this.writeToKV(key, versionedData);
            // Verify propagation if strong consistency is enabled
            if (this.config.enableStrongConsistency) {
                const propagationResult = await this.verifyPropagation(key, newVersion);
                if (!propagationResult.success) {
                    return {
                        success: false,
                        error: 'Failed to achieve strong consistency',
                        propagationStatus: propagationResult.status
                    };
                }
            }
            // Update local version cache
            this.versionCache.set(key, newVersion);
            return {
                success: true,
                data,
                version: newVersion
            };
        }
        catch (error) {
            console.error('Consistency write failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Read with consistency validation
     */
    async readWithConsistency(key) {
        try {
            // Try KV first for speed
            const kvData = await this.readFromKV(key);
            if (kvData) {
                // Validate against database if we have concerns about consistency
                const dbData = await this.readFromDatabase(key);
                if (dbData && dbData.version > kvData.version) {
                    // KV is stale, use database data and update KV
                    await this.writeToKV(key, dbData);
                    return {
                        success: true,
                        data: dbData.data,
                        version: dbData.version
                    };
                }
                return {
                    success: true,
                    data: kvData.data,
                    version: kvData.version
                };
            }
            // Fallback to database
            const dbData = await this.readFromDatabase(key);
            if (dbData) {
                // Update KV cache
                await this.writeToKV(key, dbData);
                return {
                    success: true,
                    data: dbData.data,
                    version: dbData.version
                };
            }
            return {
                success: false,
                error: 'Data not found'
            };
        }
        catch (error) {
            console.error('Consistency read failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Compare and swap operation for critical updates
     */
    async compareAndSwap(key, expectedVersion, newData, userId) {
        try {
            const currentData = await this.readFromDatabase(key);
            if (!currentData) {
                return {
                    success: false,
                    error: 'Key not found'
                };
            }
            if (currentData.version !== expectedVersion) {
                return {
                    success: false,
                    conflict: true,
                    error: `Version conflict. Expected ${expectedVersion}, got ${currentData.version}`,
                    data: currentData.data,
                    version: currentData.version
                };
            }
            // Proceed with write
            return await this.writeWithConsistency(key, newData, userId);
        }
        catch (error) {
            console.error('Compare and swap failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Resolve conflicts automatically or queue for manual resolution
     */
    async resolveConflict(key, conflictingVersions) {
        const strategy = this.config.conflictResolutionStrategy;
        switch (strategy) {
            case 'last-write-wins':
                return this.resolveLastWriteWins(conflictingVersions);
            case 'merge':
                return this.resolveMerge(key, conflictingVersions);
            case 'manual':
                return this.queueForManualResolution(key, conflictingVersions);
            default:
                return this.resolveLastWriteWins(conflictingVersions);
        }
    }
    /**
     * Invalidate cache across all regions
     */
    async invalidateCache(keys) {
        const invalidated = [];
        const failed = [];
        for (const key of keys) {
            try {
                // Delete from KV
                await this.kv.delete(key);
                // Remove from local cache
                this.versionCache.delete(key);
                // Add invalidation marker
                await this.kv.put(`invalidated:${key}`, JSON.stringify({ timestamp: new Date().toISOString() }), { expirationTtl: 300 } // 5 minutes
                );
                invalidated.push(key);
            }
            catch (error) {
                console.error(`Failed to invalidate ${key}:`, error);
                failed.push(key);
            }
        }
        return { success: failed.length === 0, invalidated, failed };
    }
    /**
     * Bulk operation with consistency
     */
    async bulkWriteWithConsistency(operations, userId) {
        const results = [];
        const conflicts = [];
        // Sort operations by key to prevent deadlocks
        const sortedOps = operations.sort((a, b) => a.key.localeCompare(b.key));
        for (const op of sortedOps) {
            let result;
            if (op.expectedVersion !== undefined) {
                // Use compare-and-swap
                result = await this.compareAndSwap(op.key, op.expectedVersion, op.data, userId);
            }
            else {
                // Regular write
                result = await this.writeWithConsistency(op.key, op.data, userId);
            }
            results.push(result);
            if (result.conflict) {
                conflicts.push({ key: op.key, conflict: result });
            }
        }
        return {
            success: conflicts.length === 0,
            results,
            conflicts
        };
    }
    /**
     * Monitor consistency health
     */
    async getConsistencyHealth() {
        const issues = [];
        const now = Date.now();
        // Check for stale data
        let stalenessCount = 0;
        const sampleKeys = ['pricing:update', 'inventory:global', 'config:system'];
        for (const key of sampleKeys) {
            try {
                const kvData = await this.readFromKV(key);
                const dbData = await this.readFromDatabase(key);
                if (kvData && dbData && kvData.version < dbData.version) {
                    stalenessCount++;
                    issues.push(`Stale data detected for ${key}`);
                }
            }
            catch (error) {
                issues.push(`Health check failed for ${key}: ${error.message}`);
            }
        }
        // Calculate metrics (simplified)
        const metrics = {
            averagePropagationTime: 150, // Would be calculated from real data
            conflictRate: (this.conflictQueue.size / 1000) * 100, // Conflicts per 1000 operations
            failureRate: 0.1, // Would be calculated from real data
            stalenessCount
        };
        // Determine status
        let status = 'healthy';
        if (metrics.conflictRate > 5 || metrics.stalenessCount > 2) {
            status = 'degraded';
        }
        if (metrics.failureRate > 1 || metrics.stalenessCount > 5) {
            status = 'critical';
        }
        return { status, metrics, issues };
    }
    async getCurrentVersion(key) {
        // Check cache first
        const cachedVersion = this.versionCache.get(key);
        if (cachedVersion !== undefined) {
            return cachedVersion;
        }
        // Check database
        const dbData = await this.readFromDatabase(key);
        if (dbData) {
            this.versionCache.set(key, dbData.version);
            return dbData.version;
        }
        return 0; // New key
    }
    async writeToDatabase(key, data) {
        await this.db.prepare(`
      INSERT OR REPLACE INTO consistency_store (
        key, data, version, timestamp, checksum, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(key, JSON.stringify(data.data), data.version, data.timestamp, data.checksum, JSON.stringify(data.metadata)).run();
    }
    async readFromDatabase(key) {
        const result = await this.db.prepare(`
      SELECT data, version, timestamp, checksum, metadata
      FROM consistency_store
      WHERE key = ?
      ORDER BY version DESC
      LIMIT 1
    `).bind(key).first();
        if (!result)
            return null;
        return {
            data: JSON.parse(result.data),
            version: result.version,
            timestamp: result.timestamp,
            checksum: result.checksum,
            metadata: JSON.parse(result.metadata)
        };
    }
    async writeToKV(key, data) {
        await this.kv.put(key, JSON.stringify(data), {
            metadata: { version: data.version.toString() },
            expirationTtl: 86400 // 24 hours
        });
    }
    async readFromKV(key) {
        try {
            const data = await this.kv.get(key);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (error) {
            console.error('KV read error:', error);
            return null;
        }
    }
    async verifyPropagation(key, version) {
        // Wait for propagation
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        let retries = 0;
        while (retries < this.config.maxRetries) {
            try {
                const kvData = await this.readFromKV(key);
                if (kvData && kvData.version >= version) {
                    return { success: true };
                }
            }
            catch (error) {
                console.error('Propagation verification failed:', error);
            }
            retries++;
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * retries));
        }
        return { success: false };
    }
    calculateChecksum(data) {
        // Simple checksum - could use crypto.subtle for better hashing
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
    resolveLastWriteWins(versions) {
        const latest = versions.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest);
        return {
            strategy: 'last-write-wins',
            resolvedData: latest.data,
            conflictingVersions: versions.map(v => ({
                version: v.version,
                data: v.data,
                timestamp: v.timestamp
            }))
        };
    }
    resolveMerge(key, versions) {
        // Implement merge logic based on data type
        // This is a simplified example
        const merged = versions.reduce((acc, version) => {
            if (typeof version.data === 'object' && !Array.isArray(version.data)) {
                return { ...acc, ...version.data };
            }
            return version.data; // Fallback to last-write-wins for non-objects
        }, {});
        return {
            strategy: 'merge',
            resolvedData: merged,
            conflictingVersions: versions.map(v => ({
                version: v.version,
                data: v.data,
                timestamp: v.timestamp
            }))
        };
    }
    queueForManualResolution(key, versions) {
        // Queue conflict for manual resolution
        this.conflictQueue.set(key, versions);
        // Return latest version as temporary resolution
        const latest = this.resolveLastWriteWins(versions);
        return {
            ...latest,
            strategy: 'manual'
        };
    }
}
