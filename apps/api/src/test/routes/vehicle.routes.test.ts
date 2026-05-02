import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/vehicle.service', () => ({
  listVehicles: vi.fn(),
  getVehicleById: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  bindDevice: vi.fn(),
  unbindDevice: vi.fn(),
  exportVehiclesCsv: vi.fn(),
}));

import * as vehicleSvc from '../../services/vehicle.service';

let app: any;
beforeEach(async () => {
  vi.clearAllMocks();
  app = (await import('../../index')).default;
});

const mockVehicle = {
  id: 'vehicle-1',
  plateNo: 'B 1234 ABC',
  type: 'car',
  make: 'Toyota',
  model: 'Innova',
  status: 'active',
  organizationId: 'test-org-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── GET /api/vehicles ────────────────────────────────

describe('GET /api/vehicles', () => {
  it('returns 200 with paginated data', async () => {
    vi.mocked(vehicleSvc.listVehicles).mockResolvedValue({ data: [mockVehicle], total: 1, page: 1, limit: 20 } as any);

    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(vehicleSvc.listVehicles).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/vehicles/export ─────────────────────────

describe('GET /api/vehicles/export', () => {
  it('returns CSV file', async () => {
    vi.mocked(vehicleSvc.exportVehiclesCsv).mockResolvedValue('plateNo,type\nB 1234 ABC,car');

    const res = await request(app).get('/api/vehicles/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(vehicleSvc.exportVehiclesCsv).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/vehicles/export');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/vehicles/:id ────────────────────────────

describe('GET /api/vehicles/:id', () => {
  it('returns 200 when found', async () => {
    vi.mocked(vehicleSvc.getVehicleById).mockResolvedValue(mockVehicle as any);

    const res = await request(app).get('/api/vehicles/vehicle-1');
    expect(res.status).toBe(200);
    expect(res.body.data.plateNo).toBe('B 1234 ABC');
  });

  it('returns 404 when not found', async () => {
    vi.mocked(vehicleSvc.getVehicleById).mockResolvedValue(null as any);

    const res = await request(app).get('/api/vehicles/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/vehicles ───────────────────────────────

describe('POST /api/vehicles', () => {
  it('returns 201 on valid vehicle', async () => {
    vi.mocked(vehicleSvc.createVehicle).mockResolvedValue(mockVehicle as any);

    const res = await request(app).post('/api/vehicles').send({ plateNo: 'B 1234 ABC' });
    expect(res.status).toBe(201);
    expect(res.body.data.plateNo).toBe('B 1234 ABC');
  });

  it('returns 400 on missing plateNo', async () => {
    const res = await request(app).post('/api/vehicles').send({ make: 'Toyota' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(vehicleSvc.createVehicle).mockRejectedValue(new Error('db'));

    const res = await request(app).post('/api/vehicles').send({ plateNo: 'B 1234 ABC' });
    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/vehicles/:id ────────────────────────────

describe('PUT /api/vehicles/:id', () => {
  it('returns 200 on valid update', async () => {
    vi.mocked(vehicleSvc.updateVehicle).mockResolvedValue({ ...mockVehicle, plateNo: 'B 9999 XYZ' } as any);

    const res = await request(app).put('/api/vehicles/vehicle-1').send({ plateNo: 'B 9999 XYZ' });
    expect(res.status).toBe(200);
  });

  it('returns 400 on empty body', async () => {
    const res = await request(app).put('/api/vehicles/vehicle-1').send({});
    expect([400, 422]).toContain(res.status);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(vehicleSvc.updateVehicle).mockRejectedValue(new Error('db'));

    const res = await request(app).put('/api/vehicles/vehicle-1').send({ plateNo: 'B 9999 XYZ' });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/vehicles/:id ─────────────────────────

describe('DELETE /api/vehicles/:id', () => {
  it('returns 200 on successful delete', async () => {
    vi.mocked(vehicleSvc.deleteVehicle).mockResolvedValue(mockVehicle as any);

    const res = await request(app).delete('/api/vehicles/vehicle-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(vehicleSvc.deleteVehicle).mockRejectedValue(new Error('db'));

    const res = await request(app).delete('/api/vehicles/vehicle-1');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/vehicles/:id/bind-device ──────────────

describe('POST /api/vehicles/:id/bind-device', () => {
  it('returns 200 on successful bind', async () => {
    vi.mocked(vehicleSvc.bindDevice).mockResolvedValue({ ...mockVehicle, deviceId: 'device-1' } as any);

    const res = await request(app)
      .post('/api/vehicles/vehicle-1/bind-device')
      .send({ deviceId: '550e8400-e29b-41d4-a716-446655440000' });

    expect(res.status).toBe(200);
  });

  it('returns 400 on invalid deviceId format', async () => {
    const res = await request(app)
      .post('/api/vehicles/vehicle-1/bind-device')
      .send({ deviceId: 'not-a-uuid' });

    expect([400, 422]).toContain(res.status);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(vehicleSvc.bindDevice).mockRejectedValue(new Error('db'));

    const res = await request(app)
      .post('/api/vehicles/vehicle-1/bind-device')
      .send({ deviceId: '550e8400-e29b-41d4-a716-446655440000' });

    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/vehicles/:id/bind-device ────────────

describe('DELETE /api/vehicles/:id/bind-device', () => {
  it('returns 200 on successful unbind', async () => {
    vi.mocked(vehicleSvc.unbindDevice).mockResolvedValue({ ...mockVehicle, deviceId: null } as any);

    const res = await request(app).delete('/api/vehicles/vehicle-1/bind-device');
    expect(res.status).toBe(200);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(vehicleSvc.unbindDevice).mockRejectedValue(new Error('db'));

    const res = await request(app).delete('/api/vehicles/vehicle-1/bind-device');
    expect(res.status).toBe(500);
  });
});
