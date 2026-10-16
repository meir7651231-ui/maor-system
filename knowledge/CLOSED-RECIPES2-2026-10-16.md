# CLOSED · 📖 RECIPES2 — כרך ב׳ של ספר-המתכונים, מילוי-חכם, פתרון-ביניים⇒כלי, מבחן נסתר ג׳ (16.10.2026)

**"השינויים בספר" שבסטטוס — מה בדיוק:** לא היו. מאז הנעילה (`6898b94`) לא שונו `recipes/book2.mjs` (sha ‎8fedb6f4…‎),
`recipes/load2.mjs` (‎92ccb4f4…‎), המנוע (`catalog/selfprint/*.mjs`) ו-`budget.json`. אחרי הנעילה שונו רק: `catalog/spfair/plan.json`
(רישום r2), `catalog/spfair/overlap.mjs` (כלי-מדידה, הערת-מנהל) ובדיקה אחת (`catalog/__tests__/selfprint.test.ts` — בודקת גם את
שלדי כרך ב׳ הנעול). הסטטוס "recipe-book changes queued behind r2" היה ניסוח שגוי שלי.

ענף `claude/recipes2-261016` (מ-`claude/recipes-261016` @c99b729). לא מוזג, בלי PR.

## 1. לבעלים, בפשטות

**מבחן ג׳ — 46 משימות שהמכונה לא ראתה. כמה היא פתרה לבד:**

| | לפני (המנוע של RECIPES) | **אחרי (RECIPES2)** | ביקורת: אותו מנוע ישן, אותו תקציב-כולל |
|---|:-:|:-:|:-:|
| **21 המשימות החדשות באמת** (המספר העיקרי) | 0 | **1** | 0 |
| 25 החוזרות (זהות למשימה מ-א׳/ב׳/הציבורי — **לא-עיוור**) | 4 | 6 | 5 |
| כל ה-46 | 4 | **7** | 5 |

כלומר: **במשימות החדשות באמת — 0 ⇒ 1 מתוך 21.** הרוב המוחלט עדיין לא נפתר. 25 מתוך 46 משימות של ג׳ התבררו כזהות
בהתנהגות למשימות שכבר היו (§4) — שם השיפור (4 ⇒ 6) לא נחשב גילוי עיוור, כי כרך ב׳ נכתב לפי הכישלונות שם.

**שלוש דוגמאות אמיתיות (קלט ⇒ פלט):**
- **המקסימום של כל זוג-שכנים** (החדשה היחידה): מתכון "חלון-נע ברוחב-קבוע" (כרך ב׳) ⇐ המכונה בחרה קבוע 2 מהקוד שלנו ואת
  "המקסימום" מהמדף ⇐ ‎[6,1,9,1,3,7,2] ⇒ [6,9,9,3,7,7]‎.
- **לכל פריט — כמה קטנים ממנו** (חוזרת): מתכון "לכל פריט מול כל הפריטים" (כרך ב׳) ⇐ ההשוואה ‎<‎ + "סכום" ⇐
  ‎[6,1,9,1,3,7,2] ⇒ [4,0,6,0,3,5,2]‎.
- **המקסימום-עד-כאן** (חוזרת): מתכון "לכל מקום — מספר מהרשימה עד אליו" (כרך ב׳) ⇐ ‎+‎ ו"המקסימום" ⇐ ‎[6,1,9,1,3,7,2] ⇒ [6,6,9,9,9,9,9]‎.
- **מתכון בתוך מתכון:** קרה בתוך המכונה (713 דברים חדשים נבנו מעל "פתרון-ביניים בלי שם"; 19 מהם קיבלו שם), אבל רק שמות
  טריוויאליים (סינון/ניפוי) — **אף משימה של ג׳ לא נפתרה כך.**

**מה לא:** 20 מ-21 החדשות. ספרות, gcd, "הרצף העולה", פסגות, "החלון הטוב", קנייה-מכירה — יש להם עכשיו פרק בספר, ובכל זאת
לא נפתרו (פירוט §5). וגם **הפסד אמיתי:** "הממוצע" (ושתי משימות שבנויות עליו) כבר לא נמדד כמדויק — מקומו במדף נתפס ע״י גרסה
שנכונה על הקלטים הרגילים ושגויה בקלטי-לחץ (§3).

**יושר:** כרך ב׳ נכתב ע״י AI (אני), אחרי שראיתי מה נכשל ב-א׳/ב׳; 12 מ-20 המתכונים "נוטים למשימה מוכרת" (הבודק-הספקן).
שלוש הפגיעות החדשות של כרך ב׳ באות כולן ממתכונים כאלה. מה שהמכונה עשתה לבד: בחרה סוגים, קבועים, ומילאה חורים מהמדף.

## 2. מה נבנה (ומי כתב מה)

**AI (נעול ב-`6898b94`, sha ב-`recipes/SHA256-2`):**
- `catalog/selfprint/recipes/book2.mjs` — **20 מתכונים ⇒ 96 שלדים** ב-5 פרקים: חזור-על-מספר-עד-תנאי (num-until-acc/count/last,
  pair-until) · מונה-שמתאפס (reset-run(-each), count-pairs-if/cmp, triples-if/keep) · כל-פריט-מול-כולם (each-vs-all/later/earlier,
  each-first-later) · הרכבה (then-stat, then-best-index, zip-prepared) · ערך-רץ/חלון (scan-two-step, prefix-stat, window-const).
  מספרים בספר: 0, 1, 600 (תקרה), 1/2 ב-‎$slice‎. חלקים קבועים: ‎⟨choose⟩ ⟨at⟩ ⟨cmp===⟩‎ בלבד.
- `recipes/load2.mjs` — ‎`{$const:true}`‎ ⇒ שלד לכל **קבוע שחוזר ≥5 פעמים בשלדים שהכורה קרא מהקוד שלנו** (library-code.json):
  ‎[0, 1, 2, 100, 5, −1, 3, 4, 12, 7, 60, 0.5, 10]‎ (13). הסף 5 ננעל בקומיט-הנעילה, לפני כל הרצה. library-code.json נכרה מקוד
  הפרויקט (`mine.mjs`; `--check` ✓), לא מ-spfair/מטרות. **גילוי נאות:** כשבחרתי סף 5 ידעתי שספרות דורשות 10, והוא נכנס במקום
  ה-13. הפרישה: num-until-acc ⇒ 26 שלדים · num-until-count/last ⇒ 13 כל אחד · window-const ⇒ 26 (65 מתוך 96 = דילול-תקציב).
- **בודק-ספקן + שופט** (`recipes/REVIEW2.md`): סבב 1 — 6 תיקונים חובה (count-pairs-if חור-חובה · רשימה ריקה ⇒ אין תשובה
  במונה · כותרת · תיקו ב-then-best-index · "השוואה" ב-each-vs-* · גילוי-‎$const‎); השופט — "approved".
  "נוטים למשימה": num-until-acc/count, **pair-until (אוקלידס)**, reset-run(-each), **triples-if/keep (פסגות)**, **each-first-later
  (הבא-הגדול)**, each-vs-all/earlier (דירוג), zip-prepared (קנייה-מכירה), **scan-two-step (קדיין)**, then-best-index, prefix-stat,
  window-const. כלליים באמת: num-until-last, count-pairs-cmp, each-vs-later, then-stat.

**המנוע (`selfprint.mjs`, מגודר `budget.recipes2` — בלעדיו ביט-זהה ל-RECIPES; הוכח: `rc` חוזר זהה בבתים):**
- **תקציב:** שלב R = ‎recipes.total + recipes2.total‎ = 6,000 + 6,000; שני הכרכים באותו סבב-חוזר.
- **מילוי-חכם** (שלב R בלבד): בראש כל מאגר-חור — נציג אחד לכל התנהגות מוכרת: פעלי-הייחוס של המנוע (100% בסט) בחתימה,
  אופרטורי-בסיס (‎num,num⇒num‎: ‎+ − × ÷ % max min‎; ‎num⇒num‎: neg/abs/floor/round/trunc/ceil/sign/sqrt; ‎nums⇒num‎: צבירה
  של ‎+/max/min/×‎ ואורך). **לא נבנה "לימוד תנאי/טבלה מדוגמאות" כמו בונה-הערכים של lab13:** למנוע עיוור אין דוגמאות של
  המטרה; ה"לימוד" היחיד כאן = סיווג המדף מול הייחוסים והאופרטורים של המנוע עצמו.
- **פתרון-ביניים ⇒ כלי, גם בלי שם:** דבר חדש משלב R שרץ על רוב קלטי-הלחץ ועל רוב 50 קלטים אקראיים ⇒ `tool` (ראשון אחרי
  בעלי-השם בסבב הבא); תקרה 6 לכל חתימה לכל סבב, קודם מי שכל המילוי שלו "מובן", אחר-כך הכי פשוט. בפועל: 121/128/116
  כלים לסבב; **713 דברים חדשים נבנו מעליהם, 19 עם שם** (16 מהם משלדי-ספר: סינון/ניפוי/settle — טריוויאלי).

## 3. מדדים

| | לפני (`rc`) | **אחרי (`r2`)** | ביקורת (`rc2-eq`) |
|---|:-:|:-:|:-:|
| **ג׳ · 21 חדשות** | 0 | **1** (neighbourMax ⇐ window-const#2, כרך ב׳, נוטה) | 0 |
| ג׳ · 25 חוזרות (לא-עיוור) | 4 | 6 (+countSmallerThanEach ⇐ each-vs-all · +runningMax ⇐ prefix-stat; שניהם כרך ב׳, נוטים) | 5 (+offsetFromMean ⇐ each-stat, כרך א׳) |
| ג׳ · כל ה-46 | 4 | **7** | 5 |
| א׳ (31, **לא-עיוור**) | 2 | 6 | 2 |
| ב׳ (44, **לא-עיוור**) | 3 | 6 | 4 |
| SP-FAIR (26, **לא-עיוור**) | 8 | 9 | 9 |
| פעלים שנבנו מחדש בדיוק (מנוע) | average · compare · extreme | **compare · sum** | average · compare · extreme |
| שם מיוחד שצמח / baseline | 489 / 206 | 471 / 223 | — |
| שיפורים שגויים | 0 | **0** | 0 |
| זמן (הרצה אחת) | ~21 דק׳ | **~2 שע׳ 1 דק׳** | ~81 דק׳ |

(א׳/ב׳/SP-FAIR כאן = פגיעות שנבנו, בלי "כבר-חלק"; RECIPES דיווח א׳ 6 כולל ספירה אחרת — ההשוואה כאן לפי אותו כלי לכל השורות.)
ג׳ לפני/אחרי לפי פגיעה: ‎centroid · firstIndexOfMax · lastIndexOfMin · runningTotal‎ — בשלושתן (כרך א׳: coords-stat · best-index · scan).

**ממוצע / טווח / שונות / סטייה-מהממוצע / מסלול:**
- **ממוצע — הפסד.** ב-r2 הדבר במדף שמתנהג כמו "ממוצע" על סט-הקלטים הקבוע (100%) **נכשל בקלטי-הלחץ** (פלט שונה), ולכן לא
  נספר; גם "רק-מעל-הממוצע" (SP-FAIR) ו"סימן-מול-הממוצע" (א׳) נפלו איתו. הסיבה: המדף ממפתח לפי טביעה, והסדר החדש של שלב R
  הביא לשם גרסה שגויה-בלחץ **לפני** הגרסה הנכונה (שתי הגרסאות עם אותה טביעה; החלפה דורשת שוויון-לחץ, אז הנכונה לא דוחקת
  אותה). המנוע עצמו מודה: average כבר לא ברשימת "נבנה מחדש בדיוק". extreme גם יצא; sum נכנס.
- **טווח — נשמר** (SP-FAIR range ✓). **שונות** (ג׳ populationVariance, SP-FAIR variance) — לא. **סטייה-מהממוצע** — לא ב-r2
  (91% במקום 18%; הביקורת rc2-eq פתרה אותה דרך כרך א׳). **מסלול** — לא.

**דטרמיניזם:** `selfprint.mjs` (הרצה נפרדת) ו-`fair.mjs r2` (הרצה שנייה, מנותקת) ⇒ **5/5 קבצי-המנוע זהים בבתים**
(`sameBytesAsBranch` = true לכולם); `rc` חוזר זהה בבתים (א׳/ב׳/SP-FAIR) — ההבדל היחיד `sameBytesAsBranch` (compare מכיל את
תיאור-התקציב שהתעדכן). `control-v1.json` לא זז.

**הרצת r2 הראשונה נקטעה:** כלי-הרקע עוצר תהליך אחרי שעתיים; r2 צריך ~2 שע׳ (סבב 3 לבדו ~78 דק׳ — הכלים-בלי-שם מוסיפים
הרכבות כבדות). לפי החלטת-מנהל הורץ שוב **בדיוק כמו שננעל**, מנותק (`nohup setsid`), בלי שום דבר כבד במקביל.

## 4. חפיפת ג׳ (הערת-מנהל) — `catalog/spfair/overlap.mjs` ⇒ `hidden/c/overlap.json`

לפי התנהגות, אותה חתימה, 625–628 קלטים (סט קבוע + 12 לחץ + 600 אקראיים): **23 זהות · 2 זהות-חוץ-מקצוות · 21 חדשות** —
כמו אצל המנהל. ‏(ניסיון ראשון שלי נתן 23/1/22: סף "עד 10% קצוות" פספס את windowSums של ב׳ — זהה בכל מקום מוגדר, שונה רק
ב-29% קלטים שבהם אחת לא מוגדרת. ההגדרה הסופית: אף פעם לא שונות כששתיהן מוגדרות, ושוות בלפחות חצי מהקלטים. ובגרסה
הראשונה גם באג: המזהה של המטרה-המקבילה דרס את מזהה-ג׳ בשורה — כתבתי בטעות בצ׳אט ש"המזהים זהים"; הם לא.)

**מאיפה החפיפה — מה בדיוק קיבל סוכן-המשנה שכתב את ג׳:**
- הוא קרא **רק** `catalog/grow/lib.mjs` (מאומת בתמליל: 5 קריאות-כלי — קריאת lib.mjs, כתיבת הקובץ, תיקון 2 מטרות, נעילה).
  לא ראה את א׳/ב׳/המנוע/הספר/הדוחות.
- **ההנחיה המלאה** (מילה במילה):

> You are writing a BLIND benchmark ("מבחן נסתר ג׳") of small pure functions for an automated program-synthesis machine in repo /home/user/maor-system. You must stay blind to the machine: DO NOT read or list anything under catalog/selfprint/, catalog/spfair/ (except writing your own new folder below), catalog/blueprints/, catalog/combiner/, catalog/recipes/, knowledge/, or CLAUDE.md. The ONLY repo file you may read is catalog/grow/lib.mjs (it defines the input world: VALUES, samplesOf, stressSamples, extraSamples, semOfValue, sameOut). Do not look at git history or other branches.
>
> ## Task
> Create `catalog/spfair/hidden/c/targets-c.mjs` with ~45 targets, in this exact module format:
> ```js
> // מבחן נסתר ג׳ — מטרות שהמכונה לא ראתה. כל f טהורה; null = לא מוגדר.
> export const TARGETS = [
>   { id: 'camelCaseId', he: 'תיאור קצר בעברית', sig: 'nums>num', f: (xs) => ... },
>   ...
> ];
> ```
> - Types: `num` (finite number), `nums` (array of finite numbers), `pt` ({x,y} finite), `pts` (array of pt). Signature = up to 2 inputs, e.g. 'nums>num', 'nums>nums', 'num>num', 'num,num>num', 'nums,num>num', 'nums,num>nums', 'pts>num', 'pts>pts', 'pt,pt>num', 'pts,pt>num', 'pts>pt'.
> - Rough mix: ~14 nums>num, ~12 nums>nums, ~7 single-number (num>num / num,num>num), ~5 list+number (nums,num>…), ~7 points.
> - Include: selection tasks (pick index/value best by some criterion, ties defined), sliding windows (fixed width given as the number argument or constant), runs/streaks (reset counters), digit tasks on integers (sum of digits, digit count, reversed digits, digital root, etc. — define behavior for negatives/non-integers by returning null when undefined), repeated-until-condition tasks on a number, "each item vs all others" (rank, count smaller, next greater), prefix/running aggregates, pairwise neighbours, simple statistics. Ordinary, generally-useful operations an engineer would name — NOT exotic puzzles. Be original; don't just copy textbook lists verbatim, but common operations are fine.
> - Each `f` must be pure, deterministic, total: never throw, return `null` when undefined (e.g. empty list, too short, non-integer where integer required, |n| too large to be meaningful — e.g. digit tasks on |n| > 1e15 or non-safe-integers ⇒ null), and otherwise return a finite value of ONE output type. Avoid loops whose length depends on the magnitude of a number unless bounded (e.g. stop after 10000 iterations ⇒ null). Must be fast on lists of 500 elements and values up to ±1e15 (O(n²) fine for n=500).
> - Output must vary across inputs (not constant).
> - Floating results are compared after rounding to 12 significant digits.
>
> ## Validation (write a throwaway script in /tmp/claude-0/ scratch, not in the repo)
> Import catalog/grow/lib.mjs; for every target run f on samplesOf(sig), stressSamples(sig), extraSamples(sig): assert no throw, outputs are null or semOfValue(out) matches the declared output type (or 'empty' for list outputs), at least 6 non-null outputs on samplesOf among inputs whose lists have ≥2 elements, and not all equal. Fix any target that fails.
>
> ## Lock
> Write `catalog/spfair/hidden/c/SHA256` containing the line produced by `cd /home/user/maor-system && sha256sum catalog/spfair/hidden/c/targets-c.mjs` (format: `<hash>  catalog/spfair/hidden/c/targets-c.mjs`). Do NOT git commit; do not touch any other file.
>
> ## Report back (keep it SHORT — the requester must stay blind)
> Only: the number of targets, the count per signature, the sha256, and confirmation that validation passed. DO NOT list target ids, descriptions or code in your reply.

- **המסקנה:** החפיפה באה **מההנחיה שלי**, לא מדליפה. רשימת ה-"Include" נכתבה לפי §5 של RECIPES — כלומר לפי מה ש**נכשל
  ב-א׳/ב׳** (ספרות, חזור-עד-תנאי, רצפים, חלונות, כל-פריט-מול-כולם, ערך-רץ, שכנים, סטטיסטיקה), והתערובת לפי-חתימה הועתקה
  מהתפלגות ב׳. גם אותו דור-מודל כתב את א׳/ב׳/ג׳ ⇒ אותן "משימות שמהנדס היה נותן להן שם". בנוסף: **אני** ראיתי בתחילת הסשן את
  10 המטרות הראשונות של ב׳ (`head` כדי ללמוד את הפורמט) לפני שכתבתי את ההנחיה. ⇒ ג׳ לא היה עיוור לכיוון-העבודה; רק 21 החדשות
  הן מדידה עיוורת, וגם הן מאותה משפחת-ניסוח.
- אני פתחתי את תוצאות ג׳ של rc ו-rc2-eq אחרי ששתי ההרצות הסתיימו ולפני ש-r2 הסתיים — המנוע והספר כבר היו נעולים, כך שזה
  לא יכול היה להשפיע.

## 5. מה לא נפתר — ולמה (ג׳)

| מה | פרק קיים? | למה לא |
|---|---|---|
| סכום-ספרות · קולץ · gcd · כפולה-קרובה (חוזרות!) | כן — num-until-* / pair-until | num-until-* קיבלו 3,734 חיבורים ו-0 הצלחות: 13 קבועים × שלדים, ובכל אחד 4–5 חורים — הצירוף הנכון (‎>‎ מול 0, ‎/‎ ⇒ floor, ‎%‎, ‎+‎, אותו K=10) לא הגיע בתור; pair-until — 80 חיבורים בלבד |
| הרצף העולה · פסגות · החלפות-סימן · הקפיצה הגדולה (חוזרות) | כן — reset-run / triples / count-pairs-* | **התקציב:** מתוך 12,000 חיבורי שלב R — 5,293 (44%) הלכו ל-4 מתכוני-‎$const‎ ו-4,778 לכרך א׳; כל אחד מ-11 המתכונים האלה קיבל ~80 חיבורים (47–80) ו-0 הצלחות |
| החלון הטוב · תת-רצף מקסימלי · סכומי-חלון | כן — then-stat / scan-two-step / window | then-stat: 298 חיבורים, 16 הצלחות — 14 מהן "ספירה"; scan-two-step 159 ו-zip-prepared 158 — 0 |
| שונות · סטייה-מהממוצע · ממוצע | כן (כרך א׳) | ‎§3‎ — ממוצע נכון לא על המדף ב-r2 |
| 20 מ-21 החדשות | — | לא ניתחתי כל אחת (לא פתחתי את ‎f‎ שלהן); ראו `hidden/c/runs/r2.json › best` לאחוז-הקרוב-ביותר |

## 6. הצעה לשלב הבא (לא הורץ — יימדד על מבחן נסתר חדש)

1. **מבחן נסתר שכותב מישהו אחר** — לא מודל מאותו דור, או לפחות בלי שום רשימת-סוגים מההנחיה (רק "פונקציות טהורות שימושיות"),
   ועם בדיקת-חפיפה אוטומטית (overlap.mjs) **לפני** הנעילה.
2. **מדף לפי-התנהגות-מלאה:** שתי גרסאות עם אותה טביעה ושונות בלחץ — לשמור את שתיהן (או להעדיף את מי שעובר לחץ), כדי שסדר-המילוי
   לא "ייקח" מקום של פעולה נכונה (ה"ממוצע" של §3).
3. **‎$const‎ בלי פרישה מלאה:** קבוע = חור עם מאגר (13 הקבועים) בתוך אותו שלד, במקום 13 שלדים — פחות דילול.
4. **תקרת-זמן לסבב** (צעדים, לא שעון) כדי שסבב 3 לא יעלה פי 6.

## 7. שערים

| שער | תוצאה |
|---|---|
| `npx vitest run` (כל הריפו, ב-hook) | 494 קבצים ✓ (אחרי כל קומיט; פעמיים נכשל בדיקה לא-קשורה בפסק-זמן תחת עומס — self.test / inner.test — ועברה לבד ובקומיט החוזר) |
| `catalog/__tests__/selfprint-recipes2.test.ts` | נעילת כרך ב׳ · 13 קבועים · 96 שלדים תקינים · כללי · מילוי-ביד · שומר חוסם ג׳ |
| `spfair.test.ts` | + נעילת ג׳ (‎6e93b14e…b602‎) |
| `selfprint/mine.mjs --check` | ✓ |
| fresh-gate (`rebuild.mjs --check` + git נקי) | ✓ |
| דטרמיניזם | selfprint.mjs ≡ fair r2 בבתים (5/5); rc ≡ rc הקודם בבתים; overlap `--check` ✓ |
| `selfprint.mjs --check` (גם הצמיחה בלי מטמון) / `fair.mjs --check r2` | **לא הורצו בנפרד** — כל אחד ~2 שע׳; במקומם שתי ההרצות הבלתי-תלויות שלמעלה (הצמיחה רצה פעם אחת בלי מטמון בתחילת הסשן — node_modules/.cache היה ריק) |

זמן כולל ~7.5 שע׳ (יעד: 4). הרצות: rc ×2 (הראשונה נקטעה) · rc2-eq ×1 · selfprint.mjs ×2 (הראשונה הופסקה ידנית אחרי דקה —
נקטעה ממילא) · r2 ×2 (הראשונה נקטעה בסבב 3).

```bash
node catalog/selfprint/selfprint.mjs                 # RECIPES2 ⇒ compare · ledger · blueprints · found
node catalog/spfair/fair.mjs r2                      # ~2 שע׳ — להריץ מנותק (nohup setsid), לא בכלי-רקע
node catalog/spfair/fair.mjs rc rc2-eq               # לפני / ביקורת
node catalog/spfair/overlap.mjs [--check]            # חפיפת ג׳
npx vitest run catalog/__tests__/selfprint-recipes2.test.ts catalog/__tests__/spfair.test.ts
```
