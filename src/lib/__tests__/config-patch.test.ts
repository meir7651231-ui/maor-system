/**
 * ratchet — 🩹 כתיבה נקודתית של קונפיג-הארגון (6.10.2026, "40 יום נדלק ונכבה לבד").
 *
 * הבאג: לוח-הבקרה והאשף-המרוחק כתבו לענן תצלום-מלא של הקונפיג; שני משטחים עם תצלומים שונים
 * (לוח-בקרה + אשף / שני טאבים) דרסו זה את זה בכל לחיצה — דגל שהודלק כאן כובה משם. אחרי #504
 * (החלפה אמיתית) הדריסה נעשתה גלויה. התיקון: diff שדה-שדה (configPatchOps) ⇒ updateDoc ב-FieldPath
 * פר-מפתח (patchOrgCloudConfig); מחיקת-מפתח = deleteField. הוכח על אמולטור (rules-redteam §י״ב).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyConfigPatch, configPatchOps } from '../configPatch';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const base: OrgConfig = { ...DEFAULT_CONFIG, slug: 'acme', orgName: 'Acme', features: { 'supporters.segula': false, 'supporters.hok': false }, modules: { shop: false }, terms: { 'nav.families': 'מטופלים' } };

describe('configPatchOps — רק מה שהשתנה', () => {
  it('ללא שינוי ⇒ אין פעולות; הדלקת דגל (מחיקת-מפתח) ⇒ פעולת-מחיקה אחת בלבד', () => {
    expect(configPatchOps(base, { ...base })).toEqual([]);
    const next = { ...base, features: { 'supporters.hok': false } };
    expect(configPatchOps(base, next)).toEqual([{ path: ['features', 'supporters.segula'], del: true }]);
  });
  it('כיבוי דגל / שינוי מונח / שינוי שם — פעולת-set ממוקדת; slug לעולם לא נכתב', () => {
    const next = { ...base, slug: 'other', orgName: 'Acme 2', features: { ...base.features, 'courses.broadcast': false }, terms: { 'nav.families': 'לקוחות' } };
    expect(configPatchOps(base, next)).toEqual([
      { path: ['features', 'courses.broadcast'], value: false },
      { path: ['orgName'], value: 'Acme 2' },
      { path: ['terms', 'nav.families'], value: 'לקוחות' },
    ]);
  });
  it('שדה עליון שהוסר (למשל accent) ⇒ מחיקה; prev=null ⇒ כותבים הכול בלי מחיקות', () => {
    const withAccent = { ...base, accent: '#abc' };
    expect(configPatchOps(withAccent, base)).toEqual([{ path: ['accent'], del: true }]);
    const all = configPatchOps(null, base);
    expect(all.some((o) => o.del)).toBe(false);
    expect(all).toContainEqual({ path: ['features', 'supporters.segula'], value: false });
    expect(all).toContainEqual({ path: ['orgName'], value: 'Acme' });
  });
  it('שני משטחים עם תצלומים שונים מתכנסים (הסימולציה של "נדלק ונכבה לבד")', () => {
    // A (לוח-בקרה) מדליק segula; B (אשף, תצלום ישן) מכבה broadcast — כל אחד כותב רק את שלו
    const opsA = configPatchOps(base, { ...base, features: { 'supporters.hok': false } });
    const opsB = configPatchOps(base, { ...base, features: { ...base.features, 'courses.broadcast': false } });
    const cloud = applyConfigPatch(applyConfigPatch(base, opsA), opsB);
    expect(cloud.features).toEqual({ 'supporters.hok': false, 'courses.broadcast': false }); // segula נשאר דלוק, broadcast כבוי
    // לעומת תצלום-מלא: B היה מחזיר segula:false (הדריסה הישנה)
    expect(base.features?.['supporters.segula']).toBe(false);
  });
});

describe('הגנות-מקור', () => {
  it('patchOrgCloudConfig: updateDoc ב-FieldPath פר-מפתח + deleteField + חותמת configMeta; נפילה לכתיבה-מלאה רק ב-not-found', () => {
    const s = src('../cloudConfig.ts');
    const fn = s.slice(s.indexOf('export async function patchOrgCloudConfig'), s.indexOf('/* ── כספת-מפתחות'));
    expect(fn).toContain("new FieldPath('config', ...op.path)");
    expect(fn).toContain('op.del ? deleteField()');
    expect(fn).toContain("new FieldPath('configMeta')");
    expect(fn).toContain("!== 'not-found' || !full) throw e;");
    expect(fn).not.toContain('merge: true');
  });
  it('לוח-הבקרה: diff מול התצלום שבמסך (cfg) ⇒ patch; האשף-המרוחק: diff מול lastWritten ⇒ patch', () => {
    const panel = src('../../components/platform/PlatformPanel.tsx');
    expect(panel).toContain('const ops = configPatchOps(cfg, next);');
    expect(panel).toContain("mod.patchOrgCloudConfig(sel, ops, by, 'platform', next)");
    const wiz = src('../../components/builder/RemoteWizard.tsx');
    expect(wiz).toContain('const ops = configPatchOps(lastWritten.current, next);');
    expect(wiz).toContain("?.patchOrgCloudConfig(slug, ops, by, 'builder', next)");
    expect(wiz).toContain('lastWritten.current = { ...norm, slug };');
  });
  it('אבחון-הדגלים מציג "config last write" (מי/מתי/מאיזה משטח/אילו מפתחות)', () => {
    const s = src('../../components/settings/SettingsView.tsx');
    expect(s).toContain("'config last write: ' + (cfgMeta ?");
    const store = src('../../store/useApp.ts');
    expect(store).toContain('cfgMeta: orgDoc.configMeta ?? null');
  });
});
