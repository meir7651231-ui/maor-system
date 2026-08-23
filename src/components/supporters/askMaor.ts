/**
 * 🤖 "שאל את מאור" (VISION-LIGHT ‏#30, 23.8.2026, חבילת-הבידול) — שאלות
 * בשפה חופשית על הנתונים **המקומיים**: "מי לא תרם השנה?", "מי התורמים
 * הגדולים?", "מי בסיכון?" — והתשובה נגזרת מהמנועים הטהורים הקיימים.
 *
 * הבידול אינו ה-AI אלא שכבת-המנועים: פרשן-כוונות **אופליין ודטרמיניסטי**
 * (אפס-שרת, אפס-מפתח, שום נתון לא עוזב את המכשיר). ‏tool-use עם מפתח-AI =
 * המדרגה הבאה (roadmap; ‏lib/ai הדורמנטי מוכן).
 *
 * קריאה-בלבד מוחלט: התשובות מפנות למסכים — לעולם לא כותבות/רושמות כסף.
 * טהור: היום מוזרק, בלי store/DOM.
 */
import type { Db } from '../../types/domain';
import { cockpitAtRisk, cockpitQueue } from './cockpit';
import { hebSeasonOf, hebTimingTasks } from './hebTiming';
import { supIls, supLast } from './lib';

export interface AskAnswer {
  icon: string;
  title: string;
  /** שורות-תשובה מוכנות-לתצוגה. */
  lines: string[];
  /** מסך-המשך רלוונטי ('supporters' וכו'), אם יש. */
  view?: string;
  /** כמה בסך-הכול (כשהשורות קטומות). */
  total?: number;
}

const TOP = 8;
const ils = (n: number) => '₪' + Math.round(n).toLocaleString('en-US');

/** הכוונות המוכרות — לרשימת-הדוגמאות בממשק ("מה אפשר לשאול"). */
export const ASK_EXAMPLES = [
  'מי לא תרם השנה?',
  'מי התורמים הגדולים?',
  'כמה תרמו השנה?',
  'מי בסיכון?',
  'למי צריך להתקשר?',
  'אילו הוראות-קבע טרם נרשמו החודש?',
  'מי בעונה שלו עכשיו?',
  'כמה תורמים יש?',
];

/**
 * הפרשן: שאלה חופשית ⇒ תשובה מהמנועים, או null כשאין כוונה מזוהה
 * (הממשק מציג אז את רשימת-הדוגמאות — לא מנחש).
 */
export function askMaor(q: string, db: Db, todayIso: string, usdRate: number): AskAnswer | null {
  const t = q.trim();
  if (!t) return null;
  const year = todayIso.slice(0, 4);
  const rate = usdRate || 3.7;
  const sups = db.supporters;

  const gaveInYear = (y: string) => (sp: (typeof sups)[number]) =>
    sp.donations.some((d) => d.amount > 0 && d.date.startsWith(y)) ||
    (sp.hist ?? []).some((h) => h.a > 0 && h.d.startsWith(y) && !/נדח|decline|error/i.test(h.status ?? ''));

  // "מי לא תרם/תרמה/תרמו השנה" — נותנים-בעבר שלא נתנו השנה (לא כרטיסים ריקים).
  // ⚠️ אותיות-סופיות: 'תרם' לא נתפס ב-'תרמ?' — מונים צורות מפורשות.
  if (/השנה/.test(t) && /לא\s+(תרם|תרמה|תרמו|נתן|נתנה|נתנו)/.test(t)) {
    const past = sups.filter((sp) => supLast(sp) && !gaveInYear(year)(sp));
    past.sort((a, b) => supIls(b) - supIls(a));
    return {
      icon: '🕳', title: 'תרמו בעבר וטרם תרמו ב-' + year + ' — ' + past.length,
      lines: past.slice(0, TOP).map((sp) => sp.name + ' · סה"כ ' + ils(supIls(sp)) + ' · אחרונה ' + (supLast(sp) || '—')),
      view: 'supporters', total: past.length,
    };
  }

  // "התורמים הגדולים" / "מי תרם הכי הרבה"
  if (/הגדולים|הכי\s+הרבה|טופ|מובילים/.test(t)) {
    const top = [...sups].sort((a, b) => supIls(b) - supIls(a)).filter((sp) => supIls(sp) > 0);
    return {
      icon: '🏆', title: 'התורמים הגדולים',
      lines: top.slice(0, TOP).map((sp, i) => (i + 1) + '. ' + sp.name + ' · ' + ils(supIls(sp))),
      view: 'supporters', total: top.length,
    };
  }

  // "כמה תרמו השנה / החודש" — סכום ההכנסות בתקופה
  if (/כמה\s+(תרמו|נכנס|נאסף)/.test(t)) {
    const month = /החודש/.test(t) ? todayIso.slice(0, 7) : null;
    const pref = month ?? year;
    let total = 0, gifts = 0;
    for (const sp of sups) {
      for (const d of sp.donations) if (d.amount > 0 && d.date.startsWith(pref)) { total += d.cur === '$' ? d.amount * rate : d.amount; gifts++; }
      for (const h of sp.hist ?? []) if (h.a > 0 && h.d.startsWith(pref) && !/נדח|decline|error/i.test(h.status ?? '')) { total += h.c === '$' ? h.a * rate : h.a; gifts++; }
    }
    return {
      icon: '💰', title: (month ? 'החודש (' + pref + ')' : 'שנת ' + year) + ' — ' + ils(total),
      lines: [gifts + ' אירועי-נתינה · שווה-ערך שקלי לפי שער ' + rate],
      view: 'supporters',
    };
  }

  // "מי בסיכון" — שתיקה ארוכה של נותני-עבר (מנוע-הקוקפיט)
  if (/בסיכון|נוטש|שותק/.test(t)) {
    const risk = cockpitAtRisk(sups, todayIso);
    return {
      icon: '⚠️', title: 'בסיכון-שתיקה — ' + risk.length,
      lines: risk.slice(0, TOP).map((sp) => sp.name + ' · אחרונה ' + (supLast(sp) || '—')),
      view: 'supporters', total: risk.length,
    };
  }

  // "למי להתקשר" — תור-השיחות של הקוקפיט
  if (/להתקשר|שיחות|לחייג/.test(t)) {
    const calls = cockpitQueue(sups, todayIso, rate).calls;
    return {
      icon: '📞', title: 'תור-השיחות של היום — ' + calls.length,
      lines: calls.slice(0, TOP).map((c) => c.name + ' — ' + c.reason),
      view: 'supporters', total: calls.length,
    };
  }

  // "הוראות קבע שטרם נרשמו"
  if (/הוראות?[- ]קבע|הו["']?ק/.test(t)) {
    const hok = cockpitQueue(sups, todayIso, rate).hok;
    return {
      icon: '🔁', title: 'הו"ק שטרם נרשמו החודש — ' + hok.length,
      lines: hok.slice(0, TOP).map((c) => c.name + ' — ' + c.reason),
      view: 'supporters', total: hok.length,
    };
  }

  // "מי בעונה שלו" — מנוע-העיתוי העברי
  if (/עונה|אלול|חנוכה|פורים|פסח/.test(t)) {
    const season = hebSeasonOf(todayIso);
    const heb = hebTimingTasks(sups, todayIso);
    return {
      icon: '🕎', title: 'העונה שלהם — ' + season.monthHe + ' · ' + heb.length,
      lines: heb.slice(0, TOP).map((h) => h.name + ' — ' + h.reason),
      view: 'supporters', total: heb.length,
    };
  }

  // "כמה תורמים / משפחות / חוגים יש"
  if (/כמה\s+(תורמ|תומכ|משפח|חוג|תלמיד)/.test(t)) {
    const lines: string[] = [];
    if (/תורמ|תומכ/.test(t)) lines.push('תורמים ותורמות: ' + sups.length);
    if (/משפח/.test(t)) lines.push('משפחות: ' + db.families.length);
    if (/חוג/.test(t)) lines.push('חוגים: ' + db.courses.length);
    if (/תלמיד/.test(t)) lines.push('שיבוצים חיים: ' + db.enrollments.filter((e) => e.status === 'active' || e.status === 'paused').length);
    return { icon: '🔢', title: 'ספירה', lines };
  }

  return null;
}
