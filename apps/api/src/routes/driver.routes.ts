import { Router } from 'express';
import { z } from 'zod';
import { eq, desc, and, ilike, or, lte, count } from 'drizzle-orm';
import { verifyToken } from '../middleware/auth.middleware';
import { db } from '../db';
import { drivers } from '../db/schema';

const router = Router();
router.use(verifyToken);

function computeLicenseStatus(licenseExpiry: Date | null): string {
  if (!licenseExpiry) return 'N/A';
  const days = Math.floor((licenseExpiry.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring';
  return 'Normal';
}

// ─── List drivers ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const { search, registerPlace, licenseExpired, page = '1', limit = '50' } = req.query;

    const conditions: ReturnType<typeof eq>[] = [eq(drivers.organizationId, orgId)];

    if (search) {
      conditions.push(
        or(
          ilike(drivers.name, `%${search}%`),
          ilike(drivers.driverNo, `%${search}%`),
        ) as any,
      );
    }
    if (registerPlace) {
      conditions.push(ilike(drivers.registerPlace, `%${registerPlace}%`) as any);
    }
    if (licenseExpired === 'true') {
      conditions.push(lte(drivers.licenseExpiry, new Date()) as any);
    }

    const where = and(...conditions);
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    const [data, totalResult] = await Promise.all([
      db.query.drivers.findMany({
        where,
        orderBy: [desc(drivers.createdAt)],
        limit: limitNum,
        offset,
      }),
      db.select({ value: count() }).from(drivers).where(where),
    ]);

    res.json({ data, meta: { page: pageNum, limit: limitNum, total: totalResult[0].value } });
  } catch {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// ─── Export CSV ───────────────────────────────────────
router.get('/export', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const data = await db.query.drivers.findMany({
      where: eq(drivers.organizationId, orgId),
      orderBy: [desc(drivers.createdAt)],
    });

    const headers = ['Driver No', 'Name', 'Phone', 'License No', 'RFID Card No', 'KC208', 'Register Place', 'Register Date', 'License Expiry', 'License Status', 'Status', 'Fleet Name'];
    const rows = data.map((d) => [
      d.driverNo, d.name, d.phone ?? '', d.licenseNo ?? '',
      d.rfidCardNo ?? '', d.kc208 ?? '', d.registerPlace ?? '',
      d.registerDate ? new Date(d.registerDate).toLocaleDateString() : '',
      d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '',
      computeLicenseStatus(d.licenseExpiry as Date | null),
      d.status ?? '', d.fleetName ?? '',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="drivers.csv"');
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ─── Create driver ────────────────────────────────────
const driverSchema = z.object({
  driverNo: z.string().min(1).max(30),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  licenseNo: z.string().max(30).optional(),
  rfidCardNo: z.string().max(30).optional(),
  kc208: z.string().max(30).optional(),
  registerPlace: z.string().max(100).optional(),
  registerDate: z.string().datetime({ offset: true }).nullable().optional(),
  licenseExpiry: z.string().datetime({ offset: true }).nullable().optional(),
  fleetName: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

router.post('/', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const body = driverSchema.parse(req.body);
    const licenseExpiry = body.licenseExpiry ? new Date(body.licenseExpiry) : null;

    const [driver] = await db.insert(drivers).values({
      ...body,
      organizationId: orgId,
      registerDate: body.registerDate ? new Date(body.registerDate) : null,
      licenseExpiry,
      licenseStatus: computeLicenseStatus(licenseExpiry),
    }).returning();

    res.status(201).json({ data: driver });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// ─── Update driver ────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const body = driverSchema.partial().parse(req.body);
    const licenseExpiry = body.licenseExpiry !== undefined
      ? (body.licenseExpiry ? new Date(body.licenseExpiry) : null)
      : undefined;

    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };
    if (licenseExpiry !== undefined) {
      updateData.licenseExpiry = licenseExpiry;
      updateData.licenseStatus = computeLicenseStatus(licenseExpiry);
    }

    const [updated] = await db.update(drivers)
      .set(updateData)
      .where(and(eq(drivers.id, req.params.id), eq(drivers.organizationId, orgId)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Driver not found' });
    res.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// ─── Delete driver ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(403).json({ error: 'No organization assigned' });

    const [deleted] = await db.delete(drivers)
      .where(and(eq(drivers.id, req.params.id), eq(drivers.organizationId, orgId)))
      .returning();

    if (!deleted) return res.status(404).json({ error: 'Driver not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

export const driverRouter = router;
