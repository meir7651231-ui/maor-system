/**
 * 💚 מרכז-שימור (גל ה׳ · פאזה 11) — חיזוי-נשירה: רשימת התלמידים-בסיכון עם ציון-סיכון
 * וסיבה (נגזרת-טהורה דטרמיניסטית, retention.ts), וכפתור "✍️ הצעת-התערבות" שמנסח הודעת-
 * פנייה חמה להורה דרך lib/ai.ts הדורמנטי (Claude Haiku, מפתח-מקומי). רשימת-הסיכון זמינה
 * תמיד; ההצעה נופלת-רך כשאין מפתח. מגודר opt-in courses.ai===true. אפס-כסף · אפס-סכמה.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { integrationOn } from '../../lib/config';
import { askClaude, readAiKey } from '../../lib/ai';
import { Btn, Empty, Modal } from '../ui';
import { chipStyle } from './lib';
import { dropoutInsights, interventionPrompt, type DropoutInsight } from './retention';

function scoreColor(score: number): { bg: string; c: string } {
  if (score >= 80) return { bg: '#fdeaea', c: '#b91c1c' };
  if (score >= 60) return { bg: '#fdf1d4', c: '#9a6414' };
  return { bg: '#f2e8dc', c: '#8b6b3d' };
}

export function RetentionCenter(props: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);

  const insights = useMemo(() => dropoutInsights(db.enrollments), [db.enrollments]);
  const aiReady = integrationOn(config, 'ai') && !!readAiKey();
  const orgName = config.orgName || db.orgName || '';

  const [aiFor, setAiFor] = useState<DropoutInsight | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');

  const courseName = (id: string) => db.courses.find((c) => c.id === id)?.name ?? '—';
  const memberName = (memberId: string) => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === memberId);
      if (m) return { first: m.first, fam: f.name };
    }
    return { first: '—', fam: '' };
  };

  async function startDraft(ins: DropoutInsight) {
    const nm = memberName(ins.memberId);
    setAiFor(ins);
    setDraft('');
    setBusy(true);
    try {
      const d = await askClaude(
        readAiKey(),
        interventionPrompt({ orgName, childName: nm.first, courseName: courseName(ins.courseId), absences: ins.absences }),
      );
      setDraft(d);
    } catch (e) {
      toast((e as Error).message || 'ניסוח ההצעה נכשל');
      setAiFor(null);
    } finally {
      setBusy(false);
    }
  }

  // תצוגת-טיוטה (החלפת-תוכן במקום מודאל-על-מודאל — מונע התנגשות focus-trap)
  if (aiFor) {
    const nm = memberName(aiFor.memberId);
    return (
      <Modal title={'✍️ הצעת התערבות — ' + nm.first} onClose={props.onClose} wide>
        {busy ? (
          <div className="empty">מנסח הצעה…</div>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              style={{ width: '100%', fontSize: 14, lineHeight: 1.6, padding: 10 }}
            />
            <div className="modal-actions">
              <Btn onClick={() => setAiFor(null)}>← חזרה</Btn>
              <Btn
                kind="primary"
                onClick={() =>
                  void navigator.clipboard
                    ?.writeText(draft)
                    .then(() => toast('ההצעה הועתקה — הדביקו בוואטסאפ/מייל'))
                    .catch(() => toast('העתקה נכשלה — סמנו והעתיקו ידנית'))
                }
              >
                📋 העתקה
              </Btn>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
              טיוטה בלבד — עברו עליה והתאימו לפני השליחה. אינה נשלחת אוטומטית.
            </div>
          </>
        )}
      </Modal>
    );
  }

  return (
    <Modal title="💚 מרכז שימור — תלמידים בסיכון נשירה" onClose={props.onClose} wide>
      {!aiReady && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', background: 'var(--surface-2, #fafaf7)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
          💡 רשימת-הסיכון זמינה תמיד. כדי לקבל <b>ניסוח הצעת-התערבות</b> אוטומטי — הזינו מפתח-AI בהגדרות (🤖 עוזר-AI).
        </div>
      )}

      {insights.length === 0 ? (
        <Empty>אין תלמידים בסיכון-נשירה כרגע 🎉</Empty>
      ) : (
        insights.map((ins) => {
          const nm = memberName(ins.memberId);
          const col = scoreColor(ins.score);
          return (
            <div key={ins.enrollmentId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={chipStyle(col.bg, col.c)}>{ins.score}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{nm.first + ' · ' + nm.fam}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{courseName(ins.courseId) + ' · ' + ins.reason}</div>
              </div>
              {aiReady && (
                <Btn sm onClick={() => void startDraft(ins)} title="ניסוח הודעת-פנייה חמה להורה (עוזר-AI)">
                  ✍️ הצעת-התערבות
                </Btn>
              )}
            </div>
          );
        })
      )}

      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
        הציון נגזר מהחיסורים והחוב (דטרמיניסטי). ההצעה — אם מופעלת — היא טיוטה לעריכה, לא נשלחת אוטומטית.
      </div>
    </Modal>
  );
}
