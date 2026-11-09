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
