"""הפעלה 115 — שם לקוח מקלט חיצוני (CSV/API) מול גוף ה-SMS/המייל ומפתח הלקוח.

באגים שנמצאו (בדיקה מקצה לקצה דרך /import/csv ⇒ /plan ⇒ /dispatch):
- "מר דוד כהן" ⇒ «שלום מר,» (התואר נלקח כשם פרטי).
- "None" / "null" / "-" ⇒ «שלום None,» לחייב.
- שם שהוא טלפון ("0501234567") ⇒ «שלום 0501234567,».
- שם ארוך במילה אחת ⇒ SMS של 190 תווים = 3 חלקים (עלות פי 1.5).
- קישור בשם ("דוד כהן http://…") נכנס כמו שהוא ל-{name} במייל.
- RLM/רוחב-אפס בשם ⇒ אותו אדם על אותו טלפון פוצל ללקוח נפרד + התראת «שני לקוחות» שקרית.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.security import clean_client_name
from app.templates import SMS_TARGET, fields, first_name
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.mark.parametrize("raw,clean", [
    ("  דוד   כהן ", "דוד כהן"),
    ("\u200fדוד כהן\u200f", "דוד כהן"),
    ("\u200dדוד\ufeff", "דוד"),
    ("דוד\nכהן", "דוד כהן"),
    ("דוד כהן http://evil.co/pay", "דוד כהן"),
    ("דנה כהן www.x.co.il", "דנה כהן"),
    ("חברת אלון בע\"מ", "חברת אלון בע\"מ"),
    ("Cohen, David", "Cohen, David"),
    ("Dana.Cohen", "Dana.Cohen"),
])
def test_clean_keeps_real_names(raw, clean):
    assert clean_client_name(raw) == clean


@pytest.mark.parametrize("raw", [None, "", "  ", "None", "null", "NULL", "nan", "-", "---", "N/A",
                                 "לא ידוע", "ללא שם", "0501234567", "+972-50-1234567", "123456789",
                                 "www.evil.co", "https://x.co", "\t\n"])
def test_placeholder_names_become_generic(raw):
    assert clean_client_name(raw) == ""
    f = fields(biz="b", name=raw or "", num="1", amount_agorot=100, currency="ILS", link="L", unsub="U")
    assert f["name"] == "לקוח/ה יקר/ה" and f["first"] == "שלום"


def test_long_name_cut_at_word():
    n = clean_client_name("דוד " + "כהן " * 40)
    assert len(n) <= 80 and n.endswith("כהן")


@pytest.mark.parametrize("name,first", [
    ("מר דוד כהן", "דוד"),
    ('ד"ר שרה לוי', "שרה"),
    ("ד״ר שרה לוי", "שרה"),
    ("הרב יוסף כהן", "יוסף"),
    ("מר כהן", "מר כהן"),          # תואר + שם משפחה בלבד ⇒ פנייה מנומסת מלאה
    ("גב' רחל", "גב' רחל"),
    ("Dr. Sarah Levi", "Sarah"),
    ("Cohen, David", "Cohen"),     # בלי הפסיק ⇒ לא «שלום Cohen,,»
    ("מר", ""),
    ("א" * 30, ""),                 # ארוך מ-FIRST_MAX ⇒ «שלום,»
    ("דוד כהן", "דוד"),            # ללא שינוי
    ("סטודיו אור", "סטודיו אור"),  # ארגון ⇒ שם מלא (ללא שינוי)
])
def test_first_name(name, first):
    assert first_name(name) == first


def _send(svc, name: str) -> str:
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    csv = ("מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"
           f"1,{name},050-1234567,100,2026-09-01,2026-09-02\n")
    assert api.post("/import/csv", content=csv.encode()).json()["imported"] == 1
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve", json={"confirm_open": True})
    api.post("/dispatch")
    [m] = svc.sender.sent
    return m["body"]


@pytest.mark.parametrize("name,greeting", [
    ("מר דוד כהן", "שלום דוד,"),
    ("None", "שלום,"),
    ("0501234567", "שלום,"),
    ("-", "שלום,"),
])
def test_sms_greeting_end_to_end(svc, name, greeting):
    body = _send(svc, name)
    assert greeting in body
    assert "None" not in body and "שלום מר," not in body and "0501234567" not in body


def test_long_single_word_name_keeps_sms_short(svc):
    body = _send(svc, "א" * 79)
    assert len(body) <= SMS_TARGET     # קודם: 190 תווים, 3 חלקים


def test_stored_name_is_clean(svc):
    _send(svc, "דוד   כהן http://evil.co/x")
    [c] = svc.db.q("SELECT name FROM customers")
    assert c["name"] == "דוד כהן"


def test_bidi_variant_same_person_not_split(svc):
    """אותו טלפון, אותו שם, פעם עם RLM (ייצוא אחר) ⇒ לקוח אחד, בלי התראת «שני לקוחות»."""
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    csv = ("מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"
           "1,דוד כהן,050-1234567,100,2026-09-01,2026-09-02\n"
           "2,\u200fדוד  כהן\u200f,050-1234567,200,2026-09-01,2026-09-02\n")
    assert api.post("/import/csv", content=csv.encode()).json()["imported"] == 2
    assert len(svc.db.q("SELECT id FROM customers")) == 1
    assert not svc.db.q("SELECT 1 FROM messages WHERE intent='shared_contact'")


def test_placeholder_name_does_not_split_from_real_name(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    csv = ("מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"
           "1,דוד כהן,050-1234567,100,2026-09-01,2026-09-02\n"
           "2,None,050-1234567,200,2026-09-01,2026-09-02\n")
    api.post("/import/csv", content=csv.encode())
    assert len(svc.db.q("SELECT id FROM customers")) == 1
    [c] = svc.db.q("SELECT name FROM customers")
    assert c["name"] == "דוד כהן"     # «None» בשורה השנייה לא מחק את השם האמיתי


def test_web_mirror_titles_match_python():
    """התצוגה המקדימה בממשק (web/src/lib/message.ts) = מה שיישלח: אותה רשימת תארים ואותו FIRST_MAX."""
    import re
    from pathlib import Path

    from app import templates
    ts = (Path(__file__).resolve().parents[1] / "web/src/lib/message.ts").read_text(encoding="utf-8")
    block = re.search(r"const TITLES = new Set\(\[(.*?)\]\);", ts, re.S).group(1)
    titles = set(re.findall(r"""'([^']*)'|"([^"]*)\"""", block))
    assert {a or b for a, b in titles} == set(templates._TITLES)
    assert f"FIRST_MAX = {templates.FIRST_MAX};" in ts
