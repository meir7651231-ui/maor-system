"""לולאת גבי מנוע 17.11 — המשך לסבב 128 (ציטוט HTML). לקוח שעונה **מתחת** לציטוט (bottom-posting):
«> התזכורת שלנו\\nהסר אותי» / «<blockquote>…</blockquote><div>הסר אותי</div>» ⇒ strip_reply חתך בראש הציטוט
⇒ גוף ריק ⇒ ignored ⇒ **ההסרה נבלעה בשקט**. גיבוי רק כשהחיתוך הרגיל ריק, ורק מחוץ לציטוט מסומן.
מקור לא מסומן (Outlook/«From:») ⇒ אין גיבוי — שורת ההסרה שלנו («להסרה השיבו הסר») לעולם לא תסווג כבקשת לקוח."""
import pytest

from app.channels import strip_reply


@pytest.mark.parametrize("raw,want", [
    ("> סטודיו מאיר: תזכורת\nהסר אותי", "הסר אותי"),
    ("<blockquote>סטודיו מאיר: תזכורת</blockquote><div>הסר אותי</div>", "הסר אותי"),
    ("&gt; סטודיו מאיר: תזכורת<br>הסר אותי", "הסר אותי"),
    ("On Mon, 16 Nov 2026, Dana <d@x.com> wrote:\n> תזכורת\n> להסרה השיבו הסר\n\nשילמתי אתמול", "שילמתי אתמול"),
    ("<div>הסר אותי</div><blockquote>תזכורת</blockquote>", "הסר אותי"),   # top-posting — כמו קודם
])
def test_customer_text_kept(raw, want):
    assert strip_reply(raw) == want


@pytest.mark.parametrize("raw", [
    "-----Original Message-----\nFrom: studio\nלהסרה השיבו הסר",
    '<p></p><div id="divRplyFwdMsg">From: x</div><div>להסרה השיבו הסר</div>',
    "> תזכורת\n> להסרה השיבו הסר",
    "<blockquote>תזכורת. להסרה: השיבו הסר</blockquote>",
])
def test_our_own_text_never_classified(raw):
    assert strip_reply(raw) == ""
