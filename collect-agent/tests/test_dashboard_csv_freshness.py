"""גבי עיצוב (משימת מקשר, b050cc8 · ממצא חיבורים §3): /dashboard מחזיר csv_freshness לעסק שעובד עם CSV — אותו חישוב
כמו סיכום הבוקר (morning._csv_freshness): ייבוא אחרון מעל 24 שעות ⇒ upload_needed ⇒ באנר «העלו קובץ CSV עדכני».
מקור אחר ⇒ None (אין באנר). גם ב-view=list (/ui)."""
from datetime import timedelta

import pytest

from tests.test_morning import CSV


@pytest.fixture
def csv_svc(svc):
    object.__setattr__(svc.s, "source_system", "csv")
    return svc


def test_non_csv_source_has_no_freshness(svc):
    assert svc.dashboard()["csv_freshness"] is None
    assert svc.dashboard("list")["csv_freshness"] is None


def test_fresh_import_no_banner(csv_svc):
    csv_svc.import_csv(CSV.encode())
    f = csv_svc.dashboard()["csv_freshness"]
    assert f == {"last_import": "2026-11-08", "upload_needed": False}


def test_older_than_24h_needs_upload_in_both_views(csv_svc, clock):
    csv_svc.import_csv(CSV.encode())
    clock.now += timedelta(hours=25)
    for view in (None, "list"):
        assert csv_svc.dashboard(view)["csv_freshness"] == {"last_import": "2026-11-08", "upload_needed": True}


def test_never_imported_needs_upload(csv_svc):
    assert csv_svc.dashboard()["csv_freshness"] == {"last_import": None, "upload_needed": True}
