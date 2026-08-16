# CLOSED · אתר-ציבורי (דף-תרומות) pixel-perfect — 2026-08-16

**ענף:** `claude/what-do-you-see-bcxttj` · **קומיט:** `שדרוג · אתר-ציבורי pixel-perfect לפי design_handoff (Chesed Landing)`

## מה נבנה
אתר-נחיתה/תרומות ציבורי לעמותה, **מוזן ישירות מ-`config.site`** (אין CMS, אין תוכן קשיח),
שחזור High-Fidelity של העיצוב שסופק (design_handoff «Chesed Landing») — **פיקסל-פרפקט**
לכל 15 הסקשנים, לפי הדרישה «לא לשנות מילימטרה בסגנון עיצוב» + «תרוץ עד שזה מאופס».

### ארכיטקטורה (נשמרה מהשלב הקודם)
- **שער ב-`App.tsx`** לפני שער-הענן/ההצפנה/הנעילה: מבקר אנונימי לא צריך חשבון.
  מגודר `publicSiteOn(config)` = `featureOn('shell.publicsite') && !!config.site && enabled!==false`,
  ונפתח ב-`?site` או `#site`. «כניסה למערכת» מנקה את הבקשה וממשיך לשרשרת-השערים.
- **מקור-אמת יחיד:** `config.site` (טיפוס `PublicSiteContent`), מחוטא ב-`normalizeSite`
  (allowlist מלא · https-בלבד דרך `safeHttpsUrl` · תקרות-אורך · בלי HTML גולמי).
- **רב-לשוני:** `LocalizedText = string | {he,en,yi}`; `resolveLocalized` נופל לעברית;
  he/yi=RTL, en=LTR. הרכיב מזהה `siteLangs(config.site)`.
- **גופנים מדויקים** (self-hosted, אפס CDN): Varela Round (כותרות) · Assistant (גוף) ·
  Rubik (מספרים tnum) · Playpen Sans Hebrew (קיקרים/ציטוטים). `public-site-fonts.css` +
  18 woff2 (‏412KB) ב-`src/components/public/fonts/`.
- **וידאו-hero** מבונדל `src/components/public/assets/hero.mp4` (‏2.4MB). ⚠️ בכרומיום
  headless h264 לא מפוענח ⇒ הריבוע לבן בצילום; בדפדפן-אמת מתנגן.

### הסקשנים (כולם inline-styled מדויק, config-driven)
1. **ניווט** — לוגו 3-עיגולים (לב פועם `ps-beat`), קישורים, בורר-שפה, כפתור-פיל-גרדיאנט.
2. **HERO** — צ׳יפ-טיקר + heroBadge · H1 «heroTitle» + מילה-מתחלפת (`ps-pop`) + קו-יד-מצויר
   SVG (`ps-draw`) · tagline · CTA כפול · מיקרו-קופי + חץ-יד · וידאו leaf-radius + כרטיס-מרחף.
3. **מרקיזה** — ♡-מופרד, `ps-marq` 30s.
4. **עמודי-תווך** — גריד 3-טורים, עיגולי-אייקון 84px (`ps-float`), אמוג'י-קונפיג בצ׳יפ.
5. **מספרים** — רצועת-קורל 135° + 4 כרטיסי-זכוכית (count-up IntersectionObserver 1.5s) +
   **גרף-צמיחה** (polyline + area + נקודת-קצה פועמת + delta), מ-`site.growth.points[0..1]`.
6. **אמון/שקיפות** — 4 מדליוני-92px (מגן/46/עמודות/כוכב), מ-`transparency.badges`.
7. **סיפור** — כרטיס-מייסד (leaf-radius) + ציטוט-overlay + **ציר-זמן** (נקודות+קו), מ-`founder`+`timeline`.
8. **מחשבון** — כרטיס 2-טורים, סליידר 18–1000, 2 כרטיסי-השפעה (ארוחות ‎/₪9‎, סלים ‎/₪90‎).
9. **בוחר-תרומה** — מצב חודשי/חד-פעמי · סכומים 50/180/360/720 + «סכום אחר» ·
   **אמצעי-תשלום** (`paymentMethods`, ltr לצ׳קים) · פאנל-התקדמות-חי (raised/goal/pct/ימים).
10. **חדשות+אירועים** · **עדויות** (3) · **מסלולים** (tiers) · **שאלות** (`<details>` נייטיב) ·
    **קשר** (טופס 2-טורים → wa/mailto + פאנל-פרטים phones/whatsapp/hours/email/address/taxNote) ·
    **קריאה-אחרונה** (gradient panel + 3-עיגולים) · **ניוזלטר** · **פוטר**.

### שדות-קונפיג חדשים (`PublicSiteContent`)
`brandLine` · `storyTitle` · `storyTitleAccent` · `storyBadge` · `founder{name,quote,photo}` ·
`timeline[{year,title,note}]` · `growth{label,delta,points[]}` · `paymentMethods[{label,detail,ltr}]` ·
`donateNote` · `transparency.badges[]` · `contact.hours` · `contact.taxNote`.
כולם מחוטאים ב-`normalizeSite` (תקרות-אורך, https-בלבד לתמונות, points נחתך ל-0..1, דורש ≥2).

### תנועות
`ps-beat` · `ps-pop` · `ps-float` · `ps-draw` · `ps-marq` (זהות ל-p-* של העיצוב) —
מוגדרות ב-`public-site.css`, **מכבדות `prefers-reduced-motion`** (עצירת-inline דרך
`[style*="ps-float"]{animation:none!important}` ועוד). קנבס-חלקיקים (46, ‎~22% לבבות) +
זוהר-עכבר + פס-גלילה = hooks ב-rAF יחיד, מדולגים ב-reduced-motion.

### קונפיגים מולבשים
- `public/c/maor-hachesed/config.json` — תוכן-העיצוב המדויק (מרים לוצקין · ציר 2002–2026 ·
  מזרחי-טפחות · Monsey · badges · growth). ⚠️ **נותר לבעלים:** טלפונים/וואטסאפ/מייל/URL-תרומה
  אמיתיים + מס׳-עמותה + פרטי-בנק (כרגע placeholders «000»/«580XXXXXX» כמו בעיצוב).
- `public/c/demo/config.json` — showcase מלא (‎?org=demo&site‎).

### שערים
typecheck ✓ · lint ✓ · **1569 tests ✓** (‏publicSite ‏17→23: +6 חיטוי-שדות-חדשים +
הגנות-מקור: founder/timeline/growth/paymentMethods/badges מוזנים-קונפיג, ps-beat/ps-draw נשמרים) ·
build ✓ · launch-readiness 14/14 ✓ · demo-walkthrough 100/100 ✓.
**האפליקציה הראשית לא זזה** — האתר-הציבורי מאחורי `?site` בלבד.

### כלי-פיתוח
`scripts/shot-site.mjs` — צילום-מסך לאתר-הציבורי (playwright-core + שרת-סטטי מ-dist;
‏`ORG=<slug> DEPTHS="0,900,..." node scripts/shot-site.mjs`).

## נותר (roadmap, מוגדר-היקף-עתידי)
- גלריית-תמונות אמיתית (`site.gallery` https) — כרגע ריק ⇒ הסקשן מדולג.
- שותפים (`site.partners`) — נתמך בטיפוס, לא בעיצוב הנוכחי.
- החלפת ה-placeholders של הבעלים (טלפון/בנק/מס׳-עמותה) בנתונים אמיתיים.
