"""מנהל 314 · critic 167: שם עסק/שם בעל עסק — תווי Cf (zero-width/bidi/BOM) נדחים לפני כל בדיקה, ורשויות
שמותרות בגוף הודעה («ביטוח לאומי», «מס הכנסה») נחסמות כ**שם העסק** (הוא פותח כל SMS = שם השולח בפועל)."""
import pytest

from app import compliance

CF = [0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E,
      0x2066, 0x2067, 0x2068, 0x2069, 0xFEFF, 0x00AD, 0x2060]


@pytest.mark.parametrize("cp", CF)
def test_every_cf_char_rejected_in_business_name(svc, cp):
    with pytest.raises(ValueError, match="בלתי-נראים"):
        svc.update_settings({"business_name": f"סטודיו{chr(cp)} מאיר"})


@pytest.mark.parametrize("cp", [0x200B, 0x202E, 0x2067])
def test_cf_rejected_in_owner_name(svc, cp):
    with pytest.raises(ValueError):
        svc.update_settings({"owner_name": f"מאיר{chr(cp)} כהן"})


@pytest.mark.parametrize("name", ["מס הכנסה", "מס-הכנסה תל אביב", "המוסד לביטוח לאומי", "הביטוח הלאומי",
                                  "רשות האכיפה והגבייה", "מע״מ ומכס", "אגף המכס", "Income Tax Dept",
                                  "Bituach Leumi"])
def test_name_only_authorities_rejected(svc, name):
    with pytest.raises(ValueError, match="brand_authority"):
        svc.update_settings({"business_name": name})


def test_rejected_name_not_saved(svc):
    before = svc.s.business_name
    with pytest.raises(ValueError):
        svc.update_settings({"business_name": "מס הכנסה"})
    assert svc.s.business_name == before


@pytest.mark.parametrize("name", ["סטודיו מאיר", "ייעוץ מס דני", "ביטוח דני כהן", "לאומי פיצה",
                                  "מכס מאיר", "Pepper Grill", "ביט סטודיו"])
def test_control_regular_names_accepted(svc, name):
    svc.update_settings({"business_name": name})
    assert svc.s.business_name == name


def test_design_route_also_rejects(svc):
    with pytest.raises(ValueError):
        svc.update_design_settings({"business_name": f"ב{chr(0x200B)}נק לאומי"})


def test_body_mentioning_bituach_leumi_still_allowed():
    """בגוף הודעה «ביטוח לאומי» מותר במכוון — החסימה היא לשם העסק בלבד."""
    r = compliance.Rules(business="סטודיו מאיר")
    assert "brand_authority" not in compliance.violations(
        "סטודיו מאיר: שלום, אם קיבלת קצבת ביטוח לאומי אפשר לפרוס את התשלום", r)


def test_invisible_chars_helper():
    assert compliance.invisible_chars("א​ב") and not compliance.invisible_chars("סטודיו מאיר")
    assert not compliance.invisible_chars("")
