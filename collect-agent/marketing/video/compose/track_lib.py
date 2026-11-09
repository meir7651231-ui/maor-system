"""מעקב מסך-ירוק מדויק-תת-פיקסל: 4 צלעות כקווים (RANSAC + פרופילי-נורמל), פינות = חיתוך קווים.

רעיון: נקודות-הגבול של המסך הירוק שמאחוריהן מסגרת כהה (bezel) = צלע אמיתית. גבולות שנוצרים מאצבע/יד
(עור בהיר/חם) או משולי-הפריים נזרקים. כל צלע מותאמת כקו — כך המעקב עובד גם כשאצבע חוצה את המסך וגם
כשהמסך חתוך בשולי הפריים (הקו נמשך מחוץ לפריים). פינות המסך מעוגלות ⇒ נקודות ליד הפינות לא משתתפות.
"""
import cv2
import numpy as np


def greenness(fr):
    f = fr.astype(np.float32)
    return f[:, :, 1] - 0.5 * (f[:, :, 0] + f[:, :, 2])          # D = G-(R+B)/2 — ליניארי בצבע ⇒ מתאים ל-unmix


def luma(fr):
    f = fr.astype(np.float32)
    return 0.114 * f[:, :, 0] + 0.587 * f[:, :, 1] + 0.299 * f[:, :, 2]


def screen_level(D):
    v = D[D > 30]
    return float(np.median(v)) if v.size > 500 else 0.0


def line_from_pts(p):
    """least-squares (TLS) קו: מחזיר (n, c) עם n·x = c, |n|=1."""
    m = p.mean(0)
    u, s, vt = np.linalg.svd(p - m, full_matrices=False)
    n = vt[1]
    return n, float(n @ m)


def intersect(l1, l2):
    (n1, c1), (n2, c2) = l1, l2
    A = np.array([n1, n2])
    return np.linalg.solve(A, np.array([c1, c2]))


def bilinear(img, xs, ys):
    sh = np.shape(xs)
    mx = np.asarray(xs, np.float32).reshape(-1, 1) if len(sh) == 1 else np.asarray(xs, np.float32)
    my = np.asarray(ys, np.float32).reshape(mx.shape)
    out = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return out.reshape(sh)


def boundary_candidates(fr, D, lvl, Y):
    """נקודות גבול של אזור-ירוק עם נורמל-חוצה; מסומנות 'כהה מבחוץ' (מסגרת) מול עור/רקע."""
    H, W = D.shape
    M = (D > 0.38 * lvl).astype(np.uint8)
    M = cv2.morphologyEx(M, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(M, 8)
    if n < 2:
        return None, None, None, M
    big = st[1:, cv2.CC_STAT_AREA].max()
    keep = np.zeros(n, bool)
    keep[1:] = st[1:, cv2.CC_STAT_AREA] > max(400, 0.02 * big)
    M = keep[lab].astype(np.uint8)
    cs, _ = cv2.findContours(M, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    pts = np.vstack([c.reshape(-1, 2) for c in cs if len(c) > 30]).astype(np.float32)
    Ms = cv2.GaussianBlur(M.astype(np.float32), (0, 0), 1.5)
    gx = cv2.Sobel(Ms, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(Ms, cv2.CV_32F, 0, 1, ksize=3)
    xi, yi = pts[:, 0].astype(int), pts[:, 1].astype(int)
    g = np.stack([-gx[yi, xi], -gy[yi, xi]], 1)                     # כלפי חוץ (מהירוק החוצה)
    gn = np.linalg.norm(g, axis=1)
    ok = gn > 1e-3
    pts, g = pts[ok], g[ok] / gn[ok, None]
    # דגימה מבחוץ: מסגרת = לא-ירוק, ולא עור (חם ובהיר)
    Fr = fr.astype(np.float32)
    outs = []
    for d in (4.0, 6.0, 8.0):
        xs, ys = pts[:, 0] + g[:, 0] * d, pts[:, 1] + g[:, 1] * d
        rgb = np.stack([bilinear(Fr[:, :, k], xs, ys) for k in (2, 1, 0)], 1)
        outs.append((rgb, bilinear(D, xs, ys), xs, ys))
    do = np.max([o[1] for o in outs], 0)
    rgb = np.mean([o[0] for o in outs], 0)
    skin = (rgb[:, 0] - rgb[:, 1] > 18) & (rgb[:, 0] - rgb[:, 2] > 28) & (rgb[:, 0] > 70)
    inframe = np.all([(o[2] > 1) & (o[2] < W - 2) & (o[3] > 1) & (o[3] < H - 2) for o in outs], 0)
    dark = (do < 0.3 * lvl) & ~skin & inframe
    border = (pts[:, 0] <= 1) | (pts[:, 0] >= W - 2) | (pts[:, 1] <= 1) | (pts[:, 1] >= H - 2)
    return pts, g, dark & ~border, M


def ransac_lines(pts, nrm, max_lines=6, tol=1.2, min_support=40, iters=400, rng=None):
    rng = rng or np.random.default_rng(0)
    lines = []
    idx = np.arange(len(pts))
    rem = np.ones(len(pts), bool)
    for _ in range(max_lines):
        ids = idx[rem]
        if len(ids) < min_support:
            break
        best, bi = 0, None
        P = pts[ids]
        N = nrm[ids]
        for _ in range(iters):
            a, b = rng.choice(len(ids), 2, replace=False)
            d = P[b] - P[a]
            L = np.hypot(*d)
            if L < 15:
                continue
            n = np.array([-d[1], d[0]]) / L
            c = n @ P[a]
            r = np.abs(P @ n - c)
            inl = (r < tol) & (np.abs(N @ n) > 0.85)
            k = inl.sum()
            if k > best:
                best, bi = k, inl
        if best < min_support:
            break
        n, c = line_from_pts(P[bi])
        r = np.abs(P @ n - c)
        inl = (r < tol) & (np.abs(N @ n) > 0.85)
        n, c = line_from_pts(P[inl])
        # כיוון הנורמל = כלפי חוץ מהירוק
        if (N[inl] @ n).mean() < 0:
            n, c = -n, -c
        lines.append((n, c, ids[inl]))
        rem[ids[inl]] = False
    return lines


def edge_offsets(Y, D, lvl, x, n, half=6.0, step=0.5):
    """היסט תת-פיקסל של שפת המסך לאורך נורמל-חוצה n מכל נקודה x (NaN = לא תקף: מוסתר/לא-שפה).
    אומד אחיד לכל הצנרת: רמה-פנימית = המקסימום ב-1.5..4 פיקסלים פנימה; רמה-חיצונית = המינימום בצד החיצוני
    (המסגרת השחורה הצמודה; לא הבוהק של שולי המתכת); חציית 50% הקרובה ל-0 לפני המינימום.
    luma (רזולוציה מלאה) כשיש ניגוד; אחרת D (סינוור על המסך)."""
    H, W = Y.shape
    off = np.arange(-half, half + 1e-6, step)
    xs = x[:, 0:1] + off[None] * n[:, 0:1]
    ys = x[:, 1:2] + off[None] * n[:, 1:2]
    inf = (xs.min(1) > 1) & (xs.max(1) < W - 2) & (ys.min(1) > 1) & (ys.max(1) < H - 2)
    py = bilinear(Y, xs, ys)
    pd = bilinear(D, xs, ys)
    ki = (off >= -4.0) & (off <= -1.5)          # רמת-המסך הצמודה לשפה (לא פס-הבית/חריץ שעמוק יותר פנימה)
    ko = off >= 0.5
    iy, idd = py[:, ki].max(1), pd[:, ki].max(1)
    jo = np.argmin(np.where(ko[None], py, np.inf), 1)
    oy = py[np.arange(len(py)), jo]
    od = np.where(ko[None], pd, np.inf).min(1)
    tail_d = pd[:, off >= half - 1.5].mean(1)
    ok = inf & (idd > 0.33 * lvl) & (od < 0.45 * idd) & (tail_d < 0.5 * idd)
    # luma רק כשהפרופיל מונוטוני (בלי פס-בוהק בהיר של שולי-הזכוכית בין המסך למסגרת) — אחרת D
    bump = np.where((off[None] > -1.0) & (off[None] < off[jo][:, None]), py, -np.inf).max(1)
    use_y = ((iy - oy) > 22) & (bump < iy + 6)
    sig = np.where(use_y[:, None], py, pd)
    hi = np.where(use_y, iy, idd)
    lo = np.where(use_y, oy, od)
    mid = 0.5 * (hi + lo)
    jlim = np.where(use_y, jo, len(off) - 1)
    cr = (sig[:, :-1] >= mid[:, None]) & (sig[:, 1:] < mid[:, None]) & (np.arange(len(off) - 1)[None] < jlim[:, None])
    has = cr.any(1) & ok
    e = np.full(len(x), np.nan)
    if has.any():
        dist = np.where(cr, np.abs(off[None, :-1] + step / 2), np.inf)
        j = np.argmin(dist, 1)
        r = np.arange(len(x))
        s0, s1 = sig[r, j], sig[r, j + 1]
        f = (s0 - mid) / np.where(np.abs(s0 - s1) < 1e-6, 1, s0 - s1)
        e[has] = (off[j] + step * f)[has]
    return e


def refine_line(n, c, Y, D, lvl, seg, step=1.5, half=6.0, corner_skip=0.0):
    """ריענון תת-פיקסל של צלע ישרה: edge_offsets לאורך הקו בכל step פיקסלים בטווח seg=(t0,t1);
    קו TLS עם דחיית חריגים (MAD)."""
    t = np.array([-n[1], n[0]])
    p0 = n * c
    t0, t1 = seg
    ts = np.arange(t0 + corner_skip, t1 - corner_skip, step)
    if len(ts) < 10:
        return None
    base = p0[None, :] + ts[:, None] * t[None, :]
    pos = edge_offsets(Y, D, lvl, base, np.repeat(n[None], len(base), 0), half=half)
    ok = ~np.isnan(pos)
    if ok.sum() < 10:
        return None
    P = base[ok] + pos[ok, None] * n[None, :]
    keep = np.ones(len(P), bool)
    for _ in range(4):
        nn, cc = line_from_pts(P[keep])
        if nn @ n < 0:
            nn, cc = -nn, -cc
        r = P @ nn - cc
        med = np.median(np.abs(r[keep]))
        thr = max(0.6, 3.5 * 1.4826 * med)
        nk = np.abs(r) < thr
        if (nk == keep).all():
            break
        keep = nk
        if keep.sum() < 10:
            return None
    r = P[keep] @ nn - cc
    return dict(n=nn, c=cc, pts=P[keep], res=r, n_all=int(ok.sum()))


# ---------------------------------------------------------------- תיוג צלעות

def ang_ok(n1, n2, deg):
    return float(n1 @ n2) > np.cos(np.deg2rad(deg))


def notch_score(D, lvl, line, la, lb):
    """שבריר הדגימות ה'לא-ירוקות' על קו מקביל לצלע קצרה, ~15pt פנימה, ב-60% האמצעיים שלה — גבוה = יש חריץ (=ראש)."""
    n, c = line
    try:
        A, B = intersect(line, la), intersect(line, lb)
    except np.linalg.LinAlgError:
        return np.nan
    w = np.linalg.norm(B - A)
    d = 15.0 / 390.0 * w
    t = np.linspace(0.2, 0.8, 40)
    pts = A[None] + t[:, None] * (B - A)[None] - n[None] * d
    H, W = D.shape
    m = (pts[:, 0] > 1) & (pts[:, 0] < W - 2) & (pts[:, 1] > 1) & (pts[:, 1] < H - 2)
    if m.sum() < 15:
        return np.nan
    v = bilinear(D, pts[m, 0], pts[m, 1])
    return float((v < 0.4 * lvl).mean())


def global_label(lines, D, lvl, prev_down=None):
    """תיוג גלובלי לכל פריים (לא תלוי במעקב): זוג ארוך = שני קווים כמעט-מקבילים בעלי נורמלים מנוגדים ותמיכה
    מקסימלית; צלעות קצרות = החיצוניות בכל כיוון; הראש = הצלע שיש לידה חריץ (notch_score). lines=(n,c,support,...)."""
    best = None
    for i in range(len(lines)):
        for j in range(i + 1, len(lines)):
            ni, nj = lines[i][0], lines[j][0]
            if ni @ nj < -np.cos(np.deg2rad(14)):
                gap = abs(lines[i][1] + lines[j][1])
                if gap < 40:
                    continue
                sc = lines[i][2] + lines[j][2]
                if best is None or sc > best[0]:
                    best = (sc, i, j)
    if best is None:
        return None
    _, i, j = best
    la, lb = tuple(lines[i][:2]), tuple(lines[j][:2])
    u = np.array([-la[0][1], la[0][0]])                         # כיוון הציר הארוך
    groups = {1: [], -1: []}
    for k, l in enumerate(lines):
        if k in (i, j) or abs(l[0] @ la[0]) > np.cos(np.deg2rad(50)):
            continue
        groups[1 if l[0] @ u > 0 else -1].append(l)
    ends = {g: (outermost(v) if v else None) for g, v in groups.items()}
    sc = {g: (notch_score(D, lvl, ends[g], la, lb) if ends[g] is not None else np.nan) for g in ends}
    top_g = None
    if prev_down is not None:
        # רציפות-כיוון: הטלפון לא מתהפך בין פריימים ⇒ הכיוון נגרר מהפריים הקודם (החריץ קובע רק באתחול)
        top_g = 1 if (-prev_down) @ u > 0 else -1
    elif ends[1] is not None and ends[-1] is not None and not (np.isnan(sc[1]) and np.isnan(sc[-1])):
        top_g = 1 if np.nan_to_num(sc[1], nan=-1) > np.nan_to_num(sc[-1], nan=-1) else -1
    else:
        g = 1 if ends[1] is not None else (-1 if ends[-1] is not None else None)
        if g is not None and not np.isnan(sc[g]):
            top_g = g if sc[g] > 0.3 else -g
    if top_g is None:
        return None
    th = u * top_g
    down = -th
    right = np.array([down[1], -down[0]])
    R, L = (la, lb) if la[0] @ right > lb[0] @ right else (lb, la)
    return {'top': ends[top_g], 'bottom': ends[-top_g], 'right': R, 'left': L, '_down': down,
            '_score': (sc.get(top_g), sc.get(-top_g))}


def outermost(cands):
    """בין קווים כמעט-מקבילים עם אותו נורמל-חוצה, הקו החיצוני ביותר (c מקסימלי)."""
    ref = max(cands, key=lambda l: l[2])
    same = [l for l in cands if ang_ok(l[0], ref[0], 8) and l[2] >= 20]
    return tuple(max(same, key=lambda l: l[1])[:2]) if same else tuple(ref[:2])


SIDES = ('top', 'right', 'bottom', 'left')
CORNERS = (('top', 'left'), ('top', 'right'), ('bottom', 'right'), ('bottom', 'left'))   # TL TR BR BL


def corners_of(lab):
    out = []
    for a, b in CORNERS:
        if lab.get(a) is None or lab.get(b) is None:
            out.append(None)
        else:
            out.append(intersect(lab[a], lab[b]))
    return out
