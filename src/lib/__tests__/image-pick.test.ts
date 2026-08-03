/**
 * ratchet — פיצ'ר גלריה (הכרעת בעלים "כל מה שצריך תמונה"): תמונות-ישות חייבות
 * להישמר כ-thumbnail מכווץ, לא כתמונה גולמית — אחרת מכסת ה-localStorage (~5MB
 * לכל ה-DB) מתפוצצת. הגנת-מקור: imagePick מכווץ (תקרת-פיקסלים + JPEG), ושני
 * הטפסים (חוגים/מוצרים) מעלים דרכו ולא דרך FileReader גולמי.
 */
import { describe, it, expect } from 'vitest';
import imagePickSrc from '../imagePick.ts?raw';
import courseFormSrc from '../../components/courses/CourseForm.tsx?raw';
import productFormSrc from '../../components/shop/ProductForm.tsx?raw';
import photoFieldSrc from '../../components/PhotoField.tsx?raw';

describe('✓ ratchet — כיווץ תמונות-ישות (מניעת ניפוח localStorage)', () => {
  it('imagePick מכווץ: תקרת-פיקסלים + קידוד JPEG', () => {
    expect(imagePickSrc).toMatch(/MAX_PX\s*=\s*\d+/);
    expect(imagePickSrc).toContain("toDataURL('image/jpeg'");
  });

  it('טופס החוגים מעלה דרך pickAndCompressImage — לא FileReader גולמי לתמונה', () => {
    expect(courseFormSrc).toContain('pickAndCompressImage');
    // אין חזרה ל-readAsDataURL הגולמי בשדה-התמונה (הבאג של ניפוח המכסה)
    expect(courseFormSrc).not.toMatch(/reader\.readAsDataURL/);
  });

  it('טופס המוצרים משתמש ב-PhotoField (שמכווץ דרך pickAndCompressImage)', () => {
    expect(productFormSrc).toContain('PhotoField');
    expect(photoFieldSrc).toContain('pickAndCompressImage');
  });
});
