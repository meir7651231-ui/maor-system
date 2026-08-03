/**
 * ⚙ ניהול שיבוץ — תשלומים וקבלות (R-מספר דרך addPayment), סה"כ עסקה + תאריך תשלום הבא
 * (יוצר תזכורת בלוח), קניית/טעינת כרטיסייה, הקפאה/סיום, והסרה עם אישור דו-שלבי.
 */
import { useState } from 'react';
import type { Course, Enrollment, OrgEvent } from '../../types/domain';
import { allMembers, useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { downloadReceipt } from '../../lib/receipt';
import { Btn, Field, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import {
  PAY_METHODS,
  chipStyle,
  enrollCount,
  enrollStatusMeta,
  fmtDate,
  groupOptionsOf,
  isoToday,
  payBal,
  paidOf,
  planWord,
} from './lib';

export function ManageModal(props: { enrollmentId: string; course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const deleteEnrollment = useApp((s) => s.deleteEnrollment);
  const addPayment = useApp((s) => s.addPayment);
  const storeUndoPunch = useApp((s) => s.undoPunch);
  const selectCourse = useApp((s) => s.selectCourse);
  const unlinkEvent = useApp((s) => s.unlinkEvent);
  const upsertEvent = useApp((s) => s.upsertEvent);
  const deleteEvent = useApp((s) => s.deleteEvent);
  const addCred = useApp((s) => s.addCred);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const cfg = useApp((s) => s.config);

  const punchOn = featureOn(cfg, 'courses.punch');
  const paymentsOn = featureOn(cfg, 'courses.payments');
  const groupsOn = featureOn(cfg, 'courses.groups');
  const receiptsOn = featureOn(cfg, 'core.receipts');
  // קבלה מלאה (P1.2) — שורות סיכום העסקה + הורדה חוזרת פר-תשלום (legacy receipt())
  const receiptSummaryOn = featureOn(cfg, 'courses.receipt.summary');

  const en = db.enrollments.find((e) => e.id === props.enrollmentId);
  const c = props.course;
  const [note, setNote] = useState(en?.note ?? '');
  const [totalDue, setTotalDue] = useState(en?.totalDue ? String(en.totalDue) : '');
  const [payAmt, setPayAmt] = useState('');
  const [payMethod, setPayMethod] = useState('מזומן');
  const [payDate, setPayDate] = useState(isoToday());
  const [buyQty, setBuyQty] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [armedAt, setArmedAt] = useState(0);

  if (!en) return null;
  const m = allMembers(db).find((x) => x.id === en.memberId);
  const famOf = () => db.families.find((f) => f.members.some((mm) => mm.id === en.memberId));
  const rem = en.purchased - en.used;
  const st = enrollStatusMeta(en);
  const groups = groupsOn ? groupOptionsOf(c) : [];
  const paid = paidOf(en);
  const bal = payBal(en);

  function saveTotalDue(v: string) {
    setTotalDue(v);
    if (!en) return;
    upsertEnrollment({ ...en, totalDue: Math.max(0, Math.round((+v || 0) * 100) / 100) });
  }

  /** תאריך תשלום הבא — נשמר מיד ויוצר/מעדכן תזכורת בלוח השנה. */
  function saveDueDate(v: string) {
    if (!en) return;
    if (!v) {
      // ניקוי + מחיקת התזכורת המקושרת מהלוח (unlinkEvent — תיקון האירוע היתום, P1.9)
      unlinkEvent('enrollmentDue', en.id);
      toast('תאריך התשלום הבא נוקה — התזכורת הוסרה מהלוח');
      return;
    }
    let evId = en.dueEventId;
    const existing = evId ? db.events.find((x) => x.id === evId) : undefined;
    if (!existing) evId = nextId('ev');
    const ev: OrgEvent = {
      id: evId!,
      title: 'תשלום יתרה — ' + (m?.first ?? '') + ' (' + c.name + ')',
      date: v,
      time: existing?.time ?? '',
      type: 'reminder',
      customType: '',
      notes: '',
      price: 0,
      roomId: '',
      famId: famOf()?.id ?? '',
      priority: 'orange',
      done: false,
    };
    upsertEvent(ev);
    upsertEnrollment({ ...en, dueDate: v, dueEventId: evId });
    toast('נקבע תשלום הבא ל-' + fmtDate(v) + ' — נוספה תזכורת ללוח השנה');
  }

  function addPay() {
    if (!en) return;
    const amt = Math.round((+payAmt || 0) * 100) / 100;
    // Number.isFinite חוסם Infinity/NaN (קלט כמו "1e400") — אחרת Infinity עובר את
    // הבדיקה, נשמר, מסודר ל-null ב-JSON, והיתרה/הקבלה משתבשות. כמו DonationModal.
    if (!Number.isFinite(amt) || amt <= 0) {
      toast('הקלידו סכום תשלום תקין');
      return;
    }
    const date = payDate || isoToday();
    const method = payMethod || 'מזומן';
    // הקבלה יורדת רק כשה-store קיבל את התשלום, ועם ה-rid שהונפק בפועל —
    // קודם ניחשנו rid מ-receiptSeq והורדנו קבלה גם על דחייה (rid שמעולם לא הונפק).
    const res = addPayment(en.id, { date, amount: amt, method });
    if (!res.ok || !res.rid) return; // ה-store כבר הציג טוסט דחייה
    const rid = res.rid;
    const newBal = Math.max(0, (en.totalDue || 0) - (paid + amt));
    // קבלות כבויות בקונפיגורציה → התשלום נרשם, אך ללא הורדת קבלה וללא טוסט הקבלה
    if (receiptsOn) {
      downloadReceipt({
        rid,
        orgName: useApp.getState().config.orgName || db.orgName,
        payer: ((m?.first ?? '') + ' ' + (m?.famName ?? '')).trim() || '—',
        amount: amt,
        method,
        date,
        forWhat: c.name,
        // שורות סיכום העסקה — רק כשהדגל דלוק (בלעדיו הקבלה כמו קודם)
        summary: receiptSummaryOn
          ? { totalDue: en.totalDue || 0, paidSoFar: paid + amt, balance: newBal, nextDate: en.dueDate || undefined }
          : undefined,
      });
    }
    setPayAmt('');
    toast('התקבל ₪' + amt + (en.totalDue ? ' · יתרה: ₪' + newBal : '') + ' — קבלה ' + rid);
    if (receiptsOn) toast('הקבלה ירדה למחשב ✓');
    const fam = famOf();
    if (fam) addCred(fam.id, 5, 'תשלום התקבל (₪' + amt + ')');
  }

  /** 🧾 הורדה חוזרת של קבלה לתשלום קיים — כמו legacy receipt(en, p) (legacy:2272). */
  function redownloadReceipt(p: Enrollment['payments'][number]) {
    if (!en) return;
    downloadReceipt({
      rid: p.rid,
      orgName: useApp.getState().config.orgName || db.orgName,
      payer: ((m?.first ?? '') + ' ' + (m?.famName ?? '')).trim() || '—',
      amount: p.amount,
      method: p.method,
      date: p.date,
      forWhat: c.name,
      // בהורדה חוזרת הסיכום משקף את המצב הנוכחי של העסקה (כמו בלגאסי)
      summary: { totalDue: en.totalDue || 0, paidSoFar: paid, balance: bal, nextDate: en.dueDate || undefined },
    });
    toast('הקבלה ' + p.rid + ' ירדה שוב למחשב ✓');
  }

  function buyPunches() {
    if (!en) return;
    // דורשים כמות מפורשת (בלי fallback ל-c.size) — אחרת לחיצה כפולה: הקליק
    // הראשון טוען ומאפס את השדה, והשני נופל ל-c.size וטוען מנה שנייה בטעות.
    if (!buyQty.trim()) {
      toast('הקלידו כמות ניקובים לטעינה');
      return;
    }
    const qty = +buyQty;
    if (isNaN(qty) || qty <= 0 || qty > 200 || !Number.isInteger(qty)) {
      toast('כמות ניקובים לא תקינה');
      return;
    }
    const next: Enrollment =
      en.plan === 'punch'
        ? { ...en, purchased: en.purchased + qty }
        : { ...en, plan: 'punch', purchased: qty, used: 0 };
    if (next.status === 'ended') {
      // חידוש שיבוץ שהסתיים מחזיר אותו לתפוסה — חייב לעבור את שער הקיבולת כמו
      // רישום חדש (enrollCount אינו סופר 'ended', לכן n הוא התפוסה הנוכחית).
      const n = enrollCount(db, c.id);
      if (n >= (c.maxStudents || 999)) {
        toast('ה' + termOf(cfg, 'entity.course', 'חוג') + ' מלא (' + n + '/' + c.maxStudents + ') — לא ניתן לחדש ' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' שהסתיים');
        return;
      }
      next.status = 'active';
      next.endedAt = undefined; // חידוש מנקה את תאריך-הסיום (#8)
    }
    upsertEnrollment(next);
    setBuyQty('');
    toast('כרטיסייה נטענה: +' + qty + ' ניקובים · יתרה חדשה ' + (next.purchased - next.used));
  }

  function undoPunch() {
    if (!en) return;
    // ההחזר המדויק (legacy mgUndo) ממומש ב-store — כולל הסרת רשומת ה-Check-in
    // מהלוג והחזרת הדלתא בפועל (לא הנחת ‎-5). P1.8.
    storeUndoPunch(en.id);
  }

  function togglePause() {
    if (!en) return;
    const paused = en.status !== 'paused';
    upsertEnrollment({ ...en, status: paused ? 'paused' : 'active' });
    toast(
      paused
        ? 'ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' הוקפא — הניקוב נחסם עד הפשרה'
        : 'ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' הופשר וחזר לפעילות',
    );
  }

  function endEnroll() {
    if (!en) return;
    upsertEnrollment({ ...en, status: 'ended', endedAt: isoToday() });
    toast('ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' סומן כהסתיים');
  }

  /** הסרה סופית — אישור דו-שלבי; מוחקת גם את תזכורת התשלום מהלוח. */
  function remove() {
    if (!en) return;
    if (!confirmRemove) {
      setConfirmRemove(true);
      setArmedAt(Date.now());
      return;
    }
    // לחיצה כפולה טבעית משגרת שני קליקים; React מספיק לרנדר מחדש בין השניים, כך
    // שהקליק השני היה מוחק בלי שהמשתמש הספיק לקרוא את "לאשר הסרה סופית?". חוסמים
    // אישור שנוחת פחות מ-400ms מרגע הזריון — נדרשת לחיצה שנייה מכוונת.
    if (Date.now() - armedAt < 400) return;
    if (en.dueEventId) deleteEvent(en.dueEventId);
    deleteEnrollment(en.id);
    toast('ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' הוסר לצמיתות — כולל תזכורת התשלום מהלוח');
    props.onClose();
  }

  const balLine = en.totalDue
    ? 'שולם ₪' + paid + ' מתוך ₪' + en.totalDue + ' · יתרה ₪' + bal
    : paid
      ? 'שולם ₪' + paid + ' (ללא סה"כ עסקה)'
      : 'הגדירו סה"כ עסקה ותקבלו מעקב יתרה';

  return (
    <Modal title={'⚙ ניהול ' + termOf(cfg, 'entity.enrollment', 'שיבוץ')} onClose={props.onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>
          {(m?.first ?? '—') + ' ' + (m?.famName ?? '')} · {c.name}
        </strong>
        <span style={chipStyle('#f6ead1', '#9a6414')}>{en.plan === 'punch' ? 'כרטיסייה' : planWord(en.plan)}</span>
        <span style={chipStyle(st.bg, st.c)}>{st.label}</span>
        {/* לגאסי mg: קישור לכרטיס החוג (מעבר 199/199) */}
        <button
          type="button"
          onClick={() => {
            selectCourse(c.id);
            props.onClose();
          }}
          style={{ border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          {'לכרטיס ה' + termOf(cfg, 'entity.course', 'חוג') + ' ←'}
        </button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600, marginBottom: 12 }}>
        {en.plan === 'punch' ? 'יתרה: ' + rem + ' מתוך ' + en.purchased : en.used + ' נוכחויות מתחילת החודש'}
      </div>

      {groups.length > 0 && (
        <Field label={'קבוצה — מסונכרן לקבוצות הקיימות ב' + termOf(cfg, 'entity.course', 'חוג')}>
          <Select
            value={en.group}
            onChange={(v) => {
              upsertEnrollment({ ...en, group: v });
              toast(v ? 'שויך/ה לקבוצה: ' + v : 'הוסר שיוך הקבוצה');
            }}
            options={[{ value: '', label: 'ללא שיוך קבוצה' }, ...groups.map((g) => ({ value: g.v, label: g.t }))]}
          />
        </Field>
      )}

      <Field label={'📝 הערה על ה' + termOf(cfg, 'entity.student', 'תלמיד/ה') + ' ב' + termOf(cfg, 'entity.course', 'חוג')}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextInput value={note} onChange={setNote} placeholder="לדוגמה: רגישות, הסעה, העדפת קבוצה…" />
          <Btn
            sm
            onClick={() => {
              upsertEnrollment({ ...en, note: note.trim() });
              toast(note.trim() ? 'ההערה נשמרה — מוצגת ברשימת ה' + termOf(cfg, 'entity.students', 'תלמידים') : 'ההערה נמחקה');
            }}
          >
            שמירה
          </Btn>
        </div>
      </Field>

      {paymentsOn && (
      <div
        style={{
          border: '1.5px solid #b9dfc8',
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 12,
          background: '#f2faf5',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <strong style={{ fontSize: 13 }}>💳 תשלומים וקבלות</strong>
          <span style={{ fontSize: 12, fontWeight: 800, color: bal > 0 ? '#b45309' : '#12803c' }}>{balLine}</span>
        </div>
        <div className="form-grid">
          <Field label={'סה"כ עסקה (₪)'}>
            <TextInput value={totalDue} onChange={saveTotalDue} placeholder={String(c.price || 0)} dir="ltr" />
          </Field>
          <Field label="מתי ישלם את השאר">
            <HebDateInput value={en.dueDate} onChange={saveDueDate} />
          </Field>
        </div>
        {en.payments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
            {en.payments.map((p) => (
              <div
                key={p.rid}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(33,29,23,.08)',
                  borderRadius: 9,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ flex: 1 }}>
                  {fmtDate(p.date)} · ₪{p.amount} · {p.method} · 🧾 {p.rid}
                </span>
                {receiptsOn && receiptSummaryOn && (
                  <Btn sm onClick={() => redownloadReceipt(p)} title={'הורדה חוזרת של קבלה ' + p.rid}>
                    🧾 הורדה
                  </Btn>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 90 }}>
            <TextInput value={payAmt} onChange={setPayAmt} placeholder="סכום ₪" dir="ltr" />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <Select value={payMethod} onChange={setPayMethod} options={PAY_METHODS.map((v) => ({ value: v, label: v }))} />
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 220 }}>
            <HebDateInput value={payDate} onChange={setPayDate} />
          </div>
          <Btn sm kind="primary" onClick={addPay}>
            ＋ קבלת תשלום
          </Btn>
        </div>
      </div>
      )}

      {punchOn && featureOn(cfg, 'courses.punch.buy') && (
      <div
        style={{
          border: '1.5px solid #f3c76b',
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 12,
          background: '#fdf8ec',
        }}
      >
        <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          🎫 {en.plan === 'punch' ? 'קניית / טעינת כרטיסייה' : 'מעבר לכרטיסייה (קנייה ראשונה)'}
        </strong>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 110 }}>
            <TextInput value={buyQty} onChange={setBuyQty} placeholder={String(c.size || 12)} dir="ltr" />
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 700 }}>
            מחיר: {c.price ? '₪' + c.price : '—'}
          </span>
          <Btn sm kind="primary" onClick={buyPunches}>
            קנייה וטעינה
          </Btn>
        </div>
      </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {punchOn && featureOn(cfg, 'courses.punch.switchmonthly') && en.plan === 'punch' && (
          <Btn
            sm
            onClick={() => {
              upsertEnrollment({ ...en, plan: 'monthly' });
              toast('ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' הועבר למנוי חודשי');
            }}
          >
            מעבר למנוי חודשי
          </Btn>
        )}
        {punchOn && featureOn(cfg, 'courses.punch.undo') && (
          <Btn sm onClick={undoPunch} title="מבטל את הניקוב האחרון ומחזיר את היתרה">
            ↩ ביטול ניקוב אחרון
          </Btn>
        )}
        <Btn sm onClick={togglePause}>
          {en.status === 'paused' ? '▶ הפשרה — חזרה לפעילות' : '⏸ הקפאה זמנית'}
        </Btn>
        <Btn sm onClick={endEnroll}>
          {'סיום ' + termOf(cfg, 'entity.enrollment', 'שיבוץ')}
        </Btn>
        <Btn sm kind="danger" onClick={remove}>
          {confirmRemove ? 'לאשר הסרה סופית?' : 'הסרת ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ')}
        </Btn>
      </div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={props.onClose}>
          סגירה
        </Btn>
      </div>
    </Modal>
  );
}
