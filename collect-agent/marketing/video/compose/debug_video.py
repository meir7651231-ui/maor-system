"""וידאו-דיבאג: קווי-הצלע המותאמים (מוארכים גם מחוץ לפריים), הפינות, קונטור-המודל (פינות מעוגלות+חריץ),
נקודות-השפה שנמדדו (ירוק = inlier, סגול = נדחה), קצה-האצבע וסטטוס-הפריים.

שימוש: python debug_video.py <video> <stab.npz> <finger.npz> <out.mp4> [zoom_crop: 1=כן]
"""
import sys
import subprocess
import cv2
import numpy as np
from model import load_shape, contour, project
from refine import H_of

SRC, STB, FIN, OUT = sys.argv[1:5]
z = np.load(STB, allow_pickle=True)
fz = np.load(FIN)
C, status = z['C'], z['status']
mk = {int(k): i for i, k in enumerate(z['meas_keys'])}
P, _, _ = contour(load_shape(), 1.0)
cap = cv2.VideoCapture(SRC)
W, H = int(cap.get(3)), int(cap.get(4)); fps = cap.get(cv2.CAP_PROP_FPS)
SC = 2                                   # רזולוציה כפולה ⇒ קווים תת-פיקסליים נראים
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W * SC}x{H * SC}',
                       '-r', str(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
                       '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
COL = {'meas': (0, 255, 0), 'refit': (0, 200, 255), 'weak': (0, 128, 255), 'interp': (255, 0, 255), 'bad': (0, 0, 255)}
i = 0
while True:
    ok, fr = cap.read()
    if not ok:
        break
    v = cv2.resize(fr, (W * SC, H * SC), interpolation=cv2.INTER_CUBIC)
    st = str(status[i]) if i < len(status) else 'bad'
    if i < len(C) and np.isfinite(C[i]).all():
        Hm = H_of(C[i])
        x = project(Hm, P) * SC
        cv2.polylines(v, [np.round(x * 4).astype(np.int32).reshape(-1, 1, 2)], True, (0, 0, 255), 1, cv2.LINE_AA, shift=2)
        for a, b in ((0, 1), (1, 2), (2, 3), (3, 0)):
            p, q = C[i][a] * SC, C[i][b] * SC
            d = (q - p) / (np.linalg.norm(q - p) + 1e-9)
            cv2.line(v, tuple(np.round((p - d * 4000) * 4).astype(int)), tuple(np.round((q + d * 4000) * 4).astype(int)),
                     (255, 255, 0), 1, cv2.LINE_AA, shift=2)
        for k, c in enumerate(C[i]):
            cv2.circle(v, tuple(np.round(c * SC * 4).astype(int)), 6 * 4, (255, 255, 255), 1, cv2.LINE_AA, shift=2)
            cv2.putText(v, 'TL TR BR BL'.split()[k], tuple(np.round(c * SC + 8).astype(int)), 0, 0.6, (255, 255, 255), 2)
        if i in mk:
            m = z['meas_vals'][mk[i]]
            for row in m[::2]:
                p = (row[1:3] + row[3:5] * row[5]) * SC
                cv2.circle(v, tuple(np.round(p).astype(int)), 1, (0, 255, 0) if row[6] else (255, 0, 255), -1)
    if i < len(fz['tip_img']) and np.isfinite(fz['tip_img'][i]).all():
        cv2.circle(v, tuple(np.round(fz['tip_img'][i] * SC).astype(int)), 10, (255, 255, 0), 2)
    b = z['bias'][i] if i < len(z['bias']) else np.full(5, np.nan)
    txt = '%d  %.2fs  %s  bias(top,r,b,l,notch)=%s' % (i, i / fps, st, ' '.join('--' if np.isnan(x_) else '%+.2f' % x_ for x_ in b))
    cv2.rectangle(v, (0, 0), (W * SC, 44), (0, 0, 0), -1)
    cv2.putText(v, txt, (12, 30), 0, 0.9, COL.get(st, (255, 255, 255)), 2)
    ff.stdin.write(v.tobytes()); i += 1
ff.stdin.close(); ff.wait(); print('wrote', OUT)
