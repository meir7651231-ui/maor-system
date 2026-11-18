"""critic סבב 98 · ac10a98c מצטט את הודעת הלקוח בכל owner_summary — טוב, אבל:
1. הציטוט נחתך ב-80 תווים. ב-/ui זה המקום היחיד שבו בעל העסק רואה את ההודעה ⇒ «…ובכלל תסירו אותי» אחרי תו 80
   (והמנוע פספס) ⇒ בעל העסק לא רואה את הבקשה, סוגר, והתזכורות חוזרות. ⇒ הציטוט ארוך מספיק להודעת SMS/מייל רגילה.
2. תווי כיוון/בקרה (U+202E וכו׳) מהלקוח עוברים לכרטיס ⇒ אפשר להפוך ויזואלית את מה שבעל העסק קורא. ⇒ מנוקים."""
from app.conversation import respond
from evals.harness import build_ctx


def _sum(t):
    return respond(t, build_ctx({"channel": "sms"})).owner_summary


def test_long_message_tail_is_visible_to_owner():
    t = ("שלום, רציתי לעדכן שקיבלתי את ההודעה שלכם ואני מבין שיש חשבונית פתוחה מהחודש שעבר על העבודה שעשיתם, "
         "אבל אני כרגע בחו״ל ואין לי גישה לחשבון, ובכלל זה כבר לא רלוונטי לי אז נא לא לפנות אליי בנושא הזה עוד.")
    assert "נא לא לפנות אליי בנושא הזה עוד" in _sum(t)


BAD = [chr(c) for c in (0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069, 0x200E, 0x200F, 0x07)]


def test_bidi_and_control_chars_are_stripped_from_quote():
    s = _sum("שילמתי" + chr(0x202E) + " תסירו אותי" + chr(0x2066) + "x" + chr(0x200F) + chr(0x07))
    assert not any(c in s for c in BAD), repr(s)
