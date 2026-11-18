"""שכבת הערוצים של השירות: מודל ההודעה + שליחת dry-run, מעל `app/integrations/`.

**שכבה אחת לספקים:** כל בניית בקשה לספק (019 ראשי / InforU גיבוי / SMTP / Resend), צנזור סודות,
מניעת כפילויות וגיבוי בין ספקים — ב-`app/integrations/`. כאן נשאר רק מה שהשירות צריך:
`Message` (מה נשמר בתור), `DryRunSender` (מה *היה* יוצא, דרך ה-adapter האמיתי ב-dry-run),
עזרי פרטי קשר (`app/contact.py`) ופענוח מייל נכנס.

**אין וואטסאפ** — מדיניות Meta אוסרת debt collection.
"""
from __future__ import annotations

import json
import re
import uuid
from dataclasses import dataclass, field
from typing import Any

from .contact import EMAIL_RE, clean_email, is_il_mobile, local_phone, normalize_il_phone, valid_email
from .integrations.base import EmailMessageOut, IntegrationError, SmsMessage, request_preview
from .integrations.email import SmtpEmail
from .integrations.notifier import Notification, Notifier
from .integrations.sms import SMS_PROVIDERS, Sms019
from .integrations.sms import sms_segments as _segments

__all__ = ["EMAIL_RE", "SMS_ADAPTERS", "DryRunSender", "Message", "SmtpEmail", "build_adapters", "clean_email",
           "is_il_mobile", "local_phone", "message_from_json", "message_to_json",
           "normalize_il_phone", "parse_address", "sms_segments", "strip_reply", "valid_email"]

SMS_ADAPTERS = SMS_PROVIDERS   # 019 · inforu (Twilio יצא — לא נדרש ל-MVP)
UNSET = "UNSET"   # מפתח חסר בשלב 1 — ה-adapter נבנה לתצוגה בלבד; הסוד מצונזר בכל מקרה


def sms_segments(text: str) -> dict[str, Any]:
    """עברית ⇒ UCS-2: 70 תווים להודעה בודדת, 67 לכל חלק בהודעה משורשרת (מימוש יחיד: integrations)."""
    enc, parts = _segments(text)
    return {"chars": len(text), "encoding": enc, "segments": parts}


# ---------- הודעה ----------
@dataclass(frozen=True)
class Message:
    channel: str            # 'sms' | 'email'
    to: str                 # 972XXXXXXXXX / כתובת מייל
    body: str               # טקסט (SMS / גוף מייל טקסטואלי)
    subject: str = ""
    html: str = ""
    unsubscribe_url: str = ""


def build_adapters(*, provider: str = "019", username: str = "", token: str = "", sender: str = "",
                   backup_username: str = "", backup_token: str = "",
                   email_from: str = "no-reply@example.com", smtp_host: str = "smtp.example",
                   test_endpoint: bool = True):
    """adapters של integrations במצב dry-run (בלי transport). מפתחות חסרים ⇒ UNSET (תצוגה בלבד).
    ⇒ (שרשרת SMS לפי סדר: הראשי ואחריו הגיבוי, מייל). 019 ראשי ⇒ InforU גיבוי, ולהפך."""
    sender = sender or "Gabi"
    backup = "inforu" if provider == "019" else "019"

    def mk(name: str, user: str, tok: str):
        if name == "019":
            return Sms019(user or UNSET, tok or UNSET, sender, test_endpoint=test_endpoint)
        return SMS_ADAPTERS[name](user or UNSET, tok or UNSET, sender)
    chain = [mk(provider, username, token), mk(backup, backup_username, backup_token)]
    return chain, SmtpEmail(smtp_host, 587, "", "", email_from)


DRYRUN_LOG_MAX = 1000   # הפעלה 182: תקרת יומן ה-dry-run בזיכרון (5,000 שליחות ≈ 2.2MB, וגדל לכל חיי התהליך)


class SentLog(list):
    """יומן ה-dry-run: רשימה רגילה (השוואה ל-[], חיתוך, len) של N הרשומות האחרונות בלבד.
    `total`/`by_channel` = מונים לכל חיי התהליך — לא יורדים כשרשומה ישנה נדחקת, כך שספירות
    הדשבורד ו-`total` של /outbox נשארים מדויקים גם אחרי התקרה. מתחת לתקרה ⇒ ביט-זהה לרשימה."""

    def __init__(self, items=(), maxlen: int = DRYRUN_LOG_MAX) -> None:
        super().__init__()
        self.maxlen = maxlen
        self.total = 0
        self.by_channel: dict[str, int] = {}
        # הפעלה 203: הודעות לבעל העסק (audience='owner', למשל מייל «שינוי בהגדרות רגישות») נספרות בנפרד —
        # מונה «מיילים שנשלחו» בדשבורד = הודעות ללקוחות בלבד
        self.owner_by_channel: dict[str, int] = {}
        for it in items:
            self.append(it)

    def mark_owner(self, msg_id: str) -> None:
        """הפעלה 203: מסמן רשומה שכבר נרשמה כהודעה לבעל העסק (audience='owner') ומעדכן את המונה הנפרד.
        פעם אחת לכל רשומה; מזהה שלא נמצא (נדחק מהתקרה) ⇒ בלי שינוי."""
        for rec in reversed(self):
            if isinstance(rec, dict) and rec.get("id") == msg_id:
                if rec.get("audience") != "owner":
                    rec["audience"] = "owner"
                    ch = rec.get("channel", "")
                    self.owner_by_channel[ch] = self.owner_by_channel.get(ch, 0) + 1
                return

    def append(self, rec) -> None:  # type: ignore[override]
        super().append(rec)
        self.total += 1
        ch = rec.get("channel", "") if isinstance(rec, dict) else ""
        self.by_channel[ch] = self.by_channel.get(ch, 0) + 1
        if isinstance(rec, dict) and rec.get("audience") == "owner":
            self.owner_by_channel[ch] = self.owner_by_channel.get(ch, 0) + 1
        if len(self) > self.maxlen:
            del self[: len(self) - self.maxlen]


def sent_mark(log) -> int:
    """נקודת ייחוס ביומן ה-dry-run: מספר הרשומות שנרשמו אי-פעם (לא `len`, שנעצר בתקרה).
    לשימוש עם `sent_since` — כך שקריאת «מה נשלח מאז» נשארת נכונה גם אחרי שהיומן נקצץ.
    רשימה רגילה (sender מותאם) ⇒ `len`, כמו קודם."""
    return getattr(log, "total", len(log))


def sent_since(log, mark: int) -> list:
    """הרשומות שנרשמו אחרי `mark` (שהתקבל מ-`sent_mark`). אחרי תקרה מחזיר רק את מה שעדיין
    ביומן — לעולם לא רשומות ישנות שקדמו ל-mark (כמו ש-`log[mark:]` היה עושה אחרי קיצוץ)."""
    new = max(0, sent_mark(log) - mark)
    return list(log[max(0, len(log) - new):]) if new else []


@dataclass
class DryRunSender:
    """"שולחת" = בונה דרך ה-adapter של integrations את הבקשה המדויקת שהייתה יוצאת, ורושמת.
    לא נוגעת ברשת: ה-adapters נבנים בלי transport/factory (נאכף ב-integrations.base)."""

    sms: Any
    email: Any
    reply_to: str = ""
    sent: SentLog = field(default_factory=SentLog)
    mode: str = "dry_run"

    allow_mock_transport: bool = False   # בדיקות failover בלבד: adapters מול httpx.MockTransport
    provider_ids: dict[str, tuple[str, str]] = field(default_factory=dict)   # dryrun.* ⇒ (ספק, מזהה)

    def __post_init__(self) -> None:
        if not isinstance(self.sent, SentLog):
            self.sent = SentLog(self.sent)
        self.chain = list(self.sms) if isinstance(self.sms, (list, tuple)) else [self.sms]
        self.sms = self.chain[0] if self.chain else None   # הראשי — לתצוגה
        for a in (*self.chain, self.email):
            if a is not None and not getattr(a, "dry_run", False) and not self.allow_mock_transport:
                raise IntegrationError("DryRunSender: adapter שאינו dry-run")

    def _request(self, msg: Message) -> dict[str, Any]:
        if msg.channel == "sms":
            req = self.sms.build_request(SmsMessage(msg.to, msg.body))
            return request_preview(req, secrets=self.sms._secrets())
        m = self.email.build_message(EmailMessageOut(
            to=msg.to, subject=msg.subject, text=msg.body, html=msg.html,
            reply_to=self.reply_to, unsubscribe_url=msg.unsubscribe_url))
        return {"method": "SMTP", "headers": {k: str(v) for k, v in m.items()},
                "text": msg.body, "html": msg.html}

    def preview(self, msg: Message) -> dict[str, Any]:
        adapter = self.sms if msg.channel == "sms" else self.email
        out: dict[str, Any] = {"channel": msg.channel, "provider": adapter.provider, "to": msg.to,
                               "body": msg.body}
        try:
            out["request"] = self._request(msg)
        except IntegrationError as e:   # הודעה ארוכה/כתובת פסולה — מוצג, לא קורס
            out["request"], out["error"] = {}, str(e)
        if msg.channel == "sms":
            out["length"] = sms_segments(msg.body)
        else:
            out["subject"] = msg.subject
            out["html"] = msg.html
        return out

    def send_owner(self, msg: Message) -> str:
        """הפעלה 203: הודעה לבעל העסק (לא ללקוח). אותה שליחה בדיוק, והרשומה ביומן מסומנת
        audience='owner' ⇒ לא נספרת במונה «מיילים/SMS שנשלחו» של הדשבורד (שסופר פניות ללקוחות)."""
        mid = self.send(msg)
        mark = getattr(self.sent, "mark_owner", None)
        if mark is not None:
            mark(mid)
        else:   # רשימה רגילה (sender מותאם בבדיקות) ⇒ תיוג ישיר
            for rec in reversed(self.sent):
                if rec.get("id") == mid:
                    rec["audience"] = "owner"
                    break
        return mid

    def send(self, msg: Message) -> str:
        """דרך ה-adapter עצמו (Notifier): SMS ⇒ 019, ובכשל זמני ⇒ InforU. כשל בכל הספקים ⇒
        IntegrationError, והשירות לא מסמן "נשלח". המזהה הפנימי תמיד "dryrun.*"."""
        msg_id = f"dryrun.{uuid.uuid4().hex[:12]}"
        if msg.channel == "sms":
            rep = Notifier(self.chain).send(Notification(key=msg_id, phone=msg.to,
                                                         sms_text=msg.body))
        else:
            rep = Notifier([], self.email).send(Notification(
                key=msg_id, email=msg.to, email_subject=msg.subject, email_text=msg.body,
                email_html=msg.html, unsubscribe_url=msg.unsubscribe_url))
        rec = {"id": msg_id, **self.preview(msg), "delivery": rep.as_dict(),
               "provider_message_id": rep.final.message_id if rep.final else ""}
        if rep.final is not None:
            rec["provider"] = rep.final.provider
        if not rep.delivered:
            raise IntegrationError(f"שליחה נכשלה בכל הספקים: {rep.as_dict()['attempts']}")
        self.sent.append(rec)
        # לקישור דוח מסירה (DLR) שיגיע מהספק אל ההודעה שלנו
        self.provider_ids[msg_id] = (rec["provider"], rec["provider_message_id"])
        # נקרא מיד אחרי השליחה (_log_out) ונשמר ב-messages ⇒ גם המפה בתקרה, הישנות ראשונות
        while len(self.provider_ids) > self.sent.maxlen:
            self.provider_ids.pop(next(iter(self.provider_ids)))
        return msg_id


def message_to_json(m: Message) -> str:
    return json.dumps(m.__dict__, ensure_ascii=False)


def message_from_json(s: str) -> Message:
    return Message(**json.loads(s))


# ---------- מייל נכנס ----------
_ADDR = re.compile(r"<([^<>@\s]+@[^<>\s]+)>|([^\s<>\"]+@[^\s<>\"]+)")
_QUOTE_HDR = re.compile(r"^(on .+ wrote:|ב?תאריך .+(כתב|נכתב).*:|-{2,}\s*original message|"
                        r"-{2,}\s*הודעה מקורית|from:\s|מאת:\s)", re.I)


def parse_address(raw: str) -> str:
    """'דנה <Dana@Example.com>' ⇒ 'dana@example.com'."""
    m = _ADDR.search(raw or "")
    return (m.group(1) or m.group(2)).strip().lower() if m else ""


# critic סבב 123: כותרת ציטוט של Gmail עברית («בתאריך … מאת שם <mail>:», עם תווי כיווניות, בלי «כתב»),
# Apple Mail עברית («ב-17 בנוב׳ 2026, בשעה 10:00, שם <mail> כתב/ה:») וכותרת שנשברה לשתי שורות — נשארו בגוף
# ההודעה: שם העסק («משרד עורכי דין») ⇒ legal, תאריך הכותרת ⇒ תאריך הבטחה. שורה של הלקוח שמסתיימת ב«כתב:» בלי
# מייל/שנה — נשמרת.
_BIDI = re.compile(r"[\u200e\u200f\u202a-\u202e\u2066-\u2069]")
_QUOTE_HDR_TAIL = re.compile(
    r"<\s*[^<>@\s]+@[^<>\s]+\s*>\s*(?:wrote|כתב(?:/ה|ה)?)?\s*:\s*$"
    r"|^(?:on|ב-?)\s.*\b(?:19|20)\d\d\b.*(?:wrote|כתב(?:/ה|ה)?)\s*:\s*$", re.I)


def _is_quote_header(s: str) -> bool:
    return bool(s.startswith(">") or _QUOTE_HDR.match(s) or s == "--" or _QUOTE_HDR_TAIL.search(s))


# critic סבב 124: חתימת הלקוח עצמו נכנסה לסיווג — «שם | עורכת דין», «Name, Attorney at Law», «יעוץ משפטי», הודעת
# סודיות סטנדרטית ⇒ «קיבלתי תודה» סווג legal + השהיה + דחוף. חותכים משורת חתימה/סודיות (לא שורה ראשונה).
_SIG_DISCLAIMER = re.compile(
    r"(?:הודעה|הודעת|מייל|דוא\"?ל|דואר)\s+(?:\S+\s+){0,3}?(?:זו|זה|זאת)\s+(?:\S+\s+){0,2}?(?:חסוי|חסויה|סודי|סודית)"
    r"|מיועד\w*\s+(?:\S+\s+){0,2}?לנמען|\bconfidentiality\s+notice\b|\bprivileged\s+and\s+confidential\b"
    r"|\bif\s+you\s+(?:have\s+)?received\s+this\s+(?:e-?mail|message|communication)\s+in\s+error\b", re.I)
_SIG_TITLE = re.compile(
    # critic סבב 139: גם מקף רגיל עם רווחים («דנה לוי - משרד עורכי דין»)
    r"^[^.!?]{0,40}(?:\||–|\s-\s)\s*(?:עוה?[\"״'׳”“„″]?ד|עורכ[^\s-]*[\s-]+דינ?|משרד\s+עורכי[\s-]+דינ?|י?יעוצ\s+משפטי|יועצ\S*\s+משפטי\S*"
    r"|attorney(?:\s+at\s+law)?|esq\.?|lawyer|counsel(?:or)?|law\s+(?:office|firm))(?:\s+\S+){0,3}\s*$"
    r"|^[^.!?,]{0,40},\s*(?:עוה?[\"״'׳”“„″]?ד|attorney(?:\s+at\s+law)?|esq\.?|counsel(?:or)?)\s*$"
    # critic סבב 139: «דנה לוי, עו״ד ונוטריון/ומגשרת», «לוי ושות׳, עורכי דין», «עו״ד דנה לוי» (תואר לפני השם)
    r"|^[^.!?]{0,40},\s*(?:עוה?[\"״'׳”“„″]?ד|עורכי[\s-]+דינ?|משרד\s+עורכי[\s-]+דינ?)(?:\s+ו\S+){0,2}\s*$"
    r"|^עוה?[\"״'׳”“„″]?ד\s+[^\s\d.!?,]{2,}(?:\s+[^\s\d.!?,]{2,}){0,2}\s*$", re.I)
# מנהל 281: «| עו״ד» בגרשיים עבריים (״, מקלדת טלפון/Word) / ״ חכם לא זוהה ⇒ «קיבלתי תודה» סווג legal
# שורה שיש בה פעולה/שלילה/בעלות היא תוכן, לא חתימה («לא משלם | עורך דין», «עורך הדין שלי»)
_SIG_MINE = re.compile(r"(?<![\w])(?:שלי|שלנו|לא|אני|אתבע|נתבע|תביעה|אשלמ|משלמ\w*|יתקשר|יטפל|יטפלו|פונה|נתראה"
                       r"|בית משפט|בדרכ|אליכמ|לכמ|מעביר|מעבירה|יפנה|ישלח|מכתב|התראה)(?![\w])"
                       r"|\b(?:my|our|not|will|sue|court|i)\b", re.I)


_SIG_FINALS = str.maketrans("ךםןףץ", "כמנפצ")


def _is_signature_line(s: str) -> bool:
    if _SIG_DISCLAIMER.search(s):
        return True
    s = s.translate(_SIG_FINALS)   # מנהל 280: כל האותיות הסופיות — ה-ך חסר ⇒ «| עורך דין» לא נחתך ⇒ legal
    return len(s) <= 70 and bool(_SIG_TITLE.search(s)) and not _SIG_MINE.search(s)


# critic סבב 128: ספק inbound שמעביר HTML (מייל HTML-only) — הציטוט שלנו ב-<blockquote>/«&gt;»/divRplyFwdMsg
# לא הוסר ⇒ «השיבו "פריסה"» מהתזכורת שלנו ⇒ «ok» סווג plan_request. מזהים HTML רק לפי תגים מוכרים.
# critic סבב 129: תג אמיתי = שם-תג ואחריו מיד «>» / «/>» או מאפיין (x=) — אחרת «אם a<b אז b>a» זוהה כ-HTML
# והטקסט שבין «<b» ל-«>» נמחק.
_HTML_HINT = re.compile(r"</?\s*(?:br|div|p|blockquote|html|body|span|b|i|hr|table|font)(?:\s*/?>|\s+[a-z-]+\s*=)"
                        r"|&(?:gt|lt|amp|quot|nbsp);", re.I)
_HTML_QUOTE_START = re.compile(
    r"<blockquote\b|<div[^>]*\bclass=[\"']?[^\"'>]*\b(?:gmail_quote|yahoo_quoted|moz-cite-prefix)\b"
    r"|<div[^>]*\bid=[\"']?(?:divRplyFwdMsg|appendonsend|mail-editor-reference-message-container)\b"
    r"|<hr\b[^>]*>\s*(?=<div[^>]*\bid=[\"']?divRplyFwdMsg)", re.I)


def _html_to_text(t: str) -> str:
    import html as _html
    m = _HTML_QUOTE_START.search(t)
    if m:
        t = t[:m.start()]
    t = re.sub(r"(?is)<(?:script|style|head)\b.*?</(?:script|style|head)\s*>", " ", t)
    t = re.sub(r"(?i)<\s*br\s*/?\s*>|</\s*(?:div|p|li|tr|h\d)\s*>|<\s*hr\b[^>]*>", "\n", t)
    t = re.sub(r"<[^>]*>", "", t)
    return _html.unescape(t).replace("\xa0", " ")


# לולאת גבי מנוע 17.11 (המשך לסבב 128): לקוח שעונה **מתחת** לציטוט (bottom-posting — נפוץ בטלפונים ובמייל
# «מסורתי») ⇒ החיתוך בראש הציטוט השאיר גוף ריק ⇒ «הסר אותי» שנכתב מתחת ל-«> התזכורת שלנו» / ל-<blockquote> נבלע
# בשקט (ignored). גיבוי — רק כשהחיתוך הרגיל ריק: הטקסט שמחוץ לציטוט **המסומן** (שורות «>» / <blockquote>).
# מקור לא מסומן (Outlook: «From:», «-----Original Message-----», divRplyFwdMsg) ⇒ אין גיבוי: מה שאחריו הוא
# ההודעה שלנו בלי סימון (כולל שורת ההסרה), ואסור לסווג אותה כאילו הלקוח כתב.
_UNMARKED_ORIGINAL = re.compile(r"^(?:-{2,}\s*original message|-{2,}\s*הודעה מקורית|from:\s|מאת:\s)", re.I)
_HTML_UNMARKED = re.compile(
    r"<div[^>]*\bid=[\"']?(?:divRplyFwdMsg|appendonsend|mail-editor-reference-message-container)\b", re.I)


def _below_quote(text: str) -> str:
    if _HTML_HINT.search(text):
        if _HTML_UNMARKED.search(text):
            return ""
        import html as _html
        t = re.sub(r"(?is)<blockquote\b.*?</blockquote\s*>", "\n", text)
        t = re.sub(r"(?is)<(?:script|style|head)\b.*?</(?:script|style|head)\s*>", " ", t)
        t = re.sub(r"(?i)<\s*br\s*/?\s*>|</\s*(?:div|p|li|tr|h\d)\s*>|<\s*hr\b[^>]*>", "\n", t)
        text = _html.unescape(re.sub(r"<[^>]*>", "", t)).replace("\xa0", " ")
    out: list[str] = []
    for line in text.replace("\r\n", "\n").split("\n"):
        s = _BIDI.sub("", line).strip()
        if _UNMARKED_ORIGINAL.match(s) or s == "--":
            break
        if s.startswith(">") or _is_quote_header(s):
            continue
        if s and any(o.strip() for o in out) and _is_signature_line(s):
            break
        out.append(line)
    return "\n".join(out).strip()


def strip_reply(text: str) -> str:
    """רק מה שהלקוח כתב: בלי הציטוט של ההודעה שלנו ובלי חתימת '-- '."""
    top = _strip_top(text or "")
    return top or _below_quote(text or "")


def _strip_top(text: str) -> str:
    out = []
    if _HTML_HINT.search(text):
        text = _html_to_text(text)
    lines = text.replace("\r\n", "\n").split("\n")
    for i, line in enumerate(lines):
        s = _BIDI.sub("", line).strip()
        nxt = _BIDI.sub("", lines[i + 1]).strip() if i + 1 < len(lines) else ""
        wrapped = bool(s and nxt and re.match(r"^(?:on\s|בתאריך\s|ב-?\d)", s, re.I)
                       and _QUOTE_HDR_TAIL.search(s + " " + nxt))   # כותרת שנשברה לשתי שורות
        if _is_quote_header(s) or wrapped:
            break
        if s and any(o.strip() for o in out) and _is_signature_line(s):   # critic סבב 124: חתימת הלקוח
            out.extend(_protective_tail(lines[i + 1:]))
            break
        out.append(line)
    return "\n".join(out).strip()


def _protective_tail(rest: list[str]) -> list[str]:
    """לולאה 18.11 (המשך לסבבים 124/139): אחרי חתימה מזוהה («עו״ד דנה כהן») נחתך הכול — גם «אל תשלחו יותר
    הודעות» / «I'm only 15» שנכתבו **אחרי** החתימה (נ.ב.). שאר השורות (עד הציטוט) נשמרות רק אם יש בהן כוונה
    מגינה; שורות חתימה/סודיות/פרטי קשר עצמן נשארות מחוץ לסיווג (ההכרעה של 124/139 נשמרת)."""
    from .conversation import _FLOOR_INTENTS, Intent, detect

    tail: list[str] = []
    for line in rest:
        s = _BIDI.sub("", line).strip()
        if _is_quote_header(s):
            break
        if s and not _is_signature_line(s):
            tail.append(line)
    text = "\n".join(tail).strip()
    # בלי LEGAL: שורות החתימה («משרד עורכי דין…», «ושות׳») הן בדיוק מקור ה-legal-שווא שסבבים 124/139 סגרו
    return tail if text and set(detect(text)) & (set(_FLOOR_INTENTS) - {Intent.LEGAL}) else []
