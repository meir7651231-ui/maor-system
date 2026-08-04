# maor-system («מאור החסד») — הוראות לכל סשן

## ⚠️ כללי עבודה
- **אין push ל-main ללא אישור מפורש** — push ל-main מפעיל אוטומטית deploy לפרודקשן (gh-pages) דרך `.github/workflows/deploy.yml`.
- ענף העבודה הנוכחי: **`claude/what-do-you-see-bcxttj`** (משימת המעבר מהקובץ החי). כל עבודה על ענף `claude/*` של הסשן.
- **סוכן ידע:** לפני כל עבודה — לקרוא את `knowledge/HANDOFF-ARCHITECT-2026-07-29.md` (מסמך המשימה הראשי) ואת `knowledge/ANALYSIS-2026-07-29.md`. אחרי שינוי מהותי — לעדכן את הידע (דוח חדש ב-`knowledge/` או עדכון הקובץ הקיים).
- **🔴 ארכיטקט? קרא קודם את `knowledge/ARCHITECT-LESSONS.md`** — 17 לקחים שנלמדו בדם (אימות-לפני-טענה, מיפוי ענפים לפני היכרות, ליעוס פקודות, שערים מדורגים, גבולות תפקיד). לקח חדש נוסף שם באותו סשן שבו נלמד.

## 🔴 הקובץ החי של הלקוחות (הלגאסי)
הלקוחות עובדים היום על `MaorHachesedCLEANOffline_2.html` — single-file שהתפתח **אחרי** הפורט ל-React. לפני כל החלטת פיצ'ר:
1. `knowledge/LEGACY-GAP-2026-07-29.md` — ניתוח פערים מלא (מה חסר/שונה ב-React מול הקובץ החי) + סדר עבודה מומלץ.
2. `knowledge/legacy/legacy-main-script.js` + `legacy-markup.html` — קוד הלגאסי המחולץ (מקור האמת להתנהגות).
3. `knowledge/legacy/inventory.json` + `gaps.json` — 199 פיצ'רים ממופים עם סטטוס פר-פיצ'ר.
4. `knowledge/CLOSED-P2-2026-07-30.md` — דוח סגירת P2 (פערים 19–33) + מעבר 199/199.
5. `knowledge/CLOSED-P3-2026-07-30.md` — **סגירה מלאה 129/129** (53 present · 76 closed · 0 פתוחים); תפקיד מורה (shell.roles), armDel, קיצורים — כולם מאחורי דגלים.

**האינווריאנט העליון — אפס אובדן יכולת:** כל יכולת של הקובץ החי או נשמרת או משתדרגת. אין מחיקה. השאלה תמיד "איך משדרגים", לא "אם להכליל".

**נקודות מפתח מהפער:** מפתח ה-DB בלגאסי הוא `maorclean2_db` (מעבר נתונים = גיבוי+ייבוא); ללגאסי יש `Supporter.hist[]`, גיליון עיניים round-trip, role מנהל/מורה, punchConfirm — שאין ב-React; סף "סיכון" בלגאסי 500 מול 300 ב-React; כרטיס המשפחה בלגאסי מאפשר ניקוב/חיסור/ניהול שיבוץ ישירות; הלוח נפתח בגריד עברי.

## מה זה
מערכת ניהול מלאה לעמותה: משפחות (CRM), חוגים ושיבוצים, נוכחות (מודל הפוך — רושמים רק חיסורים), לוח שנה עברי-לועזי, יומן חדרים, תורמים + קבלות סעיף 46, דוחות, הגדרות.

- **סטאק:** React 19 + TypeScript + Vite 8 + Zustand. תלויות ריצה: react, react-dom, zustand, idb, firebase (נטען dynamic-import רק כשמוגדר).
- **ארכיטקטורה:** אתר סטטי local-first. הנתונים אצל הלקוח ב-3 שכבות: localStorage (debounce 500ms) → IndexedDB (+ טבעת 30 צילומים יומיים) → קובצי גיבוי JSON. ענן Firebase = opt-in פר-ארגון. הצפנה במנוחה AES-GCM (envelope, DEK עטוף פעמיים) = opt-in.
- **White-label אמיתי:** `?org=<slug>` → `public/c/<slug>/config.json`. ‏116 דגלי פיצ׳ר + 43 מונחים (termOf) + 10 חבילות ורטיקל (מטריצת-מודולים מפורשת + ratchet כיסוי-מלא — PLATFORM) + 4 ערכות נושא. חוזה הדגלים: מפתח חסר = פעיל, רק false מכבה.
- **פלטפורמת SaaS (CLOUD2):** הרשמה→אישור→עריכה-חיה→"יש לו אתר". ארגון-פלטפורמה = נתונים ב-`orgs/{slug}/` וקונפיג חי ב-`platformOrgs/{slug}` (onSnapshot — מתג אצל הבעלים ⇒ אצל הלקוח בלי רענון; מטמון `maor_cloudcfg:{slug}`); בקשות ב-`platformRequests/{uid}`; לוח הבקרה `#platform` (מיילי-על — SUPER_ADMIN_EMAILS); שער-חברות (לא-חבר ⇒ מסך המתנה); לידה all-off. **הלקוח הקיים לא זז:** `cloudRoot:true` = נתיבי-שורש ביט-זהה (ratchet); אתר-השורש (default) פטור מהשער. Rules v2 בריפו — ממתין לפרסום הבעלים. דוח: `knowledge/CLOSED-CLOUD2-2026-07-30.md`.
- **היררכיית ניהול 3 שכבות (ORGADMIN, 3.8.2026):** מייל-על → מנהל-ארגון → עובדות. הבעלים ממנה מנהל באישור (`PlatformPanel` שדה מייל-מנהל → `platformOrgs/{slug}.manager`+members). המנהל מקבל **אשף ייחודי** (`ManagerPanel`, `#manage`, מגודר `cloud.isManager`) — **מצומצם ל-`orgEnabledModules`** (רק מה שהבעלים הדליק, הכרעת-בעלים "רק הכפתורים שאני הדלקתי"): מתג הרשמת-עובדים + קישור-הזמנה (`?join=code`) + אישור/דחיית בקשות (`platformOrgs/{slug}/joinRequests/{uid}`) + **כרטיס-עובד** (`memberConfigs[email]` — הדלקה/כיבוי **מודולים ותת-דגלים** פר-מייל דרך אותו אשף; `orgEnabledModules`/`orgEnabledFeatures` = תקרת-הבחירה של המנהל). כניסה: צ׳יפ **👥 ניהול העובדות** בהגדרות (וגם `#manage`); מייל-על: צ׳יפ **🛠 לוח בקרה** (וגם `#platform`). עובדת: `?join=code`→`writeOrgJoinRequest`→מסך-המתנה→אישור-מנהל. אכיפה: `effectiveConfigFor` (קונפיג-אפקטיבי = ארגון בניכוי כרטיס-העובד, רק הגבלה; אילוץ מסמך-יחיד ⇒ ברמת-הממשק). Rules v3 (`orgManager(slug)`, עדכון-חלקי-מנהל). דוח: `knowledge/BUILD-ORDER-ORGADMIN-2026-08-03.md`. **נותר לבעלים:** פרסום Rules v3.
- **כניסת-ניהול (ADMINHUB):** כפתור 🛠 בשלושת השלדים ליד ⚙️, מגודר `isSuperAdmin` **בלבד** (לא `isAdminUser` — אחרת נחשף לכל לקוח); פותח בורר `AdminHub` (`src/components/AdminHub.tsx`) → לוח הבקרה (#platform) / אשף מקומי (#builder). ה-hash הישן ממשיך לעבוד — הכפתור תוספת. דוח: `knowledge/CLOSED-ADMINHUB-2026-07-31.md`.
- **מסך ההרשמה (SIGNUP, אורביט · עיצוב Claude Design):** `LoginScreen` = Hero קוסמי (כדור-מוח Three.js; `src/lib/three-scene.ts` **נטען lazy ב-chunk נפרד** — `import()` דינמי ב-SignupHero, three **מחוץ לבנדל הראשי**; אפס CDN; מגודר `signup.hero3d`, נפילה סטטית ל-`public/orbit/orbit-hero.png`) + כרטיס-זכוכית לשוניות כניסה/הרשמה (⇒`cloudSignUp`); כפתורים משניים: סרטון (`VideoModal` — `public/orbit/orbit-tour.webm`, on-demand), עיתון (`NewsReader` — iframe ל-`public/orbit/orbit-news.html`) ו"נחזור אליכם" (`CallbackModal` ⇒ `platformLeads` — create-only ציבורי). אימות אימייל+סיסמה בלבד (בלי ספקי-זהות/מפתחות-גישה). **SIGNUP3 (1.8.2026): ההרשמה = אשף 5-שלבים** (`SignupWizard` + `lib/signupWizard.ts` טהור) — תחום (10 מ-VERTICAL_PACKS) → גודל → צרכים (אופציונלי) → פרטי-קשר → חשבון; הפרופיל (industry/size/needs) נזרע ל-`platformRequests` ומוצג בלוח-הבקרה (Rules ללא-הגבלת-שדות ⇒ אין עדכון). הכניסה נשארת טופס רזה. e2e נפרד `e2e/signup.mjs` (מעבר-אשף מלא). דוחות: `knowledge/CLOSED-SIGNUP-2026-07-31.md` + `CLOSED-SIGNUP2-2026-07-31.md`.
- **דמו ציבורי (?org=demo, 1.8.2026):** `public/c/demo/config.json` **בלי firebase** ⇒ אין שער-ענן/התחברות; App זורע `demo.json` אוטומטית פעם-בסשן (sessionStorage) כשריק; `DemoRibbon` = "מצב הדגמה" + CTA "פתחו אתר משלכם" (חוזר לשורש) + התחל-מחדש. ratchet + `e2e/demo-link.mjs`.
- **מודול חלוקה (`shop7`, גל 7):** עמודה מבודדת — מתנדבים · ימי-חלוקה · לוח-מסירות ב-`src/components/shop7/`. הכרעות-בעלים: משפחות→מתנדב ישירות · מעקב **קדימה** (איסוף→בדרך→נמסר) · מתנדב = ישות עצמאית · הקלט = `shopAssignments` הפעילים (SHOP6; המסירה מצביעה, לא משכפלת). אפס נגיעה בכסף/קבלות (ratchet בידוד + הגנת-מקור). מנוע טהור `shop7/lib.ts`. דוחות: `knowledge/BUILD-ORDER-SHOP7` + `CLOSED-SHOP7-2026-08-01.md`. **CONNECT הושלם (2.8.2026):** פאנל-כרטיס + מונה-בית + תדפיס/CSV (`deliveriesCsvRows`/`deliveryListLines`, `shop7.export`); תיקון: `shop7` נוסף ל-`NAV_MODULE_KEYS` (שרשור-מודול לתת-דגלים). ratchets: connect-export/crosscare/familypanel.
- **גלים 8–10 (1.8.2026):** **SHOP8 · מנוע מקדים-הצורך** — `shop8/lib.ts` טהור (הצעות: חג/גיל-בית-ספר/תינוק/כרטיסייה); ווידג'ט-בית `home.suggest`, ביטול דרך attnDone (בלי סכמה). **SHOP9 · אמץ חתן** — `Donation.designation` אופציונלי (additive); DonationModal `supporters.sponsor` → **אותה קבלת מס D-** (donationSeq לא נגע); סיכום אימוצים במבט-הנהלה. **הכרעת-בעלים: SHOP9 מחווט לתרומות/קבלות** (שובר בידוד במכוון). **SHOP10** — `reports.management` (מבט-הנהלה חוצה-מודולים) · `shell.privacy` (מצב-צנעה 🕶️, מסתיר מקבלי-צדקה) · `ShopIntake.expiry` (אצוות/תפוגה → needsCare 'expiring'). **הצפנת-ענן · ליבה+חיווט** (`cloudCrypto.ts`+`cloud.ts`, dormant/null-safe; נותר אשכול-הפעלה+מיגרציה = חלון-בעלים).
- **הרחבות אמיתיות (INTEGRATIONS גל א׳, 4.8.2026):** `config.integrations` הפך ממכירתי-בלבד למנגנון חי. **גידור `integrationOn`** (lib/config) — **הפוך מדגלים: חסר=כבוי** (הרחבה=מוצר-נמכר opt-in); `normalizeConfig` מחטא (allowlist ‏`INTEGRATION_KEYS` ב-types/config + ‏{enabled:boolean} בלבד). **שלוש live:** 💬 `whatsapp` (‏`lib/wa.ts` — wa.me, טלפון-שמור→972, מוקשח; ‏`WaBtn` ב-5 משטחים: כרטיס-משפחה, תורמים רשימה+כרטיס, מתנדבי-חלוקה, רכזות) · 🗺️ `maps` (‏`lib/mapsLink.ts` — חיפוש-כתובת + מסלול-רב-עצירות פר-מתנדב `volunteerRouteStops`; ‏`|` מנוקה) · 📅 `gcal` (‏`lib/ics.ts` RFC5545 + ‏`calLib.icsWindowEvents`; **חלון 385 יום — שנה מעוברת!** כפתור בלוח). **טקסונומיית-כנות** (`INTEGRATION_STATUS` ב-builder/handoff): live נמכר/מתומחר (רק דרך `liveAddons`) · included (קבלות/גיבוי) לא-נמכר-פעמיים · roadmap (סליקה/SMS/טלפוניה/גיליון/חתימה/AI/קמפיין — דורש שרת) לא-נמכר, דגל-מיובא מוצג להסרה; דף-המסירה בלי "ממתין להפעלה". ליעוס+ביקורת: `knowledge/BUILD-ORDER-INTEGRATIONS-2026-08-04.md`.
- **DB:** מסמך יחיד (DB_VERSION=6) — seq כללי + receiptSeq/donationSeq נפרדים ורציפים (קבלות מס!) + shopReceiptSeq (אישורי S- של החנות — לא קבלת מס) + 21 מערכי ישויות (ה-18: shopIntakes — SHOP6; 19–21: volunteers/distributionDays/deliveries — SHOP7). מיגרציה מצטברת אחת ב-`src/store/persist.ts` (מרפאת מונים, rid כפולים, מזהי members, רכיבי-חנות→פריטים).
- **מודול קופות צדקה (`tzedaka`):** עמודה מבודדת — רכזים/קופות/ריקונים/מבצעים/לוח-ייעודי/ראווה ב-`src/components/tzedaka/`; הכסף והאירועים לא זולגים לתרומות/קבלות/לוח הראשי (הכרעת בעלים 30.7, נאכף ב-ratchets). דוח: `knowledge/CLOSED-TZEDAKA-2026-07-30.md`.
- **מודול חנות (`shop`):** עמודה מבודדת של מוצרי-שירות — קטלוג (חבילות: פגישה/קופון/מתנה/מתנת-חג) / חנויות שותפות / קריטריוני זכאות (הנחה גבוהה, לא מצטבר) / שיוכים+מימושים / לוח-ייעודי / ראווה ב-`src/components/shop/`; משרדי בלבד, בלי גיימיפיקציה, אותם כללי בידוד כמו הקופות; הגריד המשותף חולץ ל-`src/lib/monthGrid.ts`. שדרוגי SHOP2: מלאי פר-רכיב ("נותרו N" + stockOut), אישורי תשלום סמלי S- (סדרה נפרדת, taxReceipt:false — לא נוגעת ב-R-/D-), תוקף קופונים ("בתוקף עד" + couponExpired). ‏SHOP3: חידוש מלאי מהיר (StockModal), ביטול מימוש עם סימון (voidedAt — הרשומה וה-S- נשארים; החרגה דרך liveRedemptions היחיד). ‏SHOP4: פריטי קטלוג עצמאיים (ShopItem — מלאי **משותף** בין חבילות, itemOf/itemRemaining; רכיב = מצביע + דריסות מחיר), חגים נבחרים למתנת-חג (holidays), מודאל מימוש מותאם-סוג, ופגישות-עם-חדר — **חור מבוקר יחיד בבידוד (הכרעת בעלים 16):** OrgEvent מקושר (mainEventId) לתפיסת חדר דו-כיוונית; הכסף נשאר מבודד. ‏SHOP5: פגישות ביומן החדרים (דרך המקושר), "💵 גבייה בקופה" ממולא (sessionStorage — הקופה נשארת כלי ספירה), מיזוג פריטים כפולים (mergeShopItems), "פגישות קרובות" ב-HomeTab. דוחות: `knowledge/CLOSED-SHOP-2026-07-30.md` + `CLOSED-SHOP2` … `CLOSED-SHOP5`.
- **חיבורי המערכת (CONNECT, גל B):** העמודות מחוברות לפלטה (moduleOn), לכרטיס המשפחה (פאנלי-תצוגה familypanel), למסך הבית (careCounts — מונה-עם-קפיצה בלבד, home.crosscare), לדמו, למדריך/סיור ולתדפיסים/CSV (export; מבוטל מסומן); הקופה הרושמת ממורחבת-שמות (nsLsKey). הכול תצוגה/זרימה — אפס ערבוב כספי. דוח: `knowledge/CLOSED-CONNECT-2026-07-30.md`.
- **SHOP6 (גל ה):** מלאי נכנס — קליטות (ShopIntake, מערך 18; StockModal=זרימת-קליטה; IntakePanel; minStock+restock ב-needsCare) · חלוקה המונית (eligibleFamilies/bulkAssignShop/bulkRedeem — **הכול-או-כלום על מחסור מלאי**, paid=0 בלי S-; רשימת חלוקה "☐ נמסר") · רשימות המתנה (ShopItem.waits, הצעה אוטומטית במלאי 0, waitingRestocked). דוח: `knowledge/CLOSED-SHOP6-2026-07-30.md`.
- **UX סינון (גל B½):** חיפוש/סינון/מיון בעמודות החדשות — הכול פונקציות טהורות ב-lib של המודול (filterCoordinators/boxesOverview/filterCollections · filterAssignments/filterProducts/filterItems/filterRedemptions), טקסט דרך `smartFilter` (שם רב-מילתי ⇒ המילים המפוצלות כמונחים נוספים), `dateInRange` משותף ב-date-util; מיון 'pending' = ותיק-ממתין ראשון, מבוטל=ממתין; לוחות מסוננים לפני בניית הגריד (shownEvents); קישורים צולבים מגודרי moduleOn. דוח: `knowledge/CLOSED-UX-2026-07-30.md`.

## Dev loop — שערים מדורגים לפי רדיוס הפגיעה
```bash
npm ci
npm run verify:fast   # לולאת פיתוח: typecheck → lint → test (בלי build)
npm run verify        # שער commit: + build. נאכף אוטומטית ב-.githooks/pre-commit
npm run e2e           # toggle-matrix — 5 פרופילים (דורש build קודם)
node e2e/demo-walkthrough.mjs      # מעבר דמו + צילומים
node e2e/launch-readiness.mjs      # מסעות משתמש, אפס שגיאות קונסולה
```
- **commit קוד** ⇒ typecheck+lint+test (מהיר, בלי build); ידע/תיעוד בלבד ⇒ lint מקוצר. נאכף ב-`.githooks/pre-commit`.
- **push** ⇒ build מלא פעם אחת (לקח #72 מבנייה חכמה: הכבד ב-push, לא בכל commit) + חסימת main בלי `.allow_push_main` + חסימת force push. נאכף ב-`.githooks/pre-push`.
- **שלוש סוויטות הדפדפן** ⇒ בסוף כל אשכול-עבודה ובסוף חבילה — לא על כל commit (חריג: נגעת ב-e2e/זרימת UI מרכזית).
- מקור השערים: הענף החי של בנייה חכמה `claude/whats-happening-LyY9G` (pre-commit 937 שורות) — לא main.
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
| `src/types/features.ts` | 116 דגלים + 43 מונחים |
| `src/store/useApp.ts` | ה-store היחיד — כל פעולות העסקים (1,154 שורות) |
| `src/store/persist.ts` | התמדה 3 שכבות + migrate() + שער ריבוי-טאבים |
| `src/store/cloudSync.ts` + `src/lib/cloud*.ts` | סנכרון Firestore (diff/merge, הענן מנצח, מונים רק עולים) |
| `src/lib/hebrew.ts` + `hebdate.ts` | לוח עברי מלא על Intl בלבד (סריקה הפוכה ~440 ימים), דין אדר ב-hebAnnualEq |
| `src/lib/config.ts` | טעינת OrgConfig, featureOn/termOf/moduleOn |
| `src/lib/crypto.ts` + `lock.ts` | הצפנה (PBKDF2 600K) + נעילת PIN דו-שכבתית + הגבלת-קצב (localStorage מקומי במכוון) |
| `src/components/ui.tsx` | ערכת UI משותפת (Modal עם focus-trap, Field נגיש) |

## מוסכמות הפרויקט
- **הפרדת טוהר:** כל מודול = `lib.ts` טהור (בלי store/DOM) + רכיבים. הלוגיקה נבדקת ביחידה.
- **בדיקות ratchet:** כל באג שתוקן מקבל בדיקת שימור עם תיעוד הבאג בעברית. יש גם "הגנות-מקור" (`?raw` + regex על JSX) ובדיקות cross-surface.
- **תאריכים:** תמיד ISO לועזי ב-DB; פרסור עם `T12:00:00` (צהריים מקומי); `isoToday` מ-date-util ולא toISOString.
- **קומיטים:** קידומות עבריות — `מנוע ·` / `פער N ·` / `שדרוג ·` / `תיקון ·` / `גל N ·`.
- מחרוזות UI עוברות `termOf`; פיצ׳רים מגודרים `featureOn`; כיבוי מודול-אב משורשר אוטומטית רק ברמת קידומת ראשונה (תת-דגלים = קונבנציה בקומפוננטות).

## ⚠️ באגים ידועים שטרם תוקנו (במכוון — ממתין לאישור המשתמש)
1. ~~🔴 `src/lib/hebrewNumber.ts:41` — סכום-במילים שגוי לאלפים עגולים 11K–999K~~ **תוקן 2026-07-29 (P1-א׳1)** — כולל אותו דפוס במיליונים; ratchet מלא. ~~🟠 אגורות בצורת-זכר על קבלת מס ("עשרים וחמישה אגורות")~~ **תוקן 1.8.2026** — צורת-נקבה ("עשרים וחמש"), יחיד "אגורה אחת", סמיכות "שתי אגורות"; סנט זכר נשמר; ratchet.
2. ~~🔴 `e2e/launch-readiness.mjs` — נתיב קשיח~~ **תוקן 2026-07-29** (נתיב יחסי + כל הסוויטה ירוקה).
3. 🟠 מפתחות localStorage שעוקפים את בידוד ה-namespace הרב-ארגוני. **טופלו:** הקופה הרושמת (maor_cashbox_*, CONNECT חיבור 7) · שער-היום ‏(maor_day/maor_dayend/maor_autoexp) · הגאדג׳טים ‏(maor_bodymap/maor_timer_collections + מפתחות ה-client) — כולם דרך nsLsKey (1.8.2026, ratchet gadget-day-ns). **נשארים גלובליים במכוון:** ‏maor_lock (נעילת PIN — הכרעת-בעלים פתוחה: לבודד פר-ארגון או להשאיר משותף) · a11y ‏(maor_ui_scale/maor_acc — נגישות פר-אדם, לא פר-ארגון).
4. 🟠 העותק בענן נשמר plaintext גם כשההצפנה דלוקה. ~~אין Firestore Rules בריפו~~ **חצי א׳ טופל 2026-07-30**: `firestore.rules` בריפו (allowlist מיילים). **חצי ב׳ — יושם 2.8.2026 (הכרעת בעלים 'עכשיו'):** מנגנון הצפנת-ענן מלא **נפרס דורמנטי** — `cloudCrypto.ts`+`cloud.ts` (wire) · `readCloudEnvelope` failure-safe · שער `needUnlock` (`gatedStart`) · `CloudUnlockScreen` · `CloudEncryptionSection` (isSuperAdmin) · פעולות `cloudUnlock`/`enableCloudEncryption` (envelope+גיבוי-כפוי+מיגרציה). אינווריאנט: אין envelope ⇒ DEK null ⇒ ביט-זהה להיום (ratchet+הגנות-מקור). **נותר רק הריצה עצמה = חלון-בעלים** (הבעלים בוחר סיסמה + מריץ מיגרציה חיה; הארכיטקט לא יודע את הסיסמה ולא מריץ). Runbook: `knowledge/RUNBOOK-CLOUD-ENCRYPTION-2026-08-02.md`.
5. ~~🟠 DonationModal/ManageModal מורידים קבלה גם כשה-store דחה~~ **תוקן 2026-07-30 (P1-א׳2)** — {ok,rid} מה-store, אפס ניחוש rid ב-UI.
6. ~~🟠 ניקוי dueDate/nextDate משאיר אירוע יתום בלוח~~ **תוקן 2026-07-30 (P1 פער 12)** — unlinkEvent משותף.
7. ~~🟡 #21 — צום תשעה באב נדחה לא נחסם ביומן החדרים~~ **תוקן 2.8.2026** — `diary/lib.ts blockReason` קיבל את דין הדחייה מהלוח (`dow===0 + י' באב ⇒ 'תשעה באב (נדחה)'`); ratchet מאומת מול חישוב-הלוח (7.8.2022).

**סגירת לולאת-הבאגים ANALYSIS §5 (3.8.2026) — דוח: `knowledge/CLOSED-BUGLOOP-2026-08-03.md`:** נסגרו לפי הכרעות-בעלים והופצו: **#6** נוכחות אידמפוטנטית (`presents[]`+`setPresent`) · **#10** מונה-חודשי (`presentsInMonth`) · **#8** תלמידה-שסיימה בדוח (`endedAt`) · **#7** השלמה-לפי-סיבה (`Absence.justified`+`makeupEligibility`) · **#9** מזהי-קבוצה יציבים (`groupRemapOnRemoval`) · **#5** מזהים חסיני-התנגשות (`ids.ts` deviceTag) · **#3** שער ריבוי-טאבים (מאזין storage) · **5.5a** דדופ-קבלות דטרמיניסטי (`planRidRenumber`) · **#18** strict-mode (0 שגיאות) · **#22** חיזוק-e2e (חשף+תיקן שלב-תרומה שקט) · מטמון-hebParts חסום · כבילת 6 מימושי normName. **כבר-סגורים ואומתו:** #2/#4/#12/#13/#15/#16/#17/#19/5.3/USD/demo/CSV-injection/favicon. **ממתין להכרעת-בעלים/רו"ח (גבול-תפקיד — לא מתקנים בעיוור):** **#14** סמנטיקת-אגרגטים (האם count/ils/usd כוללים את `hist[]` הלגאסי או רק `donations[]`?) · **5.5d** פורמט קבלת-§46 דיגיטלית (סימון מקור/העתק? .txt מול PDF? — רו"ח) · מחיקת 6.9MB מוקאפים ב-`public/shots/` (או שמורים לגלריה?) · גלריית-תמונות-ידנית (פיצ'ר — דורש הגדרת-היקף).

**SHOP9 back-office (2.8.2026):** `Db.budget` — יעד-תקציב-סיוע עריך (הגדרות←פרטי-הארגון; ברירת-מחדל 0, נטען ב-emptyDb ⇒ migrate מרפא). מבט-ההנהלה מציג יעד/נותר/⚠חריגה/ניצול% מול הסבסוד-נטו (קריאה-בלבד). קבוצת '💰 התחשבנות' + DEK מושחל ב-cloudSync (dormant) — הכול הופץ ואומת ביט-אחר-ביט.

הרשימה המלאה (2 חמורים, ~22 בינוניים, ~40 קלים) + המלצות מתועדפות: **`knowledge/ANALYSIS-2026-07-29.md`**.
