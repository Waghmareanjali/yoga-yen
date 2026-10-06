import { useEffect, useState } from 'react';
import { BadgeCheck, Save, UserRound } from 'lucide-react';
import { profileApi } from '../../api/profileApi';
import { apiConfig } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AuthAlert from '../../components/auth/AuthAlert';
import './profile.css';

const profileFields = [
  { name: 'full_name', label: 'Full name', type: 'text', autocomplete: 'name' },
  { name: 'email', label: 'Email address', type: 'email', autocomplete: 'email' },
  { name: 'age', label: 'Age', type: 'number', min: 13, max: 120 },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  { name: 'height', label: 'Height (cm)', type: 'number', min: 80, max: 250, step: 0.1 },
  { name: 'weight', label: 'Weight (kg)', type: 'number', min: 20, max: 350, step: 0.1 },
  { name: 'work_type', label: 'Work type', type: 'select', options: ['Student', 'Office Work', 'Software/IT', 'Remote Work', 'Other'] },
  { name: 'device_type', label: 'Primary device', type: 'select', options: ['Laptop', 'Desktop'] },
];

function mapProfile(user = {}) {
  return {
    full_name: user.full_name || user.name || '',
    email: user.email || '',
    age: user.age ?? '',
    gender: user.gender || '',
    height: user.height ?? '',
    weight: user.weight ?? '',
    work_type: user.work_type || user.role || '',
    device_type: user.device_type || '',
  };
}

export default function Profile() {
  const { user: authUser, setUser } = useAuth();
  const [form, setForm] = useState(() => mapProfile(authUser));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    profileApi.getProfile()
      .then(({ user: profile }) => {
        if (!active) return;
        const nextForm = mapProfile({ ...profile, ...authUser });
        setForm(nextForm);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Unable to load your profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [authUser]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
    setSuccess('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const { user: savedProfile, demo: isDemo } = await profileApi.updateProfile({
        ...form,
        age: form.age === '' ? null : Number(form.age),
        height: form.height === '' ? null : Number(form.height),
        weight: form.weight === '' ? null : Number(form.weight),
      });
      setForm(mapProfile(savedProfile));
      setUser((current) => ({ ...current, ...savedProfile, name: savedProfile.full_name || savedProfile.name }));
      setSuccess(isDemo ? 'Profile saved in this browser session only (UI preview).' : 'Your profile has been updated.');
    } catch (requestError) {
      setError(requestError?.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.full_name || 'Yoga Yen').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <div className="profile-page">
      <div className="page-header">
        <div><h1>Profile</h1><p>Manage the information used to personalize your wellness experience.</p></div>
        {apiConfig.uiOnlyMode && <span className="badge info">UI Preview</span>}
      </div>
      <section className="card profile-card">
        <div className="profile-card-heading">
          <div className="profile-avatar">{initials || <UserRound size={22} />}</div>
          <div><h2>Personal information</h2><p>Preview profile data is stored only in this browser.</p></div>
          <BadgeCheck size={21} className="profile-heading-icon" />
        </div>
        {error && <AuthAlert>{error}</AuthAlert>}
        {success && <AuthAlert type="success">{success}</AuthAlert>}
        {loading ? (
          <div className="profile-loading" aria-label="Loading profile"><span /><span /><span /><span /></div>
        ) : (
          <form className="profile-form" onSubmit={saveProfile}>
            {profileFields.map((field) => (
              <div className="profile-field" key={field.name}>
                <label htmlFor={`profile-${field.name}`}>{field.label}</label>
                {field.type === 'select' ? (
                  <select id={`profile-${field.name}`} name={field.name} value={form[field.name]} onChange={handleChange}>
                    <option value="">Select an option</option>
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input
                    id={`profile-${field.name}`}
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    autoComplete={field.autocomplete}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required={field.name === 'full_name' || field.name === 'email'}
                  />
                )}
              </div>
            ))}
            <div className="profile-form-actions">
              <span className="profile-disclaimer">Wellness information is not medical advice.</span>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? <><span className="profile-spinner" /> Saving...</> : <><Save size={16} /> Save changes</>}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
