# CLOSED · 🧭 המכונה v3 — מקום, קול, תמונה ותור לפי הצורה · מיפוי המילון · חיפוש בלי תקרה · פותח v2 (14.10.2026)

ענף `claude/machine-v3-261014` (מ-`claude/machine-v2-261014` @abc82e8, ומוזג אליו `claude/inner-v2-261014` @4caa66b). לא מוזג ל-main.

## 1. לבעלים, בקצרה

- **כל המילון (179 מילים · 990 צרכים): 🔎 165 ⇒ 64.** מוכחים: 775+38+12 = 825 ⇒ **853+53+20 = 926**. מילים שכולן ✅: **72 ⇒ 127**.
- **חמנייה 17/17 · דרקון 8/8 · קרוסלה 7/7** — לא השתנו (הדרקון שומר על מודד-המרחק של הגלקסיה, 35/35).
- **מקום:** "התחנה הקרובה / האמבולנס הקרוב / המונית הקרובה / הקרוב ביותר" = הבוחר-הקיצוני של חלוקת-המעטפות בפרנס׳לע (`envLayout…d:step`, חלק פנימי) — הוא כבר עבד על נקודות, המילון פשוט לא ידע. "חוזר לאותו חוף / לנהר שבו נולד / תחנה פנויה" = חיפוש-לפי-מפתח של הישיבה, **רץ על נקודות** (24/24).
- **קול:** "מזהה את בן-הזוג לפי הקול" = אותו חיפוש, רץ על רשימת צלילים (24/24). שאר הקול (מנגינה, הד, דעיכה) נשאר 🔎 — אין בקוד שלנו שום חלק טהור שמחזיק צליל (‏`tone()` של פרנס׳לע הוא WebAudio, לא חלק).
- **תור:** "אישורי הגעה" = הספירה של כרטיס-החוג (`CourseDetail…n`); "לא הגיע ⇒ הבא נכנס / לא בבית ⇒ ניסיון חוזר / נתקע דף" = סובל-כשל, רץ על תור.
- **המילון:** 70 התנהגויות מופו מחדש לפי מה שהטקסט אומר (66 של 12 הזוגות + 4), עם `note` לכל אחת. הטקסט לא השתנה.

## 2. לפני ⇒ אחרי

| שלב | ✅ חלק | ✅ פנימי | 🧩 שילוב | 🔎 | מילים מלאות |
|---|---:|---:|---:|---:|---:|
| **לפני** (machine-v2 @abc82e8) | 775 | 38 | 12 | **165** | 72 |
| + סוג לפי צורה (מפקדים · פותח · קורא) | 775 | 39 | 18 | 158 | 75 |
| + טבעת 1 בלי `CAP_CORE` | 777 | 77 | 9 | 127 | 88 |
| + צורת `on` · מתאמי-צורה · `record:x` | 783 | 77 | 19 | 111 | 94 |
| + מיפוי המילון (12 הזוגות, 66 התנהגויות) | 849 | 52 | 19 | 70 | 122 |
| + מיזוג פותח v2 (17,360 חלקים פנימיים) | 849 | 53 | 20 | 68 | 123 |
| + 4 מיפויים נוספים (מגריל×3, קופץ) | **853** | **53** | **20** | **64** | **127** |

⛏️ = 0 לאורך כל הדרך. אף צורך לא ירד בסטטוס באף שלב (נבדק צורך-צורך מול הבסיס).

### לפי משפחה (החומר המקורי של הצורך)

| משפחה | צרכים | 🔎 לפני | 🔎 אחרי | נסגרו כ- |
|---|---:|---:|---:|---|
| מקום (geo) | 71 | 41 | **28** | 🧩 8 · פנימי 5 |
| קול (sound) | 20 | 17 | **16** | 🧩 1 |
| תמונה (image) | 11 | 11 | **9** | 🧩 2 |
| תור (waiting) | 15 | 12 | **5** | 🧩 4 · פנימי 3 |
| שאר החומרים | 873 | 84 | **6** | חלק 76 · פנימי 2 |

## 3. משימה 1 — הסוגים שכבר קיימים

### 3.1 זיהוי לפי צורה (מיפוי אחד משותף)

`catalog/lib/kind-shape.mjs` — שלוש כניסות, אותו כלל: צורה (desc), טקסט-טיפוס של TS, ערך-ריצה. מתועד ב-`catalog/contract.md §3.1`.

| סוג | צורה | לא |
|---|---|---|
| מקום | `{x,y}` · `{x,y,z}` · `{lat,lon|lng}` (עד 6 שדות) · `[x,y]` עם שם-נקודה · רשימת נקודות = מסלול | רשומה גדולה עם x,y |
| קול | תדר מפורש + זמן, או `{f,d,g}` כמו `tone(f,t,d,g)` · רשימה = מנגינה | `{f,t}` (מ-עד — חלון-שעות) |
| תמונה | `data:image/…` · `{width,height}` · `{w,h}` עם שם-תמונה · שם-תמונה | `sensitiveTopic` ("pic" באמצע מילה) |
| תור | **רשימה** של פריטים עם סטטוס-המתנה (wait/pending/queued…) | פריט בודד — נשאר `record:x` |

**מחובר ל:** `lib/entry.mjs › kindOfDesc` (הפותח והקורא) · `orbit-census` · `buildsmart-census` · `others-census`. Dart (המחולל, הטבעות) — לא נגעתי.
**נוצר מחדש בסקריפטים** (שכפולים ב-`/home/user/catsrc` ב-ref של כל מפקד): מפקדים ⇒ `open` ⇒ `prove` ⇒ `behavior-probe` ⇒ `lift` ⇒ index ⇒ combos ⇒ lab-data.
**מה זוהה (בסבב הראשון, לפני פותח v2):** 42 חלקי-מקום (`project` של היקום-3D, `seatPositions`, המעטפות, הגלקסיה), 15 תמונה (`pickAndCompressImage`), 101 תור (`Enrollment[]`, `PrListing[]`), 6 קול.

**שלושה באגים שנתפסו בדרך (ננעלו ב-`kind-shape.test.ts`):**
- `sensitiveTopic` סווג כתמונה ⇒ שם-תמונה = מילה שלמה או סיומת camelCase.
- חלון-שעות `{dow, f, t}` סווג כצליל ⇒ צליל = תדר מפורש, או f+d+g.
- כל `Enrollment` בודד הפך ל"תור" ושבר התאמה של רשומה (אזעקה n5 ירדה) ⇒ רק **רשימה** היא תור.

**התאמה במצרף** (`fitPart`/`SUB_KIND`): תור ⊂ רשימה ומנגינה ⊂ רצף — רק בצד החלק. ניסיתי קודם התאמה דו-כיוונית; היא "הוכיחה" 22 צרכים על-ידי חלקי-רשימה כלליים (‏`supAvgDon` "עובד על מוזיקה") — בוטלה.

### 3.2 המתאמים — מה נמצא

| מנגנון | מה | נמצא |
|---|---|---|
| חלק שכבר עובד על החומר | הסוג זוהה ⇒ טבעת 1 | בוחר-הקיצוני של המעטפות (מקום) · ספירת-החוג (תור) · `fitPart` |
| **`on` — אותו חלק, על החומר** | חלק מוכח ל-V עם קלט פתוח בקוד; החומר נכנס לקלט הזה, החוקים חייבים לעבור **עליו** | 8 זוגות (סעיף 3.3) |
| מתאם-צורה | מתאם-סוג מוכח עם קלט/פלט מהסוג + פרמטרים מספריים (`project(p, yaw, pitch)`, מרחק הגלקסיה) | נבדקו; לא עברו לבד חוקים של פועל חדש מעבר לדרקון |
| `record:<x>` | פועל שמקבל רשומה ⇒ רשומה מסוג ידוע | `assign-role·record:ant/bee/candle/penguin/player` (6 התנהגויות) |

**ביושר — המתאמים שהמשימה ציפתה להם:** נקודה⇄מרחק (`dist` של המטבע, מרחק-הגלקסיה), 3D⇒2D (`project`), קוטבי⇄קרטזי (`orbit`) — **כולם קיימים ומוכחים**, אבל אצל הפעלים שנשארו החוקים בודקים משהו אחר מהחומר: `follow`/`bounce`/`random`/`spread`/`shortest-path` בודקים מספר/גוף/רצף/גרף-צמתים. שרשרת "נקודה ⇒ מרחק ⇒ פועל" יוצאת מספר, וחוקי הפועל לא קושרים אותה לנקודה (נבדק — `clamp·geo` עבר 3/3 על **הפרמטר**, ונחסם בכלל "על החומר").

### 3.3 השילובים (`combos.json`: on 8 · זוג 2 · גרף 1)

| פועל·חומר | איך | חוקים | התנהגויות |
|---|---|---|---|
| משווה·מקום | זוג: מרחק-הגלקסיה ⇒ `drawerDiff` (רמז `{part}` בשמו המלא) | 35/35 | דרקון · עין · גשר |
| מחלק·מקום | on: `writeGoalSpecs.rooms` (המחולל) על נקודות | 20/20 | זיקית · זיקוקים |
| מחפש·מקום | on: `judge.best` (הישיבה) על נקודות | 24/24 | סלמון · צב · רכב-חשמלי |
| מחפש·קול | on: אותו חלק, על צלילים | 24/24 | פינגווין |
| הופך·מקום / הופך·תמונה | on: `ProfileTreeSubmenu.reversed` (בנייה חכמה) | 24/24 | זרע · כוכב-שביט · קליידוסקופ |
| מעצב·תמונה | on: `sendTelegramMessage…data` (14kk) | 15/15 | לחם-מחמצת |
| סובל·מקום / סובל·תור | on: `searchExact.bucket` | 18/18 | רובוט-שואב · תור-במרפאה · דואר · מדפסת · משלוחים |
| מסכם·זמנים | `collectionTotal` ⇒ `cnFly.t` | 24/24 | שליחים |
| מכוון לפי השמש·מספר | גרף, 11 חלקים | 72/72 | חמנייה |

**ביושר על `on`:** "מעצב" ו"סובל-כשל" הם פעלים חלשים (חד-חד-ערכי+דטרמיניסטי; מדלג על שבור). הם עברו n/n על החומר — זה מה שהחוקים דורשים, לא יותר.

### 3.4 ה-64 שנשארו 🔎 — הסיבה המדויקת

**א. אין שום חלק עם הסוג/הצורה (0 מועמדים בכל הצורות) — 28 התנהגויות:**

| זוג | ה. | למה |
|---|---:|---|
| מוצא דרך קצרה·מקום | 5 | הליבה מקבלת גרף-צמתים `{edges:{a,b,w}}`. אין חלק מוכח שבונה קשתות מנקודות (הקוד היחיד — "רשת הסינפסות" של `three-scene.ts` — בונה אובייקטי THREE ולא נפתח) |
| מתפשט·מקום | 5 | אותה סיבה: הליבה מתפשטת בגרף-צמתים |
| הולך אחרי·מקום | 3 | החוקים בודקים **מספר** שמתקרב למטרה; אין מתאם-זוג נקודה⇒(x,y)⇒נקודה מוכח להריץ לכל ציר |
| מגריל·מקום | 2 | הליבה נותנת רצף מספרים; אין מתאם מוכח "מספרים ⇒ נקודות" שהחוקים של «מגריל» (בין 0 ל-1, מפוזר) עוברים עליו |
| קופץ·מקום | 1 | החוקים בודקים גוף {pos, vel} חד-ממדי |
| הד·קול (2) · דועך·קול · דוגם·קול · מעביר·קול | 6 | אין חלק טהור שמחזיק צליל (‏`tone()` הוא WebAudio) |
| דוגם·תמונה | 2 | אין חלק דוגם עם קלט פתוח |
| מעצב·ui | 1 | רכיבי-מסך לא נכנסים לאינדקס (בכוונה) |
| ממלא טקסט·קובץ | 1 | אין חלק `personalize` שנותן קובץ |
| דורש מקור·בחירה | 1 | "ידני גובר על אוטומטי" — אין חלק דורש-מקור על ערך יחיד |
| מתכון·רשומה | 1 | צורך-בדיקה של מתכון-שמור (fixture) — אין לפועל "מתכון" חוקים |

**ב. יש מועמדים, החוקים נכשלים — 36 התנהגויות:**

| זוג | ה. | מועמדים (2/on/3) | החוק שנכשל / הסיבה |
|---|---:|---|---|
| ממיר·קול | 3 | 0/24/0 | אין קלט פתוח לצליל; `hash.h` — הפלט לא בצורה ש«ממיר ערך» בודק |
| מחבר רצפים·קול | 4 | 0/1/0 | `mergeRuns` עובד על כן/לא, לא על צלילים |
| הבא בתור·תור | 4 | 2/2/0 | `firstRun`/`nextAfter` לא פתוחים; החוקים בודקים רגעים |
| מסנן·מקום | 3 | 0/20/0 | "אין מקרה-עד לא-טריוויאלי" — המסננים הפתוחים לא סיננו נקודות |
| מקבץ לפי יום·תמונה | 3 | 0/24/24 | החוקים בודקים רגעים (אותו יום ⇒ אותו מפתח) |
| מקבץ·מקום | 2 | 0/4/0 | `buildDayGrid.byDate` — לפי תאריך; הפלט לא בצורה ש«מקבץ» בודק |
| מחבר רצפים·זמנים | 2 | 0/0/9 | עומק 3 — הפלט לא בצורה ש«מחבר רצפים» בודק |
| מחלק בתורות·מקום (2) · תמונה · קול | 4 | 4/1/12 | `fairAssign` — הפלט לא בצורה; `rotate.period` — אחרי 7 תורות לא חזר |
| משווה·תמונה · משווה·קול | 2 | 2/16/24 | אין קלט פתוח; הפלט לא בצורה ש«משווה» בודק |
| מגביל·מקום | 1 | 4/24/0 | עבר רק על הפרמטר — נחסם בכלל "על החומר" |
| מסיר כפולים·מקום · תמונה | 2 | 0/2/0 | `dedupe.keeps` — הוסר פריט שאינו כפול (`dedupById` מזהה לפי id) |
| ממיין·מקום | 1 | 0/2/0 | `sort.order-free` — ערבוב שינה את הסדר |
| מזיז·מקום | 1 | 12/11/24 | הפלט לא בצורה ש«מזיז» בודק |
| הבא בתור·מקום | 1 | 0/2/9 | הפלט לא בצורה ש«הבא בתור» בודק |
| מסלים·קול | 1 | 0/20/0 | הפלט לא בצורה ש«מסלים בזמן» בודק |
| מנתב·קול | 1 | 0/10/0 | `route.one` — לא ערוץ אחד |
| מוצא עם טעות·תמונה | 1 | 0/1/18 | הפלט לא בצורה ש«מוצא גם עם טעות» בודק |
| דורש מקור·תור | 1 | 2/0/0 | `source.pass` — 6 פריטים עם מקור, התקבלו 0 |

הפירוט המלא (כל ניסיון, החוק, הסיבה): `catalog/combiner/combos.json › results[].tried`; בקשות-החפירה: `catalog/combiner/dig/*.json` (64).

## 4. משימה 2 — המילון (70 עריכות, כל אחת עם `note`)

הסכמה (`catalog/goals/schema.json`) קיבלה שדה `note` אופציונלי. הטקסט, ה-`detail` וה-`keys` לא השתנו. `goals.test` ו-`combiner.test` ירוקים.

| זוג לפני | ⇒ | למה |
|---|---|---|
| צובר·מספר (19) · צובר·סכום (1) | צובר·רצף | החוקים בודקים רצף של רמות; הכמות היא האיבר האחרון |
| מדרג·רשימה (20) | ממיין·רשימה (11) · מדרג·מספר (8) · בוחר-קיצוני·רשימה (1) | לפי הטקסט: "סדר / דירוג / מיון" = ממיין; "זהב-כסף-ארד / מחלקות / ציון / קושי / גובה" = כל ערך ⇒ מדרגה; "הריח החזק" = הקיצוני |
| הבא·תאריך (10) | הבא·רגעים | החוקים משווים רגעים; יום בלוח הוא רגע |
| מסנן·תאריך (5) | בודק·תאריך (2) · מסנן·רשימה (3) | "סגור בשבת / רק בימי חול" = שאלה על יום אחד; "פג תוקף / מתי נראה / בקשות חופש" = סינון רשימה |
| מעביר·טקסט (3) | מעביר·רשימה | הליבה מקבלת רשימת הודעות {ממי, מה} |
| מוצא-עם-טעות·זמנים (2) · ·תאריך (1) | מגריל·רצף (2) · מתנדנד·מספר (1) | "קצת אקראי" = הגרלה עם זרע; "מעבר הדרגתי בין העונות" = מחזור |
| הופך·בחירה (2) | ממיר·מספר (1) · מזיז·מספר (1) | כיוון ±1 מתהפך; העונה מוזזת בחצי שנה |
| מחבר רצפים·טקסט (1) | מצרף לטקסט·רשימה | ברכות מכולם לכרטיס אחד |
| מגריל·בחירה (1) | מגריל·רצף | האות = מספר מוגרל מודולו 4 |
| הולך אחרי·זמנים (1) | הולך אחרי·מספר | הקצב הוא מספר שמתקרב לקצב השכנה |
| **נוספות (4):** מגריל·זמנים (2) · מגריל·כן/לא (1) | מגריל·רצף | אותה סיבה כמו "קצת אקראי" |
| קופץ·מספר (1) | קופץ·`record:body` | הליבה עובדת על גוף {מקום, מהירות}; הגובה הוא שדה |

**כל העריכות:**

| # | קובץ | מילה | התנהגות | לפני | אחרי |
|---:|---|---|---|---|---|
| 1 | `animals.json` | כוורת | דבש מצטבר בתאים | `accumulate·amount` | `accumulate·sequence` |
| 2 | `nature.json` | אלמוג | גדל מעט כל שנה | `accumulate·number` | `accumulate·sequence` |
| 3 | `home.json` | אקווריום | המים מתלכלכים לאט | `accumulate·number` | `accumulate·sequence` |
| 4 | `weather-space.json` | גשם | ענן מתמלא | `accumulate·number` | `accumulate·sequence` |
| 5 | `home.json` | דוד-שמש | חום המים מצטבר | `accumulate·number` | `accumulate·sequence` |
| 6 | `weather-space.json` | הוריקן | מתחזקת מעל ים חם | `accumulate·number` | `accumulate·sequence` |
| 7 | `nature.json` | הר-געש | לחץ מצטבר מתחת לאדמה | `accumulate·number` | `accumulate·sequence` |
| 8 | `toys.json` | כדור-פורח | עולה כשמחממים | `accumulate·number` | `accumulate·sequence` |
| 9 | `city.json` | מעבר-חציה | מחכים שיצטברו | `accumulate·number` | `accumulate·sequence` |
| 10 | `nature.json` | מפל | הבריכה מתמלאת | `accumulate·number` | `accumulate·sequence` |
| 11 | `food.json` | מרק | מתחזק בטעם לאט | `accumulate·number` | `accumulate·sequence` |
| 12 | `vehicles.json` | משאית-זבל | מתמלאת בכל תחנה | `accumulate·number` | `accumulate·sequence` |
| 13 | `animals.json` | נמלה | משאירה שביל ריח | `accumulate·number` | `accumulate·sequence` |
| 14 | `home.json` | סל-כביסה | מתמלא | `accumulate·number` | `accumulate·sequence` |
| 15 | `toys.json` | עפיפון | משחררים חוט | `accumulate·number` | `accumulate·sequence` |
| 16 | `food.json` | פופקורן | מתחממים | `accumulate·number` | `accumulate·sequence` |
| 17 | `nature.json` | פטרייה | מעגל פטריות שהולך ומתרחב | `accumulate·number` | `accumulate·sequence` |
| 18 | `nature.json` | קקטוס | שומר מים כשיש | `accumulate·number` | `accumulate·sequence` |
| 19 | `vehicles.json` | רכב-חשמלי | מחזיר אנרגיה בבלימה | `accumulate·number` | `accumulate·sequence` |
| 20 | `weather-space.json` | שלג | מצטבר | `accumulate·number` | `accumulate·sequence` |
| 21 | `toys.json` | כדור-קפיצי | קופץ מהרצפה | `bounce·number` | `bounce·record:body` |
| 22 | `weather-space.json` | כוכב-שביט | מתי נראה מכאן | `filter·date` | `filter·list` |
| 23 | `machines.json` | מקרר | מוצרים שפג תוקפם | `filter·date` | `filter·list` |
| 24 | `workplace.json` | סידור-משמרות | מכבד בקשות חופש | `filter·date` | `filter·list` |
| 25 | `city.json` | שוק | סגור בשבת | `filter·date` | `validate·date` |
| 26 | `machines.json` | שעון-מעורר | רק בימי חול | `filter·date` | `validate·date` |
| 27 | `animals.json` | גחלילית | מתאימה את הקצב לשכנה | `follow·times` | `follow·number` |
| 28 | `weather-space.json` | עונות-השנה | מעבר הדרגתי | `fuzzy·date` | `oscillate·number` |
| 29 | `body-health.json` | עין-ממצמצת | קצת אקראי | `fuzzy·times` | `random·sequence` |
| 30 | `food.json` | פופקורן | כל גרעין מתפוצץ בזמן אחר | `fuzzy·times` | `random·sequence` |
| 31 | `celebrations.json` | יום-הולדת | ברכות מכולם | `merge·text` | `join·list` |
| 32 | `home.json` | אקווריום | תזכורת לנקות כל שבוע | `next·date` | `next·times` |
| 33 | `body-health.json` | חיסון | המנה הבאה | `next·date` | `next·times` |
| 34 | `celebrations.json` | יום-הולדת | חוזר כל שנה | `next·date` | `next·times` |
| 35 | `workplace.json` | ישיבת-צוות | הישיבה הבאה | `next·date` | `next·times` |
| 36 | `weather-space.json` | כוכב-שביט | חוזר כל כמה שנים | `next·date` | `next·times` |
| 37 | `weather-space.json` | ליקוי-חמה | הבא בעוד שנים | `next·date` | `next·times` |
| 38 | `workplace.json` | משכורת | תשלום ב-10 לחודש | `next·date` | `next·times` |
| 39 | `workplace.json` | סידור-משמרות | לוח לשבוע הבא | `next·date` | `next·times` |
| 40 | `nature.json` | קקטוס | פורח פעם בשנה | `next·date` | `next·times` |
| 41 | `workplace.json` | תורנות | תזכורת ביום ראשון | `next·date` | `next·times` |
| 42 | `nature.json` | שלכת | נופלים ברוח | `random·bool` | `random·sequence` |
| 43 | `toys.json` | סביבון | נופל על אות אקראית | `random·choice` | `random·sequence` |
| 44 | `games.json` | כיסאות-מוזיקליים | המוזיקה נעצרת פתאום | `random·times` | `random·sequence` |
| 45 | `toys.json` | קופסת-הפתעה | כל פעם בזמן קצת אחר | `random·times` | `random·sequence` |
| 46 | `weather-space.json` | לוויין | מעביר הודעה הלאה | `relay·text` | `relay·list` |
| 47 | `celebrations.json` | מסיבת-הפתעה | אחד מעדכן את כולם | `relay·text` | `relay·list` |
| 48 | `games.json` | משחק-מאפיה | המנחה מעביר את ההודעות | `relay·text` | `relay·list` |
| 49 | `machines.json` | גלגלי-שיניים | כיוון הפוך בכל מעבר | `reverse·choice` | `convert·number` |
| 50 | `weather-space.json` | עונות-השנה | הפוך בצד השני של העולם | `reverse·choice` | `offset·number` |
| 51 | `animals.json` | נמלה | הולכת אחרי הריח החזק | `tier·list` | `extreme·list` |
| 52 | `vehicles.json` | אמבולנס | מיון קריאות לפי דחיפות | `tier·list` | `sort·list` |
| 53 | `celebrations.json` | הגרלה | פרסים לפי סדר | `tier·list` | `sort·list` |
| 54 | `animals.json` | זאב | סדר דרגות בלהקה | `tier·list` | `sort·list` |
| 55 | `body-health.json` | חדר-מיון | מיון לפי דחיפות | `tier·list` | `sort·list` |
| 56 | `games.json` | חידון | טבלת דירוג | `tier·list` | `sort·list` |
| 57 | `sports.json` | טורניר-נוקאאוט | זריעה: החזקים לא נפגשים מוקדם | `tier·list` | `sort·list` |
| 58 | `city.json` | ספרייה | הכי מושאלים | `tier·list` | `sort·list` |
| 59 | `music.json` | פלייליסט | הכי מושמעים | `tier·list` | `sort·list` |
| 60 | `games.json` | שחמט | דירוג שחקנים | `tier·list` | `sort·list` |
| 61 | `body-health.json` | תור-במרפאה | דחוף עוקף | `tier·list` | `sort·list` |
| 62 | `animals.json` | תרנגול | סדר ניקור בלול | `tier·list` | `sort·list` |
| 63 | `sports.json` | אולימפיאדה | זהב כסף ארד | `tier·list` | `tier·number` |
| 64 | `nature.json` | יער | הגבוהים מסתירים את הנמוכים | `tier·list` | `tier·number` |
| 65 | `sports.json` | ליגה | עולות ויורדות | `tier·list` | `tier·number` |
| 66 | `vehicles.json` | מטוס | מושבים לפי מחלקות | `tier·list` | `tier·number` |
| 67 | `nature.json` | עץ | הענפים הכי גבוהים מקבלים יותר שמש | `tier·list` | `tier·number` |
| 68 | `music.json` | קאנון | קול לפי גובה | `tier·list` | `tier·number` |
| 69 | `sports.json` | קיר-טיפוס | מסלולים לפי קושי | `tier·list` | `tier·number` |
| 70 | `workplace.json` | ראיון-עבודה | ציון לכל מועמד | `tier·list` | `tier·number` |


## 5. משימה 3 — `CAP_CORE`

- **לפני:** `chainsFor` העביר ל-`ringsFor` רק את 60 הליבות הראשונות של כל קבוצה. חלק בודד שמוכח לפועל אבל יושב במקום 61+ לא נבדק בכלל, ושילוב חלש ניצח.
- **אחרי:** טבעת 1 (חלק בודד) עוברת על **כל** החלקים שמוכחים לפועל, בסדר-הדירוג הקיים של האינדקס (דטרמיניסטי). טבעות 2–3 נשארות על 60 הראשונים (המתאמים כבר חסומים ב-`CAP_LINK`). הזמן: הרכבת כל 990 הצרכים — ~11 שניות.
- **ההשפעה (כשהשינוי לבד):** 🔎 158 ⇒ 127 · ✅ פנימי 39 ⇒ 77 · 🧩 18 ⇒ 9. 40 צרכים עלו, 0 ירדו, 4 החליפו חלק.

| צורך | לפני | אחרי |
|---|---|---|
| מגדלור · דפוס הבהוב (מעצב·רצף) | 🧩 3 חלקים: `litObj` ⇒ `contractorCredit.h` ⇒ `pad2` | ✅ `whoLabel` (אורביט) — חלק אחד |
| גאות-ושפל · טבלת שעות (מעצב·רשימה) | 🧩 אותם 3 | ✅ `whoLabel` |
| זיקית / צב / מכונת-כביסה / אלמוג (ממיר·בחירה) | 🧩 `exact.cents` ⇒ `minToHM` | ✅ פנימי `lessonsInTerm.perMonth:step` |
| נדנדה · דוחפים בזמן (בודק·זמנים) | 🧩 `rnd.fn.x` ⇒ `faultBlocksUnit` | ✅ פנימי `markZmanim…past:step` |
| כבאות / תופסת / אמבולנס / מונית / מסוק (קיצוני·מקום) | 🔎 | ✅ פנימי `envLayout…d:step` |
| שוק / מקרר / שעון-מעורר (…) | 🔎 | ✅ פנימי `seedOverduePlannedReminders.overdue` |
| החלפות: צעדים n6, שמש n2 | `BoardTab.pendingNotices` | `CashRegister.dueNum` (מוקדם יותר בדירוג) |
| החלפות: מגדלור n6 · שעון-מעורר | `hasNoBody` · `formatIls` | `mayApproveUsers` · `buildErrorMessage` |

**ביושר:** `litObj` (שהמשימה ציפתה לו) לא נבחר — `whoLabel` של אורביט קודם לו, כי קבוצת "חלק אחד" באה לפני "חלק פנימי" (הכרעת-בעלים). שלושה צרכי "מדרג·רשימה" (זאב, חדר-מיון…) עברו זמנית לחלק `svgScene.walk.start` — התאמה מקרית (הפועל על `startPos`, החומר בקלט אחר); המיפוי של משימה 2 סגר אותם נכון.

## 6. משימה 4 — מיזוג פותח v2

- נחת ב-10:33 (‏4caa66b, ~40 דקות אחרי ההתחלה). מוזג (`3b161e3`), איחוד: המחסן/המניפסט/החבילות של v2 + מיפוי-הסוגים של v3 (`entry.mjs` ⇒ `build.mjs`).
- הקבצים הנוצרים לא מוזגו ביד: `open` (עם השכפולים) ⇒ `prove` ⇒ `lift` ⇒ index ⇒ combos ⇒ lab-data.
- **`ensure-gen`:** `combine.mjs` ו-`build.mjs` (מ-v2) · **`cli.mjs` (נוסף)** · `run-combo.mjs` דרך `combine.mjs` · הבדיקות דרך `globalSetup`.
- **yeshiva** — אין גישה לשכפול בסשן הזה (הריפו פרטי והצירוף נדחה). החבילה וההוכחה של v2 נשמרו כמו שהן; 10 החלקים שלה לא קיבלו את הסוגים החדשים. גם qa-scanner לא צורף (אין לו חלקים פנימיים).

## 7. מה נגעתי ומה לא

- **`src/`:** כלום.
- **`catalog/inner/lib/*`:** כלום (מיפוי-הסוגים המשותף יושב ב-`catalog/lib/`).
- **קוד:** `catalog/lib/kind-shape.mjs` (חדש) · `entry.mjs` · שלושה מפקדים · `combiner/core.mjs` · `combine.mjs` · `cli.mjs` · `shots.mjs` (`--words`) · `verb-recipes.json` (רמז אחד) · `goals/schema.json` (`note`) · `contract.md §3.1` · README.
- **בדיקות:** `kind-shape.test.ts` (חדש, 10) · `combine.test.ts` (צורת `on`, ו"עבר על החומר") · `combiner.test.ts` (`fitPart`/`lawMat`).

## 8. הוכחה

- **כל ה-`--check` ירוקים (15):** core-census · core-b-census · orbit-census · others-census · buildsmart-census · inner open · ensure-gen · lift · catalog-build · goals-coverage · core-demo · combiner prove · combine · build · atoms-factory. גם `open --check` בלי שכפולים.
- **`npx vitest run catalog`:** 334/334. **`npm run verify`:** ירוק (פירוט בהודעת-הסיום).
- **צילומים:** `knowledge/shots/machine-v3-2026-10-14/` — חמנייה (17/17) · דרקון · קרוסלה · עין-ממצמצת · תופסת · **אמבולנס** (מקום) · **פינגווין** (קול) · **קליידוסקופ** (תמונה) · בננה · דף-הליבות; 390×844 ו-1280×800. אפס שגיאות קונסולה, אין "חסר".

## 9. הרצה מחדש

```bash
# שכפולים ב-/home/user/catsrc: buildsmart · generator · rings · 14kk · mmmm · yoman (git init + fetch --depth 1 <sha> + checkout -B <branch>)
export CATALOG_SRC=/home/user/catsrc
node catalog/scripts/orbit-census.mjs && node catalog/scripts/buildsmart-census.mjs --repo $CATALOG_SRC/buildsmart && node catalog/scripts/others-census.mjs --root $CATALOG_SRC
node catalog/inner/scripts/open.mjs && node catalog/inner/scripts/prove.mjs && node catalog/scripts/behavior-probe.mjs --source orbit,buildsmart,mmmm,14kk,yoman-habina
node catalog/inner/scripts/baseline.mjs && node catalog/inner/scripts/lift.mjs
node catalog/scripts/catalog-build.mjs && node catalog/scripts/goals-coverage.mjs && node catalog/scripts/core-demo.mjs
node catalog/combiner/prove.mjs && node catalog/combiner/combine.mjs && node catalog/combiner/build.mjs
node catalog/combiner/shots.mjs --out knowledge/shots/machine-v3-2026-10-14 --words אמבולנס,פינגווין,קליידוסקופ
```
