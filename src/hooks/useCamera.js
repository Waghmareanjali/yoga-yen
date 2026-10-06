import { useCallback, useEffect, useState } from 'react';

function getCameraError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera permission was denied. Allow camera access in your browser settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera was found. Connect a webcam and try again.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The camera may be in use by another app. Close that app and try again.';
    case 'OverconstrainedError':
      return 'The selected camera does not support the requested video settings.';
    case 'SecurityError':
      return 'Camera access requires a secure page (HTTPS or localhost).';
    default:
      return 'Unable to access the camera. Check the browser permission and try again.';
  }
}

export function useCamera() {
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('Camera access is not supported by this browser. Try a modern browser over HTTPS.');
      return null;
    }
    if (stream?.active) return stream;

    setStatus('requesting');
    setError('');
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
      });
      setStream(nextStream);
      setStatus('active');
      return nextStream;
    } catch (cameraError) {
      setError(getCameraError(cameraError));
      setStatus('error');
      return null;
    }
  }, [stream]);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setStatus('idle');
  }, [stream]);

  useEffect(() => () => {
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  return { stream, status, error, start, stop };
}
