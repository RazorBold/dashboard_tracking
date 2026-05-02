import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware';
import * as geofenceService from '../services/geofence.service';

const router = Router();
router.use(verifyToken);

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
