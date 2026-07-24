/**
 * רכיבי UI משותפים — כל המודולים משתמשים אך ורק ברכיבים האלה
 * לטפסים, מודאלים וכפתורים, כדי לשמור על שפה עיצובית אחת.
 */
import { useEffect, useRef, type ReactNode } from 'react';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    // העברת פוקוס פנימה עם הפתיחה — לאלמנט הראשון או לדיאלוג עצמו.
    (focusables()[0] ?? dialogRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose();
        return;
      }
      if (e.key === 'Tab') {
        // מלכודת Tab — שמירת הפוקוס בתוך הדיאלוג.
        const items = focusables();
        if (items.length === 0) {
          e.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}>
      <div
        ref={dialogRef}
        className="modal"
        style={props.wide ? { maxWidth: 880 } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        tabIndex={-1}
      >
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
