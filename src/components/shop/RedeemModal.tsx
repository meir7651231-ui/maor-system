/**
 * 🎁 מימוש רכיב (חנות 5; מותאם-סוג — חנות 16, הכרעת בעלים 15):
 * פגישה — תאריך והערה בלבד (אפס כסף, paid/value=0, אין S-);
 * קופון — שורת מחיר + "לתשלום" בלבד (השווי נלקח אוטומטית מהרכיב);
 * מתנה/מתנת-חג — מחיר אוטומטי מ-effectivePrice, ניתן לעריכה.
 * הכסף נרשם ב-addShopRedemption בלבד — מבודד מקבלות/תרומות (הכרעת בעלים 30.7).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import type { ShopAssignment, ShopComponent } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';
import { nsLsKey } from '../../store/persist';
import { beneficiaryLabel, componentRemaining, couponExpiry, effectivePrice, itemOf, itemRemaining, maxDiscountPct, upcomingHolidays } from './lib';

export function RedeemModal(props: { assignment: ShopAssignment; component: ShopComponent; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const criteria = useApp((s) => s.db.shopCriteria);
  const assignments = useApp((s) => s.db.shopAssignments);
  const addShopRedemption = useApp((s) => s.addShopRedemption);
  const addShopPlanned = useApp((s) => s.addShopPlanned);
  const addShopWait = useApp((s) => s.addShopWait);
  const toast = useApp((s) => s.toast);
  // 📅 חיובים-מתוכננים בחנות (בקשת-בעלים 25.8) — opt-in.
  const shopPlannedOn = config.features?.['shop.plannedcharges'] === true;
  const a = props.assignment;
  const c = props.component;
  // הפריט + דריסות הרכיב (SHOP4, הכרעה 18) — מקור האמת לשווי/מחיר/מלאי/תוקף
  const ri = itemOf(db, c);
  // הסתעפות לפי סוג הרכיב (הכרעת בעלים 15)
  const isMeeting = ri.kind === 'meeting';
  const isCoupon = ri.kind === 'coupon';

  const pct = maxDiscountPct(a.criterionIds, criteria);
  const price = effectivePrice(ri.basePrice, a.criterionIds, criteria);
  const holidays = ri.kind === 'holidayGift' ? upcomingHolidays(isoToday(), 45) : [];
  // אזהרות רכות בלבד — מלאי שאזל / קופון שפקע אינם חוסמים מימוש (שיקול משרדי)
  const remaining = c.itemId ? itemRemaining(db, c.itemId) : componentRemaining(c.id, a.productId, assignments, c.stock);
  const expiry = isCoupon ? couponExpiry(a, ri) : '';
  const expired = !!expiry && expiry < isoToday();

  const [f, setF] = useState({
    date: isoToday(),
    holiday: holidays[0]?.name ?? '',
    paid: String(price),
    value: ri.value ? String(ri.value) : '0',
    note: '',
  });
  // אמצעי-תשלום — 'immediate' = מימוש-מיידי (S- עכשיו); 'credit' = חיוב-מתוכנן.
  const [method, setMethod] = useState('immediate');
  const [error, setError] = useState('');

  function save() {
    // פגישה — בלי כסף בכלל; קופון — השווי נלקח מהרכיב, לא מהטופס
    const paid = isMeeting ? 0 : f.paid.trim() === '' ? 0 : Math.round(+f.paid);
    const value = isMeeting ? 0 : isCoupon ? ri.value : f.value.trim() === '' ? 0 : Math.round(+f.value);
    if (!Number.isFinite(paid) || paid < 0 || !Number.isFinite(value) || value < 0)
      return setError('הסכומים חייבים להיות מספרים אי-שליליים (0 = מתנה מלאה)');
    // תיקון (swarm-audit): תאריך ריק (ניקוי בשדה הלועזי של HebDateInput) נכתב verbatim
    // למימוש ול-S- — אישור מודפס בלי תאריך וסינון-היסטוריה נשבר. חוסמים כמו BulkRedeemModal.
    if (!f.date) return setError(isMeeting ? 'בחרו תאריך לפגישה' : 'בחרו תאריך למימוש');
    if (ri.kind === 'holidayGift' && !f.holiday) return setError('למתנת-חג נדרש לבחור חג');
    // 📅 מסלול-אשראי (בקשת-בעלים 25.8): shopPlannedOn + method='credit' + paid>0
    // ⇒ הרישום הופך ל-PlannedCharge (count=1) — לא-S- עד "✓ החיוב ירד" בסעיף
    // חיובים-מתוכננים. פגישה (paid=0) לא-רלוונטית ⇒ ממשיך למסלול-המקורי.
    if (shopPlannedOn && method === 'credit' && !isMeeting && paid > 0) {
      const r = addShopPlanned(a.id, {
        componentId: c.id, firstDate: f.date, count: 1, amount: paid, method: 'אשראי',
        shopValue: value, shopHoliday: ri.kind === 'holidayGift' ? f.holiday : '',
        note: f.note.trim() || undefined,
      });
      if (!r.ok) return;
      toast('💳 נרשם ₪' + paid + ' · ⏳ ממתין לחיוב-נכנס');
      props.onClose();
      return;
    }
    const res = addShopRedemption(a.id, {
      componentId: c.id,
      date: f.date,
      holiday: ri.kind === 'holidayGift' ? f.holiday : '',
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
    <Modal title={(isMeeting ? '🤝 קיום פגישה — ' : '🎁 מימוש — ') + ri.name} onClose={props.onClose}>
      <FormError error={error} />
      {!isMeeting && remaining === 0 && (
        <div style={{ background: '#fdf1d4', color: '#9a6414', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>⚠ המלאי אזל — המימוש אינו נחסם, אך כדאי לחדש מלאי</span>
          {/* רשימת המתנה (SHOP6 חנות 27) — הצעה אוטומטית במלאי 0; מגודר כמו התצוגה ב-ItemsPanel */}
          {c.itemId && featureOn(config, 'shop.waitlist') && (
            <Btn
              sm
              onClick={() => {
                if (addShopWait(c.itemId, a.famId, '')) {
                  toast('נוספה לרשימת ההמתנה — תופיע התרעה כשהמלאי יחזור');
                  props.onClose();
                }
              }}
            >
              ⏳ להוסיף לרשימת ההמתנה?
            </Btn>
          )}
        </div>
      )}
      {expired && (
        <div style={{ background: '#fdf1d4', color: '#9a6414', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, marginBottom: 10 }}>
          {'⚠ הקופון פג ב-' + expiry + ' — המימוש אינו נחסם (שיקול משרדי)'}
        </div>
      )}
      {!isMeeting && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
          {'מחיר מלא ' + ri.basePrice.toLocaleString('he-IL') + ' ₪ − הנחה ' + pct + '% = ' + price.toLocaleString('he-IL') + ' ₪'}
        </div>
      )}
      <div className="form-grid">
        <Field label={isMeeting ? 'תאריך הפגישה' : 'תאריך המימוש'}>
          <HebDateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        </Field>
        {ri.kind === 'holidayGift' && (
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
        {/* 📅 בורר-אמצעי (בקשת-בעלים 25.8) — רק לחיוב-מוצר (לא-פגישה) וכשהדגל דלוק */}
        {!isMeeting && shopPlannedOn && Math.round(+f.paid) > 0 && (
          <Field label="אמצעי">
            <Select
              value={method}
              onChange={setMethod}
              options={[
                { value: 'immediate', label: '💵 מיידי (מזומן/צ׳ק/העברה — S- עכשיו)' },
                { value: 'credit', label: '💳 אשראי (ממתין לחיוב-נכנס — S- יונפק כשיאושר)' },
              ]}
            />
            {method === 'credit' && (
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
                ⏳ המימוש ישמר כחיוב-מתוכנן. כשמאשרים "✓ החיוב ירד" בסעיף חיובים-מתוכננים ⇒ ‎S-‎ אמיתי + ShopRedemption נוצרים אוטומטית.
              </div>
            )}
          </Field>
        )}
        {/* גבייה בקופה הרושמת (הכרעה 20) — כלי ספירה בלבד: sessionStorage +
            ‎#cashbox; אפס כתיבה ל-db — האמת הכספית נשארת במימוש+S- */}
        {!isMeeting && featureOn(config, 'core.cashbox') && Math.round(+f.paid) > 0 && (
          <Field label="קבלת המזומן">
            <Btn
              sm
              onClick={() => {
                try {
                  sessionStorage.setItem(nsLsKey('maor_cashbox_amount'), String(Math.round(+f.paid)));
                  sessionStorage.setItem(nsLsKey('maor_cashbox_client'), beneficiaryLabel(db, a, config));
                } catch {
                  /* sessionStorage חסום — הקופה תיפתח ריקה */
                }
                window.location.hash = '#cashbox';
              }}
              title="פותח את הקופה הרושמת עם הסכום והלקוח ממולאים — המודאל נשאר פתוח"
            >
              💵 גבייה בקופה
            </Btn>
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
