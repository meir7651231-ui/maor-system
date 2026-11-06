"""QA סבב 2 (6.11 לילה): רשימת הסרה פר-עסק, איחוד לקוחות, hash לטוקני הסרה, הגבלת קצב,
סודות עסק דרך secretbox, נעילת תלויות, וסריקות: סודות בלוגים, זיוף inbound, סורקי קישורים.
כל בדיקה מתעדת את הבאג/הסיכון שהיא נועלת.
"""
from __future__ import annotations

import io
import logging
import pathlib
import re
import tomllib

import pytest
from fastapi.testclient import TestClient

from app.business_secrets import BusinessSecrets
from app.db import DB, token_hash
from app.greeninvoice import map_document
from app.main import create_app
from app.ratelimit import RateLimiter, Rule
from app.secretbox import SecretBox, SecretError, generate_key
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

customer_key = CollectService.customer_key

ROOT = pathlib.Path(__file__).resolve().parents[1]


def _ingest(svc, *docs):
    return svc.ingest([map_document(d) for d in docs])


def _cid(svc, ext):
    return svc.db.one("SELECT id FROM customers WHERE external_id=?", (ext,))["id"]


# ======================= רשימת הסרה פר-עסק (מימוש backend c9e1605 — אימות QA) =======================
def _dispatch_all(svc):
    for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'"):
        try:
            svc.approve(r["id"])
        except ValueError:
            pass
    return svc.dispatch()


def test_opt_out_covers_duplicate_customer_records(svc):
    """הסרה נשמרה פר-רשומה ⇒ אותו אדם בכרטיס כפול (מזהה אחר, אותו טלפון) קיבל שוב תזכורות.
    עכשיו: רשימת הסרה לפי hash של טלפון/מייל + שער שליחה יחיד."""
    _ingest(svc, gi_doc(1, client_id="A", phone="050-1234567"),
            gi_doc(2, client_id="B", phone="+972 50 123 4567", name="דנה (כרטיס 2)"))
    svc._opt_out(_cid(svc, "A"), "reply")
    svc.plan()
    _dispatch_all(svc)
    assert not [m for m in svc.sender.sent if m["to"] in ("972501234567", "c1@example.com")]


def test_suppression_survives_resync_and_new_record(svc):
    _ingest(svc, gi_doc(1, client_id="A", phone="050-1234567"))
    svc._opt_out(_cid(svc, "A"), "link")
    # כרטיס חדש בחשבונית ירוקה עם אותו נייד, בסנכרון מאוחר יותר
    _ingest(svc, gi_doc(1, client_id="A", phone="050-1234567"),
            gi_doc(7, client_id="NEW", phone="0501234567", name="דנה כהן (חדש)"))
    svc.plan()
    _dispatch_all(svc)
    assert not [m for m in svc.sender.sent if m["channel"] == "sms" and m["to"] == "972501234567"]


def test_suppression_is_minimal_hashed(svc):
    _ingest(svc, gi_doc(1, client_id="A", phone="050-1234567"))
    svc._opt_out(_cid(svc, "A"), "reply")
    rows = [dict(r) for r in svc.db.q("SELECT * FROM suppressions")]
    assert {r["channel"] for r in rows} == {"sms", "email"}
    dump = str(rows)
    assert "0501234567" not in dump and "972501234567" not in dump and "c1@example" not in dump
    assert set(rows[0]) == {"hash", "channel", "reason", "created_at"}  # בלי שם/סכום/חשבונית


def test_wrong_number_suppresses_phone_for_all_records(svc):
    """ממצא QA: «מספר שגוי» מחק את הטלפון מרשומה אחת בלבד, ולא הכניס אותו לרשימת ההסרה ⇒
    רשומה אחרת עם אותו מספר (שאינו של החייב) המשיכה לקבל הודעות."""
    _ingest(svc, gi_doc(1, client_id="A", phone="050-1234567"),
            gi_doc(2, client_id="B", phone="050-1234567", name="דנה (כרטיס 2)"))
    svc.inbound("sms", "0501234567", "טעות במספר, אני לא דנה")
    assert svc.suppressed("sms", "0501234567")


def test_gate_allows_only_opt_out_ack(svc):
    _ingest(svc, gi_doc(1, client_id="A"))
    c = svc.db.one("SELECT * FROM customers")
    svc.suppress("sms", "0501234567", "carrier_blacklist")
    assert svc.gate(c, "sms", "972501234567") == "opted_out"
    assert svc.gate(c, "sms", "972501234567", opt_out_ack=True) in (None, "outside_window")


# ======================= איחוד לקוחות =======================
def _inv(**kw):
    cid = kw.pop("client_id", None)
    d = gi_doc(kw.pop("i", 1), **kw)
    if cid is not None:
        d["client"]["id"] = cid
    return map_document(d)


def test_customers_without_id_or_phone_are_not_merged(svc):
    """באג: `id or f"phone:{phone}"` ⇒ כל החשבוניות בלי מזהה ובלי טלפון אוחדו ללקוח "phone:",
    ותזכורת של לקוח אחד יכלה לצאת עם פרטי חוב של אחר."""
    d1 = gi_doc(1, phone="")
    d2 = gi_doc(2, phone="", name="יוסי לוי")
    for d in (d1, d2):
        d["client"]["id"] = ""
        d["client"]["emails"] = []
    _ingest(svc, d1, d2)
    assert svc.db.one("SELECT COUNT(*) n FROM customers")["n"] == 2
    assert svc.db.one("SELECT COUNT(*) n FROM customers WHERE external_id='phone:'")["n"] == 0


def test_customer_key_order_and_normalization():
    """מזהה GI ⇒ מייל מנורמל ⇒ טלפון מנורמל ⇒ החשבונית עצמה (מימוש backend, אימות QA)."""
    assert customer_key(_inv(i=4, client_id="gi-77")) == "gi-77"
    assert customer_key(_inv(i=3, phone="", client_id="")).startswith("email:")
    a, b = _inv(phone="050-1234567", client_id=""), _inv(i=2, phone="+972 50 123 4567",
                                                          client_id="")
    for x in (a, b):
        object.__setattr__(x, "client_email", "")
    assert customer_key(a) == customer_key(b)  # אותו נייד בשני פורמטים = אותו לקוח


# ======================= טוקני הסרה כ-hash =======================
def test_unsub_tokens_stored_only_as_hash(svc):
    _ingest(svc, gi_doc(1, client_id="A"))
    tok = svc.new_unsub_token(_cid(svc, "A"))
    dump = "\n".join(svc.db.conn.iterdump())
    assert tok not in dump.replace(svc.unsub_url(tok), "")  # רק בגוף הודעה שנשלחה, לא בטבלאות
    assert token_hash(tok) in dump
    assert svc.has_unsub_token(tok) and not svc.has_unsub_token(tok + "x")
    assert not svc.has_unsub_token("a" * 500)


def test_old_unsub_links_keep_working(svc):
    _ingest(svc, gi_doc(1, client_id="A"))
    t1 = svc.new_unsub_token(_cid(svc, "A"))
    t2 = svc.new_unsub_token(_cid(svc, "A"))
    assert t1 != t2 and svc.unsubscribe(t1)


def test_legacy_plaintext_tokens_migrated(tmp_path):
    p = tmp_path / "old.sqlite3"
    db = DB(str(p))
    db.x("INSERT INTO customers(external_id,name,unsub_token) VALUES('A','דנה','legacy-tok-123')")
    db.conn.close()
    db2 = DB(str(p))
    assert db2.one("SELECT unsub_token FROM customers")[0] is None
    assert db2.one("SELECT customer_id FROM link_tokens WHERE token_hash=?",
                   (token_hash("legacy-tok-123"),))


# ======================= הגבלת קצב =======================
class FakeMono:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def test_ratelimiter_window():
    c = FakeMono()
    rl = RateLimiter(rules={"g": Rule(3, 60)}, clock=c)
    assert [rl.check("g", "ip") for _ in range(3)] == [None] * 3
    assert rl.check("g", "ip") == pytest.approx(60)
    assert rl.check("g", "other") is None  # פר-IP
    c.t += 61
    assert rl.check("g", "ip") is None


def test_ratelimit_public_links_429(svc):
    rl = RateLimiter(rules={"public_link": Rule(5, 60)})
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=rl))
    codes = [api.get("/p/AAAAAAA").status_code for _ in range(7)]
    assert codes[:5] == [404] * 5 and codes[5:] == [429, 429]
    assert "retry-after" in api.get("/u/x").headers


def test_ratelimit_auth_failures_lock_ip(svc):
    """ניחוש טוקן: אחרי N כשלים מאותו IP — גם טוקן נכון נחסם זמנית (429)."""
    rl = RateLimiter(rules={"auth_fail": Rule(3, 300)})
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=rl))
    for _ in range(3):
        assert api.get("/audit", headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert api.get("/audit", headers=AUTH).status_code == 429
    assert api.get("/health").status_code == 200  # בריאות לא נחסמת


def test_ratelimit_gi_webhook_global(svc):
    svc_s = svc.s.__class__(**{**svc.s.__dict__, "gi_webhook_key": "gk-0123456789abcdef"})
    svc.s = svc_s
    rl = RateLimiter(rules={"gi_webhook_global": Rule(2, 60)})
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=rl))
    codes = [api.post("/webhooks/greeninvoice?k=gk-0123456789abcdef", json={"id": "doc1"}
                      ).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_default_limits_do_not_break_normal_owner_use(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert all(api.get("/dashboard").status_code == 200 for _ in range(200))


# ======================= סודות עסק =======================
@pytest.fixture
def box():
    return SecretBox.from_spec(f"k1:{generate_key()}")


def test_business_secrets_encrypted_at_rest(tmp_path, box):
    p = tmp_path / "s.sqlite3"
    db = DB(str(p))
    bs = BusinessSecrets(db, box)
    bs.put(1, "gi_api_secret", "GI-SUPER-SECRET-123", at="t")
    assert bs.get(1, "gi_api_secret").reveal() == "GI-SUPER-SECRET-123"
    assert bs.fields(1) == ["gi_api_secret"]
    db.conn.commit()
    assert b"GI-SUPER-SECRET-123" not in p.read_bytes()
    # צופן של עסק 1 שהועתק לעסק 2 לא נפתח
    ct = db.one("SELECT ciphertext FROM business_secrets")[0]
    db.x("INSERT INTO business_secrets VALUES(2,'gi_api_secret',?, 't')", (ct,))
    with pytest.raises(SecretError):
        bs.get(2, "gi_api_secret")


def test_business_secrets_fail_closed():
    db = DB(":memory:")
    with pytest.raises(SecretError):
        BusinessSecrets(db, None)  # type: ignore[arg-type]
    with pytest.raises(SecretError):
        SecretBox.from_env({})
    bs = BusinessSecrets(db, SecretBox.from_spec(f"k1:{generate_key()}"))
    with pytest.raises(SecretError):
        bs.put(1, "random_field", "x", at="t")


def test_business_secrets_rotation():
    k1, k2 = generate_key(), generate_key()
    db = DB(":memory:")
    BusinessSecrets(db, SecretBox.from_spec(f"k1:{k1}")).put(1, "sms_token", "tok", at="t")
    bs2 = BusinessSecrets(db, SecretBox.from_spec(f"k2:{k2},k1:{k1}"))
    assert bs2.rotate_all(at="t2") == 1
    assert BusinessSecrets(db, SecretBox.from_spec(f"k2:{k2}")).get(1, "sms_token").reveal() \
        == "tok"


def test_only_business_secrets_module_writes_secret_table():
    for f in (ROOT / "app").rglob("*.py"):
        if f.name == "business_secrets.py":
            continue
        assert "business_secrets(" not in f.read_text(encoding="utf-8").replace(
            "from .business_secrets", ""), f.name


# ======================= נעילת תלויות =======================
def _locked(path):
    pins = {}
    for line in (ROOT / path).read_text().splitlines():
        m = re.match(r"^([A-Za-z0-9_.-]+)==([^\s;\\]+)", line)
        if m:
            pins[m.group(1).lower().replace("_", "-")] = m.group(2)
    return pins


def test_lockfiles_pin_every_direct_dependency_with_hashes():
    from packaging.requirements import Requirement
    proj = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]
    runtime = [Requirement(r) for r in proj["dependencies"]]
    dev = [Requirement(r) for r in proj["optional-dependencies"]["dev"]]
    for lock, reqs in (("requirements.lock", runtime), ("requirements-dev.lock", runtime + dev)):
        pins = _locked(lock)
        text = (ROOT / lock).read_text()
        assert text.count("--hash=sha256:") >= len(pins), lock
        for r in reqs:
            name = r.name.lower().replace("_", "-")
            assert name in pins, f"{lock}: {name} לא נעול — הריצו uv pip compile (team/qa.md)"
            assert r.specifier.contains(pins[name], prereleases=True), \
                f"{lock}: {name}=={pins[name]} לא עומד ב-{r.specifier}"


def test_runtime_lock_is_subset_of_dev_lock():
    rt, dv = _locked("requirements.lock"), _locked("requirements-dev.lock")
    for k, v in rt.items():
        assert dv.get(k) == v, f"{k}: {v} ≠ {dv.get(k)}"


def test_ci_installs_from_lock_with_hashes():
    wf = (ROOT.parent / ".github" / "workflows" / "collect-agent.yml").read_text()
    assert "--require-hashes -r requirements-dev.lock" in wf
    # כל התקנת פייתון ב-CI (כל ג'וב, כל נתיב) עוברת דרך הנעילה — לא '.[dev]' ולא '..[dev]'
    assert not re.search(r"pip install (-e )?'?\.{1,2}\[dev\]", wf), "התקנה לא נעולה ב-CI"
    editable = [ln for ln in wf.splitlines() if "pip install" in ln and " -e " in ln]
    assert editable and all("--no-deps" in ln for ln in editable), editable


# ======================= סריקות: סודות בלוגים / זיוף / סורקים =======================
def test_no_secrets_in_logs_during_full_flow(svc, caplog):
    """כל הזרימה (סנכרון, תכנון, אישור, שליחה, webhooks) עם לוגים ברמת DEBUG ⇒ אף סוד/טוקן
    לא מופיע בלוג."""
    secrets_ = {"owner": OWNER_TOKEN, "gi": "test-secret", "wh": svc.s.sms_webhook_key}
    stream = io.StringIO()
    h = logging.StreamHandler(stream)
    root = logging.getLogger()
    root.addHandler(h)
    root.setLevel(logging.DEBUG)
    try:
        api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
        api.post("/sync")
        for rid in api.post("/plan").json()["created"]:
            api.post(f"/reminders/{rid}/approve")
        api.post("/dispatch")
        api.post(f"/webhooks/sms/019?k={svc.s.sms_webhook_key}",
                 content="type=incoming_sms&phone=0501234567&message=x",
                 headers={"content-type": "application/x-www-form-urlencoded"})
    finally:
        root.removeHandler(h)
    log = stream.getvalue() + caplog.text
    for name, val in secrets_.items():
        if val:
            assert val not in log, f"{name} דלף ללוג"


@pytest.mark.parametrize("path", ["/webhooks/email", "/webhooks/greeninvoice",
                                  "/webhooks/sms/019"])
@pytest.mark.parametrize("k", [None, "", "wrong"])
def test_webhooks_reject_missing_or_wrong_key(svc, path, k):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    url = path + ("" if k is None else f"?k={k}")
    r = api.post(url, json={"sender": "c1@example.com", "text": "הסר", "id": "doc1"})
    assert r.status_code in (403, 422), (path, k, r.status_code)
    assert svc.db.one("SELECT COUNT(*) n FROM suppressions")["n"] == 0


def test_link_scanners_get_requests_change_nothing(svc):
    """Safe Links / תצוגה מקדימה / אנטי-וירוס פותחים כל קישור ב-GET. GET על /p/ ו-/u/ לא
    משנה מצב: לא מסיר, לא משהה, לא יוצר הסדר."""
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    api.post("/plan")
    inv = svc.db.one("SELECT * FROM invoices WHERE external_id='doc1'")
    code = svc._short_code(inv)
    tok = svc.new_unsub_token(inv["customer_id"])
    before = [dict(r) for r in svc.db.q("SELECT opted_out, paused_reason, disputed FROM customers")]
    for url in (f"/p/{code}", f"/p/{code}/pay", f"/u/{tok}", f"/p/{code}/stop",
                f"/p/{code}/paid", f"/p/{code}/plan", f"/pay/{code}", f"/api/pay/{code}",
                f"/pay/{code}/go", f"/api/pay/{code}/stop", f"/api/pay/{code}/paid"):
        api.get(url, follow_redirects=False)
        api.head(url)
    after = [dict(r) for r in svc.db.q("SELECT opted_out, paused_reason, disputed FROM customers")]
    assert before == after
    assert svc.db.one("SELECT COUNT(*) n FROM plans")["n"] == 0
    assert svc.db.one("SELECT COUNT(*) n FROM suppressions")["n"] == 0


def test_plan_draft_duplicate_regression_exists():
    """כפל טיוטת פריסה (1327d6d) — מוודאים שבדיקת הרגרסיה של חבר הצוות עדיין במאגר."""
    src = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "tests").glob("test_*.py"))
    assert "def test_plan_approval_via_plans_supersedes_parallel_draft" in src


# ======================= אימות QA להכרעות מאיר (מומשו ע"י backend c9e1605) =======================
def test_max_three_reminders_then_stop_and_notify_owner(svc, clock):
    from datetime import timedelta

    from app.policy import MAX_REMINDERS_PER_INVOICE
    assert MAX_REMINDERS_PER_INVOICE == 3  # הכרעת מאיר (היה 4)
    _ingest(svc, gi_doc(1, client_id="A"))
    sent_steps = []
    for _ in range(80):
        svc.plan()
        for r in svc.db.q("SELECT id, step FROM reminders WHERE status='pending_approval'"):
            try:
                svc.approve(r["id"])
            except ValueError:
                pass
        for s in svc.dispatch():
            sent_steps.append(s["reminder_id"])
        clock.now += timedelta(days=1)
    assert len(sent_steps) == 3, sent_steps
    assert svc.db.one("SELECT COUNT(*) n FROM reminders")["n"] == 3
    note = svc.db.q("SELECT * FROM messages WHERE intent='max_reminders'")
    assert len(note) == 1 and note[0]["needs_owner"] == 1  # התראה אחת, לא כל יום


@pytest.mark.parametrize("hhmm,dow,ok", [
    ("07:59", 6, False), ("08:00", 6, True), ("19:59", 3, True), ("20:00", 3, False),
    ("11:59", 4, True), ("12:00", 4, False),      # שישי: עד 12:00
    ("10:00", 5, False),                           # שבת
])
def test_send_window_0800_2000(hhmm, dow, ok):
    from datetime import datetime, timedelta

    from app.policy import TZ, Policy
    base = datetime(2026, 11, 8, tzinfo=TZ)  # ראשון; weekday()==6
    day = base + timedelta(days=(dow - 6) % 7)
    h, m = map(int, hhmm.split(":"))
    assert Policy().can_send_at(day.replace(hour=h, minute=m)) is ok


def test_holiday_blocked():
    from datetime import datetime

    from app.policy import TZ, Policy
    # יום כיפור תשפ"ז = 21.9.2026 (לוח מובנה)
    assert Policy().can_send_at(datetime(2026, 9, 21, 10, 0, tzinfo=TZ)) is False


def test_refresh_failure_blocks_send(svc):
    _ingest(svc, gi_doc(1, client_id="A"))
    rid = svc.plan()[0]
    svc.approve(rid)

    def boom(_doc_id):
        raise RuntimeError("GI down")
    svc.gi.get_document = boom
    assert svc.dispatch() == [] and svc.sender.sent == []
    r = svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (rid,))
    assert r["block_reason"] == "refresh_failed" and r["status"] != "sent_dry_run"


def test_no_automatic_approval_anywhere(svc, clock):
    from datetime import timedelta
    _ingest(svc, gi_doc(1, client_id="A"))
    for _ in range(40):
        svc.plan()
        clock.now += timedelta(days=1)
    st = {r["status"] for r in svc.db.q("SELECT status FROM reminders")}
    assert st <= {"pending_approval"}, st  # בלי אישור בעלים אין "approved"


def test_workflows_have_no_duplicate_keys():
    """באג (ac97abe): שני ג'ובים בשם `web` באותו workflow. PyYAML לוקח בשקט את האחרון,
    אבל GitHub דוחה מפתח כפול ⇒ ה-workflow כולו לא תקין ⇒ כל ריצה "failure" מיידי בלי
    אף ג'וב (סבבים 75–81). הבדיקה טוענת עם loader שנכשל על מפתח כפול."""
    import yaml

    class Strict(yaml.SafeLoader):
        pass

    def construct_mapping(loader, node, deep=False):
        keys = [loader.construct_object(k, deep=deep) for k, _ in node.value]
        dup = {k for k in keys if keys.count(k) > 1}
        assert not dup, f"מפתח כפול ב-YAML: {dup} (שורה {node.start_mark.line + 1})"
        return yaml.SafeLoader.construct_mapping(loader, node, deep)

    Strict.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, construct_mapping)
    for wf in (ROOT.parent / ".github" / "workflows").glob("*.yml"):
        yaml.load(wf.read_text(encoding="utf-8"), Loader=Strict)  # noqa: S506 — SafeLoader


@pytest.mark.parametrize("xml", [
    '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;">]>'
    '<sms><status>&b;</status></sms>',                                   # billion laughs
    '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>'
    '<sms><status>&e;</status></sms>',                                   # XXE
    "<sms><status>0</status>" + "<x/>" * 20_000 + "</sms>",              # ענק
])
def test_sms019_rejects_hostile_xml_response(xml):
    """תשובת ספק = קלט חיצוני. ElementTree בלי defusedxml ⇒ דוחים DOCTYPE/ENTITY וגודל."""
    import httpx

    from app.integrations.sms import Sms019
    adapter = Sms019.__new__(Sms019)
    with pytest.raises(ValueError):
        adapter.parse(httpx.Response(200, text=xml))
