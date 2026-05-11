import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';
import { broadcastAlert } from '../config/websocket';

let alertService: typeof import('../services/alert.service');

// Helper to mock chained drizzle calls
function mockInsertChain(returned: unknown) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([returned]),
  };
  vi.mocked(db.insert).mockReturnValue(chain as any);
  return chain;
}

beforeEach(async () => {
  vi.clearAllMocks();
  alertService = await import('../services/alert.service');
});

const mockDevice = {
  id: 'dev-1',
  name: 'Test Device',
  imei: '123456789',
  organizationId: 'org-1',
};

const mockVehicle = {
  id: 'veh-1',
  deviceId: 'dev-1',
  maxSpeed: 80, // km/h
};

describe('AlertService.detectAlerts', () => {
  // ─── Overspeed ────────────────────────────────────────

  it('detects overspeed when current speed exceeds maxSpeed', async () => {
    const insertMock = mockInsertChain({ id: 'alert-1' });
    const currentPos = { speed: 85, lat: -6.2, lng: 106.8, acc: true };
    const prevPos = { speed: 75, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, prevPos, currentPos);

    expect(db.insert).toHaveBeenCalled();
    expect(insertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'dev-1',
        organizationId: 'org-1',
        type: 'overspeed',
        severity: 'warning',
      })
    );
    expect(broadcastAlert).toHaveBeenCalled();
  });

  it('does not detect overspeed when speed is below maxSpeed', async () => {
    mockInsertChain({ id: 'alert-1' });
    const currentPos = { speed: 70, lat: -6.2, lng: 106.8, acc: true };
    const prevPos = { speed: 60, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, prevPos, currentPos);

    expect(db.insert).not.toHaveBeenCalled();
  });

  it('does not re-trigger overspeed if previous speed was also over limit', async () => {
    mockInsertChain({ id: 'alert-1' });
    const currentPos = { speed: 90, lat: -6.2, lng: 106.8, acc: true };
    const prevPos = { speed: 85, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, prevPos, currentPos);

    expect(db.insert).not.toHaveBeenCalled();
  });

  it('does not detect overspeed if no vehicle is linked', async () => {
    mockInsertChain({ id: 'alert-1' });
    const currentPos = { speed: 120, lat: -6.2, lng: 106.8, acc: true };
    const prevPos = { speed: 0, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, null, prevPos, currentPos);

    expect(db.insert).not.toHaveBeenCalled();
  });

  // ─── ACC ON ───────────────────────────────────────────

  it('detects acc_on when previous acc was false and current is true', async () => {
    const insertMock = mockInsertChain({ id: 'alert-2' });
    const currentPos = { speed: 0, lat: -6.2, lng: 106.8, acc: true };
    const prevPos = { speed: 0, lat: -6.2, lng: 106.8, acc: false };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, prevPos, currentPos);

    expect(insertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'acc_on',
        severity: 'info',
      })
    );
  });

  // ─── ACC OFF ──────────────────────────────────────────

  it('detects acc_off when previous acc was true and current is false', async () => {
    const insertMock = mockInsertChain({ id: 'alert-3' });
    const currentPos = { speed: 0, lat: -6.2, lng: 106.8, acc: false };
    const prevPos = { speed: 0, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, prevPos, currentPos);

    expect(insertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'acc_off',
        severity: 'info',
      })
    );
  });

  it('does not detect acc change if acc state is the same', async () => {
    mockInsertChain({ id: 'alert-4' });
    const currentPos = { speed: 0, lat: -6.2, lng: 106.8, acc: true };
    const prevPos = { speed: 0, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, prevPos, currentPos);

    // No overspeed (speed=0 < 80) and no acc change → no insert
    expect(db.insert).not.toHaveBeenCalled();
  });

  // ─── No organization ──────────────────────────────────

  it('skips all detection if device has no organizationId', async () => {
    mockInsertChain({ id: 'alert-5' });
    const deviceWithoutOrg = { ...mockDevice, organizationId: null };
    const currentPos = { speed: 100, lat: -6.2, lng: 106.8, acc: true };
    const prevPos = { speed: 70, lat: -6.2, lng: 106.8, acc: false };

    await alertService.detectAlerts(deviceWithoutOrg as any, mockVehicle as any, prevPos, currentPos);

    expect(db.insert).not.toHaveBeenCalled();
  });

  // ─── No previous position ─────────────────────────────

  it('detects first-time overspeed even when previousPosition is null', async () => {
    const insertMock = mockInsertChain({ id: 'alert-6' });
    const currentPos = { speed: 100, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, null, currentPos);

    expect(insertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'overspeed' })
    );
  });

  it('does not detect acc change when previousPosition is null', async () => {
    mockInsertChain({ id: 'alert-7' });
    // Only overspeed possible, but speed below limit
    const currentPos = { speed: 50, lat: -6.2, lng: 106.8, acc: true };

    await alertService.detectAlerts(mockDevice as any, mockVehicle as any, null, currentPos);

    expect(db.insert).not.toHaveBeenCalled();
  });
});
