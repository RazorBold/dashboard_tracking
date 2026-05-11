import { Request, Response, NextFunction } from 'express';
import { logger } from '../config';

// ─── App Error Class ──────────────────────────────────
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ─── 404 Not Found Handler ────────────────────────────
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// ─── Global Error Handler ─────────────────────────────
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    // Operational / expected error — don't log stack
    logger.warn({ statusCode: err.statusCode, message: err.message, url: req.originalUrl });
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown / programming error — log full stack
  logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
