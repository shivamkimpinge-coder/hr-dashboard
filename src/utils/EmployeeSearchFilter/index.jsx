import { useEffect, useRef, useState } from 'react'

// Drop-in replacement for the "Filter by employee" <select> that was
// hand-duplicated across Leave/Payroll/Tasks/Goals/Performance Review —
// type-to-filter over the already-fetched `employees` list instead of
// scrolling a long dropdown. Purely client-side (no extra network call):
// every one of those pages already has the full roster in memory for the
// old <select>'s <option> list.
function EmployeeSearchFilter({
  employees,
  value,
  onChange,
  id,
  label = 'Filter by employee',
  placeholder = 'Search by name or employee ID...',
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  const selected = employees.find((employee) => employee.employeeId === value) || null

  useEffect(() => {
    const onClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const term = query.trim().toLowerCase()
  const results = term
    ? employees.filter(
        (employee) =>
          employee.name?.toLowerCase().includes(term) ||
          employee.employeeId?.toLowerCase().includes(term) ||
          employee.department?.toLowerCase().includes(term)
      )
    : employees

  const pick = (employee) => {
    onChange(employee ? employee.employeeId : '')
    setQuery('')
    setOpen(false)
  }

  const displayValue = open ? query : selected ? `${selected.employeeId} — ${selected.name}` : ''

  return (
    <div className="form-field filter-field employee-search-filter" ref={wrapperRef}>
      {label ? <label htmlFor={id}>{label}</label> : null}

      <div className="employee-search-box">
        <input
          id={id}
          type="text"
          autoComplete="off"
          placeholder={selected ? selected.name : placeholder}
          value={displayValue}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onChange={(event) => setQuery(event.target.value)}
        />
        {value ? (
          <button
            type="button"
            className="employee-search-clear"
            aria-label="Clear employee filter"
            onClick={() => pick(null)}
          >
            ×
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="employee-search-results">
          <button type="button" className="employee-search-result-item" onClick={() => pick(null)}>
            All employees
          </button>
          {results.length === 0 ? (
            <div className="employee-search-empty">No employees match "{query}".</div>
          ) : (
            results.map((employee) => (
              <button
                type="button"
                key={employee._id}
                className="employee-search-result-item"
                onClick={() => pick(employee)}
              >
                {employee.employeeId} — {employee.name}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export default EmployeeSearchFilter
