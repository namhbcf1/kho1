// Image processing handler
import { Context } from 'hono';

export const imageHandler = {
  async uploadImage(c: Context) {
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
      const image = formData.get('image') as File;
      
      if (!image) {
        return c.json({
          success: false,
          error: {
            code: 'NO_IMAGE',
            message: 'No image provided',
          },
        }, 400);
      }

      // Validate image type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(image.type)) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_IMAGE_TYPE',
            message: 'Only JPEG, PNG, WebP, and GIF images are allowed',
          },
        }, 400);
      }

      // Validate image size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (image.size > maxSize) {
        return c.json({
          success: false,
          error: {
            code: 'IMAGE_TOO_LARGE',
            message: 'Image size exceeds 5MB limit',
          },
        }, 400);
      }

      // Generate unique filename
      const fileExtension = image.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const folder = formData.get('folder') || 'images';
      const key = `${folder}/${fileName}`;

      // Upload original image to R2
      await r2.put(key, image.stream(), {
        httpMetadata: {
          contentType: image.type,
        },
        customMetadata: {
          originalName: image.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: c.get('user')?.id || 'anonymous',
          imageType: 'original',
        },
      });

      // Generate thumbnails (simplified - in production you'd use image processing)
      const thumbnailSizes = [
        { name: 'thumbnail', width: 150, height: 150 },
        { name: 'small', width: 300, height: 300 },
        { name: 'medium', width: 600, height: 600 },
      ];

      const variants = [];
      for (const size of thumbnailSizes) {
        const thumbnailKey = `${folder}/thumbnails/${size.name}_${fileName}`;
        
        // In a real implementation, you would resize the image here
        // For now, we'll just store the original image as thumbnails
        await r2.put(thumbnailKey, image.stream(), {
          httpMetadata: {
            contentType: image.type,
          },
          customMetadata: {
            originalName: image.name,
            uploadedAt: new Date().toISOString(),
            uploadedBy: c.get('user')?.id || 'anonymous',
            imageType: size.name,
            width: size.width.toString(),
            height: size.height.toString(),
          },
        });

        variants.push({
          type: size.name,
          key: thumbnailKey,
          width: size.width,
          height: size.height,
          url: `/api/images/${fileName}?size=${size.name}`,
        });
      }

      // Store image metadata in database
      const db = c.env.DB;
      const imageId = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO images (
          id, original_name, filename, key, size, mime_type, 
          folder, variants, uploaded_by, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        imageId,
        image.name,
        fileName,
        key,
        image.size,
        image.type,
        folder,
        JSON.stringify(variants),
        c.get('user')?.id || 'anonymous'
      ).run();

      return c.json({
        success: true,
        data: {
          image: {
            id: imageId,
            originalName: image.name,
            filename: fileName,
            key,
            size: image.size,
            mimeType: image.type,
            url: `/api/images/${imageId}`,
            variants,
          },
        },
      });
    } catch (error) {
      console.error('Image upload error:', error);
      return c.json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload image',
        },
      }, 500);
    }
  },

  async getImage(c: Context) {
    try {
      const { id } = c.req.param();
      const { size } = c.req.query();
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

      // Get image metadata from database
      const imageRecord = await db.prepare(`
        SELECT * FROM images WHERE id = ? OR filename = ?
      `).bind(id, id).first();

      if (!imageRecord) {
        return c.json({
          success: false,
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: 'Image not found',
          },
        }, 404);
      }

      let key = imageRecord.key;

      // If size is specified, try to get the variant
      if (size && imageRecord.variants) {
        try {
          const variants = JSON.parse(imageRecord.variants);
          const variant = variants.find((v: any) => v.type === size);
          if (variant) {
            key = variant.key;
          }
        } catch (parseError) {
          console.warn('Failed to parse image variants:', parseError);
        }
      }

      // Get image from R2
      const object = await r2.get(key);
      
      if (!object) {
        return c.json({
          success: false,
          error: {
            code: 'IMAGE_NOT_FOUND_IN_STORAGE',
            message: 'Image not found in storage',
          },
        }, 404);
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': imageRecord.mime_type,
          'Cache-Control': 'public, max-age=31536000', // 1 year
          'ETag': object.etag,
        },
      });
    } catch (error) {
      console.error('Get image error:', error);
      return c.json({
        success: false,
        error: {
          code: 'IMAGE_ERROR',
          message: 'Failed to retrieve image',
        },
      }, 500);
    }
  },

  async deleteImage(c: Context) {
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

      // Get image metadata from database
      const imageRecord = await db.prepare(`
        SELECT * FROM images WHERE id = ?
      `).bind(id).first();

      if (!imageRecord) {
        return c.json({
          success: false,
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: 'Image not found',
          },
        }, 404);
      }

      // Delete original image from R2
      await r2.delete(imageRecord.key);

      // Delete variants from R2
      if (imageRecord.variants) {
        try {
          const variants = JSON.parse(imageRecord.variants);
          for (const variant of variants) {
            await r2.delete(variant.key);
          }
        } catch (parseError) {
          console.warn('Failed to parse image variants for deletion:', parseError);
        }
      }

      // Delete from database
      await db.prepare(`
        DELETE FROM images WHERE id = ?
      `).bind(id).run();

      return c.json({
        success: true,
        data: { message: 'Image deleted successfully' },
      });
    } catch (error) {
      console.error('Delete image error:', error);
      return c.json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete image',
        },
      }, 500);
    }
  },

  async listImages(c: Context) {
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

      const images = await db.prepare(`
        SELECT id, original_name, filename, size, mime_type, folder, variants, created_at
        FROM images 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, Number(limit), offset).all();

      const totalResult = await db.prepare(`
        SELECT COUNT(*) as total FROM images ${whereClause}
      `).bind(...params).first();

      // Parse variants for each image
      const imagesWithVariants = (images.results || []).map((image: any) => ({
        ...image,
        variants: image.variants ? JSON.parse(image.variants) : [],
        url: `/api/images/${image.id}`,
      }));

      return c.json({
        success: true,
        data: {
          images: imagesWithVariants,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalResult?.total || 0,
            totalPages: Math.ceil((totalResult?.total || 0) / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('List images error:', error);
      return c.json({
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: 'Failed to list images',
        },
      }, 500);
    }
  },
};
