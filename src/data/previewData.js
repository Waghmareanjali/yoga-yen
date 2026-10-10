const PREVIEW_SESSION_KEY = 'yoga-yen-preview-session';
const PREVIEW_PROFILE_KEY = 'yoga-yen-preview-profile';
const PREVIEW_SETTINGS_KEY = 'yoga-yen-preview-settings';

export function isPreviewMode() {
  return Boolean(
    import.meta.env.DEV
    && sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'active',
  );
}

export function isMockApiMode() {
  return Boolean(import.meta.env.DEV && (import.meta.env.VITE_USE_MOCK_API === 'true' || isPreviewMode()));
}

function readSessionValue(key, fallback) {
  if (!isPreviewMode()) return fallback;
  try {
    const value = sessionStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch (error) {
    console.error('Unable to read Yoga Yen preview data.', error);
    return fallback;
  }
}

function writeSessionValue(key, value) {
  if (!isPreviewMode()) return false;
  sessionStorage.setItem(key, JSON.stringify(value));
  return true;
}

export function getPreviewProfile() {
  return readSessionValue(PREVIEW_PROFILE_KEY, {
    id: 'local-preview-account',
    full_name: 'Yoga Yen Preview',
    name: 'Yoga Yen Preview',
    email: 'demo@yogayen.test',
    phone: '0000000000',
    age: 24,
    gender: 'Prefer not to say',
    height: 165,
    weight: 62,
    work_type: 'Student',
    device_type: 'Laptop',
  });
}

export function updatePreviewProfile(profile) {
  if (!isPreviewMode()) return false;
  writeSessionValue(PREVIEW_PROFILE_KEY, { ...getPreviewProfile(), ...profile });
  return true;
}

const defaultSettings = {
  postureAlerts: true,
  breakReminder: true,
  weeklyReportEmail: true,
  monitoringEnabled: true,
  cameraPreview: true,
  consentActive: true,
  voiceGuidance: false,
  voiceVolume: 65,
  breakInterval: 45,
  alertCooldown: 5,
  reducedMotion: false,
  captureDurationSec: 60,
  calibrationDurationSec: 10,
  samplingIntervalSec: 2,
  autoStop: true,
  continuousMode: false,
};

export function getPreviewSettings() {
  return readSessionValue(PREVIEW_SETTINGS_KEY, defaultSettings);
}

export function updatePreviewSettings(settings) {
  if (!isPreviewMode()) return false;
  writeSessionValue(PREVIEW_SETTINGS_KEY, { ...getPreviewSettings(), ...settings });
  return true;
}

function recentDate(daysAgo, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, daysAgo % 2 ? 30 : 0, 0, 0);
  return date;
}

const sessionSamples = [
  { id: 'preview-session-1', daysAgo: 6, hour: 9, score: 72, risk: 41, duration: 28, posture: 'Fair' },
  { id: 'preview-session-2', daysAgo: 5, hour: 11, score: 76, risk: 36, duration: 34, posture: 'Good' },
  { id: 'preview-session-3', daysAgo: 4, hour: 10, score: 69, risk: 48, duration: 22, posture: 'Fair' },
  { id: 'preview-session-4', daysAgo: 3, hour: 14, score: 81, risk: 29, duration: 41, posture: 'Good' },
  { id: 'preview-session-5', daysAgo: 2, hour: 9, score: 78, risk: 34, duration: 32, posture: 'Good' },
  { id: 'preview-session-6', daysAgo: 1, hour: 11, score: 84, risk: 25, duration: 38, posture: 'Good' },
  { id: 'preview-session-7', daysAgo: 0, hour: 10, score: 86, risk: 22, duration: 26, posture: 'Good' },
];

export function getPreviewHistory() {
  return sessionSamples.map(({ daysAgo, hour, ...session }) => {
    const timestamp = recentDate(daysAgo, hour);
    return {
      ...session,
      timestamp: timestamp.toISOString(),
      date: timestamp.toLocaleDateString(),
      label: timestamp.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
    };
  });
}

export function getPreviewTrends() {
  return getPreviewHistory().map((session) => ({
    name: new Date(session.timestamp).toLocaleDateString([], { weekday: 'short' }),
    score: session.score,
    risk: session.risk,
  }));
}

export function getPreviewCurrent() {
  const sessions = getPreviewHistory();
  const latest = sessions[sessions.length - 1];
  return { score: latest.score, risk: latest.risk, duration: latest.duration };
}

export function getPreviewRecommendations() {
  return [
    { id: 'preview-recommendation-1', title: 'Take a short movement break', summary: 'A brief walk can break up a long sitting session.', severity: 'low' },
    { id: 'preview-recommendation-2', title: 'Reset your sitting position', summary: 'Sit back comfortably and let your shoulders relax.', severity: 'medium' },
    { id: 'preview-recommendation-3', title: 'Keep your screen at eye level', summary: 'A comfortable screen position can make it easier to sit upright.', severity: 'low' },
  ];
}

export function getPreviewExercises() {
  return [
    { id: 'preview-exercise-1', title: 'Seated shoulder rolls', description: 'Slowly roll your shoulders backward, then forward, while breathing comfortably.', focus: 'Shoulders', difficulty: 'Gentle', duration: 30 },
    { id: 'preview-exercise-2', title: 'Seated side stretch', description: 'Lengthen one side gently, return to center, and repeat on the other side.', focus: 'Mobility', difficulty: 'Gentle', duration: 40 },
    { id: 'preview-exercise-3', title: 'Wrist and hand reset', description: 'Open and close your hands, then circle your wrists within a comfortable range.', focus: 'Wrists', difficulty: 'Easy', duration: 30 },
    { id: 'preview-exercise-4', title: 'Standing posture reset', description: 'Stand comfortably, soften your knees, and take a few relaxed breaths.', focus: 'Posture', difficulty: 'Easy', duration: 45 },
  ];
}

export function getPreviewAchievements() {
  return [
    { id: 'preview-achievement-1', title: 'First check-in', description: 'Completed your first posture-awareness session.', status: 'Completed' },
    { id: 'preview-achievement-2', title: 'Steady practice', description: 'Recorded activity on three different days.', status: 'Completed' },
    { id: 'preview-achievement-3', title: 'Movement mindful', description: 'Take a few gentle movement breaks to reach this milestone.', status: 'In progress' },
  ];
}

export function getPreviewReport() {
  return {
    score: 78,
    risk: 34,
    sittingHours: 4.2,
    alerts: 8,
    trends: getPreviewTrends(),
    bestDay: 'Today',
    postureClass: 'Extended sitting',
    improved: 8,
  };
}
