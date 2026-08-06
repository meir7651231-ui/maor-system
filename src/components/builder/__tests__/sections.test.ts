/**
 * ratchet — כיסוי-מלא של אשף ההרכבה: **כל** מודול-ניווט חייב מקטע באשף, אחרת
 * המטמיע לא יכול להדליק/לשנות-שם אותו בבנייה-החיה מול הלקוח.
 *
 * הבאג (4.8.2026): מודול החלוקה (shop7) נוסף בגל 7 *אחרי* שהאשף נבנה, ואיש
 * לא הוסיף לו מקטע ⇒ 8 מ-9 המודולים כוסו; החלוקה הייתה בלתי-נראית באשף.
 * הראצ'ט חוסם רגרסיה: מודול חדש בלי מקטע-אשף = טסט אדום.
 */
import { describe, expect, it } from 'vitest';
import { WIZARD_SECTIONS } from '../sections';
import { ALL_MODULES } from '../../platform/lib';
import { FEATURES, TERM_DEFS } from '../../../types/features';

describe('🧩 ratchet — אשף ההרכבה מכסה כל מודול', () => {
  it('לכל מודול-ניווט (ALL_MODULES) יש מקטע מתאים באשף', () => {
    const sectionIds = new Set(WIZARD_SECTIONS.map((s) => s.id));
    for (const m of ALL_MODULES) {
      expect(sectionIds.has(m)).toBe(true);
    }
  });

  it('מודול החלוקה (shop7) קיים באשף עם הטוגל + 3 הפיצ׳רים שלו', () => {
    const sec = WIZARD_SECTIONS.find((s) => s.id === 'shop7');
    expect(sec).toBeTruthy();
    expect(sec?.module).toBe('shop7');
    // 3 הפיצ׳רים של shop7 נשאבים לפי section.id (FEATURES.filter module===id)
    expect(FEATURES.filter((f) => f.module === 'shop7').length).toBe(3);
    // שמות ניתנים-לשינוי: "חלוקה" + "מתנדב"
    expect(sec?.termKeys).toContain('nav.shop7');
    expect(sec?.termKeys).toContain('entity.volunteer');
  });

  it("כל id של מקטע-אשף תואם ל-module קיים ב-FEATURES (אין מקטע-יתום)", () => {
    const featureModules = new Set(FEATURES.map((f) => f.module));
    for (const s of WIZARD_SECTIONS) {
      // כל מקטע חייב להתאים לקבוצת-פיצ'רים אמיתית (גם home/settings/core/shell/signup)
      expect(featureModules.has(s.id)).toBe(true);
    }
  });

  // ביקורת 6.8: 12 מונחים (סמיכות/רבים/גאדג'טים) לא נחשפו באף מקטע — עריכתם
  // הייתה אפשרית רק ב-#platform. ה-ratchet: כל מונח ב-TERM_DEFS מופיע במקטע
  // כלשהו, ואין מפתח-רפאים (termKey שאינו מונח אמיתי).
  it('כיסוי-מונחים מלא: union(termKeys) ≡ TERM_DEFS', () => {
    const exposed = new Set(WIZARD_SECTIONS.flatMap((s) => s.termKeys));
    const real = new Set(TERM_DEFS.map((t) => t.key));
    const missing = [...real].filter((k) => !exposed.has(k));
    const ghosts = [...exposed].filter((k) => !real.has(k));
    expect(missing).toEqual([]);
    expect(ghosts).toEqual([]);
  });
});
