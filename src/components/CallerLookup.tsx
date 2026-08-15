/**
 * כרטיס שיחה-נכנסת (screen-pop) — קופץ ברגע שמזהים מתקשר: מי הוא, ההקשר שלו,
 * ופעולות-מהירות. משרת שני מסלולים באותו רכיב:
 *   • אוטומטי — `#call=<מספר>` (initialNumber מוזרק) ⇒ הכרטיס נפתח מזוהה מיד.
 *   • ידני — כפתור "מי מתקשר?" ⇒ שדה-קלט, והזיהוי מתעדכן חי בזמן ההקלדה.
 * אותו מנוע (findCaller) לשניהם. מגודר telephonyOn (הגידור אצל ה-caller ב-App).
 */
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { findCaller } from '../lib/callerId';
import { integrationOn } from '../lib/config';
import { Modal, Btn } from './ui';
import { WaBtn } from './WaBtn';
import { CallBtn } from './CallBtn';

export function CallerLookup({ initialNumber, onClose }: { initialNumber?: string; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const selectFamily = useApp((s) => s.selectFamily);
  const go = useApp((s) => s.go);
  const [num, setNum] = useState(initialNumber ?? '');

  const trimmed = num.trim();
  const caller = trimmed ? findCaller(db, num) : null;
  const fam = caller?.famId ? db.families.find((f) => f.id === caller.famId) : null;
  const memberNames = fam ? (fam.members || []).map((m) => m.first).filter(Boolean).join(' · ') : '';
  const searched = trimmed.replace(/\D/g, '').length >= 3;
  const waOn = integrationOn(config, 'whatsapp');

  const openCard = () => {
    if (!caller) return;
    if (caller.famId) selectFamily(caller.famId);
    else go(caller.view);
    onClose();
  };
  const newFamily = () => {
    go('families');
    onClose();
  };

  return (
    <Modal title="📞 שיחה נכנסת" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 'min(360px, 78vw)' }}>
        {/* קלט-מספר — תמיד זמין (למסלול-הידני ולתיקון) */}
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 5 }}>
            המספר שמופיע על צג-הטלפון{initialNumber ? ' (זוהה מהשיחה)' : ''}:
          </div>
          <input
            autoFocus={!initialNumber}
            type="tel"
            dir="ltr"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && caller) openCard();
            }}
            placeholder="050-1234567"
            aria-label="מספר המתקשר"
            style={{ fontSize: 18, padding: '10px 12px', textAlign: 'center', letterSpacing: 1, width: '100%' }}
          />
        </div>

        {/* תוצאת-הזיהוי */}
        {searched && caller && (
          <div
            style={{
              border: '1px solid var(--accent)',
              borderRadius: 12,
              padding: 14,
              background: 'var(--accent-soft, var(--panel))',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 30, lineHeight: 1 }} aria-hidden>
                {caller.kind === 'family' || caller.kind === 'member' ? '👨‍👩‍👧‍👦' : caller.kind === 'supporter' ? '🤝' : caller.kind === 'volunteer' ? '🚚' : '📋'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.2 }}>{caller.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--dark, #fff)',
                      borderRadius: 999,
                      padding: '1px 9px',
                      fontWeight: 700,
                      fontSize: 11.5,
                    }}
                  >
                    {caller.kindLabel}
                  </span>{' '}
                  <span dir="ltr">{caller.phone}</span>
                </div>
              </div>
            </div>

            {/* הקשר — בני-המשפחה + טלפון-נוסף (למשפחה) */}
            {fam && (memberNames || fam.phone2) && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}>
                {memberNames && (
                  <div>
                    <b>במשפחה:</b> {memberNames}
                  </div>
                )}
                {fam.phone2 && (
                  <div>
                    <b>טלפון נוסף:</b> <span dir="ltr">{fam.phone2}</span>
                  </div>
                )}
              </div>
            )}

            {/* פעולות-מהירות */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn kind="primary" onClick={openCard}>
                📂 פתח כרטיס מלא
              </Btn>
              {waOn && caller.phone && <WaBtn phone={caller.phone} title={'וואטסאפ ל' + caller.name} />}
              <CallBtn phone={caller.phone} title={'חיוג חוזר ל' + caller.name} />
            </div>
          </div>
        )}

        {/* מספר לא-מזוהה */}
        {searched && !caller && (
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              מספר <span dir="ltr" style={{ fontWeight: 700 }}>{trimmed}</span> אינו מזוהה במערכת.
            </div>
            <div>
              <Btn onClick={newFamily}>➕ פתיחת משפחה חדשה</Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
