/**
 * הגדרות ← נגישות — גודל טקסט, ניגודיות גבוהה וביטול אנימציות.
 * ההעדפות אישיות לדפדפן זה (localStorage) ואינן חלק מגיבוי הנתונים.
 * הקובץ מיישם את ההעדפות גם בעליית האפליקציה (side-effect בטעינת המודול,
 * שנטען סטטית דרך SettingsView ← App).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn } from '../ui';
import { Section, SectionNote, Toggle } from './lib';

const SCALE_KEY = 'maor_ui_scale';
const ACC_KEY = 'maor_acc';
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.5;

interface AccPrefs {
  contrast: boolean;
  noanim: boolean;
  /** הדגשת כפתורים וקישורים — קו תחתון לקישורים, מסגרת עדינה לכפתורים. */
  links: boolean;
  /** ריווח טקסט מוגדל — אותיות, מילים ושורות. */
  spacing: boolean;
}

function readScale(): number {
  try {
    const v = parseFloat(localStorage.getItem(SCALE_KEY) ?? '1');
    return Number.isFinite(v) && v >= SCALE_MIN && v <= SCALE_MAX ? v : 1;
  } catch {
    return 1;
  }
}

function readAcc(): AccPrefs {
  try {
    const a = JSON.parse(localStorage.getItem(ACC_KEY) ?? '{}') as Partial<AccPrefs> | null;
    return { contrast: !!a?.contrast, noanim: !!a?.noanim, links: !!a?.links, spacing: !!a?.spacing };
  } catch {
    return { contrast: false, noanim: false, links: false, spacing: false };
  }
}

function applyScale(scale: number): void {
  // zoom מגדיל את כל הממשק — כולל רכיבים עם מידות px קבועות, ש-root font-size
  // לא השפיע עליהם (נתמך בכל הדפדפנים המודרניים, כולל Firefox 126+).
  // ההצהרה עדיין לא בכל גרסאות lib.dom — לכן ההרחבה הטיפוסית המקומית.
  (document.body.style as CSSStyleDeclaration & { zoom: string }).zoom = String(scale);
  // ניקוי המנגנון הישן (root font-size) — שלא יוכפל עם ה-zoom
  document.documentElement.style.fontSize = '';
}

function applyAcc(a: AccPrefs): void {
  const el = document.documentElement;
  if (a.contrast) el.setAttribute('data-contrast', 'high');
  else el.removeAttribute('data-contrast');
  if (a.noanim) el.setAttribute('data-noanim', '1');
  else el.removeAttribute('data-noanim');
  if (a.links) el.setAttribute('data-links', '1');
  else el.removeAttribute('data-links');
  if (a.spacing) el.setAttribute('data-spacing', '1');
  else el.removeAttribute('data-spacing');
}

function persistScale(scale: number): void {
  try {
    localStorage.setItem(SCALE_KEY, String(scale));
  } catch {
    /* localStorage חסום — ההעדפה תחזיק עד רענון */
  }
}

function persistAcc(a: AccPrefs): void {
  try {
    localStorage.setItem(ACC_KEY, JSON.stringify(a));
  } catch {
    /* localStorage חסום */
  }
}

// שחזור ההעדפות בעליית האפליקציה — פעם אחת, בטעינת המודול
try {
  applyScale(readScale());
  applyAcc(readAcc());
} catch {
  /* סביבה ללא DOM */
}

export function AccessSection() {
  const toast = useApp((s) => s.toast);
  const [scale, setScale] = useState<number>(readScale);
  const [acc, setAcc] = useState<AccPrefs>(readAcc);

  function changeScale(v: number) {
    const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, v));
    setScale(clamped);
    applyScale(clamped);
    persistScale(clamped);
  }

  function toggle(key: keyof AccPrefs) {
    const next = { ...acc, [key]: !acc[key] };
    setAcc(next);
    applyAcc(next);
    persistAcc(next);
  }

  function resetAllAcc() {
    setScale(1);
    applyScale(1);
    persistScale(1);
    const next: AccPrefs = { contrast: false, noanim: false, links: false, spacing: false };
    setAcc(next);
    applyAcc(next);
    persistAcc(next);
    toast('הגדרות הנגישות אופסו');
  }

  return (
    <Section id="sec-access" title="♿ נגישות" sub="הבחירות נשמרות אישית בדפדפן זה — לא חלק מהגיבוי">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0 14px' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>א−</span>
        <input
          type="range"
          min={SCALE_MIN}
          max={SCALE_MAX}
          step={0.05}
          value={scale}
          aria-label="גודל טקסט"
          onChange={(e) => changeScale(parseFloat(e.target.value))}
          style={{ flex: 1, maxWidth: 320, padding: 0, accentColor: 'var(--amber-deep)' }}
        />
        <span style={{ fontSize: 19, fontWeight: 700 }}>א+</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            minWidth: 48,
            textAlign: 'center',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '3px 6px',
          }}
        >
          {Math.round(scale * 100)}%
        </span>
        <Btn sm onClick={() => changeScale(1)}>
          איפוס גודל
        </Btn>
      </div>

      <Toggle
        on={acc.contrast}
        onToggle={() => toggle('contrast')}
        label="ניגודיות גבוהה"
        desc="רקע לבן וטקסט כהה יותר — לראייה נוחה"
      />
      <Toggle
        on={acc.noanim}
        onToggle={() => toggle('noanim')}
        label="ביטול אנימציות"
        desc="ללא מעברים ותנועה בממשק"
      />
      <Toggle
        on={acc.links}
        onToggle={() => toggle('links')}
        label="הדגשת כפתורים וקישורים"
        desc="קו תחתון לקישורים ומסגרת עדינה סביב כפתורים"
      />
      <Toggle
        on={acc.spacing}
        onToggle={() => toggle('spacing')}
        label="ריווח טקסט מוגדל"
        desc="מרווח גדול יותר בין אותיות, מילים ושורות — לקריאה נוחה"
      />

      <div style={{ marginTop: 14 }}>
        <Btn onClick={resetAllAcc}>איפוס כל הגדרות הנגישות</Btn>
      </div>
      <SectionNote>גודל התצוגה מוחל על כל הממשק — טקסט, כפתורים ורכיבים בגודל קבוע.</SectionNote>
    </Section>
  );
}
