export const publicRoutes = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/features', label: 'Features' },
  { path: '/image-analysis', label: 'Image Analysis' },
  { path: '/privacy', label: 'Privacy' },
];

export const authRoutes = [
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
];

export const appSidebarItems = [
  { label: 'Dashboard', path: '/dashboard', group: 'Overview' },
  { label: 'Live Monitor', path: '/live-monitor', group: 'Monitor' },
  { label: 'Posture Analysis', path: '/posture-analysis', group: 'Monitor' },
  { label: 'Yoga & Exercises', path: '/yoga', group: 'Wellness' },
  { label: 'Breaks', path: '/breaks', group: 'Wellness' },
  { label: 'History & Trends', path: '/history', group: 'Analytics' },
  { label: 'Weekly Reports', path: '/reports', group: 'Analytics' },
  { label: 'Achievements', path: '/achievements', group: 'Progress' },
  { label: 'Profile', path: '/profile', group: 'Account' },
  { label: 'Settings', path: '/settings', group: 'Account' },
];
