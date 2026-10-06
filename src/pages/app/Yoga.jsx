import { useEffect, useState } from 'react';
import { Check, Clock3, Play, RotateCcw, Sparkles, X } from 'lucide-react';
import { recommendationApi } from '../../api/recommendationApi';
import { apiConfig } from '../../api/client';
import AuthAlert from '../../components/auth/AuthAlert';
import './yoga.css';

export default function Yoga() {
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([recommendationApi.getExercises(), recommendationApi.getRecommendations()])
      .then(([exerciseResult, recommendationResult]) => {
        if (!mounted) return;
        const messages = [];
        if (exerciseResult.status === 'fulfilled') setExercises(exerciseResult.value.items || []);
        else messages.push(exerciseResult.reason?.message || 'Unable to load wellness exercises.');
        if (recommendationResult.status === 'fulfilled') setRecommendations(recommendationResult.value.items || []);
        else messages.push(recommendationResult.reason?.message || 'Unable to load recommendations.');
        setError(messages.join(' '));
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!active || seconds <= 0) return undefined;
    const interval = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setActive(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active, seconds]);

  const openExercise = (exercise) => {
    setSelected(exercise);
    setSeconds(Number(exercise.duration) || 30);
    setActive(false);
  };

  const closeExercise = () => {
    setSelected(null);
    setActive(false);
  };

  const completeExercise = () => {
    if (selected) setCompleted((items) => [...new Set([...items, selected.id])]);
    closeExercise();
  };

  return (
    <div className="yoga-page">
      <div className="page-header">
        <div><span className="badge info">{apiConfig.useMockApi ? 'Demo Data' : 'Personalized guidance'}</span><h1>Yoga &amp; Wellness Guidance</h1><p>Gentle movement ideas for posture awareness. These exercises do not diagnose or treat a health condition.</p></div>
        <span className="yoga-complete-count">{completed.length} completed</span>
      </div>
      {error && <AuthAlert>{error}</AuthAlert>}
      <section className="yoga-recommendations card">
        <div className="yoga-section-title"><span><Sparkles size={17} /></span><div><h2>Suggested focus</h2><p>{apiConfig.useMockApi ? 'Illustrative suggestions in Demo mode; connect posture analysis for personalized guidance.' : 'Suggestions provided by your connected wellness backend.'}</p></div></div>
        <div className="yoga-recommendation-list">
          {recommendations.map((item) => <div key={item.id} className="yoga-recommendation-item"><span className={`history-risk ${item.severity === 'high' ? 'high' : item.severity === 'medium' ? 'medium' : 'low'}`}>{item.severity || 'tip'}</span><div><strong>{item.title}</strong><small>{item.summary || item.description}</small></div></div>)}
          {!recommendations.length && <span className="yoga-recommendation-empty">{apiConfig.useMockApi ? 'No preview suggestions are available.' : 'No recommendations are available yet.'}</span>}
        </div>
      </section>
      <div className="yoga-grid">
        {loading ? [...Array(3)].map((_, index) => <div className="skeleton yoga-card-skeleton" key={index} />) : exercises.map((exercise, index) => (
          <article className="card yoga-exercise-card" key={exercise.id}>
            <div className={`yoga-exercise-visual yoga-visual-${index % 4}`}><span>{exercise.focus || 'Movement'}</span><Sparkles size={23} /></div>
            <div className="yoga-exercise-body">
              <div className="yoga-exercise-meta"><span className="badge info">{exercise.difficulty || 'Gentle'}</span><span><Clock3 size={13} />{exercise.duration} sec</span></div>
              <h2>{exercise.title}</h2>
              <p>{exercise.description}</p>
              <button className="btn primary" onClick={() => openExercise(exercise)}>{completed.includes(exercise.id) ? <><Check size={15} /> Repeat exercise</> : <><Play size={15} /> Start exercise</>}</button>
            </div>
          </article>
        ))}
      </div>
      {!loading && !exercises.length && <div className="card yoga-empty"><Sparkles size={24} /><strong>No exercises are available yet.</strong><span>Connect the recommendation service to load guidance.</span></div>}

      {selected && (
        <div className="yoga-modal-backdrop" role="presentation" onClick={closeExercise}>
          <section className="yoga-exercise-modal" role="dialog" aria-modal="true" aria-labelledby="exercise-modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="yoga-modal-close" onClick={closeExercise} aria-label="Close exercise"><X size={18} /></button>
            <div className="yoga-exercise-visual yoga-modal-visual"><span>{selected.focus || 'Movement'}</span><Sparkles size={25} /></div>
            <span className="badge info">{selected.difficulty || 'Gentle'} · {selected.duration} sec</span>
            <h2 id="exercise-modal-title">{selected.title}</h2>
            <p>{selected.description}</p>
            <div className="yoga-timer">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</div>
            <p className="yoga-safety">Move within a comfortable range, stop if you feel discomfort, and adapt the movement to your needs.</p>
            <div className="yoga-modal-actions">
              {seconds > 0 ? <button className="btn primary" onClick={() => setActive((value) => !value)}>{active ? <><RotateCcw size={15} /> Pause timer</> : <><Play size={15} /> {seconds === Number(selected.duration) ? 'Start timer' : 'Resume timer'}</>}</button> : <button className="btn primary" onClick={completeExercise}><Check size={15} /> Mark complete</button>}
              {seconds === 0 && <button className="btn ghost" onClick={completeExercise}>Done</button>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
