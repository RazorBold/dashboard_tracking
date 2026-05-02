import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/report.service', () => ({
  listReportTemplates: vi.fn(),
  createReportTemplate: vi.fn(),
  deleteReportTemplate: vi.fn(),
  runReport: vi.fn(),
  listAutoReports: vi.fn(),
  createAutoReport: vi.fn(),
  toggleAutoReport: vi.fn(),
  deleteAutoReport: vi.fn(),
}));

import * as reportSvc from '../../services/report.service';

let app: any;
beforeEach(async () => {
  vi.clearAllMocks();
  app = (await import('../../index')).default;
});

const mockAutoReport = {
  id: 'ar-1',
  organizationId: 'test-org-id',
  userId: 'test-user-id',
  name: 'Weekly Report',
  reportType: 'daily_activity',
  deviceId: null,
  frequency: 'weekly',
  executionTime: '08:00',
  email: 'test@example.com',
  isActive: true,
  lastRunAt: null,
  createdAt: new Date().toISOString(),
};

// ─── GET /api/auto-reports ────────────────────────────

describe('GET /api/auto-reports', () => {
  it('returns 200 with data array', async () => {
    vi.mocked(reportSvc.listAutoReports).mockResolvedValue([mockAutoReport] as any);

    const res = await request(app).get('/api/auto-reports');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(reportSvc.listAutoReports).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/auto-reports');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/auto-reports ───────────────────────────

describe('POST /api/auto-reports', () => {
  it('returns 201 on valid auto-report', async () => {
    vi.mocked(reportSvc.createAutoReport).mockResolvedValue(mockAutoReport as any);

    const res = await request(app)
      .post('/api/auto-reports')
      .send({
        name: 'Weekly Report',
        reportType: 'daily_activity',
        frequency: 'weekly',
        executionTime: '08:00',
        email: 'test@example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Weekly Report');
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app).post('/api/auto-reports').send({ name: 'No freq' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid email', async () => {
    const res = await request(app)
      .post('/api/auto-reports')
      .send({
        name: 'Bad Email',
        reportType: 'daily_activity',
        frequency: 'daily',
        executionTime: '08:00',
        email: 'not-an-email',
      });
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid execution time format', async () => {
    const res = await request(app)
      .post('/api/auto-reports')
      .send({
        name: 'Bad Time',
        reportType: 'daily_activity',
        frequency: 'daily',
        executionTime: '8:00',
        email: 'test@example.com',
      });
    expect(res.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(reportSvc.createAutoReport).mockRejectedValue(new Error('db'));

    const res = await request(app)
      .post('/api/auto-reports')
      .send({
        name: 'Weekly Report',
        reportType: 'daily_activity',
        frequency: 'weekly',
        executionTime: '08:00',
        email: 'test@example.com',
      });

    expect(res.status).toBe(500);
  });
});

// ─── PATCH /api/auto-reports/:id ──────────────────────

describe('PATCH /api/auto-reports/:id', () => {
  it('returns 200 on successful toggle', async () => {
    vi.mocked(reportSvc.toggleAutoReport).mockResolvedValue({ ...mockAutoReport, isActive: false } as any);

    const res = await request(app).patch('/api/auto-reports/ar-1');
    expect(res.status).toBe(200);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(reportSvc.toggleAutoReport).mockResolvedValue(null);

    const res = await request(app).patch('/api/auto-reports/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(reportSvc.toggleAutoReport).mockRejectedValue(new Error('db'));

    const res = await request(app).patch('/api/auto-reports/ar-1');
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/auto-reports/:id ────────────────────

describe('DELETE /api/auto-reports/:id', () => {
  it('returns 204 on successful delete', async () => {
    vi.mocked(reportSvc.deleteAutoReport).mockResolvedValue(true);

    const res = await request(app).delete('/api/auto-reports/ar-1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(reportSvc.deleteAutoReport).mockResolvedValue(false);

    const res = await request(app).delete('/api/auto-reports/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(reportSvc.deleteAutoReport).mockRejectedValue(new Error('db'));

    const res = await request(app).delete('/api/auto-reports/ar-1');
    expect(res.status).toBe(500);
  });
});
