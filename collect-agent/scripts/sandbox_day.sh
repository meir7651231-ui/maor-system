#!/usr/bin/env bash
# «יום ה-sandbox» בפקודה אחת (BACKLOG חיבורים #3): בדיקת החוזה של חשבונית ירוקה + בדיקת
# «פתוח = לא שולם» (גבייה סוכן), ושורת החלטה אחת: להשיק / לא להשיק. קריאה בלבד, בלי מפתחות בקוד.
#
#   bash scripts/sandbox_day.sh                      # מול gi_mock בתוך התהליך (הדמיה — היום)
#   GREENINVOICE_API_ID=… GREENINVOICE_API_SECRET=… bash scripts/sandbox_day.sh --sandbox
#
# ב---sandbox הדוחות נשמרים ב-sandbox-reports/ (מחוץ לגיט) — שער המעבר צריך אותם:
#   python3 -m app.golive --gi-report sandbox-reports/gi-contract.json
# קוד יציאה: 0 = להשיק (מבחינת חשבונית ירוקה) · 1 = לא להשיק · 2 = שימוש שגוי (לא נשלחה בקשה).
set -uo pipefail
cd "$(dirname "$0")/.."
MODE=(); TARGET="gi_mock בתוך התהליך (הדמיה)"
# אתחול ⇒ cleanup ⇒ trap ⇒ mktemp (הפעלה 221): התיקייה הזמנית מכוסה מרגע היצירה; INT/TERM ⇒ קוד-אות.
OUT=""; KEEP=1
cleanup() { local rc=$?; if [[ "$KEEP" == 0 && -n "$OUT" ]]; then rm -rf "$OUT"; fi; exit "$rc"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
if [[ "${1:-}" == "--sandbox" ]]; then
  if [[ -z "${GREENINVOICE_API_ID:-}" || -z "${GREENINVOICE_API_SECRET:-}" ]]; then
    echo "חסרים GREENINVOICE_API_ID / GREENINVOICE_API_SECRET — לא נשלחה אף בקשה." >&2
    exit 2
  fi
  MODE=(--sandbox); TARGET="ה-sandbox האמיתי"; OUT="sandbox-reports"; mkdir -p "$OUT"; KEEP=1
else
  KEEP=0; OUT="$(mktemp -d)"
fi

echo "══ יום ה-sandbox · יעד: $TARGET ══"
echo; echo "① בדיקת החוזה (scripts/gi_contract_check.py)"
python3 -I scripts/gi_contract_check.py "${MODE[@]}" --json "$OUT/gi-contract.json"; GI_RC=$?
echo; echo "② «פתוח = לא שולם» (scripts/sandbox_day1_paid_check.py)"
python3 -I scripts/sandbox_day1_paid_check.py "${MODE[@]}" --json "$OUT/paid-check.json"; PAID_RC=$?

echo; echo "══ החלטה ══"
REASONS=()
[[ $GI_RC -eq 2 || $PAID_RC -eq 2 ]] && { echo "שימוש שגוי — לא נשלחה בקשה"; exit 2; }
[[ $GI_RC -ne 0 ]] && REASONS+=("בדיקת החוזה: יש FAIL — הקוד שלנו לא יעבוד מול השרת")
[[ $PAID_RC -ne 0 ]] && REASONS+=("«פתוח = לא שולם»: שדה קריטי חסר — לא ניתן לזהות מי כבר שילם")
if [[ ${#REASONS[@]} -eq 0 ]]; then
  echo "✅ להשיק (מבחינת חשבונית ירוקה) · יעד: $TARGET"
  [[ "$KEEP" == 1 ]] && echo "הדוחות: $OUT/ · הבא: python3 -m app.golive --gi-report $OUT/gi-contract.json"
  exit 0
fi
echo "❌ לא להשיק · יעד: $TARGET"
for r in "${REASONS[@]}"; do echo "  • $r"; done
exit 1
