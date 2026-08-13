# 🔌 חיבור מנוע-הטלפוניה למאור — מסמך-לארכיטקט

> **סטטוס:** `draft` · הצד-שמאור נוגע בו. המנוע עצמו חי ב-`telephony/` (עצמאי, 69 בדיקות).
> **עיקרון-ברזל:** pure-downstream — אין ספק, אין API-ספק. ראה `telephony/README.md`.

מסמך זה מתאר **איך** מנוע-הטלפוניה (`telephony/`, JS טהור עצמאי) מתחבר לאפליקציית-מאור
(React/`src/`) — בלי לשבור את האינווריאנט "ברירת-מחדל כבוי = ביט-זהה להיום".

## מה כבר קיים ומוכן (אין-תלות-במאור)

| יכולת | קובץ | סטטוס |
|---|---|---|
| קונפיג-לקוח → קונפיג-מרכזייה (golden) | `telephony/lib/generate.mjs` | ✅ מלא, 69 בדיקות |
| נרמול E.164 | `telephony/lib/normalize.mjs` | ✅ |
| ולידציה + סייגי-downstream | `telephony/lib/validate.mjs` | ✅ |
| **גשר-CTI: מתקשר→Family/Supporter** | `telephony/lib/cti.mjs` | ✅ טהור, קורא צורת-DB של מאור |
| תצורה-עצמית (אשף→קונפיג) | `telephony/lib/onboard.mjs` | ✅ |
| החלה רב-דיירת + rollback | `telephony/lib/apply.mjs` | ✅ |
| מודל רב-ערוצי downstream | `telephony/lib/channels.mjs` | ✅ |

`cti.mjs` **כבר יודע** את צורת-ה-DB של מאור (מקור-אמת `src/types/domain.ts`):
`Supporter.phone` יחיד; `Family`/`Member`/`Teacher` עם `phone`+`phone2`. אין צורך בשינוי-סכמה
כדי לבנות `directory`.

## 3 נקודות-המגע במאור (מה הארכיטקט בונה)

### 1. דגל-גידור `core.telephony` (ברירת-מחדל כבוי = ביט-זהה)
- הוסף ל-`src/types/features.ts` דגל `core.telephony` (חסר/`false` = כבוי לגמרי).
- כל UI/לוגיקה חדשה מגודרת `featureOn(cfg, 'core.telephony')`. כבוי ⇒ שום מסך/כתיבה חדשים ⇒
  ביט-זהה (ratchet + הגנת-מקור, כמו כל דגל).

### 2. גשר-הספרייה (`directory/<e164>`) — הבחירה מכריעה בגלל local-first
מאור local-first; ה-PBX (אצל המפעיל) צריך להצליב מתקשר. שלוש דרכים (`cti.mode` בקונפיג-הלקוח):
- **`off`** (ברירת-מחדל) — אין screen-pop. אפס-נגיעה.
- **`directory`** — מאור כותב (opt-in, מגודר-דגל) אינדקס `directory/<e164> → {kind,id,name}` ל-Firebase
  הקיים של הארגון. בונים אותו מ-`buildDirectory(db)` (כבר קיים). ה-PBX קורא מפתח-מינימלי בלבד —
  **לא** את ה-DB. זה המסלול המומלץ כשהמרכזייה אצל המפעיל.
- **`api`** — הרחבה עתידית (read-API של מאור). לא נדרש עכשיו.
  > המלצה: **directory**. `buildDirectory` דטרמיניסטי; הכתיבה = diff קטן ב-cloudSync הקיים, מגודרת-דגל.
  > אף מספר לא נכתב plaintext מעבר למה שכבר בענן (אותה הצפנת-envelope opt-in). קריאה-בלבד ל-PBX.

### 3. אירוע-שיחה נכנס → screen-pop + לוג
- הדיאלפלן צורב `inbound_number` (ה-DID שהמתקשר חייג אליו) ואת caller-id בכל שיחה (ראה
  `generate.mjs`, `in_<id>` extensions). זה המפתח.
- כשמאור מקבל את האירוע (webhook/עדכון-חי — מסלול-החיבור לבחירת-הארכיטקט), קורא
  `lookupCaller(db, callerNumber)` (מסלול local-first) **או** `lookupInDirectory(dir, n)` ופותח את
  כרטיס-ה-`primary`.
- **לוג-שיחה:** ל-`EventType` של מאור כבר יש `'call'` (ראה `domain.ts`) ו-`Supporter.nextEventId`
  לאירוע-'שיחה'. שיחה→רשומת-אירוע היא **תוספת** (additive), מגודרת-דגל, לא נוגעת ברצף-הקבלות.

## מה **לא** נכנס למאור (גבול-תפקיד)
- אין קוד-ספק, אין SIP, אין FreeSWITCH ב-`src/`. המנוע נשאר ב-`telephony/` (או שירות-מפעיל נפרד).
- מאור נותן **נתוני-אנשי-קשר לקריאה** ומקבל **אירוע-שיחה**. שום דבר מעבר.
- הכסף/הקבלות לא זזים. לוג-שיחה = אירוע-לוח, לא קבלה.

## סדר-עבודה מוצע (כשמחליטים להתחיל את צד-מאור)
1. דגל `core.telephony` + ratchet ביט-זהה-בכבוי.
2. `buildDirectory` → כתיבת `directory/*` ב-cloudSync (opt-in, מגודר). ratchet: כבוי ⇒ אפס-כתיבה.
3. קליטת-אירוע-שיחה → `lookupCaller`/`lookupInDirectory` → פתיחת-כרטיס. e2e: מספר-מוכר קופץ.
4. לוג-שיחה additive (`EventType 'call'`). ratchet: רצף-קבלות לא-מושפע.

## הרצה מהירה (אימות-עצמאי, בלי מאור)
```bash
node telephony/test.mjs                                   # 69 בדיקות ✅
node telephony/cli.mjs telephony/fixtures/tenant-chesed.json   # dry-run
node telephony/apply-cli.mjs <tenantsDir> <configRoot> --write # החלה מרכזית
```
