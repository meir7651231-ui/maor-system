"""InforU (גיבוי): mock + סקריפט בדיקת החוזה דרך ה-adapter. בלי רשת."""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest

from app.inforu_mock import InforUMock

ROOT = Path(__file__).resolve().parents[1]


def _script():
    spec = importlib.util.spec_from_file_location("inforu_contract_check",
                                                  ROOT / "scripts" / "inforu_contract_check.py")
    m = importlib.util.module_from_spec(spec)
    sys.modules["inforu_contract_check"] = m
    spec.loader.exec_module(m)
    return m


def test_script_all_pass_and_no_secret(tmp_path, capsys):
    out = tmp_path / "r.json"
    assert _script().main(["--json", str(out)]) == 0
    rep = json.loads(out.read_text("utf-8"))
    assert {c["status"] for c in rep["checks"]} == {"PASS"} and len(rep["checks"]) == 10
    assert rep["contract_verified"] is False
    assert "demo-inforu-token" not in capsys.readouterr().out + out.read_text("utf-8")


@pytest.mark.parametrize("body,code", [
    (b"not json", -1),
    (json.dumps({"Data": {"Message": "x", "Recipients": [{"Phone": "0501234567"}],
                          "Settings": {"Sender": "שם"}}}).encode(), -18),
    (json.dumps({"Data": {"Message": "x", "Recipients": [{"Phone": "036234567"}],
                          "Settings": {"Sender": "Abc"}}}).encode(), -20),
    (json.dumps({"Data": {"Message": " ", "Recipients": [{"Phone": "0501234567"}],
                          "Settings": {"Sender": "Abc"}}}).encode(), -1),
])
def test_mock_enforces_contract(body, code):
    import base64
    m = InforUMock()
    auth = "Basic " + base64.b64encode(f"{m.username}:{m.token}".encode()).decode()
    st, out = m.route("POST", "/api/v2/SMS/SendSms", {"authorization": auth}, body)
    assert st == 200 and out["StatusId"] == code and m.sent == []
