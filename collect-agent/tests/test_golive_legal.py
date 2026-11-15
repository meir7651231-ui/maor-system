"""שער המעבר לשליחה אמיתית: התנאים המשפטיים שאינם בקוד (DPA חתום, תשובות עו״ד) + תיק עו״ד.

⚖️ השער פתוח ≠ אישור משפטי. הוא רק דואג שאף תנאי לא יישכח ביום המעבר.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from app import golive
from app.config import load_settings

LEGAL = Path(__file__).resolve().parents[1] / "legal"
DRAFT = "טיוטה – לבדיקת עו״ד"
OK_OPERATOR = {"legal_name": "חברה בע״מ", "company_id": "51-000000-0", "address": "רחוב 1",
               "privacy_email": "privacy@co.il"}
FULL = {"lawyer_name": "עו״ד לדוגמה", "dpa_signed": True,
        "answered_questions": list(golive.REQUIRED_LAWYER_QUESTIONS)}


def _legal(blockers):
    return [b for b in blockers if b.startswith("משפטי")]


def test_gate_closed_today_lists_every_legal_gap():
    """היום: הקובץ האמיתי ריק ⇒ אין עו״ד, DPA לא חתום, 8 שאלות פתוחות, פרטי מפעיל placeholder."""
    b = _legal(golive.real_send_blockers(load_settings({})))
    text = " ".join(b)
    assert "placeholder" in text and "לא חתום" in text and "אין עו״ד" in text
    for q in golive.REQUIRED_LAWYER_QUESTIONS:
        assert re.search(rf"\b{q}\b", text), q


def test_full_signoff_and_real_operator_clear_only_legal_blockers():
    b = golive.real_send_blockers(load_settings({}), operator=OK_OPERATOR, signoff=FULL)
    assert _legal(b) == []
    assert any(x.startswith("קוד:") for x in b)       # השער עדיין סגור מסיבות לא-משפטיות


def test_each_missing_piece_blocks_alone():
    for broken in ({**FULL, "dpa_signed": "yes"},          # רק True מפורש
                   {**FULL, "lawyer_name": "  "},
                   {**FULL, "answered_questions": FULL["answered_questions"][:-1]}):
        assert _legal(golive.real_send_blockers(load_settings({}), operator=OK_OPERATOR,
                                                signoff=broken)), broken


def test_signoff_file_starts_empty_and_marked_draft():
    s = json.loads((LEGAL / "SIGNOFF.json").read_text("utf-8"))
    assert s["dpa_signed"] is False and s["answered_questions"] == [] and not s["lawyer_name"]
    assert DRAFT in s["_note"]


def test_lawyer_brief_complete():
    brief = (LEGAL / "LAWYER-BRIEF.md").read_text("utf-8")
    qs = (LEGAL / "LAWYER-QUESTIONS.md").read_text("utf-8")
    assert DRAFT in brief
    for q in golive.REQUIRED_LAWYER_QUESTIONS:
        assert re.search(rf"^\| {q} \|", brief, re.M), f"שאלה {q} חסרה בתיק"
        assert re.search(rf"^{q}\. \*\*", qs, re.M), f"שאלה {q} לא קיימת ב-LAWYER-QUESTIONS"
    for doc in ("TERMS.md", "PRIVACY.md", "DPA.md", "INCIDENT-RUNBOOK.md", "BETA-GATE.md"):
        assert doc in brief and (LEGAL / doc).is_file(), doc
        assert DRAFT in (LEGAL / doc).read_text("utf-8"), f"{doc} לא מסומן טיוטה"
