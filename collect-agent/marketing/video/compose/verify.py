"""שלב 7 — אימות לכל פריים (CSV + סיכום):

(a) ירוק-שיורי: בפלט-הכיול (UI אפור-אחיד, בלי כתוביות) — פיקסלים "ירוקים לעין" (G−max(R,B) > 18 וגם G > 45)
    בכל סביבת-המסך (המסך המורחב ב-40px, כולל אצבעות/יד/מסגרת). בפלט-הסופי — אותה ספירה ברצועה שמחוץ
    לצורת-המסך (1.5..15px), שם ה-UI לא אמור להופיע.
(b) יישור-שפה: לאורך נורמלי-המודל (צלעות ישרות), חציית-50% של luma בפלט-הכיול (גבול ה-UI↔מסגרת) מול חציית
    50% בצילום-המקור (גבול הירוק↔מסגרת) — אותו אומד בשניהם. מדווח: היסט ממוצע לכל צלע (הטיה) ו-p95 לנקודה.
    בנוסף — הטיית-ההתאמה (נקודות-השפה של המקור מול הקונטור המותאם) מתוך stabilize.
(c) רעד: זרימה-אופטית (LK) של נקודות-מסגרת/יד סביב המסך בין פריים לפריים, מול התנועה שה-homography צופה
    (H_{i+1}·H_i⁻¹). שארית חציונית בפיקסלים = עד כמה המסך "מחליק" ביחס לצילום.

שימוש: python verify.py <tag> <src.mp4> <stab.npz> <calib.mp4> <final.mp4> <out_dir>
"""
import sys
import csv
import cv2
import numpy as np
from model import load_shape, contour, project, side_of
from refine import H_of
from track_lib import bilinear

TAG, SRC, STB, CAL, FIN, OUTD = sys.argv[1:7]
z = np.load(STB, allow_pickle=True)
C, status, B = z['C'], z['status'], z['bias']
sh = load_shape()
P, Nn, K = contour(sh, 1.0)
side = side_of(P)
STR = K == 0
PC = contour(sh, 2.0)[0]


def poly(Hm, W, H):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.round(project(Hm, PC) * 4).astype(np.int32)], 255, cv2.LINE_8, shift=2)
    return m


def luma(f):
    f = f.astype(np.float32)
    return 0.114 * f[:, :, 0] + 0.587 * f[:, :, 1] + 0.299 * f[:, :, 2]


def cross50(Y, x, n, half=5.0, step=0.25):
    off = np.arange(-half, half + 1e-6, step)
    xs = x[:, 0:1] + off * n[:, 0:1]; ys = x[:, 1:2] + off * n[:, 1:2]
    pr = bilinear(Y, xs, ys)
    hi = pr[:, (off >= -4.0) & (off <= -1.5)].max(1)            # רמת-המסך הצמודה (לא פס-הבית שב-6px פנימה)
    lo = pr[:, off >= 0.5].min(1)
    mid = 0.5 * (hi + lo)
    ok = (hi - lo) > 20
    cr = (pr[:, :-1] >= mid[:, None]) & (pr[:, 1:] < mid[:, None])
    e = np.full(len(x), np.nan)
    has = cr.any(1) & ok
    j = np.argmin(np.where(cr, np.abs(off[None, :-1]), np.inf), 1)
    r = np.arange(len(x))
    s0, s1 = pr[r, j], pr[r, np.minimum(j + 1, len(off) - 1)]
    f = (s0 - mid) / np.where(np.abs(s0 - s1) < 1e-6, 1, s0 - s1)
    e[has] = (off[j] + step * f)[has]
    return e


def greenish(f):
    f = f.astype(np.int16)
    return ((f[:, :, 1] - np.maximum(f[:, :, 0], f[:, :, 2])) > 18) & (f[:, :, 1] > 45)


cs, cc, cf = cv2.VideoCapture(SRC), cv2.VideoCapture(CAL), cv2.VideoCapture(FIN)
W, H = int(cs.get(3)), int(cs.get(4))
N = int(z['N'])
rows = []
prev = None
dbg_frames = []
for i in range(N):
    ok1, fs = cs.read(); ok2, fc = cc.read(); ok3, ff = cf.read()
    if not (ok1 and ok2 and ok3):
        break
    row = dict(frame=i, t=round(i / cs.get(cv2.CAP_PROP_FPS), 3), status=str(status[i]))
    gs = cv2.cvtColor(fs, cv2.COLOR_BGR2GRAY)
    if not np.isfinite(C[i]).all():
        rows.append(row); prev = None
        continue
    Hm = H_of(C[i])
    pm = poly(Hm, W, H)
    big = cv2.dilate(pm, np.ones((81, 81), np.uint8)) > 0
    # + כל מקום שבו המקור ירוק-מסך (גם אם הגאומטריה שגויה): רכיבי-ירוק גדולים במקור, מורחבים
    fsf = fs.astype(np.float32)
    srcg = ((fsf[:, :, 1] - 0.5 * (fsf[:, :, 0] + fsf[:, :, 2])) > 25).astype(np.uint8)
    n_, lab_, st_, _ = cv2.connectedComponentsWithStats(srcg, 8)
    keep = np.zeros(n_, bool); keep[1:] = st_[1:, cv2.CC_STAT_AREA] > 300
    # רק רכיבים שנוגעים בסביבת-המסך המותאם (לא צמחייה בחלון וכו')
    touch = np.zeros(n_, bool); touch[np.unique(lab_[cv2.dilate(pm, np.ones((61, 61), np.uint8)) > 0])] = True
    keep &= touch
    big |= cv2.dilate(keep[lab_].astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
    band = (cv2.dilate(pm, np.ones((31, 31), np.uint8)) > 0) & ~(cv2.dilate(pm, np.ones((4, 4), np.uint8)) > 0)
    gc = greenish(fc)
    # ירוק-שיורי = פיקסל ירקרק בפלט, שהיה ירוק-מסך במקור או שנגענו בו (לא בוקה/צמחייה שלא שונו)
    _fsi, _fci = fs.astype(np.int16), fc.astype(np.int16)
    _D = _fsi[:, :, 1] - (_fsi[:, :, 0] + _fsi[:, :, 2]) // 2
    touched = (np.abs(_fci - _fsi).max(2) > 2) | (_D > 30)
    row['green_calib_px'] = int((gc & big & touched).sum())
    # בזמן מעבר לכרטיס-הסיום (שיש בו טקסט ירוק) — לא נספר
    row['green_final_band_px'] = int((greenish(ff) & band).sum()) if i / cs.get(cv2.CAP_PROP_FPS) < N / cs.get(cv2.CAP_PROP_FPS) - 0.6 else None
    row['green_source_px'] = int((greenish(fs) & big).sum())
    # (d) מצבי-כשל ספציפיים (על רינדור-הכיול ללא-אבדן — בלי כתוביות ובלי רעש-דחיסה):
    fsi, fci = fs.astype(np.int16), fc.astype(np.int16)
    Dsrc = fsi[:, :, 1] - (fsi[:, :, 0] + fsi[:, :, 2]) // 2
    diff = np.abs(fci - fsi).max(2)
    # (a) עור במקור (חם, לא-ירוק) שהפלט שינה ביותר מ-6/255
    skin = ((fsi[:, :, 2] - fsi[:, :, 1]) > 10) & ((fsi[:, :, 2] - fsi[:, :, 0]) > 20) & (Dsrc <= 0)
    row['skin_changed_px'] = int((skin & (diff > 6)).sum())
    # (b) שינוי מחוץ לירוק-המקור + רצועת-שפה (5px): ה-UI/העיבוד לא אמור לגעת שם
    gband = cv2.dilate((Dsrc > 3).astype(np.uint8), np.ones((11, 11), np.uint8)) > 0
    row['changed_outside_green_px'] = int((~gband & (diff > 6)).sum())
    # (c) משוננות שפת-החזית בתוך המסך: מסכת-ה-UI (אפור-הכיול) מול גרסה מוחלקת שלה, לכל פיקסל-שפה
    ui_m = (np.abs(fci - np.array([171, 177, 180])).max(2) < 30).astype(np.uint8)
    inner_m = cv2.erode(pm, np.ones((13, 13), np.uint8)) > 0
    edge_px = (ui_m ^ cv2.erode(ui_m, np.ones((3, 3), np.uint8))).astype(bool) & inner_m
    sm = cv2.GaussianBlur(ui_m.astype(np.float32), (0, 0), 1.5) > 0.5
    row['fg_edge_px'] = int(edge_px.sum())
    row['jagged_px'] = int(((sm != ui_m.astype(bool)) & inner_m).sum())
    row['jagged_ratio'] = round(row['jagged_px'] / max(1, row['fg_edge_px']), 4)
    # (d) שטח בתוך פוליגון-המסך שנשאר פיקסלי-מקור (שינוי ≤6), לא כולל יד: רכיבי "לא-ירוק" עם עור שמחוברים
    #     ליד שמחוץ לפוליגון (במקור). אמור להיות ~0.
    inpm = cv2.erode(pm, np.ones((7, 7), np.uint8)) > 0
    nongreen = (Dsrc < 25)
    skin_in = ((fsi[:, :, 2] - fsi[:, :, 0]) > 12)
    cand_h = (nongreen & ((pm > 0) | skin_in)).astype(np.uint8)
    nh, lh, sh_, _ = cv2.connectedComponentsWithStats(cand_h, 8)
    outc = np.bincount(lh[(pm == 0) & (cand_h > 0) & skin_in].ravel(), minlength=nh)
    skc = np.bincount(lh[skin_in & (cand_h > 0)].ravel(), minlength=nh)
    okh = (outc >= 20) & (skc >= 20); okh[0] = False
    handm = cv2.dilate(okh[lh].astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    row['kept_source_in_screen_px'] = int((inpm & (diff <= 6) & ~handm).sum())
    # (b) יישור-שפה: נקודות על הצלעות הישרות, בתוך הפריים
    x = project(Hm, P[STR]); n = project(Hm, P[STR] + 0.25 * Nn[STR]) - x
    n /= np.linalg.norm(n, axis=1, keepdims=True)
    inf = (x[:, 0] > 8) & (x[:, 0] < W - 8) & (x[:, 1] > 8) & (x[:, 1] < H - 8)
    x, n, sd = x[inf], n[inf], side[STR][inf]
    ec = cross50(luma(fc), x, n)
    es = cross50(luma(fs), x, n)
    d = ec - es
    good = np.isfinite(d) & (np.abs(es) < 2.5)
    sides_bias = []
    for s in ('top', 'right', 'bottom', 'left'):
        m = good & (sd == s)
        v = float(np.median(d[m])) if m.sum() >= 15 else np.nan
        row[f'ui_vs_plate_{s}'] = None if np.isnan(v) else round(v, 3)
        sides_bias.append(v)
    row['ui_vs_plate_maxabs_side'] = None if np.all(np.isnan(sides_bias)) else round(float(np.nanmax(np.abs(sides_bias))), 3)
    row['ui_vs_plate_p95_pt'] = round(float(np.percentile(np.abs(d[good]), 95)), 3) if good.sum() > 20 else None
    bb = B[i]
    for k, s in enumerate(('top', 'right', 'bottom', 'left', 'notch')):
        row[f'fit_bias_{s}'] = None if np.isnan(bb[k]) else round(float(bb[k]), 3)
    row['fit_bias_maxabs'] = None if np.all(np.isnan(bb)) else round(float(np.nanmax(np.abs(bb))), 3)
    # (c) רעד: LK על נקודות-טבעת סביב המסך (מסגרת/יד), תנועה בפועל מול תנועת-ה-homography
    if prev is not None:
        Hp, gp, ringp = prev
        pts = cv2.goodFeaturesToTrack(gp, 300, 0.01, 5, mask=ringp.astype(np.uint8) * 255)
        if pts is not None and len(pts) > 6:
            p1, stt, err = cv2.calcOpticalFlowPyrLK(gp, gs, pts, None, winSize=(15, 15), maxLevel=3)
            p0b, st2, _ = cv2.calcOpticalFlowPyrLK(gs, gp, p1, None, winSize=(15, 15), maxLevel=3)
            fb = np.linalg.norm((p0b - pts).reshape(-1, 2), axis=1)
            okp = (stt.ravel() == 1) & (st2.ravel() == 1) & (fb < 0.3)      # בדיקת הלוך-חזור: רק עקיבות אמינות
            a = pts.reshape(-1, 2)[okp]; b = p1.reshape(-1, 2)[okp]
            if len(a) < 4:
                a = b = None
        if pts is not None and len(pts) > 6 and a is not None:
            pred = project(Hm @ np.linalg.inv(Hp), a)
            res = np.linalg.norm(b - pred, axis=1)
            mot = np.linalg.norm(b - a, axis=1)
            row['plate_motion_px'] = round(float(np.median(mot)), 3)
            row['track_vs_plate_px'] = round(float(np.median(res)), 3)
            row['corner_motion_px'] = round(float(np.abs(C[i] - C[i - 1]).max()), 3)
    # טבעת: המסגרת השחורה בלבד (6–22px מחוץ למסך, לא עור) — שטוחה עם המסך
    ring = (cv2.dilate(pm, np.ones((23, 23), np.uint8)) > 0) & ~(cv2.dilate(pm, np.ones((7, 7), np.uint8)) > 0)
    f16 = fs.astype(np.int16)
    ring &= ~((f16[:, :, 2] - f16[:, :, 1] > 15) & (f16[:, :, 2] > 70)) & (luma(fs) < 80)
    prev = (Hm, gs, ring)
    rows.append(row)
    if i % 100 == 0:
        print(i, row.get('green_calib_px'), row.get('ui_vs_plate_maxabs_side'), row.get('track_vs_plate_px'), flush=True)

keys = []
for r in rows:
    for k in r:
        if k not in keys:
            keys.append(k)
with open(f'{OUTD}/verify_{TAG}.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, keys); w.writeheader(); w.writerows(rows)


def col(k, filt=None):
    v = np.array([r[k] for r in rows if r.get(k) is not None and (filt is None or filt(r))], float)
    return v


good_st = lambda r: r['status'] in ('meas', 'refit')
lines = [f'# verify {TAG}', f'frames: {len(rows)}; with screen: {sum(1 for r in rows if "green_calib_px" in r)}',
         'status counts: ' + str({s: sum(1 for r in rows if r["status"] == s) for s in sorted(set(r["status"] for r in rows))})]
for k in ('green_calib_px', 'green_final_band_px', 'green_source_px', 'skin_changed_px', 'changed_outside_green_px', 'jagged_px', 'jagged_ratio', 'kept_source_in_screen_px'):
    v = col(k)
    if len(v) == 0:
        continue
    worst = [r['frame'] for r in sorted([r for r in rows if r.get(k) is not None], key=lambda r: -r[k])[:5]]
    lines.append(f'{k}: max {v.max():.3f}  mean {v.mean():.3f}  p95 {np.percentile(v, 95):.3f}  frames>0: {(v > 0).sum()}  frames>20: {(v > 20).sum()}  worst: {worst}')
for k, f in (('ui_vs_plate_maxabs_side', None), ('ui_vs_plate_maxabs_side', good_st), ('ui_vs_plate_p95_pt', None),
             ('fit_bias_maxabs', None), ('fit_bias_maxabs', good_st), ('track_vs_plate_px', None), ('track_vs_plate_px', good_st),
             ('plate_motion_px', None)):
    v = col(k, f)
    if len(v):
        lines.append(f'{k}{" [meas/refit only]" if f else ""}: p50 {np.median(v):.3f}  p95 {np.percentile(v, 95):.3f}  max {v.max():.3f}  '
                     f'frames>0.5: {(v > 0.5).sum()}/{len(v)}')
bad = [r['frame'] for r in rows if (r.get('ui_vs_plate_maxabs_side') or 0) > 0.5 or (r.get('fit_bias_maxabs') or 0) > 0.5]
lines.append('frames over 0.5px (either edge metric): ' + str(bad))
gbad = [r['frame'] for r in rows if (r.get('green_calib_px') or 0) > 0]
lines.append('frames with any residual green (calib): ' + str(gbad))
open(f'{OUTD}/verify_{TAG}_summary.txt', 'w').write('\n'.join(lines) + '\n')
print('\n'.join(lines))
