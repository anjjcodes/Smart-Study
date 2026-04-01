import { useState } from 'react';
import { AlertTriangle, Info, Zap, Lightbulb } from 'lucide-react';
import './BurnoutAlert.css';

const BurnoutAlert = ({ status, onReduceLoad }) => {
  const [isReducing, setIsReducing] = useState(false);
  if (!status || status.riskLevel === 'none') return null;
  const isHigh = status.riskLevel === 'high';
  const Icon = isHigh ? AlertTriangle : Info;

  return (
    <div className={`burnout-alert burnout-${status.riskLevel} fade-in`}>
      <div className="burnout-header">
        <Icon size={24} className="burnout-icon" />
        <div className="burnout-title-block">
          <h3 className="burnout-title">
            {isHigh ? 'High Burnout Risk Detected' : 'Workload Warning'}
          </h3>
          <p className="burnout-subtitle">
            {isHigh
              ? 'Your study load is critically high. Immediate action required.'
              : 'Your workload is increasing. Consider balancing your schedule.'}
          </p>
        </div>
      </div>

      <div className="burnout-body">
        {status.triggers.length > 0 && (
          <div className="burnout-list">
            <p className="list-label"><Zap size={14}/> Triggered by:</p>
            <ul>{status.triggers.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        )}
        {status.suggestions.length > 0 && (
          <div className="burnout-list">
            <p className="list-label"><Lightbulb size={14}/> Suggestions:</p>
            <ul>{status.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            {onReduceLoad && (
              <button 
                className="btn btn-sm btn-ghost" 
                style={{ marginTop: 12, borderColor: isHigh ? 'var(--accent-red)' : 'var(--accent-yellow)', color: isHigh ? 'var(--accent-red)' : 'var(--accent-yellow)' }}
                onClick={async () => {
                  setIsReducing(true);
                  await onReduceLoad();
                  setIsReducing(false);
                }}
                disabled={isReducing}
              >
                {isReducing ? 'Applying...' : 'Auto-Reduce Workload (20%)'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BurnoutAlert;
