import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, verifyToken } from '../middleware';
import * as authService from '../services/auth.service';

export const authRouter = Router();

// ─── Validation Schemas ───────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Helper: get refresh token from cookie or body ───
const getRefreshToken = (req: Request): string | null => {
  return req.cookies?.refreshToken ?? req.body?.refreshToken ?? null;
};

// ═══════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@iotplatform.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: MySecret123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@iotplatform.com
 *               password:
 *                 type: string
 *                 example: MySecret123!
 *     responses:
 *       200:
 *         description: Login successful — access token in body, refresh token in httpOnly cookie
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=...; Path=/api/auth; HttpOnly; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      // Set httpOnly cookie for refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { accessToken, user },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     security: []
 *     description: Refresh token can be sent via httpOnly cookie OR request body
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional if cookie is present
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = getRefreshToken(req);
      if (!token) {
        res.status(401).json({ success: false, message: 'Refresh token is required' });
        return;
      }
      const result = await authService.refresh(token);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      // Clear the stale cookie so the browser stops sending it on retries
      res.clearCookie('refreshToken', { path: '/api/auth' });
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout — invalidate current refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 */
authRouter.post(
  '/logout',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = getRefreshToken(req);
      if (token) {
        await authService.logout(token);
      }

      // Clear cookie
      res.clearCookie('refreshToken', { path: '/api/auth' });

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all devices — revoke all refresh tokens
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: All sessions revoked
 */
authRouter.post(
  '/logout-all',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logoutAll(req.user!.sub);
      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.status(200).json({ success: true, message: 'All sessions revoked' });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.get(
  '/me',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.sub);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);

const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional(),
}).refine(
  (d) => !d.newPassword || !!d.currentPassword,
  { message: 'Current password is required when changing password', path: ['currentPassword'] },
);

authRouter.patch(
  '/me',
  verifyToken,
  validate(updateMeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.updateMe(req.user!.sub, req.body);
      res.json({ success: true, message: 'Profile updated', data: user });
    } catch (err) {
      next(err);
    }
  },
);
