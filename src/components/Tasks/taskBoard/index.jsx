import { useCallback, useEffect, useMemo, useState } from 'react'
import { isManagerRole } from '../../../utils/roles'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import TaskForm from '../taskForm'
import TaskDetails from '../taskDetails'
import { TASK_STATUSES, formatDateDisplay, isOverdue, priorityPillClass } from '../taskStore'

function TaskCard({ task, onOpen, onDragStart }) {
  const overdue = isOverdue(task)

  return (
    <div
      className="task-card"
      draggable
      onDragStart={() => onDragStart(task._id)}
      onClick={() => onOpen(task._id)}
    >
      <div className="task-card-head">
        <span className={`pill ${priorityPillClass(task.priority)}`}>{task.priority}</span>
        {task.comments?.length ? <span className="task-card-comments">💬 {task.comments.length}</span> : null}
      </div>
      <p className="task-card-title">{task.title}</p>
      <p className="task-card-assignee">{task.assigneeName}</p>
      <p className={`task-card-due ${overdue ? 'task-card-due-overdue' : ''}`}>
        {overdue ? 'Overdue: ' : 'Due '}
        {formatDateDisplay(task.dueDate)}
      </p>
    </div>
  )
}

function TaskBoard({ currentUser }) {
  const isManager = isManagerRole(currentUser)
  const { listEmployees, listTasks, getMyTasks, updateTask } = useApi()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState([])
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const [formTask, setFormTask] = useState(undefined)
  const [openTaskId, setOpenTaskId] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isManager
        ? await listTasks({ assigneeId: assigneeFilter || undefined })
        : await getMyTasks()
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isManager, assigneeFilter, listTasks, getMyTasks])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!isManager) return
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [isManager, listEmployees])

  const openTask = useMemo(() => tasks.find((task) => task._id === openTaskId) || null, [tasks, openTaskId])

  const handleDrop = async (status) => {
    if (!draggingId) return
    const id = draggingId
    setDraggingId(null)
    try {
      await updateTask(id, { status })
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Tasks</p>
          <h3>{isManager ? 'Task Board' : 'My Tasks'}</h3>
        </div>
        {isManager ? <Button onClick={() => setFormTask(null)}>+ Create Task</Button> : null}
      </div>

      {isManager ? (
        <div className="form-field filter-field">
          <label htmlFor="task-employee-filter">Filter by employee</label>
          <select
            id="task-employee-filter"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee.employeeId}>
                {employee.employeeId} — {employee.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      {loading ? (
        <p className="form-hint">Loading tasks...</p>
      ) : (
        <div className="kanban-board">
          {TASK_STATUSES.map((status) => (
            <div
              className="kanban-column"
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="kanban-column-header">
                <h4>{status}</h4>
                <span className="pill pill-muted">{tasks.filter((task) => task.status === status).length}</span>
              </div>
              <div className="kanban-column-body">
                {tasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <TaskCard key={task._id} task={task} onOpen={setOpenTaskId} onDragStart={setDraggingId} />
                  ))}
                {tasks.filter((task) => task.status === status).length === 0 ? (
                  <p className="form-hint">No tasks here.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {formTask !== undefined ? (
        <TaskForm
          task={formTask}
          employees={employees}
          currentUser={currentUser}
          onClose={() => setFormTask(undefined)}
          onSaved={() => {
            setFormTask(undefined)
            refresh()
          }}
        />
      ) : null}

      {openTask ? (
        <TaskDetails
          task={openTask}
          isManager={isManager}
          currentUser={currentUser}
          onClose={() => setOpenTaskId(null)}
          onChanged={refresh}
          onEdit={() => {
            setOpenTaskId(null)
            setFormTask(openTask)
          }}
        />
      ) : null}
    </div>
  )
}

export default TaskBoard
