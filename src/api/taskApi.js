import { apiRequest } from './client';
import { taskSamples } from '../data/taskSamples';
import { isMockApiMode } from '../data/previewData';

const TASKS_KEY = 'yoga-yen-preview-tasks';
const isMockApi = isMockApiMode;

function readMockTasks() {
  if (!isMockApi()) return taskSamples;
  try {
    const saved = sessionStorage.getItem(TASKS_KEY);
    return saved ? JSON.parse(saved) : taskSamples.map((task) => ({ ...task }));
  } catch (error) {
    console.error('Unable to read preview tasks.', error);
    return taskSamples.map((task) => ({ ...task }));
  }
}

function writeMockTasks(tasks) {
  if (!isMockApi()) return;
  sessionStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function normalizeTask(task) {
  return {
    ...task,
    id: task.id || task._id || crypto.randomUUID(),
    progress: Number(task.progress) || 0,
    target: Math.max(1, Number(task.target) || 1),
    progressHistory: task.progressHistory || [],
  };
}

async function updateMockTask(id, updater) {
  const tasks = readMockTasks();
  const updated = tasks.map((task) => task.id === id ? normalizeTask(updater(task)) : task);
  writeMockTasks(updated);
  return updated.find((task) => task.id === id);
}

export const taskApi = {
  async getTasks(params = {}) {
    if (isMockApi()) return { tasks: readMockTasks() };
    const query = new URLSearchParams(params).toString();
    const response = await apiRequest(`/api/tasks${query ? `?${query}` : ''}`);
    const result = await response.json();
    return { tasks: (Array.isArray(result) ? result : result?.tasks || []).map(normalizeTask) };
  },
  async createTask(payload) {
    if (isMockApi()) {
      const task = normalizeTask({
        ...payload,
        id: crypto.randomUUID(),
        progress: 0,
        startedAt: null,
        completedAt: null,
        failureReason: null,
        progressHistory: [],
      });
      writeMockTasks([task, ...readMockTasks()]);
      return { task };
    }
    const response = await apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
    return { task: normalizeTask(await response.json()) };
  },
  async updateTask(id, payload) {
    if (isMockApi()) return { task: await updateMockTask(id, (task) => ({ ...task, ...payload })) };
    const response = await apiRequest(`/api/tasks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
    return { task: normalizeTask(await response.json()) };
  },
  async updateTaskProgress(id, progress) {
    if (isMockApi()) return { task: await updateMockTask(id, (task) => {
      const nextProgress = Math.max(0, Math.min(task.target, Number(progress) || 0));
      const completedAt = nextProgress >= task.target ? new Date().toISOString() : null;
      return {
        ...task,
        progress: nextProgress,
        startedAt: task.startedAt || new Date().toISOString(),
        completedAt,
        progressHistory: [...(task.progressHistory || []), { at: new Date().toISOString(), progress: nextProgress }],
      };
    }) };
    const response = await apiRequest(`/api/tasks/${encodeURIComponent(id)}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) });
    return { task: normalizeTask(await response.json()) };
  },
  async deleteTask(id) {
    if (isMockApi()) {
      writeMockTasks(readMockTasks().filter((task) => task.id !== id));
      return { ok: true };
    }
    await apiRequest(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true };
  },
  async retryTask(id) {
    if (isMockApi()) {
      const source = readMockTasks().find((task) => task.id === id);
      if (!source) throw new Error('This task could not be found.');
      return this.createTask({ ...source, title: `${source.title} (retry)`, dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), assignedBy: 'Self' });
    }
    const response = await apiRequest(`/api/tasks/${encodeURIComponent(id)}/retry`, { method: 'POST' });
    return { task: normalizeTask(await response.json()) };
  },
  async getTaskStats(range = 'week') {
    if (isMockApi()) return { tasks: readMockTasks() };
    const response = await apiRequest(`/api/tasks/stats?range=${encodeURIComponent(range)}`);
    return response.json();
  },
};
