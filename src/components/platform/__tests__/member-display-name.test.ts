/**
 * ratchet — 🪪 שם-תצוגה לעובד/ת (בקשת-בעלים 6.9 "בכל מייל בעובדים לרשום שם — שיראו בחוץ מי זה"):
 * memberConfigs[email].displayName (Rules v3 מכסים — מנהל מעדכן memberConfigs) ⇒ מוצג במקום
 * המייל בכרטיס-העובד, בלוג-הפעולות ובצ׳אט-הצוות; נזרע מבקשת-ההצטרפות.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { memberDisplayName, memberNamesOf, setEmployeeOverride, whoLabel } from '../lib';
import type { OrgCloudDoc } from '../../../lib/cloudConfig';

const org: OrgCloudDoc = {
  members: ['a@x.com', 'b@x.com'],
  memberConfigs: { 'a@x.com': { displayName: ' רבקה — מזכירות ' }, 'b@x.com': { modules: {} } },
} as unknown as OrgCloudDoc;

describe('מנוע', () => {
  it('memberDisplayName: שם כשקיים (מנוקה), אחרת המייל; לא-רגיש לאותיות/רווחים במייל', () => {
    expect(memberDisplayName(org, 'a@x.com')).toBe('רבקה — מזכירות');
    expect(memberDisplayName(org, ' A@X.com ')).toBe('רבקה — מזכירות');
    expect(memberDisplayName(org, 'b@x.com')).toBe('b@x.com');
    expect(memberDisplayName(null, 'z@x.com')).toBe('z@x.com');
  });
  it('memberNamesOf: רק מי שהוגדר לו שם; whoLabel: שם/מייל/—', () => {
    const names = memberNamesOf(org);
    expect(names).toEqual({ 'a@x.com': 'רבקה — מזכירות' });
    expect(whoLabel(names, 'A@x.com')).toBe('רבקה — מזכירות');
    expect(whoLabel(names, 'b@x.com')).toBe('b@x.com');
    expect(whoLabel(names, '')).toBe('—');
    expect(whoLabel(undefined, 'q@x.com')).toBe('q@x.com');
  });
  it('setEmployeeOverride שומר displayName לצד שאר השדות', () => {
    const { memberConfigs } = setEmployeeOverride(org, 'b@x.com', { modules: {}, displayName: 'דוד' });
    expect(memberConfigs['b@x.com']).toEqual({ modules: {}, displayName: 'דוד' });
    expect(memberConfigs['a@x.com'].displayName).toBe(' רבקה — מזכירות ');
  });
});

describe('חיווט (הגנות-מקור)', () => {
  const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
  it('כרטיס-העובד: שדה "שם להצגה", שם ראשון בכותרת, זריעה מבקשת-ההצטרפות', () => {
    const mp = src('../ManagerPanel.tsx');
    expect(mp).toContain('🪪 שם להצגה');
    expect(mp).toContain('<b>{ov.displayName?.trim() || email}</b>');
    expect(mp).toContain("displayName: (r.name ?? '').trim()");
    expect(mp).toContain('async function setDisplayName(email: string, value: string)');
  });
  it('הסטור נושא memberNames משני מסלולי-הקונפיג; לוג-הפעולות והצ׳אט מציגים שם', () => {
    const store = src('../../../store/useApp.ts');
    expect((store.match(/memberNames: memberNamesOf\(orgDoc\)/g) ?? []).length).toBe(2);
    expect(src('../../settings/SettingsView.tsx')).toContain('{whoLabel(memberNames, r.who)}');
    const chat = src('../../support/SupportChat.tsx');
    expect(chat).toContain("const myName = memberNames?.[myEmail] || myEmail.split('@')[0] || 'אני';");
    expect(chat).toContain("memberNames?.[(m.sender ?? '').toLowerCase()] || m.name");
  });
});
