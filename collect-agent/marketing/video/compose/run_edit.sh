#!/bin/sh
# העריכה הסופית (סבב 5): רק פריימים שעברו סקירה. שימוש (מתוך compose/): PY=... sh run_edit.sh <scratch>
set -e
S=$1; PY=${PY:-python}; W=$S/w; Q=qa
HV=$S/drive/1sJfN57MHeRehHOtXrmWhxUM4NA1ZjcTG.mp4
VV=$S/drive/1XXo941NIJVCT4tl58J60bn1EgvJfVSiR.mp4
for c in ${CLIPS:-h v}; do
  if [ $c = h ]; then SRC=$HV; OUTF=../gabi-demo-16x9.mp4; else SRC=$VV; OUTF=../gabi-reel-9x16.mp4; fi
  $PY edit_npz.py edit_$c.json $W/stb_$c.npz $W/fin_$c.npz $W/edit_$c
  $PY composite.py $c $SRC $W/stb_$c.npz $W/fin_$c.npz plan_$c.json ui assets $OUTF --edit edit_$c.json &
  $PY composite.py $c $SRC $W/stb_$c.npz $W/fin_$c.npz plan_$c.json ui assets /dev/null --edit edit_$c.json \
      --calib $Q/calib_edit_$c.mkv --src-out $W/src_edit_$c.mkv
  wait
  $PY verify.py edit_$c $W/src_edit_$c.mkv $W/edit_$c/stb.npz $Q/calib_edit_$c.mkv $OUTF $Q
done
