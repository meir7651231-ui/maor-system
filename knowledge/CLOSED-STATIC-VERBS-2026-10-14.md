# CLOSED · 🧱 7 הפעלים שהיו "רק שם" — עכשיו עם חוקים (14.10.2026)

ענף `claude/static-verbs-261014`, נבנה על `claude/catalog-261014`, ולא מוזג. בסשן הזה פעלתי ככורה בצוות-הקטלוג.

## 1. לבעלים, בקצרה

- באלפבית היו **7 פעולות בלי שום חוק**: דורש מקור · מקפיא · מקצה תפקיד · מנתב · סובל כשל · מווסת קצב · מעביר דרך מרכז. לכן אף חלק לא יכול היה להוכיח אותן, והן הודבקו רק לפי שם.
- **"יש הכל" התאמת: כל 7 נמצאו בקוד שלנו.** הן מופיעות באורביט ובעוד 5 ריפואים, סה"כ 72 מקומות. אף אחת לא הומצאה.
- מכל פעולה חולצה **ליבה קטנה בלי עולם** (`catalog/core/*.mjs`). לכל ליבה נכתבו 3–4 חוקים שרצים, ולכל חוק יש מוטנט שהוא תופס.
- **התוצאה:** הקטלוג מוכיח עכשיו **42 פעולות** במקום 35, ו-497 חלקים מקיימים פועל במקום 486. "מנתב" מתקיים בהרצה ב-9 חלקים קיימים של אורביט. 6 הפעולות האחרות מוכחות היום רק על הליבה שלהן, וההסבר ב-§4.

## 2. לכל פועל: איפה נמצא, הליבה, החוקים

"מוצא" = מקום בקוד שקראתי (קובץ:שורה). הרשימה המלאה נמצאת ב-[`catalog/core/origins-b.json`](../catalog/core/origins-b.json), ומשוכפלת לכל חלק ב-`sources/core-b.json → origins`. כל מוצא בריפו אחר אומת ב-grep/sed על השכפול, ב-ref של המפקד.

### ⏱️ `pace` · מווסת קצב — `catalog/core/pace.mjs#pace` (+ `backoff`)

**נמצא ב:**
- אורביט:
  - שמירה אוטומטית — debounce של 500ms (`src/store/useApp.ts:1062`).
  - דחיפה לענן — debounce של 800ms (`cloudSync.ts:360`).
  - backoff מעריכי 5s·2ⁿ עד 5 דקות (`cloudSync.ts:340`).
  - השהיה אחרי PIN שגוי (`lock.ts:167`).
  - שומר-לחיצה-כפולה 400ms (`SecuritySection.tsx:56`).
  - smsOutbox — 20 הודעות לדקה (`functions/index.js:194`).
- בנייה-חכמה:
  - heartbeat שנבלע אם עברו פחות מ-30 שניות (`presence_repository.dart:292`).
  - debounce של 250ms בחיפוש.
- הישיבה: `shut.py:235` — backoff בין ניסיונות.
- 14kk: `api-gateway/server.js:61` — rateLimit.
- סורק-האיכות: `scanner.py:126` — `sleep(0.4)`.

**הליבה:** `pace(times, gap, mode)` מקבלת רגעים מוזרקים, בלי שעון.
- `'throttle'`: הראשון בגל מנצח.
- `'debounce'`: האחרון בגל מנצח, ויוצא gap אחריו.

**החוקים (4):**
- `pace.spacing` — אין שתי יציאות קרובות מ-gap.
- `pace.bound` — מספר היציאות ≤ ⌈T/gap⌉+1.
- `pace.idle` — בקשה בודדת תמיד יוצאת, בתוך gap ממנה.
- `pace.winner` — היציאות הן בדיוק "הראשון בכל גל" או בדיוק "האחרון בכל גל + gap".

**מוטנטים:** אין ויסות · גריד קבוע · היציאה האחרונה נבלעת · "הראשון בגל + gap".

**וריאנטים:** `backoff` מ-cloudSync נשמר בליבה בלי חוק משלו, ונבדק בבדיקת-יחידה. הלחיצה-הכפולה היא throttle; השמירה האוטומטית היא debounce.

### 🛟 `tolerate` · סובל כשל — `catalog/core/tolerate.mjs#tolerateParse` (+ `attempt` · `tolerateEach`)

**נמצא ב:**
- אורביט:
  - `safeDecode` (`App.tsx:146`).
  - `readPinFails` — JSON פגום ⇒ `{n:0}` (`lock.ts:135`).
  - `readCloudEnvelope` — כל כשל ⇒ null (`cloud.ts:459`).
  - `healRecord` (`cloud-merge.ts:50`).
  - המרכזייה `ask` — לעולם לא זורקת (`registry.ts:228`).
  - smsOutbox — כשל מסומן error והלולאה ממשיכה (`functions/index.js:202`).
- הישיבה: `EventBus.publish` — מנוי שזרק נרשם והעסקה ממשיכה (`events.py:40`).
- יומן-הבינה: `verify.mjs:103`.
- סורק-האיכות: `exposure_audit.py:431`.
- 14kk: `final-bridge-v1.3.js:456`.
- `-ai-chat-server`: `parse-acc.mjs`.

**הליבה:** מריצה צעד על כל פריט. צעד שזרק מקבל ערך-נפילה (קבוע, או פונקציה של הקלט), והשאר נשארים במקום. המופע בלי הפונקציות, שהקורא יכול להריץ, הוא `tolerateParse` — קריאת JSON קפדנית.

**החוקים (3):**
- `tolerate.total` — לא זורק, גם על פריט שבור וגם על קלט שבור כולו.
- `tolerate.slot` — כשל נותן ערך-נפילה אחד וקבוע, או משאיר את הפריט כמו שהוא.
- `tolerate.keep` — כשל בפריט אחד לא משנה אף פריט אחר ולא את הסדר.

**מוטנטים:** זורק על לא-טקסט · נפילה שמשתנה לפי הקלט · מוחק את הפריט שנכשל.

### 📡 `relay` · מעביר דרך מרכז — `catalog/core/relay.mjs#relay`

**נמצא ב:**
- אורביט:
  - המרכזייה — כלי שואל כלי רק דרך `ask` (`registry.ts:228`).
  - תור-השליחה — האפליקציה כותבת, השרת שולח (`functions/index.js:191`).
  - yemotProxy (`:214`).
  - צ'אט-הצוות דרך Firestore (`supportChat.ts:4`).
- הישיבה: EventBus (`events.py:36`).
- 14kk: שער-API עם createProxyMiddleware (`api-gateway/server.js:210`).
- בנייה-חכמה: edge-proxy worker (`worker.js:46`).
- `-ai-chat-server`: `write-sms-outbox.mjs`.

**הליבה:** כל הודעה מקבלת מספר-תחנה אחד, והמרכז מפיץ אותה לכל חבר חוץ מהשולח.

**החוקים (3):**
- `relay.once` — כל הודעה עוברת במרכז פעם אחת, ומגיעה פעם אחת לכל חבר אחר, כמו שהיא.
- `relay.order` — הסדר של כל שולח נשמר אצל כל מקבל.
- `relay.noecho` — הודעה לא חוזרת לשולח שלה.

**מוטנטים:** מסירה כפולה · סדר הפוך · הד לשולח.

### 🔀 `route` · מנתב לפי ערוץ — `catalog/core/route.mjs#route` (+ `routeAll`)

**נמצא ב:**
- אורביט:
  - `sendSmsVia` — `'inforu'` הולך ל-inforu וכל השאר ל-019 (`functions/index.js:115`).
  - `deliverReceipt` — pdf או טקסט (`receipt.ts:225`).
  - `resolveDialCode` — קוד מוכר ⇒ עסק, אחרת "לא נמצא" (`phoneLine.ts:803`).
  - **וריאנט:** `portalChannels` (`portal.ts:63`) **מפזר לכל הערוצים** ולא בוחר אחד. זה `route` רק בחלקו.
- בנייה-חכמה: `ROUTES` ב-edge-proxy (`worker.js:58`).
- 14kk: `switch(intent.type)` עם default (`ai-telegram-integration.js:135`).
- הישיבה: פקודה ⇒ מטפל (`gate.py:2160`).
- יומן-הבינה: `RENDERERS[s.type]` (`engine.js:372`). **בלי** ברירת-מחדל.
- סורק-האיכות: `detect_platform`.

**הליבה:** טבלת-כללים, והכלל הראשון שמתאים מנצח. המפתח מנורמל, ומפתח לא מוכר הולך ל-fallback.

**החוקים (4):**
- `route.one` — שם-ערוץ אחד. לא רשימה, לא מספר, ולא שארית של קלט שבור (NaN/Invalid).
- `route.few` — ל-16 קלטים יש מעט ערוצים.
- `route.det` — אותו קלט ⇒ אותו ערוץ, גם אחרי ניתוב של קלט אחר באמצע.
- `route.default` — כל הקלטים הלא-מוכרים הולכים לאותו ערוץ אחד.

**מוטנטים:** פיזור לרשימה (כמו portalChannels) · ערוץ לכל אורך · round-robin · הד-מפתח.

### 🎭 `assign-role` · מקצה תפקיד — `catalog/core/assign-role.mjs#assignRoles`

**נמצא ב:**
- אורביט:
  - `roleOf` — admin ⇒ teacher ⇒ staff, תפקיד אחד לכל מייל (`config.ts:658`).
  - `isAdminAuthority` (`config.ts:703`).
  - `effectiveConfigFor` (`platform/lib.ts:219`).
  - **וריאנט:** `staffRoleIn` (`kitchen.ts:152`) נותן כמה תפקידים לאדם אחד.
- הישיבה: `next_part` — סבב (`shut.py:190`).
- בנייה-חכמה:
  - פיזור שורות בסבב (`persona_fulfillment.dart:430`).
  - ווריאנט דביק לפי hash (`ab_experiments.dart:31`).
  - `claims.role` אחד בדיוק (`reviewRoleRequest.ts:139`).

**הליבה:**
- תוכנית `[{role, count}]` לפי הסדר.
- מי שלא נכנס מקבל את תפקיד-השארית (`rest`, כמו staff).
- ההגרלה היא mulberry32 עם זרע מוזרק, על החברים הממוינים. לכן סדר ההגעה לא משנה מי מקבל מה.

**החוקים (3):**
- `role.one` — תפקיד אחד לכל חבר, במקומו.
- `role.counts` — המספרים לפי התוכנית, והשאר בשארית אחת.
- `role.seeded` — אותו זרע ⇒ אותה חלוקה, וערבוב החברים לא משנה את המספרים.

**מוטנטים:** חבר חסר · כולם בתפקיד הראשון · זרע שזז בין קריאות.

### 🧊 `freeze` · מקפיא ומחליף תוכן — `catalog/core/freeze.mjs#applyFrozen`

**נמצא ב:**
- אורביט:
  - `voidShopRedemption` — `voidedAt`. הרשומה וה-S- נשארים, וביטול-כפול נדחה (`useApp.ts:3513`).
  - קבלות §46 בענן — עדכון/מחיקה למנהל בלבד (`firestore.rules:224`).
  - `liveRedemptions` (`shop/lib.ts:25`).
  - תצלום-המיתוג ב-RemoteWizard.
- הישיבה:
  - מצבים סופיים ו-`version += 1` (`orders.py:100`).
  - `@dataclass(frozen=True)` (`terms.py:22`).
- בנייה-חכמה: `allow update, delete: if false` (`firestore.rules:1127`).
- `-ai-chat-server`:
  - קבצים מקובעים ב-sha256 (`pins-check.mjs:55`).
  - שנה חדשה = רשומה חדשה עם `prevYearId`.
- יומן-הבינה: ארכיון `issues/`.

**הליבה:** מקבלת רשימת פעולות put/freeze/replace על מחסן-גרסאות.
- put על רשומה קפואה ⇒ נדחה.
- replace על רשומה קפואה ⇒ גרסה חדשה בסוף.

**החוקים (3):**
- `freeze.still` — הגרסאות מרגע ההקפאה לא זזות עד הסוף.
- `freeze.keep` — replace מוסיף גרסה ושומר את הישנה, ושאר הרשומות לא נוגעות.
- `freeze.reject` — put על רשומה קפואה נדחה.

**מוטנטים:** put דורס · replace דורס · put מוסיף גרסה.

### 🔗 `require-source` · דורש מקור — `catalog/core/require-source.mjs#requireSource` (+ `hasSource`)

**נמצא ב:**
- יומן-הבינה:
  - `src = {t ≥1, url ^https://}` (`schema.json:46`).
  - השער נופל על מקור שאינו https (`verify.mjs:138`).
  - `srcLine` — בלי מקור לא ממציאים, מחזיר null (`engine.js:25`).
- אורביט: `safeHttpsUrl` (`config.ts:112`).
- הישיבה:
  - `cmd_mimai` — "ממאי": טענה לא נרשמת בלי מקור (`gate.py:1721`).
  - `novel_facts` (`gate.py:1420`).
- `-ai-chat-server`: טיוטה בלי "מוצא:" נכשלת (`quarry-check.mjs:10`).
- בנייה-חכמה: רשימת-מארחים סגורה (`worker.js:66`).

**הליבה:** מחזירה `{accepted, rejected}`. מקור = `src`/`source`/`sources` לא ריקים, וכל קישור בהם חייב להיות https.

**החוקים (3):**
- `source.reject` — פריט בלי מקור לא מתקבל.
- `source.pass` — כל פריט עם מקור מתקבל.
- `source.never-invent` — מה שהתקבל הוא פריט מהקלט, בלי שינוי.

**מוטנטים:** מקבל הכול · מקבל רק את הראשון · מדביק מקור "לא ידוע".

**הערה שהסוכן-החוקר העלה, ואימתתי:** ביומן-הבינה מקור **אינו חובה** לכל פריט. החובה היא רק שמקור שכתוב יהיה תקין. את "דורש" במובן המלא (טענה לא נרשמת בלי מקור) יש ב-`cmd_mimai` של הישיבה וב-`quarry-check` של המחצב.

## 3. איך זה מחווט

- **החוקים:** הוספו ב-`catalog/lib/verbs.mjs`. ערכתי את 7 הרשומות הקיימות במקומן, לא הוספתי רשומות חדשות, ו-`staticOnly` הוסר.
  - העזרים יושבים בסוף הקובץ: `sourced` (המפרט נכתב בנפרד מהליבה), `freezeMut`, `planCounts`, `throttleOf/debounceOf`, `POISONS`.
  - `ref` של כל פועל = הליבה עצמה.
- **סדר-הספציפיות (`PRIMARY_ORDER`):** 7 הפעלים נכנסו אחרי `clamp` ולפני `sort`.
- **`sources/core-b.json`:** 7 חלקים `what: brick`, `pure: true`, עם `origins`. הקובץ נכתב ע"י `node catalog/scripts/core-b-census.mjs` (עם `--check`). הסקריפט מריץ כל ליבה על הדוגמה שלה לפני הכתיבה.
  - **הסכמה:** נוסף שדה אופציונלי `origins` (`catalog/schema.json`). core-b עובר `validateSource` גם במצב strict.
- **קורא-ההתנהגות:** `core-b` נוסף ל-`SOURCES/ORDER` ב-`behavior-probe.mjs`, ו-`'core-b': 'ליבות-הפעלים'` נוסף ל-`SOURCE_ORDER/SOURCE_HE` ב-`build-index.mjs`.
- **בדיקות:**
  - `catalog/__tests__/core-b.test.ts` (חדש). הוא בודק:
    - לכל חוק יש מוטנט;
    - ה-census מעודכן;
    - יש origins מאורביט ומריפו אחר;
    - הקורא מצא כל פועל בליבה שלו כראשי, n/n;
    - הליבות טהורות (בלי Date, Math.random או I/O);
    - דוגמאות-עולם: debounce מול throttle, backoff, `sendSmsVia`, קבלה קפואה, `safeDecode`.
  - `catalog-all.test.ts` מכיר עכשיו את core-b.
  - `verbs.test.ts` רץ על 7 הפעלים אוטומטית: הליבה מקיימת, וכל חוק נושך.

## 4. לפני ⇐ אחרי (קורא-ההתנהגות על כל הקטלוג)

| פועל | לפני: run | לפני: static (ניחוש משם) | אחרי: run | אחרי: twin | אחרי: static |
|---|---:|---:|---:|---:|---:|
| `require-source` | 0 | 33 | 1 (הליבה) | 0 | 14 |
| `freeze` | 0 | 5 | 1 (הליבה) | 0 | 4 |
| `assign-role` | 0 | 39 | 1 (הליבה) | 0 | 17 |
| `route` | 0 | 13 | **10** (9 באורביט + הליבה) | 4 | 5 |
| `tolerate` | 0 | 17 | 1 (הליבה) | 0 | 17 |
| `pace` | 0 | 3 | 1 (הליבה) | 0 | 2 |
| `relay` | 0 | 22 | 1 (הליבה) | 0 | 5 |

**למה ה-static ירד:** לפועל עם חוקים, הניחוש-משם חייב להתאים גם לחתימה (`static-label.mjs`).

**כל הקטלוג:**
- פעולות מוכחות: 35 ⇐ **42** מתוך 45.
- חלקים שמקיימים פועל: 486 ⇐ **497**.
- המחולל: 106 ⇐ 109 תאומים (תאומי-Dart של `statusLabel`/`advanceStatus`/`planWord`).
- תוויות של 38 הפעלים האחרים **לא זזו** — נבדק בהשוואה של כל שורה. זזו רק "פעלים ראשיים" של חלקים סטטיים.

**החלקים הקיימים שמקיימים `route` בהרצה:** כולם טבלאות-ניתוב "מפתח ⇒ אחד מתוך מעט, עם ברירת-מחדל".
- `planWord` (חוגים)
- `coinFront/coinBack/coinHTML` (פרנסה, לפי מתכת)
- `editionOf` (פרנסה)
- `advanceStatus` / `statusLabel` (חלוקה)
- `amountInWords` (לפי מטבע)
- `tierAsOf` (הראשי שלו נשאר `tier`)

**למה 6 הפעלים האחרים מוכחים רק על הליבה:** המימושים האמיתיים שלהם לא נכנסו לקטלוג כפונקציות טהורות על נתונים.
- הם טיימרים (`setTimeout`), I/O (localStorage, Firestore, fetch), עוטפים מסדר-גבוה (try/catch סביב פונקציה) או קוד Python/Dart.
- המפקד סימן אותם לא-טהורים, או שהם לא בקבצים שלו.
- **זו בדיוק הסיבה לליבה:** היא הפעולה עצמה, בלי העולם, ועכשיו אפשר לחבר אותה.

**כמה פעמים הודקו החוקים (ביושר):**
- **`route`, הסבב הראשון:** הוא "תפס" 41 חלקים של אורביט — מעצבי-תאריך (`fmtDate` ⇒ `'NaN/NaN'` אחיד לכל זבל) ומחשבי-ציון.
  - נוספו `route.few`, ו"שם-ערוץ = טקסט, לא שארית NaN/Invalid".
  - נשארו 9, כולם באמת טבלאות-ניתוב.
- **`require-source`:** הוא "תפס" את `dropoutInsights`, כי העד נבחר ממקרה שהחוקים לא רצו עליו (עד: כל המקרים; חוקים: 12 הראשונים).
  - תוקן כך שהעד עצמו חייב לעמוד בחוקים.

## 5. מה חסר באמת

- **MMMM:** `add_repo` נדחה בסשן הזה (הריפו פרטי). הלידים `meeting.js` (השהיה 200ms, סבב שסובל כשל) ו-`connecthub-master.js` **לא אומתו**. הם רשומים ב-origins עם `line: null`.
  - `behavior/mmmm.json` **לא הורץ מחדש**, כי בלי שכפול הקורא היה דורס אותו ב-no-clone. 29 החלקים שלו שהורצו לא נבדקו על 7 הפעלים.
- **`backoff`:** אין לו פועל משלו. הוא גדל ונעצר בתקרה — מזכיר `escalate`, אבל ההבדל לא נמדד. נבדק רק ביחידה.
- **`portalChannels` (פיזור לכל הערוצים):** זה **לא** `route`, והמוטנט של `route.one` הוא בדיוק הוא. אם רוצים פועל "מפיץ לכל הערוצים" (fan-out), זה פועל חדש.
- **`staffRoleIn` (כמה תפקידים לאדם):** זה **לא** `assign-role` במובן "תפקיד אחד".
- **ספירת הפעלים:** `verbs.test.ts` דורש ≤ 45 פעלים. הסשן שמוסיף 14 פעלים יצטרך להרים את התקרה.

## 6. הרצה מחדש

```bash
# שכפולים (לא symlink! rolldown נכשל דרך קישור — 14kk יצא not-callable) ב-ref של כל מפקד:
#   ../catsrc/{buildsmart,rings(claude/lab-rings@5805b7f),14kk,yoman,yeshiva}   (mmmm — אין גישה)
node catalog/scripts/core-b-census.mjs                      # sources/core-b.json (+ --check)
CATALOG_SRC=../catsrc node catalog/scripts/behavior-probe.mjs --source orbit,core-b,buildsmart,14kk,yoman-habina,yeshiva,rings,qa-scanner,generator
node catalog/scripts/catalog-build.mjs                      # index/verbs/alphabet (+ --check)
npx vitest run catalog
```

**ה-ref של core-b** = הקומיט האחרון שנגע ב-`catalog/core`. אחרי שינוי בליבה:
1. מקמטים את הליבה.
2. מריצים census, ואחריו probe על core-b, ואחריו build.
3. מקמטים שוב.
