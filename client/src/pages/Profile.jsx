import { useEffect, useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { UserCircle, Calendar, CheckSquare, Clock, BarChart2, ShieldAlert, ArrowRight } from 'lucide-react';
import { getStats, getBurnoutStatus } from '../api/api';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, b] = await Promise.all([getStats(), getBurnoutStatus()]);
        setStats(s.data); setBurnout(b.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="main-content"><div className="skeleton" style={{ height: 200, borderRadius: 16 }} /></div>;

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently';
  const completionRate = stats?.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const totalWeeklyHours = burnout?.weeklyStats?.totalWeeklyHours || 0;

  const chartData = burnout?.weeklyStats?.dailyBreakdown?.map(d => ({
    day: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }), hours: d.hours, tasks: d.tasks,
  })) || [];

  const radarData = [
    { subject: 'Consistency', value: Math.min(100, burnout?.weeklyStats?.consecutiveDays * 14 || 0) },
    { subject: 'Completion', value: completionRate },
    { subject: 'Task Load', value: Math.min(100, (stats?.todayTasks / 5) * 100 || 0) },
    { subject: 'Hours', value: Math.min(100, (totalWeeklyHours / 40) * 100) },
    { subject: 'Balance', value: burnout?.riskLevel === 'none' ? 90 : burnout?.riskLevel === 'moderate' ? 50 : 20 },
  ];

  const riskColors = { none: 'var(--accent-green)', moderate: 'var(--accent-yellow)', high: 'var(--accent-red)' };
  const riskColor = riskColors[burnout?.riskLevel] || 'var(--accent-green)';
  const riskLabel = burnout?.riskLevel === 'none' ? 'Healthy' : burnout?.riskLevel === 'moderate' ? 'Moderate Risk' : 'High Risk';

  return (
    <div className="main-content fade-in">
      <h1 className="page-title"><UserCircle size={26}/> My Profile</h1>
      <p className="page-subtitle">Your study stats and burnout analysis</p>

      <div className="profile-hero glass-card">
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-since"><Calendar size={13} style={{display:'inline', marginBottom:'-2px'}}/> Member since {memberSince}</p>
        </div>
        <div className="burnout-badge-hero" style={{ borderColor: riskColor, color: riskColor, background: riskColor + '10' }}>
          {riskLabel}
        </div>
      </div>

      <div className="stats-grid" style={{ margin: '20px 0' }}>
        <StatsCard icon={CheckSquare} label="Total Tasks" value={stats?.totalTasks || 0} color="primary" />
        <StatsCard icon={CheckSquare} label="Completed" value={stats?.completedTasks || 0} sub={`${completionRate}%`} color="green" />
        <StatsCard icon={Clock} label="Weekly Hours" value={`${totalWeeklyHours}h`} color={totalWeeklyHours > 40 ? 'red' : 'primary'} />
        <StatsCard icon={BarChart2} label="Study Streak" value={`${burnout?.weeklyStats?.consecutiveDays || 0}d`} color={burnout?.weeklyStats?.consecutiveDays >= 7 ? 'red' : 'yellow'} />
      </div>

      <div className="profile-charts-grid">
        <div className="glass-card">
          <h3 className="section-title" style={{ marginBottom: 16 }}><BarChart2 size={18}/> Daily Breakdown (7 Days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebe5de" />
              <XAxis dataKey="day" tick={{ fill: '#9c8e82', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9c8e82', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-card)' }} />
              <Bar dataKey="hours" name="Hours" fill="#8b7355" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasks" name="Tasks" fill="#688a6d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 className="section-title" style={{ marginBottom: 16 }}><Activity size={18}/> Study Health Radar</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ebe5de" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6e6156', fontSize: 11 }} />
              <Radar name="Performance" dataKey="value" stroke="#8b7355" fill="#8b7355" fillOpacity={0.15} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {burnout?.riskLevel !== 'none' && (
        <div className="glass-card burnout-status-card fade-in" style={{ marginTop: 20, borderLeft: `4px solid ${riskColor}`}}>
          <h3 className="section-title" style={{ marginBottom: 12 }}><ShieldAlert size={18} color={riskColor}/> Burnout Analysis</h3>
          <div className="burnout-details">
            {burnout.triggers.map((t, i) => (
              <div key={i} className="burnout-detail-item">
                <span className="detail-icon" style={{ color: riskColor }}>●</span> <span>{t}</span>
              </div>
            ))}
          </div>
          {burnout.suggestions.length > 0 && (
            <div className="suggestions-list">
              <p className="suggestions-title">Recommendations</p>
              {burnout.suggestions.map((s, i) => (
                <div key={i} className="suggestion-item"><ArrowRight size={14} className="sugg-icon"/> {s}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Activity import fallback since I didn't import it at the top
import { Activity } from 'lucide-react';

export default Profile;
