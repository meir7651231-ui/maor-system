/**
 * שכבת-מתאם לחייגן (adapter) — ה"תקע" שאליו יתחברו מנועי-חיוג שונים בלי לגעת
 * ב-UI. כרגע נהג-יחיד: **ידני (tel:)** — downstream, על הטלפון הקיים, בלי שרת.
 *
 * ה"קופסה" העתידית (GSM-PBX — Yeastar/גרנדסטרים) תממש את אותו ממשק עם
 * `capabilities.autoDial/record = true` וקריאת-API אמיתית — ואז המעבר מ"חייגן-
 * מונחה" ל"חייגן-אוטומטי + הקלטה" הוא החלפת-נהג, לא בנייה-מחדש. זה כל-כולו הגבול
 * המכוון: מנוע-החיוג/ההקלטה חי בקופסה (upstream); מאור מדבר איתו דרך המתאם.
 */
import { telHref } from '../tel';

export interface DialCapabilities {
  /** האם המנוע מחייג לבד (רובוטי) — ידני=false; קופסה=true. */
  autoDial: boolean;
  /** האם המנוע מקליט שיחות — ידני=false; קופסה=true. */
  record: boolean;
  /** זיהוי-מתקשר נכנס (screen-pop) — נתמך downstream כשהמספר מגיע לאפליקציה. */
  screenPop: boolean;
}

export interface DialDriver {
  id: string;
  label: string;
  capabilities: DialCapabilities;
  /**
   * יזום שיחה למספר. נהג-ידני מחזיר `tel:` (ה-caller פותח → הטלפון מחייג);
   * נהג-קופסה עתידי יחזיר null ויפעיל את ה-API שלו (autoDial). null = אין
   * מספר-תקין / אין חיוג-ישיר.
   */
  callHref(phone: string): string | null;
}

/** נהג-ידני — חיוג-בלחיצה על הטלפון הקיים (tel:), בלי שרת/חשבון. ברירת-המחדל. */
export const manualDriver: DialDriver = {
  id: 'manual',
  label: 'חיוג בלחיצה (טלפון קיים)',
  capabilities: { autoDial: false, record: false, screenPop: true },
  callHref: (phone) => telHref(phone),
};

/**
 * בורר-הנהג הפעיל. כרגע ידני-בלבד (downstream). כאן תתווסף בחירת נהג-הקופסה
 * לפי הקונפיג כשהמחבר ל-Yeastar/גרנדסטרים ייכתב — ה-UI לא ישתנה.
 */
export function activeDriver(): DialDriver {
  return manualDriver;
}
