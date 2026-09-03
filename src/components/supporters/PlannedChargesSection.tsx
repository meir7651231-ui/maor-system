/**
 * 📅 חיובים-מתוכננים בכרטיס-התומך (בקשת-בעלים 25.8).
 * מצבים: אין-פלנים · יש-פתוחים · חלק חויב/בוטל. פעולות: הוספת-פריסה,
 * "✓ החיוב ירד" (⇒ מוציא D-, שער-המנהל), ✕ ביטול, הצגת-שרשרת בסיום.
 */
import { useState } from 'react';
import type { PlannedCharge, Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { canIssueReceipt } from '../platform/lib';
import { Btn, Field, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';
import { openPlans, pendingIls, pendingUsd, plannedNextDate } from './planned';

function fmt(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
function money(amt: number, cur: '₪' | '$'): string {
  return (cur === '$' ? '$' : '₪') + amt.toLocaleString('he-IL');
}

const METHOD_OPTS = [
  { value: 'credit', label: 'אשראי 💳' },
  { value: 'bank', label: 'הו״ק/בנק 🏦' },
  { value: 'cash', label: 'מזומן 💵' },
  { value: 'check', label: 'צ׳ק 📝' },
];
function methodLabel(m: string): string {
  return METHOD_OPTS.find((o) => o.value === m)?.label || m;
}

export function PlannedChargesSection({ supporter }: { supporter: Supporter }) {
  const config = useApp((s) => s.config);
  const cloud = useApp((s) => s.cloud);
  const cancelPlannedCharge = useApp((s) => s.cancelPlannedCharge);
  const chargePlanned = useApp((s) => s.chargePlanned);
  const toast = useApp((s) => s.toast);
  const [addOpen, setAddOpen] = useState(false);

  const canIssue = canIssueReceipt({
    superAdmin: false,
    isManager: !!cloud.isManager,
    cloudRoot: config.cloudRoot === true,
    cloudConnected: !!cloud.user,
  });
  const open = openPlans(supporter);
  const pIls = pendingIls(supporter);
  const pUsd = pendingUsd(supporter);
  const nextIso = plannedNextDate(supporter);
  const all = supporter.plannedCharges || [];

  function onCharge(pl: PlannedCharge): void {
    if (!canIssue) {
      toast('⛔ רק המנהל מנפיק קבלות — פנו למנהל/ת הארגון');
      return;
    }
    const ok = window.confirm('לרשום ' + money(pl.amount, pl.cur) + ' כתרומה D-? (הקבלה תיווצר עכשיו)');
    if (!ok) return;
    const r = chargePlanned(supporter.id, pl.id);
    if (r.ok) toast('✅ נרשם ' + (r.rid || ''));
  }
  function onCancel(pl: PlannedCharge): void {
    if (!window.confirm('לבטל חיוב-מתוכנן ' + fmt(pl.date) + ' · ' + money(pl.amount, pl.cur) + '?')) return;
    const r = cancelPlannedCharge(supporter.id, pl.id, isoToday());
    if (r.ok) toast('❌ החיוב בוטל');
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 15 }}>חיובים-מתוכננים 📅</h3>
        {open.length > 0 && (
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
            {open.length} פתוחים
            {pIls > 0 && ' · ₪' + pIls.toLocaleString('he-IL')}
            {pUsd > 0 && ' · $' + pUsd.toLocaleString('he-IL')}
            {nextIso && ' · הבא ' + fmt(nextIso)}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <Btn sm onClick={() => setAddOpen(true)}>➕ פריסת-תשלומים</Btn>
      </div>
      {all.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          אין חיובים-מתוכננים. פריסת-תשלומים = הבטחה עתידית לחיוב, בלי קבלת-מס עד שהחיוב באמת יורד.
        </div>
      )}
      {all.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {[...all].sort((a, b) => a.date.localeCompare(b.date)).map((pl) => {
            const chargedOk = !!pl.chargedRid;
            const cancelled = !!pl.cancelledAt;
            const overdue = !chargedOk && !cancelled && pl.date < isoToday();
            const bg = chargedOk ? '#f0fdf4' : cancelled ? '#fef2f2' : overdue ? '#fef3c7' : 'var(--bg-1)';
            const border = chargedOk ? '#86efac' : cancelled ? '#fca5a5' : overdue ? '#fbbf24' : 'var(--stroke)';
            return (
              <div key={pl.id} style={{ padding: '8px 10px', border: '1px solid ' + border, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, minWidth: 90 }}>{fmt(pl.date)}</span>
                <span style={{ minWidth: 80 }}>{money(pl.amount, pl.cur)}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{methodLabel(pl.method)}</span>
                {chargedOk && (
                  <span style={{ fontSize: 12.5, color: '#166534', fontWeight: 700 }}>✓ חויב · {pl.chargedRid}</span>
                )}
                {cancelled && (
                  <span style={{ fontSize: 12.5, color: '#991b1b' }}>❌ בוטל {fmt(pl.cancelledAt || '')}</span>
                )}
                {overdue && (
                  <span style={{ fontSize: 12.5, color: '#92400e', fontWeight: 700 }}>⚠️ באיחור</span>
                )}
                {/* ⏳ אשראי-פתוח (בקשת-בעלים 25.8): "שיהיה הודעה ממתין לחיוב-נכנס" */}
                {!chargedOk && !cancelled && !overdue && pl.method === 'credit' && (
                  <span style={{ fontSize: 12.5, color: '#0369a1', fontWeight: 700, background: '#e0f2fe', padding: '2px 6px', borderRadius: 4 }}>
                    ⏳ ממתין לחיוב-נכנס
                  </span>
                )}
                <div style={{ flex: 1 }} />
                {!chargedOk && !cancelled && (
                  <>
                    <Btn sm kind="primary" onClick={() => onCharge(pl)} title="החיוב ירד בפועל — יופק D- אמיתי">
                      ✓ החיוב ירד
                    </Btn>
                    <Btn sm onClick={() => onCancel(pl)} title="ביטול-רך (השורה נשארת בשרשרת הביקורת)">
                      ❌
                    </Btn>
                  </>
                )}
                {pl.note && <div style={{ width: '100%', fontSize: 12, color: 'var(--ink-faint)' }}>{pl.note}</div>}
              </div>
            );
          })}
        </div>
      )}
      {addOpen && <AddPlanModal supporter={supporter} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddPlanModal({ supporter, onClose }: { supporter: Supporter; onClose: () => void }) {
  const addPlannedCharges = useApp((s) => s.addPlannedCharges);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const [firstDate, setFirstDate] = useState(isoToday());
  const [count, setCount] = useState('3');
  const [amount, setAmount] = useState('');
  const [cur, setCur] = useState<'₪' | '$'>('₪');
  const [method, setMethod] = useState('credit');
  const [note, setNote] = useState('');

  const n = Math.max(1, parseInt(count || '0', 10) || 0);
  const amt = Math.round(Math.max(0, parseFloat(amount || '0') || 0) * 100) / 100; // ביקורת-עומק 2.9: עיגול-אגורות — ספרות≠מילים על קבלת-מס
  const total = amt * n;

  function onSave(): void {
    if (!firstDate) { toast('חסר תאריך'); return; }
    if (amt <= 0) { toast('חסר סכום'); return; }
    const cat = supporter.forWho || termOf(config, 'entity.donation', 'תרומה');
    const r = addPlannedCharges(supporter.id, { firstDate, count: n, amount: amt, cur, method, cat, note: note || undefined });
    if (r.ok) {
      toast('📅 נוצרה פריסה: ' + n + ' × ' + (cur === '$' ? '$' : '₪') + amt.toLocaleString('he-IL'));
      onClose();
    }
  }

  return (
    <Modal title="➕ פריסת-תשלומים חדשה" onClose={onClose}>
      <div style={{ display: 'grid', gap: 10 }}>
        <Field label="תאריך-חיוב ראשון">
          <HebDateInput value={firstDate} onChange={setFirstDate} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="מספר תשלומים">
            <TextInput value={count} onChange={setCount} type="number" dir="ltr" placeholder="3" />
          </Field>
          <Field label="סכום פר-תשלום">
            <TextInput value={amount} onChange={setAmount} type="number" dir="ltr" placeholder="0" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="מטבע">
            <Select
              value={cur}
              onChange={(v) => setCur(v === '$' ? '$' : '₪')}
              options={[{ value: '₪', label: '₪ שקל' }, { value: '$', label: '$ דולר' }]}
            />
          </Field>
          <Field label="אמצעי">
            <Select value={method} onChange={setMethod} options={METHOD_OPTS} />
          </Field>
        </div>
        <Field label="הערה (אופציונלי)">
          <TextInput value={note} onChange={setNote} placeholder="הערה לפריסה (מוצג על כל תשלום)" />
        </Field>
        {n > 0 && amt > 0 && (
          <div style={{ padding: 8, background: 'var(--bg-1)', border: '1px solid var(--stroke)', borderRadius: 8, fontSize: 13 }}>
            💡 סה"כ פריסה: <strong>{n} × {money(amt, cur)}</strong> = <strong>{money(total, cur)}</strong> · חיובי-חודש רצופים החל מ-{fmt(firstDate)}
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
              ⚠️ אלה הבטחות, לא-קבלות. קבלות D- נופקות רק כשמאשרים "✓ החיוב ירד".
            </div>
          </div>
        )}
        <div className="modal-actions">
          <Btn onClick={onClose}>ביטול</Btn>
          <Btn kind="primary" onClick={onSave} disabled={amt <= 0 || n <= 0}>➕ צור פריסה</Btn>
        </div>
      </div>
    </Modal>
  );
}
