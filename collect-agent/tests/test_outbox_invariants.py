"""critic סבב 54: מגן על **כל** מה שיוצא בפועל ללקוח, ולא על כל תבנית בנפרד. מריצים את התרחיש המלא של
ההדגמה (תזכורות SMS ומייל, מאוחדת, לקוח בחו״ל בדולר, תשובות מנוע השיחה, אישור הסרה) ובודקים כל שורה
ביומן היוצאים מול כללי הבעלים:
  • אפשרות הסרה בכל הודעה (חוץ מאישור ההסרה עצמו, שהוא ההודעה האחרונה ללקוח שביקש הסרה)
  • בלי איומים ובלי לחץ (LEGAL_BLACKLIST, על הטקסט בלי הקישורים)
  • נשלח רק בחלון המותר (08:00–20:00, לא שישי אחה״צ, לא שבת, לא חג)
  • SMS מתחיל בשם העסק; במייל שם העסק בנושא או בגוף, וקישורים רק לדומיינים של העסק
  • SMS/מייל בלבד (אין וואטסאפ)
  • רק ללקוחות קיימים (customer_id קיים בטבלת הלקוחות)."""
from __future__ import annotations

import re
from datetime import datetime

import pytest

from app.compliance import LEGAL_BLACKLIST
from app.demo import build_demo_service, run_scenario

_URL = re.compile(r"https?://\S+")


@pytest.fixture(scope="module")
def outbox():
    svc, fake, _ = build_demo_service()
    run_scenario(svc, fake, out=lambda _s: None)
    rows = svc.db.q("SELECT m.*, c.opted_out, c.name cname FROM messages m LEFT JOIN customers c "
                    "ON c.id=m.customer_id WHERE m.direction='out' ORDER BY m.id")
    assert len(rows) >= 8, "התרחיש לא שלח מספיק הודעות כדי שהמגן יהיה משמעותי"
    return svc, rows


def _is_opt_out_ack(row, rows) -> bool:
    last = [r for r in rows if r["customer_id"] == row["customer_id"]][-1]
    return bool(row["opted_out"]) and row["id"] == last["id"]


def test_every_outbound_has_opt_out(outbox):
    svc, rows = outbox
    base = svc.s.public_base_url
    bad = [f"#{r['id']} {r['cname']}: {r['body'][:60]!r}" for r in rows
           if not _is_opt_out_ack(r, rows) and f"{base}/u/" not in r["body"]
           and not re.search(r"הסר|להפסקה|להסרה", r["body"])]
    assert not bad, "הודעה ללקוח בלי אפשרות הסרה:\n" + "\n".join(bad)


def test_no_threats_or_pressure_in_anything_sent(outbox):
    _, rows = outbox
    bad = []
    for r in rows:
        prose = _URL.sub(" ", r["body"])
        bad += [f"#{r['id']} {name}: {r['body'][:60]!r}" for name, pat in LEGAL_BLACKLIST if re.search(pat, prose)]
    assert not bad, "\n".join(bad)


def test_sent_only_inside_the_window(outbox):
    svc, rows = outbox
    bad = [f"#{r['id']} {r['created_at']}: {svc.policy.reason_closed(datetime.fromisoformat(r['created_at']))}"
           for r in rows if not svc.policy.can_send_at(datetime.fromisoformat(r["created_at"]))]
    assert not bad, "\n".join(bad)


def test_channels_business_name_links_and_existing_customers(outbox):
    svc, rows = outbox
    biz = svc.s.business_name
    allowed_hosts = {re.sub(r"^https?://([^/]+).*", r"\1", u) for u in (svc.s.public_base_url, svc.s.payment_link) if u}
    for r in rows:
        assert r["channel"] in ("sms", "email"), r["channel"]
        assert r["cname"] is not None, f"#{r['id']}: הודעה ללקוח שלא קיים"
        subj = (__import__("json").loads(r["payload"] or "{}") or {}).get("subject", "")
        assert biz in r["body"] or biz in subj, f"#{r['id']}: אין שם עסק: {r['body'][:60]!r}"
        if r["channel"] == "sms":
            assert r["body"].startswith(biz), f"#{r['id']}: SMS לא מתחיל בשם העסק"
        for u in _URL.findall(r["body"]):
            host = re.sub(r"^https?://([^/]+).*", r"\1", u)
            assert host in allowed_hosts, f"#{r['id']}: קישור לדומיין זר {host}"
