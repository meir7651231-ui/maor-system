/**
 * 🤖 מודאל "שאל את מאור" (VISION-LIGHT ‏#30) — קלט-שאלה חופשי מעל הפרשן
 * הדטרמיניסטי (askMaor.ts). אופליין-מלא: שום נתון לא עוזב את המכשיר.
 * קריאה-בלבד; "למסך" מנווט בלבד. נפתח ממרכז-העזרה ❓ (opt-in ‏shell.askmaor).
 */
import { useState } from 'react';
import { useApp, type View } from '../store/useApp';
import { isoToday } from '../lib/date-util';
import { Btn, Modal } from './ui';
import { askMaor, ASK_EXAMPLES, type AskAnswer } from './supporters/askMaor';

export function AskMaorModal({ onClose }: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const go = useApp((s) => s.go);
  const [q, setQ] = useState('');
  const [ans, setAns] = useState<AskAnswer | null>(null);
  const [miss, setMiss] = useState(false);

  const run = (text: string) => {
    const a = askMaor(text, db, isoToday(), db.usdRate);
    setAns(a);
    setMiss(!a && !!text.trim());
  };

  return (
    <Modal title="🤖 שאל את מאור" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 'min(430px, 84vw)' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          שאלה חופשית על הנתונים שלכם — הכול מחושב במכשיר, שום נתון לא נשלח החוצה.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') run(q); }}
            placeholder="למשל: מי לא תרם השנה?"
            style={{ flex: 1, fontSize: 14, padding: '9px 12px' }}
            autoFocus
          />
          <Btn kind="primary" onClick={() => run(q)}>שאל</Btn>
        </div>

        {ans && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--accent)' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{ans.icon} {ans.title}</div>
            {ans.lines.map((l, i) => (
              <div key={i} style={{ fontSize: 13, borderBottom: i < ans.lines.length - 1 ? '1px dashed var(--line-soft, var(--line))' : 'none', paddingBottom: 4 }}>
                {l}
              </div>
            ))}
            {ans.total != null && ans.total > ans.lines.length && (
              <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>ועוד {ans.total - ans.lines.length} — הרשימה המלאה במסך</div>
            )}
            {ans.view && (
              <Btn sm onClick={() => { go(ans.view as View); onClose(); }}>↗ למסך המלא</Btn>
            )}
          </div>
        )}

        {(miss || !ans) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>
              {miss ? 'לא זיהיתי את השאלה — נסו אחת מאלה:' : 'מה אפשר לשאול:'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ASK_EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="chip" onClick={() => { setQ(ex); run(ex); }} style={{ cursor: 'pointer' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
