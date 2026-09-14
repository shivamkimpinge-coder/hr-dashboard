// Shared constants + pure display helpers for the Performance module. All
// CRUD now goes through the real API (see useApi.js — listGoals, createGoal,
// etc.) — this file only holds category/status enums and formatting/derived
// logic that's reused across the Goals/Reviews pages.

// ---------- Goals ----------

export const GOAL_CATEGORY = {
  PROFESSIONAL: 'Professional',
  TECHNICAL: 'Technical',
  TEAM: 'Team',
  PERSONAL: 'Personal',
}

export const GOAL_CATEGORIES = Object.values(GOAL_CATEGORY)

export const GOAL_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

export const GOAL_STATUSES = Object.values(GOAL_STATUS)

export const isGoalOverdue = (goal) =>
  Boolean(goal.targetDate) &&
  goal.status !== GOAL_STATUS.COMPLETED &&
  String(goal.targetDate).slice(0, 10) < new Date().toISOString().slice(0, 10)

export const goalStatusPillClass = (status) => {
  switch (status) {
    case GOAL_STATUS.COMPLETED:
      return 'pill-success'
    case GOAL_STATUS.IN_PROGRESS:
      return 'pill-warning'
    default:
      return 'pill-muted' // Not Started
  }
}

// ---------- Performance Reviews ----------

export const REVIEW_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Acknowledged',
}

export const REVIEW_STATUSES = Object.values(REVIEW_STATUS)

export const reviewStatusPillClass = (status) => {
  switch (status) {
    case REVIEW_STATUS.ACKNOWLEDGED:
      return 'pill-success'
    case REVIEW_STATUS.SUBMITTED:
      return 'pill-warning'
    default:
      return 'pill-muted' // Draft
  }
}

// ---------- Shared helpers ----------

export const formatDateDisplay = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
