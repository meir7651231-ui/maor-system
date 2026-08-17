/**
 * 🩺 מודאל מאבחן-החסימות (11.8) — רץ אוטומטית בפתיחה, מציג ✓/✗ פר-שירות,
 * וכשמשהו חסום נותן את הטקסט המדויק להקראה למוקד חברת-הסינון (עם העתקה).
 * נגיש גם ממסך-הכניסה (לקוחה חסומה לא מגיעה פנימה!) וגם מ-❓ העזרה.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { netCheckScript, netCheckTargets, runNetCheck, type NetCheckResult } from '../../lib/netcheck';
import { Btn, Modal } from '../ui';

export function NetCheckModal({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const [results, setResults] = useState<NetCheckResult[] | null>(null);

  async function run() {
    setResults(null);
    const r = await runNetCheck(netCheckTargets(window.location.origin, config.firebase));
    setResults(r);
  }

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blocked = (results ?? []).filter((r) => !r.ok);
  const script = results ? netCheckScript(results) : '';

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(script);
      toast('📋 הטקסט הועתק — אפשר לשלוח לחברת-הסינון');
    } catch {
      toast('⚠ ההעתקה נחסמה — סמנו את הטקסט והעתיקו ידנית');
    }
  }

  return (
    <Modal title="🩺 בדיקת תקשורת" onClose={onClose}>
      {!results ? (
        <div className="empty">בודק את החיבורים…</div>
      ) : (
        <>
          {results.map((r) => (
            <div key={r.key} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, padding: '4px 0' }}>
              <span aria-hidden>{r.ok ? '✅' : '⛔'}</span>
              <span style={{ flex: 1 }}>{r.label}</span>
              <span dir="ltr" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{r.domain}</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', minWidth: 52, textAlign: 'end' }}>
                {r.ok ? r.ms + ' ms' : 'חסום'}
              </span>
            </div>
          ))}
          {blocked.length === 0 ? (
            <div style={{ marginTop: 12, fontSize: 13.5 }}>
              ✅ כל החיבורים פתוחים — אם משהו לא עובד, הבעיה אינה ברשת/בסינון.
            </div>
          ) : (
            <>
              <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.6 }}>
                ⛔ הקו הזה מסונן וחוסם חלק מהשירותים. התקשרו לחברת-הסינון שלכם
                (נטפרי: ‎*3617) והקריאו/שלחו את הבקשה הבאה:
              </div>
              <pre
                dir="rtl"
                style={{
                  background: 'var(--bg-soft, rgba(127,127,127,.08))',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  marginTop: 8,
                }}
              >
                {script}
              </pre>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
                עד שהפתיחה תאושר — המערכת ממשיכה לעבוד במלואה על המכשיר; רק
                ההתחברות/הסנכרון ממתינים, והנתונים יסתנכרנו ברגע שהקו ייפתח.
              </div>
            </>
          )}
          <div className="modal-actions">
            {blocked.length > 0 && (
              <Btn kind="primary" onClick={() => void copyScript()}>📋 העתקת הבקשה</Btn>
            )}
            <Btn onClick={() => void run()}>🔄 בדיקה חוזרת</Btn>
            <Btn onClick={onClose}>סגירה</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}
