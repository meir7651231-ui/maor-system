/**
 * 📞 "נחזור אליכם" (SIGNUP מיתוג 3) — ליד ללא-חשבון: שם, טלפון, מתי-נוח,
 * הודעה ⇒ `cloudRequestCallback` (כותב platformLeads, create-only ציבורי).
 * מסך "נשלח — נחזור אליכם". Escape / רקע סוגרים.
 *
 * החלטת בנאי (מתועדת ב-CLOSED): Rules v2 מחייבים אימות לכתיבת
 * platformRequests, ולכן "נחזור אליכם" בלי-חשבון נכתב לאוסף נפרד
 * platformLeads (create-only, קריאה למיילי-על) — לכידת-ליד בטוחה בלי לרכך
 * את חוקי הבקשות.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';

const TIMES = ['בוקר', 'צהריים', 'ערב'];

export function CallbackModal(props: { onClose: () => void }) {
  const cloudRequestCallback = useApp((s) => s.cloudRequestCallback);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('צהריים');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError('שם מלא הוא שדה חובה');
    if (!/^[\d+][\d\s-]{6,}$/.test(phone.trim())) return setError('מספר טלפון תקין הוא שדה חובה');
    setBusy(true);
    setError('');
    try {
      await cloudRequestCallback({ contactName: name.trim(), phone: phone.trim(), preferredTime: time, notes: notes.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השליחה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="orbit-overlay" onClick={props.onClose} role="dialog" aria-label="נחזור אליכם">
      <div className="orbit-card" style={{ maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>📞</span>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>נחזור אליכם בשיחה</h2>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="סגירה"
            style={{ marginInlineStart: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div className="orbit-success">
            <div className="orbit-success-icon">✓</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 23, fontWeight: 700 }}>נשלח — נחזור אליכם</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.55 }}>
              נחזור אליכם לטלפון <strong dir="ltr">{phone}</strong> ב{time}. בלי התחייבות.
            </p>
            <button type="button" className="orbit-sbtn" style={{ display: 'inline-flex', padding: '0 22px' }} onClick={props.onClose}>
              סגירה
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.55 }}>
              השאירו פרטים — נתקשר בזמן שנוח לכם ונראה יחד איך המערכת מתאימה לכם.
            </p>
            <label className="orbit-label">שם מלא *</label>
            <input className="orbit-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ישראל ישראלי" />
            <label className="orbit-label">טלפון *</label>
            <input className="orbit-input" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" />
            <label className="orbit-label">מתי נוח לחזור אליכם?</label>
            <div className="orbit-secondary" style={{ marginBottom: 0 }}>
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="orbit-sbtn"
                  style={time === t ? { background: 'rgba(122,142,255,.24)', borderColor: 'rgba(150,170,255,.65)', color: '#fff' } : undefined}
                  onClick={() => setTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="orbit-label">הודעה (רשות)</label>
            <input className="orbit-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ספרו לנו בקצרה על העסק" />
            {error && <div className="orbit-error">{error}</div>}
            <button type="submit" className="orbit-primary" disabled={busy}>
              {busy ? 'שולח…' : 'שלחו — ונחזור אליכם'}
            </button>
            <p className="orbit-fine">כדרך כלל חוזרים תוך שעה, בשעות הפעילות.</p>
          </form>
        )}
      </div>
    </div>
  );
}
