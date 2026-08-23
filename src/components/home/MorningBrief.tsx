/**
 * 🌅 תדרוך-הבוקר (VISION-LIGHT ‏#29) — כרטיס "הבוקר שלך" בראש מסך-הבית:
 * כל התורים במבט-אחד + קפיצה-למסך + 🔊 הקראה עברית (speechSynthesis —
 * עובד אופליין, אפס-שרת; נופל-רך כשאין תמיכה). ‏opt-in ‏home.morningbrief.
 * קריאה-בלבד — אפס-כתיבה ל-DB.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp, type View } from '../../store/useApp';
import { hebDateFull } from '../../lib/hebrew';
import { isoToday } from '../../lib/date-util';
import { Btn } from '../ui';
import { briefSpeechText, morningBrief } from './morningBrief';

export function MorningBriefCard() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const go = useApp((s) => s.go);
  const toast = useApp((s) => s.toast);
  const [speaking, setSpeaking] = useState(false);

  const today = isoToday();
  const brief = useMemo(() => morningBrief(db, config, today, new Date(), db.usdRate), [db, config, today]);
  const orgName = config.orgName || db.orgName || 'הארגון';

  // ניקוי-הקראה ביציאה — לא משאירים קול מדבר אחרי שהמסך התחלף
  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch { /* אין תמיכה */ }
  }, []);

  const speak = () => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return toast('🔊 הדפדפן הזה לא תומך בהקראה');
      if (speaking) {
        synth.cancel();
        setSpeaking(false);
        return;
      }
      const u = new SpeechSynthesisUtterance(briefSpeechText(orgName, brief));
      u.lang = 'he-IL';
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      synth.cancel();
      synth.speak(u);
      setSpeaking(true);
    } catch {
      toast('🔊 ההקראה נכשלה בדפדפן הזה');
    }
  };

  return (
    <section className="card" style={{ border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>🌅 הבוקר שלך</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{hebDateFull(today)}</span>
        <span style={{ marginInlineStart: 'auto' }}>
          <Btn sm onClick={speak} title="הקראת-התדרוך בקול (בלי שמות — צנעה)">
            {speaking ? '⏹ עצירה' : '🔊 הקראה'}
          </Btn>
        </span>
      </div>
      {brief.empty ? (
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>✨ בוקר נקי — אין משימות פתוחות להיום.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
          {brief.sections.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(s.view as View)}
              title={'מעבר למסך המטפל — ' + s.title}
              style={{ textAlign: 'start', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', background: 'var(--panel, transparent)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>
                {s.icon} {s.title} · <span style={{ color: 'var(--accent-deep, #a05008)' }}>{s.count}</span>
              </span>
              {s.top.map((t, i) => (
                <span key={i} style={{ fontSize: 12, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t}
                </span>
              ))}
              {s.count > s.top.length && (
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>ועוד {s.count - s.top.length}…</span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
