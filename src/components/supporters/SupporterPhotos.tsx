/**
 * גלריית-תמונות לתורם — העלאה (עם הקטנה אוטומטית ל-canvas), תצוגת-רשת, הגדלה
 * (לייטבוקס) ומחיקה. התמונות נשמרות מקומית ב-DB (data:URI) ⇒ מגובות/מסונכרנות;
 * תקרה קשיחה PHOTO_MAX + הקטנה ל-PHOTO_MAX_DIM. מגודר supporters.photos.
 */
import { useRef, useState } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { Btn } from '../ui';
import { canAddPhoto, fitDimensions, PHOTO_MAX, PHOTO_MAX_DIM, PHOTO_MAX_LEN } from '../../lib/photoGallery';

export function SupporterPhotos(props: { supporter: Supporter }) {
  const sp = props.supporter;
  const addPhoto = useApp((s) => s.addSupporterPhoto);
  const removePhoto = useApp((s) => s.removeSupporterPhoto);
  const toast = useApp((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const photos = sp.photos || [];

  function pick() {
    fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // מאפשר בחירה-חוזרת של אותו קובץ
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('נא לבחור קובץ-תמונה'); return; }
    setBusy(true);
    const reader = new FileReader();
    reader.onerror = () => { setBusy(false); toast('שגיאה בקריאת הקובץ'); };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => { setBusy(false); toast('התמונה לא-נתמכת'); };
      img.onload = () => {
        try {
          const { w, h } = fitDimensions(img.naturalWidth, img.naturalHeight, PHOTO_MAX_DIM);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { setBusy(false); return; }
          ctx.drawImage(img, 0, 0, w, h);
          let q = 0.72;
          let uri = canvas.toDataURL('image/jpeg', q);
          while (uri.length > PHOTO_MAX_LEN && q > 0.4) { q -= 0.1; uri = canvas.toDataURL('image/jpeg', q); }
          if (uri.length > PHOTO_MAX_LEN) { toast('התמונה גדולה מדי גם אחרי הקטנה'); }
          else addPhoto(sp.id, uri);
        } finally {
          setBusy(false);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>📷 תמונות ({photos.length}/{PHOTO_MAX})</div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
        <Btn sm onClick={pick} disabled={busy || !canAddPhoto(photos)} title={canAddPhoto(photos) ? 'העלאת תמונה (תוקטן אוטומטית)' : 'הגעתם לתקרה'}>
          {busy ? 'מעלה…' : '➕ הוספת תמונה'}
        </Btn>
      </div>

      {photos.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין עדיין תמונות — העלו עד {PHOTO_MAX} תמונות (נשמרות במכשיר ומגובות).</div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {photos.map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 92, height: 92, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
              <img
                src={src} alt={'תמונה ' + (i + 1)} loading="lazy"
                onClick={() => setZoom(i)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', display: 'block' }}
              />
              <button
                type="button" onClick={() => removePhoto(sp.id, i)} title="מחיקת תמונה"
                style={{ position: 'absolute', insetBlockStart: 3, insetInlineEnd: 3, width: 22, height: 22, borderRadius: 99, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '22px', padding: 0 }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* לייטבוקס */}
      {zoom != null && photos[zoom] ? (
        <div
          onClick={() => setZoom(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}
        >
          <img src={photos[zoom]} alt="תצוגה מוגדלת" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} />
        </div>
      ) : null}
    </div>
  );
}
