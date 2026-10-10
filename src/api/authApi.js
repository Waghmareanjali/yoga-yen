import { apiRequest } from './client';

function normalizeAuthResult(result) {
  return {
    user: result?.user || result?.profile || null,
    token: result?.access_token || result?.token || result?.accessToken || null,
  };
}

async function callApi(path, payload) {
  const response = await apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function loginUser(payload) {
  const result = await callApi('/api/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  const auth = normalizeAuthResult(result);
  if (!auth.token) throw new Error('The sign-in response did not include an authentication token.');
  if (!auth.user) {
    const profileResponse = await apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const profile = await profileResponse.json();
    auth.user = profile?.user || profile?.profile || profile;
  }
  return auth;
}

export async function registerUser(payload) {
  const result = await callApi('/api/auth/register', payload);
  const auth = normalizeAuthResult(result);
  if (!auth.token) return { registered: true };
  if (!auth.user) {
    const profileResponse = await apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const profile = await profileResponse.json();
    auth.user = profile?.user || profile?.profile || profile;
  }
  return auth;
}

export async function logoutUser(token) {
  const response = await apiRequest('/api/auth/logout', {
    method: 'POST',
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  });
  return response.json();
}

export async function getCurrentUser(token) {
  const response = await apiRequest('/api/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const result = await response.json();
  const user = result?.user || result?.profile || result;
  return { user: user && typeof user === 'object' ? user : null };
}

export async function requestPasswordReset(payload) {
  const response = await apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function resetUserPassword(payload) {
  const response = await apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}

export const authApi = {
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
  me: getCurrentUser,
  forgotPassword: requestPasswordReset,
  resetPassword: resetUserPassword,
};
