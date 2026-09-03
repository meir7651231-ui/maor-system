/**
 * ▶ "פעולה אחת עכשיו" (VISION-LIGHT ‏#16, 23.8.2026, חבילת-הפשטות) —
 * מסך-מלא שמציג **משימה אחת בכל רגע** מתוך תור-הקוקפיט הקיים (cockpitQueue —
 * שיחות/תודות/הו"ק עם סיבה), במקום 60 הפקדים של מסך-הנתונים: כרטיס-משימה
 * גדול + ✓ בוצע / ⏭ דלג / 👁 כרטיס — והמערכת מתקדמת לבאה.
 *
 * ⚠️ ‏opt-in מפורש `supporters.oneflow === true` (במכוון לא featureOn —
 * חסר-דגל = דורמנטי, הלקוח-החי ביט-זהה). קריאה-בלבד: אפס-כתיבה ל-DB —
 * בוצע/דלג הם מצב-סשן (כמו doneIds בקוקפיט); רישום-כסף נשאר בכרטיס/חייגן.
 */
import { useEffect, useState } from 'react';
import type { Supporter } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { integrationOn } from '../../lib/config';
import { cockpitQueue, type CockpitTask } from './cockpit';
import { isoToday } from './lib';
import { Btn } from '../ui';
import { WaBtn } from '../WaBtn';

const SEV_LABEL: Record<CockpitTask['severity'], { label: string; bg: string; c: string }> = {
  risk: { label: 'בסיכון', bg: '#fde8e8', c: '#b42318' },
  due: { label: 'להיום', bg: '#fdf0e1', c: '#b45309' },
  warm: { label: 'חם', bg: '#e8f6ec', c: '#1f7a3f' },
};

const KIND_ICON: Record<CockpitTask['kind'], string> = { call: '📞', thanks: '💛', hok: '🔁' };

export function OneFlow(props: {
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  /** פתיחת כרטיס-התורם (סוגרת את הזרימה — חוזרים אליה מהכפתור). */
  onOpen: (supId: string) => void;
  onClose: () => void;
}) {
  const today = isoToday();
  const queue = cockpitQueue(props.supporters, today, props.usdRate || 3.7, props.config);
  const all: CockpitTask[] = [...queue.calls, ...queue.thanks, ...queue.hok];
  // בוצע/דלג = מצב-סשן בלבד (אפס-כתיבה ל-DB); "דלג" חוזר לסוף — כמו בחייגן
  const [handled, setHandled] = useState<ReadonlySet<string>>(new Set<string>());
  const [skipped, setSkipped] = useState<readonly string[]>([]);
  const fresh = all.filter((t) => !handled.has(t.id) && !skipped.includes(t.id));
  const deferred = skipped.map((id) => all.find((t) => t.id === id)).filter((t): t is CockpitTask => !!t && !handled.has(t.id));
  const cur = fresh[0] ?? deferred[0] ?? null;
  const doneCount = all.length - fresh.length - deferred.length;

  const done = () => {
    if (cur) setHandled((p) => new Set(p).add(cur.id));
  };
  const skip = () => {
    if (cur) setSkipped((p) => (p.includes(cur.id) ? p : [...p, cur.id]));
  };

  // ⌨️ 1=בוצע · 2=דלג · Escape=יציאה — קמפיין בלי עכבר (דפוס-החייגן)
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (e.key === 'Escape') props.onClose();
      else if (e.key === '1' && cur) done();
      else if (e.key === '2' && cur) skip();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);

  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 100;

  return (
    <div
      role="dialog"
      aria-label="פעולה אחת עכשיו"
      style={{ position: 'fixed', inset: 0, zIndex: 260, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', overflowY: 'auto' }}
    >
      {/* התקדמות */}
      <div style={{ width: 'min(560px, 100%)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>▶ פעולה אחת עכשיו</span>
          <Btn sm onClick={props.onClose} title="חזרה למסך התורמים — מקש Escape">✕ יציאה</Btn>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-faint)' }}>
          <span>{doneCount} / {all.length} טופלו</span>
          {deferred.length > 0 && <span>⏭ {deferred.length} נדחו לסוף</span>}
        </div>
        <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: 'var(--accent)', transition: 'width .2s' }} />
        </div>
      </div>

      {cur ? (
        <div
          className="card"
          style={{ width: 'min(560px, 100%)', marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14, padding: 22, border: '1px solid var(--accent)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30 }} aria-hidden>{KIND_ICON[cur.kind]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.15 }}>{cur.name || 'ללא שם'}</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 3 }}>{cur.reason}</div>
            </div>
            <span style={{ flex: 'none', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '4px 12px', background: SEV_LABEL[cur.severity].bg, color: SEV_LABEL[cur.severity].c }}>
              {SEV_LABEL[cur.severity].label}
            </span>
          </div>
          {cur.phone && <div style={{ fontSize: 13, color: 'var(--ink-faint)' }} dir="ltr">{cur.phone}</div>}

          {/* פעולות-ההקשר — אותם כלים כמו בשורת-הקוקפיט */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {cur.phone.replace(/\D/g, '').length >= 7 && (
              <a href={'tel:' + cur.phone.replace(/\D/g, '')} className="chip" style={{ textDecoration: 'none' }} title={'חיוג ל' + cur.name}>
                📞 חיוג
              </a>
            )}
            {cur.phone && integrationOn(props.config, 'whatsapp') && <WaBtn phone={cur.phone} title={'וואטסאפ ל' + cur.name} />}
            <Btn sm onClick={() => props.onOpen(cur.supId)} title="פתיחת הכרטיס המלא (רישום-תרומה נעשה שם)">
              👁 לכרטיס
            </Btn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Btn kind="primary" onClick={done} title="המשימה טופלה — לבאה. מקש 1">✓ בוצע</Btn>
            <Btn onClick={skip} title="נדחית לסוף-התור. מקש 2">⏭ דלג</Btn>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center' }}>⌨️ ‏1 בוצע · 2 דלג · Esc יציאה</div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <div style={{ fontSize: 40 }} aria-hidden>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
            {all.length === 0 ? 'אין משימות להיום — הכול נקי' : 'כל ' + all.length + ' המשימות טופלו'}
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn kind="primary" onClick={props.onClose}>סגירה</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
