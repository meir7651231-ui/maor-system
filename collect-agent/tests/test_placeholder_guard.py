"""שומר placeholders מהיר ל-pre-commit (QA, הפעלה 228).

באג: דף «שאלות נפוצות» (552047d2) נכנס עם placeholder בלי שורה בטבלה ⇒ נתפס רק בריצת CI 725 (אדומה).
עכשיו `scripts/placeholder_guard.py` רץ ב-pre-commit על כל קומיט שנוגע ב-collect-agent/, גם תיעוד בלבד.
ותוך כדי נמצא: הכותרת ב׳ אמרה «16 קבצים» כשבטבלה 18 — גם זה נבדק עכשיו.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / "scripts" / "placeholder_guard.py"
HOOK = ROOT.parent / ".githooks" / "pre-commit"
PH = "[שם החברה המפעילה בע״מ — placeholder]"


def _run(root: Path) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, "-I", str(GUARD), str(root)],  # noqa: S603 — נתיבים קבועים מהבדיקה
                          capture_output=True, text=True, timeout=30)


def _fake(tmp: Path, rows: list[str], count: int | None = None) -> Path:
    (tmp / "app").mkdir()
    shutil.copy(ROOT / "app" / "legal.py", tmp / "app" / "legal.py")
    (tmp / "app" / "__init__.py").write_text("")
    (tmp / "legal").mkdir()
    n = len(rows) if count is None else count
    body = "\n".join(f"| `{r}` | x |" for r in rows)
    (tmp / "legal" / "OPERATOR-PLACEHOLDERS.md").write_text(
        f"# t\n## א. דינמי\n| `GET /u` | x |\n## ב. סטטי — לעדכן ידנית ({n} קבצים, נכון להיום)\n"
        f"| קובץ | איפה |\n|---|---|\n{body}\n", "utf-8")
    return tmp


def test_real_tree_is_clean():
    r = _run(ROOT)
    assert r.returncode == 0, r.stdout


def test_new_file_with_placeholder_not_in_table_fails(tmp_path):
    root = _fake(tmp_path, ["legal/TERMS.md"])
    (root / "legal" / "TERMS.md").write_text(PH, "utf-8")
    (root / "marketing" / "faq").mkdir(parents=True)
    (root / "marketing" / "faq" / "index.html").write_text(f"<footer>{PH}</footer>", "utf-8")
    r = _run(root)
    assert r.returncode == 1 and "marketing/faq/index.html" in r.stdout


def test_stale_row_fails(tmp_path):
    root = _fake(tmp_path, ["legal/TERMS.md", "legal/DPA.md"])
    (root / "legal" / "TERMS.md").write_text(PH, "utf-8")
    (root / "legal" / "DPA.md").write_text("עודכן — אין placeholder", "utf-8")
    r = _run(root)
    assert r.returncode == 1 and "legal/DPA.md" in r.stdout


def test_header_count_mismatch_fails(tmp_path):
    root = _fake(tmp_path, ["legal/TERMS.md"], count=16)
    (root / "legal" / "TERMS.md").write_text(PH, "utf-8")
    r = _run(root)
    assert r.returncode == 1 and "16" in r.stdout


def test_matching_fake_tree_passes(tmp_path):
    root = _fake(tmp_path, ["legal/TERMS.md"])
    (root / "legal" / "TERMS.md").write_text(PH, "utf-8")
    assert _run(root).returncode == 0


def test_hook_runs_guard_before_doc_only_exit():
    """מגן-מקור: השומר חייב לרוץ לפני היציאה של «ידע/תיעוד בלבד» (legal/*.md הוא בדיוק תיעוד)."""
    s = HOOK.read_text("utf-8")
    i = s.find("placeholder_guard.py")
    assert i != -1, "pre-commit לא מריץ את placeholder_guard"
    assert i < s.find("commit ידע/תיעוד בלבד"), "השומר רץ אחרי היציאה המקוצרת ⇒ קומיט .md יעקוף אותו"
    assert "^collect-agent/" in s[:i]
