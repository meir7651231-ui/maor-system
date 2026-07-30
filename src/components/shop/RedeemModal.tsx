/**
 * 🎁 מימוש רכיב (חנות 5; מותאם-סוג — חנות 16, הכרעת בעלים 15):
 * פגישה — תאריך והערה בלבד (אפס כסף, paid/value=0, אין S-);
 * קופון — שורת מחיר + "לתשלום" בלבד (השווי נלקח אוטומטית מהרכיב);
 * מתנה/מתנת-חג — מחיר אוטומטי מ-effectivePrice, ניתן לעריכה.
 * הכסף נרשם ב-addShopRedemption בלבד — מבודד מקבלות/תרומות (הכרעת בעלים 30.7).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import type { ShopAssignment, ShopComponent } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';
import { componentRemaining, couponExpiry, effectivePrice, maxDiscountPct, upcomingHolidays } from './lib';

export function RedeemModal(props: { assignment: ShopAssignment; component: ShopComponent; onClose: () => void }) {
  const criteria = useApp((s) => s.db.shopCriteria);
  const assignments = useApp((s) => s.db.shopAssignments);
  const addShopRedemption = useApp((s) => s.addShopRedemption);
  const toast = useApp((s) => s.toast);
  const a = props.assignment;
  const c = props.component;
  // הסתעפות לפי סוג הרכיב (הכרעת בעלים 15)
  const isMeeting = c.kind === 'meeting';
  const isCoupon = c.kind === 'coupon';

  const pct = maxDiscountPct(a.criterionIds, criteria);
  const price = effectivePrice(c.basePrice, a.criterionIds, criteria);
  const holidays = c.kind === 'holidayGift' ? upcomingHolidays(isoToday(), 45) : [];
  // אזהרות רכות בלבד — מלאי שאזל / קופון שפקע אינם חוסמים מימוש (שיקול משרדי)
  const remaining = componentRemaining(c.id, a.productId, assignments, c.stock);
  const expiry = isCoupon ? couponExpiry(a, c) : '';
  const expired = !!expiry && expiry < isoToday();

  const [f, setF] = useState({
    date: isoToday(),
    holiday: holidays[0]?.name ?? '',
    paid: String(price),
    value: c.value ? String(c.value) : '0',
    note: '',
  });
  const [error, setError] = useState('');

  function save() {
    // פגישה — בלי כסף בכלל; קופון — השווי נלקח מהרכיב, לא מהטופס
    const paid = isMeeting ? 0 : f.paid.trim() === '' ? 0 : Math.round(+f.paid);
    const value = isMeeting ? 0 : isCoupon ? c.value : f.value.trim() === '' ? 0 : Math.round(+f.value);
    if (!Number.isFinite(paid) || paid < 0 || !Number.isFinite(value) || value < 0)
      return setError('הסכומים חייבים להיות מספרים אי-שליליים (0 = מתנה מלאה)');
    if (c.kind === 'holidayGift' && !f.holiday) return setError('למתנת-חג נדרש לבחור חג');
    const res = addShopRedemption(a.id, {
      componentId: c.id,
      date: f.date,
      holiday: c.kind === 'holidayGift' ? f.holiday : '',
      paid,
      value,
      note: f.note.trim(),
    });
    if (!res.ok) return; // ה-store כבר הציג טוסט דחייה
    // rid מגיע רק כשהאישור הונפק בפועל (paid>0) — ה-UI לא מנחש (לקח באג-5)
    toast(
      isMeeting
        ? 'הפגישה נרשמה כהתקיימה'
        : 'נרשם מימוש — שולם ' + paid.toLocaleString('he-IL') + ' ₪' + (res.rid ? ' · אישור ' + res.rid + ' הונפק' : ''),
    );
    props.onClose();
  }

  return (
    <Modal title={(isMeeting ? '🤝 קיום פגישה — ' : '🎁 מימוש — ') + c.label} onClose={props.onClose}>
      <FormError error={error} />
      {!isMeeting && remaining === 0 && (
        <div style={{ background: '#fdf1d4', color: '#9a6414', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, marginBottom: 10 }}>
          ⚠ המלאי אזל — המימוש אינו נחסם, אך כדאי לחדש מלאי
        </div>
      )}
      {expired && (
        <div style={{ background: '#fdf1d4', color: '#9a6414', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, marginBottom: 10 }}>
          {'⚠ הקופון פג ב-' + expiry + ' — המימוש אינו נחסם (שיקול משרדי)'}
        </div>
      )}
      {!isMeeting && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
          {'מחיר מלא ' + c.basePrice.toLocaleString('he-IL') + ' ₪ − הנחה ' + pct + '% = ' + price.toLocaleString('he-IL') + ' ₪'}
        </div>
      )}
      <div className="form-grid">
        <Field label={isMeeting ? 'תאריך הפגישה' : 'תאריך המימוש'}>
          <HebDateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        </Field>
        {c.kind === 'holidayGift' && (
          <Field label="החג *">
            <Select
              value={f.holiday}
              onChange={(v) => setF({ ...f, holiday: v })}
              options={holidays.map((h) => ({ value: h.name, label: h.name + ' (' + h.iso + ')' }))}
            />
          </Field>
        )}
        {!isMeeting && (
          <Field label='לתשלום (ש"ח) — ניתן לעריכה'>
            <TextInput value={f.paid} onChange={(v) => setF({ ...f, paid: v })} type="number" dir="ltr" />
          </Field>
        )}
        {!isMeeting && !isCoupon && (
          <Field label='שווי שנמסר (ש"ח)'>
            <TextInput value={f.value} onChange={(v) => setF({ ...f, value: v })} type="number" dir="ltr" />
          </Field>
        )}
      </div>
      <Field label="הערה">
        <TextInput value={f.note} onChange={(v) => setF({ ...f, note: v })} placeholder={isMeeting ? 'לדוגמה: התקיימה אצל המשפחה' : 'לדוגמה: נמסר בבית המשפחה'} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>{isMeeting ? 'רישום הפגישה' : 'רישום המימוש'}</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
