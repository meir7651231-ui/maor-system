/**
 * 🔒 ratchet-כיסוי — כל חיבור שהארגז מציע יש לו תצוגה אמיתית, או שהוא ב-HONEST_NULLS עם סיבה (ATOMS-PREVIEWS, 14.10.2026).
 *
 * הבעלים: "ליד כל מקום — התוצאה האמיתית על הנתונים שלכם". מה שננעל:
 *   · לכל (מקום, חלק) ש-`optionsFor` מציע בשלושת המנועים: hasPreview **או** HONEST_NULLS — לא שניהם, לא אף אחד.
 *   · על נתוני-המבחן כל חיבור עם תצוגה מחזיר תוצאה (לא null), עד 6 שורות.
 *   · השפה: בלי המילים הטכניות (מיזוג · ניתוב · הסלמה · סלחני · יחסי · אטום · רצף · טווח — "ברצף" מותר).
 *   · משקל וטוהר (הגנות-מקור): בלי Date.now בקבצים החדשים; מ-preview.ts מייבאים טיפוסים בלבד (בלי מעגל); אין קוד זמנים
 *     בבנדל-ההפעלה (נאכף גם ב-scripts/bundle-budget.mjs).
 *   · HONEST_NULLS קצרה: 2 לכל היותר (יום עבודה — אין נתון; שמות אורחים — פרטיות).
 */
import { describe, expect, it } from 'vitest';
import { optionsFor } from '../contract';
import { ATOM_CARDS } from '../cards';
import { ENGINE_CARDS } from '../engines';
import { hasPreview, PREVIEW_KEYS, PREVIEW_MAX_LINES } from '../preview';
import { HONEST_NULLS } from '../previewBookingsMore';
import { KIT_MAX_LINES } from '../previewZmanim';
import { ctxOf, PV, richDb } from './previewsFixture';
import zmanimSrc from '../previewZmanim.ts?raw';
import whatNeedSrc from '../previewWhatNeed.ts?raw';
import bookingsSrc from '../previewBookingsMore.ts?raw';
import previewSrc from '../preview.ts?raw';

const PAIRS = ENGINE_CARDS.flatMap((e) => ATOM_CARDS.flatMap((a) => optionsFor(a, e).map((o) => o.place + ':' + a.id)));
const BANNED = ['מיזוג', 'ניתוב', 'הסלמה', 'סלחני', 'יחסי', 'אטום', 'רצף', 'טווח'];

describe('🧬 כיסוי התצוגות', () => {
  it('כל חיבור שהארגז מציע — תצוגה או HONEST_NULLS (לא שניהם)', () => {
    expect(PAIRS.length).toBe(43); // 7 זמנים · 10 "מבין בקשות" · 26 הזמנות
    for (const k of PAIRS) {
      const [place, atom] = k.split(':');
      const has = hasPreview(place, atom);
      const nul = Object.prototype.hasOwnProperty.call(HONEST_NULLS, k);
      expect(has !== nul, k).toBe(true);
    }
    // ובכיוון ההפוך: אין תצוגה ואין null-כן על חיבור שהארגז לא מציע
    for (const k of [...PREVIEW_KEYS, ...Object.keys(HONEST_NULLS)]) expect(PAIRS, k).toContain(k);
    expect(Object.keys(HONEST_NULLS).length).toBeLessThanOrEqual(2);
    expect(PREVIEW_KEYS.length).toBe(PAIRS.length - Object.keys(HONEST_NULLS).length);
  });

  it('על נתוני-המבחן — כל חיבור עם תצוגה מחזיר תוצאה, עד 6 שורות, בשפה של כל יום', () => {
    expect(KIT_MAX_LINES).toBe(PREVIEW_MAX_LINES);
    // הסכומים של ההזמנות צריכים חיוב: ההזמנה הצמודה של לוי עם יתרה ₪1,200
    const db = richDb();
    db.hostBookings = db.hostBookings.map((b) => (b.id === 'hb9' ? { ...b, charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }] } : b));
    for (const k of PAIRS.filter((x) => !(x in HONEST_NULLS))) {
      const [place, atom] = k.split(':');
      const p = PV(place, atom, {}, ctxOf(db));
      expect(p, k).not.toBeNull();
      expect(p!.lines.length, k).toBeGreaterThan(0);
      expect(p!.lines.length, k).toBeLessThanOrEqual(PREVIEW_MAX_LINES);
      const text = [p!.title, ...p!.lines].join('\n').replace(/ברצף/g, '');
      for (const w of BANNED) expect(text, k + ' · ' + w).not.toContain(w);
    }
  });
});

describe('🧬 טוהר ומשקל (הגנות-מקור)', () => {
  it('בלי Date.now / new Date() בלי ארגומנט — "עכשיו" רק מ-ctx.nowMs', () => {
    for (const [name, src] of [['zmanim', zmanimSrc], ['whatNeed', whatNeedSrc], ['bookings', bookingsSrc]] as const) {
      expect(src, name).not.toMatch(/Date\.now\s*\(/);
      expect(src, name).not.toMatch(/new Date\(\s*\)/);
    }
  });

  it('מ-preview.ts מייבאים טיפוסים בלבד (בלי מעגל); preview.ts פורס את שלושת הקבצים בסוף BUILDERS', () => {
    for (const src of [zmanimSrc, whatNeedSrc, bookingsSrc]) {
      const fromPreview = src.match(/^import .* from '\.\/preview';$/gm) ?? [];
      expect(fromPreview.length).toBe(1);
      expect(fromPreview[0]).toMatch(/^import type /);
    }
    expect(previewSrc).toMatch(/\.\.\.ZMANIM_BUILDERS,\n\s+\.\.\.WHAT_NEED_BUILDERS,\n\s+\.\.\.BOOKINGS_MORE_BUILDERS,\n\};/);
  });
});
