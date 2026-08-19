/**
 * ratchet — 📝 הערת-טקסט חופשית ליד מונה-העיניים בכרטיס מעקב-הטיפול (19.8,
 * בקשת-בעלים "משבצת לטקסט להקלדה חופשית ליד המשבצת של המספר עיניים").
 * שדה `AyinName.note` אופציונלי (additive, אין מיגרציה); פעולת-store ריקה=undefined.
 */
import { describe, expect, it } from 'vitest';
import domainSrc from '../../../types/domain.ts?raw';
import storeSrc from '../../../store/useApp.ts?raw';
import cardSrc from '../AyinCard.tsx?raw';

describe('📝 ratchet — הערה חופשית ליד מונה-העיניים', () => {
  it('שדה note אופציונלי על AyinName', () => {
    expect(domainSrc).toMatch(/note\?\s*:\s*string/);
  });

  it('פעולת-store ayinSetNameNote — ריק ⇒ undefined (לא שומר מחרוזת-ריקה)', () => {
    expect(storeSrc).toContain('ayinSetNameNote(id, nameId, note)');
    expect(storeSrc).toMatch(/const t = note\.trim\(\);[\s\S]{0,160}note: t \|\| undefined/);
  });

  it('🛡 הגנת-מקור: תיבת-הערה ליד המונה בכרטיס, מחווטת ל-setNameNote', () => {
    expect(cardSrc).toContain('setNameNote(sp.id, n.id, e.target.value)');
    expect(cardSrc).toMatch(/value=\{n\.note \|\| ''\}/);
    expect(cardSrc).toContain('placeholder="הערה"');
  });
});
