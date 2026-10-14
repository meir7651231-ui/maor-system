/**
 * 🧩 ארגז המנועים · שכבת החלקים — החוזה המשותף (ATOMS, 14.10.2026).
 * ⚠️ קובץ משותף לכמה סשנים במקביל: נוצר בדיוק כך ולא משתנה. בקשת-שינוי ⇒ בדוח-הסגירה, לא בקובץ.
 *
 * חלק (Atom) = מנוע קטן וטהור שפורק ממנוע גדול. הוא מחשב דבר אחד, על "סוג" של דבר — לא על מוצר.
 * מנוע (Engine) = מנוע גדול שמכריז מה יש בו: "מקומות" (Place), ולכל מקום — סוג.
 * חיבור = חלק + מקום מאותו סוג. החלק שואל שאלה אחת ("מה לחלק?"), מוצעים רק מקומות מהסוג שלו, ולכל מקום — התוצאה.
 * אחרי הבחירה — הפרטים (Detail). התוצאה = יכולת חדשה (Capability), שנכנסת לארגז כמנוע חדש.
 */

/** הסוגים. הצד הנקבה של החלק והצד הזכר של המקום חייבים להיות מאותו סוג. */
export type Kind =
  | 'span' // טווח: התחלה וסוף (דקות ביום, תאריכים, מספרים)
  | 'amount' // סכום או כמות אחת
  | 'sequence' // רצף פריטים מסודרים, כל אחד כן/לא (פנוי/תפוס, סגור/פתוח)
  | 'times' // רשימת רגעים מסודרת (שעות, תאריכים)
  | 'waiting' // משהו שמחכה לתשובה, ורשימת מקבלים מסודרת
  | 'text'; // טקסט חופשי בעברית

export const KINDS: readonly { id: Kind; label: string }[] = [
  { id: 'span', label: 'טווח' },
  { id: 'amount', label: 'סכום או כמות' },
  { id: 'sequence', label: 'רצף' },
  { id: 'times', label: 'רשימת זמנים' },
  { id: 'waiting', label: 'משהו שמחכה לתשובה' },
  { id: 'text', label: 'טקסט' },
];

/** מזהי-החלקים של הגל הראשון (קבועים — כל הסשנים משתמשים בהם). */
export const ATOM_IDS = ['divide', 'merge', 'next', 'round', 'offset', 'escalate', 'rotate', 'fuzzy'] as const;
export type AtomId = (typeof ATOM_IDS)[number];

/** מזהי-המנועים של הגל הראשון. */
export const ENGINE_IDS = ['zmanim', 'whatNeed', 'bookings'] as const;
export type EngineId = (typeof ENGINE_IDS)[number];

/** פרט שהחלק שואל אחרי שבחרו מקום. */
export interface Detail {
  id: string;
  /** עברית פשוטה, למשל 'לכמה חלקים?'. */
  label: string;
  type: 'number' | 'minutes' | 'choice';
  choices?: readonly { id: string; label: string }[];
  min?: number;
  max?: number;
  default: number | string;
}

/** כרטיס-חלק. */
export interface AtomCard {
  id: AtomId;
  name: string;
  emoji: string;
  /** מאיזה מנוע פורק, ומה המספר שלו בפירוק (כמו "7"). */
  from: { engine: EngineId; num: number };
  /** משפט אחד: מה הוא מחשב. */
  computes: string;
  /** הצד הנקבה. */
  worksOn: readonly Kind[];
  /** השאלה האחת, למשל 'מה לחלק?'. */
  question: string;
  details: readonly Detail[];
}

/** מקום במנוע: דבר שיש בו, מסוג מסוים (הצד הזכר). */
export interface Place {
  /** למשל 'bookings.nights'. */
  id: string;
  engine: EngineId;
  /** למשל 'הלילות של כל יחידה'. */
  name: string;
  kind: Kind;
  /** התוצאה של כל חלק שמתחבר כאן (מפתח = מזהה-חלק). חלק בלי משפט כאן — לא מוצע כאן. */
  results: Readonly<Partial<Record<AtomId, string>>>;
}

/** שורת-פירוק: חלק פנימי של מנוע גדול (כמו 15 החלקים של מנוע הזמנים). */
export interface InnerPart {
  num: number;
  name: string;
  computes: string;
  /** אם החלק הזה הוא חלק-ארגז שכבר קיים — המזהה שלו. */
  atom?: AtomId;
}

/** כרטיס-מנוע: מנוע גדול, הפירוק שלו, והמקומות שבו. */
export interface EngineCard {
  id: EngineId;
  name: string;
  emoji: string;
  /** הכלי שבו הוא חי היום, למשל 'אירוח משפחתי'. */
  from: string;
  computes: string;
  parts: readonly InnerPart[];
  places: readonly Place[];
}

/** חיבור שנבחר — הופך ליכולת חדשה. */
export interface Capability {
  /** יציב: capabilityId(engine, place, atom). */
  id: string;
  engine: EngineId;
  place: string;
  atom: AtomId;
  params: Readonly<Record<string, number | string>>;
  /** למשל 'מנוע תורים'. */
  name: string;
  /** CHAIN 14.10 (תוספתי): מזהה היכולת שעליה זו בנויה. חסר ⇒ בנויה ישר על מנוע גדול. */
  parent?: string;
}

/** האפשרות שהארגז מציג: חלק + מקום מתאים + התוצאה. */
export interface Option {
  atom: AtomId;
  place: string;
  placeName: string;
  kind: Kind;
  result: string;
}

/** ההתאמה: איפה החלק יכול להתחבר במנוע — רק מקום מאותו סוג ועם משפט-תוצאה. טהור, דטרמיניסטי, בסדר המקומות. */
export function optionsFor(atom: AtomCard, engine: EngineCard): Option[] {
  const out: Option[] = [];
  for (const p of engine.places) {
    const r = p.results[atom.id];
    if (!r || !atom.worksOn.includes(p.kind)) continue;
    out.push({ atom: atom.id, place: p.id, placeName: p.name, kind: p.kind, result: r });
  }
  return out;
}

export function capabilityId(engine: string, place: string, atom: string): string {
  return engine + ':' + place + ':' + atom;
}

/** CHAIN 14.10 (תוספתי): מה כל חלק נותן. 'same' = אותו סוג שקיבל. */
export const ATOM_OUTPUT: Readonly<Record<AtomId, Kind | 'same'>> = {
  divide: 'sequence',
  merge: 'sequence',
  next: 'times',
  round: 'same',
  offset: 'same',
  escalate: 'sequence',
  rotate: 'sequence',
  fuzzy: 'text',
};

/** CHAIN 14.10 (תוספתי): הסוג שיוצא מחלק שקיבל סוג מסוים — זה הסוג של המקום היחיד במנוע שנוצר. */
export function outputKind(atom: AtomId, input: Kind): Kind {
  const o = ATOM_OUTPUT[atom];
  return o === 'same' ? input : o;
}
