import { mockUser } from '../data/mockData';
import { apiConfig, apiRequest } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeAuthResult(result) {
  return {
    user: result?.user || result?.profile || null,
    token: result?.access_token || result?.token || result?.accessToken || null,
    demo: false,
  };
}

async function callApi(path, payload, token) {
  const response = await apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(payload),
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  });
  return response.json();
}

export async function loginUser(payload) {
  if (apiConfig.useMockApi) {
    await delay(550);
    return {
      user: { ...mockUser, email: payload.email },
      token: 'demo-token',
      demo: true,
    };
  }

  const result = await callApi('/api/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  const auth = normalizeAuthResult(result);
  if (!auth.token) {
    throw new Error('The sign-in response did not include an authentication token.');
  }
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
  if (apiConfig.useMockApi) {
    await delay(650);
    const user = {
      ...mockUser,
      name: payload.full_name,
      email: payload.email,
      role: payload.work_type,
      ...payload,
    };
    sessionStorage.setItem('yoga-yen-demo-profile', JSON.stringify(user));
    return {
      user,
      token: 'demo-token',
      demo: true,
    };
  }

  const result = await callApi('/api/auth/register', payload);
  const auth = normalizeAuthResult(result);
  if (!auth.token) {
    return { ...auth, registered: true };
  }
  if (!auth.user) {
    const profileResponse = await apiRequest('/api/auth/me', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const profile = await profileResponse.json();
    auth.user = profile?.user || profile?.profile || profile;
  }
  return { ...auth, registered: true };
}

export async function logoutUser() {
  if (apiConfig.useMockApi) {
    await delay(180);
    return { success: true, demo: true };
  }
  const response = await apiRequest('/api/auth/logout', { method: 'POST' });
  return response.json();
}

export async function getCurrentUser(token) {
  if (apiConfig.useMockApi) {
    await delay(250);
    return { user: mockUser, demo: true };
  }
  const response = await apiRequest('/api/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const result = await response.json();
  return { user: result?.user || result?.profile || result, demo: false };
}

export async function requestPasswordReset(payload) {
  if (apiConfig.useMockApi) {
    await delay(450);
    return { success: true, demo: true };
  }
  const response = await apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function resetUserPassword(payload) {
  if (apiConfig.useMockApi) {
    await delay(450);
    return { success: true, demo: true };
  }
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
