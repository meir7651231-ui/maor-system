# CLOSED · ורטיקל הסטודיו (דיגיטל + בנייה) — דוח סגירה

**תאריך:** 2026-08-16 · **ענף:** `claude/contacts-verticals` (מוזג ל-main דרך PR #158/#160/#161/#162/#164)
**בקשת-בעלים:** *"אני מפתח אפליקציות אתרים וכל מה שקשור בבניה ויש לי את מאור ובנייה חכמה — ווריטקל מהתחלה עד הסוף מותאם אישית"* → *"תסיים את מה שכבר יש לי"*.

מסמך זה סוגר את קשת-העבודה שהפכה את מאור מ"מערכת-עמותה עם שמות אחרים" ל**ורטיקל מסחרי מלא לסטודיו פיתוח+בנייה** — בלי אובדן יכולת ובלי נגיעה בלקוח-החי.

---

## 1 · מה נבנה (שלוש שכבות)

### א. ייבוא אנשי-קשר (VCF) — `lib/vcardImport.ts`
מנתח-vCard טהור: `parseVcards` · `importableContacts` · `contactToRow` · `isJunkContact` · `decodeQuotedPrintable`.
- **פתירת-שורות מודעת-QP:** רק שורות `QUOTED-PRINTABLE` מאחדות `=` תלוי; padding של PHOTO ב-base64 **אינו** בולע גבולות-כרטיס (הבאג שנתפס על קובץ-אמת: 1978 מול 1997 כרטיסים → תוקן ל-1997).
- אומת על קובץ-שדה אמיתי: **1997 כרטיסים → 1953 בני-ייבוא** (סינון junk).
- חיווט: `ImportSection.tsx` — לשונית **📇 אנשי-קשר (VCF)** (`route='contacts'`, רכיב `ContactsImport`) עם **בורר-יעד** (משפחות / לידים) · דדופ · תצוגה-מקדימה דו-שלבית.

### ב. שלושה ורטיקלים מסחריים — `lib/verticalPacks.ts`
| id | תווית | תחום | מודולים כבויים |
|----|-------|------|----------------|
| `digital` 💻 | סטודיו דיגיטל | אפליקציות · אתרים · פיתוח | courses · diary · tzedaka · shop |
| `build` 🏗️ | בנייה / קבלנות | אתרים · קבלני-משנה · שלבי-ביצוע | courses · tzedaka · shop |
| `studio` 🏢 | סטודיו דיגיטל + בנייה | פרויקטים · לקוחות · ספקים — משולב | courses · tzedaka · shop |

מיפוי-מונחים מלא לכל חבילה: `nav.families`→לקוחות · `nav.supporters`→ספקים/לידים · `nav.ayin`→**פרויקטים** · שלבי-העין = משפך-פרויקט (בריף→הצעת-מחיר→בפיתוח/בביצוע→בבדיקה/מסירה→הושק/הושלם). ב-`build`/`studio` היומן = **אתרי-בנייה/צוותים** (`entity.room`→אתר).
כל שלוש נושאות `features: COMMERCIAL_OFF` (ראו §3).

### ג. מנוע תמחיר-פרויקט על "העין" — `lib/ayin.ts` + `AyinCard.tsx`
משפך-הפרויקטים (`AyinCase` על `Supporter`) הפך לכלי job-costing מלא. **כל התוספות additive** (שדות/מערכים אופציונליים — אפס מיגרציה):

1. **כתב-כמויות / הצעת-מחיר (BOQ)** — `AyinName.rate?`; שורת-פריט מקבלת מחיר-יחידה → `boqLineAmount(n)` (eyes×rate) → `boqTotal(a)` = סה"כ-הצעה.
2. **שעתון פר-פרויקט** — `TimeEntry{date,hours,note,rate?}` ב-`AyinCase.time[]`; `timeHoursTotal` / `timeCostTotal` (Σ hours×rate) = עלות-עבודה.
3. **חומרים ורכש** — `MatEntry{name,qty,cost}` ב-`AyinCase.mat[]`; `matCostTotal` (Σ qty×cost) = עלות-חומרים.
4. **P&L מרוכז** — כרטיס "💰 רווחיות הפרויקט": **הצעה − עבודה − חומרים = רווח גולמי**; שורת נגבה/יתרה (`collected = supIls(sp)` — התשלומים שנרשמו על אותו לקוח).
5. **תבניות-הצעה** (למידה מ-בנייה-חכמה) — `QuoteTemplate{id,name,lines[]}` ב-`db.ui.quoteTemplates`; `namesToTemplateLines`/`templateLinesToNames`; שמור-BOQ-כתבנית → החל-בקליק על פרויקט חדש (החלפה-לפי-שם, תקרה 30).

פעולות-store: `ayinSetNameRate` · `ayinAddTime`/`ayinRemoveTime` · `ayinAddMat`/`ayinRemoveMat` · `saveQuoteTemplate`/`applyQuoteTemplate`/`deleteQuoteTemplate`.

---

## 2 · שילוב-הטלפוני (רקע — PR #158)
לפני הורטיקל: יכולות-הדמו של הטלפוניה חוברו למקומן הנכון במאור — **צ׳יפי-הקשר-חסד** על כרטיס-שיחה-נכנסת (`callerId.familyContext` — מסירות-פתוחות + שיוכי-חנות פעילים) ו**זמני-שבת/הדלקת-נרות** בווידג'ט-הבית (`nextClosure` דרך `telephony/lib`). downstream טהור — בלי ספק/API/trunk, בלי הנפקת-קבלות. הקשר מלא: היסטוריית-הסשן.

---

## 3 · האינווריאנט השולט — גידור-מסחרי, אפס-נגיעה בלקוח-החי

**`!featureOn(cfg,'core.taxreceipt')` = "ארגון מסחרי".** `COMMERCIAL_OFF` מכבה `core.taxreceipt` לכל 10 החבילות המסחריות (העמותתיות שומרות אותו דלוק). לכן כל פיצ'רי-הסטודיו מגודרים:
```ts
const boqOn  = featureOn(cfg,'supporters.ayin.boq')  && !featureOn(cfg,'core.taxreceipt');
const timeOn = featureOn(cfg,'supporters.ayin.time') && !featureOn(cfg,'core.taxreceipt');
const matOn  = featureOn(cfg,'supporters.ayin.mat')  && !featureOn(cfg,'core.taxreceipt');
```
- **הלקוח-החי (מאור-החסד, עמותה) לא רואה כלום** — §46 דלוק אצלו ⇒ כל מנוע-התמחיר מוסתר לגמרי.
- **additive-only** — כל השדות אופציונליים (`?`), `emptyAyin()` זורע `time:[],mat:[]`, אפס `DB_VERSION` bump, אפס מיגרציה.
- שלושת הדגלים החדשים (`supporters.ayin.boq/time/mat`) חסרים-כברירת-מחדל אצל כולם ⇒ צריך גם ורטיקל-מסחרי **וגם** הדלקת-דגל.

---

## 4 · מפת-קבצים
| קובץ | תוספת |
|------|-------|
| `src/lib/vcardImport.ts` | מנתח-VCF טהור (חדש) |
| `src/components/settings/ImportSection.tsx` | לשונית contacts + `ContactsImport` |
| `src/lib/verticalPacks.ts` | חבילות `digital`/`build`/`studio` + `COMMERCIAL_OFF` |
| `src/types/features.ts:125-127` | דגלים `supporters.ayin.boq/time/mat` |
| `src/types/domain.ts` | `AyinName.rate?` · `TimeEntry` · `MatEntry` · `AyinCase.time?/mat?` · `QuoteTemplate` · `UiPrefs.quoteTemplates?` |
| `src/lib/ayin.ts:94-140` | `boqLineAmount`/`boqTotal`/`timeHoursTotal`/`timeCostTotal`/`matCostTotal`/`namesToTemplateLines`/`templateLinesToNames` |
| `src/store/useApp.ts` | 8 פעולות job-costing/תבניות |
| `src/components/supporters/AyinCard.tsx` | סעיפי BOQ · שעתון · חומרים · P&L · תבניות |
| `src/lib/callerId.ts` · `src/components/home/widgets.tsx` | טלפוני (PR #158) |

## 5 · אינוונטר-ratchet (שער-הרגרסיה)
- `src/lib/__tests__/ayin.test.ts` — describes: **BOQ** (206) · **שעתון** (237) · **חומרים** (261) · **תבניות** (279); כולם כוללים הגנת-מקור על `AyinCard` (`?raw` + regex).
- `src/lib/__tests__/vcardImport.test.ts` — 12 בדיקות (QP-unfold · junk · label-map · round-trip).
- `src/lib/__tests__/vertical-packs.test.ts` — 10 החבילות (כולל digital/build/studio) ב-loop `INTENTIONAL_ON` (ratchet כיסוי-מלא: לכל מודול עמדה מפורשת).
- `src/lib/__tests__/signup-wizard.test.ts` — `WIZARD_INDUSTRIES.length === 13`.
- `e2e/vertical-matrix.mjs` + `e2e/vertical-matrix-data.json` — סחף-דליפות-מונחים לכל החבילות.

## 6 · למידה מ-בנייה-חכמה (BuildSmart)
נחקרו שני ריפו-חקירה ב-`app_flutter`/`app`. הפנינה הניתנת-להעברה-נקייה: **`DraftQuote` + `projectTemplates`** — נמל כ**תבניות-הצעה** (§1ג-5). ארבע למידות-המשך דורגו והוצגו לבעלים (מנוע "אל-תשכח-את-האביזרים"/install-kit · plan-scan→BOQ · snagging · dispatch) — **לא נבנו** בהחלטת-בעלים ("תסיים את מה שכבר יש לי").

## 7 · מה נותר (מוגדר-היקף-בעתיד — לא loose-end)
מהשרטוט (`studio-blueprint`): **גאנט-תלויות** ו**מלאי-מחסן חוצה-פרויקטים** — שדרוגים אמיתיים "בגבול", ממתינים להגדרת-היקף. וכן מנוע-ה-install-kit מבנייה-חכמה. אין אף פריט בנוי שנשאר חצי-מחווט.

---

## 8 · זהות-חזותית פר-ורטיקל (16.8 ערב — הכרעת-בעלים "שיחליף אימוני וסגנון האתר בשינוי וורטיקל")
עד כה בחירת-ורטיקל באשף החליפה **רק** מונחים+מודולים+דגלים. עכשיו היא מלבישה **זהות מלאה** — הכרעת-בעלים: "הכל מוחלף חוץ מצבע שנבחר ידנית".

- **`VerticalPack` הורחב** (`theme`/`accent`/`icon`/`motion`) — כל 13 החבילות. מסחריות: ערכה+צבע+אימוג'י+תנועה ייחודיים (למשל build=🏗️/tsohar/כתום/bold · studio=🏢/kehila/טורקיז/calm · digital=💻/heichal/אינדיגו/snappy). עמותתיות (חסד/גמ"ח/התרמה): `theme:'or-rishon'` בלבד ⇒ מראה קלאסי, אות-ראשונה — **ביט-זהה ללקוח-החי**.
- **`applyVerticalPack`** מחיל theme/accent/emoji/motion; שומר `accent` כשהמשתמש בחר ידני (`config.accentCustom`).
- **`config.emoji`** (חדש) — אייקון-הארגון: בכותרת (בשלושת השלדים — top/side/side-wide) במקום האות-הראשונה, וב-**favicon** דינמי (`faviconDataUri`/`applyFavicon` ב-lib/config; SVG-אימוג'י). חסר ⇒ נפילה לאות-ראשונה/לוגו (הלקוח-החי בלי emoji ⇒ ללא-שינוי).
- **`config.motion`** (חדש, `MOTION_KEYS`=calm/snappy/bold) — `data-motion` על ה-root דרך `applyTheme` (הורחב לפרמטר שלישי; 5 קריאות-store עודכנו); CSS מכוונן מהירות/עקומת-מעברים למשטחים אינטראקטיביים, **מכבד `prefers-reduced-motion`**.
- **ערכה = גם שלד:** `theme` קובע את שלד-הניווט (tsohar=רצועת-אייקונים · or-rishon=פס-רחב · heichal/kehila=עליון) — כך ההחלפה חזותית-דרמטית, לא רק צבע.
- **אשף:** צבע-ידני ⇒ `accentCustom:true` (נשמר בהחלפה); שדה **"אימוג'י הארגון"** בסעיף המיתוג; בחירת-חבילה מיישרת גם `db.ui` לתצוגה-חיה.
- **חיטוי:** `normalizeConfig` — emoji (מחרוזת≤12), motion (allowlist), accentCustom (true בלבד).
- **ratchets:** `vertical-packs.test.ts` (זהות פר-חבילה · שמירת-צבע-ידני · חסד-קלאסי · הגנת-מקור packSrc/appSrc) · `config-identity.test.ts` (חיטוי + faviconDataUri). אומת חזותית: build↔studio — שני מראות מובחנים (theme/accent/motion/emoji/favicon).

---
**סטטוס:** ✅ הכל נבנה · אומת ב-`verify:fast` (typecheck+lint+test, ‏1516 בדיקות ירוק) · פרוס ל-main (‏#158/#160/#161/#162/#164 + זהות-חזותית). הורטיקל מוכן-לשימוש end-to-end.
