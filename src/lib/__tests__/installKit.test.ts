/**
 * ratchet — install-kit (kitProgress) + הגנת-מקור לחיווט הגאנט/ערכה בכרטיס.
 */
import { describe, expect, it } from 'vitest';
import { kitProgress, DEFAULT_KIT_LABELS } from '../installKit';
import cardSrc from '../../components/supporters/AyinCard.tsx?raw';

describe('📦 ratchet — install-kit', () => {
  it('ריק / undefined ⇒ 0/0, 0%, לא-מוכן', () => {
    expect(kitProgress(undefined)).toEqual({ done: 0, total: 0, pct: 0, ready: false });
    expect(kitProgress({ kit: [] })).toEqual({ done: 0, total: 0, pct: 0, ready: false });
  });

  it('חלקי — 2/4 = 50%, לא-מוכן', () => {
    const p = kitProgress({ kit: [{ label: 'a', done: true }, { label: 'b', done: true }, { label: 'c', done: false }, { label: 'd', done: false }] });
    expect(p).toEqual({ done: 2, total: 4, pct: 50, ready: false });
  });

  it('הכל סומן ⇒ ready', () => {
    const p = kitProgress({ kit: [{ label: 'a', done: true }, { label: 'b', done: true }] });
    expect(p.ready).toBe(true);
    expect(p.pct).toBe(100);
  });

  it('ערכת-ברירת-מחדל אינה-ריקה', () => {
    expect(DEFAULT_KIT_LABELS.length).toBeGreaterThan(0);
  });

  it('🛡 הכרטיס מגדר גאנט/ערכה מסחרי-בלבד (!core.taxreceipt) ומחווט לסטור', () => {
    expect(cardSrc).toContain("featureOn(cfg, 'supporters.ayin.gantt') && !featureOn(cfg, 'core.taxreceipt')");
    expect(cardSrc).toContain("featureOn(cfg, 'supporters.ayin.kit') && !featureOn(cfg, 'core.taxreceipt')");
    expect(cardSrc).toContain('scheduleTasks(a.names)');
    expect(cardSrc).toContain('kitProgress(a)');
  });
});
