/**
 * ratchet · 📋 WORKPREP (20.8, בקשת-בעלים "המנהל מכין לעובד את העבודה"):
 * מנוע-המשימות הטהור — זהות ('מקומי' בלי ענן, מייל-lowercase), מיון
 * עדיפות→יעד→יצירה, איחור, סטטיסטיקה, ושיבוץ-המוני עם דדופ. וגם:
 * הישות ה-22 מחווטת בכל שכבות-התשתית (domain/persist/cloud-diff/functions).
 */
import { describe, it, expect } from 'vitest';
import type { Supporter, WorkTask } from '../../types/domain';
import { emptyDb } from '../../types/domain';
import {
  doneTodayFor,
  openTasksFor,
  overdueContactTaskDrafts,
  taskIdentity,
  taskOverdue,
  taskStatsFor,
} from '../worktasks';
import { ENTITY_COLLECTIONS } from '../cloud-diff';
import persistSrc from '../../store/persist.ts?raw';
import fnSrc from '../../../functions/index.js?raw';

const TODAY = '2026-08-20';
const t = (over: Partial<WorkTask>): WorkTask => ({
  id: 't1', assignee: 'a@x.y', by: 'm@x.y', title: 'משימה', pri: 2, createdAt: '2026-08-19T08:00:00.000Z', ...over,
});
const sup = (over: Partial<Supporter>): Supporter =>
  ({ ...emptyDb().supporters[0], id: 's1', name: 'תורם', donations: [], nextDate: '', ...over }) as Supporter;

describe('taskIdentity — זהות-עבודה', () => {
  it('מייל ⇒ lowercase; ריק/undefined ⇒ מקומי', () => {
    expect(taskIdentity('Dana@Org.org')).toBe('dana@org.org');
    expect(taskIdentity('')).toBe('מקומי');
    expect(taskIdentity(undefined)).toBe('מקומי');
  });
});

describe('openTasksFor — התור הממוין', () => {
  it('רק פתוחות-שלי; מיון עדיפות ⇒ יעד ⇒ ותק; רישיות-מייל לא מפרידה', () => {
    const tasks = [
      t({ id: 'a', pri: 2, due: '2026-08-25' }),
      t({ id: 'b', pri: 1 }),
      t({ id: 'c', pri: 2, due: '2026-08-21' }),
      t({ id: 'd', doneAt: '2026-08-20T09:00:00.000Z' }),
      t({ id: 'e', assignee: 'OTHER@x.y' }),
      t({ id: 'f', assignee: 'A@X.Y', pri: 3 }),
    ];
    expect(openTasksFor(tasks, 'a@x.y').map((x) => x.id)).toEqual(['b', 'c', 'a', 'f']);
  });
});

describe('איחור + סטטיסטיקה + בוצעו-היום', () => {
  const tasks = [
    t({ id: 'a', due: '2026-08-18' }),
    t({ id: 'b', due: '2026-08-20' }),
    t({ id: 'c', doneAt: '2026-08-20T10:00:00.000Z' }),
    t({ id: 'd', doneAt: '2026-08-01T10:00:00.000Z' }),
  ];
  it('taskOverdue: יעד-שעבר ופתוחה בלבד', () => {
    expect(taskOverdue(tasks[0], TODAY)).toBe(true);
    expect(taskOverdue(tasks[1], TODAY)).toBe(false);
    expect(taskOverdue({ ...tasks[0], doneAt: 'x' }, TODAY)).toBe(false);
  });
  it('taskStatsFor + doneTodayFor', () => {
    const st = taskStatsFor(tasks, 'a@x.y', TODAY);
    expect(st).toEqual({ open: 2, overdue: 1, done: 2, doneWeek: 1 });
    expect(doneTodayFor(tasks, 'a@x.y', TODAY)).toBe(1);
  });
});

describe('overdueContactTaskDrafts — שיבוץ-המוני עם דדופ', () => {
  it('רק תורמים-שעבר-יעדם; תורם שכבר משובץ-פתוח לא נכפל', () => {
    const sups = [
      sup({ id: 's1', name: 'א', nextDate: '2026-08-10' }),
      sup({ id: 's2', name: 'ב', nextDate: '2026-08-25' }),
      sup({ id: 's3', name: 'ג', nextDate: '2026-08-01' }),
      sup({ id: 's4', name: 'ד', nextDate: '' }),
    ];
    const existing = [t({ id: 'x', ref: { kind: 'supporter', id: 's3' } })];
    const drafts = overdueContactTaskDrafts(sups, existing, 'A@x.y', TODAY);
    expect(drafts.map((d) => d.ref!.id)).toEqual(['s1']);
    expect(drafts[0].assignee).toBe('a@x.y');
    expect(drafts[0].pri).toBe(1);
    expect(drafts[0].title).toContain('א');
  });
});

describe('הישות ה-22 — חיווט-תשתית מלא', () => {
  it('tasks ב-ENTITY_COLLECTIONS, ב-emptyDb, בריפוי-persist וב-BACKUP של השרת', () => {
    expect(ENTITY_COLLECTIONS).toContain('tasks');
    expect(emptyDb().tasks).toEqual([]);
    expect(persistSrc).toContain("tasks: Array.isArray(db.tasks) ? db.tasks : []");
    // ratchet-הסנכרון-הקיים: BACKUP_COLLECTIONS≡ENTITY_COLLECTIONS — נאכף גם שם;
    // כאן בדיקת-נוכחות ישירה שהשרת מגבה את המשימות.
    expect(fnSrc).toContain("'tasks'");
  });
});
