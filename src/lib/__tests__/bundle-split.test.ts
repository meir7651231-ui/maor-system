/**
 * ratchet (19.11.2026) — מודאלים-בלחיצה לא חוזרים לבנדל הראשי.
 *
 * הבאג: הבנדל הראשי הגיע ל-159.7KB gzip (89% מהתקרה) — 11 מודאלים שנפתחים רק בלחיצה
 * (קופה, טיימר, קיר-השפעה, מפת-אזורים, איחוד-כפילויות, כרטיס-שיחה, פלטה, בדיקת-תקשורת, 3 חלונות-צ׳אט)
 * יובאו סטטית ב-App.tsx ונטענו לכל משתמש בכל כניסה. עברו ל-lazy() ⇒ 131.5KB, והתקרה ירדה ל-150KB.
 * כאן נאכף: אין import סטטי שלהם ב-App.tsx, וכל אחד עטוף ב-Suspense.
 * (שהם באמת נפתחים — e2e/lazy-modals-smoke.mjs.)
 */
import { describe, expect, it } from 'vitest';
import app from '../../App.tsx?raw';
import budget from '../../../scripts/bundle-budget.mjs?raw';

const LAZY = ['ImpactWall', 'MoneyTimer', 'CashRegister', 'BodyMap', 'DedupModal', 'CallerLookup', 'CommandPalette', 'NetCheckModal', 'SupportChatModal', 'SupportInbox', 'TeamChatModal'];

describe('bundle-split — מודאלים נטענים בפתיחה', () => {
  it.each(LAZY)('%s: lazy() ולא import סטטי', (name) => {
    expect(app).not.toMatch(new RegExp(`^import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from`, 'm'));
    expect(app).toMatch(new RegExp(`const ${name} = lazy\\(`));
  });

  it.each(LAZY)('%s: כל שימוש עטוף ב-<Suspense>', (name) => {
    const uses = app.match(new RegExp(`<${name}[\\s/]`, 'g')) ?? [];
    const wrapped = app.match(new RegExp(`<Suspense fallback=\\{null\\}><${name}[\\s/]`, 'g')) ?? [];
    expect(uses.length).toBeGreaterThan(0);
    expect(wrapped.length).toBe(uses.length);
  });

  it('תקרת-הבנדל ירדה ל-130KB (יורדת-בלבד; 150K ב-19.11, 130K ב-20.11)', () => {
    const m = /ENTRY_GZIP_BUDGET = ([\d_]+)/.exec(budget);
    expect(Number(m?.[1].replace(/_/g, ''))).toBeLessThanOrEqual(130_000);
  });
});
