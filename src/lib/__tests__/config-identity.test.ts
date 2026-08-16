/**
 * רצ'ט — חיטוי זהות-ורטיקל חזותית (16.8): normalizeConfig מחטא emoji/motion/
 * accentCustom (allowlist/תקרת-אורך), ו-faviconDataUri בונה data-uri בטוח.
 * אינווריאנט: DEFAULT_CONFIG בלי emoji/motion ⇒ ביט-זהה להיום (הלקוח-החי).
 */
import { describe, expect, it } from 'vitest';
import { normalizeConfig, faviconDataUri, DEFAULT_FAVICON } from '../config';
import { DEFAULT_CONFIG } from '../../types/config';

const base = { slug: 'x', orgName: 'X', theme: 'or-rishon' };

describe('🎨 ratchet — חיטוי זהות-ורטיקל ב-normalizeConfig', () => {
  it('emoji: מחרוזת קצרה (מנוקה-רווחים) נשמרת; ריק/לא-מחרוזת ⇒ מוסר; תקרת-אורך 12', () => {
    expect(normalizeConfig({ ...base, emoji: '🏗️' })!.emoji).toBe('🏗️');
    expect(normalizeConfig({ ...base, emoji: '  💻 ' })!.emoji).toBe('💻');
    expect(normalizeConfig({ ...base, emoji: '' })!.emoji).toBeUndefined();
    expect(normalizeConfig({ ...base, emoji: 123 as unknown as string })!.emoji).toBeUndefined();
    expect(normalizeConfig({ ...base, emoji: 'x'.repeat(50) })!.emoji!.length).toBe(12);
  });

  it('motion: רק ערך מה-allowlist (calm/snappy/bold) נשמר', () => {
    expect(normalizeConfig({ ...base, motion: 'bold' })!.motion).toBe('bold');
    expect(normalizeConfig({ ...base, motion: 'snappy' })!.motion).toBe('snappy');
    expect(normalizeConfig({ ...base, motion: 'calm' })!.motion).toBe('calm');
    expect(normalizeConfig({ ...base, motion: 'wild' })!.motion).toBeUndefined();
    expect(normalizeConfig({ ...base, motion: '' })!.motion).toBeUndefined();
  });

  it('accentCustom: רק true מפורש נשמר (provenance)', () => {
    expect(normalizeConfig({ ...base, accentCustom: true })!.accentCustom).toBe(true);
    expect(normalizeConfig({ ...base, accentCustom: 'yes' as unknown as boolean })!.accentCustom).toBeUndefined();
    expect(normalizeConfig({ ...base })!.accentCustom).toBeUndefined();
  });

  it('🔒 DEFAULT_CONFIG בלי emoji/motion — ביט-זהה ללקוח-החי', () => {
    expect(DEFAULT_CONFIG.emoji).toBeUndefined();
    expect(DEFAULT_CONFIG.motion).toBeUndefined();
    // קונפיג ללא emoji/motion עובר נורמליזציה ונשאר בלי השדות (בלי הזרקה)
    const c = normalizeConfig({ ...base })!;
    expect('emoji' in c).toBe(false);
    expect('motion' in c).toBe(false);
  });
});

describe('🖼️ ratchet — faviconDataUri (טהור)', () => {
  it('בונה SVG data-uri מקודד מהאימוג׳י (encodeURIComponent מנטרל הזרקה)', () => {
    const uri = faviconDataUri('🏗️');
    expect(uri.startsWith('data:image/svg+xml,')).toBe(true);
    expect(uri).toContain(encodeURIComponent('🏗️'));
    expect(uri).toContain(encodeURIComponent('<svg'));
  });

  it('DEFAULT_FAVICON — עיגול הזהב הדיפולטי (זהה ל-index.html)', () => {
    expect(DEFAULT_FAVICON).toContain('f3c76b');
    expect(DEFAULT_FAVICON.startsWith('data:image/svg+xml,')).toBe(true);
  });
});
