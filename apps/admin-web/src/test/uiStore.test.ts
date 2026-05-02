import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../stores/uiStore';

// Reset Zustand store between tests
beforeEach(() => {
  useUIStore.setState({
    sidebarCollapsed: false,
    sidebarOpen: false,
    activeModule: 'monitor',
    isMobileMenuOpen: false,
  });
});

describe('useUIStore — sidebar', () => {
  it('starts with sidebar expanded', () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('toggleSidebar collapses the sidebar', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it('toggleSidebar expands after second call', () => {
    useUIStore.getState().toggleSidebar();
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setSidebarCollapsed sets value directly', () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().setSidebarCollapsed(false);
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setSidebarOpen controls mobile drawer', () => {
    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });
});

describe('useUIStore — active module', () => {
  it('defaults to monitor', () => {
    expect(useUIStore.getState().activeModule).toBe('monitor');
  });

  it('setActiveModule updates the active module', () => {
    useUIStore.getState().setActiveModule('fleet');
    expect(useUIStore.getState().activeModule).toBe('fleet');
  });

  it('setActiveModule handles all valid modules', () => {
    const modules = ['monitor', 'report', 'device', 'video', 'fleet'];
    for (const mod of modules) {
      useUIStore.getState().setActiveModule(mod);
      expect(useUIStore.getState().activeModule).toBe(mod);
    }
  });
});

describe('useUIStore — mobile menu', () => {
  it('starts with mobile menu closed', () => {
    expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
  });

  it('setMobileMenuOpen opens mobile menu', () => {
    useUIStore.getState().setMobileMenuOpen(true);
    expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
  });

  it('setMobileMenuOpen closes mobile menu', () => {
    useUIStore.getState().setMobileMenuOpen(true);
    useUIStore.getState().setMobileMenuOpen(false);
    expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
  });
});
