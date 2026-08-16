/**
 * ratchet — "חבר את מאור" (בקשת-בעלים 15.8): הפעלת ניהול-עובדות ללקוח-שורש בקליק.
 * הבעלים לא עורך Firestore ידנית — כפתור בהגדרות כותב manager=הבעלים למסמך-הארגון
 * (merge, לא הרסני), וכך `👥 ניהול העובדות` נפתח ומקצים ייעודים-פר-עובד.
 */
import { describe, expect, it } from 'vitest';
import storeSrc from '../../../store/useApp.ts?raw';
import secSrc from '../EmployeeMgmtSection.tsx?raw';
import viewSrc from '../SettingsView.tsx?raw';

describe('👥 ratchet — הפעלת ניהול-עובדות (חבר את מאור)', () => {
  it('enableEmployeeManagement — merge לא-הרסני: manager=הבעלים + members כולל אותו', () => {
    const m = storeSrc.match(/async enableEmployeeManagement\(\)[\s\S]*?\n {4}\},/);
    expect(m).toBeTruthy();
    const body = m![0];
    // מגודר מייל-על
    expect(body).toContain('isSuperAdmin(cl.user?.email)');
    // כתיבת-merge של manager+members בלבד (לא config/נתונים)
    expect(body).toContain('writeOrgCloudDoc(slug, { manager: email, members: nextMembers })');
    // תוקף-מיידי לצ׳יפ
    expect(body).toContain('setCloud({ isManager: true })');
    // אידמפוטנטי — לא מוסיף כפילות אם כבר חבר
    expect(body).toContain('members.some((m) => m.trim().toLowerCase() === email)');
  });

  it('הרכיב מגודר מייל-על ומחווט לפעולה; מוצג ב-SettingsView', () => {
    expect(secSrc).toContain('if (!isSuperAdmin(cloudUser?.email)) return null;');
    expect(secSrc).toContain('s.enableEmployeeManagement');
    expect(viewSrc).toContain('<EmployeeMgmtSection />');
  });
});
