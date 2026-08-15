/**
 * "מי מתקשר?" — חיפוש-מספר ידני שמזהה את המתקשר ומקפיץ את כרטיסו.
 *
 * זהו הגשר "עד שהמרכזייה מחוברת": המזכירה רואה מספר על צג-הטלפון, מקלידה אותו,
 * ורואה מיד מי זה. **אותו מנוע בדיוק** של השיחה-הנכנסת האוטומטית (findCaller) —
 * כך שברגע שהמרכזייה תפתח `#call=<מספר>`, התוצאה זהה בלי הקלדה. מגודר telephonyOn.
 */
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { findCaller } from '../lib/callerId';
import { Modal, Btn } from './ui';

export function CallerLookup({ onClose }: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const selectFamily = useApp((s) => s.selectFamily);
  const go = useApp((s) => s.go);
  const toast = useApp((s) => s.toast);
  const [num, setNum] = useState('');

  const caller = num.trim() ? findCaller(db, num) : null;

  const open = () => {
    if (!caller) return;
    if (caller.famId) selectFamily(caller.famId);
    else go(caller.view);
    toast('📞 ' + caller.name + ' · ' + caller.kindLabel);
    onClose();
  };

  return (
    <Modal title="📞 מי מתקשר?" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', lineHeight: 1.6 }}>
          הקלידו/הדביקו את המספר שמופיע על צג-הטלפון — ונזהה מיד מי מתקשר.
          <br />
          <span style={{ opacity: 0.85 }}>כשהמרכזייה מחוברת — זה קורה אוטומטית, בלי להקליד.</span>
        </div>
        <input
          autoFocus
          type="tel"
          dir="ltr"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && caller) open();
          }}
          placeholder="050-1234567"
          aria-label="מספר המתקשר"
          style={{ fontSize: 18, padding: '10px 12px', textAlign: 'center', letterSpacing: 1 }}
        />
        {num.trim().replace(/\D/g, '').length >= 3 &&
          (caller ? (
            <div
              style={{
                border: '1px solid var(--ok, #0e7a6c)',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }} aria-hidden>
                👤
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{caller.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                  {caller.kindLabel} · <span dir="ltr">{caller.phone}</span>
                </div>
              </div>
              <Btn kind="primary" onClick={open}>
                📂 פתח כרטיס
              </Btn>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '12px 14px',
                color: 'var(--ink-faint)',
                fontSize: 13,
              }}
            >
              מספר לא מזוהה במערכת.
            </div>
          ))}
      </div>
    </Modal>
  );
}
