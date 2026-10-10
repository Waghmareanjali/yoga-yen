import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { analysisApi } from '../../api/analysisApi';
import Button from '../../components/common/Button';
import SectionHeader from '../../components/common/SectionHeader';
import AuthAlert from '../../components/auth/AuthAlert';
import { validateImageFile } from '../../utils/validators';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import './image-analysis.css';

export default function ImageAnalysis() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [snapshotIntervalSec, setSnapshotIntervalSec] = useState(2);
  const [snapshotCount, setSnapshotCount] = useState(3);
  const [snapshotCountdown, setSnapshotCountdown] = useState(2);
  const [snapshotsRemaining, setSnapshotsRemaining] = useState(0);
  const [timedSnapshots, setTimedSnapshots] = useState([]);
  const [timedActive, setTimedActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const videoRef = useRef(null);
  const cameraDialogRef = useRef(null);
  const streamRef = useRef(null);
  const previewRef = useRef('');
  const fileInputRef = useRef(null);
  const snapshotsRemainingRef = useRef(0);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => setError('Camera preview could not start. Check browser permissions and try again.'));
    }
  }, [cameraOpen]);

  const captureLocalSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return false;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return false;
    context.drawImage(video, 0, 0);
    setTimedSnapshots((current) => [...current, { id: crypto.randomUUID(), dataUrl: canvas.toDataURL('image/jpeg', 0.85), capturedAt: new Date().toISOString() }]);
    return true;
  }, []);

  useEffect(() => {
    if (!cameraOpen || !timedActive) return undefined;
    let countdown = snapshotIntervalSec;
    const interval = window.setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        setSnapshotCountdown(countdown);
        return;
      }
      if (!captureLocalSnapshot()) {
        setError('The camera frame was not ready. Timed capture has stopped; please try again.');
        setTimedActive(false);
        return;
      }
      snapshotsRemainingRef.current -= 1;
      setSnapshotsRemaining(snapshotsRemainingRef.current);
      if (snapshotsRemainingRef.current <= 0) {
        setTimedActive(false);
        return;
      }
      countdown = snapshotIntervalSec;
      setSnapshotCountdown(countdown);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cameraOpen, timedActive, snapshotIntervalSec, captureLocalSnapshot]);

  const setSelectedImage = (selected) => {
    if (!selected) return;
    if (!validateImageFile(selected)) {
      setError('Please choose a JPG, PNG, or WebP image smaller than 5 MB.');
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const objectUrl = URL.createObjectURL(selected);
    previewRef.current = objectUrl;
    setFile(selected);
    setPreview(objectUrl);
    setResult(null);
    setError('');
  };

  const handleFileChange = (event) => {
    setSelectedImage(event.target.files?.[0]);
    event.target.value = '';
  };

  const clearImage = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = '';
    setPreview('');
    setFile(null);
    setResult(null);
  };

  const openCamera = async (timed = false) => {
    setTimedMode(timed);
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is unavailable. Use HTTPS or localhost, or upload a picture instead.');
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } }, audio: false });
      setCameraOpen(true);
    } catch (cameraError) {
      setError(cameraError.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow access in your browser settings or upload an image.'
        : cameraError.name === 'NotFoundError'
          ? 'No camera was found. Upload an image to continue.'
          : `Could not open the camera: ${cameraError.message || 'check browser permissions and try again.'}`);
    }
  };

  const closeCamera = () => {
    setTimedActive(false);
    setVideoReady(false);
    setTimedMode(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };
  useDialogFocus(cameraDialogRef, closeCamera, cameraOpen);

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('The camera is still starting. Please wait a moment and try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Could not capture the camera image. Please try again.');
        return;
      }
      setSelectedImage(new File([blob], `yoga-yen-snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const openTimedSnapshotCamera = async () => {
    setTimedSnapshots([]);
    snapshotsRemainingRef.current = snapshotCount;
    setSnapshotsRemaining(snapshotCount);
    setSnapshotCountdown(snapshotIntervalSec);
    await openCamera(true);
  };

  const startTimedSnapshots = () => {
    snapshotsRemainingRef.current = snapshotCount;
    setSnapshotsRemaining(snapshotCount);
    setSnapshotCountdown(snapshotIntervalSec);
    setTimedActive(true);
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError('');
    try {
      setResult(await analysisApi.analyzeImage(file));
    } catch (requestError) {
      setError(requestError.message || 'Unable to analyze the selected image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section image-analysis-page">
      <div className="container">
        <SectionHeader eyebrow="Image Analysis" title="A posture snapshot, on your terms" description="Choose or capture one image for a posture-awareness check. Analysis requires the connected wellness service and is not medical advice." />
        <div className="image-analysis-layout">
          <section className="card image-upload-card">
            <div className="image-mode-label"><span className="status-dot" />Image is sent only when you choose Analyze image</div>
            <button
              type="button"
              className={`image-dropzone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); setSelectedImage(event.dataTransfer.files?.[0]); }}
            >
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} hidden />
              <span className="image-upload-icon"><ImagePlus size={22} /></span>
              <strong>Drop an image here or browse files</strong>
              <span>JPG, PNG, or WebP · up to 5 MB</span>
            </button>
            {preview && <div className="image-preview-wrap"><img src={preview} alt="Selected posture preview" /><button className="image-remove" onClick={clearImage} aria-label="Remove selected image"><X size={16} /></button><span>{file?.name}</span></div>}
            <div className="image-actions">
              <Button onClick={analyze} disabled={!file || loading}>{loading ? 'Checking…' : 'Analyze image'}</Button>
              <Button variant="secondary" type="button" onClick={openCamera}><Camera size={15} /> Take snapshot</Button>
            </div>
            <section className="timed-snapshot-settings" aria-labelledby="timed-snapshot-heading">
              <div><h3 id="timed-snapshot-heading">Timed snapshot</h3><p>Capture a few frames at a chosen interval. They stay in memory only until discarded or you leave this page.</p></div>
              <div className="timed-snapshot-fields">
                <label>Interval (seconds)<input type="number" min="1" max="30" value={snapshotIntervalSec} onChange={(event) => setSnapshotIntervalSec(Math.min(30, Math.max(1, Number(event.target.value) || 1)))} /></label>
                <label>Number of snapshots<input type="number" min="1" max="10" value={snapshotCount} onChange={(event) => setSnapshotCount(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} /></label>
              </div>
              <Button variant="secondary" type="button" onClick={openTimedSnapshotCamera}><Camera size={15} />Start timed snapshots</Button>
              {timedSnapshots.length > 0 && <div className="timed-snapshot-grid">{timedSnapshots.map((snapshot, index) => <article key={snapshot.id}><img src={snapshot.dataUrl} alt={`Timed snapshot ${index + 1}`} /><span>Snapshot {index + 1}</span><button type="button" className="btn ghost" onClick={() => setTimedSnapshots((items) => items.filter((item) => item.id !== snapshot.id))}>Discard</button></article>)}</div>}
              {timedSnapshots.length > 0 && <button type="button" className="btn ghost" onClick={() => setTimedSnapshots([])}>Discard all snapshots</button>}
            </section>
            {error && <AuthAlert>{error}</AuthAlert>}
            <div className="image-privacy-note"><ShieldCheck size={17} /><span>Camera access starts only after you choose Take snapshot. The preview stays in this browser; it is sent only when you explicitly analyze in connected mode.</span></div>
          </section>
          <section className="card image-result-card">
            <div className="image-result-heading"><span className="image-result-icon"><CheckCircle2 size={18} /></span><div><h2>Analysis result</h2><p>Non-medical posture awareness</p></div></div>
            {result ? <div className="image-result-content"><div className="image-result-pill">{result.posture || 'Analysis complete'}</div><p>{result.summary || result.message || 'The wellness service returned no summary.'}</p>{result.risk != null && <div><strong>Risk level:</strong> {result.risk}</div>}{result.score != null && <div><strong>Posture score:</strong> {result.score}</div>}</div> : <div className="image-result-empty"><UploadCloud size={25} /><strong>Your result appears here</strong><span>Select an image, then choose Analyze image.</span></div>}
            <p className="image-result-disclaimer">Not a diagnosis. Stop if movement causes discomfort and consult a qualified professional for health concerns.</p>
          </section>
        </div>
      </div>
      {cameraOpen && <div className="camera-modal-backdrop" role="presentation" onClick={closeCamera}><section ref={cameraDialogRef} tabIndex="-1" className="camera-modal" role="dialog" aria-modal="true" aria-labelledby="camera-heading" onClick={(event) => event.stopPropagation()}><div className="camera-modal-header"><div><h2 id="camera-heading">{timedMode ? 'Timed snapshots' : 'Take a posture snapshot'}</h2><p>{timedMode ? 'Captured frames are held in memory only. Nothing is uploaded or saved.' : 'Position your device so you are comfortably visible.'}</p></div><button onClick={closeCamera} aria-label="Close camera"><X size={18} /></button></div><video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={() => setVideoReady(true)} />{timedMode && <div className="timed-snapshot-status" aria-live="polite">{timedActive ? `Next snapshot in ${snapshotCountdown} seconds · ${snapshotsRemaining} remaining` : `${timedSnapshots.length} captured in memory`}</div>}<div className="camera-modal-actions"><Button variant="secondary" onClick={closeCamera}>{timedActive ? 'Stop and close' : 'Cancel'}</Button>{timedMode ? timedActive ? <Button onClick={() => setTimedActive(false)}>Stop timed capture</Button> : <Button onClick={startTimedSnapshots} disabled={!videoReady}><Camera size={15} />Start timer</Button> : <Button onClick={captureSnapshot}><Camera size={15} /> Capture snapshot</Button>}</div></section></div>}
    </main>
  );
}
