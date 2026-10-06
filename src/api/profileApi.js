import { mockUser } from '../data/mockData';
import { apiConfig, apiRequest } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const profileApi = {
  async getProfile() {
    if (apiConfig.useMockApi) {
      await delay(300);
      const savedUser = sessionStorage.getItem('yoga-yen-demo-profile');
      return { user: savedUser ? JSON.parse(savedUser) : mockUser, demo: true };
    }
    const response = await apiRequest('/api/profile');
    const result = await response.json();
    return { user: result?.user || result?.profile || result, demo: false };
  },
  async updateProfile(payload) {
    if (apiConfig.useMockApi) {
      await delay(350);
      const savedUser = sessionStorage.getItem('yoga-yen-demo-profile');
      const user = { ...mockUser, ...(savedUser ? JSON.parse(savedUser) : {}), ...payload };
      sessionStorage.setItem('yoga-yen-demo-profile', JSON.stringify(user));
      return { user, demo: true };
    }
    const response = await apiRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { user: result?.user || result?.profile || result, demo: false };
  },
};
