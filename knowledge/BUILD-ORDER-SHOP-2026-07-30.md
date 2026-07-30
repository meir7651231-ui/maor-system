# 🛍 פקודת בנייה — עמודת "חנות" (מודול shop — מוצרי שירות)

**מאת:** הארכיטקט · 30.7.2026 · **ענף:** `claude/what-do-you-see-bcxttj`
**כללי עבודה:** זהים לקופות (BUILD-ORDER-TZEDAKA) — שערים מדורגים, termOf לכל מחרוזת, דגל לכל יכולת, ratchet לכל כלל, commit לכל אשכול בקידומת `חנות N ·`. **הדפוס המבני = מודול הקופות**; כשכתוב "כמו בקופות" — פתח את הקובץ המקביל ב-`src/components/tzedaka/` והעתק את הדפוס.

## הכרעות הבעלים (30.7.2026 — מחייבות)
1. **משרד בלבד** — אין גישת לקוחות. העמודה היא כלי תפעול + ראווה משרדית.
2. **מוצר = חבילת שירות** לאדם במצב-חיים (דוגמאות הבעלים: "מוצר חתן" — ליווי מלא + קופונים לרכישה מסובסדת בחנויות + מתנות במחיר סמלי + פגישת ליווי במשרד; "מוצר כלה" — מתנות לחגים, הטבה מחזורית). המוצר מורכב **מרכיבים** מ-4 סוגים: פגישה · קופון · מתנה · מתנת-חג (מחזורית).
3. **קטלוג חופשי** — ישות מוצר עצמאית; לא תלויה בישויות קיימות.
4. **קריטריוני זכאות מנוהלים בעמודה** (הכרעת בעלים): רשימה פתוחה עם אפשרות הוספה — למשל "יתום מאם", "יתום מאבא". כל קריטריון נושא אחוז הנחה; המחיר הסמלי של רכיב נגזר מהקריטריונים של המוטב.
5. **חנויות שותפות** — רשימה מנוהלת בעמודה; קופון מצביע על חנות.
6. **בידוד מלא "כרגע"** (כמו קופות): הכסף (מחיר סמלי, ערך הטבה) והאירועים נרשמים רק בעמודה — לא לתרומות/קבלות/דוחות/לוח הראשי. "אחר כך נעדכן" — הדלת פתוחה.
7. **הוספת לא-רשומים** מתוך העמודה (כמו קופות) — ילד/הורה/משפחה חדשים דרך `upsertFamily`/`upsertMember` (רשומות CRM אמיתיות — תשתית, לא זליגה).
8. **בלי גיימיפיקציה** — אין רכזים מתחרים; אין ניקוד בעמודה זו.
9. **לוח ייעודי** — כן, כולל שכבת "החגים הקרובים ומי מקבל מה".

**ברירות-מחדל של הארכיטקט (הבעלים רשאי לדרוס — לתעד):** כשלמוטב כמה קריטריונים — חלה **ההנחה הגבוהה** (לא מצטבר). מחיר אפקטיבי = מחיר-בסיס × (1 − pct/100), מעוגל לש"ח שלם, ניתן לעריכה ידנית ברגע המימוש.

---

## אשכול 1 · שכבת נתונים (`חנות 1 ·`)

**קבצים:** `src/types/domain.ts` · `src/store/persist.ts` · `src/lib/cloud-diff.ts` · `src/lib/cloud-merge.ts`.

1. עדכן את הערת הקידומות ב-domain.ts: הוסף `shp/shs/shc/sha/shr/she`. הוסף לפני `interface Db` (מילה-במילה):

```ts
/* ---------- חנות מוצרי-שירות (מודול shop — מבודד; BUILD-ORDER-SHOP-2026-07-30) ---------- */

/** סוג רכיב במוצר: פגישת ליווי · קופון לחנות שותפה · מתנה · מתנת-חג (מחזורית). */
export type ShopComponentKind = 'meeting' | 'coupon' | 'gift' | 'holidayGift';

/** רכיב בתוך מוצר. value=שווי בש"ח; basePrice=המחיר הסמלי לפני הנחות קריטריונים. */
export interface ShopComponent {
  id: Id;
  kind: ShopComponentKind;
  label: string;
  /** חנות שותפה (kind==='coupon' — רשות בשאר). */
  storeId: Id | '';
  value: number;
  basePrice: number;
  notes: string;
}

/** מוצר בקטלוג — חבילת שירות שלמה ("מוצר חתן", "מוצר כלה"). */
export interface ShopProduct {
  id: Id;
  name: string;
  desc: string;
  img?: string;
  active: boolean;
  components: ShopComponent[];
  notes: string;
}

/** חנות שותפה — הקופונים ממומשים אצלה. */
export interface ShopStore {
  id: Id;
  name: string;
  contact: string;
  phone: string;
  active: boolean;
  notes: string;
}

/** קריטריון זכאות ("יתום מאם") — discountPct 0-100 על המחיר הסמלי. */
export interface ShopCriterion {
  id: Id;
  name: string;
  discountPct: number;
  notes: string;
}

/** מימוש רכיב: paid=מה שולם בפועל; value=שווי שנמסר; holiday=שם החג (למתנת-חג). */
export interface ShopRedemption {
  id: Id;
  componentId: Id;
  date: IsoDate;
  holiday: string;
  paid: number;
  value: number;
  note: string;
}

export type ShopAssignmentStatus = 'active' | 'done' | 'stopped';

/** שיוך מוצר למוטב — משפחה, ואופציונלית בן/בת משפחה ספציפי/ת (חתן/כלה). */
export interface ShopAssignment {
  id: Id;
  productId: Id;
  famId: Id;
  memberId: Id | '';
  /** קריטריוני הזכאות של המוטב (מזהי ShopCriterion). */
  criterionIds: Id[];
  since: IsoDate | '';
  status: ShopAssignmentStatus;
  notes: string;
  redemptions: ShopRedemption[];
}

/** אירוע הלוח הייעודי — לא ב-db.events, לא בלוח הראשי (בידוד). */
export interface ShopEvent {
  id: Id;
  title: string;
  date: IsoDate;
  time: TimeHM | '';
  /** meeting=פגישה · delivery=מסירה · holiday=חג · custom=אחר. */
  kind: 'meeting' | 'delivery' | 'holiday' | 'custom';
  assignmentId: Id | '';
  notes: string;
  done: boolean;
}
```

2. ב-`interface Db` (אחרי מערכי tz): `shopProducts: ShopProduct[]; shopStores: ShopStore[]; shopCriteria: ShopCriterion[]; shopAssignments: ShopAssignment[]; shopEvents: ShopEvent[];` + ‏`[]` ב-`emptyDb()`. ‏DB_VERSION נשאר 5 (אדיטיבי). עדכן "11 מערכי ישויות"→16 בהערות.
3. `persist.ts migrate()` — אחרי ריפוי ה-tz: חמשת המערכים `Array.isArray ? : []`; פר-מוצר `components→[]`; פר-שיוך `redemptions→[]`, ‏`criterionIds→[]`, ‏status זר→`'active'`; פר-קריטריון `discountPct` לא-סופי/שלילי→0, מעל 100→100.
4. `cloud-diff.ts` — הוסף `'shopProducts','shopStores','shopCriteria','shopAssignments','shopEvents'` (11→16, עדכן את ההערה).
5. `cloud-merge.ts` LIST_FIELDS — `shopProducts: ['components'], shopAssignments: ['redemptions', 'criterionIds']`.
6. **בדיקות** (דפוס tz-migrate.test.ts): גיבוי ישן → חמישה `[]`; שיוך בלי redemptions/criterionIds → נרפא; discountPct=NaN→0, ‏150→100; cloud-diff set/delete על shopAssignments; applyEntityPartial בלי components → `[]`.

## אשכול 2 · שלד המודול (`חנות 2 ·`)

**קבצים:** `types/config.ts` · `lib/config.ts` · `types/features.ts` · `useApp.ts` · `App.tsx` · `builder/sections.ts` · `src/components/shop/ShopView.tsx` (חדש).

7. `ModuleKey` + ‏`NAV_MODULE_KEYS` מקבלים `'shop'` (עדכן "שבעת"→"שמונת" בהערה). `View` מקבל `| 'shop'`.
8. `App.tsx` NAV (אחרי tzedaka): `{ view: 'shop', icon: '🛍', label: 'חנות' }`; ‏VIEWS: `shop: ShopView`.
9. `features.ts` — union module מקבל `| 'shop'` + דגלים:

```ts
  // ——— חנות מוצרי-שירות ———
  { key: 'shop.stores', label: 'חנויות שותפות', desc: 'ניהול חנויות שותפות וקופונים לרכישה מסובסדת', module: 'shop' },
  { key: 'shop.criteria', label: 'קריטריוני זכאות', desc: 'הנחות למחיר הסמלי לפי קריטריונים (יתום מאם/מאבא וכו׳)', module: 'shop' },
  { key: 'shop.calendar', label: 'לוח ייעודי', desc: 'לוח פנימי לפגישות, מסירות וחגים קרובים (מבודד מהלוח הראשי)', module: 'shop' },
  { key: 'shop.showcase', label: 'מסך ראווה', desc: 'תצוגת הקטלוג וסיכומי הנתינה למסך גדול', module: 'shop' },
  { key: 'shop.inlinecreate', label: 'הוספת לא-רשומים', desc: 'יצירת משפחה/בן-משפחה חדשים ישירות מתוך העמודה', module: 'shop' },
```

10. מונחים (fallback בקוד): `nav.shop`='חנות' · `entity.shopProduct`='מוצר' · `entity.shopStore`='חנות' · `entity.shopCriterion`='קריטריון' · `entity.shopAssignment`='שיוך'.
11. `builder/sections.ts` — section: `{ id: 'shop', title: 'חנות', emoji: '🛍', module: 'shop', termKeys: ['nav.shop', 'entity.shopProduct', 'entity.shopStore', 'entity.shopCriterion'] }` + ודא ש-featureModuleKey ממפה 'shop'.
12. `ShopView.tsx` — טאבים (דפוס TzedakaView, state מקומי): `🛍 קטלוג` (ברירת מחדל) · `👥 מוטבים` · `🏠 טיפול` · `📅 לוח` (shop.calendar) · `🖼 ראווה` (shop.showcase).
13. **בדיקות** (דפוס tz-shell.test.ts): שרשור `modules.shop=false` ⇒ `featureOn('shop.stores')===false`; הגנת-מקור NAV+VIEWS.

## אשכול 3 · מנוע טהור + פעולות store (`חנות 3 ·`)

**קבצים:** `src/lib/monthGrid.ts` (חדש) · `src/components/shop/lib.ts` (חדש) · `src/components/tzedaka/lib.ts` (הכללה) · `useApp.ts`.

14. **הכללת הגריד (נכס משותף):** חלץ את `buildTzGrid` ל-`src/lib/monthGrid.ts` כגנרי `buildMonthGrid<E extends { date: IsoDate }>(events: readonly E[], anchorIso: IsoDate, hebMode: boolean): MonthGrid<E>` — אותה לוגיקה בדיוק (לועזי 42 תאים / עברי א׳-עד-סוף-חודש, חגים, gem). ‏`tzedaka/lib.ts` הופך ל-wrapper דק שקורא לגנרי ושומר את החתימה הקיימת — **כל בדיקות ה-tz הקיימות חייבות להישאר ירוקות כמות שהן (זה ה-ratchet של הרפקטור)**.
15. `shop/lib.ts` — טהור, חתימות מחייבות:
    - `effectivePrice(basePrice: number, criterionIds: readonly Id[], criteria: readonly ShopCriterion[]): number` — ההנחה הגבוהה מבין הקריטריונים (לא מצטבר — ברירת ארכיטקט), עיגול `Math.round`, לא שלילי.
    - `upcomingHolidays(fromIso: IsoDate, days = 45): { iso: IsoDate; name: string }[]` — סריקת הימים קדימה עם `holidayOf` מ-`lib/hebrew` (ייבוא טהור), שם-חג ייחודי (החזר את היום הראשון של כל חג).
    - `assignmentRedeemed(a, componentId, holiday?)` — האם רכיב מומש (למתנת-חג: מומש לאותו שם-חג באותה שנה עברית — השווה לפי holiday+שנת ה-date).
    - `needsCare(db, todayIso)` — פריטים ממוינים: `holidayDue` (שיוך active עם רכיב holidayGift, חג בתוך ≤30 יום, אין מימוש לאותו חג) · `meetingPending` (רכיב meeting ללא מימוש) · `couponPending` (רכיב coupon ללא מימוש). כל פריט `{ kind, assignmentId, componentId, label, hint }`.
    - סכומים: `givenValue(assignments)` (Σ value של המימושים) · `collectedPaid(assignments)` (Σ paid) · `subsidyTotal` = value−paid · `productAssignments(assignments, productId)`.
    - `beneficiaryLabel(db, a): string` — "משפחת X — שם הבן/בת" (חיפוש famId/memberId; טהור, db כפרמטר).
16. פעולות store (דפוס tz, קידומות: מוצר `shp`, חנות `shs`, קריטריון `shc`, שיוך `sha`, מימוש `shr`, אירוע `she`):
    - `upsertShopProduct/Store/Criterion/Assignment/Event` — upsert לפי id, ריק ⇒ nextId. רכיבי מוצר מקבלים id ב-upsert (רכיב בלי id ⇒ nextId('shpc') — בסדר שהקידומת שונה, רק ייחודיות).
    - `deleteShopProduct(id): boolean` — **חסום** כשקיימים שיוכים active למוצר (טוסט "יש לסיים קודם את השיוכים"); מותר כשכולם done/stopped.
    - `deleteShopStore(id)` — קופונים שמצביעים עליה מקבלים `storeId:''` (אין אובדן).
    - `deleteShopCriterion(id)` — מוסר מכל `criterionIds` (map+filter).
    - `deleteShopAssignment(id)` — מוחק + מנקה `shopEvents` עם `assignmentId` (בלי יתומים).
    - `deleteShopEvent(id)`.
    - `addShopRedemption(assignmentId, r: Omit<ShopRedemption,'id'>): { ok: boolean }` — דוחה paid/value לא-סופיים או שליליים (טוסט, בלי לגעת ב-db); paid=0 חוקי (מתנה מלאה). **לא נוגע ב-receiptSeq/donationSeq/supporters/enrollments/events — בידוד.**
17. **בדיקות** (`shop/__tests__/shop-lib.test.ts` + store):
    - effectivePrice: שני קריטריונים 25%/60% ⇒ 60% בלבד; בלי קריטריונים ⇒ base; עיגול; לא-שלילי.
    - upcomingHolidays מחזיר חג ידוע בטווח (השתמש בתאריך עוגן קבוע, לא isoToday!).
    - assignmentRedeemed למתנת-חג: מומש לחג X שנה שעברה ⇒ לא-מומש השנה.
    - needsCare: שלושת הסוגים.
    - **ratchet בידוד (מתועד "הכרעת בעלים 30.7"):** addShopRedemption לא משנה donationSeq/receiptSeq/supporters/enrollments/events; dayItems() של הלוח הראשי לא רואה shopEvents.
    - deleteShopProduct חסום עם שיוך active; deleteShopCriterion מנקה criterionIds; רפקטור הגריד — בדיקות tz הקיימות ירוקות ללא שינוי.

## אשכול 4 · הקטלוג (`חנות 4 ·`)

**קבצים חדשים ב-`src/components/shop/`:** `CatalogTab.tsx` · `ProductForm.tsx` · `StoresPanel.tsx` · `CriteriaPanel.tsx`.

18. **CatalogTab** — גריד כרטיסי מוצרים (דפוס CoordinatorsTab): שם, תיאור, N רכיבים לפי סוג (אייקונים: 🤝 פגישה · 🎟 קופון · 🎁 מתנה · 🕎 מתנת-חג), N שיוכים פעילים, צ'יפ פעיל/לא. `➕ הוספת {termOf('entity.shopProduct','מוצר')}`.
19. **ProductForm** (מודאל): שם (חובה), תיאור, פעיל + **עורך רכיבים**: רשימה עם הוספה/מחיקה; לרכיב — סוג (select ‏4 הסוגים), תווית, שווי, מחיר סמלי, חנות (select — רק ל-coupon, מאחורי shop.stores), הערות.
20. **StoresPanel + CriteriaPanel** — שני פאנלים מתקפלים בתחתית הקטלוג (מאחורי shop.stores / shop.criteria): רשימה + הוספה/עריכה/מחיקה (useArmed). ב-CriteriaPanel: שם + אחוז הנחה, ו**כפתורי הוספה-מהירה** לשתי הדוגמאות של הבעלים: "יתום מאם", "יתום מאבא" (ממלאים את הטופס, לא שומרים לבד).
21. **בדיקות** (דפוס tz-cards): הגנת-מקור `➕ הוספת` + termOf; ProductForm בלי import מעולם הקבלות/תרומות.

## אשכול 5 · מוטבים ומימוש (`חנות 5 ·`)

**קבצים חדשים:** `AssignmentsTab.tsx` · `AssignmentForm.tsx` · `RedeemModal.tsx`.

22. **AssignmentsTab** — רשימת שיוכים מקובצת לפי משפחה (beneficiaryLabel), צ'יפ סטטוס, שם המוצר, פס התקדמות מימוש (רכיבים שמומשו/סה"כ). `➕ הוספת {termOf('entity.shopAssignment','שיוך')}`. לחיצה ⇒ כרטיס שיוך פנימי: רכיבי המוצר בשורות — לכל רכיב סטטוס (✅ מומש בתאריך + מה שולם / ⏳ ממתין), כפתור `🎁 מימוש` (RedeemModal), למתנת-חג — שורת "החג הקרוב: X" עם מצב-מימוש פר-חג. שינוי סטטוס שיוך (active/done/stopped) + מחיקה (useArmed).
23. **AssignmentForm**: מוצר (select), משפחה (datalist) → בן/בת משפחה (רשות), קריטריונים (checkboxes מ-shopCriteria + תצוגת "הנחה אפקטיבית: N%"), since (isoToday), הערות. מאחורי shop.inlinecreate: `➕ משפחה חדשה` / `➕ ילד/הורה חדש` — העתק את הדפוס מ-`tzedaka/CoordinatorForm.tsx` אחד-לאחד.
24. **RedeemModal**: תאריך (isoToday), רכיב (מוצג, לא נבחר — נפתח פר-רכיב), חג (select מ-upcomingHolidays — רק ל-holidayGift), **מחיר לתשלום** מאוכלס אוטומטית מ-effectivePrice (מוצג "מחיר מלא X − הנחה Y% = Z") וניתן לעריכה, שווי (ברירת value של הרכיב), הערה ⇒ `addShopRedemption`; טוסט "נרשם מימוש — שולם Z ₪".
25. **בדיקות:** הגנת-מקור AssignmentsTab/RedeemModal — אפס import מ-supporters/receipt; RedeemModal מכיל effectivePrice.

## אשכול 6 · טיפול משרדי (`חנות 6 ·`)

**קובץ חדש:** `HomeTab.tsx` (דפוס tzedaka/HomeTab).

26. צ'יפים: מוצרים פעילים · שיוכים פעילים · שווי שניתן (givenValue) · שולם סמלי (collectedPaid) · סובסידיה (subsidyTotal).
27. רשימת "מה מגיע וטרם נמסר" מ-`needsCare()` — כל שורה עם כפתור פעולה שפותח את ה-RedeemModal של הרכיב (holidayDue מציג את שם החג והתאריך).
28. "החגים הקרובים" — שורת צ'יפים מ-upcomingHolidays(45) עם מונה "N מתנות ממתינות" פר-חג.
29. קיצורים: `➕ מוצר` · `➕ שיוך` · `🎁 מימוש מהיר` (בחירת שיוך ⇒ רכיב ⇒ RedeemModal).

## אשכול 7 · לוח + ראווה (`חנות 7 ·`)

**קבצים חדשים:** `CalendarTab.tsx` · `ShopEventModal.tsx` · `ShowcaseTab.tsx`.

30. **CalendarTab** — דפוס tzedaka/CalendarTab על `buildMonthGrid(db.shopEvents,…)`: נפתח בעברי, מתג לועזי, חגים מודגשים; בנוסף — בתאי חג מופיע צ'יפ "🎁 N ממתינות" (מ-needsCare holidayDue לאותו חג). ‏ShopEventModal: כותרת, תאריך (HebDateInput), שעה, kind, קישור-רשות לשיוך, ✓בוצע. **בידוד:** קריאה מ-db.shopEvents בלבד; הגנת-מקור — אפס `upsertEvent`/`db.events`.
31. **ShowcaseTab** (מאחורי shop.showcase, דפוס tzedaka/ShowcaseTab בלי לוח מובילים): כרטיסי הקטלוג בתצוגה גדולה + סיכומי נתינה (שווי שניתן, משפחות נהנות, מוצרים) + `🖥 מסך מלא` overlay (dark-luxe, Escape, בלי hash).
32. **בדיקות:** דפוס tz-calendar — CalendarTab בלי upsertEvent/db.events, עם s.db.shopEvents; ShowcaseTab בלי hash.

## אשכול 8 · סגירה (`חנות 8 ·`)

33. **e2e** `toggle-matrix.mjs`: הוסף `shop: false` לשני מערכי הכל-כבוי (חפש `tzedaka: false` — שתי הופעות) + assert קישור "חנות" קיים בברירת-מחדל/נעדר בכבוי + זרימה בפרופיל ברירת-המחדל: פתיחת העמודה → הוספת מוצר "מוצר חתן" עם רכיב מתנה (שווי 200, סמלי 50) → הוספת שיוך למשפחה → מימוש → הסכום מופיע. הרץ שלוש סוויטות (build קודם).
34. **ידע:** `knowledge/CLOSED-SHOP-2026-07-30.md` + עדכון CLAUDE.md (דגלים 106→111, מונחים 37→42, מערכי ישויות 11→16, שורת מודול חנות) + עדכון DECISIONS (הכרעות החנות) + תיקון אגבי: מחיקת הערת ה-placeholder המיושנת ב-`tzedaka/TzedakaView.tsx` (ליקוי מ-AUDIT-TZEDAKA).
35. **DoD:** verify מלא ירוק · שלוש סוויטות ירוקות · כל הכרעות 1-9 ממומשות · בדיקות ה-tz הקיימות ירוקות ללא שינוי (רפקטור הגריד) · אפס שינוי בהתנהגות מסכים קיימים · דוח מסירה עם טבלת פריט-מול-סטטוס.

---

## גבולות קשיחים (חריגה = עצירה ודיווח)
- אין כתיבה ל-`db.events`, `supporters`, `enrollments`, `receiptSeq`, `donationSeq` משום מקום במודול (חריג יחיד: upsertFamily/upsertMember בהוספת לא-רשומים — הכרעה 7).
- אין נגיעה בפלטה, בדוחות, בלוח הראשי, במסך הבית הראשי ובמודול הקופות (חריג יחיד: ה-wrapper של buildTzGrid — סעיף 14, בדיקות tz נשארות ירוקות).
- שאלות מוצר חדשות — לדוח המסירה, לא להכרעה עצמאית.
