// ─────────────────────────────────────────────────────────────────────────────
// callerId — "מה קובע שלקוח מתקשר": זיהוי-שיחה-נכנסת (screen-pop).
//
// ההכרעה מי-מתקשר = **התאמת מספר**: מנרמלים את מספר-המתקשר למפתח-השוואה
// (ספרות בלבד, בניכוי 972/0 מוביל) ומחפשים אותו בין אנשי-הקשר השמורים
// (משפחות · בני-משפחה · תורמים · מתנדבים · רכזים). הראשון שמתאים — הוא המתקשר.
//
// המוֹאט (pure-downstream): המספר-הנכנס **לא** מגיע מ-API של ספק. הוא מגיע
// downstream — הסופטפון/המרכזייה של הארגון פותח את האפליקציה בכתובת עם
// ‏`#call=<מספר>` (יכולת סטנדרטית "on-ring open-URL"), או שהמזכירה מקלידה
// את המספר שהיא רואה על הצג. כאן רק ההתאמה — טהורה, בלי store/DOM/רשת.
// ─────────────────────────────────────────────────────────────────────────────
import type { Db } from '../types/domain';
import type { OrgConfig } from '../types/config';
import { termOf } from './config';

export type CallerKind = 'family' | 'member' | 'supporter' | 'volunteer' | 'coordinator';

/**
 * תווית-סוג-המתקשר דרך מילון-המונחים (termOf) — כך שבורטיקל מסחרי "תורם" הופך
 * ל"ליד/ספק", "משפחה" ל"לקוח" וכו'. ה-fallback = התווית ההיסטורית בדיוק ⇒ ללקוח-החי
 * (בלי דריסות-מונחים) ביט-זהה. משמש את כרטיס-השיחה במקום ה-kindLabel הקשיח.
 */
export function callerKindLabel(cfg: OrgConfig, kind: CallerKind): string {
  switch (kind) {
    case 'family':
      return termOf(cfg, 'entity.family', 'משפחה');
    case 'member':
      return termOf(cfg, 'entity.member', 'בן/בת משפחה');
    case 'supporter':
      return termOf(cfg, 'entity.supporter', 'תורם/ת');
    case 'volunteer':
      return termOf(cfg, 'entity.volunteer', 'מתנדב/ת');
    case 'coordinator':
      return termOf(cfg, 'entity.tzCoordinator', 'רכז/ת');
  }
}

/** מתקשר-מזוהה: הישות שהמספר שלה תואם + לאן לנווט (screen-pop). */
export interface Caller {
  kind: CallerKind;
  name: string;
  phone: string;
  /** מזהה-הישות שהותאמה (משפחה/תומך/מתנדב/רכז; לבן-משפחה = מזהה-החבר). */
  id: string;
  /** המסך שאליו לנווט. */
  view: 'families' | 'supporters' | 'tzedaka' | 'shop7';
  /** מזהה-המשפחה לפתיחת כרטיס-משפחה (למשפחה/בן-משפחה). */
  famId?: string;
}

/**
 * מפתח-השוואה של טלפון: ספרות בלבד, בניכוי קידומת בינ"ל (00/972) ו-0 מוביל.
 * '050-123-4567' · '+972 50 1234567' · '0050-1234567' → כולם '501234567'.
 * קווי: '02-555-1234' → '25551234'. ריק/קצר-מדי ⇒ '' (לא ניתן להתאמה).
 */
export function phoneKey(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('972')) d = d.slice(3);
  d = d.replace(/^0+/, '');
  return d;
}

/**
 * מזהה את המתקשר לפי מספרו — הראשון שמתאים לפי סדר-עדיפות: משפחה (טלפון ראשי/
 * נוסף) → בן-משפחה → תורם → מתנדב → רכז. בלי התאמה/מספר-קצר ⇒ null.
 */
export function findCaller(db: Db, raw: string): Caller | null {
  const key = phoneKey(raw);
  if (key.length < 6) return null; // קצר מדי = לא בר-התאמה בטוחה (הימנעות מ-false-positive)
  const hit = (p: string | undefined) => !!p && phoneKey(p) === key;

  for (const f of db.families) {
    if (hit(f.phone) || hit(f.phone2)) {
      return { kind: 'family', name: f.name, phone: f.phone || f.phone2, id: f.id, view: 'families', famId: f.id };
    }
  }
  for (const f of db.families) {
    for (const m of f.members || []) {
      if (hit(m.phone) || hit(m.phone2)) {
        return { kind: 'member', name: m.first + ' · ' + f.name, phone: m.phone || m.phone2, id: m.id, view: 'families', famId: f.id };
      }
    }
  }
  for (const s of db.supporters) {
    if (hit(s.phone)) return { kind: 'supporter', name: s.name, phone: s.phone, id: s.id, view: 'supporters' };
  }
  for (const v of db.volunteers || []) {
    if (hit(v.phone)) return { kind: 'volunteer', name: v.name, phone: v.phone, id: v.id, view: 'shop7' };
  }
  for (const c of db.tzCoordinators || []) {
    if (hit(c.phone)) return { kind: 'coordinator', name: c.name, phone: c.phone, id: c.id, view: 'tzedaka' };
  }
  return null;
}

/**
 * הקשר-חסד של משפחה מתקשרת — מונים "פתוחים" לכרטיס-השיחה (screen-pop): כמה
 * מסירות טרם-נמסרו (shop7) וכמה שיוכי-חבילות פעילים (shop) יש לה. כך שברגע
 * שהמשפחה מתקשרת המתנדב/ת רואה מיד מה פתוח עבורה — בלי לפתוח את הכרטיס המלא.
 *
 * טהור, תצוגה-בלבד — בדיוק הנתונים של פאנלי-הכרטיס (Shop7FamilyPanel/ShopFamilyPanel):
 *   • openDeliveries = deliveries של המשפחה בסטטוס≠delivered.
 *   • activeAssignments = shopAssignments של המשפחה בסטטוס active.
 * הגידור פר-מודול (moduleOn) נעשה אצל הצרכן (הכרטיס), לא כאן.
 */
export interface FamilyContext {
  openDeliveries: number;
  activeAssignments: number;
}
export function familyContext(db: Db, famId: string): FamilyContext {
  const openDeliveries = (db.deliveries || []).filter((d) => d.familyId === famId && d.status !== 'delivered').length;
  const activeAssignments = (db.shopAssignments || []).filter((a) => a.famId === famId && a.status === 'active').length;
  return { openDeliveries, activeAssignments };
}
