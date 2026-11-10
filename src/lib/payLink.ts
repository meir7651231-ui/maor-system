/**
 * קישורי-תשלום (INTEGRATIONS גל ג׳, הרחבת `payments`) — "עד-המפתח": הארגון מזין
 * את כתובת עמוד-התשלום שלו (נדרים-פלוס / Grow / קארדקום / מותאם), והמערכת בונה
 * קישור עם הסכום (והשם) ממולאים. אין סליקה בצד-שלנו — העמוד של הספק גובה;
 * הרישום במערכת נשאר ידני (סליקה-מלאה-עם-webhook = functions/, גבול-Blaze).
 *
 * ביטחון: ה-payUrl מגיע מהקונפיג (ענן!) ⇒ עובר safeHttpsUrl אצל ה-caller/כאן;
 * ההזרקות שלנו עוברות encodeURIComponent.
 */
import { safeHttpsUrl } from './config';
import { SITE_DOMAINS } from './siteDomains';

/** פרטי-המשלם שעוברים לעמוד-התשלום (3.11.2026, בקשת-בעלים «שכל הפרטים של הבן-אדם יעברו ישירות
 *  לעמוד התרומה ולא רק השם — שוכחים לרשום מייל וטלפון ואז זה לא נכנס לתוכנה בחזרה»).
 *  הסנכרון-הנכנס (נדרים/סולה) מזהה תורם לפי טלפון/מייל — לכן הם חייבים להגיע לעמוד. */
export interface PayPerson {
  name?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  zip?: string;
  /** ת"ז — לנדרים בלבד (Zeout). */
  idNum?: string;
}

const isNedarim = (u: URL) => /(^|\.)matara\.pro$/i.test(u.hostname) && /nedarimplus/i.test(u.pathname + u.search);
/** סולה = white-label של Cardknox: עמודי PaymentSITE ב-*.cardknox.com (וגם solapayments.com). */
const isSola = (u: URL) => /(^|\.)(cardknox\.com|solapayments\.com)$/i.test(u.hostname);

/** בניית קישור-תשלום: מוסיף סכום + פרטי-המשלם ל-URL של הארגון.
 *  ‏`who` = שם (מחרוזת ⇒ ההתנהגות הישנה, ביט-זהה) או PayPerson מלא (רק לארגון שהופעל — `orgPayWho`).
 *  · נדרים-פלוס: Amount · ClientName · Phone · Email · Street · City · Zeout — שמות-הפרמטרים אומתו מול
 *    קוד-העמוד שלהם (JavaScript5.js: ‎DecodeParam('Phone') ⇒ #PhoneTxt‎ וכו'). ⚠️ נדרים **נועל** שדה שמולא מהקישור.
 *  · סולה (PaymentSITE): xBillLastName (שדה "Name" בעמוד של מאור) · xBillPhone · xEmail · xBillStreet ·
 *    xBillCity · xBillZip — אומת בדפדפן מול העמוד החי. **בלי סכום**: העמוד בדולרים והסכומים במאור בשקלים
 *    (הכרעת-בעלים 3.11 — לא להבטיח ₪500 כ-$500); הגובה מקליד סכום.
 *  · תבנית-מותאמת: `{amount}`/`{name}` ב-URL מוחלפים. · ספק אחר: amount/name (המוסכמה הרווחת).
 *  URL לא-https ⇒ null. */
export function payLink(payUrl: string, amount: number, who: string | PayPerson = ''): string | null {
  const base = safeHttpsUrl(payUrl);
  if (!base) return null;
  const p: PayPerson = typeof who === 'string' ? { name: who } : who ?? {};
  const name = (p.name ?? '').trim();
  const amt = String(Math.max(0, Math.round(amount * 100) / 100));
  if (base.includes('%7Bamount%7D') || base.includes('{amount}')) {
    // תבנית-מותאמת — החלפה בתוך ה-URL (גם בצורה המקודדת שה-URL parser מייצר).
    // סכום 0 ("לא-ידוע", קישור-תרומה-כללי) ⇒ שדה-ריק, עקבי עם מצב-הפרמטרים (לא Amount=0).
    return base
      .replace(/%7Bamount%7D|\{amount\}/g, amt === '0' ? '' : encodeURIComponent(amt))
      .replace(/%7Bname%7D|\{name\}/g, encodeURIComponent(typeof who === 'string' ? who : name)); // מחרוזת ⇒ כמו פעם (בלי trim)
  }
  const u = new URL(base);
  // מחרוזת = ההתנהגות הישנה בדיוק (ארגונים שאינם מאור — «רק מאור», 3.11.2026): Amount/ClientName לנדרים, אחרת amount/name
  if (typeof who === 'string') {
    if (isNedarim(u)) {
      if (amt !== '0') u.searchParams.set('Amount', amt);
      if (name) u.searchParams.set('ClientName', name);
      return u.toString();
    }
    if (amt !== '0') u.searchParams.set('amount', amt);
    if (name) u.searchParams.set('name', name);
    return u.toString();
  }
  const put = (k: string, v: string | undefined) => {
    const t = (v ?? '').trim();
    if (t) u.searchParams.set(k, t);
  };
  // כיוון-יוצא נדרים-פלוס: עמוד-הסליקה שלהם קורא **Amount/ClientName** (PascalCase),
  // לא amount/name. זיהוי-מארח ⇒ מילוי-מראש שבאמת נתפס ("המערכת לוחצת על הקישור").
  if (isNedarim(u)) {
    if (amt !== '0') u.searchParams.set('Amount', amt);
    put('ClientName', name);
    put('Phone', p.phone);
    put('Email', p.email);
    put('Street', p.street);
    put('City', p.city);
    put('Zeout', p.idNum);
    return u.toString();
  }
  if (isSola(u)) {
    put('xBillLastName', name);
    put('xBillPhone', p.phone);
    put('xEmail', p.email);
    put('xBillStreet', p.street);
    put('xBillCity', p.city);
    put('xBillZip', p.zip);
    return u.toString();
  }
  if (amt !== '0') u.searchParams.set('amount', amt);
  if (name) u.searchParams.set('name', name);
  return u.toString();
}

/** פרטי-משלם מתורם: השם-על-הקבלה, טלפון (ראשי, אחרת הראשון מהנוספים), מייל, כתובת, עיר, ת"ז. טהור. */
export function supporterPayPerson(sp: { name: string; phone?: string; phones?: { num?: string }[]; email?: string; address?: string; city?: string; idNum?: string }): PayPerson {
  const extra = (sp.phones ?? []).map((x) => x.num ?? '').find((x) => x.trim()) ?? '';
  return { name: sp.name, phone: (sp.phone || '').trim() || extra, email: sp.email, street: sp.address, city: sp.city, idNum: sp.idNum };
}

/** פרטי-משלם לתשלום-חוג: המשלם = המשפחה (טלפון/מייל/כתובת של המשפחה, נפילה לטלפון-החבר);
 *  השם כפי שמוצג היום. **בלי ת"ז** — ת"ז-הילד אינה של המשלם. טהור. */
export function familyPayPerson(
  name: string,
  fam: { phone?: string; phone2?: string; email?: string; address?: string; city?: string } | undefined,
  member?: { phone?: string },
): PayPerson {
  return { name, phone: (fam?.phone || '').trim() || (member?.phone || '').trim() || (fam?.phone2 || '').trim(), email: fam?.email, street: fam?.address, city: fam?.city };
}

/** כתובת עמוד-הסולה של הארגון: מהאשף (payments.solaPayUrl); חסר ⇒ ברירת-המחדל של הארגון
 *  מ-SITE_DOMAINS (מאור: «תקבע בתוכנה», 3.11.2026). */
export function orgSolaPayUrl(configured: string | undefined, orgSlug: string | undefined): string {
  if ((configured ?? '').trim()) return configured!.trim();
  if (!orgSlug) return '';
  const d = Object.values(SITE_DOMAINS).find((x) => x.officeSlug === orgSlug || x.slug === orgSlug);
  return d?.solaPayUrl ?? '';
}

/** «רק מאור» (הכרעת-בעלים 3.11.2026): העברת כל-הפרטים פעילה רק לארגון שמסומן ב-SITE_DOMAINS
 *  (`payFullDetails`); כל ארגון אחר מקבל את השם בלבד — ההתנהגות של היום, ביט-זהה. טהור. */
export function orgPayWho(orgSlug: string | undefined, p: PayPerson): string | PayPerson {
  const on = !!orgSlug && Object.values(SITE_DOMAINS).some((x) => x.payFullDetails && (x.officeSlug === orgSlug || x.slug === orgSlug));
  return on ? p : (p.name ?? '');
}

/** תוויות-הכפתורים עם המטבע — רק לארגון שהופעל (מאור, `payCurrencyLabels`); אחרת null ⇒ התווית הקיימת בכל משטח. טהור. */
export function orgPayLabels(orgSlug: string | undefined): { ned: string; sola: string } | null {
  const on = !!orgSlug && Object.values(SITE_DOMAINS).some((x) => x.payCurrencyLabels && (x.officeSlug === orgSlug || x.slug === orgSlug));
  return on ? { ned: '💳 נדרים · ₪ שקל', sola: '💳 סולה · $ דולר' } : null;
}
