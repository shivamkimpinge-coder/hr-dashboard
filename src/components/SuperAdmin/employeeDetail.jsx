import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../utils/Button/button'
import EmployeeHeroCard from './EmployeeHeroCard'
import useApi from '../../hooks/useApi'

// Full-page version of the hero card, for direct navigation/bookmarking —
// the roster table's "View" button instead opens EmployeeHeroCard in a
// modal (see companyDetail.jsx) without leaving the page, but this route
// stays available for a direct link. Refetches getCompanyDetail rather than
// calling a dedicated single-employee endpoint, since the company detail
// payload already carries every field (PUBLIC_PROJECTION) for every
// employee and this avoids a second backend route for the same data.
function SuperAdminEmployeeDetail() {
  const { companyId, userId } = useParams()
  const { getCompanyDetail } = useApi()

  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getCompanyDetail(companyId)
      .then(setDetail)
      .catch((err) => setError(err.message || 'Failed to load company.'))
  }, [companyId, getCompanyDetail])

  const employee = detail?.employees?.find((e) => e._id === userId)

  return (
    <div className="emp-details-page">
      <nav className="breadcrumb">
        <Link to="/superadmin">Companies</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/superadmin/companies/${companyId}`}>{detail?.company?.name || 'Company'}</Link>
        <span aria-hidden="true">›</span>
        <span>{employee?.name || 'Employee Details'}</span>
      </nav>

      <div className="emp-details-head">
        <div>
          <h1>Employee Details</h1>
          <p>Full profile information, as a Super Admin</p>
        </div>
        <Button variant="secondary" to={`/superadmin/companies/${companyId}`}>
          ← Back to {detail?.company?.name || 'Company'}
        </Button>
      </div>

      {error ? (
        <div className="feedback-banner feedback-banner-error">{error}</div>
      ) : !detail ? (
        <div className="panel">
          <p>Loading employee information...</p>
        </div>
      ) : !employee ? (
        <div className="panel empty-state">
          <p>Employee not found in this company.</p>
        </div>
      ) : (
        <EmployeeHeroCard employee={employee} />
      )}
    </div>
  )
}

export default SuperAdminEmployeeDetail
