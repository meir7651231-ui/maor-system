"""סריקת ירוק-גולמי על כל פריים של הפלט הסופי, ללא חריגים (כולל כרטיס-הסיום).
ירוק-מסך-גולמי = גוון 35–72, רוויה≥120, בהירות≥70, G−max(R,B)>45 (עלווה עמומה מבחוץ לא נתפסת) — ובנוסף גוון-המסך (≤ 72 ב-OpenCV,
ירוק-צהבהב של מסך-כרומה) כדי להפריד מירוק-המותג (#10B981, גוון ~79) שמופיע בכוונה ב-UI/כתוביות/כרטיס-סיום.
מדווח לכל פריים: פיקסלים כאלה ורכיב-מחובר גדול ביותר (מסך-ירוק גולמי = רכיב גדול).
שימוש: python scan_final.py <video> <out.csv>
"""
import sys
import csv
import cv2
import numpy as np

V, OUT = sys.argv[1:3]
FMT = sys.argv[3] if len(sys.argv) > 3 else None          # h/v ⇒ מסכת שכבות-על (כתוביות + כרטיס-סיום)
cap = cv2.VideoCapture(V)
fps = cap.get(cv2.CAP_PROP_FPS)
NF = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
ovl = None
if FMT:
    import glob, os
    here = os.path.dirname(os.path.abspath(__file__))
    ovl = None
    for pth in glob.glob(f'{here}/assets/cap_{FMT}_*.png'):
        a = cv2.imread(pth, cv2.IMREAD_UNCHANGED)[:, :, 3] > 0
        ovl = a if ovl is None else (ovl | a)
    ovl = cv2.dilate(ovl.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    END0 = NF - int(4.5 * fps) - int(0.6 * fps)            # מעבר לכרטיס-הסיום ואילך = כרטיס מעוצב
rows = []
i = 0
while True:
    ok, f = cap.read()
    if not ok:
        break
    h = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    fi = f.astype(np.int16)
    g = (cv2.inRange(h, (35, 120, 70), (72, 255, 255)) > 0) & ((fi[:, :, 1] - np.maximum(fi[:, :, 0], fi[:, :, 2])) > 45)
    n, lab, st, _ = cv2.connectedComponentsWithStats(g.astype(np.uint8), 8)
    big = int(st[1:, cv2.CC_STAT_AREA].max()) if n > 1 else 0
    row = dict(frame=i, t=round(i / fps, 3), screen_green_px=int(g.sum()), largest_blob=big)
    if ovl is not None:
        go = g & ~ovl if i < END0 else np.zeros_like(g)
        n2, l2, s2, _ = cv2.connectedComponentsWithStats(go.astype(np.uint8), 8)
        row['outside_overlays_px'] = int(go.sum())
        row['outside_overlays_largest_blob'] = int(s2[1:, cv2.CC_STAT_AREA].max()) if n2 > 1 else 0
    rows.append(row)
    i += 1
with open(OUT, 'w', newline='') as fh:
    w = csv.DictWriter(fh, list(rows[0])); w.writeheader(); w.writerows(rows)
px = np.array([r['screen_green_px'] for r in rows]); bl = np.array([r['largest_blob'] for r in rows])
print(f'{V}: frames {len(rows)}  screen-green px max {px.max()} mean {px.mean():.2f}  frames>0 {(px > 0).sum()}  '
      f'largest blob max {bl.max()}  frames with blob>=50: {[r["frame"] for r in rows if r["largest_blob"] >= 50][:40]}')
if ovl is not None:
    po = np.array([r['outside_overlays_px'] for r in rows])
    print(f'  outside captions/end-card: px max {po.max()}  frames>0 {(po > 0).sum()}  '
          f'largest blob max {max(r["outside_overlays_largest_blob"] for r in rows)}  frames: {[r["frame"] for r in rows if r["outside_overlays_px"] > 0][:40]}')
