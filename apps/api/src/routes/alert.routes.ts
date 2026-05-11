import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { db } from '../db';
import { alerts } from '../db/schema';
import { eq, desc, and, count, SQL } from 'drizzle-orm';

const router = Router();
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Real-time alert management
 */

/** Resolve org filter — super_admin sees all, others scoped to their org */
function orgFilter(req: any): SQL | undefined {
  if (req.user?.role === 'super_admin') return undefined;
  const orgId = req.user?.orgId;
  if (!orgId) return undefined; // no org → no filter (returns all for their account)
  return eq(alerts.organizationId, orgId);
}

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
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: List of alerts (newest first), each with device info
 */
router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(parseInt((req.query.limit  as string) || '100', 10), 500);
    const offset = parseInt((req.query.offset as string) || '0', 10);
    const filter = orgFilter(req);

    const data = await db.query.alerts.findMany({
      where: filter,
      orderBy: [desc(alerts.createdAt)],
      limit,
      offset,
      with: { device: { columns: { name: true, imei: true } } },
    });

    res.json({ data });
  } catch (err) {
    console.error('GET /alerts error:', err);
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
 */
router.get('/count', async (req, res) => {
  try {
    const filter = orgFilter(req);
    const where  = filter
      ? and(filter, eq(alerts.isRead, false))
      : eq(alerts.isRead, false);

    const result = await db.select({ value: count() })
      .from(alerts)
      .where(where);

    res.json({ unread: result[0]?.value ?? 0 });
  } catch (err) {
    console.error('GET /alerts/count error:', err);
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
 */
router.put('/read-all', async (req, res) => {
  try {
    const filter = orgFilter(req);
    const where  = filter
      ? and(filter, eq(alerts.isRead, false))
      : eq(alerts.isRead, false);

    await db.update(alerts).set({ isRead: true }).where(where);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /alerts/read-all error:', err);
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
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = orgFilter(req);
    const where  = filter
      ? and(eq(alerts.id, id), filter)
      : eq(alerts.id, id);

    const [updated] = await db.update(alerts)
      .set({ isRead: true })
      .where(where)
      .returning();

    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    res.json({ success: true, alert: updated });
  } catch (err) {
    console.error('PUT /alerts/:id/read error:', err);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default router;
