"""מנהל 281 · ביקורת: אותיות סופיות בכיוון ההפוך — מחוץ ל-`conversation.py`.

רקע (280): `conversation.detect` מנרמל את הטקסט לאותיות לא-סופיות; regex עם אות **סופית** שלא עובר `_c` מת שם בשקט.
הכיוון ההפוך: מודול שקורא טקסט **גולמי** (מייל, שם עסק, נושא, תבנית) ותבנית שכתובה באות **לא-סופית** בסוף מילה
(«אשלמ», «עורכ דינ», «יועצ») — לא תתאים לעולם לטקסט אמיתי («אשלם», «עורך דין», «יועץ»). כך נפל `_is_signature_line`.

סריקה (281) של כל `app/` מלבד conversation.py: אין מופע כזה. מותרים רק דפוסים שהטקסט שלהם מנורמל קודם
(`channels._SIG_TITLE/_SIG_MINE` אחרי `translate(_SIG_FINALS)`). הבדיקה כאן נכשלת על כל regex חדש שמפר זאת.

🔴 נמצא בדרך (בדיקות ההתנהגות כאן): חתימה «דן כהן | עו״ד» — בגרשיים **עבריים** (״, ברירת המחדל במקלדות
עבריות ובתיקון-אוטומטי של Word), או ״ חכם (”) — לא זוהתה (`_SIG_TITLE` הכיר רק `עו"ד` ב-ASCII) ⇒ «קיבלתי
תודה» סווג legal (השהיה + דחוף). אותו דפוס כמו 280: וריאנט כתיבה של אותה מילה שהתבנית לא מכירה.
"""
import ast
import pathlib
import re

import pytest

from app import channels, compliance, templates

APP = pathlib.Path(__file__).resolve().parents[1] / "app"
# תו לא-סופי שאחריו סוף מילה: לא אות עברית, לא מחלקה/כמת (אופציונלי = «דינ?» תואם את התחילית «די»)
_NONFIN_END = re.compile(r"[א-ת][כמנפצ](?![א-ת\[\]?*+{])")
# (קובץ, שם-משתנה) שהטקסט שלהם מנורמל לפני ההתאמה — כל תוספת כאן דורשת translate מוכח במקור
ALLOWED = {("channels.py", "_SIG_TITLE"), ("channels.py", "_SIG_MINE")}
RE_FUNCS = {"compile", "search", "match", "fullmatch", "sub", "subn", "findall", "finditer", "split"}


def _sval(n, consts):
    if isinstance(n, ast.Constant) and isinstance(n.value, str):
        return n.value
    if isinstance(n, ast.Name):
        return consts.get(n.id)
    if isinstance(n, ast.BinOp) and isinstance(n.op, ast.Add):
        a, b = _sval(n.left, consts), _sval(n.right, consts)
        return a + b if a is not None and b is not None else None
    if isinstance(n, ast.JoinedStr):
        return "".join(v.value for v in n.values if isinstance(v, ast.Constant))
    return None


def scan_source(src: str, fname: str) -> list[str]:
    tree = ast.parse(src)
    consts: dict[str, str] = {}
    owner: dict[int, str] = {}
    for st in tree.body:
        if isinstance(st, (ast.Assign, ast.AnnAssign)):
            targets = st.targets if isinstance(st, ast.Assign) else [st.target]
            names = [t.id for t in targets if isinstance(t, ast.Name)]
            v = _sval(st.value, consts) if st.value is not None else None
            for nm in names:
                if v is not None:
                    consts[nm] = v
                for sub in ast.walk(st):
                    owner[id(sub)] = nm
    bad = []
    for n in ast.walk(tree):
        if not (isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                and isinstance(n.func.value, ast.Name) and n.func.value.id == "re"
                and n.func.attr in RE_FUNCS and n.args):
            continue
        pat = _sval(n.args[0], consts)
        if not pat or not _NONFIN_END.search(pat):
            continue
        if (fname, owner.get(id(n), "")) in ALLOWED:
            continue
        bad.append(f"{fname}:{n.lineno} {_NONFIN_END.findall(pat)} {pat[:60]!r}")
    return bad


def test_no_nonfinal_word_end_in_raw_text_regex():
    bad = []
    for f in sorted(APP.rglob("*.py")):
        if f.name == "conversation.py":      # מכוסה ב-test_mgr280 (הכיוון ההפוך: _c)
            continue
        bad += scan_source(f.read_text(encoding="utf-8"), f.name)
    assert not bad, "regex על טקסט גולמי עם אות לא-סופית בסוף מילה (לא יתאים לטקסט אמיתי):\n" + "\n".join(bad)


@pytest.mark.parametrize("src", [
    "import re\nX = re.compile(r'(?:אשלמ|נתבע)')\n",
    "import re\nP = r'יועצ\\s+משפטי'\ndef f(t):\n    return re.search(P, t)\n",
    "import re\nX = re.compile(r'עורכ' + r'\\s+דינ\\b')\n",
])
def test_scanner_catches_mutations(src):
    assert scan_source(src, "x.py"), src


@pytest.mark.parametrize("src", [
    "import re\nX = re.compile(r'אשלם|עורך דין|[נן]')\n",
    "import re\nX = re.compile(r'דינ?|כתב(?:ה)?')\n",
])
def test_scanner_accepts_clean(src):
    assert not scan_source(src, "x.py"), src


def test_allowed_patterns_really_normalized_first():
    src = (APP / "channels.py").read_text(encoding="utf-8")
    body = src.split("def _is_signature_line", 1)[1].split("\ndef ", 1)[0]
    i_tr, i_title = body.index("translate(_SIG_FINALS)"), body.index("_SIG_TITLE.search")
    assert i_tr < i_title and i_tr < body.index("_SIG_MINE.search")
    assert set("ךםןףץ") <= set(src.split("_SIG_FINALS = str.maketrans(", 1)[1].split(")", 1)[0])


# --- התנהגות על טקסט גולמי אמיתי (אותיות סופיות) ---
@pytest.mark.parametrize("line", ["בתאריך יום ג׳, 17 בנוב׳ 2026 כתב:", "\u200fבתאריך 17.11.2026 נכתב:",
                                  "מאת: דנה", "-----הודעה מקורית-----"])
def test_quote_headers_raw_finals(line):
    assert channels._is_quote_header(channels._BIDI.sub("", line).strip())   # כמו strip_reply


@pytest.mark.parametrize("line", ["משה כהן | יועץ משפטי", "רינה לוי | עורכת דין", "דן | עו״ד"])
def test_signature_raw_finals(line):
    assert channels._is_signature_line(line)


@pytest.mark.parametrize("name,exp", [("רשות המסים", ["brand_authority"]), ("רשות המיסים", ["brand_authority"]),
                                      ("בית הדין הרבני", ["brand_authority"]), ("מספרת דנה", [])])
def test_business_name_raw_finals(name, exp):
    assert compliance.business_name_violations(name) == exp


@pytest.mark.parametrize("text,name", [("אחרת נפרסם את שמך", "shaming"), ("פרסום שמכם ברשת", "shaming"),
                                       ("עורך הדין שלנו", "lawyer"), ("נעביר לעורכי דין", "lawyer")])
def test_legal_blacklist_raw_finals(text, name):
    assert name in compliance.violations(text, compliance.Rules(business="מספרת דנה"))


@pytest.mark.parametrize("name", ["כהן ובניו בע״מ", 'כהן ובניו בע"מ', "סטודיו דנה", "משרד רואי חשבון לוי"])
def test_org_name_kept_whole(name):
    assert templates.first_name(name) == name


GERSH = ["עו״ד", 'עו"ד', "עו'ד", "עו׳ד", "עו”ד", "עוה״ד", "עו״ד ונוטריון"]


@pytest.mark.parametrize("title", GERSH)
@pytest.mark.parametrize("sep", [" | ", ", ", " – "])
def test_gershayim_signature_thanks_not_legal(title, sep):
    from app import conversation
    if sep == ", " and " " in title:      # «, עו״ד ונוטריון» — חלופת הפסיק מקבלת תואר יחיד (כמו לפני)
        pytest.skip("comma form: single title only")
    body = f"קיבלתי תודה\n\nדן כהן{sep}{title}\nטל 050-1234567"
    stripped = channels.strip_reply(body)
    assert title not in stripped, stripped
    assert "legal" not in [i.value for i in conversation.detect(stripped)]


@pytest.mark.parametrize("body", ["עו״ד שלי יתקשר אליכם\n\nדנה",
                                  "קיבלתי.\nדן | עו״ד שלי יטפל"])
def test_gershayim_content_still_legal(body):
    from app import conversation
    assert "legal" in [i.value for i in conversation.detect(channels.strip_reply(body))]
