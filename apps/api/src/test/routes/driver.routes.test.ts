import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../../db';

let app: any;
beforeEach(async () => {
  vi.clearAllMocks();
  app = (await import('../../index')).default;
});

const mockDriver = {
  id: 'driver-1',
  organizationId: 'test-org-id',
  driverNo: 'DRV-001',
  name: 'John Doe',
  phone: '081234567890',
  licenseNo: 'SIM-12345',
  rfidCardNo: null,
  kc208: null,
  registerPlace: 'Jakarta',
  registerDate: null,
  licenseExpiry: null,
  licenseStatus: 'Normal',
  fleetName: null,
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── GET /api/drivers ─────────────────────────────────

describe('GET /api/drivers', () => {
  it('returns 200 with paginated data', async () => {
    (db as any).query = {
      drivers: { findMany: vi.fn().mockResolvedValue([mockDriver]) },
    };
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 1 }]) }),
    });

    const res = await request(app).get('/api/drivers');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('returns 500 on db error', async () => {
    (db as any).query = {
      drivers: { findMany: vi.fn().mockRejectedValue(new Error('db')) },
    };
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 0 }]) }),
    });

    const res = await request(app).get('/api/drivers');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/drivers/export ──────────────────────────

describe('GET /api/drivers/export', () => {
  it('returns CSV file', async () => {
    (db as any).query = {
      drivers: { findMany: vi.fn().mockResolvedValue([mockDriver]) },
    };

    const res = await request(app).get('/api/drivers/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('returns 500 on db error', async () => {
    (db as any).query = {
      drivers: { findMany: vi.fn().mockRejectedValue(new Error('db')) },
    };

    const res = await request(app).get('/api/drivers/export');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/drivers ────────────────────────────────

describe('POST /api/drivers', () => {
  it('returns 201 on valid driver', async () => {
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([mockDriver]) }),
    });

    const res = await request(app)
      .post('/api/drivers')
      .send({ driverNo: 'DRV-001', name: 'John Doe' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('John Doe');
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app).post('/api/drivers').send({ phone: '08123' });
    expect(res.status).toBe(400);
  });

  it('returns 500 on db error', async () => {
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockRejectedValue(new Error('db')) }),
    });

    const res = await request(app).post('/api/drivers').send({ driverNo: 'DRV-001', name: 'John' });
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/drivers/:id ─────────────────────────────

describe('PUT /api/drivers/:id', () => {
  it('returns 200 on valid update', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([mockDriver]) }),
      }),
    });

    const res = await request(app).put('/api/drivers/driver-1').send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
  });

  it('returns 404 when not found', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
      }),
    });

    const res = await request(app).put('/api/drivers/nonexistent').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockRejectedValue(new Error('db')) }),
      }),
    });

    const res = await request(app).put('/api/drivers/driver-1').send({ name: 'X' });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/drivers/:id ──────────────────────────

describe('DELETE /api/drivers/:id', () => {
  it('returns 200 on successful delete', async () => {
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([mockDriver]) }),
    });

    const res = await request(app).delete('/api/drivers/driver-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when not found', async () => {
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
    });

    const res = await request(app).delete('/api/drivers/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: vi.fn().mockRejectedValue(new Error('db')) }),
    });

    const res = await request(app).delete('/api/drivers/driver-1');
    expect(res.status).toBe(500);
  });
});
