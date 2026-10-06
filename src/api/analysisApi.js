import { apiConfig, apiRequest } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const analysisApi = {
  async analyzeImage(file) {
    if (apiConfig.useMockApi) {
      await delay(500);
      return {
        demo: true,
        unavailable: true,
        message: 'Image analysis is a preview in Demo mode. No AI result has been generated.',
      };
    }
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiRequest('/api/analysis/image', {
      method: 'POST',
      headers: {},
      body: formData,
    });
    return { ...(await response.json()), demo: false };
  },
};
