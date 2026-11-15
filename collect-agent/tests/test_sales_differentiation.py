"""הבידול בחומרי המכירות (גבי מחקר, team/market.md §1.6, 15.11.2026): SMS ושמירת שבת/חג **אינם** בידול.
ה«נודניק» של iCount שולח SMS ב-₪29 לחודש, ו-morning דוחה תזכורת שיוצאת בשבת או בחג. הבידול האמיתי:
(1) אישור פרטני של בעל העסק לכל הודעה · (2) תשובות הלקוח מגיעות לבעל העסק ומסווגות · (3) עצירה אחרי 3 תזכורות.

מגן: כל מענה להתנגדות «יש לי כבר את זה ב-morning / ב-iCount» (בתסריט, בטיוטות ובמסמך המכירות) מבוסס על
שלושת אלה, ולא מציג SMS או שבת כיתרון. וגם: חבילת המכירות אוסרת במפורש להציג SMS או שבת כבידול.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [ROOT / "sales/call-script.md", ROOT / "sales/outreach-drafts.md", ROOT / "team/sales.md",
         ROOT / "sales/PACKAGE.md", ROOT / "sales/demo-script.md"]
COMPETITOR_OBJECTION = re.compile(r"^\| \"[^|]*(morning|iCount|נודניק)[^|]*\" \|", re.I)


def _objection_rows():
    rows = []
    for p in FILES:
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            if COMPETITOR_OBJECTION.match(line):
                rows.append((f"{p.relative_to(ROOT)}:{n}", line.split("|")[2], line.split("|")[1]))
    return rows


def test_both_competitor_objections_are_answered():
    rows = _objection_rows()
    script = [a for where, a, _ in rows if where.startswith("sales/call-script.md")]
    text = " ".join(q for *_, q in rows)
    assert len(script) >= 2, "בתסריט חסר מענה ל-morning או ל-iCount"
    assert "morning" in text and "iCount" in text


def test_answers_use_real_differentiators_not_sms_or_shabbat():
    bad = []
    for where, answer, _ in _objection_rows():
        if re.search(r"SMS|שבת|חג", answer):
            bad.append(f"{where}: מציג SMS/שבת כיתרון")
        if not ("אישור" in answer or "מאשר" in answer):
            bad.append(f"{where}: חסר «אישור לכל הודעה»")
        if "תשוב" not in answer and "עונה" not in answer:
            bad.append(f"{where}: חסר «תשובות הלקוח מגיעות אליך»")
        if "3" not in answer:
            bad.append(f"{where}: חסר «עוצר אחרי 3»")
    assert not bad, bad


def test_package_forbids_sms_and_shabbat_as_differentiators():
    pkg = (ROOT / "sales/PACKAGE.md").read_text(encoding="utf-8")
    forbidden = pkg.split("מה **אסור** לטעון")[1].split("\n## ")[0]
    assert "SMS" in forbidden and "שבת" in forbidden and "בידול" in forbidden
    assert "market.md" in pkg, "חסרה הפניה לממצא המחקר"
