import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import {
  TASK_STATUSES,
  addComment,
  deleteTask,
  formatDateDisplay,
  formatDateTimeDisplay,
  isOverdue,
  priorityPillClass,
  statusPillClass,
  updateTask,
} from '../taskStore'

function TaskDetails({ task, isAdmin, currentUser, onClose, onChanged, onEdit }) {
  const [commentText, setCommentText] = useState('')

  if (!task) return null

  const handleStatusChange = (event) => {
    updateTask(task.id, { status: event.target.value })
    toast.success('Status updated.')
    onChanged()
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    addComment(task.id, { author: currentUser?.name || 'You', text: commentText.trim() })
    setCommentText('')
    onChanged()
  }

  const handleDelete = () => {
    deleteTask(task.id)
    toast.success('Task deleted successfully.')
    onChanged()
    onClose()
  }

  const overdue = isOverdue(task)

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Tasks</p>
            <h3>{task.title}</h3>
          </div>
          <Button variant="close" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="payslip-content">
          <div className="payslip-header">
            <div>
              <h4>{task.assigneeName}</h4>
              <p>Assigned by {task.createdByName || 'Admin'}</p>
            </div>
            <div className="payslip-meta">
              <p>
                <strong>Priority:</strong>{' '}
                <span className={`pill ${priorityPillClass(task.priority)}`}>{task.priority}</span>
              </p>
              <p>
                <strong>Due:</strong> {formatDateDisplay(task.dueDate)}
                {overdue ? <span className="pill pill-danger" style={{ marginLeft: 8 }}>Overdue</span> : null}
              </p>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <p className="eyebrow">Description</p>
              <p>{task.description || 'No description provided.'}</p>
            </div>
            <div className="detail-card">
              <p className="eyebrow">Status</p>
              <select value={task.status} onChange={handleStatusChange}>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p style={{ marginTop: 10 }}>
                <span className={`pill ${statusPillClass(task.status)}`}>{task.status}</span>
              </p>
            </div>
          </div>

          {isAdmin ? (
            <div className="action-row" style={{ marginTop: 4 }}>
              <Button variant="secondary" onClick={onEdit}>
                Update Task
              </Button>
              <Button variant="delete" onClick={handleDelete}>
                Delete Task
              </Button>
            </div>
          ) : null}

          <p className="eyebrow" style={{ marginTop: '1.25rem' }}>
            Comments
          </p>
          <div className="comment-list">
            {(task.comments || []).length === 0 ? (
              <p className="form-hint">No comments yet.</p>
            ) : (
              task.comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  <div className="comment-item-head">
                    <strong>{comment.author}</strong>
                    <span>{formatDateTimeDisplay(comment.createdAt)}</span>
                  </div>
                  <p>{comment.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="comment-form">
            <textarea
              rows="2"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />
            <Button onClick={handleAddComment}>Add Comment</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetails
