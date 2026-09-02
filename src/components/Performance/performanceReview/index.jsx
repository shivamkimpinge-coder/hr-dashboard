import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import { IconClock, IconUserCheck, IconUsers } from '../../Layout/Sidebar/icons'
import { PERFORMANCE_TABS } from '../performanceTabs'
import useEmployeeDirectory from '../useEmployeeDirectory'
import PerfAvatar from '../PerfAvatar'
import PerfStats from '../PerfStats'
import StarRating from '../StarRating'
import {
  REVIEW_STATUS,
  REVIEW_STATUSES,
  createReview,
  deleteReview,
  formatDateDisplay,
  listReviews,
  reviewStatusPillClass,
  updateReview,
} from '../performanceStore'

function ReviewForm({ review, employees, currentUser, onClose, onSaved }) {
  const isEdit = Boolean(review)

  const [form, setForm] = useState({
    employeeId: review?.employeeId || '',
    reviewPeriod: review?.reviewPeriod || '',
    rating: review?.rating ?? 3,
    strengths: review?.strengths || '',
    improvements: review?.improvements || '',
    comments: review?.comments || '',
    status: review?.status || REVIEW_STATUS.SUBMITTED,
  })

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.employeeId) {
      toast.error('Please select an employee to review.')
      return
    }
    if (!form.reviewPeriod.trim()) {
      toast.error('Review period is required.')
      return
    }

    const employee = employees.find((emp) => emp.employeeId === form.employeeId)
    const payload = {
      employeeId: form.employeeId,
      employeeName: employee?.name || form.employeeId,
      employeeEmail: employee?.email || '',
      reviewerName: currentUser?.name || 'Admin',
      reviewPeriod: form.reviewPeriod.trim(),
      rating: Number(form.rating),
      strengths: form.strengths.trim(),
      improvements: form.improvements.trim(),
      comments: form.comments.trim(),
      status: form.status,
    }

    if (isEdit) {
      updateReview(review.id, payload)
      toast.success('Review updated successfully.')
    } else {
      createReview(payload)
      toast.success('Review submitted successfully.')
    }

    onSaved()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Performance Review</p>
            <h3>{isEdit ? 'Update Review' : 'New Review'}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form className="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="review-employee">Employee</label>
              <select id="review-employee" value={form.employeeId} onChange={handleChange('employeeId')} required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee.employeeId}>
                    {employee.employeeId} — {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="review-period">Review Period</label>
              <input
                id="review-period"
                type="text"
                placeholder="e.g. Q1 2026"
                value={form.reviewPeriod}
                onChange={handleChange('reviewPeriod')}
                required
              />
            </div>

            <div className="form-field form-field-full">
              <label>Overall Rating</label>
              <StarRating value={form.rating} onChange={(value) => setForm((prev) => ({ ...prev, rating: value }))} />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="review-strengths">Strengths</label>
              <textarea id="review-strengths" rows="2" value={form.strengths} onChange={handleChange('strengths')} />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="review-improvements">Areas for Improvement</label>
              <textarea id="review-improvements" rows="2" value={form.improvements} onChange={handleChange('improvements')} />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="review-comments">Additional Comments</label>
              <textarea id="review-comments" rows="2" value={form.comments} onChange={handleChange('comments')} />
            </div>

            <div className="form-field">
              <label htmlFor="review-status">Status</label>
              <select id="review-status" value={form.status} onChange={handleChange('status')}>
                {Object.values(REVIEW_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="action-row">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Submit Review'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReviewDetails({ review, canAcknowledge, onClose, onChanged }) {
  if (!review) return null

  const acknowledge = () => {
    updateReview(review.id, { status: REVIEW_STATUS.ACKNOWLEDGED })
    toast.success('Review acknowledged.')
    onChanged()
    onClose()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Performance Review</p>
            <h3>{review.employeeName}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="payslip-content">
          <div className="payslip-header">
            <div>
              <h4>{review.reviewPeriod}</h4>
              <p>Reviewed by {review.reviewerName}</p>
            </div>
            <div className="payslip-meta">
              <p>
                <strong>Status:</strong>{' '}
                <span className={`pill ${reviewStatusPillClass(review.status)}`}>{review.status}</span>
              </p>
              <p>
                <strong>Date:</strong> {formatDateDisplay(review.createdAt)}
              </p>
            </div>
          </div>

          <div className="form-field form-field-full">
            <label>Overall Rating</label>
            <StarRating value={review.rating} readOnly />
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <p className="eyebrow">Strengths</p>
              <p>{review.strengths || '—'}</p>
            </div>
            <div className="detail-card">
              <p className="eyebrow">Areas for Improvement</p>
              <p>{review.improvements || '—'}</p>
            </div>
          </div>

          {review.comments ? (
            <div className="detail-card">
              <p className="eyebrow">Additional Comments</p>
              <p>{review.comments}</p>
            </div>
          ) : null}

          {canAcknowledge && review.status === REVIEW_STATUS.SUBMITTED ? (
            <div className="action-row">
              <Button onClick={acknowledge}>Acknowledge Review</Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ review, isAdmin, onView, onEdit, onDelete }) {
  return (
    <div className="perf-card">
      <div className="perf-card-head">
        {isAdmin ? (
          <div className="perf-card-person">
            <PerfAvatar name={review.employeeName} size="sm" />
            <div>
              <div className="perf-card-person-name">{review.employeeName}</div>
              <div className="perf-card-person-meta">{review.reviewPeriod}</div>
            </div>
          </div>
        ) : (
          <span className="pill pill-muted">{review.reviewPeriod}</span>
        )}
        <span className={`pill ${reviewStatusPillClass(review.status)}`}>{review.status}</span>
      </div>

      <StarRating value={review.rating} readOnly size={16} />

      {review.strengths ? <p className="perf-card-desc">{review.strengths}</p> : null}

      <div className="perf-card-meta-row">
        <span>Reviewed by {review.reviewerName}</span>
        <span>{formatDateDisplay(review.createdAt)}</span>
      </div>

      <div className="perf-card-foot">
        <Button variant="view" onClick={onView}>
          View
        </Button>
        {isAdmin ? (
          <>
            <Button variant="edit" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="delete" onClick={onDelete}>
              Delete
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

function PerformanceReview({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const { employees } = useEmployeeDirectory(currentUser)

  const [reviews, setReviews] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formReview, setFormReview] = useState(undefined) // undefined = closed, null = create, review = edit
  const [selectedReview, setSelectedReview] = useState(null)

  const refresh = () => setReviews(listReviews())

  useEffect(() => {
    refresh()
  }, [])

  const visibleReviews = useMemo(() => {
    let result = isAdmin ? reviews : reviews.filter((review) => review.employeeEmail === currentUser?.email)
    if (isAdmin && employeeFilter) result = result.filter((review) => review.employeeId === employeeFilter)
    if (statusFilter) result = result.filter((review) => review.status === statusFilter)
    return result
  }, [reviews, isAdmin, employeeFilter, statusFilter, currentUser])

  const stats = useMemo(() => {
    const total = visibleReviews.length
    const avgRating = total ? (visibleReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / total).toFixed(1) : '—'
    const acknowledged = visibleReviews.filter((r) => r.status === REVIEW_STATUS.ACKNOWLEDGED).length
    const pending = visibleReviews.filter((r) => r.status === REVIEW_STATUS.SUBMITTED).length
    return [
      { label: 'Total Reviews', value: total, icon: IconUsers, tone: 'primary' },
      { label: 'Average Rating', value: total ? `${avgRating} / 5` : '—', icon: IconUserCheck, tone: 'blue' },
      { label: 'Acknowledged', value: acknowledged, icon: IconUserCheck, tone: 'green' },
      { label: 'Awaiting Acknowledgement', value: pending, icon: IconClock, tone: 'amber' },
    ]
  }, [visibleReviews])

  const handleDelete = (review) => {
    deleteReview(review.id)
    toast.success('Review deleted.')
    refresh()
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={PERFORMANCE_TABS} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>{isAdmin ? 'Performance Reviews' : 'My Performance Reviews'}</h3>
        </div>
        {isAdmin ? <Button onClick={() => setFormReview(null)}>+ New Review</Button> : null}
      </div>

      <PerfStats items={stats} />

      <div className="row g-3">
        {isAdmin ? (
          <div className="form-field filter-field">
            <label htmlFor="review-employee-filter">Filter by employee</label>
            <select id="review-employee-filter" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
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
          <label htmlFor="review-status-filter">Filter by status</label>
          <select id="review-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleReviews.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconUsers />
          </span>
          <p>No reviews found.</p>
        </div>
      ) : (
        <div className="perf-card-grid">
          {visibleReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isAdmin={isAdmin}
              onView={() => setSelectedReview(review)}
              onEdit={() => setFormReview(review)}
              onDelete={() => handleDelete(review)}
            />
          ))}
        </div>
      )}

      {formReview !== undefined ? (
        <ReviewForm
          review={formReview}
          employees={employees}
          currentUser={currentUser}
          onClose={() => setFormReview(undefined)}
          onSaved={() => {
            setFormReview(undefined)
            refresh()
          }}
        />
      ) : null}

      <ReviewDetails
        review={selectedReview}
        canAcknowledge={!isAdmin}
        onClose={() => setSelectedReview(null)}
        onChanged={refresh}
      />
    </div>
  )
}

export default PerformanceReview
