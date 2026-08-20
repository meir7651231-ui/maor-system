/**
 * 🚪 שער-ההצטרפות בעמוד-השיווק (פאזה 1) — מרכז-כניסה צף, נוסף **לצד** הכניסה הקיימת
 * (אפס-מחיקה). שתי דלתות: 👪 הרשמת ילד/ה לחוג (טופס ציבורי → שליחה רב-ערוצית) ו-🔑
 * כניסת-צוות (מוביל למסך-הכניסה הקיים דרך onEnter). מגודר opt-in `shell.portal`.
 * self-contained: overlay משלו בסגנון-האתר, בלי תלות בשלד-האפליקציה.
 */
import { useState, type CSSProperties } from 'react';
import { useApp } from '../../store/useApp';
import { EMPTY_PORTAL_FORM, portalChannels, portalHasChannels, portalValid, type PortalForm } from './portal';

type View = 'hub' | 'parent';

export function PortalEntry({ onEnter }: { onEnter: () => void }) {
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const orgName = config.orgName || dbOrgName || '';
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('hub');
  const [form, setForm] = useState<PortalForm>(EMPTY_PORTAL_FORM);

  const hasChannels = portalHasChannels(config);
  const channels = portalValid(form) ? portalChannels(config, orgName, form) : [];

  const close = () => {
    setOpen(false);
    setView('hub');
    setForm(EMPTY_PORTAL_FORM);
  };

  const field = (label: string, key: keyof PortalForm, ph: string, req?: boolean) => (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#3a3a3a' }}>
        {label} {req && <span style={{ color: '#c0392b' }}>*</span>}
      </span>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={ph}
        style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0ddd5', fontSize: 15, fontFamily: 'inherit' }}
      />
    </label>
  );

  return (
    <>
      {/* כפתור-צף — נוסף לצד ה"כניסה" שכבר קיימת ב-nav */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', insetInlineEnd: 20, bottom: 20, zIndex: 40,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '13px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 15.5, fontWeight: 800, color: '#fff',
          background: 'linear-gradient(135deg,#7c5cff,#4a90d9)', boxShadow: '0 10px 28px rgba(90,80,180,.4)',
        }}
      >
        🚪 הצטרפות
      </button>

      {open && (
        <div
          role="presentation"
          onMouseDown={close}
          style={{ position: 'fixed', inset: 0, zIndex: 41, background: 'rgba(20,18,30,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, padding: '24px 22px', boxShadow: '0 30px 80px rgba(0,0,0,.35)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <strong style={{ fontSize: 19, color: '#2a2a2a' }}>{view === 'hub' ? '🚪 הצטרפות ל' + (orgName || 'ארגון') : '👪 הרשמת ילד/ה לחוג'}</strong>
              <button type="button" onClick={close} aria-label="סגירה" style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#999', lineHeight: 1 }}>✕</button>
            </div>

            {view === 'hub' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* דלת 1 — הורים */}
                <button
                  type="button"
                  onClick={() => setView('parent')}
                  style={doorStyle('linear-gradient(135deg,#fef3e2,#fde8cf)')}
                >
                  <span style={{ fontSize: 30 }}>👪</span>
                  <span style={{ textAlign: 'start' }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 16, color: '#8a5a1a' }}>הרשמת ילד/ה לחוג</span>
                    <span style={{ display: 'block', fontSize: 13, color: '#a5772f' }}>ממלאים פרטים — ואנחנו חוזרים אליכם</span>
                  </span>
                </button>
                {/* דלת 2 — צוות/מנהל (מוביל לכניסה הקיימת) */}
                <button
                  type="button"
                  onClick={() => { close(); onEnter(); }}
                  style={doorStyle('linear-gradient(135deg,#e8ecfa,#dce4f7)')}
                >
                  <span style={{ fontSize: 30 }}>🔑</span>
                  <span style={{ textAlign: 'start' }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 16, color: '#33477e' }}>כניסת צוות ומנהל</span>
                    <span style={{ display: 'block', fontSize: 13, color: '#4a5a8e' }}>מורים · עובדות · מנהל · בעלים</span>
                  </span>
                </button>
              </div>
            ) : (
              <div>
                {field('שם הילד/ה', 'childName', 'שם מלא', true)}
                {field('שם ההורה', 'parentName', 'שם מלא')}
                {field('טלפון', 'phone', '050-0000000', true)}
                {field('חוג מבוקש', 'course', 'למשל: ציור, גיטרה…')}
                {field('הערה', 'note', 'משהו שנרצה לדעת?')}

                {!hasChannels ? (
                  <div style={{ fontSize: 13, color: '#c0392b', background: '#fdecea', borderRadius: 10, padding: '10px 12px', marginTop: 6 }}>
                    לארגון עדיין לא הוגדרו פרטי-קשר באתר — לא ניתן לשלוח בקשה.
                  </div>
                ) : !portalValid(form) ? (
                  <div style={{ fontSize: 13, color: '#8a6d3b', marginTop: 6 }}>מלאו שם-ילד/ה וטלפון כדי לשלוח.</div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3a3a3a', marginBottom: 8 }}>שליחת הבקשה:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {channels.map((ch) => (
                        <a
                          key={ch.key}
                          href={ch.href}
                          target={ch.key === 'whatsapp' || ch.key === 'email' ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 18px', borderRadius: 999, background: '#f4f2ec', border: '1.5px solid #e0ddd5', textDecoration: 'none', color: '#2a2a2a', fontWeight: 700, fontSize: 14.5 }}
                        >
                          {ch.icon} {ch.label}
                        </a>
                      ))}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#999', marginTop: 10 }}>הבקשה נפתחת לעריכה לפני שליחה — אינה מחייבת. שיבוץ סופי מאושר ע"י הרכז.</div>
                  </div>
                )}

                <button type="button" onClick={() => setView('hub')} style={{ marginTop: 14, border: 'none', background: 'none', color: '#7c5cff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← חזרה
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function doorStyle(bg: string): CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
    padding: '16px 18px', borderRadius: 16, border: '1.5px solid rgba(0,0,0,.06)',
    background: bg, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start',
  };
}
