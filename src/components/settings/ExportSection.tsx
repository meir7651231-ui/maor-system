/**
 * הגדרות ← ייצוא נתונים — הורדת קובצי CSV (נפתחים באקסל, עברית תקינה):
 * משפחות · בני משפחה (שטוח) · חוגים · תורמים (כולל סכומים ודרגה) · שיבוצים.
 */
import { allMembers, useApp } from '../../store/useApp';
import { downloadCsv, type Cell } from '../../lib/csvx';
import { Btn } from '../ui';
import { Section, SectionNote } from './lib';
import { ageOf, fmtDate, STATUS_META } from '../families/lib';
import { DAY_NAMES, paidOf, payBal } from '../courses/lib';
import { supScore, supTier, supTotalIls } from '../supporters/lib';

const ENROLL_STATUS: Record<string, string> = { active: 'פעיל', paused: 'מוקפא', ended: 'הסתיים' };

export function ExportSection() {
  const toast = useApp((s) => s.toast);
  // בוררים סקלריים נפרדים — אובייקט חדש בכל בורר היה גורם לרינדור אינסופי
  const counts = {
    families: useApp((s) => s.db.families.length),
    members: useApp((s) => s.db.families.reduce((n, f) => n + f.members.length, 0)),
    courses: useApp((s) => s.db.courses.length),
    supporters: useApp((s) => s.db.supporters.length),
    enrollments: useApp((s) => s.db.enrollments.length),
  };

  function expFamilies() {
    const db = useApp.getState().db;
    const rows: Cell[][] = [
      [
        'שם משפחה', 'סטטוס', 'שם האב', 'ת"ז האב', 'שם האם', 'ת"ז האם', 'טלפון', 'טלפון נוסף',
        'אימייל', 'עיר', 'כתובת', 'קהילה', 'מצב משפחתי', 'שפה', 'קופת צדקה', 'ספח מלא', 'הנחה',
        'מדד אמינות', 'מס׳ בני משפחה', 'מס׳ ילדים', 'תאריך הצטרפות', 'הערות',
      ],
    ];
    for (const f of db.families) {
      rows.push([
        f.name, STATUS_META[f.status].label, f.father, f.fatherId, f.mother, f.motherId, f.phone,
        f.phone2, f.email, f.city, f.address, f.community, f.maritalStatus, f.language, f.tzedaka,
        f.fullSefach ? 'כן' : 'לא', f.discount, f.cred?.score ?? '', f.members.length,
        f.members.filter((m) => !m.isParent).length, fmtDate(f.createdAt), f.notes,
      ]);
    }
    downloadCsv('maor-families.csv', rows);
    toast('קובץ המשפחות ירד — ' + db.families.length + ' משפחות');
  }

  function expMembers() {
    const db = useApp.getState().db;
    const rows: Cell[][] = [
      [
        'שם פרטי', 'שם משפחה', 'תפקיד', 'מגדר', 'תאריך לידה', 'גיל', 'ת"ז', 'טלפון', 'טלפון נוסף',
        'בית ספר', 'כיתה', 'טלפון המשפחה', 'אימייל המשפחה', 'עיר', 'רגישויות/רפואי', 'הערות',
      ],
    ];
    let n = 0;
    for (const f of db.families) {
      for (const m of f.members) {
        n++;
        rows.push([
          m.first, f.name, m.isParent ? 'הורה' : 'ילד/ה', m.gender === 'f' ? 'נקבה' : 'זכר',
          fmtDate(m.birth), ageOf(m.birth) ?? '', m.idNum, m.phone, m.phone2, m.school, m.grade,
          f.phone, f.email, f.city, m.health, m.notes,
        ]);
      }
    }
    downloadCsv('maor-members.csv', rows);
    toast('קובץ בני המשפחה ירד — ' + n + ' רשומות');
  }

  function expCourses() {
    const db = useApp.getState().db;
    const rows: Cell[][] = [
      [
        'שם החוג', 'קטגוריה', 'קהל יעד', 'מורה', 'חדר', 'מסלול', 'מחיר', 'יום', 'שעה', 'רשומים',
        'מקס׳ תלמידים', 'סמסטר', 'תחילה', 'סיום', 'הערות',
      ],
    ];
    for (const c of db.courses) {
      rows.push([
        c.name, c.cat, c.audience ?? '', db.teachers.find((t) => t.id === c.teacherId)?.name ?? '',
        db.rooms.find((r) => r.id === c.roomId)?.name ?? '',
        c.model === 'punch' ? 'כרטיסייה · ' + c.size + ' ניקובים' : 'מנוי חודשי', c.price,
        DAY_NAMES[c.weekday] ?? '', c.time,
        db.enrollments.filter((e) => e.courseId === c.id).length, c.maxStudents || '',
        c.semester, fmtDate(c.start), fmtDate(c.end), c.notes,
      ]);
    }
    downloadCsv('maor-courses.csv', rows);
    toast('קובץ החוגים ירד — ' + db.courses.length + ' חוגים');
  }

  function expSupporters() {
    const db = useApp.getState().db;
    const rows: Cell[][] = [
      [
        'שם', 'טלפון', 'אימייל', 'כתובת', 'קטגוריה', 'ייעוד', 'מס׳ תרומות', 'סה"כ ₪', 'סה"כ $',
        'שווי כולל (₪)', 'תרומה ראשונה', 'תרומה אחרונה', 'ציון', 'דרגה', 'הערות',
      ],
    ];
    for (const sp of db.supporters) {
      const score = supScore(sp);
      rows.push([
        sp.name, sp.phone, sp.email, sp.address, sp.cat, sp.forWho, sp.count, sp.ils, sp.usd,
        Math.round(supTotalIls(sp)), fmtDate(sp.first), fmtDate(sp.last), score, supTier(score).label,
        sp.notes,
      ]);
    }
    downloadCsv('maor-supporters.csv', rows);
    toast('קובץ התורמים ירד — ' + db.supporters.length + ' תורמים');
  }

  function expEnrollments() {
    const db = useApp.getState().db;
    const members = allMembers(db);
    const rows: Cell[][] = [
      [
        'תלמיד/ה', 'משפחה', 'חוג', 'מסלול', 'קבוצה', 'ניקובים שנרכשו', 'נוצלו', 'יתרת ניקובים',
        'סה"כ עסקה', 'שולם', 'יתרת חוב', 'סטטוס', 'תאריך שיבוץ', 'הערה',
      ],
    ];
    for (const e of db.enrollments) {
      const m = members.find((x) => x.id === e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      rows.push([
        m?.first ?? '', m?.famName ?? '', c?.name ?? '',
        e.plan === 'punch' ? 'כרטיסייה' : 'מנוי חודשי', e.group,
        e.plan === 'punch' ? e.purchased : '', e.used,
        e.plan === 'punch' ? e.purchased - e.used : '', e.totalDue || '', paidOf(e), payBal(e),
        ENROLL_STATUS[e.status] ?? e.status, fmtDate(e.enrolledAt), e.note,
      ]);
    }
    downloadCsv('maor-enrollments.csv', rows);
    toast('קובץ השיבוצים ירד — ' + db.enrollments.length + ' שיבוצים');
  }

  const buttons: { label: string; count: number; run: () => void }[] = [
    { label: '⬇ משפחות', count: counts.families, run: expFamilies },
    { label: '⬇ בני משפחה', count: counts.members, run: expMembers },
    { label: '⬇ חוגים', count: counts.courses, run: expCourses },
    { label: '⬇ תורמים', count: counts.supporters, run: expSupporters },
    { label: '⬇ שיבוצים', count: counts.enrollments, run: expEnrollments },
  ];

  return (
    <Section
      id="sec-export"
      title="⬇ ייצוא נתונים"
      sub="הורדת קובצי CSV לכל ישות — נפתחים באקסל עם עברית תקינה (UTF-8 BOM)"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {buttons.map((b) => (
          <Btn key={b.label} onClick={b.run} disabled={!b.count}>
            {b.label + ' (' + b.count + ')'}
          </Btn>
        ))}
      </div>
      <SectionNote>
        לגיבוי מלא הניתן לשחזור השתמשו בסקשן "גיבוי ושחזור" — קובצי ה-CSV מיועדים לעיון ולעיבוד
        חיצוני בלבד.
      </SectionNote>
    </Section>
  );
}
