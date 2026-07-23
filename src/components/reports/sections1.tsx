/** סעיפי דוח: סיכום רישום לחוגים + נוכחות וחיסורים. */

import { useState } from 'react';
import type { Db } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { Chip } from '../ui';
import type { Cell } from './csv';
import { ReportTable, Section, type Row } from './parts';
import { balanceOf, fmtDate, nameIndex, paidInRange, type DateRange } from './lib';
import { enrollCount } from '../courses/lib';

interface SectionProps {
  db: Db;
  hidden: boolean;
  onPrint: () => void;
}

/** 1. סיכום רישום לפי חוג — רשומים/תפוסה, הכנסות בטווח, יתרות חוב. */
export function EnrollmentSection(props: SectionProps & { range: DateRange; rangeText: string }) {
  const { db, range } = props;
  const selectCourse = useApp((s) => s.selectCourse);
  const head = ['חוג', 'מורה', 'רשומים', 'מקסימום', 'תפוסה', 'הכנסות בטווח (₪)', 'יתרת חוב (₪)'];

  let totEnrolled = 0;
  let totIncome = 0;
  let totOut = 0;
  const rows: Row[] = db.courses.map((c) => {
    const ens = db.enrollments.filter((e) => e.courseId === c.id);
    // תפוסה = משובצים נוכחיים (פעיל+מוקפא) כמו בכל האפליקציה; הכספים על כל השיבוצים
    // (גם בוגרים שעזבו עם חוב/תשלום בטווח).
    const current = enrollCount(db, c.id);
    const income = ens.reduce((a, e) => a + paidInRange(e, range), 0);
    const out = ens.reduce((a, e) => a + balanceOf(e), 0);
    const teacher = db.teachers.find((t) => t.id === c.teacherId);
    totEnrolled += current;
    totIncome += income;
    totOut += out;
    return {
      cells: [
        c.name,
        teacher?.name ?? '',
        current,
        c.maxStudents || '—',
        c.maxStudents ? Math.round((current / c.maxStudents) * 100) + '%' : '—',
        income,
        out,
      ],
      warn: c.maxStudents > 0 && current > c.maxStudents,
      open: () => selectCourse(c.id),
    };
  });
  const foot: Cell[] = ['סה"כ', '', totEnrolled, '', '', totIncome, totOut];

  return (
    <Section
      title="📚 סיכום רישום לחוגים"
      sub={'הכנסות מתשלומים בטווח: ' + props.rangeText + ' · יתרת חוב — מצב נוכחי'}
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName="maor-report-courses.csv"
      csvRows={() => [head, ...rows.map((r) => r.cells), foot]}
    >
      <ReportTable head={head} rows={rows} foot={foot} />
    </Section>
  );
}

/** 2. נוכחות וחיסורים — לפי חוג או לפי תלמיד/ה (מתוך enrollments.absences). */
export function AttendanceSection(props: SectionProps) {
  const { db } = props;
  const selectCourse = useApp((s) => s.selectCourse);
  const selectFamily = useApp((s) => s.selectFamily);
  const [mode, setMode] = useState<'course' | 'member'>('course');
  const idx = nameIndex(db);

  const courseHead = ['חוג', 'מורה', 'שיבוצים', 'חיסורים', 'ללא הודעה (No-Show)', 'זכאי השלמה'];
  let tAbs = 0;
  let tNoshow = 0;
  let tMakeup = 0;
  const courseRows: Row[] = db.courses.map((c) => {
    const ens = db.enrollments.filter((e) => e.courseId === c.id);
    let abs = 0;
    let noshow = 0;
    let makeup = 0;
    for (const e of ens) {
      for (const a of e.absences) {
        abs++;
        if (a.noshow) noshow++;
        if (a.makeup) makeup++;
      }
    }
    tAbs += abs;
    tNoshow += noshow;
    tMakeup += makeup;
    const teacher = db.teachers.find((t) => t.id === c.teacherId);
    return { cells: [c.name, teacher?.name ?? '', ens.length, abs, noshow, makeup], open: () => selectCourse(c.id) };
  });
  const courseFoot: Cell[] = ['סה"כ', '', db.enrollments.length, tAbs, tNoshow, tMakeup];

  const memberHead = ['תלמיד/ה', 'משפחה', 'חוג', 'חיסורים', 'ללא הודעה', 'זכאי השלמה', 'חיסור אחרון'];
  const memberRows: Row[] = db.enrollments
    .filter((e) => e.absences.length > 0)
    .map((e) => {
      const m = idx.get(e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      const noshow = e.absences.filter((a) => a.noshow).length;
      const makeup = e.absences.filter((a) => a.makeup).length;
      const last = e.absences.reduce((acc, a) => (a.date > acc ? a.date : acc), '');
      return {
        n: e.absences.length,
        row: {
          cells: [
            m?.first ?? '—',
            m?.famName ?? '',
            c?.name ?? '',
            e.absences.length,
            noshow,
            makeup,
            fmtDate(last),
          ],
          open: m ? () => selectFamily(m.famId) : undefined,
        } as Row,
      };
    })
    .sort((a, b) => b.n - a.n)
    .map((x) => x.row);

  const isCourse = mode === 'course';
  return (
    <Section
      title="🗓 נוכחות וחיסורים"
      sub="כל החיסורים המתועדים — כולל No-Show וזכאות לשיעור השלמה"
      hidden={props.hidden}
      onPrint={props.onPrint}
      csvName={isCourse ? 'maor-attendance-courses.csv' : 'maor-attendance-members.csv'}
      csvRows={() =>
        isCourse
          ? [courseHead, ...courseRows.map((r) => r.cells), courseFoot]
          : [memberHead, ...memberRows.map((r) => r.cells)]
      }
      extra={
        <>
          <Chip on={isCourse} onClick={() => setMode('course')}>
            לפי חוג
          </Chip>
          <Chip on={!isCourse} onClick={() => setMode('member')}>
            לפי תלמיד/ה
          </Chip>
        </>
      }
    >
      {isCourse ? (
        <ReportTable head={courseHead} rows={courseRows} foot={courseFoot} />
      ) : (
        <ReportTable head={memberHead} rows={memberRows} />
      )}
    </Section>
  );
}
