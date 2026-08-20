# אינוונטר-עומק · מודול החוגים (חוגים ושיבוצים) — 2026-08-20

חקירה מלאה של מודול החוגים על 4 שכבות: מודל-נתונים · מנוע-טהור · רכיבים/UI · דגלים+נוכחות+דוחות+פערים.
כל העוגנים `file:line`. מיועד כמקור-אמת לכל עבודה עתידית על החוגים.

> **TL;DR** — מודול בוגר, נבדק-היטב (14 קבצי-בדיקה, אפס TODO/ts-ignore), 29 דגלים.
> נמצאו **3 סטיות אמיתיות** (מאומתות בקוד) בין משטחי-הריבוי, + פער-לגאסי פתוח אחד (החלטת-בעלים).
> ראה §9.

---

## 1. מודל-הנתונים (`src/types/domain.ts`)

| טיפוס | שורות | תפקיד |
|---|---|---|
| `Weekday` | 16 | `0..5` — ראשון–שישי בלבד (אין שבת) |
| `CourseSession` | 98–103 | `{day, time, label}` — מפגש/קבוצה; ה-`label` הוא הערך ב-`Enrollment.group` |
| `PricingModel` | 105 | `'monthly'\|'half_year'\|'year'\|'punch'` — **אין `per-lesson` באיחוד**; פר-שיעור הוא דגל-מוד (`perLesson`), לא מודל |
| `CourseFile` | 113–123 | קובץ מצורף (תמונה/מסמך data-URL / קישור https) — additive |
| `Course` | 125–177 | ראה למטה |
| `Absence` | 179–191 | `{date, reason, makeup?, noshow?, justified?}` — נשמר חדש-ראשון |
| `Payment` | 193–199 | `{rid:'R-N', date, amount, method}` — קבלת-מס רציפה |
| `EnrollmentStatus` | 201 | `'active'\|'paused'\|'ended'` |
| `Enrollment` | 203–252 | ראה למטה |
| `PricingTerm` | 255 | `once\|weekly\|biweekly\|monthly\|months\|half_year\|year` |
| `Member` | 21–42 | בן-משפחה (ילד/הורה `isParent`); מקונן ב-`Family.members[]` — אין מערך-members עליון |

**`Course` — שדות-מפתח:** `id`(c) · `name` · `teacherId`→Teacher · `roomId`→Room (**חובה בטופס**) · תמחיר-שטוח `price`/`price1..3`+`price1..3Name` (:135–139, price3 additive 19.8) · `model` · `size` (ניקובים, רק ב-punch) · `start`/`end` · `weekday`/`time` (יחיד fallback ל-`sessions[]`) · `maxStudents` · `gender`(`m/f/all`) · `ageMin/Max` · `cat`/`semester`/`sector`/`audience?` · `img?` · `gradeMin?/Max?` (מחרוזת 'גן'..'יב') · `sessions[]` · `files?` · **פר-שיעור** `perLesson?`+`lessonPrice?`+`lessonPrice1..3?` (:168–176 additive).

**`Enrollment` — שדות-מפתח:** `id`(e) · `memberId`→Member (**ייחודי-גלובלי**, נאכף במיגרציה) · `courseId` · `plan` (אותו איחוד, פר-שיבוץ) · `purchased`/`used` (ניקוב; `used`=מקור-אמת-כספי) · `group` (label של session) · `absences[]` · **`presents?: IsoDate[]`** (יומן-נוכחות additive, #6/#10) · `payments[]` · `totalDue`/`dueDate`/`dueEventId?` · `status` · `note` · `enrolledAt`/`endedAt?` (#8) · `paidFull?` (מתג-שולם ידני, 17.8, **לא נוגע בקבלות**) · תמחיר-משוקלל `freq?`/`freqUnit?`/`term?`/`termMonths?`/`tier?`.

**מערכי-DB:** `courses`(c) :911 · `enrollments`(e) :910 · **אין** מערך `groups` (קבוצה=session). מונה `receiptSeq` נפרד ורציף (R-). DB_VERSION=6.

---

## 2. פעולות ה-store (`src/store/useApp.ts`) + מיגרציה

| פעולה | שורה | מה כותבת |
|---|---|---|
| `upsertCourse` | 1510 | replace/append לפי id |
| `deleteCourse` | 1513 | **מחיקת-שרשור**: החוג + כל שיבוציו + אירועי-תזכורת יתומים (`dueEventId`) |
| `upsertEnrollment` | 1527 | replace/append (גם remap-קבוצה, endedAt, tier, paidFull מהרכיבים) |
| `deleteEnrollment` | 1530 | מסיר שיבוץ + אירוע-תזכורת מקושר |
| `punch` | 1539 | `used+1` רק אם `plan==='punch' && used<purchased` (ללא-תאריך, לא-אידמפוטנטי) |
| `setPresent` | 1554 | **נוכחות אידמפוטנטית (#6)**: מוסיף/מסיר תאריך ב-`presents` + `used±1`; punch מלא ⇒ `false` |
| `undoPunch` | 1571 | הפוך ניקוב אחרון; מחזיר **credit מדויק** מיומן-האמינות (לא ‎-5 קבוע) |
| `addAbsence` | 1611 | prepend חדש-ראשון |
| `setEnrollmentPaid` | 1618 | `paidFull` בלבד — **לא נוגע בקבלות/totalDue/receiptSeq** |
| `addPayment` | 1626 | `{ok,rid}`; שומר על רציפות R- (לא מקדם seq אם השיבוץ נמחק) |
| `unlinkEvent('enrollmentDue')` | 1645 | מנקה `dueDate`+`dueEventId` + מוחק אירוע (תיקון #6-יתום) |

**מחיקות-רוחב:** `deleteFamily` (1350) ו-`deleteMember` (1418) מוחקות שיבוצים לפי `memberId` (למה ייחודיות-גלובלית של member-id קריטית).
**אין** ב-store: `endEnrollment`/`makeup` — "ended" זה `upsertEnrollment{status:'ended',endedAt}` מהרכיב.

**מיגרציה (`src/store/persist.ts`, מצטברת אחת):** ריפוי-מונה R- (:255) · דדופ-R- דטרמיניסטי `planRidRenumber` (:293, קבלה-שהונפקה לא-זזה, #5.5a) · נרמול `payments`/`absences`→`[]` (:285) · ריפוי `sessions`→`[]` (:292) · **remap ייחודיות member-id גלובלי** (:452–499) · seeding `seq` מעל כל id (:505) כולל courses/enrollments. **אין** מיגרציית-קבוצות (labels מרופאים ב-`groupRemapOnRemoval` ברמת-הרכיב).

---

## 3. המנוע הטהור (`src/components/courses/lib.ts`, 548 שורות — אפס store/DOM)

**תפוסה:** `enrollCount` (:333, active+paused; ended משחרר מקום). אין `isFull` — inline `enrollCount>=maxStudents||999`.

**תמחיר — שני עולמות מקבילים:**
- שטוח: `planWord`/`priceSuffix`/`modelMeta` (:184–205).
- **משוקלל פר-שיעור (13.8ב'):** `WEEKS_PER_MONTH=52/12` · `lessonsInTerm(freq,unit,term,months)` (:236) · `lessonPriceForTier` (:262, tier ללא-מחיר נופל למלא) · `lessonTierOptions` (:270) · `weightedQuote` (:288, `total=round(lessons×perLesson)`) · `enrollmentQuote` (:298, משחזר משדות שמורים). **נוסחה:** `סכום = round(שיעורים-בתקופה × מחיר-שיעור-אחרי-הנחה)`.
- **`totalDue` — לא בטהור:** נקבע ב-EnrollModal (:66, פר-שיעור=quote.total; אחרת 0) / ManageModal (:76, מוקלד-ידני, placeholder=price).
- יתרה/סטטוס נגזר (17.8): `paidOf` (:304) · `payBal` (:309) · `enrollmentPaidStatus` (:321, `paidFull` דורס; אחרת לפי יתרה).

**התאמה (סינון-רך `courses.enroll.smartfilter`):** `courseFitsMember` (:427, נתון-חסר לא-מסנן; **הורה עוקף גיל** בקריאה) · `GRADE_ORDER`/`gradeIndex`/`gradeFits` (:403–424) · `scheduleClashText` (:447, אזהרה מייעצת, לא-חוסמת).

**מפגשים:** `sessionsOf` (:84, מקור-אמת יחיד; fallback לסקלר) · `nextSessionDate` (:338, ⚠️ `new Date()` פנימי — לא דטרמיניסטי, מזין חלון-48ש') · `defaultCourseDates` (:32, שנה"ל מתגלגלת — חוג לא נולד-פג-תוקף) · `courseDateError` (:57) · `roomsNow` (:120, `now` מוזרק).

**קבוצות:** `groupLabelOf` (:148) · `groupOptionsOf` (:174, ריק ב-≤1 session) · **`groupRemapOnRemoval`** (:159, #9 — הכי-עדין; labels מפורשים חסינים).

**נוכחות/השלמה:** `presentsInMonth` (:47, מתאפס-חודשי) · `makeupEligibility` (ב-`diary/lib.ts:67` — noshow לעולם-לא; `justified||earlyCancel≥48ש'`; מוצדק לא-מפיל-ניקוב).

**ניקוב:** `planLabelOf` (:371) · `PUNCH_CONFIRM_MS=3000` + `punchConfirmStep` (:522, מכונת-מצב אישור-כפול).

**גלגל:** `wheelIndexUnderPointer` (:542, מצב-ידני); הגרלה ב-`CourseWheel.tsx`.

---

## 4. מודל הנוכחות ההפוך

**רק חריגים נשמרים; נוכחות = ברירת-מחדל נגזרת.** מאומת ב-`courseDaily.ts:70–82`: לכל תאריך-מפגש כל שיבוץ-פעיל = "פעיל" **אלא אם** יש `Absence` לתאריך (⇒ "לא הופיעה"/"חיסור·סיבה"); paused ⇒ "מוקפא". **אינו** קורא `presents[]`.

**שני מושגי-נוכחות נפרדים (לא לבלבל):**
- `absences[]` — הנתון-ההפוך האמיתי (הדוח היומי).
- `presents?[]` — יומן-check-in additive (#6 אידמפוטנטיות + #10 מונה-חודשי); `used` נשאר מקור-האמת-הכספי.

---

## 5. רכיבים ומשטחים

**תוך `src/components/courses/` (7 רכיבים + lib + 14 בדיקות):**
- `CoursesView.tsx` (485) — רשימה/גריד + נתב ל-CourseDetail + גלגל. LIVE-חדרים, חיפוש/קטגוריה/סמסטר, סינון-עמודות, ⋯-הערות.
- `CourseDetail.tsx` (827) — כרטיס-החוג: **רשימת-שיבוצים** עם נוכחות/ניקוב/יתרה + עורך-מפגשים/קבוצות + סיידבר-פרטים + בוחר-מורה-inline. `doPunch` (:137) דרך `setPresent` (אידמפוטנטי).
- `CourseForm.tsx` (646) — יצירה/עריכה מלאה; **חדר-inline** (סוגר את מבוי-"חדר-חובה-רק-בהגדרות"), רב-יומי, פר-שיעור, הנחות 1–3.
- `EnrollModal.tsx` (461) — שיבוץ מכרטיס-החוג: חיפוש-חכם, תפוסה/כפילות, פר-שיעור-משוקלל, **הורה-עוקף**, יצירת-משפחה-inline.
- `ManageModal.tsx` (545) — ⚙ ניהול-שיבוץ: תשלומים/קבלות, תאריך-תשלום (תזכורת-לוח), קניית/טעינת-ניקוב, הקפאה/סיום, הסרה דו-שלבית.
- `AbsenceModal.tsx` (127) — חיסור מכרטיס-החוג; מאוחד עם היומן דרך `makeupEligibility`.
- `CourseFilesField.tsx` (126) — קבצים מצורפים (בתוך CourseForm).

**משטחים חיצוניים:**
- `families/JoinModal.tsx` — **מסלול-שיבוץ שני** (מכרטיס-המשפחה); הורים-וירטואליים; ⚠️ ראה §9.
- `families/FamilyPanels.tsx` (`EnrollPanel` :213) — "חוגים פעילים וניקובים" בכרטיס-המשפחה; ניקוב/חיסור/⚙ (מגודר `families.cardops`). ⚠️ ראה §9.
- `home/widgets.tsx` — מפגשי-היום (+"נוכחות ✓" deep-link) · `PunchlowWidget` · `CourseMetricsWidget` · Quick "✓ ניקוב".
- `diary/` — מפגשי-החוג בלוח-החדרים (`buildSlots`); `AttendancePanel.tsx` = רישום-נוכחות שלישי (דרך `setPresent`).
- `reports/sections1.tsx` — סיכום-רישום + נוכחות/חיסורים.
- `wheel/CourseWheel.tsx` · `palette/CommandPalette.tsx` · הגדרות מורים/חדרים.

**ניווט:** nav `'courses'` (App.tsx:77, icon 🎨), מגודר `config.modules.courses!==false`; `moduleOn('courses')` מגדר גם פאנל-המשפחה/בית/פלטה. תפקיד-מורה = אותו מסך מסונן (`coursesOfTeacher`, מסתיר עריכה/מחיקה/הוספה).

---

## 6. דגלים (29 · `courses.*`) ומונחים

ברירת-מחדל **פעיל** (חוזה: מפתח-חסר=on, רק false מכבה; כיבוי `courses` משרשר לכל התתי-דגלים).

`courses.punch`(+`.buy/.confirm/.undo/.switchmonthly`) · `courses.payments` · `courses.groups` · `courses.wheel` · `courses.printout`(+`.daily/.custom`) · `courses.discounts` · `courses.receipt.summary` · `courses.enroll.smartfilter/.inlinecreate/.freeze/.end/.note` · `courses.roomslive` · `courses.gradeimg` · `courses.absence`(+`.history`) · `courses.makeup.justified` · `courses.reminder` · `courses.notes` · `courses.colfilter` · `courses.viewtoggle` · `courses.files` · `courses.perlesson`.
**חוץ-לקידומת:** `home.coursemetrics`/`home.punchlow` · `calendar.layers.enrolls` · `diary.attendance` · `reports.enroll/.attendance/.attendance.member/.punch` · `families.join`/`families.cardops`.

**מונחים:** `nav.courses`(חוגים) · `entity.course`(חוג) · `.teacher`/`.room`/`.rooms`/`.student`/`.students`/`.enrollment`/`.enrollments`/`.cred`. **אין** `entity.courses` (הרבים=`nav.courses`).

---

## 7. דוחות/ייצוא הנושאים חוגים

1. `EnrollmentSection` (sections1:29) — חוג/מורה/רשומים/תפוסה%/הכנסה-בטווח/חוב · CSV.
2. `AttendanceSection` (sections1:89) — לפי-חוג / לפי-תלמיד (`reports.attendance.member`): חיסורים/no-show/זכאי-השלמה/חיסור-אחרון.
3. `PunchSection` (sections2:205) — נרכשו/נוצלו/נותרו/מצב.
4. תדפיס-מורה (`CourseDetail.exportStudents` :169) — כולל בריאות/רגישויות.
5. דו"ח-יומי (`buildCourseDailyRows`, `courseDaily.ts:23`) — נוכחות-הפוכה פר-מפגש (cap 500).
6. ייצוא-מותאם (`customExport.ts:38`) — סוגר פער-לגאסי "ייצוא-חוגים-חסר".

---

## 8. כיסוי-בדיקות (14 קבצים · `courses/__tests__/` + diary + lib)

`course-default-dates` · `course-img-teacher` · `course-multiday` · `course-paid` · `enroll-inline` · `grade-fit` · `group-remap` · `p3-courses` · `pricing-weighted` · `punch-confirm` · `rooms-live` · `smart-filter` · `wheel-manual` · (diary) `makeup-eligibility` · (lib) `courseDaily` · (store) `set-present`/`migrate-normalize`.
**נקי:** אפס `TODO/FIXME/HACK/@ts-ignore` בכל `src/components/courses/`.

---

## 9. ממצאים — סטיות, פערים, סיכונים (החלק המעשי)

### ✅ S1 · שני מסלולי-שיבוץ שנפרדו — **תוקן 20.8**
היה: `JoinModal.tsx` (כרטיס-משפחה) מקבע `totalDue:0` ובלי שדות פר-שיעור ⇒ שיבוץ אותו חוג-פר-שיעור משני המשטחים נתן חוב שונה.
**תיקון:** פאנל התמחור-המשוקלל (freq/term/tier + `weightedQuote`) הוטמע ב-JoinModal זהה ל-EnrollModal; השיבוץ פורס `...pricingFields` במקום `totalDue:0`. ratchet `smart-filter.test.ts` (S1).

### ✅ S2 · ניקוב מכרטיס-המשפחה עקף את מנגנון-הנוכחות — **תוקן 20.8**
היה: `FamilyPanels.doPunch` קרא ל-`punch(e.id)` הגולמי ⇒ ניקוב מהכרטיס לא הופיע ב"נוכחויות החודש" ולא היה אידמפוטני (מחלקת-הבאג #6/#10).
**תיקון:** `doPunch` עבר דרך `setPresent(e.id, today, true)` + שער-תאריך `presents[]`, זהה ל-`CourseDetail:159`. ratchet `cardops.test.ts` עודכן (setPresent, לא raw punch).

### 🟡 S3 · פער-לגאסי פתוח (החלטת-בעלים)
`AUDIT-SIGNUP-2026-07-31.md:35` — שיבוץ-כרטיסייה **מכרטיס-המשפחה** ב-demo-walkthrough לא משלים ("10 מתוך 10" נכשל). קדם-קיים, לא-חוסם-CI. ככל-הנראה נגזרת של S1/S2. **ממתין להחלטה** אם לפתוח כמשימה.

### 🟢 קלים (קוסמטי/מתועד)
- **S4** — כפל-תצוגה: `planLabelOf` מוצג פעמיים ברשימה (עמודות "מסלול"+"יתרה") לארגון חודשי-ללא-ניקוב (CourseDetail :457/:463).
- **S5** — תצוגת-quote פר-שיעור: `lessons×perLesson` מול `total` מעוגל-בנפרד לא-מתיישבים ויזואלית (הערה מפורשת EnrollModal:362).
- **S6** — שני-shells של מודאל-חיסור (`courses/AbsenceModal` + `diary/DiaryAbsenceModal`) — לוגיקה מאוחדת, רכיבים כפולים.
- **S7** — `nextSessionDate` משתמש ב-`new Date()` (לא-דטרמיניסטי) ומזין את חלון-48ש' של ההשלמה.

---

## 10. חוזקות
מודל-נתונים additive-בלבד (אפס-מיגרציה לרוב-הפיצ'רים) · מנוע-טהור נבדק-יחידה · מיגרציה חסינה (ייחודיות-member-id, דדופ-R-, ריפוי-sessions) · נוכחות-הפוכה מוגדרת-היטב · כיסוי-דוחות רחב · 29 דגלים מדורגים · אפס-חוב-קוד (TODO/ts-ignore נקי).
