import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, ListTodo, Activity, CheckCircle, Clock, CalendarDays, BarChart2, CheckSquare } from 'lucide-react';
import { getStats, getBurnoutStatus, getTasks } from '../api/api';
import { reduceWorkload } from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import BurnoutAlert from '../components/BurnoutAlert';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-val"><Clock size={12}/> {payload[0]?.value || 0}h studied</p>
        {payload[1] && <p className="tooltip-val"><CheckSquare size={12}/> {payload[1]?.value || 0} tasks</p>}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, burnoutRes, tasksRes] = await Promise.all([
        getStats(), getBurnoutStatus(), getTasks({ sort: 'deadline' }),
      ]);
      setStats(statsRes.data);
      setBurnout(burnoutRes.data);
      setRecentTasks(tasksRes.data.filter(t => !t.completed).slice(0, 5));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const handleReduceWorkload = async () => {
    try {
      const res = await reduceWorkload();
      await fetchAll();
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to auto-reduce workload.');
    }
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formatChartDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const chartData = stats?.weeklyData?.map(d => ({
    day: formatChartDate(d.date), hours: Math.round(d.hours * 10) / 10, tasks: d.tasks,
  })) || [];

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      </div>
    );
  }

  const completionRate = stats?.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const weeklyHours = stats?.weeklyData?.reduce((s, d) => s + d.hours, 0) || 0;

  return (
    <div className="main-content fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's your study overview for today</p>
        </div>
        <button className="btn btn-primary" id="dashboard-add-task" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Add Task
        </button>
      </div>

      <BurnoutAlert status={burnout} onReduceLoad={handleReduceWorkload} />

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatsCard icon={ListTodo} label="Total Tasks" value={stats?.totalTasks || 0} color="primary" />
        <StatsCard icon={CheckCircle} label="Completed" value={stats?.completedTasks || 0} color="green" sub={`${completionRate}% done`} />
        <StatsCard icon={Activity} label="Pending" value={stats?.pendingTasks || 0} color="yellow" />
        <StatsCard icon={Clock} label="Hours Today" value={`${stats?.todayHours || 0}h`} color={stats?.todayHours > 8 ? 'red' : 'primary'} />
        <StatsCard icon={CalendarDays} label="Due This Week" value={stats?.upcomingDeadlines || 0} color="primary" />
      </div>

      <div className="dashboard-grid">
        <div className="glass-card chart-card">
          <h2 className="section-title"><BarChart2 size={18}/> Study Hours (Last 7 Days)</h2>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b7355" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b7355" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe5de" />
                <XAxis dataKey="day" tick={{ fill: '#9c8e82', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9c8e82', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="hours" stroke="#8b7355" strokeWidth={2} fill="url(#hoursGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="weekly-progress">
            <div className="weekly-progress-label">
              <span>Weekly progress</span>
              <span className={weeklyHours > 40 ? 'text-red' : 'text-green'}>
                {Math.round(weeklyHours)}h / 40h
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (weeklyHours / 40) * 100)}%`,
                  background: weeklyHours > 40 ? 'var(--accent-red)' : 'var(--accent-green)'
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card tasks-preview-card">
          <div className="section-header">
            <h2 className="section-title"><ListTodo size={18}/> Upcoming Tasks</h2>
            <Link to="/tasks" className="btn btn-ghost btn-sm">View all</Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckCircle size={40} strokeWidth={1.5} /></div>
              <h3>All caught up!</h3>
              <p>No pending tasks. Add one to get started.</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {recentTasks.map(task => (
                <TaskCard key={task._id} task={task} onUpdate={fetchAll} onDelete={fetchAll} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchAll(); }} />}
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;
