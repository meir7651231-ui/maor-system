# CLOSED · 🧭 המכונה v4 — ליבות-החומר, נקודות ⇒ רשת, ומילון שאומר את הפועל הנכון (14.10.2026)

ענף `claude/machine-v4-261014` (מ-`claude/machine-v3-261014` @d220238). לא מוזג ל-main.

## 1. לבעלים, בקצרה

- **🔎 64 ⇒ 1.** מוכחים: 853 + 53 + 20 = 926 ⇒ **892 + 57 + 40 = 989** מתוך 990. מילים שכולן ✅: **127 ⇒ 178** מתוך 179.
- **הדרך המהירה (אמבולנס, דואר, משלוחים, משלוחי-מנות, ברק)** = רשת-הסינפסות של כדור-המוח בדף ההרשמה (כל נקודה מתחברת לקרובות אליה) + מוצא-הדרך (דייקסטרה, כמו בבנייה-חכמה). עבר 24/24 חוקים של «מוצא דרך קצרה» — על הנקודות עצמן.
- **האש מתפשטת, זרעים מתפזרים** = אותה רשת + הגל של «מתפשט», 30/30.
- **ציפור הולכת אחרי השכנה, כדור-פורח עם הרוח, טלסקופ שעוקב** = הכדור בדף ההרשמה שנגרר אחרי העכבר (`tg.x += (mo.x - tg.x)*0.05`, וכך גם y).
- **טיפות/חרוזים במקום אקראי** = אבק-הזהב של פרנס׳לע (`x: Math.random()*w, y: Math.random()*h`), עם זרע.
- **קול:** "פעמונים — קול לפי גודל" = צליל-המטבע של פרנס׳לע (`tone(f * j, …)`) — אותו צליל, בגובה אחר. "קריאות המוכרים בשוק" = התורות של «מה צריך?» (`turnOf`) רצות על צלילים. "הכוונן שומע" = הדוגם, רץ על צלילים.
- **תמונה:** "הזיקית לפי הרקע / פעמון-הדלת / תמונה כל שבוע" = הדוגם, רץ על תמונות; "קליידוסקופ מסתובב" = התורות, על תמונות.
- **נשאר אחד: "כוונן — מחט על המסך"** (מעצב·ui). ציור על המסך הוא רכיב-מסך, ורכיבי-מסך לא נכנסים לאינדקס — בכוונה.
- **אף צורך לא ירד** (נבדק צורך-צורך מול הבסיס: 63 עלו, 0 ירדו, 0 החליפו חלק).

## 2. לפני ⇒ אחרי

| שלב | ✅ חלק | ✅ פנימי | 🧩 שילוב | 🔎 | מילים מלאות |
|---|---:|---:|---:|---:|---:|
| **לפני** (machine-v3 @d220238) | 853 | 53 | 20 | **64** | 127 |
| + 9 ליבות-החומר + `connect` + חוקים על נקודות + `on` גנרי | 866 | 53 | 32 | 39 | — |
| + `sources` עובר ברשת (spread·geo) | 866 | 53 | 33 | 38 | — |
| + 32 מיפויים מחדש (עם `note`) + מתכון-החמנייה מעודכן | **892** | **57** | **40** | **1** | **178** |

### לפי משפחה (החומר המקורי של הצורך)

| משפחה | צרכים | 🔎 לפני | 🔎 אחרי | נסגרו כ- |
|---|---:|---:|---:|---|
| מקום (geo) | 71 | 28 | **0** | חלק 13 · שילוב 12 · מיפוי ⇒ חלק 2, פנימי 1 |
| קול (sound) | 20 | 16 | **0** | שילוב 2 · מיפוי ⇒ חלק 13, שילוב 1 |
| תמונה (image) | 11 | 9 | **0** | שילוב 3 · מיפוי ⇒ חלק 4, שילוב 2 |
| תור (waiting) | 15 | 5 | **0** | מיפוי ⇒ פנימי 3, חלק 2 |
| שאר החומרים | 873 | 6 | **1** | מתכון 1 · מיפוי ⇒ חלק 4 · נשאר: מעצב·ui |

## 3. מה חולץ (9 ליבות-החומר · `catalog/core` · מקור `core-c`)

כל ליבה: JS טהור, דטרמיניסטי, בלי עולם; `origins` אמיתיים (`catalog/core/origins-c.json` · נבדק ב-`origins-cite.test`); מוכחת בהרצה n/n לפועל שלה, והוא הפועל הראשי שלה (`behavior/core-c.json`). המפקד: `catalog/scripts/core-c-census.mjs` (`--check`), הדוגמה של כל ליבה מורצת בכל מפקד.

| ליבה | פועל | הוכחה | נמצא ב (best ⭐ ראשון) |
|---|---|---:|---|
| `nearNet` (near-net.mjs) | **connect** (חדש) | 48/48 | ⭐ אורביט `src/lib/three-scene.ts:114` (רשת-הסינפסות: 3 הקרובים לפי `distanceToSquared`) · `:127` (`seen` עם `min_max`) · בנייה-חכמה `hop_graph.dart:155` (קודם קשתות, אחר-כך BFS) · `install_engine.dart:759` (דייקסטרה — הצרכן) |
| `followPoint` | follow | 36/36 | ⭐ `three-scene.ts:257` (`tg.x += (mo.x - tg.x) * 0.05; tg.y += …`) · המחולל `design/orbit-final.html:599` (אותו צעד לכל רכיב) · `design/orbit-message.html:211` |
| `randomPoints` | random | 41/41 | ⭐ `src/components/parnasa/Ambient.tsx:63` (`x: Math.random() * w, y: Math.random() * h`) · `Ambient.tsx:100` · המחולל `machtzev/pure/motion-family.html:150` (`{x:Math.random(),y:Math.random()}`) |
| `pointsWithin` | filter | 24/24 | ⭐ `src/components/supporters/SupportersGalaxy.tsx:125` (`Math.hypot(p.x - mx, p.y - my)`) · `SupportersUniverse3D.tsx:111` · המחולל `knowledge/assets/screens/sde-hakoach.html:171` (`<26`) |
| `groupBySide` | group | 21/21 | ⭐ `three-scene.ts:121` (`Math.sign(nodes[j].x) !== Math.sign(a.x)` — שתי האונות) · `three-scene.ts:74` (הסדק) |
| `dedupePoints` | dedupe | 43/43 | ⭐ `three-scene.ts:128` (`seen.has(key)`) · `src/components/parnasa/envelope.ts:170` · בנייה-חכמה `functions/src/push.ts:51` |
| `byDistance` | sort | 32/32 | ⭐ `three-scene.ts:122` (`cand.push([a.distanceToSquared(nodes[j]), j]); cand.sort(…)`) · `envelope.ts:187` |
| `drift` | offset | 24/24 | ⭐ `Ambient.tsx:86` (`p.x += p.vx * dt; p.y += p.vy * dt`) · המחולל `design/capabilities-showcase.html:290` · `bannerFx.ts:474` |
| `transposeNotes` | map | 24/24 | ⭐ `src/components/parnasa/sound.ts:89` (`tone(f * j, t, d, g)`) · `sound.ts:84` (הצליל כנתון) · המחולל `design/orbit-supernova.html:191` (55/82.4 — קווינטה) |

**built-new: אפס.** שלושה דברים שהוסרו בחילוץ (במפורש, בקוד): אובייקטי THREE והאילוץ "באותה אונה" ב-`nearNet`; `Math.random` (במקומו ליבת «מגריל» עם זרע) ב-`randomPoints`; WebAudio ב-`transposeNotes` (הצליל = רשימת `{f, t, d, g}` — בדיוק הארגומנטים של `tone()`).

**שתי ליבות בונות על ליבה קיימת** (כמו `bounce` על `decay`): `followPoint` קורא ל-`follow` פעם לכל ציר (המקור עושה בדיוק את זה), `randomPoints` לוקח זוגות מ-`random`.

## 4. החוקים (`catalog/lib/verbs-motion.mjs` · `verbs-net.mjs`)

- **פועל חדש: `connect` · «מחבר לשכנים»** (הפועל ה-62, `bind: 'x>x'`). 4 חוקים + מוטנט לכל אחד: `connect.keeps` (הנקודות נשארות — מוטנט: מאבד נקודה) · `connect.real` (כל קשת אמיתית, פעם אחת, מחיר = מרחק — מוטנט: מרחק בריבוע) · `connect.nearest` (אף נקודה קרובה מהשכנה ה-near לא בחוץ — מוטנט: מחבר לרחוקה) · `connect.only` (רק שכנות — מוטנט: כל-עם-כל). רמזי-השם צרים בכוונה (`knn`, `synapse`): בסבב הראשון `link`/`connect` הדביקו את הפועל ל-3 חלקים סטטיים — תוקן לפני הכול.
- **אותם חוקים, גם על נקודות** (לא חוק חדש — הרחבה): 
  - `shortest-path` ו-`spread`: הרשת שההגדרה מתארת = `edges`, או — נקודות + `near` ⇒ הרשת שליבת `connect` בונה (`netEdges`). כך "הדרך הזולה" נבדקת ברשת שהנקודות האלה יוצרות.
  - `follow`: מספר **או** נקודה, בחשבון של וקטורים (מספר = וקטור באורך 1): לא עובר את המטרה (מכפלה-פנימית), לא מתרחק, במטרה נשאר, ואותו חלק-מהדרך מכל מקום — **ובקו ישר** אל המטרה.
  - `random`: רצף מספרים **או** נקודות — כל קואורדינטה ב-[0,1), ובדיקת-הפיזור על כל הקואורדינטות.
- **לכל אחד מהארבעה `refGeo` + `mutantsGeo`** — מימוש-נקודות שעובר, ומוטנט-נקודות לכל חוק שנתפס (`verbs.test`: 243/243).
- **הקורא הורץ מחדש על הכול** (כל המקורות + 17,360 החלקים הפנימיים): **אף תווית קיימת לא השתנתה** — רק `core.json` (ref) ו-`core-c.json` חדש.

## 5. המכונה (`combine.mjs` · `core.mjs`)

| שינוי | למה |
|---|---|
| **`on` לחלק גנרי שמחזיר פריט מהקלט** (`genericReturn`: `turnOf<T>(list: readonly T[], n): T \| null`) | `turnOf` מוכח «מחלק בתורות» אבל הסוג של הפלט היה `unknown` ולכן לא נוסה. על נקודות הוא נותן נקודה, על צלילים — צליל. 36/36 על מקום/קול/תמונה |
| **הקריאות של `sample` = `T[]`** (במפקד-הליבה) | הקוד (`xs[i]`) לא נוגע בקריאה; המקורות שלו הם פיקסלים ופריימים. 14/14 על תמונות ועל צלילים |
| **רמזים**: `nearNet ⇒ shortestPath`, `nearNet ⇒ spread` (`verb-recipes.json`) | השרשרת "נקודות ⇒ רשת ⇒ דרך/גל"; החוקים עברו על הקלט הראשון (`spec` = הנקודות) |
| **ליבת-חומר עונה רק לחומר שלה** (`coreMaterial`/`shapeOnly`) | **באג שנתפס בדרך:** בסבב הראשון `dedupePoints`/`groupBySide` "ניצחו" 25 צרכי רשימה כללית ("ספר טלפונים: כפולים") — כי "מוכח לפועל" התאים לכל רשימה. ננעל ב-`machine-v4.test` |
| **במקום/קול/תמונה — חלק שהפועל הוא הראשי שלו קודם** (מפתח-דירוג אחרי עוצמת-ההוכחה) | "תופסת: בית = מקום מוגן" בחרה במסיר-הכפולים (שגם מקיים «מסנן»). כללי — הזיז 40 צרכים אחרים, ולכן צומצם לשלושת חומרי-הצורה (0 הזזות) |
| `nearNet` מעביר שדות נוספים (`sources?` בטיפוס) | בלי זה "מתפשט·מקום" נכשל: הגל לא ידע מאיפה מתחיל |

## 6. המילון — 32 מיפויים מחדש (כל אחד עם `note`: "MACHINE-V4: היה X·Y. …")

הטקסט, ה-`detail` וה-`keys` לא השתנו. הכלל: מיפיתי מחדש **רק** כשהחוקים של הפועל הישן בודקים משהו אחר ממה שהטקסט אומר — ובכל note כתוב מה נבדק ולמה לא עבר.

| מילה · התנהגות | לפני | אחרי | הסיבה בקצרה |
|---|---|---|---|
| טניס · הכדור חוזר מהרשת | bounce·geo | bounce·record:body | קפיצה = גוף {מקום, מהירות} לאורך קו; אין קפיצה דו-ממדית באף פרויקט |
| טלסקופ · תמונה כל לילה | bucket·image | bucket·times | צילום-יומי = מפתח-לילה לכל רגע |
| עציץ · תמונה כל שבוע | bucket·image | sample·image | פריים אחד מכל k |
| לוויין · צילום כל סיבוב | bucket·image | sample·image | פריים אחד מכל k |
| מסוק · מרחף במקום | clamp·geo | follow·geo | נמשך בחזרה לנקודה; «מגביל» בודק מספר |
| משחק-זיכרון · הופכים שניים | compare·image | validate·record:cards | "זוג?" = כן/לא; לתמונות אין סדר |
| תזמורת · כוונון לפי צליל אחד | compare·sound | gap·number | כמה רחוק התדר מהייחוס |
| פסנתר · קליד ⇒ צליל | convert·sound | convert·number | «ממיר» = ערך-בודד ⇒ ערך-בודד; לא מקבל רשימת צלילים |
| פעמוני-כנסייה · קול לפי גודל | convert·sound | map·sound | אותו צליל, כל תו בגובה אחר — `transposeNotes` |
| מזרקה · רוקדת לפי המוזיקה | convert·sound | convert·number | עוצמה ⇒ גובה מים |
| פסנתר · הצליל דועך | decay·sound | decay·number | מה שדועך הוא העוצמה (`sound.ts:51`) |
| קליידוסקופ · אף פעם לא אותו דבר | dedupe·image | random·sequence | הגרלה חדשה כל סיבוב |
| דולפין · שולח צליל ומקשיב להד | echo·sound | echo·number | «מודד בהד» לוקח זמן ונותן מרחק. **נבדק** גם "עותקים מאוחרים ודועכים" — לא עובר את חוקי-ההד |
| צוללת · מקשיבה לקולות מסביב | echo·sound | sample·sound | האזנה = קריאות קבועות, לא מדידת-מרחק |
| שעון-מעורר · הצלצול מתגבר | escalate·sound | escalate·times | השלב עולה עם הזמן |
| שלג · כל פתית שונה | fuzzy·image | random·sequence | הגרלה לכל פתית; «מוצא עם טעות» = חיפוש מילה |
| פלייליסט · מעבר רך בין שירים | merge·sound | decay·number | העוצמה של היוצא דועכת |
| דיג׳יי · מחבר שיר לשיר | merge·sound | merge·sequence | משבצות "מתנגן" צמודות ⇒ סט אחד |
| זאב · מייללים יחד | merge·sound | merge·sequence | יללות חופפות ⇒ יללה אחת |
| קאנון · אותו שיר לכולם | merge·sound | relay·list | השיר עובר לכל קול פעם אחת |
| גחלילית · כולן יחד בסוף | merge·times | follow·number | כל אחת מקרבת את הקצב לשכנה |
| מסיבת-הפתעה · אורות נדלקים ביחד | merge·times | relay·list | אות אחד מהמרכז לכולם |
| קיר-טיפוס · האחיזה הבאה בהישג יד | next·geo | extreme·geo | הקרובה ביותר; «הבא» בודק רגעים |
| רמזור · ירוק בתורו | next·waiting | next·times | המשבצת הבאה במחזור |
| ספרייה · תור לספר מבוקש | next·waiting | lookup·waiting | הראשון שעוד מחכה |
| קופה-רושמת · תור לקופה הפנויה | next·waiting | lookup·waiting | הראשון שעוד מחכה |
| דיג׳יי · בקשות מהקהל | next·waiting | lookup·waiting | הבקשה הראשונה שממתינה |
| תזמורת · תווים לכל נגן | personalize·file | personalize·text | טקסט מהרשומה; "קובץ" = איך שומרים |
| תזמורת · המנצח מאחד | relay·sound | relay·list | המנצח = המרכז; הקול הוא התוכן |
| וילון · ידני גובר על אוטומטי | require-source·choice | lookup·list | הראשון שקיים, לפי הסדר ידני ⇒ אוטומטי |
| זרע · מחכה לחום ולמים | require-source·waiting | validate·record:seed | שער כן/לא (במילון הישן: gate ⇒ validate) |
| תחנת-אוטובוס · הודעה בקול | route·sound | route·choice | הרמקול הוא הערוץ |

**ועוד:** `catalog/goals/schema.json` מכיר את `connect`. **מתכון החמנייה** (`catalog/recipes/sunflower.json`) נשמר מחדש מההרכבה של היום (16 ✅ + 1 🧩) — הישן הצביע על 5 חלקים שהיו "ניתנים להרצה" בלבד, ולכן "שדה חמניות · כל פרח הוא חמנייה מהמדף" (מתכון·רשומה) היה 🔎. עכשיו ✅.

## 7. ה-🔎 היחיד שנשאר

| צורך | למה |
|---|---|
| כוונן · מחט על המסך (מעצב·ui) | מחט שמצוירת על המסך היא רכיב-מסך (`ui`). רכיבים לא נכנסים לאינדקס — בכוונה (`buildIndex`: `what === 'component' \|\| gives.kind === 'ui'`). «מעצב לטקסט» כותב ערך כטקסט — מחט אינה טקסט. לא מיפיתי מחדש, כי ההנחיה הייתה לומר זאת כמו שזה |

## 8. ביושר

- **"הד = עותקים מאוחרים ודועכים של הצליל"** (הרעיון במשימה): הצליל כנתון קיים עכשיו (`{f, t, d, g}`), אבל הפועל «מודד בהד» מודד **מרחק** מזמן-חזרה; עותקים מושהים לא עוברים את `echo.zero/linear/there-back`. לכן הדולפין עבר ל-echo·number, והצוללת (שרק מקשיבה) ל-sample·sound.
- **«ממיר ערך» לא מקבל צליל** (`fit: isScalar(e.x)`); `transposeNotes` נמצא בהרצה «ממיר כל פריט» (map) — ולכן הוא מוצג כך, ולא סומן «ממיר» בכוח.
- **`groupBySide`** מכליל את מבחן-הסימן של שתי האונות (x בלבד, סביב 0) לשני הצירים ולמרכז נתון — אותו מבחן, פעם לכל ציר.
- **כיסוי המילון:** "לפי פועל וחומר" 722 ⇒ **761**. המספר ההיסטורי "לפני" (45 פעלים) זז 760 ⇒ 753 כי מיפויים העבירו התנהגויות לפעלי-התנועה (שבעולם ה"לפני" היו `NEW`) — זה מדד-עבר, לא ירידה.
- **שקילות-התנהגות:** אף צורך לא ירד ואף צורך שלא נגעתי בו לא החליף חלק (נבדק מול צילום-בסיס של 990 הצרכים).

## 9. מה נגעתי ומה לא

- **`src/`:** כלום.
- **חדש:** `catalog/core/{near-net,follow-point,random-points,points-within,group-by-side,dedupe-points,by-distance,drift,transpose-notes}.mjs` · `catalog/core/origins-c.json` · `catalog/lib/verbs-net.mjs` · `catalog/scripts/core-c-census.mjs` · `catalog/sources/core-c.json` · `catalog/behavior/core-c.json` · `catalog/__tests__/machine-v4.test.ts`.
- **שונה:** `verbs-motion.mjs` (רשת/וקטורים/קואורדינטות + refGeo/mutantsGeo) · `verbs.mjs` (NET_VERBS, PRIMARY_ORDER) · `combine.mjs` (`genericReturn`) · `core.mjs` (core-c, `coreMaterial`, מפתח-דירוג) · `build-index.mjs` / `behavior-probe.mjs` (core-c) · `core-census.mjs` (sample `T[]`) · `core/sample.mjs` (הערה) · `verb-recipes.json` (2 רמזים) · `goals/*.json` (32) · `goals/schema.json` · `recipes/sunflower.json` · בדיקות: `verbs.test` (נקודות), `catalog-all.test` (core-c), `origins-cite.test` (origins-c).
- **נוצר מחדש בסקריפטים:** behavior (כל המקורות) · inner prove · baseline · lift · index/verbs/alphabet · coverage · demo · proofs · combos + recipes/combo-* · lab-data + dig.

## 10. הוכחה

- **כל ה-`--check` ירוקים (16):** core-census · core-b-census · **core-c-census** · orbit-census · others-census · buildsmart-census · inner open · ensure-gen · lift · catalog-build · goals-coverage · core-demo · combiner prove · combine · build · atoms-factory (דרך `npm run verify`).
- **`npx vitest run catalog`** ו-**`npm run verify`** — ירוקים (מספרים בהודעת-הסיום).
- **צילומים:** `knowledge/shots/machine-v4-2026-10-14/` — חמנייה (17/17) · דרקון · קרוסלה · **אמבולנס** (הדרך המהירה, 🔎 0) · **משלוחים** (מקום) · **פעמוני-כנסייה** (קול) · **זיקית** (תמונה) · בננה · דף-הליבות; 390×844 ו-1280×800. אפס שגיאות קונסולה, אין "חסר".

## 11. הרצה מחדש

```bash
# שכפולים ב-/home/user/catsrc (ref של כל מפקד): buildsmart · generator · rings · 14kk · mmmm · yoman · yeshiva
export CATALOG_SRC=/home/user/catsrc
node catalog/scripts/core-census.mjs && node catalog/scripts/core-c-census.mjs
node catalog/scripts/behavior-probe.mjs && node catalog/inner/scripts/prove.mjs
node catalog/inner/scripts/baseline.mjs && node catalog/inner/scripts/lift.mjs
node catalog/scripts/catalog-build.mjs && node catalog/scripts/goals-coverage.mjs && node catalog/scripts/core-demo.mjs
node catalog/combiner/prove.mjs && node catalog/combiner/combine.mjs && node catalog/combiner/build.mjs
node catalog/combiner/shots.mjs --out knowledge/shots/machine-v4-2026-10-14 --words אמבולנס,משלוחים,פעמוני-כנסייה,זיקית
```
