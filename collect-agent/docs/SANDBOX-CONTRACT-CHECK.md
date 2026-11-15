# יום ה-sandbox: בדיקת החוזה מול חשבונית ירוקה (עמוד אחד)

**מה זה:** `scripts/gi_contract_check.py` מריץ את החוזה של `tests/test_gi_contract.py` מול חשבונית ירוקה אמיתית. **קריאה בלבד**, ובלי מפתחות בקוד.

## לפני (מאיר)
1. נרשמים ל-sandbox של morning ויוצרים מפתח API (id + secret).
2. ב-sandbox יוצרים 2–3 חשבוניות פתוחות (סוג 305 או 300) ללקוחות בדיקה עם טלפון ומייל, רושמים תשלום חלקי על אחת, ומוציאים זיכוי (330) על אחרת.

## הרצה (פקודה אחת)
```bash
cd collect-agent
GREENINVOICE_API_ID=<id> GREENINVOICE_API_SECRET=<secret> \
  python3 -I scripts/gi_contract_check.py --sandbox --json sandbox-report.json
```
הסוד נקרא רק מהסביבה, ולא מודפס ולא נשמר. בלי שני המשתנים לא יוצאת שום בקשה (קוד יציאה 2).

## קריאת התוצאה
| סימון | משמעות | מה עושים |
|---|---|---|
| ✅ PASS | השרת מתנהג כמו שהקוד מניח | כלום |
| ⚠️ GAP | השרת שונה מההנחה, אבל זה לא שובר | מעדכנים את `app/gi_mock.py` כך שיתאים לשרת |
| ❌ FAIL | הקוד שלנו לא יעבוד מול השרת | מתקנים את `app/greeninvoice.py` ואת ה-mock, ואז `pytest tests/test_gi_contract.py` |
| ⏭ SKIP | בדיקת כתיבה (טופס תשלום, לקוחות, webhook), או שאין נתונים | בודקים ידנית באישור מאיר |

**קוד יציאה:** 0 = אין FAIL · 1 = יש FAIL · 2 = חסרים מפתחות.

## מה נבדק (17 בדיקות קריאה + 3 דילוגי כתיבה)
- **טוקן:** עם grant_type, בלי grant_type, סוד שגוי, בלי טוקן.
- **‏users/me.**
- **חיפוש מסמכים:** צורה, עימוד, תקרת pageSize, סוג פסול.
- **שדות המסמך שהמיפוי צריך:** dueDate, ‏amountDueVat, ‏linkedDocumentIds.
- **פרטי קשר:** במסמך עצמו, או השלמה מ-/clients/{id}.
- **‏GET /documents/{id}:** רענון לפני שליחה (ר-4), ו-404 למסמך שלא קיים.
- **‏map_document** על כל המסמכים.
- **‏iter_open_invoices:** נתיב הסנכרון של המוצר.
- **לקוחות:** חיפוש ושליפה.

## הוכחה שזה עובד היום (בלי sandbox)
```bash
python3 -I scripts/gi_contract_check.py                                     # mock בתוך התהליך
python3 -m app.gi_mock --port 8791 --seed demo &                             # או שרת HTTP אמיתי
python3 -I scripts/gi_contract_check.py --mock-url http://127.0.0.1:8791/api/v1
```
תוצאה נוכחית (mock בתוך התהליך, עם זיכוי מקושר, תשלום חלקי וקבלה מקושרת): **19 PASS · 0 GAP · 0 FAIL · 3 SKIP**. ב-sandbox צריך שיהיו זיכוי אחד ותשלום חלקי אחד, אחרת `doc_links` ידולג ו-`doc_fields` יסמן GAP. בנוסף, `tests/test_contract_check_script.py` מוודא שאין בקשות כתיבה, שאין סודות בפלט, שאין בקשות בלי מפתחות, וש-production נדחה.
