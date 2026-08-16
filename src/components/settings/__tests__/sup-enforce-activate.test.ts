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
    // מתג-אחד (15.8): הדלקה=turnOnSupEnforce (מיגרציה+דגל); כיבוי=disableSupEnforce
    expect(secSrc).toContain('s.turnOnSupEnforce');
    expect(secSrc).toContain('s.disableSupEnforce');
    // turnOnSupEnforce עצמו קורא את שתי הפעולות ברצף
    const t = storeSrc.match(/async turnOnSupEnforce\(\)[\s\S]*?\n {4}\},/)![0];
    expect(t).toContain('runSupEnforceMigration()');
    expect(t).toContain('enableSupEnforce()');
    expect(viewSrc).toContain('<SupEnforceSection />');
  });

  it('Rules: helper פר-skey + carve-out + match ייעודי לאוסף-התומכים', () => {
    expect(rulesSrc).toContain('function memberSeesSupporter(slug, skey)');
    expect(rulesSrc).toContain("!(col in ['donations', 'supporters', 'events', 'auditlog', 'incomingPayments', 'smsOutbox', 'mailOutbox'])");
    expect(rulesSrc).toContain('match /orgs/{slug}/supporters/{id}');
    // נחיל 16.8 (CRITICAL): כתיבה נאכפת פר-skey — canWriteKeyedSup (existing+new key)
    expect(rulesSrc).toContain('canWriteKeyedSup(slug, resource.data.get');
    // תאימות-לאחור: skey חסר ⇒ '_shared_' (פרסום-Rules לא שובר ארגון בלי מיגרציה)
    expect(rulesSrc).toContain("memberSeesSupporter(slug, resource.data.get('skey', '_shared_'))");
  });

  it('מתג supporterEnforce קיים באשף-ההקמה ובלוח-הבקרה (הקמה + עריכה-חיה)', async () => {
    const wiz = (await import('../../builder/BuilderWizard.tsx?raw')).default;
    const panel = (await import('../../platform/PlatformPanel.tsx?raw')).default;
    // אשף-ההקמה (BuilderWizard) — נעטף גם ב-RemoteWizard (הקמה קשורת-ענן)
    expect(wiz).toContain('patch({ supporterEnforce: e.target.checked ? true : undefined })');
    // לוח-הבקרה (עריכה-חיה)
    expect(panel).toContain('supporterEnforce: e.target.checked ? true : undefined');
  });
});
