"""critic סבב 167 · 🟠 לתיקון בונה — רכיב: `app/settings_api.py` → `SettingsIn._name` (+ `_owner`) ו-`app/compliance.py`
→ `INSTITUTION` («brand_authority»).

שם העסק פותח **כל** SMS ומייל («<שם העסק>: שלום…») ופטור ממסנן המותגים בגוף ההודעה — לכן ההגדרה היא השער היחיד
מול התחזות (critic 3.6.5). נמדד ב-`update_settings`:
  א. תווים בלתי-נראים עוקפים את המסנן: «ב\\u200bנ\\u200bק לאומי» (zero-width space) ⇒ **התקבל** (בלעדיהם נחסם);
     «סטודיו \\u202eריאמ» (RLO — היפוך תצוגה) ⇒ התקבל; בטלפון הנמען רואה טקסט אחר ממה שנבדק.
  ב. רשויות שחסרות ברשימה: «מס הכנסה», «ביטוח לאומי» ⇒ התקבלו כשם עסק ⇒ SMS «מס הכנסה: שלום, …» = התחזות
     לרשות (בגוף הודעה «ביטוח לאומי» מותר במכוון — אבל לא כ**שם השולח/פותח**).
הצעה: לנרמל/לדחות תווי Cf (zero-width, bidi controls U+200B–U+200F, U+202A–U+202E, U+2066–U+2069, U+FEFF) בשם
העסק ובשם בעל העסק לפני הבדיקות; להוסיף ל-`business_name_violations` «מס הכנסה», «ביטוח לאומי», «מע"מ»,
«רשות האכיפה והגבייה». הבדיקות xfail(strict=True); הבקרה נשארת ירוקה."""
import pytest

ZW, RLO = chr(0x200B), chr(0x202E)   # בלי תווים בלתי-נראים אמיתיים בקובץ (בדיקת האבטחה של הריפו)
SPOOF = [f"ב{ZW}נ{ZW}ק לאומי", f"סטודיו {RLO}ריאמ", f"סטודיו{ZW}מאיר", "מס הכנסה", "ביטוח לאומי"]


@pytest.mark.xfail(strict=True, reason="critic 167: שם עסק מתחזה/בלתי-נראה מתקבל (לתיקון בונה)")
@pytest.mark.parametrize("name", SPOOF)
def test_spoof_business_name_rejected(svc, name):
    with pytest.raises((ValueError, PermissionError)):
        svc.update_settings({"business_name": name})


@pytest.mark.parametrize("name", ["בנק לאומי", "הוצאה לפועל"])
def test_control_known_institutions_rejected(svc, name):
    with pytest.raises(ValueError):
        svc.update_settings({"business_name": name})


def test_control_regular_name_accepted(svc):
    svc.update_settings({"business_name": "סטודיו מאיר"})
    assert svc.s.business_name == "סטודיו מאיר"
