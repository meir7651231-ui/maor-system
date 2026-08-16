/**
 * ratchet — אכיפת-תומכים בשרת (15.8, ארגוני-פלטפורמה) · הפעלה + Rules.
 * מקביל ל-donation-split-activate: מיגרציה (seed skey) → הדלקת-דגל בקליק; Rules
 * פר-skey (memberSeesSupporter) + carve-out; שורש נחסם (מודל-השורש בלי „עובד מוגבל").
 */
import { describe, expect, it } from 'vitest';
import storeSrc from '../../../store/useApp.ts?raw';
import secSrc from '../SupEnforceSection.tsx?raw';
import viewSrc from '../SettingsView.tsx?raw';
import rulesSrc from '../../../../firestore.rules?raw';
import { supEnforceOn } from '../../../lib/config';
import { DEFAULT_CONFIG } from '../../../types/config';

describe('🔒 ratchet — הפעלת אכיפת-תומכים', () => {
  it('supEnforceOn — off-by-default; רק supporterEnforce:true מפעיל', () => {
    expect(supEnforceOn(DEFAULT_CONFIG)).toBe(false);
    expect(supEnforceOn({ ...DEFAULT_CONFIG, supporterEnforce: true })).toBe(true);
  });

  it('enableSupEnforce — כותב merge של supporterEnforce:true; חוסם שורש/default', () => {
    const m = storeSrc.match(/async enableSupEnforce\(\)[\s\S]*?\n {4}\},/);
    expect(m).toBeTruthy();
    const body = m![0];
    expect(body).toContain("writeOrgCloudDoc(slug, { config: { supporterEnforce: true } })");
    expect(body).toContain("slug === 'default'");
    expect(body).toContain('cfg.cloudRoot === true'); // שורש נחסם
    expect(body).toContain('mod.setSupEnforce(true)');
  });

  it('מיגרציה: runSupEnforceMigration קורא migrateSupportersToKeyed אחרי גיבוי', () => {
    const body = storeSrc.match(/async runSupEnforceMigration\(\)[\s\S]*?\n {4}\},/)![0];
    expect(body).toContain('exportBackupFile(get().db)');
    expect(body).toContain('migrateSupportersToKeyed(get().db.supporters, get().db.events, mod.getCloudDek())');
  });

  it('חיווט-סנכרון: setSupEnforce נקרא ליד setDonationSplit (connectCloud + applyCloudDoc)', () => {
    expect(storeSrc).toContain('mod.setSupEnforce(supEnforceOn(cfg))');
    expect(storeSrc).toContain('mod.setSupEnforce(supEnforceOn(eff))');
  });

  it('הרכיב מגודר מייל-על, מחווט לפעולות, ומוצג ב-SettingsView', () => {
    expect(secSrc).toContain('if (!isSuperAdmin(cloudUser?.email)) return null;');
    expect(secSrc).toContain('s.runSupEnforceMigration');
    expect(secSrc).toContain('s.enableSupEnforce');
    expect(viewSrc).toContain('<SupEnforceSection />');
  });

  it('Rules: helper פר-skey + carve-out + match ייעודי לאוסף-התומכים', () => {
    expect(rulesSrc).toContain('function memberSeesSupporter(slug, skey)');
    expect(rulesSrc).toContain("col != 'donations' && col != 'supporters'");
    expect(rulesSrc).toContain('match /orgs/{slug}/supporters/{id}');
    // תאימות-לאחור: skey חסר ⇒ '_shared_' (פרסום-Rules לא שובר ארגון בלי מיגרציה)
    expect(rulesSrc).toContain("memberSeesSupporter(slug, resource.data.get('skey', '_shared_'))");
  });
});
