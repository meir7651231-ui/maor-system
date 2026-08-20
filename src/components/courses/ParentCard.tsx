/**
 * 👪 כרטיס-הורה (גל ה׳ · פאזה 10) — סיכום read-only פר-ילד שהרכז מייצר ומשתף (WhatsApp/
 * העתקה/הדפסה). נגזרת-טהורה (parent.ts). אפס-כסף (אין קישורי-תשלום/קבלה) · אפס-סכמה ·
 * בלי חשיפה-עצמאית-להורה. מגודר opt-in `courses.parentcard===true`.
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { integrationOn } from '../../lib/config';
import { Btn, Empty, Modal } from '../ui';
import { WaBtn } from '../WaBtn';
import { parentCard, parentCardText } from './parent';

function ddmm(iso: string): string {
  return iso.slice(8, 10) + '/' + iso.slice(5, 7);
}

/** הדפסה מבודדת דרך iframe נסתר (בלי להדפיס את כל הדף), עם escaping מלא. */
function printSummary(title: string, body: string) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(
    '<html dir="rtl"><head><meta charset="utf-8"><title>' +
      esc(title) +
      '</title></head><body><h2 style="font-family:system-ui">' +
      esc(title) +
      '</h2><pre style="font-family:system-ui;font-size:14px;white-space:pre-wrap">' +
      esc(body) +
      '</pre></body></html>',
  );
  doc.close();
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}

export function ParentCard(props: { memberId: string; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);

  const card = useMemo(() => parentCard(db, props.memberId), [db, props.memberId]);
  const waOn = integrationOn(config, 'whatsapp');
  const orgName = config.orgName || db.orgName || '';
  const text = parentCardText(card, orgName);

  const phone = useMemo(() => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === props.memberId);
      if (m) return f.phone || m.phone || '';
    }
    return '';
  }, [db.families, props.memberId]);

  const title = 'כרטיס הורה — ' + card.childName + (card.familyName ? ' · ' + card.familyName : '');

  return (
    <Modal title={'👪 ' + title} onClose={props.onClose} wide>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {card.totalBalance > 0 && (
          <span style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c' }}>יתרה כוללת ₪{card.totalBalance.toLocaleString('he-IL')}</span>
        )}
        {card.makeups.length > 0 && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#9a6414' }}>🔁 {card.makeups.length} השלמות</span>
        )}
        <div style={{ flex: 1 }} />
        {waOn && phone && <WaBtn phone={phone} text={text} title="שליחת הסיכום להורה בוואטסאפ" />}
        <Btn
          sm
          onClick={() => {
            void navigator.clipboard?.writeText(text);
            toast('סיכום ההורה הועתק');
          }}
        >
          📋 העתקה
        </Btn>
        <Btn sm onClick={() => printSummary(title, text)} title="הדפסת הסיכום">
          🖨 הדפסה
        </Btn>
      </div>

      {card.courses.length === 0 ? (
        <Empty>אין חוגים פעילים לילד/ה זו.</Empty>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', overflowY: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>חוג</th>
                <th>נוכחות</th>
                <th>חיסורים</th>
                <th>יתרה</th>
                <th>מפגש קרוב</th>
              </tr>
            </thead>
            <tbody>
              {card.courses.map((l) => (
                <tr key={l.courseId}>
                  <td style={{ fontWeight: 700 }}>{l.courseName}</td>
                  <td style={{ fontWeight: 700, color: l.attendancePct != null && l.attendancePct < 70 ? '#9a6414' : '#12803c' }}>
                    {l.attendancePct != null ? l.attendancePct + '%' : '—'}
                  </td>
                  <td style={{ color: l.absences > 0 ? '#9a6414' : 'var(--ink-faint)' }}>{l.absences || '—'}</td>
                  <td style={{ fontWeight: 700, color: l.balance > 0 ? '#b91c1c' : 'var(--ink-faint)' }}>{l.balance > 0 ? '₪' + l.balance.toLocaleString('he-IL') : '—'}</td>
                  <td style={{ fontSize: 12 }}>{l.nextSession ? ddmm(l.nextSession) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
        סיכום לצפייה/שיתוף בלבד — אינו מנפיק קבלה. יתרת-התשלום נגבית בניהול-השיבוץ (⚙).
      </div>
    </Modal>
  );
}
