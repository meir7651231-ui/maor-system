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
if [[ "${1:-}" == "--sandbox" ]]; then
  if [[ -z "${GREENINVOICE_API_ID:-}" || -z "${GREENINVOICE_API_SECRET:-}" ]]; then
    echo "חסרים GREENINVOICE_API_ID / GREENINVOICE_API_SECRET — לא נשלחה אף בקשה." >&2
    exit 2
  fi
  MODE=(--sandbox); TARGET="ה-sandbox האמיתי"; OUT="sandbox-reports"; mkdir -p "$OUT"; KEEP=1
else
  OUT="$(mktemp -d)"; KEEP=0
fi
cleanup() { local rc=$?; [[ "$KEEP" == 0 ]] && rm -rf "$OUT"; exit "$rc"; }
trap cleanup EXIT INT TERM

echo "══ יום ה-sandbox · יעד: $TARGET ══"
echo; echo "① בדיקת החוזה (scripts/gi_contract_check.py)"
python -I scripts/gi_contract_check.py "${MODE[@]}" --json "$OUT/gi-contract.json"; GI_RC=$?
echo; echo "② «פתוח = לא שולם» (scripts/sandbox_day1_paid_check.py)"
python -I scripts/sandbox_day1_paid_check.py "${MODE[@]}" --json "$OUT/paid-check.json"; PAID_RC=$?

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
