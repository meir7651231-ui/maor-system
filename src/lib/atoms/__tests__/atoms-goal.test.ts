/**
 * 🔒 ratchet — 🎯 "להתחיל מהסוף" (ATOMS-GOAL, 14.10.2026): `readGoal` + `composeGoal` + `sayComposition` על DB-בדיקה.
 *
 * הקורפוס: משפטי-מטרה, לכל אחד ההרכבה הצפויה (מנוע · מקום · שרשרת-החלקים · הפרטים העיקריים), כולל תחיליות,
 * טעויות-כתיב, מספרים ויחידות, ושלוש השרשראות (✂️⇒🔗, 🔗⇒⏭️, 🔗⇒✂️). משפטים לא-ברורים ⇒ שאלות סגורות, לא ניחוש.
 * **המד** (הרעיון של "המחולל"): כמה משפטים מגיעים ל"תוצאה מוכחת" — ההרכבה הראשונה היא הצפויה והיא רצה על הנתונים.
 * המספר לא יורד (METER_FLOOR). אחרי מיזוג התצוגות של מחשבון הזמנים ומבין בקשות (P, דרך C) — גם הם מוכחים.
 * משפט שאין לו נתונים (פרסומות) ⇒ "לא מצאתי" כן, עם השאלה של החלק — לא ניחוש.
 * פרטיות: אין שם אורח או מבקש בשום משפט/שורה. דטרמיניזם: לא תלוי בשעון המערכת.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Db, HostStaff } from '../../../types/domain';
import { B, fixtureDb, HOST_RECORDS, NOW_MS, PR_REQUESTS } from '../../switchboard/__tests__/fixture';
import type { AtomId, Capability } from '../contract';
import { ENGINE_CARDS } from '../engines';
import { answerGoal, composeGoal, GOAL_NONE_TEXT, readGoal, sayComposition, withPick, type GoalAnswer } from '../goal';
import type { PreviewCtx } from '../preview';
import { GOAL_EXAMPLES, GOAL_NONE_TEXT as UI_NONE_TEXT } from '../../../components/enginebox/atoms/GoalCard';
import goalSrc from '../goal.ts?raw';

const STAFF = (id: string, name: string, role: string): HostStaff => ({ id, kind: 'staff', name, role, phone: '', createdAt: 'x', updatedAt: 'x' });
function orgDb(over: Partial<Db> = {}): Db {
  const base = fixtureDb();
  return {
    ...base,
    hostBookings: [
      ...base.hostBookings,
      B({ id: 'hb9', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-25', checkOut: '2026-10-28', charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }], payments: [] }),
    ],
    hostRecords: [...base.hostRecords, STAFF('hs1', 'דנה', 'ניקיון'), STAFF('hs2', 'רבקה', 'ניקיון'), STAFF('hs3', 'יוסי', 'תחזוקה')],
    ...over,
  };
}
const ctx = (db: Partial<Db> | null = orgDb(), nowMs = NOW_MS): PreviewCtx => ({ db, nowMs });
const ask = (text: string, c: PreviewCtx = ctx(), caps: Capability[] = []): GoalAnswer => answerGoal(text, [], ENGINE_CARDS, c, caps);

type P = Record<string, number | string>;
/** [המקום הראשון, "חלק>חלק", הפרטים של כל חלק (חלקי)]. */
type Expect = [place: string, chain: string, params?: P[]];
interface Case {
  text: string;
  top?: Expect;
  /** משפט לא-ברור ⇒ שאלה סגורה (הטקסט שלה), וצ'יפים שחייבים להופיע. */
  asks?: { q: string; chips: string[] };
  /** אין נתונים שנותנים תוצאה ⇒ "לא מצאתי" + השאלה של החלק על מה שכן. */
  none?: { q: string; chips: string[] };
  /** מה שחייב להיות בתחילת המשפט "הלוך-חזור". */
  say?: string;
}

const CORPUS: readonly Case[] = [
  // ✂️ חלוקה — טווח וסכום, לפי גודל ולפי מספר
  { text: 'תורים של 40 דקות בחלון הניקיון', top: ['bookings.turnover', 'divide', [{ by: 'size', size: 40 }]], say: '✂️ מחלק לחלקים שווים את חלון הניקיון, כל חלק 40 דקות ← 6 תורים' },
  { text: 'לחלק את היתרה ל-3 תשלומים', top: ['bookings.balance', 'divide', [{ by: 'parts', parts: 3 }]], say: '✂️ מחלק לחלקים שווים את היתרה, ל-3 תשלומים' },
  { text: 'תשלומים של ₪400 ליתרה', top: ['bookings.balance', 'divide', [{ by: 'size', size: 400 }]] },
  { text: 'לחלק את המחיר הכולל ל-4', top: ['bookings.total', 'divide', [{ by: 'parts', parts: 4 }]] },
  { text: 'ניקיון באמצע שהייה כל 2 ימים', top: ['bookings.stay', 'divide', [{ by: 'size', size: 2 }]] },
  { text: 'מועדי תשלום עד ההגעה ל-2 חלקים', top: ['bookings.untilArrival', 'divide', [{ by: 'parts', parts: 2 }]] },
  // 🔗 חיבור צמודים · ⏭️ הבא בתור
  { text: '3 לילות פנויים ברצף', top: ['bookings.nights', 'merge', [{ minLength: 3 }]] },
  { text: 'ובלילות הפנויים ברצף', top: ['bookings.nights', 'merge'] },
  { text: 'הלילה הפנוי הבא', top: ['bookings.nights', 'next'] },
  { text: '3 ההגעות הבאות', top: ['bookings.arrivals', 'next', [{ count: 3 }]] },
  // 🎯 עיגול
  { text: 'לעגל את המחיר הכולל לעשרות למעלה', top: ['bookings.total', 'round', [{ step: 10, dir: 'up' }]] },
  { text: 'שעת ההגעה מעוגלת לחצי שעה', top: ['bookings.arrivals', 'round', [{ step: 30 }]] },
  { text: 'לעגל את היתרה ל-50', top: ['bookings.balance', 'round', [{ step: 50 }]] },
  // ⏱️ לפני / אחרי
  { text: 'תזכורת יום לפני כל הגעה', top: ['bookings.arrivals', 'offset', [{ minutes: -1440 }]], say: '⏱️ מזיז זמן לפני או אחרי את ההגעות, יום לפני' },
  // 📣 מעביר הלאה
  { text: 'אם המנקה לא עונה תוך שעה — להעביר לבאה', top: ['bookings.cleaning', 'escalate', [{ waitMin: 60 }]], say: '📣 מעביר הלאה כשאין תשובה את משימות הניקיון, אחרי שעה בלי תשובה' },
  { text: 'תקלה בלי טיפול תוך 3 שעות להעביר', top: ['bookings.faults', 'escalate', [{ waitMin: 180 }]] },
  { text: 'והיתרות הפתוחות להעביר למנהל אם אין תשובה תוך יומיים', top: ['bookings.unpaid', 'escalate', [{ waitMin: 2880 }]] },
  // 🔄 בתורות
  { text: 'כל משימת ניקיון למנקה אחרת בתורות', top: ['bookings.cleaning', 'rotate', [{ by: 'item' }]] },
  // טעויות-כתיב ותחיליות
  { text: 'ללחק את היתרה לשלוש תשלומים', top: ['bookings.balance', 'divide', [{ parts: 3 }]] },
  { text: 'תיזכורת יום לפני כל הגעה', top: ['bookings.arrivals', 'offset', [{ minutes: -1440 }]] },
  { text: 'לחלק בתורוט את התקלות', top: ['bookings.faults', 'rotate'] },
  // שרשראות: ✂️⇒🔗 · ✂️⇒⏭️ · ✂️⇒🔄 · 🔗⇒⏭️ · 🔗⇒✂️ · ⏭️⇒⏱️ · 🔗⇒⏭️⇒⏱️
  { text: 'תורים של 20 דקות בחלון הניקיון ולחבר שניים צמודים', top: ['bookings.turnover', 'divide>merge', [{ size: 20 }, { minLength: 2 }]] },
  { text: 'מה התור הבא בחלון הניקיון', top: ['bookings.turnover', 'divide>next'] },
  { text: 'לתת את התורים בחלון הניקיון בתורות לפי יום', top: ['bookings.turnover', 'divide>rotate', [{}, { by: 'day' }]] },
  { text: 'החלון הפנוי הבא של 4 לילות ברצף', top: ['bookings.nights', 'merge>next', [{ minLength: 4 }, { minLength: 4 }]] },
  { text: 'לחלק את הזמן הפנוי בין אנשי הצוות', top: ['bookings.nights', 'merge>divide'] },
  { text: 'התזכורת להגעה הבאה, שעה לפני', top: ['bookings.arrivals', 'next>offset', [{}, { minutes: -60 }]] },
  { text: 'תזכורת יום לפני החלון הפנוי הבא של 3 לילות ברצף', top: ['bookings.nights', 'merge>next>offset', [{ minLength: 3 }, { minLength: 3 }, { minutes: -1440 }]] },
  // 🕯️ מחשבון הזמנים · 🙋 מבין בקשות — מוכחים על התצוגות של P
  { text: 'השעות הזמניות של היום', top: ['zmanim.day', 'divide'] },
  { text: '20 דקות לפני השקיעה', top: ['zmanim.times', 'offset', [{ minutes: -20 }]] },
  { text: 'משמרות שמירה בשבת ל-4', top: ['zmanim.shabbat', 'divide', [{ parts: 4 }]] },
  { text: 'השבת או החג הבא', top: ['zmanim.closedDays', 'next'] },
  { text: 'בקשה בלי מענה תוך 3 שעות להעביר לכל הקהילה', top: ['whatNeed.requests', 'escalate', [{ waitMin: 180 }]] },
  { text: 'למצוא עסק גם עם טעות כתיב', top: ['whatNeed.names', 'fuzzy'] },
  { text: 'כל בקשה חדשה לעסק אחר בתורות', top: ['whatNeed.requests', 'rotate', [{ by: 'item' }]] },
  { text: 'חג ושבת צמודים', top: ['zmanim.closedDays', 'merge'] },
  { text: 'לעגל את זמני היום לדקה למטה', top: ['zmanim.times', 'round', [{ step: 1, dir: 'down' }]], say: '🎯 מעגל מספרים את זמני היום, לכל דקה, למטה' },
  // אין נתונים ⇒ אין הרכבה (כן), והשאלה של החלק על מה שכן נותן תוצאה — בלי פרסומות בארגון אין "פרסומת בתורות"
  { text: 'כל יום פרסומת אחרת בתורות', none: { q: '🔄 מה לחלק בתורות?', chips: ['הבקשות', 'משימות הניקיון'] } },
  { text: 'תורים של 30 דקות בשעות הפתיחה', top: ['whatNeed.hours', 'divide', [{ by: 'size', size: 30 }]] },
  // ❓ לא ברור ⇒ שאלות סגורות
  { text: 'לעגל', asks: { q: '🎯 מה לעגל?', chips: ['היתרה', 'המחיר הכולל', 'ההגעות'] } },
  { text: 'לחלק', asks: { q: '✂️ מה לחלק?', chips: ['חלון הניקיון', 'היתרה'] } },
  { text: 'הבא בתור', asks: { q: '⏭️ מה לחפש קדימה?', chips: ['הלילות', 'ההגעות'] } },
  { text: 'אם אין תשובה תוך שעה להעביר', asks: { q: '📣 מה להעביר הלאה כשאין תשובה?', chips: ['משימות הניקיון', 'התקלות', 'היתרות הפתוחות'] } },
  { text: 'היתרה', asks: { q: 'מה לעשות עם היתרה?', chips: ['✂️ מחלק לחלקים שווים', '🎯 מעגל מספרים'] } },
  { text: 'משהו יפה', asks: { q: 'מה לעשות?', chips: ['✂️ מחלק לחלקים שווים', '🔍 מוצא גם עם טעות כתיב'] } },
  { text: 'מה המצב', asks: { q: 'מה לעשות?', chips: ['🔄 מחלק בתורות'] } },
];

/**
 * המד: כמה משפטים מהקורפוס מגיעים לתוצאה מוכחת (ההרכבה הראשונה = הצפויה, עם שורות אמיתיות).
 * עולה בלבד — הורדה = מישהו שבר הבנה או תצוגה.
 */
const METER_FLOOR = 38;

const chainOf = (a: GoalAnswer): string => (a.results[0] ? a.results[0].steps.map((s) => s.atom).join('>') : '');
const rootOf = (a: GoalAnswer): string => a.results[0]?.steps[0]?.place ?? '';
const reached = (c: Case, a: GoalAnswer): boolean => !!c.top && a.status === 'ok' && rootOf(a) === c.top[0] && chainOf(a) === c.top[1] && a.results[0].lines.length > 0;

afterEach(() => vi.useRealTimers());

describe('🎯 הקורפוס — כל משפט נותן את ההרכבה הצפויה (או שאלה סגורה)', () => {
  it('לפחות 30 משפטים, לפחות 6 לא-ברורים, כל החלקים וכל שלושת המנועים מכוסים', () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(30);
    expect(CORPUS.filter((c) => c.asks).length).toBeGreaterThanOrEqual(6);
    const atoms = new Set(CORPUS.flatMap((c) => (c.top ? c.top[1].split('>') : [])));
    for (const a of ['divide', 'merge', 'next', 'round', 'offset', 'escalate', 'rotate', 'fuzzy'] as AtomId[]) expect(atoms, a).toContain(a);
    const engines = new Set(CORPUS.map((c) => c.top?.[0].split('.')[0]).filter(Boolean));
    expect([...engines].sort()).toEqual(['bookings', 'whatNeed', 'zmanim']);
    const chains = CORPUS.map((c) => c.top?.[1] ?? '');
    for (const ch of ['divide>merge', 'merge>next', 'merge>divide']) expect(chains, ch).toContain(ch);
  });

  for (const c of CORPUS) {
    it(c.text || '(ריק)', () => {
      const a = ask(c.text);
      if (c.none) {
        expect(a.status).toBe('none');
        expect(a.results).toEqual([]);
        expect(a.questions[0].text).toBe(c.none.q);
        const labels = a.questions[0].chips.map((x) => x.label);
        for (const ch of c.none.chips) expect(labels.some((l) => l.endsWith(' ' + ch)), ch).toBe(true);
        return;
      }
      if (c.asks) {
        // לא מנחשים: אין הרכבה, יש שאלה סגורה עם הצ'יפים
        expect(a.status).toBe('ask');
        expect(a.results).toEqual([]);
        const q = a.questions[0];
        expect(q.text).toBe(c.asks.q);
        const labels = q.chips.map((x) => x.label);
        // צ'יפ של מקום = האימוג'י של המנוע + השם הקצר ("🛏️ היתרה")
        for (const ch of c.asks.chips) expect(labels.some((l) => l === ch || l.endsWith(' ' + ch)), ch + ' ∈ ' + labels.join(',')).toBe(true);
        return;
      }
      const [place, chain, params] = c.top!;
      // ההבנה: החלקים והמקום נקראו מהמשפט (גם בלי תצוגה)
      const g = readGoal(c.text);
      expect(g.unclear).toBe(false);
      for (const atom of chain.split('>')) if (!g.atoms.includes(atom as AtomId)) expect(chain.split('>').length, 'חלק "' + atom + '" רק כדרך').toBeGreaterThan(1);
      expect(g.places[0], 'המקום').toBe(place);
      expect(a.status).toBe('ok');
      expect(rootOf(a)).toBe(place);
      expect(chainOf(a)).toBe(chain);
      const top = a.results[0];
      (params ?? []).forEach((want, i) => expect(top.steps[i].params, 'הפרטים של חלק ' + (i + 1)).toMatchObject(want));
      expect(top.lines.length).toBeGreaterThan(0);
      expect(top.sentence).toBe(sayComposition(top));
      if (c.say) expect(top.sentence.startsWith(c.say), top.sentence).toBe(true);
      expect(a.results.length).toBeLessThanOrEqual(3);
    });
  }

  it('📏 המד — משפטים שמגיעים לתוצאה מוכחת (לא יורד)', () => {
    const n = CORPUS.filter((c) => reached(c, ask(c.text))).length;
    console.info('🎯 מד-המטרות: ' + n + '/' + CORPUS.filter((c) => c.top).length + ' מוכחים');
    expect(n).toBeGreaterThanOrEqual(METER_FLOOR);
  });
});

describe('🎯 התוצאות והדירוג', () => {
  it('"תורים של 40 דקות בחלון הניקיון" ⇒ 6 התורים האמיתיים, והמשפט חוזר למילים', () => {
    const a = ask('תורים של 40 דקות בחלון הניקיון');
    expect(a.results[0]).toMatchObject({ id: 'bookings:bookings.turnover:divide', title: 'חלון הניקיון 11:00–15:00 · 6 תורים', saved: false });
    expect(a.results[0].lines).toEqual(['11:00–11:40 · דנה', '11:40–12:20 · רבקה', '12:20–13:00 · דנה', '13:00–13:40 · רבקה', '13:40–14:20 · דנה', '14:20–15:00 · רבקה']);
    expect(a.results[0].sentence).toBe('✂️ מחלק לחלקים שווים את חלון הניקיון, כל חלק 40 דקות ← 6 תורים');
    expect(a.results[0].create.map((c) => c.id)).toEqual(['bookings:bookings.turnover:divide']);
  });

  it('"3 לילות פנויים ברצף" ⇒ קודם חלק אחד, ואחריו שרשרת 🔗⇒⏭️ עם החלון האמיתי (שני מנועים ליצירה, ההורה קודם)', () => {
    const a = ask('3 לילות פנויים ברצף');
    expect(a.results[0].steps.length).toBe(1);
    const ch = a.results.find((r) => r.steps.map((s) => s.atom).join('>') === 'merge>next')!;
    expect(ch.lines[0]).toBe('בית ההארחה · 3 לילות פנויים ברצף מ-15/10 עד 18/10');
    expect(ch.create.map((c) => c.id)).toEqual(['bookings:bookings.nights:merge', 'bookings:bookings.nights:merge>next']);
    expect(ch.create[1].parent).toBe(ch.create[0].id);
    expect(ch.sentence).toBe('🔗 מחבר דברים צמודים את הלילות, לפחות 3 לילות · ואז ⏭️ מוצא את הבא בתור, של 3 לילות לפחות ← החלון הפנוי הבא של 3 לילות');
  });

  it('דירוג: פחות חלקים קודם; אותו קלט ⇒ אותו פלט; לא תלוי בשעון המערכת', () => {
    for (const c of CORPUS) {
      const a = ask(c.text);
      for (let i = 1; i < a.results.length; i++) expect(a.results[i].steps.length).toBeGreaterThanOrEqual(a.results[i - 1].steps.length);
    }
    const before = JSON.stringify(CORPUS.map((c) => ask(c.text)));
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-03T03:03:00Z'));
    expect(JSON.stringify(CORPUS.map((c) => ask(c.text)))).toBe(before);
    expect(goalSrc).not.toMatch(/Date\.now|new Date\(\)/);
  });

  it('חלק שלא נאמר ולא לוקח פרט לא נדחף לשרשרת (בלי "🎯 ואז ⏱️" כשביקשו רק תזכורת)', () => {
    const a = ask('תזכורת יום לפני כל הגעה');
    expect(a.results.map((r) => r.steps.map((s) => s.atom).join('>'))).toEqual(['offset']);
  });

  it('מה שהחלק לא יכול — לא מקוצץ בשקט: "יומיים לפני" (⏱️ עד יום) ⇒ אין הרכבה', () => {
    const a = ask('תזכורת יומיים לפני כל הגעה');
    expect(a.results).toEqual([]);
    expect(a.status).toBe('none');
  });

  it('מנוע שכבר שמור: אותם פרטים ⇒ "כבר מחובר"; מנוע-ביניים שמור ⇒ לא נוצר שוב, ובונים עליו כמו שהוא', () => {
    const saved: Capability[] = [{ id: 'bookings:bookings.nights:merge', engine: 'bookings', place: 'bookings.nights', atom: 'merge', params: { maxGap: 0, minLength: 3 }, name: 'מנוע לילות פנויים צמודים' }];
    const a = ask('3 לילות פנויים ברצף', ctx(), saved);
    expect(a.results[0].saved).toBe(true);
    expect(a.results[0].create).toEqual([]);
    const ch = a.results.find((r) => r.steps.length === 2)!;
    expect(ch.create.map((c) => c.id)).toEqual(['bookings:bookings.nights:merge>next']);
  });
});

describe('🎯 שאלות סגורות — הצ\'יפ משלים את המשפט', () => {
  it('"לחלק" + הצ\'יפ "היתרה" ⇒ ההרכבה של היתרה', () => {
    const a = ask('לחלק');
    const chip = a.questions[0].chips.find((c) => c.label === '🛏️ היתרה')!;
    const b = answerGoal('לחלק', [chip.pick], ENGINE_CARDS, ctx());
    expect(b.status).toBe('ok');
    expect(b.results[0].steps[0].place).toBe('bookings.balance');
    expect(b.results[0].lines).toEqual(['צימר הגפן · ₪1,200 = 12 × ₪100']);
  });

  it('"היתרה" + הצ\'יפ "🎯 מעגל מספרים" ⇒ עיגול היתרה', () => {
    const chip = ask('היתרה').questions[0].chips.find((c) => c.pick.atom === 'round')!;
    const b = answerGoal('היתרה', [chip.pick], ENGINE_CARDS, ctx());
    expect(b.results[0].steps.map((s) => s.atom)).toEqual(['round']);
  });

  it('withPick בודק מול הכרטיסים — חלק/מקום לא מוכר לא משנה כלום', () => {
    const g = readGoal('לחלק');
    expect(withPick(g, { atom: 'nope' as AtomId, place: 'nope' })).toEqual(g);
  });

  it('משפט עם מקום שהחלק לא מתחבר אליו ⇒ "לא מצאתי", עם השאלה של החלק על מה שכן', () => {
    const a = ask('לעגל את הלילות');
    expect(a.status).toBe('none');
    expect(a.results).toEqual([]);
    expect(a.questions[0].text).toBe('🎯 מה לעגל?');
  });

  it('השורה הכנה זהה במנוע ובמסך', () => {
    expect(UI_NONE_TEXT).toBe(GOAL_NONE_TEXT);
  });
});

describe('🎯 פרטיות, חוסן, דוגמאות', () => {
  const names = [...HOST_RECORDS.filter((r) => r.kind === 'guest').map((g) => (g as { name: string }).name), ...PR_REQUESTS.map((r) => r.requester.name)];

  it('אין שם אורח או מבקש באף משפט/כותרת/שורה (כל הקורפוס + הדוגמאות + השאלות)', () => {
    for (const t of [...CORPUS.map((c) => c.text), ...GOAL_EXAMPLES]) {
      const a = ask(t);
      const all = JSON.stringify([a.results.map((r) => [r.sentence, r.title, r.lines]), a.questions]);
      for (const n of names) expect(all, t).not.toContain(n);
    }
  });

  it('לא זורק: DB ריק/פגום, ctx חסר, קלט לא-מחרוזת, nowMs לא-סופי', () => {
    expect(ask('תורים של 40 דקות בחלון הניקיון', ctx(null)).results).toEqual([]);
    expect(ask('תורים של 40 דקות בחלון הניקיון', ctx({ hostUnits: 'x' as never, hostBookings: [null as never] })).results).toEqual([]);
    expect(composeGoal(readGoal('לחלק'), ENGINE_CARDS, null as never).status).toBe('empty');
    expect(ask('לחלק', ctx(orgDb(), NaN)).status).toBe('empty');
    expect(readGoal(42 as never).unclear).toBe(true);
    expect(readGoal(undefined).atoms).toEqual([]);
    expect(ask('').status).toBe('empty');
  });

  it('שש הדוגמאות שבמסך — כל אחת מובנת (תשובה או שאלה, לא "לא ברור")', () => {
    expect(GOAL_EXAMPLES.length).toBe(6);
    for (const t of GOAL_EXAMPLES) expect(readGoal(t).unclear, t).toBe(false);
  });

  it('משפט-ההרכבה בשמות שאושרו, בלי המילים האסורות של הבעלים', () => {
    const BANNED = /מיזוג|ניתוב|הסלמה|סלחני|יחסי|אטום|(?<!ב)רצף|טווח/;
    for (const c of CORPUS) for (const r of ask(c.text).results) expect(r.sentence, r.sentence).not.toMatch(BANNED);
  });
});
