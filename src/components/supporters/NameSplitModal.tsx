/**
 * 🪪 פיצול שם פרטי/משפחה לכל התורמים הקיימים — תצוגה-מקדימה לפני שמירה (הכרעת-בעלים 13.10).
 * המנוע: nameSplit.ts (טהור). כאן: סינון בטוח/ניחוש/דילוג, חיפוש, עריכה פר-שורה, ⇄ היפוך,
 * סימון מה להחיל, ואישור דו-שלבי. השם-על-הקבלה (`name`) לא משתנה — רק השדות המפוצלים נוספים.
 * למנהל בלבד (גידור אצל הקורא). מוצגות עד ROW_CAP שורות — חיפוש/סינון מצמצמים.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Btn, Chip, Modal, TextInput } from '../ui';
import { planNameSplit, type NameSplitRow, type SplitConf } from './nameSplit';

const ROW_CAP = 300;
const CONF_LABEL: Record<SplitConf, string> = { sure: '✓ בטוח', guess: '? ניחוש', skip: '— דילוג' };
const CONF_COLOR: Record<SplitConf, string> = { sure: 'var(--green)', guess: '#b26a00', skip: 'var(--ink-faint)' };

type Edit = { first: string; last: string; on: boolean };

export function NameSplitModal(props: { onClose: () => void }) {
  const supporters = useApp((s) => s.db.supporters);
  const config = useApp((s) => s.config);
  const applyNameSplit = useApp((s) => s.applyNameSplit);
  const toast = useApp((s) => s.toast);
  // התוכנית מחושבת פעם-אחת בפתיחה (לא מתעדכנת בזמן עריכה — מניעת "קפיצות" בטבלה).
  const [plan] = useState(() => planNameSplit(supporters));
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [show, setShow] = useState<'all' | SplitConf>('guess');
  const [q, setQ] = useState('');
  const [armed, setArmed] = useState(false);

  const cur = (r: NameSplitRow): Edit => edits[r.id] ?? { first: r.first, last: r.last, on: r.conf !== 'skip' };
  const patch = (r: NameSplitRow, p: Partial<Edit>) => {
    setArmed(false);
    setEdits((m) => ({ ...m, [r.id]: { ...cur(r), ...p } }));
  };

  const shown = useMemo(() => {
    const t = q.trim();
    return plan.rows.filter((r) => (show === 'all' || r.conf === show) && (!t || r.name.includes(t)));
  }, [plan, show, q]);

  const chosen = plan.rows.filter((r) => {
    const e = cur(r);
    return e.on && (e.first.trim() || e.last.trim());
  });

  const setAll = (conf: SplitConf, on: boolean) => {
    setArmed(false);
    setEdits((m) => {
      const next = { ...m };
      for (const r of plan.rows) if (r.conf === conf) next[r.id] = { ...(m[r.id] ?? { first: r.first, last: r.last, on: r.conf !== 'skip' }), on };
      return next;
    });
  };

  function apply() {
    if (!armed) {
      setArmed(true);
      return;
    }
    const n = applyNameSplit(chosen.map((r) => ({ id: r.id, first: cur(r).first, last: cur(r).last })));
    toast('🪪 פוצלו ' + n + ' שמות — השם על הקבלה לא השתנה');
    props.onClose();
  }

  const sup = termOf(config, 'nav.supporters', 'תורמים');
  return (
    <Modal title={'🪪 פיצול שם פרטי / שם משפחה — כל ה' + sup} onClose={props.onClose} wide>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>
        {'המערכת מציעה פיצול לכל ' + plan.rows.length + ' ה' + sup + ' שעוד לא פוצלו' + (plan.already ? ' (' + plan.already + ' כבר פוצלו — לא נוגעים)' : '') + '. '}
        <b>השם המלא שעל הקבלה לא משתנה.</b>
        {' עברו על הניחושים, תקנו או הפכו ⇄, ואז החילו.'}
        {plan.majority === 'last-first' && ' (אצלכם רוב השמות רשומים "משפחה פרטי" — הניחושים לפי זה.)'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <Chip on={show === 'guess'} onClick={() => setShow('guess')}>{'? ניחוש · ' + plan.counts.guess}</Chip>
        <Chip on={show === 'sure'} onClick={() => setShow('sure')}>{'✓ בטוח · ' + plan.counts.sure}</Chip>
        <Chip on={show === 'skip'} onClick={() => setShow('skip')}>{'— דילוג · ' + plan.counts.skip}</Chip>
        <Chip on={show === 'all'} onClick={() => setShow('all')}>{'הכול · ' + plan.rows.length}</Chip>
        <div style={{ flex: 1, minWidth: 160 }}>
          <TextInput value={q} onChange={setQ} placeholder="חיפוש שם…" ariaLabel="חיפוש שם בפיצול" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <Btn sm onClick={() => setAll('guess', true)}>☑ כל הניחושים</Btn>
        <Btn sm onClick={() => setAll('guess', false)}>☐ בלי ניחושים</Btn>
      </div>
      <div style={{ maxHeight: '52vh', overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: 'var(--surface, #fff)', zIndex: 1 }}>
              <th style={{ width: 34 }} />
              <th style={{ textAlign: 'start', padding: 6 }}>שם מלא (על הקבלה)</th>
              <th style={{ textAlign: 'start', padding: 6 }}>שם פרטי</th>
              <th style={{ width: 34 }} />
              <th style={{ textAlign: 'start', padding: 6 }}>שם משפחה</th>
              <th style={{ textAlign: 'start', padding: 6 }}>מצב</th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, ROW_CAP).map((r) => {
              const e = cur(r);
              return (
                <tr key={r.id} className="name-split-row" style={{ borderTop: '1px solid var(--line)', opacity: e.on ? 1 : 0.55 }}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={e.on} onChange={(ev) => patch(r, { on: ev.target.checked })} aria-label={'להחיל על ' + r.name} />
                  </td>
                  <td style={{ padding: 6, fontWeight: 700 }}>{r.name}</td>
                  <td style={{ padding: 4 }}>
                    <TextInput value={e.first} onChange={(v) => patch(r, { first: v, on: true })} ariaLabel={'שם פרטי של ' + r.name} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="chip" title="הפוך פרטי ↔ משפחה" aria-label={'הפוך פרטי ומשפחה של ' + r.name} onClick={() => patch(r, { first: e.last, last: e.first, on: true })} style={{ cursor: 'pointer' }}>
                      ⇄
                    </button>
                  </td>
                  <td style={{ padding: 4 }}>
                    <TextInput value={e.last} onChange={(v) => patch(r, { last: v, on: true })} ariaLabel={'שם משפחה של ' + r.name} />
                  </td>
                  <td style={{ padding: 6, fontSize: 11.5, color: CONF_COLOR[r.conf], whiteSpace: 'nowrap' }} title={r.why}>
                    {CONF_LABEL[r.conf]}
                    <div style={{ color: 'var(--ink-faint)', fontSize: 10.5, whiteSpace: 'normal' }}>{r.why}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <div style={{ padding: 12, color: 'var(--ink-faint)' }}>אין שורות בסינון הזה.</div>}
      </div>
      {shown.length > ROW_CAP && (
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>{'מוצגות ' + ROW_CAP + ' מתוך ' + shown.length + ' — חפשו כדי להגיע לשם מסוים. השאר יוחלו לפי ההצעה.'}</div>
      )}
      <div className="modal-actions" style={{ marginTop: 10 }}>
        <Btn kind="primary" onClick={apply}>
          {armed ? '✓ לחצו שוב לאישור — ' + chosen.length + ' ' + sup : '🪪 החלה על ' + chosen.length + ' ' + sup}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
