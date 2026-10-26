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
- **באוויר 26.10.2026** (אישור-בעלים «כן תעלה ותחבר»): main ‏`a1b438d` ⇒ github.io. ‏Worker ‏`meorhachessed-site` (proxy שקוף ל-`meir7651231-ui.github.io/maor-system/`, מתקן Location) + Custom Domains ל-meorhachessed.com ול-www (DNS+SSL אוטומטיים של Cloudflare). מתעדכן מיד במיזוג ל-main — **לא** תלוי ב-cron היומי של orbit-il. orbit-il.com לא נגע.
- אומת חי: 24/24 בקשות 200 (שורש+www), דפדפן דסקטופ+מובייל ⇒ האתר של מאור, «כניסה למערכת» ⇒ https://orbit-il.com/?org=maor-hachesed, 0 שגיאות. (522 חד-פעמי בדקה הראשונה = הפצת-הדומיין.)
- ⚠️ נצפה במובייל (קיים-מלפני, לא מהשינוי): קישורי-הניווט העליון נחתכים ברוחב 390px.

## עריכת-התוכן
כמו היום: אשף ⇒ `config.json` ⇒ `public/c/maor-hachesed/config.json` ⇒ main.
