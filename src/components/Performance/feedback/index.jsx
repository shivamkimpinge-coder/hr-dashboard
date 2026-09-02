import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import { IconKanban, IconTrendingUp, IconUserCheck, IconUsers } from '../../Layout/Sidebar/icons'
import { PERFORMANCE_TABS } from '../performanceTabs'
import useEmployeeDirectory from '../useEmployeeDirectory'
import PerfAvatar from '../PerfAvatar'
import PerfStats from '../PerfStats'
import {
  FEEDBACK_TYPE,
  FEEDBACK_TYPES,
  createFeedback,
  deleteFeedback,
  feedbackTypePillClass,
  formatDateDisplay,
  listFeedback,
} from '../performanceStore'

function FeedbackForm({ employees, currentUser, onClose, onSaved }) {
  const [form, setForm] = useState({
    employeeId: '',
    type: FEEDBACK_TYPE.POSITIVE,
    message: '',
  })

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.employeeId) {
      toast.error('Please select who this feedback is for.')
      return
    }
    if (!form.message.trim()) {
      toast.error('Feedback message cannot be empty.')
      return
    }

    const employee = employees.find((emp) => emp.employeeId === form.employeeId)
    createFeedback({
      employeeId: form.employeeId,
      employeeName: employee?.name || form.employeeId,
      employeeEmail: employee?.email || '',
      fromName: currentUser?.name || 'Anonymous',
      fromEmail: currentUser?.email || '',
      type: form.type,
      message: form.message.trim(),
    })
    toast.success('Feedback submitted.')
    onSaved()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Feedback</p>
            <h3>Give Feedback</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form className="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="feedback-employee">For</label>
              <select id="feedback-employee" value={form.employeeId} onChange={handleChange('employeeId')} required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee.employeeId}>
                    {employee.employeeId} — {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="feedback-type">Type</label>
              <select id="feedback-type" value={form.type} onChange={handleChange('type')}>
                {FEEDBACK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="feedback-message">Message</label>
              <textarea id="feedback-message" rows="4" value={form.message} onChange={handleChange('message')} required />
            </div>
          </div>

          <div className="action-row">
            <Button type="submit">Submit Feedback</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FeedbackCard({ feedback, canDelete, onDelete }) {
  return (
    <div className="detail-card feedback-card">
      <div className="feedback-card-head">
        <div className="feedback-card-from">
          <PerfAvatar name={feedback.fromName} size="sm" />
          <span>
            <strong>{feedback.fromName}</strong> → {feedback.employeeName}
          </span>
        </div>
        <span className={`pill ${feedbackTypePillClass(feedback.type)}`}>{feedback.type}</span>
      </div>
      <p className="feedback-card-body">{feedback.message}</p>
      <div className="perf-card-meta-row">
        <span>{formatDateDisplay(feedback.createdAt)}</span>
        {canDelete ? (
          <Button variant="delete" onClick={() => onDelete(feedback)}>
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function Feedback({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const { employees } = useEmployeeDirectory(currentUser)

  const [feedbackList, setFeedbackList] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [view, setView] = useState('received') // received | given (non-admin only)
  const [formOpen, setFormOpen] = useState(false)

  const refresh = () => setFeedbackList(listFeedback())

  useEffect(() => {
    refresh()
  }, [])

  const visibleFeedback = useMemo(() => {
    if (isAdmin) {
      return employeeFilter ? feedbackList.filter((item) => item.employeeId === employeeFilter) : feedbackList
    }
    return feedbackList.filter((item) =>
      view === 'received' ? item.employeeEmail === currentUser?.email : item.fromEmail === currentUser?.email
    )
  }, [feedbackList, isAdmin, employeeFilter, view, currentUser])

  const stats = useMemo(() => {
    const total = visibleFeedback.length
    const positive = visibleFeedback.filter((item) => item.type === FEEDBACK_TYPE.POSITIVE).length
    const constructive = visibleFeedback.filter((item) => item.type === FEEDBACK_TYPE.CONSTRUCTIVE).length
    const manager = visibleFeedback.filter((item) => item.type === FEEDBACK_TYPE.MANAGER).length
    return [
      { label: 'Total Feedback', value: total, icon: IconUsers, tone: 'primary' },
      { label: 'Positive', value: positive, icon: IconUserCheck, tone: 'green' },
      { label: 'Constructive', value: constructive, icon: IconTrendingUp, tone: 'amber' },
      { label: 'From Managers', value: manager, icon: IconKanban, tone: 'blue' },
    ]
  }, [visibleFeedback])

  const handleDelete = (feedback) => {
    deleteFeedback(feedback.id)
    toast.success('Feedback removed.')
    refresh()
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={PERFORMANCE_TABS} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>{isAdmin ? 'Team Feedback' : 'Feedback'}</h3>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Give Feedback</Button>
      </div>

      <PerfStats items={stats} />

      <div className="row g-3">
        {isAdmin ? (
          <div className="form-field filter-field">
            <label htmlFor="feedback-employee-filter">Filter by employee</label>
            <select
              id="feedback-employee-filter"
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.employeeId}>
                  {employee.employeeId} — {employee.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="range-toggle">
            <button type="button" className={view === 'received' ? 'is-active' : ''} onClick={() => setView('received')}>
              Received
            </button>
            <button type="button" className={view === 'given' ? 'is-active' : ''} onClick={() => setView('given')}>
              Given
            </button>
          </div>
        )}
      </div>

      <div className="feedback-list">
        {visibleFeedback.length === 0 ? (
          <div className="empty-state">
            <span className="perf-empty-icon">
              <IconUsers />
            </span>
            <p>No feedback to show yet.</p>
          </div>
        ) : (
          visibleFeedback.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              canDelete={isAdmin || feedback.fromEmail === currentUser?.email}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {formOpen ? (
        <FeedbackForm
          employees={employees}
          currentUser={currentUser}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}

export default Feedback
