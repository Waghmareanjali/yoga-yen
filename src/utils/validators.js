export const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value.trim());

export const validatePassword = (value) => typeof value === 'string' && value.length >= 8;

export const validateName = (value) => value && value.trim().length >= 2;

export const validatePhone = (value) => /^\d{10}$/.test(value);

export const passwordRules = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
];

export const validateSecurePassword = (value) => passwordRules.every((rule) => rule.test(value));

export const validateImageFile = (file) => {
  if (!file) return false;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  return allowed.includes(file.type) && file.size <= 5 * 1024 * 1024;
};

export const formatMinutes = (minutes) => {
  const total = Math.max(0, Number(minutes) || 0);
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

export const formatRiskLabel = (value) => {
  if (value < 40) return 'Low';
  if (value <= 70) return 'Medium';
  return 'High';
};
