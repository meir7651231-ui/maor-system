# 🚚 פקודת-בנייה — SHOP7: מתנדבים · יום-חלוקה · מסירות (מעקב קדימה)

**מאת:** הארכיטקט · 1.8.2026 · **ענף:** `claude/what-do-you-see-bcxttj` · קידומת `גל 7 ·`. מקור: תוכנית-האב (גל E) + מחקר "בנייה חכמה" + **4 הכרעות-בעלים (1.8):** משפחות→מתנדב ישירות · מעקב **קדימה** · מתנדב = **ישות חדשה** · צורך את **shopAssignments** הקיימים.

## המודל (נעול בהכרעות הבעלים)

```
ShopAssignment (SHOP6, קיים)  ──feeds──►  Delivery (חדש)  ──assigned to──►  Volunteer (חדש)
                                              │ status: pickup → enroute → delivered
                                       grouped under
                                              ▼
                                        DistributionDay (חדש, מתוארך)
```

- **מתנדב = ישות ראשונה עצמאית**, מבודדת ככמו הקופות/החנות (בלי דליפה לתרומות/קבלות/לוח).
- **יום-חלוקה = רשומה מתוארכת** שמקבצת מסירות. (מקושר-אופציונלית ל-OrgEvent לתפיסת-חדר? **לא** — חלוקה בשטח, לא בחדר. אין קישור-לוח ב-MVP.)
- **מסירה** = מנה למשפחה, נגזרת מ-ShopAssignment פעיל, משויכת למתנדב, עם **סטטוס-קדימה** `pickup→enroute→delivered` (מכונה לינארית, כמו `courierAdvance` בלגאסי של בנייה-חכמה).
- **הקלט** = `shopAssignments` הפעילים (אותה `liveRedemptions`/`distributionListLines` מ-SHOP6). יום-חלוקה **בורר** אילו שיוכים להכניס ומשייך אותם למתנדבים. **אפס כפילות-מודל** — המסירה מצביעה על ה-assignment (`assignmentId`), לא משכפלת אותו.

## ברירות-מחדל לתת-ההכרעות שנותרו (לאישור/שינוי בדוח-המסירה)
1. **הוכחת-מסירה:** אופציונלית — הערה חופשית + סימון-שעה (`deliveredAt`). **בלי חובת-תמונה** ב-MVP (אפשר להוסיף `photoNote` בעתיד). *ברירת-מחדל: אופציונלי.*
2. **קיבולת-מתנדב:** רך — `maxDeliveries?` + `area?` (טקסט). **רמז לא-חוסם** בשיוך ("המתנדב כבר על N מסירות"). לא מסנן קשיח. *ברירת-מחדל: רמז בלבד.*
3. **צימוד-מלאי:** מסירה **לא** מפחיתה `ShopItem.stock` — המלאי הפיזי כבר טופל בקליטה/מימוש של SHOP6. המסירה = תיעוד-מסירה בלבד. *ברירת-מחדל: אפס נגיעה במלאי.*
4. **זהות יום-חלוקה:** רשומה מתוארכת עצמאית (`date` ISO), **בלי** קישור-לוח ל-MVP. *ברירת-מחדל: standalone.*

## הבידוד (הכרעות 6/16 בתוקף)
המתנדבים/ימי-החלוקה/מסירות = **עמודה מבודדת** — הכסף והאירועים לא זולגים. המסירה קוראת מ-shopAssignments (תצוגה) אך **לא כותבת** בהם כסף/S-. הסטטוס-קדימה חי רק ב-Delivery. ratchet-בידוד כמו tzedaka/shop.

## מודל-נתונים (`src/types/domain.ts`, DB_VERSION→6)
```ts
export interface Volunteer {          // מערך 19
  id: string; name: string; phone: string;
  area?: string; maxDeliveries?: number;
  active: boolean; note: string; createdAt: string;
}
export type DeliveryStatus = 'pickup' | 'enroute' | 'delivered';
export interface Delivery {           // מערך 20
  id: string; dayId: string;          // ל-DistributionDay
  assignmentId: string;               // ל-ShopAssignment (SHOP6) — הקלט
  volunteerId: string;                // מי מוסר
  familyId: string;                   // גזור ל-נוחות-תצוגה
  status: DeliveryStatus;
  deliveredAt?: string; note: string;
}
export interface DistributionDay {    // מערך 21
  id: string; date: string;           // ISO, צהריים-מקומי
  title: string; note: string; closed: boolean; createdAt: string;
}
```
מיגרציה מצטברת ב-`persist.ts`: אתחול 3 המערכים החדשים ל-`[]` אם חסרים (v5→v6).

## המנוע הטהור (`src/components/shop7/lib.ts` — נכס-כפול לבנייה-חכמה)
- `deliveriesOfDay(db, dayId)` · `deliveriesOfVolunteer(db, volId, dayId?)`
- `advanceDelivery(status): DeliveryStatus` — `pickup→enroute→delivered` (טהור, קדימה בלבד; delivered=סופי).
- `eligibleAssignmentsForDay(db)` — shopAssignments פעילים שטרם במסירה ביום (צורך `liveRedemptions`/`distributionListLines` מ-SHOP6).
- `dayProgress(db, dayId)` — `{total, delivered, enroute, pickup}` למד-התקדמות.
- `volunteerLoadHint(db, volId, dayId)` — רמז-קיבולת (לא-חוסם).
- מסננים טהורים: `filterVolunteers/filterDeliveries` דרך `smartFilter` (כמו UX גל-B½).

## פעולות-Store (`src/store/useApp.ts`)
`upsertVolunteer/deleteVolunteer` · `upsertDistributionDay/closeDay` · `assignDelivery(dayId, assignmentId, volunteerId)` (יוצר Delivery ב-pickup) · `advanceDeliveryStatus(id)` (קדימה, לא-הפיך מ-delivered) · `unassignDelivery(id)`. כולם seq/nextId; **אפס נגיעה** ב-receiptSeq/donationSeq/shopReceiptSeq.

## UI (`src/components/shop7/`)
- `Shop7View` — עמודה: מתנדבים · ימי-חלוקה · לוח-מסירות פר-יום (קיבוץ פר-מתנדב, כפתור-התקדמות פר-מסירה עם ה-tracker) · ראווה.
- `VolunteerForm` · `DistributionDayForm` · `AssignPanel` (בורר shopAssignments פעילים→מתנדב) · `DeliveryBoard` (סטטוס-קדימה + הערה).
- מגודר `moduleOn(config, 'shop7')` (דגל חדש ב-features.ts) + `termOf`. ניווט בשלושת השלדים.

## חיווטים (CONNECT-סגנון, תצוגה בלבד)
- כרטיס-המשפחה: פאנל "מסירות" (למשפחה — סטטוס המנות שלה). `familypanel`.
- מסך-הבית: מונה "מסירות היום" (`careCounts`, home.crosscare) — מונה-עם-קפיצה בלבד.
- דמו: `demo.json` מקבל מתנדב+יום-חלוקה+מסירות.
- תדפיס: רשימת-מסירות פר-מתנדב (מרחיב את `distributionListLines` הקיים).

## בדיקות (ratchet + טוהר)
- יחידה: `advanceDelivery` (קדימה, delivered סופי) · `eligibleAssignmentsForDay` (לא כולל שכבר-משויך) · `dayProgress` · בידוד (אין S-/כסף במסירה).
- הגנת-מקור: `assignDelivery` לא נוגע במוני-הקבלות; העמודה מגודרת moduleOn.
- e2e: `demo-walkthrough` — יצירת מתנדב→יום→שיוך→התקדמות עד "נמסר".

## סדר-אשכולות (commit פר-אשכול, verify:fast בכל commit)
1. `גל 7 · יסוד` — טיפוסים+מיגרציה+lib טהור+בדיקות-יחידה+store+ratchet-בידוד.
2. `גל 7 · UI` — Shop7View + טפסים + לוח-מסירות + דגל+ניווט.
3. `גל 7 · חיווטים` — כרטיס-משפחה/בית/דמו/תדפיס.
4. `גל 7 · סגירה` — שלוש הסוויטות + CLOSED-SHOP7 + עדכון CLAUDE.md/DECISIONS + ביקורת-ארכיטקט.

**גבולות:** בידוד כספי מוחלט; אין קישור-לוח ב-MVP; המלאי לא זז; הקלט = shopAssignments קיימים (אין כפילות-מודל). תת-ההכרעות (§ברירות-מחדל) — לאישור בדוח-המסירה, לא להכרעת-בנאי.
