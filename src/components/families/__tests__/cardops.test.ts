/**
 * ratchet — פעולות תפעול בכרטיס המשפחה (P0.3, דגל families.cardops).
 *
 * עוגן לגאסי: כרטיס המשפחה מנקב/מחסר/מנהל/מסיר שיבוץ ישירות (בלי לעבור למסך
 * החוגים). הכלל הנעול כאן: הניקוב מהכרטיס עובר דרך **אותו store.punch** של מסך
 * החוגים — אותה ספירת used, אותה תקרה (לא עולה מעל purchased), אותן חסימות —
 * ולא מימוש מקביל. בנוסף: הגנות-מקור (?raw) שהחיווט בכרטיס משתמש במודאלים
 * הקיימים של courses/ (לא שכפול לוגיקה) ושכל הפעולות מגודרות בדגל.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { emptyDb, emptyFamily } from '../../../types/domain';
import type { Db, Enrollment, Family, Member } from '../../../types/domain';
import panelsSrc from '../FamilyPanels.tsx?raw';
import detailSrc from '../FamilyDetail.tsx?raw';

function member(id: string, first: string): Member {
  return {
    id, first, gender: 'm', birth: '2015-05-05', idNum: '', phone: '', phone2: '',
    school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false,
    mPhotos: false, mVideos: false, notes: '',
  };
}
function fam(id: string, name: string, members: Member[]): Family {
  return { ...emptyFamily(), id, createdAt: '2024-01-01', name, members };
}
function punchEnr(id: string, memberId: string, over: Partial<Enrollment> = {}): Enrollment {
  return {
    id, memberId, courseId: 'c1', plan: 'punch', purchased: 10, used: 3, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '',
    enrolledAt: '2024-02-01', ...over,
  };
}

function seed(): Db {
  return {
    ...emptyDb(),
    families: [fam('f1', 'כהן', [member('m1', 'רוני')])],
    enrollments: [punchEnr('e1', 'm1')],
  };
}

beforeEach(() => {
  useApp.getState().setDb(() => seed());
});

describe('🎫 ratchet — ניקוב מהכרטיס עובר דרך אותו store.punch', () => {
  it('punch מעלה used ב-1 (לפני 3 → אחרי 4) — אותה פעולה לשני המשטחים', () => {
    expect(useApp.getState().db.enrollments[0].used).toBe(3);
    useApp.getState().punch('e1');
    expect(useApp.getState().db.enrollments[0].used).toBe(4);
  });

  it('punch לא עולה מעל purchased (החסימה של ה-store זהה בכל המשטחים)', () => {
    useApp.getState().setDb((db) => ({
      enrollments: db.enrollments.map((e) => ({ ...e, used: 10 })),
    }));
    useApp.getState().punch('e1');
    expect(useApp.getState().db.enrollments[0].used).toBe(10);
  });

  it('punch מתעלם ממנוי חודשי (plan!=="punch") — כמו במסך החוגים', () => {
    useApp.getState().setDb((db) => ({
      enrollments: db.enrollments.map((e) => ({ ...e, plan: 'monthly' as const })),
    }));
    useApp.getState().punch('e1');
    expect(useApp.getState().db.enrollments[0].used).toBe(3);
  });
});

describe('🛡 הגנות-מקור — חיווט למודאלים הקיימים, מגודר בדגל families.cardops', () => {
  it('EnrollPanel קורא ל-store.punch ולא מממש used+1 מקומי לניקוב', () => {
    expect(panelsSrc).toMatch(/useApp\(\(s\) => s\.punch\)/);
    // דגל הפעולות בכרטיס
    expect(panelsSrc).toMatch(/featureOn\(config, 'families\.cardops'\)/);
  });

  it('המודאלים מיובאים ממסך החוגים — לא שוכפלו', () => {
    expect(panelsSrc).toMatch(/import \{ AbsenceModal \} from '\.\.\/courses\/AbsenceModal'/);
    expect(panelsSrc).toMatch(/import \{ ManageModal \} from '\.\.\/courses\/ManageModal'/);
  });

  it('עמודת הפעולות, "➕ אירוע" וכרטיסי אב/אם מגודרים בדגל (כבוי = ההתנהגות הקודמת)', () => {
    expect(panelsSrc).toMatch(/\{cardOpsOn && <th><\/th>\}/);
    expect(panelsSrc).toMatch(/cardOpsOn \?[\s\S]{0,200}➕ אירוע/);
    expect(detailSrc).toMatch(/cardOpsOn && fam\.father && !fam\.members\.some\(\(x\) => x\.isParent && x\.gender === 'm'\)/);
    expect(detailSrc).toMatch(/cardOpsOn && fam\.mother && !fam\.members\.some\(\(x\) => x\.isParent && x\.gender === 'f'\)/);
  });

  it('הסרה מהכרטיס עוברת דרך deleteEnrollment של ה-store עם confirm', () => {
    expect(panelsSrc).toMatch(/deleteEnrollment = useApp\(\(s\) => s\.deleteEnrollment\)/);
    expect(panelsSrc).toMatch(/window\.confirm\([\s\S]{0,300}deleteEnrollment\(e\.id\)/);
  });
});
