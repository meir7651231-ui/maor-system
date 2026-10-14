/**
 * ✅ המאמת (ATOMS-VERIFY, 14.10.2026) — "למה אתה לא בונה מנוע מפרק, מנוע שמחבר ומנוע שמאמת?"
 *
 * ננעל:
 *   · כל אחד משמונת החלקים עומד בכל החוקים שלו על 2,000 קלטים אקראיים (זרע קבוע ⇒ אותם קלטים בכל ריצה).
 *   · כל חיבור עם תצוגה, וכל מנוע בנוי-על-מנוע (שרשראות עד 3 דורות), עובר על DB-הבדיקה ועל 50 ארגונים אקראיים:
 *     לא זורק · בלי NaN/undefined · עד 6 שורות · בלי מילים טכניות · בלי שמות/טלפונים/מיילים/ת״ז · המספרים עקביים.
 *   · המכווץ מחזיר את הקלט הקטן ביותר; הסיכום לחותמת "✅ מאומת".
 *   · ratchet לכל באג שהמאמת מצא (עם התיאור בעברית) — אותם באגים לא חוזרים.
 *   · הגנות-מקור: בלי Math.random/Date.now במאמת, ואף קובץ של האפליקציה לא מייבא אותו (לא נכנס לבנדל).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ATOM_IDS, capabilityId, type AtomId, type Capability } from '../contract';
import { divideAmount } from '../parts/divide';
import { roundTo } from '../parts/round';
import { turnoverSpan } from '../engines/bookingsData';
import { childCapability } from '../chain';
import { previewOf } from '../preview';
import { HONEST_NULLS } from '../previewBookingsMore';
import { ATOM_LAWS } from '../verify/laws';
import { connectionTargets, isVerified, privacyLeak, secretsOf, shrinkWith, verifyAtoms, verifyConnections, verifySummary } from '../verify/run';
import { randomOrgDb, rng } from '../verify/gen';
import { ctxOf, PV, QUIET_WORDS, RAW_TEXTS, REQUESTERS, richDb } from './previewsFixture';
import lawsSrc from '../verify/laws.ts?raw';
import genSrc from '../verify/gen.ts?raw';
import runSrc from '../verify/run.ts?raw';

/** DB-הבדיקה של ratchet-הכיסוי: + יתרה ₪1,200 בהזמנה הצמודה של לוי. */
function testDb() {
  const db = richDb();
  db.hostBookings = db.hostBookings.map((b) => (b.id === 'hb9' ? { ...b, charges: [{ id: 'c1', kind: 'stay' as const, label: 'לינה', amount: 1200 }] } : b));
  return db;
}
const STAFF = (id: string, name: string, role: string) => ({ id, kind: 'staff' as const, name, role, phone: '050-7777777', createdAt: 'x', updatedAt: 'x' });

describe('✅ המאמת · שמונת החלקים', () => {
  const report = verifyAtoms({ n: 2000 });

  it.each(ATOM_IDS.map((a) => [a]))('%s — 2,000 קלטים אקראיים, כל החוקים', (atom) => {
    const r = report[atom as AtomId];
    expect(r.cases).toBe(2000);
    // נכשל? הדוגמה הנגדית המכווצת מודפסת כאן
    expect(r.counterexample, JSON.stringify(r.counterexample)).toBeNull();
    expect(r.passed).toBe(2000);
    expect(r.checks).toBeGreaterThanOrEqual(2000);
  });

  it('לכל חלק יש חוקים, עם מזהה ומשפט בעברית; כל קלט שכל חלק מקבל מכוסה בחוק', () => {
    for (const a of ATOM_IDS) expect(ATOM_LAWS.filter((l) => l.atom === a).length, a).toBeGreaterThanOrEqual(3);
    for (const l of ATOM_LAWS) {
      expect(l.says).toMatch(/[א-ת]/);
      expect(l.id.startsWith(l.atom + '.')).toBe(true);
    }
    expect(new Set(ATOM_LAWS.map((l) => l.id)).size).toBe(ATOM_LAWS.length);
  });

  it('דטרמיניסטי: אותו זרע ⇒ אותו דוח; זרע אחר ⇒ קלטים אחרים (וגם הם עוברים)', () => {
    expect(verifyAtoms({ n: 200, seed: 7 })).toEqual(verifyAtoms({ n: 200, seed: 7 }));
    const other = verifyAtoms({ n: 300, seed: 99 });
    for (const a of ATOM_IDS) expect(other[a].passed, a).toBe(300);
  });
});

describe('✅ המאמת · המכווץ', () => {
  it('מכווץ לקלט הקטן ביותר שעדיין נכשל', () => {
    const big = { k: 'merge' as const, items: [true, false, true, true, false, false, true, true, true, false, true], maxGap: 500, minLength: 7 };
    const s = shrinkWith(big, (i) => (i.k === 'merge' && i.maxGap > 10 && i.items.length >= 3 ? 'נכשל' : null));
    expect(s.input).toMatchObject({ k: 'merge', maxGap: 11, minLength: 0 });
    expect((s.input as { items: boolean[] }).items.length).toBe(3);
    expect(s.steps).toBeGreaterThan(0);
  });

  it('קלט לא-תקין (צעד 0) לא נבחר כדוגמה נגדית', () => {
    const s = shrinkWith({ k: 'round', value: 37, step: 5, dir: 'down' }, () => 'תמיד');
    expect(s.input).toMatchObject({ k: 'round', step: 1, value: 0 });
  });
});

describe('✅ המאמת · החיבורים (DB-הבדיקה + 50 ארגונים אקראיים)', () => {
  const ctx = ctxOf(testDb());
  const report = verifyConnections(ctx, { dbs: 50, paramSets: 1, chainParamSets: 0, secrets: { names: [...REQUESTERS, ...QUIET_WORDS], texts: RAW_TEXTS } });
  const targets = connectionTargets();

  it('מכסה את כל החיבורים עם תצוגה (41) ואת כל השרשראות (עד 3 דורות)', () => {
    const direct = targets.filter((t) => !t.caps.length);
    expect(direct.length).toBe(41);
    expect(direct.some((t) => t.key in HONEST_NULLS)).toBe(false);
    expect(targets.length).toBeGreaterThan(41);
    for (const t of targets) expect(report[t.key], t.key).toBeDefined();
  });

  it.each(Object.keys(report).map((k) => [k]))('%s', (key) => {
    const r = report[key];
    expect(r.evals).toBe(key.includes('>') ? 51 : 51 * 2);
    expect(r.failures, JSON.stringify(r.failures, null, 1)).toEqual([]);
    expect(r.passed).toBe(r.checks);
    // באמת נבדק משהו: התצוגה הופיעה ברוב העולמות
    expect(r.shown, key).toBeGreaterThan(r.evals / 3);
  });

  it('על DB-הבדיקה האמיתי — כל חיבור ישיר מראה תוצאה (לא null)', () => {
    for (const t of targets.filter((x) => !x.caps.length)) expect(previewOf(t.cap, ctx), t.key).not.toBeNull();
  });

  it('הסיכום לחותמת "✅ מאומת"', () => {
    const s = verifySummary(verifyAtoms({ n: 100 }), report);
    expect(Object.keys(s.atoms)).toEqual([...ATOM_IDS]);
    expect(s.connections['bookings.balance:divide'].checks).toBeGreaterThan(0);
    expect(isVerified('bookings.balance:divide', s)).toBe(true);
    expect(isVerified('bookings:bookings.turnover:divide>merge', s)).toBe(true);
    expect(isVerified('bookings.guests:fuzzy', s)).toBe(false); // HONEST_NULLS — אין מה לאמת
    const broken = { ...s, atoms: { ...s.atoms, divide: { cases: 100, passed: 99 } } };
    expect(isVerified('bookings.balance:divide', broken)).toBe(false);
  });
});

describe('✅ המאמת · פרטיות', () => {
  it('הכלל: שם מלא, טלפון, מייל, ת״ז וטקסט-בקשה — נתפסים; שמות-צוות ועסקים — לא', () => {
    const sec = { names: ['משפחת לוי', 'קורנבליט'], phones: ['050-1234567'], emails: ['a@b.co'], texts: ['צריך אינסטלטור דחוף מאוד'] };
    expect(privacyLeak('תקלה · משפחת לוי דיווחו', sec)).toMatch(/שם/);
    expect(privacyLeak('אצל וקורנבליט', sec)).toMatch(/שם/);
    expect(privacyLeak('התקשרו 052-7654321', sec)).toMatch(/טלפון/);
    expect(privacyLeak('כתבו ל-x@y.org', sec)).toMatch(/מייל/);
    expect(privacyLeak('ת״ז 123456789', sec)).toMatch(/9 ספרות/);
    expect(privacyLeak('צריך אינסטלטור דחוף מאוד', sec)).toMatch(/טקסט/);
    expect(privacyLeak('11:00–11:20 · דנה · אינסטלציה גולדשטיין · ₪1,234,567.5 = 12 × ₪102,880', sec)).toBeNull();
    expect(privacyLeak('קורנבליטים', sec)).toBeNull(); // מילה שלמה בלבד
  });

  it('secretsOf אוסף את האורחים, המבקשים, התורמים והמשפחות של כל DB', () => {
    const s = secretsOf(testDb());
    expect(s.names).toEqual(expect.arrayContaining(['משפחת לוי', 'משפחת כהן', 'יעקב לוי', 'שמעון סודי']));
    expect(s.phones).toEqual(expect.arrayContaining(['050-1234567', '053-9999999']));
  });

  it('הארגון האקראי באמת מכיל סודות — ושום תצוגה לא מראה אותם', () => {
    const w = randomOrgDb(testDb(), 12345);
    expect(w.secrets.names.length).toBeGreaterThan(0);
    expect(w.secrets.texts.length + w.secrets.phones.length).toBeGreaterThan(0);
    // תיאור-תקלה עם שם אורח וטלפון — מה שהיה דולף (ratchet למטה)
    const leaky = [1, 2, 3, 4, 5].map((k) => randomOrgDb(testDb(), k).db.hostRecords.filter((r) => r.kind === 'fault' && /דיווחו/.test((r as { desc: string }).desc)).length);
    expect(leaky.some((n) => n > 0)).toBe(true);
  });
});

describe('🔒 ratchet — הבאגים שהמאמת מצא', () => {
  it('✂️ באג: חלוקת סכום עם אגורות איבדה את האגורות (₪1,234.5 ב-12 ⇒ 113 + 11 × 102 = 1,235)', () => {
    const xs = divideAmount(1234.5, 12);
    expect(Math.round(xs.reduce((a, b) => a + b, 0) * 100)).toBe(123450);
    expect(xs).toEqual([103.5, 103, 103, 103, 103, 103, 103, 103, 103, 103, 102, 102]);
    expect(divideAmount(0.38, 12).reduce((a, b) => a + b, 0)).toBeCloseTo(0.38, 10);
  });

  it('✂️ באג: "תשלומים שווים" לא היו שווים — כל השארית בתשלום הראשון (₪500 ב-12 ⇒ ₪49 + 11 × ₪41)', () => {
    expect(divideAmount(500, 12)).toEqual([42, 42, 42, 42, 42, 42, 42, 42, 41, 41, 41, 41]);
    expect(PV('whatNeed.adPrice', 'divide')!.lines[0]).toBe('גני ילדים (שולם) · ₪500 = 8 × ₪42 + 4 × ₪41');
    expect(PV('whatNeed.adPrice', 'divide')!.lines[2]).toBe('ספרי אור · ₪1,234.5 = ₪103.5 + 9 × ₪103 + 2 × ₪102');
  });

  it('🎯 באג: עיגול לאגורות/חצאי-שקל ירד יחידה שלמה (0.3 ⇒ 0.2) ועיגול-פעמיים השתנה (₪351.15 ⇒ ₪351.10)', () => {
    expect(roundTo(0.3, 0.1, 'down')).toBe(0.3);
    expect(roundTo(1.15, 0.05, 'down')).toBe(1.15);
    expect(roundTo(0.29, 0.01, 'down')).toBe(0.29);
    expect(roundTo(351.15, 0.05, 'down')).toBe(351.15);
    expect(roundTo(roundTo(351.13595913676545, 0.05, 'up'), 0.05, 'down')).toBe(351.15);
    // צעד 1 — בדיוק Math.floor של המקור (השקילות למנוע הזמנים לא זזה)
    expect(roundTo(299.9999999999, 1, 'down')).toBe(299);
  });

  it('📣🔄 באג פרטיות: תיאור-תקלה חופשי ("משפחת לוי דיווחו…, טלפון…") הוצג בהעברה הלאה ובתורות — עכשיו רק התחום', () => {
    const db = testDb();
    db.hostRecords = [...db.hostRecords, STAFF('hs7', 'יוסי', 'תחזוקה'), STAFF('hs8', 'מוטי', 'טכנאי')];
    for (const [atom, params] of [['escalate', {}], ['rotate', { by: 'item' }]] as const) {
      const pv = PV('bookings.faults', atom, params, ctxOf(db))!;
      const text = pv.lines.join('\n');
      expect(text, atom).not.toMatch(/משפחת לוי|דיווחו|נזילה בכיור|ריח גז/);
      expect(text, atom).toMatch(/חשמל · צימר הגפן/);
      expect(privacyLeak(text, secretsOf(db)), atom).toBeNull();
    }
  });

  it('✂️ באג: שעת כניסה לפני שעת עזיבה ⇒ 12 תורים של "12:00–12:00" — עכשיו משפט כן, ושרשרת עליו ריקה', () => {
    const db = testDb();
    db.ui = { ...db.ui, hosting: { ...db.ui.hosting, checkout: '12:00', checkin: '09:00' } };
    const pv = PV('bookings.turnover', 'divide', {}, ctxOf(db))!;
    expect(pv.title).toBe('חלון הניקיון');
    expect(pv.lines).toEqual(['שעת הכניסה בהגדרות (09:00) לא אחרי שעת העזיבה (12:00) — אין זמן לניקיון ביניהן, ולכן אין תורים. כדאי לבדוק את השעות בהגדרות האירוח.']);
    const root: Capability = { id: capabilityId('bookings', 'bookings.turnover', 'divide'), engine: 'bookings', place: 'bookings.turnover', atom: 'divide', params: {}, name: 'x' };
    const child = childCapability(root, 'out:' + root.id, 'merge', {}, 'y');
    expect(previewOf(child, { ...ctxOf(db), caps: [root] })).toBeNull();
  });

  it('🔄 באג: שני אנשי צוות בלי שם (או עם אותו שם) הוצגו זהים — "היום ⇒ משק בית · מחר ⇒ משק בית" — עכשיו ממוספרים', () => {
    const db = testDb();
    db.hostRecords = [...db.hostRecords, STAFF('hs7', '', 'משק בית'), STAFF('hs8', '', 'משק בית')];
    const pv = PV('bookings.cleaning', 'rotate', { by: 'day' }, ctxOf(db))!;
    expect(pv.title).toBe('בתורות לפי יום · 2 בתור');
    const who = pv.lines.map((l) => l.split(' ⇒ ')[1]);
    expect(new Set(who.slice(0, 2)).size).toBe(2);
    expect(who.every((w) => /^משק בית [12]$/.test(w))).toBe(true);
    expect(who[2]).toBe(who[0]);
    // שמות שונים — בלי מספרים (ביט-זהה למה שהיה)
    const two = testDb();
    two.hostRecords = [...two.hostRecords, STAFF('hs1', 'דנה', 'ניקיון'), STAFF('hs2', 'רבקה', 'ניקיון')];
    expect(PV('bookings.turnover', 'divide', { by: 'size', size: 120 }, ctxOf(two))!.lines).toEqual(['11:00–13:00 · דנה', '13:00–15:00 · רבקה']);
  });

  it('✂️ באג: שעה פגומה בהגדרות ("25:00") — הכותרת הראתה 25:00 והתורים התחילו ב-11:00', () => {
    const db = testDb();
    db.ui = { ...db.ui, hosting: { ...db.ui.hosting, checkout: '25:00', checkin: 'xx' } };
    expect(turnoverSpan(db)).toEqual({ from: 660, to: 900, fromHm: '11:00', toHm: '15:00' });
    expect(PV('bookings.turnover', 'divide', {}, ctxOf(db))!.title).toBe('חלון הניקיון 11:00–15:00 · 12 תורים');
  });
});

describe('✅ המאמת · טוהר ומשקל (הגנות-מקור)', () => {
  it('בלי Math.random / Date.now / new Date() — הכול מזרע ומ-nowMs', () => {
    for (const [name, src] of [['laws', lawsSrc], ['gen', genSrc], ['run', runSrc]] as const) {
      expect(src, name).not.toMatch(/Math\.random\s*\(/);
      expect(src, name).not.toMatch(/Date\.now\s*\(/);
      expect(src, name).not.toMatch(/new Date\(\s*\)/);
    }
  });

  it('אף קובץ של האפליקציה לא מייבא את המאמת (הוא לא נכנס לבנדל)', () => {
    // fs ולא import.meta.glob: קריאת כל עץ-המקור דרך vite מוסיפה ~4 שניות לקובץ
    const root = resolve(__dirname, '../../..');
    const users: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name !== '__tests__' && e.name !== 'node_modules' && f !== join(root, 'lib/atoms/verify')) walk(f);
        } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && /from ['"][^'"]*\/verify\/(laws|gen|run)['"]/.test(readFileSync(f, 'utf8'))) users.push(f);
      }
    };
    walk(root);
    expect(users).toEqual([]);
    expect(root.endsWith('src')).toBe(true);
  });

  it('זרע ⇒ אותו ארגון אקראי', () => {
    expect(randomOrgDb(testDb(), 42)).toEqual(randomOrgDb(testDb(), 42));
    expect(randomOrgDb(testDb(), 42)).not.toEqual(randomOrgDb(testDb(), 43));
    const a = rng(1);
    const b = rng(1);
    expect([a.next(), a.int(0, 9), a.pick(['x', 'y'])]).toEqual([b.next(), b.int(0, 9), b.pick(['x', 'y'])]);
  });
});
