# BUILD-ORDER · מצב-מסונן לאורביט — מתווך-קצה (12.10.2026)

**הבעיה (ראיית-שטח):** `knowledge/CLOSED-ONBOARD-2026-08-05.md` §"תבנית-שטח" —
לקוחות על קווים/טלפונים מסוננים (נטפרי, רימון) מגיעים לאתר (הדומיין מאושר), אבל
הסנן חוסם את נקודות-הקצה של גוגל: `identitytoolkit` / `securetoken` /
`firestore.googleapis.com`. התוצאה: "Auth לעיתים עובר ו-Firestore נחסם, או שהכול
נחסם" — אין כניסה, אין סנכרון. העקיפה היום: ➕ הקמה-ידנית ובקשת-פתיחה מחברת-הסינון.

**הפתרון (מוכח במוצר-האח):** בנייה-חכמה פתרה את זה ב-12.8 עם מתווך-קצה
(Cloudflare Worker, allowlist) על תת-דומיין של הדומיין המאושר —
`/home/user/buildsmart/edge-proxy/` (README · FILTERED-MODE-BUILD-ORDER · worker.js).
הסנן רואה דומיין אחד — שלנו; המתווך פונה לגוגל מאחורי-הקלעים.

**מה שונה אצלנו:** בנייה-חכמה (Flutter) נאלצה לבנות שכבת-REST מלאה ל-Auth כי
`useAuthEmulator` של flutterfire כופה `http://`. ב-Firebase JS SDK ‏`connectAuthEmulator`
מקבל `https://` (אומת במקור — למטה), ולכן אצלנו אפשר להשאיר את ה-SDK כמות-שהוא
ולהפנות רק את **הכתובות**. זה מקטין את הקוד החדש בסדר-גודל.

---

## 1. מה הלקוח של אורביט באמת קורא (אומת בקוד וב-SDK, לא מהזיכרון)

גרסאות מותקנות: `firebase@12.16.0` · `@firebase/auth@1.13.3` · `@firebase/firestore@4.16.0`.
נקודת-האתחול היחידה: `src/lib/cloud.ts:242` `initCloud` (אין `getAuth`/`getFirestore`
נוסף בקוד — `cloudConfig.ts`/`supportChat.ts` עוברים דרך `cloudDb()`).
אין `firebase/storage` ואין `firebase/functions` בלקוח.

| # | מארח | מי פונה ולמה | מתי | במצב-מסונן |
|---|---|---|---|---|
| 1 | `firestore.googleapis.com` | Firestore SDK. **WebChannel**: `/google.firestore.v1.Firestore/{Listen,Write}/channel` (GET+POST, ‏`withCredentials`, פרמטר `database=projects/<p>/databases/(default)` **בכל** בקשה — ‏webchannel-wrapper ‏`Uc()` ב-Zb/Zc/$c/cc). **RPC-REST**: `/v1/projects/<p>/databases/(default)/documents[/…]:{commit,batchGet,runQuery,runAggregationQuery}` (POST, ‏`Authorization` ⇒ preflight, `withCredentials`) | כל onSnapshot/סנכרון/טרנזקציה | ✅ דרך המתווך — `host` רשמי |
| 2 | `identitytoolkit.googleapis.com` | Auth SDK: `/v1/accounts:{signInWithPassword,signUp,lookup,sendOobCode,update}` + `GET /v2/passwordPolicy` (רק אחרי `password-does-not-meet-requirements`) | כניסה · הרשמה · טעינת-משתמש-שמור · מייל-איפוס/אימות · שינוי-סיסמה | ✅ דרך המתווך |
| 3 | `securetoken.googleapis.com` | Auth SDK: `POST /v1/token` | רענון-טוקן (~פעם בשעה) | ✅ דרך המתווך |
| 4 | `us-central1-maor-system.cloudfunctions.net` | `fetch` ידני עם `Bearer`: `nedarimPull` · `solaPull` · `gcontactsSyncNow` (`cloud.ts:704/723/745`, ‏`GContactsSection.tsx:20`) | פעולות-מנהל בקליק | ✅ דרך המתווך (שכתוב-כתובת) |
| 5 | `apis.google.com` + `maor-system.firebaseapp.com/__/auth/iframe` | `getAuth()` רושם `browserPopupRedirectResolver`; ב**מובייל/Safari/iOS** הוא נטען **יזומות** בעליית-Auth (`_shouldInitProactively`, auth `index-*.js:10707`, נצרך ב-`:2694`) | כל עלייה במובייל | **לא נחוץ** — אורביט = אימייל+סיסמה בלבד. במצב-מסונן `initializeAuth` **בלי** resolver ⇒ אפס בקשות לשניהם |
| 6 | `www.google.com/images/cleardot.gif` | WebChannel: פינג-אבחון אחרי שגיאת-רשת (קוד 2, ‏`R()` ב-webchannel-wrapper) | רק אחרי שגיאה | לא מנותב (אין הגדרה); חסום = סטטיסטיקה בלבד, לא מזיק |
| 7 | `maor-system.firebaseapp.com/__/auth/action` | הקישור **בתוך** מייל-איפוס/אימות (המשתמש לוחץ, לא ה-SDK) | איפוס-סיסמה | ❌ פתוח — ראו §8 ש6 |
| 8 | `content-firebaseappcheck.googleapis.com` + `www.google.com/recaptcha` | App Check | **אף פעם היום**: `normalizeFirebase` (`config.ts:129`) משמיט `appCheckKey` ⇒ `initAppCheck` מקבל `undefined` | לא-תואם מצב-מסונן (ראו §8 ס7) |
| 9 | `identitytoolkit`/`securetoken`/`firestore` ישירות | 🩺 מאבחן-החסימות (`netcheck.ts`) — בדיקה יזומה בלבד | לחיצה על 🩺 | במצב-מסונן: בודק את המתווך במקום (§4) |

**אומת:** אין CSP (`connect-src`) ב-`index.html` ⇒ אין צורך לגעת בו. ‏`public/sw.js:45`
מתעלם מכל בקשה שאינה same-origin ⇒ המתווך (מארח אחר) לא עובר דרך ה-Service-Worker.
אין גופנים/סקריפטים חיצוניים ב-`index.html`.

**כותרות שה-SDK שולח (נדרשות ב-CORS):** Auth (`_getAdditionalHeaders`, ‏`:3165`) —
`Content-Type`, `X-Client-Version`, `X-Firebase-gmpid`, `X-Firebase-Client` (heartbeat),
`X-Firebase-AppCheck`, `X-Firebase-Locale` (בגלל `useDeviceLanguage`). Firestore
(`RestConnection`, firestore `common-*.esm.js:8066–8100`) — `X-Goog-Api-Client`,
`Content-Type`, `X-Firebase-GMPID`, `Authorization`, `x-firebase-appcheck`,
`google-cloud-resource-prefix`, `x-goog-request-params`, `x-goog-api-key`.
**כותרות-תשובה ש-WebChannel קורא** (חייבות `Access-Control-Expose-Headers`):
`X-HTTP-Session-Id`, `X-HTTP-Initial-Response`, `X-Client-Wire-Protocol`.
**טוקנים לעולם לא ב-URL:** WebChannel מקודד את `Authorization` לגוף ה-POST
(`encodeInitMessageHeaders = !0`, ‏`:8309`); רענון-טוקן — בגוף; פונקציות — בכותרת.

---

## 2. איך מפנים כל שירות ב-JS SDK

### 2.1 Firestore — `host` רשמי (אין מה להחליט)
`initializeFirestore(app, { localCache, host: '<edge>', ssl: true })`. ‏`FirestoreSettingsImpl`
(firestore `:9185–9205`): ברירת-מחדל `firestore.googleapis.com`/`ssl:true`; `host` מותאם
עובר כמות-שהוא; הנתיב לא משתנה (`RestConnection` בונה `https://<host>/v1/…` ו-
`https://<host>/google.firestore.v1.Firestore/<rpc>/channel`). מפתח-ה-IndexedDB של
המטמון המתמיד **לא כולל את ה-host** ⇒ מעבר מכשיר בין ישיר↔מתווך לא מאבד מטמון.

**long-polling — האם נחוץ דרך Worker?** ל-Worker עצמו — **לא**: מחזירים `resp.body`
כ-stream (בלי אגירה) ו-WebChannel הזורם עובר. הסיכון הוא **הסנן**: נטפרי עושה
HTTPS-inspection, ופרוקסי-בודק עלול לאגור תשובות-זרם. לשם כך ב-SDK הנוכחי
`experimentalAutoDetectLongPolling` **דלוק כברירת-מחדל** (`:9205`) — WebChannel מזהה
"buffering proxy" ועובר ל-long-polling לבד. לכן לא כופים; מוסיפים מתג-מילוט
`forceLongPolling: true` בקונפיג (⇒ `experimentalForceLongPolling`) לשימוש רק אם
בדיקת-השטח תראה שהזיהוי-האוטומטי נכשל מאחורי הסנן.

### 2.2 Auth — שתי האפשרויות, בכנות

**(א) `connectAuthEmulator(auth, 'https://<edge>', { disableWarnings: true })`**
מה זה עושה בפועל (auth `index-*.js`):
- `:3800` — מקבל `https?://` (בניגוד ל-flutterfire). ‏`:3806` ⇒ `emulator.url = https://<edge>/`.
- `_getFinalTarget` (`:994`) + `_emulatorUrl` (`:681`) ⇒ כל קריאה הופכת ל-
  `https://<edge>/identitytoolkit.googleapis.com/v1/accounts:…?key=…` ו-
  `https://<edge>/securetoken.googleapis.com/v1/token?key=…` — **מארח-גוגל הוא המקטע
  הראשון בנתיב**. מצוין למתווך: ניתוב לפי התאמה-מדויקת של המקטע, תת-דומיין אחד.
- `:3833` — באנר "Running in emulator mode" ו-console.info רק כש-`!disableWarnings`.
- כל השאר ממשיך כרגיל: `onAuthStateChanged`, התמדה ב-IndexedDB, רענון-טוקן, ו-Firestore
  מקבל את ה-ID-token דרך `auth-internal` — **טוקן אמיתי** (המתווך מעביר לגוגל האמיתי) ⇒
  Rules נאכפים כרגיל.

סיכונים של (א), כולם אומתו במקור:
1. **`appVerificationDisabledForTesting = true`** (`:3828`) ⇒ reCAPTCHA מדומה (`:3506`).
   אם יודלק בפרויקט reCAPTCHA-Enterprise לאימייל/סיסמה (ENFORCE) או SMS — הכניסה
   במצב-מסונן תיכשל. אורביט לא משתמש בטלפון; את ההגנה הזו **אסור להדליק** כל עוד
   מצב-מסונן בשימוש (ממילא סקריפט-reCAPTCHA מ-google.com חסום בקו מסונן).
2. popup/redirect עוברים לנתיבי `/emulator/auth/…` (`:10381`, ‏`:10607`) ו-`_validateOrigin`
   מדולג (`:10185`) — לא רלוונטי: אורביט אימייל+סיסמה בלבד (אין `signInWithPopup` בקוד).
3. זו הפעלה של API ציבורי מתועד **למטרה שלא תוכנן לה**. גרסת-firebase עתידית עלולה
   לשנות סמנטיקת-אמולטור (נתיבים, כותרות, http-בלבד). **מיתון:** ratchet-קנרית שקורא
   את מקור ה-SDK המותקן ונכשל אם אחת מההנחות הנ"ל השתנתה — כל bump של Dependabot
   יעצור שם עד ביקורת-חוזרת.
4. חייב להיקרא מיד אחרי `initializeAuth` ולפני כל בקשת-רשת (`_canInitEmulator`, ‏`:3814`) —
   מובטח: אותה פונקציה סינכרונית, והקריאה הראשונה של ה-SDK אסינכרונית (queue).

**(ב) שכבת-רשת REST (מה שבנייה-חכמה עשתה ב-Flutter)**
- ‏Auth-REST עצמי (signIn/signUp/lookup/sendOobCode/update/refresh) + ניהול-סשן + התמדה.
- **הבעיה המכרעת ב-JS:** Firestore SDK מקבל טוקן **רק** מרכיב `auth-internal` של Auth SDK.
  בלי סשן-SDK, Firestore רץ לא-מאומת ⇒ כל Rule נכשל. האפשרויות: (ב1) לרשום רכיב
  `auth-internal` מזויף דרך `_registerComponent` — API פנימי, נשבר בשדרוגים, צריך לשחזר
  getToken/addAuthTokenListener/רענון; או (ב2) להחליף גם את Firestore ב-REST — לכתוב
  מחדש onSnapshot/WebChannel, טרנזקציות, תור-אופליין, מטמון רב-לשוניות. זו שכתוב של
  כל שכבת-הענן לנתיב-מקביל, עם רדיוס-פגיעה עצום ושני מסלולים לתחזק.
- היתרון: לא נשען על סמנטיקת-אמולטור.
- **(ג) נבחנה ונדחתה:** `FetchProvider.initialize` מ-`@firebase/auth/internal` (shim ל-fetch
  של Auth בלבד) — בלי תופעות-אמולטור, אבל API פנימי + ייבוא תלות-מעבר ישירה.

**הכרעה: (א)**, עם שלושה מיתונים קשיחים:
- `disableWarnings: true` (אין באנר/console).
- במצב-מסונן `initializeAuth(app, { persistence: [indexedDBLocal, browserLocal, browserSession] })`
  **בלי** `popupRedirectResolver` — אותה היררכיית-התמדה של `getAuth` (`:11141`) ⇒ משתמש
  מחובר נשאר מחובר במעבר-מצב; ובלי הטעינה-היזומה של gapi/iframe (שורה 5 בטבלה) — על קו
  מסונן היא ממתינה לסקריפט חסום **לפני** `initializeCurrentUser` (`:2694–2700`; לטעינת-
  הסקריפט עצמה אין timeout ב-SDK — `_loadJS` "TODO: consider adding timeout"; ל-`gapi.load`
  ‏30s), כלומר גם מאיטה את עליית-הכניסה.
- ratchet-קנרית על מקור ה-SDK (סיכון 3).

### 2.3 Functions — שכתוב-כתובת
`viaEdge(url)`: `https://us-central1-…cloudfunctions.net/<fn>?q` ⇒
`https://<edge>/us-central1-…cloudfunctions.net/<fn>?q` (אותה תבנית "מקטע-ראשון=מארח").
מוחל בשלוש קריאות ה-fetch; בלי מתווך = פונקציית-זהות.
### 2.4 Storage — לא בשימוש בלקוח (רק `backupNightly` בשרת).

---

## 3. המתווך — `edge-proxy/worker.js`

**תת-דומיין אחד: `edge.orbit-il.com`.** אומת 12.10: ‏NS של `orbit-il.com` =
`laila/pranab.ns.cloudflare.com` (האזור כבר ב-Cloudflare), ה-apex מצביע ל-GitHub Pages
(185.199.108–111.153, ‏DNS-only), ו-`edge.orbit-il.com` לא קיים (NXDOMAIN) ⇒ Custom-Domain
ל-Worker לא נוגע ברשומות האתר החי (לקח 18/19). מרחבי-הנתיבים לא חופפים, אז מארח אחד
מספיק לשלושת השירותים (בנייה-חכמה פיצלה ל-fs./idt./token. כי שם ה-SDK דרש מארח-נקי לכל אחד).

### allowlist (כל השאר ⇒ 404, בלי לפנות לגוגל)
| נתיב אצל המתווך | שיטות | יעד | תנאי |
|---|---|---|---|
| `/identitytoolkit.googleapis.com/v1/accounts:{signInWithPassword,signUp,lookup,sendOobCode,update}` | POST | identitytoolkit | `key` ∈ מפתחות-הפרויקט |
| `/identitytoolkit.googleapis.com/v2/passwordPolicy` | GET | identitytoolkit | `key` |
| `/securetoken.googleapis.com/v1/token` | POST | securetoken | `key` |
| `/google.firestore.v1.Firestore/{Listen,Write}/channel` | GET, POST | firestore | **כל** `database=` ⇒ `projects/maor-system/databases/(default)` |
| `/v1/projects/maor-system/databases/(default)/documents[/…]:{commit,batchGet,runQuery,runAggregationQuery}` | POST | firestore | הפרויקט בנתיב |
| `/us-central1-maor-system.cloudfunctions.net/{nedarimPull,solaPull,gcontactsSyncNow}` | POST | הפונקציה | — |

`OPTIONS` נענה מקומית (preflight) — רק לנתיב+שיטה מותרים ול-Origin מותר.
‏`redirect: 'manual'` — המתווך לא עוקב אחרי הפניות (אחרת allowlist-המארחים נעקף).

### CORS
Origins מותרים (התאמה מדויקת): `https://orbit-il.com` · `https://meir7651231-ui.github.io`
(ה-mirror של deploy.yml). Origin מותר ⇒ הד שלו + `Vary: Origin` +
`Access-Control-Allow-Credentials: true` (חובה — Firestore/WebChannel שולחים `withCredentials`).
Origin אחר (כולל `null`/http/סיומת-מתחזה) ⇒ 403 בלי לפנות לגוגל. בלי Origin (curl,
ביקון-תמונה של WebChannel) ⇒ מועבר, בלי כותרות-CORS (דפדפן זר ממילא לא יקרא).

### היגיינת-כותרות
- **לעולם לא מועבר לגוגל:** `cookie` (גם עוגיות `.orbit-il.com`/Cloudflare), `host`,
  hop-by-hop, `cf-*`, `x-forwarded-*`, `x-real-ip`, `true-client-ip`, `forwarded`, `via`,
  `cdn-loop`. ‏`origin`/`referer` **כן** מועברים (הגבלות-referrer של מפתח-ה-API).
- **לעולם לא מוחזר ללקוח:** `set-cookie`, `alt-svc`, `report-to`, `nel`,
  `reporting-endpoints`, `strict-transport-security`, וכל `access-control-*` של גוגל
  (מוחלפים בשלנו; `Expose-Headers` = של גוגל ∪ שלוש כותרות-WebChannel).
- **אפס לוגים:** אין `console.*` בקובץ; הגוף לעולם לא נקרא — מוזרם כמות-שהוא.
- כותרת-גרסה `X-Orbit-Edge` בכל תשובה — לזיהוי סחף בין הקובץ בריפו לגרסה המודבקת.

---

## 4. החיווט בלקוח (רדום)

**שדה-קונפיג חדש:** `edgeProxy?: { host: string; allDevices?: boolean; forceLongPolling?: boolean }`
- חיטוי ב-`normalizeConfig` (allowlist, כמו `INTEGRATION_SETTING_KEYS`): `host` = hostname
  נקי (מתקבל גם `https://host` / `https://host/` ומנורמל), **https בלבד** (`http://` נדחה),
  בלי port/path/query/userinfo/IP/נקודה-סופית, תוויות LDH, ו**חייב** להסתיים באחת
  מ-`EDGE_HOST_SUFFIXES = ['.orbit-il.com']` (types/config). כך קובץ-קונפיג מיובא, דריסה
  מקומית או מסמך-ענן **לא יכולים** להפנות סיסמאות למארח זר. ‏`allDevices`/`forceLongPolling`
  נשמרים רק כ-`true`. פגום ⇒ השדה מוסר (ביט-זהה).
- `resolveOrgConfig`: המתווך נלקח **רק מהקונפיג הסטטי/המקומי** (bootstrap — חייב להיות
  ידוע לפני כל קריאת-ענן); ערך ממסמך-הענן נמחק. הענן לא יכול להדליק/להפנות.

**מתג-מכשיר** (גלובלי במכוון — "הקו מסונן" הוא תכונת-מכשיר, כמו נגישות):
`?edge=on` ⇒ `localStorage.maor_edge='on'` · `?edge=off` ⇒ `'off'` · `?edge=auto` ⇒ מחיקה.
נקרא **רק** כשלארגון יש `edgeProxy` — בלי השדה לא נוגעים ב-URL/באחסון כלל.

**מי עובר דרך המתווך:**
`edgeProxy` חסר ⇒ אף אחד (ביט-זהה) · `maor_edge='off'` ⇒ לא · `'on'` ⇒ כן ·
אחרת ⇒ רק אם `allDevices: true`. **הוספת השדה לבדה לא מזיזה אף מכשיר** — שלב-בדיקה
בטוח (לקח 19: מוודאים שהיעד ירוק לפני שמעבירים תנועה).

**נקודות-חיבור:** `useApp.connectCloud` ⇒ `mod.initCloud(fb, edgeForThisDevice(cfg))` ·
`initCloud(fb, edge)` — בלי edge: אותן קריאות בדיוק (`getAuth` · `initializeFirestore({localCache})`);
עם edge: `initializeAuth`(בלי resolver) + `connectAuthEmulator` + `initializeFirestore({localCache, host, ssl})`
(ובנפילה בלי IndexedDB — `initializeFirestore({host, ssl})` ולא `getFirestore`, שהיה חוזר לגוגל) ·
`viaEdge` בשלוש קריאות-הפונקציות · 🩺 `netCheckTargets(origin, firebase, edgeHost?)` — כשהמכשיר
מנותב, בודק את המתווך במקום שלושת מארחי-גוגל, וטקסט-הבקשה לחברת-הסינון יבקש את
`edge.orbit-il.com` (ולא את googleapis שכבר לא בשימוש).

**ratchets (קומיט 3):**
(א) בלי שדה ⇒ קריאות-האתחול זהות (SDK מדומה + הגנת-מקור) ⇒ (ב) עם שדה ⇒ ההפניה מוחלת
(Auth/Firestore/Functions/נפילת-IndexedDB/long-polling) ⇒ (ג) `normalizeConfig` דוחה
http/זבל/סיומת-מתחזה ⇒ (ד) קורפוס-הקונפיגים הקיים מנורמל ביט-זהה (golden שהוקלט
**לפני** השינוי: 3 הקבצים הסטטיים + DEFAULT + 13 חבילות×4 בסיסים + זוגות resolveOrgConfig)
⇒ (ה) קנרית-SDK (§2.2 סיכון 3) ⇒ (ו) מתג-המכשיר לא נוגע באחסון בלי השדה.

---

## 5. מה הבעלים עושה (אחרי מיזוג — הכול רדום עד אז)

1. **Cloudflare** ← Workers & Pages ← Create ← Worker ‏`orbit-edge` ← Edit code ← הדבקת
   `edge-proxy/worker.js` ← Deploy.
2. Worker ← Settings ← Domains & Routes ← Add ← Custom Domain ← `edge.orbit-il.com`
   (האזור כבר ב-Cloudflare; רשומות ה-apex של האתר לא נגועות).
3. בדיקת-עשן מדפדפן רגיל: `https://edge.orbit-il.com/evil` ⇒ **404**; ‏
   `curl -sI https://edge.orbit-il.com/x | grep -i x-orbit-edge` ⇒ גרסת-המתווך.
4. PR לקונפיג (באישור): `"edgeProxy": { "host": "edge.orbit-il.com" }` ב-
   `public/c/maor-hachesed/config.json` (הלקוח-החי) ו/או `public/config.json` (אתר-השורש:
   הרשמות חדשות + ארגוני-פלטפורמה בכניסה-ראשונה) ⇒ מיזוג ⇒ הרצת ה-workflow בריפו
   `orbit-il` ⇒ אימות `curl https://orbit-il.com/version.json` (ה-hash התחלף).
5. **על הקו המסונן:** `https://orbit-il.com/?org=maor-hachesed&edge=on` (או `/?edge=on`
   לשורש) ⇒ כניסה ⇒ הנתונים זורמים; 🩺 מציג "מתווך-הקצה ✅". אם נטפרי חוסמים את
   `edge.orbit-il.com` — בקשת-אישור (‎*3617) לתת-הדומיין.
6. רק אחרי ירוק, ורק אם רוצים לנתב את כולם: `"allDevices": true`. **המלצה:** להשאיר
   opt-in (קישור למסוננים בלבד) — פחות תעבורה ב-Worker, הלא-מסוננים לא תלויים בו.

**נדרש לוודא בקונסולת Firebase:** reCAPTCHA-Enterprise לאימייל/סיסמה **כבוי**; App Check
Enforcement **כבוי**; אם למפתח-ה-API יש הגבלת HTTP-referrer — `orbit-il.com` ברשימה
(המתווך מעביר Origin/Referer).

## 6. גלגול-אחורה (rollback)
1. **מכשיר, מיידי:** `?edge=off` (נשמר; `?edge=auto` מחזיר לברירת-הארגון).
2. **ארגון, קונפיג-סטטי:** הסרת `allDevices` (או כל `edgeProxy`) + פריסה. הלקוח-החי
   (`cloudRoot`) קורא את הקובץ הסטטי בכל טעינה (SW network-first) ⇒ בטעינה הבאה.
3. **ארגוני-פלטפורמה עם מטמון-קונפיג** (`maor_cloudcfg:{slug}` נקרא **לפני** הקובץ הסטטי —
   אותה מגבלה קיימת כמו `firebase`): הערך מהכניסה-הראשונה נשמר במטמון ⇒ `?edge=off`
   למכשיר, או ניקוי-מטמון (הפעולות הקיימות מנקות `maor_cloudcfg*`).
4. ה-Worker עצמו — **אחרון**: כיבויו לפני הקונפיג מנתק מכשירים מנותבים.

## 7. סדר-ביצוע (3 קומיטים נפרדים)
1. `ידע · מצב-מסונן לאורביט — תכנון` — המסמך הזה.
2. `תשתית · מצב-מסונן לאורביט — מתווך-קצה` — `edge-proxy/worker.js` + README לבעלים +
   `edge-proxy/worker.test.mjs` (vitest, ‏fetch מדומה): allowlist · 404 לכל השאר · היגיינת-כותרות ·
   CORS-הד רק ל-Origins מותרים · אפס-לוגים · סנכרון מול מפתח/פרויקט הקונפיגים הציבוריים.
3. `שדרוג · מצב-מסונן לאורביט — חיווט רדום` — `lib/edgeProxy.ts` (טהור) + types/config +
   normalizeConfig/resolveOrgConfig + initCloud + connectCloud + viaEdge + 🩺, וה-ratchets (§4).
שערים: `verify:fast` לפני כל קומיט; בסוף `npm run build` + `npm run e2e`.

## 8. סיכונים ושאלות פתוחות (בכנות)
- **ס1 סמנטיקת-אמולטור** (§2.2) — קנרית-SDK; לא להדליק reCAPTCHA-Enterprise/טלפון.
- **ס2 TLS מסתיים ב-Cloudflare:** ה-Worker (חשבון-הבעלים) רואה סיסמאות וטוקנים במעבר.
  אין לוגים בקוד; **אסור** להדליק Logpush/רישום-גופים; 2FA על חשבון Cloudflare חובה.
- **ס3 מגבלות-per-IP של Identity Toolkit** חלות על כתובות-היציאה המשותפות של Cloudflare
  (גל-הרשמות עלול לקבל `TOO_MANY_ATTEMPTS_TRY_LATER`); ניסיונות-פריצה דרך המתווך מסתירים
  את IP-התוקף מגוגל ⇒ מומלץ כלל Rate-Limiting של Cloudflare על נתיב `signInWithPassword`.
- **ס4 מכסת Workers:** חינם = 100K בקשות/יום; long-polling ≈ ‏2 בקשות/דקה ללשונית פתוחה ⇒
  opt-in למסוננים בלבד; `allDevices` בארגון גדול ⇒ Workers Paid.
- **ס5 הסנן:** ייתכן שתת-הדומיין דורש אישור-נפרד; HTTPS-inspection עלול לאגור זרם ⇒
  זיהוי-אוטומטי (ברירת-מחדל) + `forceLongPolling`.
- **ס6 קישורי-מייל** (איפוס/אימות) מובילים ל-`firebaseapp.com` ⇒ ייתכן שחסומים בקו מסונן.
  היום: איפוס ממכשיר לא-מסונן / דרך הבעלים. עתיד: מטפל-פעולות בתוך אורביט +
  `accounts:resetPassword` ל-allowlist.
- **ס7 App Check** לא-תואם (reCAPTCHA + נקודת-קצה נפרדת). היום רדום בפועל כי
  `normalizeFirebase` משמיט `appCheckKey` — **ממצא נפרד**: הגנת-המקור של 16.8 לא נדלקת
  מקונפיג בכלל. לא תוקן כאן (מחוץ להיקף) — להכרעת-בעלים.
- **ס8 מטמון-קונפיג של ארגוני-פלטפורמה** (§6.3).
- **ס9 נקודת-כשל יחידה:** תקלת-Cloudflare ⇒ מכשירים מנותבים בלי ענן (האפליקציה local-first
  ממשיכה לעבוד; הסנכרון ממתין).
- **ס10 סחף Worker↔ריפו:** הקובץ מודבק ידנית. הבדיקות נועלות את הקובץ שבריפו מול
  הקונפיגים הציבוריים (projectId/apiKey) אבל לא רואות את הפריסה ⇒ `X-Orbit-Edge`.
- **ש1** שם תת-הדומיין (`edge.orbit-il.com`) — מאושר? (`EDGE_HOST_SUFFIXES` קשיח בקוד).
- **ש2** ללקוח-החי: opt-in בקישורים או `allDevices`?
- **ש3** האם reCAPTCHA-Enterprise/SMS-protection מודלקים היום בפרויקט? (חייבים להישאר כבויים)
- **ש4** כפתור "🌉 עבור למצב-מסונן" בתוך 🩺 (במקום קישור) — המשך אפשרי.
- **ש5** חשיפה באשף (לקח 16): זה שדה-תשתית bootstrap, לא דגל-פיצ'ר; כרגע קובץ-קונפיג בלבד
  ולא ניתן-להגדרה מהענן — במכוון (§4).
