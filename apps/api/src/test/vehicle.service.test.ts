import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';

let vehicleService: typeof import('../services/vehicle.service');

const mockVehicle = {
  id: 'veh-uuid-1',
  plateNo: 'B 1234 ABC',
  type: 'car' as const,
  make: 'Toyota',
  model: 'Avanza',
  maxSpeed: 120,
  vin: null,
  sn: null,
  deviceId: null,
  organizationId: null,
  status: 'active' as const,
  insuranceStatus: 'none' as const,
  insuranceExpiry: null,
  accumulatedMileage: 0,
  ownerName: 'John',
  ownerPhone: '08123456789',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue(rows),
  };
  vi.mocked(db.select).mockReturnValue(chain as any);
  return chain;
}

function mockInsertChain(returned: unknown) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([returned]),
  };
  vi.mocked(db.insert).mockReturnValue(chain as any);
  return chain;
}

function mockUpdateChain(returned: unknown) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([returned]),
  };
  vi.mocked(db.update).mockReturnValue(chain as any);
  return chain;
}

function mockDeleteChain(returned: unknown[] = []) {
  const chain = {
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returned),
  };
  vi.mocked(db.delete).mockReturnValue(chain as any);
  return chain;
}

beforeEach(async () => {
  vi.clearAllMocks();
  vehicleService = await import('../services/vehicle.service');
});

describe('VehicleService.list', () => {
  it('returns paginated vehicles', async () => {
    mockSelectChain([mockVehicle]);
    const result = await vehicleService.listVehicles({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].plateNo).toBe('B 1234 ABC');
    expect(result.meta.page).toBe(1);
  });

  it('returns empty list when no vehicles', async () => {
    mockSelectChain([]);
    const result = await vehicleService.listVehicles({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(0);
  });

  it('accepts search by plate number', async () => {
    mockSelectChain([mockVehicle]);
    const result = await vehicleService.listVehicles({ page: 1, limit: 10, search: 'B 1234' });
    expect(result.data).toHaveLength(1);
  });

  it('accepts status filter', async () => {
    mockSelectChain([mockVehicle]);
    const result = await vehicleService.listVehicles({ page: 1, limit: 10, status: 'active' });
    expect(result.data).toHaveLength(1);
  });
});

describe('VehicleService.getById', () => {
  it('returns a vehicle by id', async () => {
    mockSelectChain([mockVehicle]);
    const result = await vehicleService.getVehicleById('veh-uuid-1');
    expect(result?.id).toBe('veh-uuid-1');
  });

  it('returns null when not found', async () => {
    mockSelectChain([]);
    const result = await vehicleService.getVehicleById('no-such-id');
    expect(result).toBeNull();
  });
});

describe('VehicleService.create', () => {
  it('creates a vehicle and returns it', async () => {
    mockInsertChain(mockVehicle);
    const result = await vehicleService.createVehicle({
      plateNo: 'B 1234 ABC',
      type: 'car',
      make: 'Toyota',
      model: 'Avanza',
      maxSpeed: 120,
    });
    expect(result.plateNo).toBe('B 1234 ABC');
  });
});

describe('VehicleService.update', () => {
  it('updates a vehicle', async () => {
    const updated = { ...mockVehicle, maxSpeed: 100 };
    mockUpdateChain(updated);
    const result = await vehicleService.updateVehicle('veh-uuid-1', { maxSpeed: 100 });
    expect(result.maxSpeed).toBe(100);
  });

  it('throws 404 when vehicle not found', async () => {
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    } as any);
    await expect(
      vehicleService.updateVehicle('no-such-id', { maxSpeed: 100 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('VehicleService.delete', () => {
  it('deletes a vehicle', async () => {
    mockDeleteChain([mockVehicle]);
    const result = await vehicleService.deleteVehicle('veh-uuid-1');
    expect(result.id).toBe('veh-uuid-1');
  });

  it('throws 404 when vehicle not found', async () => {
    mockDeleteChain([]);
    await expect(
      vehicleService.deleteVehicle('no-such-id')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('VehicleService.bindDevice', () => {
  it('binds a device to vehicle', async () => {
    const bound = { ...mockVehicle, deviceId: 'dev-uuid-1' };
    mockUpdateChain(bound);
    const result = await vehicleService.bindDevice('veh-uuid-1', 'dev-uuid-1');
    expect(result.deviceId).toBe('dev-uuid-1');
  });

  it('unbinds device from vehicle (null deviceId)', async () => {
    const unbound = { ...mockVehicle, deviceId: null };
    mockUpdateChain(unbound);
    const result = await vehicleService.unbindDevice('veh-uuid-1');
    expect(result.deviceId).toBeNull();
  });

  it('throws 404 when vehicle not found on bind', async () => {
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    } as any);
    await expect(
      vehicleService.bindDevice('no-such-id', 'dev-uuid-1')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
