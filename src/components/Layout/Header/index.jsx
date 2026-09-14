import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useApi from '../../../hooks/useApi'
import { IconChevronDown, IconLogout, IconUser } from '../Sidebar/icons'
import NotificationBell from './NotificationBell'

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

function Header({
  eyebrow = 'Employee management system',
  title = 'HR Dashboard',
  currentUser,
  onLogout,
  onToggleSidebar,
}) {
  const { listEmployees } = useApi()
  const navigate = useNavigate()
  const location = useLocation()
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const userMenuRef = useRef(null)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setSearch(params.get('search') || '')
  }, [location.search])

  // Close the results dropdown on outside click and on Escape
  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Close the user menu on outside click and on Escape
  useEffect(() => {
    if (!isUserMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

  // The ⌘K / Ctrl+K chip in the search field is a real shortcut, not decoration.
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [])

  const openEmployeeSearch = (searchText = search) => {
    const query = searchText.trim()
    if (!query) return

    navigate(`/dashboard/employees?search=${encodeURIComponent(query)}`)
    setSearchResults([])
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const clearSearch = () => {
    setSearch('')
    setSearchResults([])
    setIsOpen(false)
    setActiveIndex(-1)

    if (location.pathname === '/dashboard/employees' && location.search) {
      navigate('/dashboard/employees')
    }
  }

  // Calls the backend whenever the user searches for an employee
  useEffect(() => {
    const searchEmployees = async () => {
      const searchText = search.trim()

      // If search box is empty, clear the results
      if (!searchText) {
        setSearchResults([])
        return
      }

      try {
        setSearching(true)

        // Send search text to the backend
        const data = await listEmployees({
          search: searchText,
          limit: 10,
        })

        // Store employees returned by backend
        setSearchResults(data.employees || [])
        setActiveIndex(-1)
      } catch (error) {
        console.error('Employee search failed:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }

    // Wait 300ms after the user stops typing
    const timer = setTimeout(searchEmployees, 300)

    // Cancel the previous timer if the user types again
    return () => clearTimeout(timer)
  }, [search, listEmployees])

  const handleKeyDown = (event) => {
    if (!isOpen || searchResults.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % searchResults.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      const picked = searchResults[activeIndex]
      openEmployeeSearch(picked.employeeId || picked.name)
    }
  }

  return (
    <header className="dashboard-header">

      <div className="header-lead">
        <button
          type="button"
          className="header-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <div className="header-title-block">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-actions">

        {/* Global search connected to the employee backend */}
        <form
          className="global-search-wrapper"
          ref={wrapperRef}
          onSubmit={(event) => {
            event.preventDefault()
            openEmployeeSearch()
          }}
        >

          <div className={`global-search ${isOpen ? 'is-open' : ''}`}>

            <svg
              className="search-icon"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.6" />
              <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="global-search-listbox"
              autoComplete="off"
            />

            {searching ? <span className="search-spinner" aria-hidden="true" /> : null}

            {search && !searching && (
              <button
                type="button"
                className="search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

          {/* Search results */}
          {isOpen && search && (
            <div className="search-results" id="global-search-listbox" role="listbox">

              {searching ? (
                <div className="search-message">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (

                searchResults.map((employee, index) => (
                  <button
                    type="button"
                    key={employee._id}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`search-result-item ${index === activeIndex ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openEmployeeSearch(employee.employeeId || employee.name)}
                  >
                    <span className="search-result-avatar" aria-hidden="true">
                      {getInitials(employee.name)}
                    </span>

                    <span className="search-result-body">
                      <strong>
                        {employee.name}
                      </strong>

                      <span>
                        {employee.employeeId} • {employee.department}
                      </span>

                      <small>
                        {employee.email}
                      </small>
                    </span>

                    <span
                      className={`pill search-result-status ${employee.status === 'Active' ? 'pill-success' : 'pill-muted'}`}
                    >
                      {employee.status || 'Active'}
                    </span>
                  </button>
                ))

              ) : (

                <div className="search-message">
                  No employees found for &ldquo;{search.trim()}&rdquo;
                </div>

              )}

            </div>
          )}

        </form>

        <NotificationBell />

        {currentUser ? (
          <div className="header-user-menu" ref={userMenuRef}>
            <button
              type="button"
              className={`header-user-trigger${isUserMenuOpen ? ' is-open' : ''}`}
              aria-expanded={isUserMenuOpen}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
            >
              <span className="header-user-avatar" aria-hidden="true">
                {getInitials(currentUser.name)}
              </span>
              <span className="header-user-name">{currentUser.name}</span>
              <span className={`header-user-chevron${isUserMenuOpen ? ' is-open' : ''}`}>
                <IconChevronDown />
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="header-user-dropdown">
                <Link to="/dashboard/profile" onClick={() => setIsUserMenuOpen(false)}>
                  <IconUser />
                  Profile
                </Link>
                <div className="header-user-divider" />
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    onLogout?.()
                  }}
                >
                  <IconLogout />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : null}

      </div>

    </header>
  )
}

export default Header
