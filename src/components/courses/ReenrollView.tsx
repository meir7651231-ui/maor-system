/**
 * 🗓 מסך "רישום" — רישום-לשנה-הבאה (courses.reenroll)
 * ------------------------------------------------------------------
 * מסך חדש (opt-in מפורש, מכובה כברירת-מחדל) שבו מנהל-העבודה רואה לכל תלמיד/ה
 * מה היה בחוג אשתקד (נוכחות/חיסורים/יתרה/סטטוס), מחליט המשך (ממשיך/בהמתנה/עוזב),
 * ורושם לשנה הבאה — שיבוץ חדש בחוג של השנה הבאה, ששומר את ההיסטוריה (החוג הישן
 * לא נגע). כל הכבידה במנוע-הטהור `reenroll-lib.ts`; כאן רק חיווט + חייגן (FAB).
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Btn, Empty, PageHead, Select, TextInput } from '../ui';
import { downloadCsv } from '../../lib/csvx';
import { guardExport } from '../../lib/exportGate';
import type { Cell } from '../../lib/csvx';
import {
  academicYearLabel,
  buildReenrollRows,
  reenrollCounts,
  reenrollCsvRows,
  reenrollListText,
  renewTargets,
  type ReenrollRow,
} from './reenroll-lib';
import { HistoryModal, RegisterModal } from './ReenrollModals';

const DEC_META: Record<string, { label: string; bg: string; c: string }> = {
  yes: { label: '✅ ממשיך', bg: '#e3f5e8', c: '#2f7d52' },
  hold: { label: '⏸ בהמתנה', bg: '#fdf1d6', c: '#a5651a' },
  no: { label: '✖ עוזב', bg: '#fbe6e2', c: '#b04530' },
};

export default function ReenrollView() {
  const db = useApp((s) => s.db);
  const cfg = useApp((s) => s.config);
  const go = useApp((s) => s.go);
  const setRenewDecision = useApp((s) => s.setRenewDecision);
  const bulkReenrollCourse = useApp((s) => s.bulkReenrollCourse);

  const reenrollOn = cfg?.features?.['courses.reenroll'] === true;
  const bulkOn = reenrollOn && featureOn(cfg, 'courses.reenroll.bulk');
  const exportOn = featureOn(cfg, 'core.export');

  const [courseId, setCourseId] = useState('');
  const [decision, setDecision] = useState('');
  const [q, setQ] = useState('');
  const [dial, setDial] = useState(false);
  const [msg, setMsg] = useState('');
  // מודאלים: רישום פרטני (בחירת חוג-יעד+קבוצה) והיסטוריית-תלמיד.
  const [regRow, setRegRow] = useState<ReenrollRow | null>(null);
  const [histRow, setHistRow] = useState<ReenrollRow | null>(null);

  const studentW = termOf(cfg, 'entity.student', 'תלמיד/ה');
  const courseW = termOf(cfg, 'entity.course', 'חוג');

  const rows = useMemo(
    () =>
      buildReenrollRows(db, {
        courseId: courseId || undefined,
        decision: (decision as ReenrollRow['decision'] | 'undecided') || undefined,
        q,
      }),
    [db, courseId, decision, q],
  );
  const counts = useMemo(() => reenrollCounts(rows), [rows]);

  // כל שורות-הרישום (בלי סינון) — לחישוב אפשרויות בורר-החוג + יעדי-בַּאלק.
  const allRows = useMemo(() => buildReenrollRows(db), [db]);
  const courseOpts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of allRows) if (r.course && !seen.has(r.course.id)) seen.set(r.course.id, r.courseName);
    return [{ value: '', label: 'כל ה' + termOf(cfg, 'nav.courses', 'חוגים') }, ...[...seen].map(([value, label]) => ({ value, label }))];
  }, [allRows, cfg]);

  function flash(t: string) {
    setMsg(t);
    window.setTimeout(() => setMsg(''), 2600);
  }

  if (!reenrollOn) {
    return (
      <div>
        <PageHead title="רישום לשנה הבאה" actions={<Btn onClick={() => go('courses')}>→ חזרה ל{termOf(cfg, 'nav.courses', 'חוגים')}</Btn>} />
        <Empty>הפיצ'ר כבוי. הפעילו את «רישום לשנה הבאה» באשף ההקמה כדי להשתמש במסך.</Empty>
      </div>
    );
  }

  // ----- פעולה: רישום שיבוץ יחיד — פותח מודאל לבחירת חוג-יעד + קבוצה -----
  function doReenroll(row: ReenrollRow) {
    if (row.renewed) return;
    setRegRow(row);
  }

  // ----- חייגן: רישום המוני (לפי החוג שבסינון, או כל החוגים) -----
  function doBulk() {
    const targets = renewTargets(rows);
    if (targets.length === 0) return flash('אין "ממשיך" שטרם נרשם');
    const byCourse = new Set(targets.map((r) => r.e.courseId));
    let created = 0;
    for (const cId of byCourse) created += bulkReenrollCourse(cId).created;
    flash(`נרשמו ${created} לשנה הבאה 🚀`);
    setDial(false);
  }
  function markAll(dec: 'yes' | 'hold' | 'no' | '') {
    for (const r of rows) if (!r.renewed) setRenewDecision(r.e.id, dec);
    flash(dec === '' ? 'ההחלטות אופסו' : `סומנו ${rows.filter((r) => !r.renewed).length}`);
    setDial(false);
  }
  function doExport() {
    if (!guardExport()) return;
    downloadCsv('reenroll-' + academicYearLabel(new Date().toISOString().slice(0, 10)) + '.csv', reenrollCsvRows(rows) as Cell[][]);
    setDial(false);
  }
  function doCopy() {
    if (!guardExport()) return;
    navigator.clipboard?.writeText(reenrollListText(rows)).then(() => flash('הועתק ללוח 📋'), () => flash('העתקה נכשלה'));
    setDial(false);
  }

  // ⚠️ שינוי-מודל 24.8: הכפתור "🗓 פתיחת שנה הבאה" (שפתח חוג מוחשל) הוסר —
  // הרישום הפרטני/ההמוני יוצר עכשיו שיבוץ **על אותו החוג** עם תווית שנה חדשה.
  const dialActions: { key: string; label: string; on: boolean; run: () => void }[] = [
    { key: 'bulk', label: '🚀 רישום כל הממשיכים', on: bulkOn, run: doBulk },
    { key: 'allyes', label: '✅ סמן הכל «ממשיך»', on: true, run: () => markAll('yes') },
    { key: 'reset', label: '🔄 איפוס החלטות', on: true, run: () => markAll('') },
    { key: 'csv', label: '⬇ ייצוא CSV', on: exportOn, run: doExport },
    { key: 'copy', label: '📋 העתקת רשימה', on: exportOn, run: doCopy },
  ].filter((a) => a.on);

  return (
    <div>
      <PageHead
        title={'רישום לשנה הבאה'}
        sub={`${counts.total} ${studentW} · ${counts.yes} ממשיכים · ${counts.undecided} טרם הוחלט · ${counts.renewed} נרשמו`}
        actions={<Btn onClick={() => go('courses')}>→ חזרה ל{termOf(cfg, 'nav.courses', 'חוגים')}</Btn>}
      />

      {/* מוני-התקדמות */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {(
          [
            ['הכל', counts.total, '#eef0f2', '#444'],
            ['✅ ממשיך', counts.yes, DEC_META.yes.bg, DEC_META.yes.c],
            ['⏸ בהמתנה', counts.hold, DEC_META.hold.bg, DEC_META.hold.c],
            ['✖ עוזב', counts.no, DEC_META.no.bg, DEC_META.no.c],
            ['טרם הוחלט', counts.undecided, '#fff3e0', '#8a5a12'],
            ['✓ נרשמו', counts.renewed, '#e6f0ff', '#2a5cad'],
          ] as [string, number, string, string][]
        ).map(([label, n, bg, c]) => (
          <span key={label} style={{ background: bg, color: c, borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: 700 }}>
            {label}: {n}
          </span>
        ))}
      </div>

      {/* סינון */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        <div style={{ minWidth: 200 }}>
          <Select value={courseId} onChange={setCourseId} options={courseOpts} />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select
            value={decision}
            onChange={setDecision}
            options={[
              { value: '', label: 'כל ההחלטות' },
              { value: 'undecided', label: 'טרם הוחלט' },
              { value: 'yes', label: '✅ ממשיך' },
              { value: 'hold', label: '⏸ בהמתנה' },
              { value: 'no', label: '✖ עוזב' },
            ]}
          />
        </div>
        <div style={{ minWidth: 200, flex: 1 }}>
          <TextInput value={q} onChange={setQ} placeholder={`חיפוש ${studentW} / משפחה / ${courseW}…`} ariaLabel="חיפוש" />
        </div>
      </div>

      {msg && (
        <div style={{ marginTop: 10, background: '#eef7ff', border: '1px solid #cfe3f7', color: '#2a5cad', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 13 }}>{msg}</div>
      )}

      {/* טבלת הרישום */}
      {rows.length === 0 ? (
        <div style={{ marginTop: 14 }}>
          <Empty>אין {studentW} שתואמים את הסינון.</Empty>
        </div>
      ) : (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'right', color: '#6f665a', fontSize: 12 }}>
                <th style={thS}>{studentW}</th>
                <th style={thS}>{courseW}</th>
                <th style={thS}>מה היה אשתקד</th>
                <th style={thS}>הערה</th>
                <th style={thS}>החלטה</th>
                <th style={thS}>לשנה הבאה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.e.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>{r.memberName || '—'}</span>
                      <button
                        type="button"
                        title={'היסטוריה מלאה של ' + (r.memberName || studentW) + ' — איפה השתתף/ה ומתי'}
                        aria-label={'היסטוריה של ' + r.memberName}
                        onClick={() => setHistRow(r)}
                        style={{ cursor: 'pointer', border: 0, background: 'transparent', fontSize: 14, padding: 0 }}
                      >
                        🕘
                      </button>
                    </div>
                    <div style={{ color: '#8a8378', fontSize: 11.5 }}>{r.familyName}</div>
                  </td>
                  <td style={tdS}>{r.courseName || '—'}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span title="נוכחויות">👥 {r.summary.presents}</span>
                      <span title="חיסורים">✖ {r.summary.absences}</span>
                      {r.summary.balance > 0 && <span style={{ color: '#b04530' }} title="יתרת חוב">₪{r.summary.balance}</span>}
                      <span style={{ color: '#8a8378' }}>{r.summary.statusLabel}</span>
                    </div>
                  </td>
                  <td style={{ ...tdS, minWidth: 160 }}>
                    <TextInput
                      value={r.e.renewNote ?? ''}
                      onChange={(v) => setRenewDecision(r.e.id, r.decision, v)}
                      placeholder="הערה…"
                      ariaLabel={'הערה ל' + r.memberName}
                    />
                  </td>
                  <td style={tdS}>
                    <div style={{ display: 'inline-flex', gap: 4 }}>
                      {(['yes', 'hold', 'no'] as const).map((d) => {
                        const active = r.decision === d;
                        const m = DEC_META[d];
                        return (
                          <button
                            key={d}
                            type="button"
                            title={m.label}
                            onClick={() => setRenewDecision(r.e.id, active ? '' : d, r.e.renewNote)}
                            style={{
                              cursor: 'pointer',
                              border: active ? `1px solid ${m.c}` : '1px solid #ddd',
                              background: active ? m.bg : '#fff',
                              color: active ? m.c : '#999',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {m.label.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td style={tdS}>
                    {r.renewed ? (
                      <span style={{ color: '#2f7d52', fontWeight: 700 }}>✓ נרשם</span>
                    ) : (
                      <Btn sm onClick={() => doReenroll(r)} disabled={r.decision === 'no'} title={r.decision === 'no' ? 'סומן «עוזב»' : 'רישום לשנה הבאה'}>
                        רישום ←
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== החייגן (FAB) — כל היכולות ===== */}
      {dial && <div onClick={() => setDial(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />}
      <div style={{ position: 'fixed', insetInlineStart: 20, bottom: 20, zIndex: 41, display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-start', gap: 10 }}>
        {dial &&
          dialActions.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={a.run}
              style={{
                cursor: 'pointer',
                border: '1px solid var(--line, #e2ddd2)',
                background: 'var(--panel, #fff)',
                color: 'var(--ink, #241f18)',
                borderRadius: 999,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 6px 18px rgba(0,0,0,.15)',
                whiteSpace: 'nowrap',
              }}
            >
              {a.label}
            </button>
          ))}
        <button
          type="button"
          aria-label="חייגן פעולות רישום"
          onClick={() => setDial((v) => !v)}
          style={{
            cursor: 'pointer',
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: 0,
            background: 'linear-gradient(140deg, var(--accent, #f3c76b), var(--accent-deep, #d9a84e))',
            color: '#241a08',
            fontSize: 26,
            fontWeight: 900,
            boxShadow: '0 8px 24px rgba(0,0,0,.28)',
            transition: 'transform .2s',
            transform: dial ? 'rotate(45deg)' : 'none',
          }}
        >
          {dial ? '×' : '☎'}
        </button>
      </div>

      {regRow && (
        <RegisterModal
          enrollment={regRow.e}
          onClose={() => setRegRow(null)}
          onDone={(m) => flash(m)}
        />
      )}
      {histRow && <HistoryModal memberId={histRow.e.memberId} memberName={histRow.memberName} onClose={() => setHistRow(null)} />}
    </div>
  );
}

const thS: CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #e6ddce', fontWeight: 700, whiteSpace: 'nowrap' };
const tdS: CSSProperties = { padding: '8px', verticalAlign: 'top' };
