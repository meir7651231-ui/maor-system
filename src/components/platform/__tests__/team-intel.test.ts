/**
 * ratchet · 🕵️ מודיעין-עובדים (20.8, בקשת-בעלים "פר-עובד יכולת הכי מטורפת"):
 * מנוע טהור ודטרמיניסטי על לוג-הפעולות — בלי Date.now (todayIso מוזרק).
 * נועל: השוואת-מייל סלחנית-רישיות · חלון-7-ימים כולל-היום · פילוח ממוין ·
 * מיון-הצוות לפי שבוע→סך→מייל · תוויות-"לפני-N-ימים" · הגנות-מקור (הסלקטור
 * בלי ?? [] — לקח React #185; הסקשן מגודר settings.teamintel).
 */
import { describe, it, expect } from 'vitest';
import type { AuditEntry } from '../../../types/domain';
import { agoLabel, teamIntel, teamSummary, workerIntel } from '../teamIntel';
import panelSrc from '../ManagerPanel.tsx?raw';

const TODAY = '2026-08-20';
const e = (who: string, at: string, act = 'תרומה', what = 'x'): AuditEntry => ({ who, at, act, what });

describe('workerIntel — נגזרת פר-עובד/ת', () => {
  it('סופר, מפלח וממיין; מייל סלחני-רישיות; שעת-שיא', () => {
    const audit = [
      e('Dana@ORG.org', '2026-08-20T09:15:00.000Z', 'תרומה'),
      e('dana@org.org', '2026-08-19T09:30:00.000Z', 'תרומה'),
      e('dana@org.org', '2026-08-10T14:00:00.000Z', 'שמירת משפחה'),
      e('other@org.org', '2026-08-20T10:00:00.000Z', 'תרומה'),
    ];
    const w = workerIntel(audit, 'dana@org.org', TODAY);
    expect(w.actions).toBe(3);
    expect(w.daysActive).toBe(3);
    expect(w.today).toBe(1);
    expect(w.last7).toBe(2); // ה-10.8 מחוץ לחלון-7
    expect(w.byAct[0]).toEqual({ act: 'תרומה', n: 2 });
    expect(w.lastAt).toBe('2026-08-20T09:15:00.000Z');
    expect(w.peakHour).toBe(9);
    expect(w.recent[0].at).toBe('2026-08-20T09:15:00.000Z');
  });

  it('עובד/ת בלי פעולות: אפסים, peakHour=null, "ללא פעילות"', () => {
    const w = workerIntel([], 'x@y.z', TODAY);
    expect(w.actions).toBe(0);
    expect(w.peakHour).toBeNull();
    expect(agoLabel(w.lastAt, TODAY)).toBe('ללא פעילות');
  });
});

describe('teamIntel + teamSummary — הצוות', () => {
  const audit = [
    e('a@x.y', '2026-08-20T08:00:00.000Z'),
    e('a@x.y', '2026-08-19T08:00:00.000Z'),
    e('b@x.y', '2026-08-20T08:00:00.000Z'),
    e('c@x.y', '2026-07-01T08:00:00.000Z'),
  ];
  it('מיון לפי פעילות-השבוע; כפולי-מייל מאוחדים; סיכום נכון', () => {
    const team = teamIntel(audit, ['b@x.y', 'a@x.y', 'a@x.y', 'c@x.y'], TODAY);
    expect(team.map((w) => w.email)).toEqual(['a@x.y', 'b@x.y', 'c@x.y']);
    const s = teamSummary(team);
    expect(s.week).toBe(3);
    expect(s.activeToday).toBe(2);
    expect(s.top).toBe('a@x.y');
  });
});

describe('agoLabel — דטרמיניסטי', () => {
  it('היום / אתמול / לפני N ימים', () => {
    expect(agoLabel('2026-08-20T23:59:00.000Z', TODAY)).toBe('היום');
    expect(agoLabel('2026-08-19T00:00:00.000Z', TODAY)).toBe('אתמול');
    expect(agoLabel('2026-08-15T12:00:00.000Z', TODAY)).toBe('לפני 5 ימים');
  });
});

describe('הגנות-מקור — החיווט באשף-המנהל', () => {
  it('הסקשן מגודר settings.teamintel; הסלקטור בלי ?? [] (React #185)', () => {
    expect(panelSrc).toContain("featureOn((config as OrgConfig) ?? {}, 'settings.teamintel')");
    expect(panelSrc).toContain('useApp((s) => s.db.audit)');
    expect(panelSrc).not.toContain('useApp((s) => s.db.audit ?? [])');
    expect(panelSrc).toContain('teamIntel(audit, [managerMail, ...employees], today)');
  });
});
