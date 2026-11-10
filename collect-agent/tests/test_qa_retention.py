"""QA · אימות ר-6/ר-7/ר-10 של המשפטי (מעל המימוש שלו), בסגנון "קופסה שחורה":
זרימה מלאה עם כל סוגי הנתונים ⇒ סגירה ⇒ 91 יום ⇒ `iterdump()` לא מכיל שום שארית PII.
"""
from __future__ import annotations

import re
from datetime import timedelta

import pytest

from app.greeninvoice import map_document
from tests.conftest import gi_doc

NAME, PHONE, EMAIL = "דנה כהן", "050-1234567", "c1@example.com"
PII_PATTERNS = [NAME, "דנה", "1234567", "c1@example", "c1%40example",
                "972501234567", "0501234567"]


def _full_life(svc, clock):
    """חוב ⇒ תזכורת ⇒ תשובות (שאלה, הסדר) ⇒ טיוטות ⇒ סגירה. כולל שולח לא מוכר עם PII."""
    svc.ingest([map_document(gi_doc(1, client_id="A", phone=PHONE, name=NAME))])
    rid = svc.plan()[0]
    svc.approve(rid)
    svc.dispatch()
    svc.inbound("sms", PHONE, "איך אפשר לשלם? אני דנה כהן")
    svc.inbound("email", EMAIL, "אפשר לפרוס לשלושה תשלומים?")
    for d in svc.db.q("SELECT id FROM drafts WHERE status='pending_approval'"):
        try:
            svc.inbox.approve_draft(d["id"])
        except ValueError:
            pass
    svc.inbound("sms", "054-7777777", "מי אתם? אני רונית לוי, 054-7777777")  # שולח לא מוכר
    svc.ingest([])  # החשבונית נעלמה מ-GI ⇒ נסגרה


def _dump(svc):
    return "\n".join(svc.db.conn.iterdump())


def test_r10_no_pii_left_after_91_days(svc, clock):
    _full_life(svc, clock)
    clock.now += timedelta(days=91)
    svc.purge_closed()
    dump = _dump(svc)
    leaks = [p for p in PII_PATTERNS if p in dump]
    assert not leaks, f"שארית PII אחרי מחיקה: {leaks}"


def test_r10_unknown_sender_text_is_purged(svc, clock):
    """הודעה משולח לא מוכר (customer_id=NULL) מכילה PII של אדם שאינו לקוח בכלל."""
    _full_life(svc, clock)
    clock.now += timedelta(days=91)
    svc.purge_closed()
    assert "רונית" not in _dump(svc) and "7777777" not in _dump(svc)


def test_r10_not_purged_at_day_89(svc, clock):
    _full_life(svc, clock)
    clock.now += timedelta(days=89)
    svc.purge_closed()
    assert NAME in _dump(svc)


def test_r10_legal_hold_blocks_purge_and_release_restarts(svc, clock):
    _full_life(svc, clock)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='A'")["id"]
    with pytest.raises(ValueError):
        svc.set_legal_hold(cid, "קצר")  # בלי סיבה מתועדת
    svc.set_legal_hold(cid, "בקשת עו״ד — תיק 123/26")
    clock.now += timedelta(days=200)
    svc.purge_closed()
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (cid,))["name"] == NAME
    svc.set_legal_hold(cid, None)
    svc.purge_closed()
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (cid,))["name"] is None


def test_r10_suppression_survives_purge_and_still_blocks(svc, clock):
    _full_life(svc, clock)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='A'")["id"]
    svc._opt_out(cid, "reply")
    clock.now += timedelta(days=91)
    svc.purge_closed()
    assert svc.suppressed("sms", PHONE) and svc.suppressed("email", EMAIL)
    # הלקוח חוזר עם חוב חדש בכרטיס חדש ⇒ לא מקבל הודעה
    svc.ingest([map_document(gi_doc(9, client_id="A2", phone=PHONE, name=NAME,
                                    due=(clock.now.date() - timedelta(days=3)).isoformat()))])
    for r in svc.plan():
        try:
            svc.approve(r)
        except ValueError:
            pass
    before = len(svc.sender.sent)
    svc.dispatch()
    assert len(svc.sender.sent) == before


def test_r10_audit_has_no_free_text_pii(svc, clock):
    """audit לא נמחק (הוספה בלבד) ⇒ אסור שיכיל טקסט חופשי/PII. הערת השהיה/legal hold
    של בעל העסק יכולה להכיל שם וטלפון."""
    _full_life(svc, clock)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='A'")["id"]
    svc.set_hold(cid, "deceased", note="דנה כהן נפטרה, אחיה 050-1234567")
    svc.set_legal_hold(cid, "עו״ד של דנה כהן, תיק 77/26")
    audit = "\n".join(str(dict(r)) for r in svc.db.q("SELECT * FROM audit"))
    leaks = [p for p in PII_PATTERNS if p in audit]
    assert not leaks, f"PII ביומן audit (שלא נמחק לעולם): {leaks}"


def test_r6_hold_stops_everything(svc, clock):
    svc.ingest([map_document(gi_doc(1, client_id="A"))])
    cid = svc.db.one("SELECT id FROM customers")["id"]
    for reason in ("minor", "deceased", "insolvency"):
        svc.set_hold(cid, reason)
        assert svc.plan() == []
    with pytest.raises(ValueError):
        svc.set_hold(cid, "whatever")


def test_r7_invoice_older_than_3_years_manual_only(svc, clock):
    old = (clock.now.date() - timedelta(days=3 * 365 + 2)).isoformat()
    d = gi_doc(1, client_id="A", due=old)
    d["documentDate"] = old
    svc.ingest([map_document(d)])
    for _ in range(2):
        assert svc.plan() == []
    notes = svc.db.q("SELECT * FROM messages WHERE intent='manual_only_old'")
    assert len(notes) == 1  # התראה אחת לבעל העסק, לא כל יום


def test_purge_endpoint_requires_owner(svc):
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import OWNER_TOKEN
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for path in ("/maintenance/purge", "/customers/1/legal-hold", "/customers/1/hold"):
        assert api.post(path, json={}).status_code == 401


def test_link_tokens_of_purged_customer_removed(svc, clock):
    _full_life(svc, clock)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='A'")["id"]
    assert svc.db.one("SELECT COUNT(*) n FROM link_tokens WHERE customer_id=?", (cid,))["n"] > 0
    clock.now += timedelta(days=91)
    svc.purge_closed()
    assert svc.db.one("SELECT COUNT(*) n FROM link_tokens WHERE customer_id=?", (cid,))["n"] == 0


def test_pii_patterns_sanity(svc, clock):
    """הבדיקה עצמה תופסת דליפה (מבחן לבדיקה): לפני מחיקה ה-PII כן קיים בכל הצורות."""
    _full_life(svc, clock)
    dump = _dump(svc)
    assert NAME in dump and re.search(r"(0501234567|972501234567|050-1234567)", dump)


def _disk_svc(gi_client, clock, path, *, secure_delete=True):
    from app.config import load_settings
    from app.db import DB
    from app.service import CollectService
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                       "PUBLIC_BASE_URL": "https://gabi.example", "SMS_WEBHOOK_KEY": "whk-test",
                       "EMAIL_REPLY_TO": "owner@studio.example", "EMAIL_WEBHOOK_KEY": "ewk-test",
                       "REAL_DATA_ALLOWED": "1"})
    db = DB(str(path))
    if not secure_delete:   # DB שנוצר לפני התיקון (דפים פנויים «מלוכלכים»)
        db.conn.execute("PRAGMA secure_delete = OFF")
    return CollectService(s, db, gi=gi_client, clock=clock)


@pytest.mark.parametrize("secure_delete", [True, False])
def test_r10_no_pii_bytes_left_in_db_file_after_purge(gi_client, clock, tmp_path, secure_delete):
    """critic סבב 24: ה-dump (iterdump) נקי, אבל **הקובץ עצמו** החזיק אחרי 91 יום את השם, הטלפון,
    המייל וגם את הטקסט של שולח לא מוכר — בדפים/תאים ששוחררו ב-UPDATE. «נמחק» בלי שנמחק.
    עכשיו: secure_delete בכל חיבור + VACUUM אחרי מחיקה (גם ל-DB קיים עם דפים מלוכלכים)."""
    path = tmp_path / "g.sqlite3"
    svc = _disk_svc(gi_client, clock, path, secure_delete=secure_delete)
    _full_life(svc, clock)
    clock.now += timedelta(days=91)
    svc.purge_closed()
    svc.db.conn.commit()
    raw = b"".join(f.read_bytes() for f in tmp_path.iterdir())
    leaks = [p for p in (NAME, "1234567", "c1@example", "רונית") if p.encode() in raw]
    assert not leaks, f"PII בבתים של קובץ ה-DB אחרי מחיקה: {leaks}"


def test_r10_short_link_dies_with_purge(svc, clock):
    """critic סבב 28: אחרי מחיקת 90 יום הקישור הקצר מה-SMS (/p/<code>) עדיין עבד — הציג את שם העסק
    ומספר החשבונית, ו«כבר שילמתי»/«הפסקה» יצרו רשומות חדשות על לקוח שהותמם. עכשיו: 404."""
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import OWNER_TOKEN
    _full_life(svc, clock)
    code = svc.db.one("SELECT short_code FROM invoices WHERE short_code IS NOT NULL")["short_code"]
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert c.get(f"/p/{code}").status_code == 200
    clock.now += timedelta(days=91)
    svc.purge_closed()
    n_msgs = svc.db.one("SELECT COUNT(*) n FROM messages")["n"]
    r = c.get(f"/p/{code}")
    assert r.status_code == 404 and "1001" not in r.text
    assert c.post(f"/p/{code}/paid").status_code == 404
    assert c.post(f"/p/{code}/stop").status_code == 404
    assert c.get(f"/p/{code}/pay").status_code == 404
    # סבב 29: גם המסלול השני של עמוד התשלום (web/) — דרך אותו `landing`
    assert c.get(f"/api/pay/{code}").status_code == 404
    assert c.post(f"/api/pay/{code}/paid", json={}).status_code == 404
    assert svc.db.one("SELECT COUNT(*) n FROM messages")["n"] == n_msgs


def test_r10_purge_is_atomic_and_single_commit(svc, clock, monkeypatch):
    """critic סבב 37: purge_closed ביצע commit אחרי כל כתיבה (~5 לחוב) ⇒ 2,500 חובות = 4.7 שנ׳ (10,000 = 18 שנ׳),
    בתוך plan() של ה-cron, ו**לא אטומי**: נפילה באמצע השאירה לקוח חצי-מותמם (הודעות נמחקו, שם/טלפון נשארו).
    עכשיו: טרנזקציה אחת (`DB.batch`) ⇒ נפילה ⇒ שום דבר לא השתנה."""
    _full_life(svc, clock)
    clock.now += timedelta(days=91)
    before = _dump(svc)
    calls = {"n": 0}
    orig = svc._table_exists

    def boom(name):                      # נופל באמצע: אחרי שהודעות הלקוח כבר רוקנו
        calls["n"] += 1
        if calls["n"] == 2:
            raise RuntimeError("crash mid-purge")
        return orig(name)
    monkeypatch.setattr(svc, "_table_exists", boom)
    with pytest.raises(RuntimeError):
        svc.purge_closed()
    assert _dump(svc) == before          # כלום לא השתנה (אין לקוח חצי-מותמם)
    monkeypatch.setattr(svc, "_table_exists", orig)
    commits = []
    svc.db.conn.set_trace_callback(lambda s: commits.append(s) if s.strip().upper().startswith("COMMIT") else None)
    svc.purge_closed()
    svc.db.conn.set_trace_callback(None)
    assert len(commits) <= 3, commits
    assert NAME not in _dump(svc)
