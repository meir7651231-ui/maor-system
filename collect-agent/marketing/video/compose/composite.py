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
    # ---------------- המאט (ברזולוציה מלאה, בלי מסכות-גושים ובלי מורפולוגיה שמכרסמת באצבע)
    # a_lin = D/D(G): מפתח ליניארי. "ירוק בבירור" נבחן גם לפי כרומטיות (R/G, B/G) קרובה לזו של המסך —
    # בלי תלות בבהירות: צל על המסך = מסך; עור (גם מואר-ירוק) = חזית.
    # הכרומה בווידאו דגומה-בחצי (4:2:0) ומופיעה כגושי 2×2 אחרי פענוח ⇒ החלקה קלה (σ≈0.9) לפני המפתח —
    # מפתח רציף ברזולוציה מלאה, בלי דיתור/מדרגות בשפה
    D = cv2.GaussianBlur(D, (0, 0), 0.9)
    a_lin = np.clip(D / Dg, 0, 1)
    gG = np.maximum(G[:, :, 1], 1); gP = np.maximum(Gc_, 1)
    dist = cv2.GaussianBlur(np.abs(Rc_ / gP - G[:, :, 2] / gG) + np.abs(Bc_ / gP - G[:, :, 0] / gG), (0, 0), 0.9)
    a_chr = np.where(Yp > 15, np.clip(1 - (dist - 0.08) / 0.35, 0, 1), a_lin)
    # בוהק-מנטה בהיר על הזכוכית (ירקרק-תכלכל: B>R — בניגוד לעור מואר-ירוק שבו R>B)
    a_mint = np.clip(((Gc_ - np.maximum(Rc_, Bc_)) - 8) / 12, 0, 1) * np.clip((Yp - 95) / 20, 0, 1) * np.clip((Bc_ - Rc_ - 5) / 10, 0, 1)
    refl = (np.abs(Rc_ - Gc_) < 12) & (Gc_ - Bc_ > 15) & (Yp > 120)                    # השתקפות צהבהבה
    glare_n = ((Rc_ - Bc_) < 10) & (Yp > 110)                                           # בוהק ניטרלי/תכלכל
    skin = ((Rc_ - Gc_) > 10) & ((Rc_ - Bc_) > 20) & ~refl
    # שולי-ההשתקפות (מעבר לירוק) — שייכים להשתקפות, לא לאצבע: הרחבה של 3px שלא נוגעת בעור
    refl = refl | ((cv2.dilate(refl.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0) & ~skin & (a_chr > 0.15))
    # חזית = אצבע/יד: רכיב "לא-ירוק" (לא בוהק, לא המסגרת הכהה מאוד) שיש בו עור (≥10 פיקסלים).
    fgc = ((a_chr < 0.5) & (a_mint < 0.5) & ~refl & ~glare_n & (Yp > 30)).astype(np.uint8)
    # קווים דקים (שולי-מעבר בין ירוק להשתקפות) אינם אצבע: פתיחה 5×5 לפני תיוג-רכיבים, ואז שחזור לשפה המקורית
    k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fgo = cv2.morphologyEx(fgc, cv2.MORPH_OPEN, k5)
    nfc, labf, stf, _ = cv2.connectedComponentsWithStats(fgo, 8)
    hit = np.bincount(labf[skin & (fgo > 0)].ravel(), minlength=nfc) >= 10
    hit[0] = False
    core = hit[labf].astype(np.uint8)
    fing = (cv2.dilate(core, k5) > 0) & (fgc > 0)
    # משקל רך (בלי מדרגות) בין "ליד אצבע: רק המפתח, האצבע אטומה" לבין "מסך"
    wfg = np.clip(cv2.GaussianBlur(cv2.dilate(fing.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 1.5) * 1.6, 0, 1)
    wfg = np.maximum(wfg, fing.astype(np.float32))
    shade_scr = np.where(a_chr > a_lin, a_chr, 0)                     # צל על המסך (כרומטיות-מסך, כהה יותר)
    a_scr = np.maximum(a_lin, np.maximum(shade_scr, np.maximum(a_mint, (refl | (glare_n & (inner > 0.5))).astype(np.float32))))
    if weak:
        # גאומטריה לא-מאומתת: רק רכיב-המסך הראשי (ירוק שנוגע בצורה המאומדת) וחורים סגורים בו — לא אור-ירוק על היד
        gmain = ((a_lin > 0.5) | (a_mint > 0.5)).astype(np.uint8)
        ng, lg, sg, _ = cv2.connectedComponentsWithStats(gmain, 8)
        keep = np.zeros(ng, bool); keep[np.unique(lg[(cov > 0.5) & (gmain > 0)])] = True; keep[0] = False
        ffm = keep[lg].astype(np.uint8); hh_, ww_ = ffm.shape; mm = np.zeros((hh_ + 2, ww_ + 2), np.uint8)
        for sx, sy in ((0, 0), (ww_ - 1, 0), (0, hh_ - 1), (ww_ - 1, hh_ - 1)):
            if ffm[sy, sx] == 0:
                cv2.floodFill(ffm, mm, (sx, sy), 2)
        region = cv2.dilate((ffm != 2).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
        a_scr = a_scr * np.clip(cv2.GaussianBlur(region, (0, 0), 1.2) * 1.5, 0, 1)
    # ליד אצבע: כל מה שלא ירוק בבירור = חזית אטומה; מעבר רך לפי המפתח
    a_f = np.clip((np.minimum(a_chr, a_lin / 0.6) - 0.15) / 0.7, 0, 1)
    a = wfg * a_f + (1 - wfg) * a_scr
    # שפת-המסך: לעולם לא מעבר לירוק של המקור. כרומה נמרחת ~1px על המסגרת הכהה ⇒ חסם-בהירות; הצורה המותאמת
    # רק חוסמת (+1px), לעולם לא מרחיבה.
    a_y = cv2.GaussianBlur(np.clip((Yp - 25) / np.maximum(Yg - 25, 10), 0, 1), (0, 0), 0.7)
    edge = inner < 0.99
    a = np.where(edge, wfg * a + (1 - wfg) * np.minimum(a, a_y), a)
    if not weak:
        a = np.minimum(a, cov)                            # הצורה המותאמת חוסמת בלבד (בלי הרחבה)
        fill = (inner > 0.5) & ~fing                      # הצורה ממלאת (בוהק/השתקפות/פס-הבית) — בפנים בלבד
    else:
        gk = ((a > 0.5) | (a_mint > 0.5)).astype(np.uint8); ff = gk.copy(); hh, ww = ff.shape; msk = np.zeros((hh + 2, ww + 2), np.uint8)
        for sx, sy in ((0, 0), (ww - 1, 0), (0, hh - 1), (ww - 1, hh - 1)):
            if ff[sy, sx] == 0:
                cv2.floodFill(ff, msk, (sx, sy), 2)
        fill = (ff == 0) & ~fing
    # פס-הבית של הצילום: מוחלף כולו (ה-UI מציג את שלו) — מלבן במרחב-UI, רק במקום שיש סביבו מסך, לא על אצבע
    ind = np.zeros(a.shape, np.uint8)
    rect = np.array([[100.0, 815.0], [290.0, 815.0], [290.0, 842.0], [100.0, 842.0]])
    cv2.fillPoly(ind, [np.round(project(Hm, rect) - [x0, y0]).astype(np.int32)], 1)
    ind = (ind > 0) & (cv2.dilate((a > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0) & ~fing & (Yp > 0)
    if not weak:
        ind &= cov > 0.99
    fill = fill | ind
    a = np.where(fill, wfg * a + (1 - wfg) * 1.0, a)
    # רכות-השפה כמו במקור (הצילום רך ~1px): החלקה קלה של ה-alpha ברצועת-המסגרת בלבד, שוב חסומה בצורה
    a_s = np.minimum(cv2.GaussianBlur(a.astype(np.float32), (0, 0), 0.8), a)      # מרכך פנימה בלבד — לא מתפשט החוצה
    a = np.where(edge & (wfg < 0.3) & ~fill, a_s, a)
    # ---------------- UI: בהירות/הצללה מהמסך בצילום; בוהק רק בפנים, הרחק מעור ומהשפה (לא יוצר שפה בהירה)
    s_px = local_scale(Hm)
    good_nb = 0 < i < len(Cs) - 1 and all(str(STATUS[j]) in ('meas', 'refit') for j in (i - 1, i, i + 1))
    if good_nb and np.abs(Cs[i + 1] - Cs[i - 1]).max() > 6:
        # טשטוש-תנועה (צמצם 180°) — רק בין פריימים נמדדים, מוגבל ל-8px לחצי-צמצם
        acc = 0
        for u in np.linspace(-0.25, 0.25, 9):
            dC = (Cs[i + 1] - C) * u if u > 0 else (C - Cs[i - 1]) * u
            dC = dC * min(1.0, 8.0 / max(1e-6, np.abs(dC).max()))
            acc = acc + warp_ui(ui, H_of(C + dC), roi, s_px)
        warp = acc / 9
    else:
        warp = warp_ui(ui, Hm, roi, s_px)
    warp = cv2.GaussianBlur(warp, (0, 0), 0.55)
    ref = float(np.median(Yg[clean > 0])) if clean.sum() > 50 else float(Yg.mean())
    shade = np.clip((cv2.GaussianBlur(Yg, (0, 0), 20) / max(ref, 1)) ** 0.5, 0.86, 1.12)[..., None]
    shadow = np.where((shade_scr > a_lin + 0.05) & (wfg < 0.5), np.clip(Yp / np.maximum(Yg, 1), 0, 1), 1.0)
    deep = (cv2.erode((inner > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) if not weak else fill
    glare = cv2.GaussianBlur(np.clip(Yp - Yg - 5, 0, None) * (fill & deep & ~ind), (0, 0), 1.5) * 0.35
    tint = np.array([0.95, 0.985, 1.0], np.float32)
    UIp = warp * (0.9 * tint) * shade * (0.8 + 0.2 * shadow)[..., None] + glare[..., None]
    # ---------------- חזית/רקע לפיקסלים מעורבים (בלי חלוקה ב-(1−a) שמגבירה רעש-דחיסה):
    # מסגרת — צבע השכנים הלא-ירוקים; אצבע — צבע האצבע הטהורה הסמוכה; פיקסל שה-UI לא מכסה — המקור עצמו.
    pure_b = (a_lin < 0.05).astype(np.float32)
    nb1, db1 = norm_blur(P, pure_b, 1.5)
    nb2, db2 = norm_blur(P, pure_b, 5.0)
    Bcol = np.where(db1 > 0.02, nb1 / np.maximum(db1, 1e-6), np.where(db2 > 0.002, nb2 / np.maximum(db2, 1e-6), P))
    kb = np.clip((a_lin - 0.02) / 0.15, 0, 1)[..., None]            # מעבר רציף (בלי דיתור פיקסל-פיקסל)
    Fn = (1 - kb) * P + kb * Bcol
    pure_f = (fing & (a_chr < 0.05) & (a_lin < 0.1)).astype(np.float32)
    nf1, df1 = norm_blur(P, pure_f, 2.0)
    nf2, df2 = norm_blur(P, pure_f, 6.0)
    Fcol = np.where(df1 > 0.02, nf1 / np.maximum(df1, 1e-6), np.where(df2 > 0.002, nf2 / np.maximum(df2, 1e-6), P))
    kf = np.clip(a_f * 2.5, 0, 1)[..., None] * (1 - pure_f[..., None])
    Ffing = (1 - kf) * P + kf * Fcol
    Fn = wfg[..., None] * Ffing + (1 - wfg[..., None]) * Fn
    ka = np.clip(a / 0.02, 0, 1)[..., None]
    Fn = (1 - ka) * P + ka * Fn
    # despill רק ברצועת-השפה: פיקסלים עם גוון-ירוק בטווח 5px מכיסוי-ה-UI
    band_e = (cv2.dilate((a > 0.01).astype(np.uint8), np.ones((11, 11), np.uint8)) > 0) & (a < 0.999)
    tinted = (D > 2) & band_e
    # ליד אצבע: הירוק מוחלף בממוצע R/B (ניטרלי — לא טורקיז); במסגרת: max(R,B)
    lim = np.where(wfg > 0.05, 0.5 * (Fn[:, :, 0] + Fn[:, :, 2]) + 4, np.maximum(Fn[:, :, 0], Fn[:, :, 2]) + 2)
    Fn[:, :, 1] = np.where(tinted, np.minimum(Fn[:, :, 1], lim), Fn[:, :, 1])
    out = (1 - a)[..., None] * Fn + a[..., None] * UIp
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
