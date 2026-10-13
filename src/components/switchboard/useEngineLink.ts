/**
 * 🧰 ארגז-המנועים ⇄ המסכים (ENGINEBOX-B 13.10): "המוצר באמת מציית לחיבורים".
 *
 * כל נקודת-צריכה חוצת-כלים שואלת `isLinked(db.ui.engineLinks, נותן, מחבר, מקבל)` לפני שהיא מחשבת או מרנדרת.
 * חסר ⇒ DEFAULT_LINKS ⇒ המסכים ביט-זהים להיום (זהב ui-golden / phoneLine-golden בלי הקלטה-מחדש).
 * נצרך רק ממסכים עצלים (אירוח · פרנסה׳לע) — הבנדל-הראשי לא מייבא את הקטלוג.
 */
import { useApp } from '../../store/useApp';
import { isLinked } from '../../lib/enginebox/links';

/** הרשימה השמורה (או undefined ⇒ ברירת-המחדל). בלי `?? []` בתוך הסלקטור (React #185). */
export function useEngineLinks(): readonly string[] | undefined {
  return useApp((s) => s.db.ui.engineLinks);
}

/** האם נותן ⇒ מחבר ⇒ מקבל מחובר עכשיו. */
export function useEngineLink(giver: string, plug: string, needer: string): boolean {
  return isLinked(useEngineLinks(), giver, plug, needer);
}
