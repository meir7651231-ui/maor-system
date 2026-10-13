/**
 * 🏡 אירוח משפחתי — ערכת-הממשק של המקור בסקין "Aurora Glass" (אשכול 5).
 *
 * המבנה של המקור נשמר: מודאל = ‎mask › modal › mh/mb/mf, אישור-מחיקה = askConfirm (דיאלוג in-app, לא confirm ילידי),
 * שאלת-טקסט = askText; KPI עם פס-צבע, pill עם נקודה זוהרת, ספירה-עולה, שעון-חי. המודאלים נפתחים בשכבת-פורטל
 * (‎.hst.hst-portal על body) כדי שלא ייחתכו בחלון-המודול ושהסקין יחול עליהם — עם מלכודת-Tab, Escape ו-✕ של אורביט
 * (רק המודאל העליון מגיב). כל המחלקות בקידומת h- (ראו h()).
 */
import { createContext, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';
import type { HostTab } from './labels';

/** "btn ghost sm" ⇒ "h-btn h-ghost h-sm" — שמות-המחלקות של המקור בקידומת-הסקין. */
export function h(names: string): string {
  return names
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => 'h-' + c)
    .join(' ');
}

/** כרטיס/שורה לחיצים (div של המקור) — נגישים במקלדת (Enter/רווח). */
export function clickable(fn: () => void): {
  role: 'button';
  tabIndex: number;
  onClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
} {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: (e) => {
      // לחיצה על כפתור/קישור/פס פנימי — לא פותחת את הכרטיס (כמו `!t.closest('button,a')` במקור)
      const el = (e.target as HTMLElement).closest('button, a, input, select, textarea, label, [role="button"]');
      if (el && el !== e.currentTarget && (e.currentTarget as HTMLElement).contains(el)) return;
      e.stopPropagation();
      fn();
    },
    onKeyDown: (e) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fn();
      }
    },
  };
}

/** משתנה-CSS מקומי (‎--h-kc/‎--h-sc…) לסגנון-inline. */
export function cssVar(name: string, value: string, extra: CSSProperties = {}): CSSProperties {
  return { ...extra, ['--h-' + name]: value } as CSSProperties;
}

/* ═══════════════ הקשר-המסך: ניווט, דיאלוגים, אישורים ═══════════════ */

/** הדיאלוגים של המודול — מודאל אחד פעיל בכל רגע (כמו `#modalRoot` במקור: פתיחה מחליפה). */
export type HostDialog =
  | { k: 'booking'; id: string | null; pre?: { unitId?: string; checkIn?: string } }
  | { k: 'pay'; id: string }
  | { k: 'unit'; id: string | null }
  | { k: 'rooms'; id: string }
  | { k: 'guest'; id: string | null }
  | { k: 'task' }
  | { k: 'meal'; id: string | null; bookingId?: string }
  | { k: 'recipe'; id: string }
  | { k: 'menu' }
  | { k: 'dish'; id: string | null }
  | { k: 'staff' }
  | { k: 'staffEdit'; id: string | null }
  | { k: 'staffCard'; id: string }
  | { k: 'shop' }
  | { k: 'tableset' }
  | { k: 'seating'; id: string }
  | { k: 'temp' }
  | { k: 'fault'; assetId?: string }
  | { k: 'asset' }
  | { k: 'plan' };

export interface HostUi {
  /** ערכת-השיחה (◑) — null = לפי המכשיר/אורביט. */
  theme: 'light' | 'dark' | null;
  open: (d: HostDialog) => void;
  close: () => void;
  /** askConfirm של המקור — דיאלוג in-app (z גבוה), "ביטול" + כפתור-אישור אדום. */
  confirm: (msg: string, onYes: () => void, yesLabel?: string) => void;
  /** askText של המקור — שאלת-שורה אחת. */
  ask: (title: string, val: string, cb: (v: string) => void, ph?: string) => void;
  go: (tab: HostTab) => void;
}

const NOOP_UI: HostUi = { theme: null, open: () => {}, close: () => {}, confirm: () => {}, ask: () => {}, go: () => {} };
export const HostUiCtx = createContext<HostUi>(NOOP_UI);
export function useHostUi(): HostUi {
  return useContext(HostUiCtx);
}

/* ═══════════════ פורטל + מודאל ═══════════════ */

/** שכבת-הפורטל — עוטפת ב-‎.hst כדי שהסקין (טוקנים/גופנים/ערכה) יחול על המודאלים. ברינדור-שרת — inline. */
export function HPortal(props: { children: ReactNode }) {
  const ui = useHostUi();
  const node = (
    <div className="hst hst-portal" data-hst-theme={ui.theme ?? undefined}>
      {props.children}
    </div>
  );
  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function HModal(props: {
  title: ReactNode;
  /** תווית-נגישות (כשהכותרת אינה טקסט). */
  label?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  maxWidth?: number;
  wide?: boolean;
  /** מעל המודאל הפעיל (askConfirm/askText/בורר-אמוג׳י). */
  z?: number;
  /** בלי שורת-כותרת (askConfirm של המקור). */
  noHead?: boolean;
  bodyStyle?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('.h-mb ' + FOCUSABLE.split(', ').join(', .h-mb ')) ?? ref.current;
    first?.focus();
    const isTop = () => {
      const all = document.querySelectorAll('.h-mask > .h-modal');
      return all[all.length - 1] === ref.current;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
        if (!items.length) {
          e.preventDefault();
          return;
        }
        const a = items[0];
        const b = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === a || document.activeElement === ref.current)) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);
  const label = props.label ?? (typeof props.title === 'string' ? props.title : undefined);
  return (
    <HPortal>
      <div className="h-mask" style={props.z ? { zIndex: props.z } : undefined} onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}>
        <div
          ref={ref}
          className={'h-modal' + (props.wide ? ' h-wide' : '')}
          style={props.maxWidth ? { maxWidth: props.maxWidth } : undefined}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
        >
          {!props.noHead && (
            <div className="h-mh">
              <h2>{props.title}</h2>
              <button type="button" className="h-iconbtn" onClick={props.onClose} aria-label="סגירה" title="סגירה">
                ✕
              </button>
            </div>
          )}
          <div className="h-mb" style={props.bodyStyle}>
            {props.children}
          </div>
          {props.footer && <div className="h-mf">{props.footer}</div>}
        </div>
      </div>
    </HPortal>
  );
}

/** askConfirm — "ביטול" + כפתור אדום (ברירת-מחדל "מחיקה"). */
export function ConfirmDialog(props: { msg: string; yesLabel?: string; onYes: () => void; onNo: () => void }) {
  return (
    <HModal
      title=""
      label="אישור"
      noHead
      z={130}
      maxWidth={380}
      onClose={props.onNo}
      bodyStyle={{ fontSize: 15, lineHeight: 1.5 }}
      footer={
        <>
          <button type="button" className={h('btn ghost')} onClick={props.onNo}>
            ביטול
          </button>
          <button type="button" className={h('btn danger')} onClick={props.onYes}>
            {props.yesLabel || 'מחיקה'}
          </button>
        </>
      }
    >
      {props.msg}
    </HModal>
  );
}

/** askText — שאלת-שורה (Enter = אישור, Escape = ביטול). */
export function AskDialog(props: { title: string; val: string; ph?: string; onDone: (v: string | null) => void }) {
  const [v, setV] = useState(props.val);
  return (
    <HModal
      title={props.title}
      z={130}
      maxWidth={400}
      onClose={() => props.onDone(null)}
      footer={
        <>
          <button type="button" className={h('btn ghost')} onClick={() => props.onDone(null)}>
            ביטול
          </button>
          <button type="button" className={h('btn')} onClick={() => props.onDone(v.trim())}>
            אישור
          </button>
        </>
      }
    >
      <div className="h-field" style={{ margin: 0 }}>
        <input
          aria-label={props.title}
          value={v}
          placeholder={props.ph}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') props.onDone(v.trim());
          }}
        />
      </div>
    </HModal>
  );
}

/* ═══════════════ שדות-טופס (‎.field של המקור, עם תווית מקושרת) ═══════════════ */

export function FInput(props: {
  label: ReactNode;
  value: string | number;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  style?: CSSProperties;
  inputStyle?: CSSProperties;
}) {
  const id = useId();
  return (
    <div className="h-field" style={props.style}>
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        type={props.type ?? 'text'}
        value={props.value}
        placeholder={props.placeholder}
        min={props.min}
        max={props.max}
        step={props.step}
        disabled={props.disabled}
        style={props.inputStyle}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={props.onBlur}
      />
    </div>
  );
}

export function FSelect(props: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: readonly (string | readonly [string, string])[];
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const id = useId();
  return (
    <div className="h-field" style={props.style}>
      <label htmlFor={id}>{props.label}</label>
      <select id={id} value={props.value} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => {
          const [val, lab] = typeof o === 'string' ? [o, o] : o;
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function FText(props: { label: ReactNode; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const id = useId();
  return (
    <div className="h-field">
      <label htmlFor={id}>{props.label}</label>
      <textarea id={id} rows={props.rows ?? 2} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  );
}

/** תיבת-סימון בשורת-פאנל (מתג "משפחה מתארחת", "סכנת בטיחות"). */
export function FCheck(props: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="h-field h-chk">
      <input id={id} type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <label htmlFor={id} style={{ margin: 0 }}>
        {props.label}
      </label>
    </div>
  );
}

/* ═══════════════ רכיבי-תצוגה ═══════════════ */

export function Kpi(props: { kc: string; lab: ReactNode; val: ReactNode; sub?: ReactNode }) {
  return (
    <div className="h-kpi" style={cssVar('kc', props.kc)}>
      <div className="h-lab">{props.lab}</div>
      <div className="h-val">{props.val}</div>
      <div className="h-sub">{props.sub}</div>
    </div>
  );
}

/** pill עם נקודה זוהרת (מחלקת st-… / u-… של המקור — או צבע חופשי). */
export function Pill(props: { cls?: string; color: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      className={'h-pill' + (props.cls ? ' h-' + props.cls : '')}
      style={props.cls ? props.style : { color: props.color, background: 'color-mix(in srgb,' + props.color + ' 15%,transparent)', ...props.style }}
    >
      <i style={{ background: props.color }} />
      {props.children}
    </span>
  );
}

/** מצב-ריק גדול (פאנל עם אייקון) — "אין עדיין יחידות" וכו׳. */
export function BigEmpty(props: { icon: string; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="h-panel" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 40 }}>{props.icon}</div>
      <div style={{ fontWeight: 800, fontSize: 17, margin: '8px 0 4px' }}>{props.title}</div>
      {props.sub && <div style={{ color: 'var(--h-dim)', fontSize: 13.5, marginBottom: props.action ? 14 : 0 }}>{props.sub}</div>}
      {props.action}
    </div>
  );
}

function reducedMotion(): boolean {
  return typeof window === 'undefined' || typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** ספירה-עולה (animateDash) — 900ms, האטה קובית; מכבד prefers-reduced-motion. */
export function CountUp(props: { to: number; fmt: (v: number) => string }) {
  const [v, setV] = useState(() => (reducedMotion() ? props.to : 0));
  const fmtRef = useRef(props.fmt);
  fmtRef.current = props.fmt;
  useEffect(() => {
    if (reducedMotion()) {
      setV(props.to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 900);
      setV(props.to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [props.to]);
  return <>{fmtRef.current(v)}</>;
}

const fmtClock = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** שעון-חי מתקתק (clockchip) — מתעדכן לבד, בלי לרנדר את כל המסך. */
export function LiveClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="h-clockchip">
      <span className="h-dot" />
      <span>{fmtClock.format(now)}</span>
    </span>
  );
}
