/**
 * עזרים משותפים למודול ההגדרות — עטיפת סקשן, מתג (Toggle), פורמט תאריכים
 * ורשימת הציוד הסטנדרטית לחדרים.
 */
import type { ReactNode } from 'react';
import { isoToday as isoTodayLocal } from '../../lib/date-util';

/** תאריך ISO ‏→ DD/MM/YYYY לתצוגה. */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const p = iso.slice(0, 10).split('-');
  if (p.length !== 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** חותמת זמן ISO ‏→ DD/MM/YYYY HH:MM לתצוגה. */
export function fmtDateTime(iso: string): string {
  if (!iso) return '—';
  const time = iso.length > 15 ? iso.slice(11, 16) : '';
  return fmtDate(iso) + (time ? ' ' + time : '');
}

/** היום בפורמט ISO ‏(YYYY-MM-DD). */
export function isoToday(): string {
  return isoTodayLocal();
}

/** רשימת הציוד הסטנדרטית לחדרים — כמו במערכת המקורית. */
export const ROOM_EQUIPMENT: readonly string[] = [
  'מקרן',
  'הגברה',
  'מזגן',
  'פסנתר',
  'מראות',
  'מטבח מאובזר',
  'מחשבים',
  'שולחנות מתקפלים',
];

/** כרטיס סקשן בעמוד ההגדרות, עם עוגן לגלילה מהניווט המהיר. */
export function Section(props: { id: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={props.id} className="card" style={{ marginBottom: 20, scrollMarginTop: 16 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{props.title}</h2>
      {props.sub && <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 14 }}>{props.sub}</p>}
      {props.children}
    </section>
  );
}

/** הערת שוליים מוצנעת בתוך סקשן. */
export function SectionNote(props: { children: ReactNode }) {
  return <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 10 }}>{props.children}</p>;
}

/** שורת מתג הפעלה/כיבוי עם כותרת ותיאור. */
export function Toggle(props: {
  on: boolean;
  onToggle: () => void;
  label: string;
  desc?: string;
  /** צבע המתג כשהוא דולק (ברירת מחדל: כהה). */
  onColor?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{props.label}</div>
        {props.desc && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{props.desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={props.on}
        aria-label={props.label}
        onClick={props.onToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          flexShrink: 0,
          background: props.on ? (props.onColor ?? 'var(--dark)') : 'var(--line)',
          position: 'relative',
          transition: 'background 0.15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            insetInlineStart: props.on ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
            transition: 'inset-inline-start 0.15s',
          }}
        />
      </button>
    </div>
  );
}
