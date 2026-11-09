"""שלב 1 — מעקב: לכל פריים 4 קווי-צלע מדויקים (תת-פיקסל) + נקודות-השפה שמהן הותאמו.

שימוש: python track.py <video> <out.npz> <top_hint_x> <top_hint_y>
top_hint = כיוון גס (בתמונה) שאליו מצביע ראש הטלפון — רק לאתחול; אחר-כך התיוג נגרר מפריים לפריים.
"""
import sys
import cv2
import numpy as np
from track_lib import (greenness, luma, screen_level, boundary_candidates, ransac_lines, refine_line,
                       global_label, intersect, ang_ok, SIDES)

SRC, OUT = sys.argv[1], sys.argv[2]
HINT = np.array([float(sys.argv[3]), float(sys.argv[4])])
NEIGH = {'top': ('left', 'right'), 'bottom': ('left', 'right'), 'left': ('top', 'bottom'), 'right': ('top', 'bottom')}


def seg_range(side, lab, fallback_pts, W, H):
    """טווח t לאורך הקו בין שתי הפינות הסמוכות (או היקף נקודות-המועמד), חתוך לפריים."""
    n, c = lab[side]
    t = np.array([-n[1], n[0]])
    ts = []
    for nb in NEIGH[side]:
        if lab.get(nb) is not None:
            try:
                ts.append(intersect(lab[side], lab[nb]) @ t)
            except np.linalg.LinAlgError:
                pass
    if len(ts) < 2 and fallback_pts is not None and len(fallback_pts):
        s = fallback_pts @ t
        ts = ts + [s.min() - 5, s.max() + 5] if len(ts) == 0 else ts + [s.min() - 5 if abs(s.min() - ts[0]) > abs(s.max() - ts[0]) else s.max() + 5]
    if len(ts) < 2:
        return None
    t0, t1 = min(ts), max(ts)
    # חיתוך לפריים
    p0 = n * c
    lo, hi = -1e9, 1e9
    for k, lim in ((0, W), (1, H)):
        if abs(t[k]) > 1e-6:
            a, b = (1 - p0[k]) / t[k], (lim - 2 - p0[k]) / t[k]
            lo, hi = max(lo, min(a, b)), min(hi, max(a, b))
        elif not (1 < p0[k] < lim - 2):
            return None
    return max(t0, lo), min(t1, hi), t0, t1


cap = cv2.VideoCapture(SRC)
W, H = int(cap.get(3)), int(cap.get(4))
N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
rec = {k: np.full((N, 3), np.nan) for k in SIDES}           # n_x n_y c
stat = {k: np.zeros((N, 4)) for k in SIDES}                # count rms maxres span
notch = np.full((N, 3), np.nan)
lvls = np.zeros(N)
edge_pts = {}                                              # (frame, side) -> pts (לאימות)
prev_down = -HINT / np.linalg.norm(HINT)          # כיוון ראשוני (מאומת בדוח מול ציון-החריץ: nscore[:,0] > nscore[:,1])
nscore = np.full((N, 2), np.nan)
rng = np.random.default_rng(1)
for i in range(N):
    ok, fr = cap.read()
    if not ok:
        break
    D = greenness(fr); Y = luma(fr); lvl = screen_level(D); lvls[i] = lvl
    if lvl < 25:
        continue
    pts, g, dark, M = boundary_candidates(fr, D, lvl, Y)
    if pts is None or dark.sum() < 60:
        continue
    P, G = pts[dark], g[dark]
    cl = ransac_lines(P, G, max_lines=8, tol=1.3, min_support=18, iters=300, rng=rng)
    cands = [(n, c, len(ids), P[ids]) for n, c, ids in cl]
    lab = global_label(cands, D, lvl, prev_down)
    if lab is None:
        continue
    prev_down = lab['_down']
    nscore[i] = [np.nan if v is None else v for v in lab['_score']]
    # ריענון תת-פיקסל
    fin = {}
    sizes = []
    for s in SIDES:
        if lab.get(s) is None:
            fin[s] = None
            continue
        n, c = lab[s]
        near = [cd[3] for cd in cands if ang_ok(cd[0], n, 6) and abs(cd[1] - c) < 3]
        fp = np.vstack(near) if near else None
        rr = seg_range(s, lab, fp, W, H)
        if rr is None:
            fin[s] = None
            continue
        v0, v1, t0, t1 = rr
        L = t1 - t0
        sizes.append((s, L))
        # רדיוס הפינה ≈ 12% מרוחב המסך; פינה שמחוץ לפריים לא דורשת דילוג
        fin[s] = (n, c, v0, v1, t0, t1)
    short = [L for s, L in sizes if s in ('top', 'bottom')]
    longl = [L for s, L in sizes if s in ('left', 'right')]
    wshort = np.median(short) if short else (np.median(longl) / 2.16 if longl else 100)
    skip = 0.15 * wshort + 3
    lab2 = {}
    for s in SIDES:
        if fin[s] is None:
            lab2[s] = None
            continue
        n, c, v0, v1, t0, t1 = fin[s]
        a = v0 + (skip if v0 - t0 < 1 else 2)
        b = v1 - (skip if t1 - v1 < 1 else 2)
        r = refine_line(n, c, Y, D, lvl, (a, b), step=1.0, half=6.0)
        if r is None or len(r['pts']) < 12 or np.ptp(r['pts'] @ np.array([-n[1], n[0]])) < 20:
            lab2[s] = None
            continue
        nn, cc = r['n'], r['c']
        if s == 'top':
            # חריץ: קו תחתית-החריץ מקביל לצלע העליונה; התאמה משותפת של נורמל (זוויתית יציבה), היסט מהאוזניים
            nc = [cd for cd in cands if ang_ok(cd[0], nn, 6) and 2 < cc - cd[1] < 0.12 * wshort * 2.16 and cd[2] >= 15]
            if nc:
                ncd = max(nc, key=lambda cd: cd[2])
                tt = np.array([-nn[1], nn[0]]); sp = ncd[3] @ tt
                rn = refine_line(ncd[0], ncd[1], Y, D, lvl, (sp.min() + 4, sp.max() - 4), step=1.0, half=5.0)
                if rn is not None and len(rn['pts']) > 15:
                    Pe, Pn = r['pts'], rn['pts']
                    Z = np.vstack([Pe - Pe.mean(0), Pn - Pn.mean(0)])
                    _, _, vt = np.linalg.svd(Z, full_matrices=False)
                    n2 = vt[1] if vt[1] @ nn > 0 else -vt[1]
                    nn, cc = n2, float(n2 @ Pe.mean(0))
                    notch[i] = (n2[0], n2[1], float(n2 @ Pn.mean(0)))
                    r['res'] = Pe @ nn - cc
        rec[s][i] = (nn[0], nn[1], cc)
        tt = np.array([-nn[1], nn[0]])
        stat[s][i] = (len(r['pts']), np.sqrt(np.mean(r['res'] ** 2)), np.abs(r['res']).max(), np.ptp(r['pts'] @ tt))
        edge_pts[(i, s)] = r['pts'].astype(np.float32)
        lab2[s] = (nn, cc)
    if i % 50 == 0:
        print(i, {s: (None if lab2[s] is None else int(stat[s][i][0])) for s in SIDES}, round(lvl, 1), flush=True)

np.savez_compressed(OUT, W=W, H=H, N=N, lvl=lvls, notch=notch, nscore=nscore,
                    **{f'line_{s}': rec[s] for s in SIDES}, **{f'stat_{s}': stat[s] for s in SIDES},
                    ep_keys=np.array([f'{i}:{s}' for (i, s) in edge_pts]),
                    ep_vals=np.array(list(edge_pts.values()), dtype=object))
ok_ = np.isfinite(nscore).all(1)
print('notch agrees with orientation in %d/%d frames' % ((nscore[ok_, 0] > nscore[ok_, 1]).sum(), ok_.sum()))
print('saved', OUT)
