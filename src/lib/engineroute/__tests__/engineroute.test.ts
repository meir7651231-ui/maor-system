/**
 * ratchet — 🧭 "מתחילים מהסוף" (ENGINEBOX-ROUTE 13.10.2026): המשפט של הלקוח ⇒ תקעים ⇒ מסלול-הרכבה כמו Waze.
 *
 * מה ננעל: מסלול נכון בגרפים קטנים · הקצר ראשון · זיהוי מנוע-חסר · חסינות-מעגלים · דטרמיניזם · ביצועים
 * (300 מנועים × 20 תקעים מתחת ל-50ms) · מילון-המילים על משפטים אמיתיים (תחיליות, רבים, בלי התאמות-שווא) ·
 * routeText בעברית פשוטה · rankByRecipes (סדר + תיקו שומר סדר).
 */
import { describe, expect, it } from 'vitest';
import {
  GOAL,
  GOAL_LEXICON,
  PLUG_IDS,
  findRoutes,
  goalFromText,
  rankByRecipes,
  routeText,
  type RoutePart,
} from '../index';

const part = (id: string, gives: string[], needs: string[] = [], name = id): RoutePart => ({ id, name, gives, needs });

/** ארגז קטן בסגנון הקהילה: אירוח, לוח-זמנים, קו טלפוני, הודעות, תשלום. */
const BOX: RoutePart[] = [
  part('hosting', ['availability', 'booking'], [], 'אירוח משפחתי'),
  part('zmanim', ['times.shabbat', 'times.prayers', 'times.blocked'], [], 'לוח זמנים'),
  part('phoneline', ['voice.menu'], ['booking', 'times.blocked'], 'הקו הטלפוני'),
  part('wa', ['message.text'], ['person'], 'וואטסאפ'),
  part('contacts', ['person'], [], 'אנשי קשר'),
  part('pay', ['payment.link'], ['booking'], 'תשלומים'),
  part('calendar', ['date.hebrew', 'reminder'], [], 'לוח עברי'),
];
const nameOf = (id: string): string => BOX.find((p) => p.id === id)?.name ?? id;

describe('findRoutes — מסלול נכון', () => {
  it('כבר יש הכול ⇒ מסלול ריק אחד', () => {
    const r = findRoutes({ parts: BOX, start: ['hosting'], goalPlugs: ['booking'] });
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({ steps: [], links: [], missing: [], addedCount: 0 });
    expect(routeText(r[0], nameOf)).toEqual(['כבר יש לך את כל מה שצריך — אין מה להוסיף']);
  });

  it('הדוגמה של הבעלים מקצה לקצה: משפט ⇒ תקעים ⇒ מסלול ⇒ צעדים', () => {
    const g = goalFromText('אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר');
    expect(g.plugs).toEqual(['booking', 'times.shabbat', 'voice.menu']);
    expect(g.matched).toEqual([
      { word: 'להזמין', plug: 'booking' },
      { word: 'שבת', plug: 'times.shabbat' },
      { word: 'מטלפון כשר', plug: 'voice.menu' },
    ]);
    const [best] = findRoutes({ parts: BOX, start: ['hosting'], goalPlugs: g.plugs });
    // צריך לוח-זמנים (שבת + שעות-חסומות לקו) ואת הקו עצמו; הלוח קודם — הקו צריך ממנו.
    expect(best.addedCount).toBe(2);
    expect(best.missing).toEqual([]);
    expect(best.steps.map((s) => s.add)).toEqual(['zmanim', 'phoneline']);
    expect(best.links).toEqual(
      expect.arrayContaining([
        { giver: 'hosting', plug: 'booking', needer: 'phoneline' },
        { giver: 'zmanim', plug: 'times.blocked', needer: 'phoneline' },
        { giver: 'phoneline', plug: 'voice.menu', needer: GOAL },
        { giver: 'zmanim', plug: 'times.shabbat', needer: GOAL },
      ]),
    );
    expect(best.links).toHaveLength(4);
    expect(routeText(best, nameOf)).toEqual([
      'הוסף את לוח זמנים וחבר אותו ל-הקו הטלפוני ול-התוצאה שביקשת',
      'הוסף את הקו הטלפוני וחבר אותו ל-התוצאה שביקשת',
      'הקו הטלפוני מקבל הזמנה מ-אירוח משפחתי',
      'הקו הטלפוני מקבל שעות חסומות מ-לוח זמנים',
    ]);
  });

  it('שרשרת: הודעה צריכה איש-קשר ⇒ שני מנועים, אנשי-הקשר קודם', () => {
    const [r] = findRoutes({ parts: BOX, start: [], goalPlugs: ['message.text'] });
    expect(r.steps.map((s) => s.add)).toEqual(['contacts', 'wa']);
    expect(r.steps[1].links).toEqual(
      expect.arrayContaining([{ giver: 'contacts', plug: 'person', needer: 'wa' }]),
    );
  });

  it('מנוע-התחלה שחיכה לתקע — מקבל חיבור מהמנוע החדש ("ושם")', () => {
    const parts = [part('a', ['x'], ['y']), part('b', ['y'])];
    const [r] = findRoutes({ parts, start: ['a'], goalPlugs: ['y'] });
    expect(r.links).toEqual([
      { giver: 'b', plug: 'y', needer: GOAL },
      { giver: 'b', plug: 'y', needer: 'a' },
    ]);
  });
});

describe('findRoutes — הקצר ראשון', () => {
  const parts = [
    part('combo', ['x', 'y']),
    part('onlyx', ['x']),
    part('onlyy', ['y']),
    part('needy', ['x'], ['z']),
    part('zgiver', ['z']),
  ];
  it('מנוע אחד לפני שניים; מיותר לא מוצע; פחות חיבורים לפני יותר', () => {
    const r = findRoutes({ parts, start: [], goalPlugs: ['x', 'y'], maxRoutes: 10 });
    expect(r[0].steps.map((s) => s.add)).toEqual(['combo']);
    const sets = r.map((x) => x.steps.map((s) => s.add).sort().join('+'));
    expect(sets).toEqual(['combo', 'onlyx+onlyy', 'needy+onlyy+zgiver']);
    // אף מסלול הוא לא הרחבה של מסלול קצר יותר (combo+onlyx מיותר)
    expect(sets).not.toContain('combo+onlyx');
    for (let i = 1; i < r.length; i++) expect(r[i].addedCount).toBeGreaterThanOrEqual(r[i - 1].addedCount);
  });

  it('maxRoutes ו-maxDepth חוסמים', () => {
    expect(findRoutes({ parts, start: [], goalPlugs: ['x', 'y'], maxRoutes: 1 })).toHaveLength(1);
    const r = findRoutes({ parts, start: [], goalPlugs: ['x', 'y'], maxDepth: 2, maxRoutes: 10 });
    expect(r.map((x) => x.addedCount)).toEqual([1, 2]);
    expect(findRoutes({ parts, start: [], goalPlugs: ['x', 'y'], maxDepth: 0 })).toEqual([]);
  });

  it('בתיקו על מספר מנועים — פחות חיבורים קודם, ואז לפי מזהים', () => {
    const p2 = [part('b', ['x'], ['q']), part('qq', ['q']), part('c', ['x']), part('a', ['x'])];
    const r = findRoutes({ parts: p2, start: ['qq'], goalPlugs: ['x'], maxRoutes: 10 });
    expect(r.map((x) => x.steps[0].add)).toEqual(['a', 'c', 'b']);
  });
});

describe('findRoutes — מנוע חסר', () => {
  it('יעד שאין לו נותן בכל הארגז ⇒ תשובה אחת שאומרת מה חסר', () => {
    const r = findRoutes({ parts: BOX, start: ['hosting'], goalPlugs: ['booking', 'emergency', 'pro.match'] });
    expect(r).toEqual([{ steps: [], links: [], missing: ['emergency', 'pro.match'], addedCount: 0 }]);
    expect(routeText(r[0], nameOf)).toEqual(['חסר מנוע שנותן חירום', 'חסר מנוע שנותן התאמת בעל מקצוע']);
  });

  it('חסר באמצע הדרך ⇒ המסלול מוצג ואומר בדיוק מה לבנות; מסלול שלם קודם לו', () => {
    const parts = [part('line', ['voice.menu'], ['pro.match']), part('ivr', ['voice.menu'], ['times.blocked', 'booking'])];
    const r = findRoutes({ parts, start: [], goalPlugs: ['voice.menu'] });
    expect(r).toHaveLength(2);
    // פחות חסרים קודם: line חסר רק בעל-מקצוע; ivr חסר שניים
    expect(r[0].missing).toEqual(['pro.match']);
    expect(r[1].missing).toEqual(['booking', 'times.blocked']);
    expect(routeText(r[0], (id) => id)).toEqual(['הוסף את line וחבר אותו ל-התוצאה שביקשת', 'חסר מנוע שנותן התאמת בעל מקצוע']);
    // ועם נותן אמיתי — השלם עוקף את החסרים
    const full = findRoutes({ parts: [...parts, part('pros', ['pro.match'])], start: [], goalPlugs: ['voice.menu'] });
    expect(full[0].missing).toEqual([]);
    expect(full[0].steps.map((s) => s.add)).toEqual(['pros', 'line']);
  });

  it('מזהה-התחלה זר — מתעלמים', () => {
    expect(findRoutes({ parts: BOX, start: ['nope'], goalPlugs: ['person'] })[0].steps.map((s) => s.add)).toEqual([
      'contacts',
    ]);
  });
});

describe('findRoutes — מעגלים ודטרמיניזם', () => {
  it('שני מנועים שצריכים זה את זה ⇒ נגמר, ומחבר את שניהם', () => {
    const parts = [part('a', ['x'], ['y']), part('b', ['y'], ['x'])];
    const r = findRoutes({ parts, start: [], goalPlugs: ['x'] });
    expect(r).toHaveLength(1);
    expect(r[0].steps.map((s) => s.add)).toEqual(['a', 'b']);
    expect(r[0].links).toEqual(
      expect.arrayContaining([
        { giver: 'b', plug: 'y', needer: 'a' },
        { giver: 'a', plug: 'x', needer: 'b' },
      ]),
    );
  });

  it('מעגל עצמי ומעגל בלי יציאה ⇒ לא נתקע', () => {
    const parts = [part('self', ['x'], ['x']), part('loop1', ['p'], ['q']), part('loop2', ['q'], ['p'])];
    expect(findRoutes({ parts, start: [], goalPlugs: ['x'] })[0].steps.map((s) => s.add)).toEqual(['self']);
    expect(findRoutes({ parts, start: [], goalPlugs: ['p', 'x'] })[0].addedCount).toBe(3);
  });

  it('אותו קלט בסדר אחר ⇒ אותה תשובה', () => {
    const a = findRoutes({ parts: BOX, start: ['hosting'], goalPlugs: ['voice.menu', 'payment.link', 'message.text'] });
    const b = findRoutes({
      parts: [...BOX].reverse(),
      start: ['hosting'],
      goalPlugs: ['message.text', 'voice.menu', 'payment.link'],
    });
    expect(b).toEqual(a);
    expect(JSON.stringify(a)).toBe(JSON.stringify(findRoutes({ parts: BOX, start: ['hosting'], goalPlugs: ['voice.menu', 'payment.link', 'message.text'] })));
  });
});

describe('findRoutes — ביצועים', () => {
  /** מחולל פסאודו-אקראי עם זרע (בלי Math.random — בדיקה יציבה). */
  const rng = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const big = (seed: number): RoutePart[] => {
    const r = rng(seed);
    const pick = () => PLUG_IDS[Math.floor(r() * 20) % PLUG_IDS.length] + (r() < 0.2 ? '.x' : '');
    const plugs20 = (n: number) => Array.from({ length: n }, pick);
    return Array.from({ length: 300 }, (_, i) =>
      part('p' + String(i).padStart(3, '0'), plugs20(1 + Math.floor(r() * 3)), plugs20(Math.floor(r() * 3))),
    );
  };

  /** חציון של 5 ריצות (אחרי חימום JIT) — עמיד לרעש של הרצה מקבילית ב-CI. */
  const medianMs = (run: () => unknown): number => {
    run();
    const times: number[] = [];
    for (let k = 0; k < 5; k++) {
      const t0 = performance.now();
      run();
      times.push(performance.now() - t0);
    }
    return times.sort((a, b) => a - b)[2];
  };

  it('המקרה הקשה: כל מנוע צריך 1–2 תקעים, המסלולים הקצרים באורך 4 — עדיין מתחת ל-50ms', () => {
    const r = rng(13);
    const P = Array.from({ length: 20 }, (_, i) => PLUG_IDS[i % 16] + (i >= 16 ? '.y' : ''));
    const pick = () => P[Math.floor(r() * 20)];
    const some = () => Array.from({ length: 1 + Math.floor(r() * 2) }, pick);
    const parts = Array.from({ length: 300 }, (_, i) => part('p' + i, some(), some()));
    const goalPlugs = ['voice.menu', 'booking', 'times.shabbat', 'reminder'];
    const res = findRoutes({ parts, start: [], goalPlugs });
    expect(res.map((x) => x.addedCount)).toEqual([4, 4, 4, 4, 4]);
    expect(medianMs(() => findRoutes({ parts, start: [], goalPlugs }))).toBeLessThan(50);
  });

  it('300 מנועים × 20 תקעים — מתחת ל-50ms (גם כשהמטרה קשה)', () => {
    for (const seed of [1, 7, 42]) {
      const parts = big(seed);
      const goals = [
        ['voice.menu', 'booking', 'times.shabbat'],
        ['day.summary', 'payment.link', 'reminder', 'person'],
        ['emergency.x', 'pro.match.x', 'print.page.x'],
      ];
      for (const goalPlugs of goals) {
        const r = findRoutes({ parts, start: ['p000', 'p001'], goalPlugs });
        expect(medianMs(() => findRoutes({ parts, start: ['p000', 'p001'], goalPlugs }))).toBeLessThan(50);
        expect(r.length).toBeGreaterThan(0);
        expect(r.length).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('goalFromText — מילון', () => {
  const plugsOf = (s: string) => goalFromText(s).plugs;

  it('כל תקע במילון הוא תקע מהתקן, ולכל תקע יש מילים', () => {
    expect(Object.keys(GOAL_LEXICON).sort()).toEqual([...PLUG_IDS].sort());
    for (const id of PLUG_IDS) expect(GOAL_LEXICON[id].length).toBeGreaterThan(0);
  });

  it.each([
    ['אפשר לחייג ולשמוע את הזמנים', ['voice.menu']],
    ['שיהיה קו שאפשר להתקשר אליו', ['voice.menu']],
    ['מתי הדלקת נרות השבוע', ['times.shabbat']],
    ['לראות אם יש מקום פנוי בצימר', ['availability']],
    ['הזמנות לחגים', ['booking']],
    ['למצוא אינסטלטור או חשמלאי', ['pro.match']],
    ['צריך בעל מקצוע לנזילה', ['pro.match']],
    ['שהאורחים יוכלו לשלם מראש', ['payment.link']],
    ['קישור לתשלום בוואטסאפ', ['payment.link', 'message.text']],
    ['שישלחו תזכורות לפני', ['reminder']],
    ['להזכיר לכולם', ['reminder']],
    ['להציג תאריך עברי', ['date.hebrew']],
    ['מספר לחירום', ['emergency']],
    ['להדפיס חוברת לבית הכנסת', ['print.page']],
    ['רשימת המניינים והתפילות', ['times.prayers']],
    ['והמנין של שחרית', ['times.prayers']],
    ['שהעסק סגור בשבת', ['times.blocked']],
    ['סיכום יומי בבוקר', ['day.summary']],
    ['לשמור אנשי קשר', ['person']],
  ])('"%s"', (sentence, plugs) => {
    expect(plugsOf(sentence)).toEqual(plugs);
  });

  it('תחיליות מצורפות ("ומהטלפון", "וכשההודעה") ורבים ("הודעות", "תזכורות")', () => {
    expect(plugsOf('ומהטלפון')).toEqual(['voice.menu']);
    expect(plugsOf('וכשההודעה מגיעה')).toEqual(['message.text']);
    expect(plugsOf('הודעות ותזכורות')).toEqual(['message.text', 'reminder']);
  });

  it('ביטוי ארוך גובר ולא נספר פעמיים ("סגור בשבת" ≠ זמני שבת)', () => {
    const g = goalFromText('סגור בשבת');
    expect(g.matched).toEqual([{ word: 'סגור בשבת', plug: 'times.blocked' }]);
  });

  it('ניקוד ופיסוק לא מפריעים', () => {
    expect(plugsOf('שַׁבָּת, "תשלום"!')).toEqual(['times.shabbat', 'payment.link']);
  });

  it.each([
    'מה שלומך היום',
    'הילדים הלכו לגן בבוקר',
    'קניתי ספר חדש לאבא',
    'המכונית צריכה טיפול',
    'אני אוהב קפה חם',
    '',
  ])('בלי התאמות-שווא: "%s"', (sentence) => {
    expect(goalFromText(sentence)).toEqual({ plugs: [], matched: [] });
  });
});

describe('routeText — עברית פשוטה', () => {
  it('צעד = "הוסף את X וחבר אותו ל-Y"; מה הוא מקבל ומאיפה', () => {
    const [r] = findRoutes({ parts: BOX, start: ['hosting'], goalPlugs: ['payment.link'] });
    expect(routeText(r, nameOf)).toEqual([
      'הוסף את תשלומים וחבר אותו ל-התוצאה שביקשת',
      'תשלומים מקבל הזמנה מ-אירוח משפחתי',
    ]);
  });
});

describe('rankByRecipes — ללמוד מכל הלקוחות', () => {
  const opts = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }];
  it('הנפוץ ראשון; תיקו ⇒ הסדר המקורי; חסר ⇒ 0', () => {
    expect(rankByRecipes(opts, { c: 9, b: 3, d: 3 }).map((o) => o.key)).toEqual(['c', 'b', 'd', 'a']);
    expect(rankByRecipes(opts, {}).map((o) => o.key)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('לא משנה את הקלט; ערך פגום = 0', () => {
    const copy = [...opts];
    rankByRecipes(opts, { a: Number.NaN, d: 1, toString: 5 } as Record<string, number>);
    expect(opts).toEqual(copy);
    expect(rankByRecipes(opts, { a: Number.NaN, d: 1 }).map((o) => o.key)).toEqual(['d', 'a', 'b', 'c']);
  });
});
