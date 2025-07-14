// D1 Database Service with comprehensive error handling and retry logic
import { z } from 'zod';

// Base D1 types
export interface D1QueryResult<T = any> {
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
  results: T[];
  error?: string;
}

export interface D1ExecuteResult {
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 2000,
  jitter: true,
};

// Database error types
export class D1ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public query?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'D1ServiceError';
  }
}

export class D1ConnectionError extends D1ServiceError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONNECTION_ERROR', undefined, cause);
    this.name = 'D1ConnectionError';
  }
}

export class D1QueryError extends D1ServiceError {
  constructor(message: string, query: string, cause?: Error) {
    super(message, 'QUERY_ERROR', query, cause);
    this.name = 'D1QueryError';
  }
}

export class D1ValidationError extends D1ServiceError {
  constructor(message: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', undefined, cause);
    this.name = 'D1ValidationError';
  }
}

export class D1Service {
  private db: D1Database;
  private retryConfig: RetryConfig;

  constructor(database: D1Database, retryConfig: Partial<RetryConfig> = {}) {
    this.db = database;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  // Retry logic with exponential backoff
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors or other non-retryable errors
        if (error instanceof D1ValidationError) {
          throw error;
        }
        
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff and optional jitter
        const baseDelay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );
        
        const delay = this.retryConfig.jitter
          ? baseDelay + Math.random() * baseDelay * 0.1
          : baseDelay;
        
        console.warn(`${context} failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error);
        await this.sleep(delay);
      }
    }
    
    throw new D1ConnectionError(`${context} failed after ${this.retryConfig.maxRetries + 1} attempts`, lastError);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Safe query execution with proper error handling
  async query<T = any>(
    sql: string,
    params: any[] = [],
    schema?: z.ZodSchema<T>
  ): Promise<D1QueryResult<T>> {
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
          } catch (validationError) {
            throw new D1ValidationError(
              `Query result validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`,
              validationError as Error
            );
          }
        }
        
        return {
          success: result.success,
          meta: result.meta,
          results: validatedResults as T[],
        };
      } catch (error) {
        if (error instanceof D1ValidationError) {
          throw error;
        }
        throw new D1QueryError(
          `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          sql,
          error as Error
        );
      }
    }, `Query execution: ${sql.substring(0, 100)}...`);
  }

  // Execute statements (INSERT, UPDATE, DELETE)
  async execute(
    sql: string,
    params: any[] = []
  ): Promise<D1ExecuteResult> {
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
      } catch (error) {
        throw new D1QueryError(
          `Statement execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          sql,
          error as Error
        );
      }
    }, `Statement execution: ${sql.substring(0, 100)}...`);
  }

  // Batch operations with transaction-like behavior
  async batch(statements: { sql: string; params?: any[] }[]): Promise<D1ExecuteResult[]> {
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
      } catch (error) {
        throw new D1QueryError(
          `Batch execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          `Batch of ${statements.length} statements`,
          error as Error
        );
      }
    }, `Batch execution of ${statements.length} statements`);
  }

  // Get single record with validation
  async findOne<T>(
    table: string,
    where: Record<string, any>,
    schema?: z.ZodSchema<T>,
    columns: string[] = ['*']
  ): Promise<T | null> {
    const whereKeys = Object.keys(where);
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    const whereValues = Object.values(where);
    
    const sql = `SELECT ${columns.join(', ')} FROM ${table} WHERE ${whereClause} LIMIT 1`;
    
    const result = await this.query<T>(sql, whereValues, schema);
    return result.results.length > 0 ? result.results[0] : null;
  }

  // Get multiple records with pagination
  async findMany<T>(
    table: string,
    options: {
      where?: Record<string, any>;
      orderBy?: string;
      limit?: number;
      offset?: number;
      columns?: string[];
      schema?: z.ZodSchema<T>;
    } = {}
  ): Promise<T[]> {
    const {
      where = {},
      orderBy = 'id ASC',
      limit = 50,
      offset = 0,
      columns = ['*'],
      schema
    } = options;
    
    let sql = `SELECT ${columns.join(', ')} FROM ${table}`;
    const params: any[] = [];
    
    if (Object.keys(where).length > 0) {
      const whereKeys = Object.keys(where);
      const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(where));
    }
    
    sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await this.query<T>(sql, params, schema);
    return result.results;
  }

  // Get paginated results
  async findPaginated<T>(
    table: string,
    pagination: PaginationParams,
    options: {
      where?: Record<string, any>;
      orderBy?: string;
      columns?: string[];
      schema?: z.ZodSchema<T>;
    } = {}
  ): Promise<PaginatedResult<T>> {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 50, 100); // Cap at 100
    const offset = (page - 1) * limit;
    
    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM ${table}`;
    const countParams: any[] = [];
    
    if (options.where && Object.keys(options.where).length > 0) {
      const whereKeys = Object.keys(options.where);
      const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
      countSql += ` WHERE ${whereClause}`;
      countParams.push(...Object.values(options.where));
    }
    
    const countResult = await this.query<{ total: number }>(countSql, countParams);
    const total = countResult.results[0]?.total || 0;
    
    // Get data
    const data = await this.findMany<T>(table, {
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
  async insert<T>(
    table: string,
    data: Record<string, any>,
    schema?: z.ZodSchema<T>
  ): Promise<{ id: number; data: T }> {
    // Validate input data if schema provided
    if (schema) {
      try {
        schema.parse(data);
      } catch (validationError) {
        throw new D1ValidationError(
          `Insert data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`,
          validationError as Error
        );
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
      data: { id: result.meta.last_row_id, ...data } as T,
    };
  }

  // Update record
  async update<T>(
    table: string,
    id: number,
    data: Record<string, any>,
    schema?: z.ZodSchema<T>
  ): Promise<{ affected: number; data: T }> {
    // Validate input data if schema provided
    if (schema) {
      try {
        schema.parse(data);
      } catch (validationError) {
        throw new D1ValidationError(
          `Update data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`,
          validationError as Error
        );
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
      data: { id, ...data } as T,
    };
  }

  // Delete record
  async delete(table: string, id: number): Promise<{ affected: number }> {
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
  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    
    try {
      await this.query('SELECT 1 as test');
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get database info
  async getDatabaseInfo(): Promise<any> {
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
    } catch (error) {
      throw new D1QueryError(
        `Failed to get database info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'sqlite_master query',
        error as Error
      );
    }
  }
}

// Utility functions for creating properly typed services
export function createD1Service(database: D1Database, retryConfig?: Partial<RetryConfig>): D1Service {
  return new D1Service(database, retryConfig);
}

// Response helpers
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(error: string | Error, code?: string) {
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

export function createPaginatedResponse<T>(result: PaginatedResult<T>, message?: string) {
  return {
    success: true,
    message,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  };
}