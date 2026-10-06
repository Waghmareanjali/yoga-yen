export const RISK_THRESHOLDS = {
  low: 40,
  medium: 70,
  labels: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
};

export const RISK_WEIGHTS = {
  neck: 0.4,
  back: 0.3,
  shoulder: 0.2,
  duration: 0.1,
};

export const ALERT_COOLDOWN = 600000;
export const DEFAULT_BREAK_INTERVAL = 1800000;
export const CALIBRATION_DURATION = 10;
export const POSTURE_CLASSES = [
  'Good Posture',
  'Slouching',
  'Neck Forward',
  'Leaning Left',
  'Leaning Right',
  'Rounded Shoulders',
  'Looking Down',
];

export const getRiskLevel = (value) => {
  if (value < RISK_THRESHOLDS.low) return 'Low';
  if (value <= RISK_THRESHOLDS.medium) return 'Medium';
  return 'High';
};
