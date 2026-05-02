import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/device.service', () => ({
  listDevices: vi.fn(),
  getDeviceById: vi.fn(),
  createDevice: vi.fn(),
  updateDevice: vi.fn(),
  deleteDevice: vi.fn(),
}));

vi.mock('../../services/tracking.service', () => ({
  getPositionHistory: vi.fn(),
  getLatestPosition: vi.fn(),
  getLatestPositions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/command.service', () => ({
  sendCommand: vi.fn(),
  getCommands: vi.fn(),
}));

import * as deviceSvc from '../../services/device.service';

let app: any;
beforeEach(async () => {
  vi.clearAllMocks();
  app = (await import('../../index')).default;
});

const mockDevice = {
  id: 'device-1',
  name: 'Test Device',
  imei: '123456789012345',
  model: 'GT06',
  status: 'online',
  organizationId: 'test-org-id',
  groupId: null,
  activatedAt: null,
  subscriptionExpiry: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── GET /api/devices ─────────────────────────────────

describe('GET /api/devices', () => {
  it('returns 200 with paginated data', async () => {
    vi.mocked(deviceSvc.listDevices).mockResolvedValue({ data: [mockDevice], total: 1 } as any);

    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(deviceSvc.listDevices).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/devices/:id ─────────────────────────────

describe('GET /api/devices/:id', () => {
  it('returns 200 when found', async () => {
    vi.mocked(deviceSvc.getDeviceById).mockResolvedValue(mockDevice as any);

    const res = await request(app).get('/api/devices/device-1');
    expect(res.status).toBe(200);
    expect(res.body.data.imei).toBe('123456789012345');
  });

  it('returns 404 when not found', async () => {
    vi.mocked(deviceSvc.getDeviceById).mockResolvedValue(null as any);

    const res = await request(app).get('/api/devices/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(deviceSvc.getDeviceById).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/devices/device-1');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/devices ────────────────────────────────

describe('POST /api/devices', () => {
  it('returns 201 on valid device', async () => {
    vi.mocked(deviceSvc.createDevice).mockResolvedValue(mockDevice as any);

    const res = await request(app)
      .post('/api/devices')
      .send({ name: 'Test Device', imei: '123456789012345' });

    expect(res.status).toBe(201);
    expect(res.body.data.imei).toBe('123456789012345');
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app).post('/api/devices').send({ name: 'No IMEI' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns 400 on invalid IMEI length', async () => {
    const res = await request(app)
      .post('/api/devices')
      .send({ name: 'Test', imei: '12345' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(deviceSvc.createDevice).mockRejectedValue(new Error('db'));

    const res = await request(app)
      .post('/api/devices')
      .send({ name: 'Test', imei: '123456789012345' });

    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/devices/:id ─────────────────────────────

describe('PUT /api/devices/:id', () => {
  it('returns 200 on valid update', async () => {
    vi.mocked(deviceSvc.updateDevice).mockResolvedValue({ ...mockDevice, name: 'Updated' } as any);

    const res = await request(app).put('/api/devices/device-1').send({ name: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('returns 400 on empty body', async () => {
    const res = await request(app).put('/api/devices/device-1').send({});
    expect([400, 422]).toContain(res.status);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(deviceSvc.updateDevice).mockRejectedValue(new Error('db'));

    const res = await request(app).put('/api/devices/device-1').send({ name: 'X' });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/devices/:id ──────────────────────────

describe('DELETE /api/devices/:id', () => {
  it('returns 200 on successful delete', async () => {
    vi.mocked(deviceSvc.deleteDevice).mockResolvedValue(mockDevice as any);

    const res = await request(app).delete('/api/devices/device-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(deviceSvc.deleteDevice).mockRejectedValue(new Error('db'));

    const res = await request(app).delete('/api/devices/device-1');
    expect(res.status).toBe(500);
  });
});
