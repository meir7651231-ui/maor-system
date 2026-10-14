# 📚 מפקד החלקים: BuildSmart (בנייה חכמה)

- **המקור:** `meir7651231-ui/buildsmart`, ענף `main@1d09aa87c0aa969ec4187baf9b77e2a50f7f2803`. קראנו בלבד, בלי לשנות ובלי push.
- **הקובץ:** `catalog/sources/buildsmart.json`, בפורמט-החלק המשותף, ממוין לפי `id`, עם `generatedAt: null`.
- **הסקריפט:** `catalog/scripts/buildsmart-census.mjs`. הוא דטרמיניסטי. `--check` יוצא עם 1 אם הקובץ השמור לא מעודכן. `--repo <path>` או `BUILDSMART_REPO` מגדירים איפה השכפול.

```bash
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/meir7651231-ui/buildsmart ../meir7651231-ui/buildsmart
node catalog/scripts/buildsmart-census.mjs            # כותב
node catalog/scripts/buildsmart-census.mjs --check    # בודק בלבד
node catalog/scripts/buildsmart-census.mjs --stats    # + ספירת החריגים
```

## בשורה אחת

**902 חלקים**, מתוכם 836 טהורים. הם מתחלקים כך:
- **798** פונקציות;
- **19** כללים, כלומר בודקי כן/לא בקבצי מדיניות, אימות או הסכמה;
- **19** מנועי תחום;
- **66** רכיבי מסך לשימוש חוזר.

## איך נבנה

| תיקייה | שפה | שיטה |
|---|---|---|
| `app/src` (Preact, האפליקציה החיה) | TypeScript | TypeScript compiler API: כל פונקציה מיוצאת (`function` או `const = () =>`) |
| `functions/src` (Firebase Functions) | TypeScript | אותו הדבר. רק ליבות טהורות נכנסות (`creditCore`, `setEmployerCore`, `common`); ה-handlers עצמם (`onCall`) אינם פונקציות טהורות |
| `app_flutter/lib` (Flutter, האפליקציה החדשה) | Dart | סורק קל בלי SDK. הוא מסווה מחרוזות והערות (כולל `${…}`), מודד עומק סוגריים ותופס פונקציות ציבוריות ברמה העליונה ומתודות `static` |
| `orchestrator/` | sh | **לא מופה.** יש בו רק סקריפטי bash (`central-verify.sh` ועוד) ומסמכי markdown, ואין עוזרים טהורים ב-TS/JS |

### טוהר: מה פוסל

- **TypeScript.** חלק נפסל אם:
  - הוא `async` או משתמש ב-`await`;
  - הוא נוגע ב-`document`, `window`, `localStorage`, `fetch`, `console` או `navigator`;
  - הוא משתמש ב-`Date.now`, ב-`new Date()` בלי ארגומנטים או ב-`Math.random`;
  - הוא מייבא ממודול של store, signals, firebase או רשת;
  - הוא קורא משתנה מודול שמשתנה (`let`, `signal`, `computed`);
  - הוא משנה פרמטר;
  - הוא מחזיר `void`.

  הטומאה עוברת הלאה לכל מי שקורא לפונקציה טמאה, גם בין קבצים.
- **Dart.** חלק נפסל אם:
  - הוא משתמש ב-`ref.watch/read`, `WidgetRef` או `Ref`;
  - הוא תלוי ב-`BuildContext` או ב-`X.of(context)`;
  - הוא משתמש ב-`setState`, `Navigator`, Firebase או http;
  - הוא `async`, או משתמש ב-`Future`, `Stream` או `Timer`;
  - הוא משתמש ב-`DateTime.now` או ב-`Random`;
  - הוא משתמש ב-`print`, באחסון (`SharedPreferences`) או בפלטפורמה (`Platform`, `Clipboard`, `launchUrl`);
  - הוא מקבל פרמטר מסוג `*Notifier` או `*Controller` וכדומה;
  - הוא מחזיר `void`, `Widget` או `Route`.

  הטומאה עוברת הלאה לפי שם הפונקציה. עוזר שמחזיר `void` (ממלא רשימה מקומית או מטמון) **לא** פוסל את מי שקורא לו, כי מבחוץ הקורא נשאר טהור.
- **רכיבי מסך** (`what: component`, `gives: ui`, `pure: false`) נכנסים רק אם הם אבני בנייה:
  - `app/src/components/**`;
  - `app_flutter/lib/widgets/**`;
  - `app_flutter/lib/atoms/**`;
  - `features/*/widgets/**`.

  מסכים שלמים (`screens/`) לא נכנסים כרכיבים. 174 כאלה דולגו. עוזרים טהורים מתוך קבצי המסכים כן נכנסים (97).

### השם והמשפט

- **`name`** נבנה מהמזהה: פועל מהמילה הראשונה (`compute` = מחשב, `valid` = בודק תקינות של, `format` = מעצב…) ואחריו מושא. צירוף שמות באנגלית מתהפך, למשל family spec = "מפרט משפחה". מילות קישור מתורגמות: By = "לפי", For = "עבור". `fromJson` הופך ל"קורא X מתוך נתונים שמורים", וסיומת `He` הופכת ל"… בעברית". אורך השם 9 מילים לכל היותר.
- **`does`** הוא המשפט העברי הראשון מהערת התיעוד של הקוד, כשהוא רובו עברית ועובר ניקוי: בלי רצף ספרות, בלי מייל או קישור ובלי ₪ ומספר. כך נבנו 45 חלקים. בשאר החלקים המשפט מחולל, בצורה "מקבל X, ומחזיר Y — <השם>".
- **`example`** כתוב ביד ונבדק מול הקוד. יש 10 דוגמאות, כולן מנוקות: בלי טלפונים, בלי ת״ז ובלי מיילים. בכל השאר `null`.

## ספירות

**לפי שפה**

| lang | חלקים |
|---|---|
| dart | 831 |
| ts | 71 |

**לפי what**

| what | חלקים |
|---|---|
| function | 798 |
| component | 66 |
| rule | 19 |
| engine | 19 |

**לפי kind של מה שיוצא (`gives.kind`)**

| kind | חלקים |
|---|---|
| list | 240 |
| record:\* (109 ישויות שונות) | 219 |
| text | 183 |
| bool | 93 |
| ui (66 רכיבים ו-4 עוזרי עיצוב, כמו צבע או סגנון) | 70 |
| number | 39 |
| amount | 25 |
| choice | 22 |
| span | 3 |
| date | 3 |
| image | 2 |
| file | 2 |
| unknown | 1 |

**לפי kind של מה שנכנס (`takes[].kind`)**

| kind | פרמטרים |
|---|---|
| record:\* | 419 |
| text | 336 |
| list | 232 |
| number | 159 |
| choice | 54 |
| bool | 47 |
| amount | 38 |
| unknown | 31 |
| date | 25 |
| span | 10 |
| geo | 2 |
| times | 1 |

**לפי אזור:**
- `features/`: ‏189;
- `logic/`: ‏173;
- `data/`: ‏165;
- `state/`: ‏110 (רק החלקים הטהורים: `fromJson`, מחשבונים);
- `screens/`: ‏97 (עוזרים טהורים);
- `app/src`: ‏42;
- `widgets/`: ‏41;
- `functions/src`: ‏29;
- `domain`, `config`, `atoms`, `theme`, `services`: ‏54.

**לפי תגית תחום** (חלק יכול להופיע ביותר מתגית אחת):

| תגית | חלקים |
|---|---|
| קטלוג | 255 |
| בינה | 128 |
| חיפוש | 113 |
| טקסט | 74 |
| פרויקטים | 58 |
| רכש-ומשלוח | 46 |
| הנדסה | 46 |
| כסף | 42 |
| כמויות | 42 |
| מסמכים | 35 |
| פרסונות | 29 |
| זמן | 25 |

### מנועי התחום (`what: engine`, 19)

כל מנוע הוא שורה אחת עם `symbol: "*"`, ו-`gives.type` מציין כמה חלקים טהורים יש בו.

- **תמחור:**
  - `logic/price_estimate`;
  - `logic/money_format`;
  - `logic/invoice`;
  - `app/src/data/suppliers` (מחיר לפי ספק והספק הזול);
  - `functions/creditCore` (אשראי).
- **כתב כמויות וחומרים:**
  - `logic/install_kit`;
  - `logic/install_engine` (21 חלקים).
- **רכש ומשלוח:**
  - `logic/delivery_note`;
  - `logic/equipment_stock_join`;
  - `state/material_requests_engine`.
- **הנדסה:**
  - `logic/pressure_drop`;
  - `domain/connection_resolver`.
- **פרויקטים:**
  - `logic/tasks_gantt`;
  - `logic/workflow_engine` (17).
- **חיפוש ובינה:**
  - `logic/fuzzy_match`;
  - `logic/customer_score`;
  - `logic/attention_engine`.
- **מסמכים:** `data/csv_kernel`.
- **פרסונות:** `functions/setEmployerCore`.

**חוגות הפרסונות:** אין בהן לוגיקה טהורה. `state/dial_state.dart` ו-`data/personas.dart` הן רק `StateProvider` ו-`resetAllDials(WidgetRef)`. לכן לא נוצר להן מנוע. רכיבי החוגה עצמם (`BsDial`, `DialRow`, `DialColumn`, `MenuSpeedDial`) רשומים כרכיבים.

## 15 דוגמאות בעברית פשוטה

1. **`formatNis`** מעצב שקלים: ‎-3150 ⇒ "‎-₪3,150". הסימן בא לפני ה-₪.
2. **`groupThousands`** מקבץ אלפים: ‎3150 ⇒ "3,150".
3. **`invoiceVatOf`** מחשב מע״מ חשבונית, כלומר את חלק המע״מ שבתוך סכום ברוטו: ‎1180 ⇒ 180.
4. **`damerauLevenshtein`** מודד כמה שגיאות כתיב יש בין שתי מילים: "ab" מול "ba" ⇒ 1 (החלפת שכנים).
5. **`estimatePressureDrop`** מעריך ירידת לחץ בקו צנרת לפי הקטעים, הזרימה והטמפרטורה.
6. **`recommendedKitForProduct`** מחזיר ערכת התקנה מומלצת למוצר: האביזרים שבאים איתו.
7. **`buildTasksGantt`** מסדר משימות של פרויקט על ציר גאנט.
8. **`buildDeliveryNoteRows`** בונה את שורות ההדפסה של תעודת משלוח מהזמנה.
9. **`cheapestSupplier`** מוצא את הספק הזול ביותר למק״ט.
10. **`orderSum`** (שרת) מחשב סכום הזמנה מהשורות. שורה בלי מחיר תקין נספרת 0: ‎[10.4, 'x', 5] ⇒ 15.
11. **`startOfWeekSunday`** מחזיר את יום ראשון של השבוע של תאריך נתון.
12. **`validIsraeliMobile`** בודק שזה מספר נייד ישראלי תקין: 10 ספרות שמתחילות ב-05, ומותר עם מקפים.
13. **`parseCsvRecords`** מפענח טבלת CSV לרשומות ומזהה לבד את המפריד.
14. **`wfNextStage`** מחזיר את השלב הבא בתהליך עבודה.
15. **`scoreCustomer`** נותן ציון ללקוח לפי הפעילות שלו (RFM).

## כנראה כפולים עם אורביט (maor-system) בשם אחר

| BuildSmart | אורביט | מה משותף |
|---|---|---|
| `logic/money_format#formatNis`, `#groupThousands`; `app/src/data/identity#formatIls` | `components/wall/wallData#fmtIls`, `components/hosting/lib#money`, `lib/atoms/previewZmanim#moneyLine` | עיצוב ₪ עם פסיקים |
| `logic/input_validators#normalizePhone` | `lib/validate#normalizePhone`, `lib/dedup#normPhone` | טלפון למפתח מקומי 05… (הסר תווים, ‎972 ⇒ 0) |
| `logic/input_validators#waMeDigits` | `lib/wa#waLink` (הנרמול הפנימי ל-972) | טלפון לספרות wa.me |
| `logic/input_validators#validBusinessId` | `lib/validate#validIsraeliId` | ספרת ביקורת 1-2-1-2 (ח״פ מול ת״ז, אותו אלגוריתם) |
| `logic/fuzzy_match#damerauLevenshtein`, `#fuzzyMatch`, `#fuzzyScore` | `lib/search#levenshtein`, `lib/atoms/parts/fuzzy#fuzzyFind` (חלק 🔍) | מרחק עריכה וחיפוש מקורב |
| `logic/text_normalize#normName`, `#normSearch` | `lib/validate#normName`, `#normSearch` (ועוד שלושה `normName`), `lib/atoms/parts/fuzzy#normHe` | נרמול טקסט עברי לחיפוש ושמות |
| `data/csv_kernel#parseCsvRecords`, `#tokenizeCsvAutodetect` | `lib/csvx#toCsv`, `#csvEscape` (כיוון הפוך: כתיבה); ייבוא ב-`ImportSection` | ליבת CSV |
| `logic/tasks_gantt#buildTasksGantt` | `lib/projectSchedule#scheduleTasks` | גאנט משימות (באורביט עם נתיב קריטי) |
| `logic/install_kit#recommendedKitFor`, `logic/install_engine#*` | `lib/installKit#kitProgress` | ערכת התקנה (באורביט מעקב בלבד) |
| `logic/equipment_stock_join#availabilityFor` | `lib/warehouse#warehouseOverview` | זמינות מלאי מול דרישה |
| `logic/price_estimate#estimatePrice`, `logic/invoice#*` | `lib/ayin#boqTotal`, `#boqLineAmount`, `#matCostTotal` | תמחור והצעה (BOQ) |
| `logic/calendar_days#daysBetweenDst`, `#startOfWeekSunday` | `lib/date-util#isoDaysAgo`, `#dateInRange`, `lib/monthGrid` | חשבון ימים ושבועות |
| `logic/workflow_engine#wfNextStage` ושות׳ | שלבי המשפך בוורטיקל הסטודיו (`supporters.ayin`) | קידום שלבים |
| `logic/customer_score#scoreCustomer` (RFM) | `components/supporters/intel.ts` (RFM מפורק, churn) | ציון לקוח או תורם |

## מה לא מופה, ולמה

- **`orchestrator/`:** אין בו קוד TS/JS. הסקריפטים ב-bash, והם שערי CI ולא חלקים טהורים.
- **מתודות מופע (non-static) של מחלקות Dart**, כמו `get total` או `copyWith`, ו-**5 הרחבות** (`extension`): לא נספרו. הן תלויות במופע, ובפורמט המשותף אין להן מקום כ"פונקציה עם קלט". לשלב הבא אפשר למפות אותן כ-`record:<entity>` ⇒ X.
- **פונקציות פרטיות** (`_x` ב-Dart, ולא-מיוצאות ב-TS): בכוונה מחוץ לקטלוג, כמו חוזה "מיוצא בלבד".
- **400 פונקציות ציבוריות לא טהורות:** 70 ב-TS ו-330 ב-Dart. ב-Dart, הסיבה הראשונה שנמצאה לכל פונקציה מתחלקת כך:
  - context: ‏~100 (`BuildContext`, `.of(context)`, ניווט);
  - widget או Route: ‏75;
  - async: ‏60;
  - ref: ‏56;
  - void: ‏16;
  - firebase: ‏5;
  - השאר: שעון, פלטפורמה ותלות בפונקציה לא טהורה.

  הרשימה המלאה: `CENSUS_DEBUG=1 node catalog/scripts/buildsmart-census.mjs`.
- **מסכים** (174 מחלקות Widget ב-`screens/` ובמסכי `features/`): לפי ההנחיה לא נכנסו כרכיבים.
- **ספריות נתונים** (`data/catalog.ts`, ‏`variants.ts`, ‏`huliot_catalog.dart`…): רק הפונקציות שעליהן נכנסו, לא ערכי הנתונים.
- **`atom-engine/`, `edge-proxy/`, `perfect-agent/`, `tools/`, `scripts/` בשורש:** מחוץ לתיקיות שהוקצו לסשן הזה, ולכן לא מופו. כדאי למפות אותם בסבב הבא; `atom-engine/` כנראה הכי רלוונטי ל"מכונה".
- **מגבלות הסורק של Dart:** הוא בלי ניתוח טיפוסים, ולכן:
  - טוהר נקבע לפי סימנים בגוף ולפי שמות. עלולים להיות טהורים שנפסלו, למשל משתנה מקומי בשם `state =`;
  - עלולים להיות לא טהורים שעברו, למשל כתיבה למשתנה גלובלי בלי `void`;
  - `kind` של `record:*` נגזר משם הטיפוס;
  - מספרים מקבלים `amount` מול `number` לפי רמזי שם (price, qty וכו׳).
- **`name` ו-`does`:** חוללו ממילון של כ-600 מילים. חלק מהשמות נשמעים "מתורגמים", למשל "בונה שורות תעודה משלוח" במקום "בונה שורות לתעודת משלוח". אין בהם נתונים, וקל לשפר אותם ידנית בסבב ליטוש.
