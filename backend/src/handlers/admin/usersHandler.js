import bcrypt from 'bcryptjs';
export const usersHandler = {
    async getUsers(c) {
        try {
            const db = c.env.DB;
            const { page = 1, limit = 20, role, active } = c.req.query();
            let whereClause = 'WHERE 1=1';
            const params = [];
            if (role) {
                whereClause += ' AND role = ?';
                params.push(role);
            }
            if (active !== undefined) {
                whereClause += ' AND active = ?';
                params.push(active === 'true' ? 1 : 0);
            }
            const offset = (Number(page) - 1) * Number(limit);
            const users = await db.prepare(`
        SELECT id, name, email, role, active, last_login, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, Number(limit), offset).all();
            const totalResult = await db.prepare(`
        SELECT COUNT(*) as total FROM users ${whereClause}
      `).bind(...params).first();
            return c.json({
                success: true,
                data: {
                    users: users.results || [],
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
            console.error('Get users error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'USERS_ERROR',
                    message: 'Failed to fetch users',
                },
            }, 500);
        }
    },
    async getUserById(c) {
        try {
            const db = c.env.DB;
            const { id } = c.req.param();
            const user = await db.prepare(`
        SELECT id, name, email, role, active, last_login, created_at, updated_at
        FROM users 
        WHERE id = ?
      `).bind(id).first();
            if (!user) {
                return c.json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                }, 404);
            }
            return c.json({
                success: true,
                data: { user },
            });
        }
        catch (error) {
            console.error('Get user error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'USER_ERROR',
                    message: 'Failed to fetch user',
                },
            }, 500);
        }
    },
    async createUser(c) {
        try {
            const db = c.env.DB;
            const { name, email, password, role = 'staff', active = true } = await c.req.json();
            // Check if email already exists
            const existingUser = await db.prepare(`
        SELECT id FROM users WHERE email = ?
      `).bind(email).first();
            if (existingUser) {
                return c.json({
                    success: false,
                    error: {
                        code: 'EMAIL_EXISTS',
                        message: 'Email already exists',
                    },
                }, 409);
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = crypto.randomUUID();
            await db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(userId, name, email, hashedPassword, role, active ? 1 : 0).run();
            const user = await db.prepare(`
        SELECT id, name, email, role, active, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(userId).first();
            return c.json({
                success: true,
                data: { user },
            }, 201);
        }
        catch (error) {
            console.error('Create user error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'USER_CREATE_ERROR',
                    message: 'Failed to create user',
                },
            }, 500);
        }
    },
    async updateUser(c) {
        try {
            const db = c.env.DB;
            const { id } = c.req.param();
            const { name, email, role, active } = await c.req.json();
            // Check if user exists
            const existingUser = await db.prepare(`
        SELECT id FROM users WHERE id = ?
      `).bind(id).first();
            if (!existingUser) {
                return c.json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                }, 404);
            }
            // Check if email is taken by another user
            if (email) {
                const emailUser = await db.prepare(`
          SELECT id FROM users WHERE email = ? AND id != ?
        `).bind(email, id).first();
                if (emailUser) {
                    return c.json({
                        success: false,
                        error: {
                            code: 'EMAIL_EXISTS',
                            message: 'Email already exists',
                        },
                    }, 409);
                }
            }
            const updates = [];
            const params = [];
            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                params.push(email);
            }
            if (role !== undefined) {
                updates.push('role = ?');
                params.push(role);
            }
            if (active !== undefined) {
                updates.push('active = ?');
                params.push(active ? 1 : 0);
            }
            if (updates.length > 0) {
                updates.push('updated_at = datetime(\'now\')');
                params.push(id);
                await db.prepare(`
          UPDATE users SET ${updates.join(', ')} WHERE id = ?
        `).bind(...params).run();
            }
            const user = await db.prepare(`
        SELECT id, name, email, role, active, last_login, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(id).first();
            return c.json({
                success: true,
                data: { user },
            });
        }
        catch (error) {
            console.error('Update user error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'USER_UPDATE_ERROR',
                    message: 'Failed to update user',
                },
            }, 500);
        }
    },
    async deleteUser(c) {
        try {
            const db = c.env.DB;
            const { id } = c.req.param();
            // Check if user exists
            const existingUser = await db.prepare(`
        SELECT id FROM users WHERE id = ?
      `).bind(id).first();
            if (!existingUser) {
                return c.json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                }, 404);
            }
            await db.prepare(`
        DELETE FROM users WHERE id = ?
      `).bind(id).run();
            return c.json({
                success: true,
                data: { message: 'User deleted successfully' },
            });
        }
        catch (error) {
            console.error('Delete user error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'USER_DELETE_ERROR',
                    message: 'Failed to delete user',
                },
            }, 500);
        }
    },
    async changeUserPassword(c) {
        try {
            const db = c.env.DB;
            const { id } = c.req.param();
            const { newPassword } = await c.req.json();
            // Check if user exists
            const existingUser = await db.prepare(`
        SELECT id FROM users WHERE id = ?
      `).bind(id).first();
            if (!existingUser) {
                return c.json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                }, 404);
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.prepare(`
        UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(hashedPassword, id).run();
            return c.json({
                success: true,
                data: { message: 'Password changed successfully' },
            });
        }
        catch (error) {
            console.error('Change password error:', error);
            return c.json({
                success: false,
                error: {
                    code: 'PASSWORD_CHANGE_ERROR',
                    message: 'Failed to change password',
                },
            }, 500);
        }
    },
};
