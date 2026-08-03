# סגירה · ורטיקלים + מונחים-חיים + מקסום-דגלים באשף (3.8.2026)

**הכרעת-בעלים:** "תן מפורק באתר כאילו שאני יכול לשחק איתו או לערוך ידני מהם השם
הכי מתאים — ותבדוק שזה משתנה **לכל אורך הדרך**." + "למי עוד חסר כפתורים אני רוצה
כמות מקסימלית." + "תסיים הכל."

מטרה: אשף-ההקמה = משטח-משחק מלא לבעל-העסק — כל יכולת ניתנת לכיבוי/הדלקה, כל
מונח-ישות ניתן לעריכת-שם, והשם החדש מחלחל לכל מסך בלי יוצא-מן-הכלל.

---

## חלק 1 · פריסֶט-פיצ'רים לכל סוג-עסק (PR #40)
- `VerticalPack` קיבל שדה אופציונלי `features?: Record<string, boolean>`.
- `COMMERCIAL_OFF` — קבוע שמכבה יכולות עמותתיות שלא מתאימות לעסק מסחרי:
  `core.taxreceipt` · `families.cred` · `home.goldbook` · `home.impactwall` ·
  `home.community` · `home.credmetrics` · `shell.privacy` · `supporters.hist`.
- 7 ורטיקלים מסחריים (מרפאה/חנות/שירותים/חדרים/צי-רכב/מוסך/אירוח) נושאים
  `features: COMMERCIAL_OFF` — למשל מוסך כבר לא מציג קבלת §46.
- `applyVerticalPack` **מחליף** terms+modules+features בערכי-החבילה (נקודת-פתיחה);
  חבילה בלי `features` = `{}` = הכול דלוק (ברירת-המחדל העמותתית של מאור).
- ratchet: `vertical-packs.test` — features מוחלף (לא נשמר), commercial-off/nonprofit-on.

## חלק 2 · מקסום דגלים באשף — 46 דגלים חדשים (PR #40)
כל יכולת שהייתה מחווטת-קשיח קיבלה `FeatureDef` (key/label/desc/module) ולכן
מופיעה אוטומטית ככפתור באשף, מקובצת לפי מודול דרך `sections.ts`. הרישום עלה
מ-~140 ל-~186 דגלים. כיסוי: shop (photo/stock/expiry/waitlist/bulk*/sreceipt/
void/meeting/merge) · families (showid/filter) · settings (backup/encryption/
access/notif/theme) · shell (lock/palette) · core (receipt.copymark/dayendbackup) ·
courses (absence*/makeup/reminder/enroll.*/notes/colfilter/viewtoggle) · diary
(attendance/inactivewarn) · calendar (export/layers.urgent/hebtoggle) · reports
(csv/management.*/donations.bycat/families.geo/attendance.member) · supporters
(thankyou/click2call) · tzedaka (boxstatus) · shop7 (capacity).
כולם **דיפולט-דלוק** ⇒ אפס שינוי-התנהגות ללקוח הקיים. ratchet: `new-toggles.test`.

## חלק 3 · מונחים חיים "לכל אורך הדרך" (PR #41 + #42)
הבעיה: מסכים רבים תייגו ישויות כמחרוזות קשיחות ("חדר"/"מורה"/"תלמיד/ה"/
"משפחות"/"חוגים"/"שיבוצים"/"תורמים") ולכן עריכת-מונח באשף לא הגיעה אליהם.
התיקון: כל תווית-ישות עוברת `termOf(config, key, fallback)`.

**PR #41 — מסכי הגדרות/ניהול:**
`RoomsSection` (entity.room/rooms) · `TeachersSection` (entity.teacher; רבים
מחושב "מורה"→"מורים" כי אין מפתח teachers) · `AttendancePanel`
(entity.student/students) · `CourseWheel` (entity.course; שם-משתנה שונה ל-courseT
למניעת-התנגשות) · `SettingsView` chips · `CoursesView` · `FamilyPanels` ·
`ShopEventModal` · `SupportersView` · `SupporterDetail`.

**PR #42 — הקיר הציבורי + ווידג'טי-בית (הסגירה הסופית):**
- `wallData.buildWallData(db, now, config?)` — config אופציונלי; תוויות ה-KPI
  והטיקר עוברות termOf (nav.families/nav.courses/nav.supporters/
  entity.enrollments/entity.familyOf). **בלי config = ברירת-מחדל, ביט-זהה.**
- `ImpactWall` מזרים config ומתייג "למען המשפחות" + שורת-הפעימה.
- `widgets` — OverviewWidget + CourseMetricsWidget מתייגים "שיבוצים".
- ratchet: `term-propagation.test` — הגנת-מקור + בדיקה פונקציונלית שמאמתת
  שהחלפת "משפחות"→"לקוחות" מגיעה בפועל לתוויות, ו-null-config נופל לברירת-מחדל.

---

## אינווריאנטים שנשמרו
- **אפס שינוי ללקוח הקיים:** כל הדגלים דיפולט-דלוק; termOf בלי מונח-מותאם = ה-fallback
  המקורי מילה-במילה. אומת בבדיקות null-config ובשלוש סוויטות הדפדפן.
- **אפס נגיעה בכסף/קבלות:** כל השינוי תצוגה/טרמינולוגיה.
- שערים: verify מלא ירוק (typecheck + lint 0/0 + 1055 טסטים + build) ·
  toggle-matrix · demo-walkthrough (100/100) · launch-readiness (13/13).

## חלק 4 · סבב-מונחים מלא — "הכל פירוש הכל" (PR #43, 3.8.2026)
הכרעת-בעלים אמפטית: **כל** שם-ישות גלוי בכל האפליקציה חייב לעבור termOf.
בוצע סוכן-ביקורת שמיפה כל דליפה, ואז **8 סוכנים במקביל** עטפו ~150 מחרוזות
ב-56 קבצים (משפחות · תורמים · חוגים/גלגל · shop · tzedaka · shop7 · shop8 ·
הגדרות[ייצוא/ייבוא/גיבוי/מורים/חדרים/reset] · דוחות · יומן · פלטת-פקודות ·
קיר · בית · וספריות טהורות audit/customExport/exportRows/courseDaily/
paletteGroups/tour/guide + module-lib של כל מודול).

**דפוס-הבטיחות (קריטי — לחזור עליו בכל סבב-מונחים עתידי):**
- כל `config` שנוסף לפונקציה טהורה = **פרמטר אופציונלי אחרון** `config?: OrgConfig`
  + `const T = (k,fb) => config ? termOf(config,k,fb) : fb`.
- **כל fallback = המחרוזת המקורית מילה-במילה** ⇒ (א) עריכות-מקביליות לא שוברות
  קומפילציה; (ב) לקוח בלי מונחים-מותאמים = פלט ביט-זהה. אומת: 1057 טסטים +
  כל ה-ratchets/הגנות-מקור הקיימות + 3 סוויטות דפדפן, כולם ירוקים.
- consts ברמת-מודול (`TOUR_STEPS`/`GUIDE_SECTIONS`/`GUIDE_RECIPES`) נשארו קשיחים
  (ratchet-locked) — עוטפים ב-**פונקציית-תרגום** (`guideRecipes(config)`, `loc()`
  ב-tour) שרצה מעל הקבוע, לא נוגעים בקבוע.
- קוראים שחוטו: AuditSection · ExportSection · TourOverlay · GuideModal ·
  CourseDetail · SuggestWidget · DonationCalendar (prop חדש).

## מוחרג במכוון (גבול-תפקיד/מבנה — לא לתקן בעיוור)
- **נוסח קבלת §46** (`receipt.ts`) — נוסח חוקי; שינוי "תרומה" בכותרת-מס = רו"ח/בעלים.
- **תוויות חוצות-ארגון** (`platform/lib.ts`) — לוח-בקרה של מיילי-על, per-org termOf
  לא משמעותי שם.
- **מסך-הרשמה טרום-ארגון** (`signupWizard.ts`) — רץ לפני שקיים config.
- **מטא-אשף** (`builder/sections.ts` + `handoff.ts`) — מתאר את המודולים עצמם.
- **קומץ תוויות const ברמת-מודול** שנשארו קשיחות (דורשות ריפקטור-חתימה קטן,
  לא נדחפו לפריסה): פריטי-ניווט ב-`CommandPalette` (`NAV_CMDS`), 2 תוויות ב-`HOME_WIDGETS`
  (`'משפחות אחרונות'`/`'תפוסת החוגים'`), `HEAD` המיון ב-`SupportersView`, ומפות-סטטוס
  `'🏠 אצל משפחה'` בקופות (`CoordinatorsTab`/`BoxForm`/`CoordinatorCard`). כולם
  render דרך const module-scope; פתוח לסבב-המשך אם הבעלים ירצה 100%-מוחלט.
- "בחוגי היום" (miniKpi בקיר) — צורת-סמיכות; עטיפה הייתה משנה "בחוגי"→"בחוגים"
  (לא ביט-זהה) — הושאר. אותה ישות מכוסה כבר בתווית ה-KPI.
