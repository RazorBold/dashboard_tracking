import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware';
import * as obdService from '../services/obd.service';

const router = Router({ mergeParams: true }); // mergeParams: deviceId comes from parent
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: OBD
 *   description: OBD-II diagnostics data
 */

// ─── Latest snapshot ──────────────────────────────────
/**
 * @swagger
 * /api/obd/{deviceId}/latest:
 *   get:
 *     summary: Get the latest OBD-II snapshot for a device
 *     tags: [OBD]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Latest OBD snapshot or null
 */
router.get('/:deviceId/latest', async (req, res) => {
  try {
    const snapshot = await obdService.getLatestSnapshot(req.params.deviceId);
    res.json({ data: snapshot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch OBD snapshot' });
  }
});

// ─── Snapshot history ─────────────────────────────────
/**
 * @swagger
 * /api/obd/{deviceId}/history:
 *   get:
 *     summary: Get OBD-II snapshot history for a device
 *     tags: [OBD]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
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
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 500, maximum: 2000 }
 *     responses:
 *       200:
 *         description: Array of OBD snapshots ordered newest first
 */
const historyQuerySchema = z.object({
  from:  z.string().datetime({ offset: true }),
  to:    z.string().datetime({ offset: true }),
  limit: z.coerce.number().int().min(1).max(2000).default(500),
});

router.get('/:deviceId/history', async (req, res) => {
  try {
    const parsed = historyQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(422).json({ error: parsed.error.flatten() });

    const snapshots = await obdService.getSnapshotHistory({
      deviceId: req.params.deviceId,
      from:     new Date(parsed.data.from),
      to:       new Date(parsed.data.to),
      limit:    parsed.data.limit,
    });
    res.json({ data: snapshots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch OBD history' });
  }
});

// ─── Active DTCs ──────────────────────────────────────
/**
 * @swagger
 * /api/obd/{deviceId}/dtc:
 *   get:
 *     summary: List active DTC fault codes for a device
 *     tags: [OBD]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: history
 *         schema: { type: boolean }
 *         description: If true, return all DTCs including cleared ones
 */
router.get('/:deviceId/dtc', async (req, res) => {
  try {
    const all = req.query.history === 'true';
    const data = all
      ? await obdService.getDtcHistory(req.params.deviceId)
      : await obdService.getActiveDtcs(req.params.deviceId);
    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch DTCs' });
  }
});

// ─── Clear single DTC ─────────────────────────────────
/**
 * @swagger
 * /api/obd/{deviceId}/dtc/{id}/clear:
 *   put:
 *     summary: Mark a single DTC as cleared
 *     tags: [OBD]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:deviceId/dtc/:id/clear', async (req, res) => {
  try {
    const updated = await obdService.clearDtc(req.params.id, req.params.deviceId);
    if (!updated) return res.status(404).json({ error: 'DTC not found or already cleared' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear DTC' });
  }
});

// ─── Clear all active DTCs ────────────────────────────
/**
 * @swagger
 * /api/obd/{deviceId}/dtc/clear-all:
 *   put:
 *     summary: Clear all active DTCs for a device
 *     tags: [OBD]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:deviceId/dtc/clear-all', async (req, res) => {
  try {
    const count = await obdService.clearAllDtcs(req.params.deviceId);
    res.json({ success: true, cleared: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear DTCs' });
  }
});

export { router as obdRouter };
