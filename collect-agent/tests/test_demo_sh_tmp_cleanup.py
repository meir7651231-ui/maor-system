"""הפעלה 220 — ממצא מ-219: ב-demo.sh התיקיות הזמניות $BK/$WP/$EN (גיבוי, מחיקת עסק, הצפנה —
כוללות sqlite עם נתוני דמו) נמחקו רק במסלול ההצלחה (rm -rf אחרי כל בלוק). כשל באמצע ⇒ נשארו ב-/tmp.
התיקון: הן נמחקות גם ב-cleanup שב-trap EXIT. הבדיקה מריצה את ה-cleanup האמיתי (מחולץ מ-demo.sh)
בתהליך bash שנכשל באמצע (exit 1) ובודקת שלא נשאר כלום; ובנוסף מגן-מקור: כל `X="$(mktemp -d)"`
ב-demo.sh חייב להופיע ב-cleanup — תיקייה זמנית חדשה בלי ניקוי ⇒ נופלת.
"""
import re
import shutil
import subprocess  # nosec B404
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DEMO = (ROOT / "demo.sh").read_text(encoding="utf-8")
BASH = shutil.which("bash")


def _cleanup_fn() -> str:
    m = re.search(r"^cleanup\(\) \{\n(.*?)\n\}\n", DEMO, re.S | re.M)
    assert m, "לא נמצאה פונקציית cleanup מרובת-שורות ב-demo.sh"
    return m.group(0)


def test_every_mktemp_dir_is_removed_in_cleanup():
    dirs = re.findall(r'^\s*([A-Z_]+)="\$\(mktemp -d\)"', DEMO, re.M)
    assert {"BK", "WP", "EN"} <= set(dirs), dirs
    body = _cleanup_fn()
    missing = [d for d in dirs if not re.search(r'rm -rf[^\n]*"\$\{' + d + r':-\}"', body)]
    assert not missing, f"תיקיות זמניות שלא נמחקות בכשל: {missing}"


def test_cleanup_is_registered_on_exit():
    assert re.search(r"^trap cleanup EXIT$", DEMO, re.M)
    assert re.search(r"^trap 'exit 130' INT$", DEMO, re.M)
    assert re.search(r"^trap 'exit 143' TERM$", DEMO, re.M)


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_failure_midway_leaves_no_tmp_dirs(tmp_path):
    """מדמה את demo.sh: יוצר את שלוש התיקיות עם sqlite, נכשל לפני ה-rm -rf של מסלול ההצלחה."""
    script = (
        "set -euo pipefail\nPID=''; GI_PID=''; LOG=''; GI_LOG=''; DEMO_USER_SECRET_FILE=''\n"
        + _cleanup_fn()
        + "trap cleanup EXIT\n"
        'BK="$(mktemp -d)"; WP="$(mktemp -d)"; EN="$(mktemp -d)"\n'
        'for d in "$BK" "$WP" "$EN"; do echo "$d" >> "$OUT"; : > "$d/live.sqlite3"; done\n'
        "exit 1\n"
    )
    out = tmp_path / "dirs.txt"
    private = tmp_path / "tmp"
    private.mkdir()
    r = subprocess.run(  # noqa: S603  # nosec B603
        [BASH, "-c", script], env={"PATH": "/usr/bin:/bin", "TMPDIR": str(private), "OUT": str(out)},
        capture_output=True, text=True, timeout=30,
    )
    assert r.returncode == 1, r.stderr
    created = out.read_text().split()
    assert len(created) == 3
    assert not [p for p in created if Path(p).exists()], "תיקיות זמניות נשארו אחרי כשל"
    assert list(private.iterdir()) == [], list(private.iterdir())
