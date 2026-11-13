"""הפעלה 170 · `/ui` טען את `/dashboard` המלא, לא דחוס, בכל רענון.

על 5,000 חשבוניות: 2.46MB לכל רענון (והדף מרענן אחרי כל פעולה), ועוד 0.5MB של `/reminders?view=list`.
עכשיו: `/dashboard?view=list` מחזיר רק את השדות ש-`/ui` מציג (1.90MB), ושתי תצוגות `view=list` נדחסות ב-gzip
כשהדפדפן מקבל: 1.90MB ⇒ 86KB, 0.51MB ⇒ 49KB. `/dashboard` המלא (של `/app/`) לא השתנה (מהפעלה 173 גם הוא נדחס).
הבדיקה בדפדפן: `web/e2e/ui.mjs` (הכותרת `content-encoding: gzip` והבקשה עם `view=list`).
"""
from __future__ import annotations

import gzip
import json
import pathlib
import re

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

SRC = (pathlib.Path(__file__).parent.parent / "app" / "ui.html").read_text(encoding="utf-8")
INV = set(CollectService.DASH_LIST_INVOICE)
LAST = set(CollectService.DASH_LIST_LAST)


@pytest.fixture
def api(svc, fake_gi):
    # מספיק חשבוניות כדי שהתשובה תעבור את סף הדחיסה (GZIP_MIN), עם תזכורת מאוחדת וחשבונית סגורה
    fake_gi.docs += [gi_doc(i, phone=f"050-{1000000 + i}", name=f"לקוח {i}", client_id=f"cl{i % 8}")
                     for i in range(10, 34)]
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    c.post("/sync")
    assert c.post("/plan").json()["created"]
    return c


def test_list_has_only_ui_fields_with_same_values_as_full(api, fake_gi):
    rid = api.get("/reminders?view=list").json()[0]["id"]
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    fake_gi.docs[0]["amount"] = "1500.00"           # פער סכום בתזכורת מאושרת ⇒ amount_drift בשורה
    del fake_gi.docs[1]                              # חשבונית שנסגרה ⇒ status closed בטבלה
    api.post("/sync")
    full = api.get("/dashboard").json()
    lst = api.get("/dashboard?view=list").json()
    assert set(lst) == {"today", "trial", "totals", "invoices"}
    assert {k: full[k] for k in ("today", "trial", "totals")} == {k: lst[k] for k in ("today", "trial", "totals")}
    assert [x["invoice_id"] for x in lst["invoices"]] == [x["invoice_id"] for x in full["invoices"]]
    assert {x["status"] for x in lst["invoices"]} == {"open", "closed"}
    assert any(x["last_reminder"] and x["last_reminder"]["amount_drift"] for x in lst["invoices"])
    for f, x in zip(full["invoices"], lst["invoices"], strict=True):
        assert set(x) == INV and not {"email", "source"} & set(x)
        assert {k: v for k, v in x.items() if k != "last_reminder"} == {k: f[k] for k in INV - {"last_reminder"}}
        if f["last_reminder"] is None:
            assert x["last_reminder"] is None
        else:
            assert x["last_reminder"] == {k: f["last_reminder"][k] for k in LAST}


def test_full_dashboard_unchanged(api):
    """`/app/` (React) נשען על `/dashboard` המלא: series, send_window, email, source, invoice_ids נשארים.
    (הפעלה 173: גם הוא נדחס — `tests/test_app_gzip.py`.)"""
    r = api.get("/dashboard", headers={"Accept-Encoding": "gzip"})
    d = r.json()
    assert {"series", "send_window", "today", "trial", "totals", "invoices"} <= set(d)
    assert {"email", "source"} <= set(d["invoices"][0])


@pytest.mark.parametrize("path", ["/dashboard?view=list", "/reminders?view=list"])
def test_list_views_gzip_when_accepted(api, path):
    z = api.get(path, headers={"Accept-Encoding": "gzip, deflate, br"})
    plain = api.get(path, headers={"Accept-Encoding": "identity"})
    assert z.headers["content-encoding"] == "gzip" and "content-encoding" not in plain.headers
    assert "Accept-Encoding" in z.headers["vary"] and "Accept-Encoding" in plain.headers["vary"]
    assert z.headers["content-type"].startswith("application/json")
    assert z.json() == plain.json()                  # httpx פורס את ה-gzip; אותו תוכן בדיוק
    raw = plain.content
    assert json.loads(gzip.decompress(gzip.compress(raw))) == plain.json()
    assert int(z.headers["content-length"]) * 3 < len(raw), (z.headers["content-length"], len(raw))


@pytest.mark.parametrize("enc", ["gzip;q=0", "br", "", "identity"])
def test_no_gzip_when_refused(api, enc):
    r = api.get("/dashboard?view=list", headers={"Accept-Encoding": enc})
    assert "content-encoding" not in r.headers and r.json()["invoices"]


def test_status_filter_still_works_with_gzip(api):
    a = api.get("/reminders?status=pending_approval&view=list", headers={"Accept-Encoding": "gzip"}).json()
    assert a and all(r["status"] == "pending_approval" for r in a)


def test_list_view_is_smaller_than_full(api):
    full = len(json.dumps(api.get("/dashboard").json(), ensure_ascii=False))
    lst = len(json.dumps(api.get("/dashboard?view=list").json(), ensure_ascii=False))
    assert lst < full * 0.85, (lst, full)


def test_ui_requests_list_view_and_uses_only_its_fields():
    """מגן-מקור: הדף מבקש view=list, וכל שדה שהוא קורא משורת חובות / מהתזכורת האחרונה קיים בתצוגה המקוצרת.
    שדה חדש בטבלה ⇒ להוסיף אותו ל-DASH_LIST_INVOICE / DASH_LIST_LAST, אחרת הוא יגיע undefined."""
    assert 'api("/dashboard?view=list"' in SRC and 'api("/dashboard",' not in SRC
    draw = SRC[SRC.index("function drawDebts"):SRC.index('$("#dFind").addEventListener')]
    used = set(re.findall(r"\bx\.(\w+)", draw)) | set(re.findall(r"\bx\.(\w+)", SRC[SRC.index("const lastSent"):]
                                                                  .split("\n", 1)[0]))
    assert used and used <= INV, used - INV
    chip = SRC[SRC.index("const chipOf"):].split("\n", 1)[0]
    last_used = set(re.findall(r"\bL\.(\w+)", draw)) | set(re.findall(r"\br\.(\w+)", chip))
    assert last_used and last_used <= LAST, last_used - LAST
