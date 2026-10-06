import { useEffect, useState } from 'react';
import { BellRing, Camera, Contrast, LogOut, Mic2, Save, ShieldCheck, TimerReset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { settingsApi } from '../../api/settingsApi';
import { useAuth } from '../../context/AuthContext';
import { useSettingsStore } from '../../store/settingsStore';
import AuthAlert from '../../components/auth/AuthAlert';
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
  const navigate = useNavigate();
  const { logout } = useAuth();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let active = true;
    settingsApi.getSettings()
      .then(({ settings: saved, demo: isDemo }) => {
        if (!active) return;
        setSettings((current) => ({ ...current, ...saved }));
        setDemo(isDemo);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Unable to load settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const toggle = (key) => {
    if (key === 'consentActive') return;
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setNotice('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await settingsApi.updateSettings(settings);
      setSettings((current) => ({ ...current, ...result.settings }));
      setDemo(result.demo);
      setNotice(result.demo ? 'Settings saved for this browser session (Demo Data).' : 'Your settings have been updated.');
      localStorage.setItem('yoga-yen-reduced-motion', String(Boolean(settings.reducedMotion)));
    } catch (requestError) {
      setError(requestError?.message || 'Unable to save your settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div><h1>Settings</h1><p>Make Yoga Yen work comfortably for you.</p></div>
        {demo && <span className="badge info">Demo Data</span>}
      </div>
      {error && <AuthAlert>{error}</AuthAlert>}
      {notice && <AuthAlert type="success">{notice}</AuthAlert>}

      <div className="settings-content">
        {loading ? (
          <div className="card settings-loading"><div /><div /><div /></div>
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

            <section className="card settings-section settings-account">
              <div><h2>Account</h2><p>End your current signed-in session on this device.</p></div>
              <button className="btn ghost" onClick={handleLogout}><LogOut size={16} /> Log out</button>
            </section>
          </>
        )}
      </div>
      {!loading && <div className="settings-save-bar"><button className="btn primary" onClick={save} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save settings'}</button></div>}
    </div>
  );
}
