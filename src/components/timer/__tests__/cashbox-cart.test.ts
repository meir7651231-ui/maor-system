/**
 * ratchet — קופה רושמת: עגלת-פריטים (בקשת-בעלים "עגלה על מה הוא משלם").
 * העגלה בונה את הסכום-לתשלום ומופיעה מפורטת על החשבונית. ריק ⇒ ביט-זהה
 * לתשלום-הסכום הקודם (additive).
 */
import { describe, expect, it } from 'vitest';
import src from '../CashRegister.tsx?raw';

describe('🛒 ratchet — עגלת-פריטים בקופה (בקשת-בעלים)', () => {
  it('העגלה בונה את הסכום-לתשלום (dueNum) כשיש פריטים', () => {
    expect(src).toContain('const dueNum = cart.length ? cartTotal : Math.max(0, Number(due) || 0)');
    expect(src).toContain('const addItem =');
    expect(src).toContain('const removeItem =');
  });

  it('הפריטים נשמרים בחשבונית ומוצגים', () => {
    expect(src).toContain('...(cart.length ? { items: cart } : {})');
    expect(src).toContain('items?: CartItem[]');
    expect(src).toContain('receipt.items');
  });

  it('ריק = ביט-זהה: שדה-הסכום הידני והסכומים-המהירים חוזרים כשאין עגלה', () => {
    expect(src).toContain('{!cart.length && (');
    // כשיש עגלה, השדה קורא-בלבד (מהעגלה)
    expect(src).toContain('— מהעגלה');
  });
});
