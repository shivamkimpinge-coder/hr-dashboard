import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import { IconArrowUpRight, IconClock, IconUserCheck, IconUserOff } from '../../Layout/Sidebar/icons'
import { PERFORMANCE_TABS } from '../performanceTabs'
import useEmployeeDirectory from '../useEmployeeDirectory'
import PerfAvatar from '../PerfAvatar'
import PerfStats from '../PerfStats'
import {
  PROMOTION_STATUS,
  PROMOTION_STATUSES,
  createPromotion,
  deletePromotion,
  formatDateDisplay,
  listPromotions,
  promotionStatusPillClass,
  updatePromotion,
} from '../performanceStore'

function PromotionForm({ promotion, employees, onClose, onSaved }) {
  const isEdit = Boolean(promotion)

  const [form, setForm] = useState({
    employeeId: promotion?.employeeId || '',
    currentTitle: promotion?.currentTitle || '',
    proposedTitle: promotion?.proposedTitle || '',
    effectiveDate: promotion?.effectiveDate || '',
    status: promotion?.status || PROMOTION_STATUS.PROPOSED,
    notes: promotion?.notes || '',
  })

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleEmployeeChange = (event) => {
    const employeeId = event.target.value
    const employee = employees.find((emp) => emp.employeeId === employeeId)
    setForm((prev) => ({
      ...prev,
      employeeId,
      currentTitle: prev.currentTitle || employee?.designation || '',
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.employeeId) {
      toast.error('Please select an employee.')
      return
    }
    if (!form.proposedTitle.trim()) {
      toast.error('Proposed title is required.')
      return
    }

    const employee = employees.find((emp) => emp.employeeId === form.employeeId)
    const payload = {
      employeeId: form.employeeId,
      employeeName: employee?.name || form.employeeId,
      employeeEmail: employee?.email || '',
      currentTitle: form.currentTitle.trim(),
      proposedTitle: form.proposedTitle.trim(),
      effectiveDate: form.effectiveDate,
      status: form.status,
      notes: form.notes.trim(),
    }

    if (isEdit) {
      updatePromotion(promotion.id, payload)
      toast.success('Promotion updated successfully.')
    } else {
      createPromotion(payload)
      toast.success('Promotion proposed successfully.')
    }

    onSaved()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Promotions</p>
            <h3>{isEdit ? 'Update Promotion' : 'Propose Promotion'}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form className="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="promo-employee">Employee</label>
              <select id="promo-employee" value={form.employeeId} onChange={handleEmployeeChange} required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee.employeeId}>
                    {employee.employeeId} — {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="promo-effective-date">Effective Date</label>
              <input
                id="promo-effective-date"
                type="date"
                value={form.effectiveDate}
                onChange={handleChange('effectiveDate')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="promo-current-title">Current Title</label>
              <input id="promo-current-title" type="text" value={form.currentTitle} onChange={handleChange('currentTitle')} />
            </div>

            <div className="form-field">
              <label htmlFor="promo-proposed-title">Proposed Title</label>
              <input
                id="promo-proposed-title"
                type="text"
                value={form.proposedTitle}
                onChange={handleChange('proposedTitle')}
                required
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="promo-notes">Notes / Justification</label>
              <textarea id="promo-notes" rows="3" value={form.notes} onChange={handleChange('notes')} />
            </div>

            <div className="form-field">
              <label htmlFor="promo-status">Status</label>
              <select id="promo-status" value={form.status} onChange={handleChange('status')}>
                {PROMOTION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="action-row">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Propose Promotion'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PromotionCard({ promotion, isAdmin, onEdit, onApprove, onReject, onDelete }) {
  return (
    <div className="perf-card">
      <div className="perf-card-head">
        {isAdmin ? (
          <div className="perf-card-person">
            <PerfAvatar name={promotion.employeeName} size="sm" />
            <div className="perf-card-person-name">{promotion.employeeName}</div>
          </div>
        ) : (
          <span className="pill pill-muted">Promotion</span>
        )}
        <span className={`pill ${promotionStatusPillClass(promotion.status)}`}>{promotion.status}</span>
      </div>

      <div className="promo-transition">
        <span className="promo-transition-current">{promotion.currentTitle || 'Current role'}</span>
        <span className="promo-transition-arrow">
          <IconArrowUpRight />
        </span>
        <span className="promo-transition-proposed">{promotion.proposedTitle}</span>
      </div>

      {promotion.notes ? <p className="perf-card-desc">{promotion.notes}</p> : null}

      <div className="perf-card-meta-row">
        <span>Effective {formatDateDisplay(promotion.effectiveDate)}</span>
      </div>

      <div className="perf-card-foot perf-card-foot--split">
        <div className="table-actions">
          {isAdmin && promotion.status === PROMOTION_STATUS.PROPOSED ? (
            <>
              <Button variant="approve" onClick={onApprove}>
                Approve
              </Button>
              <Button variant="reject" onClick={onReject}>
                Reject
              </Button>
            </>
          ) : null}
        </div>
        {isAdmin ? (
          <div className="table-actions">
            <Button variant="edit" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="delete" onClick={onDelete}>
              Delete
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Promotions({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const { employees } = useEmployeeDirectory(currentUser)

  const [promotions, setPromotions] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formPromotion, setFormPromotion] = useState(undefined) // undefined = closed, null = create, promotion = edit

  const refresh = () => setPromotions(listPromotions())

  useEffect(() => {
    refresh()
  }, [])

  const visiblePromotions = useMemo(() => {
    let result = isAdmin ? promotions : promotions.filter((promo) => promo.employeeEmail === currentUser?.email)
    if (isAdmin && employeeFilter) result = result.filter((promo) => promo.employeeId === employeeFilter)
    if (statusFilter) result = result.filter((promo) => promo.status === statusFilter)
    return result
  }, [promotions, isAdmin, employeeFilter, statusFilter, currentUser])

  const stats = useMemo(() => {
    const total = visiblePromotions.length
    const proposed = visiblePromotions.filter((p) => p.status === PROMOTION_STATUS.PROPOSED).length
    const approved = visiblePromotions.filter((p) => p.status === PROMOTION_STATUS.APPROVED).length
    const rejected = visiblePromotions.filter((p) => p.status === PROMOTION_STATUS.REJECTED).length
    return [
      { label: 'Total', value: total, icon: IconArrowUpRight, tone: 'primary' },
      { label: 'Proposed', value: proposed, icon: IconClock, tone: 'amber' },
      { label: 'Approved', value: approved, icon: IconUserCheck, tone: 'green' },
      { label: 'Rejected', value: rejected, icon: IconUserOff, tone: rejected ? 'red' : 'blue' },
    ]
  }, [visiblePromotions])

  const decide = (promotion, status, message) => {
    updatePromotion(promotion.id, { status })
    toast.success(message)
    refresh()
  }

  const handleDelete = (promotion) => {
    deletePromotion(promotion.id)
    toast.success('Promotion record deleted.')
    refresh()
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={PERFORMANCE_TABS} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>{isAdmin ? 'Promotions' : 'My Promotions'}</h3>
        </div>
        {isAdmin ? <Button onClick={() => setFormPromotion(null)}>+ Propose Promotion</Button> : null}
      </div>

      <PerfStats items={stats} />

      <div className="row g-3">
        {isAdmin ? (
          <div className="form-field filter-field">
            <label htmlFor="promo-employee-filter">Filter by employee</label>
            <select id="promo-employee-filter" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
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
          <label htmlFor="promo-status-filter">Filter by status</label>
          <select id="promo-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {PROMOTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visiblePromotions.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconArrowUpRight />
          </span>
          <p>No promotion records found.</p>
        </div>
      ) : (
        <div className="perf-card-grid">
          {visiblePromotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              isAdmin={isAdmin}
              onEdit={() => setFormPromotion(promotion)}
              onApprove={() => decide(promotion, PROMOTION_STATUS.APPROVED, 'Promotion approved.')}
              onReject={() => decide(promotion, PROMOTION_STATUS.REJECTED, 'Promotion rejected.')}
              onDelete={() => handleDelete(promotion)}
            />
          ))}
        </div>
      )}

      {formPromotion !== undefined ? (
        <PromotionForm
          promotion={formPromotion}
          employees={employees}
          onClose={() => setFormPromotion(undefined)}
          onSaved={() => {
            setFormPromotion(undefined)
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}

export default Promotions
