import { apiRequest } from './client';
import { getPreviewCurrent, getPreviewHistory, getPreviewTrends, isPreviewMode } from '../data/previewData';

async function request(path, method = 'GET', body) {
  const response = await apiRequest(path, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response.json();
}

export const postureApi = {
  startSession: () => request('/api/posture/session/start', 'POST', {}),
  sendLandmarks: (payload) => request('/api/posture/landmarks', 'POST', payload),
  endSession: (payload = {}) => request('/api/posture/session/end', 'POST', payload),
  getCurrent: () => (import.meta.env.DEV && isPreviewMode() ? Promise.resolve(getPreviewCurrent()) : request('/api/posture/current')),
  async getHistory() {
    if (import.meta.env.DEV && isPreviewMode()) return getPreviewHistory();
    const result = await request('/api/posture/history');
    return Array.isArray(result) ? result : result?.items || [];
  },
  async getTrends() {
    if (import.meta.env.DEV && isPreviewMode()) return getPreviewTrends();
    const result = await request('/api/posture/trends');
    return Array.isArray(result) ? result : result?.items || [];
  },
};
