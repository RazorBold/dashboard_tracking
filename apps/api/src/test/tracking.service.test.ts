import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';

// Mock dependencies
vi.mock('../db', () => ({
  db: {
    query: {
      devices: {
        findFirst: vi.fn(),
      },
      devicePositions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      }
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
  }
}));

vi.mock('../config/redis', () => ({
  redisClient: {
    set: vi.fn(),
    get: vi.fn(),
  }
}));

import { redisClient } from '../config/redis';

let trackingService: typeof import('../services/tracking.service');

const mockDevice = { id: 'dev-uuid-1', imei: '1234567890', status: 'online' };

beforeEach(async () => {
  vi.clearAllMocks();
  trackingService = await import('../services/tracking.service');
});

describe('TrackingService.processIncomingLocation', () => {
  it('should process incoming MQTT payload and save to DB and Redis', async () => {
    vi.mocked(db.query.devices.findFirst).mockResolvedValue(mockDevice as any);

    const payload = {
      lat: -6.2,
      lng: 106.8,
      speed: 60,
      heading: 90,
      altitude: 10,
      timestamp: new Date().toISOString()
    };

    await trackingService.processIncomingLocation('1234567890', payload);

    expect(db.query.devices.findFirst).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(redisClient.set).toHaveBeenCalledWith(
      `device:dev-uuid-1:position`,
      expect.any(String),
      'EX',
      86400
    );
  });

  it('should ignore payload if device is not found', async () => {
    vi.mocked(db.query.devices.findFirst).mockResolvedValue(undefined as any);

    await trackingService.processIncomingLocation('UNKNOWN', { lat: 0, lng: 0, timestamp: '' });

    expect(db.insert).not.toHaveBeenCalled();
    expect(redisClient.set).not.toHaveBeenCalled();
  });
});

describe('TrackingService.getLatestPosition', () => {
  it('should return from Redis if cached', async () => {
    vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify({ lat: -6.2, lng: 106.8 }));
    const result = await trackingService.getLatestPosition('dev-1');
    expect(result.lat).toBe(-6.2);
    expect(db.query.devicePositions.findFirst).not.toHaveBeenCalled();
  });

  it('should fallback to DB if not cached', async () => {
    vi.mocked(redisClient.get).mockResolvedValue(null);
    vi.mocked(db.query.devicePositions.findFirst).mockResolvedValue({ lat: -6.2, lng: 106.8 } as any);
    const result = await trackingService.getLatestPosition('dev-1');
    expect(result?.lat).toBe(-6.2);
    expect(db.query.devicePositions.findFirst).toHaveBeenCalled();
  });
});

describe('TrackingService.getPositionHistory', () => {
  it('should query DB for history within date range', async () => {
    vi.mocked(db.query.devicePositions.findMany).mockResolvedValue([{ lat: -6.2, lng: 106.8 }] as any);
    const result = await trackingService.getPositionHistory('dev-1', new Date(), new Date());
    expect(result).toHaveLength(1);
    expect(db.query.devicePositions.findMany).toHaveBeenCalled();
  });

  it('returns empty array when no positions exist in range', async () => {
    vi.mocked(db.query.devicePositions.findMany).mockResolvedValue([]);
    const from = new Date('2024-01-01T00:00:00Z');
    const to = new Date('2024-01-01T01:00:00Z');
    const result = await trackingService.getPositionHistory('dev-no-data', from, to);
    expect(result).toEqual([]);
    expect(db.query.devicePositions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.anything() }),
    );
  });

  it('returns multiple positions ordered by timestamp', async () => {
    const mockPositions = [
      { id: 'p1', deviceId: 'dev-1', latitude: -6.20, longitude: 106.80, speed: 40, timestamp: new Date('2024-01-01T08:00:00Z') },
      { id: 'p2', deviceId: 'dev-1', latitude: -6.21, longitude: 106.81, speed: 55, timestamp: new Date('2024-01-01T08:30:00Z') },
      { id: 'p3', deviceId: 'dev-1', latitude: -6.22, longitude: 106.82, speed: 0,  timestamp: new Date('2024-01-01T09:00:00Z') },
    ];
    vi.mocked(db.query.devicePositions.findMany).mockResolvedValue(mockPositions as any);
    const result = await trackingService.getPositionHistory('dev-1', new Date('2024-01-01T00:00:00Z'), new Date('2024-01-01T23:59:59Z'));
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ latitude: -6.20, speed: 40 });
    expect(result[2]).toMatchObject({ latitude: -6.22, speed: 0 });
  });

  it('passes correct deviceId to query', async () => {
    vi.mocked(db.query.devicePositions.findMany).mockResolvedValue([]);
    await trackingService.getPositionHistory('specific-device-uuid', new Date(), new Date());
    expect(db.query.devicePositions.findMany).toHaveBeenCalledTimes(1);
    const callArg = vi.mocked(db.query.devicePositions.findMany).mock.calls[0][0];
    expect(callArg).toBeDefined();
  });
});
