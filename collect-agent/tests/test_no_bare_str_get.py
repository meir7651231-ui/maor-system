"""הפעלת מנהל 109 · המשך 107/108: `str(x.get(k))` על JSON חיצוני הופך null למחרוזת "None".
107: לקוח GI בלי מזהה ⇒ מפתח משותף "None" ⇒ חוב של א' נשלח למייל של ב'. 108: רווחית
`rivhit:None:1:None` עקף את דילוג המסמכים בלי מזהה. התיקונים היו נקודתיים (`_s`, `_part`);
כאן העזר מאוחד (`integrations.base.jstr`) ונאכף סטטית: אסור `str(<...>.get(...))` חשוף במודולים
שממפים קלט חיצוני. `str(x.get(k) or "")` מותר (ה-`or` מנטרל null). נכשלה לפני ההפעלה על
`main.py` (audit של webhook GI) ו-`ezcount.py` (status)."""
from __future__ import annotations

import ast
from pathlib import Path

import pytest

from app.integrations.base import jstr

APP = Path(__file__).resolve().parent.parent / "app"
# מודולים שממפים JSON/CSV חיצוני. המוקים (`*_mock.py`) מדמים את הספק ולכן לא נכללים.
SCANNED = sorted(
    [p for p in (APP / "integrations").glob("*.py")]
    + [APP / n for n in ("greeninvoice.py", "main.py", "inbox.py", "csv_import.py",
                         "service.py", "orbit_connect.py", "paylinks.py")]
)


def _bare_str_get(tree: ast.AST) -> list[int]:
    out = []
    for n in ast.walk(tree):
        if (isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "str"
                and len(n.args) == 1 and isinstance(n.args[0], ast.Call)
                and isinstance(n.args[0].func, ast.Attribute) and n.args[0].func.attr == "get"):
            out.append(n.lineno)
    return out


@pytest.mark.parametrize("path", SCANNED, ids=lambda p: p.name)
def test_no_bare_str_of_dict_get(path: Path):
    hits = _bare_str_get(ast.parse(path.read_text(encoding="utf-8")))
    assert not hits, (f"{path.name}:{hits} — str(x.get(...)) הופך null ל-'None'; "
                      "השתמשו ב-jstr(x.get(...)) או str(x.get(...) or '')")


def test_scanner_catches_the_pattern():
    assert _bare_str_get(ast.parse("str(d.get('id'))")) == [1]
    assert _bare_str_get(ast.parse("str(d.get('id') or '')")) == []


@pytest.mark.parametrize("v,want", [(None, ""), ("", ""), (0, "0"), (12, "12"), (" a ", " a ")])
def test_jstr(v, want):
    assert jstr(v) == want


def test_jstr_strip():
    assert jstr(" a ", strip=True) == "a" and jstr(None, strip=True) == ""


def test_legacy_helpers_delegate():
    from app.greeninvoice import _s
    from app.integrations.rivhit import _part
    assert _s(None) == "" and _part(None) == "" and _part(" 5 ") == "5"


def test_ezcount_null_status_is_not_none_string():
    from app.integrations import ezcount
    src = (APP / "integrations" / "ezcount.py").read_text(encoding="utf-8")
    assert "str(d.get(\"status\", \"\"))" not in src
    assert hasattr(ezcount, "jstr")
