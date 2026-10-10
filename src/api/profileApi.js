import { apiRequest } from './client';
import { getPreviewProfile, isPreviewMode, updatePreviewProfile } from '../data/previewData';

export const profileApi = {
  async getProfile() {
    if (import.meta.env.DEV && isPreviewMode()) return { user: getPreviewProfile() };
    const response = await apiRequest('/api/profile');
    const result = await response.json();
    return { user: result?.user || result?.profile || result };
  },
  async updateProfile(payload) {
    if (import.meta.env.DEV && isPreviewMode()) {
      const user = { ...getPreviewProfile(), ...payload, name: payload.full_name || payload.name };
      updatePreviewProfile(user);
      return { user };
    }
    const response = await apiRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { user: result?.user || result?.profile || result };
  },
};
