// Client-side task store. Frontend-only for now (no backend yet) — tasks
// live in localStorage, the same pattern Attendance started with. Swapping
// this for real API calls later only means rewriting the functions below;
// every Task screen only talks to this module.

const STORAGE_KEY = 'hrTaskRecords'

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

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const writeAll = (tasks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export const listTasks = () => readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export const createTask = (task) => {
  const all = readAll()
  const newTask = {
    id: generateId(),
    status: TASK_STATUS.TODO,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...task,
  }
  all.push(newTask)
  writeAll(all)
  return newTask
}

export const updateTask = (id, patch) => {
  const all = readAll()
  const index = all.findIndex((task) => task.id === id)
  if (index === -1) return null
  all[index] = { ...all[index], ...patch, updatedAt: new Date().toISOString() }
  writeAll(all)
  return all[index]
}

export const deleteTask = (id) => {
  writeAll(readAll().filter((task) => task.id !== id))
}

export const addComment = (id, comment) => {
  const all = readAll()
  const index = all.findIndex((task) => task.id === id)
  if (index === -1) return null
  const newComment = { id: generateId(), createdAt: new Date().toISOString(), ...comment }
  all[index] = {
    ...all[index],
    comments: [...(all[index].comments || []), newComment],
    updatedAt: new Date().toISOString(),
  }
  writeAll(all)
  return all[index]
}

export const getDateKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const isOverdue = (task) =>
  Boolean(task.dueDate) && task.status !== TASK_STATUS.DONE && task.dueDate < getDateKey()

export const formatDateDisplay = (dateKey) => {
  if (!dateKey) return 'No due date'
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
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
