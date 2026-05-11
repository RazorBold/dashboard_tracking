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

const mockTemplate = {
  id: 'tmpl-1',
  organizationId: 'test-org-id',
  userId: 'test-user-id',
  name: 'Daily Report',
  reportType: 'daily_activity',
  deviceId: null,
  dateFrom: null,
  dateTo: null,
  createdAt: new Date().toISOString(),
};

// ─── GET /api/report-templates ────────────────────────

describe('GET /api/report-templates', () => {
  it('returns 200 with data array', async () => {
    vi.mocked(reportSvc.listReportTemplates).mockResolvedValue([mockTemplate] as any);

    const res = await request(app).get('/api/report-templates');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(reportSvc.listReportTemplates).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/report-templates');
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/report-templates ───────────────────────

describe('POST /api/report-templates', () => {
  it('returns 201 on valid template', async () => {
    vi.mocked(reportSvc.createReportTemplate).mockResolvedValue(mockTemplate as any);

    const res = await request(app)
      .post('/api/report-templates')
      .send({ name: 'Daily Report', reportType: 'daily_activity' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Daily Report');
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app).post('/api/report-templates').send({ name: 'No type' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid reportType', async () => {
    const res = await request(app)
      .post('/api/report-templates')
      .send({ name: 'Bad', reportType: 'invalid_type' });
    expect(res.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(reportSvc.createReportTemplate).mockRejectedValue(new Error('db'));

    const res = await request(app)
      .post('/api/report-templates')
      .send({ name: 'Daily Report', reportType: 'daily_activity' });

    expect(res.status).toBe(500);
  });
});

// ─── GET /api/report-templates/:id/run ───────────────

describe('GET /api/report-templates/:id/run', () => {
  it('returns CSV file', async () => {
    vi.mocked(reportSvc.runReport).mockResolvedValue({ csv: 'col1,col2\nval1,val2', name: 'Daily Report' });

    const res = await request(app).get('/api/report-templates/tmpl-1/run');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('returns 404 when template not found', async () => {
    const err: any = new Error('Report template not found');
    err.message = 'Report template not found';
    vi.mocked(reportSvc.runReport).mockRejectedValue(err);

    const res = await request(app).get('/api/report-templates/nonexistent/run');
    expect(res.status).toBe(404);
  });

  it('returns 500 on other service error', async () => {
    vi.mocked(reportSvc.runReport).mockRejectedValue(new Error('db'));

    const res = await request(app).get('/api/report-templates/tmpl-1/run');
    expect(res.status).toBe(500);
  });
});

// ─── DELETE /api/report-templates/:id ────────────────

describe('DELETE /api/report-templates/:id', () => {
  it('returns 204 on successful delete', async () => {
    vi.mocked(reportSvc.deleteReportTemplate).mockResolvedValue(true);

    const res = await request(app).delete('/api/report-templates/tmpl-1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(reportSvc.deleteReportTemplate).mockResolvedValue(false);

    const res = await request(app).delete('/api/report-templates/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns 500 on service error', async () => {
    vi.mocked(reportSvc.deleteReportTemplate).mockRejectedValue(new Error('db'));

    const res = await request(app).delete('/api/report-templates/tmpl-1');
    expect(res.status).toBe(500);
  });
});
