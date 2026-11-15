"""scripts/gi_contract_check.py — רץ מול ה-mock, קריאה בלבד, בלי סודות בפלט, ובלי בקשות כשאין מפתחות."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import httpx

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "gi_contract_check.py"


def _mod():
    spec = importlib.util.spec_from_file_location("gi_contract_check", SCRIPT)
    m = importlib.util.module_from_spec(spec)
    sys.modules["gi_contract_check"] = m        # dataclasses צריכות את המודול רשום
    spec.loader.exec_module(m)
    return m


def test_runs_against_mock_without_failures(tmp_path, capsys):
    m = _mod()
    out = tmp_path / "r.json"
    assert m.main(["--json", str(out)]) == 0
    rep = json.loads(out.read_text("utf-8"))
    st = {c["id"]: c["status"] for c in rep["checks"]}
    assert "FAIL" not in st.values(), st
    for must in ("token_ok", "token_no_grant", "auth_required", "search_shape", "search_paging",
                 "doc_get", "doc_get_404", "iter_open", "clients_search", "client_get"):
        assert st[must] == "PASS", (must, st[must])
    assert {st[k] for k in ("payments_form", "clients_crud", "webhook")} == {"SKIP"}
    text = capsys.readouterr().out + out.read_text("utf-8")
    import re
    assert "demo-secret" not in text                               # הסוד לא נחשף
    assert not re.search(r"mock\.[A-Za-z0-9_-]{20,}", text)        # וגם לא טוקן (mock.<urlsafe>)


def test_read_only_no_write_requests():
    """ה-probe לא שולח שום בקשה שמשנה נתונים: רק GET, ו-POST לנתיבי קריאה/טוקן."""
    m = _mod()
    from app.demo_data import DEMO_ID, DEMO_SECRET, demo_docs
    from app.gi_mock import GreenInvoiceMock
    mock = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=demo_docs(),
                            deliver=lambda u, p: None)
    seen = []

    def h(req):
        seen.append((req.method, req.url.path))
        return mock.handler(req)
    before = json.dumps(mock.docs, sort_keys=True), json.dumps(mock.clients, sort_keys=True)
    m.run(m.Probe(m.SANDBOX, DEMO_ID, DEMO_SECRET, httpx.MockTransport(h)), "t")
    reads = {"/api/v1/account/token", "/api/v1/documents/search", "/api/v1/clients/search"}
    assert all(meth == "GET" or path in reads for meth, path in seen), seen
    assert (json.dumps(mock.docs, sort_keys=True), json.dumps(mock.clients, sort_keys=True)) == before


def test_sandbox_without_keys_sends_nothing(monkeypatch, capsys):
    monkeypatch.delenv("GREENINVOICE_API_ID", raising=False)
    monkeypatch.delenv("GREENINVOICE_API_SECRET", raising=False)
    assert _mod().main(["--sandbox"]) == 2          # (וכל socket אמיתי בבדיקות ⇒ כישלון, conftest)
    assert "לא נשלחה אף בקשה" in capsys.readouterr().err


def test_refuses_non_sandbox_url():
    import pytest
    with pytest.raises(SystemExit):
        _mod().Probe("https://api.greeninvoice.co.il/api/v1", "a", "b")


def test_receipts_link_check_is_in_the_script():
    """critic סבב 77: גבי בודקת רק זיכויים (330). קבלה (400/405) שלא סגרה את החשבונית או לא מקושרת אליה ⇒
    תזכורת למי ששילם. ההתנהגות האמיתית לא ידועה ⇒ הבדיקה חייבת להיות בסקריפט החוזה, כדי שיום ה-sandbox יענה עליה."""
    from pathlib import Path
    src = (Path(__file__).resolve().parent.parent / "scripts/gi_contract_check.py").read_text(encoding="utf-8")
    assert '@check("receipts_link"' in src and "[400, 405]" in src
