/**
 * 🔄 באנר "יש גרסה חדשה — רענן" (בקשת-בעלים 31.8: "שלא אצטרך לרענן ידנית").
 *
 * הרקע: עד היום הריפוי היה **רענון-שקט** אוטומטי (visibilitychange / כל 15 דק')
 * — הלקוח לא ידע שיצאה גרסה, ורענון-פתע באמצע-עבודה נראה כתקלה. עכשיו: כשנמצא
 * build חדש (version.json.id ≠ __BUILD_ID__) מוצג באנר עדין עם "רענן עכשיו" —
 * הלקוח בשליטה (לא מאבד עבודה), ורואה בבירור שיש עדכון. index.html נטען
 * network-first (sw.js) ⇒ הרענון מביא את ה-assets המגובבים החדשים — קוד טרי.
 *
 * חסין-לולאה: fetch עם no-store + cache-bust; id חסר/שווה ⇒ אין באנר; דחייה
 * נזכרת פר-גרסה (sessionStorage) כדי לא לחזור על אותו build. מגודר shell.update
 * (חסר-דגל = פעיל, ביט-זהה להיום; false = מתג-חירום שמכבה את הבדיקה).
 */
import { useEffect, useState } from 'react';
import { useApp } from '../store/useApp';
import { featureOn } from '../lib/config';
import { isNewVersion, versionSeenKey } from '../lib/version';

export function UpdateBanner() {
  const config = useApp((s) => s.config);
  const on = featureOn(config, 'shell.update');
  const [newId, setNewId] = useState<string | null>(null);

  useEffect(() => {
    if (!on) return;
    let alive = true;
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      // no-store + cache-bust — מתווך/Fastly פר-מארח לא יגיש version.json ישן
      void fetch(import.meta.env.BASE_URL + 'version.json?t=' + Date.now(), { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((v: { id?: string } | null) => {
          if (!alive || !v?.id) return;
          if (!isNewVersion(__BUILD_ID__, v.id)) return;
          if (sessionStorage.getItem(versionSeenKey(v.id))) return; // נדחתה כבר לגרסה זו
          setNewId(v.id);
        })
        .catch(() => { /* אופליין — נבדוק בחזרה הבאה */ });
    };
    check();
    document.addEventListener('visibilitychange', check);
    const iv = window.setInterval(check, 15 * 60 * 1000);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(iv);
    };
  }, [on]);

  if (!newId) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(versionSeenKey(newId), '1'); } catch { /* פרטי/חסום */ }
    setNewId(null);
  };

  return (
    <div className="update-banner no-print" role="status" aria-live="polite">
      <span aria-hidden style={{ fontSize: 16 }}>🔄</span>
      <span style={{ fontWeight: 700, flex: 1, minWidth: 140 }}>עודכנה גרסה חדשה של המערכת</span>
      <button
        type="button"
        className="update-banner-refresh"
        onClick={() => window.location.reload()}
        title="טעינת הגרסה החדשה — לא נאבד מידע (הנתונים שמורים במכשיר)"
      >
        רענן עכשיו
      </button>
      <button
        type="button"
        className="update-banner-x"
        onClick={dismiss}
        aria-label="סגירה — אזכיר בכניסה הבאה"
        title="סגירה — לא עכשיו"
      >
        ✕
      </button>
    </div>
  );
}
