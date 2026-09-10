import { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'

// Employee directory shared by every Performance page: the minimal
// (non-admin-gated) directory endpoint, available to any authenticated
// user, so both admin pickers and an employee's own self-service actions
// (e.g. setting their own goal) can resolve real employeeIds — not just
// the full Admin-only employee record.
export default function useEmployeeDirectory(currentUser) {
  const { getEmployeeDirectory } = useApi()
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    getEmployeeDirectory()
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [getEmployeeDirectory])

  const me = employees.find((employee) => employee.email === currentUser?.email) || null

  return { employees, me }
}
