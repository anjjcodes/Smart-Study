import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, Edit2, Trash2, BookOpen, Clock, Calendar, AlertCircle, Play } from 'lucide-react';
import { updateTask, deleteTask } from '../api/api';
import TaskModal from './TaskModal';
import './TaskCard.css';

const priorityConfig = {
  high:   { label: 'High',   color: 'high',   icon: AlertCircle },
  medium: { label: 'Medium', color: 'medium', icon: AlertCircle },
  low:    { label: 'Low',    color: 'low',    icon: AlertCircle },
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getDaysLeft = (deadline) => {
  const diff = new Date(deadline) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: 'Overdue', cls: 'overdue' };
  if (days === 0) return { text: 'Due today', cls: 'today' };
  if (days === 1) return { text: '1 day left', cls: 'soon' };
  if (days <= 3) return { text: `${days} days left`, cls: 'soon' };
  return { text: `${days} days left`, cls: 'ok' };
};

const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
  const deadline = getDaysLeft(task.deadline);
  const PriorityIcon = pCfg.icon;

  const handleToggleComplete = async () => {
    setCompleting(true);
    try {
      await updateTask(task._id, { completed: !task.completed });
      onUpdate();
      toast.success(task.completed ? 'Marked as pending' : 'Task completed!');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setCompleting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTask(task._id);
      setShowDeleteConfirm(false);
      onDelete();
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <>
      <div className={`task-card glass-card fade-in ${task.completed ? 'task-completed' : ''}`}>
        <div className="task-card-top">
          <button
            className={`complete-btn ${task.completed ? 'checked' : ''}`}
            onClick={handleToggleComplete}
            disabled={completing}
            title={task.completed ? 'Mark as pending' : 'Mark as complete'}
          >
            {task.completed && <Check size={14} />}
          </button>

          <div className="task-info">
            <div className="task-title-row">
              <span className="task-title">{task.title}</span>
              <span className={`badge badge-${pCfg.color}`}><PriorityIcon size={12}/> {pCfg.label}</span>
            </div>
            <div className="task-meta">
              <span className="task-subject"><BookOpen size={13}/> {task.subject}</span>
              <span className="task-hours"><Clock size={13}/> {task.studyHours}h</span>
              <span className={`task-deadline deadline-${deadline.cls}`}><Calendar size={13}/> {deadline.text}</span>
            </div>
            {task.description && <p className="task-desc">{task.description}</p>}
          </div>
        </div>

        <div className="task-actions">
          <span className="task-date-full">Due: {formatDate(task.deadline)}</span>
          {!task.completed && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/timer', { state: { task }})}>
              <Play size={13}/> Start Timer
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Edit2 size={13}/> Edit</button>
          <button className="btn btn-ghost btn-sm text-danger" onClick={handleDeleteClick}><Trash2 size={13}/> Delete</button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: '400px', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <h2 className="modal-title" style={{ color: 'var(--accent-red)' }}>Delete Task</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              Are you sure you want to delete <strong>"{task.title}"</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete Task</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <TaskModal
          task={task}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdate(); }}
        />
      )}
    </>
  );
};

export default TaskCard;
