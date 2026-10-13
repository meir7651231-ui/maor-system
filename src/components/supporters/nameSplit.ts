/**
 * 🪪 פיצול-שמות מרוכז — "שם מלא" ⇒ שם פרטי + שם משפחה לתורמים הקיימים (הכרעת-בעלים 13.10:
 * "כלי שמפצל את כולם ומראה לפני שמירה"). טהור — בלי store/DOM.
 *
 * הבעיה: מנדרים-פלוס השמות מגיעים בשני סדרים ("כהן ישראל" / "ישראל כהן") ⇒ אי-אפשר לפצל עיוור.
 * הפתרון: (1) הסרת תארים ("הרב", "ר׳", "שליט״א"…); (2) זיהוי גופים (קרן/עמותה/בע״מ…) ⇒ דילוג;
 * "משפחת X" ⇒ שם-משפחה בלבד; (3) רשימות שמות-פרטיים ושמות-משפחה נפוצים מכריעות את הסדר
 * כשמילה אחת מוכרת; (4) כשאין הכרעה — **ניחוש** לפי הסדר הנפוץ אצל אותו ארגון (נלמד מהבטוחים),
 * ומסומן לבדיקה. `name` (השם על הקבלה) לעולם לא משתנה — רק firstName/lastName נוספים.
 */
import type { Supporter } from '../../types/domain';

export type SplitConf = 'sure' | 'guess' | 'skip';

export interface NameSplitRow {
  id: string;
  name: string;
  first: string;
  last: string;
  conf: SplitConf;
  /** הסבר קצר לבעלים — למה הוחלט כך. */
  why: string;
}

export interface NameSplitPlan {
  rows: NameSplitRow[];
  counts: Record<SplitConf, number>;
  /** כמה כבר פוצלו (יש firstName/lastName) — לא נגעים. */
  already: number;
  /** הסדר הנפוץ שנלמד מהשורות הבטוחות (2 מילים): 'first-last' = "ישראל כהן". */
  majority: 'first-last' | 'last-first';
}

/** תארים בתחילת השם (משווים אחרי נרמול גרשיים). */
const TITLES = new Set(['הרב', 'הרה"ג', 'הרה"ח', 'הגאון', 'האדמו"ר', 'הר"ר', 'ר\'', 'רבי', 'רב', 'מר', 'מרת', 'גב\'', 'גברת', 'ד"ר', 'דר\'', 'פרופ\'', 'עו"ד', 'רו"ח', 'הנגיד', 'הגביר', 'הרבנית', 'הבחור', 'החתן', 'mr', 'mrs', 'ms', 'dr', 'rabbi', 'rav']);
/** סיומות-כבוד בסוף השם. */
const SUFFIXES = new Set(['שליט"א', 'הי"ו', 'נ"י', 'ז"ל', 'שיחי\'', 'שליט', 'זצ"ל', 'זצוק"ל', 'ע"ה', 'יצ"ו', 'jr', 'sr']);
/** מילים שמסמנות גוף/מוסד ⇒ לא מפצלים. */
const ENTITY = /(^|\s)(קרן|עמותת|עמותה|ע"ר|בע"מ|חברת|חב'|ישיבת|ישיבה|כולל|מוסדות|מוסד|ארגון|קהילת|בית\s+הכנסת|ביהכ"נ|תלמוד\s+תורה|ת"ת|גמ"ח|מפעל|הקדש|ltd|inc|llc|foundation|fund|trust|corp|co\.)(\s|$)/i;
/** מילות-חיבור של שם-משפחה ("בן דוד", "אבו חצירא", "די סגני") — נדבקות למילה שאחריהן. */
const PARTICLES = new Set(['בן', 'בר', 'אבו', 'אבן', 'אל', 'די', 'דה', 'דל', 'ון', 'פון', 'ואן', 'van', 'von', 'de', 'del', 'da', 'di', 'le', 'la', 'ben', 'bar', 'mc', 'o']);

/** שמות-פרטיים נפוצים (זכר+נקבה, כתיב מלא/חסר עיקרי). */
const FIRST = new Set(
  (
    'אברהם יצחק יעקב משה אהרן אהרון דוד שלמה יוסף יוסי בנימין ראובן שמעון יהודה יששכר זבולון דן נפתלי גד אשר ' +
    'מנחם מנדל מרדכי מוטי שמואל שמוליק אליהו אליעזר אלעזר אליקים אלחנן אלימלך אפרים מנשה פנחס פינחס נחום נחמן נחמיה ' +
    'חיים ישראל ישעיהו ישעיה ירמיהו יחזקאל יואל עמוס עובדיה יונה מיכה חבקוק צפניה חגי זכריה מלאכי דניאל עזרא ' +
    'שאול יהושע יהונתן יונתן נתן נתנאל גדליה גבריאל מיכאל רפאל עזריאל אריאל אוריאל יחיאל יחזקאל צבי הירש הערשל ' +
    'זאב וולף דב בער אריה לייב לייבל ליב שלום שלומי מאיר מאירי עקיבא טוביה טוביא זלמן שניאור אהרל ' +
    'ברוך בצלאל זכריה זרח חנוך חנניה יהושוע יקותיאל ירחמיאל ישכר כלב מתתיהו מתתיה מתנה נועם עמרם עזרי עמנואל ' +
    'פסח קלמן קלונימוס שבתאי שמחה שמריהו שרגא תנחום אביגדור אבינועם אבישי אביעזר אבנר אהוד אורי איתן איתמר ' +
    'אלון אמיר אסף ארי בועז גיל גלעד דביר דורון הלל זיו חגי טל יאיר ידידיה יגאל יובל יגאל יוחנן יוחאי יקיר ' +
    'מאור מתן נדב נחשון נריה עידו עמית עוז עופר צביקה רון רועי רז שגיא שחר שי שילה תומר יהודית ' +
    'אסתר שרה רבקה רחל לאה מרים חנה דבורה רות נעמי יעל אביגיל בתיה בת-שבע בתשבע חוה צפורה ציפורה ' +
    'מלכה פנינה שושנה גיטל גיטי פייגא פייגי חיה חי׳ה רייזל רייזי בלומה בלימי פריידא פרידה חוי טובה טובי ' +
    'יוכבד יוכי ברכה גולדה דינה הדסה זהבה חנה מירל מירי נחמה נעמה סימה עדינה פרומט צירל צירי רבקי רחלי ' +
    'שיינדל שיינדי שפרה שפרינצה תמר תהילה אילה איילה אורית אורה אפרת אלישבע אסנת בילה גאולה דבורי הודיה ' +
    'הינדי חדוה טלי יהודית יפה לבנה מיכל מלכי מרים נחמי נטע ענבל עטרה פערל קיילא רחל רינה שולמית שירה שני ' +
    'שרי תמי ליבי ליבא מינדי מינדל פעסל רוחמה אהובה ' +
    'john james robert michael william david richard joseph thomas charles daniel matthew mark paul steven andrew ' +
    'joshua kevin brian george edward jacob isaac abraham moshe yosef chaim shmuel yaakov yitzchak avraham mary ' +
    'sarah rachel leah rebecca miriam esther hannah anna elizabeth jennifer susan karen nancy lisa deborah ruth'
  ).split(/\s+/),
);

/** שמות-משפחה נפוצים — מכריעים כשהמילה השנייה לא ידועה. */
const LAST = new Set(
  (
    'כהן לוי מזרחי פרץ ביטון דהן אברהמי פרידמן שפירא גולדברג גולדשטיין רוזנברג רוזנטל וייס ויס כץ קליין ' +
    'שוורץ שווארץ גרינברג גרינוולד ברגר ברגמן הורוביץ רבינוביץ אדלר אוחיון אזולאי אלמוג אשכנזי בוזגלו ברק ' +
    'גבאי גרוס דוד דאהן הלוי הכהן וקנין זילברמן חדד טל יוסף כץ לנדאו מלכה מרגלית נחום סגל עזרא פרלמן ' +
    'פישר פולק פרידלנד צדוק קפלן קרמר רבין רוזן שטרן שטיין שטיינברג שטרנברג שמעוני שרעבי תורג׳מן ' +
    'הורוויץ טייטלבוים האלברשטאם ויזניץ ברנשטיין אייזנברג אפשטיין בלום גוטמן גרוסמן הלפרין הירש ' +
    'וולף זלצמן טננבוים לב לבוביץ ליברמן מנדלבאום נוימן סולוביצ׳יק פלדמן פרנקל צוקרמן קורן קלר רוט ' +
    'רוטשילד שולמן שפיגל שניידר שרייבר אוחנה אלבז אמסלם בן-דוד בניטה דאבוש חזן טולדנו יפרח מימון ' +
    'סויסה עמר פינטו קדוש רביבו שושן חורי חליווה סבג עטיה ' +
    'smith johnson williams brown jones miller davis wilson anderson taylor thomas moore martin jackson ' +
    'cohen levy levine katz klein schwartz friedman goldberg rosenberg weiss stern'
  ).split(/\s+/),
);

/** נרמול לגרשיים אחידים ולאותיות קטנות (לטינית) — להשוואה מול הרשימות בלבד. */
function norm(t: string): string {
  return t.replace(/[׳`’]/g, "'").replace(/[״“”]/g, '"').toLowerCase();
}

const isFirstWord = (t: string) => FIRST.has(norm(t)) || FIRST.has(norm(t).replace(/-/g, ''));
/** שם-פרטי מוכר — כולל בן/בת-זוג מצורף ("ומרים" ב"יעקב ומרים זילברשטיין"). */
const isFirst = (t: string) => isFirstWord(t) || (/^ו./.test(t) && isFirstWord(t.slice(1)));
const isLast = (t: string) => LAST.has(norm(t));
/** +1 = כנראה שם-פרטי · −1 = כנראה שם-משפחה · 0 = לא ידוע/גם-וגם. */
const lean = (t: string) => (isFirst(t) ? 1 : 0) - (isLast(t) ? 1 : 0);

/** פירוק לשמות-מילים: בלי תארים/סיומות, מילות-חיבור מודבקות למילה שאחריהן. */
export function nameTokens(name: string): { tokens: string[]; family: boolean } {
  let words = (name || '')
    .replace(/[(),]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  let family = false;
  // תארים מובילים (גם כמה ברצף: "הרב הגאון ר׳")
  while (words.length && TITLES.has(norm(words[0]).replace(/\.$/, ''))) words = words.slice(1);
  if (words.length && /^(משפחת|משפ'|family)$/i.test(norm(words[0]))) {
    family = true;
    words = words.slice(1);
  }
  while (words.length && SUFFIXES.has(norm(words[words.length - 1]))) words = words.slice(0, -1);
  if (words.length && /^(family)$/i.test(words[words.length - 1])) {
    family = true;
    words = words.slice(0, -1);
  }
  // "יעקב ו מרים" / "Jacob & Miriam" — המחבר נדבק לשם שאחריו ("ומרים")
  const joined: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (/^(ו|&|and)$/i.test(words[i]) && i + 1 < words.length) {
      joined.push('ו' + words[i + 1]);
      i++;
    } else joined.push(words[i]);
  }
  words = joined;
  const tokens: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (PARTICLES.has(norm(words[i])) && i + 1 < words.length && i > 0) {
      tokens.push(words[i] + ' ' + words[i + 1]);
      i++;
    } else tokens.push(words[i]);
  }
  return { tokens, family };
}

/** החלטה לשם אחד (בלי רוב-ארגוני — זה מוחל אחר-כך על 'guess'). */
function decide(name: string): Omit<NameSplitRow, 'id' | 'name'> & { order?: 'first-last' | 'last-first' } {
  if (ENTITY.test(norm(name))) return { first: '', last: '', conf: 'skip', why: 'גוף/מוסד — לא שם של אדם' };
  const { tokens, family } = nameTokens(name);
  if (!tokens.length) return { first: '', last: '', conf: 'skip', why: 'אין שם' };
  if (family) return { first: '', last: tokens.join(' '), conf: 'sure', why: '"משפחת" — שם משפחה בלבד' };
  if (tokens.length === 1) return { first: '', last: '', conf: 'skip', why: 'מילה אחת — אי-אפשר לדעת' };
  const latin = /^[a-z\s.'-]+$/i.test(tokens.join(' '));
  if (tokens.length === 2) {
    const [a, b] = tokens;
    const la = lean(a);
    const lb = lean(b);
    if (la > lb) return { first: a, last: b, conf: 'sure', why: (la > 0 ? a : b) + ' — ' + (la > 0 ? 'שם פרטי מוכר' : 'שם משפחה מוכר'), order: 'first-last' };
    if (lb > la) return { first: b, last: a, conf: 'sure', why: (lb > 0 ? b : a) + ' — ' + (lb > 0 ? 'שם פרטי מוכר' : 'שם משפחה מוכר'), order: 'last-first' };
    if (latin) return { first: a, last: b, conf: 'sure', why: 'שם לועזי — פרטי קודם' };
    return { first: a, last: b, conf: 'guess', why: 'אין מילה מוכרת — לפי הסדר הנפוץ' };
  }
  // 3+ מילים: (1) שם-משפחה מוכר בקצה אחד ⇒ השאר שם-פרטי; (2) אחרת — רצף שמות-פרטיים מוכרים בהתחלה/בסוף.
  const n = tokens.length;
  const l0 = lean(tokens[0]);
  const lN = lean(tokens[n - 1]);
  if (lN < 0 && l0 >= 0) return { first: tokens.slice(0, -1).join(' '), last: tokens[n - 1], conf: 'sure', why: tokens[n - 1] + ' — שם משפחה מוכר' };
  if (l0 < 0 && lN >= 0) return { first: tokens.slice(1).join(' '), last: tokens[0], conf: 'sure', why: tokens[0] + ' — שם משפחה מוכר' };
  let lead = 0;
  while (lead < n - 1 && isFirst(tokens[lead])) lead++;
  let trail = 0;
  while (trail < n - 1 && isFirst(tokens[n - 1 - trail])) trail++;
  if (lead > trail) return { first: tokens.slice(0, lead).join(' '), last: tokens.slice(lead).join(' '), conf: trail === 0 ? 'sure' : 'guess', why: 'שמות פרטיים מוכרים בהתחלה' };
  if (trail > lead) return { first: tokens.slice(n - trail).join(' '), last: tokens.slice(0, n - trail).join(' '), conf: lead === 0 ? 'sure' : 'guess', why: 'שמות פרטיים מוכרים בסוף' };
  if (latin) return { first: tokens.slice(0, -1).join(' '), last: tokens[tokens.length - 1], conf: 'sure', why: 'שם לועזי — משפחה בסוף' };
  return { first: tokens[0], last: tokens.slice(1).join(' '), conf: 'guess', why: 'אין מילה מוכרת — לפי הסדר הנפוץ' };
}

/**
 * תוכנית-פיצול לכל התורמים שעוד לא פוצלו. דטרמיניסטי. ניחושים של 2 מילים מיושרים לסדר
 * הנפוץ אצל הארגון (נלמד מהבטוחים); בתיקו — "פרטי משפחה".
 */
export function planNameSplit(supporters: readonly Pick<Supporter, 'id' | 'name' | 'firstName' | 'lastName'>[]): NameSplitPlan {
  const rows: NameSplitRow[] = [];
  let already = 0;
  let fl = 0;
  let lf = 0;
  const pending: { row: NameSplitRow; tokens: number }[] = [];
  for (const sp of supporters) {
    if ((sp.firstName || '').trim() || (sp.lastName || '').trim()) {
      already++;
      continue;
    }
    const d = decide(sp.name || '');
    if (d.order === 'first-last') fl++;
    else if (d.order === 'last-first') lf++;
    const row: NameSplitRow = { id: sp.id, name: sp.name || '', first: d.first, last: d.last, conf: d.conf, why: d.why };
    rows.push(row);
    if (d.conf === 'guess') pending.push({ row, tokens: nameTokens(sp.name || '').tokens.length });
  }
  const majority: NameSplitPlan['majority'] = lf > fl ? 'last-first' : 'first-last';
  if (majority === 'last-first') {
    for (const { row, tokens } of pending) {
      if (tokens !== 2) continue;
      const t = nameTokens(row.name).tokens;
      row.first = t[1];
      row.last = t[0];
    }
  }
  const counts: Record<SplitConf, number> = { sure: 0, guess: 0, skip: 0 };
  for (const r of rows) counts[r.conf]++;
  return { rows, counts, already, majority };
}
