/**
 * 🔨 המפרק · הצורות (ATOMS-DECOMPOSE, 14.10.2026).
 * כרטיס-מנוע שנוצר אוטומטית — באותה רוח של `EngineCard` בחוזה, אבל המזהה הוא מחרוזת (החוזה מכיר רק את שלושת
 * המנועים הראשונים, ושינוי-חוזה שייך לסשן אחר) ולכל מקום יש **מפרט-קריאה הצהרתי** — לא קוד, לא מחרוזת להרצה.
 */
import type { AtomId, Kind } from '../contract';

/** תנאי על שדה ברשומה העליונה: ערך אחד או אחד מכמה. */
export type WhereValue = string | number | boolean | readonly string[];

/**
 * מפרט-קריאה הצהרתי. `path` = נתיב שדות עם `[]` לפתיחת רשימה, למשל `donations[].date`.
 * ריק ⇒ הרשומה עצמה. אף פעם לא קוד להרצה.
 */
export interface ExtractSpec {
  /** אוסף ב-Db (למשל 'supporters'). */
  entity: string;
  /** סינון רשומות עליונות לפי שדה (למשל `{ kind: 'fault' }`). */
  where?: Readonly<Record<string, WhereValue>>;
  path: string;
  kind: Kind;
  /** טווח: הנתיב של הסוף (הנתיב `path` הוא ההתחלה). */
  to?: string;
  /** טווח: יחידה — תאריכים, שעות ביום או מספרים. */
  unit?: 'date' | 'clock' | 'number';
  /** רצף: שדה-התאריך בכל פריט ('' = הפריט עצמו הוא תאריך). */
  dateField?: string;
  /** רצף של האוסף עצמו: קבוצה לכל ערך של השדה הזה (למשל `guestId` ⇒ ההזמנות של כל אורח). */
  groupBy?: string;
  /** מחכה: שדה-הסטטוס והערכים הפתוחים. */
  status?: { field: string; open: readonly string[] };
  /** מחכה: שדה כן/לא שאומר "טופל" (false ⇒ מחכה). */
  done?: string;
  /** מחכה: מאיזה רגע מחכים. */
  since?: string;
  /** טקסט: מותר להראות מילה (תווית של דבר, לא של אדם). */
  echo?: boolean;
}

/** מקום שנוצר. */
export interface GenPlace {
  /** `<module>.<entity>.<path>` — יציב. */
  id: string;
  engine: string;
  name: string;
  kind: Kind;
  /** משפט-תוצאה לכל חלק שמתאים לסוג. */
  results: Readonly<Partial<Record<AtomId, string>>>;
  /** איך קוראים את הנתונים. */
  spec: ExtractSpec;
  /** נוגע במשפחות או במקבלי-סיוע ⇒ מוסתר במצב-צנעה. */
  personal?: boolean;
}

/** מקום שנמצא דרך פונקציית-גישה (מקבלת Db או רשומה). אין לו קריאה הצהרתית ⇒ אין תצוגה אוטומטית. */
export interface GenFnPlace {
  id: string;
  engine: string;
  name: string;
  kind: Kind;
  /** `<קובץ>#<פונקציה>`. */
  fn: string;
  /** הטיפוס שהפונקציה מקבלת. */
  takes: string;
}

/** חלק פנימי שנמצא: פונקציה מיוצאת טהורה. */
export interface GenPart {
  num: number;
  name: string;
  computes: string;
  /** `<קובץ>#<פונקציה>`. */
  fn: string;
  /** סוגי הקלט שזוהו (לפי הפרמטרים). */
  takes: readonly Kind[];
  /** סוג הפלט שזוהה. */
  gives: Kind | null;
  /** אם זה בדיוק חלק-ארגז קיים. */
  atom?: AtomId;
}

/** כרטיס-מנוע שנוצר. */
export interface GenEngine {
  id: string;
  name: string;
  emoji: string;
  /** תיקיית-המקור. */
  from: string;
  computes: string;
  /** האוספים ב-Db שהמנוע הזה "שלהם". */
  entities: readonly string[];
  parts: readonly GenPart[];
  places: readonly GenPlace[];
  fnPlaces: readonly GenFnPlace[];
  /** מה לא סווג ולמה — לשקיפות (מונה לפי סיבה). */
  unclassified: Readonly<Record<string, number>>;
}
