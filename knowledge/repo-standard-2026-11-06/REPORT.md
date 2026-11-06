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
