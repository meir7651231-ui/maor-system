"""הפעלת מנהל 110 · המשך 107–109: הסריקה הסטטית כיסתה רק `str(x.get(...))`. נשארו שני דפוסים:
1. `str(b["sid"])` בכניסה ל-iCount: תשובת status:true בלי sid (או sid=null) הפכה ל-KeyError גולמי
   (לא ProviderError ⇒ הסנכרון קרס במקום כשל-ספק מסודר) או ל-sid "None" שנשלח לכל קריאה ונכשל
   שוב ושוב. עכשיו: ProviderError לא-חוזר עם הסבר.
2. f-string עם `{x.get(...)}` על JSON חיצוני מדפיס "None" (webhook_ref של iCount ביומן, הודעת
   השגיאה של InforU). הסריקה הורחבה: אסור `{x.get(...)}` חשוף במודולים שממפים קלט חיצוני."""
from __future__ import annotations

import ast
import json
from pathlib import Path

import httpx
import pytest

from app.integrations.accounting import ICountClient
from app.integrations.base import ProviderError

from .test_no_bare_str_get import SCANNED


def _client(login_body):
    def handler(req):
        if req.url.path.endswith("/auth/login"):
            return httpx.Response(200, json=login_body)
        b = json.loads(req.content)
        if b.get("sid") in (None, "None", ""):
            return httpx.Response(200, json={"status": False, "reason": "bad sid"})
        return httpx.Response(200, json={"status": True, "results_list": [], "results_count": 0})
    return ICountClient(cid="co", user="u", password="p",
                        transport=httpx.MockTransport(handler))


@pytest.mark.parametrize("body", [{"status": True}, {"status": True, "sid": None},
                                  {"status": True, "sid": ""}])
def test_icount_login_without_sid_is_provider_error(body):
    c = _client(body)
    with pytest.raises(ProviderError) as e:
        list(c.iter_open_invoices())
    assert "sid" in str(e.value) and e.value.retryable is False
    assert c._sid is None                     # לא נשמר "None" כ-sid


def test_icount_login_with_sid_still_works():
    c = _client({"status": True, "sid": "S1"})
    assert list(c.iter_open_invoices()) == [] and c._sid == "S1"


def test_icount_webhook_ref_null_fields():
    assert ICountClient.webhook_ref({"doctype": None, "docnum": None}) == "-"
    assert ICountClient.webhook_ref({"doctype": "invrec", "docnum": 7}) == "invrec-7"


def test_inforu_error_without_status_has_no_none():
    from app.integrations.sms import InforUSms
    s = InforUSms.__new__(InforUSms)
    with pytest.raises(ProviderError) as e:
        s.parse(httpx.Response(200, json={"StatusId": None, "StatusDescription": None}))
    assert "None" not in str(e.value)


def _bare_fstring_get(tree: ast.AST) -> list[int]:
    return [n.lineno for n in ast.walk(tree)
            if isinstance(n, ast.FormattedValue) and isinstance(n.value, ast.Call)
            and isinstance(n.value.func, ast.Attribute) and n.value.func.attr == "get"]


@pytest.mark.parametrize("path", SCANNED, ids=lambda p: p.name)
def test_no_bare_fstring_of_dict_get(path: Path):
    hits = _bare_fstring_get(ast.parse(path.read_text(encoding="utf-8")))
    assert not hits, (f"{path.name}:{hits} — f'{{x.get(...)}}' מדפיס 'None' על null; "
                      "השתמשו ב-{jstr(x.get(...))}")


def test_fstring_scanner_catches_the_pattern():
    assert _bare_fstring_get(ast.parse("f'{d.get(\"a\")}'")) == [1]
    assert _bare_fstring_get(ast.parse("f'{jstr(d.get(\"a\"))}'")) == []
