"""תמליל סרטוני ההדגמה (נגישות): מחולל מהכתוביות ומכרטיס הסיום של גבי עיצוב — לא טקסט ידני.

נועל: כל כתובית (בכל פורמט) וכל שורה בכרטיס הסיום מופיעות בתמליל · התמליל מעודכן מול המקור · עותק זהה
מ-/app/video/ · הצהרת הנגישות והסטוריבורד מקשרים אליו (לקובץ שקיים) ולא מצהירים עוד ש«תמליל יתווסף».
"""
import html
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
V = ROOT / "marketing/video"
spec = importlib.util.spec_from_file_location("transcript", V / "transcript.py")
tr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tr)


def test_transcript_fresh_and_complete():
    assert tr.main(["--check"]) == 0
    t = html.unescape((V / "transcript.html").read_text(encoding="utf-8"))
    caps = tr.captions()
    assert set(caps) == {"h", "v"} and all(caps.values())
    for fmt, rows in caps.items():
        for _, _, text in rows:
            assert text in t, (fmt, text)
        for line in tr.endcard(fmt):
            assert line in t, (fmt, line)
    assert (V / "transcript.html").read_bytes() == (ROOT / "web/public/video/transcript.html").read_bytes()


def test_statement_and_storyboard_link_to_transcript():
    acc = (ROOT / "marketing/accessibility.html").read_text(encoding="utf-8")
    assert 'href="video/transcript.html"' in acc and "תמליל מלא יתווסף" not in acc
    assert (ROOT / "marketing" / "video/transcript.html").is_file()
    assert (ROOT / "web/public" / "video/transcript.html").is_file()          # אותו נתיב יחסי מ-/app/
    assert 'href="transcript.html"' in (V / "storyboard.html").read_text(encoding="utf-8")
