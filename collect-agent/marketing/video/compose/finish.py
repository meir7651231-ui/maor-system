"""גימור הסרטונים (בלי קומפוזיט מחדש): מחליף את כרטיס-הסיום בגרסה מ-endcard.mjs (פונטים תקינים + כתובת
ההשקה מ-ads/launch.json) ומפיק גם גרסה שקטה (כתוביות בלבד).
קלט קבוע: base/*-base.mp4 (פלט composite.py) ⇒ אידמפוטנטי. במעבר (FADE אחרון של הצילום) composite כתב
fr=(1-k)·foot+k·old, ולכן fr+k·(new-old) = (1-k)·foot+k·new — ההחלפה מדויקת גם בתוך המעבר.
שימוש: python finish.py <end-dir>   (end-dir = פלט node endcard.mjs)"""
import subprocess, sys, json
import cv2, numpy as np
END_S, FADE = 4.5, 0.6          # זהים ל-composite.py
NEW = sys.argv[1]
for fmt, name in (('h', 'gabi-demo-16x9'), ('v', 'gabi-reel-9x16')):
    src = f'base/{name}-base.mp4'
    old = cv2.imread(f'assets/end_{fmt}.png').astype(np.float32)
    new = cv2.imread(f'{NEW}/end_{fmt}.png').astype(np.float32)
    cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    W, H = int(cap.get(3)), int(cap.get(4)); assert new.shape[:2] == (H, W), (fmt, new.shape)
    n_end = int(END_S * fps); n_foot = N - n_end; dur = n_foot / fps
    for out, audio in ((f'../{name}.mp4', True), (f'../{name}-silent.mp4', False)):
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', f'{fps}', '-i', '-']
        cmd += (['-i', src, '-map', '0:v', '-map', '1:a', '-c:a', 'copy'] if audio else ['-an'])
        cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', '10', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        cap = cv2.VideoCapture(src); o = 0; stats = dict(fade=0, end=0)
        while True:
            ok, fr = cap.read()
            if not ok: break
            to = o / fps
            if o >= n_foot:
                fr = new.astype(np.uint8); stats['end'] += 1
            elif to > dur - FADE:
                k = (to - (dur - FADE)) / FADE
                fr = np.clip(fr.astype(np.float32) + k * (new - old), 0, 255).astype(np.uint8); stats['fade'] += 1
            ff.stdin.write(fr.tobytes()); o += 1
        ff.stdin.close(); ff.wait(); assert ff.returncode == 0 and o == N, (out, o, N)
        print(json.dumps(dict(out=out, frames=N, fps=fps, **stats)))

# סימון לשער-ההשקה של גבי שיווק (check_launch --release): הסרטונים רונדרו לדומיין האמיתי
import pathlib
LJ = pathlib.Path(__file__).resolve().parents[2] / 'launch' / 'launch.json'
cfg = json.loads(LJ.read_text(encoding='utf-8'))
if not cfg.get('placeholder') and not str(cfg.get('domain', '')).endswith('example'):
    cfg['videos_rendered_for'] = cfg['domain']
    LJ.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('videos_rendered_for =', cfg['domain'])
