"""מנהל 322 · פתוח-לביקורת ממבקר 170: כשל רענון בגלל גבול 10,000 קבלות/זיכויים מוצג לבעל העסק בנוסח ייעודי.

לפני: page_cap נרשם כ-`refresh_failed` כמו תקלת רשת. ב-/ui הצ׳יפ הציג «מושהה עד שתבדקו» (כאילו התזכורת מחכה
לבעל העסק, אף שהיא מאושרת וחוזרת לניסיון לבד), וב-/app/ טבלת החשבוניות לא הציגה כלום — ובתצוגה המקדימה
«⛔ חסום: refresh_failed» (קוד גולמי). לקוח עם 10,000+ קבלות מאז תאריך החשבונית לא יקבל תזכורת עד שהחשבונית
תיסגר, ובעל העסק לא ידע למה.

אחרי: `refresh_page_cap` (סיבה נפרדת, אותה התנהגות: מאושרת, לא נשלחת, ננסה שוב) + תוויות בשני הממשקים.
"""
import re
from pathlib import Path

from app.greeninvoice import GreenInvoiceError, PageCapError
from app.service import REFRESH_PAGE_CAP, refresh_block_reason
from tests.test_mgr318_receipts_page_cap import _foreign
from tests.test_paid_never_reminded import _approve_all, _to_dana

ROOT = Path(__file__).resolve().parents[1]
UI = (ROOT / "app" / "ui.html").read_text(encoding="utf-8")
API_TS = (ROOT / "web" / "src" / "api.ts").read_text(encoding="utf-8")
MP = (ROOT / "web" / "src" / "components" / "MessagePreview.tsx").read_text(encoding="utf-8")


def _reasons(svc):
    return {r["block_reason"] for r in svc.db.q("SELECT block_reason FROM reminders WHERE status='approved'")}


def test_page_cap_is_its_own_reason_receipts(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_foreign(10_001))
    svc.dispatch()
    assert _to_dana(svc) == []
    assert REFRESH_PAGE_CAP in _reasons(svc)
    assert "refresh_failed" not in _reasons(svc)


def test_page_cap_is_its_own_reason_credits(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_foreign(10_001, typ=330))
    svc.dispatch()
    assert REFRESH_PAGE_CAP in _reasons(svc)


def test_page_cap_cleared_when_account_shrinks(svc, fake_gi):
    """התזכורת נשארת מאושרת עם הסיבה, וכשהחשבון קטן — יוצאת והסיבה מתאפסת."""
    svc.sync()
    _approve_all(svc, svc.plan())
    extra = _foreign(10_001)
    fake_gi.docs.extend(extra)
    svc.dispatch()
    for d in extra:
        fake_gi.docs.remove(d)
    svc.dispatch()
    assert _to_dana(svc) != []
    assert REFRESH_PAGE_CAP not in {r["block_reason"] for r in svc.db.q("SELECT block_reason FROM reminders")}


def test_network_failure_stays_refresh_failed(svc, fake_gi):
    """תקלה אחרת (לא page_cap) נשארת refresh_failed — לא מתויגת בטעות כ«יותר מדי קבלות»."""
    svc.sync()
    _approve_all(svc, svc.plan())

    def boom(*a, **kw):
        raise GreenInvoiceError("HTTP 503")
    svc.gi.get_document = boom
    svc.dispatch()
    assert _reasons(svc) == {"refresh_failed"}


def test_classifier():
    assert refresh_block_reason(PageCapError("page_cap: 201 pages")) == REFRESH_PAGE_CAP
    assert refresh_block_reason(GreenInvoiceError("page_cap: 201 pages")) == REFRESH_PAGE_CAP  # עטיפה/מטמון
    assert refresh_block_reason(GreenInvoiceError("HTTP 503")) == "refresh_failed"
    assert refresh_block_reason(RuntimeError("credits_unverifiable: x")) == "refresh_failed"
    assert issubclass(PageCapError, GreenInvoiceError)   # כל ה-except הקיימים עדיין תופסים


def test_cached_page_cap_keeps_class(gi_client, fake_gi):
    """בתוך receipt_batch הכשל השמור נזרק שוב כ-PageCapError (לא GreenInvoiceError כללי)."""
    import pytest
    fake_gi.docs.extend(_foreign(10_001))
    with gi_client.receipt_batch():
        with pytest.raises(PageCapError):
            gi_client.receipts_for("doc1")
        with pytest.raises(PageCapError):
            gi_client.receipts_for("doc1")


def _ui_block():
    m = re.search(r"const BLOCK=\{(.*?)\};", UI, re.S)
    assert m
    return m.group(1)


def test_ui_has_labels_not_generic_pause():
    b = _ui_block()
    assert re.search(r"refresh_failed:\"[^\"]*ננסה שוב", b)
    assert re.search(r"refresh_page_cap:\"[^\"]*10,000[^\"]*לבדוק ידנית", b)


def test_web_labels_match_ui():
    """אותו נוסח ב-/app/ וב-/ui (כמו DRIFT_LABEL)."""
    b = _ui_block()
    for key in ("refresh_failed", "refresh_page_cap"):
        web = re.search(rf"{key}: '([^']+)'", API_TS)
        ui = re.search(rf"{key}:\"([^\"]+)\"", b)
        assert web and ui and web.group(1) == ui.group(1), key


def test_web_wiring():
    assert "if (b in REFRESH_LABEL) return 'refresh';" in API_TS
    assert re.search(r"lr\?\.status === 'approved'.*REFRESH_LABEL\[lr\.block_reason\]", API_TS)
    assert 'data-testid="mp-refresh"' in MP
    # תזכורת שממתינה לרענון לא נשלחת/מאושרת שוב מהתצוגה המקדימה
    assert "blockKind(block) !== 'refresh'" in MP
