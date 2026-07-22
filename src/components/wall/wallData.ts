/**
 * קיר ההשפעה — חישובי נתונים טהורים (ללא React).
 * כל המספרים נגזרים מה-Db האמיתי:
 *
 * · גויסו השנה — סכום כל התרומות בש"ח (₪ בלבד) בשנה הלועזית הנוכחית, מול db.orgGoal.
 * · משפחות — סטטוס 'active'; "+N השנה" לפי createdAt בשנה הנוכחית.
 * · ילדים בחוגים — בני משפחה ייחודיים עם שיבוץ פעיל.
 * · מפגשי חסד — אומדן: לכל חוג, שבועות שחלפו מתחילתו (עד היום/סיומו) × מספר מפגשים שבועיים.
 * · תורמים — מספר התורמים הרשומים; "+N השנה" לפי תרומה ראשונה השנה.
 * · התמדה — אחוז המשפחות בסטטוס פעיל מכלל המשפחות.
 * · מדד אמינות — ממוצע ציון האשראי המשפחתי (cred.score).
 * · ספר הזהב — צבירת תרומות ₪ לפי תורם בחודש הנוכחי; אין → נפילה לשנה, ואז לסה"כ המצטבר.
 * · פעימת הקהילה — 12 חודשים אחרונים, מדד משוקלל: שיבוץ×2 + תרומה×2 + תשלום×1.
 * · מיני-KPI היום — נוכחות משוערת (שיבוצים פעילים בחוגים של היום פחות חיסורים שנרשמו היום),
 *   מפגשי היום, גבייה היום (תשלומים), ימי הולדת עבריים היום.
 * · השבוע בלוח העברי — 7 הימים הבאים: חגים, אירועים (כולל חוזרים עבריים) ומפגשי חוגים.
 * · טיקר — משפחות חדשות, תרומות אחרונות, כרטיסיות שהושלמו וימי הולדת של היום (עד 8).
 */
import type { Db, EventType, Supporter } from '../../types/domain';
import { gem, gemYear, holidayOf } from '../../lib/hebrew';
import { eventOccursOn, evLabel, hpOf, isoOf, sessionsOf } from '../calendar/calLib';

export interface WallKpi {
  icon: string;
  value: string;
  label: string;
  badge?: string;
}

export interface WallPodiumRow {
  name: string;
  sub: string;
  amount: number;
}

export interface WallPodium {
  rows: WallPodiumRow[];
  othersCount: number;
  othersAmount: number;
  /** 'החודש' / 'השנה' / 'מאז ומעולם' — לפי היקף הנתונים שנמצא. */
  scopeLabel: string;
}

export interface WallPulse {
  /** 12 ערכים, מהישן (אינדקס 0) לחדש. */
  values: number[];
  startLabel: string;
  endLabel: string;
}

export interface WallMiniKpi {
  value: string;
  label: string;
}

export interface WallWeekRow {
  key: string;
  /** תאריך עברי קצר — "ו׳ אב". */
  hd: string;
  title: string;
  sub: string;
  emoji: string;
}

export interface WallData {
  raisedThisYear: number;
  goal: number;
  /** 0..1 — או null כשאין יעד (מציגים טבעת מלאה עם הסכום בלבד). */
  pct: number | null;
  /** "62% מיעד תשפ״ו · ₪500,000" / null כשאין יעד. */
  goalLine: string | null;
  kpisRight: WallKpi[];
  kpisLeft: WallKpi[];
  podium: WallPodium;
  pulse: WallPulse;
  miniKpis: WallMiniKpi[];
  week: WallWeekRow[];
  ticker: string[];
}

const fmtHebMonth = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const fmtHebYear = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });
const nfIls = new Intl.NumberFormat('he-IL');

/** ‎₪12,345 — עברית עם מפרידי אלפים. */
export function fmtIls(n: number): string {
  return '₪' + nfIls.format(Math.round(n));
}

interface DonRow {
  name: string;
  supporterId: string;
  date: string;
  amount: number;
}

/** כל תרומות השקל, שטוחות, עם שם התורם. */
function allIlsDonations(db: Db): DonRow[] {
  const out: DonRow[] = [];
  for (const s of db.supporters) {
    for (const d of s.donations) {
      if (d.cur !== '₪') continue;
      out.push({ name: s.name, supporterId: s.id, date: d.date, amount: d.amount });
    }
  }
  return out;
}

/** אומדן מפגשים מצטבר — שבועות שחלפו × מפגשים שבועיים, לכל חוג. */
function sessionsHeldEstimate(db: Db, todayIso: string): number {
  let total = 0;
  for (const c of db.courses) {
    if (!c.start || c.start > todayIso) continue;
    const endIso = c.end && c.end < todayIso ? c.end : todayIso;
    const days = (Date.parse(endIso) - Date.parse(c.start)) / 86_400_000;
    if (!Number.isFinite(days) || days < 0) continue;
    total += (Math.floor(days / 7) + 1) * sessionsOf(c).length;
  }
  return total;
}

/** ספר הזהב — top-3 לפי החודש, נפילה לשנה ואז לסה"כ מצטבר.
 *  (exported — ווידג'ט "ספר הזהב" במסך הבית משתמש באותה נוסחה בדיוק.) */
export function buildPodium(db: Db, monthKey: string, yearKey: string): WallPodium {
  const dons = allIlsDonations(db);
  const agg = (filter: (d: DonRow) => boolean) => {
    const m = new Map<string, { name: string; amount: number; count: number }>();
    for (const d of dons) {
      if (!filter(d)) continue;
      const cur = m.get(d.supporterId) ?? { name: d.name, amount: 0, count: 0 };
      cur.amount += d.amount;
      cur.count++;
      m.set(d.supporterId, cur);
    }
    return [...m.values()].filter((x) => x.amount > 0);
  };

  let rows = agg((d) => d.date.startsWith(monthKey));
  let scopeLabel = 'החודש';
  if (!rows.length) {
    rows = agg((d) => d.date.startsWith(yearKey));
    scopeLabel = 'השנה';
  }
  if (!rows.length) {
    rows = db.supporters
      .filter((s: Supporter) => s.ils > 0)
      .map((s) => ({ name: s.name, amount: s.ils, count: s.count }));
    scopeLabel = 'מאז ומעולם';
  }
  rows.sort((a, b) => b.amount - a.amount);
  const top = rows.slice(0, 3).map((r) => ({
    name: r.name,
    sub: r.count === 1 ? 'תרומה אחת' : `${r.count} תרומות`,
    amount: r.amount,
  }));
  const rest = rows.slice(3);
  return {
    rows: top,
    othersCount: rest.length,
    othersAmount: rest.reduce((s, r) => s + r.amount, 0),
    scopeLabel,
  };
}

/** מפתח חודש YYYY-MM במרחק delta חודשים מהעוגן. */
function monthKeyAt(anchor: Date, delta: number): string {
  const d = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** תווית עברית לחודש — "אב תשפ״ו" (לפי אמצע החודש הלועזי). */
function hebMonthLabel(anchor: Date, delta: number): string {
  const d = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 15);
  return `${fmtHebMonth.format(d)} ${gemYear(fmtHebYear.format(d))}`;
}

/** פעימת הקהילה — מדד חודשי משוקלל: שיבוץ×2 + תרומה×2 + תשלום×1. */
function buildPulse(db: Db, now: Date): WallPulse {
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) keys.push(monthKeyAt(now, -i));
  const idx = new Map(keys.map((k, i) => [k, i]));
  const values = new Array<number>(12).fill(0);
  const add = (iso: string, w: number) => {
    const i = idx.get(iso.slice(0, 7));
    if (i !== undefined) values[i] += w;
  };
  for (const e of db.enrollments) {
    if (e.enrolledAt) add(e.enrolledAt, 2);
    for (const p of e.payments) add(p.date, 1);
  }
  for (const s of db.supporters) for (const d of s.donations) add(d.date, 2);
  return { values, startLabel: hebMonthLabel(now, -11), endLabel: hebMonthLabel(now, 0) };
}

/** אמוג'י לסוג אירוע — לפאנל "השבוע בלוח העברי". */
const EV_EMOJI: Record<EventType, string> = {
  org: '🎉',
  reminder: '⏰',
  call: '📞',
  wedding: '💍',
  memorial: '🕯️',
  anniversary: '💍',
  bday: '🎂',
  custom: '📌',
};

function holidayEmoji(name: string): string {
  return name.includes('צום') || name === 'תשעה באב' || name === 'יום כיפור' ? '📿' : '🎉';
}

/** 7 הימים הבאים — חגים, אירועים (כולל חזרה עברית) ומפגשי חוגים. עד 7 שורות.
 *  (exported — ווידג'ט "הלוח העברי" במסך הבית משתמש באותה נגזרת;
 *  שורות מפגשי חוגים מזוהות לפי key המסתיים ב-'-crs' לסינון כשמודול החוגים כבוי.) */
export function buildWeek(db: Db, now: Date): WallWeekRow[] {
  const out: WallWeekRow[] = [];
  for (let i = 0; i < 7 && out.length < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const iso = isoOf(d);
    const hp = hpOf(iso, d);
    const hd = `${gem(hp.day)} ${fmtHebMonth.format(d)}`;

    const hol = holidayOf(d);
    if (hol) {
      out.push({
        key: iso + '-hol',
        hd,
        title: hol,
        sub: 'חג ומועד בלוח העברי',
        emoji: holidayEmoji(hol),
      });
    }

    for (const ev of db.events) {
      if (out.length >= 7) break;
      if (ev.done || !eventOccursOn(ev, iso, hp)) continue;
      const fam = ev.famId ? db.families.find((f) => f.id === ev.famId) : undefined;
      out.push({
        key: iso + '-ev-' + ev.id,
        hd,
        title: ev.title,
        sub: [evLabel(ev), ev.time, fam && 'משפחת ' + fam.name].filter(Boolean).join(' · '),
        emoji: EV_EMOJI[ev.type],
      });
    }

    if (out.length >= 7 || hol) continue;
    const dow = d.getDay();
    const names: string[] = [];
    let n = 0;
    for (const c of db.courses) {
      if (c.start && iso < c.start) continue;
      if (c.end && iso > c.end) continue;
      const k = sessionsOf(c).filter((ss) => ss.day === dow).length;
      if (k > 0) {
        n += k;
        names.push(c.name);
      }
    }
    if (n > 0) {
      out.push({
        key: iso + '-crs',
        hd,
        title: (i === 0 ? 'היום · ' : '') + (n === 1 ? 'מפגש חוג אחד' : `${n} מפגשי חוגים`),
        sub: names.slice(0, 3).join(' · '),
        emoji: i === 0 ? '☀️' : '🎨',
      });
    }
  }
  return out;
}

/** בני משפחה שיום הולדתם העברי חל היום. */
function birthdaysToday(db: Db, todayIso: string): { first: string; age: number }[] {
  const hp = hpOf(todayIso);
  const out: { first: string; age: number }[] = [];
  for (const f of db.families) {
    for (const m of f.members) {
      if (!m.birth || todayIso <= m.birth) continue;
      const bh = hpOf(m.birth);
      if (bh.day === hp.day && bh.month === hp.month) out.push({ first: m.first, age: hp.year - bh.year });
    }
  }
  return out;
}

/** בניית כל נתוני הקיר מה-Db — פונקציה טהורה (now ניתן להזרקה בבדיקות). */
export function buildWallData(db: Db, now = new Date()): WallData {
  const todayIso = isoOf(now);
  const yearKey = todayIso.slice(0, 4);
  const monthKey = todayIso.slice(0, 7);
  const dons = allIlsDonations(db);

  /* --- טבעת הזהב --- */
  const raisedThisYear = dons.reduce((s, d) => s + (d.date.startsWith(yearKey) ? d.amount : 0), 0);
  const goal = db.orgGoal > 0 ? db.orgGoal : 0;
  const pct = goal > 0 ? Math.min(1, raisedThisYear / goal) : null;
  const hebYearGem = gemYear(fmtHebYear.format(now));
  const goalLine =
    pct !== null ? `${Math.round(pct * 100)}% מיעד ${hebYearGem} · ${fmtIls(goal)}` : null;

  /* --- שישה KPI צד --- */
  const famTotal = db.families.length;
  const famActive = db.families.filter((f) => f.status === 'active').length;
  const famNew = db.families.filter((f) => f.createdAt.startsWith(yearKey)).length;
  const activeKids = new Set(db.enrollments.filter((e) => e.status === 'active').map((e) => e.memberId));
  const newEnrolls = db.enrollments.filter((e) => e.enrolledAt.startsWith(yearKey)).length;
  const sessionsHeld = sessionsHeldEstimate(db, todayIso);
  const newSupporters = db.supporters.filter((s) => s.first && s.first.startsWith(yearKey)).length;
  const retention = famTotal > 0 ? Math.round((famActive / famTotal) * 100) : 0;
  const credAvg =
    famTotal > 0
      ? Math.round(db.families.reduce((s, f) => s + (f.cred?.score ?? 700), 0) / famTotal)
      : 0;

  const kpisRight: WallKpi[] = [
    {
      icon: '👨‍👩‍👧‍👦',
      value: nfIls.format(famActive),
      label: 'משפחות בליווי קבוע',
      badge: famNew > 0 ? `‎+${famNew} השנה` : undefined,
    },
    {
      icon: '🎨',
      value: nfIls.format(activeKids.size),
      label: 'ילדים וילדות בחוגים',
      badge: newEnrolls > 0 ? `‎+${newEnrolls} שיבוצים השנה` : undefined,
    },
    {
      icon: '🕯️',
      value: nfIls.format(sessionsHeld),
      label: 'מפגשי חסד שהתקיימו',
      badge: sessionsHeld > 0 ? 'אומדן מצטבר' : undefined,
    },
  ];
  const kpisLeft: WallKpi[] = [
    {
      icon: '💛',
      value: nfIls.format(db.supporters.length),
      label: 'תורמים שותפים',
      badge: newSupporters > 0 ? `‎+${newSupporters} השנה` : undefined,
    },
    {
      icon: '🏠',
      value: retention + '%',
      label: 'מהמשפחות בליווי פעיל',
      badge: retention >= 90 ? '▲' : undefined,
    },
    {
      icon: '🤝',
      value: nfIls.format(credAvg),
      label: 'מדד אמינות קהילתי',
      badge: credAvg >= 700 ? '▲' : undefined,
    },
  ];

  /* --- מיני-KPI של היום --- */
  const dow = now.getDay();
  const holToday = holidayOf(now);
  const coursesToday = holToday
    ? []
    : db.courses.filter(
        (c) =>
          (!c.start || todayIso >= c.start) &&
          (!c.end || todayIso <= c.end) &&
          sessionsOf(c).some((ss) => ss.day === dow),
      );
  const courseIdsToday = new Set(coursesToday.map((c) => c.id));
  let arrived = 0;
  let collectedToday = 0;
  for (const e of db.enrollments) {
    if (e.status === 'active' && courseIdsToday.has(e.courseId)) {
      arrived++;
      if (e.absences.some((a) => a.date === todayIso)) arrived--;
    }
    for (const p of e.payments) if (p.date === todayIso) collectedToday += p.amount;
  }
  const sessionsToday = holToday
    ? 0
    : coursesToday.reduce((s, c) => s + sessionsOf(c).filter((ss) => ss.day === dow).length, 0);
  const bdays = birthdaysToday(db, todayIso);
  const miniKpis: WallMiniKpi[] = [
    { value: nfIls.format(arrived), label: 'ילדים בחוגי היום' },
    { value: nfIls.format(sessionsToday), label: 'מפגשים היום' },
    { value: fmtIls(collectedToday), label: 'גבייה היום' },
    { value: nfIls.format(bdays.length), label: 'ימי הולדת 🎂' },
  ];

  /* --- טיקר בשורות --- */
  const ticker: string[] = [];
  const famsByDate = [...db.families].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  for (const f of famsByDate.slice(0, 2)) ticker.push(`🎉 משפחת ${f.name} הצטרפה לקהילה`);
  const donsByDate = [...dons].sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const d of donsByDate.slice(0, 3)) ticker.push(`💛 תרומה חדשה: ${fmtIls(d.amount)} — ${d.name}`);
  const memberName = (id: string) => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === id);
      if (m) return m.first;
    }
    return '';
  };
  let punchDone = 0;
  for (const e of db.enrollments) {
    if (punchDone >= 2) break;
    if (e.plan !== 'punch' || e.purchased <= 0 || e.used < e.purchased) continue;
    const name = memberName(e.memberId);
    const c = db.courses.find((x) => x.id === e.courseId);
    if (!name || !c) continue;
    ticker.push(`🎟️ ${name} השלימ/ה כרטיסייה ב${c.name} — כל הכבוד!`);
    punchDone++;
  }
  for (const b of bdays.slice(0, 2)) ticker.push(`🎂 מזל טוב ל${b.first} — ${b.age} היום!`);

  return {
    raisedThisYear,
    goal,
    pct,
    goalLine,
    kpisRight,
    kpisLeft,
    podium: buildPodium(db, monthKey, yearKey),
    pulse: buildPulse(db, now),
    miniKpis,
    week: buildWeek(db, now),
    ticker: ticker.slice(0, 8),
  };
}
