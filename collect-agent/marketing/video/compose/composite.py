"""שלב 6 — הרכבה: מסך-ה-UI (ui_anim) מעוות פרספקטיבית אל המסך שנעקב, ממוסך במפתח-הירוק (האצבעות נשארות
מעל), unmix + despill בשוליים, התאמת בהירות/הצללה/בוהק מהצילום, טשטוש-תנועה בתזוזה מהירה, כתוביות וכרטיס-סיום.

שימוש: python composite.py <fmt h|v> <video> <stab.npz> <finger.npz> <plan.json> <ui_dir> <assets_dir> <out.mp4>
       [--calib out_calib.mkv]  ← רינדור-כיול: UI אפור-אחיד (לבדיקת שאריות-ירוק ויישור-שפה ב-verify.py)
"""
import sys
import json
import subprocess
import cv2
import numpy as np
from track_lib import greenness
from model import load_shape, contour, project
from refine import H_of
from finger import occluder_mask
from ui_anim import UIAnim, Finger

FMT, SRC, STB, FIN, PLAN, UI, ASSETS, OUT = sys.argv[1:9]
CALIB = sys.argv[sys.argv.index('--calib') + 1] if '--calib' in sys.argv else None
LIMIT = int(sys.argv[sys.argv.index('--frames') + 1]) if '--frames' in sys.argv else None
SH = load_shape()
PCONT = contour(SH, 1.0)[0]
z = np.load(STB, allow_pickle=True)
Cs = z['C']
STATUS = z['status']
BIAS = z['bias']
cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(3)); H = int(cap.get(4))
NF = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
anim = UIAnim(PLAN, UI, Finger(FIN, fps), fps)
caps = json.load(open(f'{ASSETS}/captions.json'))[FMT]
capimgs = [cv2.imread(f'{ASSETS}/cap_{FMT}_{i}.png', cv2.IMREAD_UNCHANGED) for i in range(len(caps))]
end = cv2.imread(f'{ASSETS}/end_{FMT}.png')
END_S, FADE = 4.5, 0.6
PAD = 64                                         # ריפוד-שכפול סביב ה-UI: אין שוליים שחורים גם בסטייה תת-פיקסלית


def poly_cov(Hm, roi, ss=4, shrink=0):
    """כיסוי (0..1) של צורת-המסך (מלבן מעוגל + חריץ) בתוך ROI, דגימת-על ss×."""
    x0, y0, x1, y1 = roi
    p = (project(Hm, PCONT) - [x0, y0] + 0.5) * ss - 0.5          # מרכזי-פיקסל: (i) ⇒ ((i+.5)·ss−.5)
    m = np.zeros(((y1 - y0) * ss, (x1 - x0) * ss), np.uint8)
    cv2.fillPoly(m, [np.round(p * 4).astype(np.int32)], 255, cv2.LINE_8, shift=2)
    if shrink:
        k = 2 * shrink * ss + 1
        m = cv2.erode(m, np.ones((k, k), np.uint8))
    return cv2.resize(m, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def guided(I, p, r=3, eps=4e-4):
    """מסנן מונחה (He et al.): מיישר את ה-alpha (שמקורו בכרומה דגומה-בחצי) לקצוות ה-luma ברזולוציה מלאה."""
    k = (2 * r + 1, 2 * r + 1)
    mI, mp = cv2.boxFilter(I, -1, k), cv2.boxFilter(p, -1, k)
    vI = cv2.boxFilter(I * I, -1, k) - mI * mI
    cIp = cv2.boxFilter(I * p, -1, k) - mI * mp
    a = cIp / (vI + eps)
    b = mp - a * mI
    return cv2.boxFilter(a, -1, k) * I + cv2.boxFilter(b, -1, k)


def norm_blur(img, m, sigma):
    num = cv2.GaussianBlur(img * m[..., None], (0, 0), sigma)
    den = cv2.GaussianBlur(m, (0, 0), sigma)[..., None]
    return num, den


def warp_ui(ui, Hm, roi, s_px):
    """UI (pt@2x) ⇒ ROI בתמונה. דגימה-מוקדמת (INTER_AREA) לכ-2 טקסלים לפיקסל-יעד, ואז bilinear."""
    x0, y0, x1, y1 = roi
    q = min(1.0, max(0.05, s_px))                # טקסלים ל-pt = 2q ⇒ ~2 טקסלים לפיקסל-פלט
    tex = cv2.copyMakeBorder(ui, PAD, PAD, PAD, PAD, cv2.BORDER_REPLICATE)
    if q < 1:
        tex = cv2.resize(tex, (int(round(tex.shape[1] * q)), int(round(tex.shape[0] * q))), interpolation=cv2.INTER_AREA)
    sx = tex.shape[1] / (ui.shape[1] + 2 * PAD); sy = tex.shape[0] / (ui.shape[0] + 2 * PAD)
    T = np.array([[2 * sx, 0, PAD * sx], [0, 2 * sy, PAD * sy], [0, 0, 1]])          # pt ⇒ טקסל
    Tr = np.array([[1, 0, -x0], [0, 1, -y0], [0, 0, 1]])
    M = Tr @ Hm @ np.linalg.inv(T)
    return cv2.warpPerspective(tex, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)


def local_scale(Hm):
    c = project(Hm, np.array([[195.0, 600.0], [196.0, 600.0], [195.0, 601.0]]))
    u, v = c[1] - c[0], c[2] - c[0]
    return float(np.sqrt(abs(u[0] * v[1] - u[1] * v[0])))


def despill_around(fr, Hm, protect=None):
    """אור-ירוק שהמסך הטיל על היד/השולחן (רחב מה-ROI): g ≤ max(r,b) + 4 (עור/עץ/אפור לא משתנים), והאור שהוסר
    מוחזר כאור ניטרלי חלש (מסך בהיר מאיר לבן). רק בסביבת הטלפון ורק מחוץ למסך (הצורה המותאמת)."""
    pc = project(Hm, PCONT)
    gx0, gy0 = np.maximum(0, np.floor(pc.min(0) - 160).astype(int))
    gx1, gy1 = np.minimum([W, H], np.ceil(pc.max(0) + 160).astype(int))
    if gx1 - gx0 < 4 or gy1 - gy0 < 4:
        return fr
    scr = np.zeros((gy1 - gy0, gx1 - gx0), np.uint8)
    cv2.fillPoly(scr, [np.round(pc - [gx0, gy0]).astype(np.int32)], 255)
    zm = cv2.GaussianBlur(cv2.dilate(scr, np.ones((181, 181), np.uint8)).astype(np.float32) / 255, (0, 0), 8)
    zm *= 1 - cv2.dilate(scr, np.ones((5, 5), np.uint8)).astype(np.float32) / 255
    if protect is not None:
        zm *= 1 - protect[gy0:gy1, gx0:gx1].astype(np.float32)
    R = fr[gy0:gy1, gx0:gx1].astype(np.float32)
    lim = np.maximum(R[:, :, 0], R[:, :, 2]) + 4
    sp = np.clip(R[:, :, 1] - lim, 0, None) * zm
    R[:, :, 1] -= sp
    R[:, :, 0] += 0.35 * np.minimum(sp, 20); R[:, :, 2] += 0.35 * np.minimum(sp, 20)
    out = fr.copy()
    out[gy0:gy1, gx0:gx1] = np.clip(R, 0, 255).astype(np.uint8)
    return out


PREV = {'hand': None, 'i': -9}


def fill_holes(m):
    """ממלא חורים סגורים במסכה בוליאנית (flood-fill מהשוליים)."""
    m8 = m.astype(np.uint8)
    hh, ww = m8.shape
    ff = np.pad(m8, 1)
    msk = np.zeros((hh + 4, ww + 4), np.uint8)
    cv2.floodFill(ff, msk, (0, 0), 2)
    return (ff[1:-1, 1:-1] != 2)


def composite(fr, i, ui):
    C = Cs[i]
    if not np.isfinite(C).all():
        return fr, None
    Hm = H_of(C)
    pc = project(Hm, PCONT)
    # חלש = לא נמדד, או נמדד רק מצלע אחת (הגאומטריה לא מאומתת) ⇒ המפתח קובע את הכיסוי
    weak = str(STATUS[i]) not in ('meas', 'refit') or np.isfinite(BIAS[i]).sum() < 2
    if not weak:
        # בדיקת-בטיחות: ירוק של המסך שנשאר מחוץ לצורה המותאמת (גאומטריה שגויה) ⇒ מצב-מפתח לפריים הזה
        pm0 = np.zeros((H, W), np.uint8)
        cv2.fillPoly(pm0, [np.round(pc).astype(np.int32)], 1)
        near = cv2.dilate(pm0, np.ones((121, 121), np.uint8)) > 0
        Df0 = greenness(fr)
        lv0 = float(np.median(Df0[(pm0 > 0) & (Df0 > 30)])) if ((pm0 > 0) & (Df0 > 30)).sum() > 200 else 80.0
        f16 = fr.astype(np.int16)
        mint0 = ((f16[:, :, 1] - np.maximum(f16[:, :, 0], f16[:, :, 2])) > 12) & (cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY) > 110) & (f16[:, :, 0] - f16[:, :, 2] > 10)
        strong = (Df0 > 0.7 * lv0) | mint0
        # ירוק-מסך חזק מחוץ לצורה, ששייך לאותו רכיב-ירוק כמו פנים-המסך (המסך "גולש" — גאומטריה שגויה);
        # אור-ירוק על כף-היד הוא רכיב נפרד ולא נספר
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(strong.astype(np.uint8), 8)
        inside_lab = np.unique(lab_[(pm0 > 0) & strong])
        out_m = near & ~(cv2.dilate(pm0, np.ones((15, 15), np.uint8)) > 0) & np.isin(lab_, inside_lab[inside_lab > 0])
        weak = int(out_m.sum()) > 600
    mg = 110 if weak else 30
    x0, y0 = np.floor(pc.min(0) - mg).astype(int); x1, y1 = np.ceil(pc.max(0) + mg).astype(int)
    if weak:
        # פריים חלש: ה-ROI מורחב לכל הירוק שמחובר לסביבת-המסך המאומד (הגאומטריה כאן לא מדויקת)
        Df = greenness(fr)
        gm = (Df > 25).astype(np.uint8)
        pm = np.zeros((H, W), np.uint8)
        cv2.fillPoly(pm, [np.round(pc).astype(np.int32)], 1)
        pm = cv2.dilate(pm, np.ones((41, 41), np.uint8))
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(gm, 8)
        for k in np.unique(lab_[(pm > 0) & (gm > 0)]):
            if k > 0 and st_[k, cv2.CC_STAT_AREA] > 200:
                bx, by, bw, bh = st_[k, :4]
                x0, y0, x1, y1 = min(x0, bx - 12), min(y0, by - 12), max(x1, bx + bw + 12), max(y1, by + bh + 12)
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if x1 - x0 < 10 or y1 - y0 < 10:
        return fr, None
    roi = (x0, y0, x1, y1)
    P = fr[y0:y1, x0:x1].astype(np.float32)
    D = greenness(fr[y0:y1, x0:x1])
    cov = poly_cov(Hm, roi)
    inner = poly_cov(Hm, roi, shrink=3)
    lvl = float(np.median(D[(cov > 0.99) & (D > 25)])) if ((cov > 0.99) & (D > 25)).sum() > 200 else 80.0
    Bc_, Gc_, Rc_ = P[:, :, 0], P[:, :, 1], P[:, :, 2]
    Yp = 0.114 * Bc_ + 0.587 * Gc_ + 0.299 * Rc_
    # פליטת-המסך G (הירוק הנקי + הצללה רכה): ממוצע-מנורמל של פיקסלים ירוקים-נקיים
    clean = ((D > 0.72 * lvl) & ((inner > 0.99) if not weak else (D > 0.85 * lvl))).astype(np.float32)
    n1, d1 = norm_blur(P, clean, 7)
    n2, d2 = norm_blur(P, clean, 28)
    med = np.array([np.median(P[:, :, k][clean > 0]) if clean.sum() > 50 else (75, 144, 33)[k] for k in range(3)], np.float32)
    G = np.where(d1 > 0.05, n1 / np.maximum(d1, 1e-6), np.where(d2 > 0.02, n2 / np.maximum(d2, 1e-6), med))
    Dg = np.maximum(G[:, :, 1] - 0.5 * (G[:, :, 0] + G[:, :, 2]), 20)
    Yg = 0.114 * G[:, :, 0] + 0.587 * G[:, :, 1] + 0.299 * G[:, :, 2]
    # ---------------- המאט, סבב 3. עיקרון: בתוך המסך הכול מסך (UI), חוץ מהיד. היד = רכיבי "לא-ירוק, לא-בוהק"
    # שיש בהם עור ושמחוברים ליד שמחוץ למסך (או לרכיב-היד בפריים הקודם — עקביות-זמן). בוהק/השתקפות על הזכוכית
    # (בהיר ודהוי) = מסך: מוחלף ב-UI ומתווסף כהדגשה רכה (screen blend מוגבל). צל-האצבע = מסך, מוכפל (multiply).
    D = cv2.GaussianBlur(D, (0, 0), 0.9)               # כרומה 4:2:0 ⇒ גושי 2×2; מפתח רציף ברזולוציה מלאה
    a_lin = np.clip(D / Dg, 0, 1)
    gG = np.maximum(G[:, :, 1], 1); gP = np.maximum(Gc_, 1)
    dist = cv2.GaussianBlur(np.abs(Rc_ / gP - G[:, :, 2] / gG) + np.abs(Bc_ / gP - G[:, :, 0] / gG), (0, 0), 0.9)
    a_chr = np.where(Yp > 12, np.clip(1 - (dist - 0.08) / 0.35, 0, 1), a_lin)      # כרומטיות-מסך (לא תלוי בהירות)
    # ירוק-דומיננטי (גם כהה/צל עם תאורה כחלחלה) = מסך: לעור/מסגרת/שולחן אין G>max(R,B)
    gdom = np.clip((cv2.GaussianBlur(Gc_ - np.maximum(Rc_, Bc_), (0, 0), 0.9) - 8) / 20, 0, 1)
    a_chr = np.maximum(a_chr, gdom)
    sat = P.max(2) - P.min(2)
    skin = ((Rc_ - Gc_) > 10) & ((Rc_ - Bc_) > 20)
    # בוהק על הזכוכית: בהיר ודהוי, או מנטה/תכלת בהירה (G,B ≫ R — לעור אף פעם אין)
    cyan = (Gc_ - Rc_ > 30) & (Bc_ - Rc_ > 20) & (Yp > 150) & (inner > 0.5)
    glare = ((((Yp > 105) & (sat < 60) & ((Rc_ - Gc_) < 12)) | ((Gc_ - np.maximum(Rc_, Bc_) > 6) & (Yp > 100))) & (a_chr < 0.9)) | cyan
    # --- אזור-המסך S
    if not weak:
        S0 = cov > 0.5
    else:
        gm = ((a_lin > 0.45) | (gdom > 0.5) | cyan).astype(np.uint8)
        ng, lg, sg, _ = cv2.connectedComponentsWithStats(gm, 8)
        keep = np.zeros(ng, bool); keep[np.unique(lg[(cov > 0.5) & (gm > 0)])] = True; keep[0] = False
        keep &= sg[:, cv2.CC_STAT_AREA] > 150
        S0 = fill_holes(keep[lg])
    cyan_e = ((Gc_ - Rc_ > 30) & (Bc_ - Rc_ > 20) & (Yp > 120)).astype(np.float32)   # בוהק-מנטה (זכוכית, לא מסגרת)
    cov3 = cv2.dilate(cov, np.ones((7, 7), np.uint8))
    if weak:
        S0 = fill_holes(S0 | ((cyan_e > 0) & (cov3 > 0.5)))
    # --- היד
    # בתוך המסך: לא-ירוק ולא-בוהק; מחוץ למסך: רק עור-בגוון (לא המסגרת הכהה, שמקיפה את המסך ותסגור אותו)
    skin_out = ((Rc_ - Bc_) > 12) & ((Rc_ - Gc_) > 4) & (Yp > 35)
    # צל על המסך (ירקרק-כהה: G≥R ומתחת לבהירות-המסך) — לא יד; יוכפל על ה-UI
    shadow_px = (Gc_ >= Rc_ - 2) & (Yp < 0.8 * Yg) & (Gc_ > Bc_) & (a_chr > 0.2)
    cand = np.where(S0, (a_chr < 0.5) & ~glare & ~shadow_px & (Yp > 22), skin_out).astype(np.uint8)
    nc, lc, sc_, _ = cv2.connectedComponentsWithStats(cand, 8)
    sk = np.bincount(lc[skin & (cand > 0)].ravel(), minlength=nc)
    outside = np.bincount(lc[~S0 & (cand > 0)].ravel(), minlength=nc)
    prevm = PREV['hand'][y0:y1, x0:x1] if PREV['hand'] is not None and PREV['i'] == i - 1 else None
    prev_ov = np.bincount(lc[(prevm > 0) & (cand > 0)].ravel(), minlength=nc) if prevm is not None else np.zeros(nc)
    hit = (sk >= 20) & ((outside >= 5) | (prev_ov >= 20) | weak)          # פריים חלש: כל רכיב-עור בתוך המסך = יד
    hit[0] = False
    hraw = hit[lc]
    holes = fill_holes(hraw) & ~hraw                   # הדגשות קטנות על האצבע (חורים סגורים) שייכות לאצבע; בוהק גדול — לא
    nh_, lh_, sh_, _ = cv2.connectedComponentsWithStats(holes.astype(np.uint8), 8)
    small = np.zeros(nh_, bool); small[1:] = sh_[1:, cv2.CC_STAT_AREA] <= 300
    hand = hraw | small[lh_]
    hand_full = np.zeros((H, W), np.uint8); hand_full[y0:y1, x0:x1] = hand
    PREV['hand'], PREV['i'] = cv2.dilate(hand_full, np.ones((9, 9), np.uint8)), i
    # weak: בוהק שנוגע במסך (בתוך סביבת-הצורה) — גם מסך
    if weak:
        gl = (glare & ~hand).astype(np.uint8)
        nl, ll, sl, _ = cv2.connectedComponentsWithStats(gl, 8)
        tch = np.zeros(nl, bool)
        tch[np.unique(ll[(cv2.dilate(S0.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0) & (gl > 0)])] = True
        tch[0] = False
        near = cv2.dilate((cov > 0.5).astype(np.uint8), np.ones((21, 21), np.uint8)) > 0
        S0 = fill_holes(S0 | (tch[ll] & (cov > 0.5)))
    if weak:
        S0 = cv2.GaussianBlur(S0.astype(np.float32), (0, 0), 1.6) > 0.5      # שפה חלקה (בלי מדרגות-כרומה)
    Sm = S0 & ~hand
    # --- alpha
    core = cv2.erode(hand.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    band = (cv2.dilate(hand.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & ~core
    a_hand = np.clip((a_chr - 0.15) / 0.7, 0, 1)
    # שפת-היד: מפתח-כרומה כשהשכן ירוק; מול בוהק (אין מפתח) — שפה רכה גאומטרית מהמסכה (σ≈1px), בלי מדרגות
    a_geo_h = 1 - np.clip(cv2.GaussianBlur(hand.astype(np.float32), (0, 0), 1.0) * 2 - 0.5, 0, 1)
    a_in = np.where(core, 0.0, np.where(band, np.where(glare, a_geo_h, a_hand), 1.0))
    a_in = np.where(band, cv2.GaussianBlur(a_in.astype(np.float32), (0, 0), 0.9), a_in)
    # פיקסלים מעורבים בתוך היד (טשטוש-תנועה של קצה האצבע מעל הירוק): שקיפות לפי המפתח הליניארי (לא עור)
    mixed = hand & ~skin & ~glare & (a_lin > 0.12)
    a_in = np.where(mixed, np.maximum(a_in, np.clip((a_lin - 0.12) / 0.7, 0, 1)), a_in)
    if not weak:
        a_y = cv2.GaussianBlur(np.clip((Yp - 25) / np.maximum(Yg - 25, 10), 0, 1), (0, 0), 0.7)
        edge = inner < 0.99
        # שפה: עד היכן שהירוק של המקור מגיע (מפתח ליניארי, ובוהק) — לכל היותר 2px מעבר לצורה המותאמת; לעולם לא מעבר
        cov2 = cv2.dilate(cov, np.ones((3, 3), np.uint8))
        a_key = np.maximum(a_lin, glare.astype(np.float32) * cov)
        # בוהק-מנטה צמוד לשפה: עד 3px מעבר לצורה רק כשהוא מחובר לבוהק בפנים (לא הדגשת-המסגרת)
        cy_in = (cyan_e > 0) & (cov3 > 0.5)
        ncy, lcy, _, _ = cv2.connectedComponentsWithStats(cy_in.astype(np.uint8), 8)
        okc = np.zeros(ncy, bool); okc[np.unique(lcy[cy_in & (inner > 0.99)])] = True; okc[0] = False
        cy_ok = okc[lcy].astype(np.float32)
        a_geo = np.where(cov > 0.99, 1.0, np.maximum(np.minimum(cov, a_key), np.minimum(cov3, cv2.GaussianBlur(cy_ok, (0, 0), 0.7))))
        a = np.minimum(a_in, a_geo)
    else:
        k = np.maximum(np.maximum(np.clip(a_lin / 0.7, 0, 1), cv2.GaussianBlur(np.maximum(glare.astype(np.float32), cyan_e), (0, 0), 0.8)), np.clip(gdom * 2, 0, 1))
        Ssoft = cv2.GaussianBlur(S0.astype(np.float32), (0, 0), 0.8)
        inner_w = cv2.erode(S0.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
        a = a_in * np.where(inner_w, 1.0, np.minimum(Ssoft, cv2.GaussianBlur(k, (0, 0), 0.7)))
    a = np.clip(a, 0, 1)
    # ---------------- UI: הצללה מהמסך; צל-אצבע = multiply; בוהק = screen-blend מוגבל
    s_px = local_scale(Hm)
    good_nb = 0 < i < len(Cs) - 1 and all(str(STATUS[j]) in ('meas', 'refit') for j in (i - 1, i, i + 1))
    if good_nb and np.abs(Cs[i + 1] - Cs[i - 1]).max() > 6:
        acc = 0
        for u in np.linspace(-0.25, 0.25, 9):
            dC = (Cs[i + 1] - C) * u if u > 0 else (C - Cs[i - 1]) * u
            dC = dC * min(1.0, 8.0 / max(1e-6, np.abs(dC).max()))
            acc = acc + warp_ui(ui, H_of(C + dC), roi, s_px)
        warp = acc / 9
    else:
        warp = warp_ui(ui, Hm, roi, s_px)
    warp = cv2.GaussianBlur(warp, (0, 0), 0.55)
    clean = clean > 0
    ref = float(np.median(Yg[clean])) if clean.sum() > 50 else float(Yg.mean())
    shade = np.clip((cv2.GaussianBlur(Yg, (0, 0), 20) / max(ref, 1)) ** 0.5, 0.86, 1.12)[..., None]
    rel = Yp / np.maximum(Yg, 1)
    # סביב היד (עד ~12px): unmix פיזיקלי (out = P − α·G + α·UI) — צל = כפלי, טשטוש-תנועה ושולי-אצבע = מעורבים,
    # בלי מסכת-בוהק ובלי צל נפרד (שיצרו הילה/נקודות לבנות)
    near_h = (cv2.dilate(hand.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))) > 0) & S0
    # בוהק/השתקפות גדולים (≥150px) ליד היד נשארים "מסך" (UI + הדגשה); נקודות-בוהק קטנות בשפת-האצבע = ערבוב
    glb = (glare | (cyan_e > 0)).astype(np.uint8)
    ngb, lgb, sgb, _ = cv2.connectedComponentsWithStats(glb, 8)
    bigg = np.zeros(ngb, bool); bigg[1:] = sgb[1:, cv2.CC_STAT_AREA] >= 150
    glare_big = bigg[lgb] & ~hand
    mixr = near_h & ~glare_big
    shad = np.where(Sm & ~glare & ((a_chr > 0.4) | shadow_px), np.clip(rel, 0.35, 1.0), 1.0)   # מפת-צל אחת לכל המסך (בלי תפר)
    shad = cv2.GaussianBlur(shad.astype(np.float32), (0, 0), 1.2)
    shad = 0.25 + 0.75 * shad                          # צל רך ומוגבל (לא כתם אטום)
    shad = np.where(shad > 0.97, 1.0, shad / 0.97)
    g = np.clip((Yp - Yg - 8) / np.maximum(255 - Yg, 30), 0, 1) * (Sm & ~band & ~near_h)
    g = cv2.GaussianBlur(g.astype(np.float32), (0, 0), 1.5)
    tint = np.array([0.95, 0.985, 1.0], np.float32)
    UIp = warp * (0.9 * tint) * shade * shad[..., None]
    UIp = 255 - (255 - UIp) * (1 - 0.55 * g[..., None])
    # ---------------- חזית: היד = המקור; שולי-היד = צבע-האצבע הטהורה הסמוכה + despill ניטרלי; מסגרת = שכנים לא-ירוקים
    pure_b = (a_lin < 0.05).astype(np.float32)
    nb1, db1 = norm_blur(P, pure_b, 1.5)
    nb2, db2 = norm_blur(P, pure_b, 5.0)
    Bcol = np.where(db1 > 0.02, nb1 / np.maximum(db1, 1e-6), np.where(db2 > 0.002, nb2 / np.maximum(db2, 1e-6), P))
    kb = np.clip((a_lin - 0.02) / 0.15, 0, 1)[..., None]
    Fn = (1 - kb) * P + kb * Bcol
    pure_f = (core & (a_chr < 0.1)).astype(np.float32)
    nf1, df1 = norm_blur(P, pure_f, 2.0)
    nf2, df2 = norm_blur(P, pure_f, 6.0)
    Fcol = np.where(df1 > 0.02, nf1 / np.maximum(df1, 1e-6), np.where(df2 > 0.002, nf2 / np.maximum(df2, 1e-6), P))
    Fn = np.where((band | hand)[..., None], P, Fn)          # היד ושוליה: פיקסלי-המקור (despill בלבד)
    # despill ניטרלי בשולי-היד שנוגעים במסך (עד ~4px פנימה; אור-המסך הירוק על העור) ובפיקסלים המעורבים
    hand_edge = hand & (cv2.dilate((Sm & ~hand).astype(np.uint8), np.ones((15, 15), np.uint8)) > 0) & ~skin
    # despill: שולי-היד — ניטרלי; כל היד — ירוק לא מעל max(R,B) (אור-ירוק מהמסך על הצד-התחתון של האצבע); עור לא נוגעים
    lim = np.where(band, 0.5 * (Fn[:, :, 0] + Fn[:, :, 2]) + 4, np.maximum(Fn[:, :, 0], Fn[:, :, 2]) + 2)
    ring = (cov3 > 0.02) & (cov < 0.99) & (a_lin > 0.02) & ~hand
    tinted = (D > 2) & (((((a > 0.01) & (a < 0.999)) | hand | band) & (cv2.dilate(S0.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0)) | ring)
    Fn[:, :, 1] = np.where(tinted, np.minimum(Fn[:, :, 1], lim), Fn[:, :, 1])
    # טבעת-השפה מחוץ לצורה (עד 3px) שבה נשאר ירוק-מסך (טשטוש/דגימת-כרומה): צבע-המסגרת השכנה — לא UI ולא ירוק
    ka = np.maximum(np.clip(a / 0.02, 0, 1), (((hand | band) & S0) | ring).astype(np.float32))[..., None]
    Fn = (1 - ka) * P + ka * Fn
    fing = hand
    out = (1 - a)[..., None] * Fn + a[..., None] * UIp
    # שולי-היד ופיקסלים מעורבים (לא עור, לא בוהק): unmix מדויק לפי המפתח הליניארי — out = P − α·G + α·UI
    # (המקור פחות תרומת-הירוק, ועוד ה-UI באותה מידה; אין חלוקה ב-(1−α) ⇒ אין הגברת-רעש, אין קו כהה/בהיר)
    if mixr.any():
        # סביב היד: alpha רך מכרומטיות (לא מסכה בינארית) — חזית = היד ושוליה (≤2px), לא בוהק; כל השאר מסך
        hd = np.clip(cv2.GaussianBlur(cv2.dilate(hand.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32), (0, 0), 1.2) * 1.5, 0, 1)
        fg = np.clip((0.6 - a_chr) / 0.45, 0, 1) * hd * ~(glare & ~hand)
        fg = np.maximum(fg, (hand & (a_lin < 0.12) & (a_chr < 0.3)).astype(np.float32))
        fg = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.9)
        Fh = P.copy()
        lm = 0.5 * (Fh[:, :, 0] + Fh[:, :, 2]) + 4
        Fh[:, :, 1] = np.minimum(Fh[:, :, 1], lm)        # despill ניטרלי (עור רגיל לא משתנה: אצלו G < (R+B)/2)
        Fh = np.where((fg < 0.98)[..., None], np.where((pure_f > 0)[..., None], Fh, Fcol * 0.5 + Fh * 0.5), Fh)
        UIs = UIp
        an = 1 - fg
        # פיקסל מעורב: חזית מוכפלת-מראש = P − α·G (unmix; צל על המסך ⇒ ≈0) — לא P מנוקה (שיצר הילה אפורה);
        # הליבה האטומה של היד = המקור עם despill ניטרלי (אור-מסך ירוק על צד-האצבע ⇒ ניטרלי)
        # צבע-החזית בפיקסל מעורב = צבע האצבע הטהורה הקרובה (normalized blur), לא P−α·G (שיוצר מגנטה/אפור)
        pf = (fg >= 0.98).astype(np.float32)
        nq1, dq1 = norm_blur(Fh, pf, 2.5)
        nq2, dq2 = norm_blur(Fh, pf, 9.0)
        Fq = np.where(dq1 > 0.03, nq1 / np.maximum(dq1, 1e-6), np.where(dq2 > 0.003, nq2 / np.maximum(dq2, 1e-6), Fh))
        prem = (1 - an)[..., None] * Fq
        core_out = np.where((fg >= 0.98)[..., None], Fh, prem)
        out = np.where(mixr[..., None], np.where((fg >= 0.98)[..., None], Fh, prem + an[..., None] * UIs), out)
        a = np.where(mixr, an, a)
    # despill אחרון על הפלט: פיקסלים שבמקור היו ירקרקים והפלט בהם הוא בעיקר חזית (α<0.5) — G≤max(R,B)+2
    fin_sp = (D > 2) & (a < 0.5) & (cv2.dilate(hand.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0)
    lim2 = 0.5 * (out[:, :, 0] + out[:, :, 2]) + 4                 # אור-מסך ירוק על העור ⇒ ניטרלי
    out[:, :, 1] = np.where(fin_sp, np.minimum(out[:, :, 1], lim2), out[:, :, 1])
    res = fr.copy()
    res[y0:y1, x0:x1] = np.clip(np.round(out), 0, 255).astype(np.uint8)
    # אור-ירוק סביב (על היד/השולחן) — אחרי ההרכבה, רק מחוץ למה שה-UI כיסה
    prot = np.zeros((H, W), np.uint8)
    prot[y0:y1, x0:x1] = cv2.dilate((a > 0.01).astype(np.uint8), np.ones((3, 3), np.uint8))
    res = despill_around(res, Hm, prot)
    return res, dict(roi=roi, a=a, a_lin=a_lin, cov=cov, fing=fing)


def over(base, rgba):
    al = rgba[:, :, 3:4].astype(np.float32) / 255
    return (base * (1 - al) + rgba[:, :, :3] * al).astype(np.uint8)


if __name__ == '__main__':
    tgt = CALIB or OUT
    dur = NF / fps
    args = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-']
    if CALIB:
        args += ['-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', tgt]          # כיול: ללא-אבדן (מדדי-פיקסל מדויקים)
    else:
        args += ['-i', SRC, '-map', '0:v', '-map', '1:a?', '-af', f'apad,afade=t=out:st={dur - 1.5}:d={1.5 + END_S}',
                 '-t', str(dur + END_S), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
                 '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', tgt]
    ff = subprocess.Popen(args, stdin=subprocess.PIPE)
    gray = np.full((1688, 780, 3), 200, np.uint8)
    i = 0
    while True:
        ok, fr = cap.read()
        if not ok or (LIMIT and i >= LIMIT):
            break
        t = i / fps
        ui = gray if CALIB else anim.render(t)
        fr, _ = composite(fr, i, ui)
        if not CALIB:
            for c, im in zip(caps, capimgs):
                if c['a'] <= t <= c['b']:
                    k = min(1, (t - c['a']) / 0.3, (c['b'] - t) / 0.3)
                    im2 = im.copy(); im2[:, :, 3] = (im2[:, :, 3] * k).astype(np.uint8)
                    fr = over(fr, im2)
            if t > dur - FADE:
                k = (t - (dur - FADE)) / FADE
                fr = cv2.addWeighted(fr, 1 - k, end, k, 0)
        ff.stdin.write(fr.tobytes()); i += 1
        if i % 120 == 0:
            print(i, flush=True)
    if not CALIB:
        for _ in range(int(END_S * fps)):
            ff.stdin.write(end.tobytes())
    ff.stdin.close(); ff.wait(); print('done', tgt, i)
