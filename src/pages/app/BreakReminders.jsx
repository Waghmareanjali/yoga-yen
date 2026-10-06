import { useEffect, useState } from 'react';
import { AlarmClock, Check, Clock3, Coffee, Eye, Footprints, Pause, Play, RotateCcw, Sparkles, StretchHorizontal } from 'lucide-react';
import { DEFAULT_BREAK_INTERVAL } from '../../constants/risk';
import './breaks.css';

const suggestions = [
  { icon: Footprints, title: 'Take a short walk', detail: 'Stand and walk comfortably for two minutes.' },
  { icon: StretchHorizontal, title: 'Gentle shoulder stretch', detail: 'Roll your shoulders and release tension.' },
  { icon: Eye, title: 'Rest your eyes', detail: 'Look at a distant point for a short while.' },
  { icon: Coffee, title: 'Hydration check', detail: 'Take a moment to drink some water.' },
];

export default function BreakReminders() {
  const [intervalMinutes, setIntervalMinutes] = useState(DEFAULT_BREAK_INTERVAL / 60000);
  const [remainingSeconds, setRemainingSeconds] = useState(14 * 60);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!reminderEnabled || breakSeconds > 0 || remainingSeconds <= 0) return undefined;
    const timeout = window.setTimeout(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          setShowConfirmation(true);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [reminderEnabled, breakSeconds, remainingSeconds]);

  useEffect(() => {
    if (breakSeconds <= 0) return undefined;
    const interval = window.setInterval(() => {
      setBreakSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [breakSeconds]);

  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const startBreak = () => {
    setShowConfirmation(false);
    setBreakSeconds(2 * 60);
    setRemainingSeconds(intervalMinutes * 60);
  };
  const finishBreak = () => {
    setBreakSeconds(0);
    setBreaksTaken((count) => count + 1);
    setRemainingSeconds(intervalMinutes * 60);
  };
  const snooze = () => {
    setShowConfirmation(false);
    setRemainingSeconds(5 * 60);
  };

  return (
    <div className="break-page">
      <div className="page-header">
        <div><h1>Breaks</h1><p>Small pauses help create a steadier work rhythm. Choose the movement that feels comfortable for you.</p></div>
        <span className="badge success">{reminderEnabled ? 'Reminders on' : 'Reminders paused'}</span>
      </div>

      <div className="break-hero-grid">
        <section className="card break-timer-card">
          <div className="break-timer-top"><span className="break-timer-icon"><AlarmClock size={20} /></span><span className="badge info">Preview schedule</span></div>
          <span className="break-label">{breakSeconds > 0 ? 'Movement break' : 'Next suggested break'}</span>
          <strong className="break-countdown">{formatTime(breakSeconds > 0 ? breakSeconds : remainingSeconds)}</strong>
          <p>{breakSeconds > 0 ? 'Take a moment to move at your own pace.' : 'Reminder timing can be adjusted in Settings.'}</p>
          <div className="break-timer-actions">
            {breakSeconds > 0 ? (
              <button className="btn primary" onClick={finishBreak}><Check size={16} /> Complete break</button>
            ) : (
              <button className="btn primary" onClick={startBreak}><Play size={16} /> Take Break Now</button>
            )}
            <button className="btn ghost" onClick={() => setReminderEnabled((value) => !value)}>{reminderEnabled ? <Pause size={15} /> : <Play size={15} />}{reminderEnabled ? 'Pause reminders' : 'Resume reminders'}</button>
            {showConfirmation && <button className="btn ghost" onClick={snooze}><Clock3 size={15} /> Snooze 5 min</button>}
          </div>
        </section>

        <section className="card break-goal-card">
          <div className="break-section-title"><span><Clock3 size={17} /></span><h2>Today&apos;s movement</h2></div>
          <div className="break-goal-count"><strong>{breaksTaken}</strong><span>breaks completed</span></div>
          <div className="break-goal-track"><span style={{ width: `${Math.min(100, breaksTaken * 20)}%` }} /></div>
          <p>This is a gentle tracking goal, not a health prescription.</p>
          <label className="break-interval-setting">Suggested interval
            <select value={intervalMinutes} onChange={(event) => { const next = Number(event.target.value); setIntervalMinutes(next); setRemainingSeconds(next * 60); }}>
              {[30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </label>
        </section>
      </div>

      <section className="break-suggestions-section">
        <div className="break-section-heading"><div><span className="badge info">Move gently</span><h2>Choose a simple reset</h2></div><Sparkles size={20} /></div>
        <div className="break-suggestions-grid">
          {suggestions.map(({ icon: Icon, title, detail }) => (
            <article className="card break-suggestion" key={title}><span><Icon size={19} /></span><h3>{title}</h3><p>{detail}</p><button className="break-suggestion-action" onClick={startBreak}>Start this break <RotateCcw size={14} /></button></article>
          ))}
        </div>
      </section>

      <p className="break-disclaimer">Reminders are adjustable and are not medical advice. Take breaks in a way that feels appropriate to you.</p>
    </div>
  );
}
