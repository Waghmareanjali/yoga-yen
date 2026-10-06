import { create } from 'zustand';

const defaultSettings = {
  theme: localStorage.getItem('yoga-yen-theme') || 'light',
  sidebarCollapsed: false,
  notificationsEnabled: true,
};

export const useSettingsStore = create((set) => ({
  theme: defaultSettings.theme,
  sidebarCollapsed: defaultSettings.sidebarCollapsed,
  notificationsEnabled: defaultSettings.notificationsEnabled,
  setTheme: (theme) => {
    localStorage.setItem('yoga-yen-theme', theme);
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('yoga-yen-theme', next);
    document.documentElement.dataset.theme = next;
    return { theme: next };
  }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
}));
