/**
 * 🔒 ratchets · ארגז המנועים (13.10.2026):
 *  (א) `shell.enginebox` הוא opt-in אמיתי — ב-OPT_IN_KEYS, ב-FEATURES עם optIn:true, וכל שער
 *      בקוד הוא `=== true` מפורש (לא featureOn: חסר=דלוק היה מדליק לכל לקוח-חי בשקט — לקח-הקוקפיט).
 *  (ב) נתוני-הדוגמה לא דולפים לייצור: אף קובץ-מקור (מחוץ ל-__tests__) לא מייבא את fixtures.
 *  (ג) המסך עם source={null} מציג מצב-ריק כן; הכניסה האמיתית (EngineBoxEntry) בונה את המקור מהליבה (source.ts),
 *      והמתאם לא מייבא נתוני-דוגמה (ראו גם ב׳).
 *  (ד) הכניסה נטענת lazy — אין import סטטי של המסך/הכניסה ב-App/הגדרות (הבנדל הראשי לא גדל).
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FEATURES } from '../../../types/features';
import { OPT_IN_KEYS } from '../../builder/__tests__/optin-keys';
import { EMPTY_SOURCE_TEXT, EngineBoxScreen } from '../EngineBoxScreen';
import appSrc from '../../../App.tsx?raw';
import settingsSrc from '../../settings/SettingsView.tsx?raw';

const RAW: Record<string, string> = import.meta.glob(
  ['/src/**/*.{ts,tsx}'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;
const prod = Object.entries(RAW).filter(([p]) => !p.includes('__tests__') && !p.includes('.test.'));

describe('🧩 ארגז המנועים — שערים והגנות-מקור', () => {
  it('(א) shell.enginebox ב-OPT_IN_KEYS וב-FEATURES עם optIn:true', () => {
    expect(OPT_IN_KEYS).toContain('shell.enginebox');
    const def = FEATURES.find((f) => f.key === 'shell.enginebox');
    expect(def?.optIn).toBe(true);
    expect(def?.module).toBe('shell');
  });

  it('(א) כל שער בקוד = `=== true` מפורש, לעולם לא featureOn', () => {
    const gate = "features?.['shell.enginebox'] === true";
    expect(appSrc).toContain(gate);
    expect(settingsSrc).toContain(gate);
    for (const [path, src] of prod) {
      expect(src.includes("featureOn(config, 'shell.enginebox')"), path).toBe(false);
      expect(/features\?\.\['shell\.enginebox'\]\s*!==\s*false/.test(src), path).toBe(false);
    }
  });

  it('(ב) קוד-ייצור לעולם לא מייבא את נתוני-הדוגמה', () => {
    expect(prod.length).toBeGreaterThan(100); // הסריקה חיה
    for (const [path, src] of prod) {
      expect(/from\s+['"][^'"]*enginebox\/__tests__/.test(src), path).toBe(false);
      if (path.includes('/components/enginebox/')) {
        expect(/__tests__|fixtures/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), path).toBe(false);
      }
    }
  });

  it('(ג) המסך עם source={null} מציג מצב-ריק כן; הכניסה מעבירה מקור אמיתי מהליבה', () => {
    const out = renderToStaticMarkup(createElement(EngineBoxScreen, { source: null, onClose: () => {} }));
    expect(out).toContain(EMPTY_SOURCE_TEXT);
    // שינוי-נעילה מכוון (ENGINEBOX-B 13.10): הכניסה כבר לא source={null} — EngineBoxEntry בונה engineBoxSource מעל הליבה
    expect(appSrc).not.toMatch(/<EngineBoxScreen\s+source=\{null\}/);
    expect(appSrc).toMatch(/<EngineBoxEntry\s+onClose=/);
    const entry = prod.find(([p]) => p.endsWith('/components/enginebox/EngineBoxEntry.tsx'))?.[1] ?? '';
    expect(entry).toContain('<EngineBoxScreen source={source} onClose={props.onClose} />');
    expect(entry).toMatch(/engineBoxSource\(\{/);
    const source = prod.find(([p]) => p.endsWith('/components/enginebox/source.ts'))?.[1] ?? '';
    expect(source).toContain("from '../../lib/enginebox/match'");
    expect(/fixtures|__tests__/.test(source.replace(/\/\*[\s\S]*?\*\//g, ''))).toBe(false);
  });

  it('(ד) הכניסה נטענת lazy בלבד', () => {
    expect(appSrc).toContain("lazy(async () => ({ default: (await import('./components/enginebox/EngineBoxEntry')).EngineBoxEntry }))");
    expect(appSrc).not.toMatch(/^import[^\n]*enginebox/m);
    expect(settingsSrc).not.toMatch(/enginebox\/(EngineBoxScreen|EngineBoxEntry|source)/);
  });
});
