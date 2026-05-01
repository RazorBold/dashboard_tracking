import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, verifyToken, requireRole } from '../middleware';
import * as userService from '../services/user.service';

export const usersRouter = Router();
usersRouter.use(verifyToken);

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
