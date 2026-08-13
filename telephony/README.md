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
| `lib/config.mjs` | דגלים `featureOn` · מונחים `termOf` · ורטיקלים · שכבות · diff |
| `lib/validate.mjs` | שער-תקינות + נרמול + סייגי-downstream, טהור |
| `lib/hebcal.mjs` | לוח עברי טהור (Intl) — סיווג חג/שבת/צום + ימי-סגירה |
| `lib/routing.mjs` | ניתוב-עשיר — IVR/תור/חסימה/חיוג-מהיר (normalizeRouting) |
| `lib/prompts.mjs` | ברכות/הכרזות — requiredPrompts + יכולות |
| `lib/generate.mjs` | המנוע — tenant → FreeSWITCH XML, דטרמיניסטי, טהור |
| `lib/cti.mjs` | גשר screen-pop — מתקשר→Family/Supporter + העשרה (קריאה-בלבד) |
| `lib/onboard.mjs` | תצורה-עצמית — אשף/CSV/autodetect/preview/preflight/clone |
| `lib/apply.mjs` | החלה אידמפוטנטית + isolation + rollback + drift + audit + health |
| `lib/channels.mjs` | רב-ערוצי downstream — תבניות/הסכמה/תיבה-מאוחדת/שימוש |
| `lib/security.mjs` | בידוד-סודות · ACL · הקשחה · הצפנה · fail-safe · תאימות |
| `lib/billing.mjs` | CDR · מדידת-שימוש · תוכניות-חיוב · מכסות |
| `lib/simulate.mjs` | סימולטור-שיחה — עוקב מסלול דרך הקונפיג (בלי PBX) |
| `lib/validators.mjs` | XML well-formed + JSON-Schema (תת-קבוצה) |
| `lib/index.mjs` | תזמור `buildTenant` (validate→generate) + ריֶיֶקספורט מלא |
| `tel.mjs` | CLI מלוטש — validate/preview/report/build/apply |
| `cli.mjs` · `apply-cli.mjs` | הרצת-לקוח-יחיד · כלי-מפעיל מרכזי |
| `test.mjs` | golden (5 סטים) + יחידה (303 בדיקות) |
| `UPGRADE-100.md` | מעקב 100 השדרוגים (10 גלים) |
| `fixtures/*.json` | לקוחות-דוגמה (chesed/kollel/full/voice) + intake + maor-db |
| `fixtures/golden*/` | הפלט הקפוא להשוואה ביט-לביט |

## ארכיטקטורה

```
                       קונפיג-לקוח (config-as-data · JSON)
                                    │
   ┌────────────────────────────────┼────────────────────────────────┐
   │ onboard  →  config (דגלים/מונחים/ורטיקל)  →  validate  →  routing │
   │  (אשף/CSV)         (featureOn/termOf)         (+hebcal)  (IVR/תור) │
   └────────────────────────────────┼────────────────────────────────┘
                                    ▼
                          generate  (טהור · דטרמיניסטי)
                                    │
        ┌──────────────┬────────────┼─────────────┬───────────────┐
        ▼              ▼            ▼             ▼               ▼
   dialplan/       directory/   gateways/     manifest      (golden-tested
   <ctx>.xml       <id>.xml     <id>.xml      .json          ביט-לביט)
        │                                         │
        ▼ apply (אידמפוטנטי · isolation · rollback · drift · audit)
   ספריית-המרכזייה של המפעיל  ──────────►  FusionPBX/FreeSWITCH רב-דיירת
        ▲                                         │
        │  cti (screen-pop, קריאה-בלבד) ◄─────────┘
   maor (Family/Supporter)          channels (ווצאפ device-link · SMS דרך SIM)
```

**סטטוס:** 100/100 שדרוגים (10 גלים) — ראה `UPGRADE-100.md`. הכל pure-downstream,
golden-tested, מגודר-דגל (כבוי=ביט-זהה).

## חיבור למאור (CTI)

`cti.mode`: `off` (ברירת-מחדל) · `directory` (קריאת `directory/<e164>` בענן opt-in) · `api`.
המנוע צורב `inbound_number` בכל שיחה נכנסת — זה המפתח ל-screen-pop מול Family/Supporter
במאור. downstream: **קריאה בלבד**, אין כתיבה לספק.

## מה זה לא

- לא מתקין FreeSWITCH ולא מגדיר רשת (זה שלב-התקנה — משתני-`$${...}` מוזרקים אז).
- לא מדבר עם אף ספק-תקשורת. לא מנפיק מספרים. לא רוכש trunk.
- לא מטפל בזרימת-ווצאפ עצמה (גשר-ההודעות = מודול נפרד; כאן רק סימון שהמספר קיים).
