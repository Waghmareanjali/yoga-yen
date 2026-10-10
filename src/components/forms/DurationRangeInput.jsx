import { useId, useState } from 'react';
import { describeSeconds } from '../../utils/formatters';
import './duration-range-input.css';

export default function DurationRangeInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  presets = [],
  label,
  helperText,
  error,
  disabled = false,
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const parsedDraft = Number(draft);
  const validationError = draft === '' || !Number.isInteger(parsedDraft) || parsedDraft < min || parsedDraft > max
    ? `Enter a whole number from ${min} to ${max} seconds.`
    : '';
  const visibleError = error || validationError;
  const describedBy = [helperText && `${id}-help`, visibleError && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const updateDraft = (next) => {
    setDraft(next);
    if (next === '') return;
    const number = Number(next);
    if (Number.isInteger(number) && number >= min && number <= max) onChange(number);
  };
  const clampDraft = () => {
    const parsed = Number(draft);
    const clamped = Math.min(max, Math.max(min, Number.isFinite(parsed) ? Math.round(parsed) : value));
    setDraft(String(clamped));
    onChange(clamped);
  };
  const selectValue = (next) => {
    const normalized = Math.min(max, Math.max(min, next));
    setDraft(String(normalized));
    onChange(normalized);
  };
  const fill = ((value - min) / Math.max(1, max - min)) * 100;

  return (
    <fieldset className="duration-range-field" disabled={disabled}>
      <legend>{label}</legend>
      <div className="duration-range-values"><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => selectValue(Number(event.target.value))} aria-label={`${label} slider`} aria-describedby={describedBy} style={{ '--range-fill': `${fill}%` }} /><label className="duration-number-label" htmlFor={`${id}-number`}><input id={`${id}-number`} type="number" inputMode="numeric" min={min} max={max} step={step} value={draft} onChange={(event) => updateDraft(event.target.value)} onBlur={clampDraft} aria-label={`${label} in seconds`} aria-describedby={describedBy} /> sec</label></div>
      <div className="duration-live-label" aria-live="polite">{describeSeconds(value)}</div>
      {helperText && <small className="duration-helper" id={`${id}-help`}>{helperText}</small>}
      {visibleError && <small className="duration-error" id={`${id}-error`} role="alert">{visibleError}</small>}
      {presets.length > 0 && <div className="duration-presets" aria-label={`${label} presets`}>{presets.filter((preset) => preset >= min && preset <= max).map((preset) => <button type="button" key={preset} onClick={() => selectValue(preset)} aria-pressed={value === preset}>{formatPreset(preset)}</button>)}</div>}
    </fieldset>
  );
}

function formatPreset(value) {
  if (value < 60) return `${value}s`;
  if (value % 60 === 0) return `${value / 60}m`;
  return `${Math.floor(value / 60)}m ${value % 60}s`;
}
