# maor-system («מאור החסד») — הוראות לכל סשן

## ⚠️ כללי עבודה
- **אין push ל-main ללא אישור מפורש** — push ל-main מפעיל אוטומטית deploy לפרודקשן (gh-pages) דרך `.github/workflows/deploy.yml`.
- ענף העבודה הנוכחי: **`claude/what-do-you-see-bcxttj`** (משימת המעבר מהקובץ החי). כל עבודה על ענף `claude/*` של הסשן.
- **סוכן ידע:** לפני כל עבודה — לקרוא את `knowledge/HANDOFF-ARCHITECT-2026-07-29.md` (מסמך המשימה הראשי) ואת `knowledge/ANALYSIS-2026-07-29.md`. אחרי שינוי מהותי — לעדכן את הידע (דוח חדש ב-`knowledge/` או עדכון הקובץ הקיים).

## 🔴 הקובץ החי של הלקוחות (הלגאסי)
הלקוחות עובדים היום על `MaorHachesedCLEANOffline_2.html` — single-file שהתפתח **אחרי** הפורט ל-React. לפני כל החלטת פיצ'ר:
1. `knowledge/LEGACY-GAP-2026-07-29.md` — ניתוח פערים מלא (מה חסר/שונה ב-React מול הקובץ החי) + סדר עבודה מומלץ.
2. `knowledge/legacy/legacy-main-script.js` + `legacy-markup.html` — קוד הלגאסי המחולץ (מקור האמת להתנהגות).
3. `knowledge/legacy/inventory.json` + `gaps.json` — 199 פיצ'רים ממופים עם סטטוס פר-פיצ'ר.

**האינווריאנט העליון — אפס אובדן יכולת:** כל יכולת של הקובץ החי או נשמרת או משתדרגת. אין מחיקה. השאלה תמיד "איך משדרגים", לא "אם להכליל".

**נקודות מפתח מהפער:** מפתח ה-DB בלגאסי הוא `maorclean2_db` (מעבר נתונים = גיבוי+ייבוא); ללגאסי יש `Supporter.hist[]`, גיליון עיניים round-trip, role מנהל/מורה, punchConfirm — שאין ב-React; סף "סיכון" בלגאסי 500 מול 300 ב-React; כרטיס המשפחה בלגאסי מאפשר ניקוב/חיסור/ניהול שיבוץ ישירות; הלוח נפתח בגריד עברי.

## מה זה
מערכת ניהול מלאה לעמותה: משפחות (CRM), חוגים ושיבוצים, נוכחות (מודל הפוך — רושמים רק חיסורים), לוח שנה עברי-לועזי, יומן חדרים, תורמים + קבלות סעיף 46, דוחות, הגדרות.

- **סטאק:** React 19 + TypeScript + Vite 8 + Zustand. תלויות ריצה: react, react-dom, zustand, idb, firebase (נטען dynamic-import רק כשמוגדר).
- **ארכיטקטורה:** אתר סטטי local-first. הנתונים אצל הלקוח ב-3 שכבות: localStorage (debounce 500ms) → IndexedDB (+ טבעת 30 צילומים יומיים) → קובצי גיבוי JSON. ענן Firebase = opt-in פר-ארגון. הצפנה במנוחה AES-GCM (envelope, DEK עטוף פעמיים) = opt-in.
- **White-label אמיתי:** `?org=<slug>` → `public/c/<slug>/config.json`. ‏73 דגלי פיצ׳ר + 33 מונחים (termOf) + 8 חבילות ורטיקל + 4 ערכות נושא. חוזה הדגלים: מפתח חסר = פעיל, רק false מכבה.
- **DB:** מסמך יחיד (DB_VERSION=5) — seq כללי + receiptSeq/donationSeq נפרדים ורציפים (קבלות מס!) + 7 מערכי ישויות. מיגרציה מצטברת אחת ב-`src/store/persist.ts` (מרפאת מונים, rid כפולים, מזהי members).

## Dev loop — שערים מדורגים לפי רדיוס הפגיעה
```bash
npm ci
npm run verify:fast   # לולאת פיתוח: typecheck → lint → test (בלי build)
npm run verify        # שער commit: + build. נאכף אוטומטית ב-.githooks/pre-commit
npm run e2e           # toggle-matrix — 5 פרופילים (דורש build קודם)
node e2e/demo-walkthrough.mjs      # מעבר דמו + צילומים
node e2e/launch-readiness.mjs      # מסעות משתמש, אפס שגיאות קונסולה
```
- **כל commit קוד** ⇒ verify מלא (ה-hook אוכף); commit ידע/תיעוד בלבד ⇒ lint מקוצר.
- **שלוש סוויטות הדפדפן** ⇒ בסוף כל אשכול-עבודה ובסוף חבילה — לא על כל commit (חריג: נגעת ב-e2e/זרימת UI מרכזית).
CI: `ci.yml` מריץ את השער המלא על כל push לענף claude/*; deploy מ-main בלבד.
סביבה מתאתחלת לבד בסשן web: `.claude/hooks/session-start.sh` (כולל חימוש ה-hooks).

### דפוסי e2e (baseline ירוק 2026-07-29)
- כל סקריפט מזריק `maor_org_config` **ללא** `firebase` ל-localStorage לפני הטעינה (ענן כבוי ⇒ אין מסך התחברות).
- כפתורי הוספה: `➕ הוספת <ישות>` עם מונח דינמי (`termOf`) — לא "X חדש".
- טופס חוג דורש **חדר** (שדה חובה) — הסקריפטים יוצרים חדר דרך הגדרות קודם.
- מחיקת IndexedDB נחסמת כשהאפליקציה פתוחה — מוחקים מדף אחר באותו origin (launch-readiness, מסע 3).

## קבצי ליבה
| קובץ | תפקיד |
|------|--------|
| `src/App.tsx` | שלד: ניווט Zustand (בלי router), שרשרת שערים (פענוח→ענן→נעילה), מודלים ב-hash, גיבוי סוף-יום |
| `src/types/domain.ts` | כל מודל הנתונים + DB_VERSION |
| `src/types/features.ts` | 73 דגלים + 33 מונחים |
| `src/store/useApp.ts` | ה-store היחיד — כל פעולות העסקים (1,154 שורות) |
| `src/store/persist.ts` | התמדה 3 שכבות + migrate() + שער ריבוי-טאבים |
| `src/store/cloudSync.ts` + `src/lib/cloud*.ts` | סנכרון Firestore (diff/merge, הענן מנצח, מונים רק עולים) |
| `src/lib/hebrew.ts` + `hebdate.ts` | לוח עברי מלא על Intl בלבד (סריקה הפוכה ~440 ימים), דין אדר ב-hebAnnualEq |
| `src/lib/config.ts` | טעינת OrgConfig, featureOn/termOf/moduleOn |
| `src/lib/crypto.ts` + `lock.ts` | הצפנה (PBKDF2 210K) + נעילת PIN דו-שכבתית (localStorage מקומי במכוון) |
| `src/components/ui.tsx` | ערכת UI משותפת (Modal עם focus-trap, Field נגיש) |

## מוסכמות הפרויקט
- **הפרדת טוהר:** כל מודול = `lib.ts` טהור (בלי store/DOM) + רכיבים. הלוגיקה נבדקת ביחידה.
- **בדיקות ratchet:** כל באג שתוקן מקבל בדיקת שימור עם תיעוד הבאג בעברית. יש גם "הגנות-מקור" (`?raw` + regex על JSX) ובדיקות cross-surface.
- **תאריכים:** תמיד ISO לועזי ב-DB; פרסור עם `T12:00:00` (צהריים מקומי); `isoToday` מ-date-util ולא toISOString.
- **קומיטים:** קידומות עבריות — `מנוע ·` / `פער N ·` / `שדרוג ·` / `תיקון ·` / `גל N ·`.
- מחרוזות UI עוברות `termOf`; פיצ׳רים מגודרים `featureOn`; כיבוי מודול-אב משורשר אוטומטית רק ברמת קידומת ראשונה (תת-דגלים = קונבנציה בקומפוננטות).

## ⚠️ באגים ידועים שטרם תוקנו (במכוון — ממתין לאישור המשתמש)
1. ~~🔴 `src/lib/hebrewNumber.ts:41` — סכום-במילים שגוי לאלפים עגולים 11K–999K~~ **תוקן 2026-07-29 (P1-א׳1)** — כולל אותו דפוס במיליונים; ratchet מלא.
2. ~~🔴 `e2e/launch-readiness.mjs` — נתיב קשיח~~ **תוקן 2026-07-29** (נתיב יחסי + כל הסוויטה ירוקה).
3. 🟠 ~10 מפתחות localStorage עוקפים את בידוד ה-namespace הרב-ארגוני (maor_lock, maor_autoexp, maor_cashbox_* ועוד).
4. 🟠 העותק בענן נשמר plaintext גם כשההצפנה דלוקה; אין Firestore Rules בריפו.
5. ~~🟠 DonationModal/ManageModal מורידים קבלה גם כשה-store דחה~~ **תוקן 2026-07-30 (P1-א׳2)** — {ok,rid} מה-store, אפס ניחוש rid ב-UI.
6. ~~🟠 ניקוי dueDate/nextDate משאיר אירוע יתום בלוח~~ **תוקן 2026-07-30 (P1 פער 12)** — unlinkEvent משותף.

הרשימה המלאה (2 חמורים, ~22 בינוניים, ~40 קלים) + המלצות מתועדפות: **`knowledge/ANALYSIS-2026-07-29.md`**.
