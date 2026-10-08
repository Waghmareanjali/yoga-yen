import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, Camera, CheckCircle2, CircleStop, LoaderCircle, Pause, Play, ShieldCheck, TimerReset } from 'lucide-react';
import { DrawingUtils, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { CALIBRATION_DURATION } from '../../constants/risk';
import { apiConfig } from '../../api/client';
import { postureApi } from '../../api/postureApi';
import { useCamera } from '../../hooks/useCamera';
import Badge from '../../components/common/Badge';
import './live-monitor.css';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const LANDMARK_INTERVAL_MS = 1200;

export default function LiveMonitor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const landmarkerRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const { stream, status: cameraStatus, error: cameraError, start: requestCamera, stop: stopCamera } = useCamera();
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  const [sessionId, setSessionId] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [modelStatus, setModelStatus] = useState('not-started');
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [currentPosture, setCurrentPosture] = useState('');
  const [risk, setRisk] = useState(null);
  const [calibration, setCalibration] = useState({ state: 'idle', seconds: CALIBRATION_DURATION });
  const [showCameraPermission, setShowCameraPermission] = useState(false);

  useEffect(() => {
    if (!stream || !videoRef.current) return undefined;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {
      setAnalysisMessage('Select Start Camera to begin playback after granting camera permission.');
    });
    return undefined;
  }, [stream]);

  useEffect(() => {
    if (!running || paused) return undefined;
    const interval = window.setInterval(() => setSessionSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running, paused]);

  useEffect(() => {
    if (calibration.state !== 'counting') return undefined;
    const interval = window.setInterval(() => {
      setCalibration((current) => {
        if (current.seconds <= 1) return { state: 'complete', seconds: 0 };
        return { ...current, seconds: current.seconds - 1 };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [calibration.state]);

  useEffect(() => {
    let cancelled = false;
    let animationFrame = 0;
    let landmarker = null;

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const detect = async () => {
      if (!running || pausedRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        animationFrame = requestAnimationFrame(detect);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const result = landmarker.detectForVideo(video, performance.now());
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (result.landmarks?.length) {
        const drawing = new DrawingUtils(context);
        drawing.drawConnectors(result.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, {
          color: '#e9f4ea',
          lineWidth: Math.max(2, canvas.width / 480),
        });
        drawing.drawLandmarks(result.landmarks[0], {
          color: '#c8963e',
          fillColor: '#1f4d3a',
          lineWidth: 1,
          radius: Math.max(2, canvas.width / 210),
        });

        const now = Date.now();
        if (!apiConfig.useMockApi && now - lastSentAtRef.current >= LANDMARK_INTERVAL_MS) {
          lastSentAtRef.current = now;
          const landmarks = result.landmarks[0].map(({ x, y, z, visibility }) => ({
            x: Number(x.toFixed(5)),
            y: Number(y.toFixed(5)),
            z: Number(z.toFixed(5)),
            visibility: Number((visibility ?? 0).toFixed(4)),
          }));
          postureApi.sendLandmarks({ session_id: sessionId, landmarks, timestamp: new Date().toISOString() })
            .then((prediction) => {
              if (prediction?.posture) setCurrentPosture(prediction.posture);
              if (Number.isFinite(prediction?.risk)) setRisk(prediction.risk);
            })
            .catch((error) => setAnalysisMessage(error?.message || 'Landmark analysis could not reach the backend.'));
        }
      }
      animationFrame = requestAnimationFrame(detect);
    };

    async function startLandmarker() {
      if (!running || pausedRef.current) return;
      setModelStatus('loading');
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          outputSegmentationMasks: false,
        });
      } catch {
        try {
          const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
          landmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
            outputSegmentationMasks: false,
          });
        } catch (modelError) {
          if (!cancelled) {
            setModelStatus('error');
            setAnalysisMessage(modelError?.message || 'Pose landmark model could not be loaded. Check your connection and try again.');
          }
          return;
        }
      }
      if (cancelled) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;
      setModelStatus('active');
      animationFrame = requestAnimationFrame(detect);
    }

    clearCanvas();
    startLandmarker();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      clearCanvas();
      landmarker?.close();
      landmarkerRef.current = null;
    };
  }, [running, sessionId]);

  const enableCamera = useCallback(async () => {
    setShowCameraPermission(false);
    const nextStream = await requestCamera();
    if (!nextStream) return;
    try {
      const session = await postureApi.startSession();
      setSessionId(session.sessionId || session.session_id || null);
      setRunning(true);
      pausedRef.current = false;
      setPaused(false);
      setAnalysisMessage('');
      setSessionSeconds(0);
      const mediaRecorder = new MediaRecorder(nextStream, {
        mimeType: 'video/webm',
      });

      recordedChunksRef.current = [];

       mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    recordedChunksRef.current.push(event.data);
  }
};

mediaRecorder.onstop = async () => {
  const videoBlob = new Blob(recordedChunksRef.current, {
    type: 'video/webm',
  });

  recordedChunksRef.current = [];

  const formData = new FormData();
  formData.append('file', videoBlob, `yogayen-${Date.now()}.webm`);

  try {
    setAnalysisMessage('Uploading recorded video...');

    const response = await fetch('http://127.0.0.1:8000/upload-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Video upload failed.');
    }

    const result = await response.json();

    console.log('Video uploaded:', result);
    setAnalysisMessage('Video uploaded successfully.');
  } catch (error) {
    console.error('Video upload error:', error);
    setAnalysisMessage(error?.message || 'Could not upload recorded video.');
  }
};
mediaRecorder.start();
mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      nextStream.getTracks().forEach((track) => track.stop());
      setAnalysisMessage(error?.message || 'Could not start the monitoring session.');
    }
  }, [requestCamera]);

  const stopSession = async () => {
    setRunning(false);
    pausedRef.current = false;
    setPaused(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
  mediaRecorderRef.current.stop();
}
    setCurrentPosture('');
    setRisk(null);
    setModelStatus('not-started');
    setCalibration({ state: 'idle', seconds: CALIBRATION_DURATION });
    stopCamera();
    if (sessionId) {
      try {
        await postureApi.endSession({ session_id: sessionId });
      } catch (error) {
        setAnalysisMessage(error?.message || 'Could not save the end of this monitoring session.');
      }
    }
    setSessionId(null);
  };

  const togglePause = () => {
    const nextPaused = !paused;
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
    if (videoRef.current) {
      if (nextPaused) videoRef.current.pause();
      else videoRef.current.play().catch(() => setAnalysisMessage('Camera playback could not resume. Try stopping and starting the camera again.'));
    }
  };

  const startCalibration = () => {
    if (!running || paused) {
      setAnalysisMessage('Start the camera and resume monitoring before calibration.');
      return;
    }
    setCalibration({ state: 'counting', seconds: CALIBRATION_DURATION });
  };

  const formattedTime = `${String(Math.floor(sessionSeconds / 60)).padStart(2, '0')}:${String(sessionSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="monitor-page">
      <div className="page-header">
        <div>
          <Badge tone="info">Browser-side pose landmarks</Badge>
          <h1>Live Monitor</h1>
          <p>Your webcam stays on this device. Only landmarks are sent for backend classification when live API mode is enabled.</p>
        </div>
        <span className="status-pill"><span className={`status-dot ${cameraStatus !== 'active' ? 'status-dot-idle' : ''}`} />{cameraStatus === 'active' ? 'Camera active' : 'Camera off'}</span>
      </div>

      <div className="monitor-layout">
        <section className="monitor-camera-column">
          <div className="monitor-video-card">
            <div className="monitor-video-frame">
              <video ref={videoRef} className="monitor-video" autoPlay playsInline muted aria-label="Live webcam preview" />
              <canvas ref={canvasRef} className="monitor-overlay" aria-hidden="true" />
              {!running && (
                <div className="camera-permission-card">
                  <div className="camera-permission-icon"><Camera size={25} /></div>
                  <h2>Camera access is required</h2>
                  <p>Camera access is used for posture analysis. Your browser will ask permission; you can stop the camera at any time. Video frames are not uploaded by this app.</p>
                  <button className="btn primary" onClick={() => setShowCameraPermission(true)}>Enable Camera</button>
                  {cameraError && <div className="monitor-error"><AlertTriangle size={16} />{cameraError}</div>}
                </div>
              )}
              {running && (
                <div className="monitor-video-status">
                  <span className={paused ? 'monitor-status-paused' : 'monitor-status-live'} />
                  {paused ? 'Paused' : 'Monitoring'}
                </div>
              )}
            </div>
            <div className="monitor-control-bar">
              <div className="monitor-session-time"><TimerReset size={17} /><span>{formattedTime}</span><small>{sessionSeconds > 0 && !running ? 'Last session' : 'Session'}</small></div>
              <div className="monitor-controls">
                {running ? (
                  <>
                    <button className="btn secondary" onClick={togglePause}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? 'Resume' : 'Pause'}</button>
                    <button className="btn ghost" onClick={stopSession}><CircleStop size={16} /> Stop</button>
                  </>
                ) : (
                  <button className="btn primary" onClick={() => setShowCameraPermission(true)} disabled={cameraStatus === 'requesting'}>
                    {cameraStatus === 'requesting' ? <LoaderCircle size={16} className="monitor-spin" /> : <Play size={16} />}
                    {cameraStatus === 'requesting' ? 'Requesting camera...' : 'Start Monitoring'}
                  </button>
                )}
                <button className="btn ghost" onClick={startCalibration} disabled={!running || paused}><Activity size={16} /> Calibrate</button>
              </div>
            </div>
          </div>
          <div className="monitor-privacy-note"><ShieldCheck size={17} /><span>Your privacy comes first. Yoga Yen is designed to analyze posture without unnecessarily storing webcam images or videos.</span></div>
          {analysisMessage && <div className="monitor-error"><AlertTriangle size={16} />{analysisMessage}</div>}
        </section>

        <aside className="monitor-insights">
          <div className="card monitor-insight-card">
            <div className="monitor-card-title"><h2>Posture status</h2>{apiConfig.useMockApi && <Badge tone="info">Preview</Badge>}</div>
            <div className="monitor-posture-result">
              <span className={`monitor-posture-icon ${currentPosture ? 'is-detected' : ''}`}><Activity size={21} /></span>
              <div>
                <strong>{currentPosture || (modelStatus === 'active' ? 'Landmarks detected' : 'Waiting for analysis')}</strong>
                <small>{apiConfig.useMockApi ? 'Demo mode: no classifier result' : currentPosture ? 'Backend classification' : 'Waiting for backend classification'}</small>
              </div>
            </div>
            <div className="monitor-risk-row"><span>Ergonomic Wellness Risk</span><strong>{Number.isFinite(risk) ? `${risk} / 100` : 'Awaiting data'}</strong></div>
            <div className="monitor-risk-bar"><span style={{ width: `${Number.isFinite(risk) ? Math.min(100, Math.max(0, risk)) : 0}%` }} /></div>
            <small className="monitor-threshold-note">Wellness thresholds, tunable, not medical thresholds.</small>
          </div>

          <div className="card monitor-insight-card">
            <div className="monitor-card-title"><h2>Pose detection</h2><span className={`badge ${modelStatus === 'active' ? 'success' : modelStatus === 'error' ? 'danger' : 'warning'}`}>{modelStatus === 'active' ? 'Active' : modelStatus === 'loading' ? 'Loading' : modelStatus === 'error' ? 'Unavailable' : 'Ready'}</span></div>
            <p className="monitor-detection-copy">MediaPipe Pose runs on this device. Detected landmarks are drawn over the preview; raw webcam frames are not sent to the API.</p>
            <div className="monitor-calibration">
              <div className={`monitor-calibration-ring ${calibration.state === 'complete' ? 'is-complete' : ''}`}>
                {calibration.state === 'complete' ? <CheckCircle2 size={24} /> : calibration.state === 'counting' ? calibration.seconds : <TimerReset size={21} />}
              </div>
              <div><strong>{calibration.state === 'complete' ? 'Baseline created' : calibration.state === 'counting' ? 'Calibrating posture' : 'Personal calibration'}</strong><small>{calibration.state === 'complete' ? 'Your baseline is ready for this session.' : 'Sit comfortably upright while the 10-second timer runs.'}</small></div>
              {calibration.state === 'counting' && <span className="monitor-progress">{Math.round(((CALIBRATION_DURATION - calibration.seconds) / CALIBRATION_DURATION) * 100)}%</span>}
            </div>
            {calibration.state === 'complete' && <p className="monitor-success"><CheckCircle2 size={15} />Your personal posture baseline has been created.</p>}
          </div>
        </aside>
      </div>

      {showCameraPermission && (
        <div className="monitor-modal-backdrop" role="presentation" onClick={() => setShowCameraPermission(false)}>
          <section className="monitor-permission-modal" role="dialog" aria-modal="true" aria-labelledby="camera-modal-title" onClick={(event) => event.stopPropagation()}>
            <span className="monitor-modal-icon"><Camera size={22} /></span>
            <h2 id="camera-modal-title">Before you enable your camera</h2>
            <p>Yoga Yen uses the camera only to calculate posture landmarks in your browser. No webcam image or video is uploaded by the frontend. Browser permission is requested only when you continue.</p>
            <div className="monitor-modal-actions">
              <button className="btn ghost" onClick={() => setShowCameraPermission(false)}>Not now</button>
              <button className="btn primary" onClick={enableCamera} disabled={cameraStatus === 'requesting'}>
                {cameraStatus === 'requesting' ? <LoaderCircle size={16} className="monitor-spin" /> : <Camera size={16} />}
                Allow camera
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
