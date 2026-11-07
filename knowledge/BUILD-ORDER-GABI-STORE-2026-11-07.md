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
- **צד-גבי (לבנות):** `GET /connect/orbit` קורא `location.hash`, שולח לשרת שלו, מאמת (`verifyGabiHandoff` ב-`lib/gabi.ts` = מאמת-ייחוס: חתימה בזמן-קבוע ⇒ claims ⇒ תוקף), בודק nonce, מנקה את ה-hash מהכתובת.

### הסוד
סוד-משותף **פר-ארגון** שגבי מנפיק למנהל בעת ההרשמה. לעולם לא בקוד ולא בקונפיג (הקונפיג מסתנכרן לענן/גיבוי; `normalizeConfig` זורק כל שדה מלבד `baseUrl` — ננעל ב-ratchet).
- **v1 (מה שנבנה):** מקומי-למכשיר (`nsLsKey('maor_gabi_handoff_secret')`) — אותו דפוס של מפתח-ה-AI; מנהל בלבד. החתימה ב-WebCrypto בדפדפן, אפס קריאות-רשת; הכפתור רק מנווט (`window.open`, `noopener`).
- **v2 (מומלץ לפני השקה — חלון-בעלים):** להעביר את הסוד לכספת `orgSecrets/{slug}.gabiHandoffSecret` (Rules: read:false מהדפדפן) ולחתום ב-Function `gabiHandoff` (Bearer ID-token של מנהל ⇒ claims מהשרת ⇒ token). אותו פורמט-טוקן בדיוק — `signGabiHandoff` טהור וניתן להרצה ב-Node. יתרון: עובד/ת עם גישה למכשיר לא רואה סוד; המייל מאומת-שרת ולא נטען-לקוח.

## 3. דורמנטיות — איך מוכח (`src/lib/__tests__/gabi-store.test.ts`)
1. `public/config.json` ו-`public/c/maor-hachesed/config.json` לא מכילים `gabi`; אחרי `normalizeConfig` ⇒ `integrationOn(cfg,'gabi') === false`.
2. `integrationOn` — רק `enabled:true` מפורש; בדמו תמיד false.
3. `GabiSection` ב-SSR עם קונפיג-ברירת-מחדל ⇒ מחרוזת ריקה. שער-התצוגה `gabiSectionVisible` = הרחבה+סמכות-מנהל (עובד/ת בארגון-פלטפורמה — לא).
4. `SettingsView`: הלשונית/הצ'יפ מגודרים `integrationOn(config, 'gabi') && isAdmin` — אותו שער.
5. הגנות-מקור: אין `fetch(`/XHR/sendBeacon/firebase ב-`lib/gabi.ts` ו-`GabiSection`; אין ייבוא מ-`collect-agent`.
6. כנות: `INTEGRATION_STATUS.gabi === 'roadmap'`, `liveAddons` מסנן, אין מחיר. עודכן `integrations-wave1.test` (15 הרחבות; roadmap כולל gabi).

## 4. ההשקה (הכרעת-בעלים, לא עכשיו)
`INTEGRATION_STATUS.gabi → 'live'` · מחיר ב-`DEFAULT_INTEGRATION_PRICES` (או השארה מחוץ להצעה אם החיוב אצל גבי) · v2 של הסוד · עדכון ratchets (`integrations-wave1`, `gabi-store`) · כתובת-בסיס אמיתית בקונפיג הארגון.
