/**
 * 🏭 ratchet — המפעל (ATOMS-FACTORY, 14.10.2026): מפרק ⇒ מחבר ⇒ מאמת ⇒ רק מה שעבר נכנס לארגז.
 *
 *  · הרישום: מנוע שנמצא אוטומטית מוכר ל-engineCard/placeById (כרטיס-היד לא נדרס), אידמפוטנטי.
 *  · (ב) מחבר: כל מקום × חלק מהסוג, ושרשראות — גם על מחשבון הזמנים, "מה צריך?" והמקומות שנמצאו (סגירת הפער של C).
 *  · (ג) מאמת: החיבורים שנמצאו עוברים בסיס/פרטיות/עקביות/דטרמיניזם/צנעה על הדמו ועולמות מטולטלים.
 *  · (ד) הסיכום: verified.ts — רק מפתחות אמיתיים, בלי HONEST_NULLS; 💝 התורמים ו-🎨 החוגים בפנים.
 *  · 🎯 "להתחיל מהסוף" על מנוע שנמצא: "לחלק את סכומי התרומות ל-12 תשלומים" ⇒ התורמים, עם תוצאה אמיתית.
 *  · הבאגים שהמפעל מצא (✂️ סכום ענק מעבר לתקרת-החלקים) — ratchet.
 *  · השער: prebuild כותב, verify ו-CI בודקים (`--check`).
 */
import { describe, expect, it } from 'vitest';
import pkg from '../../../../package.json';
import ciYml from '../../../../.github/workflows/ci.yml?raw';
import { GENERATED_ENGINES } from '../engines/generated';
import { GENERATED_IDS } from '../engines/generated/lazy';
import { VERIFIED, VERIFIED_ENGINES } from '../engines/generated/verified';
import { ENGINE_CARDS, engineCard, placeById } from '../engines';
import { genPlace, generatedCards, isGeneratedEngine, registerGenerated } from '../engines/registry';
import { capabilityId, type Capability } from '../contract';
import { childId, outputPlaces, rootValueOf, valueOf } from '../chain';
import { previewOf } from '../preview';
import { answerGoal, readGoal, generatedPlaceWords } from '../goal';
import { genericPreviewOf } from '../decompose/genericPreview';
import { HONEST_NULLS } from '../previewBookingsMore';
import { connectionTargets, privacyLeak, secretsOf, verifyConnections } from '../verify/run';
import { perturbDb } from '../verify/perturb';
import { genericConsistency } from '../verify/generic';
import { renderVerified, type FactoryResult } from '../verify/factory';
import { DEMO_DB, DEMO_NOW } from '../decompose/__tests__/meterFixture';
import { ctxOf, richDb, NOW_MS } from './previewsFixture';
import { atomsSource } from '../../../components/enginebox/atoms/source';
import { NUM_RUN } from '../../../components/enginebox/atoms/AtomSteps';

registerGenerated(GENERATED_ENGINES);
const DEMO = { db: DEMO_DB, nowMs: DEMO_NOW };
const SUP_AMOUNT = 'supporters.supporters.donations[].amount';

describe('🏭 הרישום', () => {
  it('מנוע שנמצא מוכר ל-engineCard/placeById; כרטיס-היד לא נדרס; אידמפוטנטי', () => {
    expect(engineCard('supporters')?.emoji).toBe('💝');
    expect(placeById(SUP_AMOUNT)?.kind).toBe('amount');
    expect(engineCard('bookings')).toBe(ENGINE_CARDS[2]);
    const n = generatedCards().length;
    registerGenerated(GENERATED_ENGINES);
    expect(generatedCards().length).toBe(n);
    expect(isGeneratedEngine('supporters')).toBe(true);
    expect(isGeneratedEngine('bookings')).toBe(false);
  });
});

describe('🏭 (ב) מחבר — גם השרשראות של מחשבון הזמנים, "מה צריך?" והמקומות שנמצאו', () => {
  const ctx = ctxOf(richDb());
  const cap = (engine: string, place: string, atom: Capability['atom'], params = {}): Capability => ({ id: capabilityId(engine, place, atom), engine: engine as Capability['engine'], place, atom, params, name: 'x' });
  const child = (parent: Capability, atom: Capability['atom'], params = {}): Capability => ({ id: childId(parent.id, atom), engine: parent.engine, place: 'out:' + parent.id, atom, params, name: 'y', parent: parent.id });

  it('מנוע שנוצר ממחשבון הזמנים — אפשר לבנות עליו, עם תוצאה משורשרת אמיתית', () => {
    const next = cap('zmanim', 'zmanim.times', 'next', { count: 3 });
    expect(valueOf(next.id)).toBe('moments');
    expect(outputPlaces(next).map((p) => Object.keys(p.results)).flat()).toEqual(expect.arrayContaining(['offset', 'round', 'next']));
    const remind = child(next, 'offset', { minutes: -15 });
    const pv = previewOf(remind, { ...ctx, caps: [next] });
    expect(pv?.title).toBe('תזכורת 15 דקות לפני');
    expect(pv!.lines.length).toBe(3);
    for (const l of pv!.lines) expect(l).toMatch(/ · זמן \d+\/\d+ \d{2}:\d{2} ⇒ תזכורת \d+\/\d+ \d{2}:\d{2}$/);
    const day = cap('zmanim', 'zmanim.day', 'divide');
    const nextHour = previewOf(child(day, 'next'), { ...ctx, caps: [day] });
    expect(nextHour?.title).toBe('התור הבא');
  });

  it('"מה צריך?" — העסק הבא שנפתח ⇒ תזכורת לפניו', () => {
    const open = cap('whatNeed', 'whatNeed.openings', 'next');
    const pv = previewOf(child(open, 'offset'), { ...ctx, caps: [open] });
    expect(pv?.lines[0]).toMatch(/פתיחה .* ⇒ תזכורת /);
  });

  it('🔄 על תורים — רק במנהל ההזמנות (בלי אנשי ניקיון לא נותנים בתורות)', () => {
    expect(rootValueOf('zmanim.day', 'divide')).toBe('slots');
    expect(valueOf(childId(capabilityId('zmanim', 'zmanim.day', 'divide'), 'rotate'))).toBeNull();
    expect(valueOf(childId(capabilityId('bookings', 'bookings.turnover', 'divide'), 'rotate'))).toBe('assigned');
  });

  it('💝 תשלומים שנוצרו מהתרומות ⇒ "בנה עליו" — מי גובה כל תשלום, בתורות (תוויות-צוות, בלי שמות)', () => {
    const split = cap('supporters', SUP_AMOUNT, 'divide', { parts: 3 });
    expect(rootValueOf(SUP_AMOUNT, 'divide')).toBe('pieces');
    expect(outputPlaces(split)[0]?.results.rotate).toBeTruthy();
    const pv = previewOf(child(split, 'rotate', { by: 'item' }), { db: DEMO_DB, nowMs: DEMO_NOW, caps: [split] });
    expect(pv?.lines).toEqual([expect.stringMatching(/^תשלום 1 · ₪[\d,.]+ ⇒ איש צוות א׳$/), expect.stringMatching(/⇒ איש צוות ב׳$/), expect.stringMatching(/⇒ איש צוות ג׳$/)]);
  });

  it('מקום-זמנים שנמצא ⇒ ⏭️ ואז ⏱️: תזכורת למועד הבא (09:00 + ההזזה)', () => {
    const next = cap('supporters', 'supporters.supporters.nextDate', 'next');
    expect(genPlace(next.place)?.kind).toBe('times');
    const pv = previewOf(child(next, 'offset', { minutes: -60 }), { db: DEMO_DB, nowMs: DEMO_NOW, caps: [next] });
    expect(pv?.lines[0]).toMatch(/^מועד הקשר הבא · מועד \d+\/\d+ 09:00 ⇒ תזכורת \d+\/\d+ 08:00$/);
  });

  it('connectionTargets — יד + שנמצאו + שרשראות שלהם; בלי HONEST_NULLS', () => {
    const t = connectionTargets();
    expect(t.filter((x) => !x.gen && !x.caps.length).length).toBe(41);
    expect(t.some((x) => x.key === SUP_AMOUNT + ':divide' && x.gen)).toBe(true);
    expect(t.some((x) => x.key.startsWith('zmanim:zmanim.times:next>'))).toBe(true);
    for (const k of Object.keys(HONEST_NULLS)) expect(t.some((x) => x.key === k)).toBe(false);
  });
});

describe('🏭 (ג) מאמת — החיבורים שנמצאו, על הדמו ועולמות מטולטלים', () => {
  it('המחולל הכללי מטלטל כל אוסף, ורושם כל שם/טלפון/טקסט פרטי כסוד; דטרמיניסטי', () => {
    const a = perturbDb(DEMO_DB, DEMO_NOW, 7);
    const b = perturbDb(DEMO_DB, DEMO_NOW, 7);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.secrets.names.length).toBeGreaterThan(5);
    expect(a.secrets.phones.length).toBeGreaterThan(5);
    const sup = (a.db.supporters ?? []).find((s) => typeof s.name === 'string' && a.secrets.names.includes(s.name));
    expect(sup).toBeTruthy();
  });

  it('secretsOf — גם בני-משפחה, מורים, מתנדבים והערות-בריאות', () => {
    const s = secretsOf(DEMO_DB);
    const fam = DEMO_DB.families.find((f) => f.members?.length);
    expect(fam).toBeTruthy();
    expect(s.names.some((n) => n.includes(fam!.name.replace(/^משפחת\s+/, '')))).toBe(true);
  });

  it('כל החיבורים הישירים של 💝 ו-🎨 עוברים על הדמו + 3 עולמות מטולטלים (בסיס · פרטיות · עקביות · דטרמיניזם · צנעה)', () => {
    const only = connectionTargets()
      .filter((t) => t.gen && !t.caps.length && (String(t.cap.engine) === 'supporters' || String(t.cap.engine) === 'courses'))
      .map((t) => t.key);
    expect(only.length).toBeGreaterThan(100);
    const rep = verifyConnections(ctxOf(richDb()), { dbs: 2, only, demo: DEMO, demoDbs: 3, genDbs: 1, genParamSets: 1 });
    const bad = Object.entries(rep).filter(([, r]) => r.passed !== r.checks).map(([k, r]) => k + ' — ' + r.failures[0]?.why);
    expect(bad).toEqual([]);
    expect(Object.values(rep).filter((r) => r.shown > 0).length).toBeGreaterThan(30);
  }, 60_000);

  it('מצב-צנעה: מקום של משפחות ⇒ null; אותו מקום בלי צנעה ⇒ תוצאה', () => {
    const fam = generatedCards().find((c) => String(c.id) === 'families')!.places.find((p) => genPlace(p.id)?.personal && p.results.fuzzy)!;
    const c = { place: fam.id, atom: 'fuzzy' as const, params: {} };
    expect(previewOf(c, { db: DEMO_DB, nowMs: DEMO_NOW })).not.toBeNull();
    expect(previewOf(c, { db: DEMO_DB, nowMs: DEMO_NOW, privacyMode: true })).toBeNull();
  });

  it('🐞 באג שהמפעל מצא: ✂️ לפי גודל על סכום ענק עבר את תקרת-החלקים ⇒ "₪902,693.24 = 10000 × ₪45" (לא מסתכם) — עכשיו השורה לא מוצגת', () => {
    const place = genPlace(SUP_AMOUNT)!;
    const db = { supporters: [{ id: 's', donations: [{ date: '2026-01-01', amount: 902693.24 }, { date: '2026-01-02', amount: 900 }] }] };
    const pv = genericPreviewOf(place, 'divide', { by: 'size', size: 45 }, { db, nowMs: NOW_MS })!;
    expect(pv.lines.join('\n')).not.toContain('10000 ×');
    expect(pv.lines).toContain('₪900 = 20 × ₪45');
    expect(genericConsistency(place, 'divide', pv.lines, { by: 'size', size: 45, gap: 0, remainder: 'drop', parts: 12 }, { today: '2026-10-14', nowMin: 600 })).toBeNull();
    expect(genericConsistency(place, 'divide', ['₪902,693.24 = 10000 × ₪45'], { by: 'size', size: 45 }, { today: '2026-10-14', nowMin: 600 })).toMatch(/לא מסתכם/);
  });
});

describe('🏭 (ד) הסיכום — verified.ts', () => {
  const keys = new Set(connectionTargets().map((t) => t.key));
  it('כל מפתח מאומת הוא חיבור אמיתי; בלי HONEST_NULLS; 💝 ו-🎨 בפנים', () => {
    for (const k of Object.keys(VERIFIED)) expect(keys.has(k), k).toBe(true);
    for (const k of Object.keys(HONEST_NULLS)) expect(VERIFIED[k]).toBeUndefined();
    for (const id of VERIFIED_ENGINES) expect(GENERATED_IDS as readonly string[]).toContain(id);
    expect(VERIFIED_ENGINES).toEqual(expect.arrayContaining(['supporters', 'courses']));
    expect(VERIFIED[SUP_AMOUNT + ':divide']).toBeGreaterThan(0);
    expect(VERIFIED['bookings.turnover:divide']).toBeGreaterThan(0);
  });

  it('הקובץ: הכותרת של המפעל, מפתחות ממוינים, דטרמיניסטי', () => {
    const res = { seed: 1, opts: { n: 1, dbs: 1, genDbs: 1, demoDbs: 1 }, atoms: {}, verified: { 'b:x': 2, 'a:y': 3 }, rejected: [], engines: [], totals: { targets: 2, verified: 2, rejected: 0, checks: 5 } } as FactoryResult;
    const t = renderVerified(res);
    expect(t).toContain('נוצר אוטומטית ע״י המפעל');
    expect(t.indexOf('"a:y"')).toBeLessThan(t.indexOf('"b:x"'));
    expect(renderVerified(res)).toBe(t);
  });
});

describe('🏭 הארגז מציג רק מה שאומת', () => {
  const s = atomsSource({ db: DEMO_DB, config: null, nowMs: DEMO_NOW, canEdit: true, create: () => undefined, remove: () => undefined });

  it('הקבוצה "מנועים שנמצאו אוטומטית": 💝 ו-🎨, כל אפשרות מאומתת, עם מספר הבדיקות', () => {
    const found = s.found!();
    const ids = found.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['supporters', 'courses']));
    for (const f of found) {
      expect(f.verified!.checks).toBeGreaterThan(0);
      for (const p of f.card.places) for (const a of Object.keys(p.results)) expect(VERIFIED[p.id + ':' + a], p.id + ':' + a).toBeGreaterThan(0);
    }
    expect(found.find((f) => f.id === 'hosting')?.card.name).toBe('עוד במנהל ההזמנות');
    // "מאיפה" בשפת הלקוח — לא נתיב-הקוד של המפרק
    expect(found.find((f) => f.id === 'supporters')?.card.from).toBe('תורמים');
    for (const f of found) expect(f.card.from).not.toMatch(/src\//);
  });

  it('🐞 "$90,000 = 12 × $7,500" מבודד משמאל-לימין כמו ₪ (היה מתהפך בשורה עברית)', () => {
    expect([...'$90,000 = 12 × $7,500'.matchAll(NUM_RUN)].map((m) => m[0])).toEqual(['$90,000 = 12 × $7,500']);
    expect([...'₪47,500 = 4 × ₪3,959 + 8 × ₪3,958'.matchAll(NUM_RUN)].map((m) => m[0])).toEqual(['₪47,500 = 4 × ₪3,959 + 8 × ₪3,958']);
  });

  it('"✅ מאומת" לאפשרות, ושום אפשרות לא-מאומתת בכרטיסי-היד', () => {
    expect(s.verified!(capabilityId('supporters', SUP_AMOUNT, 'divide'))!.checks).toBe(VERIFIED[SUP_AMOUNT + ':divide']);
    expect(s.verified!(capabilityId('bookings', 'bookings.day', 'divide'))).toBeUndefined();
    expect(s.engines().find((e) => e.id === 'bookings')!.places.some((p) => p.id === 'bookings.day')).toBe(false);
  });

  it('🎯 "לחלק את סכומי התרומות ל-12 תשלומים" ⇒ מנוע התורמים, 12 תשלומים אמיתיים', () => {
    const g = s.goal!('לחלק את סכומי התרומות ל-12 תשלומים', []);
    expect(g.status).toBe('ok');
    const r = g.results[0];
    expect(r.id).toBe(capabilityId('supporters', SUP_AMOUNT, 'divide'));
    expect(r.sentence).toContain('ל-12 תשלומים');
    // ההרכבה חוזרת למילים — מה שיוצא, לא כל הכותרת
    expect(r.sentence).toMatch(/ל-12 תשלומים ← מחולק לתשלומים שווים$/);
    const line = r.lines.find((l) => l.includes(' = '))!;
    const n = line.split(' = ')[1].split(' + ').reduce((a, t) => a + (/^(\d+) × /.exec(t) ? +/^(\d+) × /.exec(t)![1] : 1), 0);
    expect(n).toBe(12);
    for (const l of [r.title, ...r.lines]) expect(privacyLeak(l, secretsOf(DEMO_DB))).toBeNull();
  });

  it('בלי מנועים שנמצאו — המשפט נקרא בדיוק כמו קודם (הקורפוס של G ביט-זהה)', () => {
    const t = 'תורים של 40 דקות בחלון הניקיון';
    expect(readGoal(t, generatedPlaceWords(ENGINE_CARDS))).toEqual(readGoal(t));
    expect(answerGoal('לחלק את סכומי התרומות ל-12 תשלומים', [], ENGINE_CARDS, { db: DEMO_DB, nowMs: DEMO_NOW }).results.every((r) => !r.id.startsWith('supporters:'))).toBe(true);
  });
});

describe('🏭 השער — רץ לבד', () => {
  const scripts = (pkg as { scripts: Record<string, string> }).scripts;
  it('prebuild כותב · verify בודק (--check) · CI מריץ את verify', () => {
    expect(scripts['atoms:factory']).toBe('node scripts/atoms-factory.mjs');
    expect(scripts.prebuild).toMatch(/atoms-factory\.mjs|atoms:factory/);
    expect(scripts.verify).toContain('atoms:factory -- --check');
    expect(ciYml).toMatch(/npm run verify|atoms:factory -- --check/);
  });
});
