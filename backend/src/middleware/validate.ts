import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * A request schema can constrain any subset of body / query / params.
 * Validated + coerced values are written back onto the request so handlers get
 * correctly typed input. Accepts any Zod schema (incl. `.refine()`-wrapped
 * effects), not just plain objects.
 */
export interface RequestSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

export function validate(schema: RequestSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) {
        // req.query is a getter-only on some Express versions; assign parsed
        // values onto the existing object rather than replacing it.
        const parsed = schema.query.parse(req.query);
        Object.assign(req.query, parsed);
      }
      if (schema.params) {
        const parsed = schema.params.parse(req.params);
        Object.assign(req.params, parsed);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(AppError.unprocessable('Validation failed', formatZodError(err)));
        return;
      }
      next(err);
    }
  };
}

// Re-export zod so schema files have a single import surface if desired.
export { z };
