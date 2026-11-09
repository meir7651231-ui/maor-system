"""השלמת הצלע העליונה כשהיא מחוץ לפריים (הקליפ האנכי): קנה-המידה לאורך הציר הארוך ליד התחתית נמדד
מפס-הבית (home indicator) — פס כהה במרחק ידוע מהצלע התחתונה (מכויל על הקליפ האופקי, שבו החריץ נראה).
עם נקודת-המגוז של הצלעות הארוכות (חיתוך שמאל/ימין) — מיפוי פרויקטיבי חד-ממדי לאורך כל צלע ארוכה
קובע את הפינות העליונות: t(u) = s·u / (1 + s·u/D), u = מרחק בנקודות-UI מהתחתית, D = מרחק נקודת-המגוז.
"""
import cv2
import numpy as np
from model import UW, UH, project
from track_lib import intersect

XR = (150.0, 240.0)       # טווח-x של פס-הבית (נקודות-UI) — בתוך הפס, הרחק מקצותיו המעוגלים
YR = (806.0, 843.0)


def ind_ridge(Y, Hm, ppt=6):
    """מיקום-y (במרחב-UI תחת Hm) של מרכז הפס הכהה; None אם לא נראה (מוסתר/מטושטש)."""
    nx, ny = int((XR[1] - XR[0]) * 2), int((YR[1] - YR[0]) * ppt)
    gx = np.linspace(XR[0], XR[1], nx)
    gy = np.linspace(YR[0], YR[1], ny)
    X, Yg = np.meshgrid(gx, gy)
    p = project(Hm, np.c_[X.ravel(), Yg.ravel()]).astype(np.float32)
    s = cv2.remap(Y.astype(np.float32), p[:, 0].reshape(ny, nx), p[:, 1].reshape(ny, nx), cv2.INTER_LINEAR,
                  borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    if (s < 0).any():
        return None
    s = cv2.GaussianBlur(s, (0, 0), 1.0)
    prof = np.median(s, 1)                       # חציון על פני העמודות — עמיד לאצבע חלקית
    j = int(np.argmin(prof[2:-2])) + 2
    base = np.median(prof)
    if prof[j] > base - 12:                      # אין פס כהה ברור
        return None
    if not (YR[0] + 4 < gy[0] + j * (gy[1] - gy[0]) < YR[1] - 3):   # מינימום על שולי-החלון = לא הפס
        return None
    # תת-פיקסל: פרבולה
    a, b, c = prof[j - 1], prof[j], prof[j + 1]
    den = a - 2 * b + c
    off = 0.5 * (a - c) / den if abs(den) > 1e-6 else 0
    return float(gy[0] + (j + off) * (gy[1] - gy[0]))


def ind_ends(Y, Hm, y0, ppt=4):
    """קצות פס-הבית בציר x (נקודות-UI) סביב שורת-המרכז y0 — לאומדן ההצרה הפרספקטיבית לרוחב."""
    xs = np.arange(95.0, 295.0, 1.0 / ppt)
    ys = np.array([y0 - 1.5, y0 - 0.75, y0, y0 + 0.75, y0 + 1.5])
    X, Yg = np.meshgrid(xs, ys)
    p = project(Hm, np.c_[X.ravel(), Yg.ravel()]).astype(np.float32)
    s = cv2.remap(Y.astype(np.float32), p[:, 0].reshape(X.shape), p[:, 1].reshape(X.shape), cv2.INTER_LINEAR,
                  borderMode=cv2.BORDER_CONSTANT, borderValue=-1)
    if (s < 0).any():
        return None
    prof = cv2.GaussianBlur(np.median(s, 0)[None], (0, 0), 1.5)[0]
    lo = np.median(prof[(xs > 160) & (xs < 230)])
    hi = np.median(np.r_[prof[xs < 105], prof[xs > 285]])
    if hi - lo < 12:
        return None
    mid = 0.5 * (hi + lo)
    dark = prof < mid
    c = np.argmin(np.abs(xs - 194))
    if not dark[c]:
        return None
    i = c
    while i > 0 and dark[i - 1]:
        i -= 1
    j = c
    while j < len(xs) - 1 and dark[j + 1]:
        j += 1
    if i == 0 or j == len(xs) - 1:
        return None
    fl = (prof[i - 1] - mid) / (prof[i - 1] - prof[i])
    fr = (prof[j] - mid) / (prof[j] - prof[j + 1])
    return float(xs[i - 1] + fl / ppt), float(xs[j] + fr / ppt)


def complete2(L, s_l, s_r):
    a = complete(L, s_l)
    b = complete(L, s_r)
    return np.array([a[0], b[1], a[2], a[3]])


def complete(L, s_b):
    """פינות TL,TR מהקווים left/right/bottom וקנה-מידה s_b (פיקסל לנקודה, לאורך הציר הארוך, בתחתית)."""
    BL = intersect(L['bottom'], L['left']); BR = intersect(L['bottom'], L['right'])
    up = -np.asarray(L['bottom'][0])
    hl = lambda l: np.array([l[0][0], l[0][1], -l[1]])
    V = np.cross(hl(L['left']), hl(L['right']))
    out = []
    for P0, ln in ((BL, L['left']), (BR, L['right'])):
        d = np.array([-ln[0][1], ln[0][0]])
        d = d if d @ up > 0 else -d
        if abs(V[2]) > 1e-9:
            Vp = V[:2] / V[2]
            D = (Vp - P0) @ d
        else:
            D = np.inf
        u = UH
        t = s_b * u / (1 + s_b * u / D) if np.isfinite(D) and abs(D) > 1e-6 else s_b * u
        out.append(P0 + t * d)
    return np.array([out[0], out[1], BR, BL])


def solve_scale(Y, L, y_cal, H_of, s0=None, iters=5):
    """נקודת-שבת של s: ממקמים את הפס לפי s, מודדים היכן הוא באמת, מתקנים. אתחול: סריקה גסה (או s0)."""
    BL = intersect(L['bottom'], L['left']); BR = intersect(L['bottom'], L['right'])
    w = np.linalg.norm(BR - BL) / UW
    cands = [s0] if s0 is not None else list(w * np.geomspace(0.2, 1.6, 28))
    best = None
    for s in cands:
        yr = ind_ridge(Y, H_of(complete(L, s)))
        if yr is None:
            continue
        s_new = s * (UH - yr) / (UH - y_cal)
        err = abs(np.log(s_new / s))
        if best is None or err < best[0]:
            best = (err, s_new)
    if best is None:
        return None, complete(L, s0 if s0 is not None else w)
    s = best[1]
    for _ in range(iters):
        yr = ind_ridge(Y, H_of(complete(L, s)))
        if yr is None:
            return None, complete(L, s)
        s_new = s * (UH - yr) / (UH - y_cal)
        if abs(s_new - s) < 1e-4 * s:
            s = s_new
            break
        s = s_new
    return s, complete(L, s)


def solve2(Y, L, cal, H_of, init=None, iters=8):
    """שתי דרגות-החופש החסרות (קנה-מידה בתחתית לכל צלע ארוכה) מפס-הבית: גובה-השורה שלו (y_cal) ומרכזו (x_cal)."""
    y_cal, x_cal = cal
    if init is None:
        s, _ = solve_scale(Y, L, y_cal, H_of)
        if s is None:
            return None, None
        v = np.log([s, s])
    else:
        v = np.log(init)

    def res(v):
        C = complete2(L, *np.exp(v))
        Hm = H_of(C)
        yr = ind_ridge(Y, Hm)
        if yr is None:
            return None
        e = ind_ends(Y, Hm, yr)
        if e is None:
            return np.array([yr - y_cal])
        return np.array([yr - y_cal, 0.5 * (e[0] + e[1]) - x_cal])

    for _ in range(iters):
        r = res(v)
        if r is None:
            return None, None
        if len(r) == 1:                        # בלי קצוות ⇒ רק קנה-מידה משותף
            J = np.zeros((1, 2))
            for k in range(2):
                dv = np.zeros(2); dv[k] = 1e-3
                rk = res(v + dv)
                if rk is None:
                    return None, None
                J[0, k] = (rk[0] - r[0]) / 1e-3
            step = -np.linalg.lstsq(np.r_[J, [[1, -1]]], np.r_[r, v[0] - v[1]] * np.r_[1, 0.2], rcond=None)[0]
        else:
            J = np.zeros((2, 2))
            for k in range(2):
                dv = np.zeros(2); dv[k] = 1e-3
                rk = res(v + dv)
                if rk is None or len(rk) < 2:
                    return None, None
                J[:, k] = (rk - r) / 1e-3
            step = -np.linalg.solve(J + 1e-9 * np.eye(2), r)
        step = np.clip(step, -0.2, 0.2)
        v = v + step
        if np.abs(step).max() < 1e-4:
            break
    r = res(v)
    return np.exp(v), (None if r is None else r)
