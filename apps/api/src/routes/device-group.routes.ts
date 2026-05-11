import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { z } from 'zod';
import { validate, verifyToken } from '../middleware';
import * as groupService from '../services/device-group.service';

export const deviceGroupRouter: IRouter = Router();
deviceGroupRouter.use(verifyToken);

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  organizationId: z.string().uuid().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const assignDevicesSchema = z.object({
  deviceIds: z.array(z.string().uuid()).min(1),
});

/**
 * @swagger
 * /api/device-groups:
 *   get:
 *     summary: List all device groups
 *     tags: [Device Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of device groups
 */
deviceGroupRouter.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const groups = await groupService.listDeviceGroups();
      res.json({ success: true, data: groups });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/device-groups:
 *   post:
 *     summary: Create a device group
 *     tags: [Device Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Group created
 */
deviceGroupRouter.post(
  '/',
  validate(createGroupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const group = await groupService.createDeviceGroup(req.body);
      res.status(201).json({ success: true, message: 'Group created', data: group });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/device-groups/{id}:
 *   put:
 *     summary: Update a device group
 *     tags: [Device Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Group updated
 *       404:
 *         description: Group not found
 */
deviceGroupRouter.put(
  '/:id',
  validate(updateGroupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const group = await groupService.updateDeviceGroup(req.params.id as string, req.body);
      res.json({ success: true, message: 'Group updated', data: group });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/device-groups/{id}:
 *   delete:
 *     summary: Delete a device group (unassigns all devices first)
 *     tags: [Device Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Group deleted
 *       404:
 *         description: Group not found
 */
deviceGroupRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const group = await groupService.deleteDeviceGroup(req.params.id as string);
      res.json({ success: true, message: 'Group deleted', data: group });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/device-groups/{id}/devices:
 *   post:
 *     summary: Assign devices to a group
 *     tags: [Device Groups]
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
 *             required: [deviceIds]
 *             properties:
 *               deviceIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Devices assigned to group
 */
deviceGroupRouter.post(
  '/:id/devices',
  validate(assignDevicesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await groupService.assignDevicesToGroup(req.params.id as string, req.body.deviceIds);
      res.json({ success: true, message: `${result.assigned} device(s) assigned to group`, data: result });
    } catch (err) {
      next(err);
    }
  },
);
