"""מרכיב את מסכי גבי על מסך-הירוק בטלפון (מעקב פינות + homography), מוסיף כתוביות וכרטיס סיום."""
import cv2, numpy as np, json, subprocess, sys
S = sys.argv[1]; SRC, FMT, OUT = sys.argv[2], sys.argv[3], sys.argv[4]
SCREENS = json.loads(sys.argv[5])          # [[from_sec, name], ...]
ASPECT = 844 / 390
caps = json.load(open(f'{S}/captions.json'))[FMT]
capimgs = [cv2.imread(f'{S}/cap_{FMT}_{i}.png', cv2.IMREAD_UNCHANGED) for i in range(len(caps))]
end = cv2.imread(f'{S}/end_{FMT}.png')
scr = {n: cv2.imread(f'{S}/{n}.png') for _, n in SCREENS}
cap = cv2.VideoCapture(SRC); fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(3)); H = int(cap.get(4))
n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); END_S = 4.5; FADE = 0.6

INSET_END = 26.6
def make_card(img, w=300):
    h = int(img.shape[0] * w / img.shape[1]); im = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)
    pad = 14; out = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.uint8)
    sh = np.zeros(out.shape[:2], np.uint8); cv2.rectangle(sh, (pad + 4, pad + 8), (pad + w, pad + h), 255, -1, cv2.LINE_AA)
    sh = cv2.GaussianBlur(sh, (0, 0), 7); out[:, :, 3] = (sh * 0.45).astype(np.uint8)          # צל
    mask = np.zeros((h, w), np.uint8); r = 26
    cv2.rectangle(mask, (r, 0), (w - r, h), 255, -1); cv2.rectangle(mask, (0, r), (w, h - r), 255, -1)
    for cx, cy in ((r, r), (w - r, r), (r, h - r), (w - r, h - r)): cv2.circle(mask, (cx, cy), r, 255, -1, cv2.LINE_AA)
    reg = out[pad:pad + h, pad:pad + w]; a = mask[..., None].astype(np.float32) / 255
    reg[:, :, :3] = (im * a).astype(np.uint8); reg[:, :, 3] = np.maximum(reg[:, :, 3], mask)
    return out
INSET = {n: make_card(scr[n]) for _, n in SCREENS} if FMT == 'v' else {}

def green(fr):
    hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
    return cv2.inRange(hsv, (38, 70, 50), (88, 255, 255))

def order(q):
    c = q.mean(0); ang = np.arctan2(q[:, 1] - c[1], q[:, 0] - c[0]); q = q[np.argsort(ang)]  # עם כיוון השעון (y למטה)
    e = [np.linalg.norm(q[(i + 1) % 4] - q[i]) for i in range(4)]
    short = sorted(range(4), key=lambda i: e[i])[:2]                       # שתי הצלעות הקצרות
    top = min(short, key=lambda i: (q[i][0] + q[(i + 1) % 4][0]))         # ראש הטלפון = הקצה השמאלי (לפי הצילום)
    return np.roll(q, -top, axis=0)

def fix_ratio(q):
    # הפינה העליונה של המסך לפעמים בצל ולא מזוהה ⇒ המלבן קצר מיחס-המסך. מאריכים לכיוון ראש הטלפון (q0q1)
    S = (np.linalg.norm(q[0] - q[1]) + np.linalg.norm(q[2] - q[3])) / 2
    L = (np.linalg.norm(q[1] - q[2]) + np.linalg.norm(q[0] - q[3])) / 2
    tgt = S * ASPECT * 0.97
    if L < tgt * 0.96:
        q = q.copy()
        q[0] = q[3] + (q[0] - q[3]) * tgt / np.linalg.norm(q[0] - q[3])
        q[1] = q[2] + (q[1] - q[2]) * tgt / np.linalg.norm(q[1] - q[2])
    return q

def quad(m):
    mm = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((21, 21), np.uint8))
    cs, _ = cv2.findContours(mm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cs: return None
    big = max(cv2.contourArea(x) for x in cs)
    if big < 0.004 * W * H: return None
    # אצבע שחוצה את המסך מפצלת את הירוק לכמה חלקים ⇒ מאחדים את כל החלקים המשמעותיים לקמור אחד
    main = max(cs, key=cv2.contourArea); bx, by, bw, bh = cv2.boundingRect(main); pad = 40
    near = [x for x in cs if cv2.contourArea(x) > 0.04 * big and (lambda r: r[0] < bx + bw + pad and r[0] + r[2] > bx - pad
            and r[1] < by + bh + pad and r[1] + r[3] > by - pad)(cv2.boundingRect(x))]
    c = cv2.convexHull(np.vstack(near))
    pts = c.reshape(-1, 2).astype(np.float32)
    touches = (pts[:, 0] <= 2).any() or (pts[:, 0] >= W - 3).any() or (pts[:, 1] <= 2).any() or (pts[:, 1] >= H - 3).any()
    (cx, cy), (rw, rh), a = cv2.minAreaRect(c)
    if not touches:
        hull = cv2.convexHull(c)
        for eps in np.linspace(0.01, 0.08, 15):
            ap = cv2.approxPolyDP(hull, eps * cv2.arcLength(hull, True), True)
            if len(ap) == 4: return order(ap.reshape(4, 2).astype(np.float32))
        return order(cv2.boxPoints(((cx, cy), (rw, rh), a)).astype(np.float32))
    # המסך חתוך בשולי הפריים: משלימים את המלבן לפי יחס-הגובה של המסך, מהקצה הנראה
    short = min(rw, rh); L = short * ASPECT
    ang = np.deg2rad(a if rw >= rh else a + 90); u = np.array([np.cos(ang), np.sin(ang)], np.float32)
    n = np.array([-u[1], u[0]], np.float32); proj = (pts - [cx, cy]) @ u
    lo, hi = proj.min(), proj.max(); plo = pts[proj.argmin()]
    lo_border = plo[0] <= 2 or plo[1] <= 2 or plo[0] >= W - 3 or plo[1] >= H - 3
    a0, a1 = (hi - L, hi) if lo_border else (lo, lo + L)
    C = np.array([cx, cy], np.float32); s2 = short / 2
    q = np.array([C + u * a0 - n * s2, C + u * a1 - n * s2, C + u * a1 + n * s2, C + u * a0 + n * s2], np.float32)
    return order(q)

def screen_name(t):
    name = SCREENS[0][1]
    for a, n in SCREENS:
        if t >= a: name = n
    return name

def screen_at(t):
    return scr[screen_name(t)]

def over(base, rgba):
    a = rgba[:, :, 3:4].astype(np.float32) / 255
    return (base * (1 - a) + rgba[:, :, :3] * a).astype(np.uint8)

ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                       '-i', SRC, '-map', '0:v', '-map', '1:a?', '-af', f'apad,afade=t=out:st={n_frames / fps - 1.5}:d={1.5 + END_S}',
                       '-t', str(n_frames / fps + END_S), '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p',
                       '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
prev = None; i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    t = i / fps; m = green(fr); q = quad(m) if FMT == 'h' else None
    if FMT == 'v':
        # אנכי: הטלפון חתוך ומוטה מאוד ⇒ בלי מעקב. המסך הירוק הופך למסך כהה נקי + כרטיס חד של מסך גבי לידו
        a = cv2.GaussianBlur(cv2.dilate(m, np.ones((5, 5), np.uint8)), (7, 7), 0).astype(np.float32)[..., None] / 255
        fr = (fr * (1 - a) + np.array([42, 23, 15], np.float32) * a).astype(np.uint8)
        zone = cv2.dilate(m, np.ones((41, 41), np.uint8)) > 0
        b_, g_, r_ = cv2.split(fr); g2 = np.minimum(g_, np.maximum(b_, r_) + 4); g_[zone] = g2[zone]; fr = cv2.merge([b_, g_, r_])
        if t < INSET_END:
            card = INSET[screen_name(t)]; k = min(1, t / 0.4, (INSET_END - t) / 0.4)
            ch, cw = card.shape[:2]; x0, y0 = W - cw - 34, 300
            roi = fr[y0:y0 + ch, x0:x0 + cw].astype(np.float32); al = card[:, :, 3:4].astype(np.float32) / 255 * k
            fr[y0:y0 + ch, x0:x0 + cw] = (roi * (1 - al) + card[:, :, :3] * al).astype(np.uint8)
    if q is not None and prev is not None:
        # רציפות-כיוון: בוחרים את סיבוב הפינות הקרוב ביותר לפריים הקודם (אחרת המסך מתהפך 180° בין פריימים)
        q = min((np.roll(q, k, axis=0) for k in range(4)), key=lambda r: np.abs(r - prev).sum())
        # אצבע שחוצה את המסך שוברת את המתאר ⇒ שטח/צורה קופצים. במקרה כזה נשארים עם המיקום הקודם
        ar_q, ar_p = cv2.contourArea(q), cv2.contourArea(prev)
        jump = np.abs(q - prev).max()
        if ar_q < 0.85 * ar_p or (jump > 25 and jump < 160 and np.abs(np.linalg.norm(q[0] - q[1]) / np.linalg.norm(prev[0] - prev[1]) - 1) > 0.12):
            q = prev
    if q is not None:
        prev = q if prev is None or np.abs(q - prev).max() > 60 else 0.55 * q + 0.45 * prev   # החלקה נגד רעד
        s = screen_at(t); h, w = s.shape[:2]
        dst = prev                                                            # [q0,q1,q2,q3]: נבדק מול 8 הכיוונים — השעון נקרא ישר
        Hm = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), dst)
        warp = cv2.warpPerspective(s, Hm, (W, H), flags=cv2.INTER_AREA)
        poly = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(poly, prev.astype(np.int32), 255)
        poly = cv2.dilate(poly, np.ones((9, 9), np.uint8))                    # מכסה גם שוליים ירוקים ליד המסגרת
        loose = cv2.inRange(cv2.cvtColor(fr, cv2.COLOR_BGR2HSV), (36, 35, 18), (92, 255, 255))   # ירוק כהה בצל — רק בתוך הטלפון
        a = cv2.GaussianBlur(cv2.bitwise_and(cv2.dilate(cv2.bitwise_or(m, loose), np.ones((5, 5), np.uint8)), poly), (5, 5), 0).astype(np.float32)[..., None] / 255
        warp = (warp.astype(np.float32) * 0.93).astype(np.float32)        # התאמת בהירות לצילום
        fr = (fr * (1 - a) + warp * a).astype(np.uint8)
        # ניקוי שארית ירוק בשוליים (despill)
        zone = cv2.dilate(poly, np.ones((61, 61), np.uint8)) > 0             # רק סביב הטלפון (אצבעות/שוליים)
        b_, g_, r_ = cv2.split(fr); g2 = np.minimum(g_, np.maximum(b_, r_) + 4); g_[zone] = g2[zone]; fr = cv2.merge([b_, g_, r_])
    else:
        prev = None
    for (c, im) in zip(caps, capimgs):
        if c['a'] <= t <= c['b']:
            k = min(1, (t - c['a']) / 0.3, (c['b'] - t) / 0.3); im2 = im.copy(); im2[:, :, 3] = (im2[:, :, 3] * k).astype(np.uint8)
            fr = over(fr, im2)
    if t > n_frames / fps - FADE:                                          # מעבר לכרטיס הסיום
        k = (t - (n_frames / fps - FADE)) / FADE; fr = cv2.addWeighted(fr, 1 - k, end, k, 0)
    ff.stdin.write(fr.tobytes()); i += 1
for _ in range(int(END_S * fps)): ff.stdin.write(end.tobytes())
ff.stdin.close(); ff.wait(); print('done', OUT, i, 'frames')
