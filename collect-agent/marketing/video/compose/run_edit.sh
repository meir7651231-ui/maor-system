#!/bin/sh
# העריכה הסופית (סבב 5): רק פריימים שעברו סקירה. שימוש (מתוך compose/): PY=... sh run_edit.sh <scratch>
set -e
# הפעלה 231 (QA — מגן תהליכי רקע): ה-composite הסופי רץ ברקע בלי `$!`, בלי trap ועם `wait` חשוף ⇒ (1) `wait` בלי PID
# מחזיר 0 גם כשהרינדור ברקע נכשל ⇒ verify רץ על קובץ שבור; (2) כשל ב-composite שבחזית (set -e) יצא והשאיר את הרקע
# יתום כותב ל-mp4. עכשיו: BG=$! · `wait "$BG"` (כשל עוצר) · cleanup ב-EXIT: kill ⇒ עד ~5s ⇒ kill -9 ⇒ wait.
BG=""
cleanup() {
  rc=$?
  if [ -n "$BG" ]; then
    kill "$BG" 2>/dev/null || true
    i=0; while [ "$i" -lt 50 ] && kill -0 "$BG" 2>/dev/null; do sleep 0.1; i=$((i + 1)); done
    kill -9 "$BG" 2>/dev/null || true
    wait "$BG" 2>/dev/null || true
  fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
S=$1; PY=${PY:-python}; W=$S/w; Q=qa
HV=$S/drive/1sJfN57MHeRehHOtXrmWhxUM4NA1ZjcTG.mp4
VV=$S/drive/1XXo941NIJVCT4tl58J60bn1EgvJfVSiR.mp4
for c in ${CLIPS:-h v}; do
  if [ $c = h ]; then SRC=$HV; OUTF=../gabi-demo-16x9.mp4; else SRC=$VV; OUTF=../gabi-reel-9x16.mp4; fi
  $PY edit_npz.py edit_$c.json $W/stb_$c.npz $W/fin_$c.npz $W/edit_$c
  $PY composite.py $c $SRC $W/stb_$c.npz $W/fin_$c.npz plan_$c.json ui assets $OUTF --edit edit_$c.json &
  BG=$!
  $PY composite.py $c $SRC $W/stb_$c.npz $W/fin_$c.npz plan_$c.json ui assets /dev/null --edit edit_$c.json \
      --calib $Q/calib_edit_$c.mkv --src-out $W/src_edit_$c.mkv
  wait "$BG"; BG=""
  $PY verify.py edit_$c $W/src_edit_$c.mkv $W/edit_$c/stb.npz $Q/calib_edit_$c.mkv $OUTF $Q
done
