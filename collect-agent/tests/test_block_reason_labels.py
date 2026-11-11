"""critic סבב 51: כל block_reason שהשרת קובע חייב תווית בממשק (web/src/api.ts) ובסיווג הנכון.
באג שנמצא: csv_stale / csv_missing_from_import (_invalidate ⇒ חזרה ל-pending_approval, השרת מתיר
אישור מחדש) הוצגו «⛔ חסום: csv_stale» — קוד גולמי וכפתור אישור מושבת ⇒ תזכורת CSV תקועה לנצח
בממשק. compliance / no_reply_to (חסימות קשות) הוצגו כקוד גולמי בלי הסבר."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "app").glob("*.py"))
API = (ROOT / "web/src/api.ts").read_text(encoding="utf-8")


def _labels(name: str) -> set[str]:
    m = re.search(name + r": Record<string, string> = \{(.*?)\n\};", API, re.S)
    assert m, name
    return set(re.findall(r"\b([a-z_]+):\s*'", m.group(1)))


def _reapprove_reasons() -> set[str]:
    """סיבות שבהן התזכורת חוזרת ל-pending_approval והשרת מתיר אישור (לא HARD_BLOCKS)."""
    s = set(re.findall(r'_invalidate\(\w+, "([a-z_]+)"\)', SRC))
    s |= set(re.findall(r'why: str = "([a-z_]+)"', SRC))           # _rebuild_for_amount
    s |= set(re.findall(r'^AMOUNT_CHECK = "([a-z_]+)"', SRC, re.M))
    return s


def _hard_blocks() -> set[str]:
    m = re.search(r"^HARD_BLOCKS = \{([^}]*)\}", SRC, re.M)
    assert m
    return set(re.findall(r'"([a-z_]+)"', m.group(1)))


def test_reapprove_reasons_are_approvable_in_ui():
    rs = _reapprove_reasons()
    assert {"approval_expired", "csv_stale", "csv_missing_from_import", "amount_changed", "amount_check"} <= rs, rs
    missing = sorted(rs - _labels("REAPPROVE_LABEL"))
    assert not missing, f"השרת מתיר אישור מחדש, הממשק משבית ומציג קוד גולמי: {missing}"


def test_hard_blocks_have_a_label():
    hb = _hard_blocks()
    missing = sorted(hb - _labels("BLOCK_LABEL"))
    assert not missing, f"חסימה קשה בלי הסבר בממשק (קוד גולמי): {missing}"
    assert not hb & _labels("REAPPROVE_LABEL"), "חסימה קשה מסווגת כ-reapprove ⇒ הכפתור לא מושבת"
