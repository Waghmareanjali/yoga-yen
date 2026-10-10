import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, Camera, CheckCircle2, CircleStop, LoaderCircle, Pause, Play, ShieldCheck, TimerReset, UploadCloud, Video, X } from 'lucide-react';
import { DrawingUtils, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { CALIBRATION_MAX, CALIBRATION_MIN, PRESETS, MIN_CAPTURE_SECONDS, MAX_CAPTURE_SECONDS, SAMPLING_INTERVAL_MIN, SAMPLING_INTERVAL_MAX } from '../../constants/capture';
import { postureApi } from '../../api/postureApi';
import { videoApi } from '../../api/videoApi';
import { isPreviewMode } from '../../data/previewData';
import { useCamera } from '../../hooks/useCamera';
import { useCaptureTimer } from '../../hooks/useCaptureTimer';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useSettingsStore } from '../../store/settingsStore';
import { useTaskStore } from '../../store/taskStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatSeconds } from '../../utils/formatters';
import DurationRangeInput from '../../components/forms/DurationRangeInput';
import Badge from '../../components/common/Badge';
import './live-monitor.css';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';

export default function LiveMonitor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const riskSamplesRef = useRef([]);
  const goodPostureSecondsRef = useRef(0);
  const stopInProgressRef = useRef(false);
  const recorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const { stream, status: cameraStatus, error: cameraError, start: requestCamera, stop: stopCamera } = useCamera();
  const captureDurationSec = useSettingsStore((state) => state.captureDurationSec);
  const calibrationDurationSec = useSettingsStore((state) => state.calibrationDurationSec);
  const samplingIntervalSec = useSettingsStore((state) => state.samplingIntervalSec);
  const autoStop = useSettingsStore((state) => state.autoStop);
  const continuousMode = useSettingsStore((state) => state.continuousMode);
  const settings = { captureDurationSec, calibrationDurationSec, samplingIntervalSec, autoStop, continuousMode };
  const setCaptureSettings = useSettingsStore((state) => state.setCaptureSettings);
  const incrementCategoryProgress = useTaskStore((state) => state.incrementCategoryProgress);
  const captureDuration = settings.continuousMode ? null : settings.captureDurationSec;
  const captureTimer = useCaptureTimer(captureDuration);
  const calibrationTimer = useCaptureTimer(settings.calibrationDurationSec);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [sessionId, setSessionId] = useState(null);
  const [modelStatus, setModelStatus] = useState('not-started');
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [currentPosture, setCurrentPosture] = useState('');
  const [risk, setRisk] = useState(null);
  const [postureScore, setPostureScore] = useState(null);
  const calibrationState = calibrationTimer.status === 'complete' ? 'complete'
    : calibrationTimer.status === 'running' || calibrationTimer.status === 'paused' ? 'counting' : 'idle';
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [videoRecording, setVideoRecording] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [pendingVideo, setPendingVideo] = useState(null);
  const [videoUploadMessage, setVideoUploadMessage] = useState('');
  const permissionDialogRef = useRef(null);
  const summaryDialogRef = useRef(null);
  const captureElapsedRef = useRef(0);
  const postureRef = useRef(currentPosture);
  const scoreRef = useRef(postureScore);
  const stopCaptureTimer = captureTimer.stop;
  const stopCalibrationTimer = calibrationTimer.stop;
  const startCaptureTimer = captureTimer.start;
  const pauseCaptureTimer = captureTimer.pause;
  const resumeCaptureTimer = captureTimer.resume;
  const pauseCalibrationTimer = calibrationTimer.pause;
  const resumeCalibrationTimer = calibrationTimer.resume;
  const continueIndefinitely = captureTimer.continueIndefinitely;
  const closeCameraPermission = useCallback(() => setShowCameraPermission(false), []);
  const closeSummary = useCallback(() => setSummary(null), []);
  useDialogFocus(permissionDialogRef, closeCameraPermission, showCameraPermission);
  useDialogFocus(summaryDialogRef, closeSummary, Boolean(summary));
  const canRecordVideo = typeof MediaRecorder !== 'undefined';

  const startVideoRecording = useCallback((cameraStream) => {
    if (!canRecordVideo) throw new Error('Video recording is not supported in this browser.');
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = mimeType
      ? new MediaRecorder(cameraStream, { mimeType })
      : new MediaRecorder(cameraStream);
    recordingChunksRef.current = [];
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) recordingChunksRef.current.push(event.data);
    });
    recorderRef.current = recorder;
    recorder.start(1000);
    setVideoRecording(true);
    setVideoUploadMessage('');
  }, [canRecordVideo]);

  const finishVideoRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return null;
    if (recorder.state !== 'inactive') {
      await new Promise((resolve, reject) => {
        recorder.addEventListener('stop', resolve, { once: true });
        recorder.addEventListener('error', () => reject(new Error('The browser could not finish recording the video.')), { once: true });
        recorder.stop();
      });
    }
    recorderRef.current = null;
    setVideoRecording(false);
    const chunks = recordingChunksRef.current;
    recordingChunksRef.current = [];
    return new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'video/webm' });
  }, []);

  const uploadRecordedVideo = useCallback(async (blob, filename) => {
    setVideoUploading(true);
    setVideoUploadMessage('Uploading video and extracting frames…');
    try {
      const result = await videoApi.uploadVideo(blob, filename);
      setPendingVideo(null);
      setVideoUploadMessage(`Video saved to ${result.path}.`);
      return result;
    } catch (error) {
      setPendingVideo({ blob, filename });
      setVideoUploadMessage(error?.message || 'Video upload failed. Retry or download the recording.');
      throw error;
    } finally {
      setVideoUploading(false);
    }
  }, []);

  const retryVideoUpload = async () => {
    if (!pendingVideo) return;
    try {
      await uploadRecordedVideo(pendingVideo.blob, pendingVideo.filename);
    } catch (error) {
      setAnalysisMessage(error?.message || 'The video upload failed again.');
    }
  };

  const downloadPendingVideo = () => {
    if (!pendingVideo) return;
    const url = URL.createObjectURL(pendingVideo.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pendingVideo.filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  useEffect(() => {
    captureElapsedRef.current = captureTimer.elapsedSeconds;
    postureRef.current = currentPosture;
    scoreRef.current = postureScore;
  }, [captureTimer.elapsedSeconds, currentPosture, postureScore]);

  const stopSession = useCallback(async ({ completed = false, cameraLost = false } = {}) => {
    if (stopInProgressRef.current) return;
    stopInProgressRef.current = true;
    const elapsedSeconds = captureElapsedRef.current;
    const averages = riskSamplesRef.current;
    const averageRisk = averages.length ? Math.round(averages.reduce((total, item) => total + item, 0) / averages.length) : null;
    let savedVideoFilename = '';
    let videoToUpload = null;
    let videoPending = false;
    setRunning(false);
    pausedRef.current = false;
    setPaused(false);
    stopCaptureTimer();
    stopCalibrationTimer();
    if (recorderRef.current) {
      try {
        const blob = await finishVideoRecording();
        if (blob?.size) {
          const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
          const filename = `yoga-yen-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
          videoToUpload = { blob, filename };
          setPendingVideo(videoToUpload);
        } else {
          throw new Error('The browser did not produce a video recording.');
        }
      } catch (error) {
        videoPending = true;
        setAnalysisMessage(`Session ended, but the video was not saved: ${error?.message || 'upload failed.'}`);
      }
    }
    stopCamera();
    if (videoToUpload) {
      try {
        const result = await uploadRecordedVideo(videoToUpload.blob, videoToUpload.filename);
        savedVideoFilename = result.filename || videoToUpload.filename;
      } catch (error) {
        setAnalysisMessage(`Session ended, but the video was not saved: ${error?.message || 'upload failed.'}`);
      }
    }
    setCurrentPosture('');
    setRisk(null);
    setPostureScore(null);
    setModelStatus('not-started');
    if (sessionId) {
      try {
        await postureApi.endSession({ session_id: sessionId });
      } catch (error) {
        setAnalysisMessage(error?.message || 'Could not end the monitoring session.');
      }
    }
    setSessionId(null);
    try {
      if (elapsedSeconds > 0) await incrementCategoryProgress('Monitoring', elapsedSeconds);
      const goodMinutes = Math.floor(goodPostureSecondsRef.current / 60);
      if (goodMinutes > 0) await incrementCategoryProgress('Posture', goodMinutes);
    } catch (error) {
      setAnalysisMessage(error?.message || 'Session ended, but progress could not update your goals.');
    }
    if (cameraLost) setAnalysisMessage('The camera disconnected. Your timer has stopped; reconnect the camera to start again.');
    if (completed) {
      setSummary({
        duration: elapsedSeconds,
        averageRisk,
        score: scoreRef.current,
        issue: postureRef.current || 'No consistent posture issue was recorded.',
        videoFilename: savedVideoFilename,
        videoPending,
      });
      useNotificationStore.getState().addNotification({ type: 'task', title: 'Capture complete', description: `Camera analysis ran for ${formatSeconds(elapsedSeconds)}.`, duration: 6000 });
    }
    riskSamplesRef.current = [];
    goodPostureSecondsRef.current = 0;
    stopInProgressRef.current = false;
  }, [stopCaptureTimer, stopCalibrationTimer, stopCamera, sessionId, incrementCategoryProgress, finishVideoRecording, uploadRecordedVideo]);

  const toggleCaptureSetting = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    if (key === 'continuousMode' && next.continuousMode) next.autoStop = false;
    setCaptureSettings(next);
  };

  const enableCamera = useCallback(async () => {
    setShowCameraPermission(false);
    setSummary(null);
    riskSamplesRef.current = [];
    goodPostureSecondsRef.current = 0;
    const nextStream = await requestCamera();
    if (!nextStream) return;
    try {
      startVideoRecording(nextStream);
      const previewMode = import.meta.env.DEV && isPreviewMode();
      const session = previewMode ? null : await postureApi.startSession();
      setSessionId(session?.sessionId || session?.session_id || null);
      setAnalysisMessage('');
      setRunning(true);
      pausedRef.current = false;
      setPaused(false);
      startCaptureTimer();
    } catch (error) {
      if (recorderRef.current) {
        try {
          await finishVideoRecording();
        } catch (recordingError) {
          console.error('Unable to discard the partial recording after session startup failed.', recordingError);
        }
      }
      stopCamera(nextStream);
      setVideoRecording(false);
      setAnalysisMessage(error?.message || 'Could not start the monitoring session.');
    }
  }, [requestCamera, startCaptureTimer, startVideoRecording, finishVideoRecording, stopCamera]);

  useEffect(() => {
    if (captureTimer.status === 'complete' && settings.autoStop && running) {
      stopSession({ completed: true });
    } else if (captureTimer.status === 'complete' && !settings.autoStop && running) {
      continueIndefinitely();
    }
  }, [captureTimer.status, continueIndefinitely, settings.autoStop, running, stopSession]);

  useEffect(() => {
    if (!running || !stream) return undefined;
    const onEnded = () => {
      if (!stopInProgressRef.current) stopSession({ cameraLost: true });
    };
    const tracks = stream.getVideoTracks();
    tracks.forEach((track) => track.addEventListener('ended', onEnded));
    return () => tracks.forEach((track) => track.removeEventListener('ended', onEnded));
  }, [running, stream, stopSession]);

  useEffect(() => {
    if (!stream || !videoRef.current) return undefined;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => setAnalysisMessage('Camera playback could not start. Check browser permissions, then try again.'));
    return undefined;
  }, [stream]);

  useEffect(() => {
    let cancelled = false;
    let animationFrame = 0;
    let landmarker = null;

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const detect = () => {
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
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (result.landmarks?.length) {
          const drawing = new DrawingUtils(context);
          drawing.drawConnectors(result.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, { color: '#e9f4ea', lineWidth: Math.max(2, canvas.width / 480) });
          drawing.drawLandmarks(result.landmarks[0], { color: '#c8963e', fillColor: '#1f4d3a', lineWidth: 1, radius: Math.max(2, canvas.width / 210) });
        }
      }
      if (result.landmarks?.length) {
        const previewMode = import.meta.env.DEV && isPreviewMode();
        if (previewMode) {
          setCurrentPosture((current) => current === 'Pose detected locally' ? current : 'Pose detected locally');
        } else if (Date.now() - lastSentAtRef.current >= settings.samplingIntervalSec * 1000) {
          lastSentAtRef.current = Date.now();
          const landmarks = result.landmarks[0].map(({ x, y, z, visibility }) => ({
            x: Number(x.toFixed(5)),
            y: Number(y.toFixed(5)),
            z: Number(z.toFixed(5)),
            visibility: Number((visibility ?? 0).toFixed(4)),
          }));
          postureApi.sendLandmarks({ session_id: sessionId, landmarks, timestamp: new Date().toISOString() })
            .then((prediction) => {
              if (prediction?.posture) {
                setCurrentPosture(prediction.posture);
                if (prediction.posture === 'Good Posture') goodPostureSecondsRef.current += settings.samplingIntervalSec;
              }
              if (Number.isFinite(prediction?.risk)) {
                setRisk(prediction.risk);
                riskSamplesRef.current.push(prediction.risk);
              }
              if (Number.isFinite(prediction?.score)) setPostureScore(prediction.score);
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
          runningMode: 'VIDEO', numPoses: 1, outputSegmentationMasks: false,
        });
      } catch {
        try {
          const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
          landmarker = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
            runningMode: 'VIDEO', numPoses: 1, outputSegmentationMasks: false,
          });
        } catch (error) {
          if (!cancelled) {
            setModelStatus('error');
            setAnalysisMessage(error?.message || 'Pose landmark model could not be loaded. Check your connection and try again.');
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
  }, [running, sessionId, settings.samplingIntervalSec]);

  useEffect(() => {
    if (!running) return undefined;
    if (paused) {
      pauseCaptureTimer();
      if (calibrationState === 'counting') pauseCalibrationTimer();
    } else {
      resumeCaptureTimer();
      if (calibrationState === 'counting') resumeCalibrationTimer();
    }
    return undefined;
  }, [running, paused, calibrationState, pauseCaptureTimer, resumeCaptureTimer, pauseCalibrationTimer, resumeCalibrationTimer]);

  const togglePause = () => {
    pausedRef.current = !paused;
    setPaused(!paused);
    if (recorderRef.current?.state === 'recording' && !paused) recorderRef.current.pause();
    else if (recorderRef.current?.state === 'paused' && paused) recorderRef.current.resume();
    if (videoRef.current) {
      if (!paused) videoRef.current.pause();
      else videoRef.current.play().catch(() => setAnalysisMessage('Camera playback could not resume. Stop and restart the camera.'));
    }
  };
  const startCalibration = () => {
    if (!running || paused) {
      setAnalysisMessage('Start the camera and resume monitoring before calibration.');
      return;
    }
    setAnalysisMessage('');
    calibrationTimer.start();
  };
  const captureProgress = captureDuration ? Math.min(100, (captureTimer.elapsedSeconds / captureDuration) * 100) : 0;
  const calibrationProgress = Math.min(100, (calibrationTimer.elapsedSeconds / settings.calibrationDurationSec) * 100);
  const startTime = () => setShowCameraPermission(true);

  return (
    <div className="monitor-page">
      <div className="page-header">
        <div><Badge tone="info">Browser-side pose landmarks</Badge><h1>Live Monitor</h1><p>Each monitoring session is recorded and saved to the backend when you stop.</p></div>
        <span className="status-pill"><span className={`status-dot ${cameraStatus !== 'active' ? 'status-dot-idle' : ''}`} />{cameraStatus === 'active' ? 'Camera active' : 'Camera off'}</span>
      </div>

      <div className="monitor-layout">
        <section className="monitor-camera-column">
          <div className="monitor-video-card">
            <div className="monitor-video-frame">
              <video ref={videoRef} className="monitor-video" autoPlay playsInline muted aria-label="Live webcam preview" />
              <canvas ref={canvasRef} className="monitor-overlay" aria-hidden="true" />
              {!running && <div className="camera-permission-card"><div className="camera-permission-icon"><Camera size={25} /></div><h2>Camera access is required</h2><p>Camera video will be recorded during monitoring, uploaded when you stop, and saved with extracted frames in the backend.</p><button className="btn primary" onClick={startTime} disabled={!canRecordVideo}>{canRecordVideo ? 'Enable Camera' : 'Recording not supported'}</button>{cameraError && <div className="monitor-error"><AlertTriangle size={16} />{cameraError}</div>}</div>}
              {running && <div className="monitor-video-status"><span className={paused ? 'monitor-status-paused' : 'monitor-status-live'} />{paused ? 'Paused' : 'Monitoring'}{videoRecording && <span className="monitor-video-recording"><Video size={12} />Recording</span>}</div>}
            </div>
            <div className="monitor-control-bar">
              <div className="monitor-session-time"><TimerReset size={17} /><span>{formatSeconds(captureTimer.elapsedSeconds)}</span><small>{running ? captureTimer.continuous ? 'Continuous' : `${formatSeconds(captureTimer.remainingSeconds)} remaining` : captureTimer.elapsedSeconds > 0 ? 'Last session' : 'Session'}</small></div>
              <div className="monitor-countdown-ring" style={{ '--capture-progress': `${captureProgress}%` }} aria-label={captureTimer.continuous ? 'Continuous capture' : `${captureTimer.remainingSeconds} seconds remaining`}><span>{captureTimer.continuous ? '∞' : formatSeconds(captureTimer.remainingSeconds)}</span></div>
              <div className="monitor-controls">{running ? <><button className="btn secondary" onClick={togglePause}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? 'Resume' : 'Pause'}</button><button className="btn ghost" onClick={() => stopSession({ completed: captureTimer.status === 'complete' })} disabled={videoUploading}><CircleStop size={16} />{videoUploading ? 'Saving video…' : 'Stop'}</button></> : <button className="btn primary" onClick={startTime} disabled={cameraStatus === 'requesting' || videoUploading}>{cameraStatus === 'requesting' ? <LoaderCircle size={16} className="monitor-spin" /> : <Play size={16} />}{cameraStatus === 'requesting' ? 'Requesting camera...' : videoUploading ? 'Saving video…' : 'Start Monitoring'}</button>}<button className="btn ghost" onClick={startCalibration} disabled={!running || paused}><Activity size={16} />Calibrate</button></div>
            </div>
          </div>

          <details className="card monitor-capture-settings" open={settingsOpen} onToggle={(event) => setSettingsOpen(event.currentTarget.open)}>
            <summary><strong>Capture Settings</strong><span>{settings.continuousMode ? 'Continuous' : `${settings.captureDurationSec} sec`} · sample every {settings.samplingIntervalSec} sec</span></summary>
            <div className="capture-settings-content">
              <DurationRangeInput label="Capture Duration" value={settings.captureDurationSec} min={MIN_CAPTURE_SECONDS} max={MAX_CAPTURE_SECONDS} step={5} presets={PRESETS} disabled={running || settings.continuousMode} onChange={(value) => setCaptureSettings({ ...settings, captureDurationSec: value })} helperText="The selected duration controls camera and analysis time only." />
              <DurationRangeInput label="Sampling Interval" value={settings.samplingIntervalSec} min={SAMPLING_INTERVAL_MIN} max={SAMPLING_INTERVAL_MAX} disabled={running} onChange={(value) => setCaptureSettings({ ...settings, samplingIntervalSec: value })} helperText="Time between feature samples sent in API mode." />
              <div className="settings-list">
                <label className="settings-row"><span><strong>Unlimited / Continuous</strong><small>Run until you manually stop monitoring.</small></span><input type="checkbox" role="switch" checked={settings.continuousMode} disabled={running} onChange={() => toggleCaptureSetting('continuousMode')} /></label>
                <label className="settings-row"><span><strong>Auto-stop when time ends</strong><small>Stop the camera and session at zero.</small></span><input type="checkbox" role="switch" checked={settings.autoStop} disabled={running || settings.continuousMode} onChange={() => toggleCaptureSetting('autoStop')} /></label>
                <div className="settings-row"><span><strong>Video and frame storage</strong><small>{canRecordVideo ? 'Recording is automatic. On stop, the video is saved in backend/uploads and its frames in backend/frames.' : 'This browser does not support camera recording; use a supported browser to start monitoring.'}</small></span><span className="badge success">Always on</span></div>
              </div>
              {running && !settings.continuousMode && <div className="monitor-extend-actions"><span>Extend session</span><button className="btn ghost" onClick={() => captureTimer.extend(30)}>+30 sec</button><button className="btn ghost" onClick={() => captureTimer.extend(60)}>+60 sec</button></div>}
            </div>
          </details>

          <div className="monitor-privacy-note"><ShieldCheck size={17} /><span>{videoRecording ? `Video recording is ${paused ? 'paused' : 'active'}; when you stop, the clip will be uploaded to backend/uploads and extracted frames saved in backend/frames.` : 'Each monitoring session records camera video. Stopping the session uploads it to backend/uploads and extracts frames into backend/frames. Start only if you consent to saving this recording.'}</span></div>
          {videoUploadMessage && <div className={pendingVideo ? 'monitor-error' : 'monitor-privacy-note'} role={pendingVideo ? 'alert' : 'status'}><UploadCloud size={16} />{videoUploadMessage}{pendingVideo && <span className="monitor-upload-actions"><button type="button" className="btn secondary" onClick={retryVideoUpload} disabled={videoUploading}>{videoUploading ? 'Retrying…' : 'Retry upload'}</button><button type="button" className="btn ghost" onClick={downloadPendingVideo}>Download copy</button></span>}</div>}
          {analysisMessage && <div className="monitor-error" role="alert"><AlertTriangle size={16} />{analysisMessage}</div>}
        </section>

        <aside className="monitor-insights">
          <div className="card monitor-insight-card">
            <div className="monitor-card-title"><h2>Posture status</h2></div>
            <div className="monitor-posture-result"><span className={`monitor-posture-icon ${currentPosture ? 'is-detected' : ''}`}><Activity size={21} /></span><div><strong>{currentPosture || (modelStatus === 'active' ? 'Landmarks detected' : 'Waiting for analysis')}</strong><small>{currentPosture && import.meta.env.DEV && isPreviewMode() ? 'Detected on this device' : currentPosture ? 'Backend classification' : 'Waiting for backend classification'}</small></div></div>
            <div className="monitor-risk-row"><span>Ergonomic Wellness Risk</span><strong>{Number.isFinite(risk) ? `${risk} / 100` : 'Awaiting data'}</strong></div><div className="monitor-risk-bar"><span style={{ width: `${Number.isFinite(risk) ? Math.min(100, Math.max(0, risk)) : 0}%` }} /></div><small className="monitor-threshold-note">Wellness thresholds, tunable, not medical thresholds.</small>
          </div>
          <div className="card monitor-insight-card">
            <div className="monitor-card-title"><h2>Pose detection</h2><span className={`badge ${modelStatus === 'active' ? 'success' : modelStatus === 'error' ? 'danger' : 'warning'}`}>{modelStatus === 'active' ? 'Active' : modelStatus === 'loading' ? 'Loading' : modelStatus === 'error' ? 'Unavailable' : 'Ready'}</span></div>
            <p className="monitor-detection-copy">MediaPipe Pose runs on this device and draws detected landmarks over the preview. Each session video is uploaded when you stop, and the backend saves extracted frames alongside it.</p>
            <div className="monitor-calibration">
              <div className={`monitor-calibration-ring ${calibrationState === 'complete' ? 'is-complete' : ''}`} style={{ '--calibration-progress': `${calibrationProgress}%` }}>{calibrationState === 'complete' ? <CheckCircle2 size={24} /> : calibrationState === 'counting' ? formatSeconds(calibrationTimer.remainingSeconds) : <TimerReset size={21} />}</div>
              <div><strong>{calibrationState === 'complete' ? 'Baseline created' : calibrationState === 'counting' ? 'Calibrating posture' : 'Personal calibration'}</strong><small>{calibrationState === 'complete' ? 'Your baseline is ready for this session.' : `Choose ${settings.calibrationDurationSec} seconds for your personal calibration.`}</small></div>
              {calibrationState === 'counting' && <span className="monitor-progress">{Math.round(calibrationProgress)}%</span>}
            </div>
            <DurationRangeInput label="Calibration duration" value={settings.calibrationDurationSec} min={CALIBRATION_MIN} max={CALIBRATION_MAX} disabled={running && calibrationState === 'counting'} onChange={(value) => setCaptureSettings({ ...settings, calibrationDurationSec: value })} helperText="Saved in Capture Settings." />
            {calibrationState !== 'counting' && <button className="btn secondary" onClick={startCalibration} disabled={!running || paused}>{calibrationState === 'complete' ? 'Calibrate again' : 'Start calibration'}</button>}
            {calibrationState === 'complete' && <p className="monitor-success"><CheckCircle2 size={15} />Your personal posture baseline has been created.</p>}
          </div>
        </aside>
      </div>

      {showCameraPermission && <div className="monitor-modal-backdrop" role="presentation" onClick={closeCameraPermission}><section ref={permissionDialogRef} tabIndex="-1" className="monitor-permission-modal" role="dialog" aria-modal="true" aria-labelledby="camera-modal-title" onClick={(event) => event.stopPropagation()}><span className="monitor-modal-icon"><Camera size={22} /></span><h2 id="camera-modal-title">Before you enable your camera</h2><p>{canRecordVideo ? 'This session will record camera video. When you stop, it will be uploaded to backend/uploads and its extracted frames saved in backend/frames. Continue only if you consent to this storage.' : 'This browser does not support video recording. Please use a supported browser.'}</p><div className="monitor-modal-actions"><button className="btn ghost" onClick={closeCameraPermission}>Not now</button><button className="btn primary" onClick={enableCamera} disabled={!canRecordVideo || cameraStatus === 'requesting' || videoUploading}>{cameraStatus === 'requesting' ? <LoaderCircle size={16} className="monitor-spin" /> : <Camera size={16} />}Allow camera and record</button></div></section></div>}
      {summary && <div className="monitor-modal-backdrop" role="presentation" onClick={closeSummary}><section ref={summaryDialogRef} tabIndex="-1" className="monitor-permission-modal monitor-summary-modal" role="dialog" aria-modal="true" aria-labelledby="capture-summary-title" onClick={(event) => event.stopPropagation()}><button className="monitor-summary-close" onClick={closeSummary} aria-label="Close capture summary"><X size={17} /></button><span className="monitor-modal-icon"><CheckCircle2 size={22} /></span><h2 id="capture-summary-title">Capture complete</h2><p>{summary.videoFilename ? `Your video was saved as ${summary.videoFilename}.` : summary.videoPending ? 'Your session ended, but the video still needs to be uploaded.' : 'Your timed posture-awareness session has ended. No video was saved.'}</p><dl><div><dt>Duration</dt><dd>{formatSeconds(summary.duration)}</dd></div><div><dt>Average posture score</dt><dd>{Number.isFinite(summary.score) ? `${summary.score}/100` : 'No score returned'}</dd></div><div><dt>Average wellness risk</dt><dd>{Number.isFinite(summary.averageRisk) ? `${summary.averageRisk}/100` : 'No risk data returned'}</dd></div><div><dt>Main issue</dt><dd>{summary.issue}</dd></div></dl>{summary.videoPending && pendingVideo && <button className="btn secondary" onClick={retryVideoUpload} disabled={videoUploading}>{videoUploading ? 'Retrying upload…' : 'Retry video upload'}</button>}<button className="btn primary" onClick={closeSummary}>Done</button></section></div>}
    </div>
  );
}
