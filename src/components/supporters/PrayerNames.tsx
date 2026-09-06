/**
 * 🙏 שמות לתפילה — סעיף בכרטיס-התורם (בקשת-בעלים 5.9): רשימת שמות עם הערה לכל שם,
 * הוספה, עריכת-הערה במקום, סימון "הוזכר ✓", הסרה, והעתקה של כל הרשימה. נפרד ממעקב-
 * הטיפול (ayin). מגודר supporters.prayernames (חסר = פעיל).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn } from '../ui';
import type { Supporter } from '../../types/domain';
import { prayerListText, prayerOpenCount } from './prayer';
import { fmtDate } from './lib';

export function PrayerNames(props: { supporter: Supporter }) {
  const sp = props.supporter;
  const list = sp.prayerNames ?? [];
  const add = useApp((s) => s.addPrayerName);
  const setNote = useApp((s) => s.setPrayerNote);
  const toggle = useApp((s) => s.togglePrayerName);
  const remove = useApp((s) => s.removePrayerName);
  const toast = useApp((s) => s.toast);
  const [name, setName] = useState('');
  const [note, setNote0] = useState('');
  const [armed, setArmed] = useState<string | null>(null);

  function submit() {
    if (!name.trim()) return;
    if (add(sp.id, name, note)) {
      setName('');
      setNote0('');
    }
  }
  function copyAll() {
    const text = prayerListText(list, '🙏 שמות לתפילה — ' + sp.name);
    void navigator.clipboard?.writeText(text).then(
      () => toast('הרשימה הועתקה 📋'),
      () => toast('לא ניתן להעתיק — נסו ידנית'),
    );
  }

  return (
    <div className="card" style={{ marginTop: 12 }} data-testid="prayer-names">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>
          {'🙏 שמות לתפילה'}
          {list.length > 0 && <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, marginInlineStart: 8 }}>{prayerOpenCount(list) + ' פתוחים · ' + list.length + ' סה"כ'}</span>}
        </h3>
        {list.length > 0 && (
          <Btn sm kind="plain" onClick={copyAll} title="העתקת כל הרשימה (שם — הערה) ללוח">
            📋 העתקת הרשימה
          </Btn>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם לתפילה (למשל: רחל בת לאה)"
          aria-label="שם לתפילה"
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          style={{ flex: '1 1 160px', padding: '6px 8px', fontSize: 13 }}
        />
        <input
          value={note}
          onChange={(e) => setNote0(e.target.value)}
          placeholder="הערה (למי / על מה)"
          aria-label="הערה לשם-התפילה"
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          style={{ flex: '2 1 200px', padding: '6px 8px', fontSize: 13 }}
        />
        {/* תווית ייחודית (לא "+ הוספה") — כרטיס-המעקב שמתחת משתמש ב"+ הוספה"; e2e/ayin-names-smoke לוחץ .first() */}
        <Btn sm kind="primary" onClick={submit} disabled={!name.trim()}>
          + הוספת שם לתפילה
        </Btn>
      </div>

      {list.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 8 }}>עדיין אין שמות — הוסיפו שם והערה למעלה.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {list.map((p) => (
            <div key={p.id} className="prayer-row" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(120px,1fr) minmax(160px,2fr) auto auto', gap: 8, alignItems: 'center', opacity: p.done ? 0.6 : 1 }}>
              <button
                type="button"
                onClick={() => toggle(sp.id, p.id)}
                title={p.done ? 'סימון כפתוח מחדש' : 'סימון כהוזכר'}
                aria-pressed={!!p.done}
                style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--line)', background: p.done ? 'var(--green)' : '#fff', color: p.done ? '#fff' : 'var(--ink)', cursor: 'pointer', fontWeight: 800 }}
              >
                {p.done ? '✓' : ''}
              </button>
              <div style={{ fontWeight: 700, fontSize: 13.5, textDecoration: p.done ? 'line-through' : 'none' }} title={'נוסף ' + fmtDate(p.addedAt)}>
                {p.name}
              </div>
              <input
                value={p.note}
                onChange={(e) => setNote(sp.id, p.id, e.target.value)}
                placeholder="הערה"
                aria-label={'הערה ל-' + p.name}
                style={{ padding: '4px 8px', fontSize: 12.5 }}
              />
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{fmtDate(p.addedAt)}</span>
              <button
                type="button"
                onClick={() => {
                  if (armed === p.id) { remove(sp.id, p.id); setArmed(null); } else { setArmed(p.id); window.setTimeout(() => setArmed((a) => (a === p.id ? null : a)), 2500); }
                }}
                title={armed === p.id ? 'לחיצה נוספת מוחקת' : 'הסרת השם'}
                aria-label={'הסרת ' + p.name}
                style={{ border: 'none', background: 'transparent', color: armed === p.id ? 'var(--red)' : 'var(--ink-faint)', cursor: 'pointer', fontSize: 14 }}
              >
                {armed === p.id ? '🗑 בטוח?' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
