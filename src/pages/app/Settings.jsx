import { useEffect, useState } from 'react';
import { BellRing, Camera, Contrast, Mic2, Save, ShieldCheck, TimerReset } from 'lucide-react';
import { settingsApi } from '../../api/settingsApi';
import { useSettingsStore } from '../../store/settingsStore';
import AuthAlert from '../../components/auth/AuthAlert';
import DurationRangeInput from '../../components/forms/DurationRangeInput';
import { DEFAULT_CAPTURE_SECONDS, MAX_CAPTURE_SECONDS, MIN_CAPTURE_SECONDS, PRESETS, CALIBRATION_DEFAULT, CALIBRATION_MAX, CALIBRATION_MIN, SAMPLING_INTERVAL_DEFAULT, SAMPLING_INTERVAL_MAX, SAMPLING_INTERVAL_MIN } from '../../constants/capture';
import './settings.css';

const defaults = {
  postureAlerts: true,
  breakReminder: true,
  weeklyReportEmail: true,
  monitoringEnabled: true,
  voiceGuidance: false,
  voiceVolume: 65,
  breakInterval: 45,
  alertCooldown: 5,
  reducedMotion: false,
  captureDurationSec: DEFAULT_CAPTURE_SECONDS,
  calibrationDurationSec: CALIBRATION_DEFAULT,
  samplingIntervalSec: SAMPLING_INTERVAL_DEFAULT,
  autoStop: true,
  continuousMode: false,
};

const settingGroups = [
  { title: 'Monitoring', icon: Camera, items: [
    ['monitoringEnabled', 'Monitoring enabled', 'Camera access is only requested when you start a session.'],
    ['cameraPreview', 'Show camera preview', 'Your video preview stays in this browser tab.'],
  ] },
  { title: 'Alerts & breaks', icon: BellRing, items: [
    ['postureAlerts', 'Posture alerts', 'Show a reminder when a posture issue is reported.'],
    ['breakReminder', 'Break reminders', 'Get a gentle prompt to move during longer sessions.'],
    ['weeklyReportEmail', 'Weekly report email', 'Opt in to backend email reports when supported.'],
  ] },
  { title: 'Voice guidance', icon: Mic2, items: [
    ['voiceGuidance', 'Enable spoken guidance', 'Browser speech is optional and can be disabled at any time.'],
  ] },
  { title: 'Privacy', icon: ShieldCheck, items: [
    ['consentActive', 'Posture analysis consent', 'You can stop camera access at any time using browser permissions.'],
  ] },
];

export default function Settings() {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const setCaptureSettings = useSettingsStore((state) => state.setCaptureSettings);

  useEffect(() => {
    let active = true;
    settingsApi.getSettings()
      .then(({ settings: saved }) => {
        if (!active) return;
        const captureSettings = Object.fromEntries(Object.keys(defaults).filter((key) => key.endsWith('Sec') || ['autoStop', 'continuousMode'].includes(key)).map((key) => [key, saved[key] ?? useSettingsStore.getState()[key]]));
        setCaptureSettings(captureSettings);
        setSettings({ ...defaults, ...useSettingsStore.getState(), ...saved });
      })
      .catch((requestError) => {
        if (active) {
          setSettings({ ...defaults, ...useSettingsStore.getState() });
          setError(requestError?.message || 'Unable to load settings.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [setCaptureSettings]);

  const toggle = (key) => {
    if (key === 'consentActive') return;
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setNotice('');
  };

  const save = async () => {
    if (!settings) return;
    const previousCaptureSettings = useSettingsStore.getState();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      setCaptureSettings(settings);
      const result = await settingsApi.updateSettings(settings);
      setSettings((current) => ({ ...current, ...result.settings }));
      setNotice('Your settings have been updated.');
      localStorage.setItem('yoga-yen-reduced-motion', String(Boolean(settings.reducedMotion)));
    } catch (requestError) {
      setCaptureSettings(previousCaptureSettings);
      setError(requestError?.message || 'Unable to save your settings.');
    } finally {
      setSaving(false);
    }
  };

  const resetCaptureSettings = () => {
    setSettings((current) => ({
      ...current,
      captureDurationSec: DEFAULT_CAPTURE_SECONDS,
      calibrationDurationSec: CALIBRATION_DEFAULT,
      samplingIntervalSec: SAMPLING_INTERVAL_DEFAULT,
      autoStop: true,
      continuousMode: false,
    }));
    setNotice('');
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div><h1>Settings</h1><p>Make Yoga Yen work comfortably for you.</p></div>
      </div>
      {error && <AuthAlert>{error}</AuthAlert>}
      {notice && <AuthAlert type="success">{notice}</AuthAlert>}

      <div className="settings-content">
        {loading ? (
          <div className="card settings-loading"><div /><div /><div /></div>
        ) : !settings ? (
          <div className="card settings-section">Settings will appear here when the account service is connected.</div>
        ) : (
          <>
            {settingGroups.map(({ title, icon: Icon, items }) => (
              <section className="card settings-section" key={title}>
                <div className="settings-section-heading"><span><Icon size={17} /></span><h2>{title}</h2></div>
                <div className="settings-list">
                  {items.map(([key, label, description]) => {
                    const checked = key === 'consentActive' ? true : Boolean(settings[key]);
                    return (
                      <label className="settings-row" key={key}>
                        <span><strong>{label}</strong><small>{description}</small></span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={checked}
                          disabled={key === 'consentActive'}
                          onChange={() => toggle(key)}
                          aria-label={label}
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            <section className="card settings-section settings-capture-section">
              <div className="settings-section-heading"><span><Camera size={17} /></span><h2>Capture</h2></div>
              <DurationRangeInput label="Default capture duration" value={settings.captureDurationSec} min={MIN_CAPTURE_SECONDS} max={MAX_CAPTURE_SECONDS} step={5} presets={PRESETS} onChange={(value) => setSettings((current) => ({ ...current, captureDurationSec: value }))} helperText="The camera timer only controls analysis duration. No video is saved." />
              <DurationRangeInput label="Default calibration duration" value={settings.calibrationDurationSec} min={CALIBRATION_MIN} max={CALIBRATION_MAX} onChange={(value) => setSettings((current) => ({ ...current, calibrationDurationSec: value }))} helperText="Choose a comfortable time for your posture baseline." />
              <DurationRangeInput label="Sampling interval" value={settings.samplingIntervalSec} min={SAMPLING_INTERVAL_MIN} max={SAMPLING_INTERVAL_MAX} onChange={(value) => setSettings((current) => ({ ...current, samplingIntervalSec: value }))} helperText="Seconds between posture landmark samples sent in API mode." />
              <div className="settings-list">
                {[
                  ['autoStop', 'Auto-stop when time ends', 'Stop camera and analysis when the selected duration ends.'],
                  ['continuousMode', 'Unlimited / Continuous', 'Run until you manually stop monitoring.'],
                ].map(([key, label, description]) => <label className="settings-row" key={key}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" role="switch" checked={Boolean(settings[key])} onChange={() => setSettings((current) => ({ ...current, [key]: !current[key], ...(key === 'continuousMode' && !current[key] ? { autoStop: false } : {}) }))} aria-label={label} /></label>)}
              </div>
              <button type="button" className="btn ghost settings-reset-capture" onClick={resetCaptureSettings}>Reset capture defaults</button>
            </section>

            <section className="card settings-section">
              <div className="settings-section-heading"><span><TimerReset size={17} /></span><h2>Reminder timing</h2></div>
              <div className="settings-range-grid">
                <label>Break interval <strong>{settings.breakInterval} minutes</strong>
                  <input type="range" min="20" max="90" step="5" value={settings.breakInterval} onChange={(event) => setSettings((current) => ({ ...current, breakInterval: Number(event.target.value) }))} />
                </label>
                <label>Alert cooldown <strong>{settings.alertCooldown} minutes</strong>
                  <input type="range" min="1" max="15" value={settings.alertCooldown} onChange={(event) => setSettings((current) => ({ ...current, alertCooldown: Number(event.target.value) }))} />
                </label>
              </div>
            </section>

            {settings.voiceGuidance && (
              <section className="card settings-section">
                <div className="settings-section-heading"><span><Mic2 size={17} /></span><h2>Voice level</h2></div>
                <label className="settings-range-full">Volume <strong>{settings.voiceVolume}%</strong>
                  <input type="range" min="0" max="100" value={settings.voiceVolume} onChange={(event) => setSettings((current) => ({ ...current, voiceVolume: Number(event.target.value) }))} />
                </label>
              </section>
            )}

            <section className="card settings-section settings-appearance">
              <div className="settings-section-heading"><span><Contrast size={17} /></span><h2>Appearance</h2></div>
              <label className="settings-theme-row">Color theme
                <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="settings-row">
                <span><strong>Reduced motion</strong><small>Respect a calmer, low-motion experience.</small></span>
                <input type="checkbox" role="switch" checked={settings.reducedMotion} onChange={() => toggle('reducedMotion')} aria-label="Reduced motion" />
              </label>
            </section>

          </>
        )}
      </div>
      {!loading && settings && <div className="settings-save-bar"><button className="btn primary" onClick={save} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save settings'}</button></div>}
    </div>
  );
}
