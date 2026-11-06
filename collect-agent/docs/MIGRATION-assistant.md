# נדידה: `app/assistant.py` ⇒ `app/conversation.py` + `app/inbox.py` (6.11.2026)

**למה הוסר:** הסיווג הישן (7 כוונות, regex בודד) היה מקור הבאגים בממצא §3 של המבקר: "עוד" זוהה כ-עו"ד ⇒ מחלוקת,
"הפסק"/"תסירו אותי" לא זוהו, ותשובות יצאו אוטומטית בלי אישור בעל העסק.

**וידוא לפני ההסרה:** `grep -rn assistant` על קוד, סקריפטים, CI, web ו-HTML — הצרכנים היחידים היו
`tests/test_units.py` (4 בדיקות) ו-`tests/test_e2e.py` (3 בדיקות). ‏`service.inbound` כבר עבר ל-`inbox` לפני כן.
כל 17 הטקסטים מהבדיקות הישנות נבדקו מול המנוע החדש ועוברים; הבדיקות הועברו כמות שהן (אותם טקסטים, אותן ציפיות).

| ישן (`assistant`) | חדש |
|---|---|
| `classify(text, llm)` → `Intent` | `conversation.respond(text, ctx, llm=...)` → `Decision.intent` (או `conversation.detect(text, ctx)` לכל הכוונות) |
| `decide(text, business, payment_link)` → `Decision(auto_reply, escalate, stop_reminders)` | `respond(...)` → `Decision(reply=טיוטה, auto_send, escalate: none/normal/urgent, stop: none/pause/permanent, plan, owner_summary, ...)` |
| `Intent`: opt_out, paid_claim, plan_request, how_to_pay, copy_request, dispute, thanks, unknown | אותם ערכים (תואם מחרוזות) + distress, minor, wrong_person, legal, cant_pay, plan_accept, plan_reject, promise, callback, who_is_this, abusive |
| מענה אוטומטי אחרי אישור ראשון | **כל** תשובה = טיוטה ב-`drafts`, יוצאת רק אחרי `approve_draft` (חוץ ממצב `safe_auto` מפורש) |
| `stop_reminders` (ביטול פעילות בלבד) | `paused_reason` דביק + `disputed` / `opted_out`; רק הבטחה עם תאריך משתחררת לבד |
| `LLMClassifier` (פרוטוקול בלבד) | `app/llm.py`: ‏disabled כברירת מחדל, mock בלבד, ‏SafeClassifier עם טשטוש ו-fail-closed |

**לחזרה אחורה (אם יידרש):** `git show 1327d6d:collect-agent/app/assistant.py`.
