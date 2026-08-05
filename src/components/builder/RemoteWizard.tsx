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

/** מפתח תצלום-המיתוג — ‏localStorage (שורד סגירת-טאב); App משחזר ממנו אחרי קריסה. */
export const BUILDER_PREV_KEY = 'maor_builder_prev';

/**
 * שחזור תצלום-המיתוג של הבעלים (config + ערכה-אישית) — משותף לסגירה-מסודרת
 * (close) ולשחזור-קריסה ב-App. תומך גם בתצלום ישן (config בלבד, לפני 5.8).
 */
export function restoreBuilderPrev(): void {
  try {
    const raw = localStorage.getItem(BUILDER_PREV_KEY);
    if (raw) {
      const prev = JSON.parse(raw) as { config?: unknown; uiTheme?: string | null; uiAccent?: string | null; slug?: string };
      const st = useApp.getState();
      // פורמט ישן = הקונפיג עצמו (יש slug ברמה-העליונה); חדש = {config, uiTheme, uiAccent}
      const cfg = prev.config ?? (prev.slug ? prev : null);
      if (cfg) st.setConfig(cfg as never);
      if ('uiTheme' in prev || 'uiAccent' in prev) {
        // שחזור ההעדפה-האישית בדיוק כפי-שהייתה (null = לא-הוגדרה ⇒ נופלת לערכת-הקונפיג);
        // ה-subscriber של db.ui מחיל את הערכה על ה-DOM אוטומטית.
        st.setDb((db) => ({ ui: { ...db.ui, theme: prev.uiTheme ?? undefined, accent: prev.uiAccent ?? undefined } }));
      }
    }
    localStorage.removeItem(BUILDER_PREV_KEY);
    sessionStorage.removeItem(BUILDER_PREV_KEY); // ניקוי שאריות מהפורמט הישן
  } catch { /* אין תצלום — נשארים כמו-שזה */ }
}

export function RemoteWizard({ slug, onClose }: { slug: string; onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const modRef = useRef<CloudMod | null>(null);

  // כניסה: תצלום → טעינת-הלקוח → הלבשה חיה
  useEffect(() => {
    let alive = true;
    try {
      // ‏localStorage (לא session! ציד-באגים 5.8): סגירת-טאב באמצע עריכה הייתה
      // מוחקת את התצלום ⇒ האתר של הבעלים נשאר לבוש-כלקוח לתמיד. התצלום כולל
      // גם את ערכת-הנושא האישית (db.ui) — האשף משנה אותה חי (pickTheme/setTheme)
      // והיא לא חלק מה-config המשוחזר.
      const st = useApp.getState();
      localStorage.setItem(BUILDER_PREV_KEY, JSON.stringify({
        config: st.config,
        uiTheme: st.db.ui.theme ?? null,
        uiAccent: st.db.ui.accent ?? null,
      }));
    } catch { /* אין localStorage — עדיין עובדים, בלי שחזור-קריסה */ }
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

  /** סגירה: שחזור המיתוג + הערכה-האישית של הבעלים (restoreBuilderPrev המשותף). */
  function close() {
    restoreBuilderPrev();
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
