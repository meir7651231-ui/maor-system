/**
 * 📒 פרנסה׳לע — עורך דף-העסק של המקור (עיצוב 4, formHTML/edWire/edValidate): 8 חלקים נפתחים — פרטים בסיסיים ·
 * עיצוב: צבע ולוגו · שירותים ומחירים · תמונות · שעות פעילות · שאלות נפוצות · תשלום ושפות · תעודות, השגחה וותק —
 * עם סיכום-חי ו-✓ לכל חלק, פס-התקדמות זהוב, ושורת-שמירה דביקה (הסכמה · שמירה · "תצוגה" · מד-גודל-הדף · "יש שינויים
 * שלא נשמרו"). התמונות מוקטנות בדפדפן (WebP, ≤900px/45KB; לוגו ≤256px/25KB) ונשמרות ב-DB המקומי כמו הגלריה של
 * התורמים. באורביט הגבאי עורך בשם בעל-העסק ובהסכמתו — ולכן גם חלק 🛡 "שדות הגבאי" (מקור · קוד-חיוג · הדגשה ·
 * הערה-פנימית) רק למאשר; השמירה דרך upsertPrListing — מכונת-האישור ושער-התמונות ב-store.
 */
import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { PrHours, PrListing } from '../../types/domain';
import { useArmed } from '../useArmed';
import { dialCodeTaken, nextDialCode, PR_CATEGORIES, PR_LANG_NAMES, requireApprovalOf, validDialCode } from './lib';
import { hmToMin } from './zmanimBoard';
import { usePrPerms } from './hooks';
import { PR_DOW_LETTERS } from './labels';
import { PR_PAYS, PR_LOGO_DIM, PR_PHOTO_DIM } from './biz';
import { PN_PALETTES, tradeIcon } from './home';
import { composeHours, docBytes, kb, PN_SECS, rebaseDraft, schedOf, secDone, secSum, sizeState, type PnSched, type PnSec } from './editor';
import { PR_IMG } from './model';
import { shrinkImage, ShrinkError } from './imageShrink';
import { cx, Ic } from './skin';
import { PnDate } from './DateField';
import { featuredOpen } from './admin';

/** עסק ריק לעורך (מזהה '' ⇒ ה-store מקצה). */
export function emptyPrListing(): PrListing {
  return {
    id: '', source: 'owner', name: '', title: '', category: '', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'pending', dialCode: '', featuredUntil: '', recs: [], createdAt: '', updatedAt: '',
  };
}

const digits = (s: string): string => String(s || '').replace(/\D/g, '');
const LANG_KEYS = Object.keys(PR_LANG_NAMES);
const isImg = (s: unknown): s is string => typeof s === 'string' && /^data:image\/(webp|jpeg|png);base64,/.test(s);

const nonEmpty = <T,>(a: T[]): T[] | undefined => (a.length ? a : undefined);

/** ארוז לשמירה/השוואה (pack במקור): בלי שדות-ריקים אופציונליים, שעות מורכבות. */
function packed(d: PrListing, sched: PnSched, hasWa: boolean, baseWa: string): PrListing {
  const phone = d.phone.trim();
  return {
    ...d,
    name: d.name.trim(),
    title: d.title.trim(),
    phone,
    phone2: d.phone2.trim(),
    // וואטסאפ: במספר-הטלפון — או מספר-וואטסאפ נפרד שכבר היה (לא נדרס)
    whatsapp: hasWa ? (baseWa && digits(baseWa).slice(-9) !== digits(phone).slice(-9) ? baseWa : phone) : '',
    city: d.city.trim(),
    area: d.area.trim(),
    hoursNote: d.hoursNote.trim(),
    hours: d.always ? [] : composeHours(sched),
    desc: d.desc.trim(),
    tagline: (d.tagline ?? '').trim() || undefined,
    kashrut: d.kashrut.trim(),
    notes: d.notes.trim(),
    dialCode: d.dialCode.trim(),
    cert: (d.cert ?? '').trim() || undefined,
    years: d.years && d.years > 0 ? Math.min(120, Math.floor(d.years)) : undefined,
    offer: d.offer && d.offer.text.trim() ? { text: d.offer.text.trim().slice(0, 60), until: d.offer.until } : undefined,
    services: d.services.map((s) => ({ name: s.name.trim(), price: s.price.trim(), note: s.note.trim() })).filter((s) => s.name),
    faq: nonEmpty((d.faq ?? []).map((f) => ({ q: f.q.trim(), a: f.a.trim() })).filter((f) => f.q)),
    pay: nonEmpty(d.pay ?? []),
    photos: nonEmpty(d.photos ?? []),
    logo: d.logo || undefined,
    palette: d.palette || undefined,
    seek: d.seek || undefined,
  };
}

/** כפתורי-השורה (rbHTML): למעלה · למטה · מחיקה. */
function Rb(props: { i: number; n: number; onMove: (to: number) => void; onDel: () => void }) {
  return (
    <div className="pn-rb">
      <button type="button" aria-label="למעלה" disabled={props.i === 0} onClick={() => props.onMove(props.i - 1)}>
        <Ic n="up" />
      </button>
      <button type="button" aria-label="למטה" disabled={props.i === props.n - 1} onClick={() => props.onMove(props.i + 1)}>
        <Ic n="dn" />
      </button>
      <button type="button" className="pn-del" aria-label="מחיקה" onClick={props.onDel}>
        <Ic n="trash" />
      </button>
    </div>
  );
}

/**
 * טיוטת-העורך שורדת מעבר-לשונית (במקור הטופס נשאר בדף כשעוברים ל"אלפון" ובחזרה) — זיכרון-סשן בלבד (רענון =
 * נקי), לפי מפתח-הדף; בחירה מפורשת של דף אחר מוחקת את הטיוטה הקודמת (forgetEditorDraft, מ"העסק שלי").
 */
const KEPT = new Map<string, unknown>();
export function forgetEditorDraft(memKey: string): void {
  for (const k of KEPT.keys()) if (k.startsWith(memKey + '\u0000')) KEPT.delete(k);
}
function useKept<T>(key: string, init: () => T): [T, Dispatch<SetStateAction<T>>] {
  const [v, setV] = useState<T>(() => (KEPT.has(key) ? (KEPT.get(key) as T) : init()));
  useEffect(() => {
    KEPT.set(key, v);
  }, [key, v]);
  return [v, setV];
}

/** מצב-העורך מעסק שמור (או ריק): הטיוטה, לוח-הזמנים, "יש וואטסאפ במספר". */
function stateOf(l: PrListing | null, seed?: Partial<PrListing>): { d: PrListing; sched: PnSched; hasWa: boolean } {
  return {
    d: l ? { ...l, services: l.services.map((s) => ({ ...s })), faq: (l.faq ?? []).map((f) => ({ ...f })) } : { ...emptyPrListing(), ...seed },
    sched: schedOf(l?.hours ?? []),
    hasWa: l ? !!l.whatsapp : true,
  };
}

function move<T>(arr: readonly T[], i: number, j: number): T[] {
  const a = arr.slice();
  if (j < 0 || j >= a.length) return a;
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

export function Editor(props: {
  listing: PrListing | null;
  /** מפתח-הדף לזיכרון-הטיוטה (מזהה העסק, או new-N). */
  memKey: string;
  /** "+N%" מהלוח ⇒ פתיחת החלק וגלילה אליו. */
  focusSec: { k: PnSec; n: number } | null;
  onDraft: (d: PrListing) => void;
  onSaved: (l: PrListing) => void;
  onPreview: (d: PrListing) => void;
  onDeleted: () => void;
  toast: (m: string) => void;
  /** עסק חדש — שדות-פתיחה (ב"ניהול": מקור = הגבאי — "הוספת איש מקצוע ידנית"). */
  seed?: Partial<PrListing>;
  /** תווית-השמירה (ב"ניהול": "שמירת שינויים" בעריכת כרטיס שהוזן ידנית, כמו המקור). */
  saveText?: string;
  /** "ביטול עריכה" תמיד (לא רק כשיש שינויים) — חזרה לטופס ריק (resetAdm במקור). */
  onCancel?: () => void;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrListing = useApp((s) => s.upsertPrListing);
  const deletePrListing = useApp((s) => s.deletePrListing);
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const word = termOf(config, 'entity.prListing', 'עסק');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const base = props.listing;
  const isNew = !base;
  const mk = props.memKey + '\u0000';
  const [d, setD] = useKept<PrListing>(mk + 'd', () => stateOf(base, props.seed).d);
  const [sched, setSched] = useKept<PnSched>(mk + 'sched', () => stateOf(base).sched);
  const [hasWa, setHasWa] = useKept<boolean>(mk + 'wa', () => stateOf(base).hasWa);
  const [consent, setConsent] = useKept<boolean>(mk + 'consent', () => !isNew);
  const [open, setOpen] = useKept<ReadonlySet<string>>(mk + 'open', () => new Set(isNew ? ['basic'] : []));
  const [busy, setBusy] = useState('');
  const baseWa = base?.whatsapp ?? '';
  const cur = useMemo(() => packed(d, sched, hasWa, baseWa), [d, sched, hasWa, baseWa]);
  /** מה שנטען/נשמר לאחרונה — בסיס ל"יש שינויים שלא נשמרו" ולמיזוג מול הרשומה החיה. */
  const [saved, setSaved] = useKept<PrListing>(mk + 'saved', () => packed(d, sched, hasWa, baseWa));
  const curKey = useMemo(() => JSON.stringify(cur), [cur]);
  const savedKey = useMemo(() => JSON.stringify(saved), [saved]);
  const dirty = curKey !== savedKey;
  const formRef = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<PrListing>): void => setD((x) => ({ ...x, ...patch }));
  const requireApproval = requireApprovalOf(prefs);

  // הלוח והכרטיס-המיני עוקבים אחרי הטיוטה (edChanged במקור — 140ms); בעלייה — מיד (טיוטה שחזרה מהזיכרון)
  const onDraft = props.onDraft;
  const reported = useRef(false);
  useEffect(() => {
    if (!reported.current) {
      reported.current = true;
      onDraft(cur);
      return;
    }
    const t = setTimeout(() => onDraft(cur), 140);
    return () => clearTimeout(t);
  }, [cur, onDraft]);
  // "+N%" מהלוח ⇒ פתיחה וגלילה
  useEffect(() => {
    if (!props.focusSec) return;
    const k = props.focusSec.k;
    setOpen((o) => new Set([...o, k]));
    const t = setTimeout(() => formRef.current?.querySelector(`[data-sec="${k}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20);
    return () => clearTimeout(t);
  }, [props.focusSec]);

  const toggle = (k: string): void =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const openSec = (k: string, field?: string): void => {
    setOpen((o) => new Set([...o, k]));
    setTimeout(() => {
      const s = formRef.current?.querySelector(`[data-sec="${k}"]`);
      s?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (field) (formRef.current?.querySelector(`[data-f="${field}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
    }, 30);
  };

  /* ───── תמונות ───── */
  async function addImages(files: FileList | null, kind: 'logo' | 'photo'): Promise<void> {
    let list = [...(files ?? [])];
    if (!list.length) return;
    setBusy(kind);
    let photos = (d.photos ?? []).slice();
    let logo = d.logo ?? '';
    if (kind === 'photo') {
      const room = PR_IMG.photos - photos.length;
      if (list.length > room) props.toast('אפשר עד 4 תמונות. נוספו ' + room);
      list = list.slice(0, room);
    } else list = list.slice(0, 1);
    for (const f of list) {
      try {
        const u = await shrinkImage(f, kind === 'logo' ? PR_LOGO_DIM : PR_PHOTO_DIM, kind === 'logo' ? PR_IMG.logo : PR_IMG.photo, kind === 'logo');
        const next = kind === 'logo' ? { ...cur, logo: u } : { ...cur, photos: [...photos, u] };
        if (docBytes(next) > PR_IMG.doc) {
          props.toast('אין מקום לתמונה נוספת בדף. הסירו תמונה או קצרו את הטקסט');
          break;
        }
        if (kind === 'logo') logo = u;
        else photos = [...photos, u];
      } catch (err) {
        props.toast(err instanceof ShrinkError && err.code === 'type' ? 'אפשר להעלות רק קובץ תמונה' : err instanceof ShrinkError && err.code === 'big' ? 'התמונה מסובכת מדי לדחיסה. נסו תמונה אחרת' : 'לא הצלחנו לקרוא את התמונה');
      }
    }
    setBusy('');
    if (kind === 'logo') set({ logo });
    else {
      set({ photos });
      if (photos.length) props.toast('התמונות נוספו · ' + photos.length + ' מתוך 4. אל תשכחו לשמור');
    }
  }

  /* ───── שמירה ───── */
  function save(): void {
    const miss = (
      [
        ['name', 'שם העסק', cur.name],
        ['title', 'במה עובדים', cur.title],
        ['cat', 'תחום', cur.category],
        ['phone', 'טלפון', cur.phone],
      ] as const
    ).find((x) => !x[2]);
    if (miss) {
      openSec('basic', miss[0]);
      props.toast('חסר: ' + miss[1]);
      return;
    }
    if (isNew && !consent) {
      props.toast('צריך לסמן את ההסכמה להצגת הפרטים');
      return;
    }
    for (const h of cur.hours) {
      const a = hmToMin(h.from);
      const b = hmToMin(h.to);
      if (a === null || b === null || a === b) {
        openSec('hours');
        props.toast('שעות-פעילות: לכל חלון — שעת פתיחה וסגירה תקינות ושונות');
        return;
      }
    }
    const n = docBytes(cur);
    if (n > PR_IMG.doc) {
      openSec('photos');
      props.toast('הדף גדול מדי (' + kb(n) + '). הסירו תמונה או קצרו טקסט');
      return;
    }
    if (canApprove && !validDialCode(cur.dialCode)) {
      openSec('gabbai');
      props.toast('קוד-חיוג: שלוש ספרות בין 101 ל-999 (או ריק — יוקצה אוטומטית באישור)');
      return;
    }
    if (canApprove && cur.dialCode && dialCodeTaken(listings, cur.dialCode, base?.id)) {
      openSec('gabbai');
      props.toast('קוד-החיוג ' + cur.dialCode + ' כבר תפוס');
      return;
    }
    // מה שלא נערך — מהרשומה החיה (המלצה/אישור/קוד/קידום שנוספו בינתיים לא נדרסים)
    const live = base ? (listings.find((x) => x.id === base.id) ?? null) : null;
    const res = upsertPrListing(live ? rebaseDraft(cur, saved, live) : cur);
    if (!res.ok || !res.listing) return;
    const l = res.listing;
    // העורך מתיישר עם מה שנשמר בפועל (קוד-חיוג שהוקצה, סטטוס) — "יש שינויים" נכבה
    const st = stateOf(l);
    setD(st.d);
    setSched(st.sched);
    setHasWa(st.hasWa);
    setSaved(packed(st.d, st.sched, st.hasWa, l.whatsapp));
    if (l.status === 'pending') props.toast('נשלח לאישור ה' + gabbai + ' — יופיע באלפון אחרי אישור');
    else if (isNew) props.toast(l.name + ' נוסף/ה לאלפון' + (l.dialCode ? ' · קוד חיוג ' + l.dialCode : ''));
    else props.toast('הדף נשמר');
    props.onSaved(l);
  }
  /** "ביטול עריכה" (המקור): השינויים שלא נשמרו נזרקים — חזרה לדף כפי שהוא באלפון עכשיו. */
  function revert(): void {
    const st = stateOf((base && listings.find((x) => x.id === base.id)) || base);
    setD(st.d);
    setSched(st.sched);
    setHasWa(st.hasWa);
    setSaved(packed(st.d, st.sched, st.hasWa, baseWa));
  }
  function del(): void {
    if (!base) return;
    if (!confirmTwice('ed-' + base.id, 'להסיר את ' + base.name + ' מהאלפון?')) {
      props.toast('ללחוץ שוב כדי להסיר את הדף');
      return;
    }
    if (deletePrListing(base.id)) {
      props.toast(base.name + ' הוסר/ה מהאלפון');
      props.onDeleted();
    }
  }

  /* ───── חלקים ───── */
  const doneN = PN_SECS.filter(([k]) => secDone(cur, k)).length;
  const bytes = useMemo(() => docBytes(cur), [cur]);
  const size = sizeState(bytes);
  const sec = (k: string, title: string, icon: string, done: boolean, sum: string, body: ReactNode) => (
    <section className={cx('pn-eds', open.has(k) && 'pn-open', done && 'pn-done')} data-sec={k} key={k}>
      <button className="pn-edh" type="button" aria-expanded={open.has(k)} aria-controls={'pn-ed-' + k} onClick={() => toggle(k)}>
        <span className="pn-ico">
          <Ic n={icon} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="pn-t">{title}</span>
          <span className="pn-s">{sum}</span>
        </span>
        <span className="pn-ck">
          <Ic n="check" />
        </span>
      </button>
      <div className="pn-edb" id={'pn-ed-' + k} role="group" aria-label={title}>
        {open.has(k) ? body : null}
      </div>
    </section>
  );
  const chk = (label: string, on: boolean, onChange: (v: boolean) => void) => (
    <label className="pn-chk" key={label}>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
  const bodies: Record<PnSec, ReactNode> = {
    basic: (
      <>
        <div className="pn-grid2">
          <label className="pn-fl">
            <span>שם מלא / שם העסק</span>
            <input data-f="name" type="text" maxLength={60} placeholder="ר׳ יעקב כהן" value={d.name} onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className="pn-fl">
            <span>
              במה עובדים? <small>במשפט קצר</small>
            </span>
            <input data-f="title" type="text" maxLength={80} placeholder="חשמלאי מוסמך, תיקוני קצרים ולוחות" value={d.title} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="pn-fl">
            <span>תחום</span>
            <select data-f="cat" value={d.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">בחרו תחום…</option>
              {PR_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="pn-fl">
            <span>טלפון</span>
            <input data-f="phone" type="tel" inputMode="tel" maxLength={20} placeholder="050-0000000" value={d.phone} onChange={(e) => set({ phone: e.target.value })} />
          </label>
        </div>
        <label className="pn-fl">
          <span>
            משפט מפתח <small>(בראש הדף, מתחת לשם)</small>
          </span>
          <input type="text" maxLength={90} placeholder="עבודה נקייה, מחיר הוגן, ובזמן" value={d.tagline ?? ''} onChange={(e) => set({ tagline: e.target.value })} />
        </label>
        <div className="pn-grid2 pn-bnoffer">
          <label className="pn-fl">
            <span>
              מבצע לבאנר <small>(רשות. סרט זהב על הבאנר שלכם בתוצאות ובדף)</small>
            </span>
            <input type="text" maxLength={60} placeholder="15% הנחה לקהילה עד ר״ח ניסן" value={d.offer?.text ?? ''} onChange={(e) => set({ offer: { text: e.target.value, until: d.offer?.until ?? '' } })} />
          </label>
          <label className="pn-fl">
            <span>
              בתוקף עד <small>(רשות. אחרי התאריך הסרט יורד לבד)</small>
            </span>
            <PnDate label="המבצע בתוקף עד" value={d.offer?.until ?? ''} onChange={(v) => set({ offer: { text: d.offer?.text ?? '', until: v } })} />
          </label>
        </div>
        <label className="pn-fl">
          <span>
            על העסק <small>(ניסיון, מה כן ומה לא. מילים כמו ״נזילות״ או ״לוחות חשמל״ עוזרות למצוא אתכם)</small>
          </span>
          <textarea maxLength={700} value={d.desc} onChange={(e) => set({ desc: e.target.value })} />
        </label>
        <div className="pn-grid2">
          <label className="pn-fl">
            <span>עיר / שכונה</span>
            <input type="text" maxLength={40} value={d.city} onChange={(e) => set({ city: e.target.value })} />
          </label>
          <label className="pn-fl">
            <span>אזורי שירות</span>
            <input type="text" maxLength={80} placeholder="ירושלים והסביבה" value={d.area} onChange={(e) => set({ area: e.target.value })} />
          </label>
          <label className="pn-fl">
            <span>שירות מתאים ל</span>
            <select value={d.aud ?? 'all'} onChange={(e) => set({ aud: e.target.value === 'men' || e.target.value === 'women' ? e.target.value : 'all' })}>
              <option value="all">כולם</option>
              <option value="men">גברים</option>
              <option value="women">נשים</option>
            </select>
          </label>
          <label className="pn-fl">
            <span>
              טלפון נוסף <small>(רשות)</small>
            </span>
            <input type="tel" inputMode="tel" maxLength={20} value={d.phone2} onChange={(e) => set({ phone2: e.target.value })} />
          </label>
        </div>
        <div className="pn-chipset">
          {chk('יש וואטסאפ במספר', hasWa, setHasWa)}
          {chk('הנחה לאנשי הקהילה', !!d.disc, (v) => set({ disc: v }))}
          {chk('גמ״ח / בהתנדבות', !!d.free, (v) => set({ free: v }))}
          {chk('פנוי ללקוחות נוספים', !!d.seek, (v) => set({ seek: v }))}
        </div>
      </>
    ),
    design: (
      <>
        <div className="pn-fl">
          <span>
            צבע הדף <small>(הכיסוי והכותרות. נראה טוב גם בתצוגה כהה)</small>
          </span>
          <div className="pn-pals" role="radiogroup" aria-label="צבע הדף">
            {PN_PALETTES.map(([k, l]) => (
              <label key={k} className="pn-pal" data-pal={k}>
                <input type="radio" name="pn-pal" value={k} checked={d.palette === k} onChange={() => set({ palette: k })} />
                <span className="pn-sw" />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div className="pn-fl">
          <span>
            לוגו <small>(רשות. בלי לוגו נעצב לכם חותם עם ראשי התיבות)</small>
          </span>
          <div className="pn-logoed">
            <span className="pn-pv" data-pal={d.palette || 'velvet'} style={{ display: 'contents' }}>
              {isImg(d.logo) ? (
                <span className="pn-bplogo">
                  <img src={d.logo} alt={'הלוגו של ' + (d.name || 'העסק')} />
                </span>
              ) : (
                <span className="pn-bplogo pn-mono" aria-hidden="true">
                  <b className="pn-tic">
                    <Ic n={tradeIcon(d)} />
                  </b>
                </span>
              )}
            </span>
            <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
              <label className={cx('pn-upl', busy === 'logo' && 'pn-busy')}>
                <Ic n="img" />
                {d.logo ? 'החלפת הלוגו' : 'העלאת לוגו'}
                <input type="file" accept="image/*" aria-label="העלאת לוגו" onChange={(e) => void addImages(e.target.files, 'logo').then(() => (e.target.value = ''))} />
              </label>
              {d.logo ? (
                <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={() => set({ logo: '' })}>
                  <Ic n="trash" />
                  הסרת הלוגו
                </button>
              ) : (
                <span className="pn-note">ריבועי, על רקע בהיר, נראה הכי טוב.</span>
              )}
            </div>
          </div>
        </div>
      </>
    ),
    svc: (
      <>
        <div className="pn-hint">
          <Ic n="tag" />
          <span>כתבו שירות ומחיר: ״150״, ״מ־300״ או ״לפי הצעה״. אפשר לסדר בחצים.</span>
        </div>
        <div className="pn-rows" data-list="svc">
          {d.services.length ? (
            d.services.map((s, i) => (
              <div className="pn-srow" key={i}>
                <input className="pn-n" type="text" maxLength={60} placeholder="שם השירות" aria-label={'שם השירות ' + (i + 1)} value={s.name} onChange={(e) => set({ services: d.services.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <input className="pn-p" type="text" maxLength={24} placeholder="מחיר" aria-label="מחיר" value={s.price} onChange={(e) => set({ services: d.services.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)) })} />
                <input className="pn-o" type="text" maxLength={100} placeholder="הערה קצרה (רשות)" aria-label="הערה" value={s.note} onChange={(e) => set({ services: d.services.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} />
                <Rb i={i} n={d.services.length} onMove={(j) => set({ services: move(d.services, i, j) })} onDel={() => set({ services: d.services.filter((_, j) => j !== i) })} />
              </div>
            ))
          ) : (
            <p className="pn-note">עוד אין שירותים. הוסיפו את מה שאתם עושים, עם מחיר או ״מ־״.</p>
          )}
        </div>
        <button className="pn-btn pn-addrow" type="button" disabled={d.services.length >= 12} onClick={() => set({ services: [...d.services, { name: '', price: '', note: '' }] })}>
          <Ic n="plus" />
          הוספת שירות
        </button>
      </>
    ),
    photos: (
      <>
        <div className="pn-hint">
          <Ic n="img" />
          <span>
            <b>תמונות של עבודות ומוצרים בלבד.</b> עד 4 תמונות. נקטין אותן אוטומטית כדי שהדף ייפתח מהר.
          </span>
        </div>
        <div className="pn-phs">
          {(d.photos ?? []).map((u, i) => (
            <div className="pn-ph1" key={i}>
              <img src={u} alt={'תמונה ' + (i + 1)} />
              <span className="pn-kb">{kb(u.length)}</span>
              <button
                className="pn-x"
                type="button"
                aria-label={'הסרת תמונה ' + (i + 1)}
                onClick={() => {
                  set({ photos: (d.photos ?? []).filter((_, j) => j !== i) });
                  props.toast('התמונה הוסרה. שמרו כדי לעדכן את הדף');
                }}
              >
                <Ic n="x" />
              </button>
            </div>
          ))}
          {(d.photos ?? []).length < PR_IMG.photos ? (
            <label className={cx('pn-ph1 pn-add', busy === 'photo' && 'pn-busy')}>
              <Ic n="plus" />
              <span>הוספת תמונה</span>
              <input type="file" accept="image/*" multiple aria-label="הוספת תמונות" onChange={(e) => void addImages(e.target.files, 'photo').then(() => (e.target.value = ''))} />
            </label>
          ) : null}
        </div>
      </>
    ),
    hours: (
      <>
        <div className={cx('pn-fl pn-sched', d.always && 'pn-always')}>
          <span>
            ימים ושעות <small>(מוצג בדף העסק, ובשבת מסומן ״חוזר במוצ״ש״)</small>
          </span>
          <div className="pn-days" role="group" aria-label="ימי עבודה">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו'].map((x, i) => (
              <label className="pn-dchip" key={i}>
                <input
                  type="checkbox"
                  aria-label={'יום ' + x + '׳'}
                  checked={sched.days.includes(i)}
                  onChange={(e) => setSched({ ...sched, days: e.target.checked ? [...sched.days, i].sort((a, b) => a - b) : sched.days.filter((y) => y !== i) })}
                />
                <span>{x + '׳'}</span>
              </label>
            ))}
          </div>
          <div className="pn-times">
            <label>
              מ־
              <input type="time" value={sched.from} onChange={(e) => setSched({ ...sched, from: e.target.value })} />
            </label>
            <label>
              עד <input type="time" value={sched.to} onChange={(e) => setSched({ ...sched, to: e.target.value })} />
            </label>
            <label className="pn-al pn-checks" style={{ minHeight: 0 }}>
              <input type="checkbox" checked={d.always} onChange={(e) => set({ always: e.target.checked })} /> זמין 24/7
            </label>
          </div>
        </div>
        {!d.always ? (
          <div className="pn-fl">
            <span>
              חלונות נוספים <small>(שעות אחרות ביום מסוים, או מוצאי שבת)</small>
            </span>
            <div className="pn-rows">
              {sched.extra.map((h: PrHours, i) => (
                <div className="pn-srow" key={i}>
                  <select aria-label="יום" value={String(h.dow)} onChange={(e) => setSched({ ...sched, extra: sched.extra.map((x, j) => (j === i ? { ...x, dow: Number(e.target.value) } : x)) })}>
                    {PR_DOW_LETTERS.map((dl, k) => (
                      <option key={k} value={String(k)}>
                        {dl}
                      </option>
                    ))}
                  </select>
                  <input type="time" aria-label="משעה" value={h.from} onChange={(e) => setSched({ ...sched, extra: sched.extra.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)) })} />
                  <input type="time" aria-label="עד שעה" value={h.to} onChange={(e) => setSched({ ...sched, extra: sched.extra.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })} />
                  <div className="pn-rb">
                    <button type="button" className="pn-del" aria-label="הסרת החלון" onClick={() => setSched({ ...sched, extra: sched.extra.filter((_, j) => j !== i) })}>
                      <Ic n="trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="pn-btn pn-addrow" type="button" onClick={() => setSched({ ...sched, extra: [...sched.extra, { dow: 6, from: '20:00', to: '23:00' }] })}>
              <Ic n="plus" />
              חלון נוסף
            </button>
          </div>
        ) : null}
        <label className="pn-fl">
          <span>
            שעות במילים <small>(רשות, לתצוגה)</small>
          </span>
          <input type="text" maxLength={80} placeholder="א׳–ה׳ 8:00–19:00, ו׳ עד 12:00" value={d.hoursNote} onChange={(e) => set({ hoursNote: e.target.value })} />
        </label>
        <div className="pn-chipset">{chk('זמינים לקריאות חירום', d.emergency, (v) => set({ emergency: v }))}</div>
      </>
    ),
    faq: (
      <>
        <div className="pn-hint">
          <Ic n="q" />
          <span>מה שואלים אתכם הכי הרבה? עד 4 שאלות. למשל: ״יש אחריות?״, ״מגיעים בערב?״</span>
        </div>
        <div className="pn-rows" data-list="faq">
          {(d.faq ?? []).length ? (
            (d.faq ?? []).map((f, i, all) => (
              <div className="pn-srow pn-fq" key={i}>
                <input className="pn-n" type="text" maxLength={120} placeholder="השאלה" aria-label={'שאלה ' + (i + 1)} value={f.q} onChange={(e) => set({ faq: all.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} />
                <textarea className="pn-o" maxLength={500} placeholder="התשובה" aria-label="תשובה" value={f.a} onChange={(e) => set({ faq: all.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
                <Rb i={i} n={all.length} onMove={(j) => set({ faq: move(all, i, j) })} onDel={() => set({ faq: all.filter((_, j) => j !== i) })} />
              </div>
            ))
          ) : (
            <p className="pn-note">עוד אין שאלות.</p>
          )}
        </div>
        <button className="pn-btn pn-addrow" type="button" disabled={(d.faq ?? []).length >= 4} onClick={() => set({ faq: [...(d.faq ?? []), { q: '', a: '' }] })}>
          <Ic n="plus" />
          הוספת שאלה
        </button>
      </>
    ),
    pay: (
      <>
        <div className="pn-fl">
          <span>אמצעי תשלום</span>
          <div className="pn-chipset">
            {PR_PAYS.map(([k, l]) => chk(l, (d.pay ?? []).includes(k), (v) => set({ pay: v ? [...(d.pay ?? []), k] : (d.pay ?? []).filter((x) => x !== k) })))}
          </div>
        </div>
        <div className="pn-fl">
          <span>שפות</span>
          <div className="pn-chipset">
            {LANG_KEYS.map((k) => chk(PR_LANG_NAMES[k], d.languages.includes(k), (v) => set({ languages: v ? [...d.languages, k] : d.languages.filter((x) => x !== k) })))}
          </div>
        </div>
      </>
    ),
    cert: (
      <div className="pn-grid2">
        <label className="pn-fl">
          <span>שנות ותק</span>
          <input type="number" min={0} max={120} step={1} inputMode="numeric" placeholder="למשל 12" value={d.years ?? ''} onChange={(e) => set({ years: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
        <label className="pn-fl">
          <span>
            תעודה / הסמכה <small>(רשות)</small>
          </span>
          <input type="text" maxLength={80} placeholder="חשמלאי מוסמך משרד העבודה" value={d.cert ?? ''} onChange={(e) => set({ cert: e.target.value })} />
        </label>
        <label className="pn-fl">
          <span>
            השגחה <small>(לעסקי מזון)</small>
          </span>
          <input type="text" maxLength={80} placeholder="בד״ץ …" value={d.kashrut} onChange={(e) => set({ kashrut: e.target.value })} />
        </label>
      </div>
    ),
  };
  const saveLabel = props.saveText || (!isNew ? 'שמירת הדף' : !canApprove && requireApproval ? 'שליחה לאישור' : 'הוספה לאלפון');

  return (
    <form
      className={cx('pn-f pn-ed', dirty && 'pn-dirty')}
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="pn-edhd">
        <h2>
          עורך הדף <small>{doneN + ' מתוך ' + PN_SECS.length + ' חלקים'}</small>
        </h2>
        <div className="pn-edprog" aria-hidden="true">
          {PN_SECS.map(([k], i) => (
            <i key={k} className={i < doneN ? 'pn-on' : undefined} />
          ))}
        </div>
      </div>
      {PN_SECS.map(([k, title, icon]) => sec(k, title, icon, secDone(cur, k), secSum(cur, k), bodies[k]))}
      {canApprove
        ? sec(
            'gabbai',
            'שדות ה' + gabbai,
            'shield',
            !!cur.dialCode,
            [cur.dialCode ? 'קוד חיוג ' + cur.dialCode : 'קוד חיוג — יוקצה באישור', cur.featuredUntil ? (featuredOpen(cur) ? 'מודגש עד שיבוטל' : 'מודגש עד ' + cur.featuredUntil) : '', cur.source === 'gabbai' ? 'הוזן ע״י ה' + gabbai : 'נמסר ע״י בעל ה' + word]
              .filter(Boolean)
              .join(' · '),
            <>
              <div className="pn-grid2">
                <label className="pn-fl">
                  <span>מקור הרישום</span>
                  <select value={d.source} onChange={(e) => set({ source: e.target.value === 'gabbai' ? 'gabbai' : 'owner' })}>
                    <option value="owner">{'בעל ה' + word + ' מסר בעצמו — זמין בוואטסאפ, מקבל בקשות'}</option>
                    <option value="gabbai">{'הוזן ע״י ה' + gabbai + ' — טלפון כשר, לא מקבל בקשות'}</option>
                  </select>
                </label>
                <label className="pn-fl">
                  <span>
                    קוד חיוג <small>(3 ספרות — מודפס בחוברת)</small>
                  </span>
                  <input type="text" inputMode="numeric" dir="ltr" maxLength={3} placeholder="ריק = יוקצה באישור" value={d.dialCode} onChange={(e) => set({ dialCode: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
                </label>
                <label className="pn-fl">
                  <span>
                    כרטיס מודגש עד <small>(ריק = לא מודגש)</small>
                  </span>
                  <PnDate label="כרטיס מודגש עד" value={d.featuredUntil} text={featuredOpen(d) ? 'עד שיבוטל' : undefined} onChange={(v) => set({ featuredUntil: v })} />
                </label>
              </div>
              <button className="pn-btn pn-addrow" type="button" onClick={() => set({ dialCode: nextDialCode(listings) })}>
                🎲 הקוד הבא
              </button>
              <label className="pn-fl">
                <span>
                  הערה פנימית <small>{'(רק ל' + gabbai + ' — לא בחוברת ולא בייצוא)'}</small>
                </span>
                <textarea value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
              </label>
            </>,
          )
        : null}
      <div className="pn-edsave">
        <div className="pn-checks">
          <label>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> קיבלתי את הסכמתו להופיע באלפון
          </label>
        </div>
        <div className="pn-actions">
          <div>
            <button className="pn-btn pn-primary" type="submit">
              {saveLabel}
            </button>
            <button className="pn-btn" type="button" onClick={() => props.onPreview(cur)}>
              <Ic n="eye" />
              תצוגה
            </button>
          </div>
          {base && (dirty || canDelete || props.onCancel) ? (
            <div>
              {dirty || props.onCancel ? (
                <button
                  className="pn-btn"
                  type="button"
                  onClick={() => {
                    revert();
                    props.onCancel?.();
                  }}
                >
                  ביטול עריכה
                </button>
              ) : null}
              {canDelete ? (
                <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={del}>
                  {armed === 'ed-' + base.id ? 'ללחוץ שוב כדי להסיר את הדף' : 'הסרת העסק'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className={cx('pn-sizem', size !== 'ok' && 'pn-' + size)} hidden={!(dirty || size !== 'ok')}>
          <span>
            {size === 'over' ? (
              <>
                {'הדף גדול מדי ('}
                <span className="pn-ltr">{kb(bytes)}</span>
                {' מתוך '}
                <span className="pn-ltr">{kb(PR_IMG.doc)}</span>
                {'). הסירו תמונה או קצרו טקסט.'}
              </>
            ) : size === 'warn' ? (
              <>
                {dirty ? <b className="pn-unsaved">יש שינויים שלא נשמרו</b> : null}
                {dirty ? ' · ' : ''}
                הדף כמעט מלא. כדאי להקטין תמונה או לקצר טקסט.
              </>
            ) : dirty ? (
              <b className="pn-unsaved">יש שינויים שלא נשמרו</b>
            ) : null}
          </span>
          <span className="pn-bar">
            <i style={{ width: Math.min(100, Math.round((bytes / PR_IMG.doc) * 100)) + '%' }} />
          </span>
        </div>
      </div>
    </form>
  );
}
