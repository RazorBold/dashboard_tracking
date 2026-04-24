import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env, logger } from '../config';

// ─── JWT Payload Interface ────────────────────────────
export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: string;
  orgId: string | null;
  iat?: number;
  exp?: number;
}

// ─── Extend Express Request ───────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Verify JWT Access Token ──────────────────────────
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Access token has expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
      return;
    }
    logger.error({ error }, 'Token verification error');
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Role-Based Access Control ────────────────────────
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
};
