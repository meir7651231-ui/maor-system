/**
 * 🛒 החנות של אורביט בתוך מסך ההרשמה (22.10 — "החנות צריכה לשבת צמוד להרשמה").
 * overlay שמטמיע את `public/orbit/store/` ב-iframe (סגנון-עצמאי, גופנים מקומיים,
 * אפס CDN) — כמו העיתון. "פתיחת המערכת" בתוך החנות שולחת postMessage
 * (`orbit-store-start`, אותו origin בלבד) ⇒ החלון נסגר וההרשמה נפתחת עם התחום
 * מסומן והבחירות מצורפות להודעה. Escape / ✕ / רקע סוגרים.
 */
import { useEffect } from 'react';
import { sanitizeStoreNames } from '../../lib/signupNotify';

const base = import.meta.env.BASE_URL;

export interface StoreStart {
  ed: string;
  names: string[];
}

export function StoreModal(props: { onClose: () => void; onStart: (s: StoreStart) => void }) {
  const { onClose, onStart } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: unknown; ed?: unknown; picks?: unknown } | null;
      if (!d || d.type !== 'orbit-store-start') return;
      onStart({ ed: typeof d.ed === 'string' ? d.ed : '', names: sanitizeStoreNames(d.picks) });
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('message', onMsg);
    };
  }, [onClose, onStart]);

  return (
    <div className="orbit-overlay" onClick={onClose} role="dialog" aria-label="החנות שלנו">
      <div className="orbit-reader orbit-store" onClick={(e) => e.stopPropagation()}>
        <div className="orbit-reader-bar">
          <span>🛒 החנות שלנו</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            style={{ marginInlineStart: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <iframe src={`${base}orbit/store/index.html`} title="החנות שלנו" loading="eager" />
      </div>
    </div>
  );
}
