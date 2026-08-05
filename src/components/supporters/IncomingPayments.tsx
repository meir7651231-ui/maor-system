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

  return (
    <Modal title="💰 תשלומים נכנסים — ממתינים לרישום" onClose={props.onClose}>
      {loading && <div className="empty">טוען…</div>}
      {!loading && rows.length === 0 && (
        <Empty>
          אין תשלומים ממתינים. (הרשימה מתמלאת אוטומטית כשחברת-הסליקה מדווחת —
          דורש את שרת-ההרחבות; ראו RUNBOOK-FUNCTIONS.)
        </Empty>
      )}
      {rows.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              ₪{p.amount.toLocaleString('he-IL')} · {p.name || 'ללא שם'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }} dir="ltr">
              {p.phone}{p.reference ? ' · ' + p.reference : ''} · {p.at.slice(0, 10)}
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
