/**
 * 🧭 "מתחילים מהסוף" — מהמשפט של הלקוח לתקעים, ומהמסלול לצעדים בעברית פשוטה.
 *
 * `goalFromText`: מילון-מילות-מפתח קטן ומפורש לכל תקע (`GOAL_LEXICON`, מיוצא — אפשר לקרוא ולהרחיב). ההתאמה:
 * מפרקים למילים; לכל מילה מנסים גם בלי אותיות-השימוש בראשה (ו ה ב ל מ ש כ וצירופיהן — "ומהטלפון" ⇒ "טלפון") וגם
 * בצורת-יחיד פשוטה (‎-ים/-ות ⇒ בלי, ‎-ות ⇒ ‎-ה/‎-ת: "תזכורות" ⇒ "תזכורת"). ביטוי ארוך קודם לקצר, ומילה שנתפסה
 * בביטוי לא נספרת שוב ("סגור בשבת" = שעות חסומות, לא זמני-שבת). אין כאן ניחוש — רק המילון.
 */
import { GOAL, plugName, type PlugId, type Route } from './route';

/** המילון: לכל תקע — מילים וביטויים (צורת-יסוד; התחיליות והרבים מטופלים בהתאמה). */
export const GOAL_LEXICON: Readonly<Record<PlugId, readonly string[]>> = {
  'voice.menu': ['טלפון כשר', 'קו טלפוני', 'קו טלפון', 'קו', 'לחייג', 'חיוג', 'טלפון', 'מענה קולי', 'תפריט קולי', 'מקש', 'להקיש'],
  'times.shabbat': ['שבת', 'הדלקת נרות', 'כניסת שבת', 'צאת שבת', 'מוצאי שבת', 'זמני שבת', 'הבדלה'],
  'times.prayers': ['מניין', 'מנין', 'תפילה', 'שחרית', 'מנחה', 'ערבית', 'זמני תפילה'],
  'times.blocked': ['סגור בשבת', 'שעות חסומות', 'חסום', 'לא בשבת', 'סגור בחג'],
  booking: ['להזמין', 'הזמנה', 'לשריין', 'שריון', 'להירשם', 'הרשמה'],
  availability: ['מקום פנוי', 'פנוי', 'זמינות', 'זמין', 'תפוס', 'יש מקום'],
  'pro.match': ['בעל מקצוע', 'בעלי מקצוע', 'אינסטלטור', 'חשמלאי', 'שרברב', 'טכנאי', 'הנדימן', 'מקצוען'],
  emergency: ['חירום', 'דחוף', 'מקרה חירום'],
  'request.text': ['בקשה', 'לבקש', 'מה צריך', 'פנייה'],
  'message.text': ['הודעה', 'וואטסאפ', 'ווטסאפ', 'וטסאפ', 'סמס', 'לשלוח הודעה', 'מסרון'],
  'print.page': ['להדפיס', 'הדפסה', 'חוברת', 'דף מודפס', 'לוח מודעות', 'עלון'],
  'date.hebrew': ['תאריך עברי', 'לוח עברי', 'תאריך בעברית'],
  reminder: ['להזכיר', 'תזכורת', 'שיזכירו', 'לא לשכוח'],
  'payment.link': ['לשלם', 'תשלום', 'קישור לתשלום', 'סליקה', 'לגבות', 'גבייה'],
  person: ['איש קשר', 'אנשי קשר', 'כרטיס אישי', 'פרטי קשר'],
  'day.summary': ['סיכום יום', 'סיכום יומי', 'תקציר יומי', 'תקציר היום', 'דוח יומי', 'מה יש היום'],
};

/** אותיות-השימוש בראש מילה (אחת עד ארבע, למשל "ו", "וה", "ומה", "וכשה"). */
const PREFIX_LETTERS = 'והבלמשכ';
const MAX_PREFIX = 4;
/** אחרי הסרת תחילית חייבות להישאר לפחות שתי אותיות ("וקו" ⇒ "קו"). */
const MIN_REST = 2;

/** אותיות-סופיות ⇒ רגילות, כדי שיחיד/רבים ייפגשו. */
const FINALS: Readonly<Record<string, string>> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/** המילים כפי שנכתבו (בלי ניקוד/פיסוק) — לתצוגת "מה זוהה". */
const display = (s: string): string[] =>
  s
    .replace(/[֑-ׇ]/g, '') // ניקוד/טעמים
    .replace(/[״"׳'`]/g, '')
    .replace(/[^א-תa-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

/** אותיות-סופיות ⇒ רגילות ("מניינים" − ים = "מניינ" ≡ "מניין"). */
const unfinal = (w: string): string => w.replace(/[ךםןףץ]/g, (c) => FINALS[c]);

const words = (s: string): string[] => display(s).map(unfinal);

/** צורות-יחיד פשוטות של מילה (כולל המילה עצמה). */
function singulars(w: string): string[] {
  const out = [w];
  if (w.length >= 4 && w.endsWith('ים')) out.push(w.slice(0, -2));
  if (w.length >= 4 && w.endsWith('ות')) {
    const base = w.slice(0, -2);
    out.push(base, base + 'ה', base + 'ת');
  }
  return out;
}

/** כל הקריאות האפשריות של מילה מהטקסט: כמו-שהיא / בלי תחילית — ובכל אחת גם יחיד. */
function readings(w: string, stripPrefix: boolean): Set<string> {
  const bases = [w];
  if (stripPrefix) {
    for (let k = 1; k <= MAX_PREFIX && w.length - k >= MIN_REST; k++) {
      if (!PREFIX_LETTERS.includes(w[k - 1])) break;
      bases.push(w.slice(k));
    }
  }
  const out = new Set<string>();
  for (const b of bases) for (const s of singulars(b)) out.add(s);
  return out;
}

interface Entry {
  plug: PlugId;
  phrase: string[];
}

/** כל הביטויים, הארוך קודם (ואז לפי סדר-המילון — דטרמיניסטי). */
const ENTRIES: readonly Entry[] = (Object.keys(GOAL_LEXICON) as PlugId[])
  .flatMap((plug, pi) => GOAL_LEXICON[plug].map((ph, wi) => ({ plug, phrase: words(ph), order: pi * 1000 + wi })))
  .sort((a, b) => b.phrase.length - a.phrase.length || a.order - b.order)
  .map(({ plug, phrase }) => ({ plug, phrase }));

export function goalFromText(text: string): { plugs: string[]; matched: Array<{ word: string; plug: string }> } {
  const shown = display(String(text ?? ''));
  const toks = shown.map(unfinal);
  // הקריאות של כל מילה — כמו-שהיא וגם בלי תחילית (גם מילה פנימית: ב"סגור בשבת" ה-ב׳ צמודה).
  const reads = toks.map((t) => readings(t, true));
  const used: boolean[] = toks.map(() => false);
  const hits: Array<{ at: number; word: string; plug: PlugId }> = [];

  for (const e of ENTRIES) {
    const n = e.phrase.length;
    for (let i = 0; i + n <= toks.length; i++) {
      let ok = true;
      for (let j = 0; j < n && ok; j++) {
        if (used[i + j]) ok = false;
        else if (!reads[i + j].has(e.phrase[j]) && !singulars(e.phrase[j]).some((s) => reads[i + j].has(s))) ok = false;
      }
      if (!ok) continue;
      for (let j = 0; j < n; j++) used[i + j] = true;
      hits.push({ at: i, word: shown.slice(i, i + n).join(' '), plug: e.plug });
    }
  }

  hits.sort((a, b) => a.at - b.at);
  const plugs: string[] = [];
  for (const h of hits) if (!plugs.includes(h.plug)) plugs.push(h.plug);
  return { plugs, matched: hits.map(({ word, plug }) => ({ word, plug })) };
}

/**
 * המסלול בעברית פשוטה — שורה לכל צעד: "הוסף את X וחבר אותו ל-Y", ומתחתיה מה X מקבל ומאיפה.
 * ואחר-כך מה שחסר: "חסר מנוע שנותן X". אין מה להוסיף ⇒ שורה אחת שאומרת זאת.
 */
export function routeText(route: Route, nameOf: (id: string) => string): string[] {
  const nm = (id: string): string => (id === GOAL ? 'התוצאה שביקשת' : nameOf(id));
  const lines: string[] = [];
  for (const step of route.steps) {
    const targets: string[] = [];
    for (const l of route.links) if (l.giver === step.add && !targets.includes(l.needer)) targets.push(l.needer);
    lines.push(
      targets.length
        ? `הוסף את ${nm(step.add)} וחבר אותו ל-${targets.map(nm).join(' ול-')}`
        : `הוסף את ${nm(step.add)}`,
    );
    for (const l of route.links) {
      if (l.needer === step.add) lines.push(`${nm(step.add)} מקבל ${plugName(l.plug)} מ-${nm(l.giver)}`);
    }
  }
  for (const plug of route.missing) lines.push(`חסר מנוע שנותן ${plugName(plug)}`);
  if (!lines.length) lines.push('כבר יש לך את כל מה שצריך — אין מה להוסיף');
  return lines;
}
