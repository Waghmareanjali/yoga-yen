import { apiRequest } from './client';

export const contactApi = {
  async sendMessage(payload) {
    const response = await apiRequest('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.json();
  },
};
