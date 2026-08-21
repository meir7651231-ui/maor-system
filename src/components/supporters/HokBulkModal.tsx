/**
 * 🔁 רישום-הו״ק המוני — בחירה-ידנית מרשימה (הכרעת-בעלים "בחירה ידנית מרשימה").
 *
 * מציג את כל ההו״ק שמועדות-החודש (hokDue), עם תיבות-סימון (ברירת-מחדל: הכול),
 * ספירה + סכום-כולל חי, ואישור דו-שלבי כי **נוצרות קבלות-מס אמיתיות** (D- רציף).
 * הרישום עצמו דרך store.bulkRecordHok (שער-קבלות + כתיבה-אטומית). אחרי הרישום —
 * הקבלות קיימות בסדרה וניתנות להורדה/הדפסה פר-כרטיס (לא מורידים N קבצים בבת-אחת).
 *
 * מגודר opt-in מפורש `supporters.hokbulk === true` (יוצר קבלות ⇒ חייב הפעלה מכוונת).
 */
import { useMemo, useState } from 'react';
import type { OrgConfig } from '../../types/config';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Modal, Btn, Empty } from '../ui';
import { hokDue, isoToday } from './lib';

export function HokBulkModal(props: { config: OrgConfig; onClose: () => void }) {
  const supporters = useApp((s) => s.db.supporters);
  const bulkRecordHok = useApp((s) => s.bulkRecordHok);
  const toast = useApp((s) => s.toast);
  const today = isoToday();
  const due = useMemo(() => hokDue(supporters, today), [supporters, today]);
  const [sel, setSel] = useState<Set<string>>(() => new Set(due.map((s) => s.id)));
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOn = due.length > 0 && due.every((s) => sel.has(s.id));
  const setAll = () => setSel(allOn ? new Set() : new Set(due.map((s) => s.id)));

  const chosen = due.filter((s) => sel.has(s.id));
  const totalIls = chosen.reduce((a, s) => a + (s.hok?.cur === '$' ? 0 : s.hok?.amount ?? 0), 0);
  const totalUsd = chosen.reduce((a, s) => a + (s.hok?.cur === '$' ? s.hok?.amount ?? 0 : 0), 0);

  function run() {
    if (busy || !chosen.length) return;
    setBusy(true);
    const res = bulkRecordHok(chosen.map((s) => s.id), today);
    setBusy(false);
    if (res.done) {
      toast('🔁 נרשמו ' + res.done + ' חיובי-הו״ק' + (res.failed ? ' · ' + res.failed + ' דולגו' : '') + ' — קבלות בסדרה הרציפה');
      props.onClose();
    } else {
      toast('לא נרשמו חיובים' + (res.failed ? ' (' + res.failed + ' דולגו)' : ''));
      setArmed(false);
    }
  }

  const cur = (ils: number, usd: number) =>
    [ils ? '₪' + ils.toLocaleString('he-IL') : '', usd ? '$' + usd.toLocaleString('he-IL') : ''].filter(Boolean).join(' + ') || '₪0';

  return (
    <Modal title={'🔁 רישום הו״ק המוני'} onClose={props.onClose} wide>
      {due.length === 0 ? (
        <Empty>אין הוראות-קבע שממתינות לרישום החודש — הכול נרשם כבר ✓</Empty>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 10 }}>
            סמנו את {termOf(props.config, 'nav.supporters', 'התורמים')} שחיוב-החודש שלהם יירשם עכשיו. לכל אחד תיווצר{' '}
            <b>קבלת-מס בסדרה הרציפה</b> (D-). ניתן להוריד/להדפיס כל קבלה מכרטיס-התורם.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              <input type="checkbox" checked={allOn} onChange={setAll} aria-label="סמן/נקה הכול" />
              {allOn ? 'נקה הכול' : 'סמן הכול'} ({due.length})
            </label>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              נבחרו <b>{chosen.length}</b> · סה״כ <b>{cur(totalIls, totalUsd)}</b>
            </div>
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 10 }}>
            {due.map((s) => {
              const on = sel.has(s.id);
              return (
                <label
                  key={s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid var(--line)', cursor: 'pointer', background: on ? 'var(--gold-soft, #fbeecb)' : 'transparent' }}
                >
                  <input type="checkbox" checked={on} onChange={() => toggle(s.id)} aria-label={'סמן ' + s.name} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                  {s.hok?.day ? <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>יום {s.hok.day}</span> : null}
                  <b style={{ fontSize: 14 }}>{(s.hok?.cur === '$' ? '$' : '₪') + (s.hok?.amount ?? 0).toLocaleString('he-IL')}</b>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' }}>
            <Btn onClick={props.onClose}>ביטול</Btn>
            {!armed ? (
              <Btn kind="primary" disabled={!chosen.length} onClick={() => setArmed(true)}>
                המשך · {chosen.length} חיובים
              </Btn>
            ) : (
              <Btn kind="danger" disabled={busy || !chosen.length} onClick={run}>
                {busy ? 'רושם…' : '✓ אשר יצירת ' + chosen.length + ' קבלות (' + cur(totalIls, totalUsd) + ')'}
              </Btn>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
