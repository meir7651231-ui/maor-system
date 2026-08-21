# סגירת צרור-ה-Roadmap (21.8.2026) — 1/4/5/6 + חייגן/חיפוש/טלפוניה

**ענף:** `claude/p0-bundle-data-migration-vg7z6b` · **מוזג ל-main ונפרס** (PR ‏#318–#330).
**בסיס:** מסכי-הדור-הבא (NEXTGEN, ‏#251–#255) + שכבת-ההעצמה (COCKPIT, ‏#237–#245).

## מה נבנה בסבב הזה

### קדם-צרור — חייגן · חיפוש · טלפוניה (PR ‏#318/#319/#322)
- **אזהרת שעות-מנוחה + חיווט-חייגן** (‏#318): `quietHours.ts` טהור-דטרמיניסטי —
  `contactWindow(phone, nowHour, orgUtcOffset)` מזהה קידומת בין-לאומית (טבלת
  `PREFIX_TZ`), מחשב שעה-מקומית אצל התורם, מסמן 21:00–08:00. באנר 🌙 + כפתור ⏭
  "דלג עכשיו" (`act('skip')`) ב-`DialerModal`. כפתור "📞 חייגן (N)" בקוקפיט על
  תור-השיחות → `dialerStart` (מגודר `telephonyOn`).
- **חיפוש-מפורש שנה/חודש/קטגוריה** (‏#319, `SupportersView`): `supGaveInPeriod(sp,
  year, month)` (שנה ו/או חודש; יחד = חודש-בשנה) · `donationYears` · בוררי
  שנה+חודש גלויים ליד בורר-הקטגוריה; החודש חולק `monthF` עם דריל-אין-העונתיות;
  צ׳יפ-תקופה יחיד מנקה שניהם.
- **הפעלת טלפוניה** (‏#322): `telephony.enabled:true` ב-`public/config.json` +
  `public/c/maor-hachesed/config.json`. ⚠️ קונפיג-מכשיר ב-localStorage גובר על
  קונפיג-הריפו — במכשיר קיים צריך פליק-יחיד של המתג ☎️ באשף (או ניקוי). המתג
  הקיים (`wz-telephony`) הוא הכיבוי/הדלקה.

### פריט 1 — רישום-הו״ק המוני "לחיצה-אחת-שמבצעת" (PR ‏#324)
**הכרעת-בעלים: "בחירה ידנית מרשימה".** מסמנים מרשימת-`hokDue`, **אישור דו-שלבי**,
ואז קבלות-מס D- רציפות רק למסומנים.
- `store.bulkRecordHok(ids, todayIso)` — שער-קבלות פעם-אחת (זהה ל-`addDonation`),
  **כתיבה אטומית** עם מונה-רץ (בלי מרוץ/חורים), **דילוג-בטוח** על לא-פעיל/כבר-
  נרשם/נעלם. מחזיר `{done,rids,failed}`.
- `HokBulkModal` — תיבות-סימון (ברירת-מחדל הכול), ספירה+סכום חי, armed→"אשר יצירת N".
- **opt-in מפורש `supporters.hokbulk === true`** (יוצר קבלות ⇒ הפעלה מכוונת) —
  מודלק בקונפיג-החי. כפתור "🔁 רישום המוני · N" בשורת-ההו״ק.
- ratchets: `hok-bulk` (התנהגות) + `hokBulkWire` (הגנת-מקור).

### פריט 4 — היקום התלת-ממדי (PR ‏#326)
מבט-על שלישי לתורמים. **אפס תלות חיצונית** (בלי three.js) — הקרנת-פרספקטיבה על canvas.
- `universe3d.ts` טהור מעל `constellation` (DRY): מרים כל כוכב ל-`(x,y,z)` על
  קליפת-כדור (azimuth=angle · polar=`acos(2·hash(id)−1)` פיזור-שווה · מרחק=טריות)
  + `project()` (yaw/pitch + פרספקטיבה).
- `SupportersUniverse3D` — מיון-עומק · סיבוב-אוטומטי + **גרירה-לסיבוב** · cap-render
  400 · מכבד `prefers-reduced-motion` · מקרא-סינון + רשימת-נתונים לחיצה.
- **opt-in `supporters.universe3d === true`** — מודלק בחי. מבט 🪐 בבורר-המבטים.
  אומת חזותית (star-cloud + רשימה, 0 שגיאות).

### פריט 5 — גלריית-תמונות לתורם (PR ‏#330)
**הכרעת-בעלים: "דרך 1"** — שמירה מקומית (data:URI) ⇒ מגובה/מסונכרן/אופליין.
- `Supporter.photos?` (additive, אין מיגרציה, כרטיס-בלי-תמונות **ביט-זהה**=undefined).
- `photoGallery.ts` — עזרי-טוהר: `PHOTO_MAX=5` · `PHOTO_MAX_DIM=800` · `canAddPhoto`
  · `fitDimensions` · `isDataImage` · `sanitizePhotos` (חיטוי-XSS ‏data:image בלבד).
- **חיטוי-הגנתי ב-persist**: נוגע רק כשהשדה קיים (בלי לשבור בית-זהות).
- `SupporterPhotos` — העלאה+**הקטנה-canvas** (‏toDataURL jpeg, יורד באיכות עד תקרת-
  המשקל) · רשת · לייטבוקס · מחיקה. `store.addSupporterPhoto/removeSupporterPhoto`
  (שער-תקרה+חיטוי). **opt-in `supporters.photos === true`** — מודלק בחי.
- אומת פונקציונלית: העלאה→הקטנה→תמונת-JPEG בכרטיס (1/5), 0 שגיאות.

### פריט 6 — ורטיקל-הסטודיו (PR ‏#327 + ‏#329) · מסחרי-בלבד
כולם מגודרים `!core.taxreceipt` (מוסתרים בעמותה, נדלקים באשף בורטיקל-הסטודיו).
- **📅 גאנט-תלויות** (‏`supporters.ayin.gantt`): `AyinName.days?`/`deps?` +
  `projectSchedule.ts` (ES/EF longest-path, משך-כולל, **נתיב-קריטי** LF/LS,
  **חסין-מחזורים**). פאנל בכרטיס-הפרויקט + סרגלי-גאנט. `ayinSetNameSchedule`.
- **📦 install-kit** (‏`supporters.ayin.kit`): `AyinCase.kit?` + `installKit.ts`
  (`kitProgress` + ערכת-ברירת-מחדל). צ׳ק-ליסט-מסירה + "מוכן-למסירה". `ayinSetKit`.
- **🏭 מלאי-מחסן חוצה-פרויקטים** (‏`supporters.ayin.warehouse`): **הישות ה-23**
  `WarehouseItem`/`db.warehouse` (additive, ריפוי-persist, **מסונכרן-סכמה מלא**:
  `ENTITY_COLLECTIONS` + `BACKUP_COLLECTIONS` בשרת + אורך-ENTITY→23). `warehouse.ts`
  — `warehouseOverview` (מלאי/הוקצה-נגזר-מ-MatEntry/נותר/מחסור + פירוק-פר-פרויקט,
  התאמת-שם מנורמלת) + `warehouseValue`. `WarehouseBoard` (מבט 🏭). אפס-כסף/קבלות.

## אינווריאנטים ששמרו
- **אפס אובדן יכולת** · אפס שינוי-סכמה-הרסני (רק additive: `photos`/`days`/`deps`/
  `kit`/`warehouse`) · **בית-זהות ללקוח-החי** בכל הדגלים החדשים (opt-in `=== true`
  או מסחרי-`!taxreceipt`) · כל מנוע = `lib.ts` טהור + ratchet.
- **300 קבצי-בדיקה / 2141 בדיקות** ירוקות · build נקי.

## ⚠️ לקח-תשתית — עיכוב-סנכרון ב-git proxy
בסביבה-המרוחקת, `git fetch origin main` החזיר לעיתים **ref ישן** (replication lag) —
`git checkout origin/main` נחת על main-ישן ונראה כאילו "נעלמו" קבצים/דגלים. **אף
עבודה לא אבדה** (fetch לא מוחק מהרימוט). הפתרון שאומץ: fetch עם **retry עד
`git merge-base --is-ancestor <SHA-אחרון> origin/main`** מאשר נוכחות, אימות-קיום-
קבצים (`grep -c`) אחרי reset, וקיבוע-commit מיידי לפני נגיעה חוזרת ב-git.

## נותר (הכרעת-בעלים/חלון-בעלים — לא עבודה פתוחה)
- הרצת הצפנת-הענן + מיגרציה (הבעלים בוחר סיסמה) · הרשמה-עצמית-בענן לחוגים
  (כללי-פרטיות/ענן) · ‏roadmap-הסטודיו-העתידי אם יידרש.
