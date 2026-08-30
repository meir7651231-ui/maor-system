/**
 * כרטיס קורס — תלמידים רשומים (ניקוב, ⚙ ניהול, ✕ חיסור, שיוך קבוצה),
 * שעות פעילות וקבוצות (עורך המפגשים) ופרטי הקורס.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Course, Enrollment, Teacher, Weekday } from '../../types/domain';
import { formatIsraeliPhone } from '../../lib/validate';
import { allMembers, useApp } from '../../store/useApp';
import { canGrantedAction, featureOn, roleOf, termOf } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { downloadCsv, type Cell } from '../../lib/csvx';
import { buildCourseDailyRows } from '../../lib/courseDaily';
import { Btn, Empty, Field, Modal, Select, StickyBackBar, TextInput } from '../ui';
import { CourseForm } from './CourseForm';
import { EnrollModal } from './EnrollModal';
import { AttendanceSheet } from './AttendanceSheet';
import { ClassBroadcast } from './ClassBroadcast';
import { HebDateInput } from '../HebDateInput';
import { ManageModal } from './ManageModal';
import { AbsenceModal } from './AbsenceModal';
import { CustomExport } from '../reports/CustomExport';
import { useArmed } from '../useArmed';
import {
  DAY_NAMES,
  TINTS,
  ageOf,
  chipStyle,
  defaultCourseDates,
  duplicateCourse,
  enrollCount,
  enrollmentPaidStatus,
  payBal,
  fmtDate,
  groupLabelOf,
  groupRemapOnRemoval,
  groupOptionsOf,
  groupsHintFromAudience,
  isoToday,
  modelMeta,
  planLabelOf,
  presentsInMonth,
  priceSuffix,
  punchConfirmStep,
  PUNCH_CONFIRM_MS,
  pendingMakeups,
  sessionsOf,
  waitlistFor,
  type PunchArm,
} from './lib';

const GROUP_PALETTE: [string, string][] = [
  ['#fdf1d4', '#9a6414'],
  ['#e7edf5', '#3a5a86'],
  ['#e4f5ea', '#12803c'],
  ['#efe7f3', '#7c3aed'],
  ['#fbeef3', '#be185d'],
];

type ModalState =
  | { kind: 'edit' }
  | { kind: 'enroll'; waitlist?: boolean }
  | { kind: 'sheet' }
  | { kind: 'broadcast' }
  | { kind: 'manage'; enrollmentId: string }
  | { kind: 'absence'; enrollmentId: string }
  | null;

export function CourseDetail(props: { course: Course }) {
  const db = useApp((s) => s.db);
  const selectCourse = useApp((s) => s.selectCourse);
  const selectFamily = useApp((s) => s.selectFamily);
  const deleteCourse = useApp((s) => s.deleteCourse);
  const upsertCourse = useApp((s) => s.upsertCourse);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const upsertEvent = useApp((s) => s.upsertEvent);
  const nextId = useApp((s) => s.nextId);
  const go = useApp((s) => s.go);
  const setPresent = useApp((s) => s.setPresent);
  const setEnrollmentPaid = useApp((s) => s.setEnrollmentPaid);
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);
  const cfg = useApp((s) => s.config);

  const punchOn = featureOn(cfg, 'courses.punch');
  // אישור כפול לניקוב (P1.3, legacy:330-342) — דלוק כברירת מחדל כמו בקובץ החי
  const punchConfirmOn = featureOn(cfg, 'courses.punch.confirm');
  const groupsOn = featureOn(cfg, 'courses.groups');
  const printoutOn = featureOn(cfg, 'courses.printout');
  const discountsOn = featureOn(cfg, 'courses.discounts');
  // 💰 תשלומים וחובות — כבוי ⇒ גלולת-התשלום ברשימת-הרשומים מוסתרת
  const paymentsOn = featureOn(cfg, 'courses.payments');
  // ⚕ מידע רפואי/רגישויות (PII) — כבוי ⇒ עמודת-הרגישויות לא נכללת בתדפיס-המורה
  const healthOn = featureOn(cfg, 'families.health');
  // 🔐 מאסטר-מתג הוצאת-מידע — כבוי ⇒ כפתורי התדפיס/הדוח-היומי מוסתרים
  const exportOn = featureOn(cfg, 'core.export');
  // תג-תפוסה N/max — כבוי ⇒ מוסתר בכותרת ובפרטי-החוג
  const occupancyOn = featureOn(cfg, 'courses.occupancy');
  // טווח כיתות + תמונת חוג (P2 פער 28)
  const gradeimgOn = featureOn(cfg, 'courses.gradeimg');
  // תפקיד מורה (P3 פריט 15) — עריכה/מחיקה מוסתרות למורה מחוברת
  const userEmail = useApp((s) => s.cloud.user?.email ?? null);
  const isTeacherUser = featureOn(cfg, 'shell.roles') && roleOf(cfg, userEmail) === 'teacher';
  // הרשאה אחידה (בקשת-בעלים 23.8): מחיקת-חוג למנהל/בעלים תמיד; עובד/ת רק אם הודלק/ה.
  // featureOn נשמר (מכבד כיבוי-ארגוני קיים של courses.delete) ⇒ אפס-רגרסיה.
  const isOrgMgr = useApp((s) => s.cloud.isManager) === true;
  const canDeleteCourse = featureOn(cfg, 'courses.delete') && canGrantedAction(cfg, userEmail, isOrgMgr, 'courses.delete');
  // הקמה-מהירה (שכפול-סמסטר + סיום-סמסטר מרוכז) — פעולת-ניהול: מנהל/בעלים תמיד; עובד/ת רק אם הודלק/ה.
  const canBulkAdmin = featureOn(cfg, 'courses.bulkadmin') && canGrantedAction(cfg, userEmail, isOrgMgr, 'courses.bulkadmin');
  // מחיקה בשני קליקים (P3 פריט 19, shell.armdel)
  const { armed, confirmTwice } = useArmed(featureOn(cfg, 'shell.armdel'));

  const c = props.course;
  const [prevCourseId, setPrevCourseId] = useState(c.id);
  const [modal, setModal] = useState<ModalState>(null);
  // 🗓 סינון-פנימי לפי שנת-לימודים (בקשת-בעלים 24.8 — "צ׳יפ תשפ״ז/תשפ״ח").
  // null ⇒ הכל (כולל שיבוצים ישנים בלי `year`). ריקון אוטומטי כשעוברים חוג.
  const [yearF, setYearF] = useState<string | null>(null);
  // ☑ מצב-בחירה-מרובה לרישום-לשנה-הבאה בתוך כרטיס-החוג (בקשת-בעלים 24.8, המשך):
  // "אני יכול לבחור משתתפים בחירה-מרובה לרישום או לא, וכמובן שיסתכרן ברישום".
  // אותו מנוע `reenrollEnrollment` כמו מסך "רישום" — אותם רשומות, אותה סמנטיקה.
  const [regMode, setRegMode] = useState(false);
  const [regSel, setRegSel] = useState<ReadonlySet<string>>(new Set<string>());
  const reenrollEnrollment = useApp((s) => s.reenrollEnrollment);
  const reenrollOn = cfg?.features?.['courses.reenroll'] === true;
  // בקשת-בעלים 9.8: בורר-מורה מכרטיס-החוג (קיים או חדש) — בלי מסע לטופס-העריכה
  const [teacherPick, setTeacherPick] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [noteVal, setNoteVal] = useState(c.notes);
  const [sessDay, setSessDay] = useState('0');
  const [sessTime, setSessTime] = useState('17:00');
  const [sessLabel, setSessLabel] = useState('');
  // זריון האישור הכפול לניקוב — מתפרק אוטומטית אחרי PUNCH_CONFIRM_MS (כמו בלגאסי)
  const [punchArm, setPunchArm] = useState<PunchArm | null>(null);
  const punchArmTimer = useRef(0);

  // "נוכחות ✓" מהבית (20.8) — בקשת-גלילה לטבלת-השיבוצים (דפוס supOpenReq):
  // הכרטיס נפתח רגיל, והמקטע "תלמידים רשומים" נגלל לתצוגה פעם-אחת.
  const attnSectionRef = useRef<HTMLElement>(null);
  const courseAttnReq = useApp((s) => s.courseAttnReq);
  const ackCourseAttendance = useApp((s) => s.ackCourseAttendance);
  useEffect(() => {
    if (courseAttnReq && courseAttnReq === c.id) {
      attnSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      ackCourseAttendance();
    }
  }, [courseAttnReq, c.id, ackCourseAttendance]);

  // מעבר לכרטיס קורס אחר בלי unmount (למשל בחירת חוג מפלטת הפקודות בזמן
  // שכרטיס פתוח) — הרכיב אינו ממופתח לפי id, ולכן חוצץ ההערה המקומי היה
  // נשאר של הקורס הקודם, ושמירה הייתה דורסת את הערת הקורס החדש בטקסט הישן.
  if (prevCourseId !== c.id) {
    setPrevCourseId(c.id);
    setNoteVal(c.notes);
    setModal(null);
    setYearF(null); // איפוס סינון-שנה במעבר חוג
    setRegMode(false); // איפוס מצב-בחירה-לרישום
    setRegSel(new Set());
  }

  const teacher = db.teachers.find((t) => t.id === c.teacherId);
  const room = db.rooms.find((r) => r.id === c.roomId);
  // רשימת-ההמתנה ('wait') לא בין הרשומים — לא בטבלה, לא בתדפיס, לא בספירת-קבוצות.
  const enrolledAll = db.enrollments.filter((e) => e.courseId === c.id && e.status !== 'wait');
  // ‏🗓 סינון-פנימי לפי שנת-לימודים (יעד-בעלים 24.8): צ׳יפ תשפ״ז/תשפ״ח שולט על הטבלה
  // בלבד. groupCounts/waiter/csv נשארים על enrolledAll כדי לא לפגוע בייצוא ובספירה.
  const enrolled = yearF ? enrolledAll.filter((e) => (e.year ?? '') === yearF) : enrolledAll;
  // תוויות שנת-הלימודים הקיימות בחוג + מונים (בסדר: ישנות → חדשות, "ללא-סיווג" בסוף).
  const yearCounts = (() => {
    const m = new Map<string, number>();
    for (const e of enrolledAll) {
      const k = (e.year ?? '').trim();
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    const arr = [...m.entries()].filter(([k]) => !!k);
    arr.sort((a, b) => a[0].localeCompare(b[0]));
    if (m.has('') && (m.get('') ?? 0) > 0) arr.push(['', m.get('') ?? 0]);
    return arr;
  })();
  const waitlistOn = featureOn(cfg, 'courses.waitlist');
  const waiters = waitlistOn ? waitlistFor(db.enrollments, c.id) : [];
  const deleteEnrollment = useApp((s) => s.deleteEnrollment);
  const bulkEndCourse = useApp((s) => s.bulkEndCourse);
  const scheduleMakeup = useApp((s) => s.scheduleMakeup);
  const makeupSchedOn = featureOn(cfg, 'courses.makeup.schedule');
  const makeups = makeupSchedOn ? pendingMakeups(db.enrollments, c.id) : [];
  const memberName = (memberId: string) => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === memberId);
      if (m) return m.first + ' · ' + f.name;
    }
    return '—';
  };
  // ממואיזים לפי db: allMembers רץ מחדש בכל render (גם בהקלדה), וה-.find לכל שורה
  // נתן O(מספר-שיבוצים × סה"כ-חברים). Map ממזהה→חבר הופך את זה ל-O(1) לשורה.
  const members = useMemo(() => allMembers(db), [db]);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  // בקשת-בעלים 25.8: כניסה-לכרטיס-התלמיד מתוך החוג — קפיצה לכרטיס-המשפחה שלו/ה.
  const openCard = (memberId: string) => {
    const fid = memberById.get(memberId)?.famId;
    if (fid) selectFamily(fid);
  };
  const sessions = sessionsOf(c);
  // קבוצות כבויות בקונפיגורציה → התנהגות קבוצה-יחידה (אין בוררי קבוצה ואין עורך)
  const groups = groupsOn ? groupOptionsOf(c) : [];
  const mm = modelMeta(c);
  const tint = TINTS[Math.max(0, db.courses.indexOf(c)) % TINTS.length];
  const full = enrollCount(db, c.id) >= (c.maxStudents || 999);

  function doPunch(e: Enrollment) {
    if (e.status === 'paused') return toast('ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' מוקפא — הפשירו אותו בניהול ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' (⚙)');
    if (e.status === 'ended') return toast('ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' הסתיים — ניתן לחדש בניהול ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' (⚙)');
    // ⏳ רשימת-המתנה לא משתתפת במפגשים — שער-בטיחות (הטבלה כבר מסננת 'wait', אך
    // הפונקציה חשופה גם לזרימות עתידיות; אותו דין כמו כרטיס-המשפחה והיומן)
    if (e.status === 'wait') return toast('ברשימת-המתנה — עדיין לא משתתפ/ת; קדמו לפעיל קודם (▲ שבץ)');
    if (e.plan === 'punch' && e.used >= e.purchased) {
      setModal({ kind: 'manage', enrollmentId: e.id });
      return;
    }
    // אישור כפול (legacy:335-338): לחיצה ראשונה מזיינת, שנייה בתוך 3ש׳ מבצעת
    const step = punchConfirmStep(punchConfirmOn, punchArm, e.id, Date.now());
    if (!step.fire) {
      setPunchArm(step.next);
      window.clearTimeout(punchArmTimer.current);
      punchArmTimer.current = window.setTimeout(() => setPunchArm(null), PUNCH_CONFIRM_MS);
      return;
    }
    setPunchArm(null);
    // ציד-באגים 3.8.2026 (🟠): הכרטיס עקף את setPresent (#6) — used++ בלי presents[]
    // ובלי שער-תאריך ⇒ (א) ניקוב-כפול חוצה-מסכים (כרטיס↔יומן שורפים 2 ניקובים למפגש
    // אחד) · (ב) לחיצה כפולה באותו יום ספרה פעמיים · (ג) המונה-החודשי הראה 0. עכשיו
    // דרך setPresent האידמפוטני (כרטיסייה+חודשי אחיד; מסרב כשאין יתרת-כרטיסייה).
    const today = isoToday();
    if ((e.presents ?? []).includes(today)) return toast('כבר נרשמה נוכחות היום');
    if (!setPresent(e.id, today, true)) {
      setModal({ kind: 'manage', enrollmentId: e.id });
      return;
    }
    const fam = db.families.find((f) => f.members.some((m) => m.id === e.memberId));
    if (fam) addCred(fam.id, 5, 'נוכחות (Check-in)');
    toast('הניקוב נרשם בהצלחה');
  }

  /** תדפיס למורה — CSV של התלמידים הרשומים, כולל רגישויות (port של exportCourseStudents). */
  function exportStudents() {
    // עמודת-הרגישויות (PII רפואי) נכללת רק כשדגל families.health דלוק
    const rows: Cell[][] = [
      [termOf(cfg, 'entity.student', 'תלמיד/ה'), 'גיל', termOf(cfg, 'entity.family', 'משפחה'), 'טלפון', 'קבוצה', 'מסלול', 'יתרה', ...(healthOn ? ['רגישויות/רפואי'] : []), 'הערה'],
    ];
    for (const e of enrolled) {
      const m = memberById.get(e.memberId);
      const fam = db.families.find((f) => f.id === m?.famId);
      rows.push([
        m?.first ?? '',
        (m ? ageOf(m.birth) : null) ?? '',
        fam?.name ?? '',
        m?.phone || fam?.phone || '',
        e.group,
        e.plan === 'punch' ? 'כרטיסייה ' + (e.purchased - e.used) + '/' + e.purchased : 'מנוי',
        e.plan === 'punch' ? e.purchased - e.used : '',
        ...(healthOn ? [m?.health ?? ''] : []),
        e.note,
      ]);
    }
    downloadCsv('course-' + c.name + '.csv', rows);
    toast('רשימת ה' + termOf(cfg, 'entity.students', 'תלמידים') + ' של "' + c.name + '" ירדה' + (healthOn ? ' — כולל רגישויות ל' + termOf(cfg, 'entity.teacher', 'מורה') : ''));
  }

  /** דו"ח יומי מפורט — מפגש-מפגש מ-start עד end, מי פעיל כולל חיסורים. */
  function exportDaily() {
    const { rows, days } = buildCourseDailyRows(c, db, cfg);
    if (!c.start || !c.end) {
      toast('ל' + termOf(cfg, 'entity.course', 'חוג') + ' חסר תאריך התחלה/סיום — עדכנו בעריכת ה' + termOf(cfg, 'entity.course', 'חוג'));
      return;
    }
    if (days === 0) {
      toast('אין מפגשים בטווח התאריכים של ה' + termOf(cfg, 'entity.course', 'חוג'));
      return;
    }
    downloadCsv('course-daily-' + c.name + '.csv', rows);
    toast('דו"ח יומי מפורט של "' + c.name + '" ירד — ' + days + ' ימי פעילות');
  }

  function setGroup(e: Enrollment, v: string, first: string) {
    upsertEnrollment({ ...e, group: v });
    toast(v ? first + ' שויך/ה ל' + v : 'הוסר השיוך של ' + first);
  }

  /** הוספת קבוצה/מפגש לקורס. */
  function addSession() {
    const day = Math.min(5, Math.max(0, +sessDay || 0)) as Weekday;
    upsertCourse({
      ...c,
      sessions: [...sessions, { day, time: sessTime || '17:00', label: sessLabel.trim() }],
    });
    setSessLabel('');
    toast('הקבוצה נוספה ללוח הפעילות');
  }

  /**
   * הסרת קבוצה — משאירה לפחות אחת. שיבוצי הקבוצה שהוסרה ⇒ "ללא שיוך"; שיבוצי
   * הקבוצות שאחריה ממופים לתווית-הפוזיציונית החדשה (#9) כדי שלא יצביעו לקבוצה
   * הלא-נכונה אחרי הזזת המספור.
   */
  function removeSession(i: number) {
    if (sessions.length <= 1) return toast('חייבת להישאר לפחות קבוצה אחת');
    const { removed, remap } = groupRemapOnRemoval(sessions, i);
    const next = sessions.filter((_, j) => j !== i);
    upsertCourse({ ...c, sessions: next, weekday: next[0].day, time: next[0].time });
    let moved = 0;
    let remapped = 0;
    // גם שיבוצי רשימת-ההמתנה ('wait') של החוג עוברים את אותו ניקוי/מיפוי — אחרת
    // ממתין/ה שומר/ת תווית-קבוצה שכבר לא קיימת (או שזזה) ונוחת/ת בקבוצה הלא-נכונה
    // בקידום מהתור ("▲ שבץ" משמר את e.group).
    const waitOfCourse = db.enrollments.filter((e) => e.courseId === c.id && e.status === 'wait');
    for (const e of [...enrolled, ...waitOfCourse]) {
      if (e.group === removed) {
        upsertEnrollment({ ...e, group: '' });
        moved++;
      } else if (remap.has(e.group)) {
        upsertEnrollment({ ...e, group: remap.get(e.group)! });
        remapped++;
      }
    }
    const tail =
      (moved ? ' · ' + moved + ' ' + termOf(cfg, 'entity.students', 'תלמידים') + ' סונכרנו ל"ללא שיוך"' : '') +
      (remapped ? ' · ' + remapped + ' עודכנו לקבוצה הנכונה' : '');
    toast('הקבוצה הוסרה' + (tail || ' מלוח הפעילות'));
  }

  const groupCounts =
    groups.length > 0
      ? [
          ...sessions.map((ss, i) => {
            const v = groupLabelOf(ss, i);
            const [bg, fg] = GROUP_PALETTE[i % GROUP_PALETTE.length];
            return { label: v + ' · ' + enrolledAll.filter((e) => e.group === v).length, bg, fg };
          }),
          ...(enrolledAll.some((e) => !e.group)
            ? [{ label: 'ללא שיוך · ' + enrolledAll.filter((e) => !e.group).length, bg: '#eceae2', fg: '#8b8474' }]
            : []),
        ]
      : [];

  const detailRow = (label: string, value: string, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
      <span style={{ color: 'var(--ink-faint)' }}>{label}</span>
      <span style={{ fontWeight: 700, color, textAlign: 'left' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* כותרת-החוג: קודם שורת-flex יחידה — צביר 7 כפתורי-הפעולה (בלי הגבלת-רוחב)
          מעך את הכותרת לעמודה צרה שגלשה מילה-בכל-שורה (ממצא-נחיל 23.8). עכשיו
          השורה עוטפת (flexWrap) והכותרת שומרת רוחב-מינימום ⇒ הכפתורים יורדים
          לשורה שנייה במקום למעוך את שם-החוג. */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: tint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 800,
            color: 'rgba(33,29,23,.45)',
            flex: 'none',
          }}
        >
          {c.name[0]}
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              {c.name}
            </h1>
            <span style={chipStyle(mm.bg, mm.c)}>{mm.label}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 3 }}>
            {(c.audience || 'כללי') + ' · ' + termOf(cfg, 'entity.teacher', 'מורה') + ': ' + (teacher?.name ?? '—') + ' · ' + (room?.name ?? '—') + ' · ' +
              (c.price ? '₪' + c.price + ' ' + priceSuffix(c.model) : '—')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* P3 פריט 3 — תזכורת ללוח על שם החוג (לגאסי: כפתור 🔔 בכרטיס) */}
          {featureOn(cfg, 'courses.reminder') && (
          <Btn
            onClick={() => {
              upsertEvent({
                id: nextId('ev'),
                title: 'תזכורת — ' + termOf(cfg, 'entity.course', 'חוג') + ' ' + c.name,
                date: isoToday(),
                time: sessionsOf(c)[0]?.time || '',
                type: 'reminder',
                customType: '',
                notes: (teacher?.name ? termOf(cfg, 'entity.teacher', 'מורה') + ': ' + teacher.name : ''),
                price: 0,
                roomId: c.roomId || '',
                famId: '',
                priority: 'orange',
                done: false,
              });
              toast('תזכורת ל"' + c.name + '" נוספה ללוח להיום');
              go('calendar');
            }}
            title="יצירת אירוע תזכורת ללוח על שם החוג"
          >
            🔔 תזכורת ללוח
          </Btn>
          )}
          {featureOn(cfg, 'courses.broadcast') && (
            <Btn onClick={() => setModal({ kind: 'broadcast' })} title="הודעת-וואטסאפ מרוכזת לכל תלמידי החוג">
              📢 הודעה לכיתה
            </Btn>
          )}
          {featureOn(cfg, 'courses.printout.custom') && (
            <Btn onClick={() => setExpOpen(true)} title='דו"ח מותאם — בחירת טווח ונתונים'>
              📊 דו"ח מותאם
            </Btn>
          )}
          {/* מורה מחוברת (P3 פריט 15): עריכה ומחיקה הן פעולות ניהול — מוסתרות */}
          {!isTeacherUser && (
            <Btn onClick={() => setModal({ kind: 'edit' })}>{'✎ עריכת ' + termOf(cfg, 'entity.course', 'חוג')}</Btn>
          )}
          {!isTeacherUser && canBulkAdmin && (
            <Btn
              onClick={() => {
                const id = nextId('c');
                upsertCourse(duplicateCourse(c, id, defaultCourseDates()));
                selectCourse(id);
                toast('ה' + termOf(cfg, 'entity.course', 'חוג') + ' שוכפל לסמסטר-חדש — ערכו והתאימו');
              }}
              title="שכפול לסמסטר-חדש — כל השדות עם תאריכים-חדשים, בלי תלמידים"
            >
              📑 שכפל
            </Btn>
          )}
          {!isTeacherUser && canBulkAdmin && enrolledAll.some((e) => e.status === 'active' || e.status === 'paused') && (
            <Btn
              kind={armed === 'endsem-' + c.id ? 'danger' : undefined}
              onClick={() => {
                const n = enrolledAll.filter((e) => e.status === 'active' || e.status === 'paused').length;
                if (!confirmTwice('endsem-' + c.id, 'לסיים את הסמסטר? ' + n + ' שיבוצים יסומנו "הסתיים" (נשמרים בדוח ההיסטורי; אפשר לחדש).')) {
                  toast('בטוחים? לחיצה נוספת תסיים את הסמסטר');
                  return;
                }
                const done = bulkEndCourse(c.id, isoToday());
                toast('🎓 הסמסטר הסתיים — ' + done + ' שיבוצים עודכנו');
              }}
              title="סיום-סמסטר — כל השיבוצים הפעילים ⇒ הסתיים (נשמר בדוח, ניתן לחדש)"
            >
              {armed === 'endsem-' + c.id ? '🎓 בטוח? עוד לחיצה' : '🎓 סיום סמסטר'}
            </Btn>
          )}
          {!isTeacherUser && canDeleteCourse && (
          <Btn
            kind="danger"
            onClick={() => {
              const n = enrolledAll.length;
              const msg =
                'למחוק את ה' + termOf(cfg, 'entity.course', 'חוג') + ' "' + c.name + '"?' +
                (n ? ' פעולה זו תמחק גם את ' + n + ' ה' + termOf(cfg, 'entity.enrollments', 'שיבוצים') + ' שלו (כולל תשלומים ונוכחות).' : '') +
                '\n\nלא ניתן לבטל.';
              // מחיקה בשני קליקים (P3 פריט 19, לגאסי armDel)
              if (!confirmTwice('crs-' + c.id, msg)) {
                toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
                return;
              }
              deleteCourse(c.id);
              selectCourse(null);
              toast('ה' + termOf(cfg, 'entity.course', 'חוג') + ' נמחק');
            }}
            title={'מחיקת ה' + termOf(cfg, 'entity.course', 'חוג') + ' וכל ה' + termOf(cfg, 'entity.enrollments', 'שיבוצים') + ' שלו'}
          >
            {armed === 'crs-' + c.id ? '🗑 בטוח? עוד לחיצה' : '🗑 מחיקה'}
          </Btn>
          )}
        </div>
      </div>

      {/* הגריד רספונסיבי (global.css) — במובייל הסרגל הצדדי יורד מתחת לעמודה הראשית */}
      <div className="crs-detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="card" ref={attnSectionRef}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>{termOf(cfg, 'entity.students', 'תלמידים') + ' רשומים'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {occupancyOn && (
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>
                    {enrollCount(db, c.id) + '/' + (c.maxStudents || '∞') + ' רשומים'}
                  </span>
                )}
                {/* ⬇ תדפיסים = הוצאת-מידע — מכבדים גם את מאסטר-המתג core.export */}
                {printoutOn && exportOn && (
                  <Btn sm disabled={!enrolled.length} onClick={exportStudents} title={'הורדת רשימת ה' + termOf(cfg, 'entity.students', 'תלמידים') + ' כ-CSV ל' + termOf(cfg, 'entity.teacher', 'מורה') + (healthOn ? ' — כולל רגישויות' : '')}>
                    {'⬇ תדפיס ל' + termOf(cfg, 'entity.teacher', 'מורה')}
                  </Btn>
                )}
                {featureOn(cfg, 'courses.printout.daily') && exportOn && (
                  <Btn sm onClick={exportDaily} title='דו"ח יומי מפורט — מפגש-מפגש כולל חיסורים'>
                    ⬇ דו"ח יומי מפורט
                  </Btn>
                )}
                {featureOn(cfg, 'courses.attendance.sheet') && (
                  <Btn sm disabled={!enrolled.length} onClick={() => setModal({ kind: 'sheet' })} title="גיליון-נוכחות מהיר — כל הקבוצה בבת-אחת">
                    📋 נוכחות
                  </Btn>
                )}
                <Btn sm disabled={full && !waitlistOn} onClick={() => setModal({ kind: 'enroll', waitlist: full && waitlistOn })}>
                  {full ? (waitlistOn ? '⏳ רשימת-המתנה' : 'ה' + termOf(cfg, 'entity.course', 'חוג') + ' מלא') : '➕ ' + termOf(cfg, 'entity.enrollment', 'שיבוץ')}
                </Btn>
                {/* 🗓 בקשת-בעלים 24.8: מעבר-בחירה לרישום-לשנה-הבאה ישירות מהכרטיס */}
                {reenrollOn && !isTeacherUser && enrolledAll.some((e) => !e.renewedToId) && (
                  <Btn
                    sm
                    kind={regMode ? 'primary' : undefined}
                    onClick={() => { setRegMode(!regMode); setRegSel(new Set()); }}
                    title="בחירה-מרובה לרישום לשנה הבאה — מסמנים תלמידים ולוחצים «רשום»"
                  >
                    {regMode ? '✕ סיום-בחירה' : '☑ רישום לשנה הבאה'}
                  </Btn>
                )}
              </div>
            </div>
            {groupCounts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
                {groupCounts.map((g) => (
                  <span key={g.label} style={chipStyle(g.bg, g.fg)}>
                    {g.label}
                  </span>
                ))}
              </div>
            )}
            {/* 🗓 סינון-פנימי לפי שנת-לימודים (בקשת-בעלים 24.8) — צ׳יפים תשפ״ז/תשפ״ח.
                מוצג רק כשיש בפועל שנים מסווגות (או שיש גם ישנים בלי-סיווג). */}
            {yearCounts.length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>שנת-לימודים:</span>
                <button
                  type="button"
                  onClick={() => setYearF(null)}
                  style={{ ...chipStyle('#eef0f2', '#444'), cursor: 'pointer', border: yearF === null ? '1px solid #444' : '1px solid transparent' }}
                >
                  הכל · {enrolledAll.length}
                </button>
                {yearCounts.map(([y, n]) => (
                  <button
                    key={y || '__none'}
                    type="button"
                    onClick={() => setYearF(yearF === y ? null : y)}
                    style={{
                      ...chipStyle(y ? '#e6f0ff' : '#eceae2', y ? '#2a5cad' : '#8b8474'),
                      cursor: 'pointer',
                      border: yearF === y ? '1px solid ' + (y ? '#2a5cad' : '#8b8474') : '1px solid transparent',
                    }}
                    title={'סינון לשיבוצים בשנה ' + (y || 'ללא-סיווג')}
                  >
                    {(y || 'ללא-סיווג') + ' · ' + n}
                  </button>
                ))}
              </div>
            )}
            {enrolled.length === 0 ? (
              <Empty>{'אין ' + termOf(cfg, 'entity.students', 'תלמידים') + ' רשומים — לחצו על "' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' ' + termOf(cfg, 'entity.student', 'תלמיד/ה') + '"'}</Empty>
            ) : (
              <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                {/* ☑ פס-פעולות של רישום-לשנה-הבאה — מוצג רק במצב-בחירה, מעל הטבלה */}
                {regMode && (() => {
                  const selectable = enrolled.filter((e) => !e.renewedToId);
                  const selCount = selectable.filter((e) => regSel.has(e.id)).length;
                  const allSel = selCount > 0 && selCount === selectable.length;
                  return (
                    <div style={{
                      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
                      padding: '8px 10px', marginBottom: 8, borderRadius: 8,
                      background: 'var(--accent-soft, #fdf3dd)',
                      border: '1px solid var(--accent, #d9a84e)',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      <span>☑ נבחרו {selCount} מתוך {selectable.length}</span>
                      <Btn sm onClick={() => setRegSel(allSel ? new Set() : new Set(selectable.map((e) => e.id)))}>
                        {allSel ? 'נקה בחירה' : 'בחר הכל'}
                      </Btn>
                      <span style={{ flex: 1 }} />
                      <Btn
                        sm
                        kind="primary"
                        disabled={!selCount}
                        onClick={() => {
                          const ids = [...regSel];
                          let ok = 0;
                          const reasons: string[] = [];
                          for (const id of ids) {
                            const r = reenrollEnrollment(id, '', undefined);
                            if (r.ok) ok++; else if (r.reason) reasons.push(r.reason);
                            else reasons.push('שגיאה לא-ידועה');
                          }
                          if (reasons.length === 0) {
                            toast(`✓ נרשמו ${ok} לשנה הבאה 🚀`);
                          } else {
                            // חיווי מפורט למה נחסם (בקשת-בעלים 25.8): במקום "0 נרשם N חסום"
                            // סתום — מציגים את הסיבה הראשונה (אחידה למרוב-הכשלים).
                            const uniqueReasons = [...new Set(reasons)];
                            const summary = uniqueReasons.length === 1
                              ? uniqueReasons[0]
                              : uniqueReasons.slice(0, 2).join(' · ');
                            toast(`נרשמו ${ok}, ${reasons.length} נחסמו — ${summary}`);
                          }
                          setRegSel(new Set());
                          setRegMode(false);
                        }}
                      >
                        🚀 רשום {selCount || ''} לשנה הבאה
                      </Btn>
                    </div>
                  );
                })()}
                <table className="table">
                  <thead>
                    <tr>
                      {regMode && <th style={{ width: 32 }}></th>}
                      <th>{termOf(cfg, 'entity.student', 'תלמיד/ה')}</th>
                      <th>{termOf(cfg, 'entity.family', 'משפחה')}</th>
                      <th>קבוצה</th>
                      <th>מסלול</th>
                      <th>יתרה</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolled.map((e) => {
                      const m = memberById.get(e.memberId);
                      // 💰 סטטוס-תשלום נגזר-אוטומטית (17.8) — מתעדכן לבד לפי היתרה
                      const paidStatus = enrollmentPaidStatus(e);
                      const hasDue = (e.totalDue || 0) > 0;
                      const paidColor = paidStatus === 'paid' ? '#16a34a' : paidStatus === 'partial' ? '#d97706' : '#dc2626';
                      const isPunch = e.plan === 'punch';
                      const rem = e.purchased - e.used;
                      const barColor = rem <= 0 ? '#dc2626' : rem <= 2 ? '#d97706' : '#16a34a';
                      const noBalance = isPunch && rem <= 0;
                      const age = m ? ageOf(m.birth) : null;
                      return (
                        <tr key={e.id}>
                          {regMode && (
                            <td style={{ width: 32, textAlign: 'center' }}>
                              {e.renewedToId ? (
                                <span title="כבר נרשם לשנה הבאה" style={{ color: '#2f7d52', fontWeight: 700, fontSize: 14 }}>✓</span>
                              ) : (
                                <input
                                  type="checkbox"
                                  aria-label={'בחר את ' + (m?.first ?? 'התלמיד/ה') + ' לרישום'}
                                  checked={regSel.has(e.id)}
                                  onChange={() => {
                                    const next = new Set(regSel);
                                    if (next.has(e.id)) next.delete(e.id); else next.add(e.id);
                                    setRegSel(next);
                                  }}
                                />
                              )}
                            </td>
                          )}
                          <td>
                            {m?.famId ? (
                              <button
                                type="button"
                                onClick={() => openCard(e.memberId)}
                                title={'פתיחת כרטיס ' + (m?.first ?? '')}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700, color: 'var(--accent-deep, var(--accent))', textDecoration: 'underline', textUnderlineOffset: 2 }}
                              >
                                👤 {m.first}
                              </button>
                            ) : (
                              <div style={{ fontWeight: 700 }}>{m?.first ?? '—'}</div>
                            )}
                            {age != null && (
                              <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                                {(m?.gender === 'f' ? 'בת ' : 'בן ') + age}
                              </div>
                            )}
                          </td>
                          <td>{m ? termOf(cfg, 'entity.familyOf', 'משפחת') + ' ' + m.famName : '—'}</td>
                          <td>
                            {groups.length > 0 ? (
                              <select
                                value={e.group}
                                title="שינוי קבוצה — נשמר מיד ומשתקף בלוח"
                                onChange={(ev) => setGroup(e, ev.target.value, m?.first ?? '')}
                                style={{ padding: '4px 6px', fontSize: 12 }}
                              >
                                <option value="">ללא</option>
                                {groups.map((g) => (
                                  <option key={g.v} value={g.v}>
                                    {g.t}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {planLabelOf(e)}
                            {e.note && (
                              <div style={{ fontSize: 11, color: '#9a6414', fontWeight: 600 }}>📝 {e.note}</div>
                            )}
                          </td>
                          <td>
                            {/* S4 (20.8): כשהניקוב כבוי הוצג planLabelOf — כפילות של עמודת
                                "מסלול". עכשיו עמודת-היתרה מציגה נוכחות-חודשית (מידע, לא כפל). */}
                            {punchOn && isPunch ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 80,
                                    height: 6,
                                    borderRadius: 99,
                                    background: 'rgba(33,29,23,.1)',
                                    overflow: 'hidden',
                                    flex: 'none',
                                  }}
                                >
                                  <div
                                    style={{
                                      height: '100%',
                                      borderRadius: 99,
                                      background: barColor,
                                      width: Math.max(0, Math.round((rem / (e.purchased || 1)) * 100)) + '%',
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>
                                  {rem + ' מתוך ' + e.purchased}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12 }}>{presentsInMonth(e.presents, isoToday()) + ' נוכחויות החודש · ' + e.used + ' סה"כ'}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                              {/* 💰 סטטוס-תשלום (17.8) — נגזר-אוטומטית מהיתרה. יש סכום-עסקה ⇒
                                  קליק פותח רישום-תשלום (הסטטוס מתעדכן לבד); אין ⇒ סימון-ידני.
                                  courses.payments כבוי ⇒ הגלולה מוסתרת כליל. */}
                              {paymentsOn && (
                              <button
                                type="button"
                                onClick={() => (hasDue ? setModal({ kind: 'manage', enrollmentId: e.id }) : setEnrollmentPaid(e.id, !e.paidFull))}
                                title={hasDue ? 'רישום/עדכון תשלום — הסטטוס מתעדכן לבד לפי היתרה' : 'סימון ידני שולם/לתשלום (אין סכום-עסקה לגזור ממנו)'}
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 99,
                                  whiteSpace: 'nowrap',
                                  cursor: 'pointer',
                                  border: '1px solid',
                                  borderColor: paidColor,
                                  color: paidColor,
                                  background: paidStatus === 'paid' ? 'rgba(22,163,74,.1)' : paidStatus === 'partial' ? 'rgba(217,119,6,.1)' : 'rgba(220,38,38,.08)',
                                }}
                              >
                                {paidStatus === 'paid' ? '✓ שולם' : paidStatus === 'partial' ? '◐ נותר ₪' + payBal(e) : '💰 לתשלום'}
                              </button>
                              )}
                              {punchOn && (
                                <Btn sm kind={noBalance ? 'plain' : 'primary'} onClick={() => doPunch(e)}>
                                  {noBalance ? 'חידוש ←' : punchArm?.id === e.id ? 'לאשר ניקוב?' : 'ניקוב'}
                                </Btn>
                              )}
                              <Btn
                                sm
                                title={'ניהול ' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ': קניית כרטיסייה, מסלול, הקפאה, הסרה'}
                                onClick={() => setModal({ kind: 'manage', enrollmentId: e.id })}
                              >
                                ⚙
                              </Btn>
                              {featureOn(cfg, 'courses.absence') && (
                                <Btn
                                  sm
                                  title="רישום חיסור (נימוק חובה)"
                                  onClick={() => setModal({ kind: 'absence', enrollmentId: e.id })}
                                >
                                  ✕
                                </Btn>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {waitlistOn && waiters.length > 0 && (
            <section className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800 }}>
                  ⏳ רשימת-המתנה <span style={{ color: 'var(--accent)' }}>· {waiters.length}</span>
                </h2>
                {full && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>מתפנה מקום? שבצו מהתור ▲</span>}
              </div>
              {waiters.map((e, i) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-faint)', width: 22 }}>{i + 1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {memberById.get(e.memberId)?.famId ? (
                      <button
                        type="button"
                        onClick={() => openCard(e.memberId)}
                        title="פתיחת כרטיס"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700, color: 'var(--accent-deep, var(--accent))', textDecoration: 'underline', textUnderlineOffset: 2 }}
                      >
                        👤 {memberName(e.memberId)}
                      </button>
                    ) : (
                      <div style={{ fontWeight: 700 }}>{memberName(e.memberId)}</div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>הצטרף/ה {fmtDate(e.enrolledAt)}</div>
                  </div>
                  <Btn
                    sm
                    kind="primary"
                    disabled={full}
                    title={full ? 'ה' + termOf(cfg, 'entity.course', 'חוג') + ' מלא — פנו מקום קודם' : 'שיבוץ מרשימת-ההמתנה'}
                    onClick={() => {
                      upsertEnrollment({ ...e, status: 'active', enrolledAt: isoToday() });
                      toast(memberName(e.memberId) + ' שובצ/ה מרשימת-ההמתנה');
                    }}
                  >
                    ▲ שבץ
                  </Btn>
                  <Btn sm onClick={() => { deleteEnrollment(e.id); toast('הוסר/ה מרשימת-ההמתנה'); }}>
                    ✕
                  </Btn>
                </div>
              ))}
            </section>
          )}

          {makeupSchedOn && makeups.length > 0 && (
            <section className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800 }}>
                  🔁 השלמות ממתינות <span style={{ color: 'var(--accent)' }}>· {makeups.filter((m) => !m.makeupDate).length}</span>
                </h2>
              </div>
              {makeups.map((m) => (
                <div key={m.enrollmentId + m.date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 700 }}>{memberName(m.memberId)}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                      חיסור {fmtDate(m.date)}
                      {m.reason ? ' · ' + m.reason : ''}
                    </div>
                  </div>
                  {m.makeupDate ? (
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#12803c' }}>✓ נקבע ל-{fmtDate(m.makeupDate)}</span>
                  ) : (
                    <div style={{ minWidth: 150 }}>
                      <HebDateInput
                        value=""
                        onChange={(v) => {
                          if (!v) return;
                          scheduleMakeup(m.enrollmentId, m.date, v);
                          toast('🔁 השלמה נקבעה ל-' + fmtDate(v) + ' — תזכורת נוספה ללוח');
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {groupsOn && (
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>שעות פעילות וקבוצות</h2>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>
                {sessions.length + (sessions.length === 1 ? ' קבוצה' : ' קבוצות')}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sessions.map((ss, i) => (
                <span
                  key={i}
                  className="chip"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}
                >
                  {(ss.label ? ss.label + ' · ' : '') + 'יום ' + DAY_NAMES[ss.day] + ' ' + (ss.time || '')}
                  <button
                    title="הסרת הקבוצה"
                    onClick={() => removeSession(i)}
                    style={{ color: '#b3ab9c', fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'flex-end',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--line)',
              }}
            >
              <div className="field" style={{ marginBottom: 0 }}>
                <label>יום</label>
                <select value={sessDay} onChange={(e) => setSessDay(e.target.value)}>
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={String(i)}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>שעה</label>
                <input type="time" value={sessTime} onChange={(e) => setSessTime(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
                <label>שם הקבוצה (רשות)</label>
                <input
                  value={sessLabel}
                  onChange={(e) => setSessLabel(e.target.value)}
                  placeholder="לדוגמה: קבוצה ב׳ / בוקר"
                />
              </div>
              <Btn kind="primary" sm onClick={addSession}>
                + הוספת קבוצה
              </Btn>
            </div>
            {/* P3 פריט 1 — הצעה אוטומטית מטקסט קהל-היעד (לגאסי: 'קבוצות|פעמים'); לא דורס */}
            {(() => {
              const hint = groupsHintFromAudience(c.audience);
              if (!hint || sessions.length >= hint) return null;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                  {'לפי קהל היעד ("' + c.audience + '") נראה שנדרשות ' + hint + ' קבוצות — כרגע ' + sessions.length + '.'}
                  <Btn
                    sm
                    onClick={() => {
                      const base = sessions[0];
                      const add = Array.from({ length: hint - sessions.length }, (_, i) => ({
                        day: base.day,
                        time: base.time,
                        label: 'קבוצה ' + (sessions.length + i + 1),
                      }));
                      upsertCourse({ ...c, sessions: [...sessions, ...add] });
                      toast('נוספו ' + add.length + ' קבוצות לפי קהל היעד');
                    }}
                  >
                    השלמה ל-{hint}
                  </Btn>
                </div>
              );
            })()}
          </section>
          )}
        </div>

        <section className="card">
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{'פרטי ה' + termOf(cfg, 'entity.course', 'חוג')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {/* תמונת חוג + טווח כיתות (P2 פער 28, feature courses.gradeimg) */}
            {gradeimgOn && c.img && (
              <img
                src={c.img}
                alt={'תמונת ה' + termOf(cfg, 'entity.course', 'חוג')}
                style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)' }}
              />
            )}
            {/* קבצים מצורפים (בקשת-בעלים 13.8 א') — מסמכים/תמונות/קישורים */}
            {featureOn(cfg, 'courses.files') && c.files && c.files.length > 0 && (
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 5 }}>
                  📎 קבצים מצורפים
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {c.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.data}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, padding: '4px 8px', border: '1px solid var(--line)', borderRadius: 8 }}
                    >
                      <span>{file.kind === 'link' ? '🔗' : file.kind === 'image' ? '🖼️' : '📄'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {detailRow('קהל יעד', c.audience || 'כללי')}
            {gradeimgOn && (c.gradeMin || c.gradeMax) &&
              detailRow('כיתות', [c.gradeMin, c.gradeMax].filter(Boolean).join('–'))}
            {/* בקשת-בעלים 9.8: החלפת/הוספת מורה ישירות מכרטיס-החוג — בלי מסע לטופס.
                courses.teacherpick כבוי ⇒ שם-המורה כטקסט רגיל בלבד. */}
            {featureOn(cfg, 'courses.teacherpick') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>{detailRow(termOf(cfg, 'entity.teacher', 'מורה'), teacher?.name ?? '—')}</div>
                <Btn sm onClick={() => setTeacherPick(true)} title={'החלפה או הוספת ' + termOf(cfg, 'entity.teacher', 'מורה')}>
                  {teacher ? '✏️' : '➕ הוספת ' + termOf(cfg, 'entity.teacher', 'מורה')}
                </Btn>
              </div>
            ) : (
              detailRow(termOf(cfg, 'entity.teacher', 'מורה'), teacher?.name ?? '—')
            )}
            {detailRow('טלפון ' + termOf(cfg, 'entity.teacher', 'מורה'), teacher?.phone || '—')}
            {detailRow('מחיר מלא', c.price ? '₪' + c.price + ' ' + priceSuffix(c.model) : '—')}
            {/* תמחור משוקלל פר-שיעור (בקשת-בעלים 13.8 ב') */}
            {featureOn(cfg, 'courses.perlesson') && c.perLesson && c.lessonPrice ? (
              <>
                {detailRow('מחיר לשיעור', '₪' + c.lessonPrice + ' לשיעור', '#12803c')}
                {c.lessonPrice1 ? detailRow((c.price1Name || 'הנחה 1') + ' לשיעור', '₪' + c.lessonPrice1, '#12803c') : null}
                {c.lessonPrice2 ? detailRow((c.price2Name || 'הנחה 2') + ' לשיעור', '₪' + c.lessonPrice2, '#7c3aed') : null}
                {c.lessonPrice3 ? detailRow((c.price3Name || 'הנחה 3') + ' לשיעור', '₪' + c.lessonPrice3, '#b45309') : null}
              </>
            ) : null}
            {discountsOn && detailRow(c.price1Name || 'הנחה 1', c.price1 ? '₪' + c.price1 : '—', '#12803c')}
            {discountsOn && detailRow(c.price2Name || 'הנחה 2', c.price2 ? '₪' + c.price2 : '—', '#7c3aed')}
            {discountsOn && (c.price3 || c.price3Name) ? detailRow(c.price3Name || 'הנחה 3', c.price3 ? '₪' + c.price3 : '—', '#b45309') : null}
            {detailRow('מסלול', mm.label)}
            {detailRow('סמסטר', c.semester || 'שנתי')}
            {detailRow(termOf(cfg, 'entity.room', 'חדר') + ' פעילות', room?.name ?? '—')}
            {occupancyOn && detailRow('תפוסה', enrollCount(db, c.id) + ' מתוך ' + (c.maxStudents || '∞'))}
            {detailRow(
              'תקופת פעילות (עברי)',
              (c.start ? hebDateFull(c.start) : '—') + ' – ' + (c.end ? hebDateFull(c.end) : '—'),
              '#9a6414',
            )}
            {detailRow('בלועזי', fmtDate(c.start) + ' – ' + fmtDate(c.end))}
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              {c.description || 'אין תיאור.'}
            </div>
            {featureOn(cfg, 'courses.notes') && (
              <>
                <div style={{ height: 1, background: 'var(--line)' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 5 }}>
                    {'📝 הערות פנימיות על ה' + termOf(cfg, 'entity.course', 'חוג')}
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input
                      value={noteVal}
                      onChange={(e) => setNoteVal(e.target.value)}
                      placeholder="לדוגמה: להביא חומרים, גבייה, הסעות…"
                    />
                    <Btn
                      sm
                      kind="primary"
                      onClick={() => {
                        upsertCourse({ ...c, notes: noteVal.trim() });
                        toast('ההערה על ה' + termOf(cfg, 'entity.course', 'חוג') + ' נשמרה');
                      }}
                    >
                      שמירה
                    </Btn>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {modal?.kind === 'edit' && <CourseForm course={c} onClose={() => setModal(null)} />}
      {modal?.kind === 'enroll' && <EnrollModal course={c} waitlist={modal.waitlist} onClose={() => setModal(null)} />}
      {modal?.kind === 'sheet' && <AttendanceSheet course={c} onClose={() => setModal(null)} />}
      {modal?.kind === 'broadcast' && <ClassBroadcast course={c} onClose={() => setModal(null)} />}
      {modal?.kind === 'manage' && (
        <ManageModal enrollmentId={modal.enrollmentId} course={c} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'absence' && (
        <AbsenceModal enrollmentId={modal.enrollmentId} course={c} onClose={() => setModal(null)} />
      )}
      {expOpen && <CustomExport target="courses" onClose={() => setExpOpen(false)} />}
      {teacherPick && <TeacherPickModal course={c} onClose={() => setTeacherPick(false)} />}

      {/* כפתור-חזרה מרחף קבוע בתחתית (בקשת-בעלים 19.8) */}
      <StickyBackBar onBack={() => selectCourse(null)} label={'→ כל ' + termOf(cfg, 'nav.courses', 'חוגים')} />
    </div>
  );
}

/** בקשת-בעלים 9.8 — בורר/יוצר מורה מכרטיס-החוג: בחירה מהקיימים או יצירה
 *  מהירה (שם+טלפון, אותם ברירות-מחדל של היצירה-inline בטופס) ושיוך מיידי. */
function TeacherPickModal(props: { course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const cfg = useApp((s) => s.config);
  const upsertTeacher = useApp((s) => s.upsertTeacher);
  const upsertCourse = useApp((s) => s.upsertCourse);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const T = (k: string, fb: string) => termOf(cfg, k, fb);
  const [sel, setSel] = useState(props.course.teacherId || '__new');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  function save() {
    let teacherId = sel;
    if (sel === '__new') {
      const tn = name.trim();
      if (!tn) return setError('הקלידו את שם ה' + T('entity.teacher', 'מורה'));
      const existing = db.teachers.find((t) => t.name === tn);
      if (existing) teacherId = existing.id;
      else {
        const nt: Teacher = {
          id: nextId('t'),
          name: tn,
          phone: formatIsraeliPhone(phone.trim()),
          phone2: '', email: '', idNum: '', address: '', specialty: '', payRate: 0, startDate: '', notes: '',
        };
        upsertTeacher(nt);
        teacherId = nt.id;
      }
    }
    upsertCourse({ ...props.course, teacherId });
    toast('ה' + T('entity.teacher', 'מורה') + ' שויכ/ה ל' + T('entity.course', 'חוג') + ' ✓');
    props.onClose();
  }

  return (
    <Modal title={'👩‍🏫 ' + T('entity.teacher', 'מורה') + ' ל' + T('entity.course', 'חוג') + ' — ' + props.course.name} onClose={props.onClose}>
      <Field label={T('entity.teacher', 'מורה')}>
        <Select
          value={sel}
          onChange={setSel}
          options={[
            ...db.teachers.map((t) => ({ value: t.id, label: t.name })),
            { value: '__new', label: '➕ הוספת ' + T('entity.teacher', 'מורה') },
          ]}
        />
      </Field>
      {sel === '__new' && (
        <>
          <Field label={'שם ה' + T('entity.teacher', 'מורה') + ' *'}>
            <TextInput value={name} onChange={setName} />
          </Field>
          <Field label="טלפון">
            <TextInput value={phone} onChange={setPhone} dir="ltr" />
          </Field>
        </>
      )}
      {error && <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{error}</div>}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה ושיוך</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
