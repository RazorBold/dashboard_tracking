import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';

let groupService: typeof import('../services/device-group.service');

const mockGroup = {
  id: 'grp-uuid-1',
  name: 'Armada Jakarta',
  description: 'Kendaraan wilayah Jakarta',
  organizationId: null,
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
  groupService = await import('../services/device-group.service');
});

describe('DeviceGroupService.list', () => {
  it('returns all device groups', async () => {
    mockSelectChain([mockGroup]);
    const result = await groupService.listDeviceGroups();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Armada Jakarta');
  });

  it('returns empty array when no groups', async () => {
    mockSelectChain([]);
    const result = await groupService.listDeviceGroups();
    expect(result).toHaveLength(0);
  });
});

describe('DeviceGroupService.create', () => {
  it('creates a group', async () => {
    mockInsertChain(mockGroup);
    const result = await groupService.createDeviceGroup({
      name: 'Armada Jakarta',
      description: 'Kendaraan wilayah Jakarta',
    });
    expect(result.name).toBe('Armada Jakarta');
  });
});

describe('DeviceGroupService.update', () => {
  it('updates a group', async () => {
    const updated = { ...mockGroup, name: 'Fleet Updated' };
    mockUpdateChain(updated);
    const result = await groupService.updateDeviceGroup('grp-uuid-1', { name: 'Fleet Updated' });
    expect(result.name).toBe('Fleet Updated');
  });

  it('throws 404 when group not found', async () => {
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    } as any);
    await expect(
      groupService.updateDeviceGroup('no-such-id', { name: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DeviceGroupService.delete', () => {
  it('deletes a group', async () => {
    mockDeleteChain([mockGroup]);
    const result = await groupService.deleteDeviceGroup('grp-uuid-1');
    expect(result.id).toBe('grp-uuid-1');
  });

  it('throws 404 when group not found', async () => {
    mockDeleteChain([]);
    await expect(
      groupService.deleteDeviceGroup('no-such-id')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DeviceGroupService.assignDevices', () => {
  it('assigns devices to a group', async () => {
    // Batch update: each device updated
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'dev-1' }]),
    } as any);
    const result = await groupService.assignDevicesToGroup('grp-uuid-1', ['dev-1']);
    expect(result.assigned).toBe(1);
  });
});
