"""שלב 4 — זיהוי קצה-האצבע על המסך בכל פריים ומיפויו לקואורדינטות-UI (הומוגרפיה הפוכה).

מסתיר (occluder) = פיקסל לא-ירוק בתוך פוליגון-המסך שהוא עור (R>G) או כהה (צל-אצבע); בוהק/השתקפות בהירה
וניטרלית/צהבהבה על הזכוכית אינה מסתיר (היא תתווסף כבוהק מעל ה-UI). אצבע = רכיב מסתיר שנוגע בשפת המסך
(נכנס מבחוץ). הקצה = הנקודה ברכיב הרחוקה ביותר (במרחב-UI) מנקודת-הכניסה.

שימוש: python finger.py <video> <stab.npz> <out.npz> [debug_dir]
"""
import sys
import cv2
import numpy as np
from track_lib import greenness
from model import load_shape, contour, project, UW, UH
from refine import H_of


def screen_poly_mask(Hm, W, H, sh, shrink=0.0):
    P = contour(sh, 2.0)[0]
    x = project(Hm, P)
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.round(x * 4).astype(np.int32)], 255, cv2.LINE_8, shift=2)
    if shrink > 0:
        k = int(round(2 * shrink + 1))
        m = cv2.erode(m, np.ones((k, k), np.uint8))
    return m


def occluder_mask(fr, D, scr, lvl):
    f = fr.astype(np.int16)
    R, G, B = f[:, :, 2], f[:, :, 1], f[:, :, 0]
    Y = 0.299 * R + 0.587 * G + 0.114 * B
    notgreen = D < 0.45 * lvl
    skin = (R - G > 10)
    dark = Y < 70
    occ = ((notgreen & skin) | (dark & (D < 0.2 * lvl))) & (scr > 0)
    occ = cv2.morphologyEx(occ.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return occ


def analyse(fr, C, sh, W, H):
    Hm = H_of(C)
    D = greenness(fr)
    lvl = float(np.median(D[D > 30])) if (D > 30).sum() > 500 else 80
    scr = screen_poly_mask(Hm, W, H, sh)
    inner = screen_poly_mask(Hm, W, H, sh, shrink=3)
    occ = occluder_mask(fr, D, scr, lvl)
    band = (scr > 0) & (inner == 0)
    # מחוץ לפריים = גם "שפה" (אצבע שנכנסת מצד שחתוך בפריים)
    edge = np.zeros_like(band)
    edge[:2, :] = edge[-2:, :] = True
    edge[:, :2] = edge[:, -2:] = True
    band |= edge & (scr > 0)
    n, lab, st, _ = cv2.connectedComponentsWithStats(occ, 8)
    Hi = np.linalg.inv(Hm)
    best = None
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] < 25:
            continue
        comp = lab == k
        touch = comp & band
        if touch.sum() < 3:
            continue
        ys, xs = np.nonzero(comp)
        u = project(Hi, np.c_[xs, ys].astype(np.float64))
        ty, tx = np.nonzero(touch)
        ue = project(Hi, np.c_[tx, ty].astype(np.float64)).mean(0)
        d = np.linalg.norm(u - ue, axis=1)
        j = np.argmax(d)
        # קצה תת-פיקסל: ממוצע הנקודות שבטווח 4pt מהקצה
        near = d > d[j] - 4
        tip_ui = u[near].mean(0)
        tip_img = np.c_[xs[near], ys[near]].mean(0)
        cand = dict(tip_ui=tip_ui, tip_img=tip_img, entry_ui=ue, depth=float(d[j]), area=int(comp.sum()))
        if best is None or cand['depth'] > best['depth']:
            best = cand
    return best, occ, scr


if __name__ == '__main__':
    SRC, STB, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
    DBG = sys.argv[4] if len(sys.argv) > 4 else None
    z = np.load(STB, allow_pickle=True)
    C = z['C']; N = int(z['N'])
    sh = load_shape()
    cap = cv2.VideoCapture(SRC)
    W, H = int(cap.get(3)), int(cap.get(4))
    tip = np.full((N, 2), np.nan); tipi = np.full((N, 2), np.nan); ent = np.full((N, 2), np.nan)
    depth = np.zeros(N); area = np.zeros(N)
    for i in range(N):
        ok, fr = cap.read()
        if not ok or not np.isfinite(C[i]).all():
            continue
        r, occ, scr = analyse(fr, C[i], sh, W, H)
        if r is not None:
            tip[i], tipi[i], ent[i], depth[i], area[i] = r['tip_ui'], r['tip_img'], r['entry_ui'], r['depth'], r['area']
        if DBG and i % 12 == 0:
            v = fr.copy()
            v[occ > 0] = (0.5 * v[occ > 0] + (0, 0, 127)).astype(np.uint8)
            if r is not None:
                cv2.circle(v, tuple(np.round(r['tip_img']).astype(int)), 5, (255, 255, 0), 2)
                cv2.putText(v, '%d ui=(%.0f,%.0f) d=%.0f' % (i, *r['tip_ui'], r['depth']), (20, 40), 0, 1, (255, 255, 255), 2)
            cv2.imwrite(f'{DBG}/fg_{i:04d}.jpg', v)
    np.savez_compressed(OUT, tip=tip, tip_img=tipi, entry=ent, depth=depth, area=area)
    print('frames with finger', np.isfinite(tip[:, 0]).sum(), '/', N)
