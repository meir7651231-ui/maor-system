/**
 * ratchet — מנוי-יומן חי (הרחבת gcal, 9.8: "כן" של הבעלים לפיד המתעדכן).
 * האינווריאנטים:
 * 1. ה-ICS מחושב **בלקוח** ומפורסם ל-icsFeeds/{slug}; השרת רק מגיש (בלי לוח
 *    עברי בשרת — הכרעת צרור-הלילה, מקור-אמת יחיד).
 * 2. השרת: אימות org+key קשיח, 404 אחיד (אין מניית-ארגונים), text/calendar.
 * 3. token: ‏crypto (לא Math.random), נשמר בפרסום-חוזר (הקישור לא נשבר),
 *    ומוחלף רק ב-rotate מפורש; לעולם לא בקונפיג/גיבוי.
 * 4. ‏Rules: ‏icsFeeds — חברי-הארגון (והשורש דרך allowedRoot); **ה-catch-all של
 *    השורש מחריג את orgSecrets/orgSecretsMeta/icsFeeds** — בלעדי ההחרגה מייל
 *    ב-allowedRoot היה קורא דרכו את סודות כל הארגונים (OR-semantics).
 * 5. הכפתור בלוח מגודר gcal+ענן; הייצוא הישן (קובץ ICS) נשאר כלשונו.
 */
import { describe, expect, it } from 'vitest';
import rulesSrc from '../../../firestore.rules?raw';
import functionsSrc from '../../../functions/index.js?raw';
import feedSrc from '../icsFeed.ts?raw';
import calSrc from '../../components/calendar/CalendarView.tsx?raw';
import modalSrc from '../../components/calendar/IcsFeedModal.tsx?raw';

describe('🔗 ratchet — מנוי-יומן חי (9.8)', () => {
  it('השרת מגיש בלבד: אימות org+key, 404 אחיד, text/calendar', () => {
    const fn = functionsSrc.slice(functionsSrc.indexOf('exports.icsFeed'));
    expect(fn).toContain("/^[a-z0-9-]{1,40}$/.test(org)");
    expect(fn).toContain("/^[a-f0-9]{32,64}$/.test(key)");
    expect(fn).toContain("'text/calendar; charset=utf-8'");
    // 404 גם על ארגון-לא-קיים וגם על token שגוי — אותה תשובה (אין מנייה)
    expect(fn.match(/status\(404\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('token: crypto בלבד, נשמר בפרסום-חוזר, מוחלף רק ב-rotate', () => {
    expect(feedSrc).toContain('crypto.getRandomValues');
    expect(feedSrc).not.toContain('Math.random()');
    expect(feedSrc).toMatch(/opts\?\.rotate \? null : await readIcsFeedToken\(slug\)/);
    // גבול מסמך Firestore — פיד ענק נחסם עם הודעה בעברית, לא כשל-כתיבה עמום
    expect(feedSrc).toContain('MAX_ICS_BYTES');
  });

  it('Rules: icsFeeds לחברי-הארגון + השורש; ה-catch-all מחריג כספת+פיד', () => {
    expect(rulesSrc).toMatch(/match \/icsFeeds\/\{slug\} \{[\s\S]{0,220}orgMember\(slug\)[\s\S]{0,120}allowedRoot\(\)/);
    expect(rulesSrc).toMatch(/!\(rootCol in \['platformOrgs', 'platformRequests', 'platformLeads', 'orgs', 'orgSecrets', 'orgSecretsMeta', 'icsFeeds'\]\)/);
  });

  it('הלוח: כפתור-המנוי מגודר gcal+ענן; הייצוא הישן (קובץ) נשאר', () => {
    expect(calSrc).toMatch(/integrationOn\(config, 'gcal'\) && cloudOn && \(/);
    expect(calSrc).toContain('🔗 מנוי-יומן');
    expect(calSrc).toContain('📅 ליומן (ICS)');
    // רענון-הרקע מפרסם רק פיד שכבר הופעל — לא יוצר פיד לארגון שלא ביקש
    expect(calSrc).toMatch(/if \(!\(await readIcsFeedToken\(slug\)\)\) return/);
  });

  it('המודאל: פרסום-בפתיחה, החלפת-קישור עם מגן-דאבל-טאפ, בלי חשיפת ה-ICS', () => {
    expect(modalSrc).toContain('publish(false)');
    expect(modalSrc).toMatch(/Date\.now\(\) - armedAt\.current < 400/);
    expect(modalSrc).toContain('rotate: boolean');
  });
});
