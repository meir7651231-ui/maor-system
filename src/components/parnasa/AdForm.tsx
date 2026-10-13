/**
 * 📒 פרנסה׳לע — הטפסים של "ניהול" בתוך הדף, כמו במקור (עיצוב 6; לא דיאלוגים):
 *   · FeaturedForm (ftForm) — "כרטיסים מודגשים": איש המקצוע · מחיר לחודש · שורת פרסום · אתר · בתוקף עד (ריק = עד שיבוטל) ·
 *     הערה פנימית; "הדגשת הכרטיס" / "עדכון ההדגשה" · "ניקוי הטופס". נשמר בשדות-הגבאי של העסק (featuredUntil + promo*).
 *   · SpForm (spForm) — החסות שנפתחת מתחת לשורה (דף הבית · מטבע הפלטינה · שער): שם נותן החסות · מחיר לחודש · שורה קצרה ·
 *     טלפון · אתר (+ במטבע: התחום שהמטבע פותח · מונוגרמה); תוספות-הפורט: תקופה (מ־/עד) ו"שולם". "שמירת החסות" · "סגירה" ·
 *     "הסרת החסות" (פעמיים).
 *   · AdForm (adForm) — "מודעות לחוברת השנתית": המפרסם · גודל (+מחיר) · כותרת · טלפון · נוסח · מחיר · שולם; תוספות-הפורט:
 *     תקופה ו"פעילה". "הוספת מודעה" / "שמירת שינויים" · "ביטול עריכה".
 * המחיר נטען מהמחירון עד שנוגעים בו. **רישום בלבד** (הכרעה 4): מחיר + סימון-תשלום ידני; אפס קבלות/מונים/תרומות.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import type { PrAd, PrAdKind, PrAdSlot, PrListing, PrPriceKey } from '../../types/domain';
import { useArmed } from '../useArmed';
import { adDraftError, categoryOf, isFeatured, PR_CATEGORIES, priceOf } from './lib';
import { featuredOpen, featuredPrice, nis, PR_FEATURED_OPEN } from './admin';
import { PnDate } from './DateField';
import { usePrPerms } from './hooks';

export function emptyPrAd(slot: PrAdSlot = 'booklet'): PrAd {
  return {
    id: '', slot, kind: slot === 'booklet' ? 'half' : 'line', target: '', advertiser: '', headline: '', body: '', phone: '', from: '', to: '',
    price: 0, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '',
  };
}

/** מפתח-המחירון למשבצת/גודל. */
export function priceKeyOf(slot: PrAdSlot, kind: PrAdKind): PrPriceKey {
  if (slot === 'category') return 'sponsor';
  if (slot === 'board') return 'board';
  return kind === 'full' || kind === 'small' ? kind : 'half';
}

/** גדלי-המודעה בחוברת (SIZES במקור). */
export const PN_AD_SIZES: ReadonlyArray<readonly ['full' | 'half' | 'small', string]> = [
  ['full', 'עמוד שלם'],
  ['half', 'חצי עמוד'],
  ['small', 'מודעה קטנה'],
];

const num = (t: string): number => {
  const n = Number(String(t).trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
/** "13.11.2026" (dateShow במקור). */
export function dmy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? Number(m[3]) + '.' + Number(m[2]) + '.' + m[1] : iso;
}

/* ═══════════════ כרטיסים מודגשים ═══════════════ */

interface FtState {
  key: string;
  price: string;
  touched: boolean;
  tag: string;
  url: string;
  until: string;
  note: string;
}
const ftEmpty = (price: number): FtState => ({ key: '', price: String(price), touched: false, tag: '', url: '', until: '', note: '' });

/** טופס-ההדגשה (ftForm) — req = "הדגשה"/"עריכה"/"חידוש" מבחוץ (ממלא את הכרטיס, ftFill במקור). */
export function FeaturedForm(props: { todayIso: string; req: { key: string; n: number } | null; onDone?: () => void }) {
  const listings = useApp((s) => s.db.prListings);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrListing = useApp((s) => s.upsertPrListing);
  const toast = useApp((s) => s.toast);
  const [f, setF] = useRemembered<FtState>('parnasa.admin.ft', ftEmpty(priceOf(prefs, 'featured')));
  const fill = (key: string, touched: boolean): FtState => {
    const l = listings.find((x) => x.id === key);
    if (!l) return { ...f, key };
    const was = !!l.featuredUntil;
    return {
      key,
      price: String(was || typeof l.promoPrice === 'number' ? featuredPrice(l, prefs) : touched ? f.price : priceOf(prefs, 'featured')),
      touched: touched || was,
      tag: l.promoLine ?? '',
      url: l.promoUrl ?? '',
      until: l.featuredUntil && !featuredOpen(l) ? l.featuredUntil : '',
      note: l.promoNote ?? '',
    };
  };
  const reqN = props.req?.n ?? 0;
  useEffect(() => {
    if (!props.req) return;
    setF(fill(props.req.key, true));
    const t = setTimeout(() => document.querySelector('.pn-ftForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    return () => clearTimeout(t);
    // רק בבקשה חדשה (n) — לא בכל שינוי-רשימה
  }, [reqN]);
  const opts = listings.filter((l) => l.status !== 'rejected').sort((a, b) => a.name.localeCompare(b.name, 'he'));
  const cur = listings.find((l) => l.id === f.key) ?? null;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!cur) return;
    const next: PrListing = {
      ...cur,
      featuredUntil: f.until || PR_FEATURED_OPEN,
      promoPrice: num(f.price),
      promoLine: f.tag.trim() || undefined,
      promoUrl: f.url.trim() || undefined,
      promoNote: f.note.trim() || undefined,
    };
    const res = upsertPrListing(next);
    if (!res.ok) return;
    toast('הכרטיס מודגש באלפון');
    setF(ftEmpty(priceOf(prefs, 'featured')));
    props.onDone?.();
  }

  return (
    <form className="pn-f pn-ftForm" noValidate onSubmit={submit}>
      <div className="pn-grid2">
        <label className="pn-fl">
          <span>איש המקצוע</span>
          <select required value={f.key} onChange={(e) => setF(fill(e.target.value, f.touched))}>
            <option value="">בחרו כרטיס…</option>
            {opts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name + ' · ' + categoryOf(l.category).name + (isFeatured(l, props.todayIso) ? ' · מודגש' : '')}
              </option>
            ))}
          </select>
        </label>
        <label className="pn-fl">
          <span>מחיר לחודש (₪)</span>
          <input type="number" min={0} step={1} inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value, touched: true })} />
        </label>
        <label className="pn-fl">
          <span>
            שורת פרסום <small>(רשות)</small>
          </span>
          <input type="text" maxLength={80} placeholder="למשל: עשרים שנות ניסיון · אחריות מלאה" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>
            אתר <small>(רשות)</small>
          </span>
          <input type="url" maxLength={120} dir="ltr" placeholder="example.co.il" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>
            בתוקף עד <small>(ריק = עד שיבוטל)</small>
          </span>
          <PnDate label="בתוקף עד" value={f.until} onChange={(v) => setF({ ...f, until: v })} />
        </label>
        <label className="pn-fl">
          <span>
            הערה פנימית <small>(רק לגבאי)</small>
          </span>
          <input type="text" maxLength={80} placeholder="שולם עד אלול" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </label>
      </div>
      <div className="pn-actions">
        <button className="pn-btn pn-primary" type="submit" disabled={!cur}>
          {cur && cur.featuredUntil ? 'עדכון ההדגשה' : 'הדגשת הכרטיס'}
        </button>
        <button className="pn-btn" type="button" onClick={() => setF(ftEmpty(priceOf(prefs, 'featured')))}>
          ניקוי הטופס
        </button>
      </div>
    </form>
  );
}

/* ═══════════════ חסות (דף הבית · מטבע הפלטינה · שער) ═══════════════ */

/** מקום-החסות: 'home' = דף הבית (משבצת board), 'coin' = מטבע הפלטינה, אחרת מפתח-שער. */
export type PnSpPlace = string;

export function SpForm(props: { place: PnSpPlace; ad: PrAd | null; onClose: () => void; /** "➕ נותן-חסות נוסף לסבב" (תוספת-הפורט) — טופס ריק לאותו מקום. */ onQueue?: () => void }) {
  const config = useApp((s) => s.config);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrAd = useApp((s) => s.upsertPrAd);
  const deletePrAd = useApp((s) => s.deletePrAd);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const { canDelete } = usePrPerms();
  const isCoin = props.place === 'coin';
  const isHome = props.place === 'home';
  const base = props.ad;
  const [f, setF] = useState(() => ({
    name: base?.advertiser ?? '',
    price: String(base ? base.price : priceOf(prefs, isHome ? 'board' : 'sponsor')),
    line: base?.headline ?? '',
    phone: base?.phone ?? '',
    url: base?.url ?? '',
    cat: isCoin ? (base && categoryOf(base.target).key === base.target ? base.target : '') : '',
    mono: base?.mono ?? '',
    from: base?.from ?? '',
    to: base?.to ?? '',
    paid: base?.paid ?? false,
  }));
  const set = (patch: Partial<typeof f>): void => setF((x) => ({ ...x, ...patch }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) {
      toast('חסר שם נותן החסות');
      return;
    }
    if (isCoin && !f.cat) {
      toast('בחרו את התחום שהמטבע פותח');
      return;
    }
    const draft: PrAd = {
      ...(base ?? emptyPrAd(isHome ? 'board' : 'category')),
      slot: isHome ? 'board' : 'category',
      kind: 'line',
      target: isHome ? '' : isCoin ? f.cat : props.place,
      advertiser: f.name.trim(),
      headline: f.line.trim(),
      phone: f.phone.trim(),
      url: f.url.trim() || undefined,
      coin: isCoin ? true : undefined,
      mono: isCoin && f.mono.trim() ? [...f.mono.trim()].slice(0, 3).join('') : undefined,
      price: num(f.price),
      from: f.from,
      to: f.to,
      paid: f.paid,
    };
    const err = adDraftError(draft);
    if (err) {
      toast(err);
      return;
    }
    if (upsertPrAd(draft).ok) {
      toast('החסות נשמרה');
      props.onClose();
    }
  }
  function remove() {
    if (!base) return;
    if (!confirmTwice('sp-' + base.id, 'להסיר את החסות של ' + base.advertiser + '?')) return;
    if (deletePrAd(base.id)) {
      toast('החסות הוסרה');
      props.onClose();
    }
  }

  return (
    <form className="pn-f pn-spForm" noValidate onSubmit={submit}>
      <div className="pn-grid2">
        <label className="pn-fl">
          <span>שם נותן החסות</span>
          <input type="text" required maxLength={50} placeholder="שם העסק או המשפחה" value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
        </label>
        <label className="pn-fl">
          <span>מחיר לחודש (₪)</span>
          <input type="number" min={0} step={1} inputMode="numeric" value={f.price} onChange={(e) => set({ price: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>
            שורה קצרה <small>(רשות)</small>
          </span>
          <input type="text" maxLength={70} placeholder="למשל: חומרי חשמל ותאורה במחירי סיטונאות" value={f.line} onChange={(e) => set({ line: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>
            טלפון <small>(רשות)</small>
          </span>
          <input type="tel" inputMode="tel" maxLength={20} dir="ltr" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>
            אתר <small>(רשות)</small>
          </span>
          <input type="url" maxLength={120} dir="ltr" value={f.url} onChange={(e) => set({ url: e.target.value })} />
        </label>
        {isCoin ? (
          <label className="pn-fl">
            <span>התחום שהמטבע פותח</span>
            <select value={f.cat} onChange={(e) => set({ cat: e.target.value })}>
              <option value="">בחרו תחום…</option>
              {PR_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.short}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {isCoin ? (
          <label className="pn-fl">
            <span>
              מונוגרמה <small>(שתי אותיות על המטבע)</small>
            </span>
            <input type="text" maxLength={3} placeholder="למשל ש״מ" value={f.mono} onChange={(e) => set({ mono: e.target.value })} />
          </label>
        ) : null}
        <label className="pn-fl">
          <span>
            מתאריך <small>(ריק = מיד)</small>
          </span>
          <PnDate label="מתאריך" value={f.from} onChange={(v) => set({ from: v })} />
        </label>
        <label className="pn-fl">
          <span>
            עד תאריך <small>(ריק = עד שיבוטל)</small>
          </span>
          <PnDate label="עד תאריך" value={f.to} onChange={(v) => set({ to: v })} />
        </label>
      </div>
      <div className="pn-checks">
        <label>
          <input type="checkbox" checked={f.paid} onChange={(e) => set({ paid: e.target.checked })} /> שולם
        </label>
      </div>
      <div className="pn-actions">
        <button className="pn-btn pn-primary" type="submit">
          שמירת החסות
        </button>
        <button className="pn-btn" type="button" onClick={props.onClose}>
          סגירה
        </button>
        {base && props.onQueue ? (
          <button className="pn-btn pn-ghost2" type="button" title="כמה נותני-חסות לאותו מקום מתחלפים כל יום" onClick={props.onQueue}>
            ➕ נותן-חסות נוסף לסבב
          </button>
        ) : null}
        {base && canDelete ? (
          <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={remove}>
            {armed === 'sp-' + base.id ? 'ללחוץ שוב להסרה' : 'הסרת החסות'}
          </button>
        ) : null}
      </div>
    </form>
  );
}

/* ═══════════════ מודעה לחוברת ═══════════════ */

export function AdForm(props: { ad: PrAd | null; onDone: () => void }) {
  const config = useApp((s) => s.config);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrAd = useApp((s) => s.upsertPrAd);
  const toast = useApp((s) => s.toast);
  const base = props.ad;
  const init = () => {
    const kind = base && (base.kind === 'full' || base.kind === 'small') ? base.kind : 'half';
    return {
      who: base?.advertiser ?? '',
      size: kind as 'full' | 'half' | 'small',
      head: base?.headline ?? '',
      phone: base?.phone ?? '',
      body: base?.body ?? '',
      price: String(base ? base.price : priceOf(prefs, 'half')),
      touched: !!base,
      paid: base?.paid ?? false,
      from: base?.from ?? '',
      to: base?.to ?? '',
      active: base ? base.active !== false : true,
    };
  };
  const [f, setF] = useState(init);
  const set = (patch: Partial<ReturnType<typeof init>>): void => setF((x) => ({ ...x, ...patch }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.who.trim()) {
      toast('חסר שם המפרסם');
      return;
    }
    const draft: PrAd = {
      ...(base ?? emptyPrAd('booklet')),
      slot: 'booklet',
      kind: f.size,
      advertiser: f.who.trim(),
      headline: f.head.trim(),
      body: f.body.trim(),
      phone: f.phone.trim(),
      price: num(f.price),
      paid: f.paid,
      from: f.from,
      to: f.to,
      active: f.active,
    };
    const err = adDraftError(draft);
    if (err) {
      toast(err);
      return;
    }
    if (!upsertPrAd(draft).ok) return;
    toast(base ? 'המודעה עודכנה' : 'המודעה נוספה');
    setF({ ...init(), who: '', head: '', phone: '', body: '', paid: false, from: '', to: '', active: true, size: 'half', price: String(priceOf(prefs, 'half')), touched: false });
    props.onDone();
  }

  return (
    <form className="pn-f pn-adForm" noValidate onSubmit={submit}>
      <div className="pn-grid2">
        <label className="pn-fl">
          <span>המפרסם</span>
          <input type="text" required maxLength={60} placeholder="שם העסק" value={f.who} onChange={(e) => set({ who: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>גודל</span>
          <select
            value={f.size}
            onChange={(e) => {
              const size = e.target.value as 'full' | 'half' | 'small';
              set(f.touched ? { size } : { size, price: String(priceOf(prefs, size)) });
            }}
          >
            {PN_AD_SIZES.map(([k, l]) => (
              <option key={k} value={k}>
                {l + ' · ' + nis(priceOf(prefs, k))}
              </option>
            ))}
          </select>
        </label>
        <label className="pn-fl">
          <span>כותרת המודעה</span>
          <input type="text" maxLength={60} value={f.head} onChange={(e) => set({ head: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>טלפון</span>
          <input type="tel" inputMode="tel" maxLength={20} dir="ltr" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
        </label>
      </div>
      <label className="pn-fl">
        <span>
          נוסח המודעה <small>(שורות קצרות נראות הכי טוב בדפוס)</small>
        </span>
        <textarea maxLength={400} value={f.body} onChange={(e) => set({ body: e.target.value })} />
      </label>
      <div className="pn-grid2">
        <label className="pn-fl">
          <span>מחיר (₪)</span>
          <input type="number" min={0} step={1} inputMode="numeric" value={f.price} onChange={(e) => set({ price: e.target.value, touched: true })} />
        </label>
        <div className="pn-fl">
          <span>תשלום</span>
          <div className="pn-checks">
            <label>
              <input type="checkbox" checked={f.paid} onChange={(e) => set({ paid: e.target.checked })} /> שולם
            </label>
            <label>
              <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} /> פעילה
            </label>
          </div>
        </div>
        <label className="pn-fl">
          <span>
            מתאריך <small>(ריק = מיד)</small>
          </span>
          <PnDate label="מתאריך" value={f.from} onChange={(v) => set({ from: v })} />
        </label>
        <label className="pn-fl">
          <span>
            עד תאריך <small>(ריק = כל השנה)</small>
          </span>
          <PnDate label="עד תאריך" value={f.to} onChange={(v) => set({ to: v })} />
        </label>
      </div>
      <div className="pn-actions">
        <button className="pn-btn pn-primary" type="submit">
          {base ? 'שמירת שינויים' : <>➕ הוספת {termOf(config, 'entity.prAd', 'פרסומת')}</>}
        </button>
        {base ? (
          <button className="pn-btn" type="button" onClick={props.onDone}>
            ביטול עריכה
          </button>
        ) : null}
      </div>
    </form>
  );
}
