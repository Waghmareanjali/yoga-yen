import { mockSettings } from '../data/mockData';
import { apiConfig, apiRequest } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const settingsApi = {
  async getSettings() {
    if (apiConfig.useMockApi) {
      await delay(250);
      return { settings: mockSettings, demo: true };
    }
    const response = await apiRequest('/api/settings');
    const result = await response.json();
    return { settings: result?.settings || result, demo: false };
  },
  async updateSettings(payload) {
    if (apiConfig.useMockApi) {
      await delay(250);
      return { settings: { ...mockSettings, ...payload }, demo: true };
    }
    const response = await apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { settings: result?.settings || result, demo: false };
  },
};
