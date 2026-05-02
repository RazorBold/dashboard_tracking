import { describe, it, expect } from 'vitest';
import { topMenuItems, sidebarMenus } from '../config/navigation';

describe('topMenuItems', () => {
  it('has 5 top-level menu items', () => {
    expect(topMenuItems).toHaveLength(5);
  });

  it('includes monitor, report, device, video, fleet', () => {
    const keys = topMenuItems.map((m) => m.key);
    expect(keys).toEqual(['monitor', 'report', 'device', 'video', 'fleet']);
  });

  it('each item has key, label, icon and path', () => {
    for (const item of topMenuItems) {
      expect(item.key).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
      expect(item.path).toMatch(/^\//);
    }
  });
});

describe('sidebarMenus', () => {
  it('has an entry for every top menu key', () => {
    const topKeys = topMenuItems.map((m) => m.key);
    for (const key of topKeys) {
      expect(sidebarMenus).toHaveProperty(key);
    }
  });

  it('monitor has 4 sidebar items', () => {
    expect(sidebarMenus.monitor.items).toHaveLength(4);
  });

  it('monitor sidebar items have correct paths', () => {
    const paths = sidebarMenus.monitor.items.map((i) => i.path);
    expect(paths).toContain('/monitor/objects');
    expect(paths).toContain('/monitor/alerts');
    expect(paths).toContain('/monitor/tracks');
    expect(paths).toContain('/monitor/multi-track');
  });

  it('report has 4 sidebar items', () => {
    expect(sidebarMenus.report.items).toHaveLength(4);
  });

  it('fleet has 5 sidebar items', () => {
    expect(sidebarMenus.fleet.items).toHaveLength(5);
  });

  it('video has no sidebar items', () => {
    expect(sidebarMenus.video.items).toHaveLength(0);
  });

  it('device has 1 sidebar item', () => {
    expect(sidebarMenus.device.items).toHaveLength(1);
  });

  it('each sidebar item has key, label, icon and path', () => {
    for (const config of Object.values(sidebarMenus)) {
      for (const item of config.items) {
        expect(item.key).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeTruthy();
        expect(item.path).toMatch(/^\//);
      }
    }
  });
});
