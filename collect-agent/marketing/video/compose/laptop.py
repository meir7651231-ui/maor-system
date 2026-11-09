"""מסך הלפטופ (קליפ אנכי, מקור 722–745): המסך הירוק מוחלף בלוח-הבוקר של גבי ברוחב-דסקטופ.

מעקב: אותה שיטה כמו בטלפון — נקודות-גבול של הירוק שמאחוריהן מסגרת כהה ⇒ RANSAC של קווים ⇒ ריענון תת-פיקסל
(refine_line). שלוש צלעות נראות (עליונה, ימנית, תחתונה); הצלע השמאלית מחוץ לפריים ⇒ מושלמת במיפוי פרויקטיבי
חד-ממדי לאורך העליונה/התחתונה (נקודת-המגוז שלהן) עם יחס-מסך 16:10. השוט סטטי: הקווים לכל פריים נמדדים, ואם
הפיזור קטן מ-0.3px משתמשים בחציון (אפס רעד).
הרכבה: alpha = min(כיסוי-הקוואד, מפתח-ליניארי), שפה עם עידון מונחה על luma, הצללה ובוהק מהצילום, despill סביב.
"""
import cv2
import numpy as np
from track_lib import (greenness, luma, screen_level, boundary_candidates, ransac_lines, refine_line,
                       intersect, ang_ok)

ASPECT = 1.6


def _lines(fr):
    D = greenness(fr); Y = luma(fr); lvl = screen_level(D)
    pts, g, dark, M = boundary_candidates(fr, D, lvl, Y)
    cl = ransac_lines(pts[dark], g[dark], max_lines=6, tol=1.3, min_support=40)
    out = {}
    for n, c, ids in cl:
        n = np.asarray(n)
        if n[1] < -0.9:
            key = 'top'
        elif n[1] > 0.9 or (n[1] > 0.8 and n[0] > 0.2):
            key = 'bottom'
        elif n[0] > 0.8:
            key = 'right'
        else:
            continue
        if key in out:
            continue
        P = pts[dark][ids]
        t = np.array([-n[1], n[0]]); s = P @ t
        r = refine_line(n, c, Y, D, lvl, (s.min() + 25, s.max() - 25), step=1.0, half=6.0)
        out[key] = (r['n'], r['c']) if r is not None else (n, c)
    return out


def corners(L):
    """TL, TR, BR, BL (TL/BL מחוץ לפריים, משמאל)."""
    TR = intersect(L['top'], L['right']); BR = intersect(L['bottom'], L['right'])
    h_r = np.linalg.norm(TR - BR)
    hl = lambda l: np.array([l[0][0], l[0][1], -l[1]])
    V = np.cross(hl(L['top']), hl(L['bottom']))
    res = []
    for P0, ln in ((TR, L['top']), (BR, L['bottom'])):
        d = np.array([-ln[0][1], ln[0][0]])
        d = d if d[0] < 0 else -d                         # שמאלה
        if abs(V[2]) > 1e-9:
            Vp = V[:2] / V[2]; Dv = (Vp - P0) @ d
        else:
            Dv = np.inf
        u = ASPECT
        s = h_r * u / (1 + h_r * u / Dv) if np.isfinite(Dv) and Dv > 0 else h_r * u
        res.append(P0 + s * d)
    return np.array([res[0], TR, BR, res[1]])


def track(src, f0, f1):
    cap = cv2.VideoCapture(src); cap.set(1, f0)
    per = {}
    for i in range(f0, f1 + 1):
        ok, fr = cap.read()
        L = _lines(fr)
        if all(k in L for k in ('top', 'right', 'bottom')):
            per[i] = L
    C = {i: corners(L) for i, L in per.items()}
    arr = np.array([C[i] for i in sorted(C)])
    med = np.median(arr, 0)
    spread = float(np.abs(arr[:, 1:3] - med[1:3]).max())      # הפינות הנראות (TR, BR)
    if spread < 0.3:
        C = {i: med for i in range(f0, f1 + 1)}
    return C, spread, {i: per[i] for i in per}


def composite(fr, C, ui, guided, poly_cov, norm_blur, H_of_rect):
    """C: 4 פינות; ui: תמונת-UI (BGR). מחזיר פריים מורכב."""
    H, W = fr.shape[:2]
    h_ui, w_ui = ui.shape[:2]
    src = np.float32([[0, 0], [w_ui, 0], [w_ui, h_ui], [0, h_ui]])
    Hm = cv2.getPerspectiveTransform(src, np.float32(C))
    q = np.round(C).astype(int)
    x0 = max(0, int(min(C[:, 0].min(), W)) - 20); x1 = min(W, int(C[:, 0].max()) + 20)
    y0 = max(0, int(C[:, 1].min()) - 20); y1 = min(H, int(C[:, 1].max()) + 20)
    P = fr[y0:y1, x0:x1].astype(np.float32)
    D = greenness(fr[y0:y1, x0:x1]); Yp = luma(fr[y0:y1, x0:x1])
    # כיסוי הקוואד (דגימת-על ×4)
    ss = 4
    m = np.zeros(((y1 - y0) * ss, (x1 - x0) * ss), np.uint8)
    cv2.fillPoly(m, [np.round(((C - [x0, y0]) + 0.5) * ss - 0.5).astype(np.int32) * 1], 255)
    cov = cv2.resize(m, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    inner = cv2.erode((cov > 0.99).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
    lvl = float(np.median(D[inner & (D > 25)]))
    clean = (inner & (D > 0.7 * lvl)).astype(np.float32)
    n1, d1 = norm_blur(P, clean, 9)
    med = np.array([np.median(P[:, :, k][clean > 0]) for k in range(3)], np.float32)
    G = np.where(d1 > 0.05, n1 / np.maximum(d1, 1e-6), med)
    Dg = np.maximum(G[:, :, 1] - 0.5 * (G[:, :, 0] + G[:, :, 2]), 20)
    Yg = 0.114 * G[:, :, 0] + 0.587 * G[:, :, 1] + 0.299 * G[:, :, 2]
    a_lin = np.clip(cv2.GaussianBlur(D, (0, 0), 0.9) / Dg, 0, 1)
    a_key = np.clip(guided((Yp / 255.0).astype(np.float32), a_lin.astype(np.float32), r=5, eps=6e-4), 0, 1)
    a = np.where(cov > 0.99, 1.0, np.minimum(cov, a_key))
    a = np.where(inner, 1.0, a)
    # UI
    T = np.array([[1, 0, -x0], [0, 1, -y0], [0, 0, 1]])
    q_ = max(0.05, min(1.0, np.linalg.norm(C[1] - C[2]) / h_ui * 2))
    tex = cv2.copyMakeBorder(ui, 32, 32, 32, 32, cv2.BORDER_REPLICATE)
    if q_ < 1:
        tex = cv2.resize(tex, None, fx=q_, fy=q_, interpolation=cv2.INTER_AREA)
    sc = tex.shape[1] / (ui.shape[1] + 64)
    Tt = np.array([[sc, 0, 32 * sc], [0, sc, 32 * sc], [0, 0, 1]])
    warp = cv2.warpPerspective(tex, T @ Hm @ np.linalg.inv(Tt), (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
    warp = cv2.GaussianBlur(warp, (0, 0), 0.6)
    ref = float(np.median(Yg[clean > 0]))
    shade = np.clip((cv2.GaussianBlur(Yg, (0, 0), 25) / max(ref, 1)) ** 0.5, 0.85, 1.12)[..., None]
    deep = cv2.erode(inner.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    gl = cv2.GaussianBlur(np.clip((Yp - Yg - 8) / np.maximum(255 - Yg, 30), 0, 1) * deep, (0, 0), 2.0)
    UIp = warp * np.array([0.93, 0.97, 1.0], np.float32) * 0.92 * shade
    UIp = 255 - (255 - UIp) * (1 - 0.5 * gl[..., None])
    # רקע לפיקסלי-שפה: המקור עם G≤max(R,B)
    Pds = P.copy(); Pds[:, :, 1] = np.minimum(Pds[:, :, 1], np.maximum(Pds[:, :, 0], Pds[:, :, 2]))
    kb = np.clip((a_lin - 0.02) / 0.15, 0, 1)[..., None]
    Fn = (1 - kb) * P + kb * Pds
    out = (1 - a)[..., None] * Fn + a[..., None] * UIp
    res = fr.copy()
    res[y0:y1, x0:x1] = np.clip(np.round(out), 0, 255).astype(np.uint8)
    return res, (x0, y0, x1, y1), a
