/**
 * חישובי מסך הבית — פונקציות טהורות על ה-Db (ללא React).
 * כל הלוגיקה הנגזרת של לוח המחוונים מרוכזת כאן כדי שה-View יישאר תצוגה בלבד.
 */
import {
  HEBREW_RECURRING,
  type Course,
  type CourseSession,
  type Db,
  type EventType,
  type Family,
  type FamilyStatus,
  type OrgEvent,
} from '../../types/domain';
import { allMembers, type MemberWithFamily } from '../../store/useApp';
import { hebParts, hebAnnualEq, type HebParts } from '../../lib/hebrew';
import { payBal, sessionsOf } from '../courses/lib';
import { isoLocal } from '../../lib/date-util';
import type { ModuleKey, OrgConfig } from '../../types/config';

/** מפת המודולים הפעילים (config.modules) — חסר = פעיל; false = כבוי. */
export type ModulesMap = OrgConfig['modules'];

/** ISO מקומי (מקור-אמת יחיד ב-date-util — ללא הזחת אזור זמן של toISOString). */
export function isoOf(d: Date): string {
  return isoLocal(d);
}

/** תצוגת תאריך DD/MM/YYYY מתוך ISO — ללא new Date (בטוח מאזורי זמן). */
export function fmtD(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;

/** תווית + צבעי סטטוס משפחה (verbatim מהמקור). */
export const ST_META: Record<FamilyStatus, { label: string; bg: string; c: string }> = {
  active: { label: 'פעילה', bg: '#e4f5ea', c: '#12803c' },
  pending: { label: 'ממתינה', bg: '#fdf1d4', c: '#9a6414' },
  inactive: { label: 'לא פעילה', bg: '#eceae2', c: '#8b8474' },
};

/** תוויות וצבעי סוגי אירועים (verbatim מהמקור). */
export const EV_META: Record<EventType, { label: string; bg: string; c: string }> = {
  reminder: { label: 'תזכורת', bg: '#efe7f3', c: '#7c3aed' },
  call: { label: 'טלפון', bg: '#dff0ec', c: '#0f766e' },
  wedding: { label: 'חתונה', bg: '#fdeee0', c: '#b45309' },
  memorial: { label: 'אזכרה', bg: '#eceae2', c: '#4d463c' },
  anniversary: { label: 'יום נישואים', bg: '#fbeef3', c: '#be185d' },
  bday: { label: 'יום הולדת', bg: '#fbeef3', c: '#be185d' },
  org: { label: 'אירוע', bg: '#e7edf5', c: '#3a5a86' },
  custom: { label: 'אירוע', bg: '#e7edf5', c: '#3a5a86' },
};

export function evLabel(ev: OrgEvent): string {
  return (ev.type === 'custom' && ev.customType) || EV_META[ev.type].label;
}


/** האם החוג פעיל בתאריך נתון (טווח start–end). */
export function courseActiveOn(c: Course, iso: string): boolean {
  return (!c.start || iso >= c.start) && (!c.end || iso <= c.end);
}

export interface TodaySession {
  course: Course;
  session: CourseSession;
}

/** מפגשי החוגים של היום — לפי יום בשבוע, רק חוגים בטווח פעילות. */
export function todaySessions(db: Db, now: Date): TodaySession[] {
  const iso = isoOf(now);
  const dow = now.getDay();
  const out: TodaySession[] = [];
  for (const c of db.courses) {
    if (!courseActiveOn(c, iso)) continue;
    for (const ss of sessionsOf(c)) if (ss.day === dow) out.push({ course: c, session: ss });
  }
  return out.sort((a, b) => (a.session.time || '').localeCompare(b.session.time || ''));
}

const hpCache = new Map<string, HebParts>();
function hebPartsOfIso(iso: string): HebParts {
  let hp = hpCache.get(iso);
  if (!hp) {
    hp = hebParts(new Date(iso + 'T12:00:00'));
    hpCache.set(iso, hp);
  }
  return hp;
}

/**
 * אירועי הארגון החלים בתאריך נתון (לא כולל אירועים שסומנו "טופל"):
 * התאמה לועזית ישירה, או חזרה שנתית לפי התאריך העברי (אזכרה/נישואים/הולדת).
 */
export function eventsOnDate(db: Db, d: Date): OrgEvent[] {
  const iso = isoOf(d);
  const hp = hebParts(d);
  const out: OrgEvent[] = [];
  for (const ev of db.events) {
    if (ev.done || !ev.date) continue;
    let hit = ev.date === iso;
    if (!hit && HEBREW_RECURRING.has(ev.type) && iso > ev.date) {
      hit = hebAnnualEq(hebPartsOfIso(ev.date), hp);
    }
    if (hit) out.push(ev);
  }
  return out.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

export interface BirthdayHit {
  member: MemberWithFamily;
  age: number;
}

/** ימי הולדת (לועזיים) של בני משפחה בתאריך נתון — כמו במקור. */
export function birthdaysOn(db: Db, d: Date): BirthdayHit[] {
  const key = isoOf(d).slice(5);
  return allMembers(db)
    .filter((m) => m.birth && m.birth.slice(5) === key)
    .map((m) => ({ member: m, age: d.getFullYear() - +m.birth.slice(0, 4) }));
}

export interface HomeStats {
  famTotal: number;
  famActive: number;
  famPending: number;
  famInactive: number;
  membersTotal: number;
  childrenTotal: number;
  activeCourses: number;
  activeEnrollments: number;
  enrollTotal: number;
  eventsToday: number;
  eventsWeek: number;
  donIls: number;
  donUsd: number;
  supportersTotal: number;
}

export function homeStats(db: Db, now: Date): HomeStats {
  const todayIso = isoOf(now);
  const members = allMembers(db);
  const weekIds = new Set<string>();
  let eventsToday = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const evs = eventsOnDate(db, d);
    if (i === 0) eventsToday = evs.length;
    for (const ev of evs) weekIds.add(ev.id);
  }
  let donIls = 0;
  let donUsd = 0;
  for (const sp of db.supporters) {
    for (const dn of sp.donations) {
      if (dn.cur === '$') donUsd += dn.amount;
      else donIls += dn.amount;
    }
  }
  return {
    famTotal: db.families.length,
    famActive: db.families.filter((f) => f.status === 'active').length,
    famPending: db.families.filter((f) => f.status === 'pending').length,
    famInactive: db.families.filter((f) => f.status === 'inactive').length,
    membersTotal: members.length,
    childrenTotal: members.filter((m) => !m.isParent).length,
    activeCourses: db.courses.filter((c) => courseActiveOn(c, todayIso)).length,
    activeEnrollments: db.enrollments.filter((e) => e.status === 'active').length,
    enrollTotal: db.enrollments.length,
    eventsToday,
    eventsWeek: weekIds.size,
    donIls,
    donUsd,
    supportersTotal: db.supporters.length,
  };
}

/** משפחות אחרונות — לפי תאריך יצירה יורד. */
export function recentFamilies(db: Db, n = 5): Family[] {
  return db.families
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, n);
}

export type AttentionNav =
  | { kind: 'course'; id: string }
  | { kind: 'family'; id: string }
  | { kind: 'supporters' }
  | { kind: 'calendar' };

/** חומרת פריט טיפול — קריטי מוצג לפני אזהרה. */
export type AttentionSev = 'crit' | 'warn';

export interface AttentionItem {
  key: string;
  tag: string;
  tagBg: string;
  tagC: string;
  title: string;
  sev: AttentionSev;
  nav: AttentionNav;
}

/** הפרש ימים בין שני תאריכי ISO (חיובי כאשר toIso מאוחר יותר). */
function daysBetween(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86_400_000,
  );
}


/**
 * פאנל "דורש טיפול":
 * אירועים בעדיפות אדומה שלא טופלו · חוגים בחדר כבוי ·
 * שיבוצים שעבר מועד התשלום שלהם · כרטיסיות שכמעט נגמרו ·
 * משפחות הממתינות לאישור · תורמים שעבר יעד הקשר שלהם ·
 * ספח ת"ז חסר · מדד אמינות אדום · חוגים שכמעט מלאים.
 * הפריטים ממוינים כך שהקריטיים מוצגים ראשונים.
 *
 * modules — חוזה המודולים (types/config.ts): פריטים של מודול כבוי מושמטים
 * (חוגים: room/debt/punch/fill · תורמים: supnext) בלי לגעת בנתונים עצמם.
 */
export function attentionItems(db: Db, now: Date, modules: ModulesMap): AttentionItem[] {
  const on = (m: ModuleKey) => modules[m] !== false;
  const todayIso = isoOf(now);
  const members = allMembers(db);
  const out: AttentionItem[] = [];

  // אירועים דחופים (עדיפות אדומה, לא טופלו)
  const reds = db.events.filter((e) => e.priority === 'red' && !e.done && e.date);
  reds.sort((a, b) => a.date.localeCompare(b.date));
  for (const ev of reds) {
    const [y, m, d] = ev.date.split('-').map(Number);
    const diff = Math.round(
      (new Date(y, m - 1, d).getTime() -
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
        86_400_000,
    );
    const when =
      diff === 0
        ? 'היום'
        : diff > 0 && diff <= 6
          ? 'יום ' + DAY_NAMES[new Date(y, m - 1, d).getDay()]
          : fmtD(ev.date);
    out.push({
      key: 'urgent:' + ev.id,
      tag: 'דחוף',
      tagBg: '#fdeaea',
      tagC: '#b91c1c',
      title: ev.title + ' — ' + when + (ev.time ? ' ' + ev.time : ''),
      sev: 'crit',
      nav: { kind: 'calendar' },
    });
  }

  // חוגים המשויכים לחדר כבוי (מודול חוגים בלבד)
  for (const c of on('courses') ? db.courses : []) {
    const room = db.rooms.find((r) => r.id === c.roomId);
    if (room && !room.active) {
      out.push({
        key: 'room:' + c.id,
        tag: 'חדר',
        tagBg: '#fdeaea',
        tagC: '#b91c1c',
        title: `"${c.name}" משויך לחדר כבוי (${room.name}) — הפעילו את החדר או העבירו את החוג`,
        sev: 'crit',
        nav: { kind: 'course', id: c.id },
      });
    }
  }

  // שיבוצים עם יתרת תשלום שעבר מועדה (שיבוצים = נתוני מודול החוגים)
  for (const e of on('courses') ? db.enrollments : []) {
    const bal = payBal(e); // מקור-אמת משותף (הגנת NaN + max(0)) — עקבי עם מסך הקורסים
    if (bal > 0 && e.dueDate && e.dueDate <= todayIso) {
      const m = members.find((x) => x.id === e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      out.push({
        key: 'debt:' + e.id,
        tag: 'תשלום',
        tagBg: '#fdeee0',
        tagC: '#b45309',
        title:
          `יתרת ₪${bal} — ${m?.first ?? ''} (${m?.famName ?? ''}) · ${c?.name ?? ''}` +
          ` · עבר המועד ${fmtD(e.dueDate)}`,
        sev: 'warn',
        nav: m ? { kind: 'family', id: m.famId } : { kind: 'calendar' },
      });
    }
  }

  // כרטיסיות שכמעט נוצלו (נותר ניקוב אחד או פחות) — מודול חוגים בלבד
  const low = (on('courses') ? db.enrollments : [])
    .filter(
      (e) => e.plan === 'punch' && e.status === 'active' && e.purchased > 0 && e.used >= e.purchased - 1,
    )
    .map((e) => ({ e, rem: e.purchased - e.used }))
    .sort((a, b) => a.rem - b.rem);
  for (const { e, rem } of low) {
    const m = members.find((x) => x.id === e.memberId);
    const c = db.courses.find((x) => x.id === e.courseId);
    out.push({
      key: 'punch:' + e.id,
      tag: 'יתרה',
      tagBg: '#efe7f3',
      tagC: '#7c3aed',
      title:
        `${m?.first ?? ''} (${m?.famName ?? ''}) — ` +
        (rem <= 0 ? 'הכרטיסייה נגמרה' : 'נשאר ניקוב אחד') +
        ` ב${c?.name ?? ''}`,
      sev: 'warn',
      nav: m ? { kind: 'family', id: m.famId } : { kind: 'calendar' },
    });
  }

  // משפחות הממתינות לאישור — פריט מצטבר אחד עם ותק ההמתנה הארוך ביותר
  const pending = db.families.filter((f) => f.status === 'pending' && f.createdAt);
  if (pending.length) {
    const oldest = pending.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));
    const wait = Math.max(0, daysBetween(oldest.createdAt, todayIso));
    out.push({
      key: 'pending:families',
      tag: 'אישור',
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title:
        pending.length === 1
          ? `משפחה אחת ממתינה לאישור · ${wait} ימים`
          : `${pending.length} משפחות ממתינות לאישור · הוותיקה ממתינה ${wait} ימים`,
      sev: 'warn',
      nav: { kind: 'family', id: oldest.id },
    });
  }

  // תורמים שעבר יעד הקשר שלהם — פריט לכל תורם (עד 3), אחר כך צבירה — מודול תורמים בלבד
  const lateSup = (on('supporters') ? db.supporters : [])
    .filter((sp) => sp.nextDate && sp.nextDate < todayIso)
    .map((sp) => ({ sp, late: daysBetween(sp.nextDate, todayIso) }))
    .sort((a, b) => b.late - a.late);
  for (const { sp, late } of lateSup.slice(0, 3)) {
    const crit = late > 7;
    out.push({
      key: 'supnext:' + sp.id,
      tag: 'תורם',
      tagBg: crit ? '#fdeaea' : '#fdf1d4',
      tagC: crit ? '#b91c1c' : '#9a6414',
      title: `יעד קשר — ${sp.name} · באיחור ${late} ימים`,
      sev: crit ? 'crit' : 'warn',
      nav: { kind: 'supporters' },
    });
  }
  if (lateSup.length > 3) {
    out.push({
      key: 'supnext:more',
      tag: 'תורם',
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title: `+${lateSup.length - 3} תורמים נוספים עברו יעד קשר`,
      sev: 'warn',
      nav: { kind: 'supporters' },
    });
  }

  // ספח ת"ז חסר — משפחות פעילות ללא ספח מלא, פריט מצטבר
  const noSefach = db.families.filter((f) => f.status === 'active' && f.fullSefach === false);
  if (noSefach.length) {
    out.push({
      key: 'sefach:families',
      tag: 'מסמך',
      tagBg: '#e7edf5',
      tagC: '#3a5a86',
      title:
        noSefach.length === 1
          ? 'משפחה אחת ללא ספח ת"ז מלא'
          : `${noSefach.length} משפחות ללא ספח ת"ז מלא`,
      sev: 'warn',
      nav: { kind: 'family', id: noSefach[0].id },
    });
  }

  // מדד אמינות אדום — ניקוד מתחת ל-300, פריט מצטבר
  const redCred = db.families.filter((f) => (f.cred?.score ?? 700) < 300);
  if (redCred.length) {
    out.push({
      key: 'redcred:families',
      tag: 'סיכון',
      tagBg: '#fdeaea',
      tagC: '#b91c1c',
      title:
        redCred.length === 1
          ? 'משפחה אחת במדד אמינות אדום'
          : `${redCred.length} משפחות במדד אמינות אדום`,
      sev: 'crit',
      nav: { kind: 'family', id: redCred[0].id },
    });
  }

  // חוגים שכמעט מלאים (80% ומעלה מהמקומות) — פריט לכל חוג (עד 3), אחר כך צבירה — מודול חוגים בלבד
  const filling = (on('courses') ? db.courses : [])
    .filter((c) => c.maxStudents > 0)
    .map((c) => ({
      c,
      n: db.enrollments.filter((e) => e.courseId === c.id && e.status === 'active').length,
    }))
    .filter(({ c, n }) => n >= c.maxStudents * 0.8)
    .sort((a, b) => b.n / b.c.maxStudents - a.n / a.c.maxStudents);
  for (const { c, n } of filling.slice(0, 3)) {
    const full = n >= c.maxStudents;
    out.push({
      key: 'fill:' + c.id,
      tag: full ? 'מלא' : 'מתמלא',
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title: `חוג ${c.name} — ${n}/${c.maxStudents}` + (full ? ' · מלא!' : ''),
      sev: 'warn',
      nav: { kind: 'course', id: c.id },
    });
  }
  if (filling.length > 3) {
    out.push({
      key: 'fill:more',
      tag: 'מתמלא',
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title: `+${filling.length - 3} חוגים נוספים כמעט מלאים`,
      sev: 'warn',
      nav: { kind: 'course', id: filling[3].c.id },
    });
  }

  // קריטי קודם — מיון יציב שומר על הסדר הפנימי בכל קבוצה
  return out.sort((a, b) => (a.sev === b.sev ? 0 : a.sev === 'crit' ? -1 : 1));
}

/** תאריך ISO מקומי במרחק ימים נתון מ-now. */
function isoAddDays(now: Date, days: number): string {
  return isoOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days));
}

/** שורה בתקציר הבוקר — טקסט + יעד ניווט. */
export interface DigestLine {
  key: string;
  text: string;
  /** שורת "שבוע דחוף" — מודגשת באדום בראש התקציר. */
  urgent?: boolean;
  nav: AttentionNav;
}

/**
 * "תקציר הבוקר" — עד 6 שורות קומפקטיות (פורט מהאב-טיפוס):
 * כרטיסיות שכמעט נגמרו · משפחות ממתינות · מפגשי היום ·
 * תזכורות טלפון פתוחות · אירועים מיוחדים השבוע · ימי הולדת היום.
 * כשיש פריטים קריטיים ב"דורש טיפול" — שורת "שבוע דחוף" נוספת בראש.
 * סימוני "טופל" (attnDone) מוחרגים מספירת הקריטיים.
 *
 * modules — חוזה המודולים: שורות של מודול כבוי מושמטות (חוגים: punch/today),
 * וספירת הקריטיים עוברת דרך attentionItems עם אותה מפה — כך אין אי-התאמה.
 */
export function digestLines(db: Db, now: Date, modules: ModulesMap): DigestLine[] {
  const on = (m: ModuleKey) => modules[m] !== false;
  const members = allMembers(db);
  const out: DigestLine[] = [];

  // שבוע דחוף — פריטים קריטיים שטרם סומנו כטופלו
  const done = db.attnDone ?? {};
  const crit = attentionItems(db, now, modules).filter((a) => a.sev === 'crit' && !done[a.key]);
  if (crit.length) {
    out.push({
      key: 'urgent',
      urgent: true,
      text:
        crit.length === 1
          ? '⚠ שבוע דחוף — פריט קריטי אחד דורש טיפול'
          : `⚠ שבוע דחוף — ${crit.length} פריטים קריטיים דורשים טיפול`,
      nav: crit[0].nav,
    });
  }

  // כרטיסייה שכמעט נגמרה — כדאי להציע חידוש (מודול חוגים בלבד)
  const low = (on('courses') ? db.enrollments : [])
    .filter(
      (e) => e.plan === 'punch' && e.status === 'active' && e.purchased > 0 && e.used >= e.purchased - 1,
    )
    .map((e) => ({ e, rem: e.purchased - e.used }))
    .sort((a, b) => a.rem - b.rem);
  if (low.length) {
    const { e, rem } = low[0];
    const m = members.find((x) => x.id === e.memberId);
    const c = db.courses.find((x) => x.id === e.courseId);
    const what =
      rem <= 0 ? 'נגמרה הכרטיסייה' : rem === 1 ? 'נשאר ניקוב אחד' : `נשארו ${rem} ניקובים`;
    out.push({
      key: 'punch',
      text:
        `ל${m?.first ?? ''} ${m?.famName ?? ''} ${what} ב${c?.name ?? ''} — כדאי להציע חידוש` +
        (low.length > 1 ? ` (+${low.length - 1} נוספים)` : ''),
      nav: m ? { kind: 'family', id: m.famId } : { kind: 'calendar' },
    });
  }

  // משפחות ממתינות לאישור
  const pend = db.families.filter((f) => f.status === 'pending');
  if (pend.length) {
    out.push({
      key: 'pending',
      text:
        pend.length === 1
          ? `משפחה אחת ממתינה לאישור: ${pend[0].name}`
          : `${pend.length} משפחות ממתינות לאישור: ${pend.map((f) => f.name).slice(0, 3).join(', ')}`,
      nav: { kind: 'family', id: pend[0].id },
    });
  }

  // מפגשי החוגים של היום (מודול חוגים בלבד)
  const sessions = on('courses') ? todaySessions(db, now) : [];
  if (sessions.length) {
    out.push({
      key: 'today',
      text:
        'היום: ' +
        sessions
          .map((ts) => ts.course.name + (ts.session.time ? ' ב-' + ts.session.time : ''))
          .join(' · '),
      nav: { kind: 'course', id: sessions[0].course.id },
    });
  }

  // תזכורות טלפון פתוחות (עד מחר)
  const calls = db.events.filter(
    (e) => e.type === 'call' && !e.done && !!e.date && e.date <= isoAddDays(now, 1),
  );
  if (calls.length) {
    out.push({
      key: 'calls',
      text:
        'תזכורות טלפון פתוחות: ' +
        calls[0].title +
        (calls.length > 1 ? ` (+${calls.length - 1} נוספות)` : ''),
      nav: { kind: 'calendar' },
    });
  }

  // אירועים מיוחדים השבוע (עד 2)
  const SPECIAL: ReadonlySet<EventType> = new Set([
    'wedding',
    'memorial',
    'anniversary',
    'bday',
  ] as EventType[]);
  const specials: string[] = [];
  for (let i = 0; i < 7 && specials.length < 2; i++) {
    const dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    for (const ev of eventsOnDate(db, dd)) {
      if (SPECIAL.has(ev.type) && specials.length < 2) {
        specials.push(`${evLabel(ev)} ביום ${DAY_NAMES[dd.getDay()]}: ${ev.title}`);
      }
    }
  }
  if (specials.length) {
    out.push({ key: 'specials', text: 'מיוחדים השבוע — ' + specials.join(' · '), nav: { kind: 'calendar' } });
  }

  // ימי הולדת היום
  const bd = birthdaysOn(db, now);
  if (bd.length) {
    out.push({
      key: 'bday',
      text:
        `יום הולדת היום ל${bd[0].member.first} (משפחת ${bd[0].member.famName})` +
        (bd.length > 1 ? ` +${bd.length - 1} נוספים` : ''),
      nav: { kind: 'family', id: bd[0].member.famId },
    });
  }

  if (!out.length) {
    out.push({ key: 'quiet', text: 'הכל מעודכן — אין משימות דחופות הבוקר', nav: { kind: 'calendar' } });
  }
  return out;
}

/* ── נגזרות חזותיות חדשות (מוקאפים) — כולן מנתונים אמיתיים בלבד ── */

/** מפתח חודש YYYY-MM במרחק delta חודשים מהעוגן. */
function monthKeyOf(anchor: Date, delta: number): string {
  const d = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * סדרה חודשית ל-months החודשים האחרונים (ישן→חדש, האחרון = החודש הנוכחי) —
 * לספארקליין בכרטיסי הנתונים. נקודות ללא תאריך תקין נזרקות; אין המצאת נתונים.
 */
export function monthlySeries(
  points: readonly { date: string; value: number }[],
  now: Date,
  months = 6,
): number[] {
  const idx = new Map<string, number>();
  for (let i = 0; i < months; i++) idx.set(monthKeyOf(now, i - (months - 1)), i);
  const out = new Array<number>(months).fill(0);
  for (const p of points) {
    const i = idx.get((p.date || '').slice(0, 7));
    if (i !== undefined) out[i] += p.value;
  }
  return out;
}

/** סכום תרומות השקל בחודש הנוכחי — לצ'יפ המגמה בכרטיס התרומות. */
export function monthDonationSum(db: Db, now: Date): number {
  const key = monthKeyOf(now, 0);
  let sum = 0;
  for (const sp of db.supporters) {
    for (const dn of sp.donations) if (dn.cur !== '$' && dn.date.startsWith(key)) sum += dn.amount;
  }
  return sum;
}

/** סיכום מדד האמינות הקהילתי — ממוצע (כמו בקיר ההשפעה) + ספירה לכל דרגה. */
export interface CredSummary {
  avg: number;
  /** ספירות לפי מפתח דרגה (titan/lion/pale/red) — reuse של tierOf ממודול המשפחות. */
  counts: Record<'titan' | 'lion' | 'pale' | 'red', number>;
  total: number;
}

export function credSummary(db: Db, tierKeyOf: (score: number) => 'titan' | 'lion' | 'pale' | 'red'): CredSummary {
  const counts = { titan: 0, lion: 0, pale: 0, red: 0 };
  let sum = 0;
  for (const f of db.families) {
    const score = f.cred?.score ?? 700;
    sum += score;
    counts[tierKeyOf(score)]++;
  }
  const total = db.families.length;
  return { avg: total > 0 ? Math.round(sum / total) : 0, counts, total };
}

/** תורם עם יעד קשר שהגיע/עבר — לווידג'ט "יעדי קשר". */
export interface DueContact {
  id: string;
  name: string;
  date: string;
  phone: string;
  /** ימי איחור (0 = היעד היום). */
  late: number;
}

/** יעדי קשר שהגיעו או עברו (nextDate ≤ היום), מהדחוף לפחות דחוף. */
export function dueContacts(db: Db, now: Date): DueContact[] {
  const todayIso = isoOf(now);
  return db.supporters
    .filter((sp) => sp.nextDate && sp.nextDate <= todayIso)
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      date: sp.nextDate,
      phone: sp.phone,
      late: Math.max(0, daysBetween(sp.nextDate, todayIso)),
    }))
    .sort((a, b) => b.late - a.late);
}

/** כרטיסייה שנותרו בה מעט ניקובים — לווידג'ט "מלאי כרטיסיות". */
export interface PunchLowItem {
  key: string;
  member: string;
  famName: string;
  course: string;
  left: number;
  total: number;
  nav: AttentionNav;
}

/** כרטיסיות פעילות עם ≤ maxLeft ניקובים שנותרו, מהנמוך לגבוה. */
export function punchLow(db: Db, maxLeft = 2): PunchLowItem[] {
  const members = allMembers(db);
  return db.enrollments
    .filter(
      (e) =>
        e.plan === 'punch' && e.status === 'active' && e.purchased > 0 && e.purchased - e.used <= maxLeft,
    )
    .map((e) => {
      const m = members.find((x) => x.id === e.memberId);
      return {
        key: e.id,
        member: m?.first ?? '',
        famName: m?.famName ?? '',
        course: db.courses.find((c) => c.id === e.courseId)?.name ?? '',
        left: Math.max(0, e.purchased - e.used),
        total: e.purchased,
        nav: (m ? { kind: 'family', id: m.famId } : { kind: 'calendar' }) as AttentionNav,
      };
    })
    .sort((a, b) => a.left - b.left);
}

/** פריט בקרוסלת האירועים הקרובים. */
export interface CarouselItem {
  key: string;
  icon: string;
  title: string;
  sub: string;
  cta: string;
  nav: AttentionNav;
}

/** אייקונים לקרוסלה — אזכרה 🕯️, יום הולדת 🎂, שאר השמחות 🎉. */
const CAR_ICONS: Partial<Record<EventType, string>> = { memorial: '🕯️', bday: '🎂' };

/**
 * קרוסלת 14 הימים הקרובים — ימי הולדת של בני משפחה (חזרה שנתית כמו
 * birthdaysOn) ואירועים מיוחדים (כולל חזרה עברית דרך eventsOnDate).
 * עד 10 פריטים, בסדר כרונולוגי.
 */
export function carouselItems(db: Db, now: Date, modules: ModulesMap = {}): CarouselItem[] {
  const on = (m: ModuleKey) => modules[m] !== false;
  const SPECIAL: ReadonlySet<EventType> = new Set([
    'wedding',
    'memorial',
    'anniversary',
    'bday',
    'org',
    'custom',
  ] as EventType[]);
  const out: CarouselItem[] = [];
  for (let i = 0; i < 14 && out.length < 10; i++) {
    const dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const when = i === 0 ? 'היום!' : i === 1 ? 'מחר' : `בעוד ${i} ימים`;
    for (const b of on('families') ? birthdaysOn(db, dd) : []) {
      out.push({
        key: `bd:${b.member.id}:${i}`,
        icon: '🎂',
        title: `יום הולדת — ${b.member.first} (${b.age})`,
        sub: `משפחת ${b.member.famName} · ${when}`,
        cta: 'לכרטיס המשפחה ←',
        nav: { kind: 'family', id: b.member.famId },
      });
    }
    for (const ev of on('calendar') ? eventsOnDate(db, dd) : []) {
      if (!SPECIAL.has(ev.type)) continue;
      out.push({
        key: `ev:${ev.id}:${i}`,
        icon: CAR_ICONS[ev.type] ?? '🎉',
        title: ev.title,
        sub: `${evLabel(ev)} · ${when}` + (ev.time ? ' · ' + ev.time : ''),
        cta: 'ללוח השנה ←',
        nav: { kind: 'calendar' },
      });
    }
  }
  return out.slice(0, 10);
}
