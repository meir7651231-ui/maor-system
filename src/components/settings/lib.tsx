/**
 * עזרים משותפים למודול ההגדרות — עטיפת סקשן, מתג (Toggle), פורמט תאריכים
 * ורשימת הציוד הסטנדרטית לחדרים.
 */
import type { ReactNode } from 'react';

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

/** UX סבב-ו׳ — בקשת-מיקוד למסך ההגדרות: מסך אחר (למשל קיצורי המשפחות) מבקש
 *  לנחות על סעיף מסוים; ההגדרות פותחות את קבוצת-הלשונית הנכונה וגוללות אליו.
 *  sessionStorage (לא state) — הבקשה שורדת את ה-unmount שבין המסכים. */
const SETTINGS_FOCUS_KEY = 'maor_settings_focus';

export function requestSettingsSection(sectionId: string) {
  try { sessionStorage.setItem(SETTINGS_FOCUS_KEY, sectionId); } catch { /* אחסון חסום — הגלילה הישנה עדיין תנסה */ }
}

/** קורא ומוחק את בקשת-המיקוד (חד-פעמית). */
export function takeSettingsFocus(): string | null {
  try {
    const v = sessionStorage.getItem(SETTINGS_FOCUS_KEY);
    if (v) sessionStorage.removeItem(SETTINGS_FOCUS_KEY);
    return v;
  } catch { return null; }
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
