/**
 * ratchet (20.11.2026) — bundle-split שלב ב׳: nextClosure עבר לגשר-דק closure.ts.
 *
 * הבאג: home/widgets.tsx (בבנדל הראשי) ייבא את nextClosure מ-components/telephony/lib.ts, שמייבא
 * את engine.ts ⇒ index.mjs (מחולל) + simulate.mjs + report.mjs. כל מנוע-הטלפוניה נגרר לכל כניסה
 * בשביל ווידג'ט "זמני שבת/חג" שצריך רק zmanim.mjs. הבנדל: 131.5KB ⇒ 112.8KB gzip.
 *
 * נאכף כאן: (1) הפלט זהה בית-בבית למימוש המקורי (מעל engine.ts) — 400 ימים × כל הערים + קצוות;
 * (2) closure.ts לא מייבא את engine בזמן-ריצה ולא את המחולל/סימולטור; (3) הבית מייבא את הגשר-הדק.
 */
import { describe, expect, it } from 'vitest';
import { nextClosure } from '../closure';
import { nextClosure as viaPanelLib } from '../../../components/telephony/lib';
import { hebrewClosedWindows, CITIES } from '../engine';
import type { OrgConfig } from '../../../types/config';
import closureSrc from '../closure.ts?raw';
import widgetsSrc from '../../../components/home/widgets.tsx?raw';

/** המימוש המקורי מילה-במילה (לפני ההעברה), מעל engine.ts. */
function referenceNextClosure(config: OrgConfig, todayIso: string) {
  const tel = config.telephony;
  if (!tel) return null;
  const city = tel.city || 'default';
  const tenant = { city, timezone: 'Asia/Jerusalem' };
  const wins = hebrewClosedWindows(todayIso, 10, tenant, {});
  const w = wins[0];
  if (!w) return null;
  const cityHe = (tel.city && CITIES[tel.city]) ? CITIES[tel.city].he : CITIES.jerusalem.he;
  return { reason: w.reason, kind: w.kind, startIso: w.startIso, candle: w.startTime, endIso: w.endIso, tzeis: w.endTime, cityHe };
}

const cfg = (telephony?: Record<string, unknown>) => ({ telephony } as unknown as OrgConfig);
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('closure.ts — זהה בית-בבית למימוש המקורי', () => {
  const cities: (string | undefined)[] = [...Object.keys(CITIES), undefined, 'no-such-city'];
  it(`400 ימים × ${cities.length} ערים (כולל חסר/לא-קיים)`, () => {
    let compared = 0;
    for (const city of cities) {
      const c = cfg({ enabled: true, ...(city === undefined ? {} : { city }) });
      const d = new Date(Date.UTC(2026, 8, 1, 12)); // 1.9.2026 — מכסה תשרי (ר״ה/יוה״כ/סוכות) ושנה שלמה
      for (let i = 0; i < 400; i++, d.setUTCDate(d.getUTCDate() + 1)) {
        expect(nextClosure(c, iso(d))).toEqual(referenceNextClosure(c, iso(d)));
        compared++;
      }
    }
    expect(compared).toBe(400 * cities.length);
  });

  it('בלי telephony ⇒ null (כמו קודם)', () => {
    expect(nextClosure(cfg(undefined), '2026-11-20')).toBeNull();
  });

  it('components/telephony/lib מייצא-מחדש את אותה פונקציה (ה-API לא השתנה)', () => {
    expect(viaPanelLib).toBe(nextClosure);
  });
});

describe('closure.ts — דק באמת', () => {
  it('לא מייבא את engine/מחולל/סימולטור/דוח בזמן-ריצה (רק טיפוסים מ-engine)', () => {
    const runtimeImports = closureSrc.split('\n').filter((l) => /^import\s(?!type\b)/.test(l));
    expect(runtimeImports.join('\n')).not.toMatch(/engine|index\.mjs|simulate\.mjs|report\.mjs|generate\.mjs|validate\.mjs/);
    expect(runtimeImports.join('\n')).toMatch(/zmanim\.mjs/);
  });

  it('ווידג\'ט-הבית מייבא את nextClosure מהגשר-הדק, לא מ-components/telephony/lib', () => {
    expect(widgetsSrc).toMatch(/import\s*\{\s*nextClosure\s*\}\s*from\s*'\.\.\/\.\.\/lib\/telephony\/closure'/);
    expect(widgetsSrc).not.toMatch(/from\s*'\.\.\/telephony\/lib'/);
  });
});
