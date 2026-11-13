"""הפעלה 172 (פתוח מביקורת 170): Cache-Control: no-store לכל תשובה שעלולה להכיל נתוני לקוחות.

הבאג: תשובות ה-API המאומתות (/dashboard, /reminders, /audit…) ועמוד החייב /p/{code} (שם + סכום
חוב) נשלחו בלי Cache-Control. דפדפן או פרוקסי רשאים לשמור תשובה כזו (מטמון היוריסטי), ואחרי
«יציאה» כפתור «אחורה» עלול להציג את הנתונים מהמטמון. התיקון: ברירת מחדל no-store ב-middleware
של כותרות האבטחה, וחריג יחיד — נכסי ה-build הסטטיים של /app/ (JS/CSS, בלי נתונים).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import _cacheable_static, create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def client(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN))


AUTHED_GET = ["/dashboard", "/dashboard?view=list", "/reminders", "/reminders?view=list",
              "/reminders?view=summary", "/outbox", "/owner/inbox", "/plans", "/audit"]


@pytest.mark.parametrize("path", AUTHED_GET)
def test_authenticated_api_is_no_store(client, path):
    r = client.get(path, headers=AUTH)
    assert r.status_code == 200, (path, r.status_code)
    assert r.headers["cache-control"] == "no-store", path


def test_gzip_list_view_is_no_store(client, svc, fake_gi):
    """התשובה הדחוסה של /ui (gzip_json) נבנית כ-Response חדש — גם היא מקבלת no-store."""
    from tests.conftest import gi_doc
    fake_gi.docs = [gi_doc(i) for i in range(1, 30)]
    svc.sync()
    r = client.get("/dashboard?view=list", headers={**AUTH, "Accept-Encoding": "gzip"})
    assert r.headers.get("content-encoding") == "gzip"
    assert r.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("method,path", [("post", "/sync"), ("post", "/plan")])
def test_authenticated_post_is_no_store(client, method, path):
    r = getattr(client, method)(path, headers=AUTH)
    assert r.status_code == 200
    assert r.headers["cache-control"] == "no-store"


def test_error_responses_are_no_store(client):
    assert client.get("/dashboard").headers["cache-control"] == "no-store"          # 401
    assert client.get("/p/nope").headers["cache-control"] == "no-store"             # 404
    assert client.get("/health").headers["cache-control"] == "no-store"


def test_payer_page_with_debt_is_no_store(client, svc, fake_gi):
    """/p/{code} מציג שם לקוח וסכום חוב — היה בלי Cache-Control."""
    from tests.conftest import gi_doc
    fake_gi.docs = [gi_doc(1)]
    svc.sync()
    svc.plan()                                    # הקוד הקצר נוצר עם התזכורת
    code = svc.db.one("SELECT short_code FROM invoices WHERE short_code IS NOT NULL LIMIT 1")[0]
    assert code
    r = client.get(f"/p/{code}")
    assert r.status_code == 200
    assert r.headers["cache-control"] == "no-store"
    j = client.get(f"/api/pay/{code}")
    assert j.status_code == 200 and j.headers["cache-control"] == "no-store"


def test_explicit_cache_control_not_overridden(client):
    """setdefault: נקודה שקבעה כותרת משלה (למשל /u/) לא נדרסת."""
    assert client.get("/u/whatever").headers["cache-control"] == "no-store"


def test_cacheable_static_only_app_assets():
    assert _cacheable_static("/app/assets/index-abc123.js")
    assert _cacheable_static("/app/assets/index-abc123.css")
    assert _cacheable_static("/app/favicon.svg")
    assert not _cacheable_static("/app/")
    assert not _cacheable_static("/app/index.html")
    assert not _cacheable_static("/app")
    assert not _cacheable_static("/dashboard")
    assert not _cacheable_static("/api/pay/x.js")
    assert not _cacheable_static("/p/abc.js")
    assert not _cacheable_static("/ui")


def test_app_static_assets_keep_caching(svc, tmp_path, monkeypatch):
    """נכסי /app/ ממשיכים להיות ניתנים למטמון; index.html של /app/ — no-store."""
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text("<!doctype html><head></head><p>x</p>", encoding="utf-8")
    (tmp_path / "assets" / "index-abc.js").write_text("console.log(1)", encoding="utf-8")
    monkeypatch.setenv("WEB_DIST", str(tmp_path))
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    a = c.get("/app/assets/index-abc.js")
    assert a.status_code == 200 and "cache-control" not in a.headers
    assert a.headers["x-content-type-options"] == "nosniff"
    i = c.get("/app/")
    assert i.status_code == 200 and i.headers["cache-control"] == "no-store"
