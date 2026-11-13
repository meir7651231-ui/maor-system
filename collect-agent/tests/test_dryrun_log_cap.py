"""הפעלה 182 — יומן ה-dry-run (`DryRunSender.sent`) היה רשימה בזיכרון שגדלה בלי גבול לאורך חיי התהליך
(5,000 שליחות ≈ 2.2MB, כולל HTML של כל מייל), ו-`provider_ids` איתה. עכשיו `SentLog` בתקרה
(`DRYRUN_LOG_MAX`, הישנות נדחקות ראשונות), ו-`total`/`by_channel` הם מונים לכל חיי התהליך ⇒
`sent_sms`/`sent_email` בדשבורד ו-`total` של `/outbox?limit=` נשארים מדויקים גם אחרי התקרה.
מתחת לתקרה ⇒ ביט-זהה לרשימה (השוואה ל-[], חיתוך, len, `/outbox` בלי limit)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.channels import DRYRUN_LOG_MAX, Message, SentLog
from app.main import create_app
from app.service import _rebuild_keep_log, _sent_count, build_dry_sender
from tests.conftest import AUTH, OWNER_TOKEN


def _rec(i: int, ch: str = "sms") -> dict:
    return {"id": f"dryrun.{i}", "channel": ch, "to": "x", "body": str(i)}


def test_sentlog_behaves_like_list_below_cap():
    log = SentLog()
    assert log == [] and not log and log.total == 0
    for i in range(5):
        log.append(_rec(i, "sms" if i % 2 else "email"))
    assert log == [_rec(i, "sms" if i % 2 else "email") for i in range(5)]
    assert len(log) == 5 and log[-2:] == [_rec(3, "sms"), _rec(4, "email")] and log.total == 5
    assert log.by_channel == {"email": 3, "sms": 2}


def test_sentlog_cap_keeps_tail_and_lifetime_counts():
    log = SentLog(maxlen=10)
    for i in range(25):
        log.append(_rec(i, "email" if i % 5 == 0 else "sms"))
    assert len(log) == 10                                # מוטציה: בלי הקיצוץ ⇒ 25
    assert [r["id"] for r in log] == [f"dryrun.{i}" for i in range(15, 25)]   # הישנות נדחקו, הסדר נשמר
    assert log.total == 25                               # לא יורד עם הדחיקה
    assert log.by_channel == {"email": 5, "sms": 20}
    assert _sent_count(log, "sms") == 20 and _sent_count(log, "email") == 5
    assert _sent_count([_rec(1), _rec(2, "email")], "sms") == 1   # sender מותאם עם list ⇒ כמו קודם


def test_default_cap_and_list_coercion():
    assert DRYRUN_LOG_MAX == 1000
    from app.config import Settings
    snd = build_dry_sender(Settings())
    assert isinstance(snd.sent, SentLog) and snd.sent.maxlen == DRYRUN_LOG_MAX
    snd2 = type(snd)(sms=snd.sms, email=snd.email, sent=[_rec(1)])   # list ⇒ SentLog
    assert isinstance(snd2.sent, SentLog) and snd2.sent.total == 1


def test_sender_caps_log_and_provider_ids_and_rebuild_keeps_counts():
    from app.config import Settings
    snd = build_dry_sender(Settings(email_from="gabi@example.com"))
    snd.sent.maxlen = 4
    ids = [snd.send(Message("email", f"c{i}@example.com", f"שלום {i}", subject="s")) for i in range(9)]
    assert len(snd.sent) == 4 and snd.sent.total == 9 and snd.sent.by_channel == {"email": 9}
    assert [r["id"] for r in snd.sent] == ids[-4:]
    assert list(snd.provider_ids) == ids[-4:]            # מוטציה: בלי הקיצוץ ⇒ 9 מפתחות
    new = _rebuild_keep_log(snd, Settings(email_from="gabi@example.com"))
    assert new.sent is snd.sent and new.sent.total == 9  # שינוי הגדרות לא מאפס את המונים


def test_dashboard_and_outbox_counts_survive_cap(tmp_path):
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    import bench_dashboard as bench

    from tests.test_bench_dashboard import _env

    svc = bench.build(str(tmp_path / "c.sqlite3"), 40, _env(False), True, 0)
    try:
        full_n = svc.sender.sent.total
        assert full_n > 8 and len(svc.sender.sent) == full_n      # מתחת לתקרה: הכול שמור
        api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
        before = api.get("/dashboard").json()
        # מכווצים את היומן כאילו עברו אלפי שליחות — הספירות לא זזות
        svc.sender.sent.maxlen = 5
        svc.sender.sent.append(dict(svc.sender.sent[-1]))
        after = api.get("/dashboard").json()
        kpi_b, kpi_a = before["totals"], after["totals"]
        key_b = {k: v for k, v in kpi_b.items() if k.startswith("sent_")}
        key_a = {k: v for k, v in kpi_a.items() if k.startswith("sent_")}
        assert key_b and sum(key_a.values()) == sum(key_b.values()) + 1   # מוטציה: ספירה מהיומן ⇒ 6
        out = api.get("/outbox?limit=3").json()
        assert out["total"] == full_n + 1 and len(out["messages"]) == 3
        assert len(api.get("/outbox").json()["messages"]) == 5
    finally:
        svc.db.conn.close()
