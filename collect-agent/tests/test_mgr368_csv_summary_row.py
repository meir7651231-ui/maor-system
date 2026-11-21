"""הפעלה 368 (BACKLOG «גבי חיבורים»): שורת «סה״כ» בסוף ייצוא Excel / תאים ממוזגים.

הבאג: «סה"כ» בעמודת מספר המסמך + טלפון בשורה (טלפון העסק בתחתית הדוח) ⇒ נקלט כחשבונית של 800 ₪
⇒ תזכורת על «חשבונית סה"כ». בלי טלפון ⇒ נדחה בהודעה מטעה («אין טלפון ואין מייל») שגרמה לחפש חייב חסר.
תאים ממוזגים (Merge) ⇒ «חסר מספר מסמך» בלי רמז למה.
"""
import pytest

from app.csv_import import MERGED_HINT, SUMMARY_MSG, parse

HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום\n101,דנה כהן,0501234567,500\n"


def _p(tail: str):
    return parse((HEAD + tail).encode())


@pytest.mark.parametrize("row", [
    'סה"כ,,0501234567,800',          # עם טלפון — היה נקלט כחשבונית
    "סה״כ,,,800",                     # גרשיים עבריים
    "Total,,0501234567,800",
    "סך הכל,,,800",
    ',סה"כ לתשלום:,,800',            # התווית בעמודת הלקוח
    ",Grand Total,,800",
    ",סיכום,,800",
])
def test_summary_row_is_visible_error_not_invoice(row):
    r = _p(row + "\n")
    assert [i.number for i in r.invoices] == ["101"]
    assert r.errors == [{"row": 3, "error": SUMMARY_MSG}]


@pytest.mark.parametrize("row,num", [
    ("103,Total Solutions,0501234570,90", "103"),   # לקוח אמיתי ששמו מתחיל ב-Total
    ("104,סיכום בע\"מ,0501234571,90", "104"),
    (",Total Solutions,0501234572,90", None),        # בלי מספר ⇒ השגיאה הרגילה, לא «סיכום»
])
def test_real_client_named_like_summary_not_misclassified(row, num):
    r = _p(row + "\n")
    if num:
        assert num in [i.number for i in r.invoices] and not r.errors
    else:
        assert r.errors and r.errors[0]["error"].startswith("חסר מספר מסמך")
        assert r.errors[0]["error"] != SUMMARY_MSG


def test_summary_label_in_client_without_number_but_with_phone_not_summary():
    r = _p(",סה\"כ,0501234567,800\n")
    assert r.errors[0]["error"].startswith("חסר מספר מסמך")


def test_merged_number_cell_gets_hint():
    r = _p(",דנה כהן,0501234567,200\n")
    assert r.errors == [{"row": 3, "error": "חסר מספר מסמך" + MERGED_HINT}]


def test_merged_phone_cell_gets_hint():
    r = _p("102,דנה כהן,,200\n")
    assert r.errors == [{"row": 3, "error": "אין טלפון ואין מייל" + MERGED_HINT}]


def test_no_hint_when_previous_row_also_empty():
    r = parse("מספר מסמך,שם לקוח,טלפון,יתרה לתשלום\n,דנה,0501234567,5\n".encode())
    assert r.errors == [{"row": 2, "error": "חסר מספר מסמך"}]


def test_summary_after_title_row_keeps_file_row_numbers():
    raw = 'דוח חשבוניות פתוחות\n' + HEAD + 'סה"כ,,0501234567,500\n'
    r = parse(raw.encode("cp1255"))
    assert [i.number for i in r.invoices] == ["101"]
    assert r.errors == [{"row": 4, "error": SUMMARY_MSG}]


def test_phone_hint_only_for_same_or_empty_client():
    r = _p("102,אבי לוי,,200\n")      # לקוח אחר בלי טלפון = חסר אמיתי, לא תא ממוזג
    assert r.errors == [{"row": 3, "error": "אין טלפון ואין מייל"}]
    r = _p("102,,,200\n")             # גם הלקוח ריק ⇒ כנראה תאים ממוזגים
    assert r.errors[0]["error"] == "אין טלפון ואין מייל" + MERGED_HINT
