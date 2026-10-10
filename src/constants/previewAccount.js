export const previewAccount = import.meta.env.DEV
  ? {
      email: 'demo@yogayen.test',
      password: 'YogaYenDemo2026!',
      user: {
        id: 'local-preview-account',
        full_name: 'Yoga Yen Preview',
        name: 'Yoga Yen Preview',
        email: 'demo@yogayen.test',
        phone: '0000000000',
      },
    }
  : null;
