"""שלב 6 — הרכבה: מסך-ה-UI (ui_anim) מעוות פרספקטיבית אל המסך שנעקב, ממוסך במפתח-הירוק (האצבעות נשארות
מעל), unmix + despill בשוליים, התאמת בהירות/הצללה/בוהק מהצילום, טשטוש-תנועה בתזוזה מהירה, כתוביות וכרטיס-סיום.

שימוש: python composite.py <fmt h|v> <video> <stab.npz> <finger.npz> <plan.json> <ui_dir> <assets_dir> <out.mp4>
       [--calib out_calib.mp4]  ← רינדור-כיול: UI אפור-אחיד (לבדיקת שאריות-ירוק ויישור-שפה ב-verify.py)
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
    zm = cv2.GaussianBlur(cv2.dilate(scr, np.ones((181, 181), np.uint8)).astype(np.float32) / 255, (0, 0), 30)
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
        strong = Df0 > 0.7 * lv0
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
    if not weak:
        fr = despill_around(fr, Hm)
    P = fr[y0:y1, x0:x1].astype(np.float32)
    D = greenness(fr[y0:y1, x0:x1])
    cov = poly_cov(Hm, roi)
    inner = poly_cov(Hm, roi, shrink=3)
    lvl = float(np.median(D[(cov > 0.99) & (D > 25)])) if ((cov > 0.99) & (D > 25)).sum() > 200 else 80.0
    # פליטת-המסך (הירוק הנקי, כולל הצללה רכה): ממוצע-מנורמל של פיקסלים ירוקים-נקיים
    Yp = 0.114 * P[:, :, 0] + 0.587 * P[:, :, 1] + 0.299 * P[:, :, 2]
    clean = ((D > 0.72 * lvl) & (inner > 0.99)).astype(np.float32)
    n1, d1 = norm_blur(P, clean, 7)
    n2, d2 = norm_blur(P, clean, 28)
    med = np.array([np.median(P[:, :, k][clean > 0]) if clean.sum() > 50 else (75, 144, 33)[k] for k in range(3)], np.float32)
    G = np.where(d1 > 0.05, n1 / np.maximum(d1, 1e-6), np.where(d2 > 0.02, n2 / np.maximum(d2, 1e-6), med))
    Dg = np.maximum(G[:, :, 1] - 0.5 * (G[:, :, 0] + G[:, :, 2]), 20)
    a_lin = np.clip(D / Dg, 0, 1)
    # צל-האצבע על המסך: ירוק כהה (אותו גוון, פחות אור) ⇒ זה עדיין מסך. מפתח לפי "ירוק ביחס לבהירות"
    Yg0 = 0.114 * G[:, :, 0] + 0.587 * G[:, :, 1] + 0.299 * G[:, :, 2]
    hue_a = np.clip((D / (Yp + 1)) / (Dg / (Yg0 + 1)), 0, 1)
    hue_a = np.where((Yp > 30) & (a_lin > 0.2), hue_a, a_lin)          # רק כשיש ירוק ממשי (לא מסגרת כהה)
    a_key = np.maximum(a_lin, hue_a)
    # בוהק חזק על המסך (חלון משתקף): ירקרק-מנטה בהיר ודהוי — זה עדיין מסך (הבוהק יתווסף מעל ה-UI)
    a_mint = np.clip(((P[:, :, 1] - P[:, :, 2]) - 8) / 20, 0, 1) * (Yp > 110) * (P[:, :, 1] >= P[:, :, 0] - 10)
    a_key = np.maximum(a_key, a_mint)
    # ירוק שעדיין נוכח בבירור (צל/השתקפות-אצבע חלשה על הזכוכית) = מסך; רק מתחת ל-~15% ירוק = אצבע
    a_key = np.clip((a_key - 0.22) / 0.43, 0, 1)
    shadow = np.clip(Yp / np.maximum(Yg0, 1), 0, 1)                  # 1 = בלי צל
    shadow = np.where(hue_a > a_lin + 0.05, shadow, 1.0)
    # מסתירים: אצבע = רכיב עור/כהה שנוגע בשפת-המסך או בשולי-הפריים; כל שאר ה'לא-ירוק' בפנים (בוהק, השתקפות,
    # פס-הבית) = מסך (alpha=1) — הבוהק מתווסף מעל ה-UI
    scr8 = (cov > 0.5).astype(np.uint8)
    occ = occluder_mask(fr[y0:y1, x0:x1], D, scr8, lvl)
    n, lab, st, _ = cv2.connectedComponentsWithStats(occ, 8)
    band = (cov > 0.5) & (inner < 0.5)
    fb = np.zeros_like(band)
    if x0 == 0: fb[:, :2] = True
    if y0 == 0: fb[:2, :] = True
    if x1 == W: fb[:, -2:] = True
    if y1 == H: fb[-2:, :] = True
    band |= fb & (cov > 0.5)
    fingers = np.zeros(occ.shape, np.uint8)
    for k in range(1, n):
        comp = lab == k
        if (comp & band).sum() >= 3 and st[k, cv2.CC_STAT_AREA] >= 12:
            fingers[comp] = 1
    fing_d = cv2.dilate(fingers, np.ones((11, 11), np.uint8)).astype(bool)
    fill = (inner > 0.5) & ~fing_d
    a_ref = np.clip(guided(Yp / 255.0, a_key.astype(np.float32)), 0, 1)
    # מעבר רך בין "מסך-ודאי" לאזור-האצבע (בלי תפר-מדרגות של מסכת-הכרומה)
    wf = cv2.GaussianBlur(fing_d.astype(np.float32), (0, 0), 3.0)
    wf = np.maximum(wf, (inner < 0.5).astype(np.float32))
    # שפת-המסך (מסגרת): כיסוי גאומטרי של צורת-המודל המותאמת — לא המפתח (הכרומה דגומה-בחצי ונמרחת ~1px
    # החוצה). ליד אצבעות: המפתח המעודן (אצבע חוצה את השפה), כפול הכיסוי.
    cov_s = cv2.GaussianBlur(cov, (0, 0), 0.6)
    a = wf * (a_ref * cov_s) + (1 - wf) * cov_s
    a = np.where(fingers > 0, np.minimum(a, a_ref), a)
    zone = cv2.dilate((cov > 0.02).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
    if weak:
        # פריים חלש (טשטוש/הסתרה): כל הירוק המחובר למסך מוחלף (ה-UI המרופד מכסה) — אף פעם לא ירוק גלוי
        gm = (a_lin > 0.2).astype(np.uint8)
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(gm, 8)
        touch = np.unique(lab_[(cov > 0.5) & (gm > 0)])
        extra = np.isin(lab_, touch[touch > 0])
        zone = np.maximum(zone, cv2.dilate(extra.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32))
    a = a * zone
    if weak:
        # פריים חלש (טשטוש-תנועה/הסתרה, גאומטריה מאומדת): המפתח קובע לגמרי היכן ה-UI — בלי "דש" מעל המסגרת,
        # ובלי ירוק גלוי; חורים סגורים בתוך הירוק (בוהק/פס-הבית) ממולאים.
        gk = (a_ref > 0.5).astype(np.uint8)
        hole = cv2.morphologyEx(gk, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        hole = cv2.erode(hole, np.ones((5, 5), np.uint8)).astype(bool) & ~fing_d
        a = np.where(hole, 1.0, a_ref) * zone
    # UI: בהירות/הצללה מהמסך בצילום + בוהק
    s_px = local_scale(Hm)
    warp = None
    if 0 < i < len(Cs) - 1 and np.isfinite(Cs[i - 1]).all() and np.isfinite(Cs[i + 1]).all() \
            and np.abs(Cs[i + 1] - Cs[i - 1]).max() > 6:
        # טשטוש-תנועה (צמצם 180°): ממוצע עיוותים לאורך חצי-פריים
        acc = 0
        for u in np.linspace(-0.25, 0.25, 9):
            Cu = C + (Cs[i + 1] - C) * u if u > 0 else C + (C - Cs[i - 1]) * u
            acc = acc + warp_ui(ui, H_of(Cu), roi, s_px)
        warp = acc / 9
    else:
        warp = warp_ui(ui, Hm, roi, s_px)
    warp = cv2.GaussianBlur(warp, (0, 0), 0.55)
    Yg = 0.114 * G[:, :, 0] + 0.587 * G[:, :, 1] + 0.299 * G[:, :, 2]
    ref = float(np.median(Yg[clean > 0])) if clean.sum() > 50 else float(Yg.mean())
    shade = np.clip((cv2.GaussianBlur(Yg, (0, 0), 20) / max(ref, 1)) ** 0.5, 0.86, 1.12)[..., None]
    glare = cv2.GaussianBlur(np.clip(Yp - Yg - 5, 0, None), (0, 0), 1.5) * 0.35
    glare = np.where(fill, glare, 0)[..., None]
    tint = np.array([0.95, 0.985, 1.0], np.float32)          # BGR — חמימות קלה כמו התאורה בסצנה
    UIp = warp * (0.9 * tint) * shade * (0.8 + 0.2 * shadow)[..., None] + glare
    # רקע: הצילום פחות תרומת-המסך (unmix), ובלי שפך-ירוק
    # רקע לפיקסלים מעורבים (שולי אצבע/מסגרת): צבע-החזית נלקח מהשכנים הלא-ירוקים לגמרי (ולא P−a·G,
    # שמשאיר מגנטה כשהירוק המקומי שונה מההערכה). פיקסל לא-ירוק לגמרי = הצילום עצמו.
    pure = (a_lin < 0.04).astype(np.float32)
    nb, db = norm_blur(P, pure, 2.0)
    nb2, db2 = norm_blur(P, pure, 6.0)
    Bc = np.where(db > 0.02, nb / np.maximum(db, 1e-6), np.where(db2 > 0.005, nb2 / np.maximum(db2, 1e-6), P))
    resid = np.where((a < 0.02)[..., None], P, Bc)
    dz = cv2.dilate((cov > 0.02).astype(np.uint8), np.ones((31, 31), np.uint8)) > 0
    lim = np.maximum(resid[:, :, 0], resid[:, :, 2]) + 2          # בלי שפך-ירוק (ובלי להפוך בוהק-מנטה למגנטה)
    resid[:, :, 1] = np.where(dz, np.minimum(resid[:, :, 1], lim), resid[:, :, 1])
    resid = resid * (1 - a)[..., None]
    out = resid + a[..., None] * UIp
    res = fr.copy()
    res[y0:y1, x0:x1] = np.clip(out, 0, 255).astype(np.uint8)
    if weak:
        # ניקוי אור-ירוק סביב — אחרי ההרכבה, ובלי לגעת באזור שה-UI כיסה (שם הירוק היה מסך)
        prot = np.zeros((H, W), np.uint8)
        prot[y0:y1, x0:x1] = cv2.dilate((a > 0.02).astype(np.uint8), np.ones((5, 5), np.uint8))
        res = despill_around(res, Hm, prot)
    return res, dict(roi=roi, a=a, fingers=fingers, cov=cov)


def over(base, rgba):
    al = rgba[:, :, 3:4].astype(np.float32) / 255
    return (base * (1 - al) + rgba[:, :, :3] * al).astype(np.uint8)


if __name__ == '__main__':
    tgt = CALIB or OUT
    dur = NF / fps
    args = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-']
    if CALIB:
        args += ['-c:v', 'libx264', '-preset', 'fast', '-crf', '12', '-pix_fmt', 'yuv420p', tgt]
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
