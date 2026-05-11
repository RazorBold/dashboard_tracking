import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware';
import * as reportService from '../services/report.service';

const router: Router = Router();
router.use(verifyToken);

function resolveOrgId(req: any): string | null {
  if (req.user?.role === 'super_admin') return null;
  return req.user?.orgId ?? null;
}

/**
 * @swagger
 * tags:
 *   name: AutoReports
 *   description: Scheduled automatic report delivery
 */

/**
 * @swagger
 * /api/auto-reports:
 *   get:
 *     summary: List all auto-report schedules for the organization
 *     tags: [AutoReports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of auto-report objects
 */

/**
 * @swagger
 * /api/auto-reports:
 *   post:
 *     summary: Create a new auto-report schedule
 *     tags: [AutoReports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, reportType, frequency, executionTime, email]
 *             properties:
 *               name: { type: string }
 *               reportType: { type: string, enum: [daily_activity, track_details] }
 *               deviceId: { type: string, format: uuid }
 *               frequency: { type: string, enum: [daily, weekly, monthly] }
 *               executionTime: { type: string, description: 'HH:MM format', example: '08:00' }
 *               email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: Auto-report schedule created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/auto-reports/{id}:
 *   patch:
 *     summary: Toggle active/inactive status of an auto-report
 *     tags: [AutoReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated auto-report
 *       404:
 *         description: Auto-report not found
 */

/**
 * @swagger
 * /api/auto-reports/{id}:
 *   delete:
 *     summary: Delete an auto-report schedule
 *     tags: [AutoReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Auto-report deleted
 *       404:
 *         description: Auto-report not found
 */

const createSchema = z.object({
  name: z.string().min(1).max(100),
  reportType: z.enum(['daily_activity', 'track_details']),
  deviceId: z.string().uuid().optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  executionTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  email: z.string().email(),
});

// ─── List ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const list = await reportService.listAutoReports(orgId);
    res.json({ data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list auto reports' });
  }
});

// ─── Create ───────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.sub;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { name, reportType, deviceId, frequency, executionTime, email } = parsed.data;
    const report = await reportService.createAutoReport({
      organizationId: orgId,
      userId: userId ?? null,
      name,
      reportType,
      deviceId: deviceId ?? null,
      frequency,
      executionTime,
      email,
      isActive: true,
      lastRunAt: null,
    });

    res.status(201).json({ data: report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create auto report' });
  }
});

// ─── Toggle isActive ──────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const updated = await reportService.toggleAutoReport(req.params.id, orgId);
    if (!updated) return res.status(404).json({ error: 'Not found' });

    res.json({ data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle auto report' });
  }
});

// ─── Delete ───────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const deleted = await reportService.deleteAutoReport(req.params.id, orgId);
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete auto report' });
  }
});

export { router as autoReportsRouter };
