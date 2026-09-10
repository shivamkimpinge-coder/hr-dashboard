import { useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../../utils/Button/button'
import useApi from '../../../hooks/useApi'
import {
  TASK_STATUSES,
  formatDateDisplay,
  formatDateTimeDisplay,
  isOverdue,
  priorityPillClass,
  statusPillClass,
} from '../taskStore'

function TaskDetails({ task, isManager, currentUser, onClose, onChanged, onEdit }) {
  const { updateTask, deleteTask, addTaskComment } = useApi()
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  if (!task) return null

  const handleStatusChange = async (event) => {
    try {
      await updateTask(task._id, { status: event.target.value })
      toast.success('Status updated.')
      onChanged()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    setPosting(true)
    try {
      await addTaskComment(task._id, { author: currentUser?.name || 'You', text: commentText.trim() })
      setCommentText('')
      onChanged()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTask(task._id)
      toast.success('Task deleted successfully.')
      onChanged()
      onClose()
    } catch (error) {
      toast.error(error.message)
    }
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

          {isManager ? (
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
                <div className="comment-item" key={comment._id}>
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
            <Button onClick={handleAddComment} disabled={posting}>
              {posting ? 'Posting...' : 'Add Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetails
