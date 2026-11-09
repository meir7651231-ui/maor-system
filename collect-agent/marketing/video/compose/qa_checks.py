"""תמונות-בדיקה מוגדלות (מקור | פלט, ×2.5 NEAREST — כדי לראות מדרגות) בפריימים קבועים + הפריימים הגרועים
לפי כל מדד ב-verify_*.csv.

שימוש: python qa_checks.py <scratch_with_drive_and_w> <video_dir> <qa_dir>
"""
import sys
import csv
import cv2
import numpy as np

S, VD, Q = sys.argv[1:4]
SRC = {'h': f'{S}/drive/1sJfN57MHeRehHOtXrmWhxUM4NA1ZjcTG.mp4', 'v': f'{S}/drive/1XXo941NIJVCT4tl58J60bn1EgvJfVSiR.mp4'}
OUT = {'h': f'{VD}/gabi-demo-16x9.mp4', 'v': f'{VD}/gabi-reel-9x16.mp4'}
FIXED = [('h', 48, 'desk-glare'), ('h', 125, 'pickup-blur'), ('h', 276, 'finger-drag'), ('h', 455, 'approve-tap'),
         ('v', 48, 'desk-clipped'), ('v', 132, 'pickup-blur'), ('v', 295, 'clipped-indicator'), ('v', 507, 'sms-link-tap')]


def crop_at(c, f, label, path, center=None):
    z = np.load(f'{S}/w/stb_{c}.npz', allow_pickle=True)
    fin = np.load(f'{S}/w/fin_{c}.npz')['tip_img']
    a, b = cv2.VideoCapture(SRC[c]), cv2.VideoCapture(OUT[c])
    a.set(1, f); b.set(1, f)
    _, sf = a.read(); _, of = b.read()
    H, W = sf.shape[:2]
    C = z['C'][f]
    if center is not None:
        cen = np.array(center)
    elif np.isfinite(fin[f]).all():
        cen = fin[f]
    elif np.isfinite(C).all():
        vis = C[(C[:, 0] >= 0) & (C[:, 0] < W) & (C[:, 1] >= 0) & (C[:, 1] < H)]
        cen = vis.mean(0) if len(vis) else C[2:].mean(0)
    else:
        cen = np.array([W / 2, H / 2])
    w, h = (300, 200) if c == 'h' else (240, 240)
    x0 = int(np.clip(cen[0] - w // 2, 0, W - w)); y0 = int(np.clip(cen[1] - h // 2, 0, H - h))
    im = np.hstack([cv2.resize(x[y0:y0 + h, x0:x0 + w], None, fx=2.5, fy=2.5, interpolation=cv2.INTER_NEAREST) for x in (sf, of)])
    cv2.putText(im, f'{c} frame {f} t={f / 24:.2f}s [{z["status"][f]}] {label} | source | output (x2.5 nearest)', (10, 28), 0, 0.7, (0, 0, 255), 2)
    cv2.imwrite(path, im)


k = 1
for c, f, name in FIXED:
    crop_at(c, f, name, f'{Q}/check_{k}_{c}_{name}.png'); k += 1
# הגרועים לפי מדד (מכל הקליפים)
for metric in ('skin_changed_px', 'changed_outside_green_px', 'jagged_ratio', 'green_calib_px'):
    best = None
    for c in 'hv':
        for r in csv.DictReader(open(f'{Q}/verify_{c}.csv')):
            v = r.get(metric)
            if v not in (None, ''):
                if metric == 'jagged_ratio' and int(r.get('fg_edge_px') or 0) < 40:
                    continue
                if best is None or float(v) > best[0]:
                    best = (float(v), c, int(r['frame']))
    if best:
        v, c, f = best
        # מרכז הכשל: הצביר הגדול של הפיקסלים שהמדד סופר (על רינדור-הכיול, כמו ב-verify)
        a, b = cv2.VideoCapture(SRC[c]), cv2.VideoCapture(f'{Q}/calib_{c}.mkv')
        a.set(1, f); b.set(1, f); _, fs = a.read(); _, fc = b.read()
        fsi, fci = fs.astype(np.int16), fc.astype(np.int16)
        Ds = fsi[:, :, 1] - (fsi[:, :, 0] + fsi[:, :, 2]) // 2
        diff = np.abs(fci - fsi).max(2)
        if metric == 'skin_changed_px':
            m = ((fsi[:, :, 2] - fsi[:, :, 1]) > 10) & ((fsi[:, :, 2] - fsi[:, :, 0]) > 20) & (Ds <= 0) & (diff > 6)
        elif metric == 'changed_outside_green_px':
            m = ~(cv2.dilate((Ds > 3).astype(np.uint8), np.ones((11, 11), np.uint8)) > 0) & (diff > 6)
        elif metric == 'green_calib_px':
            m = ((fci[:, :, 1] - np.maximum(fci[:, :, 0], fci[:, :, 2])) > 18) & (fci[:, :, 1] > 45)
        else:
            m = None
        cen = None
        if m is not None and m.any():
            n_, lab_, st_, cen_ = cv2.connectedComponentsWithStats(cv2.dilate(m.astype(np.uint8), np.ones((9, 9), np.uint8)), 8)
            cen = cen_[1 + int(np.argmax(st_[1:, cv2.CC_STAT_AREA]))]
        crop_at(c, f, f'worst {metric}={v:g}', f'{Q}/check_{k}_{c}_worst-{metric}.png', center=cen); k += 1
        print(metric, best)
