/**
 * ratchet דו-צדדי · מרשם דגלי-ה-opt-in (21.8.2026, ממצא-נחיל):
 *
 * הבאג: הראצ'טים הקיימים (optin-wizard) נעלו רק את צד-השער — "כל מפתח שברשימה
 * מוגדר נכון". הם לא סרקו את הקוד עצמו, ולכן סחף היה בלתי-נראה: שלושה פיצ'רים
 * נשלחו ללקוחות מגודרים `config.features?.[key] === true` בלי רישום תקין —
 *   · `supporters.hokbulk` (רישום הו"ק המוני — מנפיק קבלות-מס!) — לא היה ב-FEATURES כלל
 *   · `supporters.universe3d` (היקום התלת-ממדי) — לא היה ב-FEATURES כלל
 *   · `supporters.photos` (גלריית-תמונות) — היה במרשם אבל בלי optIn:true
 * המשמעות: אין מתג באשף, לקוח-ענן לא יכול להדליק לעולם, מנהל לא יכול להגביל
 * פר-עובד/ת, והאשף הציג "דלוק" על מסך כבוי (ולחיצת-"הדלקה" מחקה את המפתח).
 *
 * הראצ'ט הזה סורק את עץ-המקור בפועל ונועל את **שני** הצדדים:
 *   1. כל מפתח-מחרוזת שמגודר `features?.['key'] === true` בקוד ⇒ FeatureDef עם optIn:true.
 *   2. כל FeatureDef עם optIn:true ⇒ מופיע ב-OPT_IN_KEYS (הרשימה ב-optin-wizard).
 * כך גל-פיצ'רים עתידי שמוסיף שער `=== true` בלי רישום — טסט אדום מיידי.
 */
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../../../types/features';
import { OPT_IN_KEYS } from './optin-keys';

// כל עץ-המקור כטקסט גולמי דרך import.meta.glob (האידיום של הפרויקט ל'הגנות-מקור' —
// בלי node:fs, שאינו ברשימת ה-types של tsconfig.app). בדיקות מסוננות לפי נתיב.
const RAW: Record<string, string> = import.meta.glob(
  ['/src/components/**/*.{ts,tsx}', '/src/lib/**/*.{ts,tsx}', '/src/store/**/*.{ts,tsx}', '/src/App.tsx'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const sourceEntries = Object.entries(RAW).filter(
  ([path]) => !path.includes('__tests__') && !path.includes('.test.'),
);

/**
 * סריקת שערי-opt-in: מפתח-מחרוזת מילולי בלבד (`['supporters.x'] === true`).
 * קריאה גנרית דרך משתנה (כמו `cfg.features?.[f.key] === true` ב-sections.ts —
 * המימוש של featureEffectiveOn עצמו) אינה נתפסת במכוון: אין בה גרשיים.
 */
function scanOptInGates(): Map<string, string[]> {
  const gateRe = /features\?\.\[['"]([\w.]+)['"]\]\s*===\s*true/g;
  const found = new Map<string, string[]>();
  for (const [path, src] of sourceEntries) {
    for (const m of src.matchAll(gateRe)) {
      const key = m[1];
      found.set(key, [...(found.get(key) ?? []), path]);
    }
  }
  return found;
}

describe('🔒 ratchet דו-צדדי — כל שער `=== true` בקוד רשום, וכל רישום ברשימת-האשף', () => {
  const gates = scanOptInGates();

  it('הסריקה חיה — מוצאת את השערים הידועים (מגן מפני סורק-שבור שמוריק הכול)', () => {
    expect(gates.size).toBeGreaterThanOrEqual(13);
    expect(gates.has('supporters.cockpit')).toBe(true);
    expect(gates.has('supporters.hokbulk')).toBe(true); // ממצא-הנחיל — מנפיק קבלות-מס
    expect(gates.has('supporters.universe3d')).toBe(true);
    expect(gates.has('supporters.photos')).toBe(true);
  });

  it('צד 1: כל מפתח שמגודר `=== true` בקוד קיים ב-FEATURES עם optIn:true', () => {
    for (const [key, files] of gates) {
      const def = FEATURES.find((f) => f.key === key);
      const where = files.join(', ');
      expect(def, `'${key}' מגודר === true (${where}) אבל חסר ב-FEATURES — אין מתג באשף, לקוח-ענן לא ידליק לעולם`).toBeTruthy();
      expect(def!.optIn, `'${key}' מגודר === true (${where}) אבל בלי optIn:true — האשף יציג/יכתוב הפוך`).toBe(true);
    }
  });

  it('צד 2: כל FeatureDef עם optIn:true מופיע ב-OPT_IN_KEYS (ולהפך — אין מפתח-רפאים)', () => {
    const optInDefs = FEATURES.filter((f) => f.optIn).map((f) => f.key).sort();
    expect(optInDefs).toEqual([...OPT_IN_KEYS].sort());
  });
});
