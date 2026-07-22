/**
 * רכיבי UI משותפים — כל המודולים משתמשים אך ורק ברכיבים האלה
 * לטפסים, מודאלים וכפתורים, כדי לשמור על שפה עיצובית אחת.
 */
import { useEffect, type ReactNode } from 'react';

export function Btn(props: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'danger' | 'plain';
  sm?: boolean;
  type?: 'button' | 'submit';
  title?: string;
  disabled?: boolean;
}) {
  const cls = ['btn', props.kind === 'primary' && 'primary', props.kind === 'danger' && 'danger', props.sm && 'sm']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type={props.type ?? 'button'}
      className={cls}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

export function Chip(props: { children: ReactNode; on?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={'chip' + (props.on ? ' on' : '')} onClick={props.onClick}>
      {props.on ? '✓ ' : ''}
      {props.children}
    </button>
  );
}

export function Modal(props: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}>
      <div className="modal" style={props.wide ? { maxWidth: 880 } : undefined} role="dialog" aria-label={props.title}>
        <h2>{props.title}</h2>
        {props.children}
      </div>
    </div>
  );
}

export function Field(props: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      {props.children}
    </div>
  );
}

export function TextInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <input
      type={props.type ?? 'text'}
      value={props.value}
      dir={props.dir}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

export function Select(props: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FormError(props: { error: string }) {
  if (!props.error) return null;
  return <div className="form-error">{props.error}</div>;
}

export function Empty(props: { children: ReactNode }) {
  return <div className="empty">{props.children}</div>;
}

export function PageHead(props: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h1 className="page-title">{props.title}</h1>
        {props.sub && <p className="page-sub">{props.sub}</p>}
      </div>
      {props.actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{props.actions}</div>}
    </div>
  );
}
