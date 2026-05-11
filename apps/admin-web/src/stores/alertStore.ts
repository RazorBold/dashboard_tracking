import { create } from 'zustand';

interface AlertStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useAlertStore = create<AlertStore>()((set, get) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set({ unreadCount: Math.max(0, get().unreadCount - 1) }),
  clearUnread: () => set({ unreadCount: 0 }),
}));
