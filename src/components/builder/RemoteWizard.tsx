/**
 * 🛰 אשף-הרכבה קשור-ענן (5.8.2026 — בקשת-בעלים: "שאני אראה בלייב מה אני מדליק"):
 * עוטף את BuilderWizard המלא סביב לקוח-פלטפורמה. הזרימה:
 *   כניסה (#builder=slug): תצלום-המיתוג-הנוכחי נשמר (sessionStorage) → קונפיג-
 *   הלקוח נטען מהענן ו"מולבש" על האפליקציה (כמו PLATFORM_DEMOS) ⇒ האשף המלא
 *   עורך את הלקוח, והבעלים רואה את המערכת שלו-עצמו מתלבשת חי.
 *   כל שינוי → נכתב לענן (debounce 400ms) ⇒ אצל הלקוח מיד (onSnapshot, ענן 2).
 *   סגירה: המיתוג המקורי חוזר (וגם אחרי קריסה — השחזור רץ ב-App על התצלום).
 * מיילי-על בלבד (השער ב-App, דפוס #platform).
 */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { normalizeConfig } from '../../lib/config';
import { allOffConfig, orgLink } from '../platform/lib';
import { BuilderWizard } from './BuilderWizard';

type CloudMod = typeof import('../../store/cloudSync');

/** מפתח תצלום-המיתוג — per-tab (sessionStorage); App משחזר ממנו אחרי קריסה. */
export const BUILDER_PREV_KEY = 'maor_builder_prev';

export function RemoteWizard({ slug, onClose }: { slug: string; onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const modRef = useRef<CloudMod | null>(null);

  // כניסה: תצלום → טעינת-הלקוח → הלבשה חיה
  useEffect(() => {
    let alive = true;
    try {
      sessionStorage.setItem(BUILDER_PREV_KEY, JSON.stringify(useApp.getState().config));
    } catch { /* אין sessionStorage — עדיין עובדים, בלי שחזור-קריסה */ }
    void import('../../store/cloudSync').then(async (m) => {
      modRef.current = m;
      try {
        const doc = await m.fetchOrgCloudConfig(slug);
        if (!alive) return;
        const norm = (doc?.config ? normalizeConfig(doc.config) : null) ?? allOffConfig(slug, doc?.orgName ?? '');
        useApp.getState().setConfig({ ...norm, slug });
        setReady(true);
      } catch {
        if (alive) setErr('טעינת הלקוח מהענן נכשלה — בדקו חיבור ונסו שוב');
      }
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  // כל שינוי-קונפיג בזמן שהאשף פתוח → כתיבה חיה לענן של הלקוח
  useEffect(() => {
    if (!ready) return;
    let t = 0;
    const unsub = useApp.subscribe((s, p) => {
      if (s.config !== p.config) {
        clearTimeout(t);
        t = window.setTimeout(() => {
          void modRef.current
            ?.writeOrgCloudConfig(slug, s.config)
            .catch(() => useApp.getState().toast('⚠ הכתיבה לענן נכשלה — המתג לא נשמר אצל הלקוח'));
        }, 400);
      }
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [ready, slug]);

  /** סגירה: שחזור המיתוג המקורי של הבעלים. */
  function close() {
    try {
      const raw = sessionStorage.getItem(BUILDER_PREV_KEY);
      if (raw) useApp.getState().setConfig(JSON.parse(raw));
      sessionStorage.removeItem(BUILDER_PREV_KEY);
    } catch { /* אין תצלום — נשארים כמו-שזה */ }
    onClose();
  }

  if (err) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'var(--bg)' }}>
        <div className="empty" style={{ marginTop: 120 }}>{err}</div>
        <div style={{ textAlign: 'center' }}><button type="button" className="btn" onClick={close}>✕ חזרה</button></div>
      </div>
    );
  }
  if (!ready) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'var(--bg)' }}>
        <div className="empty" style={{ marginTop: 120 }}>{'🛰 טוען את הלקוח ' + slug + '…'}</div>
      </div>
    );
  }
  return (
    <>
      <BuilderWizard onClose={close} />
      {/* רצועת-הענן: ברור שעורכים לקוח חי + קישור לאתר שמתעדכן בזמן-אמת */}
      <div
        style={{
          position: 'fixed',
          bottom: 10,
          insetInlineStart: '50%',
          transform: 'translateX(50%)',
          zIndex: 340,
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 999,
          padding: '8px 18px',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          boxShadow: '0 4px 18px rgba(0,0,0,.25)',
        }}
      >
        <span>{'🛰 עריכת-ענן חיה — ' + slug}</span>
        <a
          href={orgLink(window.location.origin, window.location.pathname, slug)}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#fff', textDecoration: 'underline' }}
          onClick={() => toast('האתר של הלקוח נפתח בלשונית — מתעדכן חי עם כל מתג')}
        >
          👁 האתר החי
        </a>
      </div>
    </>
  );
}
