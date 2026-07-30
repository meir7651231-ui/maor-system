/**
 * ▶ מצב הדגמה — שכבת הסיור המודרך (P2 פער 30, הכרעה 4).
 * מנווט למסכים האמיתיים לפי תסריט הלגאסי, מאיר spotlight על העוגן של כל צעד,
 * ומציג את הכיתוב בבועה תחתונה (בסגנון demoCap של הקובץ החי). המשתמש שולט:
 * הבא/הקודם, ו-Esc או ■ עוצרים בכל שלב. גייט: shell.demo.
 * הלוגיקה (צעדים, סינון, גאומטריה) כולה ב-src/lib/tour.ts הטהור.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/useApp';
import { moduleOn } from '../lib/config';
import { spotlightBox, TOUR_STOP_LABEL, tourAdvance, tourSteps, type Rect } from '../lib/tour';

/** איתור אלמנט נראה לפי טקסט — העוגן של הצעד; לא נמצא = כיתוב בלבד. */
function findAnchor(text: string): Rect | null {
  const nodes = document.querySelectorAll<HTMLElement>('button, [role="button"], h2, h3, b, span');
  for (const el of nodes) {
    if (!el.offsetParent) continue;
    if (((el.textContent || '').trim()).includes(text)) {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }
  }
  return null;
}

export function TourOverlay({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const go = useApp((s) => s.go);
  const steps = useMemo(() => tourSteps((m) => moduleOn(config, m)), [config]);
  const [idx, setIdx] = useState(0);
  const [box, setBox] = useState<Rect | null>(null);
  const step = steps[idx];

  const move = useCallback(
    (delta: number) => {
      const next = tourAdvance(idx, delta, steps.length);
      if (next === null) onClose();
      else setIdx(next);
    },
    [idx, steps.length, onClose],
  );

  // ניווט למסך של הצעד + מדידת העוגן אחרי שהמסך התרנדר.
  useEffect(() => {
    if (!step) return;
    go(step.view);
    setBox(null);
    const measure = () => {
      setBox(step.anchorText ? spotlightBox(findAnchor(step.anchorText), window.innerWidth, window.innerHeight) : null);
    };
    const t = setTimeout(measure, 350);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [step, go]);

  // Esc עוצר; חיצים מדפדפים.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') move(1); // RTL: שמאלה = קדימה
      else if (e.key === 'ArrowRight') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, move]);

  if (!step) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, pointerEvents: 'none' }} dir="rtl">
      {/* ההאפלה — עם חור spotlight סביב העוגן (box-shadow ענק, כמו עיגול הלגאסי) */}
      {box ? (
        <div
          style={{
            position: 'absolute',
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            borderRadius: 14,
            border: '3px solid #f3c76b',
            boxShadow: '0 0 0 9999px rgba(33,29,23,.45), 0 0 24px rgba(243,199,107,.85)',
            transition: 'all .4s ease',
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(33,29,23,.45)' }} />
      )}
      {/* בועת הכיתוב — בסגנון demoCap של הלגאסי */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '92vw',
          background: '#211d17',
          color: '#f5f1e8',
          border: '1px solid rgba(243,199,107,.55)',
          borderRadius: 99,
          padding: '13px 28px',
          fontSize: 16.5,
          fontWeight: 800,
          boxShadow: '0 16px 44px rgba(0,0,0,.45)',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <button
          onClick={() => move(-1)}
          disabled={idx === 0}
          aria-label="הצעד הקודם"
          style={{ border: 'none', background: 'transparent', color: '#f3c76b', fontSize: 18, cursor: 'pointer', opacity: idx === 0 ? 0.35 : 1 }}
        >
          ‹
        </button>
        <span>{step.caption}</span>
        <span style={{ fontSize: 12, color: '#a39a8b', fontWeight: 600 }}>
          {idx + 1}/{steps.length}
        </span>
        <button
          onClick={() => move(1)}
          aria-label={idx === steps.length - 1 ? 'סיום הסיור' : 'הצעד הבא'}
          style={{ border: 'none', background: 'transparent', color: '#f3c76b', fontSize: 18, cursor: 'pointer' }}
        >
          {idx === steps.length - 1 ? '✓' : '›'}
        </button>
      </div>
      {/* עצירה — הנוסח מהלגאסי (markup:2956) */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          pointerEvents: 'auto',
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: 99,
          padding: '9px 18px',
          fontSize: 13,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(220,38,38,.4)',
        }}
      >
        {TOUR_STOP_LABEL}
      </button>
    </div>
  );
}
