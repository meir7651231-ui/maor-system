/**
 * 📅 חיובים-מתוכננים על שיבוץ-חוגים (בקשת-בעלים 25.8, courses.plannedcharges).
 * מקבילה ל-PlannedChargesSection של תומכים — אבל R- (לא D-) דרך addPayment.
 */
import { useState } from 'react';
import type { Enrollment, PlannedCharge } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { canIssueReceipt } from '../platform/lib';
import { Btn, Field, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';
import { openPlans, pendingIls, pendingUsd, plannedNextDate } from '../supporters/planned';

function fmt(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
function money(amt: number, cur: '₪' | '$'): string {
  return (cur === '$' ? '$' : '₪') + amt.toLocaleString('he-IL');
}
const METHOD_OPTS = [
  { value: 'אשראי', label: 'אשראי 💳' },
  { value: 'העברה בנקאית', label: 'הו״ק/בנק 🏦' },
  { value: 'מזומן', label: 'מזומן 💵' },
  { value: "צ'ק", label: 'צ׳ק 📝' },
];
function methodLabel(m: string): string {
  return METHOD_OPTS.find((o) => o.value === m)?.label || m;
}

export function EnrollmentPlannedSection({ enrollment }: { enrollment: Enrollment }) {
  const config = useApp((s) => s.config);
  const cloud = useApp((s) => s.cloud);
  const cancelEnrollmentPlanned = useApp((s) => s.cancelEnrollmentPlanned);
  const chargeEnrollmentPlanned = useApp((s) => s.chargeEnrollmentPlanned);
  const toast = useApp((s) => s.toast);
  const [addOpen, setAddOpen] = useState(false);

  const canIssue = canIssueReceipt({
    superAdmin: false,
    isManager: !!cloud.isManager,
    cloudRoot: config.cloudRoot === true,
    cloudConnected: !!cloud.user,
  });
  const open = openPlans(enrollment);
  const pIls = pendingIls(enrollment);
  const pUsd = pendingUsd(enrollment);
  const nextIso = plannedNextDate(enrollment);
  const all = enrollment.plannedCharges || [];

  function onCharge(pl: PlannedCharge): void {
    if (!canIssue) { toast('⛔ רק המנהל מנפיק קבלות — פנו למנהל/ת הארגון'); return; }
    if (!window.confirm('לרשום ' + money(pl.amount, pl.cur) + ' כתשלום R-? (הקבלה תיווצר עכשיו)')) return;
    const r = chargeEnrollmentPlanned(enrollment.id, pl.id);
    if (r.ok) toast('✅ נרשם ' + (r.rid || ''));
  }
  function onCancel(pl: PlannedCharge): void {
    if (!window.confirm('לבטל חיוב-מתוכנן ' + fmt(pl.date) + ' · ' + money(pl.amount, pl.cur) + '?')) return;
    const r = cancelEnrollmentPlanned(enrollment.id, pl.id, isoToday());
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
          אין חיובים-מתוכננים. פריסת-תשלומים = הבטחה עתידית לחיוב, בלי קבלה עד שהחיוב באמת יורד.
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
                {chargedOk && <span style={{ fontSize: 12.5, color: '#166534', fontWeight: 700 }}>✓ חויב · {pl.chargedRid}</span>}
                {cancelled && <span style={{ fontSize: 12.5, color: '#991b1b' }}>❌ בוטל {fmt(pl.cancelledAt || '')}</span>}
                {overdue && <span style={{ fontSize: 12.5, color: '#92400e', fontWeight: 700 }}>⚠️ באיחור</span>}
                {!chargedOk && !cancelled && !overdue && pl.method === 'אשראי' && (
                  <span style={{ fontSize: 12.5, color: '#0369a1', fontWeight: 700, background: '#e0f2fe', padding: '2px 6px', borderRadius: 4 }}>
                    ⏳ ממתין לחיוב-נכנס
                  </span>
                )}
                <div style={{ flex: 1 }} />
                {!chargedOk && !cancelled && (
                  <>
                    <Btn sm kind="primary" onClick={() => onCharge(pl)} title="החיוב ירד בפועל — יופק R- אמיתי">✓ החיוב ירד</Btn>
                    <Btn sm onClick={() => onCancel(pl)} title="ביטול-רך">❌</Btn>
                  </>
                )}
                {pl.note && <div style={{ width: '100%', fontSize: 12, color: 'var(--ink-faint)' }}>{pl.note}</div>}
              </div>
            );
          })}
        </div>
      )}
      {addOpen && <AddEnrollPlanModal enrollment={enrollment} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddEnrollPlanModal({ enrollment, onClose }: { enrollment: Enrollment; onClose: () => void }) {
  const addEnrollmentPlanned = useApp((s) => s.addEnrollmentPlanned);
  const toast = useApp((s) => s.toast);
  const [firstDate, setFirstDate] = useState(isoToday());
  const [count, setCount] = useState('3');
  const [amount, setAmount] = useState('');
  const [cur] = useState<'₪' | '$'>('₪');
  const [method, setMethod] = useState('אשראי');
  const [note, setNote] = useState('');

  const n = Math.max(1, parseInt(count || '0', 10) || 0);
  const amt = Math.max(0, parseFloat(amount || '0') || 0);
  const total = amt * n;

  function onSave(): void {
    if (!firstDate) { toast('חסר תאריך'); return; }
    if (amt <= 0) { toast('חסר סכום'); return; }
    const r = addEnrollmentPlanned(enrollment.id, { firstDate, count: n, amount: amt, cur, method, note: note || undefined });
    if (r.ok) {
      toast('📅 נוצרה פריסה: ' + n + ' × ' + (cur === '$' ? '$' : '₪') + amt.toLocaleString('he-IL'));
      onClose();
    }
  }

  return (
    <Modal title="➕ פריסת-תשלומים לשיבוץ" onClose={onClose}>
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
        <Field label="אמצעי">
          <Select value={method} onChange={setMethod} options={METHOD_OPTS} />
        </Field>
        <Field label="הערה (אופציונלי)">
          <TextInput value={note} onChange={setNote} placeholder="הערה לפריסה" />
        </Field>
        {n > 0 && amt > 0 && (
          <div style={{ padding: 8, background: 'var(--bg-1)', border: '1px solid var(--stroke)', borderRadius: 8, fontSize: 13 }}>
            💡 סה"כ פריסה: <strong>{n} × {money(amt, cur)}</strong> = <strong>{money(total, cur)}</strong> · חיובי-חודש רצופים החל מ-{fmt(firstDate)}
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
              ⚠️ אלה הבטחות, לא-קבלות. קבלות R- נופקות רק כשמאשרים "✓ החיוב ירד".
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
