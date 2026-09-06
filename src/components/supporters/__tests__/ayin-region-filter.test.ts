/**
 * ratchet — 🌍 סינון ישראל/חו״ל במעקב-הטיפול (בקשת-בעלים 6.9): הלוח ומסך-השמות מסננים לפי
 * אזור-הטלפון של התומך/ת (supHasRegion — אותו מסווג כמו במסך-התורמים; כולל טלפונים נוספים).
 */
import { describe, expect, it } from 'vitest';
import boardSrc from '../AyinBoard.tsx?raw';
import namesSrc from '../AyinNamesBoard.tsx?raw';
import { phoneRegion, supHasRegion } from '../lib';
import type { Supporter } from '../../../types/domain';

const sup = (phone: string, phones: { num: string }[] = []): Supporter =>
  ({ id: 'x', name: 'א', phone, phones, donations: [], count: 0, ils: 0, usd: 0 }) as unknown as Supporter;

describe('מסווג', () => {
  it('05x/0x ⇒ ישראל; +1/00 ⇒ חו״ל; טלפון-נוסף מחו״ל מספיק ל-intl', () => {
    expect(phoneRegion('052-1234567')).toBe('il');
    expect(phoneRegion('+1 212 555 0100')).toBe('intl');
    expect(supHasRegion(sup('052-1234567'), 'il')).toBe(true);
    expect(supHasRegion(sup('052-1234567'), 'intl')).toBe(false);
    expect(supHasRegion(sup('052-1234567', [{ num: '+1 212 555 0100' }]), 'intl')).toBe(true);
  });
});

describe('חיווט (הגנות-מקור)', () => {
  it('הלוח: select אזור עם 3 אפשרויות, מסנן את visible לפני הספירה', () => {
    expect(boardSrc).toContain("const [region, setRegion] = useState<'all' | 'il' | 'intl'>('all');");
    expect(boardSrc).toContain("(region === 'all' || supHasRegion(sp, region))");
    for (const o of ['🌍 ישראל + חו״ל', '🇮🇱 ישראל', '✈️ חו״ל']) expect(boardSrc).toContain(o);
  });
  it('מסך-השמות: צ׳יפים ישראל/חו״ל מסננים לפי supporterId', () => {
    expect(namesSrc).toContain("const [regionF, setRegionF] = useState<'all' | 'il' | 'intl'>('all');");
    expect(namesSrc).toContain(".filter((it) => regionF === 'all' || regionIds.has(it.supporterId))");
    expect(namesSrc).toContain('🇮🇱 ישראל');
    expect(namesSrc).toContain('✈️ חו״ל');
  });
});
