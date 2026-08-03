/**
 * ratchet — #3 (הכרעת בעלים "3 כן"): שער ריבוי-הטאבים. readStoredPlainDb הוא
 * ליבת-ההחלטה של האימוץ — מפענח DB גלוי מאוחסן לצורך "אמץ כתיבה חדשה יותר של
 * טאב אחר". מעטפת מוצפנת / פגום ⇒ null (אין אימוץ; שער-ההצפנה מכסה את המוצפן).
 */
import { describe, it, expect } from 'vitest';
import { readStoredPlainDb } from '../persist';
import { emptyDb } from '../../types/domain';

describe('✓ ratchet — readStoredPlainDb (#3 שער ריבוי-טאבים)', () => {
  it('DB גלוי תקין ⇒ מוחזר עם savedAt (מועמד לאימוץ)', () => {
    const db = { ...emptyDb(), savedAt: '2026-08-03T10:00:00.000Z' };
    const out = readStoredPlainDb(JSON.stringify(db));
    expect(out).not.toBeNull();
    expect(out?.savedAt).toBe('2026-08-03T10:00:00.000Z');
  });

  it('מעטפת מוצפנת ($enc:2) ⇒ null (לא מאמצים; שער-ההצפנה מטפל)', () => {
    expect(readStoredPlainDb(JSON.stringify({ $enc: 2, data: 'x' }))).toBeNull();
  });

  it('JSON פגום ⇒ null', () => {
    expect(readStoredPlainDb('{ not json')).toBeNull();
  });

  it('ריק/חסר ⇒ null', () => {
    expect(readStoredPlainDb(null)).toBeNull();
    expect(readStoredPlainDb('')).toBeNull();
  });
});
