/**
 * זיהוי כפילויות משפחות ומיזוגן — פונקציות טהורות (בלי store/DOM), נבדקות
 * ביחידה. עקרון-בטיחות: המיזוג משמר את כל הנתונים — בני-משפחה, מסמכים ותיעוד —
 * ולעולם אינו מוחק רשומה כספית. בני-המשפחה עוברים אל ה"שומר" עם אותו מזהה, כך
 * שהשיבוצים/התשלומים שלהם נשארים תקינים (ה-store רק ממזג ומפנה אירועים, בלי
 * מפל-המחיקה של deleteFamily).
 */
import type { Family, Member, FamilyDoc, Supporter } from '../types/domain';
import { nameSortKey } from './validate';
import { mergeHist } from '../components/supporters/lib';
import { PHOTO_MAX } from './photoGallery';

/** ספרות בלבד, נרמול קידומת ישראלית (972→0) — להשוואת טלפונים.
 *  מסנן מספרי-דמה (כל-הספרות זהות, כמו "0000000000") ⇒ '' (לא מפתח-התאמה). */
export function normPhone(s: string): string {
  let d = (s || '').replace(/\D/g, '');
  if (/^(\d)\1+$/.test(d)) return ''; // מציין-מקום (אפסים/ספרה-חוזרת) — לא טלפון אמיתי
  d = d.replace(/^00/, ''); // צורה בינ"ל 00972…
  if (d.startsWith('972')) d = '0' + d.slice(3);
  return d.replace(/^0{2,}/, '0'); // כיווץ אפסים-מובילים-כפולים (מספר ישראלי לא מתחיל 00)
}

/**
 * מפתח שם+עיר מנורמל. דורש גם שם וגם עיר לא-ריקים — אחרת ריק. בלי הדרישה הזו,
 * משפחות רבות ללא עיר ובעלות שם-משפחה נפוץ היו מתקבצות בטעות (סיכון מיזוג-שווא).
 */
function nameCityKey(f: Family): string {
  const n = (f.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const c = (f.city || '').trim().toLowerCase();
  return n && c ? n + '|' + c : '';
}

/** כל הטלפונים המנורמלים של משפחה (ראשי + נוסף), לא-ריקים. */
function phonesOf(f: Family): string[] {
  return [normPhone(f.phone), normPhone(f.phone2)].filter((p) => p.length >= 7);
}

/**
 * קבוצות כפילות — רכיבי-קשירות של משפחות שחולקות טלפון מנורמל, או שם+עיר זהים.
 * מחזיר מערך קבוצות (מזהי משפחות), כל קבוצה בגודל ≥2. Union-Find לטרנזיטיביות.
 */
export function findDuplicateGroups(families: Family[]): string[][] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r) as string;
    // דחיסת-נתיב
    let c = x;
    while (parent.get(c) !== r) {
      const nx = parent.get(c) as string;
      parent.set(c, r);
      c = nx;
    }
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const f of families) parent.set(f.id, f.id);

  const byPhone = new Map<string, string>();
  const byNameCity = new Map<string, string>();
  for (const f of families) {
    for (const p of phonesOf(f)) {
      const prev = byPhone.get(p);
      if (prev) union(prev, f.id);
      else byPhone.set(p, f.id);
    }
    const nk = nameCityKey(f);
    if (nk) {
      const prev = byNameCity.get(nk);
      if (prev) union(prev, f.id);
      else byNameCity.set(nk, f.id);
    }
  }

  const groups = new Map<string, string[]>();
  for (const f of families) {
    const r = find(f.id);
    (groups.get(r) ?? groups.set(r, []).get(r)!).push(f.id);
  }
  return [...groups.values()].filter((g) => g.length >= 2);
}

/** דה-דופ לפי מזהה — שומר את המופע הראשון. */
function dedupById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

/**
 * מיזוג משפחות אל "שומר" (keeper). ה-losers נספגים לתוכו:
 * - שדות טקסט ריקים בשומר מתמלאים מהערך הראשון הלא-ריק ב-losers.
 * - טלפון נוסף (phone2) מתמלא אם ריק, מטלפון שונה מהראשי.
 * - מוני ילדים = המקסימום; ספח מלא = OR; סטטוס = הגבוה ביותר (active>pending>inactive).
 * - בני-משפחה ומסמכים מאוחדים (דה-דופ לפי מזהה) — אפס אובדן נתונים.
 * - createdAt = המוקדם ביותר. הערות מאוחדות עם סמן "| מוזג:".
 * - cred נשמר כפי שהוא בשומר (לא ממציאים חשבון ניקוד).
 * טהור: מחזיר Family חדש, לא משנה קלט.
 */
export function mergeFamilies(keeper: Family, losers: Family[]): Family {
  const all = [keeper, ...losers];
  const firstNonEmpty = (pick: (f: Family) => string): string => {
    for (const f of all) {
      const v = (pick(f) || '').trim();
      if (v) return v;
    }
    return '';
  };
  const rank = (s: Family['status']) => (s === 'active' ? 2 : s === 'pending' ? 1 : 0);
  const status = all.reduce<Family['status']>((acc, f) => (rank(f.status) > rank(acc) ? f.status : acc), 'inactive');

  const phone = (keeper.phone || '').trim() || firstNonEmpty((f) => f.phone);
  const phoneNorm = normPhone(phone);
  let phone2 = (keeper.phone2 || '').trim();
  if (!phone2) {
    for (const f of all) {
      for (const cand of [f.phone, f.phone2]) {
        const c = (cand || '').trim();
        if (c && normPhone(c) !== phoneNorm) {
          phone2 = c;
          break;
        }
      }
      if (phone2) break;
    }
  }

  const members: Member[] = dedupById(all.flatMap((f) => f.members ?? []));
  const docs: FamilyDoc[] = dedupById(all.flatMap((f) => f.docs ?? []));

  const createdAt = all.map((f) => f.createdAt).filter(Boolean).sort()[0] ?? keeper.createdAt;

  const loserNames = losers.map((l) => l.name).filter(Boolean).join(', ');
  const notesParts = all.map((f) => (f.notes || '').trim()).filter(Boolean);
  const baseNotes = [...new Set(notesParts)].join(' · ');
  const notes = loserNames ? (baseNotes ? baseNotes + ' ' : '') + '| מוזג: ' + loserNames : baseNotes;

  return {
    ...keeper,
    father: keeper.father?.trim() || firstNonEmpty((f) => f.father),
    fatherId: keeper.fatherId?.trim() || firstNonEmpty((f) => f.fatherId),
    mother: keeper.mother?.trim() || firstNonEmpty((f) => f.mother),
    motherId: keeper.motherId?.trim() || firstNonEmpty((f) => f.motherId),
    phone,
    phone2,
    email: keeper.email?.trim() || firstNonEmpty((f) => f.email),
    city: keeper.city?.trim() || firstNonEmpty((f) => f.city),
    address: keeper.address?.trim() || firstNonEmpty((f) => f.address),
    community: keeper.community?.trim() || firstNonEmpty((f) => f.community),
    maritalStatus: keeper.maritalStatus?.trim() || firstNonEmpty((f) => f.maritalStatus),
    language: keeper.language?.trim() || firstNonEmpty((f) => f.language),
    tzedaka: keeper.tzedaka?.trim() || firstNonEmpty((f) => f.tzedaka),
    discount: keeper.discount?.trim() || firstNonEmpty((f) => f.discount),
    fullSefach: all.some((f) => f.fullSefach),
    kidsHome: Math.max(0, ...all.map((f) => f.kidsHome ?? 0)),
    kidsMarried: Math.max(0, ...all.map((f) => f.kidsMarried ?? 0)),
    status,
    members,
    docs,
    createdAt,
    notes,
  };
}

/* ── פער 21 (P2 ב׳) · מיזוג שדה-שדה — לגאסי dupFieldMerge ─────────────────────
 * legacy-main-script.js:1643-1671: 18 שדות עם תווית, לכל שדה בוחרים מאיזו רשומה
 * לקחת (pick) או עורכים ידנית (edit); ברירת המחדל — הרשומה הראשונה שיש לה ערך.
 * kidsHome/kidsMarried מומרים למספר ('' ⇒ 0).
 * שדרוג מעל הלגאסי (אפס אובדן): המבנה (members/docs/cred/סטטוס-אירועים) ממוזג
 * בסמנטיקה הבטוחה של mergeFamilies — איחוד לפי id, בלי דה-דופ first|birth שהיה
 * מאבד שיבוצים; רק ערכי השדות הסקלריים נבחרים ידנית. */

export interface DupFieldDef {
  key: string;
  label: string;
  get: (f: Family) => string;
}

/** 18 שדות המיזוג — מפתחות ותוויות verbatim מהלגאסי (שורות 1643-1653). */
export const DUP_FIELDS: DupFieldDef[] = [
  { key: 'name', label: 'שם משפחה', get: (f) => f.name || '' },
  { key: 'mother', label: 'שם האם', get: (f) => f.mother || '' },
  { key: 'father', label: 'שם האב', get: (f) => f.father || '' },
  { key: 'phone', label: 'טלפון', get: (f) => f.phone || '' },
  { key: 'phone2', label: 'טלפון 2', get: (f) => f.phone2 || '' },
  { key: 'email', label: 'אימייל', get: (f) => f.email || '' },
  { key: 'city', label: 'עיר', get: (f) => f.city || '' },
  { key: 'address', label: 'כתובת', get: (f) => f.address || '' },
  { key: 'motherId', label: 'ת"ז אם', get: (f) => f.motherId || '' },
  { key: 'fatherId', label: 'ת"ז אב', get: (f) => f.fatherId || '' },
  { key: 'community', label: 'קהילה', get: (f) => f.community || '' },
  { key: 'language', label: 'שפה', get: (f) => f.language || '' },
  { key: 'maritalStatus', label: 'מצב משפחתי', get: (f) => f.maritalStatus || '' },
  { key: 'status', label: 'סטטוס', get: (f) => f.status || '' },
  { key: 'kidsHome', label: 'ילדים בבית', get: (f) => (f.kidsHome == null ? '' : String(f.kidsHome)) },
  { key: 'kidsMarried', label: 'ילדים נשואים', get: (f) => (f.kidsMarried == null ? '' : String(f.kidsMarried)) },
  { key: 'createdAt', label: 'נרשמה', get: (f) => f.createdAt || '' },
  { key: 'notes', label: 'הערות', get: (f) => f.notes || '' },
];

/** ערך שדה נבחר לפי הלגאסי: edit גובר; אחרת pick; אחרת הראשונה עם ערך. */
export function dupFieldValue(
  fams: Family[],
  def: DupFieldDef,
  pick: Record<string, number>,
  edit: Record<string, string>,
): string {
  const edited = edit[def.key];
  if (edited != null) return edited;
  const idx = pick[def.key] ?? fams.findIndex((f) => def.get(f));
  return def.get(fams[idx >= 0 ? idx : 0]);
}

/** מיזוג קבוצה לפי בחירת-שדות — טהור; fams[0] הוא בסיס השומר. */
export function mergeFamiliesByFields(
  fams: Family[],
  pick: Record<string, number>,
  edit: Record<string, string>,
): Family {
  const base = mergeFamilies(fams[0], fams.slice(1));
  const out: Family = { ...base };
  for (const def of DUP_FIELDS) {
    const val = dupFieldValue(fams, def, pick, edit);
    switch (def.key) {
      case 'kidsHome': out.kidsHome = val === '' ? 0 : +val; break;
      case 'kidsMarried': out.kidsMarried = val === '' ? 0 : +val; break;
      case 'status': out.status = (val || base.status) as Family['status']; break;
      case 'name': out.name = val; break;
      case 'mother': out.mother = val; break;
      case 'father': out.father = val; break;
      case 'phone': out.phone = val; break;
      case 'phone2': out.phone2 = val; break;
      case 'email': out.email = val; break;
      case 'city': out.city = val; break;
      case 'address': out.address = val; break;
      case 'motherId': out.motherId = val; break;
      case 'fatherId': out.fatherId = val; break;
      case 'community': out.community = val; break;
      case 'language': out.language = val; break;
      case 'maritalStatus': out.maritalStatus = val; break;
      case 'createdAt': out.createdAt = val; break;
      case 'notes': out.notes = val; break;
    }
  }
  return out;
}

/* ─────────── 🔗 כפולי-תורמים (ROADMAP-100 ‏#13, 5.8.2026) ───────────
 * אותם עקרונות-בטיחות כמו המשפחות: המיזוג משמר הכול, ולעולם לא מוחק רשומה
 * כספית — התרומות (עם ה-rid!) וה-hist עוברים ל"שומר", והצבירה מחושבת מחדש. */

/** מפתח שם+עיר לתומך — שניהם חובה (שם-אדם נפוץ לבדו = סיכון מיזוג-שווא). */
function supNameCityKey(sp: Supporter): string {
  const n = (sp.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const c = (sp.city || '').trim().toLowerCase();
  return n && c ? n + '|' + c : '';
}

/**
 * ת"ז מנורמלת להשוואה — ספרות בלבד; אפסים-בלבד (מציין-מקום נדרים "000000000")
 * וקצרים-מדי (<5 ספרות = מספר-סידורי, לא ת"ז) ⇒ ריק (לא מפתח-שיוך).
 */
export function normId(s?: string): string {
  const d = (s || '').replace(/\D/g, '');
  if (!d || /^0+$/.test(d)) return '';
  // מציין-מקום נדרים מרופד: "000000020"/"000000065" — עוברים את /^0+$/ אך אינם ת"ז.
  // אם אחרי הסרת אפסים-מובילים נשארות <4 ספרות-משמעותיות ⇒ לא מפתח.
  if (d.replace(/^0+/, '').length < 4) return '';
  return d.length >= 5 ? d : '';
}

/**
 * קבוצות כפולי-תורמים — טלפון / אימייל / **ת"ז** / **מזהה-חיצוני (ToremId)** /
 * שם+עיר זהים (Union-Find). ת"ז ומזהה-חיצוני הם מפתחות-שיוך חזקים ⇒ מאפשרים
 * זיהוי-100% גם כששם/טלפון שונים (שדרוג "ללמוד ממשפחות + להתאים לתורמים").
 */
export function findSupporterDupGroups(supporters: Supporter[]): string[][] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r) as string;
    let c = x;
    while (parent.get(c) !== r) {
      const nx = parent.get(c) as string;
      parent.set(c, r);
      c = nx;
    }
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const sp of supporters) parent.set(sp.id, sp.id);
  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  const byId = new Map<string, string>(); // ת"ז
  const byExt = new Map<string, string>(); // מזהה-חיצוני (ToremId)
  const byNameCity = new Map<string, string>();
  const byNameSorted = new Map<string, string>(); // שם חסין-סדר (בלי חובת-עיר)
  const link = (map: Map<string, string>, key: string, id: string) => {
    if (!key) return;
    const prev = map.get(key);
    if (prev) union(prev, id);
    else map.set(key, id);
  };
  for (const sp of supporters) {
    const p = normPhone(sp.phone);
    link(byPhone, p.length >= 7 ? p : '', sp.id);
    link(byEmail, (sp.email || '').trim().toLowerCase(), sp.id);
    link(byId, normId(sp.idNum), sp.id);
    link(byExt, (sp.extId || '').trim(), sp.id);
    link(byNameCity, supNameCityKey(sp), sp.id);
    // מפתח-שם חסין-סדר: תופס כפילות נדרים ("בן צבי רחל"↔"רחל בן צבי") שאין לה עיר/ת"ז.
    // דורש ≥2 מילים (שם-מלא) כדי לא לקבץ שמות-בודדים נפוצים. תוצאה = הצעה לסקירה-ידנית.
    const ns = nameSortKey(sp.name);
    link(byNameSorted, ns.includes(' ') ? ns : '', sp.id);
  }
  const groups = new Map<string, string[]>();
  for (const sp of supporters) {
    const r = find(sp.id);
    (groups.get(r) ?? groups.set(r, []).get(r)!).push(sp.id);
  }
  return [...groups.values()].filter((g) => g.length >= 2);
}

/**
 * מיזוג טהור: כל הכסף (donations+hist, ה-rid נשמר) עובר ל"שומר", הצבירה
 * מחושבת מחדש מהתרומות הממוזגות; שדות-קשר — של השומר, ריק ⇒ של הנמחק;
 * הערות מובחנות מאוחדות; hok/ayin — של השומר אם יש, אחרת של הנמחק.
 */
export function mergeSupporterInto(keep: Supporter, drop: Supporter): Supporter {
  const donations = [...keep.donations, ...drop.donations].sort((a, b) => a.date.localeCompare(b.date));
  // 🐛 (21.8): ההיסטוריה שורשרה כמו-שהיא — אותו חיוב-סליקה שישב על **שני** כרטיסי-
  // הכפילות (ייבוא לשניהם) נספר פעמיים ב-supIls לנצח אחרי המיזוג. mergeHist
  // האידמפוטנטי (מפתח d|a|c, כמות=max) הוא אותו-כלל כמו בייבוא — עסקת-אמת כפולה
  // באותו כרטיס נשמרת, כפל-בין-כרטיסים מתמזג.
  const hist = mergeHist(keep.hist ?? [], drop.hist ?? []);
  // 🐛 (21.8): photos של הנמחק נזרקו בשקט (כל שדה-תוכן אחר ניצל) — איחוד עד
  // תקרת-האפליקציה (PHOTO_MAX), של השומר קודם; nextNote — של השומר גובר, ריק ⇒ של הנמחק.
  const photos = [...new Set([...(keep.photos ?? []), ...(drop.photos ?? [])])].slice(0, PHOTO_MAX);
  const nextNote = keep.nextNote || drop.nextNote;
  // 🐛 נחיל ב׳ (3.9): חיובים-מתוכננים של הנמחק נזרקו בשקט (הבטחות-חיוב, לא קבלות — אך chargePlanned
  // העתידי ותזכורות-הפיגור אבדו). איחוד לפי id, של השומר קודם (ids מ-nextId ייחודיים; דדופ-הגנתי).
  const seenPc = new Set<string>();
  const plannedCharges = [...(keep.plannedCharges ?? []), ...(drop.plannedCharges ?? [])].filter((p) => !seenPc.has(p.id) && !!seenPc.add(p.id));
  const ils = donations.filter((d) => d.cur !== '$').reduce((a, d) => a + d.amount, 0);
  const usd = donations.filter((d) => d.cur === '$').reduce((a, d) => a + d.amount, 0);
  const notes = [keep.notes, drop.notes].map((n) => (n || '').trim()).filter(Boolean);
  return {
    ...keep,
    phone: keep.phone || drop.phone,
    email: keep.email || drop.email,
    address: keep.address || drop.address,
    city: keep.city || drop.city,
    idNum: keep.idNum || drop.idNum,
    cat: keep.cat || drop.cat,
    forWho: keep.forWho || drop.forWho,
    notes: [...new Set(notes)].join(' · '),
    nextDate: keep.nextDate || drop.nextDate,
    ...(nextNote ? { nextNote } : {}),
    nextEventId: keep.nextEventId || undefined,
    donations,
    ...(hist.length ? { hist } : {}),
    ...(photos.length ? { photos } : {}),
    ...(plannedCharges.length ? { plannedCharges } : {}),
    count: donations.length,
    ils,
    usd,
    first: donations[0]?.date ?? keep.first ?? '',
    last: donations[donations.length - 1]?.date ?? keep.last ?? '',
    ...(keep.extId || drop.extId ? { extId: keep.extId || drop.extId } : {}),
    ...(keep.hok || drop.hok ? { hok: keep.hok ?? drop.hok } : {}),
    ...(keep.ayin || drop.ayin ? { ayin: keep.ayin ?? drop.ayin } : {}),
  };
}

/**
 * מיזוג-קבוצה אטומי (פאריטי עם `mergeFamilies`): מקפל את `mergeSupporterInto`
 * מעל כל ה-losers, כך שקבוצה של 3+ ממוזגת בקריאה אחת ללא איבוד-כסף (הצבירה
 * מחושבת-מחדש בכל שכבה). טהור — לא משנה קלט.
 */
export function mergeSupportersGroup(keeper: Supporter, losers: Supporter[]): Supporter {
  return losers.reduce((acc, l) => mergeSupporterInto(acc, l), keeper);
}

/* ── מיזוג שדה-שדה לתורמים (למידה מ-`mergeFamiliesByFields` של המשפחות) ─────────
 * המשתמש בוחר פר-שדה מאיזו רשומה לקחת (pick) או עורך ידנית (edit). **הכסף
 * לעולם לא נבחר-ידנית** — התרומות/hist/הצבירה ממוזגים בסמנטיקה הבטוחה של
 * mergeSupportersGroup; רק שדות-הקשר הסקלריים נבחרים. */

export interface SupDupFieldDef {
  key: string;
  label: string;
  get: (sp: Supporter) => string;
}

/** שדות-המיזוג הנבחרים של תומך (סקלריים בלבד — בלי כסף). */
export const SUP_DUP_FIELDS: SupDupFieldDef[] = [
  { key: 'name', label: 'שם', get: (s) => s.name || '' },
  { key: 'phone', label: 'טלפון', get: (s) => s.phone || '' },
  { key: 'email', label: 'אימייל', get: (s) => s.email || '' },
  { key: 'idNum', label: 'ת"ז', get: (s) => s.idNum || '' },
  { key: 'city', label: 'עיר', get: (s) => s.city || '' },
  { key: 'address', label: 'כתובת', get: (s) => s.address || '' },
  { key: 'cat', label: 'קטגוריה', get: (s) => s.cat || '' },
  { key: 'forWho', label: 'ייעוד', get: (s) => s.forWho || '' },
  { key: 'notes', label: 'הערות', get: (s) => s.notes || '' },
];

/** ערך-שדה נבחר: edit גובר; אחרת pick; אחרת הרשומה הראשונה עם ערך. */
export function supDupFieldValue(
  sups: Supporter[],
  def: SupDupFieldDef,
  pick: Record<string, number>,
  edit: Record<string, string>,
): string {
  const edited = edit[def.key];
  if (edited != null) return edited;
  const idx = pick[def.key] ?? sups.findIndex((s) => def.get(s));
  return def.get(sups[idx >= 0 ? idx : 0]);
}

/** מיזוג קבוצת-תורמים לפי בחירת-שדות — טהור; sups[0] בסיס-השומר (כל הכסף נשמר). */
export function mergeSupportersByFields(
  sups: Supporter[],
  pick: Record<string, number>,
  edit: Record<string, string>,
): Supporter {
  const base = mergeSupportersGroup(sups[0], sups.slice(1));
  const out: Supporter = { ...base };
  for (const def of SUP_DUP_FIELDS) {
    const val = supDupFieldValue(sups, def, pick, edit);
    switch (def.key) {
      case 'name': out.name = val; break;
      case 'phone': out.phone = val; break;
      case 'email': out.email = val; break;
      case 'idNum': out.idNum = val; break;
      case 'city': out.city = val; break;
      case 'address': out.address = val; break;
      case 'cat': out.cat = val; break;
      case 'forWho': out.forWho = val; break;
      case 'notes': out.notes = val; break;
    }
  }
  return out;
}
