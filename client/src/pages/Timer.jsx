import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Brain, Coffee, ArrowLeft } from 'lucide-react';
import './Timer.css';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const Timer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const task = location.state?.task || null;

  const [mode, setMode] = useState('work'); // 'work' or 'break'
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            // Play a sound or show notification here in a real app
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? WORK_TIME : BREAK_TIME);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? WORK_TIME : BREAK_TIME);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work' 
    ? ((WORK_TIME - timeLeft) / WORK_TIME) * 100 
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <div className="main-content fade-in timer-page">
      {task && (
        <button className="btn btn-ghost btn-sm back-nav" onClick={() => navigate(-1)}>
          <ArrowLeft size={16}/> Back
        </button>
      )}
      
      <div className="timer-container glass-card">
        {task && (
          <div className="timer-task-context">
            <span className="context-label">Focusing on:</span>
            <h2 className="context-title">{task.title}</h2>
          </div>
        )}

        <div className="timer-modes">
          <button 
            className={`mode-btn ${mode === 'work' ? 'active work-active' : ''}`}
            onClick={() => switchMode('work')}
          >
            <Brain size={16}/> Pomodoro
          </button>
          <button 
            className={`mode-btn ${mode === 'break' ? 'active break-active' : ''}`}
            onClick={() => switchMode('break')}
          >
            <Coffee size={16}/> Short Break
          </button>
        </div>

        <div className="timer-display-wrapper">
          <div className="timer-circle" style={{ 
            background: `conic-gradient(var(${mode === 'work' ? '--accent-orange' : '--accent-green'}) ${progress}%, var(--bg-secondary) ${progress}%)` 
          }}>
            <div className="timer-inner">
              <span className="time">{formatTime(timeLeft)}</span>
              <span className="time-sub">{mode === 'work' ? 'Focus Time' : 'Relax'}</span>
            </div>
          </div>
        </div>

        <div className="timer-controls">
          <button 
            className={`btn btn-icon timer-main-btn ${isActive ? 'timer-pause' : mode === 'work' ? 'timer-start-work' : 'timer-start-break'}`}
            onClick={toggleTimer}
          >
            {isActive ? <Pause size={24}/> : <Play size={24} style={{marginLeft: '4px'}} />}
          </button>
          <button className="btn btn-icon timer-reset-btn" onClick={resetTimer} title="Reset Timer">
            <RotateCcw size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
