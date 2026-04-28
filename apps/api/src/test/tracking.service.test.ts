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
});
