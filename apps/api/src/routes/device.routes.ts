import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { z } from 'zod';
import { validate, verifyToken } from '../middleware';
import * as deviceService from '../services/device.service';
import * as trackingService from '../services/tracking.service';

export const deviceRouter: IRouter = Router();
deviceRouter.use(verifyToken);

// ─── Validation Schemas ───────────────────────────────
const createDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  imei: z.string().length(15, 'IMEI must be 15 digits'),
  model: z.string().max(50).optional(),
  groupId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
});

const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  model: z.string().max(50).optional(),
  groupId: z.string().uuid().nullable().optional(),
  status: z.enum(['online', 'offline', 'inactive', 'expired']).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['online', 'offline', 'inactive', 'expired']).optional(),
  groupId: z.string().uuid().optional(),
});

const positionHistoryQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

// ─── Routes ───────────────────────────────────────────

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: List all devices (paginated)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or IMEI
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [online, offline, inactive, expired] }
 *       - in: query
 *         name: groupId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated list of devices
 */
deviceRouter.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deviceService.listDevices(req.query as any);

      // Enrich each device with its latest GPS position
      const deviceIds = result.data.map((d) => d.id);
      const positions = await trackingService.getLatestPositions(deviceIds);

      const data = result.data.map((d) => ({
        ...d,
        lat: positions[d.id]?.lat ?? null,
        lng: positions[d.id]?.lng ?? null,
        speed: positions[d.id]?.speed ?? null,
      }));

      res.json({ success: true, data, meta: result.meta });
    } catch (err: any) {
      console.error('GET /devices error:', err?.message, err?.stack);
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/devices/export:
 *   get:
 *     summary: Export devices to CSV
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema: { type: string }
 */
deviceRouter.get(
  '/export',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = await deviceService.exportDevicesCsv({
        search: req.query.search as string | undefined,
        status: req.query.status as any,
        groupId: req.query.groupId as string | undefined,
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="devices.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get a device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Device detail
 *       404:
 *         description: Device not found
 */
deviceRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = await deviceService.getDeviceById(req.params.id as string);
      if (!device) {
        res.status(404).json({ success: false, message: 'Device not found' });
        return;
      }
      res.json({ success: true, data: device });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create / register a new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, imei]
 *             properties:
 *               name: { type: string }
 *               imei: { type: string, minLength: 15, maxLength: 15 }
 *               model: { type: string }
 *               groupId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Device created
 *       409:
 *         description: IMEI already exists
 */
deviceRouter.post(
  '/',
  validate(createDeviceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = await deviceService.createDevice(req.body);
      res.status(201).json({ success: true, message: 'Device created', data: device });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Update a device
 *     tags: [Devices]
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
 *               model: { type: string }
 *               groupId: { type: string, format: uuid, nullable: true }
 *               status: { type: string, enum: [online, offline, inactive, expired] }
 *     responses:
 *       200:
 *         description: Device updated
 *       404:
 *         description: Device not found
 */
deviceRouter.put(
  '/:id',
  validate(updateDeviceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = await deviceService.updateDevice(req.params.id as string, req.body);
      res.json({ success: true, message: 'Device updated', data: device });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Device deleted
 *       404:
 *         description: Device not found
 */
deviceRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = await deviceService.deleteDevice(req.params.id as string);
      res.json({ success: true, message: 'Device deleted', data: device });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/devices/{id}/position:
 *   get:
 *     summary: Get latest position of a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Latest position data
 */
deviceRouter.get(
  '/:id/position',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const position = await trackingService.getLatestPosition(req.params.id as string);
      res.json({ success: true, data: position });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/devices/{id}/positions:
 *   get:
 *     summary: Get position history of a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: List of historical positions
 */
deviceRouter.get(
  '/:id/positions',
  validate(positionHistoryQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, to } = req.query as { from: string; to: string };
      const positions = await trackingService.getPositionHistory(
        req.params.id as string,
        new Date(from),
        new Date(to)
      );
      res.json({ success: true, data: positions });
    } catch (err) {
      next(err);
    }
  },
);
