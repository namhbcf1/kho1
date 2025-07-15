import { z } from 'zod';
export const validateMiddleware = (schema) => {
    return async (c, next) => {
        try {
            const body = await c.req.json();
            const validatedData = schema.parse(body);
            // Store validated data in context
            c.set('validatedData', validatedData);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: error.errors.map(err => ({
                            field: err.path.join('.'),
                            message: err.message
                        }))
                    }
                }, 400);
            }
            return c.json({
                success: false,
                error: {
                    code: 'INVALID_JSON',
                    message: 'Invalid JSON in request body'
                }
            }, 400);
        }
    };
};
