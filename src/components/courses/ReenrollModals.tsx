/**
 * מודאלי רישום-לשנה-הבאה — משותפים למסך "רישום" ולכרטיס-המשפחה (courses.reenroll).
 * ------------------------------------------------------------------
 *  · RegisterModal — אישור-רישום לתלמיד/ה עם בחירת-קבוצה; הרישום נעשה על אותו
 *    החוג (שינוי-מודל 24.8: לא מוקם חוג-שנה-הבאה — הבידול דרך `year` על השיבוץ).
 *  · HistoryModal  — היסטוריית-התלמיד/ה המלאה (איפה השתתף/ה ומתי, חוצה-חוגים/שנים).
 * כל הלוגיקה במנוע-הטהור reenroll-lib; כאן חיווט + בחירה בלבד.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Btn, Empty, Modal, Select } from '../ui';
import { groupOptionsOf } from './lib';
import { nextAcademicYearLabel, studentHistory } from './reenroll-lib';
import type { Enrollment } from '../../types/domain';

/** ISO קצר "DD.MM.YY" לתצוגה עברית. */
function shortDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}.${m}.${y.slice(2)}` : iso;
}

/**
 * מודאל-רישום פר-שיבוץ (שינוי-מודל 24.8): הרישום יוצר שיבוץ חדש **על אותו החוג**
 * עם תווית שנה הבאה (תשפ״ז/תשפ״ח) — בלי שכפול-חוגים. המשתמש/ת בוחר/ת רק קבוצה.
 * ההערה על התלמיד/ה עוברת קדימה אוטומטית (`note` ב-`freshNextYearEnrollment`).
 */
export function RegisterModal(props: { enrollment: Enrollment; onClose: () => void; onDone?: (msg: string) => void }) {
  const db = useApp((s) => s.db);
  const cfg = useApp((s) => s.config);
  const reenrollEnrollment = useApp((s) => s.reenrollEnrollment);

  const src = props.enrollment;
  const srcCourse = db.courses.find((c) => c.id === src.courseId) ?? null;
  const studentW = termOf(cfg, 'entity.student', 'תלמיד/ה');
  const member = useMemo(() => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === src.memberId);
      if (m) return m;
    }
    return null;
  }, [db.families, src.memberId]);

  const [group, setGroup] = useState(src.group || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const groupOpts = useMemo(() => {
    const gs = srcCourse ? groupOptionsOf(srcCourse) : [];
    return [{ value: '', label: 'ללא שיוך' }, ...gs.map((g) => ({ value: g.v, label: g.t }))];
  }, [srcCourse]);

  const nextYearLabel = srcCourse ? nextAcademicYearLabel(srcCourse.start) : '';

  function doRegister() {
    setBusy(true);
    setErr('');
    // targetCourseId ריק ⇒ store משתמש בחוג-המקור עצמו (אותו החוג, תווית-שנה חדשה).
    const r = reenrollEnrollment(src.id, '', group);
    setBusy(false);
    if (!r.ok) return setErr('הרישום נחסם — שער-תפוסה מלא, או שכבר נרשם/ה');
    props.onDone?.(`✓ ${member?.first || studentW} נרשם/ה ל${nextYearLabel || 'שנה הבאה'}`);
    props.onClose();
  }

  return (
    <Modal title={`רישום ${nextYearLabel ? 'ל' + nextYearLabel + ' ' : 'לשנה הבאה — '}${member?.first || studentW}`} onClose={props.onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-faint, #8a8378)' }}>
          «{srcCourse?.name ?? '—'}»{src.group ? ` · קבוצה: ${src.group}` : ''}
          {nextYearLabel && (
            <span style={{ marginInlineStart: 8, background: '#e6f0ff', color: '#2a5cad', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>
              {nextYearLabel}
            </span>
          )}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 700 }}>
          קבוצה
          <Select value={group} onChange={setGroup} options={groupOpts} />
        </label>

        {src.note && (
          <div style={{ fontSize: 12, color: 'var(--ink-faint, #8a8378)' }}>
            📝 ההערה על ה{studentW} תעבור לשנה הבאה: «{src.note}»
          </div>
        )}

        {err && (
          <div role="alert" style={{ background: '#fbe6e2', color: '#b04530', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>{err}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
          <Btn kind="primary" onClick={doRegister} disabled={busy}>
            {busy ? '…רושם' : `✓ רשום/י ל${nextYearLabel || 'שנה הבאה'}`}
          </Btn>
          <Btn onClick={props.onClose}>ביטול</Btn>
        </div>
      </div>
    </Modal>
  );
}

/** מודאל-היסטוריה: כל ההשתתפויות של התלמיד/ה לאורך השנים והחוגים. */
export function HistoryModal(props: { memberId: string; memberName?: string; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const cfg = useApp((s) => s.config);
  const entries = useMemo(() => studentHistory(db, props.memberId), [db, props.memberId]);
  const studentW = termOf(cfg, 'entity.student', 'תלמיד/ה');

  return (
    <Modal title={`היסטוריה — ${props.memberName || studentW}`} onClose={props.onClose} wide>
      {entries.length === 0 ? (
        <Empty>אין השתתפויות רשומות ל{studentW} זה/זו.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((h) => (
            <div
              key={h.enrollment.id}
              style={{
                border: '1px solid var(--line, #e6ddce)',
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {h.yearLabel && (
                <span style={{ background: '#e6f0ff', color: '#2a5cad', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 800 }}>{h.yearLabel}</span>
              )}
              <span style={{ fontWeight: 800 }}>{h.courseName}</span>
              {h.group && <span style={{ color: 'var(--ink-faint, #8a8378)', fontSize: 12.5 }}>· {h.group}</span>}
              {(h.start || h.end) && (
                <span style={{ color: 'var(--ink-faint, #8a8378)', fontSize: 12 }}>
                  {shortDate(h.start)}{h.end ? '–' + shortDate(h.end) : ''}
                </span>
              )}
              <span style={{ flex: 1 }} />
              <span title="נוכחויות" style={{ fontSize: 13 }}>👥 {h.summary.presents}</span>
              <span title="חיסורים" style={{ fontSize: 13 }}>✖ {h.summary.absences}</span>
              {h.summary.balance > 0 && <span style={{ color: '#b04530', fontSize: 13 }} title="יתרת חוב">₪{h.summary.balance}</span>}
              <span style={{ color: 'var(--ink-faint, #8a8378)', fontSize: 12.5 }}>{h.summary.statusLabel}</span>
              {h.fromRenewal && <span title="נולד מרישום-לשנה-הבאה" style={{ fontSize: 12 }}>🗓</span>}
              {h.renewedForward && <span title="חודש לשנה הבאה" style={{ fontSize: 12, color: '#2f7d52', fontWeight: 700 }}>חודש ↺</span>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
