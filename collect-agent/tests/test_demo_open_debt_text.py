"""הפעלה 132: שורת הדשבורד בהדגמה לא משמיטה חוב במטבע אחר ולא מחברת אותו ל-₪."""
from app.demo import open_debt_text


def test_ils_only_unchanged():
    assert open_debt_text({"open_agorot": 872500, "other_currency": []}) == "8,725.00 ₪"
    assert open_debt_text({"open_agorot": 872500}) == "8,725.00 ₪"


def test_other_currency_listed_not_summed():
    t = {"open_agorot": 120000, "other_currency": [
        {"currency": "EUR", "open_agorot": 0, "collected_agorot": 2050},
        {"currency": "USD", "open_agorot": 50000}]}
    assert open_debt_text(t) == "1,200.00 ₪ + $500"
