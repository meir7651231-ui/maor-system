"""sales/beta-success.md (גבי מכירות): טבלת המדדים צמודה לקוד — כל מדד שמגיע «מהמערכת» הוא מפתח שקיים
בפלט של app/beta_metrics.beta_metrics. מדד שהוסר מהקוד או שגוי בשמו ⇒ נכשל. השאלון: בדיוק 10 שאלות,
המחיר המלא בשאלה על ההמשך, ונטישה מגיעה מהשאלון (אין במערכת מנוי)."""
from __future__ import annotations

import re
from pathlib import Path

from app.beta_metrics import beta_metrics
from app.db import DB

ROOT = Path(__file__).resolve().parent.parent
DOC = (ROOT / "sales/beta-success.md").read_text(encoding="utf-8")


def test_every_system_metric_exists_in_code():
    keys = set(beta_metrics(DB(":memory:")).keys())
    table = DOC.split("## 1.")[1].split("## 2.")[0]
    named = set(re.findall(r"`([a-z_]+)`", table))
    assert named, "לא נמצאו מדדים בטבלה"
    assert named <= keys, sorted(named - keys)


def test_questionnaire_has_exactly_ten_questions_and_full_price():
    q = DOC.split("## 2.")[1].split("## 3.")[0]
    nums = re.findall(r"^(\d+)\. ", q, re.M)
    assert nums == [str(i) for i in range(1, 11)], nums
    assert "₪1,190" in q and "כולל מע״מ ככל שחל" in q


def test_churn_is_from_questionnaire_and_no_promises():
    assert re.search(r"\*\*נטישה\*\* \| שאלון", DOC)
    assert "לא מובטחים" in DOC and "מתאם" in DOC
    assert "טיוטה – לבדיקת עו״ד" in DOC
