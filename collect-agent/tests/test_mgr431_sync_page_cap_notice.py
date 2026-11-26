"""מנהל 431 · חיבורים (430 «הבא 4»): כשל סנכרון על תקרת העמודים — גלוי וברור, לא רק בניטור.

אחרי 430 חשבון עם יותר מ-10,000 חשבוניות פתוחות מקבל sync_failed (נכון — לא סוגרים כלום), אבל:
1. בעל העסק לא ראה שום דבר בממשק (רק הניטור התפעולי ידע) — עכשיו כרטיס `sync_page_cap`, אחד פתוח בכל
   פעם, שיורד לבד בסנכרון הבא שמצליח.
2. POST /sync החזיר 503 עם הטקסט הגולמי «page_cap: more than 200 pages (types=…)» — עכשיו הסבר בעברית.
3. iCount/EZcount זורקים ProviderError שהטקסט שלו מתחיל בשם הספק («icount: page_cap: …») ⇒
   `refresh_block_reason` (startswith) לא זיהה אותם כ-page_cap. עכשיו `is_page_cap` משותף.
4. הניטור (morning.check) אמר «לבדוק את החיבור למקור» — אבל החיבור תקין; עכשיו אומר מה קרה.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import morning
from app.greeninvoice import PageCapError
from app.integrations.base import ProviderError
from app.main import create_app
from app.service import SYNC_PAGE_CAP_MSG, is_page_cap, refresh_block_reason
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc


def _over_cap(fake_gi):
    fake_gi.docs.extend(gi_doc(60_000 + i, amount="10.00", client_id=f"z{i}", phone="052-0000000", name="אחר")
                        for i in range(10_001))


def _cards(svc, open_only=True):
    return svc.db.q("SELECT * FROM messages WHERE intent='sync_page_cap' AND needs_owner>=?", (1 if open_only else 0,))


def test_is_page_cap_all_providers():
    assert is_page_cap(PageCapError("page_cap: more than 200 pages"))
    assert is_page_cap(ProviderError("icount", "page_cap: יותר מ-10,000"))
    assert is_page_cap(ProviderError("ezcount", "page_cap: יותר מ-10,000"))
    assert not is_page_cap(ProviderError("icount", "timeout"))
    assert not is_page_cap(RuntimeError("network down; page_cap: mentioned later"))
    # הבאג הצדדי: refresh של iCount שנתקע על תקרה סווג «refresh_failed» («לבדוק את החיבור») במקום page_cap
    assert refresh_block_reason(ProviderError("icount", "page_cap: x")) == "refresh_page_cap"


def test_sync_over_cap_opens_one_owner_card_without_pii(svc, fake_gi):
    svc.sync()
    _over_cap(fake_gi)
    for _ in range(3):
        with pytest.raises(PageCapError):
            svc.sync()
    cards = _cards(svc)
    assert len(cards) == 1, "כרטיס אחד פתוח — לא כרטיס לכל ניסיון"
    c = cards[0]
    assert c["customer_id"] is None and c["body"] == SYNC_PAGE_CAP_MSG
    assert "10,000" in c["body"] and "page_cap" not in c["body"]
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status!='open'")["n"] == 0


def test_card_resolves_on_next_successful_sync(svc, fake_gi):
    svc.sync()
    keep = list(fake_gi.docs)
    _over_cap(fake_gi)
    with pytest.raises(PageCapError):
        svc.sync()
    assert len(_cards(svc)) == 1
    fake_gi.docs[:] = keep
    svc.sync()
    assert _cards(svc) == [] and len(_cards(svc, open_only=False)) == 1
    # נכשל שוב אחר כך ⇒ כרטיס חדש נפתח (הקודם נסגר)
    _over_cap(fake_gi)
    with pytest.raises(PageCapError):
        svc.sync()
    assert len(_cards(svc)) == 1 and len(_cards(svc, open_only=False)) == 2


def test_post_sync_503_is_hebrew_and_card_in_inbox(svc, fake_gi):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    _over_cap(fake_gi)
    r = api.post("/sync")
    assert r.status_code == 503
    assert r.json()["detail"] == SYNC_PAGE_CAP_MSG and "page_cap" not in r.text
    inbox = api.get("/owner/inbox").json()
    rows = inbox if isinstance(inbox, list) else next(v for v in inbox.values() if isinstance(v, list))
    assert any(m["intent"] == "sync_page_cap" for m in rows)


def test_other_runtime_errors_keep_their_text(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    svc.gi = None
    r = api.post("/sync")
    assert r.status_code == 503 and "לא הוגדר חיבור" in r.json()["detail"]


def test_morning_monitor_names_page_cap(svc, fake_gi):
    svc.sync()
    _over_cap(fake_gi)
    out = morning.run_morning(svc)
    if out["status"] == "closed_day":
        pytest.skip("יום סגור בשעון הבדיקה")
    assert out["status"] == "sync_failed" and out["sync_reason"] == "page_cap"
    ok, msg = morning.check(svc.db, now=svc.clock())
    assert not ok and "10,000" in msg and "לבדוק את החיבור" not in msg


def test_morning_other_failure_keeps_generic_monitor_text(svc, fake_gi):
    def boom(*a, **kw):
        raise ProviderError("greeninvoice", "timeout")
    svc.sync()
    svc.gi.open_debts = boom
    out = morning.run_morning(svc)
    if out["status"] == "closed_day":
        pytest.skip("יום סגור בשעון הבדיקה")
    assert out["status"] == "sync_failed" and "sync_reason" not in out
    ok, msg = morning.check(svc.db, now=svc.clock())
    assert not ok and "לבדוק את החיבור למקור" in msg
    assert _cards(svc) == []
