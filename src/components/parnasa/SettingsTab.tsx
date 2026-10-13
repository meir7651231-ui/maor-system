/**
 * 📒 פרנסה׳לע — "הגדרות" של המקור (עיצוב 6 · setForm + priceForm; db.ui.parnasa — גבאי בלבד, נאכף גם ב-store):
 *   · כללי — שם הקהילה / החסידות · אישור כרטיסים · טלפון לפרסום ולחסויות (מוצג לכולם); הקדשה בראש האלפון (+ נוסח
 *     ההקדשה בחוברת — תוספת-הפורט) · "שמירת הגדרות".
 *   · מחירון — המחירים ממלאים מראש את טפסי ההדגשה, החסות והמודעה · "שמירת המחירון".
 *   · מיקום הזמנים (תוספת-הפורט — במקור נקרא מההגדרות בלי ממשק).
 * "הקישור לאלפון" של המקור (קישור-השיתוף של Claude) לא נדרש באורביט — הארגון כבר בכתובת שלו.
 * המחירון = רישום והצעת-מחיר לטפסים בלבד — אין כאן סליקה ואין קבלות (הכרעה 4).
 */
import { useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { integrationOn, termOf } from '../../lib/config';
import type { ParnasaPrefs, PrPriceKey } from '../../types/domain';
import { PR_PRICE_DEFAULTS } from './model';
import { requireApprovalOf } from './lib';
import { ZmanimLocationEditor } from './ZmanimLocationEditor';
import { PR_PRICE_LABELS } from './labels';

export function SettingsTab() {
  const config = useApp((s) => s.config);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const setParnasaPrefs = useApp((s) => s.setParnasaPrefs);
  const toast = useApp((s) => s.toast);
  const [f, setF] = useState(() => ({
    communityName: prefs?.communityName ?? '',
    requireApproval: requireApprovalOf(prefs),
    contactPhone: prefs?.contactPhone ?? '',
    dedication: prefs?.dedication ?? '',
    bookletDedication: prefs?.bookletDedication ?? '',
  }));
  const [prices, setPrices] = useState<Record<PrPriceKey, string>>(() => {
    const out = {} as Record<PrPriceKey, string>;
    for (const [k] of PR_PRICE_LABELS) out[k] = String(prefs?.prices?.[k] ?? PR_PRICE_DEFAULTS[k]);
    return out;
  });

  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const words = termOf(config, 'entity.prListings', 'עסקים');

  function saveSettings(e: FormEvent) {
    e.preventDefault();
    const patch: Partial<ParnasaPrefs> = {
      communityName: f.communityName.trim() || undefined,
      requireApproval: f.requireApproval ? undefined : false,
      contactPhone: f.contactPhone.trim() || undefined,
      dedication: f.dedication.trim() || undefined,
      bookletDedication: f.bookletDedication.trim() || undefined,
    };
    if (setParnasaPrefs(patch)) toast('ההגדרות נשמרו');
  }
  function savePrices(e: FormEvent) {
    e.preventDefault();
    const p: Partial<Record<PrPriceKey, number>> = {};
    for (const [k] of PR_PRICE_LABELS) {
      const t = prices[k].trim();
      if (!t) continue;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 0) {
        toast('מחיר לא תקין: ' + t);
        return;
      }
      // שווה לברירת-המחדל ⇒ לא נשמר (המחירון עוקב אחרי ברירות-המחדל)
      if (n !== PR_PRICE_DEFAULTS[k]) p[k] = n;
    }
    if (setParnasaPrefs({ prices: Object.keys(p).length ? p : undefined })) toast('המחירון נשמר');
  }

  return (
    <>
      <form className="pn-f" noValidate onSubmit={saveSettings}>
        <div className="pn-sub2">כללי</div>
        <div className="pn-grid2">
          <label className="pn-fl">
            <span>שם הקהילה / החסידות</span>
            <input type="text" maxLength={60} placeholder="למשל: קהילת חסידי … בבית שמש" value={f.communityName} onChange={(e) => setF({ ...f, communityName: e.target.value })} />
          </label>
          <label className="pn-fl">
            <span>אישור כרטיסים</span>
            <select value={f.requireApproval ? '1' : '0'} onChange={(e) => setF({ ...f, requireApproval: e.target.value === '1' })}>
              <option value="1">כרטיס חדש מופיע רק אחרי אישור</option>
              <option value="0">כרטיס מופיע מיד</option>
            </select>
          </label>
          <label className="pn-fl">
            <span>
              טלפון לפרסום ולחסויות <small>(מוצג לכולם)</small>
            </span>
            <input type="tel" inputMode="tel" maxLength={20} dir="ltr" value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} />
          </label>
        </div>
        <p className="pn-note">{'באישור דלוק — גם עריכת פרטים של ' + words + ' מאושרים ע״י מי שאינו ' + gabbai + ' מחזירה אותם ל״ממתין״ (במקור האישור היה חד-פעמי).'}</p>
        <div className="pn-sub2">הקדשה בראש האלפון</div>
        <label className="pn-fl">
          <span>
            נוסח ההקדשה <small>(ריק = בלי הקדשה)</small>
          </span>
          <input type="text" maxLength={140} placeholder="האלפון החודש מוקדש לעילוי נשמת …" value={f.dedication} onChange={(e) => setF({ ...f, dedication: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>
            נוסח ההקדשה בחוברת <small>(ריק = כמו ההקדשה)</small>
          </span>
          <textarea maxLength={240} style={{ minHeight: 70 }} value={f.bookletDedication} onChange={(e) => setF({ ...f, bookletDedication: e.target.value })} />
        </label>
        <p className="pn-note">המחיר של ההקדשה נקבע במחירון למטה.</p>
        <div className="pn-actions">
          <button className="pn-btn pn-primary" type="submit">
            שמירת הגדרות
          </button>
        </div>
      </form>

      <form className="pn-f" noValidate onSubmit={savePrices}>
        <div className="pn-sub2">מחירון</div>
        <p className="pn-note">
          {'המחירים כאן ממלאים מראש את הטפסים של הדגשה, חסות ומודעה, ומוצגים לחברי הקהילה בהצעות הקידום. רישום בלבד — אין כאן סליקה ואין קבלות' +
            (integrationOn(config, 'payments') ? '; התשלום — בקישור-הסליקה של הארגון.' : '.')}
        </p>
        <div className="pn-pricegrid">
          {PR_PRICE_LABELS.map(([k, label, unit]) => (
            <label key={k} className="pn-pfield">
              <span>{label}</span>
              <span className="pn-in">
                <input type="number" min={0} step={1} inputMode="numeric" value={prices[k]} onChange={(e) => setPrices({ ...prices, [k]: e.target.value })} />
                <i>{'₪ ' + unit}</i>
              </span>
            </label>
          ))}
        </div>
        <div className="pn-actions">
          <button className="pn-btn pn-primary" type="submit">
            שמירת המחירון
          </button>
        </div>
      </form>

      <section className="pn-f pn-zmloc">
        <div className="pn-sub2">מיקום הזמנים</div>
        <div className="pn-orbit">
          <ZmanimLocationEditor />
        </div>
      </section>
    </>
  );
}
