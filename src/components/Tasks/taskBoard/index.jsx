import { useEffect, useMemo, useState } from 'react'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import TaskForm from '../taskForm'
import TaskDetails from '../taskDetails'
import {
  TASK_STATUSES,
  formatDateDisplay,
  isOverdue,
  listTasks,
  priorityPillClass,
  updateTask,
} from '../taskStore'

function TaskCard({ task, onOpen, onDragStart }) {
  const overdue = isOverdue(task)

  return (
    <div
      className="task-card"
      draggable
      onDragStart={() => onDragStart(task.id)}
      onClick={() => onOpen(task.id)}
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
  const isAdmin = currentUser?.role === 'Admin'
  const { listEmployees } = useApi()

  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const [formTask, setFormTask] = useState(undefined) // undefined = closed, null = create, task = edit
  const [openTaskId, setOpenTaskId] = useState(null)

  const refresh = () => setTasks(listTasks())

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    listEmployees({ limit: 200 })
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {})
  }, [isAdmin, listEmployees])

  const visibleTasks = useMemo(() => {
    if (!isAdmin) return tasks.filter((task) => task.assigneeEmail === currentUser?.email)
    return assigneeFilter ? tasks.filter((task) => task.assigneeId === assigneeFilter) : tasks
  }, [tasks, isAdmin, assigneeFilter, currentUser])

  const openTask = useMemo(() => tasks.find((task) => task.id === openTaskId) || null, [tasks, openTaskId])

  const handleDrop = (status) => {
    if (!draggingId) return
    updateTask(draggingId, { status })
    setDraggingId(null)
    refresh()
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Tasks</p>
          <h3>{isAdmin ? 'Task Board' : 'My Tasks'}</h3>
        </div>
        {isAdmin ? <Button onClick={() => setFormTask(null)}>+ Create Task</Button> : null}
      </div>

      {isAdmin ? (
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
              <span className="pill pill-muted">{visibleTasks.filter((task) => task.status === status).length}</span>
            </div>
            <div className="kanban-column-body">
              {visibleTasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <TaskCard key={task.id} task={task} onOpen={setOpenTaskId} onDragStart={setDraggingId} />
                ))}
              {visibleTasks.filter((task) => task.status === status).length === 0 ? (
                <p className="form-hint">No tasks here.</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

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
          isAdmin={isAdmin}
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
