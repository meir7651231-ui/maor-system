"""מנהל 316 · הטקסט הציבורי (/u, /p, /pay) מתעדכן כמו PRIVACY §3/§3א (מנהל 315).

הפער: PRIVACY.md אמר כבר ש«הייצוא לא כולל מידע על אדם אחר» ושבזמן השהיה מגינה עמוד התשלום לא מציע
תשלום — אבל מה שהחייב עצמו רואה (`legal.privacy_html` ב-/u ו-/p, `privacy_points` ב-/pay) לא אמר את זה.
הבדיקות נגזרות מהקוד: סיבת השהיה חדשה / ביטול סינון הצד השלישי בלי עדכון הטקסט ⇒ נכשלות.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app import legal, policy
from app.main import create_app
from app.service import CollectService
from tests.conftest import OWNER_TOKEN
from tests.test_legal_docs_mgr315 import HOLD_WORDS
from tests.test_payer_v2 import _api, _code


def test_hold_text_names_every_landing_hold():
    assert set(policy.LANDING_HOLDS) == set(HOLD_WORDS)
    for word in HOLD_WORDS.values():
        assert word in legal.PRIVACY_HOLD, word
    assert "עמוד התשלום" in legal.PRIVACY_HOLD and "הפסקת התזכורות נשארת זמינה תמיד" in legal.PRIVACY_HOLD


def test_access_text_matches_export_filter():
    assert {"blocked_phone", "blocked_email"} <= CollectService._EXPORT_CUSTOMER_HIDE
    assert "לא כולל מידע על אדם אחר" in legal.PRIVACY_ACCESS


def test_privacy_html_carries_both_lines_escaped():
    h = legal.privacy_html("<b>x</b>")
    assert "לא כולל מידע על אדם אחר" in h and "ייצור איתכם קשר אישית" in h
    assert "<b>x</b>" not in h                                           # שם העסק עדיין מנוטרל


def test_privacy_points_carry_both_lines_plain():
    pts = legal.privacy_points("עסק")
    assert pts["hold"] == legal.PRIVACY_HOLD
    assert legal.PRIVACY_ACCESS in pts["contact"] and "למחיקה" in pts["contact"]
    assert all("<" not in t for t in pts.values())


def test_public_pages_show_lines(svc):
    api = _api(svc)
    code = _code(api, svc)
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    p = pub.get(f"/p/{code}").text
    assert "לא כולל מידע על אדם אחר" in p and "ייצור איתכם קשר אישית" in p
    lg = pub.get(f"/api/pay/{code}").json()["legal"]
    assert lg["hold"] == legal.PRIVACY_HOLD and legal.PRIVACY_ACCESS in lg["contact"]
