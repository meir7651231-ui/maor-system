"""הפעלה 193 (critic סבב 70, 💡): לעמודי ה-HTML של השרת (/p, /u, /landing, /ui, /connect/orbit) לא היה
Content-Security-Policy. הזרקת HTML בשם עסק/לקוח ⇒ סקריפט רץ בעמוד החייב, או טופס שנשלח לשרת זר.
עכשיו: עמודי החייב בלי סקריפט בכלל; עמודים עם inline רק לפי sha256 של הסקריפט המדויק; /app/ ו-/pay/ מ-self."""
from __future__ import annotations

import re

from fastapi.testclient import TestClient

from app import csp
from app.main import UI_HTML, create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _directives(header: str) -> dict[str, str]:
    return {p.strip().split(" ", 1)[0]: (p.strip().split(" ", 1) + [""])[1] for p in header.split(";") if p.strip()}


def _code(svc, api):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    return re.search(r"/p/(\w+)", svc._reminder(rid)["body"]).group(1)


def test_debtor_pages_run_no_script(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    code = _code(svc, api)
    for path in (f"/p/{code}", "/p/zzzzzzz", f"/u/{svc.new_unsub_token(1)}"):
        r = pub.get(path)
        assert r.headers["content-type"].startswith("text/html"), path
        d = _directives(r.headers.get("content-security-policy") or "")
        assert d.get("default-src") == "'none'" and "script-src" not in d, (path, d)
        assert d.get("form-action") == "'self'" and d.get("frame-ancestors") == "'none'", (path, d)
        assert d.get("base-uri") == "'none'", (path, d)
        assert "<script" not in r.text.lower(), path   # המדיניות לא שוברת כלום: אין סקריפט בעמוד


def test_post_action_page_also_strict(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    code = _code(svc, api)
    r = pub.post(f"/p/{code}/paid")
    assert r.headers["content-security-policy"] == csp.STRICT


def test_inline_pages_allow_only_their_exact_script(svc):
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for path in ("/ui", "/connect/orbit"):
        r = pub.get(path)
        d = _directives(r.headers["content-security-policy"])
        assert "'unsafe-inline'" not in d["script-src"] and "'unsafe-eval'" not in d["script-src"], (path, d)
        got = set(d["script-src"].split())
        assert got == set(csp.script_hashes(r.text)) and got, (path, d)   # בדיוק הסקריפטים של העמוד שהוגש
        assert d["connect-src"] == "'self'", path


def test_ui_hash_matches_file_and_rejects_tampering():
    h = csp.script_hashes(UI_HTML)
    assert len(h) == 1
    assert csp.script_hashes(UI_HTML.replace("<script>", "<script>alert(1);", 1)) != h


def test_script_hashes_skip_src_scripts():
    html = '<script src="/a.js"></script><script type="module">x()</script>'
    assert len(csp.script_hashes(html)) == 1


def test_app_policy_self_only():
    for p in ("/app/", "/app/index.html", "/pay/abc"):
        d = _directives(csp.for_path(p))
        assert d["script-src"] == "'self'" and d["connect-src"] == "'self'", p
        assert d["base-uri"] == "'self'", p   # /pay/ מזריק <base href="/app/">; 'none' שבר את העמוד
    assert csp.for_path("/p/abc") == csp.STRICT and csp.for_path("/landing/plain") == csp.STRICT


def test_json_api_has_no_csp(svc):
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert "content-security-policy" not in pub.get("/health").headers
