/**
 * 🧬 ארגז המנועים · מנועים וחלקים — התפר (ATOMS-SCREEN 14.10.2026).
 * המסך מדבר רק עם הממשק הזה. המקור האמיתי (כרטיסי-המנועים, החלקים והיכולות שנוצרו)
 * נבנה בסשן אחר ומחובר בכניסה; עד אז הכניסה מעבירה null ⇒ מצב-ריק כן.
 * ההתאמה (איזה מקום מתאים לאיזה חלק) לא כאן — רק `optionsFor` של החוזה.
 */
import type { AtomCard, Capability, EngineCard } from '../../../lib/atoms/contract';

export interface AtomPreview { title: string; lines: string[] }
export interface AtomChain {
  atoms: [string, string];
  name: string;
  result: string;
  /** ATOMS 14.10 (תוספתי): שורות מחושבות מנתוני-הארגון ("צימר הגפן · 3 לילות פנויים ברצף מ-18/10"). חסר/ריק ⇒ רק המשפט. */
  lines?: string[];
  /** CHAIN 14.10 (תוספתי): אפשר לשמור אותה כמנוע ("שמור כמנוע"). */
  canSave?: boolean;
  /** CHAIN 14.10 (תוספתי): כבר נשמרה — המזהה של המנוע. */
  savedId?: string;
}
/** CHAIN 14.10 (תוספתי): מנוע שנוצר כמנוע שאפשר לבנות עליו. */
export type CapState = 'ok' | 'orphan' | 'bad';
export interface AtomsSource {
  engines(): EngineCard[];
  atoms(): AtomCard[];
  capabilities(): Capability[];
  /** הפלט האמיתי של יכולת על נתוני-הארגון (הסשן הסופי מחשב). null ⇒ "התצוגה תגיע בקרוב". */
  preview(c: Capability): AtomPreview | null;
  /** שרשראות חלק→חלק מוצעות למנוע הזה. */
  chains(engineId: string): AtomChain[];
  create(c: Capability): void | Promise<unknown>;
  remove(id: string): void;
  canEdit: boolean;
  /** CHAIN 14.10 (תוספתי): כרטיס-מנוע למנוע שנוצר (המקום היחיד = הפלט שלו). orphan/bad ⇒ null. */
  capHost?(capId: string): EngineCard | null;
  /** CHAIN 14.10 (תוספתי): מצב מנוע שנוצר בתוך הרשימה. */
  capState?(capId: string): CapState;
  /** CHAIN 14.10 (תוספתי): השמות של המנועים שבנויים עליו (הסרה חסומה עד שהם מוסרים). */
  blockedBy?(capId: string): string[];
  /** CHAIN 14.10 (תוספתי): "שמור כמנוע" לשרשרת מוצעת — יוצר (אם צריך) את הראשון ואז את המנוע הבנוי. מחזיר את המזהה. */
  saveChain?(engineId: string, index: number): string | null;
}
