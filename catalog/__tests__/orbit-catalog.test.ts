/**
 * 📇 הקטלוג של אורביט (CATALOG, 14.10.2026) — ratchet.
 * 1. `catalog/sources/orbit.json` עומד בסכמה (`catalog/schema.json`) ובכללי-החוזה (id, מיון, שם פועל ≤ 9 מילים בעברית).
 * 2. הוא מעודכן: הרצה מחדש של המפקד נותנת בדיוק אותו קובץ (שינוי בקוד ⇒ `node catalog/scripts/orbit-census.mjs`).
 * 3. אין בדוגמאות פרטים אישיים (טלפון, מייל, ת״ז, כתובת, טוקן).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateSource, validateSchema } from '../lib/check.mjs';
import { build } from '../scripts/orbit-census.mjs';

const ROOT = join(__dirname, '..', '..');
const doc = JSON.parse(readFileSync(join(ROOT, 'catalog/sources/orbit.json'), 'utf8'));

describe('הקטלוג של אורביט', () => {
  it('עומד בסכמה ובחוזה', () => {
    expect(validateSource(doc, { strict: true })).toEqual([]);
    expect(doc.source).toBe('orbit');
    expect(doc.generatedAt).toBeNull();
  });

  it('הבודק תופס הפרות (לא עובר על הכול)', () => {
    const bad = { ...doc, parts: [{ ...doc.parts[0], name: 'divideSpan', gives: { kind: 'מספר', type: 'x' } }] };
    expect(validateSource(bad, { strict: true }).length).toBeGreaterThan(0);
    expect(validateSchema({ source: 'x' }).length).toBeGreaterThan(0);
  });

  it('מעודכן — המפקד נותן בדיוק את אותם חלקים', () => {
    const fresh = build().map(({ _auto, ...p }: { _auto?: string; [k: string]: unknown }) => p);
    expect(JSON.stringify(fresh)).toBe(JSON.stringify(doc.parts));
  }, 60_000);

  it('כולל את כל השכבות: 17 מנועים מפורקים, 8 מנועים קטנים, 3 כרטיסים, ספריות וטלפון', () => {
    const by = (w: string) => doc.parts.filter((p: { what: string }) => p.what === w).length;
    expect(by('engine')).toBe(20);
    expect(by('brick')).toBe(8);
    expect(by('particle')).toBe(40);
    const tags = new Set(doc.parts.flatMap((p: { tags: string[] }) => p.tags));
    for (const t of ['decomposed', 'atoms', 'hand-card', 'lib:hebdate', 'lib:date-util', 'telephony:zmanim', 'telephony:hebcal']) expect(tags.has(t), t).toBe(true);
  });

  it('אין פרטים אישיים בדוגמאות', () => {
    const text = JSON.stringify(doc.parts.map((p: { example: unknown }) => p.example));
    expect(text).not.toMatch(/@[a-z]/i);
    expect(text).not.toMatch(/\b0\d{1,2}-?\d{7}\b|\+972/);
    expect(text).not.toMatch(/\b\d{9}\b/);
  });
});
