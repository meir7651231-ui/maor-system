/**
 * עמודת פרנסה׳לע (מודול parnasa — knowledge/BUILD-ORDER-PARNASA-2026-10-12.md) — שלד, אשכול 0.
 *
 * המודול **opt-in** (הכרעה 1): כבוי כשחסר — נדלק רק ב-modules.parnasa === true
 * (העוזר moduleEnabledIn ב-types/config). הלקוח-החי, הדמו וכל ארגון קיים — ביט-זהים.
 * כאן רק מצב-ריק "המודול בבנייה"; נתונים · מנוע · פעולות · ממשק — אשכולות 2–5.
 */
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Empty, PageHead } from '../ui';

export function ParnasaView() {
  const config = useApp((s) => s.config);
  const name = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const listings = termOf(config, 'entity.prListings', 'עסקים');
  return (
    <div>
      <PageHead title={'📒 ' + name} sub={'מדריך ' + listings + ' שכונתי · מה צריך? · לוח קהילה · חוברת'} />
      <Empty>📒 {name} — המודול בבנייה</Empty>
    </div>
  );
}
