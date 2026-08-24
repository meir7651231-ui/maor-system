/**
 * מודאל רישום תרומה — תאריך, סכום, מטבע (₪/$) וקטגוריה.
 * הצבירה (count/ils/usd/first/last) מתעדכנת אוטומטית ב-addDonation שב-store;
 * מספר האסמכתה D-{seq} מוצג בטוסט.
 */
import { useState } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, termOf } from '../../lib/config';
import { deliverReceipt, receiptFmtOf, receiptLines } from '../../lib/receipt';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { allDonationPurposes, isoToday } from './lib';

export function DonationModal(props: { supporter: Supporter; onClose: () => void }) {
  const addDonation = useApp((s) => s.addDonation);
  const addPlannedCharges = useApp((s) => s.addPlannedCharges);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const receiptsOn = featureOn(config, 'core.receipts');
  // 📅 חיובים-מתוכננים (בקשת-בעלים 25.8): אשראי-ידני = הבטחה, לא-קבלה עד
  // ש"תשלומים-נכנסים" מאשר. כשהדגל דלוק — בורר-האמצעי חושף אפשרות "אשראי".
  const plannedOn = config.features?.['supporters.plannedcharges'] === true;
  // supporters.multicur כבוי — אין בורר מטבע, הכול נרשם בשקלים
  const multiCurOn = featureOn(config, 'supporters.multicur');

  const [date, setDate] = useState(isoToday());
  const [amount, setAmount] = useState('');
  const [cur, setCur] = useState<'₪' | '$'>('₪');
  const [cat, setCat] = useState(props.supporter.cat || '');
  // ייעוד "אמץ חתן/משפחה" (SHOP9) — מגודר supporters.sponsor
  const sponsorOn = featureOn(config, 'supporters.sponsor');
  const [designation, setDesignation] = useState('');
  // ייעוד/"עבודה" כמסנן-הרשאה פר-עובד (בקשת-בעלים 13.8 ג') — מגודר supporters.purpose
  const purposeOn = featureOn(config, 'supporters.purpose');
  const [purpose, setPurpose] = useState('');
  const knownPurposes = purposeOn ? allDonationPurposes(useApp.getState().db.supporters) : [];
  // אמצעי-התשלום — additive. חסר/'immediate' = ההתנהגות הישנה (D- מיידי).
  // 'credit' + plannedOn = יוצר PlannedCharge (הבטחה), D- יופק כשהחיוב יאושר.
  const [method, setMethod] = useState('immediate');
  const [error, setError] = useState('');
  // UX סבב-ה׳: הקטגוריות הנפוצות בארגון (עד 5) — ברירות-מחדל בקליק
  const topCats = (() => {
    const counts = new Map<string, number>();
    for (const sp of useApp.getState().db.supporters)
      for (const d of sp.donations) {
        const c = (d.cat || '').trim();
        if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
  })();

  function save() {
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!amount.trim() || !isFinite(amt) || amt <= 0) {
      setError('הקלידו סכום ' + termOf(config, 'entity.donation', 'תרומה') + ' תקין');
      return;
    }
    if (!date) {
      setError('בחרו תאריך ' + termOf(config, 'entity.donation', 'תרומה'));
      return;
    }
    // הקבלה יורדת רק כשה-store קיבל את התרומה, ועם ה-rid שהונפק בפועל —
    // קודם ניחשנו rid מ-donationSeq והורדנו קבלה גם על דחייה (rid שמעולם לא הונפק).
    const desig = sponsorOn ? designation.trim() : '';
    const purp = purposeOn ? purpose.trim() : '';
    // 📅 מסלול-אשראי (בקשת-בעלים 25.8): "אשראי-ידני" הופך ל-PlannedCharge —
    // לא-קבלה, לא-D-, רק "רישום ⏳ ממתין לחיוב-נכנס". D- יונפק כשמאשרים
    // "✓ החיוב ירד" בסעיף חיובים-מתוכננים (או בעתיד — אוטומטית ממטבעים
    // ‏incomingPayments). designation/purpose נשמרים ב-note לחיפוש-שיוך.
    if (plannedOn && method === 'credit') {
      const noteParts = [desig ? 'ייעוד: ' + desig : '', purp ? 'עבודה: ' + purp : ''].filter(Boolean);
      const r = addPlannedCharges(props.supporter.id, {
        firstDate: date, count: 1, amount: amt, cur, method: 'credit',
        cat: cat.trim() || termOf(config, 'entity.donation', 'תרומה'),
        note: noteParts.join(' · ') || undefined,
      });
      if (!r.ok) { props.onClose(); return; }
      toast('💳 נרשם ' + (cur === '$' ? '$' : '₪') + amt.toLocaleString('he-IL') + ' · ⏳ ממתין לחיוב-נכנס');
      props.onClose();
      return;
    }
    const res = addDonation(props.supporter.id, {
      date,
      amount: amt,
      cur,
      cat: cat.trim(),
      ...(desig ? { designation: desig } : {}),
      ...(purp ? { purpose: purp } : {}),
    });
    if (!res.ok || !res.rid) {
      props.onClose(); // ה-store כבר הציג טוסט דחייה (התומכת נעלמה)
      return;
    }
    const rid = res.rid;
    let receiptFmt: 'txt' | 'pdf' | undefined; // הפורמט שנמסר בפועל — לטוסט הנכון בהמשך
    // core.receipts כבוי — התרומה נרשמת כרגיל, רק הורדת הקבלה והטוסט שלה מדולגים
    if (receiptsOn) {
      const cfg = useApp.getState().config;
      const taxReceipt = featureOn(cfg, 'core.taxreceipt');
      const info = {
        rid,
        verify: featureOn(cfg, 'core.receipt.verifycode'),
        orgName: cfg.orgName || useApp.getState().db.orgName,
        payer: props.supporter.name,
        amount: amt,
        currency: cur,
        date,
        forWhat: desig ? 'אימוץ — ' + desig : termOf(config, 'entity.donation', 'תרומה') + ' — ' + (cat.trim() || 'כללי'),
        // קבלת סעיף 46 פורמלית — כשהיכולת דלוקה
        taxReceipt,
        mark: featureOn(cfg, 'core.receipt.copymark'),
        orgTaxId: cfg.orgTaxId,
        signatory: cfg.orgSignatory,
        payerId: props.supporter.idNum || undefined,
      };
      // 5.5d (הכרעה 9.8): מסירה לפי בחירת-הלקוח — קובץ טקסט או PDF/הדפסה
      receiptFmt = receiptFmtOf(cfg, useApp.getState().db.ui);
      deliverReceipt(info, receiptFmt);
      // צרור-הלילה (ROADMAP-100 ‏#1): מייל-קבלות אוטומטי — ברגע הרישום הקבלה
      // נכנסת לתור-המייל (mailOutbox); נשלחת ע"י ה-Function כשהשרת פרוס.
      // כשל-רך: תקלה בתור לא נוגעת ברישום/בקבלה שכבר ירדה.
      const st = useApp.getState();
      if (integrationOn(cfg, 'mail') && st.cloud.enabled && !!st.cloud.user && props.supporter.email.trim()) {
        void import('../../store/cloudSync')
          .then((m) => m.writeMailOutbox(props.supporter.email.trim(), 'קבלה ' + rid + ' — ' + info.orgName, receiptLines(info).join('\n')))
          .then(() => st.toast('📧 הקבלה נכנסה לתור-המייל של ' + termOf(config, 'entity.supporter', 'התורם/ת')))
          .catch(() => st.toast('⚠ תור-המייל נכשל — הקבלה ירדה למחשב כרגיל'));
      }
    }
    toast(
      'נרשם/ה ' +
        termOf(config, 'entity.donation', 'תרומה') +
        ' ' +
        (cur === '$' ? '$' : '₪') +
        amt.toLocaleString('he-IL') +
        (receiptsOn ? ' — קבלה ' + rid : '') +
        ' · הציון עודכן',
    );
    // 🐛 נחיל-עמוק (13.8): הטוסט אמר "ירדה למחשב" גם בפורמט PDF (נפתח חלון-הדפסה, לא הורדה)
    if (receiptsOn) toast(receiptFmt === 'pdf' ? 'חלון-ההדפסה נפתח — שמרו כ-PDF ✓' : 'הקבלה ירדה למחשב ✓');
    props.onClose();
  }

  return (
    <Modal
      title={'רישום ' + termOf(config, 'entity.donation', 'תרומה') + ' — ' + props.supporter.name}
      onClose={props.onClose}
    >
      <FormError error={error} />
      <div className="form-grid">
        <Field label="תאריך">
          <HebDateInput value={date} onChange={setDate} />
        </Field>
        <Field label="סכום">
          <TextInput value={amount} onChange={setAmount} type="number" dir="ltr" placeholder="0" />
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
        {/* 📅 בורר-אמצעי (בקשת-בעלים 25.8) — נחשף רק כשהדגל plannedcharges דלוק.
             "אשראי" ⇒ רישום-הבטחה בלי-קבלה; מיידי ⇒ D- מיידי כמו קודם. */}
        {plannedOn && (
          <Field label="אמצעי">
            <Select
              value={method}
              onChange={setMethod}
              options={[
                { value: 'immediate', label: '💵 מיידי (מזומן/צ׳ק/העברה — קבלה עכשיו)' },
                { value: 'credit', label: '💳 אשראי (ממתין לחיוב-נכנס — הקבלה תונפק כשיאושר)' },
              ]}
            />
            {method === 'credit' && (
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
                ⏳ הרישום ישמר כחיוב-מתוכנן. כשמוודאים שהחיוב ירד — לוחצים "✓ החיוב ירד" בסעיף חיובים-מתוכננים ואז נופקת קבלת D-.
              </div>
            )}
          </Field>
        )}
        <Field label="קטגוריה">
          <TextInput value={cat} onChange={setCat} placeholder="מלגות, פעילות, כללי…" />
          {/* UX סבב-ה׳: צ'יפי הקטגוריות-הנפוצות של הארגון — קליק במקום הקלדה */}
          {featureOn(config, 'supporters.doncats') && topCats.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {topCats.map((c) => (
                <button key={c} type="button" className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </Field>
        {sponsorOn && (
          <Field label={'ייעוד — אמץ חתן/' + termOf(config, 'entity.family', 'משפחה') + ' (אופציונלי)'}>
            <TextInput value={designation} onChange={setDesignation} placeholder="למשל: אמץ משפחת כהן / חתונת דוד" />
          </Field>
        )}
        {purposeOn && (
          <Field label="ייעוד/עבודה (הרשאת-תצוגה פר-עובד)">
            <TextInput value={purpose} onChange={setPurpose} placeholder="למשל: חתונות / קמחא דפסחא / כללי" />
            {knownPurposes.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {knownPurposes.slice(0, 8).map((p) => (
                  <button key={p} type="button" className={'chip' + (purpose === p ? ' on' : '')} onClick={() => setPurpose(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </Field>
        )}
      </div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {'רישום ' + termOf(config, 'entity.donation', 'התרומה')}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
