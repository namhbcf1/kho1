import { Hono } from 'hono';
import { uploadService } from '../services/uploadService';
import type { Env } from '../index';

const uploadRoutes = new Hono<{ Bindings: Env }>();

// Upload image
uploadRoutes.post('/image', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({
        success: false,
        message: 'Không có file được tải lên',
      }, 400);
    }

    const result = await uploadService.uploadImage(c.env.STORAGE, file);
    return c.json(result);
  } catch (error) {
    console.error('Upload image error:', error);
    return c.json({
      success: false,
      message: 'Có lỗi xảy ra khi tải file',
    }, 500);
  }
});

// Upload avatar
uploadRoutes.post('/avatar', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const user = c.get('user');
    
    if (!file) {
      return c.json({
        success: false,
        message: 'Không có file được tải lên',
      }, 400);
    }

    const result = await uploadService.uploadAvatar(c.env.STORAGE, file, user.id);
    return c.json(result);
  } catch (error) {
    console.error('Upload avatar error:', error);
    return c.json({
      success: false,
      message: 'Có lỗi xảy ra khi tải avatar',
    }, 500);
  }
});

export { uploadRoutes };
