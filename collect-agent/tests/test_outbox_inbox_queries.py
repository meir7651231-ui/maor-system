"""הפעלה 181 — מדידת `/outbox` ו-`/owner/inbox` («הבא» (2) מ-180), שתי הרשימות שנטענות בכל רענון של הדשבורד.

נמדד (`bench.build(..., sent=True, history=H)` דרך ה-API, קובץ גלוי):
| חשבוניות / היסטוריה | /outbox שאילתות · שורות · גודל · זמן | /owner/inbox שאילתות · שורות · זמן |
| 200 / 0             | 1 · 80 · 91KB · 26ms                  | 2 · 0 · 12ms                       |
| 2,000 / 20,000      | 1 · 800 · 905KB · 92ms                | 2 · 40 · 12ms                      |
| 5,000 / 200,000     | 1 · 2,000 · 2.2MB · 256ms             | 2 · 400 · 36ms                     |

- מספר השאילתות קבוע בשתיהן ⇒ אין מה לאחד.
- **אבל** `/outbox` מחזיר את כל יומן ה-dry-run (כולל ה-HTML של כל מייל) בכל רענון, והדשבורד מציג רק את 6
  האחרונות ⇒ `?limit=N` (1–500) מחזיר N האחרונות + `total`; ה-SPA מבקש 6. בלי limit ⇒ ביט-זהה לקודם
  (e2e/live, demo ובדיקות שסופרים את כל היומן).
- `/owner/inbox` מחזיר רק `needs_owner=1` (אינדקס חלקי מ-178) — אלה בדיוק הפריטים שהבעלים צריך לראות; לא מקצצים.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_bench_dashboard import _env

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import bench_dashboard as bench  # noqa: E402


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _pair(tmp_path, history=(0, 0)):
    small = bench.build(str(tmp_path / "s.sqlite3"), 20, _env(False), True, history[0])
    big = bench.build(str(tmp_path / "b.sqlite3"), 120, _env(False), True, history[1])
    return small, big


def _count(svc, path):
    api, res = _api(svc), {}
    q = bench.count_queries(svc, lambda: res.update(r=api.get(path)))
    assert res["r"].status_code == 200, res["r"].text
    return q, res["r"].json()


def test_outbox_and_inbox_query_count_constant(tmp_path):
    small, big = _pair(tmp_path, (0, 3000))
    try:
        for path in ("/outbox", "/outbox?limit=6", "/owner/inbox"):
            qs = [_count(svc, path)[0] for svc in (small, big)]
            assert qs[0] == qs[1] <= 2, (path, qs)
        # ההיסטוריה הגדולה באמת מייצרת פריטים לבעלים (אחד מ-500) — המדידה לא ריקה
        assert len(_count(big, "/owner/inbox")[1]) >= 6
    finally:
        small.db.conn.close()
        big.db.conn.close()


def test_outbox_limit_returns_tail_and_total(tmp_path):
    _, big = _pair(tmp_path)
    try:
        api = _api(big)
        full = api.get("/outbox").json()
        assert "total" not in full                       # בלי limit ⇒ הצורה הישנה, ביט-זהה
        n = len(full["messages"])
        assert n > 6
        lim = api.get("/outbox?limit=6").json()
        assert lim["total"] == n and lim["dry_run"] is True
        assert lim["messages"] == full["messages"][-6:]  # 6 האחרונות, באותו סדר כרונולוגי
        assert api.get(f"/outbox?limit={n + 100 if n + 100 <= 500 else 500}").json()["messages"] == \
            full["messages"][-500:]
        # הגודל לא גדל עם היומן
        assert len(api.get("/outbox?limit=6").content) * 5 < len(api.get("/outbox").content)
        for bad in ("0", "-1", "501", "x"):
            assert api.get(f"/outbox?limit={bad}").status_code in (400, 422), bad
    finally:
        big.db.conn.close()


def test_web_requests_only_what_dashboard_shows():
    root = Path(__file__).resolve().parents[1] / "web" / "src"
    api_ts = (root / "api.ts").read_text(encoding="utf-8")
    assert "/outbox?limit=${limit}" in api_ts and "outbox: (limit = 6)" in api_ts
    dash = (root / "pages" / "Dashboard.tsx").read_text(encoding="utf-8")
    assert ".slice(0, 6)" in dash   # אם הדשבורד יציג יותר — להגדיל את ברירת המחדל ב-api.ts בהתאם
