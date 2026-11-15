"""הסקריפט ליום הראשון של ה-sandbox (scripts/sandbox_day1_paid_check.py): מזהה ששולם, וקורא בלבד."""
import importlib.util
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("day1", ROOT / "scripts" / "sandbox_day1_paid_check.py")
day1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(day1)


def _mock_with_paid_receipt():
    from app.demo_data import DEMO_ID, DEMO_SECRET, demo_docs
    from app.gi_mock import GreenInvoiceMock
    m = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=demo_docs(),
                         deliver=lambda u, p: None)
    m.route("POST", "/_mock/documents", {}, {"type": 400, "status": 1, "amount": m.docs["demo1"]["amount"],
                                             "currency": "ILS", "client": dict(m.docs["demo1"]["client"]),
                                             "linkedDocumentIds": ["demo1"]})
    return m, DEMO_ID, DEMO_SECRET


def test_detects_paid_but_open_invoice_and_only_reads():
    m, i, s = _mock_with_paid_receipt()
    seen = []

    def rec(req):
        seen.append((req.method, req.url.path))
        return m.handler(req)
    from app.greeninvoice import GreenInvoiceClient
    gi = GreenInvoiceClient(day1.SANDBOX, i, s, transport=httpx.MockTransport(rec))
    rep = day1.run(gi, "test")
    assert rep["suspected_paid"] == 1 and rep["suspect_reasons"] == ["receipt_linked_open"]
    assert rep["critical"] == []
    # קריאה בלבד: POST רק לטוקן ולחיפוש; אין payments/form, אין יצירה/עדכון
    posts = {p for meth, p in seen if meth == "POST"}
    assert posts <= {"/api/v1/account/token", "/api/v1/documents/search"}, posts
    assert all(meth in ("GET", "POST") for meth, _ in seen)


def test_main_mock_exit0_and_sandbox_without_keys_sends_nothing(monkeypatch, tmp_path):
    assert day1.main(["--json", str(tmp_path / "r.json")]) == 0
    rep = (tmp_path / "r.json").read_text("utf-8")
    assert "demo-secret" not in rep and "050" not in rep        # בלי סודות ובלי פרטי לקוח
    monkeypatch.delenv("GREENINVOICE_API_ID", raising=False)
    monkeypatch.delenv("GREENINVOICE_API_SECRET", raising=False)
    assert day1.main(["--sandbox"]) == 2


def test_missing_link_field_is_critical():
    from app.greeninvoice import GreenInvoiceClient
    m, i, s = _mock_with_paid_receipt()
    for d in m.docs.values():
        if d.get("type") == 400:
            d.pop("linkedDocumentIds", None)
    gi = GreenInvoiceClient(day1.SANDBOX, i, s, transport=httpx.MockTransport(m.handler))
    rep = day1.run(gi, "test")
    assert rep["critical"] and "קישור" in rep["critical"][0]


import pytest  # noqa: E402


@pytest.mark.parametrize("scenario,code,suspects", [
    ("paid", 0, 1), ("clean", 0, 0), ("unlinked", 1, None), ("no-status", 1, None)])
def test_every_decision_branch(scenario, code, suspects, tmp_path):
    """BACKLOG גבייה סוכן #1: כל ענף החלטה מוכח מול mock (רץ גם כצעד נפרד ב-CI)."""
    out = tmp_path / "r.json"
    assert day1.main(["--mock", scenario, "--json", str(out)]) == code
    import json
    rep = json.loads(out.read_text("utf-8"))
    if suspects is not None:
        assert rep["suspected_paid"] == suspects and rep["critical"] == []
    else:
        assert rep["critical"] and rep["verdict"].startswith("לא להשיק")
