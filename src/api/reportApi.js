import { mockWeeklyReport } from '../data/mockData';
import { apiConfig, apiDownload, apiRequest } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportApi = {
  async getWeeklyReport() {
    if (apiConfig.useMockApi) {
      await delay(300);
      return { report: mockWeeklyReport, demo: true };
    }
    const response = await apiRequest('/api/reports/weekly');
    const result = await response.json();
    return { report: result?.report || result, demo: false };
  },
  async downloadWeeklyReport() {
    if (apiConfig.useMockApi) {
      await delay(250);
      return { demo: true };
    }
    return { ...(await apiDownload('/api/reports/weekly/download')), demo: false };
  },
};
