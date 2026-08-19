/**
 * כרטיס תומכ/ת — פרטי קשר, ציון RFM ודרגה, היסטוריית תרומות,
 * רישום תרומה חדשה ותאריך יעד "קשר הבא" עם תזכורת מקושרת בלוח השנה.
 */
import { useState } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting, isSuperAdmin, telephonyOn, termOf } from '../../lib/config';
import { canIssueReceipt } from '../platform/lib';
import { payLink } from '../../lib/payLink';
import { askClaude, readAiKey, thanksPrompt } from '../../lib/ai';
import { annualReportLines, donationYears, downloadAnnualReport } from '../../lib/annualReport';
import { WaBtn } from '../WaBtn';
import { CallBtn } from '../CallBtn';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty, Field, FormError, Modal, Select, StickyBackBar, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { chipStyle, fmtDate, HOK_CAT, hokMethodLabel, hokRecordedThisMonth, isoToday, supCount, supDonEvents, supLast, supScore, supTier, totalLabel } from './lib';
import { deliverReceipt, receiptFmtOf, receiptLines } from '../../lib/receipt';
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
  // 🔐 רק המנהל מנפיק קבלות (הכרעת-בעלים 14.8) — כפתורי-הרישום מוסתרים מעובד/ת;
  // האכיפה-הקשיחה בליבה (addDonation). לקוח-שורש/מקומי/מנהל = מנפיק.
  const cloud = useApp((s) => s.cloud);
  const canIssue = canIssueReceipt({ superAdmin: isSuperAdmin(cloud.user?.email), isManager: !!cloud.isManager, cloudRoot: config.cloudRoot === true, cloudConnected: !!cloud.user });
  // 🔒 ייעוד-הרשאה (13.8): גם בכרטיס של תורם-גלוי, התצוגה (ציון/סטטיסטיקה/רשימה/
  // לוח/דוח-שנתי-לתורם) מסתירה תרומות בייעוד אסור. `sp` הגולמי נשמר לכל הכתיבות
  // (upsertSupporter/addDonation) — `dsp` הוא עותק-תצוגה בלבד.
  const allowedDesignations = useApp((s) => s.cloud.allowedDesignations ?? null);
  const desigLimit = featureOn(config, 'supporters.purpose') ? allowedDesignations : null;
  const dsp = desigLimit
    ? { ...sp, donations: sp.donations.filter((d) => { const p = (d.purpose ?? '').trim(); return !p || desigLimit.includes(p); }) }
    : sp;
  // גל ג׳ — פעולות-הרחבה בכרטיס: 💳 עמוד-תרומה (payments) · 🤖 מכתב-תודה (ai)
  const donateHref = integrationOn(config, 'payments')
    ? payLink(integrationSetting(config, 'payments', 'payUrl'), 0, sp.name)
    : null;
  const aiReady = integrationOn(config, 'ai') && !!readAiKey();
  // גל ד׳ (sms): תור-שליחה בענן — הכפתור רק לארגון-ענן מחובר עם ההרחבה
  const cloudReady = useApp((s) => s.cloud.enabled && !!s.cloud.user);
  const smsReady = integrationOn(config, 'sms') && cloudReady && !!sp.phone;
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsText, setSmsText] = useState('');
  async function sendSms() {
    const t = smsText.trim();
    if (!t) return toast('כתבו הודעה קודם');
    try {
      const mod = await import('../../store/cloudSync');
      await mod.writeSmsOutbox(sp.phone, t);
      toast('📱 ההודעה נכנסה לתור-השליחה');
      setSmsOpen(false);
      setSmsText('');
    } catch {
      toast('⚠ ההכנסה לתור נכשלה — נסו שוב');
    }
  }
  const [aiDraft, setAiDraft] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  async function draftThanks() {
    if (aiBusy) return;
    setAiBusy(true);
    setAiOpen(true);
    setAiDraft('');
    try {
      const last = [...sp.donations].sort((a, b) => b.date.localeCompare(a.date))[0];
      const draft = await askClaude(
        readAiKey(),
        thanksPrompt({
          orgName: config.orgName || '',
          supporterName: sp.name,
          lastAmount: last ? (last.cur === '$' ? '$' : '₪') + last.amount.toLocaleString('he-IL') : totalLabel(sp),
          designation: last?.designation || undefined,
          totalSoFar: totalLabel(sp),
        }),
      );
      setAiDraft(draft);
    } catch (e) {
      setAiDraft('');
      toast('⚠ ' + (e instanceof Error ? e.message : 'הטיוטה נכשלה'));
      setAiOpen(false);
    } finally {
      setAiBusy(false);
    }
  }
  const rfmOn = featureOn(config, 'supporters.rfm');
  const nextOn = featureOn(config, 'supporters.nextdate');
  // 🔁 הו"ק (ROADMAP-100 ‏#2): הגדרה+רישום — התרומה דרך addDonation (קבלה רציפה)
  const hokOn = featureOn(config, 'supporters.hok');
  const [hokOpen, setHokOpen] = useState(false);
  const addDonation = useApp((s) => s.addDonation);
  function recordHok() {
    const hok = sp.hok;
    if (!hok) return;
    const res = addDonation(sp.id, { date: isoToday(), amount: hok.amount, cur: hok.cur, cat: HOK_CAT });
    if (!res.ok || !res.rid) return; // ה-store כבר הציג טוסט-דחייה
    if (featureOn(config, 'core.receipts')) {
      // הקבלה טרייה — נבנית מהסטור המעודכן (sp שבידינו עלול להיות ישן לרנדר הזה)
      const fresh = useApp.getState().db.supporters.find((x) => x.id === sp.id);
      const d = fresh?.donations.find((x) => x.rid === res.rid);
      if (d) {
        // 5.5d (הכרעה 9.8): מסירה לפי בחירת-הלקוח — קובץ טקסט או PDF/הדפסה
        deliverReceipt({
          rid: res.rid,
          verify: featureOn(config, 'core.receipt.verifycode'),
          orgName: config.orgName || useApp.getState().db.orgName,
          payer: sp.name,
          amount: d.amount,
          currency: d.cur,
          date: d.date,
          forWhat: termOf(config, 'entity.donation', 'תרומה') + ' — ' + HOK_CAT,
          taxReceipt: featureOn(config, 'core.taxreceipt'),
          mark: featureOn(config, 'core.receipt.copymark'),
          orgTaxId: config.orgTaxId,
          signatory: config.orgSignatory,
          payerId: sp.idNum || undefined,
        }, receiptFmtOf(config, useApp.getState().db.ui));
      }
    }
    toast('🔁 חיוב-החודש נרשם' + (featureOn(config, 'core.receipts') ? ' — קבלה ' + res.rid : ''));
  }
  const ayinOn = featureOn(config, 'supporters.ayin');
  const histOn = featureOn(config, 'supporters.hist');
  const receiptsOn = featureOn(config, 'core.receipts');

  /** נתוני-הקבלה המשותפים להורדה-חוזרת ולשליחה-במייל — אותם נתונים ו-rid. */
  function receiptInfoFor(rid: string) {
    const d = sp.donations.find((x) => x.rid === rid);
    if (!d) return null;
    return {
      rid,
      verify: featureOn(config, 'core.receipt.verifycode'),
      orgName: config.orgName || useApp.getState().db.orgName,
      payer: sp.name,
      amount: d.amount,
      currency: d.cur,
      date: d.date,
      forWhat: termOf(config, 'entity.donation', 'תרומה') + ' — ' + (d.cat || 'כללי'),
      taxReceipt: featureOn(config, 'core.taxreceipt'),
      orgTaxId: config.orgTaxId,
      signatory: config.orgSignatory,
      payerId: sp.idNum || undefined,
      copy: true, // הנפקה-חוזרת ⇒ "העתק נאמן למקור" (5.5d)
      mark: featureOn(config, 'core.receipt.copymark'),
    };
  }

  /** 🧾 הורדה חוזרת של קבלת תרומה (P3, לגאסי supReceipt). */
  function redownloadReceipt(rid: string) {
    const info = receiptInfoFor(rid);
    if (!info) return;
    const fmt = receiptFmtOf(config, useApp.getState().db.ui);
    deliverReceipt(info, fmt);
    toast(fmt === 'pdf' ? 'קבלה ' + rid + ' נפתחה להדפסה/PDF' : 'קבלה ' + rid + ' ירדה שוב למחשב');
  }

  // צרור-הלילה (ROADMAP-100 ‏#1): קבלה במייל — תור mailOutbox, נשלח ע"י ה-Function
  const mailReady = integrationOn(config, 'mail') && cloudReady && !!sp.email;
  async function mailReceipt(rid: string) {
    const info = receiptInfoFor(rid);
    if (!info) return;
    try {
      const mod = await import('../../store/cloudSync');
      await mod.writeMailOutbox(sp.email, 'קבלה ' + rid + ' — ' + info.orgName, receiptLines(info).join('\n'));
      toast('📧 קבלה ' + rid + ' נכנסה לתור-המייל');
    } catch {
      toast('⚠ ההכנסה לתור נכשלה — נסו שוב');
    }
  }

  const [editOpen, setEditOpen] = useState(false);
  const [donOpen, setDonOpen] = useState(false);
  const [armDelete, setArmDelete] = useState(false);
  // P3 פריט 11 — לחיצה על תרומה מסמנת את יומה בלוח האישי
  const [calFocus, setCalFocus] = useState<string | null>(null);

  const score = supScore(dsp, usdRate);
  const tier = supTier(score);
  const callNotes = termOf(config, 'entity.family', 'משפחה') + ' תומכת · ' + (sp.phone || '') + (sp.email ? ' · ' + sp.email : '');

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
      upsertEvent({ ...linked, title: 'יעד קשר — ' + termOf(config, 'entity.supporter', 'תומך/ת') + ': ' + sp.name, date: v, done: false, notes: callNotes });
      upsertSupporter({ ...sp, nextDate: v });
      toast('נקבע תאריך יעד ' + hebDateFull(v) + ' — התזכורת בלוח השנה עודכנה');
    } else {
      const id = nextId('ev');
      upsertEvent({
        id,
        title: 'יעד קשר — ' + termOf(config, 'entity.supporter', 'תומך/ת') + ': ' + sp.name,
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
    ? supDonEvents(dsp, config)
    : [...dsp.donations]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((d) => ({ date: d.date, amount: d.amount, cur: d.cur || ('₪' as const), src: 'קבלה ' + d.rid, rid: d.rid }));
  // הכרעת 9.8 "לכולל": שורת-הסטטיסטיקה כוללת את הקובץ ההיסטורי
  const statsLine =
    supCount(dsp) +
    ' ' +
    termOf(config, 'entity.donations', 'תרומות') +
    ' · ' +
    totalLabel(dsp) +
    (dsp.first ? ' · מ-' + hebDateFull(dsp.first) : '') +
    (supLast(dsp) ? ' · אחרונה ' + hebDateFull(supLast(dsp)) : '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 }}>
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
          {canIssue && (
            <Btn kind="primary" onClick={() => setDonOpen(true)}>
              ➕ רישום {termOf(config, 'entity.donation', 'תרומה')}
            </Btn>
          )}
          {/* ROADMAP-100 ‏#4: דוח-שנתי-לתורם — ריכוז תרומות שנת-המס (לא קבלה!) */}
          {featureOn(config, 'supporters.annualreport') && donationYears(dsp.donations).length > 0 && (
            <Btn
              onClick={() => {
                const year = donationYears(dsp.donations)[0];
                downloadAnnualReport(
                  'annual-' + year + '-' + sp.name.replace(/\s+/g, '_') + '.txt',
                  annualReportLines({
                    orgName: config.orgName || useApp.getState().db.orgName,
                    orgTaxId: config.orgTaxId,
                    supporterName: sp.name,
                    payerId: sp.idNum,
                    year,
                    donations: dsp.donations,
                  }),
                );
                toast('📄 דוח שנת ' + year + ' ירד');
              }}
              title="ריכוז כל תרומות השנה האחרונה — לתורם/רו״ח (הקבלות המקוריות מצוינות בכל שורה)"
            >
              📄 דוח שנתי
            </Btn>
          )}
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
          {/* INTEGRATIONS — פעולות-הרחבה: 💬 וואטסאפ · 💳 עמוד-תרומה · 🤖 מכתב-תודה */}
          {(telephonyOn(config) || integrationOn(config, 'whatsapp') || integrationOn(config, 'payments') || aiReady || smsReady) && (
            <div style={{ textAlign: 'left', marginBottom: 2, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              {aiReady && (
                <Btn sm onClick={() => void draftThanks()} title="טיוטת מכתב-תודה אישי (עוזר-AI)">
                  🤖 מכתב תודה
                </Btn>
              )}
              {donateHref && (
                // היה אמוג׳י-💳 בודד (בלי תווית ובלי aria-label) — נעלם-הפשר במגע
                // וחריג לאחיו (🤖 מכתב תודה / 📱 SMS) שנושאים טקסט. עכשיו תווית גלויה
                // + aria-label, בסגנון-צ׳יפ אחיד. אותו href/target — אפס שינוי-התנהגות.
                <a
                  href={donateHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip"
                  title="עמוד-התרומה של הארגון — קישור לתשלום מקוון"
                  aria-label="פתיחת עמוד-התרומה של הארגון"
                  style={{ textDecoration: 'none' }}
                >
                  💳 עמוד תרומה
                </a>
              )}
              {smsReady && (
                <Btn sm onClick={() => setSmsOpen(true)} title="שליחת SMS דרך תור-הענן (דורש שרת-הרחבות פרוס)">
                  📱 SMS
                </Btn>
              )}
              {telephonyOn(config) && sp.phone && <CallBtn phone={sp.phone} title={'חיוג ל' + sp.name} />}
              {integrationOn(config, 'whatsapp') && sp.phone && <WaBtn phone={sp.phone} title={'וואטסאפ ל' + sp.name} />}
            </div>
          )}
          <InfoRow k="טלפון" v={sp.phone || '—'} ltr />
          <InfoRow k="אימייל" v={sp.email || '—'} ltr />
          <InfoRow k="כתובת" v={sp.address || '—'} />
          <InfoRow k='ת"ז' v={sp.idNum || '—'} ltr />
          <InfoRow k="קטגוריה" v={sp.cat || '—'} />
          <InfoRow k={'ייעוד ' + termOf(config, 'entity.donation', 'התרומה')} v={sp.forWho || '—'} />
          {sp.notes && <InfoRow k="הערות" v={sp.notes} />}
        </div>

        {/* 🔁 הוראת קבע (ROADMAP-100 ‏#2 צד-מערכת) — הגדרה + רישום-החודש-בקליק */}
        {hokOn && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, flex: 1 }}>הוראת קבע 🔁</h3>
              <Btn sm onClick={() => setHokOpen(true)}>{sp.hok ? '✏️ עריכה' : '➕ הגדרה'}</Btn>
            </div>
            {sp.hok ? (
              <>
                <div style={{ fontSize: 13.5 }}>
                  {(sp.hok.cur === '$' ? '$' : '₪') + sp.hok.amount.toLocaleString('he-IL') +
                    ' · יום ' + sp.hok.day + ' בחודש · ' + hokMethodLabel(sp.hok.method) +
                    (sp.hok.active ? '' : ' · ⏸ מושהית')}
                </div>
                {sp.hok.note && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>{sp.hok.note}</div>}
                {sp.hok.active && canIssue && (
                  hokRecordedThisMonth(sp, isoToday()) ? (
                    <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 6 }}>✓ חיוב-החודש נרשם</div>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <Btn sm kind="primary" onClick={recordHok} title="רישום תרומת-ההו״ק של החודש — קבלה בסדרה הרציפה">
                        🔁 רישום חיוב-החודש
                      </Btn>
                    </div>
                  )
                )}
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                אין הוראת-קבע. ההגדרה כאן = מעקב ותזכורת-חודשית; החיוב עצמו מוגדר אצל הסליקה/הבנק.
              </div>
            )}
          </div>
        )}

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
      {featureOn(config, 'supporters.doncal') && dsp.donations.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>
            🗓 {termOf(config, 'entity.donations', 'תרומות')} לפי חודש
          </h3>
          <DonationCalendar supporter={dsp} focusIso={calFocus ?? undefined} />
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
          <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
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
                    <td>{(r.rid && dsp.donations.find((d) => d.rid === r.rid)?.cat) || '—'}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right', color: 'var(--ink-faint)' }}>
                      {histOn ? r.src : r.rid}
                    </td>
                    {/* 🧾 הורדה חוזרת פר-תרומה (P3, לגאסי supReceipt) — רק לתרומות עם קבלה */}
                    <td onClick={(e) => e.stopPropagation()}>
                      {r.rid && receiptsOn ? (
                        <>
                          <Btn sm onClick={() => redownloadReceipt(r.rid!)} title={'הורדה חוזרת של קבלה ' + r.rid}>
                            🧾
                          </Btn>
                          {mailReady && (
                            <Btn sm onClick={() => void mailReceipt(r.rid!)} title={'שליחת קבלה ' + r.rid + ' למייל ' + termOf(config, 'entity.supporter', 'התורם')}>
                              📧
                            </Btn>
                          )}
                        </>
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
      {hokOpen && <HokModal supporter={sp} onClose={() => setHokOpen(false)} />}
      {smsOpen && (
        <Modal title={'📱 SMS אל ' + sp.name} onClose={() => setSmsOpen(false)}>
          <textarea
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            rows={4}
            maxLength={670}
            placeholder="תוכן ההודעה…"
            style={{ width: '100%', fontSize: 13.5, padding: 10, borderRadius: 10, border: '1px solid var(--line)', resize: 'vertical' }}
          />
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 }}>
            נשלח אל {sp.phone} דרך תור-הענן (שרת-ההרחבות שולח תוך דקה).
          </div>
          <div className="modal-actions">
            <Btn kind="primary" onClick={() => void sendSms()}>שליחה לתור</Btn>
            <Btn onClick={() => setSmsOpen(false)}>ביטול</Btn>
          </div>
        </Modal>
      )}
      {aiOpen && (
        <Modal title={'🤖 מכתב תודה — ' + sp.name} onClose={() => setAiOpen(false)}>
          {aiBusy ? (
            <div className="empty">מנסח טיוטה…</div>
          ) : (
            <>
              <textarea
                value={aiDraft}
                onChange={(e) => setAiDraft(e.target.value)}
                rows={8}
                style={{ width: '100%', fontSize: 13.5, padding: 10, borderRadius: 10, border: '1px solid var(--line)', resize: 'vertical' }}
              />
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 }}>
                טיוטה בלבד — ערכו לפני שליחה. הטקסט לא נשמר במערכת.
              </div>
              <div className="modal-actions">
                <Btn
                  kind="primary"
                  onClick={() =>
                    void navigator.clipboard
                      ?.writeText(aiDraft)
                      .then(() => toast('המכתב הועתק — הדביקו בוואטסאפ/מייל'))
                      .catch(() => toast('העתקה נכשלה — סמנו והעתיקו ידנית'))
                  }
                >
                  📋 העתקה
                </Btn>
                <Btn onClick={() => void draftThanks()}>🔄 נסח מחדש</Btn>
                <Btn onClick={() => setAiOpen(false)}>סגירה</Btn>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* פריט ג' (19.8): כפתור-חזרה מרחף קבוע בתחתית — רכיב משותף */}
      <StickyBackBar onBack={props.onBack} label={'→ כל ' + termOf(config, 'nav.supporters', 'התומכים')} />
    </div>
  );
}

/** 🔁 מודאל הגדרת/עריכת הוראת-קבע — ההגדרה בלבד; הרישום דרך recordHok (קבלה רציפה). */
function HokModal(props: { supporter: Supporter; onClose: () => void }) {
  const sp = props.supporter;
  const upsertSupporter = useApp((s) => s.upsertSupporter);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const multiCurOn = featureOn(config, 'supporters.multicur');
  const [amount, setAmount] = useState(sp.hok ? String(sp.hok.amount) : '');
  const [cur, setCur] = useState<'₪' | '$'>(sp.hok?.cur ?? '₪');
  const [day, setDay] = useState(String(sp.hok?.day ?? 1));
  const [method, setMethod] = useState(sp.hok?.method ?? 'bank');
  const [note, setNote] = useState(sp.hok?.note ?? '');
  const [active, setActive] = useState(sp.hok?.active ?? true);
  const [error, setError] = useState('');

  function save() {
    const amt = Math.round(Number(amount) * 100) / 100;
    const d = Math.round(Number(day));
    if (!amount.trim() || !isFinite(amt) || amt <= 0) return setError('הקלידו סכום חודשי תקין');
    if (!isFinite(d) || d < 1 || d > 28) return setError('יום-החיוב: 1 עד 28 (קיים בכל חודש)');
    upsertSupporter({
      ...sp,
      hok: {
        amount: amt,
        cur,
        day: d,
        method,
        note: note.trim(),
        active,
        startedAt: sp.hok?.startedAt || isoToday(),
      },
    });
    toast(active ? '🔁 הוראת-הקבע נשמרה' : '⏸ הוראת-הקבע הושהתה');
    props.onClose();
  }

  function remove() {
    const { hok: _drop, ...rest } = sp;
    upsertSupporter(rest as Supporter);
    toast('הוראת-הקבע הוסרה');
    props.onClose();
  }

  return (
    <Modal title={'הוראת קבע 🔁 — ' + sp.name} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="סכום חודשי">
          <TextInput value={amount} onChange={setAmount} type="number" dir="ltr" placeholder="180" />
        </Field>
        {multiCurOn && (
          <Field label="מטבע">
            <Select
              value={cur}
              onChange={(v) => setCur(v === '$' ? '$' : '₪')}
              options={[
                { value: '₪', label: '₪ שקל' },
                { value: '$', label: '$ דולר' },
              ]}
            />
          </Field>
        )}
        <Field label="יום בחודש (1–28)">
          <TextInput value={day} onChange={setDay} type="number" dir="ltr" placeholder="10" />
        </Field>
        <Field label="אמצעי">
          <Select
            value={method}
            onChange={setMethod}
            options={[
              { value: 'bank', label: 'הו"ק בנקאית' },
              { value: 'card', label: 'אשראי בסליקה' },
              { value: 'cash', label: 'מזומן חודשי' },
              { value: 'other', label: 'אחר' },
            ]}
          />
        </Field>
        <Field label="הערה (אופציונלי)">
          <TextInput value={note} onChange={setNote} placeholder="למשל: לזכות פלוני" />
        </Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, margin: '8px 0' }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        פעילה (תופיע בתזכורת-החודשית)
      </label>
      <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>
        ההגדרה כאן = מעקב ותזכורות; החיוב-בפועל מוגדר אצל חברת-הסליקה או בבנק.
      </div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה</Btn>
        {sp.hok && <Btn kind="danger" onClick={remove}>🗑 הסרה</Btn>}
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
