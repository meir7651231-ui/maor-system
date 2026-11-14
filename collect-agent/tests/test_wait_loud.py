"""הפעלה 197 — «פקודה חסרה/שרת שלא עלה ⇒ ממשיך בשקט» («הבא» 2 מ-195).

לולאות ההמתנה לשרת היו `curl … && break` (demo.sh, smoke_server.sh) ו-`if ((await fetch…).ok) break`
(5 סוויטות web/e2e). בלי curl (exit 127), או כשהשרת קרס בעלייה, הלולאה נגמרה בשקט והריצה נפלה אחר כך
בשגיאה לא קשורה («Connection refused», «fetch failed», timeout של playwright), בלי הלוג של השרת.
עכשיו: curl נבדק מראש ב-demo.sh; תהליך שמת ⇒ עצירה מיידית עם הלוג; לא עלה בזמן ⇒ הודעה ברורה ו-exit 1.
"""
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DEMO = ROOT / "demo.sh"
SMOKE = ROOT / "scripts" / "smoke_server.sh"
E2E = ROOT / "web" / "e2e"
BASH = shutil.which("bash")
NODE = shutil.which("node")

SILENT_SH = re.compile(r"for\s+_?\w*\s+in\s+\$\(seq[^;]*\);\s*do\s+curl[^;]*&&\s*break")
SILENT_JS = re.compile(r"\.ok\)\s*break;\s*\}\s*catch")


def _code(src):
    return "\n".join(ln for ln in src.splitlines() if not ln.lstrip().startswith("#"))


def test_no_silent_curl_wait_loops_in_shell_scripts():
    for f in [DEMO, *sorted((ROOT / "scripts").glob("*.sh"))]:
        assert not SILENT_SH.search(_code(f.read_text(encoding="utf-8"))), f.name


def test_demo_checks_curl_and_uses_wait_up_with_liveness():
    src = DEMO.read_text(encoding="utf-8")
    assert src.index("command -v curl") < src.index("wait_up \"http")
    assert src.count('wait_up "http') == 2
    body = src[src.index("wait_up() {"):src.index("\n}\n", src.index("wait_up() {"))]
    assert 'kill -0 "$2"' in body and "exit 1" in body and "-m 2" in body


def test_smoke_wait_fails_loud():
    src = _code(SMOKE.read_text(encoding="utf-8"))
    assert 'kill -0 "$PID"' in src and '[ -n "$UP" ] ||' in src


def test_every_e2e_server_suite_waits_loudly():
    spawners = [f for f in E2E.glob("*.mjs") if "app.main:_lazy_app" in f.read_text(encoding="utf-8")]
    assert len(spawners) >= 6, spawners
    for f in spawners:
        s = f.read_text(encoding="utf-8")
        assert not SILENT_JS.search(s), f.name
        assert "waitHealthy(" in s or "throw new Error('לא עלה" in s, f.name


def _run_node(js):
    return subprocess.run([NODE, "--input-type=module", "-e", js], cwd=E2E, capture_output=True,  # noqa: S603
                          text=True, timeout=30)


@pytest.mark.skipif(not NODE, reason="node לא מותקן")
def test_wait_healthy_throws_when_server_exits():
    t0 = time.monotonic()
    r = _run_node("""
      import { spawn } from 'node:child_process'; import { waitHealthy } from './lib.mjs';
      const srv = spawn(process.execPath, ['-e', 'process.exit(3)']);
      try { await waitHealthy('http://127.0.0.1:9', srv); console.log('PASSED'); }
      catch (e) { console.log('ERR ' + e.message); }""")
    assert "ERR" in r.stdout and "קוד 3" in r.stdout, r.stdout + r.stderr
    assert time.monotonic() - t0 < 10   # מיידי, לא אחרי 20 שניות


@pytest.mark.skipif(not NODE, reason="node לא מותקן")
def test_wait_healthy_throws_on_spawn_error_and_timeout():
    r = _run_node("""
      import { spawn } from 'node:child_process'; import { waitHealthy } from './lib.mjs';
      const a = spawn('no-such-binary-gabi-197');
      try { await waitHealthy('http://127.0.0.1:9', a); console.log('PASSED-A'); }
      catch (e) { console.log('A ' + e.message); }
      try { await waitHealthy('http://127.0.0.1:9', null, { tries: 3, ms: 10 }); console.log('PASSED-B'); }
      catch (e) { console.log('B ' + e.message); }""")
    assert "A " in r.stdout and "לא הופעל" in r.stdout, r.stdout + r.stderr
    assert "B " in r.stdout and "לא עלה" in r.stdout and "PASSED" not in r.stdout, r.stdout


def _python_with_deps():
    try:
        subprocess.run([sys.executable, "-c", "import fastapi, httpx, uvicorn, cryptography, pydantic"],
                       check=True, capture_output=True)
    except subprocess.CalledProcessError:
        return None
    return sys.executable


@pytest.mark.skipif(not BASH or not _python_with_deps(), reason="צריך bash ופייתון עם התלויות")
def test_demo_without_curl_fails_with_clear_message(tmp_path):
    # PATH מלאכותי: כל /usr/bin ו-/bin חוץ מ-curl, ו-python3 = המפרש הנוכחי (עם התלויות)
    b = tmp_path / "bin"
    b.mkdir()
    for d in ("/usr/bin", "/bin"):
        for p in Path(d).iterdir():
            if p.name != "curl" and not (b / p.name).exists():
                (b / p.name).symlink_to(p)
    for n in ("python3", "python"):
        (b / n).unlink(missing_ok=True)
        (b / n).symlink_to(sys.executable)
    env = {**os.environ, "PATH": str(b), "SKIP_WEB": "1", "PORT": "8971"}
    r = subprocess.run([BASH, str(DEMO), "--check"], cwd=ROOT, env=env, capture_output=True,  # noqa: S603
                       text=True, timeout=60)
    assert r.returncode == 1 and "חסר curl" in r.stderr, (r.returncode, r.stderr[-800:])


@pytest.mark.skipif(not BASH or not shutil.which("curl") or not _python_with_deps(),
                    reason="צריך bash, curl ופייתון עם התלויות")
def test_demo_server_crash_at_boot_fails_fast_with_log():
    # הפורט תפוס (שרת יתום / תוכנה אחרת) ⇒ uvicorn יוצא מיד. קודם: 15 שניות המתנה ואז שגיאה בלי הלוג.
    hold = socket.socket()
    hold.bind(("127.0.0.1", 0))
    hold.listen(1)
    port = hold.getsockname()[1]
    env = {**os.environ, "SKIP_WEB": "1", "PORT": str(port), "GI_PORT": str(port + 7),
           "PATH": os.path.dirname(sys.executable) + os.pathsep + os.environ.get("PATH", "")}
    t0 = time.monotonic()
    try:
        r = subprocess.run([BASH, str(DEMO), "--check"], cwd=ROOT, env=env, capture_output=True,  # noqa: S603
                           text=True, timeout=90)
    finally:
        hold.close()
    assert r.returncode == 1, (r.returncode, r.stdout[-500:], r.stderr[-800:])
    assert "שרת גבי יצא לפני שעלה" in r.stderr, r.stderr[-800:]
    log = r.stderr.lower()
    assert "already in use" in log or "address" in log, r.stderr[-800:]  # הלוג של השרת מוצג
    assert time.monotonic() - t0 < 30
