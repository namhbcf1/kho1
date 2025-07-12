// D1 Database service for Cloudflare Workers integration
import { apiClient } from '../api/client';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export interface D1QueryOptions {
  params?: any[];
  timeout?: number;
  retries?: number;
}

export interface D1BatchOperation {
  sql: string;
  params?: any[];
}

export interface D1QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

class D1Service {
  private readonly baseUrl = '/api/d1';

  /**
   * Execute a single SQL query
   */
  async query<T = any>(
    sql: string, 
    params: any[] = [], 
    options: D1QueryOptions = {}
  ): Promise<D1QueryResult<T>> {
    try {
      const response = await apiClient.post<ApiResponse<D1QueryResult<T>>>(
        `${this.baseUrl}/query`,
        {
          sql,
          params,
          options,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'D1 query failed');
      }

      return response.data!;
    } catch (error) {
      console.error('D1 query error:', error);
      throw error;
    }
  }

  /**
   * Execute multiple SQL queries in a batch
   */
  async batch<T = any>(
    operations: D1BatchOperation[],
    options: D1QueryOptions = {}
  ): Promise<D1QueryResult<T>[]> {
    try {
      const response = await apiClient.post<ApiResponse<D1QueryResult<T>[]>>(
        `${this.baseUrl}/batch`,
        {
          operations,
          options,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'D1 batch operation failed');
      }

      return response.data!;
    } catch (error) {
      console.error('D1 batch error:', error);
      throw error;
    }
  }

  /**
   * Execute a prepared statement
   */
  async prepare<T = any>(
    sql: string,
    params: any[] = []
  ): Promise<D1QueryResult<T>> {
    return this.query<T>(sql, params);
  }

  /**
   * Get database schema information
   */
  async getSchema(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse>(
        `${this.baseUrl}/schema`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get schema');
      }

      return response.data;
    } catch (error) {
      console.error('Get schema error:', error);
      throw error;
    }
  }

  /**
   * Get table information
   */
  async getTableInfo(tableName: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse>(
        `${this.baseUrl}/tables/${tableName}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get table info');
      }

      return response.data;
    } catch (error) {
      console.error('Get table info error:', error);
      throw error;
    }
  }

  /**
   * Execute database migrations
   */
  async migrate(version?: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse>(
        `${this.baseUrl}/migrate`,
        { version }
      );

      if (!response.success) {
        throw new Error(response.message || 'Migration failed');
      }

      return response.data;
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse>(
        `${this.baseUrl}/stats`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get stats');
      }

      return response.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }

  /**
   * Backup database
   */
  async backup(): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse>(
        `${this.baseUrl}/backup`
      );

      if (!response.success) {
        throw new Error(response.message || 'Backup failed');
      }

      return response.data;
    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restore(backupId: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse>(
        `${this.baseUrl}/restore`,
        { backupId }
      );

      if (!response.success) {
        throw new Error(response.message || 'Restore failed');
      }

      return response.data;
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  }

  // Convenience methods for common operations

  /**
   * Insert a single record
   */
  async insert<T = any>(
    table: string,
    data: Record<string, any>
  ): Promise<D1QueryResult<T>> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    return this.query<T>(sql, values);
  }

  /**
   * Update records
   */
  async update<T = any>(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = []
  ): Promise<D1QueryResult<T>> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    
    return this.query<T>(sql, [...values, ...whereParams]);
  }

  /**
   * Delete records
   */
  async delete<T = any>(
    table: string,
    where: string,
    whereParams: any[] = []
  ): Promise<D1QueryResult<T>> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    
    return this.query<T>(sql, whereParams);
  }

  /**
   * Select records with pagination
   */
  async select<T = any>(
    table: string,
    options: {
      columns?: string[];
      where?: string;
      whereParams?: any[];
      orderBy?: string;
      limit?: number;
      offset?: number;
      joins?: string[];
    } = {}
  ): Promise<D1QueryResult<T>> {
    const {
      columns = ['*'],
      where,
      whereParams = [],
      orderBy,
      limit,
      offset,
      joins = [],
    } = options;

    let sql = `SELECT ${columns.join(', ')} FROM ${table}`;
    
    if (joins.length > 0) {
      sql += ' ' + joins.join(' ');
    }
    
    if (where) {
      sql += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    if (offset) {
      sql += ` OFFSET ${offset}`;
    }

    return this.query<T>(sql, whereParams);
  }

  /**
   * Count records
   */
  async count(
    table: string,
    where?: string,
    whereParams: any[] = []
  ): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    
    if (where) {
      sql += ` WHERE ${where}`;
    }

    const result = await this.query<{ count: number }>(sql, whereParams);
    return result.results[0]?.count || 0;
  }
}

// Create and export singleton instance
export const d1Service = new D1Service();

// Export class for custom instances
export { D1Service };
