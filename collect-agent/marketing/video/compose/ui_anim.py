"""שלב 5 — אנימציית-UI שמסונכרנת לאצבע: מנהל-מצבים שמייצר לכל זמן t את מסך-הטלפון (780×1688 = 390×844 @2x).

התוכנית (plan_*.json) מתארת את הצעדים בגסות (הקשה ~t, החלקה ~t0..t1); הזמנים "ננעלים" על נתוני-האצבע
(finger.py): הקשה = רגע העומק-המקסימלי של האצבע בחלון; החלקה = מהעומק-המקסימלי (נחיתה) עד היציאה. בזמן
החלקה התוכן נע 1:1 עם קצה-האצבע (במרחב-UI), ואחריה תנופה מעריכית. המתכנן פותר את קבוע-התנופה τ כך
שבהקשה הבאה היעד (שורה/כפתור) יהיה בדיוק מתחת לאצבע — כך ההקשה "פוגעת" באלמנט האמיתי.
"""
import json
import cv2
import numpy as np

S2 = 2.0                                  # פיקסלים ל-pt בתמונות-ה-UI
VW, VH = 390.0, 844.0


def ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = min(max(x, 0.0), 1.0)
    return 3 * x * x - 2 * x * x * x


class Finger:
    def __init__(self, npz, fps):
        z = np.load(npz)
        self.fps = fps
        tip = z['tip'].copy(); d = z['depth'].copy()
        N = len(d)
        ok = np.isfinite(tip[:, 0])
        idx = np.where(ok)[0]
        # השלמת חורים קצרים (≤3 פריימים) — גליצ'י-מעקב בודדים
        for k in range(2):
            v = tip[:, k]
            for i in range(N):
                if not ok[i]:
                    lo = idx[idx < i]; hi = idx[idx > i]
                    if len(lo) and len(hi) and hi[0] - lo[-1] <= 4:
                        a, b = lo[-1], hi[0]
                        v[i] = v[a] + (v[b] - v[a]) * (i - a) / (b - a)
        self.tip, self.depth = tip, d

    def f(self, t):
        return int(round(t * self.fps))

    def at(self, t):
        i = min(max(self.f(t), 0), len(self.depth) - 1)
        return self.tip[i]

    def snap_peak(self, t, win=0.25):
        a, b = self.f(t - win), self.f(t + win)
        seg = self.depth[a:b + 1]
        j = a + int(np.argmax(seg))
        return j / self.fps

    def snap_release(self, t0, t1, win=0.2):
        """שחרור (סוף-מגע) = רגע מהירות-הגלילה המקסימלית בחצי השני של התנועה — האצבע ניתקת תוך כדי
        תנועה (flick), ולכן לתנופה יש מהירות-שחרור אמיתית. מוגבל לפריימים שבהם האצבע עוד על המסך."""
        a, b = self.f(t0), self.f(t1 + win)
        y = self.tip[a:b + 1, 1].copy()
        ok = np.isfinite(y) & (self.depth[a:b + 1] > 30)
        if ok.sum() < 4:
            return t1
        idx = np.where(ok)[0]
        yv = np.interp(np.arange(len(y)), idx, y[idx])
        ys = np.convolve(np.r_[yv[:1], yv, yv[-1:]], [1 / 3] * 3, 'valid')
        v = -np.gradient(ys)
        half = len(v) // 3
        cand = [i for i in range(half, idx[-1] + 1) if ok[i]]
        j = max(cand, key=lambda i: v[i]) if cand else idx[-1]
        return (a + j) / self.fps


class UIAnim:
    def __init__(self, plan_path, ui_dir, finger, fps):
        self.P = json.load(open(plan_path))
        self.fps = fps
        self.F = finger
        M = json.load(open(f'{ui_dir}/meta.json'))
        self.M = M
        rd = lambda n: cv2.imread(f'{ui_dir}/{n}', cv2.IMREAD_COLOR)
        self.img = {'lock': rd('lock.png'), 'lock_bg': rd('lock_bg.png'), 'dash': rd('dash_full.png'),
                    'dash2': rd('dash2_full.png'), 'sheet': rd('sheet_body.png'), 'sms': rd('sms.png')}
        tst = cv2.imread(f'{ui_dir}/toast.png', cv2.IMREAD_UNCHANGED)
        self.toast = tst[:, :, :3]
        pay = rd('pay_full_3x.png')
        self.img['pay'] = cv2.resize(pay, (780, int(round(pay.shape[0] * 780 / pay.shape[1]))), interpolation=cv2.INTER_AREA)
        self.H = {k: v.shape[0] / S2 for k, v in self.img.items()}
        self.sheet_top = M['sheet_top']
        self._plan()

    # ------------------------------------------------------------------ תכנון
    def _plan(self):
        F, steps = self.F, self.P['steps']
        ev = []
        for st in steps:
            st = dict(st)
            if st['kind'] == 'tap':
                st['t'] = F.snap_peak(st['t'], st.get('win', 0.25)) if not st.get('fixed') else st['t']
                st['p'] = F.at(st['t']).copy()
            else:
                st['t0'] = F.snap_peak(st['t0'], 0.2)
                st['t1'] = F.snap_release(st['t0'], st['t1'], 0.2)
                ys = [F.at(st['t0'] + k / self.fps)[1] for k in range(int(round((st['t1'] - st['t0']) * self.fps)) + 1)]
                st['ys'] = np.array(ys, float)
                tail = st['ys'][-3:] if len(st['ys']) >= 3 else st['ys']
                st['v'] = -(tail[-1] - tail[0]) / max(1, len(tail) - 1) * self.fps   # pt/s, חיובי = גלילה למטה
            ev.append(st)
        self.ev = ev
        # מסכים לפי ההקשות
        self.taps = [e for e in ev if e['kind'] == 'tap']
        # פתרון τ לכל מסך-נגלל: כל ההחלקות שבין שתי הקשות על אותו מסך; היעד = ההקשה שאחריהן
        self.tau = {}
        groups = {}
        for e in ev:
            if e['kind'] == 'flick':
                groups.setdefault(e['on'], []).append(e)
        self.maxscroll = {'dash': self.H['dash'] - VH, 'sheet': self.H['sheet'] - (VH - self.sheet_top), 'pay': self.H['pay'] - VH}
        for scr, fl in groups.items():
            nxt = [t for t in self.taps if t['t'] > fl[-1]['t1']]
            tgt = nxt[0] if nxt else None
            maxs = self.maxscroll[scr]
            want = None
            if tgt is not None and tgt.get('target') in ('dash_row', 'approve_btn', 'pay_btn'):
                r = self.M[tgt['target']]
                cy = r[1] + r[3] / 2
                if tgt['target'] == 'approve_btn':
                    want = cy + self.sheet_top - tgt['p'][1]
                else:
                    want = cy - tgt['p'][1]
            if want is None:
                self.tau[scr] = (0.35, 1.0)
                continue
            tt = tgt['t']
            lo, hi = 0.02, 1.5
            for _ in range(60):
                m = 0.5 * (lo + hi)
                if self._scroll(scr, tt, (m, 1.0)) < want:
                    lo = m
                else:
                    hi = m
            tau = 0.5 * (lo + hi)
            k = 1.0
            if abs(self._scroll(scr, tt, (tau, 1.0)) - want) > 1.0:
                # גם τ קטן מדי ⇒ מקטינים את יחס-המעקב (נדיר; מדווח)
                lo, hi = 0.2, 1.0
                for _ in range(60):
                    m = 0.5 * (lo + hi)
                    if self._scroll(scr, tt, (0.05, m)) < want:
                        lo = m
                    else:
                        hi = m
                tau, k = 0.05, 0.5 * (lo + hi)
            self.tau[scr] = (tau, k)
            print(f'plan[{scr}]: target {tgt["target"]} under finger at t={tt:.2f}s: want scroll {want:.1f}pt '
                  f'(max {maxs:.0f}) ⇒ tau={tau:.3f}s follow={k:.2f} ⇒ got {self._scroll(scr, tt, (tau, k)):.1f}')

    def _scroll(self, scr, t, tk=None):
        tau, k = tk if tk is not None else self.tau.get(scr, (0.35, 1.0))
        maxs = self.maxscroll.get(scr, 1e9)
        s = 0.0
        for e in self.ev:
            if e['kind'] != 'flick' or e['on'] != scr or t < e['t0']:
                continue
            if t <= e['t1']:
                i = min(int(round((t - e['t0']) * self.fps)), len(e['ys']) - 1)
                return float(np.clip(s + k * (e['ys'][0] - e['ys'][i]), 0, maxs))
            s = float(np.clip(s + k * (e['ys'][0] - e['ys'][-1]), 0, maxs))
            # תנופה עד ההחלקה הבאה על אותו מסך
            nxt = [x for x in self.ev if x['kind'] == 'flick' and x['on'] == scr and x['t0'] > e['t1']]
            tend = min(t, nxt[0]['t0']) if nxt else t
            dt = max(0.0, tend - e['t1'])
            s = float(np.clip(s + k * e['v'] * tau * (1 - np.exp(-dt / tau)), 0, maxs))
        return s

    # ------------------------------------------------------------------ ציור
    def view(self, name, scroll):
        im = self.img[name]
        y0 = int(round(scroll * S2))
        out = im[y0:y0 + int(VH * S2)]
        if out.shape[0] < VH * S2:
            out = np.vstack([out, np.repeat(out[-1:], int(VH * S2) - out.shape[0], 0)])
        return out.copy()

    def tap_time(self, target):
        for t in self.taps:
            if t.get('target') == target:
                return t['t']
        return None

    def render(self, t):
        T = {e['target']: e for e in self.taps}
        t1 = T['lock_notif']['t'] if 'lock_notif' in T else 1e9
        t2 = T['dash_row']['t'] if 'dash_row' in T else 1e9
        t3 = T['approve_btn']['t'] if 'approve_btn' in T else 1e9
        t4 = T['sms_link']['t'] if 'sms_link' in T else 1e9
        t_sms = self.P.get('sms_at', 1e9)
        notif_in = self.P.get('notif_in', 1.0)
        a_open = ease_out((t - (t1 + 0.12)) / 0.35)
        # --- מסך-נעילה
        a_n = ease_out((t - notif_in) / 0.45)
        lock = (self.img['lock_bg'].astype(np.float32) * (1 - a_n) + self.img['lock'].astype(np.float32) * a_n)
        if t1 - 0.05 <= t <= t1 + 0.3:
            x, y, w, h = [int(v * S2) for v in self.M['lock_notif']]
            lock[y:y + h, x:x + w] *= 0.9
        if a_open >= 1:
            base = None
        else:
            base = lock
        # --- סקירה / גיליון
        if t >= t1 + 0.12:
            dash_name = 'dash2' if t >= t3 + 0.2 else 'dash'
            sd = self._scroll('dash', t)
            if dash_name == 'dash2':
                sd = min(sd, self.H['dash2'] - VH)
            d = self.view(dash_name, sd).astype(np.float32)
            if t2 - 0.05 <= t <= t2 + 0.35 and dash_name == 'dash':
                x, y, w, h = self.M['dash_row']
                y0 = int((y - sd) * S2); y1 = int((y + h - sd) * S2)
                d[max(0, y0):max(0, y1), :] = d[max(0, y0):max(0, y1), :] * 0.93
            # גיליון
            o_open = ease_out((t - (t2 + 0.10)) / 0.38)
            o_close = ease_in_out((t - (t3 + 0.2)) / 0.32)
            sheet_vis = o_open * (1 - o_close)
            if sheet_vis > 0:
                bd = cv2.GaussianBlur(d, (0, 0), 8) * 0.4 + np.array([42, 23, 15], np.float32) * 0.6
                d = d * (1 - sheet_vis) + bd * sheet_vis
                ss = self._scroll('sheet', t)
                top = self.sheet_top + (VH - self.sheet_top) * (1 - sheet_vis)
                body = self.img['sheet']
                y0 = int(round(ss * S2)); hh = int(round((VH - top) * S2))
                if hh > 0:
                    crop = body[y0:y0 + hh].astype(np.float32)
                    if crop.shape[0] < hh:
                        crop = np.vstack([crop, np.repeat(crop[-1:], hh - crop.shape[0], 0)])
                    if t3 - 0.05 <= t <= t3 + 0.3:
                        x, y, w, h = self.M['approve_btn']
                        yy0 = int((y - ss) * S2); yy1 = int((y + h - ss) * S2)
                        xx0, xx1 = int(x * S2), int((x + w) * S2)
                        if yy1 > 0 and yy0 < hh:
                            crop[max(0, yy0):min(hh, yy1), xx0:xx1] *= 0.85
                    ty = int(round(top * S2))
                    d[ty:ty + hh] = crop[:int(VH * S2) - ty]
            # טוסט
            a_t = ease_out((t - (t3 + 0.45)) / 0.3)
            if a_t > 0 and t < t_sms + 0.5:
                x, y, w, h = self.M['toast']
                yy = y + 14 * (1 - a_t)
                tw = self.toast
                X0, Y0 = int(round(x * S2)), int(round(yy * S2))
                th_, tw_ = tw.shape[:2]
                region = d[Y0:Y0 + th_, X0:X0 + tw_]
                d[Y0:Y0 + th_, X0:X0 + tw_] = region * (1 - a_t) + tw[:region.shape[0], :region.shape[1]] * a_t
            if a_open < 1:
                # פתיחת-אפליקציה: זום מהתראה
                sc = 0.86 + 0.14 * a_open
                Mx = cv2.getRotationMatrix2D((VW, self.M['lock_notif'][1] * S2 + 88), 0, sc)
                dz = cv2.warpAffine(d, Mx, (int(VW * S2), int(VH * S2)), borderMode=cv2.BORDER_REPLICATE)
                base = lock * (1 - a_open) + dz * a_open
            else:
                base = d
        # --- הטלפון של הלקוח (אנכי בלבד)
        a_s = ease_in_out((t - t_sms) / 0.45)
        if a_s > 0:
            sm = self.img['sms'].astype(np.float32)
            if t4 - 0.05 <= t <= t4 + 0.25:
                x, y, w, h = self.M['sms_link']
                sm[int(y * S2) - 4:int((y + h) * S2) + 4, int(x * S2) - 4:int((x + w) * S2) + 4] *= 0.88
            a_p = ease_out((t - (t4 + 0.12)) / 0.36)
            if a_p > 0:
                sp = self._scroll('pay', t)
                pv = self.view('pay', sp).astype(np.float32)
                # דחיפה מצד שמאל (RTL): הדף החדש נכנס משמאל, הקודם זז מעט ימינה ומוחשך
                off = int(round(VW * S2 * (1 - a_p)))
                out_ = np.empty_like(sm)
                sh_ = int(round(0.3 * VW * S2 * a_p))
                out_[:, sh_:] = sm[:, :sm.shape[1] - sh_] * (1 - 0.25 * a_p)
                out_[:, :sh_] = sm[:, :1] * (1 - 0.25 * a_p)
                if off < out_.shape[1]:
                    out_[:, :out_.shape[1] - off] = pv[:, off:]
                sm = out_
            base = base * (1 - a_s) + sm * a_s
        # --- אדוות-מגע
        out = base
        for e in self.taps:
            dt = t - e['t']
            if 0 <= dt <= 0.5 and np.isfinite(e['p']).all():
                out = self._ripple(out, e['p'], dt / 0.5)
        return np.clip(out, 0, 255).astype(np.uint8)

    def _ripple(self, img, p, u):
        r = (14 + 46 * ease_out(u)) * S2
        a = 0.32 * (1 - u)
        c = (int(round(p[0] * S2 * 4)), int(round(p[1] * S2 * 4)))
        m = np.zeros(img.shape[:2], np.uint8)
        cv2.circle(m, c, int(r * 4), 255, -1, cv2.LINE_AA, shift=2)
        lum = img[max(0, c[1] // 4 - 4):c[1] // 4 + 4, max(0, c[0] // 4 - 4):c[0] // 4 + 4].mean()
        col = np.array([255, 255, 255] if lum < 110 else [60, 60, 60], np.float32)
        al = m.astype(np.float32)[..., None] / 255 * a
        return img * (1 - al) + col * al
