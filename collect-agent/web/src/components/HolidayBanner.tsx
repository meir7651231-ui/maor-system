import { useApp } from '../store.tsx';
import { holidayNotice } from '../lib/holidays.ts';
import { fmtDate } from '../lib/format.ts';

/** באנר פקיעת לוח החגים. where='dashboard' ⇒ קישור לפרטים בהגדרות; where='settings' ⇒ הסעיף עצמו (עוגן holidays).
 *  צבעים: טקסט ink-900/*-ink על amber-50/red-50 — ≥4.5:1 (tests/contrast.check.ts). */
export function HolidayBanner({ where }: { where: 'dashboard' | 'settings' }) {
  const { sendWindow, today } = useApp();
  const n = holidayNotice(sendWindow, today);
  if (!n) return null;
  const expired = n.level === 'expired';
  const box = expired ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50';
  const title = expired ? 'text-critical-ink' : 'text-due-ink';
  return (
    <div role={expired ? 'alert' : 'status'} id={where === 'settings' ? 'holidays' : undefined}
      data-testid={`holiday-banner-${where}`} data-level={n.level}
      className={`rounded-2xl border ${box} text-ink-900 p-4 flex flex-wrap items-start gap-3`}>
      <span aria-hidden className="text-xl">{expired ? '⛔' : '📅'}</span>
      <div className="flex-1 min-w-0 space-y-1">
        <p className={`font-extrabold ${title}`}>
          {expired ? <>לוח החגים פג ב-<span className="num">{fmtDate(n.until)}</span> — גבי לא שולחת תזכורות</>
            : <>לוח החגים בתוקף עד <span className="num">{fmtDate(n.until)}</span> (עוד <span className="num">{n.daysLeft}</span> ימים)</>}
        </p>
        <p className="text-sm">
          {expired ? 'בלי לוח חגים מעודכן גבי לא יודעת מתי חג, ולכן עוצרת את כל השליחות עד העדכון.'
            : 'אחרי התאריך הזה גבי תעצור את כל השליחות עד שהלוח יתעדכן — כדי לא לשלוח תזכורת בחג.'}
          {where === 'settings' && ' העדכון מגיע בעדכון גרסה של גבי; אין צורך להזין חגים ידנית.'}
        </p>
      </div>
      {where === 'dashboard' && <a href="#/settings?s=holidays" className="inline-flex items-center min-h-10 font-bold underline whitespace-nowrap w-full sm:w-auto ps-9 sm:ps-0" data-testid="holiday-banner-link">לפרטים ועדכון ←</a>}
    </div>
  );
}
