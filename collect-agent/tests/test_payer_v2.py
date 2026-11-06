"""עמוד החייב v2 (/pay/{code}) + KPI עשירים וגרף הגבייה בדשבורד."""
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_flow import first_cycle


def _code(api, svc):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    sms = next(m for m in api.get("/outbox").json()["messages"] if m["channel"] == "sms")
    return sms["body"].split("/p/")[1].split()[0]


def _api(svc, tmp_path=None):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_payer_api_is_public_and_minimal(svc):
    api = _api(svc)
    code = _code(api, svc)
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))      # בלי טוקן בעלים
    v = pub.get(f"/api/pay/{code}").json()
    assert v["number"] == "1001" and v["amount_agorot"] == 120000 and v["open"] is True
    assert v["methods"] == ["bit", "apple_pay", "card"] and v["dry_run"] is True
    flat = str(v)
    for leak in ("050", "972", "@example.com", "unsub", "_cust", "phone", "email"):
        assert leak not in flat, leak                                  # בלי פרטי קשר/טוקן הסרה
    assert pub.get("/api/pay/nope").status_code == 404


def test_payer_go_redirects_only_to_verified_link(svc):
    api = _api(svc)
    code = _code(api, svc)
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    r = pub.get(f"/pay/{code}/go?method=bit", follow_redirects=False)
    # עמוד התשלום של העסק (review חור 3: לא נוצר דף תשלום/קבלה ב-GI)
    assert r.status_code == 302 and r.headers["location"].startswith(
        "https://www.greeninvoice.co.il/pay/studio")
    assert pub.get(f"/pay/{code}/go?method=paypal", follow_redirects=False).status_code == 409
    assert svc.db.one("SELECT 1 FROM audit WHERE action='pay_click' AND detail LIKE '%bit%'")


def test_payer_actions_paid_plan_stop(svc):
    api = _api(svc)
    code = _code(api, svc)
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert pub.post(f"/api/pay/{code}/hack").status_code == 400
    r = pub.post(f"/api/pay/{code}/plan", json={"installments": 3}).json()
    assert r == {"action": "plan", "ok": True}
    assert api.get("/plans").json()                                  # הצעת פריסה לאישור הבעלים
    assert pub.post(f"/api/pay/{code}/stop").json()["ok"]
    assert pub.get(f"/api/pay/{code}").json()["opted_out"] is True


def test_pay_page_serves_spa_with_base_or_falls_back(svc, tmp_path, monkeypatch):
    api = _api(svc)
    code = _code(api, svc)
    monkeypatch.setenv("WEB_DIST", str(tmp_path / "none"))
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    r = c.get(f"/pay/{code}", follow_redirects=False)
    assert r.status_code == 302 and r.headers["location"] == f"/p/{code}"   # בלי build ⇒ עמוד השרת
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text("<html><head><title>x</title></head><body></body></html>")
    monkeypatch.setenv("WEB_DIST", str(dist))
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    r = c.get(f"/pay/{code}")
    assert r.status_code == 200 and '<base href="/app/">' in r.text
    assert r.headers["x-robots-tag"] == "noindex"
    assert c.get("/pay/nope").status_code == 404


def test_dashboard_rich_kpis_and_weekly_series(svc, fake_gi, clock):
    api = _api(svc)
    _code(api, svc)
    api.post("/inbound", json={"sender": "050-1234567", "text": "איך משלמים?"})
    clock.now += timedelta(days=1)
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc2"]     # יוסי שילם
    api.post("/sync")
    d = api.get("/dashboard").json()
    t = d["totals"]
    assert t["collected_agorot"] == 120000 and t["open_agorot"] == 120000
    assert t["recovery_rate_pct"] == 50 and t["reminders_sent"] == 1
    assert t["customers_messaged"] == 1 and t["reply_rate_pct"] == 100
    assert t["avg_days_overdue"] > 0 and "at_risk_agorot" in t
    s = d["series"]
    assert len(s) == 8 and sum(w["collected_agorot"] for w in s) == 120000 and s[-1]["count"] == 1
