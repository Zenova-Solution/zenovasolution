import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { DatePicker, Dropdown, Toggle } from '@/components/ui/inputs';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {children}
      {hint && <p className="adm-help">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        className="adm-input"
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className="adm-textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function Select({
  label,
  hint,
  value,
  options,
  onChange,
  searchable,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  searchable?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Dropdown
        value={value}
        options={options}
        onChange={onChange}
        searchable={searchable}
        placeholder={placeholder}
      />
    </Field>
  );
}

export function DateField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  clearable,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  clearable?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <DatePicker
        value={value || null}
        onChange={(v) => onChange(v ?? '')}
        min={min}
        max={max}
        clearable={clearable}
        placeholder={placeholder}
      />
    </Field>
  );
}

export function ToggleField({
  label,
  hint,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <Toggle
        checked={value}
        onChange={onChange}
        disabled={disabled}
        label={description}
      />
    </Field>
  );
}

export function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="color"
          className="adm-input adm-input--color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 64, flexShrink: 0 }}
        />
        <input
          type="text"
          className="adm-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', flex: 1 }}
        />
      </div>
    </Field>
  );
}

export function StringList({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const update = (i: number, v: string) => {
    const next = [...values];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const add = () => onChange([...values, '']);
  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {values.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="adm-input"
              value={v}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
            />
            <button className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => remove(i)}>
              ✕
            </button>
          </div>
        ))}
        <button className="adm-btn adm-btn--sm" onClick={add} style={{ alignSelf: 'flex-start' }}>
          + Add item
        </button>
      </div>
    </Field>
  );
}

export function Toast({ message, onClear }: { message: string | null; onClear: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!message) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      onClear();
    }, 2200);
    return () => clearTimeout(t);
  }, [message, onClear]);
  if (!show || !message) return null;
  return <div className="adm-toast">{message}</div>;
}
