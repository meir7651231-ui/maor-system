"""בדיקת המקשר (scripts/team_watch.py): BACKLOG ⇒ שורות פתוחות, ומיפוי העובדים תקין."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("tw", ROOT / "scripts/team_watch.py")
tw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tw)


def test_open_rows_counts_only_unchecked_in_section():
    md = "## א\n- [ ] x\n- [x] y\n- 🧱 z\n## ב\n- [ ] q\n- [ ] r\n"
    assert tw.open_rows(md, "א") == 1 and tw.open_rows(md, "ב") == 2 and tw.open_rows(md, "ג") == 0


def test_every_worker_has_backlog_section_and_session():
    workers = json.loads((ROOT / "team/workers.json").read_text(encoding="utf-8"))["workers"]
    backlog = (ROOT / "team/BACKLOG.md").read_text(encoding="utf-8")
    assert len(workers) == 10
    for name, w in workers.items():
        assert f"## {name}\n" in backlog, name
        assert w["session"].startswith("session_") and isinstance(w["wall"], bool)
