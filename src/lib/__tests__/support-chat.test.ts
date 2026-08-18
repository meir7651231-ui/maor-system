/**
 * ratchet — 💬 צ׳אט-תמיכה חי (17.8). המנוע טהור; והגנות-מקור: החיווט חי (onSnapshot
 * אמיתי, לא מוקאפ), מגודר ענן+התחברות, ו-Rules אוכפים from (user↔admin) + תקרות.
 * הרקע: בנייה-חכמה = צ׳אט-תצוגה (hardcoded threads + auto-reply, בלי שרת); כאן חי.
 */
import { describe, expect, it } from 'vitest';
import {
  isSendableSupportText,
  sanitizeSupportText,
  sortSupportMsgs,
  sortSupportThreads,
  sortTeamMsgs,
  supportDayLabel,
  supportMsgTime,
  supportPreview,
  supportUnread,
  SUPPORT_MSG_MAX,
  type SupportMsg,
  type TeamMsg,
} from '../supportChat';
import { FEATURES } from '../../types/features';
import chatSrc from '../../components/support/SupportChat.tsx?raw';
import appSrc from '../../App.tsx?raw';
import cloudCfgSrc from '../cloudConfig.ts?raw';
import rulesSrc from '../../../firestore.rules?raw';

describe('💬 ratchet — צ׳אט-תמיכה: מנוע טהור', () => {
  it('sanitize: trim + חיתוך-לתקרה; שליחוּת', () => {
    expect(sanitizeSupportText('  שלום  ')).toBe('שלום');
    expect(sanitizeSupportText('')).toBe('');
    expect(sanitizeSupportText('  \n ')).toBe('');
    expect(sanitizeSupportText('x'.repeat(5000)).length).toBe(SUPPORT_MSG_MAX);
    expect(isSendableSupportText('  ')).toBe(false);
    expect(isSendableSupportText('היי')).toBe(true);
  });

  it('מיון-הודעות: ישן→חדש, לא-משנה-מקור', () => {
    const msgs: SupportMsg[] = [
      { from: 'user', text: 'ב', at: '2026-08-18T10:00:00.000Z' },
      { from: 'admin', text: 'א', at: '2026-08-18T09:00:00.000Z' },
    ];
    const sorted = sortSupportMsgs(msgs);
    expect(sorted.map((m) => m.text)).toEqual(['א', 'ב']);
    expect(msgs[0].text).toBe('ב'); // המקור לא השתנה
  });

  it('שעה + תווית-יום (today/אתמול/תאריך)', () => {
    expect(supportMsgTime('2026-08-18T10:05:00.000Z')).toMatch(/\d{1,2}:\d{2}/);
    expect(supportDayLabel('2026-08-18T08:00:00.000Z', '2026-08-18')).toBe('היום');
    expect(supportDayLabel('2026-08-17T08:00:00.000Z', '2026-08-18')).toBe('אתמול');
    expect(supportDayLabel('2026-08-10T08:00:00.000Z', '2026-08-18')).toBe('10/08/2026');
  });

  it('preview + unread לא-שלילי', () => {
    expect(supportPreview('א'.repeat(60), 40).length).toBeLessThanOrEqual(40);
    expect(supportUnread(null, 'admin')).toBe(0);
    expect(supportUnread({ unreadAdmin: 3 }, 'admin')).toBe(3);
    expect(supportUnread({ unreadAdmin: -2 }, 'admin')).toBe(0);
  });

  it('מיון-שיחות: לא-נקרא-לתמיכה קודם, ואז lastAt יורד', () => {
    const t = sortSupportThreads([
      { uid: 'a', lastAt: '2026-08-18T09:00:00Z', unreadAdmin: 0 },
      { uid: 'b', lastAt: '2026-08-18T08:00:00Z', unreadAdmin: 2 },
      { uid: 'c', lastAt: '2026-08-18T10:00:00Z', unreadAdmin: 0 },
    ]);
    expect(t.map((x) => x.uid)).toEqual(['b', 'c', 'a']); // b לא-נקרא ראשון; ואז c(10:00)>a(09:00)
  });
});

describe('💬 ratchet — צ׳אט-תמיכה: הגנות-מקור (חי, לא מוקאפ)', () => {
  it('החיווט חי — onSnapshot אמיתי דרך cloudConfig (לא hardcoded)', () => {
    expect(cloudCfgSrc).toContain('export const SUPPORT_CHATS');
    expect(cloudCfgSrc).toContain('watchSupportMessages');
    expect(cloudCfgSrc).toMatch(/onSnapshot\(\s*collection\(cloudDb\(\), SUPPORT_CHATS/);
    expect(chatSrc).toContain('mod.watchSupportMessages');
    // אין מוק — לא thread מוטבע בקוד
    expect(chatSrc).not.toMatch(/const _kThreads|hardcoded|autoReply/);
  });

  it('מגודר ענן+התחברות; מייל-על⇒תיבה, לקוח⇒שיחה', () => {
    expect(appSrc).toContain('cloud.enabled && cloud.user');
    expect(appSrc).toContain('<SupportChatModal');
    expect(appSrc).toContain('<SupportInbox');
  });

  it('🛡 Rules: supportChats — from נאכף (user↔admin), טקסט תחום, create-בלבד', () => {
    expect(rulesSrc).toContain('match /supportChats/{uid}');
    expect(rulesSrc).toMatch(/request\.auth\.uid == uid && request\.resource\.data\.from == 'user'/);
    expect(rulesSrc).toMatch(/superAdmin\(\) && request\.resource\.data\.from == 'admin'/);
    expect(rulesSrc).toContain('request.resource.data.text.size() <= 2000');
  });
});

describe('👥 ratchet — צ׳אט-צוות תוך-ארגוני (17.8)', () => {
  it('מיון הודעות-צוות: ישן→חדש, לא-משנה-מקור', () => {
    const msgs: TeamMsg[] = [
      { sender: 'b@x.com', name: 'ב', text: '2', at: '2026-08-18T10:00:00Z' },
      { sender: 'a@x.com', name: 'א', text: '1', at: '2026-08-18T09:00:00Z' },
    ];
    expect(sortTeamMsgs(msgs).map((m) => m.text)).toEqual(['1', '2']);
    expect(msgs[0].text).toBe('2');
  });

  it('כפתור-באשף: דגל shell.teamchat קיים ב-FEATURES (מודול shell)', () => {
    const f = FEATURES.find((x) => x.key === 'shell.teamchat');
    expect(f).toBeTruthy();
    expect(f?.module).toBe('shell');
  });

  it('החיווט חי + מגודר-דגל; ערוץ-קבוצה teamChats/{slug}', () => {
    expect(cloudCfgSrc).toContain('export const TEAM_CHATS');
    expect(cloudCfgSrc).toMatch(/onSnapshot\(\s*collection\(cloudDb\(\), TEAM_CHATS, slug, 'messages'\)/);
    expect(appSrc).toContain("featureOn(config, 'shell.teamchat')");
    expect(appSrc).toContain('<TeamChatModal');
  });

  it('🛡 Rules: teamChats — צוות-הארגון (orgMember/allowedRoot-לשורש), create-בלבד, טקסט תחום', () => {
    expect(rulesSrc).toContain('match /teamChats/{slug}/messages/{id}');
    expect(rulesSrc).toMatch(/teamChats\/\{slug\}[\s\S]{0,400}orgMember\(slug\) \|\| \(slug == 'default' && allowedRoot\(\)\)/);
    // מוחרג מ-catch-all השורש (אחרת allowedRoot היה קורא כל ארגון)
    expect(rulesSrc).toMatch(/rootCol in \[[^\]]*'teamChats'/);
  });
});
