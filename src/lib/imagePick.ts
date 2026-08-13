/**
 * בחירת-תמונה + כיווץ ל-thumbnail (פיצ'ר גלריה, הכרעת בעלים "כל מה שצריך תמונה").
 *
 * למה כיווץ: הנתונים נשמרים local-first ב-localStorage (תקרת ~5MB למסמך כולו) +
 * מסונכרנים/מגובים. תמונה מלאה כ-data URL הייתה מפוצצת את התקרה. לכן מורידים כל
 * תמונה ל-≤MAX_PX על הצלע הארוכה ומקודדים JPEG (איכות 0.72) — thumbnail ~15-30KB
 * שנוסע עם הסנכרון והגיבוי (אפס אובדן, שומר את הנתונים שלמים).
 *
 * מחזיר data URL (image/jpeg). דוחה קובץ לא-תמונה / שגיאת-פענוח.
 */
const MAX_PX = 320;
const QUALITY = 0.72;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB קלט גולמי — נכווץ בכל מקרה

export async function pickAndCompressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('הקובץ אינו תמונה');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('התמונה גדולה מדי (מקסימום 8MB)');
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('דפדפן אינו תומך בעיבוד תמונה');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

/**
 * קריאת קובץ-מסמך (לא-תמונה) ל-data URL מוטמע — בקשת-בעלים 13.8 א'.
 * תקרה שמרנית (ברירת-מחדל 3MB) כי מסמך מוטמע נשמר ב-localStorage (תקרת ~5MB
 * למסמך כולו) ונוסע עם הסנכרון; קובץ גדול ⇒ יש להשתמש בקישור חיצוני במקום.
 */
export const MAX_EMBED_BYTES = 3 * 1024 * 1024; // 3MB לקובץ מוטמע

export async function readFileAsDataUrl(file: File, maxBytes: number = MAX_EMBED_BYTES): Promise<string> {
  if (file.size > maxBytes)
    throw new Error('הקובץ גדול מדי להטמעה (מקסימום ' + Math.round(maxBytes / 1024 / 1024) + 'MB) — הוסיפו קישור במקום');
  return readAsDataUrl(file);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('קריאת הקובץ נכשלה'));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('פענוח התמונה נכשל'));
    img.src = src;
  });
}
