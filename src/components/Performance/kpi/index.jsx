import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import { IconAlertTriangle, IconTarget, IconTrendingUp, IconUserCheck } from '../../Layout/Sidebar/icons'
import { PERFORMANCE_TABS } from '../performanceTabs'
import useEmployeeDirectory from '../useEmployeeDirectory'
import PerfAvatar from '../PerfAvatar'
import PerfStats from '../PerfStats'
import {
  KPI_PERIODS,
  createKpi,
  deleteKpi,
  kpiAchievementPercent,
  kpiStatus,
  kpiStatusPillClass,
  listKpis,
  updateKpi,
} from '../performanceStore'

function KpiForm({ kpi, employees, achievedOnly = false, onClose, onSaved }) {
  const isEdit = Boolean(kpi)

  const [form, setForm] = useState({
    employeeId: kpi?.employeeId || '',
    name: kpi?.name || '',
    description: kpi?.description || '',
    unit: kpi?.unit || '',
    target: kpi?.target ?? '',
    achieved: kpi?.achieved ?? 0,
    period: kpi?.period || KPI_PERIODS[0],
  })

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (achievedOnly) {
      updateKpi(kpi.id, { achieved: Number(form.achieved) || 0 })
      toast.success('Progress updated.')
      onSaved()
      return
    }

    if (!form.employeeId) {
      toast.error('Please assign this KPI to an employee.')
      return
    }
    if (!form.name.trim()) {
      toast.error('KPI name is required.')
      return
    }
    if (!form.target || Number(form.target) <= 0) {
      toast.error('Target must be a positive number.')
      return
    }

    const employee = employees.find((emp) => emp.employeeId === form.employeeId)
    const payload = {
      employeeId: form.employeeId,
      employeeName: employee?.name || form.employeeId,
      employeeEmail: employee?.email || '',
      name: form.name.trim(),
      description: form.description.trim(),
      unit: form.unit.trim(),
      target: Number(form.target),
      achieved: Number(form.achieved) || 0,
      period: form.period,
    }

    if (isEdit) {
      updateKpi(kpi.id, payload)
      toast.success('KPI updated successfully.')
    } else {
      createKpi(payload)
      toast.success('KPI created successfully.')
    }

    onSaved()
  }

  if (achievedOnly) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">KPIs</p>
              <h3>Update Progress</h3>
            </div>
            <Button variant="close" onClick={onClose} aria-label="Close">
              ✕
            </Button>
          </div>

          <form className="employee-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-field form-field-full">
                <label>{kpi.name}</label>
                <p className="form-hint">
                  Target: {kpi.target} {kpi.unit} · {kpi.period}
                </p>
              </div>
              <div className="form-field">
                <label htmlFor="kpi-achieved-only">Achieved so far</label>
                <input
                  id="kpi-achieved-only"
                  type="number"
                  min="0"
                  value={form.achieved}
                  onChange={handleChange('achieved')}
                  autoFocus
                />
              </div>
            </div>

            <div className="action-row">
              <Button type="submit">Save Progress</Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">KPIs</p>
            <h3>{isEdit ? 'Update KPI' : 'Create KPI'}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form className="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="kpi-employee">Employee</label>
              <select id="kpi-employee" value={form.employeeId} onChange={handleChange('employeeId')} required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee.employeeId}>
                    {employee.employeeId} — {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="kpi-period">Period</label>
              <select id="kpi-period" value={form.period} onChange={handleChange('period')}>
                {KPI_PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="kpi-name">KPI Name</label>
              <input id="kpi-name" type="text" value={form.name} onChange={handleChange('name')} required />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="kpi-description">Description</label>
              <textarea id="kpi-description" rows="2" value={form.description} onChange={handleChange('description')} />
            </div>

            <div className="form-field">
              <label htmlFor="kpi-unit">Unit</label>
              <input id="kpi-unit" type="text" placeholder="e.g. %, tickets, $" value={form.unit} onChange={handleChange('unit')} />
            </div>

            <div className="form-field">
              <label htmlFor="kpi-target">Target</label>
              <input id="kpi-target" type="number" min="0" value={form.target} onChange={handleChange('target')} required />
            </div>

            <div className="form-field">
              <label htmlFor="kpi-achieved">Achieved so far</label>
              <input id="kpi-achieved" type="number" min="0" value={form.achieved} onChange={handleChange('achieved')} />
            </div>
          </div>

          <div className="action-row">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create KPI'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function kpiProgressTone(status) {
  if (status === 'Achieved') return 'progress-fill--success'
  if (status === 'Missed') return 'progress-fill--danger'
  if (status === 'At Risk') return 'progress-fill--warning'
  return ''
}

function KpiList({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const { employees } = useEmployeeDirectory(currentUser)

  const [kpis, setKpis] = useState([])
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [formKpi, setFormKpi] = useState(undefined) // undefined = closed, null = create, kpi = edit
  const [achievedKpi, setAchievedKpi] = useState(null)

  const refresh = () => setKpis(listKpis())

  useEffect(() => {
    refresh()
  }, [])

  const visibleKpis = useMemo(() => {
    let result = isAdmin ? kpis : kpis.filter((kpi) => kpi.employeeEmail === currentUser?.email)
    if (isAdmin && employeeFilter) result = result.filter((kpi) => kpi.employeeId === employeeFilter)
    return result
  }, [kpis, isAdmin, employeeFilter, currentUser])

  const stats = useMemo(() => {
    const total = visibleKpis.length
    const achieved = visibleKpis.filter((kpi) => kpiStatus(kpi) === 'Achieved').length
    const atRisk = visibleKpis.filter((kpi) => ['At Risk', 'Missed'].includes(kpiStatus(kpi))).length
    const avg = total ? Math.round(visibleKpis.reduce((sum, kpi) => sum + kpiAchievementPercent(kpi), 0) / total) : 0
    return [
      { label: 'Total KPIs', value: total, icon: IconTarget, tone: 'primary' },
      { label: 'Achieved', value: achieved, icon: IconUserCheck, tone: 'green' },
      { label: 'At Risk / Missed', value: atRisk, icon: IconAlertTriangle, tone: atRisk ? 'red' : 'amber' },
      { label: 'Avg Achievement', value: `${avg}%`, icon: IconTrendingUp, tone: 'blue' },
    ]
  }, [visibleKpis])

  const handleDelete = (kpi) => {
    deleteKpi(kpi.id)
    toast.success('KPI deleted.')
    refresh()
  }

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={PERFORMANCE_TABS} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>{isAdmin ? 'Employee KPIs' : 'My KPIs'}</h3>
        </div>
        {isAdmin ? <Button onClick={() => setFormKpi(null)}>+ Add KPI</Button> : null}
      </div>

      <PerfStats items={stats} />

      {isAdmin ? (
        <div className="form-field filter-field">
          <label htmlFor="kpi-employee-filter">Filter by employee</label>
          <select id="kpi-employee-filter" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee.employeeId}>
                {employee.employeeId} — {employee.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {visibleKpis.length === 0 ? (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconTarget />
          </span>
          <p>No KPIs found.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                {isAdmin ? <th>Employee</th> : null}
                <th>KPI</th>
                <th>Period</th>
                <th>Target</th>
                <th>Achieved</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleKpis.map((kpi) => {
                const percent = kpiAchievementPercent(kpi)
                const status = kpiStatus(kpi)
                return (
                  <tr key={kpi.id}>
                    {isAdmin ? (
                      <td>
                        <div className="perf-card-person">
                          <PerfAvatar name={kpi.employeeName} size="sm" />
                          <span className="perf-card-person-name">{kpi.employeeName}</span>
                        </div>
                      </td>
                    ) : null}
                    <td>
                      <strong>{kpi.name}</strong>
                      {kpi.description ? <div className="text-muted">{kpi.description}</div> : null}
                    </td>
                    <td>
                      <span className="pill pill-muted">{kpi.period}</span>
                    </td>
                    <td>
                      {kpi.target} {kpi.unit}
                    </td>
                    <td>
                      <div className="progress-track progress-track--wide" title={`${percent}%`}>
                        <div className={`progress-fill ${kpiProgressTone(status)}`} style={{ width: `${Math.min(100, percent)}%` }} />
                      </div>
                      <span className="progress-label">
                        {kpi.achieved} / {kpi.target} {kpi.unit} ({percent}%)
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${kpiStatusPillClass(status)}`}>{status}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {isAdmin ? (
                          <>
                            <Button variant="edit" onClick={() => setFormKpi(kpi)}>
                              Edit
                            </Button>
                            <Button variant="delete" onClick={() => handleDelete(kpi)}>
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button variant="edit" onClick={() => setAchievedKpi(kpi)}>
                            Update Progress
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {formKpi !== undefined ? (
        <KpiForm
          kpi={formKpi}
          employees={employees}
          onClose={() => setFormKpi(undefined)}
          onSaved={() => {
            setFormKpi(undefined)
            refresh()
          }}
        />
      ) : null}

      {achievedKpi ? (
        <KpiForm
          kpi={achievedKpi}
          achievedOnly
          employees={employees}
          onClose={() => setAchievedKpi(null)}
          onSaved={() => {
            setAchievedKpi(null)
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}

export default KpiList
