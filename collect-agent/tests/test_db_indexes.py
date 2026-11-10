"""critic סבב 36: plan() על 5,000 לקוחות לקח 7.3–8 שנ׳ — ~12 שאילתות פר-לקוח, וכל אחת **סורקת את כל**
טבלת החשבוניות/ההודעות (אין אינדקס על invoices.customer_id ועל messages.message_id) ⇒ ריבועי במספר
הלקוחות. בדיקה דטרמיניסטית (תוכנית שאילתה, לא תזמון): השאילתות החמות משתמשות באינדקס."""
from __future__ import annotations

import pytest

from app.db import DB

HOT = [
    "SELECT r.* FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE i.customer_id=? ORDER BY r.sent_at, r.id",
    "SELECT * FROM invoices WHERE customer_id=? AND status='open' ORDER BY due, id",
    "SELECT id FROM invoices WHERE customer_id=? AND status='open'",
    "SELECT 1 FROM messages WHERE intent=? AND message_id=?",
    "SELECT 1 FROM messages WHERE message_id=?",
]


@pytest.mark.parametrize("sql", HOT)
def test_hot_queries_use_index_not_full_scan(sql):
    d = DB(":memory:")
    plan = [r[3] for r in d.conn.execute("EXPLAIN QUERY PLAN " + sql, (1,) * sql.count("?"))]
    scans = [p for p in plan if p.startswith("SCAN ") and "USING" not in p]
    assert not scans, plan


def test_landing_select_touch_target_at_least_44px():
    """critic סבב 36: בעמוד הקישור מה-SMS (/p/) בורר מספר התשלומים היה בגובה 40px במובייל (iPhone 13),
    מתחת ל-44px (יעד מגע). שאר הכפתורים בעמוד ובעמוד /pay/ עומדים בזה (נמדד ב-Playwright)."""
    import re

    from app import main
    m = re.search(r"select\{\{([^}]*)\}\}", main._PAGE)
    assert m and re.search(r"min-height:\s*(4[4-9]|[5-9]\d)px", m.group(1)), m and m.group(1)


def test_pending_reminders_summary_view_is_small(svc, fake_gi):
    """critic סבב 37: הממשק טוען בכל רענון `/reminders?status=pending_approval` ומשתמש ב-4 שדות בלבד,
    אבל השרת החזיר את כל הגוף וה-payload (כולל HTML של המייל): על 5,000 לקוחות = **12MB** לכל רענון.
    עכשיו: `view=summary` ⇒ רק id/invoice_id/invoice_ids/block_reason/status, והממשק מבקש אותו."""
    from pathlib import Path

    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    svc.sync()
    svc.plan()
    full = c.get("/reminders?status=pending_approval").json()
    summ = c.get("/reminders?status=pending_approval&view=summary").json()
    assert len(full) == len(summ) > 0
    assert set(summ[0]) == {"id", "invoice_id", "invoice_ids", "block_reason", "status"}
    assert summ[0]["invoice_ids"] == full[0]["invoice_ids"]
    api = (Path(__file__).resolve().parent.parent / "web/src/api.ts").read_text(encoding="utf-8")
    assert "/reminders?status=pending_approval&view=summary" in api


def test_draft_footer_follows_theme_colors():
    """critic סבב 37: במצב כהה, כותרת «טיוטה – לבדיקת עו״ד» בעמוד /p/ הייתה בניגודיות 3.65 (מינימום 4.5),
    כי הצבע היה קבוע (#64748b) ולא משתנה העמוד. עכשיו: var(--muted) עם fallback לעמודים בלי משתנים."""
    from app import legal
    html = legal.draft_footer()
    assert "color:var(--muted" in html and "border:1px solid var(--line" in html


def _count_commits(svc, fn):
    commits = []
    svc.db.conn.set_trace_callback(lambda s: commits.append(s) if s.strip().upper().startswith("COMMIT") else None)
    try:
        fn()
    finally:
        svc.db.conn.set_trace_callback(None)
    return len(commits)


def test_sync_and_plan_commits_do_not_scale_with_customers(svc):
    """critic סבב 38: על DB בדיסק, סנכרון של 5,000 חשבוניות = 7.1 שנ׳ ו-plan() = 17.4 שנ׳ — commit (fsync)
    לכל שורה (~2 לחשבונית, ~4 לתזכורת), עם ה-DB נעול כל הזמן. וסנכרון שנפל באמצע השאיר חצי מהחשבוניות
    מעודכנות. עכשיו: ingest בטרנזקציה אחת; plan במנות. מספר ה-commits לא גדל לינארית עם הלקוחות."""
    from app.greeninvoice import map_document
    from tests.conftest import gi_doc
    docs = [map_document(gi_doc(i, phone=f"050-{i:07d}", client_id=f"c{i}")) for i in range(1, 301)]
    assert _count_commits(svc, lambda: svc.ingest(docs)) <= 5
    assert _count_commits(svc, svc.plan) <= 20


def test_ingest_is_atomic(svc, monkeypatch):
    """נפילה באמצע סנכרון ⇒ שום חשבונית לא עודכנה (לא «חצי סנכרון»)."""
    import pytest as _pytest

    from app.greeninvoice import map_document
    from tests.conftest import gi_doc
    docs = [map_document(gi_doc(i, phone=f"050-{i:07d}", client_id=f"c{i}")) for i in range(1, 6)]
    svc.ingest(docs)
    before = svc.db.q("SELECT external_id, amount_agorot FROM invoices ORDER BY id")
    docs2 = [map_document(gi_doc(i, amount="999.00", phone=f"050-{i:07d}", client_id=f"c{i}")) for i in range(1, 6)]
    n = {"c": 0}
    orig = svc._merge_csv_twin

    def boom(inv, source):
        n["c"] += 1
        if n["c"] == 4:
            raise RuntimeError("crash mid-sync")
        return orig(inv, source)
    monkeypatch.setattr(svc, "_merge_csv_twin", boom)
    with _pytest.raises(RuntimeError):
        svc.ingest(docs2)
    assert [tuple(r) for r in svc.db.q("SELECT external_id, amount_agorot FROM invoices ORDER BY id")] == \
        [tuple(r) for r in before]


def test_unsub_page_uses_shared_theme():
    """critic סבב 41 (פתוח מ-38): עמוד ההסרה (/u/) — מה שהחייב רואה מכל SMS — היה HTML בלי עיצוב:
    לבן גם במצב כהה, כפתור מערכת. עכשיו: אותה תבנית כמו /p/ (משתנים, מצב כהה, כפתור 48px)."""
    from app import main
    html = main._unsub_page("<p>x</p>").body.decode()
    assert "prefers-color-scheme:dark" in html and 'class="c"' in html
    import inspect
    assert 'class="b p"' in inspect.getsource(main.create_app)   # כפתור «כן, הסירו אותי» בעיצוב
