import { create } from 'zustand';
import { DEFAULT_CAPTURE_SECONDS, CALIBRATION_DEFAULT, SAMPLING_INTERVAL_DEFAULT } from '../constants/capture';

const captureKey = 'yoga-yen-capture-settings';
function readCaptureSettings() {
  try {
    return JSON.parse(localStorage.getItem(captureKey) || '{}');
  } catch (error) {
    console.error('Unable to read saved capture settings.', error);
    return {};
  }
}
const defaultSettings = {
  theme: localStorage.getItem('yoga-yen-theme') || 'light',
  sidebarCollapsed: false,
  notificationsEnabled: true,
  captureDurationSec: DEFAULT_CAPTURE_SECONDS,
  calibrationDurationSec: CALIBRATION_DEFAULT,
  samplingIntervalSec: SAMPLING_INTERVAL_DEFAULT,
  autoStop: true,
  continuousMode: false,
  ...readCaptureSettings(),
};

export const useSettingsStore = create((set) => ({
  theme: defaultSettings.theme,
  sidebarCollapsed: defaultSettings.sidebarCollapsed,
  notificationsEnabled: defaultSettings.notificationsEnabled,
  captureDurationSec: defaultSettings.captureDurationSec,
  calibrationDurationSec: defaultSettings.calibrationDurationSec,
  samplingIntervalSec: defaultSettings.samplingIntervalSec,
  autoStop: defaultSettings.autoStop,
  continuousMode: defaultSettings.continuousMode,
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
  setCaptureSettings: (captureSettings) => {
    const next = {
      captureDurationSec: captureSettings.captureDurationSec,
      calibrationDurationSec: captureSettings.calibrationDurationSec,
      samplingIntervalSec: captureSettings.samplingIntervalSec,
      autoStop: captureSettings.autoStop,
      continuousMode: captureSettings.continuousMode,
    };
    localStorage.setItem(captureKey, JSON.stringify(next));
    set(next);
  },
}));
