import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Filter, LayoutList, ChevronDown, ChevronRight, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { getTasks, getBurnoutStatus, reduceWorkload } from '../api/api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import BurnoutAlert from '../components/BurnoutAlert';
import './Tasks.css';

const PRIORITIES = ['all', 'high', 'medium', 'low'];
const SORTS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
  { value: 'hours', label: 'Hours' },
];

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [burnout, setBurnout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState('createdAt');
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const params = { sort };
      if (priority !== 'all') params.priority = priority;
      if (search) params.search = search;
      const [tasksRes, burnoutRes] = await Promise.all([ getTasks(params), getBurnoutStatus() ]);
      setTasks(tasksRes.data);
      setBurnout(burnoutRes.data);
    } catch { toast.error('Failed to load tasks'); } finally { setLoading(false); }
  }, [sort, priority, search]);

  const handleReduceWorkload = async () => {
    try {
      const res = await reduceWorkload();
      await fetchTasks();
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to auto-reduce workload.');
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchTasks, 300);
    return () => clearTimeout(delay);
  }, [fetchTasks]);

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  return (
    <div className="main-content fade-in">
      <div className="tasks-header">
        <div>
          <h1 className="page-title"><LayoutList size={26}/> My Tasks</h1>
          <p className="page-subtitle">{pending.length} pending · {completed.length} completed</p>
        </div>
        <button id="tasks-add-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Add Task
        </button>
      </div>

      <BurnoutAlert status={burnout} onReduceLoad={handleReduceWorkload}/>

      <div className="tasks-filters glass-card">
        <div className="search-wrap">
          <Search size={16} className="search-icon"/>
          <input
            id="tasks-search" className="form-input search-input"
            placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label"><Filter size={14}/> Priority:</span>
          {PRIORITIES.map(p => (
            <button key={p} className={`filter-btn ${priority === p ? 'active' : ''}`} onClick={() => setPriority(p)}>
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="filter-group ml-auto">
          <span className="filter-label">Sort:</span>
          <select className="form-select sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="tasks-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : (
        <>
          {pending.length === 0 && !showCompleted ? (
            <div className="empty-state glass-card">
              <div className="empty-state-icon"><LayoutList size={48} strokeWidth={1} /></div>
              <h3>No pending tasks</h3>
              <p>Add a task to get started with your study plan.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                <Plus size={16}/> Add First Task
              </button>
            </div>
          ) : (
            <div className="tasks-grid">
              {pending.map(task => <TaskCard key={task._id} task={task} onUpdate={fetchTasks} onDelete={fetchTasks} />)}
            </div>
          )}

          {completed.length > 0 && (
            <div className="completed-section">
              <button className="completed-toggle" onClick={() => setShowCompleted(v => !v)}>
                {showCompleted ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Completed Tasks ({completed.length})
              </button>
              {showCompleted && (
                <div className="tasks-grid" style={{ marginTop: 12 }}>
                  {completed.map(task => <TaskCard key={task._id} task={task} onUpdate={fetchTasks} onDelete={fetchTasks} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchTasks(); }} />}
    </div>
  );
};

export default Tasks;
