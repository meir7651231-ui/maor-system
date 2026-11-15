"""בדיקת הגימור: (1) פריים-סיום ≈ כרטיס-הסיום החדש (PSNR≥40); (2) פריימי-צילום לפני המעבר ≈ הבסיס (PSNR≥39.5 — קידוד דור-שני crf 10, לא נראה בעין);
(3) אין «שאריות» של הכרטיס הישן במעבר: הפרש מול השחזור (1-k)·foot+k·new קטן; (4) גרסה שקטה בלי אודיו, רגילה עם."""
import subprocess, sys, cv2, numpy as np
END_S, FADE = 4.5, 0.6; NEW = sys.argv[1]; bad = 0
psnr = lambda a, b: cv2.PSNR(a, b)
for fmt, name in (('h', 'gabi-demo-16x9'), ('v', 'gabi-reel-9x16')):
    new = cv2.imread(f'{NEW}/end_{fmt}.png'); old = cv2.imread(f'assets/end_{fmt}.png')
    def frames(p):
        c = cv2.VideoCapture(p); out = []
        while True:
            ok, f = c.read()
            if not ok: return out
            out.append(f)
    B, F = frames(f'base/{name}-base.mp4'), frames(f'../{name}.mp4')
    N = len(B); fps = 24.0; ne = int(END_S * fps); nf = N - ne; dur = nf / fps
    r = [psnr(F[-1], new), min(psnr(F[i], B[i]) for i in range(0, nf - int(FADE * fps) - 1, 7))]
    fade = [i for i in range(nf) if i / fps > dur - FADE]
    # שחזור צילום-המקור מהבסיס: foot=(base-k·old)/(1-k) ⇒ ציפייה=(1-k)·foot+k·new
    errs = []
    for i in fade[:-1]:
        k = (i / fps - (dur - FADE)) / FADE
        exp = np.clip(B[i].astype(np.float32) + k * (new.astype(np.float32) - old), 0, 255).astype(np.uint8)
        errs.append(psnr(F[i], exp))
    ok = len(F) == N and r[0] >= 40 and r[1] >= 39.5 and min(errs) >= 39
    bad += not ok
    print(f"{'PASS' if ok else 'FAIL'} {name}: frames {len(F)}/{N} · end-card PSNR {r[0]:.1f} · footage PSNR(min) {r[1]:.1f} · fade PSNR(min) {min(errs):.1f}")
    for suf, want in (('', 'video,audio'), ('-silent', 'video')):
        got = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', f'../{name}{suf}.mp4'], capture_output=True, text=True).stdout.split()
        ok2 = ','.join(got) == want; bad += not ok2
        print(f"{'PASS' if ok2 else 'FAIL'} {name}{suf}: streams {','.join(got)}")
sys.exit(1 if bad else 0)
