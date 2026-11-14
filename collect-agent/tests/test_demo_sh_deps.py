"""הפעלה 191 — ./demo.sh נפל במכונה נקייה.

הבאג: `pip install -e '.[dev]'` עיוור. במכונה שבה `pip` שייך לפייתון אחר (pip=3.13, python3=3.11)
התלויות הותקנו במפרש הלא נכון, ה-mock והשרת לא עלו, וההדגמה נפלה ב-«Connection refused» בלי הסבר.
גם `python3 -m pip` לא הספיק: cryptography של debian חוסם שדרוג. התיקון: אם חסר משהו ⇒ `.venv` מקומי
שקודם ב-PATH, ובדיקת ייבוא אחרי ההתקנה עם הודעה ברורה.
"""
import re
from pathlib import Path

DEMO = (Path(__file__).resolve().parent.parent / "demo.sh").read_text(encoding="utf-8")
CODE = "\n".join(ln for ln in DEMO.splitlines() if not ln.lstrip().startswith("#"))


def test_no_bare_pip_install():
    # כל התקנה דרך המפרש שמריץ את ההדגמה
    bare = [ln for ln in CODE.splitlines() if re.search(r"(^|[;|&(]|(?<!-m)\s)pip3? install", ln)]
    assert not bare, bare


def test_venv_fallback_before_first_python_use():
    i_venv = CODE.index('"$PY" -m venv .venv')  # 194: המפרש שנבחר (3.11+), לא python3 עיוור
    i_path = CODE.index('export PATH="$PWD/.venv/bin:$PATH"')
    i_mock = CODE.index("python3 -m app.gi_mock")
    assert i_path < i_mock and i_venv < i_mock


def test_import_check_after_install_fails_loudly():
    tail = CODE[CODE.index("python3 -m pip install"):]
    m = re.search(r'python3 -c "\$DEPS".*\|\|\s*\{[^}]*exit 1', tail, re.S)
    assert m, "אחרי ההתקנה חייבת להיות בדיקת ייבוא שיוצאת עם שגיאה"


def test_deps_cover_runtime_dependencies():
    deps = re.search(r"DEPS='import ([^']+)'", CODE).group(1)
    mods = {d.strip() for d in deps.split(",")}
    assert {"fastapi", "httpx", "uvicorn", "cryptography", "pydantic"} <= mods, mods


def test_no_cyrillic_in_demo():
    assert not [c for c in DEMO if "Ѐ" <= c <= "ӿ"]
