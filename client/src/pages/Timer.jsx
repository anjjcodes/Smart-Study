import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, ArrowLeft, Clock, Timer as TimerIcon, StopCircle } from 'lucide-react';
import './Timer.css';

const Timer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const task = location.state?.task || null;

  // Modes: 'task' (preset countdown), 'timer' (custom countdown), 'stopwatch' (count up)
  const initialMode = task ? 'task' : 'timer';
  const [mode, setMode] = useState(initialMode);
  
  // Custom Timer state
  const [customMinutes, setCustomMinutes] = useState(25);
  
  // Base time logic
  const getInitialTime = () => {
    if (task) return Math.floor(task.studyHours * 3600); // hours to seconds
    if (mode === 'stopwatch') return 0;
    return customMinutes * 60; // default 25 mins
  };

  const [time, setTime] = useState(getInitialTime());
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);
  
  // Store the total baseline time to calculate circular progress
  const [totalTime, setTotalTime] = useState(getInitialTime());

  // Handle mode switches
  const switchMode = (newMode) => {
    setIsActive(false);
    setMode(newMode);
  };

  // Re-sync time when mode or custom minutes change (only if not active)
  useEffect(() => {
    if (!isActive) {
      const init = getInitialTime();
      setTime(init);
      if (mode !== 'stopwatch') setTotalTime(init);
    }
  }, [mode, customMinutes, task]);

  // Main Timer loop
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (mode === 'stopwatch') return prev + 1; // Count up
          
          // Count down
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    const init = getInitialTime();
    setTime(init);
    if (mode !== 'stopwatch') setTotalTime(init);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentTheme = mode === 'stopwatch' ? '--accent-green' : '--accent-orange';
  
  // Calculate progress circle (stopwatch fills up every 60s as a cool visual, countdown goes backwards)
  let progress = 0;
  if (mode === 'stopwatch') {
    progress = (time % 60) / 60 * 100; // Loop every minute
  } else {
    progress = totalTime > 0 ? ((totalTime - time) / totalTime) * 100 : 0;
  }

  return (
    <div className="main-content fade-in timer-page">
      {task && (
        <button className="btn btn-ghost btn-sm back-nav" onClick={() => navigate(-1)}>
          <ArrowLeft size={16}/> Back to Tasks
        </button>
      )}
      
      <div className="timer-container glass-card">
        {task ? (
          <div className="timer-task-context">
            <span className="context-label">Task Focus Target: {task.studyHours} hrs</span>
            <h2 className="context-title">{task.title}</h2>
          </div>
        ) : (
          <div className="timer-modes">
            <button 
              className={`mode-btn ${mode === 'timer' ? 'active timer-active' : ''}`}
              onClick={() => switchMode('timer')}
              disabled={isActive}
            >
              <TimerIcon size={16}/> Countdown
            </button>
            <button 
              className={`mode-btn ${mode === 'stopwatch' ? 'active stopwatch-active' : ''}`}
              onClick={() => switchMode('stopwatch')}
              disabled={isActive}
            >
              <StopCircle size={16}/> Stopwatch
            </button>
          </div>
        )}

        {!task && mode === 'timer' && !isActive && time === totalTime && (
          <div className="custom-time-input">
            <label>Set Minutes:</label>
            <input 
              type="number" 
              min="1" 
              max="999" 
              value={customMinutes} 
              onChange={(e) => setCustomMinutes(Number(e.target.value) || 1)}
              className="form-input time-setter"
            />
          </div>
        )}

        <div className="timer-display-wrapper">
          <div className="timer-circle" style={{ 
            background: `conic-gradient(var(${currentTheme}) ${progress}%, var(--bg-secondary) ${progress}%)` 
          }}>
            <div className="timer-inner">
              <span className={`time ${formatTime(time).length > 5 ? 'time-long' : ''}`}>
                {formatTime(time)}
              </span>
              <span className="time-sub">
                {mode === 'stopwatch' ? 'Elapsed Time' : 'Remaining'}
              </span>
            </div>
          </div>
        </div>

        <div className="timer-controls">
          <button 
            className={`btn btn-icon timer-main-btn ${isActive ? 'timer-pause' : mode === 'stopwatch' ? 'timer-start-sw' : 'timer-start-cd'}`}
            onClick={toggleTimer}
          >
            {isActive ? <Pause size={24}/> : <Play size={24} style={{marginLeft: '4px'}} />}
          </button>
          <button className="btn btn-icon timer-reset-btn" onClick={resetTimer} title="Reset">
            <RotateCcw size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
