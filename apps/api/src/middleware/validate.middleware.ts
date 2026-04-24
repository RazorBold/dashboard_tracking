import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ─── Zod Request Validation Middleware ───────────────
export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }
    // Replace request data with parsed/coerced values
    req[source] = result.data;
    next();
  };
