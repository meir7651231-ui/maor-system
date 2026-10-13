/**
 * 📒 פרנסה׳לע — הקטנת-תמונה בדפדפן (shrink במקור, עיצוב 4): canvas ⇒ WebP (נפילה ל-JPEG) בתוך תקציב-תווים;
 * לוגו — רקע שקוף נשמר (WebP), אחרת רקע לבן. גודל-ההתחלה דרך fitDimensions של photoGallery; עד 8 מעברים —
 * בכל מעבר 5 איכויות, ואם לא נכנס — 80% מהממדים. הפלט נבדק ב-isDataImage (אותו שער כמו הגלריה של התורמים).
 */
import { fitDimensions, isDataImage } from '../../lib/photoGallery';

let WEBP: boolean | null = null;
function webpOK(): boolean {
  if (WEBP == null) {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 2;
      WEBP = c.toDataURL('image/webp').startsWith('data:image/webp');
    } catch {
      WEBP = false;
    }
  }
  return WEBP;
}

function loadImg(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      URL.revokeObjectURL(u);
      res(i);
    };
    i.onerror = () => {
      URL.revokeObjectURL(u);
      rej(new ShrinkError('type'));
    };
    i.src = u;
  });
}

export class ShrinkError extends Error {
  readonly code: 'type' | 'big';
  constructor(code: 'type' | 'big') {
    super(code);
    this.code = code;
  }
}

/** קובץ ⇒ data:image (WebP/JPEG) עד max פיקסלים בצלע הארוכה ועד budget תווים; ShrinkError('type'|'big'). */
export async function shrinkImage(file: File, max: number, budget: number, alpha: boolean): Promise<string> {
  if (!file || !(file.type || '').startsWith('image/')) throw new ShrinkError('type');
  const img = await loadImg(file);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new ShrinkError('type');
  let { w: cw, h: ch } = fitDimensions(w, h, max);
  const cv = document.createElement('canvas');
  const cx = cv.getContext('2d');
  if (!cx) throw new ShrinkError('type');
  const type = webpOK() ? 'image/webp' : 'image/jpeg';
  for (let pass = 0; pass < 8; pass++) {
    cv.width = Math.max(1, Math.round(cw));
    cv.height = Math.max(1, Math.round(ch));
    cx.clearRect(0, 0, cv.width, cv.height);
    if (!alpha || type === 'image/jpeg') {
      cx.fillStyle = '#fff';
      cx.fillRect(0, 0, cv.width, cv.height);
    }
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, 0, 0, cv.width, cv.height);
    for (const q of [0.82, 0.72, 0.62, 0.52, 0.42]) {
      const u = cv.toDataURL(type, q);
      if (u.length <= budget && isDataImage(u)) return u;
    }
    cw *= 0.8;
    ch *= 0.8;
  }
  throw new ShrinkError('big');
}
