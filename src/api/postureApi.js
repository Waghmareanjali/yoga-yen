import { mockHistory, mockTrends, mockWeeklyReport } from '../data/mockData';
import { apiConfig, apiRequest } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, method = 'GET', body) {
  const response = await apiRequest(path, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response.json();
}

export const postureApi = {
  async startSession() {
    if (apiConfig.useMockApi) {
      await delay(300);
      return { sessionId: `demo-${Date.now()}`, status: 'started', demo: true };
    }
    return request('/api/posture/session/start', 'POST', {});
  },
  async sendLandmarks(payload) {
    if (apiConfig.useMockApi) {
      await delay(120);
      return { ok: true, posture: null, risk: null, demo: true };
    }
    return request('/api/posture/landmarks', 'POST', payload);
  },
  async endSession(payload = {}) {
    if (apiConfig.useMockApi) {
      await delay(250);
      return { ok: true, report: mockWeeklyReport, demo: true };
    }
    return request('/api/posture/session/end', 'POST', payload);
  },
  async getCurrent() {
    if (apiConfig.useMockApi) {
      await delay(200);
      return { posture: 'Good Posture', risk: 28, score: 84, duration: 42, demo: true };
    }
    return request('/api/posture/current');
  },
  async getHistory() {
    if (apiConfig.useMockApi) {
      await delay(300);
      return mockHistory.map((entry) => ({ ...entry, demo: true }));
    }
    const result = await request('/api/posture/history');
    return Array.isArray(result) ? result : result?.items || [];
  },
  async getTrends() {
    if (apiConfig.useMockApi) {
      await delay(300);
      return mockTrends.map((entry) => ({ ...entry, demo: true }));
    }
    const result = await request('/api/posture/trends');
    return Array.isArray(result) ? result : result?.items || [];
  },
};
