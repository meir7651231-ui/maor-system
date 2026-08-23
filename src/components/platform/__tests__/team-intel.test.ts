/**
 * ratchet · 🕵️ מודיעין-עובדים (20.8, בקשת-בעלים "פר-עובד יכולת הכי מטורפת"):
 * מנוע טהור ודטרמיניסטי על לוג-הפעולות — בלי Date.now (todayIso מוזרק).
 * נועל: השוואת-מייל סלחנית-רישיות · חלון-7-ימים כולל-היום · פילוח ממוין ·
 * מיון-הצוות לפי שבוע→סך→מייל · תוויות-"לפני-N-ימים" · הגנות-מקור (הסלקטור
 * בלי ?? [] — לקח React #185; הסקשן מגודר settings.teamintel).
 */
import { describe, it, expect } from 'vitest';
import type { AuditEntry } from '../../../types/domain';
import { agoLabel, goalProgress, quietWorkers, teamCsvRows, teamIntel, teamSummary, trendOf, workerIntel } from '../teamIntel';
import panelSrc from '../ManagerPanel.tsx?raw';
import cloudConfigSrc from '../../../lib/cloudConfig.ts?raw';

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

  it('ratchet 21.8 (ממצא-נחיל): לוג ממוזג-ענן עם רשומות עקומות לא מפיל — מדלגים', () => {
    // הבאג: cloud-merge מציב meta.audit בלי ולידציה ⇒ רשומה בלי `who` הפילה את
    // norm(a.who) ב-TypeError והלבינה את כל פאנל-המנהל (white-screen).
    const dirty = [
      e('dana@org.org', '2026-08-20T09:00:00.000Z'),
      { at: '2026-08-20T10:00:00.000Z', act: 'x', what: 'y' }, // בלי who
      { who: 'dana@org.org', act: 'x', what: 'y' }, // בלי at
      null, // רשומה לא-אובייקט
      42,
      'zבל',
      { who: 7, at: '2026-08-19T08:00:00.000Z', act: 'x', what: 'y' }, // who לא-מחרוזת
    ] as unknown as AuditEntry[];
    const w = workerIntel(dirty, 'dana@org.org', TODAY);
    expect(w.actions).toBe(1); // רק הרשומה התקינה נספרה
    // גם נקודות-הכניסה העוטפות מוגנות (Array.isArray + סינון)
    const team = teamIntel(dirty, ['dana@org.org'], TODAY);
    expect(team[0].actions).toBe(1);
    expect(teamIntel('לא-מערך' as unknown as AuditEntry[], ['a@b.c'], TODAY)[0].actions).toBe(0);
    expect(teamSummary(undefined as unknown as ReturnType<typeof teamIntel>)).toEqual({ week: 0, activeToday: 0, top: '' });
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

describe('התפרעות-מלאה — מגמה, פס-14, שקטות, יעד, CSV', () => {
  const audit = [
    e('a@x.y', '2026-08-20T08:00:00.000Z'),
    e('a@x.y', '2026-08-19T08:00:00.000Z'),
    e('a@x.y', '2026-08-12T08:00:00.000Z'),
    e('a@x.y', '2026-08-12T09:00:00.000Z'),
    e('a@x.y', '2026-08-12T10:00:00.000Z'),
    e('b@x.y', '2026-08-15T08:00:00.000Z'),
  ];

  it('prevWeek + מגמה: 2 השבוע מול 3 שבוע-קודם ⇒ ▼; פס-14 מסכם נכון', () => {
    const w = workerIntel(audit, 'a@x.y', TODAY);
    expect(w.last7).toBe(2);
    expect(w.prevWeek).toBe(3);
    expect(trendOf(w)).toBe('▼');
    expect(w.spark14).toHaveLength(14);
    expect(w.spark14.reduce((t, n) => t + n, 0)).toBe(5);
    expect(w.spark14[13]).toBe(1); // היום
    expect(w.spark14[13 - 8]).toBe(3); // לפני 8 ימים (12.8)
  });

  it('quietDays ושקטות: b שקטה 5 ימים ⇒ ברשימת-3+; a לא; בלי-כלום ⇒ 99', () => {
    const team = teamIntel(audit, ['a@x.y', 'b@x.y', 'c@x.y'], TODAY);
    const q = quietWorkers(team, 3);
    expect(q.map((w) => w.email).sort()).toEqual(['b@x.y', 'c@x.y']);
    expect(q.find((w) => w.email === 'b@x.y')?.quietDays).toBe(5);
    expect(q.find((w) => w.email === 'c@x.y')?.quietDays).toBe(99);
  });

  it('goalProgress: חסום-ל-100, הושג, ובלי-יעד ⇒ null', () => {
    const w = workerIntel(audit, 'a@x.y', TODAY); // last7=2
    expect(goalProgress(w, 4)).toEqual({ pct: 50, done: false });
    expect(goalProgress(w, 2)).toEqual({ pct: 100, done: true });
    expect(goalProgress(w, 1)).toEqual({ pct: 100, done: true });
    expect(goalProgress(w, undefined)).toBeNull();
    expect(goalProgress(w, 0)).toBeNull();
  });

  it('teamCsvRows: כותרות + שורה פר-עובד/ת עם מגמה ויעד', () => {
    const team = teamIntel(audit, ['a@x.y'], TODAY);
    const rows = teamCsvRows(team, { 'a@x.y': 4 });
    expect(rows[0][0]).toBe('עובד/ת');
    expect(rows[1][0]).toBe('a@x.y');
    expect(rows[1][4]).toBe('▼');
    expect(rows[1][8]).toBe(4);
    expect(rows[1][9]).toBe('50%');
  });
});

describe('הגנות-מקור — החיווט באשף-המנהל', () => {
  it('הסקשן מגודר settings.teamintel; הסלקטור בלי ?? [] (React #185)', () => {
    expect(panelSrc).toContain("featureOn((config as OrgConfig) ?? {}, 'settings.teamintel')");
    expect(panelSrc).toContain('useApp((s) => s.db.audit)');
    expect(panelSrc).not.toContain('useApp((s) => s.db.audit ?? [])');
    expect(panelSrc).toContain('teamIntel(audit, [managerMail, ...employees], today)');
  });

  it('התפרעות-מלאה מחווטת: CSV דרך core.export · יעד נכתב לענן · שקטות בלי המנהל', () => {
    expect(panelSrc).toContain("featureOn((config as OrgConfig) ?? {}, 'core.export')");
    expect(panelSrc).toContain("downloadCsv('team-intel-' + today + '.csv', teamCsvRows(team, goals))");
    expect(panelSrc).toContain('async function setGoalFor(email: string, goal: number)');
    // ratchet 21.8 (ממצא-נחיל): איפוס-יעד חייב מחיקת-שדה נקודתית — setDoc(merge:true)
    // ממזג-עומק מפות ⇒ `delete next.weeklyGoal` לא מחק בענן ויעד 40 חזר אחרי איפוס-ל-0.
    expect(panelSrc).toContain("clearEmployeeField(slug, email, 'weeklyGoal')");
    expect(panelSrc).not.toMatch(/^\s*delete next\.weeklyGoal;/m); // הדפוס-הישן כקוד (לא בהערה)
    // ההלפר עצמו: מחיקה דרך FieldPath תלת-מקטעי + deleteField (המייל מכיל נקודות)
    expect(cloudConfigSrc).toContain('export async function clearEmployeeField');
    expect(cloudConfigSrc).toContain("new FieldPath('memberConfigs', email, field), deleteField()");
    expect(panelSrc).toContain('quietWorkers(team.filter((w) => w.email !== managerMail), 3)');
  });
});
