// Session management middleware
import { Context, Next } from 'hono';

export const sessionMiddleware = async (c: Context, next: Next) => {
  try {
    const kv = c.env.KV;
    if (!kv) {
      return next();
    }

    const sessionId = c.req.header('X-Session-ID') || c.req.query('sessionId');
    
    if (sessionId) {
      // Get session data from KV
      const sessionData = await kv.get(`session:${sessionId}`);
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          c.set('session', session);
          c.set('sessionId', sessionId);
          
          // Update session last activity
          session.lastActivity = new Date().toISOString();
          await kv.put(`session:${sessionId}`, JSON.stringify(session), {
            expirationTtl: 24 * 60 * 60, // 24 hours
          });
        } catch (parseError) {
          console.warn('Failed to parse session data:', parseError);
        }
      }
    }

    await next();
  } catch (error) {
    console.error('Session middleware error:', error);
    await next();
  }
};

export const createSession = async (c: Context, userId: string, userData: any) => {
  try {
    const kv = c.env.KV;
    if (!kv) {
      return null;
    }

    const sessionId = crypto.randomUUID();
    const session = {
      userId,
      userData,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      userAgent: c.req.header('User-Agent'),
    };

    await kv.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: 24 * 60 * 60, // 24 hours
    });

    return sessionId;
  } catch (error) {
    console.error('Create session error:', error);
    return null;
  }
};

export const destroySession = async (c: Context, sessionId: string) => {
  try {
    const kv = c.env.KV;
    if (!kv) {
      return false;
    }

    await kv.delete(`session:${sessionId}`);
    return true;
  } catch (error) {
    console.error('Destroy session error:', error);
    return false;
  }
};

export const getActiveSessionsForUser = async (c: Context, userId: string) => {
  try {
    const kv = c.env.KV;
    if (!kv) {
      return [];
    }

    // This is a simplified implementation
    // In a real scenario, you might want to maintain a separate index
    const sessions = [];
    const list = await kv.list({ prefix: 'session:' });
    
    for (const key of list.keys) {
      const sessionData = await kv.get(key.name);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.userId === userId) {
            sessions.push({
              sessionId: key.name.replace('session:', ''),
              ...session,
            });
          }
        } catch (parseError) {
          console.warn('Failed to parse session data:', parseError);
        }
      }
    }

    return sessions;
  } catch (error) {
    console.error('Get active sessions error:', error);
    return [];
  }
};
