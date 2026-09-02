import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import { IconAlertTriangle, IconClock, IconTarget, IconUserCheck } from '../../Layout/Sidebar/icons'
import { PERFORMANCE_TABS } from '../performanceTabs'
import useEmployeeDirectory from '../useEmployeeDirectory'
import PerfAvatar from '../PerfAvatar'
import PerfStats from '../PerfStats'
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY,
  GOAL_STATUS,
  GOAL_STATUSES,
  createGoal,
  deleteGoal,
  formatDateDisplay,
  goalStatusPillClass,
  isGoalOverdue,
  listGoals,
  updateGoal,
} from '../performanceStore'

function GoalForm({ goal, employees, currentUser, me, isAdmin, onClose, onSaved }) {
  const isEdit = Boolean(goal)

  const [form, setForm] = useState({
    employeeId: goal?.employeeId || '',
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || GOAL_CATEGORY.PROFESSIONAL,
    targetDate: goal?.targetDate || '',
    status: goal?.status || GOAL_STATUS.NOT_STARTED,
    progress: goal?.progress ?? 0,
  })

  const handleChange = (field) => (event) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [field]: field === 'progress' ? Number(value) : value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      toast.error('Goal title is required.')
      return
    }
    if (isAdmin && !form.employeeId) {
      toast.error('Please assign this goal to an employee.')
      return
    }

    const employee = employees.find((emp) => emp.employeeId === form.employeeId)
    const payload = {
      employeeId: isAdmin ? form.employeeId : me?.employeeId || '',
      employeeName: isAdmin ? employee?.name || form.employeeId : currentUser?.name,
      employeeEmail: isAdmin ? employee?.email || '' : currentUser?.email,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      targetDate: form.targetDate,
      status: form.status,
      progress: form.status === GOAL_STATUS.COMPLETED ? 100 : Math.min(100, Math.max(0, Number(form.progress) || 0)),
    }

    if (isEdit) {
      updateGoal(goal.id, payload)
      toast.success('Goal updated successfully.')
    } else {
      createGoal(payload)
      toast.success('Goal created successfully.')
    }

    onSaved()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Goals</p>
            <h3>{isEdit ? 'Update Goal' : 'Create Goal'}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form className="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {isAdmin ? (
              <div className="form-field">
                <label htmlFor="goal-employee">Employee</label>
                <select id="goal-employee" value={form.employeeId} onChange={handleChange('employeeId')} required>
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee.employeeId}>
                      {employee.employeeId} — {employee.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="form-field">
              <label htmlFor="goal-category">Category</label>
              <select id="goal-category" value={form.category} onChange={handleChange('category')}>
                {GOAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="goal-title">Title</label>
              <input id="goal-title" type="text" value={form.title} onChange={handleChange('title')} required />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="goal-description">Description</label>
              <textarea id="goal-description" rows="3" value={form.description} onChange={handleChange('description')} />
            </div>

            <div className="form-field">
              <label htmlFor="goal-target-date">Target Date</label>
              <input id="goal-target-date" type="date" value={form.targetDate} onChange={handleChange('targetDate')} />
            </div>

            <div className="form-field">
              <label htmlFor="goal-status">Status</label>
              <select id="goal-status" value={form.status} onChange={handleChange('status')}>
                {GOAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="goal-progress">Progress ({form.progress}%)</label>
              <input
                id="goal-progress"
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.progress}
                onChange={handleChange('progress')}
                disabled={form.status === GOAL_STATUS.COMPLETED}
              />
            </div>
          </div>

          <div className="action-row">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function goalProgressTone(goal) {
  if (goal.status === GOAL_STATUS.COMPLETED) return 'progress-fill--success'
  if (isGoalOverdue(goal)) return 'progress-fill--danger'
  return ''
}

function GoalCard({ goal, isAdmin, onEdit, onDelete }) {
  const overdue = isGoalOverdue(goal)

  return (
    <div className="perf-card">
      <div className="perf-card-head">
        {isAdmin ? (
          <div className="perf-card-person">
            <PerfAvatar name={goal.employeeName} size="sm" />
            <div>
              <div className="perf-card-person-name">{goal.employeeName}</div>
              <div className="perf-card-person-meta">{goal.category}</div>
            </div>
          </div>
        ) : (
          <span className="pill pill-muted">{goal.category}</span>
        )}
        <span className={`pill ${goalStatusPillClass(goal.status)}`}>{goal.status}</span>
      </div>

      <div>
        <p className="perf-card-title">{goal.title}</p>
        {goal.description ? <p className="perf-card-desc">{goal.description}</p> : null}
      </div>

      <div>
        <div className="progress-track progress-track--wide" title={`${goal.progress}%`}>
          <div className={`progress-fill ${goalProgressTone(goal)}`} style={{ width: `${goal.progress}%` }} />
        </div>
        <div className="perf-card-meta-row">
          <span>{goal.progress}% complete</span>
          <span className={overdue ? 'is-overdue' : ''}>
            {overdue ? 'Overdue — ' : 'Due '}
            {formatDateDisplay(goal.targetDate)}
          </span>
        </div>
      </div>

      <div className="perf-card-foot">
        <Button variant="edit" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="delete" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  )
}

function GoalsList({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const { employees, me } = useEmployeeDirectory(currentUser)

  const [goals, setGoals] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formGoal, setFormGoal] = useState(undefined) // undefined = closed, null = create, goal = edit

  const refresh = () => setGoals(listGoals())

  useEffect(() => {
    refresh()
  }, [])

  const visibleGoals = useMemo(() => {
    let result = isAdmin ? goals : goals.filter((goal) => goal.employeeEmail === currentUser?.email)
    if (isAdmin && employeeFilter) result = result.filter((goal) => goal.employeeId === employeeFilter)
    if (statusFilter) result = result.filter((goal) => goal.status === statusFilter)
    return result
  }, [goals, isAdmin, employeeFilter, statusFilter, currentUser])

  const stats = useMemo(() => {
    const total = visibleGoals.length
    const completed = visibleGoals.filter((goal) => goal.status === GOAL_STATUS.COMPLETED).length
    const inProgress = visibleGoals.filter((goal) => goal.status === GOAL_STATUS.IN_PROGRESS).length
    const overdue = visibleGoals.filter(isGoalOverdue).length
    return [
      { label: 'Total Goals', value: total, icon: IconTarget, tone: 'primary' },
      { label: 'Completed', value: completed, icon: IconUserCheck, tone: 'green' },
      { label: 'In Progress', value: inProgress, icon: IconClock, tone: 'blue' },
      { label: 'Overdue', value: overdue, icon: IconAlertTriangle, tone: overdue ? 'red' : 'amber' },
    ]
  }, [visibleGoals])

  const handleDelete = (goal) => {
    deleteGoal(goal.id)
    toast.success('Goal deleted.')
    refresh()
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={PERFORMANCE_TABS} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>{isAdmin ? 'Employee Goals' : 'My Goals'}</h3>
        </div>
        <Button onClick={() => setFormGoal(null)}>+ Add Goal</Button>
      </div>

      <PerfStats items={stats} />

      <div className="row g-3">
        {isAdmin ? (
          <div className="form-field filter-field">
            <label htmlFor="goal-employee-filter">Filter by employee</label>
            <select id="goal-employee-filter" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.employeeId}>
                  {employee.employeeId} — {employee.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="form-field filter-field">
          <label htmlFor="goal-status-filter">Filter by status</label>
          <select id="goal-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {GOAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleGoals.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconTarget />
          </span>
          <p>No goals found. {isAdmin ? 'Add one to get started.' : 'Set one to track your progress.'}</p>
        </div>
      ) : (
        <div className="perf-card-grid">
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isAdmin={isAdmin}
              onEdit={() => setFormGoal(goal)}
              onDelete={() => handleDelete(goal)}
            />
          ))}
        </div>
      )}

      {formGoal !== undefined ? (
        <GoalForm
          goal={formGoal}
          employees={employees}
          currentUser={currentUser}
          me={me}
          isAdmin={isAdmin}
          onClose={() => setFormGoal(undefined)}
          onSaved={() => {
            setFormGoal(undefined)
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}

export default GoalsList
