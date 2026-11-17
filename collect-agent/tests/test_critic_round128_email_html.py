"""critic סבב 128 · באג בערוץ המייל: כשספק ה-inbound מעביר HTML (מייל HTML-only — Gmail/Outlook בנייד),
`strip_reply` לא הכיר `<blockquote class="gmail_quote">`, `&gt;` או `<div id="divRplyFwdMsg">` ⇒ הציטוט של
**ההודעה שלנו** נשאר בגוף ונכנס לסיווג. תזכורת «פריסה» אומרת «השיבו "פריסה"» ⇒ לקוח שענה «ok»/«👍»/«בסדר»
סווג plan_request (השהיה + הצעת פריסה); «מה זה?» ⇒ how_to_pay (מ«אפשר לשלם בקישור» שבציטוט).
התיקון: HTML ⇒ טקסט (חיתוך בבלוק הציטוט, <br>/</div>/</p> ⇒ שורה, הסרת תגים, פענוח ישויות) ואז אותו מסלול."""
import pytest

from app.channels import strip_reply
from app.conversation import Intent, respond
from evals.harness import build_ctx

PLAN = ("שלום דנה,<br><br>חשבונית 1042 על סך 500 ₪ עדיין פתוחה.<br>אם נוח לכם, אפשר לפרוס את הסכום לכמה תשלומים "
        "ללא כל תוספת — השיבו &quot;פריסה&quot;.<br>לתשלום מלא: https://p<br><br>בברכה,<br>סטודיו<br><br>"
        "להסרה מתזכורות: https://u")
FRIENDLY = ("שלום דנה,<br><br>זו תזכורת ידידותית שחשבונית 1042 טרם סומנה כשולמה.<br>אפשר לשלם בקישור: https://pay"
            "<br><br>בברכה,<br>סטודיו")


def gmail(body, q):
    return (f'<div dir="rtl">{body}</div><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">'
            f'בתאריך יום ג׳, 17 בנוב׳ 2026 ב-10:00 מאת סטודיו &lt;x@y.co&gt;:<br></div>'
            f'<blockquote class="gmail_quote" style="margin:0">{q}</blockquote></div>')


def amp_gt(body, q):
    return f"{body}<br>&gt; " + q.replace("<br>", "<br>&gt; ")


def outlook(body, q):
    return (f'<html><body><div dir="rtl">{body}</div><hr style="display:inline-block;width:98%">'
            f'<div id="divRplyFwdMsg" dir="ltr"><b>From:</b> סטודיו &lt;x@y.co&gt;<br><b>Sent:</b> Tuesday'
            f'<br><b>Subject:</b> חשבונית</div><div>{q}</div></body></html>')


@pytest.mark.parametrize("wrap", [gmail, amp_gt, outlook])
@pytest.mark.parametrize("body", ["ok", "👍", "בסדר"])
def test_our_quoted_plan_offer_does_not_classify(wrap, body):
    d = respond(strip_reply(wrap(body, PLAN)), build_ctx({"channel": "email"}))
    assert d.intent not in (Intent.PLAN_REQUEST, Intent.HOW_TO_PAY), (body, d.intent, strip_reply(wrap(body, PLAN)))


@pytest.mark.parametrize("wrap", [gmail, amp_gt, outlook])
def test_body_text_is_clean(wrap):
    assert strip_reply(wrap("קיבלתי, <b>תודה</b> &amp; שבוע טוב", FRIENDLY)) == "קיבלתי, תודה & שבוע טוב"


@pytest.mark.parametrize("wrap", [gmail, amp_gt, outlook])
def test_real_intent_in_html_body_kept(wrap):
    assert respond(strip_reply(wrap("הסר אותי בבקשה", PLAN)), build_ctx({"channel": "email"})).intent == Intent.OPT_OUT


def test_plain_text_unchanged():
    t = "שילמתי אתמול\nתודה <3 & bye\n\nOn Sun wrote:\n> הסר"
    assert strip_reply(t) == "שילמתי אתמול\nתודה <3 & bye"
