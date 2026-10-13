/**
 * ratchet — 📞 הקו ביט-זהה בלי אירוח (BUILD-ORDER-SWITCHBOARD-2026-10-13, חיבור ג׳).
 *
 * הזהב נוצר מהקוד **שלפני** ענף-המרכזייה (phoneLine.ts של c0296f6, לפני שנוסף לו הקלט `switchboard`) ונשמר כגיבוב
 * sha256 לכל רגע-מבחן: העץ המלא (JSON — כל צומת, נוסח, מקש ופעולה) + תסריט-הקריינות + פתרונות קוד-חיוג ודיבור.
 * כל שינוי בנוסח/בסדר/במקש של הקו בלי אירוח ⇒ אדום, עם רשימת הצמתים שזזו.
 *
 * רענון מכוון בלבד (שינוי-קו שהוכרע): ‎UPDATE_GOLDEN=1 npx vitest run phoneLine-golden‎ — וזה מופיע ב-diff של הקומיט.
 */
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPhoneMenu, phoneScriptText, resolveDialCode, resolveSpeech, walkPhone, type PhoneMenu, type PhoneMenuInput } from '../phoneLine';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { PrListing, PrPost } from '../../../types/domain';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'phoneLine.golden.json');

/** epoch של שעה מקומית בישראל בשעון-קיץ (IDT = UTC+3) — אוקטובר 2026 לפני 25.10. */
const idt = (y: number, mo: number, d: number, h: number, mi = 0): number => Date.UTC(y, mo - 1, d, h - 3, mi);

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'x', source: 'owner', name: '', title: '', category: 'other', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'approved', dialCode: '', featuredUntil: '', recs: [],
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
function P(over: Partial<PrPost>): PrPost {
  return {
    id: 'pp', kind: 'notice', title: 'הודעה', text: '', place: '', phone: '', noticeKind: '', prayers: [], days: [],
    date: '', time: '', until: '', approved: true, pinned: false,
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}

const WEEK = [0, 1, 2, 3, 4].map((dow) => ({ dow, from: '08:00', to: '19:00' }));
/** מדריך עשיר: שערים רבים, שעות, תמיד, חירום, הדגשה, ממתין/נדחה (לא נקראים), קוד כפול (לא נענה), רשומת-גבאי. */
const GOLDEN_LISTINGS: PrListing[] = [
  L({ id: 'b101', dialCode: '101', name: 'אינסטלציה זילברמן', title: 'נזילות, סתימות ודודים', category: 'elec', area: 'גוש דן', phone: '050-0000101', whatsapp: '050-0000101', hours: WEEK }),
  L({ id: 'b102', dialCode: '102', name: 'חשמל אור הגנוז', title: 'חשמלאי מוסמך, לוחות וקצרים', category: 'elec', area: 'ירושלים והסביבה', phone: '050-0000102', always: true, emergency: true }),
  L({ id: 'b103', dialCode: '103', name: 'מיזוג קרליבך', title: 'התקנה וניקוי מזגנים', category: 'elec', area: 'ירושלים', phone: '02-6000103', featuredUntil: '2026-12-31' }),
  L({ id: 'b104', dialCode: '104', name: 'סת״ם רבינוביץ', title: 'ספרי תורה, תפילין ומזוזות', category: 'stam', area: 'ירושלים', phone: '050-0000104', source: 'gabbai', kashrut: 'בד״ץ' }),
  L({ id: 'b105', dialCode: '105', name: 'הובלות ירושלים', title: 'הובלת דירות ומשרדים', category: 'car', area: 'ירושלים והסביבה', phone: '050-0000105', disc: true }),
  L({ id: 'b106', dialCode: '106', name: 'הרב קליין', title: 'מלמד ושיעורי גמרא', category: 'edu', area: 'ירושלים', phone: '050-0000106', aud: 'men' }),
  L({ id: 'b107', dialCode: '107', name: 'קייטרינג הדר', title: 'שמחות וקידושים', category: 'events', area: 'בני ברק', phone: '050-0000107', free: true }),
  L({ id: 'b109', dialCode: '109', name: 'שיפוצי בן דוד', title: 'שיפוצים, טיח וריצוף', category: 'build', area: 'בית שמש', phone: '050-0000109', hours: [{ dow: 0, from: '22:00', to: '02:00' }] }),
  L({ id: 'b110', dialCode: '110', name: 'מאפיית אבי', title: 'חלות ועוגות לשבת', category: 'food', area: 'בית שמש', phone: '' }),
  L({ id: 'b111', dialCode: '111', name: 'ניקיון ברק', title: 'ניקיון דירות ומשרדים', category: 'home', area: 'אשדוד', phone: '050-0000111' }),
  L({ id: 'b112', dialCode: '111', name: 'גינון עדן', title: 'גינון, השקיה וגיזום', category: 'home', area: 'גוש עציון', phone: '050-0000112' }),
  L({ id: 'b113', dialCode: '', name: 'רו״ח גולד', title: 'רואה חשבון, החזרי מס', category: 'fin', area: 'בני ברק', phone: '03-5000113' }),
  L({ id: 'b120', dialCode: '120', name: 'ממתין לאישור', title: 'אינסטלטור', category: 'elec', phone: '050-0000120', status: 'pending' }),
  L({ id: 'b121', dialCode: '121', name: 'נדחה', title: 'אינסטלטור', category: 'elec', phone: '050-0000121', status: 'rejected' }),
];
const GOLDEN_POSTS: PrPost[] = [
  P({ id: 'm1', kind: 'minyan', title: 'בית המדרש הגדול', place: 'רח׳ רבי עקיבא 10', prayers: [{ prayer: 'שחרית', times: ['06:30', '08:00'] }, { prayer: 'מנחה', times: ['sh-15'] }, { prayer: 'מעריב', times: ['tz+0'] }] }),
  P({ id: 'm2', kind: 'minyan', title: 'שטיבלך', place: 'רח׳ חזון איש 3', days: [5, 6], prayers: [{ prayer: 'קבלת שבת', times: ['sh-10'] }] }),
  P({ id: 'n1', kind: 'notice', noticeKind: 'simcha', title: 'מזל טוב למשפחת כהן', text: 'להולדת הבת', pinned: true }),
  P({ id: 'n2', kind: 'event', title: 'שיעור בפרשת השבוע', place: 'בית המדרש', date: '2026-10-15', time: '20:30' }),
  P({ id: 'n3', kind: 'notice', noticeKind: 'lost', title: 'נמצא ארנק', text: 'פרטים בטלפון 050-1234567', approved: false }),
];

const PREFS = { communityName: 'קהילת חסידי בעלזא' };
const MOMENTS: ReadonlyArray<readonly [string, number]> = [
  ['thu-13', idt(2026, 10, 15, 13)], // חמישי, יום חול
  ['thu-1830', idt(2026, 10, 15, 18, 30)], // אחרי השקיעה — התאריך העברי מתחלף
  ['fri-18', idt(2026, 10, 16, 18)], // אחרי הדלקת-הנרות — הקו סגור
  ['sat-10', idt(2026, 10, 17, 10)], // שבת בבוקר — סגור
  ['sun-0730', idt(2026, 10, 18, 7, 30)], // ראשון בבוקר
];

/** קלטי-הזהב: 5 רגעים × מדריך עשיר, + מונחים מותאמים/עמוד-קטן, + מדריך ריק. */
function goldenInputs(): Array<{ name: string; input: PhoneMenuInput }> {
  const out: Array<{ name: string; input: PhoneMenuInput }> = [];
  for (const [name, nowMs] of MOMENTS) out.push({ name, input: { listings: GOLDEN_LISTINGS, posts: GOLDEN_POSTS, prefs: PREFS, nowMs } });
  out.push({
    name: 'terms-page2',
    input: {
      listings: GOLDEN_LISTINGS,
      posts: GOLDEN_POSTS,
      prefs: null,
      nowMs: idt(2026, 10, 14, 11),
      config: { ...DEFAULT_CONFIG, terms: { 'nav.parnasa': 'מדריך השכונה', 'entity.prListing': 'בעל מקצוע', 'entity.prListings': 'בעלי מקצוע' } },
      listingsPerPage: 2,
    },
  });
  out.push({ name: 'empty', input: { listings: [], posts: [], prefs: {}, nowMs: idt(2026, 10, 14, 11) } });
  return out;
}

/** הסדרה המלאה של מה שהקו "הוא": העץ, התסריט, הליכות, קודים ודיבור. */
function serializeLine(menu: PhoneMenu, input: PhoneMenuInput): string {
  const loc = resolveZmanimLoc(input.prefs?.zmanim);
  const clock = clockAt(input.nowMs, loc.tz);
  const ctx = { todayIso: clock.iso, clock, closureAt: makeClosureFn(loc) };
  const walks = ['1', '11', '111', '2', '3', '39', '4', '41', '411', '*', '*101', '*111', '*999', '0', '9', '5', '51'].map((k) => k + '⇒' + walkPhone(menu, k).map((n) => n.id).join('>'));
  const codes = ['101', '104', '111', '120', '999', '12'].map((c) => JSON.stringify(resolveDialCode(menu, c)));
  const speech = ['יש לי נזילה בכיור', 'אינסטלטור', 'רואה חשבון', 'קוד 104', 'צריך הובלה ל-3 חדרים', ''].map((u) =>
    JSON.stringify(resolveSpeech(menu, 'main', u, input.listings, ctx)),
  );
  return [JSON.stringify(menu), phoneScriptText(menu), ...walks, ...codes, ...speech].join('\n§\n');
}

const sha = (s: string): string => createHash('sha256').update(s).digest('hex');

interface GoldenEntry {
  sha: string;
  nodes: string[];
  root: string;
}

/** הזהב השמור (נכתב פעם אחת, במכוון, מהקוד שלפני השינוי). */
function readGolden(): Record<string, GoldenEntry> {
  return JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, GoldenEntry>;
}

describe('📞 זהב — הקו בלי אירוח ביט-זהה לקוד שלפני המרכזייה', () => {
  const cases = goldenInputs();

  if (process.env.UPDATE_GOLDEN === '1') {
    it('רענון-זהב מכוון (UPDATE_GOLDEN=1)', () => {
      const out: Record<string, GoldenEntry> = {};
      for (const c of cases) {
        const menu = buildPhoneMenu(c.input);
        out[c.name] = { sha: sha(serializeLine(menu, c.input)), nodes: Object.keys(menu.nodes), root: menu.root };
      }
      mkdirSync(dirname(FIXTURE), { recursive: true });
      writeFileSync(FIXTURE, JSON.stringify(out, null, 1) + '\n');
      expect(Object.keys(out).length).toBe(cases.length);
    });
    return;
  }

  it('קובץ-הזהב קיים ומכסה את כל הרגעים (חול · אחרי שקיעה · ערב-שבת · שבת · ראשון · מונחים · ריק)', () => {
    expect(existsSync(FIXTURE)).toBe(true);
    expect(Object.keys(readGolden()).sort()).toEqual(cases.map((c) => c.name).sort());
  });

  for (const c of cases) {
    it('ביט-זהה: ' + c.name, () => {
      const g = readGolden()[c.name];
      const menu = buildPhoneMenu(c.input);
      expect(menu.root, 'השורש').toBe(g.root);
      expect(Object.keys(menu.nodes), 'רשימת-הצמתים ובסדרה').toEqual(g.nodes);
      expect(sha(serializeLine(menu, c.input)), 'העץ + התסריט + הליכות + קודים + דיבור').toBe(g.sha);
    });
  }
});
