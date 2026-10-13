/**
 * 📱 ratchet — מצב-אפליקציה לוואטסאפ (הכרעת-בעלים 24.8 "שהקישור יתבצע אצלי,
 * לא דרך wa.me"). סינון-כשר חוסם את דומיין wa.me אך מתיר את אפליקציית-וואטסאפ;
 * סכמת whatsapp:// היא קריאה-ישירה לאפליקציה, בלי לפנות לדומיין ⇒ עוברת.
 * חסר/'web' ⇒ wa.me (ביט-זהה להיום).
 */
import { describe, expect, it } from 'vitest';
import { waLink, waAppLink, waHref } from '../wa';

describe('📱 wa-app-scheme — whatsapp:// עוקף חסימת-דומיין', () => {
  it('waAppLink בונה סכמת-אפליקציה עם הספרות והטקסט', () => {
    expect(waAppLink('050-123-4567')).toBe('whatsapp://send?phone=972501234567');
    expect(waAppLink('050-123-4567', 'שלום')).toBe('whatsapp://send?phone=972501234567&text=' + encodeURIComponent('שלום'));
    // בלי דומיין wa.me בכלל
    expect(waAppLink('050-123-4567')).not.toContain('wa.me');
    expect(waAppLink('050-123-4567')).not.toContain('http');
  });
  it('מספר לא-תקין ⇒ null (כמו waLink)', () => {
    expect(waAppLink('123')).toBeNull();
  });
  it('waHref בוחר לפי הדגל: web=wa.me · app=whatsapp:// + מסמן app', () => {
    const web = waHref('0501234567', 'x', false);
    expect(web?.href.startsWith('https://wa.me/')).toBe(true);
    expect(web?.app).toBe(false);
    const app = waHref('0501234567', 'x', true);
    expect(app?.href.startsWith('whatsapp://send')).toBe(true);
    expect(app?.app).toBe(true);
  });
  it('web נשאר ביט-זהה ל-waLink הישן', () => {
    expect(waHref('0501234567', 'שלום', false)?.href).toBe(waLink('0501234567', 'שלום'));
  });
});
