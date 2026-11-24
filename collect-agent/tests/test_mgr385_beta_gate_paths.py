"""מנהל 385 · ביקורת 224 על 380: האם יש מסלול שמכניס טלפון/מייל של לקוח **בלי** שער בטא 4?

ממצא הביקורת (24.11): **אין עקיפה.** כל שורת לקוח נוצרת/מתעדכנת רק ב-`_ingest_rows`, שנקרא רק מ-`ingest`,
שנקרא רק מ-`sync` (שער `_api_gate_ok`) ומ-`import_csv` (שער `is_synthetic_contact` הקפדני). ה-webhooks
(morning / מקור אחר) הם רק טריגר ל-`sync`. הודעה נכנסת משולח לא מוכר לא יוצרת לקוח (customer_id=NULL),
ו«הסר» ממנו נרשם ברשימת ההסרה כ**גיבוב** בלבד (חובה חוקית, נשמר גם ב-wipe — שער 8). ערכות הבטא
(`beta_seeds`) עוברות את שער ה-API (נבדק גם ב-test_beta_kit שמסנכרן בלי REAL_DATA_ALLOWED).

הבדיקות כאן נועלות את זה: מי שיוסיף מסלול חדש שכותב פרטי קשר של לקוח בלי לעבור בשער — ייכשל כאן.
"""
from __future__ import annotations

import ast
import re
from pathlib import Path

import httpx
import pytest

from app.beta_seeds import BETA_VERTICALS, beta_docs
from app.config import load_settings
from app.db import DB
from app.demo import DEMO_NOW, FixedClock
from app.demo_data import DEMO_ID, DEMO_SECRET, SANDBOX
from app.gi_mock import GreenInvoiceMock
from app.greeninvoice import GreenInvoiceClient
from app.service import CollectService, _api_gate_ok

APP = Path(__file__).resolve().parent.parent / "app"
SERVICE = (APP / "service.py").read_text(encoding="utf-8")


def _callers(src: str, attr: str) -> set[str]:
    """שמות הפונקציות ב-service.py שקוראות ל-self.<attr>(…)."""
    out: set[str] = set()
    for node in ast.walk(ast.parse(src)):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for sub in ast.walk(node):
                if (isinstance(sub, ast.Call) and isinstance(sub.func, ast.Attribute)
                        and sub.func.attr == attr and isinstance(sub.func.value, ast.Name)
                        and sub.func.value.id == "self"):
                    out.add(node.name)
    return out


def test_ingest_only_from_gated_callers():
    assert _callers(SERVICE, "ingest") == {"sync", "import_csv"}
    assert _callers(SERVICE, "_ingest_rows") == {"ingest"}


def test_no_other_module_calls_ingest():
    hits = [p.name for p in APP.rglob("*.py") if p.name != "service.py"
            and re.search(r"\bsvc\.ingest\(|\bservice\.ingest\(|\._ingest_rows\(",
                          p.read_text(encoding="utf-8"))]
    assert hits == []


def test_customer_contact_written_only_in_ingest_rows():
    """INSERT לטבלת customers, או UPDATE שמציב טלפון/מייל שאינו NULL — רק ב-_ingest_rows."""
    for p in APP.rglob("*.py"):
        src = p.read_text(encoding="utf-8")
        for node in ast.walk(ast.parse(src)):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            if node.name == "_ingest_rows" and p.name == "service.py":
                continue
            strings = " ".join(n.value for n in ast.walk(node)
                               if isinstance(n, ast.Constant) and isinstance(n.value, str))
            assert "INSERT INTO customers" not in strings and "INSERT OR REPLACE INTO customers" \
                not in strings, f"{p.name}:{node.name} יוצר לקוח בלי שער"
            for m in re.finditer(r"UPDATE customers SET(.*?)WHERE", strings):
                assert not re.search(r"\b(phone|email)\s*=\s*(?!NULL)", m.group(1)), \
                    f"{p.name}:{node.name} כותב טלפון/מייל ללקוח בלי שער"


def test_sync_gate_runs_before_ingest():
    body = SERVICE[SERVICE.index("    def sync(self)"):SERVICE.index("    CREDIT_REVIEW =")]
    assert body.index("_api_gate_ok") < body.index("self.ingest(")
    imp = SERVICE[SERVICE.index("    def import_csv("):]
    assert imp.index("is_synthetic_contact") < imp.index("self.ingest(")


@pytest.mark.parametrize("vertical", list(BETA_VERTICALS))
def test_beta_seeds_pass_api_gate(vertical):
    for doc in beta_docs(vertical):
        c = doc["client"]
        assert _api_gate_ok(c["phone"], (c["emails"] or [""])[0]), (vertical, doc["id"])


def _gated_svc() -> CollectService:
    mock = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=beta_docs("barber"),
                            deliver=lambda url, payload: None)
    gi = GreenInvoiceClient(SANDBOX, DEMO_ID, DEMO_SECRET, transport=httpx.MockTransport(mock.handler))
    s = load_settings({"BUSINESS_NAME": "מספרת הדמו", "SMS_SENDER_ID": "GabiDemo",
                       "EMAIL_FROM": "gabi@example.com", "PUBLIC_BASE_URL": "http://127.0.0.1:8000"})
    assert not s.real_data_allowed
    return CollectService(s, DB(":memory:"), gi=gi, clock=FixedClock(DEMO_NOW))


def _count(svc, sql):
    return svc.db.one(sql)["n"]


@pytest.mark.parametrize("channel,sender", [("sms", "052-7654321"), ("email", "real.person@gmail.com")])
@pytest.mark.parametrize("text", ["שלום מי זה?", "הסר", "אני בדיכאון, אין לי כסף"])
def test_unknown_inbound_never_creates_customer(channel, sender, text):
    svc = _gated_svc()
    svc.sync()
    before = _count(svc, "SELECT COUNT(*) n FROM customers")
    res = svc.inbound(channel, sender, text)
    assert res["intent"].startswith("unknown_sender")
    assert _count(svc, "SELECT COUNT(*) n FROM customers") == before
    for r in svc.db.q("SELECT phone, email FROM customers"):
        assert sender not in (r["phone"] or "", r["email"] or "")
    msg = svc.db.one("SELECT customer_id FROM messages WHERE direction='in' ORDER BY id DESC LIMIT 1")
    assert msg["customer_id"] is None


def test_unknown_optout_stored_as_hash_only():
    svc = _gated_svc()
    svc.inbound("sms", "052-7654321", "הסר")
    assert svc.suppressed("sms", "052-7654321")
    row = svc.db.one("SELECT * FROM suppressions")
    flat = " ".join(str(v) for v in dict(row).values())
    assert "7654321" not in flat
