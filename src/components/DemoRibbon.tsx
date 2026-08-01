/**
 * סרט "מצב הדגמה" — מוצג רק כש-?org=demo (config.slug==='demo'). מבהיר לפרוספקט
 * שהוא מתנסה בנתוני-דוגמה, נותן CTA לפתיחת אתר אמיתי (חוזר לשורש ⇒ מסך ההרשמה
 * של אורביט), ו"התחל דמו מחדש" (משיכה מחדש של demo.json). אפס נגיעה בזרימת הליבה.
 */
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { parseBackupFile } from '../store/persist';

export function DemoRibbon() {
  const restoreDb = useApp((s) => s.restoreDb);
  const toast = useApp((s) => s.toast);
  const [busy, setBusy] = useState(false);

  async function restart() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}demo.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error('קובץ הדמו לא נמצא');
      restoreDb(parseBackupFile(await res.text()));
      toast('הדמו אופס — נתוני הדגמה טריים ✓');
    } catch (e) {
      toast('⚠ איפוס הדמו נכשל — ' + (e instanceof Error ? e.message : 'נסו שוב'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        padding: '8px 14px',
        marginBottom: 14,
        borderRadius: 'var(--radius)',
        border: '1px solid var(--accent)',
        background: 'var(--panel)',
        fontSize: 13.5,
      }}
    >
      <span style={{ fontWeight: 800 }} aria-hidden>
        🧪
      </span>
      <span style={{ fontWeight: 700, flex: 1, minWidth: 180 }}>
        מצב הדגמה — אתם מתנסים בנתוני דוגמה. שנו, הוסיפו ומחקו בחופשיות.
      </span>
      <button
        type="button"
        onClick={() => void restart()}
        disabled={busy}
        style={{
          padding: '5px 12px',
          borderRadius: 8,
          border: '1px solid var(--line)',
          background: 'transparent',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {busy ? 'מאפס…' : '↻ התחל דמו מחדש'}
      </button>
      <a
        href={import.meta.env.BASE_URL}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 800,
          textDecoration: 'none',
        }}
      >
        פתחו אתר משלכם →
      </a>
    </div>
  );
}
