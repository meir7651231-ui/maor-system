"""מנהל 280 · ביקורת: regex שעוקף את נרמול האותיות הסופיות.

באג: `_is_signature_line` נרמל ץ/ן/ם אבל לא ך ⇒ חתימת עורך דין (זכר) «משה כהן | עורך דין» לא נחתכה
מהמייל ⇒ «קיבלתי תודה» סווג legal (השהיה + דחוף). «עורכת דין» (בלי ך) עבד — לכן לא נתפס.
גם «יועץ/יועצת משפטי/ת» (תואר, לא «ייעוץ») לא זוהה כחתימה.
"""
import ast
import pathlib
import re

import pytest

from app import channels, conversation

TITLES = ["עורך דין", "עורכת דין", "עורך דין ונוטריון", "עורך-דין", "משרד עורכי דין",
          "יועץ משפטי", "יועצת משפטית", "ייעוץ משפטי", "Attorney at Law"]


@pytest.mark.parametrize("title", TITLES)
def test_lawyer_signature_stripped_thanks_not_legal(title):
    body = f"קיבלתי תודה\n\nמשה כהן | {title}\nטל 050-1234567"
    stripped = channels.strip_reply(body)
    assert title not in stripped
    intents = [i.value for i in conversation.detect(stripped)]
    assert "legal" not in intents, (title, intents)


@pytest.mark.parametrize("line", ["לא משלם | עורך דין", "עורך הדין שלי יתקשר", "אני עורך דין ולא אשלם",
                                  "היועץ המשפטי שלי יטפל"])
def test_content_lines_not_signature(line):
    assert not channels._is_signature_line(line)


def test_customer_line_with_lawyer_still_legal():
    body = "עורך הדין שלי יתקשר אליכם\n\nדנה"
    assert "legal" in [i.value for i in conversation.detect(channels.strip_reply(body))]


FIN = set("ךםןףץ")
NONFIN_END = re.compile(r"[כמנפצ](?![א-ת])")


def test_source_signature_normalizes_all_finals():
    src = pathlib.Path(channels.__file__).read_text()
    body = src.split("def _is_signature_line", 1)[1].split("\ndef ", 1)[0]
    assert "_SIG_FINALS" in body
    assert channels._SIG_FINALS == str.maketrans("ךםןףץ", "כמנפצ")


def test_conversation_direct_regex_with_finals_is_wrapped():
    """טקסט ב-detect מנורמל (ך⇒כ…). קריאת re.* ישירה עם תבנית שיש בה אות סופית מתה בשקט,
    אלא אם עטופה ב-_c / .translate(_FINALS) או ברשימת ההיתר (פלט יוצא גולמי / מחלקה [נן])."""
    path = pathlib.Path(conversation.__file__)
    src = path.read_text()
    allowed = {"CONVERSATION_BANNED", "_CLASS_NAME_RX"}
    tree = ast.parse(src)
    spans = [(n.lineno, n.end_lineno) for n in ast.walk(tree)
             if isinstance(n, (ast.Assign, ast.AnnAssign))
             and any(isinstance(t, ast.Name) and t.id in allowed
                     for t in (n.targets if isinstance(n, ast.Assign) else [n.target]))]
    assert len(spans) == len(allowed)
    bad = []
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                and isinstance(node.func.value, ast.Name) and node.func.value.id == "re" and node.args):
            continue
        seg = ast.get_source_segment(src, node.args[0]) or ""
        if "_FINALS" in seg or seg.startswith("_c("):
            continue
        lits = "".join(x.value for x in ast.walk(node.args[0])
                       if isinstance(x, ast.Constant) and isinstance(x.value, str))
        lits = re.sub(r"\[[^\]]*\]", "", lits)   # מחלקות תווים ([נן]) מכסות את שתי הצורות
        if FIN & set(lits):
            if not any(a <= node.lineno <= b for a, b in spans):
                bad.append((node.lineno, seg[:60]))
    assert not bad, bad
