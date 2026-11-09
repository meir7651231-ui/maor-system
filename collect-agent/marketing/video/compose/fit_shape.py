"""התאמת פרמטרי-הצורה של המסך (רדיוס פינה, מידות החריץ) מתוך פריימים נבחרים — פעם אחת, נשמר ל-shape.json.

שימוש: python fit_shape.py <video> <track.npz> <frames,comma,separated>
"""
import sys
import json
import cv2
import numpy as np
from scipy.optimize import least_squares
from scipy.spatial import cKDTree
from track_lib import greenness, luma, screen_level, intersect, SIDES
from model import load_shape, contour, project, UW, UH, HERE
from refine import top_search, fit_frame, H_of

SRC, TRK = sys.argv[1], sys.argv[2]
FR = [int(x) for x in sys.argv[3].split(',')]
z = np.load(TRK, allow_pickle=True)
cap = cv2.VideoCapture(SRC)
W, H = int(cap.get(3)), int(cap.get(4))
sh = load_shape()
frames = []
for f in FR:
    cap.set(1, f); ok, fr = cap.read()
    L = {s: (z['line_' + s][f, :2], z['line_' + s][f, 2]) for s in SIDES}
    BL = intersect(L['bottom'], L['left']); BR = intersect(L['bottom'], L['right'])
    # אתחול גס: אורך = 844/390 מהרוחב התחתון
    wb = np.linalg.norm(BR - BL)
    frames.append((f, fr, L, BL, BR, wb))

for rnd in range(4):
    P, Nn, Kind = contour(sh, 0.5)
    TOPM = (P[:, 1] < sh['R'] + 2) | (Kind == 2)
    pts_ui = []
    for f, fr, L, BL, BR, wb in frames:
        D, Y = greenness(fr), luma(fr); lvl = screen_level(D)
        # כיוון "מעלה" לאורך הקו השמאלי = הרחק מהצלע התחתונה
        up = -L['bottom'][0]
        dl = np.array([-L['left'][0][1], L['left'][0][0]]); dl = dl if dl @ up > 0 else -dl
        dr = np.array([-L['right'][0][1], L['right'][0][0]]); dr = dr if dr @ up > 0 else -dr
        C0 = np.array([BL + dl * wb * UH / UW, BR + dr * wb * UH / UW, BR, BL])
        C0, sc = top_search(Y, D, lvl, C0, P, Nn, TOPM, W, H, rng=0.25, step=0.01)
        r = fit_frame(fr, C0, sh, P, Nn, np.full(8, 25.0), W=W, H=H, cache=(D, Y, lvl))
        Hm = H_of(r['C'])
        X = r['x'] + r['n'] * r['res'][:, None]
        Xi = project(np.linalg.inv(Hm), X[r['inl']])
        pts_ui.append(Xi)
        print(rnd, f, 'top-score', round(sc, 1), 'rms', round(float(np.sqrt(np.mean(r['res'][r['inl']] ** 2))), 3))
    U = np.vstack(pts_ui)
    U = U[(U[:, 1] < 120)]                          # רק אזור החריץ/פינות עליונות
    keys = ['R', 'wn', 'dn', 'rb', 'rf']

    def resid(v):
        s2 = dict(sh); s2.update(dict(zip(keys, v)))
        Pc = contour(s2, 0.25)[0]
        d, _ = cKDTree(Pc).query(U)
        return d

    v0 = [sh[k] for k in keys]
    res = least_squares(resid, v0, loss='soft_l1', f_scale=1.0, diff_step=1e-3,
                        bounds=([30, 120, 15, 3, 1], [60, 260, 45, 30, 15]))
    sh.update(dict(zip(keys, [float(x) for x in res.x])))
    print('round', rnd, {k: round(sh[k], 2) for k in keys}, 'med dist (pt)', round(float(np.median(resid(res.x))), 3))
json.dump({k: sh[k] for k in ['R', 'wn', 'dn', 'rb', 'rf']}, open(f'{HERE}/shape.json', 'w'), indent=1)
print('saved shape.json')
