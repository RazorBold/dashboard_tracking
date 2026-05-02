import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { db } from '../db';
import { alerts } from '../db/schema';
import { eq, desc, and, count } from 'drizzle-orm';

const router = Router();
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Real-time alert management
 */

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: List alerts for the caller's organization
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: List of alerts (newest first), each with device info
 */
router.get('/', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const limit = parseInt((req.query.limit as string) || '50', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const data = await db.query.alerts.findMany({
      where: eq(alerts.organizationId, orgId),
      orderBy: [desc(alerts.createdAt)],
      limit,
      offset,
      with: { device: { columns: { name: true, imei: true } } },
    });

    res.json({ data });
  } catch {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * @swagger
 * /api/alerts/count:
 *   get:
 *     summary: Get unread alert count
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of unread alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unread: { type: integer, example: 7 }
 */
router.get('/count', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const result = await db.select({ value: count() })
      .from(alerts)
      .where(and(eq(alerts.organizationId, orgId), eq(alerts.isRead, false)));

    res.json({ unread: result[0].value });
  } catch {
    res.status(500).json({ error: 'Failed to count alerts' });
  }
});

/**
 * @swagger
 * /api/alerts/read-all:
 *   put:
 *     summary: Mark all unread alerts as read
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All alerts marked as read
 */
router.put('/read-all', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    await db.update(alerts)
      .set({ isRead: true })
      .where(and(eq(alerts.organizationId, orgId), eq(alerts.isRead, false)));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update alerts' });
  }
});

/**
 * @swagger
 * /api/alerts/{id}/read:
 *   put:
 *     summary: Mark a single alert as read
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Alert updated
 *       404:
 *         description: Alert not found
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const [updated] = await db.update(alerts)
      .set({ isRead: true })
      .where(and(eq(alerts.id, id), eq(alerts.organizationId, orgId)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    res.json({ success: true, alert: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default router;
