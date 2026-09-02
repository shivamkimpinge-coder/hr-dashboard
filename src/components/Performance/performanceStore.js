// Client-side Performance Management store. Frontend-only (no backend yet) —
// data lives in localStorage, the same pattern Tasks uses. Swapping this for
// real API calls later only means rewriting the functions below; every
// Performance screen only talks to this module.

const KEYS = {
  goals: 'hrPerformanceGoals',
  kpis: 'hrPerformanceKpis',
  reviews: 'hrPerformanceReviews',
  promotions: 'hrPerformancePromotions',
  feedback: 'hrPerformanceFeedback',
}

const generateId = (prefix) =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

const readAll = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

const writeAll = (key, records) => {
  localStorage.setItem(key, JSON.stringify(records))
}

const sortByCreatedDesc = (records) => [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

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

export const listGoals = () => sortByCreatedDesc(readAll(KEYS.goals))

export const createGoal = (goal) => {
  const all = readAll(KEYS.goals)
  const record = {
    id: generateId('goal'),
    status: GOAL_STATUS.NOT_STARTED,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...goal,
  }
  all.push(record)
  writeAll(KEYS.goals, all)
  return record
}

export const updateGoal = (id, patch) => {
  const all = readAll(KEYS.goals)
  const index = all.findIndex((goal) => goal.id === id)
  if (index === -1) return null
  all[index] = { ...all[index], ...patch, updatedAt: new Date().toISOString() }
  writeAll(KEYS.goals, all)
  return all[index]
}

export const deleteGoal = (id) => {
  writeAll(KEYS.goals, readAll(KEYS.goals).filter((goal) => goal.id !== id))
}

export const isGoalOverdue = (goal) =>
  Boolean(goal.targetDate) &&
  goal.status !== GOAL_STATUS.COMPLETED &&
  goal.targetDate < new Date().toISOString().slice(0, 10)

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

// ---------- KPIs ----------

export const KPI_PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Annual']

export const listKpis = () => sortByCreatedDesc(readAll(KEYS.kpis))

export const createKpi = (kpi) => {
  const all = readAll(KEYS.kpis)
  const record = {
    id: generateId('kpi'),
    achieved: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...kpi,
  }
  all.push(record)
  writeAll(KEYS.kpis, all)
  return record
}

export const updateKpi = (id, patch) => {
  const all = readAll(KEYS.kpis)
  const index = all.findIndex((kpi) => kpi.id === id)
  if (index === -1) return null
  all[index] = { ...all[index], ...patch, updatedAt: new Date().toISOString() }
  writeAll(KEYS.kpis, all)
  return all[index]
}

export const deleteKpi = (id) => {
  writeAll(KEYS.kpis, readAll(KEYS.kpis).filter((kpi) => kpi.id !== id))
}

export const kpiAchievementPercent = (kpi) => {
  const target = Number(kpi.target) || 0
  const achieved = Number(kpi.achieved) || 0
  if (target <= 0) return 0
  return Math.round((achieved / target) * 100)
}

export const kpiStatus = (kpi) => {
  const percent = kpiAchievementPercent(kpi)
  if (percent >= 100) return 'Achieved'
  if (percent >= 75) return 'On Track'
  if (percent >= 40) return 'At Risk'
  return 'Missed'
}

export const kpiStatusPillClass = (status) => {
  switch (status) {
    case 'Achieved':
      return 'pill-success'
    case 'On Track':
      return 'pill-warning'
    case 'At Risk':
      return 'pill-warning'
    default:
      return 'pill-danger' // Missed
  }
}

// ---------- Performance Reviews ----------

export const REVIEW_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Acknowledged',
}

export const REVIEW_STATUSES = Object.values(REVIEW_STATUS)

export const listReviews = () => sortByCreatedDesc(readAll(KEYS.reviews))

export const createReview = (review) => {
  const all = readAll(KEYS.reviews)
  const record = {
    id: generateId('review'),
    rating: 3,
    status: REVIEW_STATUS.SUBMITTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...review,
  }
  all.push(record)
  writeAll(KEYS.reviews, all)
  return record
}

export const updateReview = (id, patch) => {
  const all = readAll(KEYS.reviews)
  const index = all.findIndex((review) => review.id === id)
  if (index === -1) return null
  all[index] = { ...all[index], ...patch, updatedAt: new Date().toISOString() }
  writeAll(KEYS.reviews, all)
  return all[index]
}

export const deleteReview = (id) => {
  writeAll(KEYS.reviews, readAll(KEYS.reviews).filter((review) => review.id !== id))
}

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

// ---------- Ratings (derived from Reviews) ----------

// One row per employee who has at least one review, with the average rating
// across all of their reviews. Ratings has no storage of its own — it is a
// read-only summary view over the Performance Review data.
export const getEmployeeRatings = () => {
  const reviews = readAll(KEYS.reviews)
  const byEmployee = new Map()

  reviews.forEach((review) => {
    const key = review.employeeId
    if (!key) return
    const entry = byEmployee.get(key) || {
      employeeId: review.employeeId,
      employeeName: review.employeeName,
      employeeEmail: review.employeeEmail,
      ratings: [],
      lastReviewAt: review.createdAt,
    }
    entry.ratings.push(Number(review.rating) || 0)
    if (new Date(review.createdAt) > new Date(entry.lastReviewAt)) entry.lastReviewAt = review.createdAt
    byEmployee.set(key, entry)
  })

  return Array.from(byEmployee.values())
    .map((entry) => ({
      ...entry,
      reviewCount: entry.ratings.length,
      averageRating: entry.ratings.reduce((sum, r) => sum + r, 0) / entry.ratings.length,
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
}

export const ratingLabel = (average) => {
  if (average >= 4.5) return 'Outstanding'
  if (average >= 3.5) return 'Exceeds Expectations'
  if (average >= 2.5) return 'Meets Expectations'
  if (average >= 1.5) return 'Needs Improvement'
  return 'Unsatisfactory'
}

// ---------- Promotions ----------

export const PROMOTION_STATUS = {
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const PROMOTION_STATUSES = Object.values(PROMOTION_STATUS)

export const listPromotions = () => sortByCreatedDesc(readAll(KEYS.promotions))

export const createPromotion = (promotion) => {
  const all = readAll(KEYS.promotions)
  const record = {
    id: generateId('promo'),
    status: PROMOTION_STATUS.PROPOSED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...promotion,
  }
  all.push(record)
  writeAll(KEYS.promotions, all)
  return record
}

export const updatePromotion = (id, patch) => {
  const all = readAll(KEYS.promotions)
  const index = all.findIndex((promotion) => promotion.id === id)
  if (index === -1) return null
  all[index] = { ...all[index], ...patch, updatedAt: new Date().toISOString() }
  writeAll(KEYS.promotions, all)
  return all[index]
}

export const deletePromotion = (id) => {
  writeAll(KEYS.promotions, readAll(KEYS.promotions).filter((promotion) => promotion.id !== id))
}

export const promotionStatusPillClass = (status) => {
  switch (status) {
    case PROMOTION_STATUS.APPROVED:
      return 'pill-success'
    case PROMOTION_STATUS.REJECTED:
      return 'pill-danger'
    default:
      return 'pill-warning' // Proposed
  }
}

// ---------- Feedback ----------

export const FEEDBACK_TYPE = {
  POSITIVE: 'Positive',
  CONSTRUCTIVE: 'Constructive',
  PEER: 'Peer',
  MANAGER: 'Manager',
}

export const FEEDBACK_TYPES = Object.values(FEEDBACK_TYPE)

export const listFeedback = () => sortByCreatedDesc(readAll(KEYS.feedback))

export const createFeedback = (feedback) => {
  const all = readAll(KEYS.feedback)
  const record = {
    id: generateId('feedback'),
    type: FEEDBACK_TYPE.POSITIVE,
    createdAt: new Date().toISOString(),
    ...feedback,
  }
  all.push(record)
  writeAll(KEYS.feedback, all)
  return record
}

export const deleteFeedback = (id) => {
  writeAll(KEYS.feedback, readAll(KEYS.feedback).filter((feedback) => feedback.id !== id))
}

export const feedbackTypePillClass = (type) => {
  switch (type) {
    case FEEDBACK_TYPE.POSITIVE:
      return 'pill-success'
    case FEEDBACK_TYPE.CONSTRUCTIVE:
      return 'pill-warning'
    case FEEDBACK_TYPE.MANAGER:
      return 'pill-danger'
    default:
      return 'pill-muted' // Peer
  }
}

// ---------- Shared helpers ----------

export const formatDateDisplay = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
