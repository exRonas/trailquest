import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { isProd } from '../config/env';

/**
 * Unified error response shape returned by every endpoint:
 *   { error: { code, message, details? } }
 */
interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  const body: ErrorBody = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} does not exist`,
    },
  };
  res.status(404).json(body);
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[] | undefined)?.join(', ');
      return AppError.conflict(
        target ? `A record with this ${target} already exists` : 'Duplicate value',
      );
    }
    case 'P2025':
      return AppError.notFound('The requested record was not found');
    case 'P2003':
      return AppError.badRequest('Related record does not exist');
    default:
      return new AppError(400, 'DATABASE_ERROR', 'Database request failed');
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // next is required for Express to recognise this as an error handler.
  _next: NextFunction,
): void {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    appError = mapPrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    appError = AppError.badRequest('Invalid data sent to the database');
  } else if (err instanceof SyntaxError && 'body' in err) {
    appError = AppError.badRequest('Malformed JSON in request body');
  } else {
    appError = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
  }

  if (appError.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  const body: ErrorBody = {
    error: {
      code: appError.code,
      message: appError.message,
    },
  };
  if (appError.details !== undefined) {
    body.error.details = appError.details;
  }
  // Surface stack traces only outside production for unexpected errors.
  if (!isProd && appError.statusCode >= 500 && err instanceof Error) {
    (body.error as Record<string, unknown>).stack = err.stack;
  }

  res.status(appError.statusCode).json(body);
}
