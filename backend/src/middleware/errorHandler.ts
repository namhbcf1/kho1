import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const errorHandler = (err: Error, c: Context) => {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      message: err.message,
    }, err.status);
  }

  // Database errors
  if (err.message.includes('UNIQUE constraint failed')) {
    return c.json({
      success: false,
      message: 'Dữ liệu đã tồn tại',
    }, 400);
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return c.json({
      success: false,
      message: 'Dữ liệu liên quan không tồn tại',
    }, 400);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return c.json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      details: err.message,
    }, 400);
  }

  // Default error
  return c.json({
    success: false,
    message: 'Có lỗi xảy ra trên máy chủ',
  }, 500);
};
