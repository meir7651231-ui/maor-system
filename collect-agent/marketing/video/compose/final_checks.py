"""תמונות-בדיקה מהעריכה הסופית (לא מהמקור): מקור-ערוך | פלט-סופי, ×2.5 NEAREST, בפריימי-פלט נבחרים.
שימוש: python final_checks.py <scratch> <video_dir> <qa_dir>"""
import sys
import cv2
import numpy as np

S, VD, Q = sys.argv[1:4]
OUT = {'h': f'{VD}/gabi-demo-16x9.mp4', 'v': f'{VD}/gabi-reel-9x16.mp4'}
# (קליפ, זמן-מקור בשניות, תווית) — הפריים בפלט נמצא דרך src_frame
PICK = [('h', 2.0, 'lock-desk'), ('h', 9.5, 'dashboard'), ('h', 13.46, 'row-tap'), ('h', 16.0, 'sheet-swipe'),
        ('h', 18.96, 'approve-tap'), ('h', 19.6, 'toast'),
        ('v', 2.0, 'lock-desk'), ('v', 13.46, 'row-tap'), ('v', 18.96, 'approve-tap'), ('v', 20.6, 'sms'),
        ('v', 21.8, 'payment'), ('v', 29.5, 'payment-scroll')]
for k, (c, ts, name) in enumerate(PICK, 1):
    z = np.load(f'{S}/w/edit_{c}/stb.npz', allow_pickle=True)
    fin = np.load(f'{S}/w/edit_{c}/fin.npz')['tip_img']
    sf = z['src_frame']
    o = int(np.argmin(np.abs(sf - ts * 24)))
    a, b = cv2.VideoCapture(f'{S}/w/src_edit_{c}.mkv'), cv2.VideoCapture(OUT[c])
    a.set(1, o); b.set(1, o)
    _, s = a.read(); _, f = b.read()
    H, W = s.shape[:2]
    C = z['C'][o]
    if np.isfinite(fin[o]).all():
        cen = fin[o]
    else:
        vis = C[(C[:, 0] >= 0) & (C[:, 0] < W) & (C[:, 1] >= 0) & (C[:, 1] < H)]
        cen = vis.mean(0) if len(vis) else C[2:].mean(0)
    w, h = (300, 200) if c == 'h' else (240, 240)
    x0 = int(np.clip(cen[0] - w / 2, 0, W - w)); y0 = int(np.clip(cen[1] - h / 2, 0, H - h))
    im = np.hstack([cv2.resize(x[y0:y0 + h, x0:x0 + w], None, fx=2.5, fy=2.5, interpolation=cv2.INTER_NEAREST) for x in (s, f)])
    cv2.putText(im, f'{c} out {o} ({o / 24:.2f}s) src {sf[o]} {name} | source | FINAL output', (10, 28), 0, 0.7, (0, 0, 255), 2)
    cv2.imwrite(f'{Q}/final_{k:02d}_{c}_{name}.png', im)
    print(k, c, name, 'out', o, 'src', sf[o])
