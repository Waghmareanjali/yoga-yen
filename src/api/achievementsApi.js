import { apiRequest } from './client';
import { getPreviewAchievements, isMockApiMode } from '../data/previewData';

export const achievementsApi = {
  async getAchievements() {
    if (isMockApiMode()) return getPreviewAchievements();
    const response = await apiRequest('/api/achievements');
    const result = await response.json();
    return Array.isArray(result) ? result : result?.items || [];
  },
};
