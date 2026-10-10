import { apiDownload, apiRequest } from './client';
import { getPreviewReport, isPreviewMode } from '../data/previewData';

export const reportApi = {
  async getWeeklyReport() {
    if (import.meta.env.DEV && isPreviewMode()) return { report: getPreviewReport() };
    const response = await apiRequest('/api/reports/weekly');
    const result = await response.json();
    return { report: result?.report || result };
  },
  downloadWeeklyReport: () => (import.meta.env.DEV && isPreviewMode()
    ? Promise.resolve({
        blob: new Blob([JSON.stringify(getPreviewReport(), null, 2)], { type: 'application/json' }),
        filename: 'yoga-yen-preview-weekly-report.json',
      })
    : apiDownload('/api/reports/weekly/download')),
};
