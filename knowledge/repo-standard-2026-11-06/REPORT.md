# סדר והצגת הריפו — 2026-11-06

ענף `claude/repo-standard`. היקף: הצגה וסדר בלבד — אפס שינוי בקוד-מוצר או ב-UI.

## מה נוסף / שודרג
- `README.md` (עברית, ראשי) + `README.en.md` (אנגלית) עם מתג-שפה, hero, תגיות, משפט-מפתח, ניווט-עוגנים, הבעיה / איך זה עובד / מה יש בפנים / הרצה / מבנה / שאלות / סטטוס. שם הלקוח הוסר מה-README הקודם; התוכן השימושי (ארכיטקטורה, פקודות, הנחיות-שמירה) נשמר.
- `assets/`: `hero.svg`, `hero.en.svg`, `how.svg`, `how.en.svg` (מקוריים, צבעי אורביט: ‎#0d1120 / ‎#47bfff / ‎#f3c76b / ‎#b9a7ff), `social.png` ‏1280×640.
- `CHANGELOG.md` (לפי חודש, מתוך git log ודוחות-הסגירה), `SECURITY.md`, `STATUS.md`.
- צילומי לפני/אחרי של ה-README: בתיקייה זו.

## אומת
- כל טענה ב-README נבדקה מול הקוד: 13 חבילות-תחום (`VERTICAL_PACKS`), 4 ערכות נושא, AES-GCM + PBKDF2 (`src/lib/crypto.ts`), לוח עברי על Intl (`src/lib/hebrew.ts`), Functions (`functions/index.js`), `base: './'`.
- `npm run dev` עלה (200) ו-`/c/demo/config.json` מוגש; `npm run verify` ירוק.

## להכרעת הבעלים (לא נגעתי)
- **LICENSE — חסר** (במכוון לא נוסף).
- `public/c/maor-hachesed/` — קונפיג של לקוח בתיקייה ציבורית בריפו ציבורי.
- `deploy/cloudflare/meorhachessed-site.worker.js` — שם הלקוח בשם הקובץ.
- `public/orbit/orbit-logo.png` — סימן-מים "CapCut AI" בפינה.
- `public/orbit/orbit-news.20260818.html` — עותק מתוארך לצד `orbit-news.html`.
- `telephony/` — 10 דוחות `CLOSED-*`/`BUILD-*` לצד הקוד (אפשר להעביר ל-`knowledge/`).
- `.gitignore` — 12 שורות נפרדות לתיקיות-צילומים ב-`e2e/`; אפשר לאחד ל-`e2e/shots*/`.
- `package.json` — `"name": "maor"`, `"version": "0.0.0"`.

---

# סבב ב׳ — 2026-11-06

המטרה: אותה רמת הצגה כמו ריפו-הייחוס. נוספו הוכחה חזותית אמיתית, hero שמראה את המוצר בפעולה, עוד SVG-ים, סעיף "מה זה לא עושה", CHANGELOG לפי אבני-דרך וסידור השורש. כל זה בלי לפגוע בכלום.

## מה נוסף
- **הוכחה חזותית אמיתית:** `assets/screens/{calendar,families,courses,diary}.png`, צולמו ב-Playwright עם `deviceScaleFactor: 2`, וגם `assets/demo.gif` (‏15 שניות, 218KB). הכול מ-`?org=demo` בלבד: `public/c/demo` בלי firebase, ונתונים מומצאים מ-`scripts/make-demo.mjs`. צילומי הבית והתורמים לא נכללו, כי מופיעים בהם סכומים (מומצאים, אבל העדפתי להשמיט).
- **hero חדש:** `assets/hero.png` ו-`hero.en.png`. זה צילום אמיתי של לוח השנה העברי בדמו, בתוך מסגרת-דפדפן, עם זהות אורביט. ה-hero הקודם (SVG מופשט) הועבר ב-`git mv` ל-`assets/social.svg` / `social.en.svg`, כמקור הכרטיס `social.png`.
- **8 SVG חדשים** (4 סוגים × 2 שפות): `beforeafter`, `modules`, `numbers`, `install`. סך הכול 12 SVG ב-`assets/`.
- **המספרים** נמדדו מהקוד ב-2026-11-06: ‏3,173 בדיקות ב-434 קבצים (`npm run verify`), ‏328 דגלים (`FEATURES`), ‏46 מונחים (`TERM_DEFS`), ‏13 חבילות (`VERTICAL_PACKS`), ‏4 ערכות (`THEME_LABELS`), ‏23 סוגי ישויות (`ENTITY_COLLECTIONS`).
- **"מה זה לא עושה"** בשני ה-README-ים. כל סעיף אומת: אין סליקה (`lib/payLink.ts`, ה-webhook רק רושם), אין MFA (`signInWithEmailAndPassword` בלבד ב-`lib/cloud.ts`), ואין מתג-שפה לאפליקציה (`uiLang` קיים רק ב-`PublicSite`).
- **CHANGELOG** נבנה מחדש כטבלת אבני-דרך מתוארכות מ-`git log origin/main`: ‏1,164 קומיטים מ-2026-07-22.

## סידור השורש — 0 הזזות (במכוון)
בשורש יש 31 פריטים במעקב. לכל אחד נבדקו הפניות עם `git grep -l -F`:

- 0 הפניות: `.gitignore`, `.oxlintrc.json`, `firebase.json`, `tsconfig.json`, `STATUS.md`. ארבעת הראשונים הם קונפיגים שהכלים קוראים במיקום קבוע (git, oxlint, firebase CLI, `tsc -b`), ולכן אסור להזיז. `STATUS.md` נשאר בשורש לפי מוסכמת-הצוות.
- כל השאר מופנים: `src`=205, `e2e`=127, `public`=101, `telephony`=87, `index.html`=75, `functions`=54, `knowledge`/`CLAUDE.md`=47, `deploy`=45, `firestore.rules`=36, `.github`=18, `scripts`=8, `.githooks`=5, `vite.config.ts`/`package.json`/`.claude`=4 ועוד. כולם ברשימת האסור-להזיז.
- המסקנה: אין מה להזיז בלי לסכן את ה-build, ה-CI, ה-hooks או הפריסה. שתי ההזזות היחידות הן בתוך `assets/` (hero.svg ⇒ social.svg), על קבצים שנוספו בסבב א׳.

## הוכחה שלא נפגע כלום
- `npm run verify` לפני (main ‏`0f33b41`): ‏434 קבצים, 3,173 בדיקות, ירוק. אחרי (הענף): ראו את גוף ה-PR.
- **build של main מול build של הענף: זהים 209/209** אחרי נירמול content-hash ו-build-id (`version.json`). שני ה-build-ים רצו מאותו `node_modules`.
