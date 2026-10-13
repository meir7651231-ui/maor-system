/**
 * ratchet — 📞 מודל הקו של פרנסה׳לע (אשכול 6, phoneLine.ts — טהור, ניטרלי-ספק). כל "עכשיו" מוזרק
 * (epoch). העסקים לדוגמה = 12 עסקי-הדמו של קו-הטלפון במקור (נספח A21, קודים 101–112).
 *
 * ננעל:
 *   · שורש: ברכה עם שם-הקהילה, מקשים קבועים (1 עסקים "או אמרו" · 2 זמנים · 3 הודעות · 4 חירום ·
 *     כוכבית קוד · 0 שמיעה חוזרת); צומת-דיבור תמיד מקבל גם מקשים (זיהוי-דיבור מחטיא ~16%).
 *   · עימוד 1–8 / 9 עוד / 0 חזרה; עסקים 4 בעמוד (כמו המקור); שורה = שם · אזור · פתוח/סגור.
 *   · 🛡 רק מאושרים — ממתין/נדחה לעולם לא נקראים (גם לא בקוד ובדיבור); רשומת-גבאי מאושרת — כן.
 *   · 🛡 אין פעולה בלי אישור: חיבור רק ממקש 1 של צומת-אישור; דיבור/קוד ⇒ צומת-אישור, לא פעולה.
 *   · קוד-חיוג: ידוע · לא-ידוע · לא בן 3 · כפול (fail-closed) · מתחיל ב-0.
 *   · 🛡 דיבור: התחום שהובן בוודאות קובע ("רואה חשבון" לא "מוצא" מלמד-חשבון; שגיאת-כתיב "המספר"≈"מסגר"
 *     לא פוסלת טלפון שלם); מספר בתוך משפט אינו קוד ואינו שבר-טלפון; ההד מושחר מטלפון.
 *   · כל 21 השמירות הוכחו במוטציה (הסרת-התיקון ⇒ אדום) לפני ה-commit.
 *   · זמנים: חול · בשבת — השבת **הנוכחית** · אחרי השקיעה — התאריך העברי מתחלף (וזמני היום הבא).
 *   · שבת/יו״ט ⇒ השורש = הודעת-סגירה, אין מסלול לחיבור (המקור: עונה בברכת שבת ומנתק).
 *   · מצבים-ריקים · תקרות · ניקוי-הקראה · פרטיות · דטרמיניזם (גם מול TZ) · הגנת-מקור.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPhoneMenu,
  nodeSpeech,
  PHONE_PROMPT_MAX,
  PHONE_SAY_MAX,
  phonePrompt,
  phoneScriptText,
  phoneStep,
  phoneTel,
  resolveDialCode,
  resolveSpeech,
  speakDigits,
  telGroups,
  walkPhone,
  type PhoneMenu,
  type PhoneMenuInput,
  type PhoneNode,
} from '../phoneLine';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import type { PrSearchCtx } from '../lib';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { PrListing, PrPost } from '../../../types/domain';
import phoneSrc from '../phoneLine.ts?raw';

/** epoch של שעה מקומית בישראל בשעון-קיץ (IDT = UTC+3) — ספטמבר/אוקטובר 2026 לפני 25.10. */
const idt = (y: number, mo: number, d: number, h: number, mi = 0): number => Date.UTC(y, mo - 1, d, h - 3, mi);
const THU_13 = idt(2026, 10, 15, 13); // חמישי ד׳ חשוון
const THU_1830 = idt(2026, 10, 15, 18, 30); // אחרי השקיעה (18:09)
const FRI_18 = idt(2026, 10, 16, 18); // אחרי הדלקת-הנרות (17:46), לפני השקיעה
const SAT_10 = idt(2026, 10, 17, 10); // שבת בבוקר
const LOC = resolveZmanimLoc();
const ctxAt = (ms: number): PrSearchCtx => {
  const clock = clockAt(ms);
  return { todayIso: clock.iso, clock, closureAt: makeClosureFn(LOC) };
};

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

// נספח A21 — עסקי-הדמו של קו-הטלפון במקור: קוד · שם · מקצוע · שער · אזור
const BIZ: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ['101', 'אינסטלציה זילברמן', 'נזילות, סתימות ודודים', 'elec', 'גוש דן'],
  ['102', 'חשמל אור הגנוז', 'חשמלאי מוסמך, לוחות וקצרים', 'elec', 'ירושלים והסביבה'],
  ['103', 'מיזוג קרליבך', 'התקנה וניקוי מזגנים', 'elec', 'ירושלים'],
  ['104', 'סת״ם רבינוביץ', 'ספרי תורה, תפילין ומזוזות', 'stam', 'ירושלים'],
  ['105', 'הובלות ירושלים', 'הובלת דירות ומשרדים', 'car', 'ירושלים והסביבה'],
  ['106', 'הרב קליין', 'מלמד ושיעורי גמרא', 'edu', 'ירושלים'],
  ['107', 'קייטרינג הדר', 'שמחות וקידושים', 'events', 'בני ברק'],
  ['108', 'צילום שמחה', 'צלם חתונות ושמחות', 'events', 'ירושלים'],
  ['109', 'שיפוצי בן דוד', 'שיפוצים, טיח וריצוף', 'build', 'בית שמש'],
  ['110', 'מאפיית אבי', 'חלות ועוגות לשבת', 'food', 'בית שמש'],
  ['111', 'ניקיון ברק', 'ניקיון דירות ומשרדים', 'home', 'אשדוד'],
  ['112', 'גינון עדן', 'גינון, השקיה וגיזום', 'home', 'גוש עציון'],
];
/** האינסטלטור פתוח א׳–ה׳ 08:00–19:00; הסופר הוזן ע"י הגבאי (טלפון כשר) — מאושר. */
const DEMO: PrListing[] = BIZ.map(([code, name, title, category, area]) =>
  L({
    id: 'b' + code, dialCode: code, name, title, category, area, phone: '050-0000' + code,
    source: code === '104' ? 'gabbai' : 'owner',
    hours: code === '101' ? [0, 1, 2, 3, 4].map((dow) => ({ dow, from: '08:00', to: '19:00' })) : [],
  }),
);
const MINYAN = P({ id: 'm1', kind: 'minyan', title: 'בית המדרש הגדול', prayers: [{ prayer: 'מנחה', times: ['sh-15'] }] });

const input = (over: Partial<PhoneMenuInput> = {}): PhoneMenuInput => ({
  listings: DEMO, posts: [], prefs: { communityName: 'קהילת חסידי בעלזא' }, nowMs: THU_13, ...over,
});
const MENU = buildPhoneMenu(input());
const ids = (nodes: readonly PhoneNode[]): string[] => nodes.map((n) => n.id);
const keysOf = (n: PhoneNode): string[] => n.options.map((o) => o.digit);
const last = (menu: PhoneMenu, keys: string): PhoneNode => walkPhone(menu, keys).slice(-1)[0];
const everything = (menu: PhoneMenu): string => JSON.stringify(menu) + phoneScriptText(menu);

describe('☎️ השורש — התפריט הראשי', () => {
  it('ברכה עם שם-הקהילה; מקשים קבועים 1·2·3·4·כוכבית·0; 1 = עסקים "או אמרו מה אתם צריכים"; 0 = שמיעה חוזרת', () => {
    expect(MENU).toMatchObject({ root: 'main', closed: false, asOf: '2026-10-15 13:00', brand: 'פרנסה׳לע של קהילת חסידי בעלזא' });
    const main = MENU.nodes.main;
    expect(main).toMatchObject({ kind: 'menu', speech: true, prompt: 'שלום וברוכים הבאים לקו של פרנסה׳לע של קהילת חסידי בעלזא.' });
    expect(keysOf(main)).toEqual(['1', '2', '3', '4', '*', '0']);
    expect(main.options.map((o) => o.to)).toEqual(['cats/1', 'zmanim', 'notices/1', 'emergency/1', 'code', 'main']);
    expect(main.options[0].say).toBe('לעסקים הקישו 1 — או פשוט אמרו מה אתם צריכים');
    expect(ids(walkPhone(MENU, '0'))).toEqual(['main', 'main']);
    expect(ids(walkPhone(MENU, '7'))).toEqual(['main', 'main']); // מקש לא-חוקי ⇒ הקו חוזר על התפריט
  });
  it('בלי שם-קהילה ⇒ ברכה כללית; שם-הקו ומונחי-העסקים מהארגון (termOf)', () => {
    expect(buildPhoneMenu(input({ prefs: null })).nodes.main.prompt).toBe('שלום וברוכים הבאים לקו של פרנסה׳לע, מדריך בעלי המקצוע של הקהילה.');
    const config = { ...DEFAULT_CONFIG, terms: { 'nav.parnasa': 'מדריך השכונה', 'entity.prListings': 'בעלי מקצוע' } };
    const m = buildPhoneMenu(input({ config }));
    expect(m.nodes.main.prompt).toBe('שלום וברוכים הבאים לקו של מדריך השכונה של קהילת חסידי בעלזא.');
    expect(m.nodes['cats/1'].prompt).toContain('במדריך 12 בעלי מקצוע ב־8 תחומים.');
  });
  it('🛡 כל צומת-דיבור מקבל גם מקשים ואומר "אמרו … הקישו"', () => {
    const speech = Object.values(MENU.nodes).filter((n) => n.speech);
    expect(ids(speech)).toEqual(['main', 'cats/1']);
    for (const n of speech) {
      expect(n.options.some((o) => /^[1-8]$/.test(o.digit))).toBe(true);
      expect(nodeSpeech(n)).toMatch(/אמרו/);
      expect(nodeSpeech(n)).toMatch(/הקישו/);
    }
  });
});

describe('📑 עימוד — 1–8, 9 עוד, 0 חזרה', () => {
  const extra = [
    L({ id: 'f1', name: 'רו״ח גולד', title: 'רואה חשבון, החזרי מס', category: 'fin', phone: '050-0000201' }),
    L({ id: 't1', name: 'מחשבים פלוס', title: 'תיקון מחשבים', category: 'tech', phone: '050-0000202' }),
  ];
  const moreElec = ['אור', 'ברק', 'גל'].map((n, i) => L({ id: 'x' + i, name: 'חשמל ' + n, title: 'חשמלאי', category: 'elec', phone: '050-000030' + i }));
  const big = buildPhoneMenu(input({ listings: [...DEMO, ...extra, ...moreElec] }));

  it('10 תחומים ⇒ עמוד 1: שמונה + 9 + 0 (לתפריט) · עמוד 2: השניים הנותרים + 0 (לעמוד הקודם)', () => {
    expect(keysOf(big.nodes['cats/1'])).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    expect(big.nodes['cats/1'].options.slice(-2).map((o) => o.to)).toEqual(['cats/2', 'main']);
    expect(big.nodes['cats/2'].options.map((o) => o.digit + '→' + o.to)).toEqual(['1→cat/home/1', '2→cat/food/1', '0→cats/1']);
    expect(ids(walkPhone(big, '19'))).toEqual(['main', 'cats/1', 'cats/2']);
    expect(ids(walkPhone(big, '1900'))).toEqual(['main', 'cats/1', 'cats/2', 'cats/1', 'main']);
    // חזרה מתחום שבעמוד 2 — לעמוד 2 של התחומים
    expect(big.nodes['cat/home/1'].options.slice(-1)[0].to).toBe('cats/2');
    expect(big.nodes['cats/2'].prompt).toContain('עמוד 2 מתוך 2');
  });
  it('עסקים 4 בכל פעם (כמו המקור): 6 בתחום ⇒ 4 + 9 + 0 · 2 + 0; ניתן לשינוי 1–8', () => {
    const p1 = big.nodes['cat/elec/1'];
    const p2 = big.nodes['cat/elec/2'];
    expect(keysOf(p1)).toEqual(['1', '2', '3', '4', '9', '0']);
    expect(keysOf(p2)).toEqual(['1', '2', '0']);
    expect(p2.options.slice(-1)[0].to).toBe('cat/elec/1');
    const targets = [...p1.options, ...p2.options].map((o) => o.to).filter((t) => t.startsWith('biz/'));
    expect(new Set(targets).size).toBe(6);
    expect(big.nodes[p2.options[0].to].options.slice(-1)[0].to).toBe('cat/elec/2'); // חזרה לעמוד שממנו הגיעו
    expect(keysOf(buildPhoneMenu(input({ listings: [...DEMO, ...moreElec], listingsPerPage: 8 })).nodes['cat/elec/1'])).toEqual(['1', '2', '3', '4', '5', '6', '0']);
    expect(keysOf(buildPhoneMenu(input({ listings: [...DEMO, ...moreElec], listingsPerPage: 99 })).nodes['cat/elec/1'])).toHaveLength(7); // ≤8 ⇒ 6 + 0
    expect(keysOf(buildPhoneMenu(input({ listingsPerPage: 0 })).nodes['cat/elec/1'])).toEqual(['1', '9', '0']); // מינימום 1
  });
  it('שורת-עסק: שם · אזור · פתוח/סגור עכשיו (שעון-הקהילה); בלי שעות — בלי מצב', () => {
    const says = (m: PhoneMenu): string[] => m.nodes['cat/elec/1'].options.map((o) => o.say);
    expect(says(MENU)).toEqual([
      'אינסטלציה זילברמן, גוש דן, פנוי עכשיו — הקישו 1',
      'חשמל אור הגנוז, ירושלים והסביבה — הקישו 2',
      'מיזוג קרליבך, ירושלים — הקישו 3',
      'לחזרה לרשימת התחומים הקישו 0',
    ]);
    expect(says(buildPhoneMenu(input({ nowMs: idt(2026, 10, 15, 20) })))[0]).toBe('אינסטלציה זילברמן, גוש דן, סגור עכשיו — הקישו 1');
    expect(MENU.nodes['cats/1'].options[1].say).toBe('חשמל, אינסטלציה ומיזוג (3 עסקים) — הקישו 2');
  });
});

describe('🛡 רק עסקים מאושרים', () => {
  const pending = L({ id: 'q1', name: 'ניקיון ממתין לגבאי', title: 'ניקיון', category: 'home', status: 'pending', dialCode: '120', phone: '050-0000120' });
  const rejected = L({ id: 'q2', name: 'עסק שנדחה', title: 'ניקיון', category: 'home', status: 'rejected', dialCode: '121', phone: '050-0000121' });
  const listings = [...DEMO, pending, rejected];
  const menu = buildPhoneMenu(input({ listings }));

  it('ממתין/נדחה לעולם לא נקראים — לא בעץ, לא בתסריט, לא בקוד-חיוג ולא בדיבור', () => {
    const all = everything(menu);
    for (const s of ['ניקיון ממתין לגבאי', 'עסק שנדחה', '0500000120', '0500000121', 'biz/q1', 'biz/q2']) expect(all).not.toContain(s);
    expect(resolveDialCode(menu, '120').found).toBe(false);
    expect(resolveDialCode(menu, '121').found).toBe(false);
    for (const utter of ['ניקיון ממתין לגבאי', 'עסק שנדחה']) {
      const r = resolveSpeech(menu, 'main', utter, listings, ctxAt(THU_13));
      expect(['biz/q1', 'biz/q2']).not.toContain(r.target);
    }
    expect(menu.nodes['cat/home/1'].options.filter((o) => o.to.startsWith('biz/'))).toHaveLength(2);
  });
  it('רשומת-גבאי מאושרת (טלפון כשר, בלי אינטרנט) — כן נקראת ונענית בקוד', () => {
    expect(menu.codes['104']).toBe('biz/b104');
    expect(menu.nodes['biz/b104'].prompt).toContain('סת״ם רבינוביץ');
    expect(Object.keys(menu.codes)).toEqual(['101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112']);
  });
  it('🛡 פרטיות: הערה-פנימית, המלצות, מחירון וחותמת-המאשר לא נקראים; בקשות-תושבים לא נכנסות גם אם הועברו', () => {
    const secretive = L({
      id: 's9', name: 'גינון השקט', title: 'גינון', category: 'home', phone: '050-0000199',
      notes: 'סוד פנימי של הגבאי', recs: [{ by: 'ממליץ פרטי', text: 'מעולה', at: '2026-10-01T00:00:00.000Z' }],
      services: [{ name: 'גיזום', price: '150', note: 'מחיר סודי' }], reviewedBy: 'gabbai@example.org', desc: 'תיאור פרטי ארוך',
    });
    const leaky = {
      ...input({ listings: [...DEMO, secretive], posts: [P({ id: 'n1', title: 'גמ״ח כלים', phone: '052-9999999' })] }),
      prRequests: [{ id: 'r1', text: 'בקשה שקטה ורגישה', requester: { name: 'רחל לוי', phone: '052-7654321' } }],
    };
    const all = everything(buildPhoneMenu(leaky));
    for (const s of ['סוד פנימי', 'ממליץ פרטי', 'מחיר סודי', 'gabbai@', 'תיאור פרטי', 'רחל', '7654321', 'בקשה שקטה', '9999999']) {
      expect(all, s).not.toContain(s);
    }
    expect(all).toContain('גמ״ח כלים'); // המודעה עצמה — כן (בלי הטלפון שבה)
  });
});

describe('☎️ קוד-חיוג מהחוברת (כוכבית + 3 ספרות)', () => {
  it('כוכבית 101 ⇒ צומת-אישור עם שם-העסק (בלי פעולה); 1 ⇒ כרטיס-העסק, שם עוד אישור לפני חיבור', () => {
    const walk = walkPhone(MENU, '*101');
    expect(ids(walk)).toEqual(['main', 'code', 'confirm/code/101']);
    expect(walk[1]).toMatchObject({ kind: 'input', collect: 3 });
    expect(walk[2]).toMatchObject({ kind: 'confirm', prompt: 'הקשתם אחת אפס אחת: אינסטלציה זילברמן.' });
    expect(walk[2].action).toBeUndefined();
    expect(last(MENU, '*1011')).toMatchObject({ id: 'biz/b101', kind: 'listing' });
    expect(last(MENU, '*1011').action).toBeUndefined();
    expect(resolveDialCode(MENU, '101')).toMatchObject({ found: true, target: 'biz/b101' });
    expect(MENU.nodes['biz/b101'].prompt).toContain('הקוד בקו: אחת אפס אחת.');
  });
  it('קוד לא-ידוע / לא בן 3 ⇒ "לא נמצא" עם הקשה-מחדש; כוכבית באמצע = ביטול', () => {
    const r = resolveDialCode(MENU, '999');
    expect(r).toMatchObject({ found: false, target: '' });
    expect(r.confirm.prompt).toBe('הקוד תשע תשע תשע לא נמצא במדריך.');
    expect(r.confirm.options.map((o) => o.digit + '→' + o.to)).toEqual(['2→code', '0→main']);
    for (const bad of ['12', '', 'abc', '1234']) expect(resolveDialCode(MENU, bad).confirm.prompt).toBe('הקוד צריך להיות בן שלוש ספרות.');
    expect(ids(walkPhone(MENU, '*9992'))).toEqual(['main', 'code', 'confirm/code', 'code']);
    expect(ids(walkPhone(MENU, '*1*'))).toEqual(['main', 'code', 'main']);
  });
  it('קוד שמתחיל ב-0 נאסף כרגיל (0 אינו "חזרה" בצומת-ההקשה)', () => {
    const m = buildPhoneMenu(input({ listings: [...DEMO, L({ id: 'z0', name: 'ותיק', category: 'other', dialCode: '050', phone: '03-1234567' })] }));
    expect(last(m, '*050')).toMatchObject({ id: 'confirm/code/050', kind: 'confirm' });
  });
  it('🛡 קוד כפול ⇒ לא נענה (fail-closed — לא מחברים לעסק הלא-נכון) ולא מוכרז בכרטיס', () => {
    const twins = [L({ id: 'd1', name: 'תאום א', category: 'other', dialCode: '150', phone: '050-0000401' }), L({ id: 'd2', name: 'תאום ב', category: 'other', dialCode: '150', phone: '050-0000402' })];
    const m = buildPhoneMenu(input({ listings: [...DEMO, ...twins] }));
    expect(m.codes['150']).toBeUndefined();
    expect(resolveDialCode(m, '150').found).toBe(false);
    expect(m.nodes['biz/d1'].prompt).not.toContain('הקוד בקו');
    expect(m.nodes['biz/d1/call'].action).toMatchObject({ kind: 'connect', tel: '0500000401' });
    expect(m.nodes['biz/d1/call'].action).not.toHaveProperty('dialCode');
  });
});

describe('🗣 דיבור ⇒ צומת-אישור, לעולם לא פעולה', () => {
  const ctx = ctxAt(THU_13);
  it('"יש לי נזילה בכיור" ⇒ "שמעתי: … — אינסטלציה" + העסק; 1 ⇒ הכרטיס (גם הוא בלי פעולה)', () => {
    const r = resolveSpeech(MENU, 'main', 'יש לי נזילה בכיור', DEMO, ctx);
    expect(r).toMatchObject({ found: true, target: 'biz/b101' });
    expect(r.confirm.kind).toBe('confirm');
    expect(r.confirm.action).toBeUndefined();
    expect(r.confirm.prompt).toBe('שמעתי: יש לי נזילה בכיור — אינסטלציה. נמצא: אינסטלציה זילברמן, גוש דן, פנוי עכשיו.');
    expect(r.confirm.options.map((o) => o.digit + '→' + o.to)).toEqual(['1→biz/b101', '2→main']);
    expect(nodeSpeech(r.confirm)).toContain('לאישור הקישו 1');
    expect(MENU.nodes[r.target].action).toBeUndefined();
  });
  it('מצומת-התחומים · קוד שנאמר בקול · שם', () => {
    const r = resolveSpeech(MENU, 'cats/1', 'מלמד לגמרא', DEMO, ctx);
    expect(r.target).toBe('biz/b106');
    expect(r.confirm.options[1].to).toBe('cats/1'); // ניסיון נוסף — באותו צומת
    expect(resolveSpeech(MENU, 'main', 'קוד 104', DEMO, ctx).confirm.prompt).toBe('שמעתי: קוד 104 — סת״ם רבינוביץ.');
    expect(resolveSpeech(MENU, 'main', 'זילברמן', DEMO, ctx).target).toBe('biz/b101');
  });
  it('🛡 מספר בתוך משפט (כתובת/כמות) אינו קוד-חיוג ואינו "שבר-טלפון"; "קוד 1 0 4" וטלפון שלם — כן', () => {
    expect(resolveSpeech(MENU, 'main', 'זה 101 בדיוק', DEMO, ctx).found).toBe(false); // 101 = קוד, וגם בתוך 050-0000101
    expect(resolveSpeech(MENU, 'main', 'קוד 1 0 4', DEMO, ctx).target).toBe('biz/b104');
    expect(resolveSpeech(MENU, 'main', 'המספר 050-0000107', DEMO, ctx).target).toBe('biz/b107');
  });
  it('🛡 התחום שהובן קובע: "רואה חשבון" בלי רו״ח במדריך ⇒ "עדיין אין" — לא מלמד ("חשבון" = גם שיעורי-חשבון)', () => {
    const r = resolveSpeech(MENU, 'main', 'רואה חשבון', DEMO, ctx);
    expect(r.found).toBe(false);
    expect(r.confirm.prompt).toBe('שמעתי: רואה חשבון — חשבונות ומס. עדיין אין בעלי מקצוע בתחום הזה במדריך.');
    const cpa = L({ id: 'f1', name: 'רו״ח גולד', title: 'רואה חשבון, החזרי מס', category: 'fin', phone: '050-0000201' });
    const m = buildPhoneMenu(input({ listings: [...DEMO, cpa] }));
    expect(resolveSpeech(m, 'main', 'רואה חשבון', [...DEMO, cpa], ctx).target).toBe('biz/f1');
  });
  it('לא נשמע · לא נמצא · צומת בלי דיבור / לא קיים ⇒ "לא נמצא" עם ניסיון נוסף ותפריט ראשי', () => {
    expect(resolveSpeech(MENU, 'main', '   ', DEMO, ctx).confirm.prompt).toMatch(/^לא שמענו\./);
    const miss = resolveSpeech(MENU, 'main', 'בלה בלה', DEMO, ctx);
    expect(miss).toMatchObject({ found: false, target: '' });
    expect(miss.confirm.prompt).toBe('שמעתי: בלה בלה. לא מצאנו התאמה במדריך — אפשר לומר במילים אחרות.');
    expect(miss.confirm.options.map((o) => o.digit + '→' + o.to)).toEqual(['2→main', '0→main']);
    expect(resolveSpeech(MENU, 'zmanim', 'נזילה', DEMO, ctx).confirm.prompt).toContain('כאן אפשר רק להקיש');
    expect(resolveSpeech(MENU, 'אין-כזה', 'נזילה', DEMO, ctx).found).toBe(false);
  });
  it('🛡 ההד "שמעתי" מושחר: טלפון שנאמר לא חוזר בקול', () => {
    const r = resolveSpeech(MENU, 'main', 'נזילה, תחזרו אליי ל-052-1234567', DEMO, ctx);
    expect(r.found).toBe(true);
    expect(r.confirm.prompt).not.toMatch(/1234567|052/);
  });
});

describe('👣 phoneStep — צעד אחד (הלב של walkPhone, מיוצא לסימולטור "📞 הקו", 6ב)', () => {
  it('מקש ⇒ הצומת הבא · לא-חוקי ⇒ אותו צומת · צומת-הקשה: ספרה נאספת (moved=false) ⇒ אישור · סופי ⇒ null', () => {
    const main = MENU.nodes.main;
    expect(phoneStep(MENU, { node: main, buf: '' }, '1')).toEqual({ node: MENU.nodes['cats/1'], buf: '', moved: true });
    expect(phoneStep(MENU, { node: main, buf: '' }, '7')).toEqual({ node: main, buf: '', moved: true });
    const code = MENU.nodes.code;
    expect(phoneStep(MENU, { node: code, buf: '' }, '1')).toEqual({ node: code, buf: '1', moved: false });
    expect(phoneStep(MENU, { node: code, buf: '10' }, '1')).toMatchObject({ node: { id: 'confirm/code/101', kind: 'confirm' }, buf: '', moved: true });
    expect(phoneStep(MENU, { node: code, buf: '10' }, '*')).toEqual({ node: main, buf: '', moved: true }); // כוכבית = ביטול
    expect(phoneStep(MENU, { node: MENU.nodes['biz/b101/call'], buf: '' }, '1')).toBeNull();
  });
});

describe('🔒 אישור לפני כל חיבור', () => {
  it('כל צומת-חיבור סופי, ומגיעים אליו רק ממקש 1 של צומת-אישור; אין פעולת-חיבור בשום צומת אחר; העץ שלם', () => {
    const nodes = Object.values(MENU.nodes);
    const parents = new Map<string, PhoneNode[]>();
    for (const n of nodes) for (const o of n.options) parents.set(o.to, [...(parents.get(o.to) ?? []), n]);
    const connects = nodes.filter((n) => n.action?.kind === 'connect');
    expect(connects).toHaveLength(12 + 4); // 12 עסקים + 4 מספרי-חירום
    for (const c of connects) {
      expect(c.kind).toBe('connect');
      expect(c.options).toEqual([]);
      const ps = parents.get(c.id) ?? [];
      expect(ps.length).toBeGreaterThan(0);
      for (const p of ps) {
        expect(p.kind).toBe('confirm');
        expect(p.options.find((o) => o.to === c.id)?.digit).toBe('1');
        expect(p.options.some((o) => o.digit === '2')).toBe(true); // 2 = ביטול
      }
    }
    expect(nodes.filter((n) => n.kind === 'connect').every((n) => n.action?.kind === 'connect')).toBe(true);
    // שלמות: כל יעד קיים, וכל צומת נגיש מהשורש
    for (const n of nodes) for (const o of n.options) expect(MENU.nodes[o.to], n.id + ' → ' + o.to).toBeDefined();
    const seen = new Set<string>(['main']);
    const queue = ['main'];
    while (queue.length) {
      const at = queue.shift() as string;
      for (const o of MENU.nodes[at].options) {
        if (seen.has(o.to)) continue;
        seen.add(o.to);
        queue.push(o.to);
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(MENU.nodes).sort());
  });
  it('הליכה: 1·2·1 ⇒ כרטיס · 1 ⇒ אישור (בלי פעולה) · 1 ⇒ חיבור; 2 ⇒ ביטול וחזרה לכרטיס; אחרי חיבור — הקו לא מקשיב', () => {
    expect(ids(walkPhone(MENU, '121'))).toEqual(['main', 'cats/1', 'cat/elec/1', 'biz/b101']);
    const confirm = last(MENU, '1211');
    expect(confirm).toMatchObject({ id: 'biz/b101/confirm', kind: 'confirm', prompt: 'להתקשר עכשיו אל אינסטלציה זילברמן?' });
    expect(confirm.action).toBeUndefined();
    expect(last(MENU, '12111').action).toEqual({ kind: 'connect', tel: '0500000101', label: 'אינסטלציה זילברמן', listingId: 'b101', dialCode: '101' });
    expect(last(MENU, '12112').id).toBe('biz/b101');
    expect(walkPhone(MENU, '121119999')).toHaveLength(walkPhone(MENU, '12111').length);
  });
  it('חירום: 4 ⇒ מד״א 101 · איחוד הצלה 1221 · משטרה 100 · כיבוי אש 102 ⇒ אישור ⇒ חיבור', () => {
    const em = MENU.nodes['emergency/1'];
    expect(keysOf(em)).toEqual(['1', '2', '3', '4', '0']);
    expect(em.options[0].say).toBe('מד״א, אחת אפס אחת — הקישו 1');
    expect(em.options[1].say).toBe('איחוד הצלה, אחת שתיים שתיים אחת — הקישו 2');
    expect(last(MENU, '41')).toMatchObject({ id: 'em/1/confirm', kind: 'confirm', prompt: 'להתקשר עכשיו אל מד״א, אחת אפס אחת?' });
    expect(last(MENU, '41').action).toBeUndefined();
    expect(last(MENU, '411').action).toEqual({ kind: 'connect', tel: '101', label: 'מד״א' });
    expect(last(MENU, '412').id).toBe('emergency/1');
    // הגבאי עורך: מודעות-חירום מאושרות מחליפות את הרשימה (מנוע-הזמנים, emergencyNumbers)
    const own = buildPhoneMenu(input({ posts: [P({ id: 'x1', kind: 'emergency', title: 'הצלה שכונתי', phone: '052-0000000' })] }));
    expect(keysOf(own.nodes['emergency/1'])).toEqual(['1', '0']);
    expect(last(own, '411').action).toEqual({ kind: 'connect', tel: '0520000000', label: 'הצלה שכונתי' });
  });
  it('כרטיס בלי טלפון ⇒ רק חזרה, ו"אין מספר טלפון במדריך"', () => {
    const m = buildPhoneMenu(input({ listings: [...DEMO, L({ id: 'np', name: 'בלי טלפון', category: 'other' })] }));
    expect(keysOf(m.nodes['biz/np'])).toEqual(['0']);
    expect(m.nodes['biz/np'].prompt).toContain('אין מספר טלפון במדריך.');
    expect(m.nodes['biz/np/call']).toBeUndefined();
  });
});

describe('🔢 המספר ספרה-ספרה', () => {
  it('2 בכרטיס ⇒ "אפס חמש אפס, אפס אפס אפס, אפס אחת אפס אחת" + פעולת readNumber עם הספרות', () => {
    const n = last(MENU, '1212');
    expect(n).toMatchObject({ id: 'biz/b101/number', kind: 'number', prompt: 'מספר הטלפון של אינסטלציה זילברמן: אפס חמש אפס, אפס אפס אפס, אפס אחת אפס אחת.' });
    expect(n.action).toEqual({ kind: 'readNumber', tel: '0500000101', groups: ['050', '000', '0101'] });
    expect(n.options.map((o) => o.digit + '→' + o.to)).toEqual(['1→biz/b101/confirm', '2→biz/b101/number', '0→biz/b101']);
  });
  it('קווי 2-3-4 · קצר כמות-שהוא · + ⇒ "פלוס" · קצר/ארוך-מדי או בלי ספרות ⇒ ריק', () => {
    expect(speakDigits('03-1234567')).toBe('אפס שלוש, אחת שתיים שלוש, ארבע חמש שש שבע');
    expect(telGroups('031234567')).toEqual(['03', '123', '4567']);
    expect(speakDigits('1221')).toBe('אחת שתיים שתיים אחת');
    expect(phoneTel('+972-50-123-4567')).toBe('+972501234567');
    expect(speakDigits('+972501234567')).toMatch(/^פלוס תשע שבע שתיים/);
    expect(phoneTel('12')).toBe('');
    expect(phoneTel('1'.repeat(16))).toBe('');
    expect(phoneTel('טלפון')).toBe('');
    expect(phoneTel(' 050-0000101 ')).toBe('0500000101');
  });
});

describe('🕰 זמני היום (2) — שעון ישראל, דרך מנוע-הזמנים', () => {
  it('יום חול (חמישי 13:00): תאריך עברי · אופק · הזמנים · השבת הקרובה · המניין הבא · הערת-אמון', () => {
    const z = buildPhoneMenu(input({ posts: [MINYAN] })).nodes.zmanim;
    for (const s of [
      'היום יום חמישי, ד׳ חשוון תשפ״ז.',
      'הזמנים לפי אופק בני ברק.',
      'נץ החמה 06:44.',
      'סוף זמן קריאת שמע לפי המגן אברהם 08:59.',
      'סוף זמן קריאת שמע לפי הגר״א 09:35.',
      'שקיעה 18:09.',
      'צאת הכוכבים 18:49.',
      'השבת הקרובה, ו׳ חשוון תשפ״ז: הדלקת נרות בערב שבת 17:46, צאת השבת 18:47, רבנו תם 19:19.',
      'המניין הבא: מנחה בשעה 17:54, בית המדרש הגדול.',
      'לשאלות הלכה יש לפנות לרב הקהילה.',
    ]) expect(z.prompt).toContain(s);
    expect(z.prompt).not.toContain('ק״ש'); // קיצורים נפתחים להקראה
    expect(keysOf(z)).toEqual(['1', '0']);
    expect(z.prompt.length).toBeLessThanOrEqual(PHONE_PROMPT_MAX);
  });
  it('🛡 בשבת — השבת **הנוכחית** (לא הבאה); והקו סגור: השורש = "שבת שלום", אין מסלול לחיבור', () => {
    const m = buildPhoneMenu(input({ nowMs: SAT_10 }));
    expect(m).toMatchObject({ root: 'closed', closed: true });
    expect(m.nodes.closed).toMatchObject({ kind: 'closed', options: [], prompt: 'שבת שלום! הקו של פרנסה׳לע של קהילת חסידי בעלזא סגור עכשיו בשבת, ויחזור לפעול במוצאי שבת בשעה 18:47.' });
    expect(ids(walkPhone(m, '12111'))).toEqual(['closed']);
    expect(resolveDialCode(m, '101')).toMatchObject({ found: false, confirm: { kind: 'closed' } });
    expect(resolveSpeech(m, 'main', 'נזילה', DEMO, ctxAt(SAT_10))).toMatchObject({ found: false, confirm: { kind: 'closed' } });
    const z = m.nodes.zmanim.prompt;
    expect(z).toContain('היום יום שבת, ו׳ חשוון תשפ״ז.');
    expect(z).toContain('צאת השבת 18:47.');
    expect(z).toContain('רבנו תם 19:19.');
    expect(z).not.toContain('18:39'); // צאת השבת של השבוע הבא
    expect(z).not.toContain('השבת הקרובה');
    // שישי אחרי הדלקת-הנרות: כבר שבת — סגור, ו"השבת" (הנוכחית) בלי הדלקה
    const fri = buildPhoneMenu(input({ nowMs: FRI_18 }));
    expect(fri.root).toBe('closed');
    expect(fri.nodes.zmanim.prompt).toContain('השבת: צאת השבת 18:47, רבנו תם 19:19.');
  });
  it('🛡 אחרי השקיעה התאריך העברי מתחלף — וזמני היום העברי הבא, עם מה שנשאר הערב', () => {
    const z = buildPhoneMenu(input({ nowMs: THU_1830 })).nodes.zmanim.prompt;
    expect(z).toContain('הערב, אור ליום שישי, ה׳ חשוון תשפ״ז.');
    expect(z).toContain('הערב: צאת הכוכבים 18:49.');
    expect(z).toContain('הדלקת נרות, ערב שבת 17:46.');
    expect(z).toContain('שקיעה 18:08.'); // שקיעת שישי — התאריך והשעות תואמים
    expect(z).toContain('השבת הקרובה, ו׳ חשוון תשפ״ז: צאת השבת 18:47, רבנו תם 19:19.');
    expect(z).not.toContain('ד׳ חשוון');
    expect(buildPhoneMenu(input({ nowMs: idt(2026, 10, 15, 16) })).nodes.zmanim.prompt).toContain('ד׳ חשוון');
  });
  it('יו״ט (יום כיפור): הקו סגור "במוצאי החג", בלי "שבת שלום"', () => {
    const m = buildPhoneMenu(input({ nowMs: idt(2026, 9, 21, 12) }));
    expect(m.root).toBe('closed');
    expect(m.nodes.closed.prompt).toMatch(/^הקו של פרנסה׳לע של קהילת חסידי בעלזא סגור עכשיו ביום כיפור, ויחזור לפעול במוצאי החג בשעה \d\d:\d\d\.$/);
  });
});

describe('📌 הודעות הקהילה (3)', () => {
  const posts = [
    P({ id: 'n1', noticeKind: 'simcha', title: 'מזל טוב למשפחת כהן', text: 'להולדת הבן', createdAt: '2026-10-10T08:00:00.000Z' }),
    P({ id: 'n2', noticeKind: 'shiur', title: 'שיעור דף יומי', place: 'בית המדרש', days: [2], time: '21:00', pinned: true, createdAt: '2026-09-01T08:00:00.000Z' }),
    P({ id: 'e1', kind: 'event', title: 'מסיבת סיום', place: 'אולם הקהילה', date: '2026-10-20', time: '20:00', createdAt: '2026-10-02T08:00:00.000Z' }),
    P({ id: 'e2', kind: 'event', title: 'אסיפה היום', date: '2026-10-15', time: 'sh-15', createdAt: '2026-10-12T08:00:00.000Z' }),
    P({ id: 'x1', title: 'לא אושרה', approved: false }),
    P({ id: 'x2', title: 'פגה אתמול', until: '2026-10-14' }),
    P({ id: 'x3', kind: 'event', title: 'אירוע שעבר', date: '2026-10-14' }),
    P({ id: 'x4', kind: 'emergency', title: 'מוקד חירום', phone: '106' }),
    P({ ...MINYAN }),
  ];
  const m = buildPhoneMenu(input({ posts }));
  const all = (menu: PhoneMenu): string => Object.values(menu.nodes).filter((n) => n.id.startsWith('notices/')).map((n) => n.prompt).join(' ');

  it('רק מאושרות ופעילות היום (הודעות + אירועים שלא עברו); נעוצות ראשונות ואז החדשות; עמודים עם 9/0', () => {
    expect(m.nodes['notices/1'].prompt).toBe(
      'הודעות הקהילה: 4 הודעות. שיעורים: שיעור דף יומי. בית המדרש. בימי שלישי בשעה 21:00. ' +
        'אירוע: אסיפה היום. היום בשעה 17:54. מזל טוב למשפחת כהן. להולדת הבן.',
    );
    expect(m.nodes['notices/2'].prompt).toBe('הודעות נוספות — עמוד 2 מתוך 2. אירוע: מסיבת סיום. אולם הקהילה. ביום שלישי, ט׳ חשוון תשפ״ז בשעה 20:00.');
    expect(m.nodes['notices/1'].options.map((o) => o.digit + '→' + o.to)).toEqual(['1→notices/1', '9→notices/2', '0→main']);
    expect(m.nodes['notices/2'].options.map((o) => o.digit + '→' + o.to)).toEqual(['1→notices/2', '0→notices/1']);
    for (const s of ['לא אושרה', 'פגה אתמול', 'אירוע שעבר', 'מוקד חירום', 'בית המדרש הגדול']) expect(all(m)).not.toContain(s);
  });
  it('תקרה: 20 הודעות ארוכות ⇒ נקראות 12 החדשות, עד 3 בעמוד, כל עמוד בתקרה — אף אחת לא נחתכת בשקט', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      P({ id: 'k' + i, title: 'מודעה ' + String(i + 1).padStart(2, '0'), text: 'מילה '.repeat(80), createdAt: `2026-10-${String(i + 1).padStart(2, '0')}T08:00:00.000Z` }),
    );
    const mm = buildPhoneMenu(input({ posts: many }));
    const text = all(mm);
    const read = [...text.matchAll(/מודעה (\d\d)/g)].map((x) => Number(x[1]));
    expect(read).toEqual([20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9]);
    expect(mm.nodes['notices/1'].prompt.startsWith('הודעות הקהילה: 12 הודעות.')).toBe(true);
    const pages = Object.keys(mm.nodes).filter((k) => k.startsWith('notices/'));
    for (const p of pages) expect(mm.nodes[p].prompt.length).toBeLessThanOrEqual(PHONE_PROMPT_MAX);
    expect(keysOf(mm.nodes[pages[pages.length - 1]])).not.toContain('9');
  });
});

describe('🫙 מצבים ריקים', () => {
  it('מדריך ריק ⇒ "עדיין אין עסקים במדריך" ובלי דיבור; לוח ריק ⇒ "אין כרגע הודעות"; חירום — ברירות-המחדל', () => {
    const m = buildPhoneMenu({ listings: [], posts: [], nowMs: THU_13 });
    expect(m.nodes['cats/1']).toMatchObject({ prompt: 'עדיין אין עסקים במדריך.' });
    expect(keysOf(m.nodes['cats/1'])).toEqual(['0']);
    expect(m.nodes['cats/1'].speech).toBeUndefined();
    expect(m.nodes.main.speech).toBeUndefined();
    expect(m.nodes.main.options[0].say).toBe('לעסקים הקישו 1');
    expect(m.nodes['notices/1'].prompt).toBe('אין כרגע הודעות בלוח הקהילה.');
    expect(keysOf(m.nodes['notices/1'])).toEqual(['0']);
    expect(keysOf(m.nodes['emergency/1'])).toEqual(['1', '2', '3', '4', '0']);
    expect(m.codes).toEqual({});
    expect(resolveSpeech(m, 'main', 'נזילה', [], ctxAt(THU_13)).found).toBe(false);
    expect(resolveDialCode(m, '101').found).toBe(false);
    const named = buildPhoneMenu({ listings: [], posts: [], nowMs: THU_13, config: { ...DEFAULT_CONFIG, terms: { 'entity.prListings': 'בעלי מקצוע' } } });
    expect(named.nodes['cats/1'].prompt).toBe('עדיין אין בעלי מקצוע במדריך.');
  });
  it('מספר-חירום בלי ספרות-חיוג לא מוצע לחיבור; כולם כאלה ⇒ "אין מספרי חירום מוגדרים"', () => {
    const m = buildPhoneMenu(input({ posts: [P({ id: 'x', kind: 'emergency', title: 'מוקד', phone: 'אין' })] }));
    expect(m.nodes['emergency/1'].prompt).toBe('אין מספרי חירום מוגדרים.');
    expect(keysOf(m.nodes['emergency/1'])).toEqual(['0']);
  });
});

describe('✂️ תקרות וניקוי-הקראה', () => {
  it('כל נוסח ≤ PHONE_PROMPT_MAX וכל אפשרות ≤ PHONE_SAY_MAX; שם ארוך נחתך בגבול-מילה עם "…"', () => {
    const long = L({ id: 'lg', name: 'שם ארוך מאוד '.repeat(20), title: 'כותרת '.repeat(100), area: 'אזור '.repeat(40), category: 'other', phone: '050-0000999', kashrut: 'השגחה '.repeat(30) });
    const m = buildPhoneMenu(input({
      listings: [...DEMO, long],
      prefs: { communityName: 'קהילה '.repeat(40) },
      posts: [P({ id: 'p', title: 'כותרת '.repeat(50), text: 'טקסט '.repeat(400), place: 'מקום '.repeat(30) })],
    }));
    for (const n of Object.values(m.nodes)) {
      expect(n.prompt.length, n.id).toBeLessThanOrEqual(PHONE_PROMPT_MAX);
      for (const o of n.options) expect(o.say.length, n.id + ' ' + o.digit).toBeLessThanOrEqual(PHONE_SAY_MAX);
    }
    expect(m.nodes['biz/lg'].label.length).toBeLessThanOrEqual(40);
    expect(m.nodes['biz/lg'].label.endsWith('מאוד…')).toBe(true);
  });
  it('phonePrompt: משפטים עד התקרה — משפט שלא נכנס נשמט וכל מה שאחריו; משפט-ראשון ארוך נחתך בגבול-מילה', () => {
    expect(phonePrompt(['א.', '  ', 'ב.'])).toBe('א. ב.');
    expect(phonePrompt(['ראשון.', 'שני ארוך.', 'ג.'], 12)).toBe('ראשון.'); // "ג." נכנס — אבל אחרי משפט שנשמט, לא מדלגים
    const long = phonePrompt(['מילה '.repeat(500)]);
    expect(long.length).toBeLessThanOrEqual(PHONE_PROMPT_MAX);
    expect(long.endsWith('מילה…')).toBe(true);
  });
  it('🛡 תווית-מיקום ארוכה (לא מרופאת — resolveZmanimLoc לא חותך) לא דוחקת את הזמנים מההקראה', () => {
    const z = buildPhoneMenu(input({ prefs: { zmanim: { label: 'מקום '.repeat(300) } } })).nodes.zmanim.prompt;
    expect(z).toContain('נץ החמה 06:44.');
    expect(z).toContain('לשאלות הלכה יש לפנות לרב הקהילה.');
    expect(z.length).toBeLessThanOrEqual(PHONE_PROMPT_MAX);
  });
  it('🛡 תווי-בקרה/כיווניות/אימוג׳י/סמלי-תחביר לא מגיעים להקראה (מתאם-קול לא "מפרש" נתונים)', () => {
    const evil = L({ id: 'ev', name: '<script>alert(1)</script> & = # * \u202e\u0007 😀 שרברב', category: 'other', phone: '050-0000888' });
    const p = buildPhoneMenu(input({ listings: [...DEMO, evil] })).nodes['biz/ev'].prompt;
    for (const bad of ['<', '>', '&', '=', '#', '*', '\u202e', '\u0007', '😀']) expect(p, JSON.stringify(bad)).not.toContain(bad);
    expect(p).toContain('שרברב');
    expect(p).toContain('alert(1)');
  });
});

describe('📜 התסריט · דטרמיניזם · טוהר', () => {
  const origTz = process.env.TZ;
  afterEach(() => {
    if (origTz === undefined) delete process.env.TZ;
    else process.env.TZ = origTz;
  });

  it('phoneScriptText: טקסט-פשוט — כל צומת עם מזהה, הנוסח, המקשים והפעולה', () => {
    const s = phoneScriptText(MENU);
    expect(s.startsWith('הקו של פרנסה׳לע של קהילת חסידי בעלזא — תסריט הקריינות\n')).toBe(true);
    for (const n of Object.values(MENU.nodes)) {
      expect(s).toContain(`[${n.id}]`);
      expect(s).toContain(n.prompt);
    }
    expect(s).toContain('[main] תפריט · שורש · דיבור או מקשים');
    expect(s).toContain('  כוכבית — יש לכם קוד של עסק מהחוברת? הקישו כוכבית ואת שלוש הספרות ← code');
    expect(s).toContain('  [פעולה] חיבור שיחה אל מד״א: 101');
    expect(s).toContain('  [פעולה] הקראת המספר ספרה-ספרה: 050-000-0101');
    expect(s).not.toMatch(/<\/?[a-z]/i);
    expect(phoneScriptText(buildPhoneMenu(input({ nowMs: SAT_10 })))).toContain('[closed] הקו סגור · שורש');
  });
  it('🛡 אותו קלט ⇒ אותו עץ, אותו תסריט ואותה הליכה — גם כשאזור-הזמן של התהליך שונה; הקלט לא משתנה', () => {
    const before = JSON.stringify(DEMO);
    const snap = (): string => {
      const m = buildPhoneMenu(input({ posts: [MINYAN] }));
      return JSON.stringify([m, phoneScriptText(m), ids(walkPhone(m, '*1011')), resolveSpeech(m, 'main', 'נזילה', DEMO, ctxAt(THU_13))]);
    };
    const base = snap();
    expect(snap()).toBe(base);
    process.env.TZ = 'America/New_York';
    expect(snap()).toBe(base);
    process.env.TZ = 'UTC';
    expect(snap()).toBe(base);
    expect(JSON.stringify(DEMO)).toBe(before);
  });
  it('🛡 טוהר: אין store/DOM/firebase/רשת, אין Date.now / new Date(); אין בקשות-תושבים; בידוד-כסף', () => {
    const imports = [...phoneSrc.matchAll(/from '([^']+)'/g)].map((x) => x[1]);
    // שינוי-נעילה מכוון (13.10, BUILD-ORDER-SWITCHBOARD חיבור ג׳): שני ייבואי-טיפוסים מהמרכזייה — נמחקים בקומפילציה, כך
    // שהקו עדיין לא תלוי בזמן-ריצה באף כלי (ask מוזרק דרך input.switchboard). ייבוא-ערך מהמרכזייה ⇒ אדום.
    // שינוי-נעילה מכוון (ENGINEBOX-B 13.10): + החיבורים של ארגז-המנועים (links — נתונים טהורים, לא כלי)
    expect(imports.sort()).toEqual(['../../lib/config', '../../lib/enginebox/links', '../../lib/switchboard/contract', '../../lib/switchboard/registry', '../../types/config', '../../types/domain', './lib', './zmanimBoard']);
    expect(phoneSrc).toMatch(/^import type \{ SwitchCtx \} from '\.\.\/\.\.\/lib\/switchboard\/contract';$/m);
    expect(phoneSrc).toMatch(/^import type \{ AskFn, OutputOf \} from '\.\.\/\.\.\/lib\/switchboard\/registry';$/m);
    expect(phoneSrc, 'הקו לא מייבא את האירוח').not.toMatch(/from '[^']*hosting/);
    expect(phoneSrc).not.toMatch(/Date\.now|new Date\b/);
    expect(phoneSrc).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|EventSource|navigator\.|\bdocument\.|\bwindow\.|localStorage|sessionStorage|indexedDB|useApp|firebase/);
    expect(phoneSrc).not.toMatch(/prRequests|PrRequest|requester|businessView|communityRequests|requestsForListing|routeRequest/);
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'donations', 'upsertEvent', 'OrgEvent']) expect(phoneSrc, kw).not.toContain(kw);
    expect(phoneSrc).not.toMatch(/\bdb\.events\b/);
  });
});
