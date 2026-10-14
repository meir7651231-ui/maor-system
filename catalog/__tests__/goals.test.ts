/**
 * 🎯 מילון המטרות (GOALS, 14.10.2026) — ratchet.
 * המחבר שואל "מה הדבר הזה עושה?" ומקבל צרכים בלי-עולם: (פועל, חומר). אם מילה תיכתב עם פועל שלא קיים,
 * חומר שאינו סוג מהחוזה, או קובץ לא-ממוין — המחבר יחפש חלק שלא יכול להימצא. הבדיקה הזו עוצרת את זה.
 * 1. כל קובץ עומד ב-`catalog/goals/schema.json`.
 * 2. כל פועל מהאלף-בית (מתוך הסכמה) או `NEW:<id>` עם הסבר ב-detail; כל חומר = סוג מ-`catalog/schema.json`.
 * 3. מילים ייחודיות בכל המילון; 4–8 צרכים לכל מילה; לפחות 150 מילים ב-12 עולמות; המילים החובה בפנים.
 * 4. דטרמיניסטי: מילים ממוינות בסדר-תווים, הקובץ = JSON.stringify(doc, null, 2) + "\n".
 * 5. ה-README מונה את כל פעלי-ה-NEW ואת מספר המילים.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateSchema } from '../lib/check.mjs';

const DIR = join(__dirname, '..', 'goals');
const SCHEMA = JSON.parse(readFileSync(join(DIR, 'schema.json'), 'utf8'));
const CATALOG = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf8'));
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'schema.json').sort();

type Need = { behavior: string; verb: string; material: string; detail?: string };
type Goal = { word: string; emoji: string; does: string; needs: Need[] };
const docs = FILES.map((f) => ({ file: f, text: readFileSync(join(DIR, f), 'utf8'), doc: JSON.parse(readFileSync(join(DIR, f), 'utf8')) as { world: string; goals: Goal[] } }));
const goals = docs.flatMap((d) => d.doc.goals);
const needs = goals.flatMap((g) => g.needs);

const VERB_RE = new RegExp(SCHEMA.properties.goals.items.properties.needs.items.properties.verb.pattern);
const KIND_RE = new RegExp(CATALOG.$defs.kind.pattern);
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

describe('מילון המטרות', () => {
  it('כל קובץ עומד בסכמה', () => {
    for (const d of docs) expect(validateSchema(d.doc, SCHEMA), d.file).toEqual([]);
  });

  it('הבודק תופס הפרות', () => {
    const bad = { world: 'x', goals: [{ word: 'דרקון', emoji: '🐉', does: 'יורק אש בתורות', needs: [{ behavior: 'יורק', verb: 'breathe-fire', material: 'fire' }] }] };
    expect(validateSchema(bad, SCHEMA).length).toBeGreaterThan(0);
  });

  it('פועל מהאלף-בית או NEW: עם הסבר; חומר = סוג מהחוזה', () => {
    for (const n of needs) {
      expect(VERB_RE.test(n.verb), n.verb).toBe(true);
      expect(KIND_RE.test(n.material), n.material).toBe(true);
      if (n.verb.startsWith('NEW:')) expect(n.detail, n.behavior).toBeTruthy();
    }
    // האלף-בית בסכמה זהה לחומרים בסכמה של הקטלוג — לא מילון פרטי
    expect(SCHEMA.properties.goals.items.properties.needs.items.properties.material.pattern).toBe(CATALOG.$defs.kind.pattern);
  });

  it('מילים ייחודיות, 4–8 צרכים, היקף ומילות-חובה', () => {
    const words = goals.map((g) => g.word);
    expect(new Set(words).size).toBe(words.length);
    for (const g of goals) {
      expect(g.needs.length, g.word).toBeGreaterThanOrEqual(4);
      expect(g.needs.length, g.word).toBeLessThanOrEqual(8);
    }
    expect(words.length).toBeGreaterThanOrEqual(150);
    expect(docs.length).toBeGreaterThanOrEqual(12);
    const must = 'חמנייה דרקון רמזור מעלית רכבת-הרים כוורת מגדלור שעון-חול אקווריום משחק-מאפיה קרוסלה הר-געש מזרקה תיבת-נגינה פינגווין זיקית צוללת טלסקופ מטוס-נייר כדור-פורח';
    for (const w of must.split(' ')) expect(words, w).toContain(w);
  });

  it('דטרמיניסטי: ממוין וכתוב בצורה קנונית', () => {
    for (const d of docs) {
      const ws = d.doc.goals.map((g) => g.word);
      expect(ws, d.file).toEqual([...ws].sort(cmp));
      expect(d.text, d.file).toBe(JSON.stringify(d.doc, null, 2) + '\n');
    }
  });

  it('ה-README מונה את כל פעלי-ה-NEW ואת מספר המילים', () => {
    const readme = readFileSync(join(DIR, 'README.md'), 'utf8');
    for (const v of new Set(needs.map((n) => n.verb).filter((v) => v.startsWith('NEW:')))) expect(readme, v).toContain('`' + v + '`');
    expect(readme).toContain(`**${goals.length} מילים**`);
    for (const d of docs) expect(readme, d.file).toContain('`' + d.file + '`');
  });
});
