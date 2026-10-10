import { apiRequest } from './client';
import { getPreviewSettings, isMockApiMode, isPreviewMode, updatePreviewSettings } from '../data/previewData';

const MOCK_SETTINGS_KEY = 'yoga-yen-mock-settings';
function readMockSettings() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_SETTINGS_KEY) || '{}');
  } catch (error) {
    console.error('Unable to read mock settings.', error);
    return {};
  }
}

export const settingsApi = {
  async getSettings() {
    if (isMockApiMode()) {
      const settings = { ...getPreviewSettings(), ...readMockSettings() };
      return { settings };
    }
    const response = await apiRequest('/api/settings');
    const result = await response.json();
    return { settings: result?.settings || result };
  },
  async updateSettings(payload) {
    if (isMockApiMode()) {
      if (isPreviewMode()) updatePreviewSettings(payload);
      const settings = { ...getPreviewSettings(), ...readMockSettings(), ...payload };
      localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(settings));
      return { settings };
    }
    const response = await apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { settings: result?.settings || result };
  },
};
