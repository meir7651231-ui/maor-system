/**
 * ratchet — 📞 הקו ⇄ 📅 הלוח העברי של אורביט (ENGINEBOX-SOCKETS 13.10): התאריך העברי בברכה, כבוי כברירת-מחדל.
 *
 * `hebDateGreeting: true` + calendar.dayInfo זמין ⇒ הברכה של התפריט הראשי מוסיפה "היום ד׳ חשוון." (והחג: "היום כ״ז כסלו,
 * חנוכה."); אחרי השקיעה (שעון-הקו) ⇒ "הלילה ה׳ חשוון.". ננעל:
 *  (א) כבוי / false / דלוק-אבל-הלוח-לא-זמין (לא נטען · מודול-הלוח כבוי · אין מרכזייה) ⇒ העץ ביט-זהה (וזהב-הקו הקיים —
 *      phoneLine-golden.test — רץ בלי האופציה ונשאר ירוק בלי הקלטה-מחדש).
 *  (ב) דלוק ⇒ רק נוסח-הברכה של 'main' משתנה, ובדיוק במשפט אחד בסופו; שאר העץ זהה.
 *  (ג) יום-חול · אחרי השקיעה · שבת (השורש סגור — הודעת-הסגירה לא זזה) · יום כיפור · חנוכה · אדר א׳/ב׳ בשנה מעוברת.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { buildPhoneMenu, hebTodaySentence, type PhoneMenuInput, type PhoneSwitchboard } from '../phoneLine';
import { ask, installProvider, resetSwitchboard } from '../../../lib/switchboard/registry';
import { abilities as calendarAbilities } from '../../calendar/abilities';
import { cfgWith, fixtureDb } from '../../../lib/switchboard/__tests__/fixture';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';

/** epoch של שעה בישראל (offset בשעות: 3 בקיץ, 2 בחורף). */
const il = (y: number, mo: number, d: number, h: number, mi = 0, off = 3): number => Date.UTC(y, mo - 1, d, h - off, mi);

const PREFS = { communityName: 'קהילת חסידי בעלזא' };
const base = (nowMs: number, over: Partial<PhoneMenuInput> = {}): PhoneMenuInput => ({ listings: [], posts: [], prefs: PREFS, nowMs, ...over });
const sw = (nowMs: number, config: OrgConfig = cfgWith({ parnasa: true })): PhoneSwitchboard => ({ ask, ctx: { db: fixtureDb(), config, nowMs } });
const MAIN = 'שלום וברוכים הבאים לקו של פרנסה׳לע של קהילת חסידי בעלזא.';

afterEach(() => {
  resetSwitchboard();
});

const MOMENTS: ReadonlyArray<readonly [name: string, nowMs: number, sentence: string]> = [
  ['חמישי בצהריים (יום-חול)', il(2026, 10, 15, 13), 'היום ד׳ חשוון.'],
  ['חמישי אחרי השקיעה — היום העברי כבר התחלף', il(2026, 10, 15, 18, 30), 'הלילה ה׳ חשוון.'],
  ['שבת בבוקר (הקו סגור)', il(2026, 10, 17, 10), 'היום ו׳ חשוון.'],
  ['יום כיפור (יו״ט באמצע-השבוע — סגור)', il(2026, 9, 21, 12), 'היום י׳ תשרי, יום כיפור.'],
  ['חנוכה ביום-חול', il(2026, 12, 7, 12, 0, 2), 'היום כ״ז כסלו, חנוכה.'],
  ['פורים קטן — אדר א׳ בשנה מעוברת', il(2027, 2, 21, 12, 0, 2), 'היום י״ד אדר א׳, פורים קטן.'],
  ['פורים — אדר ב׳', il(2027, 3, 23, 12, 0, 2), 'היום י״ד אדר ב׳, פורים.'],
];

describe('📞📅 (א) כבוי ⇒ העץ ביט-זהה', () => {
  for (const [name, nowMs] of MOMENTS) {
    it(name, () => {
      const plain = JSON.stringify(buildPhoneMenu(base(nowMs)));
      const withSw = JSON.stringify(buildPhoneMenu(base(nowMs, { switchboard: sw(nowMs) })));
      expect(withSw).toBe(plain);
      installProvider('calendar', calendarAbilities);
      // האופציה חסרה / false — גם כשהלוח זמין
      expect(JSON.stringify(buildPhoneMenu(base(nowMs, { switchboard: sw(nowMs) })))).toBe(plain);
      expect(JSON.stringify(buildPhoneMenu(base(nowMs, { switchboard: sw(nowMs), hebDateGreeting: false })))).toBe(plain);
      // דלוק אבל אין מרכזייה / מודול-הלוח כבוי
      expect(JSON.stringify(buildPhoneMenu(base(nowMs, { hebDateGreeting: true })))).toBe(plain);
      const calOff = { ...cfgWith({ parnasa: true }), modules: { ...cfgWith({ parnasa: true }).modules, calendar: false } };
      expect(JSON.stringify(buildPhoneMenu(base(nowMs, { switchboard: sw(nowMs, calOff), hebDateGreeting: true })))).toBe(plain);
    });
  }

  it('דלוק אבל הספק עוד לא נטען ⇒ ביט-זהה', () => {
    const nowMs = MOMENTS[0][1];
    expect(JSON.stringify(buildPhoneMenu(base(nowMs, { switchboard: sw(nowMs), hebDateGreeting: true })))).toBe(JSON.stringify(buildPhoneMenu(base(nowMs))));
  });
});

describe('📞📅 (ב+ג) דלוק ⇒ משפט אחד בסוף הברכה, שאר העץ זהה', () => {
  for (const [name, nowMs, sentence] of MOMENTS) {
    it(name + ' ⇒ "' + sentence + '"', () => {
      installProvider('calendar', calendarAbilities);
      const plain = buildPhoneMenu(base(nowMs));
      const on = buildPhoneMenu(base(nowMs, { switchboard: sw(nowMs), hebDateGreeting: true }));
      expect(on.nodes.main.prompt).toBe(MAIN + ' ' + sentence);
      expect(plain.nodes.main.prompt).toBe(MAIN);
      // רק נוסח-הברכה זז
      expect(JSON.stringify({ ...on, nodes: { ...on.nodes, main: { ...on.nodes.main, prompt: MAIN } } })).toBe(JSON.stringify(plain));
      expect(on.root).toBe(plain.root);
      if (on.closed) expect(on.nodes.closed.prompt).toBe(plain.nodes.closed.prompt);
    });
  }

  it('שבת/יו״ט: השורש נשאר הודעת-הסגירה (אין מסלול חדש לקו בשבת)', () => {
    installProvider('calendar', calendarAbilities);
    for (const nowMs of [il(2026, 10, 17, 10), il(2026, 9, 21, 12)]) {
      const on = buildPhoneMenu(base(nowMs, { switchboard: sw(nowMs), hebDateGreeting: true }));
      expect(on.root).toBe('closed');
      expect(on.nodes.closed.prompt).not.toContain('היום');
    }
  });

  it('בלי שם-קהילה — אותו משפט אחרי הברכה הארוכה', () => {
    installProvider('calendar', calendarAbilities);
    const nowMs = MOMENTS[0][1];
    const on = buildPhoneMenu({ listings: [], posts: [], prefs: {}, nowMs, switchboard: sw(nowMs), hebDateGreeting: true });
    expect(on.nodes.main.prompt).toBe('שלום וברוכים הבאים לקו של פרנסה׳לע, מדריך בעלי המקצוע של הקהילה. היום ד׳ חשוון.');
  });
});

describe('📞📅 hebTodaySentence — העזר', () => {
  it('לא זורק: אין מרכזייה · ask שאינו פונקציה · תאריך פגום · ספק שזורק', () => {
    const nowMs = MOMENTS[0][1];
    expect(hebTodaySentence(undefined, { anchorIso: '2026-10-15', night: false })).toBe('');
    expect(hebTodaySentence({ ask: undefined as never, ctx: sw(nowMs).ctx }, { anchorIso: '2026-10-15', night: false })).toBe('');
    installProvider('calendar', calendarAbilities);
    expect(hebTodaySentence(sw(nowMs), { anchorIso: '2026-02-31', night: false })).toBe('');
    expect(hebTodaySentence(sw(nowMs), null as never)).toBe('');
    expect(hebTodaySentence(sw(nowMs), { anchorIso: '2026-10-15', night: false })).toBe('היום ד׳ חשוון.');
    installProvider('calendar', { 'calendar.dayInfo': { run: () => { throw new Error('boom'); } } });
    expect(hebTodaySentence(sw(nowMs, DEFAULT_CONFIG), { anchorIso: '2026-10-15', night: false })).toBe('');
  });
});
