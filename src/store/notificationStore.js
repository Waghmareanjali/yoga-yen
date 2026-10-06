import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  addNotification: (notification) => {
    const item = { id: Date.now() + Math.random(), ...notification };
    set((state) => ({ notifications: [...state.notifications, item] }));
    return item;
  },
  removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
  triggerBreakReminder: () => {
    const existing = get().notifications.some((n) => n.type === 'break');
    if (!existing) {
      get().addNotification({ type: 'break', title: 'Time to Move', description: 'A short stretch is recommended now.', duration: 5000 });
    }
  },
}));
