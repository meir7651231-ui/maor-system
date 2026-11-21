"""מבקר סבב 211 · 🟡 — CSV עם שורת כותרת-דוח (או שורה ריקה) לפני שורת העמודות: «חסרות עמודות חובה» — מטעה.

רכיב: `app/csv_import.py` → `parse` (שורת הכותרת = `rows[0]` תמיד) + `_rows` (המפריד נבחר לפי השורה הראשונה בלבד).
ייצוא «דוח חשבוניות פתוחות» ממערכות הנהלת חשבונות ומ-Excel מתחיל לעיתים בשורת כותרת («דוח חשבוניות פתוחות») או בשורה
ריקה, ורק אחריה «מספר מסמך,שם לקוח,…». נבדק (UTF-8 וגם cp1255, פסיק וגם «;»): ⇒ ValueError «חסרות עמודות חובה: number,
client, amount» — העמודות **קיימות** בשורה 2; בעל העסק שמסתכל על הקובץ רואה אותן ולא מבין מה חסר. (ב-«;» גם המפריד
נבחר משורת הכותרת ⇒ פסיק ברירת מחדל.) הצעה: לחפש את שורת העמודות ב-5 השורות הראשונות, או הודעה «שורת העמודות צריכה
להיות הראשונה בקובץ — מחקו את השורות שמעליה».
תוקן (מנהל 367): `_find_header` מחפש את שורת העמודות ב-5 השורות הראשונות."""
from datetime import date

import pytest

from app.csv_import import parse

H = "מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"
ROW = "1001,דנה,0501234567,1200,01/11/26,15/11/26\n"


def _ok(text, enc="utf-8"):
    try:
        r = parse(text.encode(enc), today=date(2026, 11, 8))
    except ValueError as e:
        return str(e)
    return [i.number for i in r.invoices]


@pytest.mark.parametrize(("pre", "delim", "enc"), [
    ("דוח חשבוניות פתוחות\n", ",", "utf-8"),
    ("דוח חשבוניות פתוחות\n", ",", "cp1255"),
    ("\n", ",", "utf-8"),
    ("דוח\n", ";", "utf-8"),
])
def test_report_title_row_before_header(pre, delim, enc):
    got = _ok(pre + H.replace(",", delim) + ROW.replace(",", delim), enc)
    assert got == ["1001"] or ("שורה" in got and "ראשונה" in got), got


def test_control_header_first_row():
    assert _ok(H + ROW) == ["1001"]


def _parse(text, enc="utf-8"):
    return parse(text.encode(enc), today=date(2026, 11, 8))


def test_row_numbers_in_errors_stay_file_lines():
    """מנהל 367: שגיאה בשורה מדווחת לפי מספר השורה **בקובץ** (כפי שבעל העסק רואה ב-Excel), לא אחרי הדילוג."""
    bad = "1002,רון,0501234567,abc,01/11/26,15/11/26\n"
    r = _parse("דוח חשבוניות פתוחות\n\n" + H + ROW + bad)
    assert [i.number for i in r.invoices] == ["1001"]
    assert [e["row"] for e in r.errors] == [5], r.errors


def test_semicolon_after_title_with_commas():
    """המפריד נבחר משורת העמודות, לא משורת הכותרת (גם כשבכותרת יש פסיקים)."""
    r = _parse("דוח, נכון ל-08/11/26, סניף ראשי\n" + H.replace(",", ";") + ROW.replace(",", ";"))
    assert [i.number for i in r.invoices] == ["1001"]


def test_header_beyond_scan_window_clear_message():
    with pytest.raises(ValueError) as e:
        _parse("א\nב\nג\nד\nה\n" + H + ROW)
    assert "חסרות עמודות חובה" in str(e.value) and "5 השורות הראשונות" in str(e.value)


def test_title_row_mentioning_column_name_not_taken_as_header():
    """שורת כותרת שמכילה רק חלק משמות העמודות («לקוח») לא נבחרת — נדרשות כל עמודות החובה."""
    r = _parse("לקוח: כל הלקוחות\n" + H + ROW)
    assert [i.number for i in r.invoices] == ["1001"]
