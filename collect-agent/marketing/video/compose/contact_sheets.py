"""גיליונות-סקירה לבדיקה ויזואלית של כל פריים: לכל פריים חיתוך ×2 (NEAREST) מהפלט — סביב קצה-האצבע אם יש,
אחרת סביב אמצע של צלע-מסך גלויה (מתחלפת בין הצלעות לפי מספר הפריים). 24 פריימים לגיליון.

שימוש: python contact_sheets.py <scratch> <video_dir> <out_dir>
"""
import sys
import os
import cv2
import numpy as np

S, VD, OD = sys.argv[1:4]
os.makedirs(OD, exist_ok=True)
OUT = {'h': f'{VD}/gabi-demo-16x9.mp4', 'v': f'{VD}/gabi-reel-9x16.mp4'}
TW, TH, Z = 160, 120, 2
for c in (sys.argv[4] if len(sys.argv) > 4 else 'hv'):
    z = np.load(f'{S}/w/stb_{c}.npz', allow_pickle=True)
    fin = np.load(f'{S}/w/fin_{c}.npz')['tip_img']
    C, st = z['C'], z['status']
    cap = cv2.VideoCapture(OUT[c])
    N = len(C)
    tiles = []
    for i in range(N):
        ok, fr = cap.read()
        if not ok or not np.isfinite(C[i]).all():
            continue
        H, W = fr.shape[:2]
        if np.isfinite(fin[i]).all():
            cen, kind = fin[i], 'tip'
        else:
            mids = [(C[i][a] + C[i][b]) / 2 for a, b in ((0, 1), (1, 2), (2, 3), (3, 0))]
            vis = [m for m in mids if 0 <= m[0] < W and 0 <= m[1] < H]
            cen, kind = (vis[i % len(vis)] if vis else C[i].mean(0)), 'edge'
        x0 = int(np.clip(cen[0] - TW / 2, 0, W - TW)); y0 = int(np.clip(cen[1] - TH / 2, 0, H - TH))
        t = cv2.resize(fr[y0:y0 + TH, x0:x0 + TW], None, fx=Z, fy=Z, interpolation=cv2.INTER_NEAREST)
        cv2.rectangle(t, (0, 0), (150, 18), (0, 0, 0), -1)
        cv2.putText(t, f'{c}{i} {kind} {str(st[i])[:4]}', (3, 14), 0, 0.45, (0, 255, 255), 1)
        tiles.append(t)
    for k in range(0, len(tiles), 24):
        grp = tiles[k:k + 24]
        while len(grp) < 24:
            grp.append(np.zeros_like(tiles[0]))
        rows = [np.hstack(grp[r * 6:(r + 1) * 6]) for r in range(4)]
        cv2.imwrite(f'{OD}/sheet_{c}_{k // 24:02d}.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(c, len(tiles), 'tiles')
