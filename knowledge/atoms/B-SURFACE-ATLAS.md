# אטלס-אטומים · משטח-B (תרומות + סנכרון) — מפת-בטיחות לרי-ארכיטקצורה

> נחיל-פירוק read-only (14.8.2026, 25 סוכנים). **12 מודולים · 185 אטומים · 145 נוגעי-תרומות.**
> מסלול-B: המודל-המקומי `Supporter.donations[]` נשאר מקונן; הפיצול-פר-ייעוד חי **רק בשכבת-הסנכרון**.
> אטומים גולמיים: `knowledge/atoms/b-surface-atoms.json`.

---

## מפת-הפגיעה + סדר-הבנייה (סינתזת-הארכיטקט)

להלן ניתוח-הארכיטקט למסלול-B, מבוסס-אטומים. **הערת-מפתח שמכתיבה את כל הפרופיל:** מסלול-B משאיר את המודל-המקומי `Supporter.donations[]` מקונן — הפיצול חי **רק בשכבת-הסנכרון**. לכן רוב "השבירות" שהאטומים מזהירים מפניהן (sp.donations ריק ⇒ קריסת supDonEvents/hok/aggregates) **נמנעות כל עוד ה-reassemble רץ לפני שה-store המקומי מאוכלס**. הסיכון האמיתי מצטמצם לשני גבולות: (א) explode-בדחיפה בלי לאבד את המונה-הגלובלי; (ב) reassemble-מלא-במשיכה לפני שצרכן-מקומי כלשהו רץ. כל אטום שקורא `sp.donations` נשאר תקין אם-ורק-אם האינווריאנט הזה נשמר.

---

## (1) פאזות — אטומים, קבצים, סיכון-עיקרי

### P1 — מודל + המרה-טהורה (explode/reassemble)
**אטומים/קבצים:** `interface Donation` (domain.ts:339) · `interface Supporter` (domain.ts:429) · `interface Db` seqs (domain.ts:807) · `emptyDb` (domain.ts:898) · `supporterAggregates` (supporterAgg.ts:27) · **פונקציות-חדשות טהורות** `explode(Supporter)→DonationDoc[]` + `reassemble(DonationDoc[], Supporter)→Supporter`.
**מה נדרש:** ל-`Donation` להוסיף `id` יציב + `supporterId` (היום הזהות = מיקום-במערך; אין id/supporterId). `explode` ממפה כל תרומה למסמך עם מפתח-אוסף = `designation ?? DEFAULT_DESIGNATION`. `reassemble` ממזג בחזרה ל-`donations[]` ממוין-כמו-היום.
**סיכון-עיקרי:** `designation` אופציונלי — **רוב** התרומות בלעדיו (additive). בלי אוסף-ברירת-מחדל מפורש כל תרומה-ללא-ייעוד נעלמת ב-explode. אינווריאנט-P1: `reassemble(explode(sp)) ≡ sp` ביט-זהה (ratchet חובה, כולל סדר-donations שעליו נשען `supDonEvents`/`first`/`last`).

### P2 — מנוע-סנכרון (cloud-diff / cloud / cloudSync)
**אטומים/קבצים:** `applyEntityPartial + sanitizeIncoming` (cloud-merge.ts:43) · `cloudSync clamp` (cloudSync.ts:120) · `cloud-diff` (diffDb) · `restoreDb`/`cloudReplaceNow` (useApp.ts:2460) · `resetAll` (useApp.ts:2491) · `migrate` דדופ (persist.ts:293/327).
**מה נדרש:** בדחיפה — explode לפני הכתיבה, האוסף-החדש נכתב batched לצד מסמך-התומך (בלי donations); במשיכה — reassemble לפני `applyEntityPartial` כך שה-store המקומי תמיד מקבל תומך-מלא. `donationSeq` **נשאר מונה-meta-גלובלי-יחיד** — clamp `Math.max` ללא שינוי. `cloud-diff` חייב לזהות "תרומה-השתנתה" גם כשהיא באוסף-אחר.
**סיכון-עיקרי:** מסמך-אחד-פר-תומך הוא ההנחה שעליה בנוי כל ה-merge (upsert-לפי-id, אין merge-עמוק). פיצול = כתיבה רב-מסמכית לא-אטומית ⇒ race על `donationSeq` + חלון שבו מסמך-התומך עודכן אך מסמכי-התרומה לא (או להפך) ⇒ **דליפת-סנכרון של קבלות-מס** אם diffDb לא תופס את השינוי באוסף-הנפרד.

### P3 — Rules
**אטומים/קבצים:** `firestore.rules` (בריפו, ממתין-לפרסום-בעלים) · חוזה `purpose`/`designation` דרך `supporterPurposes`/`supporterVisibleForDesignations`/`allDonationPurposes` (supporters/lib).
**מה נדרש:** אוסף-תרומות-חדש keyed by supporterId (+designation) עם כללי-קריאה פר-עובד לפי מותר-הייעוד; שמירה על `cloudRoot:true` = נתיבי-שורש ביט-זהה (ratchet).
**סיכון-עיקרי:** `purpose` הוא מסנן-ההרשאה-פר-עובד. אם ה-Rules נפרסים לפני מיגרציה, או אם האוסף-החדש חשוף בלי אכיפת-designation — חשיפת-תורמים-אסורים. הכלל שהבעלים מפרסם ידנית (סיכון-סדר מוכר מ-CLOUD2/ONBOARD).

### P4 — מיגרציה חיה
**אטומים/קבצים:** `migrate` (persist.ts:293+327) · `emptyDb` (Db-level אוסף-חדש) · `restoreDb`/`resetAll`/`cloudReplaceNow`.
**מה נדרש:** explode חד-פעמי של donations כל תומך → האוסף, **בלי לגעת ב-donationSeq**; אידמפוטנטי + הפיך; מחיקה-מדורגת מפורשת ב-delete/reset.
**סיכון-עיקרי:** `migrate` מרפא count/ils/usd מ-`supporterAggregates(s)` בכל טעינה. אם ה-reassemble חלקי/עצל וה-`s.donations` המקומי ריק ⇒ migrate **מאפס בשקט את כל הצבירה הכספית** של כל התורמים (persist.ts:327). זהו הסיכון החמור-ביותר במפה.

### P5 — UI + ניקוי
**אטומים/קבצים:** `supDonEvents` (:234) · `personalCalEntries`/`orgCalEntries` (:283/295) · `supporterPurposes`/`visibleSupportersForDesignations` (:32–64) · `hokRecordedThisMonth`/`hokDue` (:651/661) · `supIls/supUsd/supCount/supLast` (:94) · `totalLabel`/`supScoreBins`.
**מה נדרש:** מאחר שהמודל-המקומי נשאר מקונן — כל אלה **ממשיכים לעבוד ללא שינוי**. הניקוי = תיקון הדליפה-הקיימת + UI לניהול אוסף-הייעוד.
**סיכון-עיקרי:** `visibleSupportersForDesignations` כבר-היום מסנן `donations[]` אך הצבירה (`supIls`/פודיום/סה"כ) קוראת את המונים-השמורים ומתעלמת מהסינון ⇒ **דליפה-חוצה-ייעוד קיימת**. מסלול-B הוא ההזדמנות לתקן ע"י צבירה-פר-ייעוד — אך אם לא מתקנים, הפיצול לא מרפא אותה.

---

## (2) אינווריאנטים-קדושים (אסור לשבור)

1. **רצף-rid רציף יחיד:** `donationSeq` נשאר **מונה-meta-גלובלי-אחד** — לעולם לא פר-ייעוד. קבלת §46 דורשת רצף-רץ-יחיד; פיצול-המונה = פגם-רגולטורי (`cloudSync clamp`, `interface Db`).
2. **מונים-רק-עולים:** `Math.max(local,cloud)` על donationSeq/receiptSeq/shopReceiptSeq/seq (cloudSync.ts:120) + clamp בשחזור (restoreDb.ts:2460, כולל shopReceiptSeq שנשמט בעבר). explode/reassemble אסור שיגע במונה.
3. **קבלות = receipts-only:** המונים-השמורים = `donations` בלבד; `hist` מתווסף רק בשכבת-התצוגה, פעם-אחת (`supporterAggregates` · `supCount/supIls`). אין להזין hist למונה-השמור (באג נחיל-9×9 / 13.8).
4. **hist = משותף, מקונן, מחוץ-לפיצול:** hist נשאר בתוך מסמך-התומך, אינו קבלה, אין לו rid/designation. אסור להזרים אותו לאוסף-הייעוד.
5. **cloudRoot ביט-זהה:** אתר-השורש (default) חייב נתיבים ביט-זהים; הפיצול מגודר-דגל ואינו נוגע בשורש עד הכרעת-בעלים (ratchet סחף).
6. **rid לעולם לא אובד** (`mergeSupporterInto`/`planRidRenumber`) + **אטומיות addDonation** (הקצאת-rid + קידום-מונה + כתיבה = טרנזקציה-אחת).

---

## (3) חמשת הסיכונים-הגבוהים ביותר (אטום מדויק)

1. **איפוס-שקט של הצבירה במיגרציה — `migrate` ריפוי-מצבור (persist.ts:327 → `supporterAggregates` supporterAgg.ts:27).** `sp.donations` undefined ⇒ `Array.isArray→[]` ⇒ מחזיר `{count:0,ils:0,usd:0}` בלי לזרוק ⇒ migrate דורס את המונים-השמורים ל-0 בטעינה-הראשונה = **אובדן-נתונים-מוצג לכל התורמים**. מיטיגציה: reassemble-מלא לפני migrate; ratchet "migrate לא מוריד count/ils/usd קיימים".

2. **פיצול-donationSeq / race רב-מסמכי — `addDonation` (useApp.ts:1622) + `cloudSync clamp` (cloudSync.ts:120).** היום הכל setDb-יחיד-אטומי. כתיבה-לאוסף-נפרד פותחת חלון בין קריאת-המונה לכתיבת-הקבלה ⇒ D- כפול/מדולג. המונה **חייב** להישאר גלובלי-יחיד. פגם-רגולטורי אם יתפצל פר-ייעוד.

3. **דליפת-סנכרון של קבלות-מס — `applyEntityPartial` + `cloud-diff` (cloud-merge.ts:43).** diffDb מזהה "תומך-השתנה" על מסמך-התומך; שינוי-תרומה שקורה באוסף-אחר לא ייתפס ⇒ קבלת-מס לא-מסונכרנת בין-מכשירים. דורש EntityCol חדש + לוגיקת-merge משלו (upsert-לפי-rid).

4. **שער-הרשאה-פר-עובד פרוץ — `supporterPurposes`/`supporterVisibleForDesignations` (supporters/lib:32/45).** אם donations לא-טעונות ⇒ `purposes=[]` ⇒ תומך נחשב "משותף" ⇒ מחזיר `true` תמיד ⇒ תורם-אסור נחשף. הראות חייבת להיגזר מ"לאילו אוספי-ייעוד לעובד יש גישה", לא מסריקת donations.

5. **דדופ-rid מפסיק לרוץ — `planRidRenumber` (persist.ts:293).** בנוי על `flatMap(supporters.donations)`. אם דדופ-ה-race לא רץ על האוסף-החדש ⇒ **כפל-D- שנוצר במרוץ-ענן שורד בשקט** (בדיוק מה שהפס נבנה למנוע, #5.5a). חייב לשכתב לרוץ על האוסף בשמירה על דטרמיניזם-עצמאי-סדר.

*(סיכון-משנה בורדרליין: `restoreDb`/`resetAll`/`deleteSupporter` — מחיקה/שחזור באוסף-נפרד אינם "חינם"; דורשים מחיקה-מדורגת מפורשת אחרת נשארות תרומות-יתומות = קבלות D- בלי תורם, פגם-רגולטורי.)*

---

## (4) סדר-בנייה מומלץ (ממזער סיכון)

1. **P1 טהור-בלבד, אפס-שינוי-התנהגות.** מוסיפים `Donation.id`+`supporterId` (additive, migrate מרפא ישנים) + `DEFAULT_DESIGNATION` + `explode`/`reassemble` טהורות. **שער-כניסה:** ratchet `reassemble(explode(sp)) ≡ sp` ביט-זהה (כולל סדר, first/last, hist-לא-נוגע). כלום עוד לא מחווט לענן ⇒ סיכון-אפס לפרודקשן.

2. **P2 מחווט-אך-דורמנטי מאחורי דגל, שורש-פטור.** explode-בדחיפה + reassemble-במשיכה-לפני-`applyEntityPartial`, מגודר-דגל וכבוי-כברירת-מחדל; `cloudRoot` פטור (ratchet ביט-זהה). `donationSeq` נשאר מונה-גלובלי — `cloudSync clamp` ללא שינוי. משכתבים `planRidRenumber` לרוץ על האוסף תוך שמירת-דטרמיניזם. מוודאים `restoreDb`/`resetAll`/`delete` מתאמים מחיקה-מדורגת. **אימות:** סוויטת-דפדפן + הזרקת race דו-מכשירי.

3. **P3 Rules בריפו, פרסום-בעלים לפני שהדגל נדלק.** אוסף-חדש keyed by supporterId+designation; אכיפת-קריאה פר-עובד. הרשאת-הייעוד (`supporterVisibleForDesignations`) עוברת מ"סריקת-donations" ל"גישה-לאוסף-ייעוד" — סוגר את סיכון-4 לפני שהאוסף חי.

4. **P4 מיגרציה-חיה בחלון-בעלים בלבד, אידמפוטנטית+הפיכה.** explode חד-פעמי של כל התורמים לאוסף, **בלי לגעת ב-donationSeq**, עם גיבוי-כפוי-לפני (כמו הצפנת-ענן). אימות: הצבירה המוצגת ביט-זהה לפני/אחרי; migrate לא מאפס. הפיך = reassemble יכול לשחזר את המצב-המקונן.

5. **P5 UI + ניקוי, ותיקון-הדליפה-הקיימת.** מאחר שהמודל-המקומי נשאר מקונן, `supDonEvents`/`hok`/`supIls` וכל צרכני supporters/lib עובדים כמות-שהם. הניקוי: (א) תיקון `visibleSupportersForDesignations` לצבירה-פר-ייעוד (סוגר דליפה-קיימת); (ב) UI לניהול אוסף-הייעוד. **אף פעם אחרונה** — כי היא הנראית-למשתמש ותלויה בכל השכבות למטה.

**חוט-מנחה לכל הפאזות:** `donationSeq` מונה-גלובלי-יחיד לאורך הכל · `cloudRoot` ביט-זהה (ratchet) · `reassemble∘explode = זהות` (ratchet) · המודל-המקומי המקונן לעולם לא ריק כשצרכן-מקומי רץ · מיגרציה אידמפוטנטית+הפיכה+מגובה.


---

## אינדקס-אטומים פר-מודול (נוגעי-תרומות בלבד)


### src/types/domain.ts — מודל Supporter/Donation + רצף-הקבלות (מפת-בטיחות לרי-ארכיטקצורת מסלול-B)

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `interface Donation` | src/types/domain.ts:339 | pure | זו הישות המרכזית שמסלול-B מוציא ממקונן-בתומך לאוסף-ענן-נפרד פר-ייעוד. כדי לחלץ יש להוסיף id יציב + supporterId (היום אין — הזהות היא המיקום-במערך; migrate/de… |
| `interface Supporter` | src/types/domain.ts:429 | pure | מסלול-B מרוקן את Supporter.donations (עובר לאוסף חיצוני). כתוצאה: (1) supporterAggregates שרץ ב-addDonation/migrate/runAudit על sp.donations יחזיר 0 ⇒ count/… |
| `interface Hok` | src/types/domain.ts:417 | pure | hokRecordedThisMonth סורק את sp.donations לחיפוש קבלת-החודש-הזה בקטגוריית HOK_CAT. אם donations יעבור לאוסף-חיצוני, לוגיקת 'האם ההו"ק נרשמה החודש' תשבר אלא א… |
| `interface Db (receiptSeq/donationSeq/shopReceiptSeq)` | src/types/domain.ts:807 | reads-store | זהו הליבה הרגישה-ביותר של רי-ארכיטקצורה שנוגעת בקבלות-מס. donationSeq יחיד-גלובלי מבטיח רציפות-חד-משמעית של D-. פיצול donations לאוסף-פר-ייעוד לא משנה את המו… |
| `emptyDb` | src/types/domain.ts:898 | pure | אין emptySupporter — כך שאם מסלול-B יזדקק למבנה-תומך-ריק עם donations מנותק, אין נקודת-מרכוז אחת לעדכן; כל אתר-יצירת-תומך (טופס, ייבוא, merge) בונה תומך inli… |
| `addDonation (store)` | src/store/useApp.ts:1622 | writes-store | לב-הבטיחות של מסלול-B. היום כל הפעולה היא setDb יחיד-אטומי: קריאת donationSeq + כתיבת התרומה למערך-המקונן + עדכון-המונים — הכל בטרנזקציית-store אחת, ולכן אין… |
| `supporterAggregates` | src/lib/supporterAgg.ts:27 | pure | פונקציה זו מגלמת את החוזה 'המונים-השמורים = donations-בלבד'. אם donations יעבור לאוסף-חיצוני, sp.donations יהיה ריק ⇒ הפונקציה תחזיר 0/0/0 והמונים יתאפסו ב-m… |
| `supCount / supIls / supUsd / supLast` | src/components/supporters/lib.ts:94 | pure | מסלול-B מפרק את ההנחה sp.count/ils/usd='נגזרת-donations-מקוננת'. אם המונה-השמור יתאפס (donations נותקו) בעוד hist נשאר מקונן, supIls/supCount יציגו רק-hist ⇒… |
| `applyEntityPartial + sanitizeIncoming (LIST_FIELDS)` | src/lib/cloud-merge.ts:43 | pure | **נקודת-השבירה המרכזית של הענן.** כל ארכיטקטורת-הסנכרון מניחה 'תומך = מסמך-אחד עם donations מקונן'. מסלול-B (donations כאוסף-Firestore-נפרד פר-ייעוד) מבטל את… |
| `migrate donation dedup (planRidRenumber)` | src/store/persist.ts:299 | pure | פס-הריפוי הזה — הרשת-הבטיחותית של רציפות-D- מול race בין-מכשירי — בנוי במפורש על 'flatMap(supporters.donations)' (מבנה-מקונן). מסלול-B מוציא את donations מהת… |
| `HOK_CAT / hokRecordedThisMonth` | src/components/supporters/lib.ts:648 | pure | hokRecordedThisMonth סורק sp.donations. מסלול-B מרוקן אותו ⇒ הפונקציה תמיד תחזיר false ⇒ 'ההו"ק לא נרשמה' יופיע גם אחרי רישום (בית/מבט-הנהלה/סינון-הו"ק). כיו… |
| `addPayment (store)` | src/store/useApp.ts:1492 | writes-store | זהו העמית-התאום של addDonation על צד ה-R- (receiptSeq). הוא לא ב-B — כל שינוי בחוזה {ok,rid} או בסדר שוער-לפני-קידום-מונה שובר את רציפות קבלות-המס בדיוק כמו … |
| `restoreDb (store)` | src/store/useApp.ts:2460 | writes-store | אם מבנה donations/רצף-הקבלות משתנה והשחזור מדלג clamp על מונה חדש, גיבוי ישן ידרוס את מסמך ה-meta בענן לערך נמוך ⇒ הקבלה הבאה מקבלת מספר שכבר הונפק. משטח קרי… |
| `mergeSupporterInto` | src/lib/dedup.ts:317 | pure | נוגע ישירות ב-Supporter.donations וב-rid — אם מבנה התרומות/מפתח-הצבירה משתנה תחת המיזוג, תרומות או rid-ים עלולים ליפול בשקט (אובדן קבלת-מס). מחשב את הצבירה ב… |
| `mergeSupporters (store)` | src/store/useApp.ts:1574 | writes-store | המשטח שמפעיל את מיזוג-התרומות בפועל על ה-store; שינוי במבנה donations יכול לגרום לו לשמור supporter עם צבירה לא-עקבית. נעדר מהאטומים לצד mergeSupporterInto. |
| `addShopRedemption (store)` | src/store/useApp.ts:1900 | writes-store | נוגע בשלישיית-מוני-הקבלות (shopReceiptSeq) שהיא חלק מאטום ה-Db, אך המשטח עצמו נעדר. בורדרליין: מבודד-במכוון מ-donations, אך שינוי בחוזה-המונים/clamp צריך לכל… |

### src/components/supporters/lib.ts — מנוע-הצבירה של התורמים

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `supDonEvents` | src/components/supporters/lib.ts:234 | pure | **נשבר ישירות.** קורא את מערך sp.donations המקונן ומציג d.rid. במסלול-B (donations→אוסף-ענן-נפרד פר-ייעוד): (1) sp.donations ריק/לא-קיים ⇒ הרשימה תציג רק his… |
| `supporterPurposes` | src/components/supporters/lib.ts:32 | pure | **נשבר.** מסתמך על donations מקונן כדי לגזור את קבוצת-הייעודים. במסלול-B פר-ייעוד: אם donations נטענות פר-אוסף-ייעוד, supporterPurposes על תורם עם donations … |
| `supporterVisibleForDesignations` | src/components/supporters/lib.ts:45 | pure | **נשבר** דרך supporterPurposes: אם donations לא-מקוננות/לא-טעונות ⇒ purposes=[] ⇒ מחזיר true תמיד ⇒ שער-ההרשאה-פר-עובד פרוץ במסלול-B. במעבר פר-ייעוד, הראות צ… |
| `visibleSupportersForDesignations` | src/components/supporters/lib.ts:64 | pure | כפול-שבור במסלול-B: (1) דרך supporterVisibleForDesignations — שער פרוץ אם purposes לא נגזרים מ-donations מקוננות. (2) **פער-קיים שמחריף:** הפונקציה מסננת don… |
| `hokRecordedThisMonth` | src/components/supporters/lib.ts:651 | pure | **נשבר קריטית.** ה-.some סורק את sp.donations המקונן. במסלול-B (donations→אוסף-נפרד): אם התרומות לא-טעונות/הועברו ⇒ some מחזיר false תמיד ⇒ hokRecordedThisMo… |
| `hokDue` | src/components/supporters/lib.ts:661 | pure | **נשבר** דרך hokRecordedThisMonth: במסלול-B אם donations אינן זמינות-מקומית ⇒ כל הו"ק-פעיל ייחשב 'טרם-נרשם' ⇒ hokDue מחזיר רשימה מנופחת ⇒ רישום-כפול וקבלות D… |
| `mergeHist` | src/components/supporters/lib.ts:526 | pure | אם donations/hist ישנו מבנה (מטבע ברירת-מחדל, שדה amount) — מפתח-המיזוג נשבר ⇒ שכפול-עסקאות או אובדן-היסטוריה; הצבירה המוצגת (supIls/supCount שנשענים על hist… |
| `parseSupporterGrid` | src/components/supporters/lib.ts:385 | pure | מבנה hist/donations משתנה ⇒ שורות-הסליקה נקלטות שגוי או נופלות בשקט (כמו שכבר קרה עם excel-serial); הצבירה-כולל-היסטוריה מזייפת. |
| `parseSupporterCsv` | src/components/supporters/lib.ts:475 | pure | כל שינוי במבנה donations/hist מתפשט דרך parseSupporterGrid. |
| `mergeSupporterRow` | src/components/supporters/lib.ts:606 | pure | אם המונים השמורים יתחילו להיגזר מ-hist כאן — יישבר אינווריאנט-הענן 'מונים רק עולים'; שינוי מבנה hist ⇒ מיזוג שגוי. |
| `newSupporterFromRow` | src/components/supporters/lib.ts:621 | pure | אתחול donations/מונים שגוי ⇒ תורם חדש שהצבירה שלו לא מתיישרת; מבנה hist שונה ⇒ נפילה במיזוג הראשוני. |
| `planSupporterImport` | src/components/supporters/lib.ts:567 | pure | אם הקיבוץ פר-id יישבר ⇒ אובדן-היסטוריה בקובץ-עסקאות מרובה-שורות; מבנה hist שונה ⇒ fillEmpty ממזג שגוי. |
| `fillEmpty` | src/components/supporters/lib.ts:489 | pure | אם hist יעבור ל-spread רגיל (דריסה) ⇒ אובדן-עסקאות בתוך-הקובץ; פרטי (helper) אך קריטי לשלמות-ההיסטוריה. |
| `allDonationPurposes` | src/components/supporters/lib.ts:82 | pure | אם donations.purpose ישנה שם/מבנה ⇒ רשימת-הייעודים ריקה ⇒ מנגנון הרשאת-הייעוד פר-עובד קורס (חשיפת-יתר או הסתרת-יתר של תורמים). |
| `personalCalEntries` | src/components/supporters/lib.ts:283 | pure | שינוי מבנה donations/rid ⇒ שורות-הלוח האישיות מציגות סכום/קבלה שגויים או נעלמות. |
| `orgCalEntries` | src/components/supporters/lib.ts:295 | pure | שינוי מבנה donations/rid ⇒ הלוח הכלל-ארגוני שגוי; אם הקורא לא מזין את הרשימה-הגלויה ⇒ דליפת-סכומים חוצת-ייעוד. |
| `donCalMonthLine` | src/components/supporters/lib.ts:309 | pure | שינוי במטבע/סכום-התרומה ⇒ סיכום-החודש בלוח שגוי. |
| `totalLabel` | src/components/supporters/lib.ts:208 | pure | שינוי מבנה hist/מונים ⇒ הסכום המוצג בכרטיס/רשימה מזויף; משטח-התצוגה המרכזי של הצבירה. |
| `supScoreBins` | src/components/supporters/lib.ts:157 | pure | שינוי בצבירה (hist/מונים) מזיז את הציון ⇒ ההיסטוגרמה מציגה התפלגות-דרגות שגויה. |

### src/store/useApp.ts — פעולות-תרומה, רצף-קבלות ומונים

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `addDonation` | src/store/useApp.ts:1622 | writes-store | מסלול-B (donations כאוסף-ענן נפרד פר-ייעוד) שובר: (1) 's.donations' לא קיים יותר על התומכ/ת ⇒ ה-map שבונה [{..donation,rid}, ...s.donations] קורס/כותב לשדה י… |
| `mergeSupporters` | src/store/useApp.ts:1574 | writes-store | מסלול-B שובר את mergeSupporterInto (dedup.ts:317) שמניח keep.donations + drop.donations כמערכים מקוננים: הוא משרשר [...keep.donations, ...drop.donations], ממ… |
| `deleteSupporter` | src/store/useApp.ts:1589 | writes-store | מסלול-B: מחיקת donations כבר לא 'חינם' — היום היא נגזרת ממחיקת האובייקט המקונן. באוסף-נפרד צריך מחיקה-מדורגת מפורשת של כל מסמכי-התרומה של id (אחרת נשארות תרו… |
| `deleteSupporters` | src/store/useApp.ts:1603 | writes-store | כמו deleteSupporter אך מוגבר: מחיקת-אצווה של donations כאוסף-נפרד = טרנזקציה על עשרות/מאות מסמכי-תרומה. ה-set-האטומי-היחיד הנוכחי לא ניתן לשחזור באוסף-ענן בל… |
| `supporterAggregates` | src/lib/supporterAgg.ts:27 | pure | מסלול-B: הפונקציה מקבלת את donations כמערך-מקונן דרך Pick<Supporter,'donations'>. אם donations הם אוסף-ענן נפרד, הקוראים (addDonation, migrate, audit, wall) … |
| `restoreDb` | src/store/useApp.ts:2460 | writes-store | מסלול-B: השחזור מניח שהגיבוי הוא db-מקונן-שלם — כל donations בתוך supporters. אם donations הם אוסף-ענן-נפרד, גיבוי-ה-JSON חייב לכלול גם את האוסף, ו-restoreDb… |
| `resetAll` | src/store/useApp.ts:2491 | writes-store | מסלול-B: איפוס-מקומי מרוקן את db, אך אוסף-donations-הענן הנפרד לא ירוקן אוטומטית — cloudReplaceNow דוחף מחיקות רק על ה-db. תרומות באוסף-הנפרד יישארו יתומות (… |
| `cloudSync — clamp מונים (מונים-רק-עולים)` | src/store/cloudSync.ts:120 | writes-store | מסלול-B: donationSeq הוא מונה-מסמך-יחיד ב-meta-הענן, ממוזג בנפרד מהתרומות. אם donations הופכים לאוסף-ענן-נפרד פר-ייעוד, נשאלת השאלה האם המונה נשאר גלובלי (Ma… |
| `migrate — דדופ-rid + ריפוי-מצבור` | src/store/persist.ts:293 | writes-store | מסלול-B: migrate סורק donations דרך s.donations המקונן — flatMap((s,si)=>s.donations.map(...)). אם donations הם אוסף-נפרד, הדדופ (planRidRenumber) והריפוי (s… |
| `mergeSupporterInto` | src/lib/dedup.ts:317 | pure | מסלול-B: הפונקציה משרשרת מערכי-donations מקוננים ([...keep.donations,...drop.donations]). באוסף-נפרד היא לא יכולה להישאר טהורה — המיזוג הופך לשכתוב-בעלות על … |
| `saveSupporter` | src/store/useApp.ts:1571 | writes-store | מסלול-B: saveSupporter כותב את התומכ/ת השלם כולל s.donations. אם donations הם אוסף-נפרד, ה-upsert חייב **לא** לכתוב donations (אחרת דורס/מכפיל את האוסף) — צר… |

### src/lib/supporterAgg.ts (+ קוראים: persist.migrate · useApp.addDonation · audit.runAudit; שכבת-תצוגה: components/supporters/lib.ts)

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `supporterAggregates` | src/lib/supporterAgg.ts:27 | pure | מסלול-B (donations יוצא ממקונן-בתומך לאוסף-ענן-נפרד פר-ייעוד): החתימה Pick<Supporter,'donations'·'hist'> מניחה ש-sp.donations הוא מערך נוכח על אובייקט-התומך.… |
| `migrate (ריפוי-עצמי מצבורים)` | src/store/persist.ts:327 | reads-store | זהו הקוד המסוכן ביותר למסלול-B. הוא (א) קורא s.donations ישירות מהאובייקט המקונן — אם donations יעברו לאוסף-נפרד, s.donations=undefined ⇒ supporterAggregates… |
| `addDonation` | src/store/useApp.ts:1622 | writes-store | כרגע ההוספה היא spread מקומי `[{...donation,rid}, ...s.donations]` על התומך המקונן, ואז חישוב-מצבור מיידי מאותו מערך. מסלול-B (אוסף פר-ייעוד): (א) ההוספה חיי… |
| `runAudit (בדיקת-עקביות מצבור מול פירוט)` | src/lib/audit.ts:190 | reads-store | מסלול-B: אם sp.donations=undefined (עבר לאוסף) בעוד sp.ils/count עדיין נושאים ערך-אמת, agg יחזיר 0 ⇒ off() תמיד-true ⇒ **הכלי יזעיק אי-התאמה כוזבת לכל תומך**… |
| `Donation (טיפוס)` | src/types/domain.ts:339 | pure | designation/purpose הם בדיוק צירי-הפיצול של מסלול-B ('אוסף-נפרד פר-ייעוד'). כרגע supporterAggregates מתעלם משניהם וסוכם הכל יחד — כל סכימה פר-designation/pur… |
| `Supporter (שדות-מצבור)` | src/types/domain.ts:429 | pure | המבנה המקונן `donations: Donation[]` על התומך הוא ההנחה שכל הקוד בנוי עליה. הזזתו לאוסף-ענן-נפרד פר-ייעוד שוברת בו-זמנית: הפירוק לעיל (supporterAggregates/mi… |
| `mergeSupporterInto` | src/lib/dedup.ts:317 | pure | זהו **מימוש-משוכפל שני** של supporterAggregates. אם מבנה donations/סמנטיקת cur/מדיניות ה-hist משתנים ב-supporterAggregates (למשל תיקון כפל-hist ב-13.8), הפונ… |

### reports (sections2.tsx: DonationsSection/AyinNamesSection · management.tsx: managementMetrics) — מפת-בטיחות לרי-ארכיטקצורת donations (מסלול-B)

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `DonationsSection` | src/components/reports/sections2.tsx:79 | reads-store | מסלול-B שובר את מקור-הקלט: הלולאה ניגשת ישירות ל-sp.donations הַמְקֻנָּן. אם donations יעברו לאוסף-ענן-נפרד פר-ייעוד, sp.donations יהיה ריק/לא-קיים ⇒ byMonth… |
| `managementMetrics — sponsor loop (אימוצים 'אמץ חתן')` | src/components/reports/management.tsx:45 | reads-store | זהו בדיוק החתך שמסלול-B נבנה סביבו (אוסף פר-designation), אך הקוד הנוכחי מניח את ההיפך: designation הוא שדה על donation מקונן ב-supporter, וה-loop סורק את כל… |
| `managementMetrics — hok group (הוראות-קבע)` | src/components/reports/management.tsx:99 | reads-store | עקיף-אך-קריטי: hokRecordedThisMonth (supporters/lib:651) סורק sp.donations.some — תחת-B הוא לא ימצא את תרומת-החודש ⇒ כל הוראות-הקבע יסומנו 'טרם נרשמו' (due),… |
| `Donation (entity)` | src/types/domain.ts:339 | pure | הישות שמסלול-B מפצל. כל צרכן-דוח מניח ש-Donation נגיש דרך sp.donations[] וש-rid רציף גלובלית. פיצול לאוסף-פר-designation מסכן את רציפות-D-: כרגע donationSeq … |
| `Supporter.donations / Supporter.hist (entity fields)` | src/types/domain.ts:453 | pure | אם donations יוצא מהתומך לאוסף-חיצוני: (א) ההצמדה תומך↔תרומה שהיום מובנית-במבנה הופכת ל-join מפורש שכל צרכן חייב לבצע; (ב) hist נשאר על התומך — אי-סימטריה: D… |
| `CustomExport` | src/components/reports/CustomExport.tsx:27 | reads-store | אם מבנה Supporter.donations משתנה (amount/cur/date/designation) או שהמונים-השמורים count/ils/usd מפסיקים לשקף קבלות — עמודות dons/donsAll בייצוא-התורמים המות… |
| `ReportsView` | src/components/reports/ReportsView.tsx:34 | reads-store | אם שדה designation ב-Supporter.donations משתנה או ש-visibleSupportersForDesignations משנה סמנטיקה — vdb ינתב תרומות שגויות (חסרות/עודפות) לכל שלושת הסעיפים-ה… |

### home+wall donation-derivations (src/components/home/homeData.ts + src/components/wall/wallData.ts)

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `Donation (type)` | src/types/domain.ts:339 | pure | מסלול-B: אם Donation יוצא מ-Supporter.donations[] לאוסף-ענן נפרד פר-designation/purpose, השדה date/amount/cur/cat נשאר זהה אך הבעלות (supporterId) הופכת מ-מי… |
| `Supporter (type — שדות נגזרת)` | src/types/domain.ts:429 | pure | מסלול-B: אם donations יורדים לאוסף נפרד, המונים-השמורים count/ils/usd נשארים על מסמך-התומך אך מאבדים את מקור-החישוב המקומי — כל חישוב-מחדש (rebuild) של המוני… |
| `homeStats` | src/components/home/homeData.ts:139 | pure | מסלול-B: `for (const dn of sp.donations)` נשען ישירות על donations מקונן. באוסף-ענן נפרד sp.donations יהיה undefined/ריק ⇒ donIls=donUsd=0 (כרטיס-תרומות בבית… |
| `monthDonationSum` | src/components/home/homeData.ts:641 | pure | מסלול-B: אותה תלות ב-sp.donations מקונן ⇒ מתאפס. שאיבה מהאוסף החדש עם סינון date.startsWith(monthKey). לא דורש designation — מסכם על פני כל הייעודים, אז quer… |
| `attentionItems (חלק supnext + hokDue)` | src/components/home/homeData.ts:225 | pure | מסלול-B: פריט supnext בטוח (nextDate על מסמך-התומך). פריט hokdue נשבר: hokRecordedThisMonth סורק sp.donations מקונן — באוסף-נפרד יחזיר תמיד false ⇒ **כל** הו… |
| `allIlsDonations` | src/components/wall/wallData.ts:100 | pure | מסלול-B: הצומת המרכזי. `for (const s of db.supporters) for (const d of s.donations)` — התלות המבנית הישירה בקינון. באוסף-נפרד: לשכתב ל-scan של האוסף + join ל… |
| `buildPodium` | src/components/wall/wallData.ts:128 | pure | מסלול-B: שני נתיבים נשברים. (1) agg מסתמך על allIlsDonations — יתוקן אם allIlsDonations יעבור לאוסף. (2) ה-fallback 'מאז ומעולם' מסתמך במפורש על s.ils (מונה-… |
| `buildPulse` | src/components/wall/wallData.ts:185 | pure | מסלול-B: `for (const s of db.supporters) for (const d of s.donations)` — קינון ישיר ⇒ פעימת-התרומות מתאפסת. לשכתב לסריקת-האוסף. שים לב: כאן אין סינון-מטבע וא… |
| `buildWallData (raisedThisYear + ticker)` | src/components/wall/wallData.ts:306 | pure | מסלול-B: raisedThisYear ו-ticker יורשים את התלות של allIlsDonations בקינון — יתוקנו יחד איתה. סיכון-קבלות-מס: raisedThisYear הוא סכום-תצוגה (לא מסמך-מס) אז א… |
| `hokRecordedThisMonth` | src/components/supporters/lib.ts:651 | pure | מסלול-B: `sp.donations.some(...)` — קינון ישיר. באוסף-נפרד ⇒ תמיד false ⇒ hokDue מחזיר את כל ההו"ק-הפעילות כ'טרם-נרשמו' (התראות-שווא בבית + מבט-הנהלה + פילטר… |
| `hokDue` | src/components/supporters/lib.ts:661 | pure | מסלול-B: לא סורק donations ישירות — היורש הוא hokRecordedThisMonth. ברגע שזה נשבר (donations לא-מקונן), hokDue מחזיר את **כל** הפעילות ⇒ פאנל-הבית מוצף. תיקו… |
| `StatsWidget (donPoints inline mapping)` | src/components/home/widgets.tsx:501 | reads-store | אם מבנה Supporter.donations משתנה (שם/סוג של cur/date/amount, או פיצול תרומות לישות נפרדת מ-receiptSeq/donationSeq), הלולאה האינ-ליין הזו נשברת בשקט ומחזירה … |

### src/lib/annualReport.ts + src/lib/customExport.ts + src/lib/receipt.ts — מפת-בטיחות לרי-ארכיטקצורת donations (מסלול-B: מקונן-בתומך → אוסף-ענן-נפרד פר-ייעוד). מסמכי-מס רגישים.

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `AnnualDonation (interface)` | src/lib/annualReport.ts:11 | pure | החוזה עצמו ניטרלי-אחסון, אבל הוא מקבע ש-rid חייב להישאר מזהה-קבלה גלובלי-רציף. אם מסלול-B ייצר donationSeq נפרד פר-ייעוד, ה-rid בשדה זה כבר לא יהיה ייחודי/רצ… |
| `donationYears` | src/lib/annualReport.ts:32 | pure | מקבל את donations כפרמטר בזיכרון; ב-B (אוסף-ענן) הקורא חייב ל-hydrate את כל התרומות של התומך לפני הקריאה. שליפה חלקית פר-ייעוד ⇒ שנים חסרות ⇒ הכפתור נעלם/שנה… |
| `donationsOfYear` | src/lib/annualReport.ts:37 | pure | שער-הדילוג ב-annualAllLines מסתמך על length אמיתי; ב-B עם שליפה חלקית/עצלה מוקדם-מדי, .length===0 יחזיר false-negative ⇒ תומך עם תרומות יושמט מהדוח-הכולל. חי… |
| `annualReportLines` | src/lib/annualReport.ts:46 | pure | 🔴 הרגיש ביותר. (1) קורא inp.donations כמערך-שלם-בזיכרון ומחשב סכומי-מס מהן ישירות — ב-B חייב לאסוף את *כל* ייעודי התומך למערך אחד לפני הקריאה; שליפה חלקית פר… |
| `annualAllLines` | src/lib/annualReport.ts:87 | pure | דורש שכל תומך במערך יכיל .donations מלא ומיידי. ב-B (אוסף-נפרד) זה הופך ל-N שאילתות-ענן/הידרציה לפני-הקריאה, ושער-הדילוג donationsOfYear(...).length===0 ייתן… |
| `buildCustomExport` | src/lib/customExport.ts:159 | pure | 🟠 (1) sp.donations.filter(inR) קורא את המערך-המקונן ישירות — ב-B (אוסף-ענן פר-ייעוד) חייב הידרציה פר-תומך, ושער-הדילוג (dons.length··answers.length··touchedI… |
| `receiptVerifyCode` | src/lib/receipt.ts:75 | pure | 🔴 קוד-האימות פונקציה של rid. אם B יפצל את donationSeq לרצף-פר-ייעוד או ימספר-מחדש rid במיגרציה, קוד-האימות של *כל* הקבלות שכבר הונפקו ישתנה ⇒ כלי-האימות שבהג… |
| `receiptLines` | src/lib/receipt.ts:86 | pure | 🔴 מרנדר rid שהועבר לו — הפונקציה עצמה אדישה-לאחסון, אבל היא *מגדירה* את rid כמספר-הקבלה-הרשמי-של-§46. הסיכון ב-B הוא במעלה-הזרם: אם פיצול-פר-ייעוד יפצל את do… |
| `receiptHtml` | src/lib/receipt.ts:171 | pure | עטיפה של receiptLines — יורש בדיוק את תלות-ה-rid שלה. אדיש-לאחסון בעצמו; נשבר יחד עם אינווריאנטת-רציפות-ה-rid במסלול-B. |
| `printReceipt` | src/lib/receipt.ts:197 | io/dom | מסלול-מסירה בלבד; נוגע ב-rid רק דרך receiptHtml. אדיש למבנה-האחסון עצמו. |
| `downloadReceipt` | src/lib/receipt.ts:146 | io/dom | שם-הקובץ receipt-{rid}.txt מניח rid ייחודי. ב-B עם רצף-פר-ייעוד שני ייעודים יכולים לחלוק מספר ⇒ דריסת-קובץ/בלבול-ראיות. תלוי באינווריאנטת ה-rid-הגלובלי. |
| `deliverReceipt` | src/lib/receipt.ts:221 | io/dom | דיספאצ'ר בלבד; יורש את תלות-ה-rid. חמשת משטחי-המסירה עוברים דרכו — נקודת-חנק יחידה שבה כל קבלה (D-/R-/S-) נמסרת, לכן כל שינוי-rid במסלול-B מתבטא כאן בכל המשט… |
| `ReceiptInfo (interface)` | src/lib/receipt.ts:11 | pure | שינוי שם/טיפוס rid שובר את רציפות-הקבלות ואת receiptVerifyCode (החתימה על rid·amount·currency·date); הסרת summary או שינוי amount/currency שוברים גם את קוד-ה… |
| `AnnualReportInput (interface)` | src/lib/annualReport.ts:20 | pure | שינוי מבנה donations (הסרת rid/amount/cur/date) שובר את donationsOfYear/annualReportLines — הדוח מציג rid מקורי בכל שורה כדי לא להיחשב קבלה חדשה; שינוי אינוו… |

### src/lib/cloud-diff.ts

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `ENTITY_COLLECTIONS` | src/lib/cloud-diff.ts:11 | pure | מסלול-B (donations כאוסף-ענן נפרד פר-ייעוד) מחייב הוספת 'donations' לרשימה — אבל: (1) Donation אין לו שדה id, רק rid — diffDb יקרוס על x.id undefined; חייב i… |
| `metaPath` | src/lib/cloud-diff.ts:48 | pure | אם מסלול-B ינסה מונה-קבלות פר-ייעוד — donationSeq לא יכול להתפצל בלי לשבור רציפות D-. donationSeq חייב להישאר במסמך-meta היחיד הזה (גלובלי). כל פיצול-מונה כא… |
| `META_KEYS` | src/lib/cloud-diff.ts:62 | pure | אם ליעוד יקבל מונה-משלו (למשל donationSeqByPurpose) — צריך להוסיפו כאן אחרת יסטה בין-מכשירים; אבל ההכרעה הנכונה למסלול-B היא לא לפצל את donationSeq (רציפות-מ… |
| `metaOf` | src/lib/cloud-diff.ts:92 | pure | אם donations יעברו לאוסף-נפרד — metaOf לא משתנה כי הוא ממילא לא מכיל donations. הסיכון: מפתה להוסיף כאן מבנה-מונים-פר-ייעוד. אין לעשות זאת — donationSeq יחיד… |
| `sameJson` | src/lib/cloud-diff.ts:113 | pure | היום זהו המנגנון שגורם לעריכת-תרומה-בודדת לסמן את כל ה-Supporter כשונה (כי donations מקוננות). אם donations יוצאו — sameJson יופעל על donation בודד; אבל ה-hi… |
| `diffDb` | src/lib/cloud-diff.ts:122 | pure | מסלול-B: (1) אם 'donations' יתווסף ל-ENTITY_COLLECTIONS — nextList.map(x=>x.id) יקרוס: ל-Donation אין id, רק rid ⇒ כל התרומות יקבלו id=undefined, Map יתמוטט … |
| `fullDbDiff` | src/lib/cloud-diff.ts:148 | pure | אותה בעיית id≡rid כמו diffDb אם 'donations' יתווסף ל-ENTITY_COLLECTIONS. בנוסף: בהעלאה-ראשונה, הפרדת-donations דורשת שני מקורות-ישות (supporters בלי donation… |

### src/lib/cloud.ts — שכבת ה-Firestore (מנוע-הענן: pull/push/subscribe/crypto/scope)

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `ENTITY_COLLECTIONS` | src/lib/cloud-diff.ts:11 | pure | הוספת 'donations' לרשימה הזו נותנת לו טיפול-גנרי (upsert-by-id) בכל חמשת המשטחים — אבל diffDb ממפה לפי item.id ו-Donation אין לו id (רק rid) ⇒ ה-Map ממפה und… |
| `META_COUNTER_KEYS` | src/lib/cloud.ts:233 | pure | זה האינווריאנט הקריטי ביותר למסלול-B. הקצאת rid לתרומה חדשה מרימה donationSeq/receiptSeq ב-meta; מסמך-התומך (שמכיל את ה-Donation עם ה-rid) נכתב בכתיבת-אצווה … |
| `pushMetaCounterSafe` | src/lib/cloud.ts:241 | network | זו כל-ההגנה על רצף-הקבלות בענן, וכולה ממוקדת במסמך meta/org היחיד. במסלול-B (donations כאוסף-נפרד) הפונקציה הזו עדיין תגן על ה-counter, אבל היא לא תדע דבר על… |
| `pushDiff` | src/lib/cloud.ts:262 | network | היום שינוי בתרומה בודדת = set של כל מסמך-התומך, וה-rid נכתב אטומית עם ה-counter-bump שב-meta. במסלול-B pushDiff יצטרך להוציא donations מגוף-התומך ולכתוב אותן… |
| `pullAll` | src/lib/cloud.ts:320 | network | הסכנה החמורה ביותר לקבלות-מס. pullAll קורא getDocs(collection) בלי where — מלא בכוונה. אם donations יעברו לאוסף-מסונן-ייעוד ו-B יחליף את הקריאה ב-query(where… |
| `subscribeAll` | src/lib/cloud.ts:348 | network | אם donations הופכות לאוסף-מסונן ו-subscribeAll מאזין ל-query(where designation), הרי ש-Firestore מדווח על מסמך שיצא-מגבול-הסינון (למשל designation שונה או הר… |
| `encryptDoc` | src/lib/cloudCrypto.ts:35 | pure | חוסם ישירות סינון-ייעוד-שרת-צד. designation נכנס לתוך ה-{enc,iv} ⇒ Firestore Rules/where לא יכולים לסנן עליו. אם B רוצה אוסף-donations-מסונן-ייעוד עם Rules ש… |
| `decryptDoc` | src/lib/cloudCrypto.ts:49 | pure | אם donation-doc יישמר כ-{designation:'plain', enc, iv} (לסינון), decryptDoc הנוכחי מזהה enc/iv ומחזיר רק את התוכן-המפוענח — שדה ה-designation ה-plaintext החי… |
| `toPlain` | src/lib/cloud.ts:223 | pure | designation/purpose הם אופציונליים; toPlain משמיט undefined ⇒ תרומה בלי-ייעוד לא כותבת שדה-ריק. אם B מסנן-שרת-צד לפי designation, מסמך בלי designation לא יית… |
| `diffDb` | src/lib/cloud-diff.ts:122 | pure | השורה new Map(prevList.map(x=>[x.id,x])) מניחה id top-level בכל איבר. donations כאוסף-נפרד יצטרכו id≡rid כדי לעבוד עם diffDb הגנרי, אחרת כל התרומות ממופות ל-… |
| `metaOf / META_KEYS` | src/lib/cloud-diff.ts:62 | pure | donationSeq/receiptSeq נשארים כאן גם במסלול-B — זה תקין ורצוי (מקור-אמת יחיד למונה). הסיכון: אם B יעביר את הקצאת-ה-rid לצד-השרת/אוסף, אך ישכח שהמונה עדיין נק… |
| `applyMetaPartial` | src/lib/cloud-merge.ts:74 | pure | זהו משטח האכיפה של רצף-הקבלות בצד-הקריאה (pull/subscribe). אם bumpCounter יוחלף בהשמה עיוורת (assign) כמו שאר שדות ה-meta, מכשיר שקיבל snapshot מרוחק עם rece… |
| `applyEntityPartial` | src/lib/cloud-merge.ts:43 | pure | מיזוג supporters המרוחק מחליף את הרשומה כולה כולל sp.donations. אם sanitizeIncoming יוסר או ה-upsert ישוכתב, מסמך-ענן פגום/ישן ללא donations[] ידרוס את מערך-… |
| `sanitizeIncoming / LIST_FIELDS` | src/lib/cloud-merge.ts:32 | pure | אם 'donations' יוסר מ-LIST_FIELDS.supporters, מסמך-תורם מרוחק ללא המערך יזרום גולמי דרך applyEntityPartial וכל צרכן שמריץ for(const d of sp.donations) יקרוס … |
| `fullDbDiff` | src/lib/cloud-diff.ts:148 | pure | זהו הנתיב שדוחף את מלוא התרומות והמונים בהעלאה-ראשונה ובמיגרציית-הצפנה. משתמש ב-metaOf כדי לכלול receiptSeq/donationSeq — אם metaOf תשתנה או fullDbDiff תדלג … |
| `startCloudSync (מיזוג לחיצת-היד)` | src/store/cloudSync.ts:88 | writes-store | נחיל-עמוק 13.8: בלי שלוש שורות ה-Math.max (120-123), merged יורש את מונה-הענן הנמוך (בעוד המכשיר כבר הנפיק קבלות local-first) ⇒ הקבלה הבאה מקבלת מספר-מס שכבר… |
| `encryptExistingCloud` | src/lib/cloud.ts:312 | network | רק-בעלים, אחרי גיבוי-כפוי. משכתב את כל התרומות והמונים בגרסה מוצפנת. אם ירוץ בלי pushMetaCounterSafe (למשל אם pushDiff יעקוף את עסקת-ה-meta) המיגרציה עלולה ל… |

### src/store/cloudSync.ts — הדבק store↔ענן (סנכרון Firestore diff/merge); מיפוי-בטיחות לרי-ארכיטקצורת donations (מקונן→אוסף-ענן-נפרד, מסלול-B)

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `onRemote` | src/store/cloudSync.ts:69 | writes-store | מסלול-B מוסיף RemotePartial חדש {col:'donations', docs:[...]}. onRemote יקרא applyEntityPartial(db,'donations',...) — אך 'donations' אינו ב-ENTITY_COLLECTION… |
| `startCloudSync` | src/store/cloudSync.ts:88 | network | הכי רגיש במסלול-B. (1) לולאת המיזוג (111-116) מאחדת supporters לפי id בלבד — היא לא מודעת לדוניישנס-כאוסף-נפרד; תומך שקיים גם מקומי וגם בענן ⇒ הענן-מנצח וכל … |
| `flushPush` | src/store/cloudSync.ts:169 | network | diffDb ברזולוציית-ישות: היום שינוי בדוניישן בודד = re-set של כל התומך (כולל כל שאר הדוניישנס). במסלול-B, diffDb יצטרך לזהות שינוי ברמת-דוניישן-בודד ולדחוף רק… |
| `cloudOnDbChange` | src/store/cloudSync.ts:207 | writes-store | אינו יודע על מבנה-פנימי; מעביר prev/next שלמים ל-flushPush. אם addDonation במסלול-B יכתוב לאוסף-דוניישנס נפרד ב-store, prev/next עדיין ילכדו אותו רק אם האוסף… |
| `cloudReplaceNow` | src/store/cloudSync.ts:225 | network | במסלול-B, מחיקת-תומך צריכה למחוק גם את כל מסמכי-הדוניישנס שלו באוסף-הנפרד — diffDb(prev,next) היום מייצר delete יחיד לתומך; אם הדוניישנס באוסף-צד, מחיקת-התומ… |
| `diffDb (cloud-diff.ts)` | src/lib/cloud-diff.ts:122 | pure | לב מסלול-B. כדי לתמוך באוסף-דוניישנס-נפרד: (1) 'donations' חייב להתווסף ל-ENTITY_COLLECTIONS (או col ייעודי) אחרת diffDb מתעלם ממנו לגמרי. (2) sameJson העמוק… |
| `fullDbDiff (cloud-diff.ts)` | src/lib/cloud-diff.ts:148 | pure | בהגירה-ראשונה במסלול-B, אם 'donations' לא ב-ENTITY_COLLECTIONS — כל הקבלות ההיסטוריות לא יועלו לענן (תומכים ייווצרו ריקים). גם מיגרציית-ההצפנה (encryptExisti… |
| `applyEntityPartial (cloud-merge.ts)` | src/lib/cloud-merge.ts:43 | pure | ה-guard בשורה 48 (col לא ב-ENTITY_COLLECTIONS ⇒ db בלי-שינוי) יבלע כל snapshot של אוסף-'donations' חדש. חובה: (1) הרחבת ENTITY_COLLECTIONS או ענף-מיזוג-דוניי… |
| `applyMetaPartial (cloud-merge.ts)` | src/lib/cloud-merge.ts:74 | pure | האינווריאנט 'מונים-רק-עולים' חייב להישמר במסלול-B ללא שינוי — donationSeq/receiptSeq נשארים ב-meta גם כשהדוניישנס באוסף-נפרד. הסיכון: אם מסמך-דוניישן חדש נדח… |
| `pushDiff (cloud.ts)` | src/lib/cloud.ts:262 | network | האי-אטומיות בין sets (אצוות) ל-meta (transaction נפרדת) היא כבר-היום הסיכון: מסמך-תומך עם דוניישן חדש נכתב באצווה, והמונה בעסקה נפרדת — אם המונה נכשל, יש קבל… |
| `pullAll (cloud.ts)` | src/lib/cloud.ts:320 | network | במסלול-B pullAll צריך למשוך גם את אוסף-הדוניישנס ולחבר כל דוניישן לתומך-האב (join לפי supporterId) לפני migrate — או שה-Db המקומי יורכב בלי הקבלות. migrate (… |
| `subscribeAll (cloud.ts)` | src/lib/cloud.ts:348 | network | מסלול-B מוסיף onSnapshot לאוסף-'donations' ⇒ עוד מנוי חי שמזרים {col:'donations',docs}. הסיכון המרכזי: אין תיאום-סדר בין snapshot-supporters ל-snapshot-donat… |
| `pushMetaCounterSafe` | src/lib/cloud.ts:241 | network | זהו המחסום היחיד שמונע דריסת מונה-קבלות ע"י מכשיר מפגר במרוץ תת-שנייה. הסרה/החלפה ב-set() עיוור ⇒ קבלת-מס §46 עם מספר שכבר הונפק (כפילות מיסוי). אם רצף recei… |
| `metaOf` | src/lib/cloud-diff.ts:92 | pure | הוספת מונה-קבלות חדש ל-Db ללא הוספתו כאן ⇒ המונה לא מסונכרן בין מכשירים ⇒ התנגשות רצף-קבלות. השמטת receiptSeq/donationSeq מכאן ⇒ pushMetaCounterSafe מקבל und… |
| `sanitizeIncoming` | src/lib/cloud-merge.ts:32 | pure | הסרת 'donations' מ-LIST_FIELDS.supporters ⇒ מסמך-תורם מרוחק פגום (בלי donations) עובר גולמי ⇒ קריסת runtime בכל צרכן שמריץ sp.donations.map / חישוב-צבירה. שי… |

### src/lib/cloud-merge.ts — צד-הקבלה של סנכרון-הענן (מיזוג מרוחק→מקומי) + התלויות ב-cloud-diff/store

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `LIST_FIELDS` | src/lib/cloud-merge.ts:18 | pure | במסלול-B (donations כאוסף-ענן נפרד פר-ייעוד) מסמך ה-supporter המרוחק כבר לא נושא donations. השורה supporters:['donations'] תגרום ל-sanitizeIncoming להזריק do… |
| `sanitizeIncoming` | src/lib/cloud-merge.ts:32 | pure | זה הנתיב שבו אובדן-הקבלות מתממש בפועל במסלול-B: כשמסמך-supporter מרוחק מגיע בלי donations (כי הן עברו לאוסף נפרד), sanitizeIncoming כופה donations:[] וה-upse… |
| `applyEntityPartial` | src/lib/cloud-merge.ts:43 | pure | שני שברים במסלול-B: (1) donations כאוסף-נפרד מפתחים לפי rid, לא id — applyEntityPartial מפתח **קשיח על id**; דונציה בלי שדה id לא תמוזג/תזוהה (ה-map מקבל und… |
| `applyMetaPartial` | src/lib/cloud-merge.ts:74 | pure | זה מוקד-הסיכון לקבלות-המס. donationSeq כאן הוא **סקלר-יחיד גלובלי**. מסלול-B פר-ייעוד: אם מיישמים מונה-דונציה פר-ייעוד/פר-אוסף, bumpCounter לא מכיר אלא donat… |
| `bumpCounter (closure)` | src/lib/cloud-merge.ts:96 | pure | אם מסלול-B מוסיף מונה-דונציה חדש (למשל donationSeqByDesignation), חייבים ערוץ-max נפרד לכל מפתח — bumpCounter הנוכחי סגור על 4 מפתחות-מחרוזת קשיחים. השמטת מו… |
| `ENTITY_COLLECTIONS` | src/lib/cloud-diff.ts:11 | pure | מסלול-B דורש הוספת אוסף 'donations' (או פר-ייעוד) לכאן — אחרת diffDb לא ידחוף אותן ו-applyEntityPartial ידחה אותן ב-no-op. אבל הוספה לבדה לא מספיקה: (א) diff… |
| `metaOf / META_KEYS` | src/lib/cloud-diff.ts:92 | pure | המונים חיים ב-meta/org היחיד. מסלול-B לא צריך לגעת כאן כל עוד donationSeq נשאר סקלר-יחיד; אם מוסיפים מפתח-מונה חדש — צריך גם META_KEYS גם metaOf גם bumpCount… |
| `addDonation` | src/store/useApp.ts:1622 | writes-store | זו נקודת-הכתיבה שמסלול-B משנה. במעבר לאוסף-נפרד: (א) עדיין חובה למשוך rid מ-db.donationSeq היחיד (לשמר רציפות D- וסנכרון bumpCounter), (ב) הכתיבה של הדונציה … |
| `supporterAggregates` | src/lib/supporterAgg.ts:27 | pure | במסלול-B donations כבר לא זמינות על אובייקט-התומך המקומי (הן באוסף אחר), ולכן supporterAggregates לא יכול לרוץ מ-sp.donations. או שמזרימים לו את הדונציות-מהא… |
| `supIls / supUsd / supCount / supLast` | src/components/supporters/lib.ts:94 | pure | אלה קוראים את המונה-השמור (sp.ils/count/…), לא את donations ישירות — ולכן הם **שורדים** מסלול-B **בתנאי** שהמונה-השמור על התומך ממשיך להתעדכן נכון מהאוסף-הנפ… |
| `restoreDb (counter clamp)` | src/store/useApp.ts:2460 | writes-store | מסלול-B שומר על אותו clamp כל עוד donationSeq יחיד. אם מוסיפים מוני-דונציה פר-ייעוד — כל אחד צריך clamp נפרד כאן, אחרת שחזור-גיבוי-ישן ידרוס מונה-ייעוד ⇒ D- … |
| `diffDb` | src/lib/cloud-diff.ts:122 | pure | אם מבנה Supporter.donations משתנה כך ש-sameJson מפספס שינוי (למשל שדה מקונן שמשתנה בלי לשנות זהות) — תרומה חדשה/מתוקנת לא תיכלל ב-sets ולא תסונכרן לענן ⇒ אוב… |
| `fullDbDiff` | src/lib/cloud-diff.ts:148 | pure | אם metaOf יפסיק לכלול receiptSeq/donationSeq (או ישתנה מבנה Supporter.donations), העלאת-הבכורה תיצור פרויקט-ענן בלי מוני-קבלות תקינים / בלי תרומות ⇒ המכשיר ה… |

### src/store/persist.ts — migrate() paths touching supporters/donations/hist/receipt-counters (+ helpers planRidRenumber, supporterAggregates)

| אטום | קובץ:שורה | טוהר | נשבר-אם-משנים (תמצית) |
|------|-----------|------|------------------------|
| `planRidRenumber` | src/store/persist.ts:188 | pure | אם donations יעברו לאוסף-ענן-נפרד פר-ייעוד: הקריאה כאן מקבלת מערך שטוח {rid,date} מכל התרומות של כל התומכים יחד (donCoords). פיצול לאוסף פר-designation יפצל … |
| `supporterAggregates` | src/lib/supporterAgg.ts:27 | pure | אם donations יהפכו לאוסף-ענן פר-ייעוד: sp.donations לא יהיה יותר מקונן ב-Supporter, ולכן supporterAggregates(sp) לא יראה את כל התרומות → count/ils/usd יתאפסו… |
| `migrate` | src/store/persist.ts:204 | pure | זו נקודת-הכובד של מסלול-B. migrate מניח **מסמך-Db-יחיד** שבו supporters[].donations מקונן. אם donations יעברו לאוסף-ענן-נפרד: (1) raw שמגיע מ-pullAll כבר לא … |
| `migrate::supporters list-normalize seeding (dNext/maxRid)` | src/store/persist.ts:263 | pure | הזריעה מסתמכת על flatMap **על supporters[].donations המקונן**. אם donations יעברו לאוסף-נפרד, ה-flatMap כאן יחזיר [] ⇒ dNext=0 ⇒ donationSeq לא יקודם ⇒ קבלה … |
| `migrate::supporters donations[]/hist[] normalize` | src/store/persist.ts:299 | pure | אם donations יעברו לאוסף-נפרד: השורה `donations: Array.isArray(s.donations)?s.donations:[]` תמיד תיתן [] (השדה המקונן ייעלם) ⇒ התומך ייטען בלי תרומות במבנה-ה… |
| `migrate::donCoords + D- planRidRenumber apply` | src/store/persist.ts:318 | pure | הליבה של סיכון-B. הדדופ מניח שכל התרומות נגישות דרך supporters[].donations בתוך אותו מסמך, ומנרמל אותן במרחב-D-**גלובלי אחד**. עם אוסף-ענן פר-ייעוד: (1) donC… |
| `migrate::supporter aggregate self-heal` | src/store/persist.ts:327 | pure | קורא ל-supporterAggregates(s) שסוכם s.donations המקונן. אם donations יעברו לאוסף-נפרד: agg יחושב על [] ⇒ count/ils/usd/first/last של **כל תומך** יאופסו בכל ט… |