/**
 * ratchet — 📢 הודעה-לכיתה (פאזה 6): מנוע-טהור broadcast.ts (רוסטר, דדופ-משפחה,
 * נוסח, רשימת-טלפונים) וחיווט/גידור (ClassBroadcast + כפתור מגודר courses.broadcast).
 */
import { describe, expect, it } from 'vitest';
import type { Db, Enrollment, Family } from '../../../types/domain';
import { emptyDb } from '../../../types/domain';
import { classContacts, classPhonesText, defaultClassMessage } from '../broadcast';
import bcSrc from '../ClassBroadcast.tsx?raw';
import detailSrc from '../CourseDetail.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}
function famOf(id: string, name: string, phone: string, members: { id: string; first: string }[]): Family {
  return { id, name, phone, createdAt: '2026-01-01', status: 'active', members } as unknown as Family;
}

function db(): Db {
  return {
    ...emptyDb(),
    families: [
      famOf('f1', 'כהן', '0501111111', [{ id: 'm1', first: 'דנה' }, { id: 'm2', first: 'רון' }]), // אח ואחות
      famOf('f2', 'לוי', '0502222222', [{ id: 'm3', first: 'מאיה' }]),
      famOf('f3', 'מזרחי', '', [{ id: 'm4', first: 'איתי' }]), // בלי טלפון
    ],
    enrollments: [
      enr({ id: 'a', memberId: 'm1', courseId: 'c1' }),
      enr({ id: 'b', memberId: 'm2', courseId: 'c1' }), // אותה משפחה כמו a
      enr({ id: 'c', memberId: 'm3', courseId: 'c1' }),
      enr({ id: 'd', memberId: 'm4', courseId: 'c1' }), // בלי טלפון
      enr({ id: 'w', memberId: 'm3', courseId: 'c1', status: 'wait' }), // המתנה — לא נמען
      enr({ id: 'other', memberId: 'm1', courseId: 'c2' }), // חוג אחר
    ],
  };
}

describe('📢 הודעה-לכיתה — מנוע', () => {
  it('classContacts: רוסטר החוג, דדופ לפי-משפחה (אח+אחות = פעם אחת), בלי wait/חוג-אחר', () => {
    const cc = classContacts(db(), 'c1');
    // f1 פעם-אחת (טלפון משותף), f2 פעם-אחת, f3 בלי-טלפון — 3 שורות
    expect(cc.map((c) => c.phone)).toEqual(['0501111111', '0502222222', '']);
  });
  it('classPhonesText: טלפונים מדולגי-ריק, מופרדים בפסיק', () => {
    expect(classPhonesText(classContacts(db(), 'c1'))).toBe('0501111111, 0502222222');
  });
  it('defaultClassMessage: כולל ארגון ושם-חוג', () => {
    const m = defaultClassMessage('ציור', 'מאור');
    expect(m).toContain('מאור');
    expect(m).toContain('ציור');
  });
});

describe('🛡 הגנות-מקור — הודעה-לכיתה מחווטת ומגודרת', () => {
  it('ClassBroadcast: WaBtn עם הטקסט + העתקת-טלפונים + אפס-שרת', () => {
    expect(bcSrc).toContain('classContacts(db');
    expect(bcSrc).toContain('WaBtn phone={c.phone} text={msg}');
    expect(bcSrc).toContain('classPhonesText(contacts)');
    expect(bcSrc).toContain('אין שליחה-אוטומטית משרת');
  });
  it('CourseDetail: כפתור-הודעה מגודר courses.broadcast + kind broadcast', () => {
    expect(detailSrc).toContain("featureOn(cfg, 'courses.broadcast')");
    expect(detailSrc).toContain("kind: 'broadcast'");
    expect(detailSrc).toContain('<ClassBroadcast course={c}');
  });
});
