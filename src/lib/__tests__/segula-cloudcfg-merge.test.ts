/**
 * ratchet — 5.10.2026: שורש "🕯 40 יום לא נשמר דלוק" (הדיווח הרביעי של הבעלים; #494/#496/#501 לא עזרו).
 *
 * הבאג: `writeOrgCloudConfig` כתב את קונפיג-הארגון עם `setDoc(…, { merge: true })`. merge:true ממזג-עומק
 * מפות (features/modules/terms). האשף/לוח-הבקרה "מדליקים" דגל ע"י **מחיקת-המפתח** (חוזה "חסר=דלוק") —
 * מפתח שנמחק מקומית לא נשלח, וה-`false` הישן נשאר בענן לנצח. כך `supporters.segula:false` (ואחרי #501 —
 * `core.taxreceipt:false`) שרדו כל "הדלקה", והלקוח המשיך לקבל false ב-onSnapshot. הוכח על אמולטור-Firestore
 * אמיתי (e2e/rules-redteam.mjs §י״א). התיקון: `mergeFields: ['config']` — config מוחלף בשלמותו, שאר שדות-המסמך
 * (members/manager/memberConfigs) לא נגועים.
 *
 * כאן: (א) סימולציה טהורה של שתי הסמנטיקות על "הדלקה-באשף" — ממחישה למה merge:true מאבד את ההדלקה;
 * (ב) הגנת-מקור: writeOrgCloudConfig חייב לכתוב עם mergeFields:['config'] ולא דרך writeOrgCloudDoc/merge:true;
 * (ג) אבחון-הדגלים מציג גם raw core.taxreceipt (הדגל שבאמת קובע מאז #501) — false תקוע לא יהיה בלתי-נראה.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { featureOn } from '../config';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

/** סמנטיקת merge:true של Firestore על מפות מקוננות (ממוזג-עומק; מפה ריקה מחליפה) — כמו שהאמולטור הוכיח. */
function deepMergeLikeFirestore(cur: Record<string, unknown>, inc: Record<string, unknown>): Record<string, unknown> {
  const out = { ...cur };
  for (const [k, v] of Object.entries(inc)) {
    const c = out[k];
    const isMap = (x: unknown) => !!x && typeof x === 'object' && !Array.isArray(x);
    out[k] = isMap(v) && isMap(c) && Object.keys(v as object).length > 0 ? deepMergeLikeFirestore(c as Record<string, unknown>, v as Record<string, unknown>) : v;
  }
  return out;
}

/** "הדלקה" כמו ב-BuilderWizard.setFeatures: דגל לא-opt-in ⇒ מחיקת המפתח. */
function wizardTurnOn(cfg: OrgConfig, key: string): OrgConfig {
  const features = { ...cfg.features };
  delete features[key];
  return { ...cfg, features };
}

describe('🕯 שורש "40 יום לא נשמר דלוק" — merge:true מול mergeFields', () => {
  const cloud: OrgConfig = { ...DEFAULT_CONFIG, slug: 'acme', orgName: 'Acme', features: { 'supporters.segula': false, 'core.taxreceipt': false, 'supporters.hok': false } };
  const turnedOn = wizardTurnOn(wizardTurnOn(cloud, 'supporters.segula'), 'core.taxreceipt');

  it('מקומית ההדלקה עובדת: הכפתור נראה (core.taxreceipt חסר=דלוק)', () => {
    expect(featureOn(cloud, 'core.taxreceipt')).toBe(false);
    expect(featureOn(turnedOn, 'core.taxreceipt')).toBe(true);
    expect(turnedOn.features).toEqual({ 'supporters.hok': false });
  });

  it('(הבאג) merge:true: מה שהענן מחזיק אחרי ההדלקה עדיין מכבה את הכפתור', () => {
    const doc = { members: ['a@b.c'], config: cloud as unknown as Record<string, unknown> };
    const after = deepMergeLikeFirestore(doc, { config: turnedOn as unknown as Record<string, unknown> });
    const cfgAfter = after.config as unknown as OrgConfig & { features: Record<string, boolean> };
    expect(cfgAfter.features['core.taxreceipt']).toBe(false); // ה-false התקוע
    expect(cfgAfter.features['supporters.segula']).toBe(false);
    expect(featureOn(cfgAfter, 'core.taxreceipt')).toBe(false); // ⇒ הלקוח לא רואה 40 יום, שוב ושוב
  });

  it('(התיקון) mergeFields:[config]: config מוחלף בשלמותו, members נשמר, הכפתור נראה', () => {
    const doc = { members: ['a@b.c'], config: cloud as unknown as Record<string, unknown> };
    const after = { ...doc, config: turnedOn as unknown as Record<string, unknown> }; // סמנטיקת mergeFields על השדה
    const cfgAfter = after.config as unknown as OrgConfig & { features: Record<string, boolean> };
    expect('core.taxreceipt' in cfgAfter.features).toBe(false);
    expect('supporters.segula' in cfgAfter.features).toBe(false);
    expect(cfgAfter.features['supporters.hok']).toBe(false); // כיבוי מפורש אחר נשמר
    expect(featureOn(cfgAfter, 'core.taxreceipt')).toBe(true);
    expect(after.members).toEqual(['a@b.c']);
  });
});

describe('הגנות-מקור', () => {
  it('writeOrgCloudConfig כותב config עם mergeFields:[config] — לא merge:true ולא דרך writeOrgCloudDoc', () => {
    const s = src('../cloudConfig.ts');
    const fn = s.slice(s.indexOf('export async function writeOrgCloudConfig'), s.indexOf('/* ── כספת-מפתחות'));
    expect(fn).toContain("{ mergeFields: ['config', 'configMeta'] }"); // 6.10: + חותמת-כותב לאבחון
    expect(fn).not.toContain('merge: true');
    expect(fn).not.toContain('writeOrgCloudDoc(');
  });
  it('האשף-המרוחק ולוח-הבקרה כותבים קונפיג רק נקודתית (patchOrgCloudConfig, 6.10) — לא תצלום-מלא', () => {
    for (const p of ['../../components/builder/RemoteWizard.tsx', '../../components/platform/PlatformPanel.tsx']) {
      const s = src(p);
      expect(s).toContain('patchOrgCloudConfig(');
      expect(s).not.toContain('writeOrgCloudConfig(');
      // לידת-ארגון (approve) כותבת config על מסמך חדש דרך writeOrgCloudDoc — מותר (אין false ישן); עדכון-קונפיג לא.
      expect(s).not.toMatch(/writeOrgCloudDoc\([^)]*\{\s*config:\s*(next|s\.config|cfg)\b/);
    }
  });
  it('🔎 אבחון-דגלים מציג גם raw core.taxreceipt (הדגל שקובע מאז #501)', () => {
    const s = src('../../components/settings/SettingsView.tsx');
    expect(s).toContain("raw core.taxreceipt=' + String(config.features?.['core.taxreceipt'])");
  });
});
