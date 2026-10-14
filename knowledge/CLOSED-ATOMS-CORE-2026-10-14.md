# 🧩 ארגז המנועים · שכבת החלקים — 8 המנועים הקטנים (ATOMS-CORE, 14.10.2026)

ענף: `claude/atoms-core-261014` (מ-`claude/enginebox-int-261013` @ fb2c6a1). לא מוזג. **אפס נגיעה בקובץ קיים**; שום דבר באפליקציה עוד לא מייבא את השכבה.

## החזון (כפי שהבעלים לימד)
מנוע גדול = הרבה מנועים קטנים. מפרקים אותו; כל חלק קטן **לא יודע למה הוא משמש** ("חלוקה" מחלקת שני מספרים — דקות, שקלים, מטרים).
כשמחברים חלק למנוע — הוא שואל **שאלה אחת** ("מה לחלק?"), ומוצעים רק המקומות **מהסוג שלו**, כל אחד עם התוצאה. אחרי הבחירה — הפרטים. התוצאה = יכולת חדשה.

## הקבצים
| קובץ | מה |
|---|---|
| `src/lib/atoms/contract.ts` | החוזה המשותף — **ביט-זהה** (md5 `d1633928cab86f6d2b0e9c3f8c7de598`, ננעל ב-ratchet). לא נערך. |
| `src/lib/atoms/parts/{divide,merge,next,round,offset,escalate,rotate,fuzzy}.ts` + `index.ts` | שמונת החלקים — טהורים, גנריים, לא זורקים על זבל. |
| `src/lib/atoms/cards.ts` | `ATOM_CARDS` (בסדר `ATOM_IDS`) + `atomCard(id)`. |
| `src/lib/atoms/__tests__/atoms-parts.test.ts` | התנהגות גנרית + קצוות (26). |
| `src/lib/atoms/__tests__/atoms-equivalence.test.ts` | **שקילות למנועי-המקור** (36). |
| `src/lib/atoms/__tests__/atoms-cards.test.ts` | כרטיסים · md5 החוזה · הגנת-טוהר (18). |

תלות יחידה מחוץ לשכבה: `lib/search` (`levenshtein`) ב-fuzzy. אין `src/components`, store, React, `Date.now`, `Math.random`, `new Date()` (נאכף בהגנת-מקור על 10 הקבצים).

## שמונת החלקים
| # | חלק | מקור | סוג (נקבה) | השאלה | פרטים | פונקציות |
|---|---|---|---|---|---|---|
| 1 | ✂️ `divide` חלוקה לחלקים שווים | zmanim #7 | span, amount | מה לחלק? | איך (מספר/גודל) · לכמה חלקים (12) · כמה בכל חלק · הפסקה · שארית (לוותר/קצר) | `divideSpan(span,{parts\|size,gap,remainder})` · `pointsAt(span,parts,at[])` · `divideAmount(total,parts,step=1)` |
| 2 | 🔗 `merge` מיזוג רצפים | zmanim #13 | sequence | מה לאחד? | maxGap (0) · minLength (1) | `mergeRuns(items,on?,{maxGap,minLength})` ⇒ `{from,to,length}[]` |
| 3 | ⏭️ `next` מה הבא? | zmanim #14 | times, sequence | מה לחפש קדימה? | count (1) · minLength (1) | `nextAfter(times,now,count=1)` · `firstRun(runs,minLength,fromIndex=0)` |
| 4 | 🎯 `round` עיגול לחומרא | zmanim #8 | amount, times | מה לעגל? | step (1) · כיוון: לחומרא למטה / לחומרא למעלה / לקרוב | `roundTo(v,step,dir)` · `roundAll` |
| 5 | ⏱️ `offset` זמן יחסי | zmanim #9 (+#6) | times | ביחס למה? | minutes (‎-10; מינוס = לפני) | `offsetAll(times,min)` · `resolveRelative(token,anchors)` · `hhmmToMinutes` |
| 6 | 📣 `escalate` ניתוב עם הסלמה | whatNeed #8 | waiting | מה להעביר הלאה כשאין תשובה? | waitMin (180) · urgentWaitMin (60) | `escalationState({...nowMs})` ⇒ `{stepIndex,currentTo,nextMoveMs,done}` · `escalationPlan` |
| 7 | 🔄 `rotate` סבב הוגן | whatNeed #11 | waiting, sequence | מה לחלק בתורות? | by: לפי יום / לפי פריט | `turnOf(list,n)` · `turnIndex` · `fairAssign(items,people,start)` · `dayIndex(iso)` |
| 8 | 🔍 `fuzzy` חיפוש סלחני | whatNeed #4 | text | איפה לחפש? | maxTypos (0/1) | `fuzzyFind(query,cands,maxTypos=1)` · `wordScore` · `normHe` |

### הכרעות (הפשוט והכן)
- **divide** לפי מספר: גבול k = `from + (to−from)/parts·k` — **אותו סדר-פעולות** כמו `sr + k·gra` (אחרת ‎299.99999 ≠ 300 ו-floor נשבר). העיגול **לא** בתוך divide — זה תפקיד `round` (חלקים מתחברים זה לזה).
- **divideAmount**: עבודה ביחידות-צעד, חיתוך לכיוון אפס, והחלק הראשון = `total − שאר החלקים` ⇒ הסכום יוצא בדיוק (גם אם total לא כפולה של step — אז הראשון סופג את השבר). ספרות-עשרוניות לפי הצעד (‏`toFixed`) נגד רעש-נקודה-צפה.
- **merge**: `on` חסר ⇒ ערך-האמת של הפריט. רווח בקצה לא נכלל ברצף.
- **next**: "אחרי" = **לא כולל** (כמו `markZmanim`). (`nextMinyan` במקור כולל — לא נבחר; מי שצריך כולל מעביר `now−1`.) `firstRun` חותך רצף שכבר התחיל ל-`fromIndex` ("הפנוי הבא מהיום").
- **offset**: שם-עוגן = כל מילה לטינית/עברית (לא רק sh/tz/nz); עוגן = דקות או "HH:MM"; אב-טיפוס חסום (`hasOwnProperty`). התוצאה בדקות לא-מנורמלות — הנרמול ליממה בתצוגה.
- **escalate**: שלב בלי מקבלים = המתנה 0 (עוברים מיד — "אין עסקים ⇒ לקהילה מיד"); דחוף = `min(waitMin, urgentWaitMin)` בכל שלב; יצירה לא-סופית ⇒ ישנה (לא נתקעים — כמו המקור). **תשובה מקפיאה בשלב שהיה ברגע התשובה** — במקור אין זמן-תשובה ("יש תגובות ⇒ biz"); השקילות נבדקה על בקשה בלי מענה.
- **fuzzy**: "וגם" — כל מילה בשאילתה חייבת להתאים; ציון = סכום ההתאמה הטובה לכל מילה; שוויון ⇒ סדר מקורי. טבלת-הציון היא tokMatch כלשונה.

## הוכחות-השקילות (`atoms-equivalence.test.ts`)
| חלק | מול | מה הוכח |
|---|---|---|
| divide + round | `dayZmanim` | 3 ערים × 6 תאריכים (חורף/קיץ/שוויון): סוף ק״ש גר״א ומג״א, סוף תפילה (למטה), חצות (לקרוב), מנחה גדולה/קטנה, פלג (למעלה) — **זהים בדקה**. `divideSpan(parts:12)[5].to` = חצות. |
| offset | `resolveTimeToken` + `shabbatTimes` | 12 טוקנים (כולל 24:00, ‎+1000, ריק, לא-מוכר) × 6 תאריכים; הדלקת-נרות = שקיעה − מנהג. |
| merge | `hebrewClosedWindows` | 3 חלונות (תשרי תשפ״ז — ר״ה שבת+ראשון, ניסן, סיוון): אותם חלונות, תחילה (ערב), סוף וימים. |
| next | `markZmanim` | כל 37 דקות ביממה — "הבא" זהה. |
| escalate | `routeRequest` | רגיל ודחוף × 9 נקודות-זמן (0…600 דק׳, כולל הקצוות 59/60/61, 179/180/181): אותו שלב, `nextMoveMs = escalateAtMs`; אין-מקבלים ⇒ מיד; יצירה פגומה ⇒ קהילה. |
| rotate | `adRotation` | 14 ימים רצופים, 4 מפרסמים: אותו אינדקס ואותה תורנית. |
| fuzzy | `tokMatch` / `prNorm` | ‏>2000 זוגות ממילון-המושגים האמיתי (מדויק, ב/ו/וה, 3 אותיות, החלפת-אות, השמטת-אות, ‎+ים, זר) — ציון זהה; נרמול זהה. |

## שערים
`npm run verify:fast` ירוק (445 קבצים / 3883 בדיקות); `npm run verify` (כולל build) לפני push.

## בקשות לחוזה (לא נערך)
- אין. הערה בלבד: `Detail` אין לו "תלוי-בחירה" (divide: `parts` רלוונטי רק כש-`by=parts`, `size/gap/remainder` רק כש-`by=size`). הממשק יכול להסיק לפי המזהים; אם רוצים — שדה אופציונלי `when?: { id: string; is: string }` בגל הבא.
