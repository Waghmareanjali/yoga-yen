import { apiRequest } from './client';
import { getPreviewExercises, getPreviewRecommendations, isPreviewMode } from '../data/previewData';

async function getItems(path) {
  const response = await apiRequest(path);
  const result = await response.json();
  return { items: Array.isArray(result) ? result : result?.items || [] };
}

export const recommendationApi = {
  getRecommendations: () => (import.meta.env.DEV && isPreviewMode()
    ? Promise.resolve({ items: getPreviewRecommendations() })
    : getItems('/api/recommendations')),
  getExercises: () => (import.meta.env.DEV && isPreviewMode()
    ? Promise.resolve({ items: getPreviewExercises() })
    : getItems('/api/exercises')),
};
