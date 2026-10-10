import { create } from 'zustand';
import { taskApi } from '../api/taskApi';
import { getTaskStatus } from '../utils/taskStatus';
import { useNotificationStore } from './notificationStore';

const dueSoonNotified = new Set();

function notify(title, description, type = 'task') {
  useNotificationStore.getState().addNotification({ type, title, description, duration: 6000 });
}

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: '',
  loadTasks: async () => {
    set({ loading: true, error: '' });
    try {
      const { tasks } = await taskApi.getTasks();
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: error?.message || 'Unable to load tasks.', loading: false });
    }
  },
  createTask: async (payload) => {
    const { task } = await taskApi.createTask(payload);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },
  updateTask: async (id, payload) => {
    const { task } = await taskApi.updateTask(id, payload);
    set((state) => ({ tasks: state.tasks.map((item) => item.id === id ? task : item) }));
    return task;
  },
  updateTaskProgress: async (id, delta) => {
    const current = get().tasks.find((task) => task.id === id);
    if (!current) return null;
    const previousStatus = getTaskStatus(current);
    const { task } = await taskApi.updateTaskProgress(id, current.progress + delta);
    set((state) => ({ tasks: state.tasks.map((item) => item.id === id ? task : item) }));
    if (getTaskStatus(task) === 'Completed On Time' || getTaskStatus(task) === 'Completed Late') {
      if (previousStatus !== 'Completed On Time' && previousStatus !== 'Completed Late') {
        notify('Goal completed', `${task.title} is complete.`, 'task-completed');
      }
    }
    return task;
  },
  incrementCategoryProgress: async (category, delta = 1) => {
    const task = get().tasks.find((item) => item.category === category
      && item.progress < item.target
      && getTaskStatus(item) !== 'Missed');
    if (!task) return null;
    return get().updateTaskProgress(task.id, delta);
  },
  markComplete: async (id) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return null;
    return get().updateTaskProgress(id, Math.max(0, task.target - task.progress));
  },
  deleteTask: async (id) => {
    await taskApi.deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
  },
  retryTask: async (id) => {
    const { task } = await taskApi.retryTask(id);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    notify('A fresh goal is ready', `${task.title} has a new deadline.`, 'task');
    return task;
  },
  recheckDeadlines: () => {
    const now = Date.now();
    const tasks = get().tasks.map((task) => {
      const nextStatus = getTaskStatus(task, now);
      const previousStatus = getTaskStatus(task, now - 30_001);
      if (nextStatus === 'Missed' && previousStatus !== 'Missed') {
        notify('Task missed', `${task.title} is missed. You can retry it.`, 'task-missed');
      }
      const timeUntilDue = new Date(task.dueAt).getTime() - now;
      if (timeUntilDue > 0 && timeUntilDue <= 24 * 60 * 60 * 1000 && !dueSoonNotified.has(task.id)) {
        notify('Task due soon', `${task.title} is due within 24 hours.`, 'task-due-soon');
        dueSoonNotified.add(task.id);
      }
      return { ...task, status: nextStatus };
    });
    set({ tasks });
  },
}));
