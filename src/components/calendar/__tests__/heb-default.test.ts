/**
 * ratchet — הלוח נפתח בגריד העברי (P1.1, feature calendar.hebdefault).
 *
 * מקור האמת: הלגאסי נפתח בעברי (state calHebMode:true, legacy-main-script.js:24
 * calHebMode ברירת מחדל true בקובץ החי). חוזה הדגלים בריפו: מפתח חסר = דלוק —
 * לכן ברירת המחדל עברי; false מפורש = לועזי (תאימות למי שמעדיף).
 */
import { describe, expect, it } from 'vitest';
import { initialHebMode } from '../calLib';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import calViewSrc from '../CalendarView.tsx?raw';

function cfg(features: Record<string, boolean> = {}): OrgConfig {
  return { ...DEFAULT_CONFIG, features: { ...DEFAULT_CONFIG.features, ...features } };
}

describe('📅 ratchet — initialHebMode (legacy calHebMode:true)', () => {
  it('דגל חסר = דלוק = הלוח נפתח בעברי', () => {
    expect(initialHebMode(cfg())).toBe(true);
  });
  it('false מפורש = נפתח בלועזי', () => {
    expect(initialHebMode(cfg({ 'calendar.hebdefault': false }))).toBe(false);
  });
  it('true מפורש = עברי', () => {
    expect(initialHebMode(cfg({ 'calendar.hebdefault': true }))).toBe(true);
  });
  it('מודול הלוח כבוי — הדגל כפוף לקסקדת המודול (featureOn)', () => {
    const c = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, calendar: false } };
    expect(initialHebMode(c)).toBe(false); // אין ללוח משמעות כשהמודול כבוי
  });
});

describe('🛡 הגנת-מקור — CalendarView מאותחל דרך initialHebMode ולא useState(false)', () => {
  it('אתחול hebMode עובר דרך initialHebMode(config)', () => {
    expect(calViewSrc).toMatch(/useState\(\(\) => initialHebMode\(/);
    expect(calViewSrc).not.toMatch(/\[hebMode, setHebMode\] = useState\(false\)/);
  });
});
