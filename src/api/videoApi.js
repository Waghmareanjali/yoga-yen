const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const videoApi = {
  async uploadVideo(blob, filename) {
    const formData = new FormData();
    formData.append('file', blob, filename);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5 * 60 * 1000);
    try {
      const response = await fetch(`${API_BASE_URL}/upload-video`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.detail || 'The video could not be saved by the backend.');
      }
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Saving the video timed out. Check the backend and retry the upload.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  },
};
