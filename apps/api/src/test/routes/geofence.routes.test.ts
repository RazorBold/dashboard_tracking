import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/geofence.service', () => ({
  listGeofences: vi.fn(),
  createGeofence: vi.fn(),
  updateGeofence: vi.fn(),
  deleteGeofence: vi.fn(),
  isPointInGeofence: vi.fn(),
}));

import * as geofenceSvc from '../../services/geofence.service';

let app: any;
beforeEach(async () => {
  vi.clearAllMocks();
  app = (await import('../../index')).default;
});

const mockFence = {
  id: 'fence-1',
  organizationId: 'test-org-id',
  name: 'Test Fence',
  type: 'circle' as const,
  geometry: { center: { lat: -6.2, lng: 106.8 }, radius: 300 },
  description: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── GET /api/geofences ───────────────────────────────

describe('GET /api/geofences', () => {
  it('returns 200 with data array', async () => {
    vi.mocked(geofenceSvc.listGeofences).mockResolvedValue([mockFence] as any);

    const res = await request(app).get('/api/geofences');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(geofenceSvc.listGeofences).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/geofences');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/geofences ──────────────────────────────

describe('POST /api/geofences', () => {
  it('returns 201 on valid circle geofence', async () => {
    vi.mocked(geofenceSvc.createGeofence).mockResolvedValue(mockFence as any);

    const res = await request(app)
      .post('/api/geofences')
      .send({ name: 'Test Fence', type: 'circle', geometry: { center: { lat: -6.2, lng: 106.8 }, radius: 300 } });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Fence');
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app).post('/api/geofences').send({ name: 'No type' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on polygon with less than 3 points', async () => {
    const res = await request(app)
      .post('/api/geofences')
      .send({ name: 'Bad Polygon', type: 'polygon', geometry: { points: [{ lat: 0, lng: 0 }] } });
    expect(res.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(geofenceSvc.createGeofence).mockRejectedValue(new Error('db'));

    const res = await request(app)
      .post('/api/geofences')
      .send({ name: 'Test Fence', type: 'circle', geometry: { center: { lat: -6.2, lng: 106.8 }, radius: 300 } });

    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/geofences/:id ───────────────────────────

describe('PUT /api/geofences/:id', () => {
  it('returns 200 on valid update', async () => {
    vi.mocked(geofenceSvc.updateGeofence).mockResolvedValue({ ...mockFence, name: 'Updated' } as any);

    const res = await request(app).put('/api/geofences/fence-1').send({ name: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(geofenceSvc.updateGeofence).mockResolvedValue(null as any);

    const res = await request(app).put('/api/geofences/nonexistent').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(geofenceSvc.updateGeofence).mockRejectedValue(new Error('db'));

    const res = await request(app).put('/api/geofences/fence-1').send({ name: 'X' });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/geofences/:id ────────────────────────

describe('DELETE /api/geofences/:id', () => {
  it('returns 204 on successful delete', async () => {
    vi.mocked(geofenceSvc.deleteGeofence).mockResolvedValue(true);

    const res = await request(app).delete('/api/geofences/fence-1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(geofenceSvc.deleteGeofence).mockResolvedValue(false);

    const res = await request(app).delete('/api/geofences/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(geofenceSvc.deleteGeofence).mockRejectedValue(new Error('db'));

    const res = await request(app).delete('/api/geofences/fence-1');
    expect(res.status).toBe(500);
  });
});
