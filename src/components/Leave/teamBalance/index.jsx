import { useCallback, useEffect, useState } from 'react'
import useApi from '../../../hooks/useApi'

// Admin and HR view of everyone's remaining leave. Uses the same table markup
// as the rest of the section so it reads as one page.
function TeamLeaveBalance({ refreshSignal }) {
  const { getAllLeaveBalances } = useApi()

  const [rows, setRows] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAllLeaveBalances()
      setRows(data.employees || [])
      setLeaveTypes(data.leaveTypes || [])
    } catch (err) {
      setError(err.message || 'Failed to load leave balances.')
    } finally {
      setLoading(false)
    }
  }, [getAllLeaveBalances])

  // refreshSignal changes whenever a leave decision is made elsewhere on the
  // page (approve/reject/cancel), so this table doesn't show stale numbers.
  useEffect(() => {
    refresh()
  }, [refresh, refreshSignal])

  const term = search.trim().toLowerCase()
  const visible = term
    ? rows.filter(
        (row) =>
          row.name?.toLowerCase().includes(term) ||
          row.employeeId?.toLowerCase().includes(term) ||
          row.department?.toLowerCase().includes(term)
      )
    : rows

  const cell = (info) => {
    if (!info) return <span className="pill pill-muted">--</span>
    if (info.unlimited) return <span className="pill pill-muted">No limit</span>

    const isCount = info.unit === 'count'
    const out = info.remaining <= 0
    const unitWord = isCount ? '' : info.remaining === 1 ? ' day' : ' days'

    return (
      <div className="team-balance-cell">
        <span className={`pill ${out ? 'pill-danger' : 'pill-success'}`}>
          {info.remaining}{unitWord} left
        </span>
        <span className="form-hint">
          Used {info.used}
          {info.pending > 0 ? ` · Pending ${info.pending}` : ''}
        </span>
        {info.lop > 0 ? <span className="form-hint is-lop">LOP {info.lop} day{info.lop === 1 ? '' : 's'}</span> : null}
      </div>
    )
  }

  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Team</p>
          <h4>Leave balance · {visible.length} employee{visible.length === 1 ? '' : 's'}</h4>
          <p className="form-hint">Only approved leave reduces a balance. Excess approved leave shows as LOP.</p>
        </div>
        <div className="form-field filter-field">
          <label htmlFor="team-balance-search">Search</label>
          <input
            id="team-balance-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, ID or department"
          />
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Employee</th>
              {leaveTypes.map((type) => (
                <th key={type}>{type}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={leaveTypes.length + 1}>Loading leave balances...</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={leaveTypes.length + 1}>No employees found.</td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.employeeId}>
                  <td>
                    <span className="activity-row-name">{row.name}</span>{' '}
                    <span className="text-muted">({row.employeeId})</span>
                    {row.department ? <div className="form-hint">{row.department}</div> : null}
                  </td>
                  {leaveTypes.map((type) => (
                    <td key={type}>{cell(row.balance?.[type])}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default TeamLeaveBalance
