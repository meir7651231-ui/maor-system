/**
 * 📰 קורא העיתון של אורביט (SIGNUP מיתוג 3) — overlay שמטמיע את
 * `public/orbit/orbit-news.html` ב-iframe (סגנון-עצמאי, בלי pdf.js ובלי
 * CDN — העיתון self-contained). Escape / כפתור ✕ סוגרים.
 */
import { useEffect } from 'react';

const base = import.meta.env.BASE_URL;

export function NewsReader(props: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  return (
    <div className="orbit-overlay" onClick={props.onClose} role="dialog" aria-label="העיתון">
      <div className="orbit-reader" onClick={(e) => e.stopPropagation()}>
        <div className="orbit-reader-bar">
          <span>📰 העיתון</span>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="סגירה"
            style={{ marginInlineStart: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <iframe src={`${base}orbit/orbit-news.html`} title="העיתון" loading="eager" />
      </div>
    </div>
  );
}
