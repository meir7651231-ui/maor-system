import { emailStateView } from '../lib/emailState.ts';

/** הערה בשורת הלקוח: «המייל חזר» / «סימן ספאם» + פעולת תיקון. צבעים ≥4.5:1 (tests/contrast.check.ts). */
export function EmailStateNote({ state, source }: { state?: string | null; source?: 'api' | 'csv' }) {
  const v = emailStateView(state, source);
  if (!v) return null;
  const tone = v.state === 'spam' ? 'bg-red-50 text-critical-ink border-red-200' : 'bg-amber-50 text-amber-900 border-amber-200';
  return (
    <div role="status" data-testid="email-state" data-state={v.state} className={`mt-1.5 rounded-lg border px-2 py-1.5 text-xs max-w-xs ${tone}`}>
      <div className="font-bold">{v.title}</div>
      <div className="text-ink-900 mt-0.5">{v.body}</div>
      <a href={v.action.href} data-testid="email-state-fix" className="inline-flex items-center min-h-10 font-bold underline">{v.action.text}</a>
    </div>
  );
}
