/**
 * שער פתיחת יום — מודאל רך שמופיע פעם ביום (localStorage 'maor_day'):
 * ברכת בוקר עם התאריך העברי והלועזי, קביעת שעת סיום היום ('maor_dayend' —
 * הגיבוי האוטומטי ב-App קורא אותה), פתיחת יום או קפיצה לשחזור מגיבוי.
 * מוצג רק כשיש נתונים (db.families.length > 0) — מערכת ריקה לא זקוקה לטקס.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn } from '../ui';

const DAY_KEY = 'maor_day';
const DAY_END_KEY = 'maor_dayend';

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DayGate() {
  const famCount = useApp((s) => s.db.families.length);
  const config = useApp((s) => s.config);
  const go = useApp((s) => s.go);

  /** init → open (פעם אחת) → closed; closed לא נפתח שוב בסשן הזה. */
  const [phase, setPhase] = useState<'init' | 'open' | 'closed'>('init');
  const [endTime, setEndTime] = useState('17:00');

  useEffect(() => {
    if (phase !== 'init' || famCount === 0) return;
    try {
      if (localStorage.getItem(DAY_KEY) === isoToday()) {
        setPhase('closed');
        return;
      }
      setEndTime(localStorage.getItem(DAY_END_KEY) || '17:00');
      setPhase('open');
    } catch {
      setPhase('closed'); // localStorage חסום — בלי שער
    }
  }, [phase, famCount]);

  // הפיצ'ר core.daygate כבוי — בלי טקס פתיחת יום (אחרי ה-hooks, לפי חוקי React)
  if (!featureOn(config, 'core.daygate')) return null;
  if (phase !== 'open') return null;

  const today = isoToday();
  const gregorian = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function changeEnd(v: string) {
    setEndTime(v);
    try {
      localStorage.setItem(DAY_END_KEY, v);
    } catch {
      /* localStorage חסום — יחזיק עד רענון */
    }
  }

  function openDay() {
    try {
      localStorage.setItem(DAY_KEY, today);
    } catch {
      /* localStorage חסום */
    }
    setPhase('closed');
  }

  function toRestore() {
    // בלי חותמת — השער יחזור בטעינה הבאה אם היום עדיין לא נפתח
    setPhase('closed');
    go('settings');
  }

  return (
    <div className="modal-back" style={{ background: 'var(--overlay-soft)', alignItems: 'center' }} role="presentation">
      <div className="modal" style={{ maxWidth: 460, textAlign: 'center' }} role="dialog" aria-label="פתיחת יום עבודה">
        <div style={{ fontSize: 42, lineHeight: 1.2 }} aria-hidden>
          ☀️
        </div>
        <h2 style={{ fontSize: 21, margin: '4px 0 10px' }}>בוקר טוב! פתיחת יום עבודה</h2>
        <p style={{ fontWeight: 700, fontSize: 16 }}>{hebDateFull(today)}</p>
        <p style={{ color: 'var(--ink-faint)', fontSize: 13.5, marginBottom: 16 }}>{gregorian}</p>

        <div className="field" style={{ maxWidth: 230, margin: '0 auto 4px', textAlign: 'right' }}>
          <label>שעת סיום יום העבודה</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => changeEnd(e.target.value)}
            aria-label="שעת סיום יום העבודה"
          />
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 14 }}>
          אחרי שעה זו יירד קובץ גיבוי אוטומטי — פעם ביום.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn kind="primary" onClick={openDay}>
            פתיחת יום ☀️
          </Btn>
          <Btn onClick={toRestore}>שחזור מגיבוי…</Btn>
        </div>
      </div>
    </div>
  );
}
