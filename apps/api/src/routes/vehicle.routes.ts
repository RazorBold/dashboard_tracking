import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { z } from 'zod';
import { validate, verifyToken } from '../middleware';
import * as vehicleService from '../services/vehicle.service';

export const vehicleRouter: IRouter = Router();
vehicleRouter.use(verifyToken);

// ─── Validation Schemas ───────────────────────────────
const createVehicleSchema = z.object({
  plateNo: z.string().min(1).max(20),
  type: z.enum(['car', 'motorcycle', 'truck', 'bus', 'van', 'other']).optional(),
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  maxSpeed: z.number().int().positive().optional(),
  vin: z.string().max(17).optional(),
  sn: z.string().max(30).optional(),
  ownerName: z.string().max(100).optional(),
  ownerPhone: z.string().max(20).optional(),
  organizationId: z.string().uuid().optional(),
});

const updateVehicleSchema = z.object({
  plateNo: z.string().min(1).max(20).optional(),
  type: z.enum(['car', 'motorcycle', 'truck', 'bus', 'van', 'other']).optional(),
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  maxSpeed: z.number().int().positive().optional(),
  vin: z.string().max(17).optional(),
  sn: z.string().max(30).optional(),
  ownerName: z.string().max(100).optional(),
  ownerPhone: z.string().max(20).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']).optional(),
  insuranceStatus: z.enum(['active', 'expired', 'expiring_soon', 'none']).optional(),
  insuranceExpiry: z.coerce.date().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']).optional(),
});

const bindDeviceSchema = z.object({
  deviceId: z.string().uuid('Device ID must be a valid UUID'),
});

// ─── Routes ───────────────────────────────────────────

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: List all vehicles (paginated)
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by plate number or owner name
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, maintenance, retired] }
 *     responses:
 *       200:
 *         description: Paginated list of vehicles
 */
vehicleRouter.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await vehicleService.listVehicles(req.query as any);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/vehicles/export:
 *   get:
 *     summary: Export vehicles to CSV
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema: { type: string }
 */
vehicleRouter.get(
  '/export',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = await vehicleService.exportVehiclesCsv({
        search: req.query.search as string | undefined,
        status: req.query.status as any,
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vehicles.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get a vehicle by ID
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicle detail
 *       404:
 *         description: Vehicle not found
 */
vehicleRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id as string);
      if (!vehicle) {
        res.status(404).json({ success: false, message: 'Vehicle not found' });
        return;
      }
      res.json({ success: true, data: vehicle });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plateNo]
 *             properties:
 *               plateNo: { type: string }
 *               type: { type: string, enum: [car, motorcycle, truck, bus, van, other] }
 *               make: { type: string }
 *               model: { type: string }
 *               maxSpeed: { type: integer }
 *               ownerName: { type: string }
 *               ownerPhone: { type: string }
 *     responses:
 *       201:
 *         description: Vehicle created
 */
vehicleRouter.post(
  '/',
  validate(createVehicleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
      res.status(201).json({ success: true, message: 'Vehicle created', data: vehicle });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicle updated
 *       404:
 *         description: Vehicle not found
 */
vehicleRouter.put(
  '/:id',
  validate(updateVehicleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.updateVehicle(req.params.id as string, req.body);
      res.json({ success: true, message: 'Vehicle updated', data: vehicle });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicle deleted
 *       404:
 *         description: Vehicle not found
 */
vehicleRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.deleteVehicle(req.params.id as string);
      res.json({ success: true, message: 'Vehicle deleted', data: vehicle });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/vehicles/{id}/bind-device:
 *   post:
 *     summary: Bind a device to a vehicle
 *     tags: [Vehicles]
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
 *             required: [deviceId]
 *             properties:
 *               deviceId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Device bound to vehicle
 *       404:
 *         description: Vehicle not found
 */
vehicleRouter.post(
  '/:id/bind-device',
  validate(bindDeviceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.bindDevice(req.params.id as string, req.body.deviceId);
      res.json({ success: true, message: 'Device bound to vehicle', data: vehicle });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @swagger
 * /api/vehicles/{id}/bind-device:
 *   delete:
 *     summary: Unbind device from a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Device unbound from vehicle
 *       404:
 *         description: Vehicle not found
 */
vehicleRouter.delete(
  '/:id/bind-device',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.unbindDevice(req.params.id as string);
      res.json({ success: true, message: 'Device unbound from vehicle', data: vehicle });
    } catch (err) {
      next(err);
    }
  },
);
