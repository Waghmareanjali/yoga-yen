import { useCallback, useEffect, useRef, useState } from 'react';

export function useCaptureTimer(durationSeconds, onComplete) {
  const [snapshot, setSnapshot] = useState({ status: 'idle', elapsedSeconds: 0, remainingSeconds: durationSeconds });
  const elapsedBeforeStart = useRef(0);
  const startedAt = useRef(0);
  const completed = useRef(false);
  const durationRef = useRef(durationSeconds);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const readElapsed = useCallback(() => elapsedBeforeStart.current + (startedAt.current ? (performance.now() - startedAt.current) / 1000 : 0), []);
  const start = useCallback(() => {
    durationRef.current = durationSeconds;
    elapsedBeforeStart.current = 0;
    startedAt.current = performance.now();
    completed.current = false;
    setSnapshot({ status: 'running', elapsedSeconds: 0, remainingSeconds: durationRef.current, continuous: durationRef.current == null });
  }, [durationSeconds]);
  const pause = useCallback(() => {
    if (!startedAt.current) return;
    elapsedBeforeStart.current = readElapsed();
    startedAt.current = 0;
    setSnapshot((current) => ({ ...current, status: 'paused' }));
  }, [readElapsed]);
  const resume = useCallback(() => {
    if (startedAt.current || completed.current) return;
    startedAt.current = performance.now();
    setSnapshot((current) => ({ ...current, status: 'running' }));
  }, []);
  const stop = useCallback(() => {
    elapsedBeforeStart.current = readElapsed();
    startedAt.current = 0;
    setSnapshot((current) => ({ ...current, status: 'stopped' }));
  }, [readElapsed]);
  const reset = useCallback(() => {
    durationRef.current = durationSeconds;
    startedAt.current = 0;
    elapsedBeforeStart.current = 0;
    completed.current = false;
    setSnapshot({ status: 'idle', elapsedSeconds: 0, remainingSeconds: durationRef.current, continuous: durationRef.current == null });
  }, [durationSeconds]);
  const extend = useCallback((seconds) => {
    durationRef.current += seconds;
    setSnapshot((current) => ({ ...current, remainingSeconds: Math.max(0, Math.ceil(durationRef.current - current.elapsedSeconds)) }));
  }, []);
  const continueIndefinitely = useCallback(() => {
    elapsedBeforeStart.current = readElapsed();
    startedAt.current = performance.now();
    durationRef.current = null;
    completed.current = false;
    setSnapshot((current) => ({ ...current, status: 'running', remainingSeconds: null, continuous: true }));
  }, [readElapsed]);

  useEffect(() => {
    if (snapshot.status !== 'running') return undefined;
    const interval = window.setInterval(() => {
      const elapsedSeconds = readElapsed();
      const remainingSeconds = durationRef.current == null ? null : Math.max(0, Math.ceil(durationRef.current - elapsedSeconds));
      const finished = durationRef.current != null && elapsedSeconds >= durationRef.current;
      setSnapshot({ status: finished ? 'complete' : 'running', elapsedSeconds: Math.floor(elapsedSeconds), remainingSeconds, continuous: durationRef.current == null });
      if (finished && !completed.current) {
        completed.current = true;
        startedAt.current = 0;
        elapsedBeforeStart.current = durationRef.current;
        onCompleteRef.current?.();
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [snapshot.status, readElapsed]);

  const remainingSeconds = snapshot.status === 'idle' || snapshot.status === 'stopped'
    ? durationSeconds
    : snapshot.remainingSeconds;
  return { ...snapshot, remainingSeconds, start, pause, resume, stop, reset, extend, continueIndefinitely };
}
