export const mockUser = {
  id: 'user-01',
  name: 'Aarohi Sharma',
  email: 'aarohi@example.com',
  role: 'Student',
  streak: 12,
  avatar: 'AS',
};

export const mockRecommendations = [
  { id: 1, title: 'Adjust screen height', summary: 'Raise the monitor to eye level to reduce neck flexion.', severity: 'medium' },
  { id: 2, title: 'Take a micro-break', summary: 'A 2-minute stretch is recommended after 45 minutes of sitting.', severity: 'low' },
  { id: 3, title: 'Open your chest', summary: 'Focus on shoulder alignment while typing and note your posture drift.', severity: 'high' },
];

export const mockExercises = [
  { id: 'e1', title: 'Neck Reset', duration: 30, focus: 'Neck', difficulty: 'Easy', description: 'A gentle stretch for forward head posture and screen fatigue.' },
  { id: 'e2', title: 'Shoulder Rolls', duration: 45, focus: 'Shoulders', difficulty: 'Easy', description: 'Release tension from rounded shoulders and upper back.' },
  { id: 'e3', title: 'Seated Cat-Cow', duration: 60, focus: 'Spine', difficulty: 'Medium', description: 'Promote spinal mobility and posture awareness while seated.' },
];

export const mockTrends = [
  { name: 'Mon', risk: 26, score: 82 },
  { name: 'Tue', risk: 44, score: 74 },
  { name: 'Wed', risk: 38, score: 78 },
  { name: 'Thu', risk: 60, score: 66 },
  { name: 'Fri', risk: 51, score: 71 },
  { name: 'Sat', risk: 35, score: 80 },
  { name: 'Sun', risk: 29, score: 84 },
];

export const mockWeeklyReport = {
  score: 76,
  risk: 42,
  sittingHours: 4.8,
  postureClass: 'Good Posture',
  alerts: 6,
  improved: 18,
};

export const mockHistory = [
  { id: 'h1', label: 'Today 09:15', posture: 'Good Posture', risk: 22, duration: 30 },
  { id: 'h2', label: 'Today 10:40', posture: 'Neck Forward', risk: 58, duration: 42 },
  { id: 'h3', label: 'Today 12:10', posture: 'Rounded Shoulders', risk: 71, duration: 34 },
  { id: 'h4', label: 'Today 13:45', posture: 'Good Posture', risk: 31, duration: 41 },
];

export const mockSettings = {
  darkMode: false,
  breakReminder: true,
  weeklyReportEmail: true,
  postureAlerts: true,
};

export const mockAchievements = [
  { id: 'a1', title: '7-Day Streak', description: 'Maintained good posture for a week.', unlocked: true },
  { id: 'a2', title: 'Break Champion', description: 'Took 15 mindful breaks this week.', unlocked: true },
  { id: 'a3', title: 'Deep Focus', description: 'Held a low-risk posture for 2 hours.', unlocked: false },
  { id: 'a4', title: 'Chair Hero', description: 'Reached 95% posture consistency.', unlocked: false },
];

export const demoFeatureCards = [
  { title: 'Real-Time Posture Monitoring', description: 'Live posture checkpointing with webcam frame analysis and session metrics.' },
  { title: 'MediaPipe Landmark Tracking', description: 'Tracks head, shoulders, and wrist landmarks in-browser.' },
  { title: 'AI Posture Classification', description: 'Random Forest posture classification on extracted posture features.' },
  { title: 'Ergonomic Risk Score', description: 'Scores neck, back, shoulder strain and sitting duration.' },
  { title: 'Personalized Recommendations', description: 'Smart suggestions to improve posture and movement patterns.' },
  { title: 'Adaptive Break Reminders', description: 'Breaks adjust as your risk profile changes across the day.' },
  { title: 'History & Trends', description: 'Compare daily and weekly progress with rich analytics.' },
  { title: 'Weekly Reports', description: 'Get easy summaries and posture insights for reflection.' },
  { title: 'Gamification', description: 'Build consistency with streaks, badges and progress tracking.' },
  { title: 'Privacy Protection', description: 'No unnecessary webcam images or video storage.' },
  { title: 'FastAPI Ready', description: 'Designed for clean REST API integration with mock fallback support.' },
  { title: 'Wellness Insights', description: 'Turn posture awareness into healthier, sustainable work patterns.' },
];

export const homeInsights = {
  problem: 'Prolonged sitting can slowly lead to neck strain, shoulder fatigue, and lower back discomfort.',
  solution: 'Yoga Yen provides real-time detection, evidence-based posture coaching, and gentle wellness routines that fit your workday.',
};
