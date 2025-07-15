export const presignedUrlHandler = {
    async generateUploadUrl(c) {
        try {
            const r2 = c.env.R2;
            if (!r2) {
                return c.json({
                    success: false,
                    error: {
                        code: 'R2_NOT_CONFIGURED',
                        message: 'R2 storage not configured',
                    },
                }, 500);
            }
            const { filename, contentType, folder = 'uploads', expiresIn = 3600 } = await c.req.json();
            if (!filename) {
                return c.json({
                    success: false,
                    error: {
                        code: 'MISSING_FILENAME',
                        message: 'Filename is required',
                    },
                }, 400);
            }
            // Validate content type
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/webp', 'image/gif',
                'application/pdf', 'text/csv', 'application/json',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            if (contentType && !allowedTypes.includes(contentType)) {
                return c.json({
                    success: false,
                    error: {
                        code: 'INVALID_CONTENT_TYPE',
                        message: 'Content type not allowed',
                    },
                }, 400);
            }
            // Generate unique key
            const fileExtension = filename.split('.').pop();
            const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
            const key = `${folder}/${uniqueFilename}`;
            // Generate presigned URL for upload
            const uploadUrl = await r2.createPresignedUrl('PUT', key, {
                expiresIn,
                httpMetadata: contentType ? { contentType } : undefined,
                customMetadata: {
                    originalName: filename,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: c.get('user')?.id || 'anonymous',
                },
            });
            // Store pending upload in database
            const db = c.env.DB;
            const uploadId = crypto.randomUUID();
            await db.prepare(`
        INSERT INTO pending_uploads (
          id, key, original_name, filename, content_type, folder, 
          uploaded_by, expires_at, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+${expiresIn} seconds'), datetime('now'))
      `).bind(uploadId, key, filename, uniqueFilename, contentType, folder, c.get('user')?.id || 'anonymous').run();
            return c.json({
                success: true,
                data: {
                    uploadId,
                    uploadUrl,
                    key,
                    filename: uniqueFilename,
                    expiresIn,
                    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
                },
            });
        }
        catch (error) {
            console.error('Generate upload URL error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'PRESIGNED_URL_ERROR',
                    message: 'Failed to generate upload URL',
                },
            }, 500);
        }
    },
    async generateDownloadUrl(c) {
        try {
            const r2 = c.env.R2;
            if (!r2) {
                return c.json({
                    success: false,
                    error: {
                        code: 'R2_NOT_CONFIGURED',
                        message: 'R2 storage not configured',
                    },
                }, 500);
            }
            const { key, expiresIn = 3600 } = await c.req.json();
            if (!key) {
                return c.json({
                    success: false,
                    error: {
                        code: 'MISSING_KEY',
                        message: 'File key is required',
                    },
                }, 400);
            }
            // Check if file exists
            const object = await r2.head(key);
            if (!object) {
                return c.json({
                    success: false,
                    error: {
                        code: 'FILE_NOT_FOUND',
                        message: 'File not found',
                    },
                }, 404);
            }
            // Generate presigned URL for download
            const downloadUrl = await r2.createPresignedUrl('GET', key, {
                expiresIn,
            });
            return c.json({
                success: true,
                data: {
                    downloadUrl,
                    key,
                    expiresIn,
                    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
                },
            });
        }
        catch (error) {
            console.error('Generate download URL error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'PRESIGNED_URL_ERROR',
                    message: 'Failed to generate download URL',
                },
            }, 500);
        }
    },
    async confirmUpload(c) {
        try {
            const { uploadId } = c.req.param();
            const db = c.env.DB;
            const r2 = c.env.R2;
            if (!r2) {
                return c.json({
                    success: false,
                    error: {
                        code: 'R2_NOT_CONFIGURED',
                        message: 'R2 storage not configured',
                    },
                }, 500);
            }
            // Get pending upload
            const pendingUpload = await db.prepare(`
        SELECT * FROM pending_uploads WHERE id = ?
      `).bind(uploadId).first();
            if (!pendingUpload) {
                return c.json({
                    success: false,
                    error: {
                        code: 'UPLOAD_NOT_FOUND',
                        message: 'Upload not found',
                    },
                }, 404);
            }
            // Check if upload has expired
            const now = new Date();
            const expiresAt = new Date(pendingUpload.expires_at);
            if (now > expiresAt) {
                return c.json({
                    success: false,
                    error: {
                        code: 'UPLOAD_EXPIRED',
                        message: 'Upload has expired',
                    },
                }, 400);
            }
            // Verify file exists in R2
            const object = await r2.head(pendingUpload.key);
            if (!object) {
                return c.json({
                    success: false,
                    error: {
                        code: 'FILE_NOT_UPLOADED',
                        message: 'File was not uploaded',
                    },
                }, 400);
            }
            // Move to permanent files table
            const fileId = crypto.randomUUID();
            await db.prepare(`
        INSERT INTO files (
          id, original_name, filename, key, size, mime_type, 
          folder, uploaded_by, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(fileId, pendingUpload.original_name, pendingUpload.filename, pendingUpload.key, object.size, pendingUpload.content_type, pendingUpload.folder, pendingUpload.uploaded_by).run();
            // Remove from pending uploads
            await db.prepare(`
        DELETE FROM pending_uploads WHERE id = ?
      `).bind(uploadId).run();
            return c.json({
                success: true,
                data: {
                    file: {
                        id: fileId,
                        originalName: pendingUpload.original_name,
                        filename: pendingUpload.filename,
                        key: pendingUpload.key,
                        size: object.size,
                        mimeType: pendingUpload.content_type,
                        url: `/api/files/${fileId}`,
                    },
                },
            });
        }
        catch (error) {
            console.error('Confirm upload error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'CONFIRM_UPLOAD_ERROR',
                    message: 'Failed to confirm upload',
                },
            }, 500);
        }
    },
    async cleanupExpiredUploads(c) {
        try {
            const db = c.env.DB;
            const r2 = c.env.R2;
            if (!r2) {
                return c.json({
                    success: false,
                    error: {
                        code: 'R2_NOT_CONFIGURED',
                        message: 'R2 storage not configured',
                    },
                }, 500);
            }
            // Get expired uploads
            const expiredUploads = await db.prepare(`
        SELECT key FROM pending_uploads 
        WHERE expires_at < datetime('now')
      `).all();
            let cleanedCount = 0;
            for (const upload of expiredUploads.results || []) {
                try {
                    // Delete from R2
                    await r2.delete(upload.key);
                    cleanedCount++;
                }
                catch (deleteError) {
                    console.warn(`Failed to delete expired upload ${upload.key}:`, deleteError);
                }
            }
            // Remove expired records from database
            await db.prepare(`
        DELETE FROM pending_uploads WHERE expires_at < datetime('now')
      `).run();
            return c.json({
                success: true,
                data: {
                    message: `Cleaned up ${cleanedCount} expired uploads`,
                    cleanedCount,
                },
            });
        }
        catch (error) {
            console.error('Cleanup expired uploads error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'CLEANUP_ERROR',
                    message: 'Failed to cleanup expired uploads',
                },
            }, 500);
        }
    },
};
