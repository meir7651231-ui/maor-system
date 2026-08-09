/**
 * 🔗 איחוד כפולי-תורמים (ROADMAP-100 ‏#13, 5.8.2026) — אותו דפוס כמו המשפחות:
 * קבוצות לפי טלפון/אימייל/שם+עיר (lib/dedup), בחירת "שומר" ומיזוג הכול לתוכו.
 * עקרון-בטיחות: כל התרומות (עם ה-rid) וה-hist עוברים — שום רשומה כספית לא נמחקת.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { findSupporterDupGroups } from '../../lib/dedup';
import { Btn, Empty, Modal } from '../ui';
import { supCount, totalLabel } from './lib';

export function SupDedupModal(props: { onClose: () => void }) {
  const supporters = useApp((s) => s.db.supporters);
  const mergeSupporters = useApp((s) => s.mergeSupporters);
  const groups = findSupporterDupGroups(supporters);
  // ה"שומר" הנבחר פר-קבוצה — ברירת-מחדל: בעל-התרומות-הרבות (נקבע ברינדור)
  const [keepSel, setKeepSel] = useState<Record<number, string>>({});
  // UX סבב-ה׳ (השלמה): רשת-ביטחון כמו במשפחות — מיזוג חמוש בשני שלבים
  const [armed, setArmed] = useState<number | null>(null);

  return (
    <Modal title="🔗 איחוד כפולי-תורמים" onClose={props.onClose}>
      {groups.length === 0 ? (
        <Empty>לא נמצאו כפולים 🎉 (החיפוש: טלפון / אימייל / שם+עיר זהים)</Empty>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
            בכל קבוצה בוחרים את הכרטיס שנשאר; כל התרומות והקבלות של האחרים עוברות אליו — שום רשומה כספית לא נמחקת.
          </div>
          {groups.map((g, gi) => {
            const rows = g
              .map((id) => supporters.find((s) => s.id === id))
              .filter((s): s is NonNullable<typeof s> => !!s)
              .sort((a, b) => supCount(b) - supCount(a));
            if (rows.length < 2) return null;
            const keepId = keepSel[gi] ?? rows[0].id;
            return (
              <div key={gi} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                {rows.map((sp) => (
                  <label key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={'keep-' + gi}
                      checked={keepId === sp.id}
                      onChange={() => setKeepSel({ ...keepSel, [gi]: sp.id })}
                      style={{ width: 'auto' }}
                    />
                    <span style={{ fontWeight: keepId === sp.id ? 800 : 600, flex: 1 }}>{sp.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)', direction: 'ltr' }}>{sp.phone || sp.email || '—'}</span>
                    <span style={{ fontSize: 12 }}>{supCount(sp) + ' · ' + totalLabel(sp)}</span>
                  </label>
                ))}
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  <Btn
                    sm
                    kind={armed === gi ? 'danger' : 'primary'}
                    onClick={() => {
                      if (armed !== gi) {
                        setArmed(gi);
                        return;
                      }
                      for (const sp of rows) if (sp.id !== keepId) mergeSupporters(keepId, sp.id);
                      setArmed(null);
                    }}
                  >
                    {armed === gi ? 'לאשר מיזוג סופי?' : '🔗 מזג את הקבוצה לתוך הנבחר'}
                  </Btn>
                  {armed === gi && <Btn sm onClick={() => setArmed(null)}>ביטול</Btn>}
                </div>
              </div>
            );
          })}
        </>
      )}
      <div className="modal-actions">
        <Btn onClick={props.onClose}>סגירה</Btn>
      </div>
    </Modal>
  );
}
