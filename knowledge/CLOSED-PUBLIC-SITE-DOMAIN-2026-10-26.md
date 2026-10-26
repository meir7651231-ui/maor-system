# CLOSED · דומיין-ציבורי לארגון (meorhachessed.com) — 26.10.2026

**הכרעת-בעלים:** "המשרד של מאור אצלנו; האתר-לציבור על הדומיין החדש, ומנהלים אותו דרך האשף." כפתור «כניסה למערכת» נשאר — ומוביל למשרד אצלנו.

## מה נבנה (ענף `claude/public-site-domain-261026`)
- `src/lib/siteDomains.ts` (טהור): `SITE_DOMAINS` — דומיין ⇒ `{slug, officeUrl}`. לקוח חדש = שורה אחת. ‏`siteDomainOf` מנרמל www/אותיות/פורט/נקודה-סופית; מארח אחר ⇒ null ⇒ ביט-זהה.
- `loadOrgConfig`: ‏`orgSlugFromUrl() ?? currentSiteDomain()?.slug` — ‏?org= גובר.
- `App.tsx`: בדומיין — האתר-הציבורי נפתח בלי ‎?site‎; "כניסה למערכת" ⇒ `officeUrl` (‏orbit-il.com/?org=maor-hachesed).
  **למה לא משרד על הדומיין:** localStorage/IndexedDB ואישור-ההתחברות של Firebase קשורים למארח ⇒ משרד על הדומיין היה נפתח ריק.
- ratchet: `src/lib/__tests__/site-domains.test.ts` (6; מוטציה אומתה — הסרת `|| !!siteDomain` ⇒ אדום).
- אימות-דפדפן: מארח meorhachessed.com (host-resolver) ⇒ האתר של מאור; לחיצת-כניסה ⇒ https://orbit-il.com/?org=maor-hachesed; localhost ⇒ אורביט כמו היום; 0 שגיאות.
- שער מלא: `npm run verify` ירוק — 424 קבצים · 3,073 בדיקות · build.

## Cloudflare (חשבון הבעלים)
- הדומיין `meorhachessed.com` רשום ב-Cloudflare Registrar (עד 26.10.2027, חידוש-אוטומטי), zone פעיל Free, ‏0 רשומות DNS ב-26.10.
- תוכנית: Worker על meorhachessed.com + www שמגיש מ-`meir7651231-ui.github.io/maor-system/` (מתעדכן מיד במיזוג ל-main; orbit-il.com לא נוגע). **ממתין:** מיזוג הענף ל-main (אישור-בעלים) — לפני כן הדומיין היה מציג את שורש-אורביט.

## עריכת-התוכן
כמו היום: אשף ⇒ `config.json` ⇒ `public/c/maor-hachesed/config.json` ⇒ main.
