import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';

// We import the service AFTER mocks are set up
// Using dynamic import to ensure mocks apply
let deviceService: typeof import('../services/device.service');

const mockDevice = {
  id: 'dev-uuid-1',
  name: 'Tracker A',
  imei: '123456789012345',
  model: 'GT06N',
  status: 'offline' as const,
  organizationId: null,
  groupId: null,
  activatedAt: null,
  subscriptionExpiry: null,
  expiresAt: null,
  lastOnline: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper to mock chained drizzle calls: db.select().from().where().limit().offset()
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
  deviceService = await import('../services/device.service');
});

describe('DeviceService.list', () => {
  it('returns paginated devices', async () => {
    mockSelectChain([mockDevice]);
    const result = await deviceService.listDevices({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].imei).toBe('123456789012345');
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
  });

  it('returns empty array when no devices', async () => {
    mockSelectChain([]);
    const result = await deviceService.listDevices({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(0);
  });

  it('accepts search query', async () => {
    mockSelectChain([mockDevice]);
    const result = await deviceService.listDevices({ page: 1, limit: 10, search: 'Tracker' });
    expect(result.data).toHaveLength(1);
  });

  it('accepts status filter', async () => {
    mockSelectChain([mockDevice]);
    const result = await deviceService.listDevices({ page: 1, limit: 10, status: 'offline' });
    expect(result.data).toHaveLength(1);
  });
});

describe('DeviceService.getById', () => {
  it('returns a device by id', async () => {
    mockSelectChain([mockDevice]);
    const result = await deviceService.getDeviceById('dev-uuid-1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('dev-uuid-1');
  });

  it('returns null when device not found', async () => {
    mockSelectChain([]);
    const result = await deviceService.getDeviceById('not-exist');
    expect(result).toBeNull();
  });
});

describe('DeviceService.create', () => {
  it('creates a device and returns it', async () => {
    mockInsertChain(mockDevice);
    const result = await deviceService.createDevice({
      name: 'Tracker A',
      imei: '123456789012345',
      model: 'GT06N',
    });
    expect(result.imei).toBe('123456789012345');
    expect(db.insert).toHaveBeenCalledOnce();
  });

  it('throws AppError on duplicate IMEI', async () => {
    // Simulate unique constraint violation
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockRejectedValue({ code: '23505', detail: 'Key (imei)' }),
    } as any);
    await expect(
      deviceService.createDevice({ name: 'X', imei: '123456789012345' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('DeviceService.update', () => {
  it('updates a device', async () => {
    const updated = { ...mockDevice, name: 'Tracker Updated' };
    mockUpdateChain(updated);
    const result = await deviceService.updateDevice('dev-uuid-1', { name: 'Tracker Updated' });
    expect(result.name).toBe('Tracker Updated');
  });

  it('throws 404 when device not found', async () => {
    mockUpdateChain(undefined);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    } as any);
    await expect(
      deviceService.updateDevice('not-exist', { name: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DeviceService.delete', () => {
  it('deletes a device', async () => {
    mockDeleteChain([mockDevice]);
    const result = await deviceService.deleteDevice('dev-uuid-1');
    expect(result.id).toBe('dev-uuid-1');
  });

  it('throws 404 when device not found', async () => {
    mockDeleteChain([]);
    await expect(
      deviceService.deleteDevice('not-exist')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
