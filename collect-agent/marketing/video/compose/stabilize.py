"""שלב 3 — עקביות-זמן בלי השהיה: חיזוי לכל פריים מפריימים-שכנים טובים (רגרסיה ריבועית מקומית, משני
הצדדים — אין lag), ופריים שנכשל/חורג מהחיזוי מותאם מחדש מהחיזוי (התאמת-מודל מלאה 8-DOF מול הצלעות
והחריץ). פריים שגם אחרי זה לא עומד בסף — מקבל את החיזוי ומסומן 'interp' בדוח.

שימוש: python stabilize.py <video> <refine.npz> <out.npz>
"""
import sys
import cv2
import numpy as np
from track_lib import greenness, luma, screen_level, SIDES
from model import load_shape, contour, side_of
from refine import fit_frame, measure, H_of

NAMES = ('top', 'right', 'bottom', 'left', 'notch')
BIAS_OK = 0.35


def side_bias(idx, res, inl, side, K):
    out = np.full(5, np.nan)
    cnt = np.zeros(5)
    for k, s in enumerate(NAMES):
        sel = inl & ((K[idx] == 2) if s == 'notch' else ((side[idx] == s) & (K[idx] == 0)))
        cnt[k] = sel.sum()
        if sel.sum() >= 15:
            out[k] = res[sel].mean()
    return out, cnt


def evaluate(Y, D, lvl, C, P, Nn, K, side, W, H):
    idx, x, n, e = measure(Y, D, lvl, H_of(C), P, Nn, 6.0, W, H, step=0.25)
    if len(e) < 30:
        return None
    sc = max(0.25, 1.4826 * np.median(np.abs(e)))
    inl = np.abs(e) < max(1.0, 3.5 * sc)
    b, cnt = side_bias(idx, e, inl, side, K)
    return dict(idx=idx, x=x, n=n, res=e, inl=inl, bias=b, cnt=cnt,
                q=np.nanmax(np.abs(b)) if np.isfinite(b).any() else 9.0,
                rms=float(np.sqrt(np.mean(e[inl] ** 2))) if inl.any() else 9.0)


def predict(C, good, i, half=4):
    N = len(C)
    for h in (half, 2 * half, 4 * half, 8 * half, 12 * half):
        js = [j for j in range(max(0, i - h), min(N, i + h + 1)) if j != i and good[j]]
        if len(js) >= 4 and any(j < i for j in js) and any(j > i for j in js):
            t = np.array(js, float) - i
            w = (1 - (np.abs(t) / (h + 1)) ** 3) ** 3
            A = np.stack([np.ones_like(t), t, t ** 2], 1) if len(js) >= 5 else np.stack([np.ones_like(t), t], 1)
            Y_ = C[js].reshape(len(js), -1)
            Aw = A * w[:, None]
            coef = np.linalg.lstsq(Aw.T @ A, Aw.T @ Y_, rcond=None)[0]
            return coef[0].reshape(4, 2), h
    # קצה הקטע: אקסטרפולציה ליניארית מהצד הקיים
    js = [j for j in range(max(0, i - 12), min(N, i + 13)) if good[j]]
    if len(js) >= 2:
        t = np.array(js, float) - i
        A = np.stack([np.ones_like(t), t], 1)
        coef = np.linalg.lstsq(A, C[js].reshape(len(js), -1), rcond=None)[0]
        return coef[0].reshape(4, 2), 99
    return None, None


def lines_of(C):
    """קווי שמאל/ימין/תחתון (נורמל חוצה) מתוך 4 הפינות."""
    cen = C.mean(0)
    L = {}
    for s_, (a, b) in dict(left=(0, 3), right=(1, 2), bottom=(3, 2)).items():
        p, q = C[a], C[b]; d = q - p
        n = np.array([d[1], -d[0]]); n /= np.linalg.norm(n)
        if n @ cen - n @ p > 0:
            n = -n
        L[s_] = (n, float(n @ p))
    return L


def smooth_scales(S, wpt):
    """קנה-המידה בתחתית מנורמל לרוחב-המסך (יחס = s / (רוחב/390)) — יציב יותר כשהטלפון זז/מתקרב.
    דחיית חריגים מול חציון-נע (1 שנ'), השלמת חורים מהשכן הטוב הקרוב (החזקה), החלקה גאוסית דו-צדדית
    (σ=6 פריימים — אין השהיה). מחזיר קנה-מידה בפיקסלים ליחידה לכל פריים."""
    N = len(S)
    r = np.log(S / wpt[:, None])
    out = np.full_like(r, np.nan)
    good_any = np.zeros(N, bool)
    for k in range(2):
        v = r[:, k]
        med = np.array([np.nanmedian(v[max(0, i - 12):i + 13]) if np.isfinite(v[max(0, i - 12):i + 13]).any() else np.nan
                        for i in range(N)])
        ok = np.isfinite(v) & (np.abs(v - med) < 0.06)
        good_any |= ok
        idx = np.where(ok)[0]
        if len(idx) == 0:
            continue
        filled = np.interp(np.arange(N), idx, v[idx])          # בקצוות: החזקת הערך הטוב האחרון
        g = np.exp(-0.5 * (np.arange(-18, 19) / 6.0) ** 2); g /= g.sum()
        pad = np.r_[np.full(18, filled[0]), filled, np.full(18, filled[-1])]
        out[:, k] = np.convolve(pad, g, 'valid')
    return np.exp(out) * wpt[:, None], good_any


if __name__ == '__main__':
    SRC, REF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
    z = np.load(REF, allow_pickle=True)
    C = z['C'].copy()
    N = int(z['N'])
    sh = load_shape()
    P, Nn, K = contour(sh, 1.0)
    side = side_of(P)
    FIT = K != 1                                     # צלעות ישרות + חריץ (בלי קשתות-פינה)
    cap = cv2.VideoCapture(SRC)
    W, H = int(cap.get(3)), int(cap.get(4))
    frames = []
    for i in range(N):
        ok, fr = cap.read()
        frames.append(fr if ok else None)
    cache = {}
    IND = len(z['ind']) > 0 if 'ind' in z else False
    if IND:
        from indicator import complete2
        wpt = np.array([np.linalg.norm(c[2] - c[3]) / 390.0 if np.isfinite(c).all() else np.nan for c in C])
        wpt = np.interp(np.arange(N), np.where(np.isfinite(wpt))[0], wpt[np.isfinite(wpt)])
        SS, scale_ok = smooth_scales(z['scales'], wpt)

        def reapply(i, Ci):
            if not np.isfinite(Ci).all() or not np.isfinite(SS[i]).all():
                return Ci
            return complete2(lines_of(Ci), *SS[i])
        for i in range(N):
            C[i] = reapply(i, C[i])

    def get(i):
        if i not in cache:
            D = greenness(frames[i]); cache[i] = (luma(frames[i]), D, screen_level(D))
        return cache[i]

    # נוכחות-טלפון: לפחות 25% מפוליגון-המסך המותאם ירוק (אחרת — אין טלפון בפריים, למשל סצנת-הסיום)
    from finger import screen_poly_mask
    absent = np.zeros(N, bool)
    # חיתוך-סצנה (הבדל גלובלי גדול) + "אין ירוק בפריים" ⇒ אין טלפון. בתוך שוט עם טלפון כל פריים חייב מסך.
    prevg = None
    cut_after = None
    for i in range(N):
        Y, D, lvl = get(i)
        g = cv2.resize(frames[i], (90, 160)).astype(np.float32)
        if prevg is not None and np.abs(g - prevg).mean() > 40 and cut_after is None and i > N // 2:
            cut_after = i
        prevg = g
        if (D > 40).sum() < 2000 or (cut_after is not None and i >= cut_after):
            absent[i] = True
            C[i] = np.nan
    if cut_after is not None:
        print('scene cut at frame', cut_after, '- phone frames end there')
    ev = [None] * N
    for i in range(N):
        if np.isfinite(C[i]).all():
            Y, D, lvl = get(i)
            ev[i] = evaluate(Y, D, lvl, C[i], P, Nn, K, side, W, H)
    q = np.array([e['q'] if e else 9.0 for e in ev])
    good = q <= BIAS_OK
    print('initial good', good.sum(), '/', N)
    status = np.where(good, 'meas', 'bad').astype('<U8')
    # שני סבבים: התאמה-מחדש מהחיזוי לכל פריים חלש/חסר/חורג
    for rnd in range(2):
        changed = 0
        for i in range(N):
            if absent[i]:
                continue
            pred, h = predict(C, good, i)
            if pred is None:
                continue
            if good[i]:
                vis = [(0 <= c[0] < W and 0 <= c[1] < H) for c in C[i]]
                dev = np.abs(C[i] - pred)[np.array(vis)].max() if any(vis) else 0
                if dev < 1.5 or h > 8:
                    continue
            Y, D, lvl = get(i)
            best = (ev[i]['q'] if ev[i] else 9.0, C[i].copy(), ev[i])
            for C0 in ([pred] + ([C[i]] if np.isfinite(C[i]).all() else [])):
                for sig in (3.0, 15.0):
                    r = fit_frame(frames[i], np.array(C0), sh, P[FIT], Nn[FIT], np.full(8, sig), W=W, H=H, cache=(D, Y, lvl))
                    if r is None:
                        continue
                    Cr = reapply(i, r['C']) if IND else r['C']
                    e = evaluate(Y, D, lvl, Cr, P, Nn, K, side, W, H)
                    if e and e['q'] < best[0] - 0.02:
                        best = (e['q'], Cr, e)
            if best[0] <= BIAS_OK:
                if not good[i] or best[0] < ev[i]['q']:
                    C[i], ev[i] = best[1], best[2]
                    good[i] = True
                    status[i] = 'refit'
                    changed += 1
        print('round', rnd, 'refit', changed, 'good', good.sum())
    # פריימים שעדיין לא עומדים בסף: הטוב מבין (מדידה, חיזוי) — ומסומנים
    for i in range(N):
        if good[i] or absent[i]:
            continue
        pred, h = predict(C, good, i)
        Y, D, lvl = get(i)
        cands = []
        if np.isfinite(C[i]).all() and ev[i]:
            cands.append((ev[i]['q'], C[i].copy(), ev[i], 'weak'))
        if pred is not None:
            e = evaluate(Y, D, lvl, pred, P, Nn, K, side, W, H)
            cands.append((e['q'] if e else 9.0, pred, e, 'interp'))
        if cands:
            qb, Cb, eb, st = min(cands, key=lambda c: c[0])
            C[i], ev[i], status[i] = Cb, eb, st
    status[absent] = 'nophone'
    B = np.array([e['bias'] if e else np.full(5, np.nan) for e in ev])
    RMS = np.array([e['rms'] if e else np.nan for e in ev])
    meas = {i: np.c_[e['idx'], e['x'], e['n'], e['res'], e['inl']].astype(np.float32) for i, e in enumerate(ev) if e}
    np.savez_compressed(OUT, C=C, scales=(SS if IND else np.zeros((0, 2))), bias=B, rms=RMS, status=status, W=W, H=H, N=N,
                        meas_keys=np.array(list(meas.keys())), meas_vals=np.array(list(meas.values()), dtype=object))
    qq = np.nanmax(np.abs(B), 1)
    print('status counts', {s: int((status == s).sum()) for s in np.unique(status)})
    print('max|bias| p50 %.3f p95 %.3f max %.3f; frames >0.5: %s' % (np.nanpercentile(qq, 50), np.nanpercentile(qq, 95), np.nanmax(qq),
                                                                    list(np.where(qq > 0.5)[0])))
