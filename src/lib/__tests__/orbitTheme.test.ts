/**
 * ratchet — ערכת-הצבע של מסך ההרשמה (orbitTheme).
 * המודל: ההרשמה הראשונה = אורביט (כחול); בהמשך נגזר מ-accent-הארגון.
 */
import { describe, expect, it } from 'vitest';
import { ORBIT_BLUE, orbitTheme } from '../orbitTheme';

describe('🎨 ratchet — orbitTheme (נגזר-ארגון)', () => {
  it('ברירת-מחדל (אין accent) = אורביט כחול, סצנת Aurora', () => {
    expect(orbitTheme()).toBe(ORBIT_BLUE);
    expect(orbitTheme('')).toBe(ORBIT_BLUE);
    expect(orbitTheme('   ')).toBe(ORBIT_BLUE);
    expect(orbitTheme('not-a-hex')).toBe(ORBIT_BLUE);
    expect(ORBIT_BLUE.scene).toBe('Aurora');
    expect(ORBIT_BLUE.vars['--o-accent']).toBe('#6ea8fe');
    expect(ORBIT_BLUE.vars['--o-btn-text']).toBe('#ffffff');
  });

  it('accent חם (זהב) ⇒ סצנת Ember + טוקנים נגזרים + טקסט-כפתור כהה', () => {
    const t = orbitTheme('#f0a057');
    expect(t.scene).toBe('Ember');
    expect(t.vars['--o-accent']).toBe('#f0a057');
    expect(t.vars['--o-accent-rgb']).toBe('240,160,87');
    expect(t.vars['--o-btn-b']).toBe('#f0a057');
    expect(t.vars['--o-btn-text']).toBe('#2a1710'); // אקסנט בהיר ⇒ טקסט כהה מנוגד
    // כל הטוקנים קיימים (אותו מפתחות כמו ברירת-המחדל)
    for (const k of Object.keys(ORBIT_BLUE.vars)) expect(t.vars).toHaveProperty(k);
  });

  it('accent קריר (כחול) ⇒ סצנת Aurora + טקסט-כפתור לבן', () => {
    const t = orbitTheme('#3b82f6');
    expect(t.scene).toBe('Aurora');
    expect(t.vars['--o-accent']).toBe('#3b82f6');
    expect(t.vars['--o-btn-text']).toBe('#ffffff'); // אקסנט כהה ⇒ טקסט לבן
  });

  it('accent בהיר-מאוד ⇒ סצנת Ice', () => {
    expect(orbitTheme('#f5f5f5').scene).toBe('Ice');
  });

  it('accent בלי # מתקבל ומנורמל עם #', () => {
    const t = orbitTheme('f0a057');
    expect(t.vars['--o-accent']).toBe('#f0a057');
  });

  it('הצבע נגזר, לא מונחים: כל הערכים מחרוזות CSS תקינות', () => {
    const t = orbitTheme('#e0559f');
    expect(t.vars['--o-g1']).toMatch(/^#[0-9a-f]{6}$/);
    expect(t.vars['--o-a1']).toMatch(/^rgba\(/);
    expect(t.vars['--accent']).toBe('#e0559f');
  });
});
