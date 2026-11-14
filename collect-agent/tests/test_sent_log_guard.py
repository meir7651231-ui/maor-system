"""מגן-מקור (הפעלה 184): «מה נשלח מאז» ביומן ה-dry-run נקרא רק דרך sent_mark/sent_since.

הבאג שנסגר ב-183: `n = len(svc.sender.sent)` … `svc.sender.sent[n:]` — אחרי תקרת `SentLog`
(הפעלה 182) `len` נעצר ב-1,000 ולכן החיתוך מחזיר ריק או רשומות ישנות. המגן סורק (AST) את app/,
tests/ ו-scripts/ (כולל app/demo.py) ואוסר:
  (א) חיתוך עם גבול-תחתון לא-שלילי על `<...>.sent` או על כינוי שלו (`log = x.sender.sent`);
  (ב) לכידת `len(<...>.sent)` לתוך משתנה (נקודת ייחוס);
  (ג) `len(<...>.sent)` בתוך גבול של חיתוך.
מותר: `sent[-k:]` (הזנב, /outbox?limit) והשוואת ספירה (`assert len(...) == k`).
פטורים: `app/channels.py` (המימוש עצמו) ו-`tests/test_dryrun_log_cap.py` (בודק את הבאג במכוון)."""
from __future__ import annotations

import ast
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
EXEMPT = {"app/channels.py", "tests/test_dryrun_log_cap.py", "tests/test_sent_log_guard.py"}


def _is_sent(node: ast.AST, aliases: set[str]) -> bool:
    if isinstance(node, ast.Attribute) and node.attr == "sent":
        return True
    return isinstance(node, ast.Name) and node.id in aliases


def _is_len_sent(node: ast.AST, aliases: set[str]) -> bool:
    return (isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "len"
            and len(node.args) == 1 and _is_sent(node.args[0], aliases))


def _negative(node: ast.AST | None) -> bool:
    return (isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub)) or (
        isinstance(node, ast.Constant) and isinstance(node.value, int) and node.value < 0)


def violations(src: str) -> list[tuple[int, str]]:
    tree = ast.parse(src)
    out: list[tuple[int, str]] = []
    scopes = [tree] + [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
    for scope in scopes:
        aliases: set[str] = set()
        for n in ast.walk(scope):
            if isinstance(n, ast.Assign) and _is_sent(n.value, set()):
                aliases |= {t.id for t in n.targets if isinstance(t, ast.Name)}
        for n in ast.walk(scope):
            if isinstance(n, ast.Subscript) and isinstance(n.slice, ast.Slice) and _is_sent(n.value, aliases):
                lo, hi = n.slice.lower, n.slice.upper
                if lo is not None and not _negative(lo):
                    out.append((n.lineno, "חיתוך מאינדקס מוחלט: " + ast.unparse(n)))
                for b in (lo, hi):
                    if b is not None and any(_is_len_sent(x, aliases) for x in ast.walk(b)):
                        out.append((n.lineno, "len בגבול חיתוך: " + ast.unparse(n)))
            if isinstance(n, (ast.Assign, ast.AnnAssign, ast.AugAssign)) and n.value is not None \
                    and _is_len_sent(n.value, aliases):
                out.append((n.lineno, "לכידת len כנקודת ייחוס: " + ast.unparse(n)))
    return sorted(set(out))


def _files():
    for sub in ("app", "tests", "scripts"):
        yield from sorted((ROOT / sub).rglob("*.py"))


def test_no_absolute_sent_index_anywhere():
    bad = []
    for f in _files():
        rel = f.relative_to(ROOT).as_posix()
        if rel in EXEMPT:
            continue
        bad += [f"{rel}:{ln} {msg}" for ln, msg in violations(f.read_text(encoding="utf-8"))]
    assert not bad, "השתמשו ב-sent_mark/sent_since (app/channels.py):\n" + "\n".join(bad)


def test_guard_catches_the_183_pattern():
    src = "def t(svc):\n    n = len(svc.sender.sent)\n    go()\n    new = svc.sender.sent[n:]\n"
    msgs = [m for _, m in violations(src)]
    assert any("לכידת len" in m for m in msgs) and any("חיתוך מאינדקס" in m for m in msgs)


def test_guard_catches_alias_and_inline_len():
    src = ("def t(svc):\n    log = svc.sender.sent\n    k = 3\n    a = log[k:]\n"
           "    b = svc.sender.sent[len(svc.sender.sent) - 2:]\n    c: int = len(log)\n")
    lines = {ln for ln, _ in violations(src)}
    assert {4, 5, 6} <= lines


def test_guard_allows_tail_and_count_asserts():
    src = ("def t(svc, limit):\n    sent = svc.sender.sent\n    a = sent[-limit:]\n    b = sent[-2:]\n"
           "    assert len(svc.sender.sent) == 1\n    c = sent[:3]\n    d = sent[0]\n")
    assert violations(src) == []
