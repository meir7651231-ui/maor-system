"""הרצת סט ה-eval של מנוע השיחה.

    python3 -m evals.harness                # dev + holdout, דוח מלא
    python3 -m evals.harness evals/dev.jsonl

כל מקרה: טקסט + הקשר (אופציונלי) + ציפיות. ציפייה שלא צוינה — לא נבדקת.
מקרה critical (הסרה, טעות-במספר, מחלוקת, עו"ד, מצוקה, טענת תשלום) חייב לעבור 100%.
בנוסף, על *כל* תשובה שנוצרה רצים המעקות (check_reply) — כל הפרה = כישלון.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from app.conversation import (
    Context,
    Decision,
    Intent,
    OpenInvoice,
    OwnerPolicy,
    State,
    check_reply,
    propose_plan,
    respond,
)

TODAY = date(2026, 11, 8)  # יום ראשון
HERE = Path(__file__).parent


def build_ctx(spec: dict) -> Context:
    total = spec.get("total", 120000)
    pol = OwnerPolicy(approval_mode=spec.get("approval_mode", "all"),
                      auto_offer_plan=spec.get("auto_offer_plan", True),
                      max_installments=spec.get("max_installments", 6))
    base = Context(
        today=TODAY, business=spec.get("business", "סטודיו מאיר"),
        customer_name=spec.get("name", "דנה כהן"),
        invoices=(OpenInvoice(spec.get("number", "1001"), total),),
        payment_link=spec.get("payment_link", "https://pay.example/x"),
        channel=spec.get("channel", "sms"), state=State(spec.get("state", "idle")),
        bot_turns=spec.get("bot_turns", 0), policy=pol)
    if spec.get("offered_n"):
        from dataclasses import replace
        base = replace(base, offered_plan=propose_plan(base, spec["offered_n"]))
    return base


@dataclass
class Result:
    case: dict
    decision: Decision
    failures: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.failures


def check(case: dict, d: Decision, ctx: Context) -> list[str]:
    e, f = case["expect"], []
    if d.intent.value != e["intent"]:
        f.append(f"intent {d.intent.value}≠{e['intent']}")
    for a in e.get("also", []):
        if Intent(a) not in d.all_intents:
            f.append(f"missing {a}")
    for n in e.get("not", []):
        if Intent(n) in d.all_intents:
            f.append(f"unexpected {n}")
    for k in ("escalate", "stop"):
        if k in e and getattr(d, k).value != e[k]:
            f.append(f"{k} {getattr(d, k).value}≠{e[k]}")
    if "state" in e and d.next_state.value != e["state"]:
        f.append(f"state {d.next_state.value}≠{e['state']}")
    if "reply" in e and bool(d.reply) != e["reply"]:
        f.append(f"reply {'yes' if d.reply else 'no'}≠{'yes' if e['reply'] else 'no'}")
    if "reply_has" in e and (not d.reply or e["reply_has"] not in d.reply):
        f.append(f"reply missing '{e['reply_has']}'")
    if "auto_send" in e and d.auto_send != e["auto_send"]:
        f.append(f"auto_send {d.auto_send}")
    if "plan_n" in e and len(d.plan) != e["plan_n"]:
        f.append(f"plan_n {len(d.plan)}≠{e['plan_n']}")
    if d.plan and sum(i.amount_agorot for i in d.plan) != ctx.total_agorot:
        f.append("plan total mismatch")
    if e.get("over_max") and not any("מעל התקרה" in d.owner_summary for _ in [0]):
        f.append("over_max not flagged to owner")
    if "promise_in_days" in e:
        got = (d.promise_date - TODAY).days if d.promise_date else None
        if got != e["promise_in_days"]:
            f.append(f"promise_in_days {got}≠{e['promise_in_days']}")
    if "partial" in e and ("partial" in d.tags) != e["partial"]:
        f.append(f"partial {'partial' in d.tags}≠{e['partial']}")
    for t in e.get("tags", []):
        if t not in d.tags:
            f.append(f"missing tag {t}")
    if e.get("no_pii") and d.reply and (ctx.first_name in d.reply or "₪" in d.reply
                                         or ctx.invoices[0].number in d.reply):
        f.append("PII in reply")
    # מעקות — על כל תשובה
    if d.reply:
        issues = check_reply(d.reply, ctx, d.intent)
        if issues:
            f.append(f"guardrail {issues}")
    if d.guardrail_issues:
        f.append(f"template failed guardrail {d.guardrail_issues}")
    # אינווריאנטים בטיחותיים
    if d.auto_send and ctx.policy.approval_mode != "safe_auto":
        f.append("auto_send in approval_mode=all")
    if d.intent in (Intent.DISPUTE, Intent.LEGAL, Intent.DISTRESS, Intent.MINOR) and d.escalate.value != "urgent":
        f.append("safety intent not urgent")
    if d.intent != Intent.UNKNOWN and not d.owner_summary:
        f.append("no owner summary")
    return f


def run(path: Path) -> list[Result]:
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        case = json.loads(line)
        ctx = build_ctx(case.get("ctx", {}))
        d = respond(case["text"], ctx)
        out.append(Result(case, d, check(case, d, ctx)))
    return out


def report(results: list[Result], name: str) -> dict:
    n = len(results)
    ok = sum(r.ok for r in results)
    crit = [r for r in results if r.case.get("critical")]
    crit_ok = sum(r.ok for r in crit)
    intent_ok = sum(r.decision.intent.value == r.case["expect"]["intent"] for r in results)
    tp, fp, fn = Counter(), Counter(), Counter()
    for r in results:
        g, p = r.case["expect"]["intent"], r.decision.intent.value
        if g == p:
            tp[g] += 1
        else:
            fp[p] += 1
            fn[g] += 1
    per = {}
    for k in sorted(set(tp) | set(fp) | set(fn)):
        prec = tp[k] / (tp[k] + fp[k]) if tp[k] + fp[k] else 0.0
        rec = tp[k] / (tp[k] + fn[k]) if tp[k] + fn[k] else 0.0
        per[k] = (round(prec, 3), round(rec, 3), tp[k] + fn[k])
    # טעות שקטה = המנוע החליט בביטחון על כוונה אחרת (לא "לא ברור ⇒ בעל העסק")
    silent = [r for r in results if r.decision.intent.value not in (r.case["expect"]["intent"], "unknown")]
    silent_crit = sum(bool(r.case.get("critical")) for r in silent)
    guard = sum(any(x.startswith(("guardrail", "template")) for x in r.failures)
                for r in results)
    return {"name": name, "cases": n, "pass": ok, "pass_rate": round(ok / n, 4) if n else 0,
            "intent_acc": round(intent_ok / n, 4) if n else 0, "critical": len(crit),
            "critical_pass": crit_ok, "guardrail_violations": guard,
            "silent_errors": len(silent), "silent_critical": silent_crit, "per_intent": per}


def main(argv: list[str]) -> int:
    if argv[:1] == ["--heldout"]:
        return heldout(argv[1:])
    paths = [Path(p) for p in argv] or sorted(HERE.glob("*.jsonl"))
    code = 0
    for p in paths:
        if not p.exists():
            continue
        res = run(p)
        rep = report(res, p.name)
        print(f"\n═══ {rep['name']} ═══")
        print(f"מקרים {rep['cases']} · עברו {rep['pass']} ({rep['pass_rate']:.1%}) · "
              f"דיוק כוונה {rep['intent_acc']:.1%} · קריטיים {rep['critical_pass']}/{rep['critical']} · "
              f"הפרות מעקה {rep['guardrail_violations']} · טעויות שקטות {rep['silent_errors']} "
              f"(קריטיות {rep['silent_critical']})")
        print(f"{'כוונה':<14}{'precision':>10}{'recall':>8}{'n':>5}")
        for k, (pr, rc, cnt) in rep["per_intent"].items():
            print(f"{k:<14}{pr:>10.2f}{rc:>8.2f}{cnt:>5}")
        bad = [r for r in res if not r.ok]
        if bad:
            print("כישלונות:")
            for r in bad:
                tag = "🔴" if r.case.get("critical") else "·"
                print(f"  {tag} {r.case['id']} «{r.case['text']}» ⇒ {'; '.join(r.failures)}")
        if rep["critical_pass"] < rep["critical"] or rep["guardrail_violations"]:
            code = 1
    return code


def heldout(argv: list[str]) -> int:
    """מוחזק-בצד: דיוק על טקסט חדש, בנפרד מרגרסיה. לא בשער pytest — לא מכווננים עליו.
    מה שחשוב ביותר: טעויות בטוחות-בעצמן (המנוע החליט על כוונה אחרת במקום 'לא ברור ⇒ בעל העסק')."""
    paths = [Path(p) for p in argv] or sorted((HERE / "heldout").glob("*.jsonl"))
    for p in paths:
        res = run(p)
        rep = report(res, p.name)
        safe_miss = [r for r in res if not r.ok and r.decision.intent.value == "unknown"
                     and r.case["expect"]["intent"] != "unknown"]
        silent = [r for r in res if r.decision.intent.value not in (r.case["expect"]["intent"], "unknown")]
        print(f"\n═══ מוחזק-בצד: {p.name} ═══")
        print(f"מקרים {rep['cases']} · עברו את כל הציפיות {rep['pass']} ({rep['pass_rate']:.1%}) · "
              f"דיוק כוונה {rep['intent_acc']:.1%} · קריטיים {rep['critical_pass']}/{rep['critical']}")
        print(f"פספוס בטוח (נפל ל'לא ברור' ⇒ בעל העסק): {len(safe_miss)}")
        print(f"🔴 טעויות בטוחות-בעצמן: {len(silent)} (מהן קריטיות {rep['silent_critical']})")
        for r in silent:
            print(f"   🔴 {r.case['id']} «{r.case['text']}» ⇒ {r.decision.intent.value} "
                  f"(צפוי {r.case['expect']['intent']})")
        other = [r for r in res if not r.ok and r not in silent and r not in safe_miss]
        for r in safe_miss + other:
            print(f"   · {r.case['id']} «{r.case['text']}» ⇒ {'; '.join(r.failures)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
