# CLOSED · 🔓 פותח-הפונקציות — החלקים הפנימיים (14.10.2026)

ענף `claude/inner-parts-261014` (נבנה על `claude/catalog-261014` + מוזג `origin/claude/goals-261014` לקריאה בלבד). לא מוזג ל-main.

## 1. לבעלים, בקצרה

- **"לא חסר כלום" — הוכח על הקוד.** בתוך הפונקציות שבנינו מסתתרים **34,530 ערכים-בדרך**. הפותח חתך **11,113** מהם לחלקים שעומדים בפני עצמם — **14,168 חלקים פנימיים** (עם צורת-ה"נוסחה" שלהם), ב-7 ריפואים.
- **11,783 מהם הורצו בארגז-חול**, ו-**3,575 מקיימים לפחות פעולה אחת מהאלפבית** (n/n). עוד **214** מקיימים תכונת-תנועה שנמדדה בהרצה: דועך · סופר לאחור · צובר · מתנדנד · מקיף.
- **ההרמה:** מתוך 940 ההתנהגויות של מילון-המטרות, **198 מקבלות חלק מוכח רק בזכות החלקים הפנימיים** (24 זוגות פועל+חומר חדשים). לפני: 294 מכוסות. אחרי: 492.
- **כיוון השמש** נמצא בתוך חישוב הזריחה של אורביט, וזז מזרח ⇒ דרום ⇒ מערב (§4).

## 2. מה נבנה

`catalog/inner/` — הרמה הבאה של המפרק (`scripts/atoms-decompose.mjs` קורא חתימות של פונקציות שלמות; הפותח נכנס *לתוכן*):

| שלב | איפה | מה |
|---|---|---|
| הליכה | `lib/opener.mjs` | המהדר של TypeScript (גם על JS). כל `const`/`let` עם ביטוי, **בכל עומק** — גם בתוך `useEffect`, `requestAnimationFrame`, `map`/`reduce`, מתודות-מחלקה. ועוד שני סוגים: **מצטבר-אחרי-לולאה** (`let best` שמתעדכן רק בלולאה אחת שאחריו) ו**מעטפת-זמן** של `AudioParam` |
| טוהר | `lib/purity.mjs` | לפי הסמלים של המהדר, לא לפי שמות: מתודה טהורה לפי טיפוס-המקבל (מחרוזת/רשימה/מספר/תאריך/Map), עוזר מאותו קובץ — רק אם הוא עצמו טהור וסגור |
| חיתוך-אחורה | `lib/opener.mjs` | הקלטים = המשתנים החופשיים. ההצהרות שהערך תלוי בהן (טרנזיטיבית) + עוזרים + קבועים מאותו קובץ. **תלות לא-טהורה נחתכת לקלט** (הזרקה): `useState`, `ref.current`, `Date.now()` |
| שתי צורות | | `slice` — הקלטים של הפונקציה העוטפת (`decl(y, m, d)`); `step` — הנוסחה עצמה (`decl(lambda, eps)`) |
| מודולים | `gen/<source>/<path>.mjs` | 1,133 מודולים, אחד לקובץ-מקור, דטרמיניסטיים, עם `SIGS` (צורת-הקלטים מטיפוסי-המקור, ל-JS — גם מ-JSDoc וגם "משמש בחשבון ⇒ מספר") |
| רישום | `catalog/sources/inner-<repo>.json` | Part עם `what: "inner"`, `parent`, `origins: [{repo, file, line, what}]`, `pure: true`, שם עברי בלי-עולם מצורת-החישוב |
| הוכחה | `scripts/prove.mjs` ⇒ `catalog/behavior/inner-<repo>.json` | **אותו** `probePart` ואותו ארגז-חול של הקטלוג, אותו זרע. השם לא משתתף |
| תנועה | `lib/motion.mjs` | חוקים משלה (לא נוגעים ב-`verbs.json`), בשדה `motion` נפרד |

החוזה: `schema.json` קיבל `inner` ב-`what` ושני שדות אופציונליים (`parent`, `origins`); `contract.md` מתעד. האינדקס (`catalog-build.mjs`) קורא את `inner-*` כמו כל מקור, ולכן `--check` עובר.

## 3. ארבעת המקומות (מאומתים בבדיקה, מהמנגנון הכללי — בלי מקרה-מיוחד)

| מקום | החלק | קלטים | מה נמדד בהרצה |
|---|---|---|---|
| `telephony/lib/zmanim.mjs:72` | `solarEventUTCmin.decl` — "מחשב זווית מיחס" | `y, m, d` | 21.6 ⇒ ‎+23.44°, ‏21.12 ⇒ ‎−23.43° · מתנדנד לאורך השנה (`oscillate` על `d`, 6/6) |
| `:74` | `solarEventUTCmin.eqTime` | `y, m, d` | 14.10 ⇒ ‎+13.9 דקות |
| `:85` | `solarEventUTCmin.HA` | `y, m, d, lat` | זווית-השעה של הזריחה (86° בירושלים, 14.10) · מתנדנד על השנה |
| `SupportersGalaxy.tsx:95` | `…frame.pulse` — "מחשב גל שעולה ויורד" | `t` | בין 0.94 ל-1.06 · `oscillate` 6/6 |
| `:101–105` | `…frame.rot` · `x` · `y` — "מחשב נקודה על מעגל" | `reduce, t, cx/cy, maxR, n` | x ו-y נמדדו כ**זוג שמקיף** (`orbit`, ‏(x,y) על אליפסה בכל נקודה, 6/6, בתצורה `reduce=false`) |
| `:125` | `…frame.d` — "מודד מרחק בין שתי נקודות" (`Math.hypot`) · `…frame.best:after-loop` — "בוחר את הפריט עם הערך הקטן ביותר" | `pos, mx, my` | מחזיר את הנקודה הקרובה בתוך הרדיוס, ו-`null` כשאין |
| `MoneyTimer.tsx:117` | `MoneyTimer.shownSec:step` | `mode, elapsedSec, timerTargetSec` | 0/30/60/90 ⇒ 60/30/0/0 · `countdown` על `elapsedSec` (בתצורה `mode="timer"`) |
| `:119` | `MoneyTimer.amount:step` | `elapsedSec, rateNum` | `accumulate` על `elapsedSec` (הקצב תלוי ב-`rateNum`) |
| `parnasa/sound.ts` | `tone.gain:envelope` — "מחשב ערך שדועך לשקט לאורך זמן" | `t, d, g, since` | 0 ⇒ g ב-4ms ⇒ ‏0.0001 ב-`d` · `decay` 6/6 · ו-`tone.frequency:envelope` (175 ⇒ 70, התנאי `if (fEnd)` עבר לפונקציה) |

**שני תיקוני-מנגנון שהמקומות האלה דרשו (כלליים):**
- **מעטפת-זמן.** ב-`tone()` אין ערך בשם — העקומה מתוארת בקריאות `setValueAtTime` / `linearRampToValueAtTime` / `exponentialRampToValueAtTime`. הפותח מזהה *כל* רצף קריאות-אוטומציה על אותו `AudioParam` בגוף-פונקציה (גם בתוך `if` פשוט) והופך אותו לפונקציה טהורה של הזמן, לפי המפרט של Web Audio (`__audioParamAt`, מוטבע פעם אחת במודול).
- **מצטבר-אחרי-לולאה.** "הנקודה הקרובה" בגלקסיה היא `let best = null, bd = 16` + `for (const p of pos) { … if (d < bd + p.r) { bd = d; best = p; } }`. משתנה שכל הכתיבות אליו בתוך לולאה אחת שאחריו (באותו בלוק) נחתך יחד עם הלולאה; לולאה עם `return` / שינוי-מבחוץ / קריאה לא-טהורה — לא.

## 4. הדגמה — כיוון השמש בירושלים, 14.10.2026

`node catalog/inner/scripts/sun-demo.mjs` — מורכב רק מ-`eqTime` + `decl` + `utc:step` שהורמו (עם HA=0 ‏`utc:step` נותן את חצות-היום; זווית-השעה = (רגע − חצות-היום)/4), ושורה גאומטרית אחת לאזימוט:

```
08:00 · זווית-שעה -66.3° · אזימוט 110° ⇒ מזרח
12:00 · זווית-שעה -6.3° · אזימוט 170° ⇒ דרום
16:00 · זווית-שעה +53.7° · אזימוט 242° ⇒ מערב
```

## 5. במספרים, לפי ריפו

| ריפו | קבצים | ערכים-בדרך | נחתכו | חלקים (slice+step) | הורצו | עם פועל n/n | עם תנועה | הפעלים הנפוצים |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| orbit | 503 | 16,613 | 4,785 | 5,970 | 5,655 | 1,916 | 177 | convert 517 · format 298 · normalize 276 · validate 184 · personalize 142 · tier 135 |
| generator | 1,626 | 14,202 | 5,498 | 7,248 | 5,395 | 1,438 | 29 | format 549 · normalize 328 · join 326 · fuzzy 311 · convert 289 · round 256 |
| 14kk | 113 | 1,797 | 346 | 377 | 278 | 69 | 5 | split 60 · convert 26 · format 25 · normalize 16 · filter 13 |
| mmmm | 201 | 1,037 | 254 | 294 | 222 | 67 | 0 | format 40 · split 35 · normalize 31 · convert 11 |
| buildsmart | 85 | 746 | 212 | 260 | 215 | 76 | 3 | format 19 · validate 15 · normalize 12 · fuzzy 11 · round 9 |
| yoman-habina | 4 | 121 | 8 | 9 | 8 | 5 | 0 | format 3 |
| yeshiva | 2 | 14 | 10 | 10 | 10 | 4 | 0 | format 2 · round 2 |
| **סה"כ** | 2,534 | **34,530** | **11,113** | **14,168** | **11,783** | **3,575** | **214** | |

"ערכים-בדרך" = כל המועמדים (כולל טריוויאליים). "נחתכו" = ערכים שיצא להם חלק בצורת slice (ה-step נוסף כשהוא שונה). רוב החלקים (11,268 מתוך 14,168) נמצאים ברכיבים ובפונקציות שהקטלוג לא מנה (`parent:uncataloged`) — שם הסתתרו רוב החישובים (הגלקסיה, שעון-הכסף והצליל כולם כאלה).

**היסטוגרמת-פעלים (כל הריפואים, לא-מוסקים):** format 936 · convert 849 · normalize 665 · join 377 · round 368 · fuzzy 333 · validate 328 · filter 311 · tier 269 · split 221 · personalize 184 · clamp 173 · map 165 · combine 154 · count 150 · settle 103 · extreme 87 · ratio 85 · gap 74 · escalate 71 · sum 71 · offset 64 · lookup 62 · bucket 61 · provide 50 · freeze 45 · sort 29 · merge 29 · divide 28 · route 25 · compare 19 · assign-role 15 · tally 14 · transcript 12 · average 11 · relay 10 · reverse 9 · group 9 · dedupe 8 · fingerprint 7 · next 4 · require-source 3 · rotate 1 · tolerate 1.

**תנועה:** accumulate 136 · decay 85 · oscillate 61 · orbit 34 · countdown 15.

**למה דולגו (כל הריפואים):** trivial 8,507 · imported-call 8,434 · method-call 993 · unknown-call 952 · await 848 · closure-helper 513 · loop-imported-call 481 · mutation 412 · loop-mutation 294 · dom 245 · clock 215 · module-state 206 · loop-unknown-call 183 · loop-method-call 168 · loop-return 160 · io 106 · this 95 · imported-value 71 · loop-closure-helper 70 · loop-await 65 · **privacy 60** · new 47 · global-call 47 · name-clash 43 · loop-module-state 41 · random 38 · jsx 33 · timer 33 · global 29 · ועוד קטנים (`catalog/inner/open-<repo>.json`).

החסם הגדול הוא **`imported-call`** (8,434): הערך קורא לעוזר מקובץ אחר. לפי ההנחיה רק עוזרים מאותו קובץ נכנסים. מעקב אחרי ייבוא בתוך אותו ריפו הוא ההרחבה הבאה הטבעית (§9).

## 6. ההרמה — מילון-המטרות

`catalog/inner/lift.json` (`scripts/lift.mjs`). התנהגות מכוסה = יש חלק `run` שהפועל שלו מתקיים n/n **והחומר שלו** (סוג הקלט שהפועל נקשר אליו, או החומר הראשי) **שווה בדיוק** לחומר במילון.

| | התנהגויות | זוגות (פועל, חומר) |
|---|---:|---:|
| רק בבסיס | 72 | 7 |
| בשניהם | 222 | 33 |
| **רק בזכות הפנימיים** | **198** | **24** |
| אף אחד | 378 | 119 |
| פועל בלי חוק-הרצה (`sun-position`, `NEW:random`/`gravity`/`move-along-path`/…) | 70 | 19 |

- **הוגנות.** לפעלי-ה-NEW של המילון (decay/countdown/accumulate/oscillate/orbit) אין חוקים באלפבית, ולכן הפותח מביא את צופי-התנועה. הם רצו **גם על כל 1,179 החלקים השלמים שניתנים להרצה** (`motion-baseline.json`), כדי שהבסיס יקבל אותה הזדמנות. לבסיס יצאו 4.
- **מיפוי-הפעלים הזמניים** של המילון לאלפבית גלוי בקובץ (`VERB_MAP`): gate ⇒ validate|compare · minmax ⇒ extreme · rank-tiers ⇒ tier · search ⇒ lookup|fuzzy · round-robin ⇒ rotate · daily-snapshot ⇒ bucket.
- **ביושר:** 85 מתוך ה-198 הם `gate` על `bool`, דרך `validate`. זה הפועל החלש באלפבית (כן/לא דטרמיניסטי), וההשוואות-בדרך (`a > b`, `x && y`) מקיימות אותו בקלות. בלעדיהם נשארות **113** התנהגויות שנוספו.

**20 הדוגמאות הראשונות** (זוג שנוסף · כמה התנהגויות · דוגמה ממילון-המטרות · חלק פנימי אחד שמכסה):

| # | פועל · חומר | כמה | מהמילון | החלק הפנימי (שם · מקום) |
|---:|---|---:|---|---|
| 1 | gate · bool | 85 | זאב: יללה בירח מלא · לב: דופק מהיר מדי ⇒ התראה | בודק כמה תנאים יחד · generator `machtzev/ds-forge.mjs` |
| 2 | NEW:accumulate · number | 19 | נמלה: משאירה שביל ריח · שלג מצטבר | מכפיל ערך ביחס · 14kk `construction_supervisor_protocol.js` (וגם `MoneyTimer.amount`) |
| 3 | NEW:countdown · times | 17 | צעדים: ישבת שעה ⇒ קום · תנור: טיימר אפייה | מגביל לאפס ומעלה · orbit `LockScreen.remainMs` (וגם `MoneyTimer.shownSec`) |
| 4 | group · list | 12 | דולפין: שוחה בלהקה · פינגווין: מתכרבלים | אוסף פריטים לרשימה חדשה · orbit `AssignmentsTab.groups:after-loop` |
| 5 | dedupe · list | 11 | תרופות: לא פעמיים · בר-מצווה: רשימת מוזמנים | בונה רשימה מערכים · buildsmart `push.ts sendToUsers.unique` |
| 6 | NEW:countdown · number | 7 | נשימה: ספירה לנשימה רגועה · מחבואים: סופר עד עשרים | מגביל לטווח · buildsmart `credit.ts onCall.balance` |
| 7 | divide · list | 7 | חתונה: הושבה לשולחנות · שוק: דוכנים בשורות | אוסף פריטים לרשימה חדשה · generator `genesis-gen.mjs` |
| 8 | NEW:orbit · geo | 6 | דרקון: עף במעגלים · לוויין: מקיף את הארץ | מחשב גל שעולה ויורד · orbit `coinFx.ts cnConfetti` (וגם `SupportersGalaxy frame.x+y`) |
| 9 | merge · list | 6 | מיץ-סחוט: מערבבת · עוגה: שכבות | אוסף פריטים לרשימה חדשה · orbit `verify/laws.ts clusters` |
| 10 | rank-tiers · choice | 5 | חום-גוף: חום ⇒ דרגות · כבאות: גודל השריפה | מעגל מספר כלפי מטה · orbit `CashRegister.exact.n` |
| 11 | convert · choice | 4 | זיקית: צבע לפי מצב רוח · צב: טמפרטורת החול קובעת | מחבר ערכים · orbit `BoardEdit.tsx shift.to` |
| 12 | compare · amount | 3 | שוק: השווה מחירים · מכונת-ממכר: מחשבת עודף | מכפיל ערכים · 14kk `Assets.js calculateReturn` |
| 13 | compare · times | 3 | שעון-מעורר: מצלצל בשעה שנקבעה · רכבת: מאחרת | מחשב הפרש בין ערכים · orbit `parnasa/home.ts greetingOf` |
| 14 | compare · list | 2 | משלוחי-מנות: מי שלח לי ⇒ לשלוח בחזרה | מחשב הפרש בין ערכים · orbit `JoinModal.hiddenCount` |
| 15 | round · times | 2 | שינה: להתעורר בסוף מחזור · חניון: מעגל לרבע שעה | מחשב ערך שמשתנה בחזקה לאורך זמן · orbit `tone.frequency:envelope` |
| 16 | clamp · amount | 1 | גמד-וענק: מתנה עד סכום | בוחר ערך לפי תנאי · orbit `CashRegister.dueNum` |
| 17 | compare · choice | 1 | גאות-ושפל: חזק יותר בירח מלא | מחשב הפרש בין ערכים · orbit `tierMigration.diff` |
| 18 | escalate · times | 1 | מנעול-קוד: זמן נעילה שגדל | מחשב הפרש בין ערכים · orbit `courses/lib.ts ageOf` |
| 19 | filter · choice | 1 | פלייליסט: לפי מצב רוח | מסנן רשימה לפי תנאי · orbit `BoardEdit.tsx moveTo` |
| 20 | format · list | 1 | גאות-ושפל: טבלת שעות לשבוע | מרכיב טקסט מערכים · generator `purify-engine.mjs` |

(עוד 4 זוגות, והרשימה לפי התנהגות, ב-`lift.json`.)

## 7. Dart — ביושר

אין Dart SDK בסביבה, ולכן חלקי ה-Dart של הקטלוג לא רצים, ושום דבר שבתוכם לא הוכח. `scripts/dart.mjs` ⇒ `dart-candidates.json` מונה **מועמדים סטטיים בלבד (`proven: false`)**: הצהרה מוזחת עם ביטוי-חישוב בכל קובץ Dart שיש לו חלק בקטלוג. יצאו **generator 2,351** (1,841 קבצים) ו-**buildsmart 859** (290 קבצים). לכל אחד נשמרים קובץ, שורה, שם וסוג-פעולה גס (conditional · compare · scale · add · cycle · clamp · round · wave · math). טקסט-הביטוי לא נשמר.

## 8. דטרמיניזם · פרטיות · שערים

- **דטרמיניזם:** אותו קוד ⇒ אותם קבצים. שתי בעיות נמצאו ותוקנו:
  - מפתחות-סמל פנימיים של המהדר (`__@toStringTag@51`) נכנסו לצורות. המספר משתנה בין תוכניות, ולכן הם נזרקים.
  - צורות ענקיות של DOM ו-React נחתכות בעומק עד שהן קטנות מ-6,000 תווים.
- **מה הבדיקה עושה:** בונה את אורביט פעמיים ומשווה לקבצים בריפו. בנוסף היא מוכיחה מחדש את המודולים של ארבעת המקומות, פעמיים, ומשווה לשורות.
- **פרטיות:** ערך שהטקסט שלו, העוזרים שלו או צורת-הקלט שלו מכילים מייל, טלפון, ת״ז או טוקן — לא נכתב (`privacy`, 60).
  - דוגמה: טיפוס-ליטרלי של מייל-בעלים ב-`orderEmail.ts` של BuildSmart.
  - הבדיקה סורקת את כל ה-gen, את המקורות ואת קובצי-ההתנהגות הפנימיים.
  - בקובצי-ההתנהגות אין ערכי-קלט ואין ערכי-פלט.
- **שערים:**
  - `npx vitest run catalog`: 166/166, כולל 13 של `inner.test.ts`.
  - הבדיקות של `inner.test.ts`: 4 המקומות · דטרמיניזם/מעודכן · סיבות-דילוג על קובץ-סינתטי · חוזה · התנהגות · הוכחה-מחדש · lift · חוקי-התנועה נושכים · פרטיות.
  - `npm run verify` ירוק.
  - `catalog/inner/gen/**` ב-`ignorePatterns` של oxlint, כי זה קוד שנוצר.
- **משקל:** `catalog/index.json` גדל מ-1.8MB ל-6.2MB (20,011 שורות; 14,168 מהן `inner`). שום דבר מזה לא נכנס לבנדל של האתר.

## 9. גבולות, ומה הלאה

- **עוזרים רק מאותו קובץ** (לפי ההנחיה). זה הדילוג הגדול ביותר (8,434 `imported-call`). מעקב-ייבוא בתוך הריפו, עם אותה בדיקת-טוהר, יפתח את רוב הנותרים.
- **תנאים עוטפים לא נכנסים לחיתוך** (חוץ מבמעטפת-זמן). ערך שמחושב אחרי `if (cosHA > 1) return null` מורם כפונקציה על כל הקלטים. מחוץ לתחום הוא נותן `NaN`, והקורא סופר את זה כ"לא מתאים" ולא כהצלחה.
- **צופי-התנועה הם תכונות, לא פעלים.** `verbs.json` שייך לסשן אחר. אם הארכיטקט ירצה, decay/countdown/accumulate/oscillate/orbit יכולים לעבור לאלפבית עם החוקים מ-`lib/motion.mjs` ועם מוטנטים. הבדיקות כאן כבר מראות שהחוקים נושכים: רעש לא מתנדנד, `x+5` לא צובר.
- **בסיסי-התנועה חיוביים.** משכים, עוצמות ורדיוסים הם חיוביים בעולם, והחוקים כתובים כך. תצורות-בחירה (כן/לא, אפשרויות) מקובעות ונכתבות בתוצאה (`config`).
- **השמות** נגזרים מצורת-החישוב. הם תיאור, לא הוכחה. "בוחר ערך לפי תנאי" חוזר הרבה.
- **`sun-position`** של המילון נשאר בלי חוק. החלקים קיימים ומוכחים כמתנדנדים, וההדגמה מראה את הכיוון, אבל אין פועל באלפבית שאפשר לספור.

## 10. הרצה מחדש

```bash
# שכפולי-קריאה ב-../catsrc (כמו קורא-ההתנהגות): buildsmart · generator(-ai-chat-server@claude/mavin-260922) · 14kk · mmmm · yoman · yeshiva
node catalog/inner/scripts/open.mjs           # gen + sources/inner-* + open-*.json   (~1 דקה)
node catalog/inner/scripts/prove.mjs          # behavior/inner-*                        (~4 דקות)
node catalog/inner/scripts/baseline.mjs       # motion-baseline.json
node catalog/inner/scripts/lift.mjs           # lift.json
node catalog/inner/scripts/dart.mjs           # dart-candidates.json
node catalog/scripts/catalog-build.mjs        # index.json · alphabet.md
npx vitest run catalog
```

שינוי בקובץ של אורביט ⇒ `open --source orbit` ⇒ `prove --source orbit` ⇒ `lift` ⇒ `catalog-build`, וקומיט. הבדיקה נכשלת אם שכחו.
