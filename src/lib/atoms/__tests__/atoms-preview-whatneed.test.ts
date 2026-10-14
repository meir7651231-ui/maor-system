/**
 * 🔒 ratchet — 🙋 התצוגות האמיתיות של "מבין בקשות" (ATOMS-PREVIEWS, 14.10.2026).
 *
 * הארגון: פרנסה׳לע של המרכזייה + אינסטלטור שלישי, בקשה שקטה (חובות + טלפון בגוף הטקסט), בקשה עם שגיאת כתיב, 3 פרסומות.
 * ננעל: השורות המדויקות · שקילות למנוע האמיתי (routeRequest/PR_ESCALATE_MS · analyzeQuery · adRotation · listingStatus)
 * · 🛡 פרטיות: אף שם/טלפון/מייל של מבקש, אף מילה מהבקשה השקטה, ואף טקסט גולמי של בקשה — בשום תצוגה ובשום פרטים
 * · null כשאין נתונים · DB פגום לא זורק.
 */
import { describe, expect, it } from 'vitest';
import type { Db } from '../../../types/domain';
import { adRotation, analyzeQuery, listingStatus, PR_CONCEPTS, routeRequest } from '../../../components/parnasa/lib';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../../../components/parnasa/zmanimBoard';
import { conceptOf } from '../previewWhatNeed';
import { ctxOf, NOW_MS, PV, QUIET_TEXT, QUIET_WORDS, RAW_TEXTS, REQUESTERS, richDb } from './previewsFixture';

const PAIRS = [
  ['whatNeed.requests', 'escalate'],
  ['whatNeed.requests', 'rotate'],
  ['whatNeed.text', 'fuzzy'],
  ['whatNeed.names', 'fuzzy'],
  ['whatNeed.hours', 'divide'],
  ['whatNeed.openings', 'next'],
  ['whatNeed.openings', 'offset'],
  ['whatNeed.adSlot', 'rotate'],
  ['whatNeed.adPrice', 'divide'],
  ['whatNeed.adPrice', 'round'],
] as const;
const PARAMS: Record<string, number | string>[] = [{}, { by: 'item' }, { by: 'size', size: 30 }, { parts: 3 }, { maxTypos: 0 }, { count: 6 }, { minutes: 30 }, { waitMin: 1, urgentWaitMin: 1 }];

describe('🙋 הבקשות', () => {
  it('📣 "בקשה באינסטלציה — עכשיו אצל 3 עסקים בתחום · אם אין תשובה עד 13:00 ← לכל הקהילה"; שקטה ⇒ רק התחום', () => {
    expect(PV('whatNeed.requests', 'escalate')).toEqual({
      title: 'מעביר הלאה · 4 בקשות פתוחות',
      lines: [
        'בקשה שקטה · חשבונות ומשפט — אצל הגבאי (אין עדיין עסק בתחום), ולא עוברת לקהילה',
        'בקשה באינסטלציה — עכשיו אצל 3 עסקים בתחום · אם אין תשובה עד 13:00 ← לכל הקהילה',
        'בקשה באינסטלציה — עכשיו אצל 3 עסקים בתחום · אם אין תשובה עד 13:30 ← לכל הקהילה',
        'בקשה באינסטלציה (דחוף) — עכשיו אצל 3 עסקים בתחום · אם אין תשובה עד 12:30 ← לכל הקהילה',
      ],
    });
    // אחרי החלון ⇒ כבר אצל כל הקהילה; ומענה ⇒ נשארת אצל העסקים
    const later = PV('whatNeed.requests', 'escalate', {}, ctxOf(richDb(), Date.parse('2026-10-14T11:00:00Z')))!;
    expect(later.lines[3]).toBe('בקשה באינסטלציה (דחוף) — כבר אצל כל הקהילה (העסקים בתחום לא ענו בזמן)');
    const db = richDb();
    db.prRequests = db.prRequests.map((r) => (r.id === 'pq3' ? { ...r, responses: [{ listingId: 'pl101', text: 'מגיע', at: '2026-10-14T08:00:00Z' }] } : r));
    expect(PV('whatNeed.requests', 'escalate', {}, ctxOf(db))!.lines[1]).toBe('בקשה באינסטלציה — עסק אחד כבר ענה, הבקשה נשארת אצל העסקים');
  });

  it('📣 עם ברירות-המחדל — אותו רגע-מעבר כמו routeRequest (3 שעות, שעה בדחוף)', () => {
    const db = richDb();
    for (const r of db.prRequests.filter((x) => !x.quiet)) {
      const route = routeRequest(r, db.prListings, NOW_MS);
      const hhmm = clockAt(route.escalateAtMs!).hhmm;
      expect(PV('whatNeed.requests', 'escalate')!.lines.some((l) => l.includes('עד ' + hhmm + ' ← לכל הקהילה')), r.id).toBe(true);
    }
    // פרטים אחרים ⇒ זמנים אחרים (החלק עובד עם מה שנבחר)
    expect(PV('whatNeed.requests', 'escalate', { waitMin: 240 })!.lines[1]).toContain('עד 14:00 ← לכל הקהילה');
    expect(PV('whatNeed.requests', 'escalate', { waitMin: 60 })!.lines[1]).toBe('בקשה באינסטלציה — כבר אצל כל הקהילה (העסקים בתחום לא ענו בזמן)');
  });

  it('🔄 התור ההוגן בין העסקים בתחום — לפי יום ולפי בקשה', () => {
    expect(PV('whatNeed.requests', 'rotate')!.lines).toEqual([
      'חשבונות ומשפט — אין עדיין עסק בתחום, אין בין מי להתחלף',
      'חשמל ואינסטלציה — היום ← אינסטלציה זילברמן · מחר ← חשמל אור הגנוז · 16/10 ← אינסטלציה גולדשטיין',
    ]);
    expect(PV('whatNeed.requests', 'rotate', { by: 'item' })!.lines.at(-1)).toBe('הבקשה הבאה בחשמל ואינסטלציה ← קודם אל אינסטלציה גולדשטיין');
  });

  it('🔍 על הטקסט: מקצועות ומונים — גם עם שגיאת כתיב; 0 טעויות ⇒ "לא זוהה"', () => {
    expect(PV('whatNeed.text', 'fuzzy')).toEqual({
      title: 'מה מבקשים, לפי מקצוע · 4 בקשות פתוחות',
      lines: ['אינסטלציה ← 3 בקשות (אחת מהן נמצאה למרות שגיאת כתיב)', 'בקשה שקטה · חשבונות ומשפט'],
    });
    expect(PV('whatNeed.text', 'fuzzy', { maxTypos: 0 })!.lines).toEqual(['אינסטלציה ← 2 בקשות', 'בקשה שקטה · חשבונות ומשפט', 'לא זוהה מקצוע ← בקשה אחת']);
  });

  it('🔍 המקצוע מהטקסט דרך החלק — שקול ל-analyzeQuery של "מה צריך?"', () => {
    const label = (k: string) => PR_CONCEPTS.find((c) => c.k === k)!.l;
    for (const t of [...RAW_TEXTS, 'נזילה בכיור', 'צריך חשמלאי', 'מעבר דירה מחר', 'רוצה שיעור פרטי בגמרא', 'מזגן לא מקרר', 'סתם שאלה']) {
      const a = analyzeQuery(t).cons;
      const ours = conceptOf(t);
      if (!a.length) expect(ours, t).toBeNull();
      else expect(a.filter((c) => c.s === a[0].s).map((c) => label(c.k)), t).toContain(ours!.label);
    }
    expect(conceptOf('מחפש אינסטלטר')).toEqual({ label: 'אינסטלציה', typo: true });
  });
});

describe('🙋 העסקים', () => {
  it('🔍 על השמות: אות חסרה ⇒ עדיין נמצא (שמות עסקים בלבד); 0 טעויות ⇒ לא נמצא', () => {
    expect(PV('whatNeed.names', 'fuzzy')).toEqual({
      title: 'מי שמקליד שם עם אות חסרה · 4 עסקים במדריך',
      lines: ["'גולדטיין' ← נמצא: אינסטלציה גולדשטיין", "'זילרמן' ← נמצא: אינסטלציה זילברמן", "'הגוז' ← נמצא: חשמל אור הגנוז", "'ניקון' ← נמצא: ניקיון ברק"],
    });
    expect(PV('whatNeed.names', 'fuzzy', { maxTypos: 0 })!.lines[0]).toBe("'גולדטיין' ← לא נמצא");
    // עסק ממתין לאישור לא במדריך
    expect(JSON.stringify(PV('whatNeed.names', 'fuzzy'))).not.toContain('אינסטלטור ממתין');
  });

  it('✂️ שעות הפתיחה ⇒ תורים ("9:00–13:00 ← 8 תורים של חצי שעה")', () => {
    expect(PV('whatNeed.hours', 'divide', { by: 'size', size: 30 })).toEqual({
      title: 'תורים של חצי שעה בשעות הפתיחה',
      lines: ['אינסטלציה גולדשטיין · היום 16:00–20:00 ← 8 תורים של חצי שעה', 'אינסטלציה זילברמן · היום 08:00–19:00 ← 22 תורים של חצי שעה', 'ניקיון ברק · היום 08:00–19:00 ← 22 תורים של חצי שעה'],
    });
    // בשבת אין שעות ⇒ היום הבא שיש בו (מוצ״ש אין חלון ⇒ ראשון)
    expect(PV('whatNeed.hours', 'divide', {}, ctxOf(richDb(), Date.parse('2026-10-17T09:00:00Z')))!.lines[1]).toBe('אינסטלציה זילברמן · מחר 08:00–19:00 ← 12 תורים של 55 דקות');
  });

  it('⏭️ העסק הבא שנפתח — ומספר הפתוחים עכשיו; עקבי עם listingStatus', () => {
    expect(PV('whatNeed.openings', 'next')).toEqual({ title: 'העסק הבא שנפתח · עכשיו פתוחים: 3', lines: ['העסק הבא שנפתח: אינסטלציה גולדשטיין · היום ב-16:00'] });
    const loc = resolveZmanimLoc(null);
    const gold = richDb().prListings.find((l) => l.id === 'pl103')!;
    expect(listingStatus(gold, clockAt(NOW_MS), makeClosureFn(loc))?.sub).toBe('חוזר היום ב־16:00');
    // ערב שבת אחרי השקיעה ⇒ שבת סגורה, הבא נפתח ביום ראשון
    const fri = PV('whatNeed.openings', 'next', { count: 2 }, ctxOf(richDb(), Date.parse('2026-10-16T16:00:00Z')))!;
    expect(fri.lines[0]).toBe('העסק הבא שנפתח: אינסטלציה זילברמן · ביום ראשון 18/10 ב-08:00');
  });

  it('⏱️ תזכורת רבע שעה לפני שהעסק נסגר', () => {
    expect(PV('whatNeed.openings', 'offset', { minutes: -15 })).toEqual({
      title: 'תזכורת רבע שעה לפני שהעסק נסגר',
      lines: ['אינסטלציה זילברמן נסגר היום ב-19:00 ← תזכורת ב-18:45', 'ניקיון ברק נסגר היום ב-19:00 ← תזכורת ב-18:45', 'אינסטלציה גולדשטיין נסגר היום ב-20:00 ← תזכורת ב-19:45'],
    });
  });
});

describe('🙋 הפרסומות', () => {
  it('🔄 "היום ← מודעה א׳ · מחר ← מודעה ב׳" — אותו סבב כמו adRotation', () => {
    expect(PV('whatNeed.adSlot', 'rotate')!.lines).toEqual(['לוח הקהילה — היום ← מאפיית הלחם · מחר ← ספרי אור · 16/10 ← מאפיית הלחם', 'החוברת — רק גני ילדים, כל יום']);
    expect(adRotation(richDb().prAds, 'board', '2026-10-15', '').today?.advertiser).toBe('ספרי אור');
    expect(PV('whatNeed.adSlot', 'rotate', { by: 'item' })!.lines[0]).toBe('לוח הקהילה — הסדר מהיום: מאפיית הלחם ← ספרי אור');
  });

  it('✂️ 🎯 המחיר בתשלומים, ומעוגל', () => {
    expect(PV('whatNeed.adPrice', 'divide', { parts: 3 })!.lines).toEqual(['גני ילדים (שולם) · ₪500 = ₪168 + 2 × ₪166', 'מאפיית הלחם · ₪1,200 = 3 × ₪400', 'ספרי אור · ₪1,234.5 = ₪413 + 2 × ₪411']);
    expect(PV('whatNeed.adPrice', 'round', { step: 10 })!.lines[2]).toBe('ספרי אור · ₪1,234.5 ← ₪1,230');
  });
});

describe('🛡 פרטיות', () => {
  it('אף שם/טלפון/מייל של מבקש, אף מילה מהבקשה השקטה, ואף טקסט גולמי של בקשה — בשום תצוגה ובשום פרטים', () => {
    const all: string[] = [];
    for (const nowMs of [NOW_MS, Date.parse('2026-10-14T14:00:00Z'), Date.parse('2026-10-17T09:00:00Z')]) {
      for (const [place, atom] of PAIRS) {
        for (const params of PARAMS) {
          const p = PV(place, atom, params, ctxOf(richDb(), nowMs));
          if (p) all.push(p.title, ...p.lines);
        }
      }
    }
    const text = all.join('\n');
    expect(all.length).toBeGreaterThan(100);
    for (const s of [...REQUESTERS, ...QUIET_WORDS, QUIET_TEXT, ...RAW_TEXTS]) expect(text, s).not.toContain(s);
    // הבקשה השקטה מופיעה רק כ"בקשה שקטה" + התחום
    expect(text).toContain('בקשה שקטה · חשבונות ומשפט');
    expect(text).not.toMatch(/\d{2,3}-?\d{7}/);
  });
});

describe('🙋 בלי נתונים / פגום', () => {
  it('אין בקשות/עסקים/פרסומות ⇒ null; DB פגום לא זורק', () => {
    const empty = ctxOf({ ...richDb(), prListings: [], prRequests: [], prAds: [] } as Db);
    for (const [place, atom] of PAIRS) {
      expect(PV(place, atom, {}, empty), place + atom).toBeNull();
      expect(PV(place, atom, {}, ctxOf(null)), place + atom).toBeNull();
      expect(PV(place, atom, {}, ctxOf({ prListings: 'x', prRequests: [null, 7], prAds: { a: 1 } } as unknown as Db)), place + atom).toBeNull();
    }
  });
});
