import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, verifyToken, requireRole } from '../middleware';
import * as userService from '../services/user.service';

export const usersRouter = Router();
usersRouter.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Organization sub-account management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users in the caller's organization
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of user objects
 */

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get organization statistics for the dashboard
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Org stats (device count, active devices, user count, etc.)
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a sub-account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [admin, operator, viewer] }
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient role
 */

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a sub-account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string, enum: [admin, operator, viewer] }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Remove a sub-account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User removed
 *       404:
 *         description: User not found
 */

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'operator', 'viewer']).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'operator', 'viewer']).optional(),
  password: z.string().min(6).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

// GET /api/users — list users in caller's org
usersRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) {
        res.status(403).json({ success: false, message: 'No organization assigned' });
        return;
      }
      const data = await userService.listOrgUsers(orgId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/users/stats — org stats for dashboard
usersRouter.get(
  '/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) {
        res.status(403).json({ success: false, message: 'No organization assigned' });
        return;
      }
      const stats = await userService.getOrgStats(orgId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/users — create sub-account (admin only)
usersRouter.post(
  '/',
  requireRole('admin', 'super_admin'),
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) {
        res.status(403).json({ success: false, message: 'No organization assigned' });
        return;
      }
      const user = await userService.createOrgUser(orgId, req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/users/:id — update sub-account (admin only)
usersRouter.put(
  '/:id',
  requireRole('admin', 'super_admin'),
  validate(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) {
        res.status(403).json({ success: false, message: 'No organization assigned' });
        return;
      }
      const user = await userService.updateOrgUser(orgId, req.params.id as string, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/users/:id — remove sub-account (admin only)
usersRouter.delete(
  '/:id',
  requireRole('admin', 'super_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.user?.orgId;
      if (!orgId) {
        res.status(403).json({ success: false, message: 'No organization assigned' });
        return;
      }
      await userService.deleteOrgUser(orgId, req.params.id as string);
      res.json({ success: true, message: 'User removed' });
    } catch (err) {
      next(err);
    }
  },
);
