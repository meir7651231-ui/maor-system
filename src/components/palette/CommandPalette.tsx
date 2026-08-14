/**
 * פלטת פקודות (Ctrl+K) — חיפוש מהיר בכל המערכת:
 * מסכים, משפחות, בני משפחה, חוגים, מורים, תורמים, אירועים, מסמכים ופעולות.
 * בנוסף: חיפוש שיבוץ לפי מזהה (e123), רשימת "כרטיסיות מסתיימות" עם ניקוב
 * ישיר כשאין שאילתה, והצעות "אולי התכוונת" כשאין תוצאות.
 *
 * App מרנדר את הרכיב רק כאשר paletteOpen=true; סגירה דרך setPalette(false).
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { allMembers, useApp, type View } from '../../store/useApp';
import { featureOn, moduleOn, termOf } from '../../lib/config';
import { supporterVisibleForDesignations } from '../supporters/lib';
import { levenshtein, smartFilter } from '../../lib/search';
import { normSearch } from '../../lib/validate';
import { DEFAULT_LOCK_ZONES } from '../../lib/lock';
import { groupPaletteResults } from '../../lib/paletteGroups';
import { todaySessions } from '../home/homeData';
import { beneficiaryLabel } from '../shop/lib';
import { exportFamiliesCsv } from '../settings/ExportSection';

/** פריט בר-הפעלה בפלטה: אייקון + כותרת + שורת משנה + פעולה. */
interface Cmd {
  key: string;
  icon: string;
  title: string;
  sub: string;
  /** מונחי חיפוש מנורמלים (normSearch) — מחרוזות שלמות + מילים בודדות. */
  terms: string[];
  run: () => void;
  /** כותרת קבוצה — מוצגת מעל הפריט הזה (הראשון בקבוצה). */
  section?: string;
  /** כפתור פעולה משני בתוך השורה (עכבר בלבד; Enter מפעיל את run). */
  inline?: { label: string; run: () => void };
}

/** פקודות ניווט — זהות לתפריט הראשי ב-App (משוכפל כאן כי NAV אינו מיוצא). */
const NAV_CMDS: { view: View; icon: string; label: string }[] = [
  { view: 'home', icon: '🏠', label: 'בית' },
  { view: 'families', icon: '👨‍👩‍👧‍👦', label: 'משפחות' },
  { view: 'courses', icon: '🎨', label: 'חוגים' },
  { view: 'calendar', icon: '📅', label: 'לוח שנה' },
  { view: 'diary', icon: '📖', label: 'יומן חדרים' },
  { view: 'supporters', icon: '💛', label: 'תורמים' },
  { view: 'reports', icon: '📊', label: 'דוחות' },
  { view: 'settings', icon: '⚙️', label: 'הגדרות' },
];

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

const MAX_RESULTS = 12;

/** תאריך ISO ‏(YYYY-MM-DD) → תצוגה DD/MM/YYYY. */
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** בונה מונחי חיפוש מנורמלים ממחרוזות גולמיות — המחרוזת השלמה וגם כל מילה. */
function toTerms(raw: (string | undefined)[]): string[] {
  const out = new Set<string>();
  for (const r of raw) {
    if (!r) continue;
    const whole = normSearch(r);
    if (whole) out.add(whole);
    for (const word of r.split(/\s+/)) {
      const n = normSearch(word);
      if (n) out.add(n);
    }
  }
  return [...out];
}

/** ספרות בלבד — לחיפוש טלפונים בלי מקפים/רווחים. */
function digits(s: string): string {
  return s.replace(/\D/g, '');
}

export function CommandPalette() {
  const db = useApp((s) => s.db);
  const go = useApp((s) => s.go);
  const selectFamily = useApp((s) => s.selectFamily);
  const selectCourse = useApp((s) => s.selectCourse);
  const setPalette = useApp((s) => s.setPalette);
  const exportBackup = useApp((s) => s.exportBackup);
  const lockNow = useApp((s) => s.lockNow);
  const hasLock = useApp((s) => !!s.lock.primary || !!s.lock.secondary);
  // נעילת מנהל (משנית) — לא לאנדקס PII של אזורים נעולים לפני פתיחה.
  // מקביל ל-adminNeededFor ב-App: fallback ל-DEFAULT_LOCK_ZONES כש-zones לא הוגדר.
  const lockSecondary = useApp((s) => !!s.lock.secondary);
  const lockZones = useApp((s) => s.lock.zones ?? DEFAULT_LOCK_ZONES);
  const unlockedAdmin = useApp((s) => s.unlockedAdmin);
  const punch = useApp((s) => s.punch);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  // 🐛 נחיל-9×9 (13.8): הפלטה עקפה את הרשאת-הייעוד (supporters.purpose) — עובד
  // מוגבל הקליד שם-תורם של ייעוד אחר ופתח את כרטיסו המלא. גידור זהה ל-SupportersView.
  const allowedDesignations = useApp((s) => s.cloud.allowedDesignations ?? null);
  const desigLimit = featureOn(config, 'supporters.purpose') ? allowedDesignations : null;

  // גייטים למודולים ופיצ'רים — פריט של מודול/פיצ'ר כבוי לא מאונדקס בפלטה.
  // featureOn מחזיר false גם כשמודול האב כבוי, לכן אין צורך בבדיקה כפולה.
  const familiesOn = moduleOn(config, 'families');
  const coursesOn = moduleOn(config, 'courses');
  const wheelOn = featureOn(config, 'courses.wheel');
  const punchOn = featureOn(config, 'courses.punch');
  const supportersOn = moduleOn(config, 'supporters');
  const calendarOn = moduleOn(config, 'calendar');
  // העמודות המבודדות (CONNECT חיבור 1) — הפלטה מנווטת לעמודה; deep-link פנימי = שאלת מוצר עתידית
  const tzedakaOn = moduleOn(config, 'tzedaka');
  const shopOn = moduleOn(config, 'shop');
  const diaryOn = moduleOn(config, 'diary');
  const reportsOn = moduleOn(config, 'reports');
  const teachersOn = featureOn(config, 'settings.teachers');
  const famDocsOn = featureOn(config, 'families.docs');
  const wallOn = featureOn(config, 'home.impactwall');
  const timerOn = featureOn(config, 'core.timer');
  const cashboxOn = featureOn(config, 'core.cashbox');
  const bodymapOn = featureOn(config, 'core.bodymap');
  const dedupOn = featureOn(config, 'settings.dedup') && familiesOn;
  // המדריך המהיר (P2 פער 29) + מצב הדגמה (P2 פער 30) + ייצוא CSV (P2 פער 24)
  const guideOn = featureOn(config, 'shell.guide');
  const demoOn = featureOn(config, 'shell.demo');
  const exportFullOn = featureOn(config, 'reports.export.full');
  // פעולות הפלטה מהקובץ החי + קיבוץ תוצאות לפי סוג (P1.6)
  const paletteActionsOn = featureOn(config, 'shell.palette.actions');
  const openEventForm = useApp((s) => s.openEventForm);
  const openCourseForm = useApp((s) => s.openCourseForm);
  const openSupporterForm = useApp((s) => s.openSupporterForm);

  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  /** ניווט + פעולות — מוצגים גם כשאין שאילתה. */
  const baseCmds = useMemo<Cmd[]>(() => {
    // ניווט למודול כבוי חושף את המסך המלא (ל-App אין הפניה פר-מודול) — לכן
    // מסננים פקודות ניווט לפי מצב המודול; בית והגדרות תמיד נגישים.
    const navOn: Partial<Record<View, boolean>> = {
      families: familiesOn,
      courses: coursesOn,
      calendar: calendarOn,
      diary: diaryOn,
      supporters: supportersOn,
      reports: reportsOn,
    };
    const nav: Cmd[] = NAV_CMDS.filter(
      (n) => n.view === 'home' || n.view === 'settings' || navOn[n.view] !== false,
    ).map((n) => {
      // תיוג-מחדש פר-עסק: בית/הגדרות ללא מונח (קבועים); שאר המסכים דרך termOf.
      // חיפוש כולל גם את התווית המותאמת וגם את ברירת-המחדל (alias) כדי שהשם הישן
      // ("תורמים") והחדש ("מטופלים") ימצאו את אותו מסך.
      const label =
        n.view === 'home' || n.view === 'settings' ? n.label : termOf(config, 'nav.' + n.view, n.label);
      return {
        key: 'nav-' + n.view,
        icon: n.icon,
        title: label,
        sub: 'מעבר למסך',
        terms: toTerms([label, n.label, 'מסך', 'ניווט', 'מעבר']),
        run: () => {
          go(n.view);
          setPalette(false);
        },
      };
    });
    const actions: Cmd[] = [];
    // משפחה חדשה — פותח את מסך המשפחות; מוסתר כשמודול המשפחות כבוי
    if (familiesOn) {
      actions.push({
        key: 'act-new-family',
        icon: '➕',
        title: '➕ הוספת ' + termOf(config, 'entity.family', 'משפחה'),
        sub: 'מעבר למסך ה' + termOf(config, 'nav.families', 'משפחות') + ' לרישום',
        terms: toTerms(['משפחה חדשה', 'הוספת משפחה', 'הוספה', 'רישום', 'קליטה']),
        run: () => {
          selectFamily(null);
          setPalette(false);
        },
      });
    }
    actions.push({
      key: 'act-backup',
      icon: '⬇️',
      title: 'הורדת גיבוי מלא',
      sub: 'קובץ גיבוי JSON יורד למחשב',
      terms: toTerms(['הורדת גיבוי מלא', 'גיבוי', 'ייצוא', 'שמירה', 'backup']),
      run: () => {
        exportBackup();
        setPalette(false);
      },
    });
    // גלגל החוגים — דורש מודול חוגים + פיצ'ר courses.wheel
    if (wheelOn) {
      actions.push({
        key: 'act-wheel',
        icon: '🎡',
        title: 'גלגל ה' + termOf(config, 'nav.courses', 'חוגים'),
        sub: 'סיבוב מזל שבוחר ' + termOf(config, 'entity.course', 'חוג'),
        terms: toTerms(['גלגל החוגים', 'גלגל', 'מזל', 'הגרלה', 'מצא חוג', 'wheel']),
        run: () => {
          try {
            sessionStorage.setItem('maor_open_wheel', '1');
          } catch {
            /* sessionStorage חסום */
          }
          go('courses');
          // אם מסך החוגים כבר פתוח — הדגל לא ייקרא ב-mount; האירוע משלים
          window.dispatchEvent(new Event('maor:open-wheel'));
          setPalette(false);
        },
      });
    }
    // קיר ההשפעה — מצב ראווה במסך מלא (feature: home.impactwall)
    if (wallOn) {
      actions.push({
        key: 'act-wall',
        icon: '🖥️',
        title: 'קיר ההשפעה',
        sub: 'מצב ראווה — שידור חי למסך גדול',
        terms: toTerms(['קיר ההשפעה', 'קיר', 'מצב ראווה', 'שידור חי', 'תצוגה', 'מסך גדול', 'wall']),
        run: () => {
          window.location.hash = '#wall';
          setPalette(false);
        },
      });
    }
    // טיימר כסף — חיוב לפי זמן (feature: core.timer)
    if (timerOn) {
      const tl = termOf(config, 'nav.timer', 'טיימר כסף');
      actions.push({
        key: 'act-timer',
        icon: '⏱️',
        title: tl,
        sub: 'חיוב לפי זמן — שעון עצר/טיימר',
        terms: toTerms([tl, 'טיימר', 'שעון עצר', 'חיוב לפי זמן', 'timer']),
        run: () => {
          window.location.hash = '#timer';
          setPalette(false);
        },
      });
    }
    // קופה רושמת — קבלת מזומן ועודף (feature: core.cashbox)
    if (cashboxOn) {
      const cl = termOf(config, 'nav.cashbox', 'קופה רושמת');
      actions.push({
        key: 'act-cashbox',
        icon: '💵',
        title: cl,
        sub: 'קבלת מזומן, עודף וחשבונית',
        terms: toTerms([cl, 'קופה', 'מזומן', 'עודף', 'חשבונית', 'cash']),
        run: () => {
          window.location.hash = '#cashbox';
          setPalette(false);
        },
      });
    }
    // מפת אזורי טיפול (feature: core.bodymap)
    if (bodymapOn) {
      const bl = termOf(config, 'nav.bodymap', 'אזורי טיפול');
      actions.push({
        key: 'act-bodymap',
        icon: '🧍',
        title: bl,
        sub: 'מעקב טיפולים לפי אזורי גוף',
        terms: toTerms([bl, 'אזורי טיפול', 'מפת גוף', 'טיפולים', 'body']),
        run: () => {
          window.location.hash = '#bodymap';
          setPalette(false);
        },
      });
    }
    // איחוד כפילויות משפחות (feature: settings.dedup)
    if (dedupOn) {
      actions.push({
        key: 'act-dedup',
        icon: '🔀',
        title: 'איחוד כפילויות',
        sub: 'זיהוי ומיזוג ' + termOf(config, 'nav.families', 'משפחות') + ' כפולות',
        terms: toTerms(['איחוד כפילויות', 'כפילות', 'מיזוג', 'כפולות', 'dedup', 'merge']),
        run: () => {
          window.location.hash = '#dedup';
          setPalette(false);
        },
      });
    }
    // המדריך המהיר 📖 (P2 פער 29, feature shell.guide, legacy:2891-2913)
    if (guideOn) {
      actions.push({
        key: 'act-guide',
        icon: '📖',
        title: 'המדריך המהיר',
        sub: 'איך עושים הכל — מסך-מסך והמתכונים המהירים',
        terms: toTerms(['המדריך המהיר', 'מדריך', 'עזרה', 'הדרכה', 'איך', 'help', 'guide']),
        run: () => {
          window.location.hash = '#guide';
          setPalette(false);
        },
      });
    }
    // ▶ מצב הדגמה — סיור מודרך (P2 פער 30, feature shell.demo, הכרעה 4)
    if (demoOn) {
      actions.push({
        key: 'act-tour',
        icon: '▶',
        title: 'מצב הדגמה',
        sub: 'סיור מודרך על המסכים — בקצב שלך, Esc עוצר',
        terms: toTerms(['מצב הדגמה', 'הדמיה', 'סיור', 'הדגמה', 'דמו', 'demo', 'tour']),
        run: () => {
          window.location.hash = '#tour';
          setPalette(false);
        },
      });
    }
    // ⬇ ייצוא CSV מהפלטה — dlCSV מהקובץ החי (P2 פער 24, חוב P1)
    if (exportFullOn && familiesOn) {
      actions.push({
        key: 'act-dlcsv',
        icon: '⬇',
        title: 'ייצוא CSV',
        sub: 'קובץ ה' + termOf(config, 'nav.families', 'משפחות') + ' המלא — ישר מהחיפוש',
        terms: toTerms(['ייצוא CSV', 'ייצוא', 'הורדה', 'אקסל', 'csv', 'excel']),
        run: () => {
          exportFamiliesCsv();
          setPalette(false);
        },
      });
    }
    // ── פעולות הפלטה מהקובץ החי (P1.6, feature shell.palette.actions,
    //    legacy:2333-2366) — העתקת טלפונים, + אירוע/תזכורת/חוג/תומכת, ניקוב-מהיום ──
    if (paletteActionsOn) {
      if (familiesOn) {
        actions.push({
          key: 'act-copy-phones',
          icon: '📋',
          title: 'העתקת כל הטלפונים',
          sub: 'רשימת חיוג ללוח ההעתקה',
          terms: toTerms(['העתקת כל הטלפונים', 'טלפונים', 'חיוג', 'העתקה', 'רשימה']),
          run: () => {
            // legacy copyPhones (2341-2344): 'משפחת X: טלפון' שורה-לשורה
            const withPhone = useApp.getState().db.families.filter((f) => f.phone);
            const list = withPhone
              .map((f) => termOf(config, 'entity.familyOf', 'משפחת') + ' ' + f.name + ': ' + f.phone)
              .join('\n');
            if (navigator.clipboard) void navigator.clipboard.writeText(list);
            toast('הועתקו ' + withPhone.length + ' מספרי טלפון ללוח');
            setPalette(false);
          },
        });
      }
      if (calendarOn) {
        actions.push({
          key: 'act-new-event',
          icon: '📅',
          title: '➕ הוספת אירוע',
          sub: 'הוספה ללוח השנה',
          terms: toTerms(['אירוע חדש', 'הוספת אירוע', 'הוספה', 'לוח']),
          run: () => {
            openEventForm('org');
            setPalette(false);
          },
        });
        actions.push({
          key: 'act-new-call',
          icon: '📞',
          title: '+ תזכורת טלפון',
          sub: 'מעקב שיחה — נכנס ללוח השנה',
          terms: toTerms(['תזכורת טלפון', 'שיחה', 'מעקב', 'להתקשר']),
          run: () => {
            openEventForm('call');
            setPalette(false);
          },
        });
      }
      if (coursesOn) {
        actions.push({
          key: 'act-new-course',
          icon: '🎨',
          title: '➕ הוספת ' + termOf(config, 'entity.course', 'חוג'),
          sub: 'הגדרת ' + termOf(config, 'entity.course', 'חוג') + ' ומסלול תמחור',
          terms: toTerms([termOf(config, 'entity.course', 'חוג') + ' חדש', 'הוספת ' + termOf(config, 'entity.course', 'חוג'), 'קורס חדש', 'הוספה']),
          run: () => {
            openCourseForm();
            setPalette(false);
          },
        });
      }
      if (supportersOn) {
        actions.push({
          key: 'act-new-supporter',
          icon: '💛',
          title: '➕ הוספת ' + termOf(config, 'entity.supporter', 'תומך/ת'),
          sub: 'כרטיס מלא — ' + termOf(config, 'entity.donations', 'תרומות') + ' ומעקב',
          terms: toTerms([termOf(config, 'entity.supporter', 'תומך/ת'), 'תומכת חדשה', 'תורמת', 'הוספה']),
          run: () => {
            openSupporterForm();
            setPalette(false);
          },
        });
      }
      if (coursesOn && punchOn) {
        const sessions = todaySessions(db, new Date());
        actions.push({
          key: 'act-today-punch',
          icon: '🎫',
          title: 'ניקוב ל' + termOf(config, 'entity.course', 'חוג') + ' של היום',
          sub: sessions.length
            ? sessions[0].course.name + (sessions[0].session.time ? ' · ' + sessions[0].session.time : '')
            : 'אין מפגשים היום',
          terms: toTerms(['ניקוב', 'נוכחות', 'היום', 'מפגש']),
          run: () => {
            if (sessions.length) selectCourse(sessions[0].course.id);
            else {
              toast('אין מפגשים היום');
              go('courses');
            }
            setPalette(false);
          },
        });
      }
    }
    // נעילה עכשיו — רק כשהוגדר קוד כלשהו
    if (hasLock) {
      actions.push({
        key: 'act-lock',
        icon: '🔒',
        title: 'נעילה עכשיו',
        sub: 'נועל את המערכת — הכניסה הבאה תדרוש קוד',
        terms: toTerms(['נעילה עכשיו', 'נעל', 'לנעול', 'יציאה', 'נעילה', 'lock']),
        run: () => {
          lockNow();
          setPalette(false);
        },
      });
    }
    return [...nav, ...actions];
  }, [
    config,
    go,
    selectFamily,
    exportBackup,
    setPalette,
    familiesOn,
    coursesOn,
    calendarOn,
    diaryOn,
    supportersOn,
    reportsOn,
    wheelOn,
    wallOn,
    timerOn,
    cashboxOn,
    bodymapOn,
    dedupOn,
    guideOn,
    demoOn,
    exportFullOn,
    hasLock,
    lockNow,
    paletteActionsOn,
    punchOn,
    db,
    toast,
    selectCourse,
    openEventForm,
    openCourseForm,
    openSupporterForm,
  ]);

  /** כרטיסיות מסתיימות — שיבוצי כרטיסייה פעילים עם ≤2 ניקובים שנותרו. */
  const expiringCmds = useMemo<Cmd[]>(() => {
    // דורש מודול חוגים + פיצ'ר courses.punch
    if (!punchOn) return [];
    const members = allMembers(db);
    const out: Cmd[] = [];
    for (const e of db.enrollments) {
      if (e.plan !== 'punch' || e.status !== 'active') continue;
      const left = e.purchased - e.used;
      if (left > 2 || left < 0) continue;
      const m = members.find((x) => x.id === e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      if (!m || !c) continue;
      out.push({
        key: 'punch-' + e.id,
        icon: '🎟️',
        title: `${m.first} · ${c.name} · נותרו ${left}`,
        sub: left === 0 ? 'הכרטיסייה נגמרה' : 'Enter — מעבר ל' + termOf(config, 'entity.course', 'חוג'),
        terms: [],
        run: () => {
          selectCourse(c.id);
          setPalette(false);
        },
        inline:
          left > 0
            ? {
                label: 'נקב ✓',
                run: () => {
                  punch(e.id);
                  toast(`ניקוב נרשם ל${m.first} ✓ — נותרו ${left - 1}`);
                },
              }
            : undefined,
      });
      if (out.length >= 5) break;
    }
    return out;
  }, [db, punch, toast, selectCourse, setPalette, punchOn, config]);

  /** ישויות מהנתונים — משפחות, בני משפחה, חוגים, מורים, תורמים, מסמכים ואירועים פתוחים. */
  const entityCmds = useMemo<Cmd[]>(() => {
    const out: Cmd[] = [];
    const zoneLocked = (z: string) => lockSecondary && lockZones.includes(z) && !unlockedAdmin;
    for (const f of familiesOn ? db.families : []) {
      out.push({
        key: 'fam-' + f.id,
        icon: '👨‍👩‍👧‍👦',
        title: termOf(config, 'entity.familyOf', 'משפחת') + ' ' + f.name,
        sub: [f.city, f.phone].filter(Boolean).join(' · '),
        terms: toTerms([
          f.name,
          'משפחת ' + f.name,
          f.father,
          f.mother,
          f.city,
          f.community,
          digits(f.phone),
          digits(f.phone2),
        ]),
        run: () => {
          selectFamily(f.id);
          setPalette(false);
        },
      });
    }
    for (const m of familiesOn ? allMembers(db) : []) {
      out.push({
        key: 'mem-' + m.famId + '-' + m.id,
        icon: m.isParent ? '🧑' : m.gender === 'f' ? '👧' : '👦',
        title: (m.first + ' ' + m.famName).trim(),
        sub: [termOf(config, 'entity.familyOf', 'משפחת') + ' ' + m.famName, m.phone].filter(Boolean).join(' · '),
        terms: toTerms([m.first, m.famName, m.school, m.grade, digits(m.phone), m.idNum]),
        run: () => {
          selectFamily(m.famId);
          setPalette(false);
        },
      });
    }
    for (const c of coursesOn ? db.courses : []) {
      const teacher = db.teachers.find((t) => t.id === c.teacherId);
      out.push({
        key: 'crs-' + c.id,
        icon: '🎨',
        title: c.name,
        sub: ['יום ' + (DAY_NAMES[c.weekday] ?? ''), c.time, teacher?.name].filter(Boolean).join(' · '),
        terms: toTerms([c.name, c.cat, c.semester, c.audience, teacher?.name, 'חוג', 'קורס']),
        run: () => {
          selectCourse(c.id);
          setPalette(false);
        },
      });
    }
    for (const t of teachersOn && !zoneLocked('settings') ? db.teachers : []) {
      out.push({
        key: 'tch-' + t.id,
        icon: '🧑‍🏫',
        title: t.name,
        sub: [t.specialty, t.phone].filter(Boolean).join(' · '),
        terms: toTerms([
          t.name,
          t.specialty,
          t.email,
          digits(t.phone),
          digits(t.phone2),
          t.idNum,
          'מורה',
          'מדריך',
          'צוות',
        ]),
        run: () => {
          go('settings');
          setPalette(false);
        },
      });
    }
    for (const sp of supportersOn && !zoneLocked('supporters')
      ? db.supporters.filter((sp) => supporterVisibleForDesignations(sp, desigLimit))
      : []) {
      out.push({
        key: 'sup-' + sp.id,
        icon: '💛',
        title: sp.name,
        sub: [sp.cat, sp.phone].filter(Boolean).join(' · '),
        terms: toTerms([sp.name, sp.cat, sp.forWho, sp.email, digits(sp.phone), sp.idNum, 'תורם', 'תרומה', 'תומכת']),
        run: () => {
          // UX סבב-ז׳: נוחתים על כרטיס-התומך עצמו (כמו משפחות) — לא רק על המסך
          useApp.getState().openSupporterCard(sp.id);
          setPalette(false);
        },
      });
    }
    for (const f of famDocsOn ? db.families : []) {
      for (const doc of f.docs) {
        out.push({
          key: 'doc-' + f.id + '-' + doc.id,
          icon: '📄',
          title: doc.name,
          sub: [termOf(config, 'entity.familyOf', 'משפחת') + ' ' + f.name, fmtDate(doc.addedAt)].filter(Boolean).join(' · '),
          terms: toTerms([doc.name, f.name, 'משפחת ' + f.name, 'מסמך', 'קובץ']),
          run: () => {
            selectFamily(f.id);
            setPalette(false);
          },
        });
      }
    }
    for (const ev of calendarOn ? db.events : []) {
      if (ev.done) continue;
      out.push({
        key: 'ev-' + ev.id,
        icon: '📅',
        title: ev.title,
        sub: [fmtDate(ev.date), ev.time].filter(Boolean).join(' · '),
        terms: toTerms([ev.title, ev.customType, 'אירוע', 'תזכורת', 'לוח']),
        run: () => {
          go('calendar');
          setPalette(false);
        },
      });
    }
    // קופות צדקה (CONNECT חיבור 1) — רכזים בשם, קופות ב-#num; הפעולה: ניווט לעמודה
    const tzCoordTerm = termOf(config, 'entity.tzCoordinator', 'רכז');
    for (const c of tzedakaOn ? db.tzCoordinators : []) {
      out.push({
        key: 'tzc-' + c.id,
        icon: '🪙',
        title: c.name + ' — ' + tzCoordTerm,
        sub: [c.phone].filter(Boolean).join(' · '),
        terms: toTerms([c.name, tzCoordTerm, digits(c.phone), 'קופות צדקה']),
        run: () => {
          go('tzedaka');
          setPalette(false);
        },
      });
    }
    const tzBoxTerm = termOf(config, 'entity.tzBox', 'קופה');
    for (const b of tzedakaOn ? db.tzBoxes : []) {
      const holder = db.families.find((f) => f.id === b.famId);
      out.push({
        key: 'tzb-' + b.id,
        icon: '🪙',
        title: '#' + b.num + ' — ' + tzBoxTerm,
        sub: holder ? termOf(config, 'entity.familyOf', 'משפחת') + ' ' + holder.name : '',
        terms: toTerms(['#' + b.num, b.num, tzBoxTerm, holder?.name, 'קופות צדקה']),
        run: () => {
          go('tzedaka');
          setPalette(false);
        },
      });
    }
    // חנות (CONNECT חיבור 1) — חבילות, פריטים ושיוכים לפי שם משפחת המוטב
    for (const p of shopOn ? db.shopProducts : []) {
      out.push({
        key: 'shp-' + p.id,
        icon: '🛍',
        title: p.name + ' — ' + termOf(config, 'entity.shopProduct', 'מוצר'),
        sub: p.desc,
        terms: toTerms([p.name, termOf(config, 'entity.shopProduct', 'מוצר'), 'חנות', 'חבילה']),
        run: () => {
          go('shop');
          setPalette(false);
        },
      });
    }
    for (const i of shopOn ? db.shopItems : []) {
      out.push({
        key: 'shi-' + i.id,
        icon: '📦',
        title: i.name + ' — ' + termOf(config, 'entity.shopItem', 'פריט'),
        sub: '',
        terms: toTerms([i.name, termOf(config, 'entity.shopItem', 'פריט'), 'חנות', 'קטלוג']),
        run: () => {
          go('shop');
          setPalette(false);
        },
      });
    }
    for (const a of shopOn ? db.shopAssignments : []) {
      const who = beneficiaryLabel(db, a);
      const prodName = db.shopProducts.find((p) => p.id === a.productId)?.name ?? '';
      out.push({
        key: 'sha-' + a.id,
        icon: '🛍',
        title: who + ' — ' + termOf(config, 'entity.shopAssignment', 'שיוך'),
        sub: prodName,
        terms: toTerms([who, prodName, termOf(config, 'entity.shopAssignment', 'שיוך'), 'חנות']),
        run: () => {
          go('shop');
          setPalette(false);
        },
      });
    }
    return out;
  }, [
    db,
    go,
    selectFamily,
    selectCourse,
    setPalette,
    familiesOn,
    coursesOn,
    teachersOn,
    supportersOn,
    famDocsOn,
    calendarOn,
    tzedakaOn,
    shopOn,
    config,
    lockSecondary,
    lockZones,
    unlockedAdmin,
  ]);

  /** דירוג חכם (smartFilter) על מונחי החיפוש המנורמלים. עד 12 תוצאות.
   * שאילתה ריקה: ניווט + פעולות ואחריהם "כרטיסיות מסתיימות".
   * מזהה שיבוץ (e123): קפיצה ישירה לחוג של השיבוץ, לפני שאר התוצאות. */
  // "נפתחו לאחרונה" (P1.5, legacy:3086) — עד 5 משפחות אחרונות בשאילתה ריקה
  const recentIds = useApp((s) => s.recentIds);
  const recentCmds = useMemo<Cmd[]>(() => {
    if (!familiesOn || !featureOn(config, 'shell.navhist')) return [];
    const out: Cmd[] = [];
    for (const id of recentIds) {
      if (out.length >= 5) break;
      const f = db.families.find((x) => x.id === id);
      if (!f) continue;
      out.push({
        key: 'recent-' + f.id,
        icon: '🕘',
        title: termOf(config, 'entity.familyOf', 'משפחת') + ' ' + f.name,
        sub: 'נפתחה לאחרונה — פתיחת הכרטיס',
        section: out.length === 0 ? 'נפתחו לאחרונה' : undefined,
        terms: [],
        run: () => {
          selectFamily(f.id);
          setPalette(false);
        },
      });
    }
    return out;
  }, [recentIds, db.families, familiesOn, config, selectFamily, setPalette]);

  const results = useMemo<Cmd[]>(() => {
    const nq = normSearch(q);
    if (!nq) {
      const exp = expiringCmds.map((c, i) => (i === 0 ? { ...c, section: 'כרטיסיות מסתיימות' } : c));
      return [...recentCmds, ...baseCmds, ...exp];
    }
    const pre: Cmd[] = [];
    const t = q.trim().toLowerCase();
    // חיפוש שיבוץ לפי מזהה — רק כשמודול החוגים פעיל
    if (coursesOn && /^e\d+$/.test(t)) {
      const e = db.enrollments.find((x) => x.id.toLowerCase() === t);
      const c = e && db.courses.find((x) => x.id === e.courseId);
      if (e && c) {
        const m = allMembers(db).find((x) => x.id === e.memberId);
        pre.push({
          key: 'enr-' + e.id,
          icon: '🎫',
          title: termOf(config, 'entity.enrollment', 'שיבוץ') + ' ' + e.id + (m ? ' — ' + m.first : ''),
          sub: c.name + ' · מעבר לכרטיס ה' + termOf(config, 'entity.course', 'חוג'),
          terms: [],
          run: () => {
            selectCourse(c.id);
            setPalette(false);
          },
        });
      }
    }
    const found = [...pre, ...smartFilter(nq, [...baseCmds, ...entityCmds], (c) => c.terms, MAX_RESULTS)].slice(
      0,
      MAX_RESULTS,
    );
    // קיבוץ תוצאות לפי סוג (P1.6, כמו בלגאסי) — מיון יציב לדליים + כותרות
    return paletteActionsOn ? groupPaletteResults(found, config) : found;
  }, [q, baseCmds, entityCmds, expiringCmds, recentCmds, db, selectCourse, setPalette, coursesOn, paletteActionsOn, config]);

  /** "אולי התכוונת" — שאילתה ≥3 תווים בלי תוצאות: עד 6 מילים קרובות
   * (levenshtein ≤ 2) מתוך כותרות כל הפריטים המאונדקסים — כמו בלגאסי (P3
   * אימות פריט 20). כלל ציון-130 למזהים מספריים לא פורט: הספרות מאונדקסות
   * כ-terms ו-smartFilter מוצא אותן — אותה יכולת, דירוג שונה (שקילות מתועדת). */
  const suggestions = useMemo<string[]>(() => {
    const nq = normSearch(q);
    if (nq.length < 3 || results.length > 0) return [];
    const scored: { w: string; d: number }[] = [];
    const seen = new Set<string>();
    for (const c of [...baseCmds, ...entityCmds]) {
      for (const w of c.title.split(/\s+/)) {
        if (w.length < 2) continue;
        const nw = normSearch(w);
        if (!nw || nw === nq || seen.has(nw)) continue;
        const d = levenshtein(nq, nw);
        if (d <= 2) {
          seen.add(nw);
          scored.push({ w, d });
        }
      }
    }
    scored.sort((a, b) => a.d - b.d);
    return scored.slice(0, 6).map((x) => x.w);
  }, [q, results, baseCmds, entityCmds]);

  // איפוס הבחירה כשהשאילתה משתנה, והצמדה לטווח כשהתוצאות מתקצרות.
  useEffect(() => {
    setSel(0);
  }, [q]);
  useEffect(() => {
    setSel((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results]);

  // מקלדת: חצים לניווט, Enter להפעלה, Escape לסגירה.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPalette(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const r = results[sel];
        if (r) {
          e.preventDefault();
          r.run();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, sel, setPalette]);

  // גלילת הפריט הנבחר לתוך שדה הראייה.
  useEffect(() => {
    listRef.current?.querySelector('button.sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel, results]);

  return (
    <div
      className="palette-back"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && setPalette(false)}
    >
      <div className="palette" role="dialog" aria-label="חיפוש מהיר">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={'חיפוש: מסך, ' + termOf(config, 'entity.family', 'משפחה') + ', שם, ' + termOf(config, 'entity.course', 'חוג') + ', ' + termOf(config, 'entity.teacher', 'מורה') + ', ' + termOf(config, 'entity.supporter', 'תורם') + ', מסמך או פעולה…'}
          aria-label="חיפוש מהיר בכל המערכת"
        />
        <div className="results" ref={listRef} role="listbox" aria-label="תוצאות חיפוש">
          {results.map((c, i) => {
            const inline = c.inline;
            return (
              <Fragment key={c.key}>
                {c.section && (
                  <div
                    style={{
                      padding: '10px 16px 4px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--ink-faint)',
                      borderTop: '1px solid var(--line-soft)',
                    }}
                  >
                    {c.section}
                  </div>
                )}
                <button
                  type="button"
                  className={i === sel ? 'sel' : ''}
                  role="option"
                  aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={c.run}
                >
                  <span aria-hidden>{c.icon}</span>
                  <span style={{ fontWeight: 600 }}>{c.title}</span>
                  <span style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {c.sub && <span style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>{c.sub}</span>}
                    {inline && (
                      <span
                        role="button"
                        tabIndex={-1}
                        className="chip"
                        title={inline.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          inline.run();
                        }}
                      >
                        {inline.label}
                      </span>
                    )}
                  </span>
                </button>
              </Fragment>
            );
          })}
          {results.length === 0 && (
            <div className="empty" style={{ padding: '24px 16px' }}>
              <div>לא נמצאו תוצאות עבור "{q}"</div>
              {suggestions.length > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 13 }}>אולי התכוונת:</span>
                  {suggestions.map((w) => (
                    <button key={w} type="button" className="chip" onClick={() => setQ(w)}>
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            padding: '8px 16px',
            borderTop: '1px solid var(--line)',
            color: 'var(--ink-faint)',
            fontSize: 12,
          }}
        >
          <span>↑↓ ניווט</span>
          <span>Enter בחירה</span>
          <span>Esc סגירה</span>
        </div>
      </div>
    </div>
  );
}
