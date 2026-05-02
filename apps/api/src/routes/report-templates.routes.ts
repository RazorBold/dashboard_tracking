import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.middleware';
import * as reportService from '../services/report.service';

const router = Router();
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: ReportTemplates
 *   description: Saved report templates
 */

/**
 * @swagger
 * /api/report-templates:
 *   get:
 *     summary: List all report templates for the organization
 *     tags: [ReportTemplates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of report templates
 */

/**
 * @swagger
 * /api/report-templates:
 *   post:
 *     summary: Create a new report template
 *     tags: [ReportTemplates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, reportType]
 *             properties:
 *               name: { type: string }
 *               reportType: { type: string, enum: [daily_activity, track_details] }
 *               deviceId: { type: string, format: uuid }
 *               dateFrom: { type: string, format: date-time }
 *               dateTo: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Template created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/report-templates/{id}/run:
 *   get:
 *     summary: Run a report template and download as CSV
 *     tags: [ReportTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       404:
 *         description: Report template not found
 */

/**
 * @swagger
 * /api/report-templates/{id}:
 *   delete:
 *     summary: Delete a report template
 *     tags: [ReportTemplates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Template deleted
 *       404:
 *         description: Template not found
 */

const createSchema = z.object({
  name: z.string().min(1).max(100),
  reportType: z.enum(['daily_activity', 'track_details']),
  deviceId: z.string().uuid().optional().nullable(),
  dateFrom: z.string().datetime({ offset: true }).optional().nullable(),
  dateTo: z.string().datetime({ offset: true }).optional().nullable(),
});

// ─── List ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const templates = await reportService.listReportTemplates(orgId);
    res.json({ data: templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list report templates' });
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

    const { name, reportType, deviceId, dateFrom, dateTo } = parsed.data;
    const template = await reportService.createReportTemplate({
      organizationId: orgId,
      userId: userId ?? null,
      name,
      reportType,
      deviceId: deviceId ?? null,
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
    });

    res.status(201).json({ data: template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create report template' });
  }
});

// ─── Run (download CSV) ───────────────────────────────
router.get('/:id/run', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const { csv, name } = await reportService.runReport(req.params.id, orgId);
    const filename = `report-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err: any) {
    if (err.message === 'Report template not found') {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to run report' });
  }
});

// ─── Delete ───────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const deleted = await reportService.deleteReportTemplate(req.params.id, orgId);
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete report template' });
  }
});

export { router as reportTemplatesRouter };
