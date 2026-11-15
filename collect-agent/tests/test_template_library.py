"""«ספריית נוסחים» (marketing/library): כל נוסח בדף = פלט app/templates.py, עובר מסנן ניסוח ו-≤2 חלקי SMS.

כך הכלי החינמי לא יכול להבטיח ללקוח נוסח שהמוצר לא שולח, ושינוי נוסח בקוד מחייב לבנות את הדף מחדש.
"""
import html
import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "marketing/library"
spec = importlib.util.spec_from_file_location("libbuild", LIB / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def _text():
    p = LIB / "index.html"
    assert p.is_file(), "חסר marketing/library/index.html (python3 marketing/library/build.py)"
    return p.read_text(encoding="utf-8")


def test_library_is_fresh_against_product_templates():
    assert build.main(["--check"]) == 0


def test_every_sms_on_page_is_product_output_and_compliant():
    text = _text()
    pat = r"<pre class=\"tpl\" id=\"sms\d+\" data-sms>(.*?)</pre>"
    on_page = [html.unescape(s) for s in re.findall(pat, text, re.S)]
    vs = build.variants()
    assert on_page == [v["sms"] for v in vs] and len(vs) == 6   # 3 שלבים × (אחת / כמה)
    for v in vs:
        assert build.check_variant(v) == [], v


def test_page_rules():
    text = _text()
    assert 'name="robots" content="noindex' in text and "טיוטה, לא לפרסום" in text
    assert "₪119" in text and "₪1,190" in text and "כולל מע״מ ככל שחל" in text
    assert not re.search(r'(src|href)="https?://', text)
    for bad in ("<form", "fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage"):
        assert bad not in text, bad
    prose = re.sub(r"<style>.*?</style>", "", text, flags=re.S).lower()
    for bad in ("whatsapp", "וואטסאפ", "העוזר לגביית", "מובטח", "מבטיח", "100%", "מוצפן"):
        assert bad not in prose, bad
