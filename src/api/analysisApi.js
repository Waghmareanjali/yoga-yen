import { apiRequest } from './client';

export const analysisApi = {
  async analyzeImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiRequest('/api/analysis/image', {
      method: 'POST',
      headers: {},
      body: formData,
    });
    return response.json();
  },
};
