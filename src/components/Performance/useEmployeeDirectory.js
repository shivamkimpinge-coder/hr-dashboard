import { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'

// Employee directory shared by every Performance page: admins get the full
// list for assignment/filtering dropdowns, and everyone gets their own
// employee record resolved by matching their login email against it — so
// self-service entries (a goal an employee sets for themselves, feedback
// they give a peer) still carry a real employeeId.
export default function useEmployeeDirectory(currentUser) {
  const { listEmployees } = useApi()
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [listEmployees])

  const me = employees.find((employee) => employee.email === currentUser?.email) || null

  return { employees, me }
}
