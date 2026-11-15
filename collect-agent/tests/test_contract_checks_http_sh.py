"""מגן-מקור ל-scripts/contract_checks_http.sh (BACKLOG חיבורים #2): כל mktemp נמחק ב-cleanup,
ה-cleanup רשום ל-trap על EXIT/INT/TERM, ושני שרתי ה-mock נהרגים — גם בכשל."""
from __future__ import annotations

import re
from pathlib import Path

SRC = (Path(__file__).resolve().parents[1] / "scripts" / "contract_checks_http.sh").read_text("utf-8")


def _cleanup_body() -> str:
    m = re.search(r"^cleanup\(\) \{\n(.*?)^\}", SRC, flags=re.S | re.M)
    assert m, "אין פונקציית cleanup"
    return m.group(1)


def test_every_mktemp_is_removed_in_cleanup():
    temps = re.findall(r'^(\w+)="\$\(mktemp[^)]*\)"', SRC, flags=re.M)
    assert temps, "לא נמצאו mktemp (אם הוסרו — להסיר גם את המגן)"
    body = _cleanup_body()
    for v in temps:
        assert re.search(rf'rm -[rf]+ [^\n]*"\$\{{?{v}(:-)?\}}?"', body), f"{v} לא נמחק ב-cleanup"


def test_cleanup_trapped_on_exit_and_signals_and_kills_servers():
    # הפעלה 221: יושר עם tests/test_shell_tmp_cleanup.py (QA) — ה-trap נרשם *לפני* כל mktemp (קודם: הדרישה
    # הייתה הפוכה, «אין mktemp אחרי ה-trap», והשתיים סתרו זו את זו ⇒ הענף אדום). INT/TERM ⇒ יציאה עם קוד-אות.
    assert re.search(r"^trap cleanup EXIT$", SRC, flags=re.M)
    assert re.search(r"^trap 'exit 130' INT$", SRC, flags=re.M)
    assert re.search(r"^trap 'exit 143' TERM$", SRC, flags=re.M)
    assert SRC.index("trap cleanup") < SRC.index("python3 -m app.gi_mock")   # לפני שמרימים שרתים
    body = _cleanup_body()
    assert 'kill "$GI"' in body and 'kill "$SMS"' in body
    assert "$(mktemp" not in SRC.split("trap cleanup", 1)[0]                # אין mktemp לפני ה-trap
