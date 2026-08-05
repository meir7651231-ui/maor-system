/**
 * ratchet — לוג-פעולות (ROADMAP-100 ‏#10): טבעת חצובת-תקרה, סנכרון-meta,
 * והגנות-מקור שהפעולות-הקריטיות אכן רושמות (תרומה/תשלום/מחיקות/שחזור).
 */
import { describe, expect, it } from 'vitest';
import { AUDIT_CAP, emptyDb, pushAudit, type AuditEntry, type Db } from '../../types/domain';
import { metaOf } from '../../lib/cloud-diff';
import useAppSrc from '../useApp.ts?raw';
import settingsSrc from '../../components/settings/SettingsView.tsx?raw';

const e = (i: number): AuditEntry => ({ at: '2026-08-05T10:00:0' + (i % 10), who: 'a@b.c', act: 'פ' + i, what: 'w' });

describe('🧾 ratchet — לוג-פעולות (#10)', () => {
  it('pushAudit: טבעת — מעבר ל-AUDIT_CAP דוחק את הוותיקה; undefined ⇒ מתחיל מרשימה ריקה', () => {
    let list: AuditEntry[] | undefined;
    for (let i = 0; i < AUDIT_CAP + 7; i++) list = pushAudit(list, e(i));
    expect(list!.length).toBe(AUDIT_CAP);
    expect(list![0].act).toBe('פ7'); // 7 הוותיקות נדחקו
    expect(list![AUDIT_CAP - 1].act).toBe('פ' + (AUDIT_CAP + 6));
  });

  it('הלוג רוכב על meta בסנכרון-הענן (metaOf כולל audit)', () => {
    const db: Db = { ...emptyDb(), audit: [e(1)] };
    const meta = metaOf(db) as { audit?: AuditEntry[] };
    expect(meta.audit?.length).toBe(1);
  });

  it('🛡 הגנת-מקור: הפעולות-הקריטיות רושמות — תרומה, תשלום, מחיקות, שחזור', () => {
    expect(useAppSrc).toContain("logAudit('תרומה'");
    expect(useAppSrc).toContain("logAudit('תשלום'");
    expect(useAppSrc).toContain("logAudit('מחיקת משפחה'");
    expect(useAppSrc).toContain("logAudit('מחיקת תומכ/ת'");
    expect(useAppSrc).toContain("logAudit('שחזור מגיבוי'");
    expect(useAppSrc).toContain("logAudit('שמירת משפחה'");
  });

  it('🛡 מסך-הצפייה: מגודר דגל settings.audittrail + מנהל בלבד', () => {
    expect(settingsSrc).toContain("featureOn(config, 'settings.audittrail')");
    expect(settingsSrc).toMatch(/AuditTrailSection[\s\S]{0,400}isAdminUser\(config, cloudUser\?\.email\)/);
  });

  it('🛡 הגנת-מקור: אין `?? []` בתוך סלקטור zustand — מערך-חדש-כל-snapshot ⇒ לולאת-רינדור React #185', () => {
    // הבאג: useApp((s) => s.db.audit ?? []) החזיר [] טרי בכל getSnapshot כשאין
    // לוג ⇒ useSyncExternalStore ראה ערך "שהשתנה" בכל רינדור ⇒ קריסת המסך
    // (נתפס ב-launch-readiness, מסע ייבוא-גיבוי). ברירת-המחדל חייבת להיות בחוץ.
    expect(settingsSrc).not.toMatch(/useApp\(\(s\) => [^)]*\?\? \[\]\)/);
    expect(settingsSrc).toContain('useApp((s) => s.db.audit) ?? []');
  });
});
