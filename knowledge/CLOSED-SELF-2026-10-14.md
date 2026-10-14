# CLOSED · 🪞 SELF — המכונה משפרת את עצמה עם החלקים שלה (14.10.2026)

ענף `claude/self-261014` (מ-`claude/machine-v4-261014` @2c990a6). לא מוזג ל-main. בקשת-הבעלים: **"תנסה שהמכונה ישפר את עצמו עם החלקים שלו"** + "זה איטי".

## 1. לבעלים, בקצרה

- **המכונה בדקה את עצמה ומצאה 4 באגים בקוד שלה — כולם תוקנו**, וכל אחד עם בדיקת-שימור (`catalog/__tests__/self.test.ts`) ומוטנט שהחוק תופס.
- **21 מתוך 25 העוזרים הכפולים שלה הוחלפו בחלקים מוכחים** (4 הנותרים — במפקדים של ריפואים חיצוניים שאי אפשר להריץ כאן בלי השכפולים, ולכן לא נגעתי).
- **מהירות:** בנייה בלי שינוי — **מ-201 שניות ל-3.6**; אחרי שינוי של שורה בקובץ של אורביט — **מ-214 ל-28 שניות** (שינוי-קוד אמיתי: 76); הבדיקות של הקטלוג — **מ-153 ל-68 שניות**. כל הפלטים ביט-זהים.

## 2. המכונה על עצמה (חלק 1)

אותו מפקד (`others-census` › `jsExtract`/`buildParts`), אותו פותח (`buildSource`), אותו קורא (`behavior-probe` / `prove-worker`), אותו ארגז-חול, אותו זרע (`0x0ca7a10`), על `catalog/lib · combiner · inner/lib · scripts · self`.

| | מה | איפה |
|---|---|---|
| מקור `machine` (פורמט-Part, עובר `validateSource`) | **500 חלקים** מ-56 קבצים | `catalog/self/machine.json` · `node catalog/scripts/machine-census.mjs [--check]` |
| קורא-ההתנהגות | run **263** (עם פועל **46**) · static 237 (146 בלי קלט מתאים · 91 מודול שקורא דיסק כשנטען — חוסר-טוהר אמיתי בזמן-טעינה, נאמר) | `catalog/self/behavior-machine.json` |
| הפותח | **1,226** ערכים-בדרך מ-2,828 מועמדים · run 807 (עם פועל **255**) | gen ב-`catalog/inner/gen/machine` (gitignored) |
| תפקידים — רק חוקי הפועל שהתפקיד אומר | **15/15 עומדים, n/n** (לפני התיקונים: 10/14) | `catalog/self/roles.mjs` · דוח: `catalog/self/report.json` |

**הפעלים שהפונקציות של המכונה מקיימות (n/n):** חלקים — מעצב 15 · מעגל 9 · בודק 9 · מגביל 6 · מנרמל 6 · ממיר 5 · **מטביע-חותם 3** · מספק 3 · משווה 2 · מתאים-אישית 2 · מנתב · מפצל · מדרג. פנימיים — מעצב 82 · מעגל 61 · מנרמל 45 · ממיר 35 · מגביל 28 · מפצל 18 · מדרג 13 · … · **סופר-לפי-קבוצה 1 · מחפש 1 · קיצוני 2 · מסנן 3**.

**התפקידים (15):** ממיין ×2 (`byId`, `rankCounts`) · מסיר-כפולים ×2 (`uniq`, איחוד-הבתים של האינדקס) · מטביע-חותם ×4 (`fnvHex`, `fnvHexPoints`, `wordId`, `fnv`) · סופר-לפי-קבוצה (`tally`) · מנרמל ×3 (`normWord`, `resolveVerb`, `conformKind`) · מזיז (`isoPlus`) · מגביל (`kOf`) · סובל-כשל (`attempt` בשימוש של ensure-gen). `hashOf` (sha256) לא כאן: בארגז-החול אין `node:crypto` — נאמר בקוד.

כדי שהקוד של המכונה ייטען בארגז-החול נוסף מצב `cli` אופציונלי (רק ל-`machine`; שאר המקורות ביט-זהים): מסיר בזיכרון את נקודת-הכניסה (`if (process.argv…)`, `await` עליון — `lib/strip-cli.mjs`), `import.meta.url` ⇒ נתיב קבוע, `path` posix בלי I/O, ו-typescript/rolldown חיצוניים.

### 2.1 הבאגים שהמכונה מצאה בעצמה (וכולם תוקנו)

| # | פועל · חוק שנכשל | הבאג | המוטנט שהחוק תופס | התיקון |
|---|---|---|---|---|
| 1 | «מסיר כפולים» · `dedupe.keeps` ("כשאין כפולים — הכול נשאר") | האינדקס של המצרף (`combiner/core.mjs` › `buildIndex`/`dedupeKey`) איחד לפי שם+חתימה בלבד. 8 קבוצות / 38 חלקים שטביעת-ההתנהגות שלהם מוכיחה שהם **שונים** (אותה צורת-קלט, פלטים אחרים) נבלעו לחלק אחד, והפעלים שהוכחו על אחד נרשמו לשני: `enrollStatusMeta`/`planLabelOf`/`needsCare` (שני קבצים באורביט), `noaaUtcMin.M` מול `.m`, `fmtDm`, `getUpdates.offset` של 14kk… | האיחוד הישן (בלי פיצול) | `splitByBehavior` — **הפועל של המכונה עצמה**: טביעת-ההתנהגות (צורה-פלטים). אותה צורה + פלטים שונים ⇒ חלקים נפרדים; בלי טביעה / צורות שונות ⇒ כמו קודם. ב-lab-data: חלק אחד נוסף (`noaaUtcMin.m:step`), 3 שורות-בתים זזו; combos ללא שינוי |
| 2 | «מטביע חותם» · `fingerprint.fixed` ("אותו אורך תמיד") | `behaviorHash` = `fnvHash(…).toString(16)` בלי ריפוד ⇒ 7 או 8 תווים | `toString(16)` בלי `padStart` | `fnvHex` (8 הקס) מחלקי-המכונה. 911 טביעות שמורות רופדו (מיגרציה חד-פעמית ⇒ **שווה בדיוק** להרצה מחדש של אורביט, inner-orbit ו-core — נבדק ב-`cmp`) |
| 3 | «מגביל» · `clamp.formula` | מספר-השכנים של «מחבר לשכנים» (`kOf` בחוקים, `nearNet` בליבה) עשה `Math.abs` לפני החיתוך ⇒ `near = -23` נתן **8** שכנים (התקרה) במקום **1** (הרצפה) | `Math.abs` לפני החיתוך | בלי abs בשני המקומות (ליבה + חוק, אותה נוסחה); core-c ref התעדכן, ההוכחה 48/48 נשארה |
| 4 | דטרמיניזם ("אותו קוד ⇒ אותו קובץ") | `prove.mjs` / `behavior-probe.mjs` / `baseline.mjs` **בלי השכפולים** (`../catsrc`) כתבו מחדש בשקט את המחסנים/קבצי-ההתנהגות של הריפואים החיצוניים — בלי מילון-הקוד של הקובץ המקורי הקלטים אחרים ⇒ התוצאות אחרות (או `no-clone` על הכול). **נתפס כשהמכונה הריצה את עצמה** בסשן בלי שכפולים | `prove --source 14kk` בלי שכפול משנה את `store/behavior-14kk.json` | בלי שכפול / ב-ref אחר — הקובץ נשמר כמו שהוא, ונאמר ("· inner-14kk: אין שכפול … — המחסן נשמר כמו שהוא") |

**נמצא ולא תוקן (ביושר):** `buildTzGrid` (אורביט, `tzedaka/lib.ts`) תמיד מגיע ל-timeout של 20 שניות בחוק «מוצא גם עם טעות» — תוצאה שתלויה בשעון (על מחשב מהיר יותר הייתה יכולה לרוץ). לא שיניתי את הסף; המטמון זוכר את ה-timeout כדי שהרצה חמה לא תחכה שוב.

## 3. המכונה בנויה מהחלקים שלה (חלק 2)

`catalog/self/parts.mjs` — חלקי-המכונה, כל אחד פעם אחת, **מוכח בהרצה לפועל שלו** (תפקידים ב-`roles.mjs`), עם `ORIGINS` (קובץ:שורה לפני ההחלפה). הקוד = הקוד שהיה בהעתקים, מילה במילה ⇒ ביט-זהה (כל ה-`--check` ירוקים).

| חלק | פועל · הוכחה | הוחלף ב- |
|---|---|---|
| `byId` | ממיין 31/31 | `combiner/core.mjs` ×2 · `inner/lib/build.mjs` · `behavior-probe` · `core-census` · `orbit-census` · `core-b-census` · `core-c-census` · `inner/scripts/prove.mjs` (9) |
| `rankCounts` | ממיין 30/30 | `lib/build-index.mjs` (`sortObj`) · `inner/lib/build.mjs` (`sortObj`) · `lib/entry.mjs` (`totals.why`) (3) |
| `fnv1a` | (זרע — מספר; ממיר) | `lib/probe.mjs` (`fnvHash`) · `lib/verbs-sun.mjs` (`hash01`) (2) |
| `fnvHex` | מטביע-חותם 18/18 | `lib/verbs.mjs` (`fnv` — מימוש-הייחוס) · `behaviorHash` (באג 2) (2) |
| `fnvHexPoints` | מטביע-חותם 17/17 | `combiner/core.mjs` (`wordId`) · `core-b-census` + `core-c-census` (`refOf`) (3) |
| `attempt` — **הליבה המוכחת** `catalog/core/tolerate.mjs` | סובל-כשל 36/36 (בשימוש הזה) | `ensure-gen` › `read` · `readPack` (2) |

**21 מתוך 25 העוזרים הכפולים של המכונה הם עכשיו חלקים מוכחים.** 4 לא הוחלפו: `byId` ב-`buildsmart-census` · `generator-census` (`sortById`) · `others-census` · `rings-census` — הפלט שלהם נבדק רק מול שכפולים שאין כאן, ולכן אי אפשר להוכיח ביט-זהות.

ועוד (בלי ספירה): `machine-census` משתמש ב-`hashOf` של ensure-gen ל-ref.

## 4. המכונה מהירה יותר, עם הפעולות שלה (חלק 3)

| פועל של המכונה | איפה |
|---|---|
| **«מטביע חותם»** — `lib/cache.mjs` › `fingerprint` (sha256) + `machineSalt` (טביעת הקוד של המכונה: lib · core · inner/lib · combiner · self/parts · המאמת והחלקים של אורביט שהגשר מביא · גרסאות node/typescript/rolldown) | מפתח לכל מטמון; שינוי בחוק/במחולל/בארגז-החול ⇒ שום תוצאה ישנה לא נשלפת |
| **«מקבץ» + «מחפש לפי מפתח»** — `node_modules/.cache/catalog-<מרחב>/<2>/<מפתח>.json` (מחוץ לריפו; `CATALOG_CACHE=off` מכבה; כתיבה אטומית) | קורא: מטמון **לכל חלק** לפי טביעת כל הקבצים שנארזו (`probe-deps` ⇒ `probe-part`), כולל timeout · מוכיח-פנימיים: לכל מודול-gen · פותח: כל הבנייה לפי כל קובצי-המקור + מטמון-transpile לכל צומת · `combineAll`/`buildAll`: לפי כל הקלטים · `rebuild.mjs`: לכל שלב |
| **«מחפש לפי מפתח» בזיכרון** | הפותח: צורת-הטיפוס (`descOf`/`typeText`) לפי הטיפוס עצמו — אותו `Db`/`Supporter` חזר אלפי פעמים ונחשב פעמיים לכל קלט ⇒ **50s ⇒ 20s** קר |
| **«מקצב»** — IO באצווה | מטמון-ה-transpile נטען פעם אחת בתחילת בנייה ונשמר פעם אחת בסופה (רק מה שנגעו בו), לא קובץ לכל צומת |
| **«מחלק» / «בתורות»** | העובדים שכבר היו (4 = `availableParallelism` כאן), חלוקה מאוזנת לפי גודל; המיזוג ממוין (`byId` / `(a,b)`) ⇒ לא תלוי בסדר-הסיום |
| **«מסיר כפולים» / תאומים** | **לא הופעל** על גופים זהים: הזרע של כל חלק = `fnv(id) ^ seed` ומילון-הקוד = של הקובץ — שני גופים זהים במקומות שונים מקבלים קלטים אחרים, ולכן "להוכיח פעם אחת" היה משנה את הפלט. במקומו — הבנייה הכפולה של אורביט (ensure-gen + open) נשלפת פעם שנייה מהמטמון |

**`node catalog/scripts/rebuild.mjs [--times]`** — כל הצינור שאפשר לשחזר בריפו (19 שלבים: ensure-gen · מפקדי אורביט/ליבות · פותח · קורא ×4 · מוכיח · lift · catalog-build · goals-coverage · core-demo · prove/combine/build של המצרף · self-check). שלב שהטביעה שלו לא השתנתה ⇒ הפלטים מהמטמון.

### 4.1 זמנים (4 ליבות, אותה מכונה; "לפני" = worktree נקי ב-2c990a6 עם אותו רצף-סקריפטים)

| | לפני | אחרי |
|---|---:|---:|
| **(a) בנייה מלאה קרה** (בלי gen, בלי מטמון) | 252.3s | **199.0s** (מתוכם 23.2s שלב חדש — self-check; אותם 18 שלבים: 175.8s) |
| **(b) בנייה חמה, בלי שינוי** | 201.4s | **3.6s** |
| **(c) שינוי שורה אחת** ב-`src/lib/hebrewNumber.ts` (הערה) | 213.7s | **27.7s** |
| (c′) שינוי שורת-קוד שמשנה התנהגות (`'אגורה אחת'` ⇒ `'אגורה יחידה'`) | ~213.7s | **76.2s** (combine 15.8 + build 11.1 רצים בצדק) |
| **(d) `npx vitest run catalog`** | 152.7s (362 בדיקות) | **67.7s** חם · **78.7s** מטמון ריק (374 בדיקות) |

לפי רכיב: ensure-gen קר 48.5 ⇒ 19.4 · פותח-אורביט 47.8 ⇒ 20 קר / 13.7 אחרי שינוי / 0.9 בלי שינוי · קורא-אורביט 43 ⇒ 4.2 חם (4.9 אחרי שינוי) · מוכיח-אורביט 68 ⇒ 3.0 חם · `combine --check` 15.6 ⇒ 1.4 · `build --check` 11.4 ⇒ 1.3.

**ביט-זהות:** בנייה קרה מאפס (מחיקת כל המטמון + gen + הקבצים הפרושים) ⇒ `git diff` **זהה בדיוק** לבנייה מהמטמון; קורא-אורביט קר = חם (`cmp`); מוכיח-אורביט קר = המחסן; `open --check` ירוק; ב-`self.test`: קורא core-c עם מטמון ריק ואז מלא = הקובץ שבריפו, `build --check` עם `CATALOG_CACHE=off`, וטביעת-התלויות משתנה רק כשתוכן משתנה.

## 5. מה נגעתי ומה לא

- **לא נגעתי:** `src/` · `catalog/products|runtime|goals/*` · ה-API הציבורי של המצרף (`core.mjs` — רק נוסף `splitByBehavior`; הדגלים של ה-CLI; הפורמט של lab-data).
- **חדש:** `catalog/self/{parts,roles}.mjs` · `catalog/self/{machine,behavior-machine,report}.json` · `catalog/scripts/{machine-census,self-check,rebuild}.mjs` · `catalog/lib/{cache,strip-cli}.mjs` · `catalog/__tests__/self.test.ts`.
- **שונה:** `combiner/core.mjs` (באג 1 + חלקים) · `lib/probe.mjs` (באג 2) · `lib/verbs-net.mjs` + `core/near-net.mjs` (באג 3) · `inner/scripts/{prove,baseline}.mjs` + `scripts/behavior-probe.mjs` (באג 4) · `lib/sandbox.mjs` (`bundleWithDeps`, מצב `cli` אופציונלי) · `lib/probe-file.mjs` · `inner/lib/{build,opener,prove-job,ensure-gen}.mjs` · `combiner/{combine,build}.mjs` (מטמון) · `scripts/others-census.mjs` (ייצוא + main רק בהרצה ישירה) · החלפות-החלקים בשאר.
- **נוצר מחדש:** core-c (ref), behavior (ריפוד), stores, index (refs), lab-data (באג 1).

## 6. הוכחה

- כל ה-`--check` ירוקים: core · core-b · core-c · orbit · others · open · ensure-gen · lift · catalog-build · goals-coverage · core-demo · combiner prove · combine · build · **machine-census · self-check**. (`buildsmart-census --check` דורש את השכפול — כמו בבסיס.)
- `npx vitest run catalog`: **374/374**. `npm run verify` — ירוק (בהודעת-הסיום).

## 7. הרצה מחדש

```bash
node catalog/scripts/rebuild.mjs --times          # כל הצינור, עם מטמון
CATALOG_CACHE=off node catalog/scripts/rebuild.mjs # בלי מטמון
node catalog/scripts/self-check.mjs [--check]     # המכונה על עצמה ⇒ catalog/self/report.json
```
⚠️ שינוי בקוד של המכונה ⇒ `node catalog/scripts/self-check.mjs` וקומיט של `catalog/self/*.json` (machine-census נבדק ב-self.test).
