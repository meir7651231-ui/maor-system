/**
 * 🧩 ארגז-המנועים — הכתיבה העצלה של שתי ההגדרות ב-db.ui (ATOMS, 14.10.2026, הסשן המשלב):
 * חיבור/ניתוק מנוע (`engineLinks`, מפתח-מחרוזת) ויצירה/הסרה של יכולת (`capabilities`, יכולת / {id}).
 *
 * ה-store קורא לכאן ב-import() מ-linkEngine/unlinkEngine/createCapability/removeCapability — מסלול אחד, כדי שבבנדל-ההפעלה
 * יהיה ייבוא-דינמי אחד במקום שניים (נמדד: כל ייבוא-דינמי ושם-קובץ ברשימת-התלויות = עשרות בייטים לכל ארגון).
 * ההתנהגות של linkEngine/unlinkEngine זהה לקודם (withLink/withoutLink/linkLabel, אותם משפטי-לוג) — ננעל ב-enginebox-wiring (ב).
 * ההרשאה (canEditEngineLinks) מועברת מה-store: ייבוא lib/config מכאן גרר את config ל-chunk-הפעלה חדש (נמדד).
 */
import type { Db } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import type { Capability } from './contract';
import { linkLabel, withLink, withoutLink } from '../enginebox/links';
import { capUiChange } from './capabilities';

/** מה שהכתיבה צריכה מה-store (getState) — הפעולות הציבוריות setDb/logAccess. */
export interface BoxStore {
  config: OrgConfig;
  cloud: { user?: { email?: string | null } | null };
  db: Pick<Db, 'ui'>;
  setDb: (fn: (db: Db) => Partial<Db>) => void;
  logAccess: (act: string, what: string) => void;
}

export type BoxArg = string | Capability | { id: string };

/** התיקון ל-db.ui + שורת-הלוג; לא-תקין / אין שינוי ⇒ null. טהור. */
export function boxUiChange(ui: Pick<Db['ui'], 'engineLinks' | 'capabilities'>, arg: BoxArg, on: boolean): { patch: Partial<Db['ui']>; act: string; what: string } | null {
  if (typeof arg !== 'string') return capUiChange(ui, arg, on);
  const next = on ? withLink(ui.engineLinks, arg) : withoutLink(ui.engineLinks, arg);
  return next ? { patch: { engineLinks: next }, act: on ? 'חיבור מנוע' : 'ניתוק מנוע', what: linkLabel(arg) } : null;
}

/** הרשאה (מורה ⇒ קריאה-בלבד) ⇒ התיקון ⇒ setDb + שורת-לוג. false בלי נגיעה כשאין הרשאה / אין שינוי. לא זורקת. */
export function boxChangeIn(get: () => BoxStore, canEdit: (config: OrgConfig, email: string | null | undefined) => boolean, arg: BoxArg, on: boolean): boolean {
  try {
    const s = get();
    if (!canEdit(s.config, s.cloud.user?.email)) return false;
    const r = boxUiChange(s.db.ui, arg, on);
    if (!r) return false;
    s.setDb((db) => ({ ui: { ...db.ui, ...r.patch } }));
    s.logAccess(r.act, r.what);
    return true;
  } catch {
    return false;
  }
}
