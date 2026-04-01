import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatsCard.css';

const StatsCard = ({ icon: Icon, label, value, sub, color = 'primary', trend }) => {
  return (
    <div className={`stats-card glass-card fade-in accent-${color}`}>
      <div className="stats-top">
        <div className={`stats-icon-wrap accent-bg-${color}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <span className={`stats-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {Math.abs(trend)}
          </span>
        )}
      </div>
      <div className="stats-value">{value}</div>
      <div className="stats-label">{label}</div>
      {sub && <div className="stats-sub">{sub}</div>}
    </div>
  );
};

export default StatsCard;
