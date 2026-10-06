import { mockExercises, mockRecommendations } from '../data/mockData';
import { apiConfig, apiRequest } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const demoExercises = [
  ...mockExercises,
  { id: 'r1', title: 'Seated Twist', duration: 35, focus: 'Back', difficulty: 'Easy', description: 'A gentle seated rotation to support movement breaks.' },
  { id: 'r2', title: 'Standing Reach', duration: 40, focus: 'Shoulders', difficulty: 'Easy', description: 'Open the upper body and reset your posture.' },
];

export const recommendationApi = {
  async getRecommendations() {
    if (apiConfig.useMockApi) {
      await delay(250);
      return { items: mockRecommendations, demo: true };
    }
    const response = await apiRequest('/api/recommendations');
    const result = await response.json();
    return { items: Array.isArray(result) ? result : result?.items || [], demo: false };
  },
  async getExercises() {
    if (apiConfig.useMockApi) {
      await delay(250);
      return { items: demoExercises, demo: true };
    }
    const response = await apiRequest('/api/exercises');
    const result = await response.json();
    return { items: Array.isArray(result) ? result : result?.items || [], demo: false };
  },
};
