# ADR · הצפנת ה-DB החי במנוחה (שער 5) — 6.11.2026

**סטטוס:** **אושר 8.11 — שלב 2 מומש בקוד, מאחורי דגל** (`DB_ENCRYPTION=sqlcipher`, ברירת מחדל כבוי). שלב 1 (הצפנת נפח אצל הספק) = תשתית, תלוי בבחירת ספק — לא בוצע. **הקשר:** `legal/BETA-GATE.md` שורה 5; תקנות אבטחת מידע (2017).

## אפשרויות
| | SQLCipher | הצפנת שדות PII (SecretBox) | הצפנת דיסק/נפח (תשתית) |
|---|---|---|---|
| כיסוי | כל הקובץ | name/phone/email/payload בלבד | הכול, כולל לוגים וגיבויים גולמיים |
| שינוי קוד | חיבור sqlite אחר (`sqlcipher3`), תלות native | גבוה: `customers.phone/email/name`, `messages.payload`, אינדקסים | אפס |
| שאילתות לפי טלפון | ללא שינוי | נשברות: ההתאמה כבר נעשית בפייתון (`service.py:790`), אך נדרש גם אינדקס-חיפוש חתום (HMAC) ל-`blocked_phone`/דה-דופ | ללא שינוי |
| רוטציית מפתח | rekey של כל הקובץ | רוטציה פר-שדה (קיים ב-SecretBox) | ניהול ע"י הספק |
| סיכון | wheel/בנייה בפריסה, CI | באגי מיגרציה, אובדן חיפוש | תלוי בספק; לא מגן מפני גישת אפליקציה |

## החלטה (אושרה ע"י מאיר 8.11.2026)
1. **שלב 1 (בטא):** הצפנת נפח/דיסק אצל ספק האחסון באזור ישראל/האיחוד + קובץ DB בהרשאות 0600 + גיבוי מוצפן (קיים, `app/backup.py`). תשתית, אפס קוד. **פתוח:** בחירת ספק.
2. **שלב 2 — SQLCipher כשכבה שנייה: מומש (8.11).** פירוט למטה.
3. **לא נבחר:** הצפנת שדות — עלות גבוהה, נשברת סביב חיפוש/דה-דופ, ערך שולי מעל 1+2.

## שלב 2 · מה מומש
| רכיב | קובץ | התנהגות |
|---|---|---|
| דגל | `app/dbcrypt.py` `mode()` | `DB_ENCRYPTION` ריק/`off`/`none` ⇒ stdlib `sqlite3`, ביט-זהה לקודם. `sqlcipher` ⇒ SQLCipher. **כל ערך אחר ⇒ שגיאה** (טעות-הקלדה לא מורידה הצפנה). |
| מפתח | `dbcrypt.derive_key` | HKDF-SHA256 מכל מפתח ב-`COLLECT_MASTER_KEYS`, salt+info ייעודיים (`gabi/collect-agent:db-at-rest` / `sqlcipher-db-key:v1`) ⇒ עצמאי ממפתחות ה-AES-GCM של SecretBox. מפתח גולמי (`PRAGMA key = "x'…'"`), ה-salt פר-קובץ של SQLCipher נשמר. המפתח לא נרשם ללוג ולא מופיע בהודעות שגיאה. |
| פתיחה | `app/db.py` `DB.__init__` → `dbcrypt.open_db` | כל מפתח ברשימה נוסה (הראשון = פעיל; DB חדש נוצר בו). נפתח במפתח ישן ⇒ עובד + אזהרה בלוג + `db.needs_rekey`. אחרי יצירת הסכמה: **אימות שהכותרת אינה `SQLite format 3`**. |
| מיגרציה | `python -m app.db_encrypt <db> --confirm ENCRYPT [--backup <f>]` | גיבוי GBK1 **מאומת** (פענוח+integrity+ספירות) ⇒ `sqlcipher_export` לקובץ זמני 0600 ⇒ אימות (מפתח פעיל, integrity, ספירות זהות, כותרת לא-גלויה) ⇒ `os.replace` אטומי. כבר מוצפן / `-wal` לא ריק / DB פגום ⇒ מסרב. כשל בכל שלב ⇒ המקור לא נגוע. |
| רוטציה | `python -m app.db_encrypt <db> --rekey --confirm REKEY` | כמו SecretBox: מוסיפים מפתח חדש **ראשון** ב-`COLLECT_MASTER_KEYS`, מריצים rekey (אותו מסלול גיבוי⇒export⇒אימות⇒החלפה). כבר במפתח הפעיל ⇒ 0, בלי שינוי. |
| גיבוי/שחזור | `app/backup.py` | אותו פורמט GBK1. מקור מוצפן ⇒ תמונת SQLite נבנית **בזיכרון** (העתקה לוגית, אין קובץ גלוי בדרך). שחזור עם הדגל ⇒ יעד מוצפן ומאומת; יעד חלקי נמחק בכשל. גיבויים קשורים ל-SecretBox (`backup:db`), לא למפתח ה-DB ⇒ משחזרים גם אחרי rekey. |
| מחיקה | `app/wipe.py` | DELETE+VACUUM בתוך הקובץ המוצפן; נשאר מוצפן. DB מוצפן בלי הדגל / גלוי עם הדגל ⇒ שגיאה, לא נוגעים. |
| חריגים | `db.OperationalError` / `db.IntegrityError` | `sqlcipher3` לא יורש מחריגי `sqlite3` — הקוד תופס דרך ה-DB (תוקן ב-`service._supersede_plan_drafts`). |

### נכשל סגור — מה מוכח ובאיזה מבחן (`tests/test_db_encryption.py`)
- דגל לא מוכר ⇒ שגיאה **לפני** שנוצר קובץ (`test_unknown_flag_fails_closed_before_touching_disk`).
- המודול חסר ⇒ שגיאה, לא נוצר קובץ, גם שחזור לא כותב יעד (`test_missing_module_fails_closed`).
- מודול בשם `sqlcipher3` שאינו SQLCipher (אין `cipher_version`) ⇒ שגיאה (`test_module_that_is_not_sqlcipher_is_rejected`).
- `COLLECT_MASTER_KEYS` חסר/מפתח שגוי ⇒ שגיאה, הקובץ לא משתנה (`test_wrong_key_refuses`); בשרת: `scripts/smoke_server.sh` עם הדגל ⇒ בלי מפתח לא עולה ולא נוצר קובץ.
- קובץ SQLite גלוי + הדגל ⇒ מסרב ומפנה למיגרציה, לא פותח plaintext (`test_plaintext_file_with_flag_on_is_refused_not_used`).
- הקובץ באמת מוצפן: כותרת, אין PII בבייטים, stdlib לא קורא (`test_new_db_is_really_encrypted`), גם קובץ השרת ב-smoke.
- **מוטציות (8.11, כולן נהרגו):** הסרת `PRAGMA key` (10 נכשלים) · ערך-דגל לא מוכר ⇒ off · מודול חסר ⇒ stdlib · דילוג על סירוב-הקובץ-הגלוי · ביטול בדיקת `cipher_version`.

### תלות
- **נבחרה:** `sqlcipher3==0.6.4` (coleifer, מתוחזק: 0.6.3–0.6.5 ב-10–11.2026). wheels בינאריים לכל cp39–cp314 (manylinux_2_28 x86_64/aarch64, musllinux, macOS, Windows) — **אומת:** cp311 ו-cp313 (מטריצת ה-CI) הותקנו מהנעילה עם hashes, והסוויטה המלאה ירוקה על 3.11 ו-3.13. בתוך ה-wheel: SQLCipher 4.19.0 community + OpenSSL 3.6.0 מקושר סטטית (`PRAGMA cipher_provider_version`); אין תלויות פייתון.
- נבחר על פני `sqlcipher3-binary` (0.6.0, 12.2025, מסלול ישן של אותו מחבר) ו-`sqlcipher3-wheels` (fork, 0.5.7). 0.6.5 (5.11) חדש מדי לנעילה.
- **רישיון:** העטיפה — zlib (pysqlite, «including commercial applications»); SQLCipher Community — BSD-3-Clause; OpenSSL 3 — Apache-2.0. כולם מתירניים לשימוש מסחרי ו-SaaS. ⚠️ אם מפיצים בינארי ללקוח (לא SaaS) — לצרף את הודעות BSD/Apache.
- **אופציונלית בלבד:** extra `sqlcipher` ב-`pyproject.toml` + נעילה נפרדת `requirements-sqlcipher.lock` (hashes, `uv --universal 3.11+`). `requirements-dev.lock` וג'וב `test` לא השתנו; בלי המודול 13 הבדיקות האמיתיות מדלגות בנקיות. ג'וב CI נפרד `sqlcipher` (3.11/3.13) מריץ אותן, את הסוויטה המלאה, `DB_ENCRYPTION=sqlcipher ./demo.sh --check` ו-smoke מוצפן; `pip-audit` גם על הנעילה החדשה (אין CVE).

### נוהל הפעלה (פריסה)
1. `pip install --require-hashes -r requirements-sqlcipher.lock` בסביבת השרת.
2. לעצור את השרת ⇒ `python -m app.db_encrypt <DB_PATH> --confirm ENCRYPT` (שומר `<db>.pre-encrypt-<UTC>.gbk` מאומת).
3. `DB_ENCRYPTION=sqlcipher` בסביבה ⇒ להפעיל. אימות: `head -c 16 <DB_PATH>` אינו `SQLite format 3`.
4. חזרה אחורה: `DB_ENCRYPTION=off python -m app.backup restore <pre-encrypt.gbk> <db_new>`.

### מגבלות ידועות
- **מפתח ה-DB נגזר מאותו `COLLECT_MASTER_KEYS`** — מי שמחזיק את משתני הסביבה של השרת פותח הכול. זה הגבול המתוכנן (KMS בשלב 2 של הפריסה); SQLCipher מגן על הקובץ, הגיבויים הגולמיים של הדיסק והעתקות שלו — לא מפני גישה לתהליך החי.
- מוציאים מפתח ישן מ-`COLLECT_MASTER_KEYS` רק אחרי rekey **וגם** אחרי שגיבויי GBK1 שהוצפנו בו פגו (30 יום).
- `os.replace` לא מוחק פיזית בלוקים ישנים של הקובץ הגלוי מהדיסק ⇒ שלב 1 (הצפנת נפח) נשאר חובה.
- `:memory:` עם הדגל רץ במנוע SQLCipher בלי מפתח (אין כלום במנוחה).
- ניסוי: הסוויטה המלאה עם `DB_ENCRYPTION=sqlcipher` גלובלי ⇒ 1089/1105; 16 הכישלונות כולם הנחות-בדיקה על stdlib (`conn.iterdump`, `sqlite3.IntegrityError`, קריאת הקובץ ב-`sqlite3.connect`) — לא קוד האפליקציה.

## מה נשאר אצל מאיר
בחירת ספק אחסון (אזור ישראל/EU) והצפנת נפח (שלב 1); החלטה מתי להדליק `DB_ENCRYPTION=sqlcipher` בפריסה.
