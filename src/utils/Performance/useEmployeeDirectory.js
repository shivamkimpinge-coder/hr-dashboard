import { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'

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
