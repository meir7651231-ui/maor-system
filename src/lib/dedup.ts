/**
 * זיהוי כפילויות משפחות ומיזוגן — פונקציות טהורות (בלי store/DOM), נבדקות
 * ביחידה. עקרון-בטיחות: המיזוג משמר את כל הנתונים — בני-משפחה, מסמכים ותיעוד —
 * ולעולם אינו מוחק רשומה כספית. בני-המשפחה עוברים אל ה"שומר" עם אותו מזהה, כך
 * שהשיבוצים/התשלומים שלהם נשארים תקינים (ה-store רק ממזג ומפנה אירועים, בלי
 * מפל-המחיקה של deleteFamily).
 */
import type { Family, Member, FamilyDoc } from '../types/domain';

/** ספרות בלבד, נרמול קידומת ישראלית (972→0) — להשוואת טלפונים. */
export function normPhone(s: string): string {
  const d = (s || '').replace(/\D/g, '');
  return d.replace(/^972/, '0');
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
