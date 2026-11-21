"""מנהל 363 — סימני קונפליקט שנשארו בקובץ ב-commit.

ב-773f2880 (מנהל 355) נכנסו ל-team/BACKLOG.md שורות «<<<<<<< Updated upstream» / «=======» / «>>>>>>> Stashed
changes» (stash pop עם קונפליקט שלא נפתר) ונשארו 8 הפעלות. במסמך זה רק לכלוך; בקוד/YAML/JSON זה שובר ריצה.
השומר סורק את כל הקבצים במעקב git תחת collect-agent/ (טקסט בלבד)."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_MARK = re.compile(r"^(<{7} |>{7} |={7}$)", re.M)
_TEXT = {".py", ".md", ".ts", ".tsx", ".mjs", ".js", ".json", ".jsonl", ".yml", ".yaml", ".toml", ".sh",
         ".html", ".css", ".txt", ".in", ".lock", ".csv"}


def _tracked() -> list[Path]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True).stdout  # noqa: S603,S607
    return [ROOT / p for p in out.decode().split("\0") if p and Path(p).suffix in _TEXT]


def test_no_conflict_markers_in_tracked_files():
    files = _tracked()
    assert len(files) > 100, len(files)   # בקרה: הסריקה באמת רואה את הריפו
    bad = []
    for f in files:
        try:
            text = f.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for m in _MARK.finditer(text):
            bad.append(f"{f.relative_to(ROOT)}:{text.count(chr(10), 0, m.start()) + 1}: {m.group(0)!r}")
    assert not bad, "סימני קונפליקט:\n" + "\n".join(bad[:20])


def test_pattern_catches_markers():
    assert _MARK.search("a\n<<<<<<< Updated upstream\nb\n=======\nc\n>>>>>>> Stashed changes\n")
    assert not _MARK.search("כותרת\n=====\n`a <<<<<< b`\n")
