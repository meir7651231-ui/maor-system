"""BACKLOG גבייה סוכן #2: תשלום חלקי ⇒ סכום התזכורת = היתרה בפועל (amountDueVat), לא הסכום המקורי."""


def _body(svc, rid):
    return svc.preview(rid)["messages"][0]["body"]


def test_reminder_shows_balance_not_original_total(svc, fake_gi):
    fake_gi.docs[0]["amount"] = "1200.00"
    fake_gi.docs[0]["amountDueVat"] = "450.00"          # שולמו 750 מתוך 1,200
    svc.sync()
    rid = next(i for i in svc.plan() if svc._reminder(i)["invoice_id"] == 1)
    body = _body(svc, rid)
    assert "450" in body and "1,200" not in body


def test_partial_payment_after_approval_rebuilds_with_balance(svc, fake_gi):
    svc.sync()
    rid = next(i for i in svc.plan() if svc._reminder(i)["invoice_id"] == 1)
    svc.approve(rid)
    fake_gi.docs[0]["amountDueVat"] = "450.00"          # תשלום חלקי בין האישור לשליחה
    svc.dispatch()
    sent = [m for m in svc.sender.sent if m["to"] == "972501234567"]
    assert sent == []                                    # לא נשלח הסכום הישן
    r = svc._reminder(rid)
    assert r["block_reason"] == "amount_changed" and "450" in r["body"] and "1,200" not in r["body"]
    svc.approve(rid)
    svc.dispatch()
    sent = [m for m in svc.sender.sent if m["to"] == "972501234567"]
    assert sent and "450" in sent[0]["body"] and "1,200" not in sent[0]["body"]


def test_dashboard_and_open_list_show_balance(svc, fake_gi):
    fake_gi.docs[0]["amountDueVat"] = "450.00"
    svc.sync()
    row = next(x for x in svc.open_list()["pending"] + svc.open_list()["confirmed"]
               if x["number"] == "1001")
    assert row["amount_agorot"] == 45000
