/**
 * 💰 תשלומים נכנסים (גל ד׳ "עד-השרת", הרחבת payments) — הרשומות ש-paymentsWebhook
 * כתב אחרי חיוב אצל חברת-הסליקה. המזכירה רואה, רושמת תרומה/תשלום במערכת
 * (בזרימות הקיימות — מוני-R-/D- לא נגעים אוטומטית!), ומסמנת "נרשם ✓".
 * בלי Functions פרוסות: הרשימה ריקה — המסך ישר אומר זאת.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Empty, Modal } from '../ui';
import type { IncomingPayment } from '../../store/cloudSync';

type CloudMod = typeof import('../../store/cloudSync');

export function IncomingPaymentsModal(props: { onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const [mod, setMod] = useState<CloudMod | null>(null);
  const [rows, setRows] = useState<IncomingPayment[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh(m: CloudMod) {
    setLoading(true);
    setRows(await m.fetchIncomingPayments());
    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    void import('../../store/cloudSync').then((m) => {
      if (!alive) return;
      setMod(m);
      void refresh(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function markDone(id: string) {
    if (!mod) return;
    await mod.markIncomingPayment(id).catch(() => toast('⚠ הסימון נכשל — נסו שוב'));
    await refresh(mod);
  }

  // ⚠️ תקרת-תצוגה: גיבוי-היסטורי גדול (אלפי ממתינים) ⇒ רינדור כולם מקפיא את
  // הדפדפן (תקרית 19.8). מציגים רק את ה-SHOWN הראשונים; לבּאלק — מסך 🔄 הסנכרון.
  const SHOWN = 300;
  const shown = rows.slice(0, SHOWN);

  return (
    <Modal title="💰 תשלומים נכנסים — ממתינים לרישום" onClose={props.onClose}>
      {loading && <div className="empty">טוען…</div>}
      {!loading && rows.length === 0 && (
        <Empty>
          אין תשלומים ממתינים. (הרשימה מתמלאת אוטומטית כשחברת-הסליקה מדווחת —
          דורש את שרת-ההרחבות; ראו RUNBOOK-FUNCTIONS.)
        </Empty>
      )}
      {rows.length > SHOWN && (
        <div style={{ border: '1px solid var(--accent)', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 12.5 }}>
          יש <b>{rows.length.toLocaleString('he-IL')}</b> תשלומים ממתינים — כמות גדולה (גיבוי היסטורי).
          מוצגים {SHOWN} הראשונים בלבד. לעיבוד <b>כל</b> החיובים בבת-אחת השתמשו במסך <b>🔄 סנכרון מנדרים</b>
          (מחבר לכרטיסים עם תצוגה-מקדימה) — לא ברשימה הידנית הזו.
        </div>
      )}
      {shown.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              {p.currency || '₪'}{p.amount.toLocaleString('he-IL')} · {p.name || 'ללא שם'}
              {p.kevaId ? <span style={{ fontSize: 11, color: 'var(--accent)', marginInlineStart: 6 }}>🔁 הו״ק</span> : null}
              {p.category ? <span style={{ fontSize: 11, color: 'var(--ink-faint)', marginInlineStart: 6 }}>· {p.category}</span> : null}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }} dir="ltr">
              {[p.phone, p.email, p.zeout && ('ת"ז ' + p.zeout)].filter(Boolean).join(' · ')}
              {p.reference ? ' · ' + p.reference : ''} · {p.at.slice(0, 10)}
            </div>
          </div>
          <Btn sm kind="primary" onClick={() => void markDone(p.id)} title="אחרי שרשמתם את התרומה/התשלום במערכת">
            נרשם ✓
          </Btn>
        </div>
      ))}
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
        הרישום עצמו נעשה בזרימות הרגילות (תרומה/תשלום) — כאן רק מסמנים שטופל,
        כדי ששום תשלום לא ילך לאיבוד.
      </div>
    </Modal>
  );
}
