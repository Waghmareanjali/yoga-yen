const MINUTE = 60 * 1000;

export function getTaskStatus(task, now = Date.now()) {
  const progress = Math.max(0, Number(task.progress) || 0);
  const target = Math.max(1, Number(task.target) || 1);

  if (progress >= target) {
    if (!task.completedAt) return 'Completed On Time';
    return new Date(task.completedAt).getTime() <= new Date(task.dueAt).getTime()
      ? 'Completed On Time'
      : 'Completed Late';
  }
  if (new Date(task.dueAt).getTime() <= now) return 'Missed';
  if (progress > 0) return 'In Progress';
  return 'Not Started';
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / MINUTE));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getTaskMetrics(task, now = Date.now()) {
  const target = Math.max(1, Number(task.target) || 1);
  const progress = Math.max(0, Math.min(target, Number(task.progress) || 0));
  const remaining = Math.max(0, target - progress);
  const dueAt = new Date(task.dueAt).getTime();
  const status = getTaskStatus(task, now);
  const duration = Math.max(0, dueAt - new Date(task.startedAt || task.createdAt || now).getTime());
  const timeRemaining = Math.max(0, dueAt - now);
  const isAtRisk = status === 'In Progress'
    && duration > 0
    && timeRemaining / duration < 0.25
    && progress / target < 0.5;

  return {
    status,
    percentComplete: Math.round((progress / target) * 100),
    remaining,
    timeLeft: dueAt > now ? formatDuration(dueAt - now) : null,
    overdueBy: dueAt <= now ? formatDuration(now - dueAt) : null,
    isAtRisk,
  };
}

export function getTaskStatusTone(status, isAtRisk = false) {
  if (isAtRisk) return 'warning';
  if (status === 'Completed On Time') return 'success';
  if (status === 'In Progress') return 'info';
  if (status === 'Completed Late') return 'warning';
  if (status === 'Missed') return 'danger';
  return 'neutral';
}

export function isTaskInRange(task, range, now = new Date()) {
  const dueAt = new Date(task.dueAt);
  if (range === 'all') return true;
  if (range === 'today') return dueAt.toDateString() === now.toDateString();
  if (range === 'month') return dueAt.getFullYear() === now.getFullYear() && dueAt.getMonth() === now.getMonth();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return dueAt >= weekStart && dueAt < weekEnd;
}
