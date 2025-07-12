import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  position?: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: Omit<User, 'password'>;
}

class AuthService {
  async login(db: D1Database, email: string, password: string): Promise<AuthResult> {
    try {
      const user = await db
        .prepare('SELECT * FROM users WHERE email = ? AND active = 1')
        .bind(email)
        .first();

      if (!user) {
        return {
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password as string);
      
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        };
      }

      // Update last login
      await db
        .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(user.id)
        .run();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user as any;

      return {
        success: true,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error('Login service error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đăng nhập',
      };
    }
  }

  async register(db: D1Database, userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await db
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(userData.email)
        .first();

      if (existingUser) {
        return {
          success: false,
          message: 'Email đã được sử dụng',
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userId = crypto.randomUUID();

      // Create user
      await db
        .prepare(`
          INSERT INTO users (id, email, password, name, role, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(userId, userData.email, hashedPassword, userData.name, userData.role)
        .run();

      // Get created user
      const user = await db
        .prepare('SELECT id, email, name, role, active, created_at, updated_at FROM users WHERE id = ?')
        .bind(userId)
        .first();

      return {
        success: true,
        user: user as any,
      };
    } catch (error) {
      console.error('Register service error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tạo tài khoản',
      };
    }
  }

  async getUserById(db: D1Database, userId: string): Promise<AuthResult> {
    try {
      const user = await db
        .prepare(`
          SELECT id, email, name, role, phone, position, avatar, active, created_at, updated_at 
          FROM users WHERE id = ? AND active = 1
        `)
        .bind(userId)
        .first();

      if (!user) {
        return {
          success: false,
          message: 'Người dùng không tồn tại',
        };
      }

      return {
        success: true,
        user: user as any,
      };
    } catch (error) {
      console.error('Get user by ID service error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin người dùng',
      };
    }
  }

  async updateProfile(db: D1Database, userId: string, updateData: {
    name?: string;
    phone?: string;
    position?: string;
  }): Promise<AuthResult> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (updateData.name) {
        updates.push('name = ?');
        values.push(updateData.name);
      }
      if (updateData.phone) {
        updates.push('phone = ?');
        values.push(updateData.phone);
      }
      if (updateData.position) {
        updates.push('position = ?');
        values.push(updateData.position);
      }

      if (updates.length === 0) {
        return {
          success: false,
          message: 'Không có dữ liệu để cập nhật',
        };
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      await db
        .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();

      // Get updated user
      const user = await this.getUserById(db, userId);
      return user;
    } catch (error) {
      console.error('Update profile service error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật thông tin',
      };
    }
  }

  async changePassword(db: D1Database, userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      // Get current user
      const user = await db
        .prepare('SELECT password FROM users WHERE id = ? AND active = 1')
        .bind(userId)
        .first();

      if (!user) {
        return {
          success: false,
          message: 'Người dùng không tồn tại',
        };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password as string);
      
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Mật khẩu hiện tại không đúng',
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db
        .prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(hashedPassword, userId)
        .run();

      return {
        success: true,
        message: 'Đổi mật khẩu thành công',
      };
    } catch (error) {
      console.error('Change password service error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đổi mật khẩu',
      };
    }
  }
}

export const authService = new AuthService();
