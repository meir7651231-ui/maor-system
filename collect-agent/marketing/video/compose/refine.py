"""שלב 2 — התאמת-מודל: homography מדויקת לכל פריים מול קונטור המסך (צלעות + פינות מעוגלות + חריץ).

לכל נקודת-מודל: פרופיל לאורך הנורמל בתמונה, חציית-50% ⇒ היסט תת-פיקסל; פתרון Gauss-Newton עם משקלי
Tukey על 8 קואורדינטות-הפינות. אתחול מקווי track.py (השמאלי/הימני/התחתון — ישרים, מדויקים) והצלע העליונה
מהפריים הקודם/השלמה מטרית. נקודות שהאצבע מסתירה (צד פנימי לא-ירוק) או שמחוץ לפריים — לא נמדדות.

שימוש: python refine.py <video> <track.npz> <out.npz> [focal_px]
"""
import sys
import cv2
import numpy as np
from track_lib import greenness, luma, screen_level, bilinear, intersect, edge_offsets, SIDES
from model import load_shape, contour, project, side_of, UW, UH
from indicator import solve2, complete2

RECT = np.float32([[0, 0], [UW, 0], [UW, UH], [0, UH]])


def H_of(C):
    return cv2.getPerspectiveTransform(RECT, np.float32(C)).astype(np.float64)


def measure(Y, D, lvl, Hm, P, Nn, half, W, H, step=0.5):
    """נקודות-מודל ⇒ (אינדקסים, מיקום בתמונה, נורמל בתמונה, היסט-שפה תקף)."""
    x = project(Hm, P)
    x2 = project(Hm, P + 0.25 * Nn)
    n = x2 - x
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-12
    m = (x[:, 0] > half + 2) & (x[:, 0] < W - half - 3) & (x[:, 1] > half + 2) & (x[:, 1] < H - half - 3)
    idx = np.where(m)[0]
    if len(idx) == 0:
        return idx, None, None, np.zeros(0)
    e = edge_offsets(Y, D, lvl, x[idx], n[idx], half=half, step=step)
    g = ~np.isnan(e)
    return idx[g], x[idx[g]], n[idx[g]], e[g]


def fit_frame(fr, C0, sh, P, Nn, prior_sig, iters=(10, 6, 6, 6, 6), W=None, H=None, cache=None):
    if cache is None:
        Dm = greenness(fr); Ym = luma(fr); lvl = screen_level(Dm)
    else:
        Dm, Ym, lvl = cache
    C = np.array(C0, float)
    for it, half in enumerate(iters):
        Hm = H_of(C)
        idx, x, n, e = measure(Ym, Dm, lvl, Hm, P, Nn, half, W, H)
        if len(idx) < 30:
            return None
        J = np.zeros((len(idx), 8))
        d = 0.05
        for k in range(8):
            Ck = C.copy().reshape(-1); Ck[k] += d
            xk = project(H_of(Ck.reshape(4, 2)), P[idx])
            J[:, k] = ((xk - x) * n).sum(1) / d
        # IRLS (Tukey) על הבעיה המלינארית
        p = np.zeros(8)
        w = np.ones(len(e))
        for _ in range(8):
            r = e - J @ p
            s = max(0.35, 1.4826 * np.median(np.abs(r)))
            c = 4.0 * s
            w = np.where(np.abs(r) < c, (1 - (r / c) ** 2) ** 2, 0.0)
            A = J * w[:, None]
            Ap = np.diag(1.0 / prior_sig ** 2)
            bp = (C0.reshape(-1) - C.reshape(-1)) / prior_sig ** 2
            p = np.linalg.solve(J.T @ A + Ap, A.T @ e + bp)
        C = C + p.reshape(4, 2)
        if np.abs(p).max() < 0.01 and it >= 2:
            break
    Hm = H_of(C)
    idx, x, n, e = measure(Ym, Dm, lvl, Hm, P, Nn, 6.0, W, H, step=0.25)
    r = e
    s = max(0.25, 1.4826 * np.median(np.abs(r)))
    inl = np.abs(r) < max(1.0, 3.5 * s)
    return dict(C=C, idx=idx, x=x, n=n, res=r, inl=inl)


def top_search(Y, D, lvl, C0, P, Nn, topmask, W, H, rng=0.12, step=0.01, fine=0.002):
    """חיפוש-רשת דו-ממדי על מיקום הפינות העליונות לאורך הקווים השמאלי/הימני (s_l, s_r = יחס-אורך).
    ציון = מספר נקודות-מודל באזור העליון (חריץ + פינות עליונות) עם חציה בטווח 1 פיקסל."""
    BL, BR = C0[3], C0[2]
    vl, vr = C0[0] - BL, C0[1] - BR
    Pt, Nt = P[topmask], Nn[topmask]

    def score(sl, sr):
        C = np.array([BL + sl * vl, BR + sr * vr, BR, BL])
        idx, x, n, e = measure(Y, D, lvl, H_of(C), Pt, Nt, 4.0, W, H)
        return (np.clip(1.2 - np.abs(e), 0, 1)).sum() if len(e) else 0.0

    best = (score(1, 1), 1.0, 1.0)
    for st_, r_ in ((step, rng), (fine, 2 * step)):
        c_l, c_r = best[1], best[2]
        g = np.arange(-r_, r_ + 1e-9, st_)
        for a in g:
            for b in g:
                sc = score(c_l + a, c_r + b)
                if sc > best[0]:
                    best = (sc, c_l + a, c_r + b)
    sc, sl, sr = best
    return np.array([BL + sl * vl, BR + sr * vr, BR, BL]), sc


def fit_top(Y, D, lvl, C0, P, Nn, mask, W, H, iters=(6, 6, 6, 6)):
    """הקווים שמאל/ימין/תחתון קבועים (מדויקים); 2 דרגות-חופש: מיקום TL/TR לאורך הקווים, מותאם לחריץ ולאוזניים."""
    BL, BR = C0[3], C0[2]
    vl, vr = C0[0] - BL, C0[1] - BR
    Pt, Nt = P[mask], Nn[mask]
    s = np.array([1.0, 1.0])
    C_of = lambda s: np.array([BL + s[0] * vl, BR + s[1] * vr, BR, BL])
    for half in iters:
        C = C_of(s)
        idx, x, n, e = measure(Y, D, lvl, H_of(C), Pt, Nt, half, W, H)
        if len(e) < 15:
            return None
        J = np.zeros((len(e), 2))
        for k in range(2):
            sk = s.copy(); sk[k] += 1e-4
            xk = project(H_of(C_of(sk)), Pt[idx])
            J[:, k] = ((xk - x) * n).sum(1) / 1e-4
        p = np.zeros(2)
        for _ in range(8):
            r = e - J @ p
            sc = max(0.3, 1.4826 * np.median(np.abs(r)))
            c = 4.0 * sc
            w = np.where(np.abs(r) < c, (1 - (r / c) ** 2) ** 2, 0.0)
            A = J * w[:, None]
            p = np.linalg.solve(J.T @ A + 1e-9 * np.eye(2), A.T @ e)
        s = s + p
    return C_of(s)


def focal_from_H(Hm, W, H):
    T = np.array([[1, 0, -W / 2], [0, 1, -H / 2], [0, 0, 1]])
    G = T @ Hm
    h1, h2 = G[:, 0], G[:, 1]
    den = h1[2] * h2[2]
    if abs(den) < 1e-12:
        return np.nan
    f2 = -(h1[0] * h2[0] + h1[1] * h2[1]) / den
    return np.sqrt(f2) if f2 > 0 else np.nan


if __name__ == '__main__':
    SRC, TRK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
    # מצב 'ind': הצלע העליונה תמיד מחוץ לפריים (קליפ אנכי) ⇒ השלמה מפס-הבית (indicator.py), כיול y_cal,x_cal
    IND = tuple(float(v) for v in sys.argv[4].split(',')) if len(sys.argv) > 4 else None
    z = np.load(TRK, allow_pickle=True)
    sh = load_shape()
    P, Nn, Kind = contour(sh, 1.0)
    side = side_of(P)
    TOPM = (P[:, 1] < sh['R'] + 2) | (Kind == 2)
    TOPF = (Kind == 2) | ((Kind == 0) & (side == 'top'))       # חריץ + קטעי-הצלע העליונה (בלי קשתות-פינה)
    cap = cv2.VideoCapture(SRC)
    W, H = int(cap.get(3)), int(cap.get(4))
    N = int(z['N'])
    Cs = np.full((N, 4, 2), np.nan)
    st = np.full((N, 6), np.nan)            # n_meas n_inl rms_inl max_inl frac_inl top_inl
    per_side = np.full((N, 4, 3), np.nan)   # לכל צלע: n_inl rms max
    meas = {}
    mode = np.zeros(N, int)            # 1 = קווים+חריץ, 2 = התאמת-מודל מלאה (גיבוי)
    prevC = None
    prev2 = None
    prev_s2 = None
    prev_ratio = None
    scales = np.full((N, 2), np.nan)        # מצב ind: קנה-מידה בתחתית לכל צלע ארוכה (px/pt)
    for i in range(N):
        ok, fr = cap.read()
        if not ok:
            break
        L = {s: (None if np.isnan(z['line_' + s][i, 2]) else (z['line_' + s][i, :2], z['line_' + s][i, 2])) for s in SIDES}
        C0 = None
        if all(L[s] is not None for s in ('left', 'right', 'bottom')):
            BL = intersect(L['bottom'], L['left']); BR = intersect(L['bottom'], L['right'])
            if prevC is not None:
                # הצלע העליונה מהפריים הקודם (בהיסט התנועה של הפינות התחתונות)
                sh_ = 0.5 * ((BL - prevC[3]) + (BR - prevC[2]))
                pt = (prevC[0] + sh_, prevC[1] + sh_)
                d = pt[1] - pt[0]; nt = np.array([d[1], -d[0]]); nt /= np.linalg.norm(nt)
                top = (nt, float(nt @ pt[0]))
                TL = intersect(top, L['left']); TR = intersect(top, L['right'])
            elif L['top'] is not None:
                TL = intersect(L['top'], L['left']); TR = intersect(L['top'], L['right'])
            else:
                w_ = np.linalg.norm(BR - BL) / UW
                TL, TR = complete2(L, w_, w_)[:2]
            C0 = np.array([TL, TR, BR, BL])
        elif prevC is not None:
            C0 = prevC + (prevC - prev2 if prev2 is not None else 0)
        if C0 is None or not np.all(np.isfinite(C0)):
            prevC, prev2 = None, None
            continue
        cache = (greenness(fr), luma(fr), None)
        cache = (cache[0], cache[1], screen_level(cache[0]))
        if IND is not None and all(L[s_] is not None for s_ in ('left', 'right', 'bottom')):
            s2, rr = solve2(cache[1], L, IND, H_of, init=prev_s2)
            wpt_ = np.linalg.norm(intersect(L['bottom'], L['right']) - intersect(L['bottom'], L['left'])) / UW
            if s2 is not None and np.all(np.isfinite(s2)):
                ratio = np.log(s2 / wpt_)
                # קפיצה לא-סבירה ביחס (נקודת-שבת שגויה: הפס מוסתר והחיפוש ננעל על קו כהה אחר) ⇒ נדחה
                if prev_ratio is not None and np.abs(ratio - prev_ratio[0]).max() > 0.12 + 0.03 * (i - prev_ratio[1]):
                    s2 = None
                else:
                    scales[i] = s2
                    prev_s2 = s2
                    prev_ratio = (ratio, i)
            use = s2 if s2 is not None else prev_s2
            if use is not None:
                C0 = complete2(L, *use)
            else:
                w_ = np.linalg.norm(C0[2] - C0[3]) / UW
                C0 = complete2(L, w_, w_)
        out = np.array([(c[0] < -5 or c[0] > W + 5 or c[1] < -5 or c[1] > H + 5) for c in C0])
        sig = np.repeat(np.where(out, 2.0 if IND else 6.0, 25.0), 2)
        # הצלע העליונה: חיפוש-רשת כשהפינות העליונות בפריים (אחרת — prior מטרי)
        if IND is None and (not out[0] or not out[1]):
            C0, tsc = top_search(cache[1], cache[0], cache[2], C0, P, Nn, TOPM, W, H,
                                 rng=0.12 if prevC is None else 0.05)
        lines_ok = all(L[s_] is not None for s_ in ('left', 'right', 'bottom'))
        C = None
        if lines_ok and IND is None and (not out[0] or not out[1]):
            C = fit_top(cache[1], cache[0], cache[2], C0, P, Nn, TOPF, W, H)
        elif lines_ok:
            C = C0                      # הצלע העליונה מחוץ לפריים ⇒ השלמה מפס-הבית
        if C is None:
            r = fit_frame(fr, C0, sh, P, Nn, sig, W=W, H=H, cache=cache)
            if r is None:
                prevC, prev2 = None, None
                continue
            C = r['C']
            mode[i] = 2
        else:
            mode[i] = 1
        # מדידה סופית על כל הקונטור (לדיווח/אימות): היסט כל נקודת-שפה מהקונטור המותאם
        idx, x, n, e = measure(cache[1], cache[0], cache[2], H_of(C), P, Nn, 6.0, W, H, step=0.25)
        sc = max(0.25, 1.4826 * np.median(np.abs(e))) if len(e) else 1
        r = dict(C=C, idx=idx, x=x, n=n, res=e, inl=np.abs(e) < max(1.0, 3.5 * sc))
        if r['inl'].sum() < 20:
            mode[i] = 0
            continue
        C = r['C']
        Cs[i] = C
        inl = r['inl']; res = r['res']
        st[i] = (len(res), inl.sum(), np.sqrt(np.mean(res[inl] ** 2)), np.abs(res[inl]).max(), inl.mean(),
                 (inl & (side[r['idx']] == 'top')).sum())
        for k, s in enumerate(SIDES):
            m = inl & (side[r['idx']] == s)
            if m.sum():
                per_side[i, k] = (m.sum(), np.sqrt(np.mean(res[m] ** 2)), np.abs(res[m]).max())
        meas[i] = np.c_[r['idx'], r['x'], r['n'], res, inl].astype(np.float32)
        prev2, prevC = prevC, C
        if i % 40 == 0:
            print(i, 'meas', len(res), 'inl %.2f rms %.3f max %.3f top %d' % (inl.mean(), st[i, 2], st[i, 3], st[i, 5]),
                  'f=%.0f' % focal_from_H(H_of(C), W, H), flush=True)
    np.savez_compressed(OUT, C=Cs, mode=mode, scales=scales, ind=np.array(IND if IND else []), st=st, per_side=per_side, W=W, H=H, N=N,
                        meas_keys=np.array(list(meas.keys())), meas_vals=np.array(list(meas.values()), dtype=object))
    print('saved', OUT)
