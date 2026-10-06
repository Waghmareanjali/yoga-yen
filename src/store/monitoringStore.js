import { create } from 'zustand';

export const useMonitoringStore = create((set) => ({
  cameraStatus: 'idle',
  calibrationState: 'not-started',
  currentPosture: 'Good Posture',
  riskValue: 28,
  sittingDuration: 0,
  sessionId: null,
  isLive: false,
  setCameraStatus: (cameraStatus) => set({ cameraStatus }),
  setCalibrationState: (calibrationState) => set({ calibrationState }),
  setCurrentPosture: (currentPosture) => set({ currentPosture }),
  setRiskValue: (riskValue) => set({ riskValue }),
  setSittingDuration: (sittingDuration) => set({ sittingDuration }),
  setSessionId: (sessionId) => set({ sessionId }),
  setIsLive: (isLive) => set({ isLive }),
  resetMonitoring: () => set({
    cameraStatus: 'idle',
    calibrationState: 'not-started',
    currentPosture: 'Good Posture',
    riskValue: 28,
    sittingDuration: 0,
    sessionId: null,
    isLive: false,
  }),
}));
