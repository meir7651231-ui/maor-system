#!/bin/sh
# הצנרת המלאה לשני הקליפים. שימוש (מתוך compose/): PY=<python עם opencv+scipy> sh run_all.sh <scratch: drive/ + w/> ..
set -e
S=$1; O=$2; PY=${PY:-python}
HV=$S/drive/1sJfN57MHeRehHOtXrmWhxUM4NA1ZjcTG.mp4
VV=$S/drive/1XXo941NIJVCT4tl58J60bn1EgvJfVSiR.mp4
W=$S/w
if [ -z "$SKIP_TRACK" ]; then
$PY track.py $HV $W/trk_h.npz -0.43 -0.9
$PY refine.py $HV $W/trk_h.npz $W/ref_h.npz
$PY stabilize.py $HV $W/ref_h.npz $W/stb_h.npz
$PY finger.py $HV $W/stb_h.npz $W/fin_h.npz
$PY track.py $VV $W/trk_v.npz -0.8 -0.6
$PY refine.py $VV $W/trk_v.npz $W/ref_v.npz 831.18,195.18
$PY stabilize.py $VV $W/ref_v.npz $W/stb_v.npz
$PY finger.py $VV $W/stb_v.npz $W/fin_v.npz
fi
# רינדור: סופי + כיול (UI אפור) + אימות + וידאו-דיבאג
Q=qa; mkdir -p $Q $O
for c in h v; do
  if [ $c = h ]; then SRC=$HV; OUTF=$O/gabi-demo-16x9.mp4; else SRC=$VV; OUTF=$O/gabi-reel-9x16.mp4; fi
  $PY composite.py $c $SRC $W/stb_$c.npz $W/fin_$c.npz plan_$c.json ui assets $OUTF
  $PY composite.py $c $SRC $W/stb_$c.npz $W/fin_$c.npz plan_$c.json ui assets /dev/null --calib $Q/calib_$c.mp4
  $PY verify.py $c $SRC $W/stb_$c.npz $Q/calib_$c.mp4 $OUTF $Q
  $PY debug_video.py $SRC $W/stb_$c.npz $W/fin_$c.npz $Q/debug_$c.mp4
done
