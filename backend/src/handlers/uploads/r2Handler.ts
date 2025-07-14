// R2 file upload handler
import { Context } from 'hono';

export const r2Handler = {
  async uploadFile(c: Context) {
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

      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return c.json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
          },
        }, 400);
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return c.json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 10MB limit',
          },
        }, 400);
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const folder = formData.get('folder') || 'uploads';
      const key = `${folder}/${fileName}`;

      // Upload to R2
      await r2.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: c.get('user')?.id || 'anonymous',
        },
      });

      // Store file metadata in database
      const db = c.env.DB;
      const fileId = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO files (
          id, original_name, filename, key, size, mime_type, 
          folder, uploaded_by, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        fileId,
        file.name,
        fileName,
        key,
        file.size,
        file.type,
        folder,
        c.get('user')?.id || 'anonymous'
      ).run();

      return c.json({
        success: true,
        data: {
          file: {
            id: fileId,
            originalName: file.name,
            filename: fileName,
            key,
            size: file.size,
            mimeType: file.type,
            url: `/api/files/${fileId}`,
          },
        },
      });
    } catch (error) {
      console.error('R2 upload error:', error);
      return c.json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload file',
        },
      }, 500);
    }
  },

  async getFile(c: Context) {
    try {
      const { id } = c.req.param();
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

      // Get file metadata from database
      const fileRecord = await db.prepare(`
        SELECT * FROM files WHERE id = ?
      `).bind(id).first();

      if (!fileRecord) {
        return c.json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found',
          },
        }, 404);
      }

      // Get file from R2
      const object = await r2.get(fileRecord.key);
      
      if (!object) {
        return c.json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND_IN_STORAGE',
            message: 'File not found in storage',
          },
        }, 404);
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': fileRecord.mime_type,
          'Content-Length': fileRecord.size.toString(),
          'Cache-Control': 'public, max-age=31536000', // 1 year
        },
      });
    } catch (error) {
      console.error('Get file error:', error);
      return c.json({
        success: false,
        error: {
          code: 'FILE_ERROR',
          message: 'Failed to retrieve file',
        },
      }, 500);
    }
  },

  async deleteFile(c: Context) {
    try {
      const { id } = c.req.param();
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

      // Get file metadata from database
      const fileRecord = await db.prepare(`
        SELECT * FROM files WHERE id = ?
      `).bind(id).first();

      if (!fileRecord) {
        return c.json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found',
          },
        }, 404);
      }

      // Delete from R2
      await r2.delete(fileRecord.key);

      // Delete from database
      await db.prepare(`
        DELETE FROM files WHERE id = ?
      `).bind(id).run();

      return c.json({
        success: true,
        data: { message: 'File deleted successfully' },
      });
    } catch (error) {
      console.error('Delete file error:', error);
      return c.json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete file',
        },
      }, 500);
    }
  },

  async listFiles(c: Context) {
    try {
      const db = c.env.DB;
      const { folder, page = 1, limit = 20 } = c.req.query();

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (folder) {
        whereClause += ' AND folder = ?';
        params.push(folder);
      }

      const offset = (Number(page) - 1) * Number(limit);

      const files = await db.prepare(`
        SELECT id, original_name, filename, size, mime_type, folder, created_at
        FROM files 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, Number(limit), offset).all();

      const totalResult = await db.prepare(`
        SELECT COUNT(*) as total FROM files ${whereClause}
      `).bind(...params).first();

      return c.json({
        success: true,
        data: {
          files: files.results || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalResult?.total || 0,
            totalPages: Math.ceil((totalResult?.total || 0) / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('List files error:', error);
      return c.json({
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: 'Failed to list files',
        },
      }, 500);
    }
  },
};
