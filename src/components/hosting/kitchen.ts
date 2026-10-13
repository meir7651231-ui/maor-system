/**
 * 🏡 אירוח משפחתי — מנוע-המטבח הטהור (BUILD-ORDER-HOSTING-2026-10-12, אשכול 3) — פורט של "צוות מטבח" במקור.
 *
 * מנוע-זמן ("מתי להכין"): התחלת-הכנה = שעת-הגשה − max(הכנה+בישול) · "להכין עכשיו" · "להזמין חומרים עד"
 * (תאריך-הארוחה − ימי-ההזמנה) · ספירה-לאחור. מנוע-כמויות: פירוק "רכיב · כמות" + הכפלה לפי סועדים/מנות-בסיס.
 * עגלת-קניות מצטברת (רכיבים מוכפלים · חד-פעמי×סועדים · נלווים) עם מילון-האמוג׳י של המקור. מערך-שולחן
 * (בסיסי/חגיגי). עומס-צוות ותפקידים. "🔄 סנכרן הכל" (סועדים⇐משתתפי-ההזמנה, טבח-ברירת-מחדל למנה).
 * בלי store/DOM/Date.now — "היום"/"עכשיו" מוזרקים.
 */
import type { HostBooking, HostDiner, HostDish, HostMeal, HostMealItem, HostSeatPerson, HostSupply, HostTableItem } from '../../types/domain';
import { HOST_MEAL_CHAIN } from './model';
import { addDaysIso, dishOf, isMealActive } from './transitions';

// ליבת-המטבח שה-store אוכף (פעילה/מנה⇄מתכון/סנכרן-הכל) יושבת ב-transitions.ts — מיוצאת-מחדש כאן לממשק ולבדיקות.
export { dishOf, isMealActive, syncAllKitchen } from './transitions';

/* ═══════════════ שרשרת-הסטטוס ═══════════════ */

/** השלב הבא בשרשרת (חדש ⇒ בהכנה ⇒ בקרת איכות ⇒ מוכן ⇒ נמסר) — null בסוף/בבוטל. */
export function mealNextStatus(s: HostMeal['status']): HostMeal['status'] | null {
  const i = (HOST_MEAL_CHAIN as readonly string[]).indexOf(s);
  return i >= 0 && i < HOST_MEAL_CHAIN.length - 1 ? HOST_MEAL_CHAIN[i + 1] : null;
}

/* ═══════════════ מנוע-הזמן ═══════════════ */

/** "HH:MM" ⇒ דקות; לא-תקין ⇒ null (`toMin`). */
export function toMin(t: string): number | null {
  if (!t || t.indexOf(':') < 0) return null;
  const [hh, mm] = t.split(':').map(Number);
  return Number.isFinite(hh) && Number.isFinite(mm) ? hh * 60 + mm : null;
}
/** דקות ⇒ "HH:MM" (מעגלי ל-24 שעות — `minTo`). */
export function minTo(x: number): string {
  const v = ((x % 1440) + 1440) % 1440;
  return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
}

/** זמן-ההכנה הארוך מבין המנות (הכנה+בישול, דקות) — `koLead`. */
export function mealLeadMinutes(m: Pick<HostMeal, 'items'>, dishes: readonly HostDish[]): number {
  let mx = 0;
  for (const it of m.items) {
    const d = dishOf(it, dishes);
    const p = (parseInt(d?.prepTime ?? '', 10) || 0) + (parseInt(d?.cookTime ?? '', 10) || 0);
    if (p > mx) mx = p;
  }
  return mx;
}

/** התחלת-הכנה מומלצת = שעת-הגשה − זמן-ההכנה (`koStart`) — null בלי שעה. */
export function mealStartTime(m: Pick<HostMeal, 'items' | 'time'>, dishes: readonly HostDish[]): string | null {
  const tm = toMin(m.time);
  return tm == null ? null : minTo(tm - mealLeadMinutes(m, dishes));
}

/** "🔴 להתחיל להכין עכשיו" — חדשה, ועבר זמן-ההתחלה (או שתאריכה עבר) — `koDue`. */
export function mealDueNow(m: Pick<HostMeal, 'items' | 'time' | 'date' | 'status'>, dishes: readonly HostDish[], today: string, nowMin: number): boolean {
  if (m.status !== 'new') return false;
  const d = m.date || today;
  const tm = toMin(m.time);
  if (tm == null) return false;
  if (d < today) return true;
  if (d > today) return false;
  return nowMin >= tm - mealLeadMinutes(m, dishes);
}

/** "להזמין חומרים עד" = תאריך-הארוחה − ימי-ההזמנה (`orderBy`). */
export function orderByDate(m: Pick<HostMeal, 'date'>, leadDays: number): string | null {
  return m.date ? addDaysIso(m.date, -leadDays) || null : null;
}

/** חלון-ההזמנה נפתח (חדשה, היום ≥ "עד", והארוחה עוד לא עברה) — `orderDue`. */
export function orderDue(m: Pick<HostMeal, 'date' | 'status'>, leadDays: number, today: string): boolean {
  if (m.status !== 'new' || !m.date) return false;
  const ob = orderByDate(m, leadDays);
  return !!ob && today >= ob && m.date >= today;
}

/** רגע-ההגשה "YYYY-MM-DDTHH:MM" לטיימר ('' בלי תאריך/שעה). */
export function mealServeAt(m: Pick<HostMeal, 'date' | 'time'>): string {
  return m.date && m.time ? m.date + 'T' + m.time : '';
}

/** ספירה-לאחור (`fmtCountdown`): "1:05:09" / "12:04"; אחרי הזמן ⇒ "2 שע׳ 5 דק׳" + over. */
export function countdown(ms: number): { text: string; over: boolean } {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (ms <= 0) {
    const s = Math.floor(-ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return { text: (h > 0 ? h + ' שע׳ ' : '') + m + ' דק׳', over: true };
  }
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return { text: (h > 0 ? h + ':' : '') + pad(m) + ':' + pad(s % 60), over: false };
}

/* ═══════════════ סועדים ═══════════════ */

export function dinerTotal(diners: readonly HostDiner[]): number {
  return diners.reduce((s, d) => s + (d.adults || 0) + (d.kids || 0), 0);
}

/** שמות המשפחות הסועדות. */
export function dinerNames(m: Pick<HostMeal, 'diners'>, guestName: (id: string) => string): string[] {
  return m.diners.map((d) => guestName(d.guestId)).filter(Boolean);
}

/** הסועדים ממשפחת-ההזמנה (מבוגרים+ילדים של ההזמנה). */
export function dinersFromBooking(b: Pick<HostBooking, 'guestId' | 'adults' | 'kids'>): HostDiner[] {
  return [{ guestId: b.guestId, adults: b.adults || 0, kids: b.kids || 0 }];
}

/** משתתפי-ההושבה מהמשפחות: "{משפחה} · מבוגר 1 … · ילד 1 …" (`dinersToPeople`). */
export function dinersToPeople(m: Pick<HostMeal, 'diners'>, guestName: (id: string) => string): HostSeatPerson[] {
  const out: HostSeatPerson[] = [];
  let n = 0;
  for (const d of m.diners) {
    const nm = guestName(d.guestId);
    for (let i = 0; i < (d.adults || 0); i++) out.push({ id: 'sp' + ++n, name: nm + ' · מבוגר ' + (i + 1), kind: 'adult', guestId: d.guestId });
    for (let i = 0; i < (d.kids || 0); i++) out.push({ id: 'sp' + ++n, name: nm + ' · ילד ' + (i + 1), kind: 'kid', guestId: d.guestId });
  }
  return out;
}

/* ═══════════════ מנוע-הכמויות ═══════════════ */

/** "קמח · 1 ק״ג" ⇒ {name:'קמח', qty:'1 ק״ג'} (`parseIng`). */
export function parseIng(str: string): { name: string; qty: string } {
  const i = str.indexOf('·');
  if (i < 0) return { name: str.trim(), qty: '' };
  return { name: str.slice(0, i).trim(), qty: str.slice(i + 1).trim() };
}

/** הכפלת המספר הראשון בכמות (עיגול לעשירית) — "2 כוסות" ×1.5 ⇒ "3 כוסות" (`scaleQty`). */
export function scaleQty(qty: string, f: number): string {
  if (!qty || Math.abs(f - 1) < 1e-6) return qty;
  return qty.replace(/\d+(\.\d+)?/, (m) => String(Math.round(+m * f * 10) / 10));
}

/** מקדם-ההכפלה של מנה: מנות-מבוקשות ÷ מנות-בסיס (`mealFactor`). */
export function mealFactor(m: Pick<HostMeal, 'dinerCount'>, dish: Pick<HostDish, 'baseServings'> | undefined, item: Pick<HostMealItem, 'qty'> | undefined): number {
  const base = dish?.baseServings || 4;
  const portions = item?.qty ? item.qty : m.dinerCount || base;
  return portions / base;
}

/* ═══════════════ צוות ═══════════════ */

/** תפקידי איש-הצוות בארוחה (`staffRoleIn`): מכין · מגיש · מוריד · שולחן · המנות שהוא מכין. */
export function staffRoleIn(m: HostMeal, staffId: string): string[] {
  const r: string[] = [];
  if (m.cook === staffId) r.push('👨‍🍳 מכין');
  if (m.server === staffId) r.push('🍽️ מגיש');
  if (m.clearer === staffId) r.push('🧹 מוריד');
  if (m.tableSetter === staffId) r.push('🪑 שולחן');
  const dishes = m.items.filter((i) => i.by === staffId).map((i) => i.name);
  if (dishes.length) r.push('🍲 ' + dishes.join(', '));
  return r;
}

/** הארוחות הפעילות שאיש-הצוות משובץ בהן (`staffOrders`). */
export function staffActiveMeals(staffId: string, meals: readonly HostMeal[]): HostMeal[] {
  return meals.filter((m) => isMealActive(m) && staffRoleIn(m, staffId).length > 0);
}

/* ═══════════════ עגלת-הקניות ═══════════════ */

/** מילון-האמוג׳י של המקור — [אמוג׳י, מילות-מפתח]; הראשון שמתאים מנצח (`SHOP_DICT`). */
export const SHOP_DICT: readonly (readonly [string, readonly string[]])[] = [
  ['🥣', ['דגני', 'דגן ', 'קורנפלקס', 'גרנול', 'קוואקר', 'שיבולת']],
  ['🍫', ['שוקולד', 'שוקו', 'קקאו', 'נוטלה']],
  ['🍗', ['עוף', 'חזה', 'שוקיים', 'כרעי', 'פרגית', 'כנפי', 'ירך']],
  ['🦃', ['הודו', 'תרנגול']],
  ['🥩', ['בשר', 'אנטריקוט', 'סטייק', 'אסאדו', 'צלי', 'טחון', 'המבורגר', 'קבב', 'שווארמה']],
  ['🍖', ['צלעות', 'שניצל', 'נקניק', 'מרגז', 'חזיר']],
  ['🌭', ['נקניקי', 'הוט דוג']],
  ['🐟', ['דג', 'סלמון', 'טונה', 'בקלה', 'לברק', 'דניס', 'אמנון', 'פילה']],
  ['🦐', ['שרימפ', 'חסילון', 'פירות ים']],
  ['🧀', ['גבינ', 'מוצרלה', 'פרמז', 'קוטג', 'צהוב', 'בולגרית', 'פטה', 'שמנת']],
  ['🥛', ['חלב', 'משקה שקדים', 'משקה סויה']],
  ['🧈', ['חמאה', 'מרגרינ']],
  ['🥛', ['יוגורט', 'לבן', 'אשל']],
  ['🥚', ['ביצ']],
  ['🍞', ['לחם', 'חלה', 'לחמני', 'פית', 'בגט', 'ציאבטה', 'טוסט']],
  ['🥖', ['בגט', 'לחמניות']],
  ['🥯', ['בייגל', 'ביגל']],
  ['🥐', ['קרואסון', 'מאפה', 'בורקס']],
  ['🧇', ['וופל', 'פנקייק']],
  ['🌾', ['קמח', 'סובין', 'שיפון']],
  ['🍚', ['אורז', 'קוסקוס', 'בורגול', 'קינואה', 'פתית']],
  ['🍝', ['פסטה', 'ספגטי', 'אטרי', 'נודל', 'מקרונ']],
  ['🫘', ['שעועית', 'חומוס', 'עדשים', 'קטני', 'אפונ', 'תירס']],
  ['🧂', ['מלח', 'תבלין', 'פלפל שחור', 'פפריק', 'כמון', 'כורכום', 'אבקת']],
  ['🍬', ['סוכר', 'ממתק', 'סוכריות', 'טופי']],
  ['🍫', ['שוקולד', 'קקאו', 'נוטלה']],
  ['🍯', ['דבש', 'סילאן', 'ריבה', 'ממרח']],
  ['🫒', ['שמן', 'זית', 'טחינה', 'חמאת בוטנים']],
  ['🥜', ['בוטנ', 'אגוז', 'שקד', 'פיסטוק', 'קשיו', 'חטיף']],
  ['🥗', ['סלט', 'חסה', 'רוקט', 'עלים', 'ירק']],
  ['🍅', ['עגבני', 'שרי', 'רסק']],
  ['🥒', ['מלפפון', 'חמוצ']],
  ['🧅', ['בצל', 'שאלוט']],
  ['🧄', ['שום']],
  ['🥕', ['גזר']],
  ['🥔', ['תפוח אדמה', 'תפו״א', 'בטטה']],
  ['🌽', ['תירס', 'קלח']],
  ['🫑', ['פלפל', 'גמבה']],
  ['🍆', ['חציל']],
  ['🥦', ['ברוקולי', 'כרוב', 'כרובית', 'סלרי', 'שמיר', 'פטרוזיל', 'כוסבר', 'נענע']],
  ['🍄', ['פטרי', 'פטריות']],
  ['🍋', ['לימון', 'ליים']],
  ['🍎', ['תפוח', 'פרי']],
  ['🍌', ['בננ']],
  ['🍊', ['תפוז', 'קלימנט', 'מנדרינ', 'אשכולי']],
  ['🍇', ['ענב', 'צימוק']],
  ['🍓', ['תות']],
  ['🫐', ['אוכמני', 'פירות יער']],
  ['🍉', ['אבטיח']],
  ['🍈', ['מלון']],
  ['🥭', ['מנגו']],
  ['🍍', ['אננס']],
  ['🥝', ['קיווי']],
  ['🥥', ['קוקוס']],
  ['🍑', ['אפרסק', 'שזיף', 'משמש', 'נקטרינ']],
  ['🍒', ['דובדבן']],
  ['🥑', ['אבוקדו']],
  ['💧', ['מים', 'מינרל']],
  ['🥤', ['קולה', 'סודה', 'ספרייט', 'משקה', 'פחית']],
  ['🧃', ['מיץ', 'נקטר', 'פריגת']],
  ['🍷', ['יין', 'ענבים משקה']],
  ['🍾', ['שמפ', 'קאווה', 'פרוסקו']],
  ['🍺', ['בירה']],
  ['☕', ['קפה', 'נס', 'אספרסו']],
  ['🍵', ['תה', 'חליטה']],
  ['🧋', ['שוקו', 'מילקשייק']],
  ['🎂', ['עוגה', 'טורט']],
  ['🧁', ['קאפקייק', 'מאפין']],
  ['🍰', ['עוגת גבינה', 'פרוסה']],
  ['🍪', ['עוגי', 'ביסקוויט', 'קרקר']],
  ['🍩', ['סופגני', 'דונאט']],
  ['🍮', ['פודינג', 'מוס', 'קרם']],
  ['🍦', ['גלידה', 'שלגון', 'ארטיק']],
  ['🍽️', ['צלח', 'מגש', 'קערה', 'קערת']],
  ['🥛', ['כוס', 'גביע']],
  ['🍴', ['סכו', 'מזלג', 'כף', 'כפית', 'סכין']],
  ['🥢', ['צ׳ופסטיק']],
  ['🧻', ['מפי', 'נייר', 'מגבת', 'טישו']],
  ['🧺', ['סל', 'מפה', 'מפת']],
  ['🧴', ['סבון', 'ג׳ל', 'חיטוי', 'אלכוג']],
  ['🧼', ['ניקוי', 'אקונומיק', 'מנקה']],
  ['🗑️', ['שקית', 'אשפה', 'זבל']],
  ['🥡', ['קופסא', 'אריזה', 'חד פעמי', 'חד-פעמי']],
  ['🕯️', ['נר', 'נרות', 'גפרור', 'הבדל']],
  ['🔥', ['גז', 'פחם', 'מנגל', 'גריל']],
  ['🧊', ['קרח']],
  ['🌿', ['עשב', 'צמח', 'פרח']],
];

/** אמוג׳י אוטומטי לפריט (`shopIcon`). */
export function shopIcon(name: string, cat: string): string {
  const n = (name || '').trim();
  for (const [e, ws] of SHOP_DICT) for (const w of ws) if (n.indexOf(w) >= 0) return e;
  if (cat === 'שתייה') return '🥤';
  if (cat === 'חד-פעמי') return '🍽️';
  if (cat === 'נלווה') return '🧺';
  return '🛒';
}

/** בורר-האמוג׳י הידני — 10 קבוצות (`EMOJI_SETS`). */
export const EMOJI_SETS: readonly (readonly [string, readonly string[]])[] = [
  ['בשר · עוף · דגים', ['🍗', '🦃', '🥩', '🍖', '🌭', '🐟', '🦐', '🦞', '🦀', '🍤', '🥓']],
  ['חלב · ביצים', ['🧀', '🥛', '🧈', '🥚', '🍳']],
  ['מאפים · דגנים', ['🍞', '🥖', '🥯', '🥐', '🧇', '🌾', '🍚', '🍝', '🫘']],
  ['ירקות', ['🥗', '🍅', '🥒', '🧅', '🧄', '🥕', '🥔', '🌽', '🫑', '🍆', '🥦', '🍄', '🥑']],
  ['פירות', ['🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍈', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🥥']],
  ['מתוקים', ['🎂', '🧁', '🍰', '🍪', '🍩', '🍮', '🍦', '🍫', '🍬', '🍭', '🍯', '🍿']],
  ['משקאות', ['💧', '🥤', '🧃', '🍷', '🍾', '🍺', '☕', '🍵', '🧋', '🧊']],
  ['תבלינים · ממרחים', ['🧂', '🫒', '🥜', '🌶️', '🍯']],
  ['חד-פעמי · שולחן', ['🍽️', '🥛', '🍴', '🥢', '🧻', '🧺', '🥡', '🕯️']],
  ['ניקוי · כללי', ['🧴', '🧼', '🗑️', '🔥', '🌿', '🛒', '🧾', '📦', '⭐', '✅']],
];

export type ShopSection = 'ing' | 'tbl' | 'sup';

export interface ShopProduct {
  /** 'ing:<שם>' · 'tbl:<מזהה>' · 'sup:<מזהה>' (כמו במקור — מפתח-המצב של "לקחתי"/אמוג׳י). */
  key: string;
  icon: string;
  name: string;
  qty: string;
  sec: ShopSection;
  /** מוצר נלווה — מזהה למחיקה. */
  supplyId?: string;
  got: boolean;
}

/** סך הסועדים בארוחות הפעילות. */
export function activeDinerTotal(meals: readonly HostMeal[]): number {
  return meals.filter(isMealActive).reduce((s, m) => s + (m.dinerCount || 0), 0);
}

/** הרכיבים המצטברים מכל הארוחות הפעילות, מוכפלים לפי מנות (שם ⇒ רשימת-כמויות). */
export function aggregateIngredients(meals: readonly HostMeal[], dishes: readonly HostDish[]): Map<string, string[]> {
  const agg = new Map<string, string[]>();
  for (const m of meals) {
    if (!isMealActive(m)) continue;
    for (const it of m.items) {
      const d = dishOf(it, dishes);
      if (!d) continue;
      const f = mealFactor(m, d, it);
      for (const g of d.ingredients) {
        const p = parseIng(g);
        const list = agg.get(p.name) ?? [];
        list.push(scaleQty(p.qty, f));
        agg.set(p.name, list);
      }
    }
  }
  return agg;
}

/** חוויית-הקנייה (`shoppingListModal`): 3 מדפים + מצב-"לקחתי" + אחוז. */
export function shoppingList(
  meals: readonly HostMeal[],
  dishes: readonly HostDish[],
  tableItems: readonly HostTableItem[],
  supplies: readonly HostSupply[],
  got: Readonly<Record<string, true>> = {},
  emoji: Readonly<Record<string, string>> = {},
): { products: ShopProduct[]; mealsN: number; totalDiners: number; gotN: number; total: number; pct: number; done: boolean } {
  const totalDiners = activeDinerTotal(meals);
  const ic = (key: string, name: string, cat: string) => emoji[key] || shopIcon(name, cat);
  const products: ShopProduct[] = [];
  for (const [name, qs] of aggregateIngredients(meals, dishes)) {
    const key = 'ing:' + name;
    products.push({ key, icon: ic(key, name, ''), name, qty: qs.filter(Boolean).join(' + '), sec: 'ing', got: !!got[key] });
  }
  for (const t of tableItems) {
    const key = 'tbl:' + t.id;
    products.push({ key, icon: ic(key, t.name, 'חד-פעמי'), name: t.name, qty: (t.perGuest || 0) * totalDiners + ' יח׳', sec: 'tbl', got: !!got[key] });
  }
  for (const s of supplies) {
    const key = 'sup:' + s.id;
    products.push({ key, icon: ic(key, s.name, s.cat), name: s.name, qty: s.qty || '', sec: 'sup', supplyId: s.id, got: !!got[key] });
  }
  const total = products.length;
  const gotN = products.filter((p) => p.got).length;
  const pct = total ? Math.round((gotN / total) * 100) : 0;
  return { products, mealsN: meals.filter(isMealActive).length, totalDiners, gotN, total, pct, done: total > 0 && pct === 100 };
}

/** "⧉ העתק רשימה" — בדיוק הנוסח של המקור. */
export function shoppingText(meals: readonly HostMeal[], dishes: readonly HostDish[], tableItems: readonly HostTableItem[], supplies: readonly HostSupply[]): string {
  const totalDiners = activeDinerTotal(meals);
  const lines = ['🥕 רכיבים:'];
  for (const [n, qs] of aggregateIngredients(meals, dishes)) lines.push('• ' + n + ' ' + qs.filter(Boolean).join(' + '));
  lines.push('', '🍽️ מערך שולחן:');
  for (const t of tableItems) lines.push('• ' + t.name + ' ' + (t.perGuest || 0) * totalDiners);
  lines.push('', '🥤 נלווים:');
  for (const s of supplies) lines.push('• ' + s.name + ' ' + (s.qty || '') + ' (' + s.cat + ')');
  return lines.join('\n');
}

/* ═══════════════ מערך-שולחן ═══════════════ */

/** מערכים מוכנים (`TS_PRESETS`): בסיסי — צלחת/כוס/מפית/סכו״ם ×1; חגיגי — ×2 + קערית. */
export const TS_PRESETS: Readonly<Record<'basic' | 'feast', readonly (readonly [string, number])[]>> = {
  basic: [
    ['צלחת', 1],
    ['כוס', 1],
    ['מפית', 1],
    ['סכו״ם', 1],
  ],
  feast: [
    ['צלחת', 2],
    ['כוס', 2],
    ['מפית', 2],
    ['סכו״ם', 1],
    ['קערית', 1],
  ],
};

/** החלת-מערך (`tsAddItem` לכל פריט): שם קיים ⇒ עדכון הכמות; חדש ⇒ הוספה. */
export function tablesetPresetPlan(items: readonly HostTableItem[], preset: keyof typeof TS_PRESETS): { set: { id: string; perGuest: number }[]; add: { name: string; perGuest: number }[] } {
  const set: { id: string; perGuest: number }[] = [];
  const add: { name: string; perGuest: number }[] = [];
  for (const [name, per] of TS_PRESETS[preset]) {
    const ex = items.find((t) => t.name === name);
    if (ex) set.push({ id: ex.id, perGuest: per });
    else add.push({ name, perGuest: per });
  }
  return { set, add };
}

/** ± חצי לאורח (מעוגל לעשירית, לא שלילי) — כפתורי −/＋ במקור. */
export function stepPerGuest(per: number, dir: 1 | -1): number {
  return Math.max(0, Math.round(((per || 0) + dir * 0.5) * 10) / 10);
}
