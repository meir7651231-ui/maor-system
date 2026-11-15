"""החבילה לעו״ד (legal/dist/gabi-legal-package.html) = הטיוטות העדכניות, מסומנת טיוטה, ושלמה."""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("legal_bundle", ROOT / "scripts" / "legal_bundle.py")
lb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lb)


def test_committed_bundle_is_up_to_date():
    assert lb.OUT.read_text("utf-8") == lb.build(), "הרץ: python3 scripts/legal_bundle.py"


def test_bundle_contains_every_doc_and_all_questions():
    html = lb.build()
    assert html.count('<section id="d') == len(lb.ORDER)
    assert html.count(lb.DRAFT) >= len(lb.ORDER)          # כל מסמך מסומן טיוטה
    qs = (ROOT / "legal" / "LAWYER-QUESTIONS.md").read_text("utf-8")
    nums = [int(n) for n in re.findall(r"^(\d+)\. \*\*", qs, re.M)]
    assert nums == list(range(1, len(nums) + 1)) and len(nums) >= 34   # רצף בלי חורים
    for title in re.findall(r"^\d+\. \*\*(.+?)\*\*", qs, re.M):
        assert f"<b>{lb.escape(title, quote=False)}</b>" in html, title   # כל שאלה נכנסה
    assert "<script" not in html                                         # מסמך סטטי בלבד


def test_bundle_refuses_undrafted_doc(tmp_path, monkeypatch):
    for name in lb.ORDER:
        (tmp_path / name).write_text("# x\n" + lb.DRAFT, "utf-8")
    (tmp_path / "DPA.md").write_text("# x\nבלי סימון", "utf-8")
    monkeypatch.setattr(lb, "LEGAL", tmp_path)
    try:
        lb.build()
    except SystemExit as e:
        assert "DPA.md" in str(e)
    else:
        raise AssertionError("בנה חבילה עם מסמך שלא מסומן טיוטה")


def test_send_package_ready_for_signature_only():
    sp = (ROOT / "legal" / "SEND-PACKAGE.md").read_text("utf-8")
    assert lb.DRAFT in sp and "לא נשלח" in sp
    for must in ("שם משפטי", "ח״פ", "SIGNOFF.json", "gabi-legal-package.html", "8 שאלות"):
        assert must in sp, must
    for name in lb.ORDER:
        assert name in sp, name


def test_terms_cancellation_not_contradictory():
    """שאלה 34 / ביקורת סבב 68: «יסתיים בסוף החודש» לצד «ייעצר מיד» באותו סעיף."""
    terms = (ROOT / "legal" / "TERMS.md").read_text("utf-8")
    sec9 = re.search(r"^9\. \*\*ביטול\.\*\*.*$", terms, re.M).group(0)
    assert "מיד" in sec9 and "יסתיים בסוף" not in sec9
