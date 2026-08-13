# telephony — מנוע מרכזייה מתצורה-עצמית (config-as-data → מרכזייה)

מנוע שמקבל **נתוני-לקוח בלבד** ומחולל לבד את כל קונפיג-המרכזייה. הלקוח ממלא
טופס — המערכת מרכיבה את הניתוב. אין הרכבה ידנית פר-לקוח: onboarding = נתונים, לא בנייה.

## 🔒 עיקרון-הברזל: pure-downstream

> **אנחנו אחרי כל הספקים. מדברים רק עם הלקוח. לא תלויים באף ספק.**

- **אין** אינטגרציית-ספק, **אין** API-של-ספק, **אין** חברת-טלפון שמינית, **אין** SIP-trunk שנקנה מחברה.
- כל מספר נכנס דרך **ציוד-הלקוח** או **הפניה שהלקוח מגדיר אצל הספק הקיים שלו**:
  | onramp | מה זה | הזרימה |
  |---|---|---|
  | `sim-in-gateway` | ה-SIM הפיזי של הלקוח יושב בשער-GSM שלו | שיחה→שער→SIP→המרכזייה |
  | `customer-forward` | מספר-וירטואלי; הלקוח מגדיר הפניה בפורטל-הספק שלו אל יעד-שלנו | הספק מפנה→המרכזייה |
  | `device-link` | ווצאפ ריבוי-מכשירים (קישור-מכשיר, **לא** Business API) | גשר-הודעות נפרד — **מדולג מהדיאלפלן הקולי** |

המנוע אוכף את זה בקוד: הדיאלפלן מדבר רק עם `sofia/gateway/<tenant>-gwN` (שער-הלקוח)
ועם ה-`user/...@<tenant>` (ה-softphones). `device-link` לא מגיע לדיאלפלן כלל.

## מה המנוע עושה

```
קונפיג-לקוח (JSON)                         קבצי-מרכזייה מוכנים-להתקנה
────────────────────    validate → generate    ─────────────────────────
tenantId, orgName,      ───────────────────►    dialplan/tenant_<id>.xml
officeHours, numbers[],                          directory/<id>.xml
destinations, outbound,                          sip_profiles/gateways/<id>.xml
cti                                              manifest.json
```

הניתוב שמחולל:
1. **שער-זמן** — בתוך שעות-המשרד → הכל מצלצל במשרד; מחוצה לו → חוזר למנהל.
2. **כניסה פר-מספר** — כל DID מזוהה (`inbound_line`/`inbound_number` ל-CTI) ומנותב.
3. **אין-מענה במשרד** → נופל לאחרי-שעות (מנהל → תא-קולי-במייל).
4. **יציאה נבחרת-מספר** — קידומת `N#<מספר>` יוצאת דרך SIM-N (הצד-השני רואה את מספר-N).
5. **יציאת-ברירת-מחדל** — חיוג רגיל יוצא דרך המספר שנבחר.

## שימוש

```bash
# בדיקה יבשה (manifest + סייגים בלבד)
node telephony/cli.mjs telephony/fixtures/tenant-chesed.json

# חילול קבצים לתיקייה
node telephony/cli.mjs telephony/fixtures/tenant-chesed.json /path/to/out

# מתוך קוד
import { buildTenant } from './telephony/lib/index.mjs';
const { ok, errors, warnings, files, manifest } = buildTenant(tenantJson);
```

## בדיקות

```bash
node telephony/test.mjs            # אימות golden ביט-לביט + יחידה (28 בדיקות)
UPDATE=1 node telephony/test.mjs   # הקפאת golden מחדש (רק אחרי שינוי-מכוון)
```

הפלט **דטרמיניסטי** (אין `Date`/`random`) ⇒ אותו קלט תמיד אותו פלט ⇒ golden אמין.
כל שינוי לא-מכוון בפלט נתפס בהשוואת-ה-golden.

## קבצים

| קובץ | תפקיד |
|---|---|
| `schema.json` | מודל-הנתונים של קונפיג-הלקוח (JSON Schema, טהור-נתונים) |
| `lib/normalize.mjs` | נרמול E.164 (ישראל ברירת-מחדל), טהור |
| `lib/validate.mjs` | שער-תקינות + נרמול + סייגי-downstream, טהור |
| `lib/generate.mjs` | המנוע — tenant → FreeSWITCH XML, דטרמיניסטי, טהור |
| `lib/cti.mjs` | גשר screen-pop — מתקשר→Family/Supporter במאור (קריאה-בלבד) |
| `lib/onboard.mjs` | תצורה-עצמית — תשובות-אשף מינימליות → קונפיג מלא |
| `lib/apply.mjs` | תכנון-החלה אידמפוטנטי + isolation + rollback (רב-דיירת) |
| `lib/channels.mjs` | מודל רב-ערוצי downstream — ווצאפ קישור-מכשיר + SMS דרך SIM |
| `lib/index.mjs` | תזמור `buildTenant` (validate→generate) + ריֶיֶקספורט |
| `cli.mjs` | הרצה משורת-הפקודה (לקוח-יחיד) |
| `apply-cli.mjs` | כלי-המפעיל — תיקיית-לקוחות → ספריית-מרכזייה, מרכזית |
| `test.mjs` | golden + יחידה (69 בדיקות) |
| `fixtures/tenant-chesed.json` | לקוח-דוגמה: 7 מספרים מעורבים (SIM/וירטואלי/ווצאפ/SMS/כשר) |
| `fixtures/intake-minimal.json` | תשובות-אשף מינימליות (בדיקת תצורה-עצמית) |
| `fixtures/maor-db.json` | תצלום-DB דוגמה ל-CTI |
| `fixtures/golden/` | הפלט הקפוא להשוואה |

## חיבור למאור (CTI)

`cti.mode`: `off` (ברירת-מחדל) · `directory` (קריאת `directory/<e164>` בענן opt-in) · `api`.
המנוע צורב `inbound_number` בכל שיחה נכנסת — זה המפתח ל-screen-pop מול Family/Supporter
במאור. downstream: **קריאה בלבד**, אין כתיבה לספק.

## מה זה לא

- לא מתקין FreeSWITCH ולא מגדיר רשת (זה שלב-התקנה — משתני-`$${...}` מוזרקים אז).
- לא מדבר עם אף ספק-תקשורת. לא מנפיק מספרים. לא רוכש trunk.
- לא מטפל בזרימת-ווצאפ עצמה (גשר-ההודעות = מודול נפרד; כאן רק סימון שהמספר קיים).
