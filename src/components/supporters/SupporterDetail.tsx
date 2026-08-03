/**
 * כרטיס תומכ/ת — פרטי קשר, ציון RFM ודרגה, היסטוריית תרומות,
 * רישום תרומה חדשה ותאריך יעד "קשר הבא" עם תזכורת מקושרת בלוח השנה.
 */
import { useState } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty, Field } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { chipStyle, fmtDate, isoToday, supDonEvents, supScore, supTier, totalLabel } from './lib';
import { downloadReceipt } from '../../lib/receipt';
import { SupporterForm } from './SupporterForm';
import { DonationModal } from './DonationModal';
import { AyinCard } from './AyinCard';
import { DonationCalendar } from './DonationCalendar';

function InfoRow(props: { k: string; v: string; ltr?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{props.k}</span>
      <span
        style={{
          fontWeight: 600,
          textAlign: 'left',
          overflowWrap: 'anywhere',
          direction: props.ltr ? 'ltr' : undefined,
        }}
      >
        {props.v}
      </span>
    </div>
  );
}

export function SupporterDetail(props: { supporter: Supporter; onBack: () => void }) {
  const sp = props.supporter;
  const events = useApp((s) => s.db.events);
  const usdRate = useApp((s) => s.db.usdRate);
  const upsertSupporter = useApp((s) => s.upsertSupporter);
  const deleteSupporter = useApp((s) => s.deleteSupporter);
  const upsertEvent = useApp((s) => s.upsertEvent);
  const deleteEvent = useApp((s) => s.deleteEvent);
  const unlinkEvent = useApp((s) => s.unlinkEvent);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const rfmOn = featureOn(config, 'supporters.rfm');
  const nextOn = featureOn(config, 'supporters.nextdate');
  const ayinOn = featureOn(config, 'supporters.ayin');
  const histOn = featureOn(config, 'supporters.hist');
  const receiptsOn = featureOn(config, 'core.receipts');

  /** 🧾 הורדה חוזרת של קבלת תרומה (P3, לגאסי supReceipt) — אותם נתונים ו-rid. */
  function redownloadReceipt(rid: string) {
    const d = sp.donations.find((x) => x.rid === rid);
    if (!d) return;
    downloadReceipt({
      rid,
      orgName: config.orgName || useApp.getState().db.orgName,
      payer: sp.name,
      amount: d.amount,
      currency: d.cur,
      date: d.date,
      forWhat: 'תרומה — ' + (d.cat || 'כללי'),
      taxReceipt: featureOn(config, 'core.taxreceipt'),
      orgTaxId: config.orgTaxId,
      signatory: config.orgSignatory,
      payerId: sp.idNum || undefined,
      copy: true, // הורדה חוזרת ⇒ "העתק נאמן למקור" (5.5d)
      mark: featureOn(config, 'core.receipt.copymark'),
    });
    toast('קבלה ' + rid + ' ירדה שוב למחשב');
  }

  const [editOpen, setEditOpen] = useState(false);
  const [donOpen, setDonOpen] = useState(false);
  const [armDelete, setArmDelete] = useState(false);
  // P3 פריט 11 — לחיצה על תרומה מסמנת את יומה בלוח האישי
  const [calFocus, setCalFocus] = useState<string | null>(null);

  const score = supScore(sp, usdRate);
  const tier = supTier(score);
  const callNotes = 'משפחה תומכת · ' + (sp.phone || '') + (sp.email ? ' · ' + sp.email : '');

  /**
   * עריכת "קשר הבא" — התזכורת נוצרת/מתעדכנת אוטומטית בלי confirm (P1.9,
   * ratchet legacy saveSupNext, legacy-main-script.js:1432-1444); ניקוי התאריך
   * מוחק גם את התזכורת המקושרת (unlinkEvent — תיקון האירוע היתום, באג ידוע #6).
   */
  function setNextDate(v: string) {
    if (!v) {
      unlinkEvent('supporterNext', sp.id);
      toast('תאריך היעד נוקה');
      return;
    }
    const linked = sp.nextEventId ? events.find((e) => e.id === sp.nextEventId) : undefined;
    if (linked) {
      upsertEvent({ ...linked, title: 'יעד קשר — תומכת: ' + sp.name, date: v, done: false, notes: callNotes });
      upsertSupporter({ ...sp, nextDate: v });
      toast('נקבע תאריך יעד ' + hebDateFull(v) + ' — התזכורת בלוח השנה עודכנה');
    } else {
      const id = nextId('ev');
      upsertEvent({
        id,
        title: 'יעד קשר — תומכת: ' + sp.name,
        date: v,
        time: '',
        type: 'call',
        customType: '',
        notes: callNotes,
        price: 0,
        roomId: '',
        famId: '',
        priority: 'orange',
        done: false,
      });
      upsertSupporter({ ...sp, nextDate: v, nextEventId: id });
      toast('נקבע תאריך יעד ' + hebDateFull(v) + ' — נוספה תזכורת ללוח השנה');
    }
  }

  /** 📞 תזכורת טלפון לתודה — נכנסת ללוח השנה כאירוע 'שיחה' ירוק להיום. */
  function thankYouCall() {
    upsertEvent({
      id: nextId('ev'),
      title: 'להתקשר לתודה — ' + sp.name,
      date: isoToday(),
      time: '',
      type: 'call',
      customType: '',
      notes: callNotes,
      price: 0,
      roomId: '',
      famId: '',
      priority: 'green',
      done: false,
    });
    toast('תזכורת טלפון לתודה נוספה ללוח השנה');
  }

  /** מחיקה בשתי לחיצות (חימוש) — מוחקת גם את תזכורת היעד המקושרת. */
  function onDelete() {
    if (!armDelete) {
      setArmDelete(true);
      window.setTimeout(() => setArmDelete(false), 4000);
      return;
    }
    if (sp.nextEventId) deleteEvent(sp.nextEventId);
    deleteSupporter(sp.id);
    toast('ה' + termOf(config, 'entity.supporter', 'תומך/ת') + ' "' + sp.name + '" נמחק/ה מהמערכת');
    props.onBack();
  }

  // רשימת "כל התרומות" — עם הדגל: מיזוג קבלות + הקובץ ההיסטורי כמו בלגאסי
  // (supDonEvents); בלעדיו: הקבלות בלבד (ההתנהגות הקודמת).
  const donRows = histOn
    ? supDonEvents(sp)
    : [...sp.donations]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((d) => ({ date: d.date, amount: d.amount, cur: d.cur || ('₪' as const), src: 'קבלה ' + d.rid, rid: d.rid }));
  const statsLine =
    sp.count +
    ' ' +
    termOf(config, 'entity.donations', 'תרומות') +
    ' · ' +
    totalLabel(sp) +
    (sp.first ? ' · מ-' + hebDateFull(sp.first) : '') +
    (sp.last ? ' · אחרונה ' + hebDateFull(sp.last) : '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <Btn onClick={props.onBack}>{'→ כל ' + termOf(config, 'nav.supporters', 'התומכים')}</Btn>
      </div>

      {/* כותרת הכרטיס */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          aria-hidden
          style={{
            width: 52,
            height: 52,
            borderRadius: 99,
            background: 'var(--dark)',
            color: 'var(--amber)',
            fontWeight: 800,
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          {sp.name ? sp.name[0] : '💛'}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 19 }}>{sp.name}</span>
            {rfmOn && (
              <span style={chipStyle(tier.bg, tier.c)} title={'ציון משוקלל (R·F·M): ' + score}>
                {tier.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 2 }}>{statsLine}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn kind="primary" onClick={() => setDonOpen(true)}>
            ➕ רישום {termOf(config, 'entity.donation', 'תרומה')}
          </Btn>
          {featureOn(config, 'supporters.thankyou') && (
            <Btn onClick={thankYouCall} title="תזכורת טלפון לתודה — נכנסת ללוח השנה">
              📞 תודה
            </Btn>
          )}
          <Btn onClick={() => setEditOpen(true)}>✎ עריכה</Btn>
          <Btn kind="danger" onClick={onDelete}>
            {armDelete ? 'לאשר מחיקה סופית?' : '🗑 מחיקה'}
          </Btn>
        </div>
      </div>

      {/* פס ציון משוקלל */}
      {rfmOn && (
        <div
          className="card"
          style={{ background: tier.bg, color: tier.c, fontSize: 13.5, fontWeight: 600, padding: '10px 16px' }}
        >
          ציון משוקלל: {score}/1000 · דרגת {tier.label} — משוקלל לפי טריות (R), תדירות (F) וסכום (M)
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* פרטי קשר */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>{'פרטי ' + termOf(config, 'entity.supporter', 'התומך/ת')}</h3>
          <InfoRow k="טלפון" v={sp.phone || '—'} ltr />
          <InfoRow k="אימייל" v={sp.email || '—'} ltr />
          <InfoRow k="כתובת" v={sp.address || '—'} />
          <InfoRow k='ת"ז' v={sp.idNum || '—'} ltr />
          <InfoRow k="קטגוריה" v={sp.cat || '—'} />
          <InfoRow k={'ייעוד ' + termOf(config, 'entity.donation', 'התרומה')} v={sp.forWho || '—'} />
          {sp.notes && <InfoRow k="הערות" v={sp.notes} />}
        </div>

        {/* קשר הבא */}
        {nextOn && (
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>קשר הבא 🎯</h3>
            <Field label="תאריך יעד ליצירת קשר">
              <HebDateInput value={sp.nextDate || ''} onChange={setNextDate} />
            </Field>
            {sp.nextDate ? (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                {sp.nextDate <= isoToday() ? '🔔 תאריך היעד עבר — הגיע הזמן להתקשר' : hebDateFull(sp.nextDate)}
                {sp.nextEventId && events.some((e) => e.id === sp.nextEventId)
                  ? ' · תזכורת 📞 מקושרת בלוח השנה'
                  : ''}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                קביעת תאריך תציע להוסיף תזכורת שיחה ללוח השנה
              </div>
            )}
          </div>
        )}
      </div>

      {/* מעקב טיפול רב-שלבי */}
      {ayinOn && <AyinCard supporter={sp} />}

      {/* לוח-חודש של תרומות (feature: supporters.doncal) */}
      {featureOn(config, 'supporters.doncal') && sp.donations.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>
            🗓 {termOf(config, 'entity.donations', 'תרומות')} לפי חודש
          </h3>
          <DonationCalendar supporter={sp} focusIso={calFocus ?? undefined} />
        </div>
      )}

      {/* היסטוריית תרומות */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <h3 style={{ fontSize: 15 }}>
            {'כל ה' + termOf(config, 'entity.donations', 'תרומות') + ' — מתי וכמה'} ({donRows.length})
          </h3>
          <Btn sm onClick={() => setDonOpen(true)}>
            ➕ רישום {termOf(config, 'entity.donation', 'תרומה')}
          </Btn>
        </div>
        {donRows.length === 0 ? (
          <Empty>{'עדיין אין ' + termOf(config, 'entity.donations', 'תרומות') + ' מתועדות — רשמו עם "➕ רישום ' + termOf(config, 'entity.donation', 'תרומה') + '"'}</Empty>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>תאריך עברי</th>
                  <th>סכום</th>
                  <th>קטגוריה</th>
                  <th>{histOn ? 'מקור' : 'קבלה'}</th>
                  <th aria-hidden />
                </tr>
              </thead>
              <tbody>
                {/* P3 פריט 11: קיטום תצוגה ל-60 (slice בלבד — הנתונים נשמרים);
                    לחיצה על שורה מסמנת את יומה בלוח האישי (כמו בלגאסי) */}
                {donRows.slice(0, 60).map((r, i) => (
                  <tr
                    key={r.rid ?? r.src + '|' + r.date + '|' + i}
                    onClick={() => setCalFocus(r.date)}
                    title="סימון היום בלוח התרומות האישי"
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{fmtDate(r.date)}</td>
                    <td>{hebDateFull(r.date)}</td>
                    <td style={{ fontWeight: 700 }}>
                      {r.cur === '' ? '—' : (r.cur === '$' ? '$' : '₪') + r.amount.toLocaleString('he-IL')}
                    </td>
                    <td>{(r.rid && sp.donations.find((d) => d.rid === r.rid)?.cat) || '—'}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--ink-faint)' }}>
                      {histOn ? r.src : r.rid}
                    </td>
                    {/* 🧾 הורדה חוזרת פר-תרומה (P3, לגאסי supReceipt) — רק לתרומות עם קבלה */}
                    <td onClick={(e) => e.stopPropagation()}>
                      {r.rid && receiptsOn ? (
                        <Btn sm onClick={() => redownloadReceipt(r.rid!)} title={'הורדה חוזרת של קבלה ' + r.rid}>
                          🧾
                        </Btn>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {donRows.length > 60 && (
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '6px 2px' }}>
                {'מוצגות 60 מתוך ' + donRows.length + ' — הכול נשמר וזמין בייצוא ובדוח המותאם'}
              </div>
            )}
          </div>
        )}
      </div>

      {editOpen && <SupporterForm supporter={sp} onClose={() => setEditOpen(false)} />}
      {donOpen && <DonationModal supporter={sp} onClose={() => setDonOpen(false)} />}
    </div>
  );
}
