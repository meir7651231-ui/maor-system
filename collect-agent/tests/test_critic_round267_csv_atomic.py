"""מבקר סבב 267 (שמירה, ללא ממצא): ייבוא CSV גדול שנכשל באמצע — אטומי.

`import_csv` עוטף ingest + סגירת ששולמו + פתרון כרטיסים + חותמת-טריות + audit ב-`db.batch()`. נבדק בהזרקת
כשל בארבע נקודות (שורה 3,000 מתוך 4,999, סגירת ששולמו, כרטיסי הסדרים, audit הסופי): המסד חוזר
ביט-זהה (invoices/customers/audit/messages/business_settings), וייבוא חוזר של אותו קובץ מצליח.
רכיב: app/service.py → import_csv.
"""
from __future__ import annotations

from dataclasses import replace

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _csv(start, n):
    return (H + "".join(f"{start + i},לקוח {start + i},050-{1000000 + start + i:07d},,1200,פתוח,01/10/26,15/10/26\n"
                        for i in range(n))).encode()


def _snap(svc):
    return {tb: [tuple(r) for r in svc.db.q(f"SELECT * FROM {tb} ORDER BY rowid")]  # noqa: S608 — שמות קבועים
            for tb in ("invoices", "customers", "audit", "messages", "business_settings")}


def _boom(*_a, **_k):
    raise RuntimeError("boom")


@pytest.mark.parametrize("where", ["row", "close", "plan_cards", "audit"])
def test_failed_large_import_rolls_back_completely(svc, monkeypatch, where):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_csv(1000, 50))
    before = _snap(svc)
    if where == "row":
        orig, calls = svc._merge_csv_twin, {"n": 0}

        def twin(inv, source):
            calls["n"] += 1
            if calls["n"] == 3000:
                raise RuntimeError("boom")
            return orig(inv, source)
        monkeypatch.setattr(svc, "_merge_csv_twin", twin)
    elif where == "close":
        monkeypatch.setattr(svc, "_csv_close_paid", _boom)
    elif where == "plan_cards":
        monkeypatch.setattr(svc, "_resolve_plan_cards", _boom)
    else:
        orig_a = svc.audit

        def audit(actor, ev, d=None):
            if ev == "csv_import":
                raise RuntimeError("boom")
            return orig_a(actor, ev, d)
        monkeypatch.setattr(svc, "audit", audit)
    with pytest.raises(RuntimeError):
        svc.import_csv(_csv(1000, 4999))
    assert _snap(svc) == before
    monkeypatch.undo()
    assert svc.import_csv(_csv(1000, 4999))["imported"] == 4999
