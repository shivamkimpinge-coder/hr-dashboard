import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import { TASK_PRIORITIES, TASK_PRIORITY, createTask, updateTask } from '../taskStore'

function TaskForm({ task, employees, currentUser, onClose, onSaved }) {
  const isEdit = Boolean(task)

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigneeId: task?.assigneeId || '',
    priority: task?.priority || TASK_PRIORITY.MEDIUM,
    dueDate: task?.dueDate || '',
  })

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      toast.error('Task title is required.')
      return
    }
    if (!form.assigneeId) {
      toast.error('Please assign this task to an employee.')
      return
    }

    const assignee = employees.find((employee) => employee.employeeId === form.assigneeId)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      assigneeId: form.assigneeId,
      assigneeName: assignee?.name || form.assigneeId,
      assigneeEmail: assignee?.email || '',
      priority: form.priority,
      dueDate: form.dueDate,
    }

    if (isEdit) {
      updateTask(task.id, payload)
      toast.success('Task updated successfully.')
    } else {
      createTask({ ...payload, createdByName: currentUser?.name || 'Admin' })
      toast.success('Task created successfully.')
    }

    onSaved()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Tasks</p>
            <h3>{isEdit ? 'Update Task' : 'Create Task'}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <form className="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field form-field-full">
              <label htmlFor="task-title">Title</label>
              <input id="task-title" type="text" value={form.title} onChange={handleChange('title')} required />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                rows="3"
                value={form.description}
                onChange={handleChange('description')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="task-assignee">Assign To</label>
              <select id="task-assignee" value={form.assigneeId} onChange={handleChange('assigneeId')} required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee.employeeId}>
                    {employee.employeeId} — {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" value={form.priority} onChange={handleChange('priority')}>
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="task-due-date">Due Date</label>
              <input id="task-due-date" type="date" value={form.dueDate} onChange={handleChange('dueDate')} />
            </div>
          </div>

          <div className="action-row">
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
