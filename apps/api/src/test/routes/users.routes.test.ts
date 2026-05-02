import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/user.service', () => ({
  listOrgUsers: vi.fn(),
  getOrgStats: vi.fn(),
  createOrgUser: vi.fn(),
  updateOrgUser: vi.fn(),
  deleteOrgUser: vi.fn(),
}));

import * as userSvc from '../../services/user.service';

let app: any;
beforeEach(async () => {
  vi.clearAllMocks();
  app = (await import('../../index')).default;
});

const mockUser = {
  id: 'user-1',
  organizationId: 'test-org-id',
  name: 'Test User',
  email: 'user@example.com',
  role: 'operator',
  createdAt: new Date().toISOString(),
};

const mockStats = {
  totalDevices: 10,
  activeDevices: 7,
  totalUsers: 3,
  totalVehicles: 5,
};

// ─── GET /api/users ───────────────────────────────────

describe('GET /api/users', () => {
  it('returns 200 with data array', async () => {
    vi.mocked(userSvc.listOrgUsers).mockResolvedValue([mockUser] as any);

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(userSvc.listOrgUsers).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/users/stats ─────────────────────────────

describe('GET /api/users/stats', () => {
  it('returns 200 with stats object', async () => {
    vi.mocked(userSvc.getOrgStats).mockResolvedValue(mockStats as any);

    const res = await request(app).get('/api/users/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalDevices');
  });

  it('returns 500 on service error', async () => {
    vi.mocked(userSvc.getOrgStats).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/users/stats');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/users ──────────────────────────────────

describe('POST /api/users', () => {
  it('returns 201 on valid user', async () => {
    vi.mocked(userSvc.createOrgUser).mockResolvedValue(mockUser as any);

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'user@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('user@example.com');
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app).post('/api/users').send({ name: 'No email' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns 400 on invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'not-email', password: 'password123' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns 400 on password too short', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'test@example.com', password: '123' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(userSvc.createOrgUser).mockRejectedValue(new Error('db'));

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'user@example.com', password: 'password123' });

    expect(res.status).toBe(500);
  });
});

// ─── PUT /api/users/:id ───────────────────────────────

describe('PUT /api/users/:id', () => {
  it('returns 200 on valid update', async () => {
    vi.mocked(userSvc.updateOrgUser).mockResolvedValue({ ...mockUser, name: 'Updated' } as any);

    const res = await request(app).put('/api/users/user-1').send({ name: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('returns 400 on empty body', async () => {
    const res = await request(app).put('/api/users/user-1').send({});
    expect([400, 422]).toContain(res.status);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(userSvc.updateOrgUser).mockRejectedValue(new Error('db'));

    const res = await request(app).put('/api/users/user-1').send({ name: 'X' });
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/users/:id ────────────────────────────

describe('DELETE /api/users/:id', () => {
  it('returns 200 on successful delete', async () => {
    vi.mocked(userSvc.deleteOrgUser).mockResolvedValue(undefined);

    const res = await request(app).delete('/api/users/user-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(userSvc.deleteOrgUser).mockRejectedValue(new Error('db'));

    const res = await request(app).delete('/api/users/user-1');
    expect(res.status).toBe(500);
  });
});
