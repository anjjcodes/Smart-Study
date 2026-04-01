import { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Check } from 'lucide-react';
import { createTask, updateTask } from '../api/api';
import './TaskModal.css';

const defaultForm = {
  title: '', subject: '', description: '', priority: 'medium', deadline: '', studyHours: '', date: new Date().toISOString().split('T')[0],
};

const TaskModal = ({ task = null, onClose, onSaved }) => {
  const [form, setForm] = useState(task ? {
    title: task.title, subject: task.subject, description: task.description || '', priority: task.priority,
    deadline: task.deadline?.split('T')[0] || '', studyHours: task.studyHours,
    date: task.date?.split('T')[0] || new Date().toISOString().split('T')[0],
  } : defaultForm);

  const [loading, setLoading] = useState(false);
  const isEdit = !!task;

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim() || !form.deadline || !form.studyHours) {
      toast.error('Please fill all required fields');
      return;
    }
    if (parseFloat(form.studyHours) <= 0) {
      toast.error('Study hours must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await updateTask(task._id, form);
        toast.success('Task updated!');
      } else {
        await createTask(form);
        toast.success('Task added successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'Add New Task'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input className="form-input" name="title" placeholder="e.g. Study Chapter 5" value={form.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-input" name="subject" placeholder="e.g. Mathematics" value={form.subject} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" placeholder="Optional notes..." value={form.description} onChange={handleChange} />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Study Hours *</label>
              <input className="form-input" type="number" name="studyHours" placeholder="e.g. 2.5" min="0.5" max="24" step="0.5" value={form.studyHours} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Task Date</label>
              <input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deadline *</label>
            <input className="form-input" type="date" name="deadline" value={form.deadline} onChange={handleChange} required />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : <><Check size={16}/> {isEdit ? 'Update Task' : 'Add Task'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
