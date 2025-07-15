export const backupHandler = {
    async createBackup(c) {
        try {
            const db = c.env.DB;
            const r2 = c.env.R2;
            const backupId = crypto.randomUUID();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}.sql`;
            // Get all table schemas and data
            const tables = await db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
            let sqlDump = '';
            // Add table creation statements and data
            for (const table of tables.results || []) {
                // Get table schema
                const schema = await db.prepare(`
          SELECT sql FROM sqlite_master 
          WHERE type='table' AND name = ?
        `).bind(table.name).first();
                if (schema?.sql) {
                    sqlDump += `${schema.sql};\n\n`;
                }
                // Get table data
                const data = await db.prepare(`SELECT * FROM ${table.name}`).all();
                if (data.results && data.results.length > 0) {
                    const columns = Object.keys(data.results[0]);
                    const columnsList = columns.join(', ');
                    for (const row of data.results) {
                        const values = columns.map(col => {
                            const value = row[col];
                            if (value === null)
                                return 'NULL';
                            if (typeof value === 'string')
                                return `'${value.replace(/'/g, "''")}'`;
                            return value;
                        }).join(', ');
                        sqlDump += `INSERT INTO ${table.name} (${columnsList}) VALUES (${values});\n`;
                    }
                    sqlDump += '\n';
                }
            }
            // Upload to R2 if available
            let cloudUrl = null;
            if (r2) {
                try {
                    await r2.put(`backups/${filename}`, sqlDump, {
                        httpMetadata: {
                            contentType: 'application/sql',
                        },
                    });
                    cloudUrl = `backups/${filename}`;
                }
                catch (r2Error) {
                    console.warn('Failed to upload backup to R2:', r2Error);
                }
            }
            // Store backup metadata
            await db.prepare(`
        INSERT INTO backups (id, filename, size, type, status, cloud_url, created_at)
        VALUES (?, ?, ?, 'manual', 'completed', ?, datetime('now'))
      `).bind(backupId, filename, sqlDump.length, cloudUrl).run();
            return c.json({
                success: true,
                data: {
                    backup: {
                        id: backupId,
                        filename,
                        size: sqlDump.length,
                        type: 'manual',
                        status: 'completed',
                        cloudUrl,
                        createdAt: new Date().toISOString(),
                    },
                },
            });
        }
        catch (error) {
            console.error('Create backup error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'BACKUP_ERROR',
                    message: 'Failed to create backup',
                },
            }, 500);
        }
    },
    async getBackupHistory(c) {
        try {
            const db = c.env.DB;
            const { page = 1, limit = 20 } = c.req.query();
            const offset = (Number(page) - 1) * Number(limit);
            const backups = await db.prepare(`
        SELECT id, filename, size, type, status, cloud_url, created_at
        FROM backups 
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(Number(limit), offset).all();
            const totalResult = await db.prepare(`
        SELECT COUNT(*) as total FROM backups
      `).first();
            return c.json({
                success: true,
                data: {
                    backups: backups.results || [],
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: totalResult?.total || 0,
                        totalPages: Math.ceil((totalResult?.total || 0) / Number(limit)),
                    },
                },
            });
        }
        catch (error) {
            console.error('Get backup history error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'BACKUP_ERROR',
                    message: 'Failed to fetch backup history',
                },
            }, 500);
        }
    },
    async downloadBackup(c) {
        try {
            const db = c.env.DB;
            const r2 = c.env.R2;
            const { id } = c.req.param();
            const backup = await db.prepare(`
        SELECT filename, cloud_url FROM backups WHERE id = ?
      `).bind(id).first();
            if (!backup) {
                return c.json({
                    success: false,
                    error: {
                        code: 'BACKUP_NOT_FOUND',
                        message: 'Backup not found',
                    },
                }, 404);
            }
            // Try to get from R2 first
            if (backup.cloud_url && r2) {
                try {
                    const object = await r2.get(backup.cloud_url);
                    if (object) {
                        return new Response(object.body, {
                            headers: {
                                'Content-Type': 'application/sql',
                                'Content-Disposition': `attachment; filename="${backup.filename}"`,
                            },
                        });
                    }
                }
                catch (r2Error) {
                    console.warn('Failed to download from R2:', r2Error);
                }
            }
            return c.json({
                success: false,
                error: {
                    code: 'BACKUP_NOT_AVAILABLE',
                    message: 'Backup file not available for download',
                },
            }, 404);
        }
        catch (error) {
            console.error('Download backup error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'BACKUP_ERROR',
                    message: 'Failed to download backup',
                },
            }, 500);
        }
    },
    async restoreBackup(c) {
        try {
            const db = c.env.DB;
            const r2 = c.env.R2;
            const { id } = c.req.param();
            const backup = await db.prepare(`
        SELECT filename, cloud_url FROM backups WHERE id = ?
      `).bind(id).first();
            if (!backup) {
                return c.json({
                    success: false,
                    error: {
                        code: 'BACKUP_NOT_FOUND',
                        message: 'Backup not found',
                    },
                }, 404);
            }
            // Get backup content from R2
            if (!backup.cloud_url || !r2) {
                return c.json({
                    success: false,
                    error: {
                        code: 'BACKUP_NOT_AVAILABLE',
                        message: 'Backup file not available for restore',
                    },
                }, 404);
            }
            const object = await r2.get(backup.cloud_url);
            if (!object) {
                return c.json({
                    success: false,
                    error: {
                        code: 'BACKUP_NOT_FOUND',
                        message: 'Backup file not found in storage',
                    },
                }, 404);
            }
            const sqlContent = await object.text();
            // Execute SQL statements
            const statements = sqlContent.split(';').filter(stmt => stmt.trim());
            for (const statement of statements) {
                if (statement.trim()) {
                    await db.prepare(statement.trim()).run();
                }
            }
            return c.json({
                success: true,
                data: { message: 'Backup restored successfully' },
            });
        }
        catch (error) {
            console.error('Restore backup error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'RESTORE_ERROR',
                    message: 'Failed to restore backup',
                },
            }, 500);
        }
    },
    async deleteBackup(c) {
        try {
            const db = c.env.DB;
            const r2 = c.env.R2;
            const { id } = c.req.param();
            const backup = await db.prepare(`
        SELECT cloud_url FROM backups WHERE id = ?
      `).bind(id).first();
            if (!backup) {
                return c.json({
                    success: false,
                    error: {
                        code: 'BACKUP_NOT_FOUND',
                        message: 'Backup not found',
                    },
                }, 404);
            }
            // Delete from R2 if exists
            if (backup.cloud_url && r2) {
                try {
                    await r2.delete(backup.cloud_url);
                }
                catch (r2Error) {
                    console.warn('Failed to delete from R2:', r2Error);
                }
            }
            // Delete from database
            await db.prepare(`
        DELETE FROM backups WHERE id = ?
      `).bind(id).run();
            return c.json({
                success: true,
                data: { message: 'Backup deleted successfully' },
            });
        }
        catch (error) {
            console.error('Delete backup error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'BACKUP_ERROR',
                    message: 'Failed to delete backup',
                },
            }, 500);
        }
    },
};
