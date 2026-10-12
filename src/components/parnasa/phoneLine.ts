/**
 * 📒 פרנסה׳לע — 📞 מודל הקו (אשכול 6 · מנוע טהור, ניטרלי-ספק): מה קו-טלפון כשר **היה** אומר.
 *
 * הכרעה 5 עומדת: אין כאן IVR, אין ספק (לא ימות-המשיח, לא FreeSWITCH), אין שרת, אין רשת, אין
 * store/DOM — רק עץ-התפריט ונוסחי-ההקראה בעברית, שמתאם עתידי ירנדר (הקלטות או TTS). "עכשיו"
 * מוזרק (nowMs) והמיקום מההגדרות (db.ui.parnasa.zmanim) — אותו קלט ⇒ אותו עץ, תו-בתו.
 *
 * כללי-התכנון (ניסויי-השטח של המקור — PARNASSALE-SPEC §8):
 *   · זיהוי-דיבור מחטיא ~16% מהמילים ⇒ כל צומת-דיבור מקבל גם מקשים ("אמרו או הקישו").
 *   · לכל עסק קוד-חיוג בן 3 ספרות מהחוברת ⇒ "כוכבית + הקוד" מהתפריט הראשי.
 *   · אין פעולה בלי אישור: חיבור-שיחה רק דרך צומת-אישור (1 אישור · 2 ביטול); דיבור וקוד-חיוג
 *     מחזירים צומת-אישור ("שמעתי: … — לאישור הקישו 1"), לעולם לא פעולה ישירה.
 *   · עימוד: עד 8 בחירות (1–8), 9 = עוד, 0 = חזרה; עסקים — 4 בכל פעם, כמו המקור.
 *   · מקשים קבועים בתפריט הראשי (1 עסקים · 2 זמנים · 3 הודעות · 4 חירום · כוכבית קוד · 0 שוב) —
 *     מתקשר שזוכר רצף-מקשים לא "נופל" כשהתוכן משתנה.
 *   · שבת/יו״ט (מלוח-המנוע) ⇒ השורש = הודעת-סגירה סופית (המקור: עונה בברכת שבת ומנתק); גם
 *     קוד-חיוג ודיבור מחזירים אותה — אין מסלול לחיבור-שיחה בשבת.
 * מה מהמקור **לא** כאן (דורש נתוני-מתקשר/כתיבה — מחוץ להכרעה 5): זיהוי-מתקשר, "#" לעסק האחרון,
 * שאלת-האזור וסדר "מי שקיבל הכי מעט שיחות", הקלטת-בקשה, הצטרפות-בטלפון, מונה-שיחות לקופה.
 *
 * פרטיות: רק עסקים **מאושרים** ומודעות-לוח **מאושרות ופעילות**. בקשות-תושבים אינן בקלט בכלל, ואף
 * פרט-מבקש; הערה-פנימית, המלצות, מחירון וחותמות-ביקורת לא נקראים; ספרות-חיוג (tel) רק מטלפון-עסק
 * או ממספר-חירום — לעולם לא מטקסט-חופשי. בידוד (הכרעה 4): אפס כסף/קבלות/אירועים.
 */
import type { ParnasaPrefs, PrListing, PrPost } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { termOf } from '../../lib/config';
import {
  categoryOf,
  dialCodeHolders,
  dialCodeOf,
  groupByCategory,
  listingStatus,
  PR_AUD_NAMES,
  PR_CONCEPTS,
  PR_MARK_LABELS,
  prNorm,
  redactContact,
  searchListings,
  uniqueGates,
  type PrOpenState,
  type PrSearchCtx,
} from './lib';
import {
  addDaysIso,
  buildZmanimBoard,
  clockAt,
  dayInfo,
  dayTimes,
  dayZmanim,
  dowOfIso,
  hebDateText,
  isIsoDate,
  locNote,
  makeClosureFn,
  postActiveOn,
  PR_DAY_NAMES,
  PR_ZMANIM_NOTE,
  resolveTimeToken,
  resolveZmanimLoc,
  type PrZman,
  type PrZmanimBoard,
  type PrZmanimLoc,
} from './zmanimBoard';

/* ═══════════════ קבועים ═══════════════ */

/** תקרת-אורך לנוסח-צומת (תווים). משפט שלא נכנס כולו נשמט מהסוף (הסדר = סדר-החשיבות); האפשרויות נפרדות ולא נחתכות. */
export const PHONE_PROMPT_MAX = 700;
/** תקרת-אורך לנוסח-אפשרות ("… — הקישו 3"). */
export const PHONE_SAY_MAX = 160;
/**
 * גודל-עמוד: 9 = עוד ו-0 = חזרה ⇒ לכל היותר 8 בחירות. עסקים — 4 בכל פעם, כמו המקור ("קורא 4 עסקים,
 * [9] לעוד": מתקשר לא זוכר 8 שמות); ניתן לשינוי ב-listingsPerPage (1–8). מודעות נארזות גם לפי אורך.
 */
export const PHONE_PAGE = { categories: 8, listings: 4, emergency: 8, notices: 3 } as const;
/** כמה מודעות-לוח לכל היותר נקראות בקו (נעוצות ראשונות, אח"כ החדשות). */
export const PHONE_NOTICES_MAX = 12;

/** תקרות-שדה (תווים) לטקסט-משתמש שנקרא בקול. */
const CAP = { name: 40, title: 60, area: 30, label: 40, notice: 110, community: 60, echo: 60 } as const;
/**
 * ציון-מושג "ודאי" בסולם tokMatch של lib.ts (זהה 3 · תחילית 2.8 · גזע 2.6/2.5 · תחילת-מילה 2.2) —
 * מתחתיו (שגיאת-כתיב 1.6, שתי-אותיות 1.2) המושג לא קובע את התחום בדיבור.
 */
const SURE_CONCEPT = 2.2;

/* ═══════════════ טיפוסים ═══════════════ */

/** מקש בתפריט: מה נאמר עליו ולאן הוא מוביל. */
export interface PhoneOption {
  /** '0'–'9' · '*' · '#'. */
  digit: string;
  /** הנוסח ("לזמני היום הקישו 2"). */
  say: string;
  /** מזהה צומת-היעד. */
  to: string;
}

/**
 * פעולה שהמתאם מבצע בכניסה לצומת. connect — רק בצומת מסוג 'connect', שאליו מגיעים **רק** מצומת-
 * אישור. tel = ספרות בלבד (ו-+ מוביל), מטלפון-עסק או ממספר-חירום.
 */
export type PhoneAction =
  | { kind: 'connect'; tel: string; label: string; listingId?: string; dialCode?: string }
  | { kind: 'readNumber'; tel: string; groups: string[] };

export type PhoneNodeKind = 'menu' | 'list' | 'listing' | 'info' | 'number' | 'confirm' | 'connect' | 'input' | 'closed';

export interface PhoneNode {
  id: string;
  kind: PhoneNodeKind;
  /** שם קצר (העסק / התחום / המסך) — לאישורים ולתצוגה-המקדימה. */
  label: string;
  /** מה הקו אומר בכניסה לצומת, בלי האפשרויות — עד PHONE_PROMPT_MAX. */
  prompt: string;
  /** בסדר-ההקראה. צומת בלי אפשרויות ובלי איסוף = סופי: הקו אומר ומסיים (או מחבר). */
  options: PhoneOption[];
  /** מקבל גם דיבור — ותמיד גם מקשים ("אמרו או הקישו"). */
  speech?: boolean;
  /** צומת-הקשה: כמה ספרות לאסוף (קוד-חיוג = 3) ⇒ resolveDialCode. */
  collect?: number;
  action?: PhoneAction;
}

export interface PhoneMenu {
  /** 'main' — או 'closed' בשבת/יו״ט. */
  root: string;
  /** כל הצמתים, בסדר-בנייה דטרמיניסטי (= סדר-התסריט). */
  nodes: Record<string, PhoneNode>;
  /** קוד-חיוג (3 ספרות) ⇒ צומת-העסק. מאושרים בלבד; קוד כפול לא נענה (fail-closed). */
  codes: Record<string, string>;
  /** הקו סגור ברגע-הבנייה (שבת/יו״ט). */
  closed: boolean;
  /** הרגע שהעץ נבנה לו, בשעון-הקהילה ("YYYY-MM-DD HH:MM"). */
  asOf: string;
  /** שם-הקו כפי שנאמר ("פרנסה׳לע של …"). */
  brand: string;
}

export interface PhoneMenuInput {
  /** עסקי-המדריך — רק המאושרים נקראים. */
  listings: readonly PrListing[];
  /** מודעות-הלוח — רק המאושרות והפעילות (הודעות/אירועים ⇒ 3; מניינים ⇒ 2; חירום ⇒ 4). */
  posts: readonly PrPost[];
  /** db.ui.parnasa — שם-הקהילה ומיקום-הזמנים. */
  prefs?: ParnasaPrefs | null;
  /** הרגע (epoch ms) — מוזרק; השעון נגזר באזור-הזמן של הקהילה, לא של המכשיר. */
  nowMs: number;
  /** דריסת מיקום-הזמנים (ברירה: resolveZmanimLoc(prefs.zmanim)). */
  loc?: PrZmanimLoc;
  /** מונחי-הארגון (nav.parnasa · entity.prListing/s) — חסר ⇒ ברירות-המחדל. */
  config?: OrgConfig;
  /** עסקים בעמוד (1–8) — ברירה PHONE_PAGE.listings. */
  listingsPerPage?: number;
}

/** תוצאת קוד-חיוג/דיבור: צומת-אישור דינמי (לא חלק מ-menu.nodes) — לעולם בלי פעולה. */
export interface PhoneResolution {
  found: boolean;
  /** לאן "1 = אישור" מוביל ('' כשלא נמצא). */
  target: string;
  confirm: PhoneNode;
}

/* ═══════════════ עזרי-הקראה ═══════════════ */

/** תווים שלא נאמרים, או שמתאם-קול עלול לפרש כתחביר: בקרה, כיווניות, אימוג׳י וסמלים. */
const UNSPEAKABLE = /[\p{Cc}\p{Cf}\p{Extended_Pictographic}<>{}[\]|\\^`=&#*_~]/gu;

/** טקסט-משתמש ⇒ בר-הקראה: בלי UNSPEAKABLE ובוררי-וריאציה, רווחים מכווצים. */
function speakable(s: unknown): string {
  return String(s ?? '')
    .replace(UNSPEAKABLE, ' ')
    .replace(/\uFE0F|\u20E3/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** חיתוך בגבול-מילה עם "…" (באמצע מילה רק כשאין רווח בחצי השני). */
function clip(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp >= n / 2 ? cut.slice(0, sp) : cut).replace(/[\s,.;:־–—-]+$/u, '') + '…';
}

/** טקסט-משתמש ⇒ הקראה מוגבלת. */
const said = (s: unknown, n: number): string => clip(speakable(s), n);

/**
 * משפטים ⇒ נוסח אחד עד התקרה: משפט שלא נכנס נשמט, וכל מה שאחריו (הסדר = סדר-החשיבות; הראשון
 * נחתך אם צריך). מיוצא גם למתאם — נוסחים משלו ("בחירה לא תקינה") באותה תקרה.
 */
export function phonePrompt(parts: readonly string[], max: number = PHONE_PROMPT_MAX): string {
  let out = '';
  for (const raw of parts) {
    const p = raw.replace(/\s+/g, ' ').trim();
    if (!p) continue;
    const next = out ? out + ' ' + p : p;
    if (next.length > max) {
      if (!out) out = clip(p, max);
      break;
    }
    out = next;
  }
  return out;
}

/** קיצורים במחרוזות-המנוע ⇒ מילים מלאות להקראה (נתוני-משתמש לא נוגעים). */
const ABBR: ReadonlyArray<readonly [RegExp, string]> = [
  [/מוצ״ש/g, 'מוצאי שבת'],
  [/ק״ש/g, 'קריאת שמע'],
  [/יו״ט/g, 'יום טוב'],
];
const expand = (s: string): string => ABBR.reduce((t, [re, w]) => t.replace(re, w), s);

const opt = (digit: string, say: string, to: string): PhoneOption => ({ digit, say: clip(say, PHONE_SAY_MAX), to });

/* ═══════════════ ספרות-חיוג ═══════════════ */

const DIGIT_WORDS = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'] as const;

/** ספרות-חיוג מטלפון שמור: ספרות בלבד (ו-+ מוביל), 3–15 ספרות — כולל מספרי-חירום קצרים; אחרת ''. */
export function phoneTel(phone: unknown): string {
  const raw = String(phone ?? '').trim();
  const d = raw.replace(/\D/g, '');
  if (d.length < 3 || d.length > 15) return '';
  return (raw.startsWith('+') ? '+' : '') + d;
}

/** קבוצות-הקראה: קצר (≤4) כמות-שהוא · קווי (9 ספרות, 0…) 2-3-4 · אחר — שלשות, ספרה בודדת בסוף מצטרפת (נייד ⇒ 3-3-4). */
export function telGroups(tel: string): string[] {
  const d = String(tel ?? '').replace(/\D/g, '');
  if (d.length <= 4) return d ? [d] : [];
  if (d.length === 9 && d[0] === '0') return [d.slice(0, 2), d.slice(2, 5), d.slice(5)];
  const out: string[] = [];
  for (let i = 0; i < d.length; i += 3) out.push(d.slice(i, i + 3));
  if (out.length > 1 && out[out.length - 1].length === 1) {
    const last = out.pop() ?? '';
    out[out.length - 1] += last;
  }
  return out;
}

/** הקראה ספרה-ספרה, הפסקה בין קבוצות: "אפס חמש אפס, אפס אפס אפס, אפס אחת אפס אחת"; + ⇒ "פלוס". */
export function speakDigits(tel: string): string {
  const groups = telGroups(tel).map((g) => [...g].map((c) => DIGIT_WORDS[Number(c)]).join(' '));
  return (String(tel ?? '').trim().startsWith('+') ? 'פלוס ' : '') + groups.join(', ');
}

/* ═══════════════ עזרי-עסקים ═══════════════ */

const bizId = (id: unknown): string => 'biz/' + encodeURIComponent(String(id));
const nameOf = (l: PrListing): string => said(l.name, CAP.name) || said(l.title, CAP.name) || 'ללא שם';
const statusText = (st: PrOpenState | null, full: boolean): string => (st ? expand(full && st.sub ? st.t + ', ' + st.sub : st.t) : '');

/** שורת-רשימה: שם · אזור · פתוח/סגור עכשיו. */
function listingLine(l: PrListing, st: PrOpenState | null): string {
  return [nameOf(l), said(l.area || l.city, CAP.area), statusText(st, false)].filter(Boolean).join(', ');
}

/* ═══════════════ עימוד ═══════════════ */

interface PageSpec<T> {
  /** 'cats' ⇒ 'cats/1', 'cats/2' … */
  base: string;
  per: number;
  items: readonly T[];
  label: string;
  speech?: boolean;
  head: (page: number, pages: number) => string[];
  empty: string[];
  item: (x: T, digit: string) => PhoneOption;
  /** "0" בעמוד הראשון (מעמוד n>1 — לעמוד הקודם). */
  back: PhoneOption;
}

/** רשימה בעמודים: 1..per בחירות · 9 = עוד (אם יש) · 0 = חזרה. רשימה ריקה ⇒ עמוד אחד עם הנוסח-הריק ו-0. */
function addPaged<T>(add: (n: PhoneNode) => void, s: PageSpec<T>): void {
  const pages = Math.max(1, Math.ceil(s.items.length / s.per));
  for (let p = 1; p <= pages; p++) {
    const slice = s.items.slice((p - 1) * s.per, p * s.per);
    const options = slice.map((x, i) => s.item(x, String(i + 1)));
    if (p < pages) options.push(opt('9', 'לשמיעת האפשרויות הבאות הקישו 9', `${s.base}/${p + 1}`));
    options.push(p === 1 ? s.back : opt('0', 'לחזרה לעמוד הקודם הקישו 0', `${s.base}/${p - 1}`));
    add({
      id: `${s.base}/${p}`,
      kind: 'list',
      label: s.label,
      prompt: phonePrompt(slice.length ? s.head(p, pages) : s.empty),
      options,
      ...(s.speech && slice.length ? { speech: true } : {}),
    });
  }
}

const pageSize = (n: unknown, dflt: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(8, Math.max(1, Math.floor(n))) : dflt;

/* ═══════════════ זמני היום ═══════════════ */

const OPINION_KEYS = new Set(['shmaMga', 'shmaGra', 'tefila']);

/** תווית-הזמן להקראה: מתווית-המנוע, קיצורים פתוחים, ושיטה ("לפי הגר״א") או ערב-השבת/החג. */
function zmanLabel(z: PrZman): string {
  const label = expand(z.label);
  if (z.key === 'candle') return z.sub ? label + ', ' + z.sub : label;
  if (OPINION_KEYS.has(z.key) && z.sub) return label + ' לפי ה' + z.sub;
  return label;
}

/**
 * הקראת-הזמנים: התאריך העברי (מתחלף בשקיעה) · אופק · אחרי השקיעה — מה שנשאר הערב ואז זמני היום
 * העברי הבא (התאריך והשעות תואמים) · השבת — **הנוכחית** בשבת עצמה, אחרת הקרובה (shabbatOf) ·
 * המניין הבא · הערת-האמון ההלכתית.
 */
function zmanimParts(board: PrZmanimBoard, loc: PrZmanimLoc): string[] {
  const { clock, hebDate: hd, shabbat: sh } = board;
  const night = hd.night && isIsoDate(hd.anchorIso);
  const dayIso = night ? hd.anchorIso : clock.iso;
  const rows = night ? dayZmanim(dayIso, loc) : board.zmanim;
  const cls = dayInfo(dayIso, loc).cls;
  const special = cls.dow === 6 && !cls.yomTov ? '' : cls.name ?? '';
  const dayName = PR_DAY_NAMES[dowOfIso(dayIso)] ?? '';
  const parts: string[] = [];
  if (hd.text) {
    parts.push((night ? `הערב, אור ליום ${dayName}, ${hd.text}` : `היום יום ${dayName}, ${hd.text}`) + (special ? ', ' + special : '') + '.');
  }
  parts.push(`הזמנים ${said(locNote(loc), 80)}.`); // תווית-מיקום לא-מרופאת לא דוחקת את הזמנים החוצה
  if (night) {
    const tonight = board.zmanim.filter((z) => !z.past && z.time && (z.key === 'tzeis' || z.key === 'end' || z.key === 'rt'));
    if (tonight.length) parts.push('הערב: ' + tonight.map((z) => zmanLabel(z) + ' ' + z.time).join(', ') + '.');
  }
  const timed = rows.filter((r) => r.time);
  if (!timed.length) parts.push('הזמנים אינם זמינים למיקום הזה.');
  for (const r of timed) parts.push(`${zmanLabel(r)} ${r.time}.`);
  if (sh.satIso && dayIso !== sh.satIso) {
    const bits = [
      sh.candle && dayIso !== sh.friIso ? 'הדלקת נרות בערב שבת ' + sh.candle : '',
      sh.end ? 'צאת השבת ' + sh.end : '',
      sh.rabbeinuTam ? 'רבנו תם ' + sh.rabbeinuTam : '',
    ].filter(Boolean);
    const head = (sh.current ? 'השבת' : 'השבת הקרובה, ' + sh.hebDate) + (sh.holiday ? ', ' + sh.holiday : '');
    if (bits.length) parts.push(`${head}: ${bits.join(', ')}.`);
  }
  if (sh.mevarchim) parts.push(`שבת מברכים חודש ${sh.mevarchim}.`);
  const m = board.nextMinyan;
  if (m) parts.push(`המניין הבא: ${said(m.prayer, CAP.label)} בשעה ${m.time}, ${said(m.shul, CAP.label)}.`);
  for (const s of PR_ZMANIM_NOTE.split('·')) parts.push(s.trim() + '.');
  return parts;
}

/* ═══════════════ הודעות הקהילה ═══════════════ */

/** סוגי-ההודעה (המקור, PARNASSALE-SPEC §1.4). Map — מפתח-נתונים לא נוגע ב-prototype. */
const NOTICE_LABELS: ReadonlyMap<string, string> = new Map([
  ['simcha', 'מזל טוב'],
  ['avel', 'אבלות'],
  ['shiur', 'שיעורים'],
  ['refuah', 'לרפואה'],
  ['gemach', 'גמ״חים'],
  ['mosad', 'מוסדות'],
  ['lost', 'אבידות'],
  ['kiddush', 'קידושא'],
  ['sale', 'מכירה'],
]);

/** השוואת-קוד (ISO/מזהים) — לא localeCompare, שסדרו תלוי בגרסת-ICU של הסביבה. */
const cmp = (x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0);

/** הודעות ואירועים מאושרים ופעילים היום (אירוע שתאריכו עבר — לא); נעוצות ראשונות, אח"כ החדשות; עד התקרה. */
function boardNotices(posts: readonly PrPost[], today: string): PrPost[] {
  return posts
    .filter((p) => (p.kind === 'notice' || p.kind === 'event') && postActiveOn(p, today) && !(p.kind === 'event' && p.date && p.date < today))
    .slice()
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || cmp(String(b.createdAt), String(a.createdAt)) || cmp(String(a.id), String(b.id)))
    .slice(0, PHONE_NOTICES_MAX);
}

/** מתי: היום / מחר / ביום X (תאריך עברי) או "בימי …", ושעה (גם טוקן יחסי לזמנים: sh-15). */
function whenOf(p: PrPost, today: string, loc: PrZmanimLoc): string {
  const d = isIsoDate(p.date) ? p.date : '';
  const days = [...new Set(Array.isArray(p.days) ? p.days : [])].filter((x) => Number.isInteger(x) && x >= 0 && x <= 6).sort((a, b) => a - b);
  const day = d
    ? d === today
      ? 'היום'
      : d === addDaysIso(today, 1)
        ? 'מחר'
        : `ביום ${PR_DAY_NAMES[dowOfIso(d)]}, ${hebDateText(d, loc.tz)}`
    : days.length
      ? 'בימי ' + days.map((x) => PR_DAY_NAMES[x]).join(', ')
      : '';
  const time = p.time ? resolveTimeToken(p.time, dayTimes(d || today, loc)) : '';
  const s = [day, time ? 'בשעה ' + time : ''].filter(Boolean).join(' ');
  return s ? s + '.' : '';
}

/** הודעה להקראה: סוג · כותרת · טקסט (מוגבל) · מקום · מתי. הטלפון שבמודעה לא נקרא ולא מחויג. */
function noticeLine(p: PrPost, today: string, loc: PrZmanimLoc): string {
  const label = p.kind === 'event' ? 'אירוע' : NOTICE_LABELS.get(String(p.noticeKind)) ?? 'הודעה';
  const title = said(p.title, CAP.label);
  const text = said(p.text, CAP.notice);
  const place = said(p.place, CAP.area);
  const head = title || text || 'ללא כותרת';
  return [(head.startsWith(label) ? head : `${label}: ${head}`) + '.', title && text ? text + '.' : '', place ? place + '.' : '', whenOf(p, today, loc)]
    .filter(Boolean)
    .join(' ');
}

/* ═══════════════ בניית העץ ═══════════════ */

/**
 * עץ-הקו לרגע נתון. השורש: ברכה עם שם-הקהילה ו-1 עסקים (או לומר מה צריך) · 2 זמני היום ·
 * 3 הודעות הקהילה · 4 מספרי חירום · כוכבית + קוד · 0 שמיעה חוזרת. בשבת/יו״ט — השורש הוא
 * הודעת-הסגירה (סופית); שאר העץ נבנה בכל זאת לתצוגה-המקדימה ולתסריט.
 */
export function buildPhoneMenu(input: PhoneMenuInput): PhoneMenu {
  const prefs = input.prefs ?? {};
  const loc = input.loc ?? resolveZmanimLoc(prefs.zmanim);
  const clock = clockAt(input.nowMs, loc.tz);
  const today = clock.iso;
  const closureAt = makeClosureFn(loc);
  const board = buildZmanimBoard(clock, loc, input.posts);
  const T = (k: string, fb: string): string => (input.config ? termOf(input.config, k, fb) : fb);
  const brandName = said(T('nav.parnasa', 'פרנסה׳לע'), CAP.label) || 'פרנסה׳לע';
  const community = said(prefs.communityName, CAP.community);
  const brand = community ? brandName + ' של ' + community : brandName;
  const one = said(T('entity.prListing', 'עסק'), CAP.label) || 'עסק';
  const many = said(T('entity.prListings', 'עסקים'), CAP.label) || 'עסקים';
  const countOf = (n: number): string => (n === 1 ? one + ' אחד' : n + ' ' + many);
  const per = pageSize(input.listingsPerPage, PHONE_PAGE.listings);

  const nodes: Record<string, PhoneNode> = {};
  const add = (n: PhoneNode): void => {
    if (!Object.hasOwn(nodes, n.id)) nodes[n.id] = n;
  };

  // ── סגירת שבת/יו״ט — ראשונה בעץ (היא השורש) ──
  const cl = board.closure;
  if (cl.closed) {
    const reason = said(cl.reason, CAP.label) || 'שבת';
    const motzei = cl.motzei === 'מוצ״ש' ? 'במוצאי שבת' : 'במוצאי החג';
    add({
      id: 'closed',
      kind: 'closed',
      label: 'הקו סגור',
      prompt: phonePrompt([(cl.kind === 'shabbat' ? 'שבת שלום! ' : '') + `הקו של ${brand} סגור עכשיו ב${reason}, ויחזור לפעול ${motzei}${cl.endTime ? ' בשעה ' + cl.endTime : ''}.`]),
      options: [],
    });
  }

  // ── עסקים: רק מאושרים (groupByCategory), שערים לא-ריקים, בסדר-השערים; מודגש ראשון ואז שם ──
  const gates = uniqueGates(groupByCategory(input.listings, today));
  const total = gates.reduce((n, g) => n + g.items.length, 0);
  const hasBiz = total > 0;
  const statusCache = new Map<string, PrOpenState | null>();
  const statusOf = (l: PrListing): PrOpenState | null => {
    const k = String(l.id);
    if (!statusCache.has(k)) statusCache.set(k, listingStatus(l, clock, closureAt));
    return statusCache.get(k) ?? null;
  };
  // קוד-חיוג: אותו כלל כמו "דורש טיפול" של הגבאי (lib.ts — dialCodeHolders), כדי שכל קוד שהקו מסרב לו יוצג שם
  const holders = dialCodeHolders(gates);
  /** קוד תקין וייחודי — כפול לא נענה בקו (fail-closed: לא מחברים לעסק הלא-נכון). */
  const codeOf = (l: PrListing): string => {
    const c = dialCodeOf(l);
    return c && holders.get(c)?.length === 1 ? c : '';
  };
  const codes: Record<string, string> = {};
  for (const g of gates) {
    for (const l of g.items) {
      const c = codeOf(l);
      if (c) codes[c] = bizId(l.id);
    }
  }

  // ── התפריט הראשי (מקשים קבועים) ──
  add({
    id: 'main',
    kind: 'menu',
    label: 'התפריט הראשי',
    prompt: phonePrompt([community ? `שלום וברוכים הבאים לקו של ${brand}.` : `שלום וברוכים הבאים לקו של ${brand}, מדריך בעלי המקצוע של הקהילה.`]),
    options: [
      opt('1', hasBiz ? `ל${many} הקישו 1 — או פשוט אמרו מה אתם צריכים` : `ל${many} הקישו 1`, 'cats/1'),
      opt('2', 'לזמני היום הקישו 2', 'zmanim'),
      opt('3', 'להודעות הקהילה הקישו 3', 'notices/1'),
      opt('4', 'למספרי חירום הקישו 4', 'emergency/1'),
      opt('*', 'יש לכם קוד של עסק מהחוברת? הקישו כוכבית ואת שלוש הספרות', 'code'),
      opt('0', 'לשמיעה חוזרת הקישו 0', 'main'),
    ],
    ...(hasBiz ? { speech: true } : {}),
  });

  // ── תחומי המקצוע (1–8 · 9 עוד · 0 חזרה) ──
  const catsPageOf = (i: number): number => Math.floor(i / PHONE_PAGE.categories) + 1;
  addPaged(add, {
    base: 'cats',
    per: PHONE_PAGE.categories,
    items: gates,
    label: 'תחומי המקצוע',
    speech: true,
    head: (p, pages) => [
      p === 1 ? `במדריך ${countOf(total)} ב${gates.length === 1 ? 'תחום אחד' : '־' + gates.length + ' תחומים'}.` : `תחומים נוספים — עמוד ${p} מתוך ${pages}.`,
      'אמרו מה אתם צריכים, או הקישו את מספר התחום.',
    ],
    empty: [`עדיין אין ${many} במדריך.`],
    item: (g, d) => opt(d, `${g.cat.name} (${countOf(g.items.length)}) — הקישו ${d}`, `cat/${g.cat.key}/1`),
    back: opt('0', 'לחזרה לתפריט הראשי הקישו 0', 'main'),
  });

  // ── כרטיס-עסק: הקראה קצרה · 1 התקשרות (⇒ אישור) · 2 המספר ספרה-ספרה · 0 חזרה ──
  const addListing = (l: PrListing, backTo: string): void => {
    const id = bizId(l.id);
    const name = nameOf(l);
    const tel = phoneTel(l.phone) || phoneTel(l.phone2);
    const code = codeOf(l);
    const title = said(l.title, CAP.title);
    const area = said(l.area || l.city, CAP.area);
    const status = statusText(statusOf(l), true);
    const kashrut = said(l.kashrut, CAP.area);
    const marks = [
      l.aud === 'men' || l.aud === 'women' ? PR_AUD_NAMES[l.aud] : '',
      l.disc === true ? PR_MARK_LABELS.disc : '',
      l.free === true ? PR_MARK_LABELS.free : '',
      l.emergency === true ? PR_MARK_LABELS.emergency : '',
      kashrut ? 'השגחה: ' + kashrut : '',
    ].filter(Boolean);
    const back = opt('0', 'לחזרה הקישו 0', backTo);
    add({
      id,
      kind: 'listing',
      label: name,
      prompt: phonePrompt([
        name + '.',
        title && title !== name ? title + '.' : '',
        area ? area + '.' : '',
        status ? status + '.' : '',
        marks.length ? marks.join(', ') + '.' : '',
        tel ? '' : 'אין מספר טלפון במדריך.',
        code ? `הקוד בקו: ${speakDigits(code)}. בפעם הבאה אפשר להקיש כוכבית ואת הקוד ישר מהתפריט הראשי.` : '',
      ]),
      options: tel ? [opt('1', 'להתקשרות הקישו 1', id + '/confirm'), opt('2', 'לשמיעת מספר הטלפון הקישו 2', id + '/number'), back] : [back],
    });
    if (!tel) return;
    add({
      id: id + '/number',
      kind: 'number',
      label: 'מספר הטלפון של ' + name,
      prompt: phonePrompt([`מספר הטלפון של ${name}: ${speakDigits(tel)}.`]),
      options: [opt('1', 'להתקשרות הקישו 1', id + '/confirm'), opt('2', 'לשמיעה חוזרת הקישו 2', id + '/number'), opt('0', 'לחזרה הקישו 0', id)],
      action: { kind: 'readNumber', tel, groups: telGroups(tel) },
    });
    add({
      id: id + '/confirm',
      kind: 'confirm',
      label: 'אישור התקשרות — ' + name,
      prompt: phonePrompt([`להתקשר עכשיו אל ${name}?`]),
      options: [opt('1', 'לאישור הקישו 1', id + '/call'), opt('2', 'לביטול הקישו 2', id)],
    });
    add({
      id: id + '/call',
      kind: 'connect',
      label: name,
      prompt: phonePrompt([`מחברים אתכם אל ${name}. נא להמתין על הקו.`]),
      options: [],
      action: { kind: 'connect', tel, label: name, listingId: String(l.id), ...(code ? { dialCode: code } : {}) },
    });
  };

  // ── עסקי כל תחום (4 בעמוד · 9 עוד · 0 חזרה), כל אחד: שם · אזור · פתוח/סגור עכשיו ──
  gates.forEach((g, gi) => {
    const base = `cat/${g.cat.key}`;
    addPaged(add, {
      base,
      per,
      items: g.items,
      label: g.cat.name,
      head: (p, pages) => [p === 1 ? `${g.cat.name}: ${countOf(g.items.length)}.` : `${g.cat.name} — עמוד ${p} מתוך ${pages}.`],
      empty: [],
      item: (l, d) => opt(d, `${listingLine(l, statusOf(l))} — הקישו ${d}`, bizId(l.id)),
      back: opt('0', 'לחזרה לרשימת התחומים הקישו 0', `cats/${catsPageOf(gi)}`),
    });
    g.items.forEach((l, li) => addListing(l, `${base}/${Math.floor(li / per) + 1}`));
  });

  // ── 2 · זמני היום ──
  add({
    id: 'zmanim',
    kind: 'info',
    label: 'זמני היום',
    prompt: phonePrompt(zmanimParts(board, loc)),
    options: [opt('1', 'לשמיעה חוזרת הקישו 1', 'zmanim'), opt('0', 'לחזרה לתפריט הראשי הקישו 0', 'main')],
  });

  // ── 3 · הודעות הקהילה — נארזות לעמודים לפי מספר ואורך (אף הודעה לא נחתכת החוצה בשקט) ──
  const lines = boardNotices(input.posts, today).map((p) => noticeLine(p, today, loc));
  const noticePages: string[][] = [];
  for (const ln of lines) {
    const cur = noticePages[noticePages.length - 1];
    // 60 תווים שמורים לכותרת-העמוד ("הודעות נוספות — עמוד 4 מתוך 4.") ⇒ phonePrompt לעולם לא משמיט הודעה
    if (cur && cur.length < PHONE_PAGE.notices && [...cur, ln].join(' ').length <= PHONE_PROMPT_MAX - 60) cur.push(ln);
    else noticePages.push([ln]);
  }
  const np = Math.max(1, noticePages.length);
  for (let p = 1; p <= np; p++) {
    const items = noticePages[p - 1] ?? [];
    const head = !lines.length
      ? 'אין כרגע הודעות בלוח הקהילה.'
      : p === 1
        ? `הודעות הקהילה: ${lines.length === 1 ? 'הודעה אחת' : lines.length + ' הודעות'}.`
        : `הודעות נוספות — עמוד ${p} מתוך ${np}.`;
    const options: PhoneOption[] = [];
    if (items.length) options.push(opt('1', 'לשמיעה חוזרת הקישו 1', `notices/${p}`));
    if (p < np) options.push(opt('9', 'להודעות נוספות הקישו 9', `notices/${p + 1}`));
    options.push(p === 1 ? opt('0', 'לחזרה לתפריט הראשי הקישו 0', 'main') : opt('0', 'לחזרה לעמוד הקודם הקישו 0', `notices/${p - 1}`));
    add({ id: `notices/${p}`, kind: 'info', label: 'הודעות הקהילה', prompt: phonePrompt([head, ...items]), options });
  }

  // ── 4 · מספרי חירום: כל מספר ⇒ אישור ⇒ חיבור ──
  const ems = board.emergency
    .map((e) => ({ label: said(e.label, CAP.label) || said(e.phone, CAP.label), tel: phoneTel(e.phone) }))
    .filter((e) => e.tel)
    .map((e, i) => ({ ...e, n: i + 1, page: Math.floor(i / PHONE_PAGE.emergency) + 1 }));
  addPaged(add, {
    base: 'emergency',
    per: PHONE_PAGE.emergency,
    items: ems,
    label: 'מספרי חירום',
    head: (p, pages) => [p === 1 ? 'מספרי חירום — בחרו, ואחרי אישור נחבר אתכם. בסכנת חיים אפשר גם לנתק ולחייג ישירות.' : `מספרי חירום — עמוד ${p} מתוך ${pages}.`],
    empty: ['אין מספרי חירום מוגדרים.'],
    item: (e, d) => opt(d, `${e.label}, ${speakDigits(e.tel)} — הקישו ${d}`, `em/${e.n}/confirm`),
    back: opt('0', 'לחזרה לתפריט הראשי הקישו 0', 'main'),
  });
  for (const e of ems) {
    add({
      id: `em/${e.n}/confirm`,
      kind: 'confirm',
      label: 'אישור התקשרות — ' + e.label,
      prompt: phonePrompt([`להתקשר עכשיו אל ${e.label}, ${speakDigits(e.tel)}?`]),
      options: [opt('1', 'לאישור הקישו 1', `em/${e.n}/call`), opt('2', 'לביטול הקישו 2', `emergency/${e.page}`)],
    });
    add({
      id: `em/${e.n}/call`,
      kind: 'connect',
      label: e.label,
      prompt: phonePrompt([`מחברים אתכם אל ${e.label}.`]),
      options: [],
      action: { kind: 'connect', tel: e.tel, label: e.label },
    });
  }

  // ── כוכבית · קוד מהחוברת (3 ספרות; כוכבית שוב = ביטול — קוד יכול להתחיל ב-0) ──
  add({
    id: 'code',
    kind: 'input',
    label: 'קוד מהחוברת',
    prompt: phonePrompt(['הקישו את קוד העסק — שלוש הספרות שליד שמו בחוברת.']),
    options: [opt('*', 'לחזרה לתפריט הראשי הקישו כוכבית', 'main')],
    collect: 3,
  });

  return { root: cl.closed ? 'closed' : 'main', nodes, codes, closed: cl.closed, asOf: `${clock.iso} ${clock.hhmm}`, brand };
}

/* ═══════════════ קוד-חיוג ודיבור ⇒ צומת-אישור (לעולם לא פעולה) ═══════════════ */

/** בשבת/יו״ט: הודעת-הסגירה עצמה — סופית, בלי מסלול לחיבור. */
function closedResolution(menu: PhoneMenu): PhoneResolution {
  const node = menu.nodes[menu.root] ?? { id: 'closed', kind: 'closed', label: 'הקו סגור', prompt: 'הקו סגור עכשיו.', options: [] };
  return { found: false, target: '', confirm: node };
}

function foundAt(id: string, text: string, target: string, label: string, retry: PhoneOption): PhoneResolution {
  return { found: true, target, confirm: { id, kind: 'confirm', label, prompt: phonePrompt([text]), options: [opt('1', 'לאישור הקישו 1', target), retry] } };
}

function missedAt(id: string, text: string, retry: PhoneOption): PhoneResolution {
  return { found: false, target: '', confirm: { id, kind: 'info', label: 'לא נמצא', prompt: phonePrompt([text]), options: [retry, opt('0', 'לתפריט הראשי הקישו 0', 'main')] } };
}

/**
 * קוד-חיוג מהחוברת ⇒ צומת-אישור: "הקשתם אחת אפס אחת: <העסק>. לאישור הקישו 1" (1 ⇒ כרטיס-העסק,
 * שם עוד אישור לפני חיבור). לא-ידוע / לא בן 3 ספרות / כפול ⇒ "לא נמצא" עם הקשה-מחדש.
 */
export function resolveDialCode(menu: PhoneMenu, code: string): PhoneResolution {
  if (menu.closed) return closedResolution(menu);
  const c = String(code ?? '').replace(/\D/g, '').slice(0, 12);
  const target = /^\d{3}$/.test(c) && Object.hasOwn(menu.codes, c) ? menu.codes[c] : '';
  const node = target && Object.hasOwn(menu.nodes, target) ? menu.nodes[target] : undefined;
  const retry = opt('2', 'להקשת קוד אחר הקישו 2', 'code');
  if (!node) return missedAt('confirm/code', c.length === 3 ? `הקוד ${speakDigits(c)} לא נמצא במדריך.` : 'הקוד צריך להיות בן שלוש ספרות.', retry);
  return foundAt('confirm/code/' + c, `הקשתם ${speakDigits(c)}: ${node.label}.`, target, node.label, retry);
}

/**
 * דיבור (תמליל מזהה-הדיבור) בצומת-דיבור ⇒ צומת-אישור: "שמעתי: … — <העסק>. לאישור הקישו 1".
 * המנוע: קוד שנאמר בקול ("קוד 104" — רק כשזה כל מה שנאמר) ⇒ האינדקס של החוברת; אחרת "מה צריך?"
 * (searchListings — רק מאושרים) ⇒ העסק המתאים ביותר **בתחום שהובן** (מושג מוביל ⇒ דרכו או בשערו;
 * בלי מושג — שם, או טלפון שלם; מספר קצר בתוך משפט לא נחשב). ההד "שמעתי" מושחר מטלפון/מייל
 * (redactContact) ומוגבל באורך.
 * לא צומת-דיבור / לא נשמע / לא נמצא ⇒ "לא נמצא" עם ניסיון-נוסף (2) ותפריט ראשי (0).
 */
export function resolveSpeech(menu: PhoneMenu, nodeId: string, utterance: string, listings: readonly PrListing[], ctx: PrSearchCtx): PhoneResolution {
  if (menu.closed) return closedResolution(menu);
  const here = Object.hasOwn(menu.nodes, nodeId) ? menu.nodes[nodeId] : undefined;
  const retry = opt('2', 'לניסיון נוסף הקישו 2', here ? here.id : menu.root);
  if (!here?.speech) return missedAt('confirm/speech', 'כאן אפשר רק להקיש — בחרו מקש מהתפריט.', retry);
  const raw = String(utterance ?? '');
  const echo = said(redactContact(raw).replace(/•+/g, '…'), CAP.echo);
  if (!echo) return missedAt('confirm/speech', 'לא שמענו. אפשר לומר שוב מה אתם צריכים, או להקיש את מספר הבחירה.', retry);
  const heard = 'שמעתי: ' + echo;
  const id = 'confirm/speech/' + here.id;
  // קוד שנאמר בקול — רק כשזה כל מה שנאמר ("קוד 104" / "1 0 4"); מספר בתוך משפט אינו קוד.
  const spokenCode = /^(?:קוד )?(\d{3})$/.exec(prNorm(raw).replace(/(\d) (?=\d)/g, '$1'))?.[1] ?? '';
  if (spokenCode && Object.hasOwn(menu.codes, spokenCode)) {
    const t = menu.codes[spokenCode];
    const node = Object.hasOwn(menu.nodes, t) ? menu.nodes[t] : undefined;
    if (node) return foundAt(id, `${heard} — ${node.label}.`, t, node.label, retry);
  }
  // מספר בתוך משפט (כתובת, כמות) לא "מוצא" עסק לפי שבר-טלפון: רק מספר-טלפון שלם (≥7 ספרות) נשאר לחיפוש.
  const q = raw.replace(/(\d)[\s\-–.]+(?=\d)/g, '$1').replace(/\d+/g, (d) => (d.length >= 7 ? d : ' '));
  // 🛡 התחום שהובן קובע: כשזוהה מושג **בוודאות**, ההתאמה חייבת להיות בתחום של המושג המוביל (דרכו או
  // בשערו) — "רואה חשבון" בלי רו״ח במדריך לא "מוצא" מלמד ("חשבון" = גם שיעורי-חשבון). מושג ברמת
  // שגיאת-כתיב ("המספר" ≈ "מסגר") לא פוסל התאמת-שם/טלפון חזקה.
  const res = searchListings(q, listings, ctx, 5);
  const topCon = res.analysis.cons[0];
  const lead = topCon && topCon.s >= SURE_CONCEPT ? PR_CONCEPTS.find((c) => c.k === topCon.k) : undefined;
  const hit = res.hits.find((h) => Object.hasOwn(menu.nodes, bizId(h.listing.id)) && (!lead || h.via === lead.l || categoryOf(h.listing.category).key === lead.c));
  const concept = lead?.l ?? '';
  if (hit) {
    const target = bizId(hit.listing.id);
    const st = ctx.clock && ctx.closureAt ? listingStatus(hit.listing, ctx.clock, ctx.closureAt) : null;
    return foundAt(id, `${heard}${concept ? ' — ' + concept : ''}. נמצא: ${listingLine(hit.listing, st)}.`, target, menu.nodes[target].label, retry);
  }
  return missedAt(
    'confirm/speech',
    concept ? `${heard} — ${concept}. עדיין אין בעלי מקצוע בתחום הזה במדריך.` : `${heard}. לא מצאנו התאמה במדריך — אפשר לומר במילים אחרות.`,
    retry,
  );
}

/* ═══════════════ סימולטור · תסריט ═══════════════ */

/** צעד אחד בקו: הצומת הנוכחי + הספרות שנאספו בצומת-הקשה. */
export interface PhoneStepResult {
  node: PhoneNode;
  buf: string;
  /** false — הספרה רק נאספה (הצומת לא התחלף, כלום לא נאמר). */
  moved: boolean;
}

/**
 * מקש אחד ('0'–'9' '*' '#') — הלב של walkPhone, מיוצא לסימולטור (לשונית "📞 הקו") כדי שההליכה שם
 * תהיה **אותה** הליכה: מקש לא-חוקי ⇒ הקו חוזר על הצומת · צומת-הקשה אוסף ספרות עד collect ⇒
 * resolveDialCode (צומת-אישור דינמי) · צומת סופי (חיבור/סגירה) ⇒ null — הקו לא מקשיב.
 */
export function phoneStep(menu: PhoneMenu, at: { node: PhoneNode; buf: string }, key: string): PhoneStepResult | null {
  const cur = at.node;
  if (!cur.options.length && !cur.collect) return null;
  if (cur.collect && /\d/.test(key)) {
    const buf = at.buf + key;
    if (buf.length < cur.collect) return { node: cur, buf, moved: false };
    return { node: resolveDialCode(menu, buf).confirm, buf: '', moved: true };
  }
  const o: PhoneOption | undefined = cur.options.find((x) => x.digit === key);
  return { node: o && Object.hasOwn(menu.nodes, o.to) ? menu.nodes[o.to] : cur, buf: '', moved: true };
}

/**
 * סימולטור-מקשים (לבדיקות ולתצוגה-מקדימה): מהשורש, מקש אחר מקש ('0'–'9' '*' '#'; שאר התווים
 * מדולגים) ⇒ הצמתים שבהם ביקר. מקש לא-חוקי ⇒ הקו חוזר על הצומת. צומת-הקשה אוסף ספרות עד
 * collect ⇒ resolveDialCode (צומת-האישור הדינמי נכנס לרשימה). צומת סופי ⇒ ההליכה נעצרת.
 */
export function walkPhone(menu: PhoneMenu, keys: string | readonly string[]): PhoneNode[] {
  const seq = (typeof keys === 'string' ? keys : keys.join('')).replace(/[^0-9*#]/g, '');
  const root: PhoneNode | undefined = Object.hasOwn(menu.nodes, menu.root) ? menu.nodes[menu.root] : undefined;
  if (!root) return [];
  const out: PhoneNode[] = [root];
  let at = { node: root, buf: '' };
  for (const k of seq) {
    const r = phoneStep(menu, at, k);
    if (!r) break;
    at = { node: r.node, buf: r.buf };
    if (r.moved) out.push(r.node);
  }
  return out;
}

/** כל מה שהקו אומר בצומת — הנוסח ואחריו האפשרויות, לפי הסדר. */
export function nodeSpeech(node: PhoneNode): string {
  return [node.prompt, ...node.options.map((o) => o.say + '.')].filter(Boolean).join(' ');
}

/** סוג-הצומת בעברית — לתסריט ולתצוגה (לשונית "📞 הקו"). */
export const PHONE_KIND_LABELS: Readonly<Record<PhoneNodeKind, string>> = {
  menu: 'תפריט',
  list: 'רשימה',
  listing: 'כרטיס עסק',
  info: 'הקראה',
  number: 'הקראת מספר',
  confirm: 'אישור',
  connect: 'חיבור שיחה',
  input: 'הקשת קוד',
  closed: 'הקו סגור',
};
/** שם-המקש להקראה/תצוגה: כוכבית · סולמית · ספרה. */
export const phoneKeyName = (d: string): string => (d === '*' ? 'כוכבית' : d === '#' ? 'סולמית' : d);

/** תסריט-קריינות בטקסט-פשוט (להקלטת-הנוסחים בעתיד): כל צומת — מזהה, סוג, הנוסח, המקשים והפעולה. */
export function phoneScriptText(menu: PhoneMenu): string {
  const ids = Object.keys(menu.nodes);
  const out: string[] = [
    `הקו של ${menu.brand} — תסריט הקריינות`,
    `נכון לרגע ${menu.asOf} (שעון הקהילה) · ${ids.length} צמתים` + (menu.closed ? ' · הקו סגור ברגע הזה (שבת/חג) — השורש הוא הודעת הסגירה' : ''),
    'מקרא: [מזהה] סוג · הנוסח · "מקש — מה נאמר ← יעד" · [פעולה] מה שהמתאם מבצע (חיבור רק אחרי אישור).',
  ];
  for (const id of ids) {
    const n = menu.nodes[id];
    const tags = [PHONE_KIND_LABELS[n.kind], n.id === menu.root ? 'שורש' : '', n.speech ? 'דיבור או מקשים' : '', n.collect ? `איסוף ${n.collect} ספרות` : '']
      .filter(Boolean)
      .join(' · ');
    out.push('', `[${n.id}] ${tags}`, n.prompt);
    for (const o of n.options) out.push(`  ${phoneKeyName(o.digit)} — ${o.say} ← ${o.to}`);
    if (n.action?.kind === 'connect') out.push(`  [פעולה] חיבור שיחה אל ${n.action.label}: ${n.action.tel}`);
    else if (n.action?.kind === 'readNumber') out.push(`  [פעולה] הקראת המספר ספרה-ספרה: ${n.action.groups.join('-')}`);
  }
  return out.join('\n') + '\n';
}
