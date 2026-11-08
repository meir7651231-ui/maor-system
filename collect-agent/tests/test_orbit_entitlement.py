"""חיוב דרך אורביט (הכרעת מאיר 8.11.2026) — הזכאות מאורביט קובעת אם גבי מתכנן/שולח.

מעקות: זכאות מזויפת/פגה/לארגון אחר/בסוד-המסירה (שבידי הלקוח) לא נקלטת · השמעה-חוזרת של טוקן
ישן לא מחזירה מצב קודם · כל מצב (trial/active/past_due/cancelled) מגדר נכון את התכנון והשליחה ·
עסק לא-מקושר — בדיוק כמו היום.
"""
from __future__ import annotations

import base64
import json
from datetime import date, datetime

import pytest
from fastapi.testclient import TestClient

from app import orbit_entitlement as oe
from app.config import load_settings
from app.db import DB
from app.main import create_app
from app.orbit_connect import OrbitConnect, make_token
from app.policy import TZ
from app.ratelimit import RateLimiter
from app.secretbox import generate_key
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN

ORG = "acme-studio"
EMAIL = "manager@acme.example"
KEY = "orbit-gabi-entitlement-golden-key-0123456789"
# וקטור-זהב משותף — זהה ל-functions/gabiHandoff.test.mjs (Node חותם) ול-src/lib/__tests__/
# gabi-billing.test.ts (TypeScript מאמת) ⇒ שלושה מימושים מסכימים על הבייטים.
GOLDEN_ENT = (
    "eyJ2IjoxLCJpc3MiOiJvcmJpdCIsImF1ZCI6ImdhYmkiLCJ0eXAiOiJlbnRpdGxlbWVudCIsIm9yZyI6ImFjbWUtc3R1ZGlv"
    "IiwicGxhbiI6InllYXJseSIsInN0YXR1cyI6ImFjdGl2ZSIsInRyaWFsX3N0YXJ0IjoiMjAyNi0xMS0wMSIsInBhaWRfdW50"
    "aWwiOiIyMDI3LTExLTE0IiwiYmlsbGluZ191cmwiOiJodHRwczovL29yYml0LWlsLmNvbS8_b3JnPWFjbWUtc3R1ZGlvIiwi"
    "aWF0IjoxNzYyNTAwMDAwLCJleHAiOjE3NjI1MDAxMjB9.D83L_dTPQUPauaXhDGZiIstycnIBEQTBuTQHXzoK1YU")
BILL = "https://orbit-il.com/?org=acme-studio"


@pytest.fixture(autouse=True)
def keys(monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    monkeypatch.setenv(oe.KEY_ENV, KEY)


def _now(svc) -> int:
    return int(svc.clock().timestamp())


def _ent(svc, *, key=KEY, iat=None, ttl=120, **over) -> str:
    now = _now(svc) if iat is None else iat
    kw = {"org": ORG, "plan": "monthly", "status": "active", "trial_start": "2026-11-01",
          "paid_until": "2026-12-08", "billing_url": BILL, "iat": now, "exp": now + ttl, **over}
    return oe.make_token(key, **kw)


def _link(svc) -> str:
    return OrbitConnect(svc.db).issue_secret(ORG, at="t")


def _ingest(svc, token, now=None):
    return oe.OrbitEntitlements(svc.db).ingest(token, _now(svc) if now is None else now, org=ORG,
                                               at=svc.clock().isoformat())


def _reason(svc, token, now=None, org=ORG) -> str:
    with pytest.raises(oe.EntitlementRejected) as e:
        oe.OrbitEntitlements(svc.db).ingest(token, _now(svc) if now is None else now, org=org,
                                            at="t")
    return e.value.reason


# ---------- החוזה ----------
def test_golden_vector_from_orbit_node_verifies():
    c = oe.verify(GOLDEN_ENT, KEY, 1762500010, org=ORG)
    assert c == {"v": 1, "iss": "orbit", "aud": "gabi", "typ": "entitlement", "org": ORG,
                 "plan": "yearly", "status": "active", "trial_start": "2026-11-01",
                 "paid_until": "2027-11-14", "billing_url": BILL, "iat": 1762500000,
                 "exp": 1762500120}
    assert oe.make_token(KEY, org=ORG, plan="yearly", status="active", trial_start="2026-11-01",
                         paid_until="2027-11-14", billing_url=BILL, iat=1762500000,
                         exp=1762500120) == GOLDEN_ENT


def test_canonical_payload_matches_js_json_stringify():
    p = GOLDEN_ENT.split(".")[0]
    raw = base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode()
    assert raw.startswith('{"v":1,"iss":"orbit","aud":"gabi","typ":"entitlement","org":')
    assert oe.canonical_payload(json.loads(raw)) == p


def test_handoff_secret_is_not_the_entitlement_key(svc):
    """הסוד-הפר-ארגוני נמצא בידי הלקוח המשלם ⇒ חתימה בו לא נקלטת לעולם."""
    secret = _link(svc)
    assert _reason(svc, _ent(svc, key=secret)) == "signature"


@pytest.mark.parametrize("env,reason", [(None, "no_key"), ("short", "no_key")])
def test_no_platform_key_means_no_entitlement(svc, monkeypatch, env, reason):
    _link(svc)
    if env is None:
        monkeypatch.delenv(oe.KEY_ENV)
    else:
        monkeypatch.setenv(oe.KEY_ENV, env)
    assert _reason(svc, _ent(svc)) == reason
    assert oe.current(svc.db) is None


def test_rejections(svc):
    _link(svc)
    now = _now(svc)
    assert _reason(svc, _ent(svc, key="x" * 44)) == "signature"
    assert _reason(svc, _ent(svc, org="other-org")) == "org"
    assert _reason(svc, _ent(svc, ttl=301)) == "ttl"
    assert _reason(svc, _ent(svc, ttl=0)) == "ttl"
    assert _reason(svc, _ent(svc, iat=now - 200)) == "expired"
    assert _reason(svc, _ent(svc, iat=now + 61)) == "expired"
    assert _reason(svc, "nope") == "format"
    assert _reason(svc, "a" * 3000) == "format"
    for over in ({"status": "free"}, {"plan": "weekly"}, {"status": "trial", "trial_start": ""},
                 {"status": "past_due", "paid_until": ""}, {"paid_until": "2026-02-30"},
                 {"billing_url": "http://orbit-il.com/"},
                 {"billing_url": "javascript:alert(1)"}, {"typ": "handoff"}, {"v": True}):
        assert _reason(svc, _ent(svc, **over)) in ("claims",), over
    # שדה עודף
    c = {"v": 1, "iss": "orbit", "aud": "gabi", "typ": "entitlement", "org": ORG,
         "plan": "monthly", "status": "active", "trial_start": "", "paid_until": "2026-12-08",
         "billing_url": "", "iat": now, "exp": now + 60, "evil": 1}
    p = base64.urlsafe_b64encode(json.dumps(c, separators=(",", ":")).encode()).rstrip(b"=").decode()
    assert _reason(svc, p + "." + oe.sign(p, KEY)) == "claims"


def test_monotonic_replay_of_older_token_does_not_roll_back(svc):
    _link(svc)
    now = _now(svc)
    old_active = _ent(svc, iat=now - 30, status="active")
    newer_cancel = _ent(svc, iat=now - 10, status="cancelled", paid_until="")
    _ingest(svc, old_active)
    _ingest(svc, newer_cancel)
    assert _reason(svc, old_active) == "stale"         # בתוך התוקף, אבל ישן יותר
    assert _reason(svc, newer_cancel) == "stale"       # אותו iat
    assert oe.current(svc.db)["status"] == "cancelled"


def test_entitlement_only_for_the_linked_org(svc):
    _link(svc)
    _ingest(svc, _ent(svc))
    assert oe.current(svc.db)["org"] == ORG
    # שינוי קישור לארגון אחר ⇒ הזכאות הישנה לא חלה
    svc.db.x("UPDATE orbit_links SET org='other-org'")
    assert oe.current(svc.db) is None


# ---------- כללי ההערכה — טבלה משותפת עם src/lib/__tests__/gabi-billing.test.ts ----------
CASES = [
    ({"status": "trial", "trial_start": "2026-11-01"}, "2026-11-01", "trial", True),
    ({"status": "trial", "trial_start": "2026-11-01"}, "2026-11-14", "trial", True),
    ({"status": "trial", "trial_start": "2026-11-01"}, "2026-11-15", "trial_expired", False),
    ({"status": "active", "paid_until": "2026-12-08"}, "2026-12-08", "active", True),
    ({"status": "active", "paid_until": "2026-12-08"}, "2026-12-09", "grace", True),
    ({"status": "active", "paid_until": "2026-12-08"}, "2026-12-15", "grace", True),
    ({"status": "active", "paid_until": "2026-12-08"}, "2026-12-16", "expired", False),
    ({"status": "past_due", "paid_until": "2026-12-08"}, "2026-12-01", "grace", True),
    ({"status": "past_due", "paid_until": "2026-12-08"}, "2026-12-16", "expired", False),
    ({"status": "cancelled", "paid_until": "2027-01-01"}, "2026-12-01", "cancelled", False),
    ({"status": "cancelled", "paid_until": ""}, "2026-12-01", "cancelled", False),
]


@pytest.mark.parametrize("over,today,state,active", CASES)
def test_evaluate_table(over, today, state, active):
    ent = {"plan": "monthly", "status": "active", "trial_start": "2026-11-01",
           "paid_until": "2026-12-08", "billing_url": "", **over}
    t = oe.evaluate(ent, date.fromisoformat(today), trial_days=14, price_ils_month=119)
    assert (t["state"], t["active"], t["source"]) == (state, active, "orbit")


def test_trial_is_14_days_from_orbit_trial_start_and_warns_3_days_before():
    ent = {"plan": "yearly", "status": "trial", "trial_start": "2026-11-01", "paid_until": "",
           "billing_url": ""}
    t = oe.evaluate(ent, date(2026, 11, 12), trial_days=14, price_ils_month=119)
    assert t["ends"] == "2026-11-15" and t["days_left"] == 3 and t["ending_soon"] is True
    assert t["on_trial"] is True and t["price_ils_month"] == 119


# ---------- השער בשירות: תכנון ושליחה לפי הזכאות ----------
def _setup(svc, **ent):
    _link(svc)
    _ingest(svc, _ent(svc, **ent))


def _cycle(svc, api):
    api.post("/sync")
    return api.post("/plan").json()["created"]


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})),
                      headers=AUTH)


@pytest.mark.parametrize("ent,plans", [
    ({"status": "active", "paid_until": "2026-12-08"}, True),
    ({"status": "active", "paid_until": "2026-11-05"}, True),     # חסד (עד 12.11)
    ({"status": "past_due", "paid_until": "2026-11-05"}, True),   # חסד
    ({"status": "trial", "trial_start": "2026-11-01"}, True),     # ניסיון, נותרו 7
    ({"status": "active", "paid_until": "2026-10-31"}, False),    # חסד נגמר 7.11
    ({"status": "past_due", "paid_until": "2026-10-31"}, False),
    ({"status": "trial", "trial_start": "2026-10-25"}, False),    # הסתיים 8.11
    ({"status": "cancelled", "paid_until": "2026-12-08"}, False), # בוטל ⇒ מיידי
])
def test_planning_follows_entitlement(svc, api, ent, plans):
    _setup(svc, **ent)
    created = _cycle(svc, api)
    assert bool(created) is plans, (ent, created)
    assert svc.trial()["active"] is plans


def test_stopped_means_no_dispatch_and_gate_blocks(svc, api):
    _link(svc)
    _ingest(svc, _ent(svc, status="active", paid_until="2026-12-08"))
    ids = _cycle(svc, api)
    assert ids
    api.post(f"/reminders/{ids[0]}/approve")
    # אורביט: בוטל ⇒ זכאות חדשה (iat מאוחר) ⇒ גבי עוצר
    _ingest(svc, _ent(svc, iat=_now(svc) + 1, status="cancelled", paid_until=""))
    assert svc.dispatch() == [] and svc.sender.sent == []
    cust = svc.db.one("SELECT * FROM customers LIMIT 1")
    assert svc.gate(cust, "sms", "0501234567") == "trial_expired"
    assert api.get("/dashboard").json()["totals"]["open_invoices"] == 2   # הנתונים נשמרים


def _billing_msgs(svc):
    return svc.db.q("SELECT * FROM messages WHERE intent='orbit_billing' AND needs_owner=1")


@pytest.mark.parametrize("ent,phrase", [
    ({"status": "cancelled", "paid_until": ""}, "בוטל"),
    ({"status": "active", "paid_until": "2026-10-31"}, "הסתיים"),
    ({"status": "trial", "trial_start": "2026-10-25"}, "תקופת הניסיון של גבי הסתיימה"),
])
def test_stopped_owner_notice_hebrew_with_orbit_link_once(svc, api, ent, phrase):
    _setup(svc, **ent)
    for _ in range(3):
        api.post("/plan")
    (n,) = _billing_msgs(svc)
    assert phrase in n["body"] and BILL in n["body"] and "לא נשלחות" in n["body"]
    assert n["customer_id"] is None
    acts = [a["action"] for a in api.get("/audit").json()]
    assert acts.count("orbit_billing_notice") == 1
    assert all("אורביט" not in m["body"] for m in svc.sender.sent)   # לעולם לא לחייב


def test_grace_notice_says_until_when(svc, api):
    _setup(svc, status="past_due", paid_until="2026-11-05")
    assert _cycle(svc, api)                      # עדיין שולח בחסד
    (n,) = _billing_msgs(svc)
    assert "2026-11-12" in n["body"] and "ממשיכות" in n["body"] and BILL in n["body"]


def test_active_paid_no_notice(svc, api):
    _setup(svc, status="active", paid_until="2026-12-08")
    _cycle(svc, api)
    assert _billing_msgs(svc) == []


def test_orbit_trial_ending_notice_points_to_orbit(svc, api):
    _setup(svc, status="trial", trial_start="2026-10-27")   # נגמר 10.11 ⇒ נותרו 2
    api.post("/plan")
    (n,) = svc.db.q("SELECT * FROM messages WHERE intent='trial_ending'")
    assert "בעוד יומיים" in n["body"] and "דרך אורביט" in n["body"] and BILL in n["body"]
    assert "לא יבוצע חיוב אוטומטי" in n["body"]


# ---------- עסק לא-מקושר / בלי זכאות — כמו היום ----------
def test_unlinked_business_keeps_local_trial(gi_client, clock):
    s = load_settings({"TRIAL_START": "2026-10-25", "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/s"})
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    t = svc.trial()
    assert "source" not in t and t["active"] is False      # הניסיון המקומי הסתיים 8.11
    # גם זכאות שמורה בלי קישור — מתעלמים (התנהגות של היום)
    oe.ensure_schema(svc.db)
    svc.db.x("INSERT INTO orbit_entitlements VALUES(1,?,?,?,?,?,?,?,?)",
             (ORG, "monthly", "active", "", "2099-01-01", "", 1, "t"))
    assert svc.trial()["active"] is False and "source" not in svc.trial()


def test_linked_without_entitlement_keeps_local_behaviour(svc):
    _link(svc)
    assert svc.trial() == {"price_ils_month": 119, "trial_days": 14, "on_trial": False,
                           "active": True, "days_left": None, "ending_soon": False}


def test_unlink_drops_entitlement(svc, api):
    _setup(svc, status="cancelled", paid_until="")
    assert svc.trial()["active"] is False
    assert api.post("/orbit/link/unlink").json() == {"unlinked": True}
    assert svc.db.one("SELECT COUNT(*) c FROM orbit_entitlements")["c"] == 0
    assert svc.trial()["active"] is True and "source" not in svc.trial()


# ---------- API ----------
def test_connect_with_entitlement_updates_and_audits(svc, api):
    secret = _link(svc)
    now = _now(svc)
    h = make_token(secret, org=ORG, email=EMAIL, iat=now, exp=now + 120, nonce="N" * 22)
    r = api.post("/api/connect/orbit", json={"token": h, "ent": _ent(svc, status="past_due")})
    assert r.status_code == 200
    assert r.json() == {"ok": True, "org": ORG, "email": EMAIL, "next": "login",
                        "entitlement": "updated"}
    assert oe.current(svc.db)["status"] == "past_due"
    a = svc.db.one("SELECT * FROM audit WHERE action='orbit_entitlement_ok'")
    assert json.loads(a["detail"])["status"] == "past_due"


def test_connect_bad_entitlement_is_ignored_but_login_continues(svc, api):
    secret = _link(svc)
    now = _now(svc)
    h = make_token(secret, org=ORG, email=EMAIL, iat=now, exp=now + 120, nonce="M" * 22)
    r = api.post("/api/connect/orbit", json={"token": h, "ent": _ent(svc, key=secret)})
    assert r.status_code == 200 and r.json()["entitlement"] == "ignored"
    assert oe.current(svc.db) is None
    a = svc.db.one("SELECT * FROM audit WHERE action='orbit_entitlement_rejected'")
    assert json.loads(a["detail"]) == {"reason": "signature"}


def test_entitlement_without_valid_handoff_is_never_ingested(svc, api):
    _link(svc)
    r = api.post("/api/connect/orbit", json={"token": "bad.token", "ent": _ent(svc)})
    assert r.status_code == 401
    assert oe.current(svc.db) is None


def test_connect_without_ent_is_v1_bit_identical(svc, api):
    secret = _link(svc)
    now = _now(svc)
    h = make_token(secret, org=ORG, email=EMAIL, iat=now, exp=now + 120, nonce="P" * 22)
    assert api.post("/api/connect/orbit", json={"token": h}).json() == {
        "ok": True, "org": ORG, "email": EMAIL, "next": "login"}


def test_owner_view_route(svc, api):
    anon = TestClient(api.app)
    assert anon.get("/orbit/entitlement").status_code == 401
    assert api.get("/orbit/entitlement").json() == {"linked": False, "entitlement": None,
                                                    "billing": None, "source": "local"}
    _setup(svc, status="active", paid_until="2026-12-08")
    d = api.get("/orbit/entitlement").json()
    assert d["linked"] is True and d["source"] == "orbit"
    assert d["entitlement"]["plan"] == "monthly" and d["billing"]["state"] == "active"
    assert d["billing"]["billing_url"] == BILL
    acts = [a["action"] for a in api.get("/audit").json()]
    assert acts.count("orbit_entitlement_viewed") == 2


def test_connect_page_forwards_ent_from_fragment(api):
    html = api.get("/connect/orbit").text
    assert "(?:^#|&)e=" in html and "body.ent=e[1]" in html


def test_wipe_includes_entitlements():
    from app import wipe
    assert "orbit_entitlements" in wipe._TABLES


def test_clock_fixture_is_8_11(clock):
    assert clock.now == datetime(2026, 11, 8, 10, 0, tzinfo=TZ)
