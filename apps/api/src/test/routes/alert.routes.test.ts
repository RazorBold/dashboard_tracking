import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// db mock is set up in setup.ts — import db to configure per test
import { db } from '../../db';

let app: any;
beforeEach(async () => {
  vi.clearAllMocks();
  app = (await import('../../index')).default;
});

const mockAlert = {
  id: 'alert-1',
  organizationId: 'test-org-id',
  deviceId: 'device-1',
  type: 'overspeed',
  severity: 'warning',
  message: 'Speed exceeded',
  isRead: false,
  createdAt: new Date().toISOString(),
  device: { name: 'Device 1', imei: '123456789012345' },
};

// ─── GET /api/alerts ──────────────────────────────────

describe('GET /api/alerts', () => {
  it('returns 200 with data array', async () => {
    const mockQuery = { findMany: vi.fn().mockResolvedValue([mockAlert]) };
    (db as any).query = { alerts: mockQuery };

    const res = await request(app).get('/api/alerts');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('returns 500 on db error', async () => {
    const mockQuery = { findMany: vi.fn().mockRejectedValue(new Error('db error')) };
    (db as any).query = { alerts: mockQuery };

    const res = await request(app).get('/api/alerts');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/alerts/count ────────────────────────────

describe('GET /api/alerts/count', () => {
  it('returns 200 with unread count', async () => {
    const chain = { where: vi.fn().mockResolvedValue([{ value: 7 }]) };
    const fromChain = { from: vi.fn().mockReturnValue(chain) };
    (db.select as any).mockReturnValue(fromChain);

    const res = await request(app).get('/api/alerts/count');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('unread');
  });

  it('returns 500 on db error', async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockRejectedValue(new Error('db')) }),
    });

    const res = await request(app).get('/api/alerts/count');
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/alerts/read-all ─────────────────────────

describe('PUT /api/alerts/read-all', () => {
  it('returns 200 success', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });

    const res = await request(app).put('/api/alerts/read-all');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 500 on db error', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockRejectedValue(new Error('db')) }),
    });

    const res = await request(app).put('/api/alerts/read-all');
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/alerts/:id/read ─────────────────────────

describe('PUT /api/alerts/:id/read', () => {
  it('returns 200 when alert is found', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([mockAlert]) }),
      }),
    });

    const res = await request(app).put('/api/alerts/alert-1/read');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when alert is not found', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }),
      }),
    });

    const res = await request(app).put('/api/alerts/nonexistent/read');
    expect(res.status).toBe(404);
  });

  it('returns 500 on db error', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ returning: vi.fn().mockRejectedValue(new Error('db')) }),
      }),
    });

    const res = await request(app).put('/api/alerts/alert-1/read');
    expect(res.status).toBe(500);
  });
});
