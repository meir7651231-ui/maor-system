"""מנהל 331 — הרחבת הרצת הרצפים לסט QA #20: ציפיית `dsr` (בקשות פרטיות פתוחות) ו-`shared` (לקוח שני באותה
כתובת). בלי זה סט על «אל תמחקו»/«תמחקו» ומייל מכתובת משותפת לא היה נמדד בכלל — ה-harness ראה רק intent."""
from evals.sequences import _docs, _service, run_seq


def test_shared_fixture_two_customers_same_address():
    for kind in ("email", "sms"):
        with _service(kind) as (svc, _):
            rows = svc.db.q("SELECT id FROM customers ORDER BY id")
            assert len(rows) == 2, kind
    docs = _docs("email")
    assert docs[1]["client"]["emails"] == docs[0]["client"]["emails"]
    assert _docs(None)[0]["client"]["name"] == "דנה כהן" and len(_docs(None)) == 1


def test_dsr_expectation_counts_open_requests():
    seq = {"id": "h1", "channel": "email", "turns": [
        {"text": "אני מבקשת לעיין במידע שיש לכם עליי", "expect": {"dsr": ["access"]}}]}
    assert run_seq(seq) == []
    seq["turns"][0]["expect"]["dsr"] = []
    assert any("dsr" in f for f in run_seq(seq))   # הציפייה באמת נבדקת (לא no-op)


def test_dsr_expectation_empty_when_nothing_asked():
    seq = {"id": "h2", "channel": "sms", "turns": [{"text": "תודה רבה", "expect": {"dsr": []}}]}
    assert run_seq(seq) == []


def test_unknown_shared_kind_rejected():
    import pytest
    with pytest.raises(ValueError):
        _docs("fax")
