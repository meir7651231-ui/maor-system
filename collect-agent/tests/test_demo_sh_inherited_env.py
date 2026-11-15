"""critic סבב 86 · 🔴 83cc919f הוסיף ל-cleanup של demo.sh `rm -rf "${BK:-}" "${WP:-}" "${EN:-}"`, אבל ה-trap נרשם
(שורה ~86) הרבה לפני ש-BK/WP/EN מוקצים (~227). משתנה בשם הזה שירש מהסביבה (BK=~/backups אצל מפתח/בעל עסק)
⇒ כל כשל באמצע, **או Ctrl+C במצב האינטראקטיבי הרגיל** (`./demo.sh`), מוחק את התיקייה שלו. אותו דבר (קיים מקודם)
ל-LOG (rm -f), ל-PID (kill) ול-DEMO_USER_SECRET_FILE (קובץ סוד של המשתמש נמחק).
הבדיקה מריצה את demo.sh האמיתי: פורט ה-mock תפוס ⇒ ה-mock מת ⇒ wait_up יוצא 1 ⇒ ה-trap רץ."""
import os
import shutil
import socket
import subprocess  # nosec B404
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
BASH, CURL = shutil.which("bash"), shutil.which("curl")


@pytest.mark.skipif(not BASH or not CURL, reason="צריך bash ו-curl")
def test_inherited_vars_are_not_deleted_on_early_failure(tmp_path):
    keep_dir = tmp_path / "my-backups"
    keep_dir.mkdir()
    (keep_dir / "precious.txt").write_text("x")
    keep_log, keep_secret = tmp_path / "my.log", tmp_path / "my-secret"
    keep_log.write_text("x")
    keep_secret.write_text("x")
    tmp = tmp_path / "tmp"
    tmp.mkdir()
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    s.listen(1)
    gi_port = s.getsockname()[1]
    try:
        env = {**os.environ, "SKIP_WEB": "1", "TMPDIR": str(tmp), "PORT": str(gi_port - 1 if gi_port > 1025 else 18765),
               "GI_PORT": str(gi_port), "BK": str(keep_dir), "WP": str(keep_dir), "EN": str(keep_dir),
               "LOG": str(keep_log), "DEMO_USER_SECRET_FILE": str(keep_secret)}
        r = subprocess.run([BASH, str(ROOT / "demo.sh"), "--check"], env=env, cwd=ROOT,  # noqa: S603  # nosec B603
                           capture_output=True, text=True, timeout=120)
    finally:
        s.close()
    assert r.returncode != 0, "ציפיתי לכשל מוקדם (פורט ה-mock תפוס)"
    assert (keep_dir / "precious.txt").exists(), "cleanup מחק תיקייה שירשה מהסביבה (BK/WP/EN)"
    assert keep_log.exists(), "cleanup מחק קובץ LOG שירש מהסביבה"
    assert keep_secret.exists(), "cleanup מחק קובץ DEMO_USER_SECRET_FILE של המשתמש"
