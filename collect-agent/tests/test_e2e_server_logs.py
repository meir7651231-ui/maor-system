"""הפעלה 156 · בדיקות הדפדפן שומרות את הפלט של השרתים שהן מרימות.

הבעיה: כל סקריפט ב-`web/e2e/` הרים את שרת גבי (ואת ה-mock) עם `stdio: 'ignore'`. כשבדיקה נפלה ב-CI
(ריצה 460 על `stale-banner`, והכשל החד-פעמי של `live.mjs` ב-154) נשמרו רק צילומים, ואי אפשר היה לדעת
מה השרת עשה באותו רגע. עכשיו: `srvStdio()` ב-`e2e/lib.mjs` כותב ל-`$E2E_LOG_DIR/<שם>.log`, וה-workflow
מכוון את המשתנה לתיקיית הצילומים שעולה כ-artifact בכישלון. מגן-מקור (ב-pytest אין דפדפן).
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent.parent
E2E = ROOT / "web" / "e2e"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "collect-agent.yml"


def test_python_servers_in_e2e_do_not_discard_output():
    for f in sorted(E2E.glob("*.mjs")):
        src = f.read_text(encoding="utf-8")
        for m in re.finditer(r"spawn\('python3'.*?\}\);", src, re.S):
            call = m.group(0)
            assert "stdio: 'ignore'" not in call, f"{f.name}: שרת עולה עם stdio:'ignore' — הפלט שלו אובד בכישלון"
            assert "stdio: srvStdio(" in call, f"{f.name}: שרת עולה בלי srvStdio"


def test_log_names_are_distinct():
    names = []
    for f in sorted(E2E.glob("*.mjs")):
        names += re.findall(r"srvStdio\(([`'][^)]+)\)", f.read_text(encoding="utf-8"))
    assert len(names) >= 5 and len(names) == len(set(names)), names


def test_helper_is_off_without_env_and_appends_with_it():
    lib = (E2E / "lib.mjs").read_text(encoding="utf-8")
    body = lib[lib.index("export function srvStdio(name)"):]
    body = body[: body.index("\n}\n")]
    assert "if (!dir) return 'ignore';" in body          # הרצה מקומית בלי המשתנה: כמו קודם
    assert "process.env.E2E_LOG_DIR" in body
    assert "'a'" in body                                  # append: הרצה חוזרת לא מוחקת את הלוג הקודם
    assert "return ['ignore', fd, fd];" in body           # stdout + stderr לאותו קובץ, stdin סגור


def test_workflow_points_log_dir_at_uploaded_artifact_dir():
    if not WORKFLOW.exists():       # התקנה מתוך collect-agent/ בלבד (בלי שורש הריפו)
        return
    wf = WORKFLOW.read_text(encoding="utf-8")
    web = wf[wf.index("\n  web:\n"): wf.index("\n  security:\n")]
    assert 'echo "E2E_LOG_DIR=$RUNNER_TEMP/shots" >> "$GITHUB_ENV"' in web
    # ריצה 479: ההקשר runner לא זמין ב-env ברמת הג'וב, וה-workflow כולו נפסל בלי להריץ אף ג'וב
    for m in re.finditer(r"\n    env:\n((?:      .*\n)+)", wf):
        assert "runner." not in m.group(1), "runner.* ב-env ברמת הג'וב פוסל את ה-workflow"
    assert "path: ${{ runner.temp }}/shots" in web
    assert 'tail -n 200 "$f"' in web                     # הלוג גם בפלט הג'וב עצמו, לא רק ב-artifact


def test_access_log_is_on_only_when_the_log_is_kept():
    # ברמת warning הקובץ מכיל רק את פלט העלייה; רצף הבקשות (מה שנדרש לאבחון) נכתב רק ב-info
    lib = (E2E / "lib.mjs").read_text(encoding="utf-8")
    assert "export const srvLogLevel = () => (process.env.E2E_LOG_DIR ? 'info' : 'warning');" in lib
    for f in sorted(E2E.glob("*.mjs")):
        src = f.read_text(encoding="utf-8")
        assert "'--log-level', 'warning'" not in src, f.name
        assert src.count("'uvicorn'") == src.count("'--log-level', srvLogLevel()"), f.name
