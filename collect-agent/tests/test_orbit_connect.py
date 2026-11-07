"""כניסה מאורביט (/connect/orbit) — חוזה-המסירה v1 (knowledge/BUILD-ORDER-GABI-STORE-2026-11-07.md).

כל בדיקה כאן = מעקה: טוקן מזויף/פג/ממוחזר/לארגון אסור לא עובר; הסוד לא חוזר אף פעם בקריאה;
והצלחה **לא** פותחת סשן (שער 6 — הכניסה עצמה = סיסמה+TOTP).
"""
from __future__ import annotations

import base64
import json

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.orbit_connect import MAX_TTL, HandoffRejected, OrbitConnect, canonical_payload, make_token, sign
from app.ratelimit import RateLimiter
from app.secretbox import generate_key
from tests.conftest import AUTH, OWNER_TOKEN

ORG = "acme-studio"
EMAIL = "manager@acme.example"
NONCE = "N" * 22

# וקטור-זהב משותף: אותה מחרוזת בדיוק נבדקת בצד-אורביט (src/lib/__tests__/gabi-handoff-fn.test.ts)
# מול signGabiHandoff של TypeScript ⇒ שני מימושים בלתי-תלויים מסכימים על הבייטים.
GOLDEN_SECRET = "orbit-gabi-golden-vector-secret-0123456789"
GOLDEN_TOKEN = ("eyJ2IjoxLCJpc3MiOiJvcmJpdCIsImF1ZCI6ImdhYmkiLCJvcmciOiJhY21lLXN0dWRpbyIsImVtYWlsIjoi"
                "bWFuYWdlckBhY21lLmV4YW1wbGUiLCJpYXQiOjE3NjI1MDAwMDAsImV4cCI6MTc2MjUwMDEyMCwibm9uY2Ui"
                "OiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFBIn0.ZAD99oyloCiyaJ1KsJ5OE7LVS16Pv2etdBADqXByHCM")


@pytest.fixture(autouse=True)
def master_key(monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})))


def _now(svc) -> int:
    return int(svc.clock().timestamp())


def _issue(api, org=ORG) -> str:
    r = api.post("/orbit/link/secret", json={"org": org}, headers=AUTH)
    assert r.status_code == 200, r.text
    return r.json()["secret"]


def _tok(secret, svc, **over):
    now = _now(svc)
    kw = {"org": ORG, "email": EMAIL, "iat": now, "exp": now + 120, "nonce": NONCE, **over}
    return make_token(secret, **kw)


def _post(api, token):
    return api.post("/api/connect/orbit", json={"token": token})


# ---------- הצלחה ----------
def test_valid_token_identifies_org_and_email_but_opens_no_session(api, svc):
    secret = _issue(api)
    r = _post(api, _tok(secret, svc))
    assert r.status_code == 200, r.text
    d = r.json()
    assert d == {"ok": True, "org": ORG, "email": EMAIL, "next": "login"}
    # שער 6: אין טוקן-סשן בתשובה, ואין סשן חדש ב-DB
    assert "token" not in d and secret not in r.text
    assert svc.db.one("SELECT COUNT(*) c FROM sessions")["c"] == 0
    assert r.headers["cache-control"] == "no-store"
    acts = [x["action"] for x in svc.db.q("SELECT action FROM audit")]
    assert "orbit_handoff_ok" in acts
    # המייל לא נכתב ליומן (רק גיבוב)
    assert EMAIL not in json.dumps([dict(x) for x in svc.db.q("SELECT * FROM audit")])


def test_golden_vector_from_orbit_typescript_verifies(svc):
    oc = OrbitConnect(svc.db)
    oc.issue_secret(ORG, at="t")
    # מחליפים בסוד הזהב (אותו ערך שאורביט חותם בו בבדיקה שלו)
    oc._secrets().put(1, "orbit_handoff_secret", GOLDEN_SECRET, at="t")
    c = oc.verify(GOLDEN_TOKEN, 1762500000 + 10)
    assert (c.org, c.email, c.iat, c.exp, c.nonce) == (ORG, EMAIL, 1762500000, 1762500120,
                                                       "A" * 22)


def test_canonical_payload_matches_js_json_stringify():
    p = canonical_payload(ORG, EMAIL, 1, 2, NONCE)
    raw = base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode()
    assert raw == ('{"v":1,"iss":"orbit","aud":"gabi","org":"acme-studio",'
                   '"email":"manager@acme.example","iat":1,"exp":2,"nonce":"' + NONCE + '"}')


# ---------- דחיות ----------
def _reason(svc, token, now=None):
    oc = OrbitConnect(svc.db)
    with pytest.raises(HandoffRejected) as e:
        oc.verify(token, _now(svc) if now is None else now)
    return e.value.reason


def test_expired(api, svc):
    secret = _issue(api)
    now = _now(svc)
    assert _reason(svc, _tok(secret, svc, iat=now - 200, exp=now - 80)) == "expired"
    assert _reason(svc, _tok(secret, svc), now=now + 120) == "expired"   # בדיוק ב-exp ⇒ פג
    assert _post(api, _tok(secret, svc, iat=now - 200, exp=now - 80)).status_code == 401


def test_issued_in_future_beyond_skew(api, svc):
    secret = _issue(api)
    now = _now(svc)
    assert _reason(svc, _tok(secret, svc, iat=now + 61, exp=now + 120)) == "expired"
    OrbitConnect(svc.db).verify(_tok(secret, svc, iat=now + 59, exp=now + 120), now)  # בתוך הסבילות


@pytest.mark.parametrize("ttl", [MAX_TTL + 1, 3600, 0, -5])
def test_lifetime_too_long_or_non_positive(api, svc, ttl):
    secret = _issue(api)
    now = _now(svc)
    assert _reason(svc, _tok(secret, svc, iat=now, exp=now + ttl)) == "ttl"


def test_max_lifetime_exactly_is_ok(api, svc):
    secret = _issue(api)
    now = _now(svc)
    OrbitConnect(svc.db).verify(_tok(secret, svc, iat=now, exp=now + MAX_TTL), now)


def test_bad_signature(api, svc):
    _issue(api)
    assert _reason(svc, _tok("x" * 43, svc)) == "signature"
    assert _post(api, _tok("x" * 43, svc)).status_code == 401


def test_rotated_secret_invalidates_old(api, svc):
    old = _issue(api)
    new = _issue(api)
    assert old != new
    assert _reason(svc, _tok(old, svc)) == "signature"
    assert _post(api, _tok(new, svc)).status_code == 200


def test_unlinked_org_fails_as_signature(api, svc):
    secret = _issue(api)
    assert _reason(svc, _tok(secret, svc, org="other-org")) == "signature"


def _forge(secret, svc, **claims):
    now = _now(svc)
    c = {"v": 1, "iss": "orbit", "aud": "gabi", "org": ORG, "email": EMAIL, "iat": now,
         "exp": now + 120, "nonce": NONCE, **claims}
    p = base64.urlsafe_b64encode(json.dumps(c, separators=(",", ":")).encode()).rstrip(b"=").decode()
    return p + "." + sign(p, secret)


@pytest.mark.parametrize("claims", [{"aud": "orbit"}, {"aud": "gabi2"}, {"iss": "gabi"},
                                    {"iss": "evil"}, {"v": 2}])
def test_wrong_aud_iss_version_even_with_valid_signature(api, svc, claims):
    secret = _issue(api)
    assert _reason(svc, _forge(secret, svc, **claims)) == "claims"


@pytest.mark.parametrize("claims", [{"v": True}, {"iat": 1.5}, {"exp": "9999999999"},
                                    {"email": "Manager@acme.example"}, {"email": "no-at"},
                                    {"nonce": "short"}, {"org": "Acme"}, {"extra": 1}])
def test_schema_is_closed_and_strict(api, svc, claims):
    secret = _issue(api)
    assert _reason(svc, _forge(secret, svc, **claims)) == "claims"


def test_missing_claim_rejected(api, svc):
    secret = _issue(api)
    now = _now(svc)
    c = {"v": 1, "iss": "orbit", "aud": "gabi", "org": ORG, "email": EMAIL, "iat": now,
         "exp": now + 120}
    p = base64.urlsafe_b64encode(json.dumps(c).encode()).rstrip(b"=").decode()
    assert _reason(svc, p + "." + sign(p, secret)) == "claims"


def test_replay_single_use_nonce(api, svc):
    secret = _issue(api)
    t = _tok(secret, svc)
    assert _post(api, t).status_code == 200
    assert _post(api, t).status_code == 401
    assert _reason(svc, t) == "replay"
    # nonce אחר ⇒ עובר
    assert _post(api, _tok(secret, svc, nonce="M" * 22)).status_code == 200


def test_replay_table_cleans_up_expired(api, svc):
    secret = _issue(api)
    now = _now(svc)
    oc = OrbitConnect(svc.db)
    oc.verify(_tok(secret, svc, nonce="Q" * 22), now)
    assert svc.db.one("SELECT COUNT(*) c FROM orbit_nonces")["c"] == 1
    # אחרי שהטוקן פג (+ סבילות) הרשומה נמחקת באימות הבא
    later = now + 120 + 61
    oc.verify(_tok(secret, svc, iat=later, exp=later + 60, nonce="R" * 22), later)
    rows = [r["exp"] for r in svc.db.q("SELECT exp FROM orbit_nonces")]
    assert rows == [later + 60]


@pytest.mark.parametrize("org", ["default", "demo"])
def test_default_and_demo_orgs_refused(api, svc, org):
    # גם הנפקת סוד וגם אימות (אפילו עם חתימה תקינה בסוד ידוע)
    r = api.post("/orbit/link/secret", json={"org": org}, headers=AUTH)
    assert r.status_code == 409
    secret = _issue(api)
    assert _reason(svc, _tok(secret, svc, org=org)) == "org"


def test_tampered_fields_break_signature(api, svc):
    secret = _issue(api)
    t = _tok(secret, svc)
    payload, sig = t.split(".")
    c = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    for k, v in (("email", "attacker@evil.example"), ("exp", c["exp"] + 1), ("org", "acme-studio2"),
                 ("nonce", "Z" * 22)):
        p2 = base64.urlsafe_b64encode(
            json.dumps({**c, k: v}, separators=(",", ":")).encode()).rstrip(b"=").decode()
        assert _reason(svc, p2 + "." + sig) == "signature", k
    # חתימה קטועה / מורחבת
    assert _reason(svc, payload + "." + sig[:-2]) == "signature"
    assert _reason(svc, payload + "." + sig + "AA") == "signature"


@pytest.mark.parametrize("bad", ["", "abc", "a.b.c", "a." + "b" * 10, "!!!.???",
                                 "x" * 3000 + "." + "y"])
def test_malformed_tokens(api, svc, bad):
    _issue(api)
    assert _post(api, bad).status_code == 401


def test_token_never_accepted_in_query_string(api, svc):
    secret = _issue(api)
    t = _tok(secret, svc)
    assert api.post("/api/connect/orbit?h=" + t, json={"token": t}).status_code == 400
    assert api.post("/api/connect/orbit?token=" + t).status_code == 400
    # GET עם טוקן ב-query לא מאמת כלום — רק מגיש את הדף הסטטי
    r = api.get("/connect/orbit?h=" + t)
    assert r.status_code == 200 and t not in r.text
    assert svc.db.one("SELECT COUNT(*) c FROM orbit_nonces")["c"] == 0


def test_page_reads_fragment_and_posts_body(api):
    r = api.get("/connect/orbit")
    assert r.status_code == 200
    h = r.text
    assert "location.hash" in h and "history.replaceState" in h
    assert "/api/connect/orbit" in h and "method:'POST'" in h
    assert "/auth/login" in h and "sessionStorage" in h and "localStorage" not in h
    assert r.headers["cache-control"] == "no-store"
    assert r.headers["referrer-policy"] == "no-referrer"


def test_no_master_key_fails_closed(api, svc, monkeypatch):
    monkeypatch.delenv("COLLECT_MASTER_KEYS")
    r = api.post("/orbit/link/secret", json={"org": ORG}, headers=AUTH)
    assert r.status_code == 503
    have = svc.db.one("SELECT 1 FROM sqlite_master WHERE name='business_secrets'")
    assert not have or svc.db.one("SELECT COUNT(*) c FROM business_secrets")["c"] == 0
    assert api.get("/orbit/link", headers=AUTH).json() == {"linked": False}


# ---------- צד-הבעלים ----------
def test_secret_management_requires_auth(api):
    assert api.post("/orbit/link/secret", json={"org": ORG}).status_code == 401
    assert api.get("/orbit/link").status_code == 401
    assert api.post("/orbit/link/unlink").status_code == 401


def test_secret_shown_once_encrypted_at_rest_and_audited(api, svc):
    secret = _issue(api)
    assert len(secret) >= 32
    st = api.get("/orbit/link", headers=AUTH)
    assert st.status_code == 200 and st.json()["linked"] is True and st.json()["org"] == ORG
    assert secret not in st.text
    rows = svc.db.q("SELECT ciphertext FROM business_secrets")
    assert rows and all(secret not in r["ciphertext"] for r in rows)
    _issue(api)
    acts = [x["action"] for x in svc.db.q("SELECT action FROM audit ORDER BY id")]
    assert acts.count("orbit_secret_issued") == 1 and acts.count("orbit_secret_rotated") == 1
    assert secret not in json.dumps([dict(x) for x in svc.db.q("SELECT * FROM audit")])


def test_linking_second_org_requires_unlink(api, svc):
    _issue(api)
    assert api.post("/orbit/link/secret", json={"org": "other-org"}, headers=AUTH).status_code == 409
    secret = _issue(api)
    r = api.post("/orbit/link/unlink", headers=AUTH)
    assert r.json() == {"unlinked": True}
    assert _reason(svc, _tok(secret, svc)) == "signature"
    assert svc.db.one("SELECT COUNT(*) c FROM business_secrets")["c"] == 0
    _issue(api, "other-org")


def test_connect_routes_are_rate_limited(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))   # כללי ברירת-המחדל
    codes = [api.post("/api/connect/orbit", json={"token": "a.b"}).status_code for _ in range(25)]
    assert codes[0] == 401 and 429 in codes
