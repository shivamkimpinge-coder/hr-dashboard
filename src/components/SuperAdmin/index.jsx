import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Button from '../../utils/Button/button'
import CommonForm from '../../utils/Form/commonform'
import { IconChevronDown } from '../Layout/Sidebar/icons'
import useApi from '../../hooks/useApi'

function CreateCompanyModal({ onClose, onCreated }) {
  const { createCompany } = useApi()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: { name: '' } })

  const onSubmit = async ({ name }) => {
    try {
      const data = await createCompany({ name })
      toast.success(`Company created — code ${data.company.code}`)
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to create company.')
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Super Admin</p>
            <h3>Create Company</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <CommonForm
          formClassName="employee-form"
          layoutClassName="form-grid"
          register={register}
          errors={errors}
          fields={[
            {
              name: 'name',
              label: 'Company Name',
              id: 'sa-company-name',
              rules: { required: 'Company name is required' },
            },
          ]}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="action-row">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </CommonForm>
      </div>
    </div>
  )
}

function AssignAdminModal({ company, onClose, onAssigned }) {
  const { assignAdmin } = useApi()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched', defaultValues: { name: '', email: '' } })

  const onSubmit = async ({ name, email }) => {
    try {
      await assignAdmin(company._id, { name, email })
      toast.success(`Admin assigned to ${company.name} — login details emailed.`)
      onAssigned()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to assign admin.')
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Super Admin</p>
            <h3>Assign Admin — {company.name}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <p className="form-hint">
          A temporary password is generated and emailed to this person — they'll be required to change it on first
          login.
        </p>

        <CommonForm
          formClassName="employee-form"
          layoutClassName="form-grid"
          register={register}
          errors={errors}
          fields={[
            { name: 'name', label: 'Full Name', id: 'sa-admin-name', rules: { required: 'Name is required' } },
            {
              name: 'email',
              label: 'Email Address',
              id: 'sa-admin-email',
              type: 'email',
              rules: { required: 'Email is required' },
            },
          ]}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="action-row">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Assign Admin'}
            </Button>
          </div>
        </CommonForm>
      </div>
    </div>
  )
}

// Reuses the same dropdown look as Header's user menu (.header-user-menu /
// .header-user-dropdown) rather than inventing new CSS for a second
// dropdown pattern.
function CompanyActionsMenu({ company, onToggleStatus, onDeleteRequest }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="header-user-menu" ref={menuRef} style={{ display: 'inline-block' }}>
      <button
        type="button"
        className={`header-user-trigger${open ? ' is-open' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        Actions
        <span className={`header-user-chevron${open ? ' is-open' : ''}`}>
          <IconChevronDown />
        </span>
      </button>

      {open ? (
        <div className="header-user-dropdown" style={{ width: 160 }}>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onToggleStatus(company)
            }}
          >
            {company.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onDeleteRequest(company)
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

function DeleteCompanyModal({ company, onClose, onDeleted }) {
  const { deleteCompany } = useApi()
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const canDelete = confirmName.trim() === company.name

  const handleDelete = async () => {
    if (!canDelete) return
    setDeleting(true)
    try {
      await deleteCompany(company._id, confirmName.trim())
      toast.success(`${company.name} and all its data were deleted.`)
      onDeleted()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to delete company.')
      setDeleting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Super Admin</p>
            <h3>Delete {company.name}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="feedback-banner feedback-banner-error">
          This permanently deletes {company.name} and every user, leave, attendance, payroll, task, goal, promotion
          and review record that belongs to it. This cannot be undone.
        </div>

        <div className="form-field">
          <label htmlFor="sa-delete-confirm">
            Type <strong>{company.name}</strong> to confirm
          </label>
          <input
            id="sa-delete-confirm"
            type="text"
            autoComplete="off"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
          />
        </div>

        <div className="action-row">
          <Button variant="delete" onClick={handleDelete} disabled={!canDelete || deleting}>
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SuperAdminDashboard() {
  const { getPlatformStats, listCompanies, updateCompany } = useApi()

  const [stats, setStats] = useState(null)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsData, companiesData] = await Promise.all([getPlatformStats(), listCompanies()])
      setStats(statsData)
      setCompanies(companiesData.companies || [])
    } catch (err) {
      setError(err.message || 'Failed to load companies.')
    } finally {
      setLoading(false)
    }
  }, [getPlatformStats, listCompanies])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleStatus = async (company) => {
    try {
      await updateCompany(company._id, { status: company.status === 'Active' ? 'Inactive' : 'Active' })
      toast.success(`${company.name} is now ${company.status === 'Active' ? 'Inactive' : 'Active'}.`)
      refresh()
    } catch (err) {
      toast.error(err.message || 'Failed to update company status.')
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Super Admin</p>
          <h3>Companies</h3>
          <p className="form-hint">
            {stats ? `${stats.totalCompanies} companies · ${stats.activeCompanies} active · ${stats.totalUsers} users platform-wide` : null}
          </p>
        </div>
        <div className="action-row">
          <Button onClick={() => setShowCreate(true)}>+ Create Company</Button>
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Company</th>
              <th>Code</th>
              <th>Admin(s)</th>
              <th>Employees</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading companies...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={6}>No companies yet — create the first one.</td></tr>
            ) : (
              companies.map((company) => (
                <tr key={company._id}>
                  <td>{company.name}</td>
                  <td><code>{company.code}</code></td>
                  <td>
                    {company.admins.length === 0
                      ? <span className="pill pill-muted">None</span>
                      : company.admins.map((a) => a.name).join(', ')}
                  </td>
                  <td>{company.employeeCount}</td>
                  <td>
                    <span className={`pill ${company.status === 'Active' ? 'pill-success' : 'pill-danger'}`}>
                      {company.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button variant="view" to={`/superadmin/companies/${company._id}`}>View</Button>
                      <Button variant="secondary" onClick={() => setAssignTarget(company)}>Assign Admin</Button>
                      <CompanyActionsMenu
                        company={company}
                        onToggleStatus={toggleStatus}
                        onDeleteRequest={setDeleteTarget}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate ? <CreateCompanyModal onClose={() => setShowCreate(false)} onCreated={refresh} /> : null}
      {assignTarget ? (
        <AssignAdminModal company={assignTarget} onClose={() => setAssignTarget(null)} onAssigned={refresh} />
      ) : null}
      {deleteTarget ? (
        <DeleteCompanyModal company={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={refresh} />
      ) : null}
    </div>
  )
}

export default SuperAdminDashboard
