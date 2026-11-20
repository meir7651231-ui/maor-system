import { useEffect, useState } from 'react';
import { useApp } from '../store.tsx';
import { api } from '../api.ts';
import { failPrefix } from '../lib/failure.ts';
import { confirmText, ROLE_LABEL, roleButtonLabel, rowActions, teamVisible, type TeamAct, type Team, type TeamUser } from '../lib/team.ts';
import { Button, Card } from './ui.tsx';

/** מנהל 328 (פתוח מ-327): ניהול תפקידים והשבתת עובדים — עד היום רק CLI. בעל העסק בלבד; כל שינוי נרשם ביומן
 *  ושולח לבעל העסק התראת «הגדרות רגישות שונו» שמי ששינה לא יכול לסגור בעצמו. אישור בלחיצה שנייה, בלי חלון דפדפן. */
export function TeamCard() {
  const { mode, me, showToast, showFail } = useApp();
  const [team, setTeam] = useState<Team | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [armed, setArmed] = useState<{ id: number; act: TeamAct } | null>(null);
  const [busy, setBusy] = useState(false);
  const show = mode === 'live' && teamVisible(me);
  useEffect(() => {
    if (!show) return;
    let on = true;
    api.team().then(t => { if (on) { setTeam(t); setErr(null); } })
      .catch(e => { if (on) setErr((e as Error).message); });
    return () => { on = false; };
  }, [show]);
  if (!show) return null;

  const run = async (u: TeamUser, act: TeamAct) => {
    if (armed?.id !== u.id || armed.act !== act) { setArmed({ id: u.id, act }); return; }
    setBusy(true); setArmed(null);
    try {
      setTeam(act === 'deactivate' ? await api.deactivate(u.id)
        : act === 'reactivate' ? await api.reactivate(u.id) : await api.setRole(u.id, act));
      showToast(act === 'deactivate' ? `✓ ${u.name} הושבת`
        : act === 'reactivate' ? `✓ ${u.name} הופעל מחדש כעובד` : `✓ ${u.name} עכשיו ${ROLE_LABEL[act]}`);
    } catch (e) { showFail(failPrefix('לא עודכן', (e as Error).message)); }
    setBusy(false);
  };

  return (
    <Card className="p-5 space-y-3">
      <h2 className="text-lg font-extrabold" id="team-h">👥 צוות ותפקידים</h2>
      <p className="text-sm text-ink-500">בעל העסק יכול לחדש שליחה אחרי שחזור מגיבוי ולנהל את הצוות. עובד מאשר תזכורות ותשובות. כל שינוי נרשם ונשלחת עליו התראה.</p>
      {err && <p role="alert" className="text-sm text-critical-ink font-bold" data-testid="team-error">לא הצלחנו לטעון את הצוות: {err}</p>}
      {!team && !err && <p className="text-sm text-ink-500">טוען…</p>}
      {team && (
        <ul className="divide-y divide-ink-100" aria-labelledby="team-h" data-testid="team-list">
          {team.users.map(u => {
            const a = rowActions(team, u);
            const pending = armed?.id === u.id ? armed.act : null;
            return (
              <li key={u.id} className="py-2.5 flex flex-wrap items-center gap-2" data-testid={`team-row-${u.id}`}>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold ${u.active ? '' : 'text-ink-500 line-through'}`}>{u.name}{team.me === u.id && ' (אתם)'}</p>
                  <p className="text-xs text-ink-500 num truncate" dir="ltr">{u.email}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${u.role === 'owner' ? 'bg-brand-50 text-brand-700 ring-brand/40' : 'bg-ink-50 text-ink-700 ring-ink-200'}`}
                  data-testid={`team-role-${u.id}`}>{u.active ? ROLE_LABEL[u.role] : 'מושבת'}</span>
                {a.toggleRole && (
                  <Button size="sm" variant="outline" disabled={busy} data-testid={`team-toggle-${u.id}`}
                    onClick={() => void run(u, a.toggleRole!)}>{pending === a.toggleRole ? 'לחצו שוב לאישור' : roleButtonLabel(a.toggleRole)}</Button>
                )}
                {a.deactivate && (
                  <Button size="sm" variant="danger" disabled={busy} data-testid={`team-off-${u.id}`}
                    onClick={() => void run(u, 'deactivate')}>{pending === 'deactivate' ? 'לחצו שוב לאישור' : 'השבתה'}</Button>
                )}
                {a.reactivate && (
                  <Button size="sm" variant="outline" disabled={busy} data-testid={`team-on-${u.id}`}
                    onClick={() => void run(u, 'reactivate')}>{pending === 'reactivate' ? 'לחצו שוב לאישור' : 'הפעלה מחדש'}</Button>
                )}
                {a.why && <span className="text-xs text-ink-500 w-full">{a.why}</span>}
                {pending && <p role="status" className="text-xs text-amber-900 w-full" data-testid={`team-confirm-${u.id}`}>{confirmText(u, pending)}</p>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-ink-500">הוספת עובד חדש (עם אימות דו-שלבי) — עדיין דרך התמיכה הטכנית.</p>
    </Card>
  );
}
