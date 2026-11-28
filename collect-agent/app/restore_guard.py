"""critic סבב 175 (🔴): שחזור גיבוי החזיר את ה-DB **כולו** למצב רגע הגיבוי — כולל ``suppressions`` ו-``opted_out``.
לקוח שביקש הסרה אחרי הגיבוי חזר להיות «לא מוסר» וקיבל SMS ומייל; אותו דבר למחיקה לפי בקשה (DSR) ולהתממה.

שתי שכבות:
  1. **יומן הסרות מחוץ ל-DB** (``OPTOUT_LEDGER``, append-only, 0600, **גיבובים בלבד** — כמו ``suppressions``):
     כל ``suppress()`` נרשם גם בו, וכל שחזור מחיל אותו מחדש על ה-DB המשוחזר (וגם ``opted_out`` ללקוחות שהכתובת
     שלהם ביומן). היומן לא נכלל בגיבוי ולכן שורד אותו.
  2. **עצירת שליחה אחרי שחזור** (``restore_hold``): DB משוחזר עולה עם שליחה ללקוחות עצורה + התראה בולטת לבעל
     העסק, עד שהוא מאשר (בתיעוד) שהחיל מחדש הסרות/מחיקות מאז הגיבוי. היומן מכסה הסרות; מחיקות DSR והתממה
     אינן ביומן (הוא לא מחזיק PII) — ולכן העצירה נשארת גם כשהיומן הוחל.
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path

HOLD_INTENT = "restore_hold"
NOTE_MIN = 5

_SCHEMA = ("CREATE TABLE IF NOT EXISTS restore_hold (id INTEGER PRIMARY KEY, restored_at TEXT NOT NULL, "
           "source TEXT, ledger_applied INTEGER NOT NULL DEFAULT 0, released_at TEXT, released_by TEXT, note TEXT)")


# ---------- יומן ההסרות ----------
def _append_line(path: str | Path, row: dict) -> None:
    """שורת JSON אחת. O_APPEND (לא דורס), 0600, בלי ללכת אחרי symlink."""
    line = json.dumps(row, ensure_ascii=False) + "\n"
    fd = os.open(path, os.O_CREAT | os.O_APPEND | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0), 0o600)
    try:
        os.write(fd, line.encode())
        os.fsync(fd)
    finally:
        os.close(fd)


def ledger_append(path: str | Path, h: str, channel: str, reason: str, at: str) -> None:
    """שורת JSON אחת לכל הסרה. גיבוב בלבד — אין כתובת גלויה."""
    _append_line(path, {"hash": h, "channel": channel, "reason": reason, "at": at})


def ledger_read(path: str | Path) -> list[dict]:
    p = Path(path)
    if not p.exists():
        return []
    out = []
    for line in p.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except ValueError:
            continue   # שורה חלקית (כתיבה שנקטעה) — מדלגים; שאר היומן תקף
        if isinstance(row, dict) and isinstance(row.get("hash"), str) and row.get("channel") in ("sms", "email"):
            out.append(row)
    return out


def ledger_apply(conn, rows: list[dict]) -> int:
    """מחיל את היומן על DB (משוחזר): suppressions + opted_out ללקוח שהכתובת שלו ביומן. מחזיר כמה הסרות חדשות."""
    from .service import CollectService  # מאוחר: service מייבא את המודול הזה
    if not rows:
        return 0
    before = conn.execute("SELECT COUNT(*) FROM suppressions").fetchone()[0]
    conn.executemany("INSERT OR IGNORE INTO suppressions(hash,channel,reason,created_at) VALUES(?,?,?,?)",
                     [(r["hash"], r["channel"], r.get("reason") or "ledger", r.get("at") or "") for r in rows])
    hashes = {(r["channel"], r["hash"]) for r in rows}
    for cid, phone, email in conn.execute("SELECT id, phone, email FROM customers WHERE opted_out=0").fetchall():
        if (phone and ("sms", CollectService.addr_hash("sms", phone)) in hashes) or \
                (email and ("email", CollectService.addr_hash("email", email)) in hashes):
            conn.execute("UPDATE customers SET opted_out=1 WHERE id=?", (cid,))
    conn.commit()
    return conn.execute("SELECT COUNT(*) FROM suppressions").fetchone()[0] - before


# ---------- יומן השלילות (מבקר 288) ----------
# שחזור מחזיר את ה-DB כולו לרגע הגיבוי — גם **שלילות הרשאה** שנעשו אחריו: עובדת שהושבתה נכנסת שוב, בעלים שהורד
# חוזר לבעלים, סוד-מסירה שהוחלף (רוטציה = דליפה) מתקבל שוב, וטוקן זכאות שנלכד לפני ביטול המנוי מחזיר אותו ל-active.
# לכן כל שלילה נרשמת גם ביומן append-only **מחוץ ל-DB** (כמו OPTOUT_LEDGER; לא נכלל בגיבוי ושורד אותו):
#   user_off / user_on        השבתה / הפעלה-מחדש של משתמש (מפתח = גיבוב המייל)
#   user_demote / user_promote הורדה מבעלים / מינוי לבעלים
#   handoff_secret            סוד-מסירה שבוטל (רוטציה/ניתוק; מפתח = גיבוב הסוד — לא הסוד)
#   ent_iat                   iat של זכאות שבה השתנה המצב (מונוטוניות מחוץ ל-DB)
#   cust_hold                 מבקר 289: השהיה מגנה ללקוח (קטין/פטירה/חדלות/מחלוקת/הבטחה/עצירה משפטית) או שחרורה
#                             (מפתח = גיבוב מזהה הלקוח; שדות pause/disputed/legal — בלי הערה ובלי PII)
# בשחזור — השבתות/הורדות מוחלות מחדש; סודות וזכאויות נבדקים מול היומן בזמן ריצה (verify / ingest).
REVOCATION_ENV = "REVOCATION_LEDGER"
_REV_KINDS = ("user_off", "user_on", "user_demote", "user_promote", "handoff_secret", "ent_iat", "cust_hold")


def revocation_path(env=None) -> str | None:
    """``REVOCATION_LEDGER``; בלעדיו — ליד ``OPTOUT_LEDGER`` (``<optout>.revocations``), כדי שפריסה שכבר מגדירה את
    יומן ההסרות (חובה בנתונים אמיתיים) מקבלת גם את יומן השלילות בלי הגדרה נוספת. בלי שניהם ⇒ None."""
    e = os.environ if env is None else env
    p = (e.get(REVOCATION_ENV) or "").strip()
    if p:
        return p
    o = (e.get("OPTOUT_LEDGER") or "").strip()
    return f"{o}.revocations" if o else None


def user_key(email: str) -> str:
    return hashlib.sha256(f"user:{(email or '').strip().lower()}".encode()).hexdigest()


def customer_key(external_id: str | None, cid: int) -> str:
    """מזהה יציב בין גיבוי לשחזור: external_id (ממערכת החשבוניות), ובלעדיו המזהה הפנימי. גיבוב בלבד."""
    base = f"ext:{external_id}" if external_id else f"id:{cid}"
    return hashlib.sha256(f"cust:{base}".encode()).hexdigest()


def secret_key(secret: str) -> str:
    return hashlib.sha256(f"handoff:{secret}".encode()).hexdigest()


def revoke(kind: str, key: str, *, at: str, env=None, **extra) -> str:
    """רושם שלילה. מחזיר ``ok`` / ``off`` (אין יומן מוגדר) / ``failed`` (כשל כתיבה — השלילה ב-DB כבר בוצעה;
    הקורא רושם audit). גיבובים בלבד."""
    if kind not in _REV_KINDS:
        raise ValueError(kind)
    path = revocation_path(env)
    if not path:
        return "off"
    try:
        _append_line(path, {"kind": kind, "key": key, "at": at, **extra})
    except OSError:
        return "failed"
    return "ok"


def revocations_read(env=None) -> list[dict]:
    path = revocation_path(env)
    if not path or not Path(path).exists():
        return []
    out = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except ValueError:
            continue   # שורה חלקית — מדלגים
        if isinstance(row, dict) and row.get("kind") in _REV_KINDS and isinstance(row.get("key"), str):
            out.append(row)
    return out


def secret_revoked(secret: str, env=None) -> bool:
    k = secret_key(secret)
    return any(r["kind"] == "handoff_secret" and r["key"] == k for r in revocations_read(env))


def max_entitlement_iat(env=None) -> int | None:
    vals = [r.get("iat") for r in revocations_read(env) if r["kind"] == "ent_iat"]
    vals = [v for v in vals if isinstance(v, int) and not isinstance(v, bool)]
    return max(vals) if vals else None


def revocations_apply(conn, rows: list[dict]) -> dict:
    """מחיל השבתות/הורדות על DB משוחזר — לפי **המצב האחרון** ביומן לכל משתמש (הפעלה-מחדש אחרי השבתה מבטלת אותה).
    לא משבית/מוריד את בעל העסק הפעיל האחרון (אף אחד לא ישחרר את העצירה) — נספר ב-``skipped``.
    מחזיר {users_off, users_demoted, skipped, secrets}."""
    res = {"users_off": 0, "users_demoted": 0, "skipped": 0,
           "secrets": sum(1 for r in rows if r["kind"] == "handoff_secret")}
    if not conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='users'").fetchone():
        return res
    off: dict[str, bool] = {}
    demote: dict[str, bool] = {}
    for r in rows:
        if r["kind"] in ("user_off", "user_on"):
            off[r["key"]] = r["kind"] == "user_off"
        elif r["kind"] in ("user_demote", "user_promote"):
            demote[r["key"]] = r["kind"] == "user_demote"
    if not any(off.values()) and not any(demote.values()):
        return res

    def last_owner(uid: int) -> bool:
        return conn.execute("SELECT COUNT(*) FROM users WHERE role='owner' AND active=1 AND id<>?",
                            (uid,)).fetchone()[0] == 0

    for uid, email, role, act in conn.execute("SELECT id, email, role, active FROM users ORDER BY id").fetchall():
        k = user_key(email)
        if act and off.get(k):
            if role == "owner" and last_owner(uid):
                res["skipped"] += 1
                continue
            conn.execute("UPDATE users SET active=0 WHERE id=?", (uid,))
            conn.execute("DELETE FROM sessions WHERE user_id=?", (uid,))
            res["users_off"] += 1
        elif act and role == "owner" and demote.get(k):
            if last_owner(uid):
                res["skipped"] += 1
                continue
            conn.execute("UPDATE users SET role='staff' WHERE id=?", (uid,))
            conn.execute("DELETE FROM sessions WHERE user_id=?", (uid,))
            res["users_demoted"] += 1
    if (res["users_off"] or res["users_demoted"] or res["skipped"]) and _cols(conn, "audit"):
        conn.execute("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                     (datetime.now().isoformat(timespec="seconds"), "system", "restore_revocations",
                      json.dumps(res)))
    conn.commit()
    return res


# ---------- השהיות מגנות (מבקר 289) ----------
LEGAL_RESTORED = "עצירה משפטית שהוצבה אחרי הגיבוי — הוחזרה מיומן השלילות; הסיבה המקורית לא נשמרה ביומן"


_HOLD_SEL = {True: "SELECT id, external_id, paused_reason, disputed, legal_hold FROM customers",
             False: "SELECT id, external_id, paused_reason, disputed FROM customers"}


def holds_apply(conn, rows: list[dict]) -> dict:
    """מבקר 289🟠/🟡: השהיה מגנה שהוצבה אחרי הגיבוי (קטין/פטירה/מחלוקת/עצירה משפטית/הבטחה) נמחקה בשחזור ⇒ אחרי
    שחרור העצירה נבנתה תזכורת ללקוחה, והתממה של תיק משפטי לא נחסמה. מחיל מחדש לפי **המצב האחרון** ביומן לכל לקוח
    (שחרור/«חידוש» אחרי ההשהיה מבטל אותה). רק מחזק — לא מנקה השהיה שקיימת ב-DB המשוחזר; לא דורס השהיה קשה
    בהשהיה רכה. תזכורות פעילות של לקוח שהושהה מחדש מבוטלות. מחזיר {holds, legal}."""
    res = {"holds": 0, "legal": 0}
    if not rows or not conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='customers'").fetchone():
        return res
    state: dict[str, dict] = {}
    for r in rows:
        if r["kind"] != "cust_hold":
            continue
        st = state.setdefault(r["key"], {})
        for f in ("pause", "disputed", "legal"):
            if f in r:
                st[f] = r[f]
    if not state:
        return res
    from .inbox import _keeps_old_pause
    from .service import ACTIVE
    has_legal = "legal_hold" in _cols(conn, "customers")
    held: list[int] = []
    today = datetime.now().date().isoformat()
    for row in conn.execute(_HOLD_SEL[has_legal]).fetchall():
        st = state.get(customer_key(row[1], row[0]))
        if not st:
            continue
        cid, cur_pause, cur_disp = row[0], row[2] or "", row[3]
        changed = False
        p = st.get("pause")
        if isinstance(p, str) and ":until=" in p and p.split(":until=", 1)[1] <= today:
            p = None   # הבטחה שמועדה עבר — release_expired_pauses היה משחרר אותה ממילא
        if isinstance(p, str) and p and p != cur_pause and not _keeps_old_pause(cur_pause, p):
            conn.execute("UPDATE customers SET paused_reason=? WHERE id=?", (p, cid))
            changed = True
        if st.get("disputed") is True and not cur_disp:
            conn.execute("UPDATE customers SET disputed=1 WHERE id=?", (cid,))
            changed = True
        if has_legal and st.get("legal") is True and not row[4]:
            conn.execute("UPDATE customers SET legal_hold=? WHERE id=?", (LEGAL_RESTORED, cid))
            res["legal"] += 1
        if changed:
            held.append(cid)
    if held and _cols(conn, "reminders"):
        for cid in held:   # כמו _cancel_invoice: גם תזכורת מאוחדת שכוללת חשבונית של הלקוח
            conn.execute("UPDATE reminders SET status='cancelled', block_reason='restored_hold' WHERE status IN (?,?) "
                         "AND (invoice_id IN (SELECT id FROM invoices WHERE customer_id=?) OR id IN "
                         "(SELECT reminder_id FROM reminder_invoices WHERE invoice_id IN "
                         "(SELECT id FROM invoices WHERE customer_id=?)))", (*ACTIVE, cid, cid))
    res["holds"] = len(held)
    if (res["holds"] or res["legal"]) and _cols(conn, "audit"):
        conn.execute("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                     (datetime.now().isoformat(timespec="seconds"), "system", "restore_holds", json.dumps(res)))
    conn.commit()
    return res


# ---------- עצירה אחרי שחזור ----------
def mark_restored(conn, *, at: str, source: str, ledger_rows: int, applied: int,
                  revocations: dict | None = None) -> None:
    conn.execute(_SCHEMA)
    conn.execute("INSERT INTO restore_hold(restored_at, source, ledger_applied) VALUES(?,?,?)",
                 (at, Path(source).name, applied))
    n_rem, n_dr = _reapprove_queued(conn, at)
    orbit = _unverify_orbit(conn, at)
    has_msgs = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='messages'").fetchone()
    if has_msgs:
        led = (f"יומן ההסרות הוחל: {applied} הסרות שנוספו אחרי הגיבוי הוחזרו. " if ledger_rows else
               "⚠️ אין יומן הסרות (OPTOUT_LEDGER) — הסרות שהתבקשו אחרי הגיבוי לא הוחזרו אוטומטית. ")
        req = (f"{n_rem} תזכורות ו-{n_dr} תשובות שאושרו לפני הגיבוי חזרו לאישור — ייתכן שחלקן כבר יצאו ללקוחות "
               "אחרי הגיבוי; בדקו ביומן היוצאים לפני שמאשרים שוב. " if n_rem or n_dr else "")
        orb = ("מצב המנוי לגבי באורביט יאומת מחדש — אחרי החידוש פתחו את גבי מתוך אורביט פעם אחת, אחרת התזכורות "
               "יישארו עצורות. " if orbit else "")
        if revocations is None:
            rev = ("⚠️ אין יומן שלילות (REVOCATION_LEDGER) — עובדות שהושבתו או הורדו מבעלים אחרי הגיבוי חזרו "
                   "להרשאה הקודמת, וסוד-מסירה של אורביט שהוחלף אחריו עובד שוב: בדקו במסך «צוות ותפקידים» "
                   "והנפיקו סוד-מסירה חדש. השהיות קטין/פטירה/מחלוקת ועצירות משפטיות שהוצבו אחרי הגיבוי נמחקו — "
                   "סמנו אותן מחדש לפני החידוש. ")
        else:
            n_u = revocations.get("users_off", 0) + revocations.get("users_demoted", 0)
            rev = (f"יומן השלילות הוחל: {n_u} השבתות/הורדות הרשאה מאז הגיבוי הוחזרו. " if n_u else "")
            n_h, n_l = revocations.get("holds", 0), revocations.get("legal", 0)
            if n_h or n_l:
                rev += (f"השהיות מגנות מאז הגיבוי הוחזרו: {n_h} השהיות (קטין/פטירה/מחלוקת/הבטחה) ו-{n_l} עצירות "
                        "משפטיות. ")
            if revocations.get("skipped"):
                rev += (f"⚠️ {revocations['skipped']} לא הוחלו כי אחרת לא היה נשאר בעל עסק פעיל — "
                        "בדקו במסך «צוות ותפקידים». ")
        conn.execute("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,message_id,"
                     "created_at) VALUES(NULL,'system','owner',?,?,1,?,?)",
                     ("🛑 המערכת שוחזרה מגיבוי — כל השליחה ללקוחות עצורה. " + led + req + orb + rev +
                      "לפני חידוש: החילו מחדש כל בקשת הסרה, מחיקה או התממה שהתקבלה מאז הגיבוי, ואז אשרו את החידוש "
                      "עם תיעוד של מה שבדקתם.", HOLD_INTENT, f"{HOLD_INTENT}:{at}", at))
    conn.commit()


_PRAGMA = {t: f"PRAGMA table_info({t})" for t in ("reminders", "drafts", "audit", "customers")}   # רשימה סגורה, בלי קלט


def _cols(conn, table: str) -> set[str]:
    sql = _PRAGMA[table]
    return {r[1] for r in conn.execute(sql).fetchall()}


def _reapprove_queued(conn, at: str) -> tuple[int, int]:
    """מבקר 286🟠: הגיבוי לא יודע מה יצא אחריו. תזכורת/תשובה שהייתה `approved`/`sending` ברגע הגיבוי ויצאה אחריו
    חוזרת בשחזור ל-`approved` (ו-`last_sent_at` ריק ⇒ גם מרווח 72 השעות לא עוצר) ⇒ אחרי שחרור העצירה נשלחה **שוב**.
    לכן בשחזור כל מה שבתור חוזר לאישור מחדש (כמו approval_expired) — בעל העסק מחליט, מול יומן היוצאים, מה לשלוח.
    מחזיר (תזכורות, טיוטות) שהוחזרו. בלי הטבלאות (DB ישן/ריק) ⇒ (0, 0)."""
    n_rem = n_dr = 0
    rc = _cols(conn, "reminders")
    if rc:
        n_rem = conn.execute("UPDATE reminders SET status='pending_approval', block_reason='restored_reapproval' "
                             "WHERE status IN ('approved','sending')").rowcount
        if {"approved_hash", "approved_version", "approved_by"} <= rc:   # DB לפני ר-12 ⇒ אין עמודות אישור
            conn.execute("UPDATE reminders SET approved_hash=NULL, approved_version=NULL, approved_by=NULL "
                         "WHERE block_reason='restored_reapproval' AND status='pending_approval'")
    if _cols(conn, "drafts"):
        n_dr = conn.execute("UPDATE drafts SET status='pending_approval' "
                            "WHERE status IN ('approved','sending')").rowcount
    if (n_rem or n_dr) and _cols(conn, "audit"):
        conn.execute("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                     (at, "system", "restore_reapproval",
                      json.dumps({"reminders": n_rem, "drafts": n_dr})))
    return n_rem, n_dr


def _unverify_orbit(conn, at: str) -> bool:
    """מבקר 287🟠: הזכאות מאורביט שוחזרה למצב רגע הגיבוי (מנוי שבוטל אחריו חוזר ל-active) ⇒ מסמנים «לא מאומתת
    מאז השחזור»; רק זכאות שנחתמה אחרי השחזור מחזירה שליחה. audit בלי PII."""
    from . import orbit_entitlement
    try:
        floor = int(datetime.fromisoformat(at).timestamp())
    except ValueError:
        floor = int(datetime.now().timestamp())
    if not orbit_entitlement.mark_restored(conn, floor):
        return False
    if _cols(conn, "audit"):
        conn.execute("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                     (at, "system", "restore_orbit_unverified", json.dumps({"floor": floor})))
    return True


def active(db) -> dict | None:
    """השחזור האחרון שלא שוחרר (או None). בלי הטבלה ⇒ מעולם לא שוחזר."""
    if not db.one("SELECT 1 FROM sqlite_master WHERE type='table' AND name='restore_hold'"):
        return None
    r = db.one("SELECT * FROM restore_hold WHERE released_at IS NULL ORDER BY id DESC LIMIT 1")
    return dict(r) if r else None


def release(db, *, actor: str, note: str, at: str) -> dict:
    hold = active(db)
    if hold is None:
        raise KeyError("אין עצירת שחזור פעילה")
    if len((note or "").strip()) < NOTE_MIN:
        raise ValueError("נדרש תיעוד (לפחות 5 תווים) של ההסרות/המחיקות שהוחלו מחדש מאז הגיבוי")
    db.x("UPDATE restore_hold SET released_at=?, released_by=?, note=? WHERE released_at IS NULL",
         (at, actor, note.strip()[:500]))
    db.x("UPDATE messages SET needs_owner=0 WHERE intent=? AND needs_owner=1", (HOLD_INTENT,))
    return {**hold, "released_at": at, "released_by": actor}
