/**
 * מודאל רישום תרומה — תאריך, סכום, מטבע (₪/$) וקטגוריה.
 * הצבירה (count/ils/usd/first/last) מתעדכנת אוטומטית ב-addDonation שב-store;
 * מספר האסמכתה D-{seq} מוצג בטוסט.
 */
import { useState } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, termOf } from '../../lib/config';
import { downloadReceipt, receiptLines } from '../../lib/receipt';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from './lib';

export function DonationModal(props: { supporter: Supporter; onClose: () => void }) {
  const addDonation = useApp((s) => s.addDonation);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const receiptsOn = featureOn(config, 'core.receipts');
  // supporters.multicur כבוי — אין בורר מטבע, הכול נרשם בשקלים
  const multiCurOn = featureOn(config, 'supporters.multicur');

  const [date, setDate] = useState(isoToday());
  const [amount, setAmount] = useState('');
  const [cur, setCur] = useState<'₪' | '$'>('₪');
  const [cat, setCat] = useState(props.supporter.cat || '');
  // ייעוד "אמץ חתן/משפחה" (SHOP9) — מגודר supporters.sponsor
  const sponsorOn = featureOn(config, 'supporters.sponsor');
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState('');

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
    const res = addDonation(props.supporter.id, { date, amount: amt, cur, cat: cat.trim(), ...(desig ? { designation: desig } : {}) });
    if (!res.ok || !res.rid) {
      props.onClose(); // ה-store כבר הציג טוסט דחייה (התומכת נעלמה)
      return;
    }
    const rid = res.rid;
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
      downloadReceipt(info);
      // צרור-הלילה (ROADMAP-100 ‏#1): מייל-קבלות אוטומטי — ברגע הרישום הקבלה
      // נכנסת לתור-המייל (mailOutbox); נשלחת ע"י ה-Function כשהשרת פרוס.
      // כשל-רך: תקלה בתור לא נוגעת ברישום/בקבלה שכבר ירדה.
      const st = useApp.getState();
      if (integrationOn(cfg, 'mail') && st.cloud.enabled && !!st.cloud.user && props.supporter.email.trim()) {
        void import('../../store/cloudSync')
          .then((m) => m.writeMailOutbox(props.supporter.email.trim(), 'קבלה ' + rid + ' — ' + info.orgName, receiptLines(info).join('\n')))
          .then(() => st.toast('📧 הקבלה נכנסה לתור-המייל של התורם/ת'))
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
    if (receiptsOn) toast('הקבלה ירדה למחשב ✓');
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
        <Field label="קטגוריה">
          <TextInput value={cat} onChange={setCat} placeholder="מלגות, פעילות, כללי…" />
        </Field>
        {sponsorOn && (
          <Field label={'ייעוד — אמץ חתן/' + termOf(config, 'entity.family', 'משפחה') + ' (אופציונלי)'}>
            <TextInput value={designation} onChange={setDesignation} placeholder="למשל: אמץ משפחת כהן / חתונת דוד" />
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
