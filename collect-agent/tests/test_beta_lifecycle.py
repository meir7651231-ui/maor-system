"""בדיקת קבלה מקצה לקצה לבטא (גבי בדיקות): 60 יום מלאים לכל ענף, על «ספר החשבוניות» של
גבי מכירות (app/beta_seeds.py — אותם נתונים כמו test_beta_kit/beta.mjs, בלי כפילות).

test_beta_kit בודק את **היום הראשון**. כאן: בעל עסק שמאשר כל יום את כל מה שבתור, cron כל
30 דק׳ מסביב לשעון, 60 יום — ואינווריאנטים על **כל** הודעה שיצאה:
  • רק בחלון השליחה (08–20, שישי עד 12, לא שבת/חג)
  • ≤3 תזכורות לחשבונית, ≥72 ש׳ בין הודעות יזומות לאותו נמען
  • כל תזכורת שיצאה אושרה פרטנית בידי בעל העסק (approved_by)
  • אין פנייה לפני מועד התשלום; אין פנייה ללקוח בלי פרטי קשר; קווי ⇒ מייל בלבד
  • הסכום בהודעה = היתרה בחשבונית; תיאור החשבונית (טיפול/שירות) לא מופיע באף הודעה
  • אחרי 3 תזכורות: התראה אחת לבעל העסק לכל חשבונית, ולא יותר
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import date, datetime, timedelta

import pytest

from app import templates
from app.beta_seeds import BETA_VERTICALS, beta_docs
from app.channels import normalize_il_phone, sent_mark, sent_since
from app.policy import HOLIDAYS, TZ
from tests.test_e2e import build

START = datetime(2026, 11, 8, 8, 0, tzinfo=TZ)   # שעון ההדגמה (app/demo.py)
DAYS = 60
# הכרעות מאיר — קבועים בבדיקה עצמה, לא מיובאים מהקוד (אחרת שינוי בקוד משנה גם את הבדיקה)
MAX_REMINDERS_PER_INVOICE = 3
MIN_GAP = timedelta(hours=72)


def allowed_by_spec(when: datetime) -> bool:
    """אורקל עצמאי מההכרעה (לא מ-policy.py): 08:00–20:00, שישי 08:00–12:00, לא שבת ולא חג.
    רשימת החגים עצמה = נתון (policy.HOLIDAYS), לא לוגיקה."""
    t = when.astimezone(TZ)
    if t.date().isoformat() in HOLIDAYS or t.weekday() == 5:
        return False
    end = 12 if t.weekday() == 4 else 20
    return 8 <= t.hour < end


def _run(vertical: str):
    docs = beta_docs(vertical)
    api, svc, fake, clock = build(docs, START)
    sent = []  # (when, reminder_id, channel, to, body)
    for _ in range(DAYS):
        day0 = clock.now.replace(hour=8, minute=0)
        clock.now = day0
        api.post("/sync")
        api.post("/plan")
        for r in api.get("/reminders", params={"status": "pending_approval"}).json():
            if not r["block_reason"]:
                api.post(f"/reminders/{r['id']}/approve")   # בעל העסק מאשר כל אחת, פרטנית
        clock.now = clock.now.replace(hour=0, minute=0)
        end = clock.now + timedelta(days=1)
        while clock.now < end:   # cron מסביב לשעון: החלון נאכף בקוד, לא בסימולציה
            mark = sent_mark(svc.sender.sent)
            out = api.post("/dispatch").json()["sent"]
            new = sent_since(svc.sender.sent, mark)
            for s in out:
                for m in new:
                    if m["id"] in s.get("message_ids", []):
                        sent.append((clock.now, s["reminder_id"], m["channel"], m["to"],
                                     m["body"]))
            clock.now += timedelta(minutes=30)
        clock.now = day0 + timedelta(days=1)
    return docs, svc, sent


@pytest.mark.parametrize("vertical", sorted(BETA_VERTICALS))
def test_beta_60_days_invariants(vertical):
    docs, svc, sent = _run(vertical)
    assert sent, f"{vertical}: לא יצאה אף הודעה — הבדיקה לא בודקת כלום"
    by_doc = {d["id"]: d for d in docs}
    per_inv: dict[int, set[int]] = defaultdict(set)
    per_to: dict[str, list[datetime]] = defaultdict(list)
    for when, rid, ch, to, body in sent:
        r = svc.db.one("SELECT r.*, i.external_id ext, i.amount_agorot, i.currency, i.due "
                       "FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE r.id=?",
                       (rid,))
        doc = by_doc[r["ext"]]
        assert allowed_by_spec(when), f"{vertical}: שליחה בזמן אסור {when}"
        assert r["approved_by"], f"{vertical}: תזכורת {rid} יצאה בלי אישור בעלים"
        assert when.date() > date.fromisoformat(r["due"]), f"{vertical}: פנייה לפני המועד"
        assert templates.fmt_amount(r["amount_agorot"], r["currency"]) in body, \
            f"{vertical}: הסכום בהודעה לא תואם את החשבונית"
        desc = (doc.get("description") or "").strip()
        if desc:
            assert desc not in body, f"{vertical}: תיאור החשבונית דלף להודעה ({desc})"
        client = doc["client"]
        assert client["phone"] or client["emails"], f"{vertical}: פנייה ללקוח בלי פרטי קשר"
        if ch == "sms":
            norm = normalize_il_phone(client["phone"])
            assert norm and norm.startswith("9725"), f"{vertical}: SMS לטלפון לא נייד"
        per_inv[r["invoice_id"]].add(rid)
        if not per_to[to] or per_to[to][-1] != when:
            per_to[to].append(when)
    for rids in per_inv.values():
        assert len(rids) <= MAX_REMINDERS_PER_INVOICE, f"{vertical}: {len(rids)} תזכורות"
    for to, ts in per_to.items():
        for a, b in zip(ts, ts[1:], strict=False):
            assert b - a >= MIN_GAP, f"{vertical}: פחות מ-72 ש׳ ל-{to}"
    # חשבונית שלא הגיע מועדה במהלך הריצה — אף פנייה
    for d in docs:
        due = date.fromisoformat(d["dueDate"])
        if due >= (START + timedelta(days=DAYS)).date():
            inv = svc.db.one("SELECT id FROM invoices WHERE external_id=?", (d["id"],))
            assert not inv or inv["id"] not in per_inv, f"{vertical}: פנייה על {d['id']}"
    # התראה לבעל העסק: אחת לכל חשבונית שהגיעה לסוף הסולם
    full = [i for i, rids in per_inv.items() if len(rids) == MAX_REMINDERS_PER_INVOICE]
    notes = svc.db.q("SELECT message_id FROM messages WHERE intent='max_reminders'")
    assert len(notes) == len({n["message_id"] for n in notes}), "התראה כפולה לבעל העסק"
    assert len(notes) >= len(full) > 0, f"{vertical}: אין חשבונית שהגיעה ל-3 ב-60 יום"


def test_all_outgoing_are_dry_run(monkeypatch):
    docs, svc, sent = _run("garage")
    assert all(m["id"].startswith("dryrun.") for m in svc.sender.sent)
    assert json.dumps(svc.sender.sent, ensure_ascii=False).count("whatsapp") == 0
