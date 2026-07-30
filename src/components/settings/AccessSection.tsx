/**
 * הגדרות ← נגישות — גודל טקסט, ניגודיות גבוהה וביטול אנימציות.
 * ההעדפות אישיות לדפדפן זה (localStorage) ואינן חלק מגיבוי הנתונים.
 * הלוגיקה הטהורה ב-src/lib/a11y.ts; ההחלה וההתמדה ב-a11yApply.ts (משותפות
 * ל-FAB הצף ♿ — P2 פער 31). הטווח 0.8–1.6 כמו בלגאסי (script:3193-3194).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { clampScale, SCALE_MAX, SCALE_MIN, type AccPrefs } from '../../lib/a11y';
import { applyAcc, applyScale, persistAcc, persistScale, readAcc, readScale } from './a11yApply';
import { Btn } from '../ui';
import { Section, SectionNote, Toggle } from './lib';

export function AccessSection() {
  const toast = useApp((s) => s.toast);
  const [scale, setScale] = useState<number>(readScale);
  const [acc, setAcc] = useState<AccPrefs>(readAcc);

  function changeScale(v: number) {
    const clamped = clampScale(v);
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
