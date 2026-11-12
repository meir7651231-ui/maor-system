# maor-system («מאור החסד» / אורביט) — הוראות לכל סשן

> מצב עדכני, בעיות פתוחות והמשימות הבאות: **`STATUS.md`**.
> ההיסטוריה המלאה של הפיצ'רים (הגרסה הקודמת של הקובץ, כמו שהייתה): `knowledge/CLAUDE-HISTORY-2026-11-03.md`.
> דוחות-סגירה פר-פיצ'ר: `knowledge/CLOSED-*.md` · Runbooks: `knowledge/RUNBOOK-*.md`.

## 🔴 כללי עבודה (חובה)
- **שפה:** כל תשובה, הודעת commit, תיעוד ומחרוזת UI — **בעברית**.
- **סטנדרט: מינימום 100%.** לא אומרים "גמור" בלי הוכחה: בדיקות ירוקות, וכשיש ממשק — צילום מסך / מסע e2e. סטטוס בסוף: מה גמור ומה נשאר.
- **ענפים בלבד.** כל עבודה על ענף `claude/*` של הסשן. עובדים ברציפות על צעדים הפיכים, בלי לעצור לשאול.
- **אסור בלי אישור מפורש של מאיר (הבעלים):** push ל-main · מיזוג PR · פרסום (ריפו ציבורי / רשת / פריסת Functions / Rules) · מחיקה · שליחת מיילים/הודעות · תשלום.
  - push ל-main = **deploy אוטומטי לפרודקשן** (`.github/workflows/deploy.yml`). ה-hook ‏`pre-push` חוסם אותו בלי `.allow_push_main`, וחוסם force-push.
- **PR נפתח כטיוטה** אלא אם ביקשו אחרת. לא ממזגים.
- **גבול תפקיד:** החלטות מס/רו"ח, סיסמאות הצפנה, קונסולות (Firebase/Google/Play) — "חלון-בעלים". מכינים, לא מריצים.
- ארכיטקט? לקרוא קודם את `knowledge/ARCHITECT-LESSONS.md` (לקחים שנלמדו; לקח חדש נוסף שם באותו סשן).
- אחרי שינוי מהותי — לעדכן ידע: דוח `knowledge/CLOSED-<נושא>-<תאריך>.md` + שורה ב-`STATUS.md`.

## 🔴 האינווריאנט העליון — אפס אובדן יכולת
הלקוחות עבדו על הקובץ החי `MaorHachesedCLEANOffline_2.html` (לגאסי, single-file). כל יכולת שלו נשמרת או משודרגת — אין מחיקה.
השאלה תמיד "איך משדרגים", לא "אם להכליל". מקור-האמת להתנהגות: `knowledge/legacy/` (‏`legacy-main-script.js`, `inventory.json`, `gaps.json`);
ניתוח פערים: `knowledge/LEGACY-GAP-2026-07-29.md` (נסגר 129/129 — `CLOSED-P3-2026-07-30.md`). מפתח ה-DB בלגאסי: `maorclean2_db`.
**הלקוח החי לא זז:** כל פיצ'ר חדש additive, מאחורי דגל, ביט-זהה ללקוח הקיים כשהדגל חסר.

## מה המוצר ולמי
מערכת ניהול מלאה לעמותות חסד (הלקוח הראשון: «מאור החסד»), שהפכה לפלטפורמת SaaS white-label בשם **אורביט** לכל ארגון/עסק:
- **משפחות (CRM)** · **חוגים ושיבוצים** · **נוכחות** (מודל הפוך — רושמים רק חיסורים) · **לוח שנה עברי-לועזי** · **יומן חדרים**.
- **תורמים + קבלות מס סעיף 46** (מספור רציף — קריטי!), הוראות-קבע, מעקב-טיפול/סגולת-40-יום, קוקפיט ומודיעין-תורמים.
- **דוחות** · **הגדרות** · מודולים מבודדים: קופות צדקה (`tzedaka`), חנות (`shop`), חלוקה (`shop7`).
- **אתר ציבורי** לארגון (למשל `meorhachessed.com`) + עורך-אתר למנהל.
- **ורטיקלים:** 13 חבילות (עמותות + מסחריות: digital/build/studio) — מונחים, מודולים וזהות חזותית פר-תחום.
- **משתמשים:** מנהלי עמותות ועובדות משרד (בעיקר בעברית, RTL, גם במובייל); מורות (תפקיד מצומצם); בעלי הפלטפורמה (מייל-על).
- כתובת חיה: `orbit-il.com` (ראו "פריסה" למטה). דמו ציבורי: `?org=demo`.

## Stack
React 19 · TypeScript 6 · Vite 8 · Zustand 5 · idb · firebase 12 (נטען ב-dynamic import רק כשמוגדר) · three (chunk נפרד, lazy) · fflate.
בדיקות: Vitest 4 · Lint: oxlint · e2e: Playwright (`playwright-core`, Chromium מותקן מראש) · Rules: אמולטור Firestore.
Node 22 (CI), npm. שרת אופציונלי: `functions/` (Firebase Functions, Blaze).

## פקודות (אומתו בהרצה ב-10.11.2026, על main ‏`2bf6a42`)
```bash
npm ci                 # התקנה (~50 שניות)
npm run typecheck      # tsc -b --noEmit — 0 שגיאות (~30 ש')
npm run lint           # oxlint — יוצא 0; כרגע 290 אזהרות (PR #536 מאפס ומוסיף --deny-warnings)
npm run test           # vitest run — 439 קבצים · 3210 בדיקות ירוקות (~60 ש')
npm run build          # tsc -b && vite build + bundle-budget (תקרת gzip לבנדל הראשי; ~35 ש')
npm run verify:fast    # typecheck → lint → test (לולאת פיתוח)
npm run verify         # verify:fast + build (שער commit מלא)
npm run e2e            # toggle-matrix, 5 פרופילים — דורש build קודם (~2 דק', ירוק)
npm run e2e:verticals  # מטריצת 10 הוורטיקלים (דליפת מונחים)
npm run test:rules     # red-team ל-Firestore Rules באמולטור (דורש Java 21)
npm run dev            # שרת פיתוח Vite
```
סוויטות דפדפן נוספות: `node e2e/demo-walkthrough.mjs` · `node e2e/launch-readiness.mjs` · `node e2e/signup.mjs`.
בדיקות מחוץ ל-vitest: `node telephony/test.mjs` (golden + יחידה, 677 בדיקות).
מריצים אותן בסוף אשכול-עבודה / חבילה, לא על כל commit (חריג: נגעת ב-e2e או בזרימת UI מרכזית).

### שערים מדורגים (Git hooks ב-`.githooks/`, מחומשים ב-`.claude/hooks/session-start.sh`)
- **commit קוד** ⇒ typecheck + lint + test (בלי build); ידע/תיעוד בלבד ⇒ lint מקוצר. (`pre-commit`, `commit-msg`)
- **push** ⇒ build מלא פעם אחת + חסימת main בלי `.allow_push_main` + חסימת force-push. (`pre-push`)
- **CI** (`.github/workflows/ci.yml`): על כל push ל-`claude/**` ועל PR — typecheck/lint/test/build + ג'וב `rules` (אמולטור).

### דפוסי e2e
- כל סקריפט מזריק `maor_org_config` **בלי** `firebase` ל-localStorage לפני הטעינה ⇒ אין מסך התחברות ענן.
- כפתורי הוספה: `➕ הוספת <ישות>` עם מונח דינמי (`termOf`).
- טופס חוג דורש **חדר** — יוצרים חדר דרך הגדרות קודם. מסך החוגים = גריד-כרטיסים (`.card[role=button]`).
- מסעות-הגדרות מקליקים את הלשונית ("📚 נתונים") לפני ייבוא/תקינות.
- מחיקת IndexedDB נחסמת כשהאפליקציה פתוחה — מוחקים מדף אחר באותו origin.

## ארכיטקטורה בקצרה
- **אתר סטטי local-first.** הנתונים אצל הלקוח ב-3 שכבות: localStorage (debounce 500ms) → IndexedDB (+ טבעת 30 צילומים יומיים) → קובצי גיבוי JSON.
- **ענן Firebase = opt-in פר-ארגון.** סנכרון Firestore (diff/merge, מונים רק עולים, מצבות-מחיקה `delLog`). הצפנה במנוחה AES-GCM (envelope, DEK עטוף פעמיים) = opt-in.
- **DB = מסמך יחיד** (`DB_VERSION=6`, `src/types/domain.ts`): seq כללי + `receiptSeq`/`donationSeq` רציפים (R-/D-, קבלות מס) + `shopReceiptSeq` (S-, לא קבלת מס) + 23 מערכי ישויות.
  ישות חדשה ⇒ `ENTITY_COLLECTIONS` (cloud-diff) + `BACKUP_COLLECTIONS` (functions) + `emptyDb` + ריפוי ב-`migrate` (ratchets נועלים).
- **מיגרציה מצטברת אחת:** `src/store/persist.ts` ‏`migrate()` — מרפאת מונים, rid כפולים, רשומות חלקיות מהלגאסי.
- **ניווט:** Zustand, בלי router; מודאלים ב-hash (`#platform`, `#manage`, `#builder`, `#site-edit`).
- **White-label:** `?org=<slug>` → `public/c/<slug>/config.json` (או `platformOrgs/{slug}` בענן, onSnapshot). ~176 דגלי פיצ'ר + ~46 מונחים (`termOf`) + חבילות ורטיקל + ערכות נושא.
- **פלטפורמה (SaaS):** הרשמה (אשף 5 שלבים) → אישור בעלים → מנהל-ארגון → עובדות (`?join=code`). היררכיה: מייל-על → מנהל → עובדת (`effectiveConfigFor`).
  נתוני ארגון-פלטפורמה ב-`orgs/{slug}/`; הלקוח הקיים ב-`cloudRoot:true` (נתיבי-שורש, ביט-זהה). Rules: `firestore.rules`.
- **PWA:** `public/sw.js` שמרני (network-first חוץ מ-`/assets/` מגובבים), מגודר `shell.pwa`. רוצח-ה-SW-הזר ב-`index.html` פוטר את `sw.js` — לא להסיר.
- **שרת אופציונלי** (`functions/`): webhook תשלומים, תורי SMS/מייל, גיבוי לילי, תזכורות, ICS, סנכרון אנשי-קשר — פריסה דרך `deploy-functions.yml` (= פרסום, דורש אישור).

### קבצי ליבה
| קובץ | תפקיד |
|------|--------|
| `src/App.tsx` | שלד: שרשרת שערים (פענוח → ענן → נעילה), מודאלים ב-hash, גיבוי סוף-יום |
| `src/types/domain.ts` | כל מודל הנתונים + `DB_VERSION` |
| `src/types/features.ts` | דגלים + מונחים (`optIn:true` לפיצ'ר opt-in) |
| `src/store/useApp.ts` | ה-store היחיד — כל פעולות העסקים (~4,500 שורות) |
| `src/store/persist.ts` | התמדה 3 שכבות + `migrate()` + שער ריבוי-טאבים |
| `src/store/cloudSync.ts` + `src/lib/cloud*.ts` | סנכרון Firestore + הצפנת ענן |
| `src/lib/config.ts` | טעינת OrgConfig, `featureOn` / `termOf` / `moduleOn` / `integrationOn` |
| `src/lib/hebrew.ts` + `hebdate.ts` | לוח עברי מלא על `Intl` בלבד |
| `src/lib/receipt.ts` + `hebrewNumber.ts` | קבלות §46 (טקסט/PDF) + סכום במילים |
| `src/lib/crypto.ts` + `lock.ts` | הצפנה (PBKDF2) + נעילת PIN + הגבלת קצב |
| `src/components/ui.tsx` | ערכת UI משותפת (Modal עם focus-trap, Field נגיש) |
| `src/components/<מודול>/` | רכיבי המודול + `lib.ts` טהור |

## מוסכמות
- **הפרדת טוהר:** כל מודול = `lib.ts` טהור (בלי store/DOM, בלי `Date.now` — "היום" מוזרק) + רכיבים. הלוגיקה נבדקת ביחידה.
- **בדיקות ratchet:** כל באג שתוקן מקבל בדיקת שימור עם תיאור הבאג בעברית. יש גם "הגנות-מקור" (`?raw` + regex על JSX).
- **חוזה הדגלים:** מפתח חסר = פעיל, רק `false` מכבה (`featureOn`).
  - **חריג opt-in:** פיצ'ר שאסור שיידלק ללקוח החי ⇒ בדיקה `=== true` + `optIn:true` בהגדרת הדגל + רישום ב-`OPT_IN_KEYS` (`src/components/builder/__tests__/optin-keys.ts`) — לא `featureOn`.
  - **הרחבות** (`integrationOn`) — הפוך: חסר = כבוי.
  - דגל שמסתיר יכולת — אומרים זאת על המסך (לא מסתירים בשקט).
- **מחרוזות UI** עוברות `termOf`; מסך-רשימה חדש = `useRemembered` (זיכרון סינון) + `useListScrollRestore`.
- **תאריכים:** תמיד ISO לועזי ב-DB; פרסור עם `T12:00:00`; `isoToday` מ-date-util, לא `toISOString`.
- **כסף וקבלות:** מספור R-/D- רציף ולא נשבר; שער-סכום לפני צריכת מונה; מודולים מבודדים (קופות/חנות/חלוקה) לא נוגעים בקבלות.
- **ענן:** כתיבת קונפיג = רק מה שהשתנה (`patchOrgCloudConfig` ב-`src/lib/cloudConfig.ts`, `deleteField`) — לעולם לא תצלום מלא ולא `merge:true` עם מחיקת מפתח.
- **zustand:** אין `?? []` בתוך סלקטור (React #185).
- **קומיטים:** קידומות עבריות — `מנוע ·` / `תיקון ·` / `שדרוג ·` / `ביצועים ·` / `ידע ·` / `חנות ·` / `גל N ·`.

## פריסה ואימות
- `deploy.yml` (על push ל-main) ⇒ `meir7651231-ui.github.io/maor-system/` מיידית.
- **הכתובת החיה `orbit-il.com` מוגשת מריפו נפרד `meir7651231-ui/orbit-il`** (workflow שבונה מ-main של מאור) — רץ ב-cron יומי 03:00 UTC או ידנית.
  ⇒ הלקוח החי מפגר עד 24 שעות אחרי מיזוג. **אימות פריסה = `curl https://orbit-il.com/version.json`** (ה-hash התחלף), לא github.io.
- לקח-תשתית: ה-git-proxy מחזיר לעיתים ref ישן של main — fetch עם retry עד ש-`git merge-base --is-ancestor` מאשר.
