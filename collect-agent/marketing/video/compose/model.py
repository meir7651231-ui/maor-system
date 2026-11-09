"""מודל המסך במרחב-UI (נקודות-iOS): מלבן מעוגל 390×844 + חריץ (notch) עליון.

כל ההתאמה הגאומטרית נעשית מול קונטור המודל — כולל הפינות המעוגלות והחריץ — כך שגם הצלע העליונה
(שרובה חריץ ופינות) נקבעת במדויק. הפרמטרים (רדיוס פינה, מידות החריץ) מותאמים פעם אחת מהצילום (fit_shape.py)
ונשמרים ב-shape.json.
"""
import json
import os
import numpy as np

UW, UH = 390.0, 844.0
DEFAULT = dict(R=47.33, wn=200.0, dn=30.0, rb=18.0, rf=6.0)
HERE = os.path.dirname(os.path.abspath(__file__))


def load_shape():
    p = os.path.join(HERE, 'shape.json')
    if os.path.exists(p):
        d = dict(DEFAULT); d.update(json.load(open(p)))
        return d
    return dict(DEFAULT)


def contour(sh, step=1.0):
    """קונטור סגור (עם כיוון השעון במרחב y-למטה) + נורמל-חוצה לכל נקודה + תווית אזור.
    step = מרווח-דגימה בנקודות-UI. מחזיר (P[N,2], Nrm[N,2], kind[N]) — kind: 0 צלע ישרה, 1 פינה, 2 חריץ."""
    R, wn, dn, rb, rf = sh['R'], sh['wn'], sh['dn'], sh['rb'], sh['rf']
    cx = UW / 2
    xl, xr = cx - wn / 2, cx + wn / 2           # רוחב החריץ בקצה העליון (בין הפילטים)
    segs = []                                   # (points, normals, kind)

    def line(p0, p1, kind):
        p0, p1 = np.array(p0, float), np.array(p1, float)
        L = np.linalg.norm(p1 - p0)
        k = max(2, int(np.ceil(L / step)) + 1)
        t = np.linspace(0, 1, k)[:-1]
        P = p0 + t[:, None] * (p1 - p0)
        d = (p1 - p0) / L
        nrm = np.array([d[1], -d[0]])           # כיוון השעון (y למטה) ⇒ חוצה = (dy,-dx)
        segs.append((P, np.repeat(nrm[None], len(P), 0), kind))

    def arc(c, r, a0, a1, kind, convex=True):
        k = max(3, int(np.ceil(abs(a1 - a0) * r / step)) + 1)
        a = np.linspace(a0, a1, k)[:-1]
        P = np.stack([c[0] + r * np.cos(a), c[1] + r * np.sin(a)], 1)
        nr = np.stack([np.cos(a), np.sin(a)], 1)
        segs.append((P, nr if convex else -nr, kind))

    pi = np.pi
    # צלע עליונה שמאלית → פילט קעור → צד החריץ → פינה קמורה תחתונה → תחתית החריץ → ... (עם כיוון השעון)
    line((R, 0), (xl - rf, 0), 0)
    arc((xl - rf, rf), rf, -pi / 2, 0, 2)                                  # פילט: פינה קמורה של ה'אוזן'
    line((xl, rf), (xl, dn - rb), 2) if dn - rb > rf else None
    arc((xl + rb, dn - rb), rb, pi, pi / 2, 2, convex=False)               # פינה תחתונה של החריץ (קמורה לחריץ ⇒ קעורה למסך)
    line((xl + rb, dn), (xr - rb, dn), 2)
    arc((xr - rb, dn - rb), rb, pi / 2, 0, 2, convex=False)
    line((xr, dn - rb), (xr, rf), 2) if dn - rb > rf else None
    arc((xr + rf, rf), rf, pi, 3 * pi / 2, 2)
    line((xr + rf, 0), (UW - R, 0), 0)
    arc((UW - R, R), R, -pi / 2, 0, 1)
    line((UW, R), (UW, UH - R), 0)
    arc((UW - R, UH - R), R, 0, pi / 2, 1)
    line((UW - R, UH), (R, UH), 0)
    arc((R, UH - R), R, pi / 2, pi, 1)
    line((0, UH - R), (0, R), 0)
    arc((R, R), R, pi, 3 * pi / 2, 1)
    P = np.vstack([s[0] for s in segs]); Nn = np.vstack([s[1] for s in segs])
    K = np.concatenate([np.full(len(s[0]), s[2]) for s in segs])
    return P, Nn / np.linalg.norm(Nn, axis=1, keepdims=True), K


def polygon(sh, step=0.5):
    return contour(sh, step)[0]


def side_of(P):
    """תווית צלע לכל נקודת-קונטור (לדיווח): top/right/bottom/left לפי המיקום."""
    x, y = P[:, 0], P[:, 1]
    d = np.stack([y, UW - x, UH - y, x], 1)
    return np.array(['top', 'right', 'bottom', 'left'])[np.argmin(d, 1)]


def project(Hm, P):
    q = np.c_[P, np.ones(len(P))] @ Hm.T
    return q[:, :2] / q[:, 2:3]
