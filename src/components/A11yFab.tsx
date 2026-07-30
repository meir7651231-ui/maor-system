/**
 * ♿ FAB נגישות צף — נגיש מכל מסך (P2 פער 31, legacy-markup:2919-2942).
 * אותו מנוע כמו הגדרות ← נגישות (a11yApply משותף): זום 0.8–1.6 בצעדי 0.1
 * (א− / % / א+) + 4 מתגי הלגאסי + איפוס. הניסוחים מילה-במילה מהקובץ החי.
 * גייט: shell.a11yfab.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../store/useApp';
import { A11Y_FAB_TOGGLES, stepScale, type AccPrefs } from '../lib/a11y';
import { applyAcc, applyScale, persistAcc, persistScale, readAcc, readScale } from './settings/a11yApply';

export function A11yFab() {
  const toast = useApp((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState<number>(readScale);
  const [acc, setAcc] = useState<AccPrefs>(readAcc);

  // רענון מה-localStorage בכל פתיחה — אם שונה במסך ההגדרות בינתיים
  useEffect(() => {
    if (open) {
      setScale(readScale());
      setAcc(readAcc());
    }
  }, [open]);

  // Esc סוגר את הפאנל
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function setScaleAll(v: number) {
    setScale(v);
    applyScale(v);
    persistScale(v);
  }

  function toggle(key: keyof AccPrefs) {
    const next = { ...acc, [key]: !acc[key] };
    setAcc(next);
    applyAcc(next);
    persistAcc(next);
  }

  function resetAll() {
    setScaleAll(1);
    const off: AccPrefs = { contrast: false, noanim: false, links: false, spacing: false };
    setAcc(off);
    applyAcc(off);
    persistAcc(off);
    toast('הגדרות הנגישות אופסו');
  }

  const btnBase = {
    border: '1px solid var(--line)',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 800,
  } as const;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="נגישות — גודל טקסט, ניגודיות, אנימציות"
        aria-label="הגדרות נגישות"
        aria-expanded={open}
        style={{
          // בלגאסי הכפתור בפינה הנגדית לטוסטים; ב-React הטוסטים ב-inline-start,
          // לכן ה-FAB ב-inline-end — אותה הפרדת פינות
          position: 'fixed',
          bottom: 26,
          insetInlineEnd: 26,
          zIndex: 85,
          width: 56,
          height: 56,
          borderRadius: 99,
          border: '2px solid #fff',
          background: '#1d4ed8',
          color: '#fff',
          fontSize: 26,
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(29,78,216,.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ♿
      </button>
      {open && (
        <div
          dir="rtl"
          role="dialog"
          aria-label="הגדרות נגישות"
          style={{
            position: 'fixed',
            bottom: 94,
            insetInlineEnd: 26,
            zIndex: 85,
            width: 340,
            maxWidth: '92vw',
            background: 'var(--paper, #fff)',
            border: '1px solid var(--line)',
            borderRadius: 18,
            boxShadow: '0 30px 70px rgba(33,29,23,.3)',
            padding: '18px 18px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>♿ הגדרות נגישות</div>
            <button
              onClick={() => setOpen(false)}
              aria-label="סגירה"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 14 }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-faint)', marginBottom: 6 }}>גודל אותיות</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setScaleAll(stepScale(scale, -1))} style={{ ...btnBase, flex: 1, padding: 10, fontSize: 16, background: 'var(--paper, #fff)' }}>
              א−
            </button>
            <button
              onClick={() => setScaleAll(1)}
              title="איפוס גודל"
              style={{ ...btnBase, minWidth: 64, padding: '10px 6px', fontSize: 14, background: 'var(--paper-soft, #faf7f0)' }}
            >
              {Math.round(scale * 100) + '%'}
            </button>
            <button onClick={() => setScaleAll(stepScale(scale, 1))} style={{ ...btnBase, flex: 1, padding: 10, fontSize: 19, background: 'var(--paper, #fff)' }}>
              א+
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {A11Y_FAB_TOGGLES.map(([key, label]) => {
              const on = acc[key];
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  aria-pressed={on}
                  style={{
                    ...btnBase,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '11px 14px',
                    borderRadius: 11,
                    fontSize: 13.5,
                    fontWeight: 700,
                    textAlign: 'right',
                    background: on ? 'var(--ink, #211d17)' : 'var(--paper, #fff)',
                    color: on ? 'var(--gold, #f3c76b)' : 'var(--ink, #211d17)',
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontWeight: 900 }}>{on ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={resetAll}
            style={{
              width: '100%',
              marginTop: 12,
              padding: 9,
              border: '1px solid #f5c9c9',
              background: 'var(--paper, #fff)',
              color: '#b91c1c',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            איפוס כל הגדרות הנגישות
          </button>
          <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 8, textAlign: 'center' }}>
            הבחירות נשמרות אישית בדפדפן זה
          </div>
        </div>
      )}
    </>
  );
}
