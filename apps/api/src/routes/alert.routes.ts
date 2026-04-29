import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { db } from '../db';
import { alerts } from '../db/schema';
import { eq, desc, and, count } from 'drizzle-orm';

const router = Router();

// Protect all alert routes
router.use(verifyToken);

// 1. Get all alerts for the user's organization
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
      with: {
        device: {
          columns: { name: true, imei: true }
        }
      }
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// 2. Get unread alerts count
router.get('/count', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const result = await db.select({ value: count() })
      .from(alerts)
      .where(and(eq(alerts.organizationId, orgId), eq(alerts.isRead, false)));

    res.json({ unread: result[0].value });
  } catch (error) {
    res.status(500).json({ error: 'Failed to count alerts' });
  }
});

// 3. Mark an alert as read
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// 4. Mark all alerts as read
router.put('/read-all', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    await db.update(alerts)
      .set({ isRead: true })
      .where(and(eq(alerts.organizationId, orgId), eq(alerts.isRead, false)));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alerts' });
  }
});

export default router;
