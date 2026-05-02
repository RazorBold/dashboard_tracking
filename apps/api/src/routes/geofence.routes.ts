import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware';
import * as geofenceService from '../services/geofence.service';

const router = Router();
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Geofences
 *   description: Geo-fence zone management
 */

/**
 * @swagger
 * /api/geofences:
 *   get:
 *     summary: List all geofences for the organization
 *     tags: [Geofences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of geofence objects
 */

/**
 * @swagger
 * /api/geofences:
 *   post:
 *     summary: Create a new geofence
 *     tags: [Geofences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, geometry]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [circle, polygon] }
 *               description: { type: string }
 *               assignedDeviceIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *               geometry:
 *                 oneOf:
 *                   - type: object
 *                     description: Circle geometry
 *                     properties:
 *                       center:
 *                         type: object
 *                         properties:
 *                           lat: { type: number }
 *                           lng: { type: number }
 *                       radius: { type: number }
 *                   - type: object
 *                     description: Polygon geometry
 *                     properties:
 *                       points:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             lat: { type: number }
 *                             lng: { type: number }
 *     responses:
 *       201:
 *         description: Geofence created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/geofences/{id}:
 *   put:
 *     summary: Update a geofence
 *     tags: [Geofences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Geofence updated
 *       404:
 *         description: Geofence not found
 */

/**
 * @swagger
 * /api/geofences/{id}:
 *   delete:
 *     summary: Delete a geofence
 *     tags: [Geofences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Geofence deleted
 *       404:
 *         description: Geofence not found
 */

const pointSchema = z.object({ lat: z.number(), lng: z.number() });

const geometrySchema = z.union([
  z.object({ center: pointSchema, radius: z.number().positive() }),
  z.object({ points: z.array(pointSchema).min(3) }),
]);

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['circle', 'polygon']),
  geometry: geometrySchema,
  description: z.string().max(500).optional().nullable(),
  assignedDeviceIds: z.array(z.string().uuid()).optional(),
});

const updateSchema = createSchema.partial();

// ─── List ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const list = await geofenceService.listGeofences(orgId);
    res.json({ data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list geofences' });
  }
});

// ─── Create ───────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const fence = await geofenceService.createGeofence(parsed.data, orgId);
    res.status(201).json({ data: fence });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create geofence' });
  }
});

// ─── Update ───────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const updated = await geofenceService.updateGeofence(req.params.id, parsed.data, orgId);
    if (!updated) return res.status(404).json({ error: 'Geofence not found' });

    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update geofence' });
  }
});

// ─── Delete ───────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const deleted = await geofenceService.deleteGeofence(req.params.id, orgId);
    if (!deleted) return res.status(404).json({ error: 'Geofence not found' });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete geofence' });
  }
});

export { router as geofenceRouter };
