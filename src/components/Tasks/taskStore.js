// Shared constants + pure display helpers for the Tasks module. All CRUD
// goes through the real API (see useApi.js — listTasks, createTask,
// updateTask, deleteTask, addTaskComment) — this file only holds the
// status/priority enums and formatting/derived logic reused across the
// task board and task detail views.

export const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

export const TASK_STATUSES = Object.values(TASK_STATUS)

export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export const TASK_PRIORITIES = Object.values(TASK_PRIORITY)

export const isOverdue = (task) =>
  Boolean(task.dueDate) &&
  task.status !== TASK_STATUS.DONE &&
  String(task.dueDate).slice(0, 10) < new Date().toISOString().slice(0, 10)

export const formatDateDisplay = (value) => {
  if (!value) return 'No due date'
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTimeDisplay = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const priorityPillClass = (priority) => {
  switch (priority) {
    case TASK_PRIORITY.HIGH:
      return 'pill-danger'
    case TASK_PRIORITY.MEDIUM:
      return 'pill-warning'
    default:
      return 'pill-muted' // Low
  }
}

export const statusPillClass = (status) => {
  switch (status) {
    case TASK_STATUS.DONE:
      return 'pill-success'
    case TASK_STATUS.IN_PROGRESS:
      return 'pill-warning'
    default:
      return 'pill-muted' // To Do
  }
}
