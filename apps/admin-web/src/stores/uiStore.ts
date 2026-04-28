import { create } from 'zustand';

interface UIStore {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarOpen: boolean; // for mobile drawer
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;

  // Active module (top nav)
  activeModule: string;
  setActiveModule: (module: string) => void;

  // Mobile
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  sidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Active module
  activeModule: 'monitor',
  setActiveModule: (module) => set({ activeModule: module }),

  // Mobile
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}));
