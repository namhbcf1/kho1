const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 2000,
    jitter: true,
};
// Database error types
export class D1ServiceError extends Error {
    code;
    query;
    cause;
    constructor(message, code, query, cause) {
        super(message);
        this.code = code;
        this.query = query;
        this.cause = cause;
        this.name = 'D1ServiceError';
    }
}
export class D1ConnectionError extends D1ServiceError {
    constructor(message, cause) {
        super(message, 'CONNECTION_ERROR', undefined, cause);
        this.name = 'D1ConnectionError';
    }
}
export class D1QueryError extends D1ServiceError {
    constructor(message, query, cause) {
        super(message, 'QUERY_ERROR', query, cause);
        this.name = 'D1QueryError';
    }
}
export class D1ValidationError extends D1ServiceError {
    constructor(message, cause) {
        super(message, 'VALIDATION_ERROR', undefined, cause);
        this.name = 'D1ValidationError';
    }
}
export class D1Service {
    db;
    retryConfig;
    constructor(database, retryConfig = {}) {
        this.db = database;
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    }
    // Retry logic with exponential backoff
    async withRetry(operation, context) {
        let lastError;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Don't retry validation errors or other non-retryable errors
                if (error instanceof D1ValidationError) {
                    throw error;
                }
                if (attempt === this.retryConfig.maxRetries) {
                    break;
                }
                // Calculate delay with exponential backoff and optional jitter
                const baseDelay = Math.min(this.retryConfig.baseDelay * Math.pow(2, attempt), this.retryConfig.maxDelay);
                const delay = this.retryConfig.jitter
                    ? baseDelay + Math.random() * baseDelay * 0.1
                    : baseDelay;
                console.warn(`${context} failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error);
                await this.sleep(delay);
            }
        }
        throw new D1ConnectionError(`${context} failed after ${this.retryConfig.maxRetries + 1} attempts`, lastError);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Safe query execution with proper error handling
    async query(sql, params = [], schema) {
        return this.withRetry(async () => {
            try {
                console.log(`Executing query: ${sql}`, { params });
                const prepared = this.db.prepare(sql);
                const statement = params.length > 0 ? prepared.bind(...params) : prepared;
                const result = await statement.all();
                // Validate results if schema provided
                let validatedResults = result.results;
                if (schema && result.results) {
                    try {
                        validatedResults = result.results.map(row => schema.parse(row));
                    }
                    catch (validationError) {
                        throw new D1ValidationError(`Query result validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`, validationError);
                    }
                }
                return {
                    success: result.success,
                    meta: result.meta,
                    results: validatedResults,
                };
            }
            catch (error) {
                if (error instanceof D1ValidationError) {
                    throw error;
                }
                throw new D1QueryError(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, sql, error);
            }
        }, `Query execution: ${sql.substring(0, 100)}...`);
    }
    // Execute statements (INSERT, UPDATE, DELETE)
    async execute(sql, params = []) {
        return this.withRetry(async () => {
            try {
                console.log(`Executing statement: ${sql}`, { params });
                const prepared = this.db.prepare(sql);
                const statement = params.length > 0 ? prepared.bind(...params) : prepared;
                const result = await statement.run();
                return {
                    success: result.success,
                    meta: result.meta,
                };
            }
            catch (error) {
                throw new D1QueryError(`Statement execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, sql, error);
            }
        }, `Statement execution: ${sql.substring(0, 100)}...`);
    }
    // Batch operations with transaction-like behavior
    async batch(statements) {
        return this.withRetry(async () => {
            try {
                console.log(`Executing batch of ${statements.length} statements`);
                const prepared = statements.map(stmt => {
                    const preparedStmt = this.db.prepare(stmt.sql);
                    return stmt.params && stmt.params.length > 0
                        ? preparedStmt.bind(...stmt.params)
                        : preparedStmt;
                });
                const results = await this.db.batch(prepared);
                return results.map(result => ({
                    success: result.success,
                    meta: result.meta,
                }));
            }
            catch (error) {
                throw new D1QueryError(`Batch execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, `Batch of ${statements.length} statements`, error);
            }
        }, `Batch execution of ${statements.length} statements`);
    }
    // Get single record with validation
    async findOne(table, where, schema, columns = ['*']) {
        const whereKeys = Object.keys(where);
        const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
        const whereValues = Object.values(where);
        const sql = `SELECT ${columns.join(', ')} FROM ${table} WHERE ${whereClause} LIMIT 1`;
        const result = await this.query(sql, whereValues, schema);
        return result.results.length > 0 ? result.results[0] : null;
    }
    // Get multiple records with pagination
    async findMany(table, options = {}) {
        const { where = {}, orderBy = 'id ASC', limit = 50, offset = 0, columns = ['*'], schema } = options;
        let sql = `SELECT ${columns.join(', ')} FROM ${table}`;
        const params = [];
        if (Object.keys(where).length > 0) {
            const whereKeys = Object.keys(where);
            const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
            sql += ` WHERE ${whereClause}`;
            params.push(...Object.values(where));
        }
        sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const result = await this.query(sql, params, schema);
        return result.results;
    }
    // Get paginated results
    async findPaginated(table, pagination, options = {}) {
        const page = pagination.page || 1;
        const limit = Math.min(pagination.limit || 50, 100); // Cap at 100
        const offset = (page - 1) * limit;
        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM ${table}`;
        const countParams = [];
        if (options.where && Object.keys(options.where).length > 0) {
            const whereKeys = Object.keys(options.where);
            const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
            countSql += ` WHERE ${whereClause}`;
            countParams.push(...Object.values(options.where));
        }
        const countResult = await this.query(countSql, countParams);
        const total = countResult.results[0]?.total || 0;
        // Get data
        const data = await this.findMany(table, {
            ...options,
            limit,
            offset
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    // Insert record
    async insert(table, data, schema) {
        // Validate input data if schema provided
        if (schema) {
            try {
                schema.parse(data);
            }
            catch (validationError) {
                throw new D1ValidationError(`Insert data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`, validationError);
            }
        }
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        const result = await this.execute(sql, values);
        if (!result.success) {
            throw new D1QueryError('Insert operation failed', sql);
        }
        return {
            id: result.meta.last_row_id,
            data: { id: result.meta.last_row_id, ...data },
        };
    }
    // Update record
    async update(table, id, data, schema) {
        // Validate input data if schema provided
        if (schema) {
            try {
                schema.parse(data);
            }
            catch (validationError) {
                throw new D1ValidationError(`Update data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`, validationError);
            }
        }
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        const result = await this.execute(sql, [...values, id]);
        if (!result.success) {
            throw new D1QueryError('Update operation failed', sql);
        }
        return {
            affected: result.meta.changes,
            data: { id, ...data },
        };
    }
    // Delete record
    async delete(table, id) {
        const sql = `DELETE FROM ${table} WHERE id = ?`;
        const result = await this.execute(sql, [id]);
        if (!result.success) {
            throw new D1QueryError('Delete operation failed', sql);
        }
        return {
            affected: result.meta.changes,
        };
    }
    // Health check
    async healthCheck() {
        const start = Date.now();
        try {
            await this.query('SELECT 1 as test');
            const latency = Date.now() - start;
            return {
                healthy: true,
                latency,
            };
        }
        catch (error) {
            return {
                healthy: false,
                latency: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    // Get database info
    async getDatabaseInfo() {
        try {
            const result = await this.query(`
        SELECT 
          name,
          type,
          sql
        FROM sqlite_master 
        WHERE type IN ('table', 'index')
        ORDER BY type, name
      `);
            return result.results;
        }
        catch (error) {
            throw new D1QueryError(`Failed to get database info: ${error instanceof Error ? error.message : 'Unknown error'}`, 'sqlite_master query', error);
        }
    }
}
// Utility functions for creating properly typed services
export function createD1Service(database, retryConfig) {
    return new D1Service(database, retryConfig);
}
// Response helpers
export function createSuccessResponse(data, message) {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}
export function createErrorResponse(error, code) {
    const message = error instanceof Error ? error.message : error;
    return {
        success: false,
        error: {
            message,
            code: code || 'UNKNOWN_ERROR',
        },
        timestamp: new Date().toISOString(),
    };
}
export function createPaginatedResponse(result, message) {
    return {
        success: true,
        message,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
    };
}
