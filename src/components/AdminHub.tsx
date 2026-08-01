/**
 * 🛠 כניסת-הניהול (ADMINHUB) — בורר קטן למנהל-העל בלבד. הכפתור שפותח אותו
 * מגודר `isSuperAdmin` בשלדים (App.tsx), כך שאצל לקוח/משתמש רגיל הוא כלל
 * לא קיים ב-DOM. הבורר עצמו רק מנתב לשני הכלים הקיימים — לוח הבקרה
 * (#platform) והאשף המקומי (#builder) — דרך ה-hash, כך שהקישורים הישנים
 * ממשיכים לעבוד והכפתור הוא תוספת בלבד.
 */
import { Modal } from './ui';

function HubButton(props: { emoji: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        width: '100%',
        textAlign: 'start',
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid var(--line)',
        background: 'var(--panel)',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 800 }}>{props.emoji + ' ' + props.title}</span>
      <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{props.sub}</span>
    </button>
  );
}

export function AdminHub(props: { onClose: () => void; onOpenPlatform: () => void; onOpenBuilder: () => void }) {
  return (
    <Modal title="🛠 ניהול פלטפורמה" onClose={props.onClose}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12 }}>
        כניסת-הניהול שלך — בחרו לאן להיכנס:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <HubButton
          emoji="🛠"
          title="לוח הבקרה"
          sub="לקוחות חיים בענן — הרשמות, אישורים, מתגים חיים"
          onClick={props.onOpenPlatform}
        />
        <HubButton
          emoji="📦"
          title="אשף הקמה מקומי"
          sub="קובץ קונפיג ידני / הדגמה — הרכבה והורדה"
          onClick={props.onOpenBuilder}
        />
      </div>
    </Modal>
  );
}
