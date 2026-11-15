"""019: mock + סקריפט בדיקת החוזה + שער המעבר לשליחה אמיתית. בלי רשת."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import httpx
import pytest

from app import golive
from app.config import load_settings
from app.integrations.base import SmsMessage
from app.integrations.sms import Sms019
from app.sms019_mock import Sms019Mock

ROOT = Path(__file__).resolve().parents[1]


def _script():
    spec = importlib.util.spec_from_file_location("sms019_contract_check",
                                                  ROOT / "scripts" / "sms019_contract_check.py")
    m = importlib.util.module_from_spec(spec)
    sys.modules["sms019_contract_check"] = m
    spec.loader.exec_module(m)
    return m


# ---------------------------------------------------------------- mock
def test_mock_accepts_adapter_request_and_test_endpoint_does_not_send():
    mock = Sms019Mock()
    a = Sms019(mock.username, mock.token, "Studio", transport=httpx.MockTransport(mock.handler))
    assert a.send(SmsMessage("0501234567", "שלום & <x>")).ok and mock.sent == []
    live = Sms019(mock.username, mock.token, "Studio", test_endpoint=False,
                  transport=httpx.MockTransport(mock.handler))
    r = live.send(SmsMessage("0501234567", "שלום & <x>"))
    assert r.ok and mock.sent[0]["message"] == "שלום & <x>" and r.message_id == mock.sent[0]["shipment_id"]


@pytest.mark.parametrize("body,code", [
    ('<!DOCTYPE x [<!ENTITY a "b">]><sms/>', 9),                                  # XXE נחסם
    ("<sms><user><username>other</username></user></sms>", 2),
    ("<sms><user><username>demo019</username></user><source>שם</source></sms>", 3),
    ("<sms><user><username>demo019</username></user><source>Abc</source>"
     "<destinations><phone>026234567</phone></destinations><message>x</message></sms>", 4),
    ("<sms><user><username>demo019</username></user><source>Abc</source>"
     "<destinations><phone>0501234567</phone></destinations><message> </message></sms>", 5),
])
def test_mock_enforces_contract(body, code):
    mock = Sms019Mock()
    st, out = mock.route("POST", "/api/test", {"authorization": f"Bearer {mock.token}",
                                               "content-type": "application/xml"}, body.encode())
    assert st == 200 and f"<status>{code}</status>" in out


# ---------------------------------------------------------------- הסקריפט
def test_script_against_mock_all_pass(tmp_path, capsys):
    out = tmp_path / "r.json"
    assert _script().main(["--json", str(out)]) == 0
    rep = json.loads(out.read_text("utf-8"))
    st = {c["id"]: c["status"] for c in rep["checks"]}
    assert set(st.values()) == {"PASS"} and len(st) == 16, st
    assert rep["contract_verified"] is False
    assert "demo019-token" not in capsys.readouterr().out + out.read_text("utf-8")


def test_script_real_mode_without_env_sends_nothing(monkeypatch, capsys):
    for k in ("SMS019_USERNAME", "SMS019_TOKEN", "SMS019_SENDER", "SMS019_TEST_PHONE"):
        monkeypatch.delenv(k, raising=False)
    assert _script().main(["--test-endpoint"]) == 2     # (socket אמיתי בבדיקות ⇒ כישלון, conftest)
    assert "לא נשלחה אף בקשה" in capsys.readouterr().err


def test_script_refuses_non_loopback_mock_url():
    with pytest.raises(SystemExit):
        _script()._forward_to_loopback("https://019sms.co.il")


# ---------------------------------------------------------------- שער המעבר
def _report(tmp_path, name, target, statuses):
    p = tmp_path / name
    p.write_text(json.dumps({"target": target, "checks": [{"id": f"c{i}", "status": s}
                                                         for i, s in enumerate(statuses)]}))
    return str(p)


def test_gate_closed_today_and_lists_every_missing_item():
    """היום: 9 חוסמים (6 + 3 משפטיים מ-legal/SIGNOFF.json), כל אחד עם מה לעשות.
    אם מישהו "פותח" משהו בלי לסגור את כולם — זה ייראה כאן."""
    b = golive.real_send_blockers(load_settings({}))
    joined = "\n".join(b)
    assert len(b) == 9, b
    for must in ("ALLOWED_SEND_MODES", "CONTRACT_VERIFIED_019", "placeholder", "PUBLIC_BASE_URL",
                 "חשבונית ירוקה: אין דוח", "019: אין דוח", "DPA", "אין עו״ד", "בלי תשובה"):
        assert must in joined, must


def test_gate_opens_only_when_everything_is_closed(tmp_path):
    s = load_settings({"PUBLIC_BASE_URL": "https://gabi.co.il"})
    ok = dict(allowed_send_modes={"dry_run", "live"}, verified_019=True,
              operator={"legal_name": "חברה בע״מ", "company_id": "51-1234567"},
              signoff={"lawyer_name": "עו״ד לדוגמה", "dpa_signed": True,
                       "answered_questions": list(golive.REQUIRED_LAWYER_QUESTIONS)},
              gi_report=_report(tmp_path, "gi.json", "sandbox", ["PASS", "GAP", "SKIP"]),
              sms_report=_report(tmp_path, "s.json", "019 האמיתי — /api/test", ["PASS"]))
    assert golive.real_send_blockers(s, **ok) == []
    # כל תנאי לבדו מחזיר חוסם
    for k, bad in (("allowed_send_modes", {"dry_run"}), ("verified_019", False),
                   ("operator", {"legal_name": "[x — placeholder]"}),
                   ("gi_report", _report(tmp_path, "g2.json", "sandbox", ["PASS", "FAIL"])),
                   ("gi_report", _report(tmp_path, "g3.json", "gi_mock בתוך התהליך", ["PASS"])),
                   ("sms_report", _report(tmp_path, "s2.json", "019 mock בתוך התהליך", ["PASS"])),
                   ("sms_report", str(tmp_path / "missing.json"))):
        assert len(golive.real_send_blockers(s, **{**ok, k: bad})) == 1, (k, bad)
    assert len(golive.real_send_blockers(load_settings({}), **ok)) == 1        # gabi.example


def test_golive_cli_exit_code(capsys):
    assert golive.main([]) == 1
    assert "השער סגור. 9 חוסמים" in capsys.readouterr().out
