/**
 * 🎬 "צפו בסרטון" (SIGNUP2 מיתוג 5) — overlay עם הסיור המצולם של אורביט
 * (`public/orbit/orbit-tour.webm`). הווידאו נטען **on-demand** (רק בלחיצה) —
 * אפס עלות לטעינת מסך ההרשמה. סגירה ב-✕ / Escape / קליק-רקע (דפוס NewsReader).
 */
import { useEffect } from 'react';

const base = import.meta.env.BASE_URL;

export function VideoModal(props: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  return (
    <div className="orbit-overlay" onClick={props.onClose} role="dialog" aria-label="הסרטון של אורביט">
      <div className="orbit-reader" onClick={(e) => e.stopPropagation()}>
        <div className="orbit-reader-bar">
          <span>🎬 מה זה אורביט</span>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="סגירה"
            style={{ marginInlineStart: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <video
          controls
          autoPlay
          playsInline
          src={`${base}orbit/orbit-tour.webm`}
          style={{ flex: 1, width: '100%', background: '#000', display: 'block', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
