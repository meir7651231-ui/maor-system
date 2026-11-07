# BUILD-ORDER · גבי בתוך חנות-ההרחבות של אורביט (7.11.2026) — דורמנטי

**מה:** צד-אורביט של מכירת «גבי – תזכורות תשלום» (מוצר נפרד, `collect-agent/`) כהרחבה בתוך אורביט.
**מצב:** גבי **טרם הושק** ⇒ הכול דורמנטי; אפס-שינוי לכל ארגון קיים; הלקוח-החי ביט-זהה.

## 1. ההרחבה `gabi`
| מקום | מה |
|---|---|
| `src/types/config.ts` | `'gabi'` ב-`INTEGRATION_KEYS`; `INTEGRATION_SETTING_KEYS.gabi = ['baseUrl']` (לא סוד) |
| `src/components/builder/handoff.ts` | תווית `🪙 גבי – תזכורות תשלום` · `INTEGRATION_STATUS.gabi = 'roadmap'` |
| `src/lib/gabi.ts` | קטלוג (`GABI_PRODUCT`: שם · סלוגן «הכסף שלך חוזר. בלי שתצטרך לרדוף.» · ‏₪119/חודש או ₪1,190/שנה · 14 ימי ניסיון · לוגו) + חוזה-המסירה + שערי-התצוגה — טהור, אפס-רשת |
| `public/gabi/logo-mark.svg` | עותק של `collect-agent/web/public/logo-mark.svg` (הלוגו הסופי, נגזר מ-`brand/logo.ts`) — לא ייבוא חוצה-פרויקטים. בהחלפת-לוגו בגבי: להעתיק מחדש |
| `src/components/settings/GabiSection.tsx` | כרטיס-מוצר + סוד-חיבור (מקומי-למכשיר) + «🔗 התחברות לגבי»; הגדרות ← 🧪 מתקדם |
| `BuilderWizard.tsx` | שדה כתובת-הבסיס — מוצג **רק** כשהדגל כבר דלוק (אין צ'יפ-מכירה: roadmap) |

**כנות (INTEGRATION_STATUS):** `roadmap` ⇒ לא בצ'יפי-המכירה באשף, לא ב-`liveAddons` ⇒ לא בהצעת-המחיר, אין מחיר ב-`DEFAULT_INTEGRATION_PRICES`, מופיע רק ב«🔜 בפיתוח (לא נמכר עדיין)»; דגל מיובא-תקוע מוצג להסרה (מנגנון קיים). המחיר ₪119/₪1,190 = **מחיר של גבי עצמו**, מוצג בכרטיס-המוצר כמידע — לא נגבה דרך אורביט.

## 2. חוזה-המסירה (handoff) v1
```
claims = { v:1, iss:"orbit", aud:"gabi", org:<slug lowercase>, email:<manager lowercase>,
           iat:<sec>, exp:<sec>, nonce:<16–64 [A-Za-z0-9_-]> }
payload = b64url(JSON(claims))            // סדר-שדות קנוני: v,iss,aud,org,email,iat,exp,nonce
sig     = b64url(HMAC-SHA256(secret, "gabi-handoff-v1." + payload))
token   = payload + "." + sig
URL     = {baseUrl}/connect/orbit#h={token}   // fragment: לא נשלח לשרת, לא ב-Referer/לוגים
```
- **תוקף:** ברירת-מחדל 120 שנ'; תקרה קשיחה 300 (גבי דוחה `exp−iat > 300`); סבילות-שעון 60 שנ' לאחור.
- **חד-פעמיות:** גבי שומר nonce-ים שנראו עד `exp` ודוחה חזרה (מצב-שרת של גבי — לא באורביט).
- **אסור:** `org` ∈ {`default`,`demo`} (אתר-השורש והדמו לא מתחברים); מייל לא-תקין; סוד < 32 תווים.
- **מה עובר:** מזהה-ארגון + מייל-המנהל בלבד — **אפס נתוני-לקוחות/כסף**. גבי משתמש בזה לזיהוי/קישור-חשבון בלבד (התחברות-אמת בגבי עדיין שלו).
- **צד-גבי — נבנה (§5):** `GET /connect/orbit` (דף סטטי) קורא את ה-fragment, מנקה את שורת-הכתובת ושולח `POST /api/connect/orbit` (גוף JSON; query ⇒ 400). השרת מאמת ומחזיר ארגון+מייל בלבד — **לא סשן**.

### הסוד
סוד-משותף **פר-ארגון** שגבי מנפיק למנהל בעת ההרשמה. לעולם לא בקוד ולא בקונפיג (הקונפיג מסתנכרן לענן/גיבוי; `normalizeConfig` זורק כל שדה מלבד `baseUrl` — ננעל ב-ratchet).
- **v1 (נשאר כנפילה-לאחור):** מקומי-למכשיר (`nsLsKey('maor_gabi_handoff_secret')`) — אותו דפוס של מפתח-ה-AI; מנהל בלבד. החתימה ב-WebCrypto בדפדפן; הכפתור רק מנווט (`window.open`, `noopener`). משמש כשאין ענן, או כשהפונקציה לא זמינה ויש סוד-מקומי.
- **v2 — נבנה, לא פרוס (§6):** הסוד בכספת `orgSecrets/{slug}.gabiHandoff` (Rules קיימים: מנהל-ארגון כותב, read:false — **אין שינוי-Rules**) ונחתם ב-Function `gabiHandoff`. המייל = מה-ID-token המאומת בשרת, לא מהבקשה.

## 3. דורמנטיות — איך מוכח (`src/lib/__tests__/gabi-store.test.ts`)
1. `public/config.json` ו-`public/c/maor-hachesed/config.json` לא מכילים `gabi`; אחרי `normalizeConfig` ⇒ `integrationOn(cfg,'gabi') === false`.
2. `integrationOn` — רק `enabled:true` מפורש; בדמו תמיד false.
3. `GabiSection` ב-SSR עם קונפיג-ברירת-מחדל ⇒ מחרוזת ריקה. שער-התצוגה `gabiSectionVisible` = הרחבה+סמכות-מנהל (עובד/ת בארגון-פלטפורמה — לא).
4. `SettingsView`: הלשונית/הצ'יפ מגודרים `integrationOn(config, 'gabi') && isAdmin` — אותו שער.
5. הגנות-מקור: אין `fetch(`/XHR/sendBeacon/firebase ב-`lib/gabi.ts` ו-`GabiSection`; אין ייבוא מ-`collect-agent`.
6. כנות: `INTEGRATION_STATUS.gabi === 'roadmap'`, `liveAddons` מסנן, אין מחיר. עודכן `integrations-wave1.test` (15 הרחבות; roadmap כולל gabi).

## 4. ההשקה (הכרעת-בעלים, לא עכשיו)
`INTEGRATION_STATUS.gabi → 'live'` · מחיר ב-`DEFAULT_INTEGRATION_PRICES` (או השארה מחוץ להצעה אם החיוב אצל גבי) · **פריסת `gabiHandoff`** (קוד מוכן, §6) · עדכון ratchets (`integrations-wave1`, `gabi-store`) · כתובת-בסיס אמיתית בקונפיג הארגון.

## 5. צד-גבי — `/connect/orbit` (נבנה 7.11 ערב · `collect-agent/app/orbit_connect.py`)
| מה | איך |
|---|---|
| סוד פר-ארגון | `BusinessSecrets` שדה `orbit_handoff_secret` (SecretBox AES-GCM, הקשר `biz:1:orbit_handoff_secret`); בלי `COLLECT_MASTER_KEYS` ⇒ 503 (נכשל סגור). לעולם לא מוחזר בקריאה |
| קישור ארגון⇄עסק | טבלת `orbit_links` (שלב 1 = עסק יחיד, `business_id=1`); ארגון שני ⇒ 409 עד ביטול |
| בעלים (מאומת, ב-audit) | `GET /orbit/link` (מצב, בלי סוד) · `POST /orbit/link/secret {org}` (הנפקה/רוטציה — הסוד מוצג **פעם אחת**, הישן מת מיד; `orbit_secret_issued/rotated`) · `POST /orbit/link/unlink` |
| אימות | אורך ≤2048 ⇒ פורמט b64url ⇒ סכמה **סגורה** (8 שדות בדיוק, `type(v) is int`, מייל lowercase, nonce 16–64) ⇒ `default`/`demo` נדחים ⇒ ארגון מקושר (לא-מקושר ⇒ HMAC מדומה ונכשל כ«חתימה», בלי מנייה) ⇒ `hmac.compare_digest` ⇒ `v=1`/`iss=orbit`/`aud=gabi` ⇒ `0 < exp−iat ≤ 300` ⇒ `iat−60 ≤ now < exp` ⇒ nonce |
| חד-פעמיות | `orbit_nonces` (sha256 של org:nonce + exp), INSERT על מפתח-ראשי = בדיקה אטומית; ניקוי `exp < now−60` בכל אימות |
| קצב | קבוצה `orbit_connect` = 20 לדקה ל-IP (שני הנתיבים); כשל = 401 אחיד, הסיבה רק ב-audit (`orbit_handoff_rejected`); הצלחה ⇒ `orbit_handoff_ok` עם גיבוב-מייל |
| **הכרעת-תכנון: אין סשן מהטוקן** | הצלחה מחזירה `{org, email, next:"login"}`; הדף מציג טופס-כניסה עם המייל ממולא (קריאה-בלבד) ודורש **סיסמה + TOTP** דרך `/auth/login` הקיים. כך גם דליפת סוד-המסירה/טוקן לא נותנת גישה לנתוני-חייבים, ו-`REQUIRE_USER_LOGIN=1` (שער 6) לא נעקף. אין יצירת-משתמש אוטומטית — בעל העסק מוסיף עובד/ת כמו היום |
| מלאי-נתיבים | `/connect/orbit`, `/api/connect/orbit` ב-`PUBLIC_ROUTES` (test_security); נתיבי `/orbit/link*` מוגנים (401 בלי אימות); `wipe` מוחק את שתי הטבלאות |

**כתובת-הבסיס:** `baseUrl` באורביט = שורש-גבי (הנתיב `/connect/orbit` נוסף לה). בסיס עם תת-נתיב יוביל ל-`{prefix}/connect/orbit` — לא נתמך בצד-גבי כרגע.

## 6. צד-אורביט v2 — `functions/gabiHandoff.js` (נבנה · **לא פרוס**)
- `POST` בלבד, `org` בגוף; `Authorization: Bearer <ID-token>` ⇒ `verifyIdToken` ⇒ המבקש = `platformOrgs/{slug}.manager` או מייל-על; `config.integrations.gabi.enabled === true`; `baseUrl` https; סוד ≥32 מ-`orgSecrets/{slug}.gabiHandoff` (חסר ⇒ 412). `default`/`demo`/`root` ⇒ 400. `Cache-Control: no-store`; אין לוג של טוקן/כתובת.
- ליבה טהורה (`buildClaims`/`signToken`/`connectUrl`/`handoffUrl`) — Node crypto; מיוצא ל-index רק ה-endpoint.
- `GabiSection`: כשיש ענן (`gabiPreferServer`) — «שמירה בכספת» (`writeOrgSecrets`, מדד «מוגדר ✓» מ-`orgSecretsMeta`, הסוד המקומי נמחק) ו«התחברות» קוראת ל-`requestGabiHandoff` (lib/cloud, ייבוא דינמי); הכתובת שחוזרת מתקבלת רק אם זהה בדיוק ל-`gabiConnectUrl(base, token)` (`gabiServerUrlOk`). כשל/לא-פרוס ⇒ נפילה ל-v1 אם יש סוד-מקומי. הכול עדיין מאחורי `integrationOn('gabi')` — ratchet `gabi-store` מוכיח ביט-זהה לשני הקונפיגים-החיים.
- **וקטור-זהב משותף** (סוד `orbit-gabi-golden-vector-secret-0123456789`, org `acme-studio`, iat 1762500000): `functions/gabiHandoff.test.mjs` מוכיח שהשרת (Node) ו-`gabi.ts` (WebCrypto) מפיקים אותו טוקן בדיוק; `collect-agent/tests/test_orbit_connect.py` מוכיח שגבי (Python) מאמת אותו.
- בדרך נמצא ותוקן: `functions/gcontactsSync.js` הגדיר `exports.gcontactsSync = …` **אחרי** `module.exports = {…}` ⇒ ה-endpoints לא הגיעו ל-index (לא היו נפרסים). עכשיו `module.exports.…` + ratchet.

**חלון-בעלים (לא בוצע):** פריסת `gabiHandoff` (`deploy-functions.yml`) · `COLLECT_MASTER_KEYS` בפריסת-גבי · הנפקת סוד בגבי והדבקתו באורביט · Rules — **אין צורך בשינוי** (`orgSecrets` כבר: מנהל כותב, read:false).

