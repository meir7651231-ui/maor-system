/**
 * ratchet — באג #15 (הכרעת בעלים "הכי הרבה תמורה" = אפס אובדן): ייבוא JSON דילג
 * בשקט על משפחה באותו שם *בלי טלפון* (famKey='שם|') וכך איבד משפחות. התיקון:
 * מדלגים רק על כפילות מאומתת (שם+טלפון); בלי טלפון ⇒ מוסיפים (כמו מסלול ה-CSV).
 * הגנת-מקור על התנאי במסלול ה-JSON.
 */
import { describe, expect, it } from 'vitest';
import importSrc from '../ImportSection.tsx?raw';

describe('🛡 ratchet — ייבוא JSON: משפחה בלי טלפון מתווספת (לא מדולגת)', () => {
  it('הדילוג מותנה ב-normalizePhone (רק כפילות מאומתת מדולגת)', () => {
    // התנאי החדש: מוסיפים אם אין טלפון, או אם אין כפילות מאומתת
    expect(importSrc).toContain('!normalizePhone(f.phone) || !existing.has(famKey(f.name, f.phone))');
    // הבאג הישן — סינון גורף לפי famKey בלבד — לא קיים יותר
    expect(importSrc).not.toContain('parsed.families.filter((f) => !existing.has(famKey(f.name, f.phone)))');
  });
});
