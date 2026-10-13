/**
 * עמודת "אירוח משפחתי" (מודול hosting — knowledge/BUILD-ORDER-HOSTING-2026-10-12.md) — שלד, אשכול 0.
 *
 * המודול **opt-in** (הכרעה 1): כבוי כשחסר — נדלק רק ב-modules.hosting === true
 * (העוזר moduleEnabledIn ב-types/config). הלקוח-החי, הדמו וכל ארגון קיים — ביט-זהים.
 * כאן רק מצב-ריק "המודול בבנייה"; נתונים · מנוע · פעולות · ממשק — אשכולות 2–5.
 */
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Empty, PageHead } from '../ui';
import { installHostingActions } from './actions';

// פעולות-המודול נטענות עם הצ'אנק הזה ("שוקל רק מה שהדלקת") — מותקנות ב-store לפני הרינדור הראשון
installHostingActions();

export function HostingView() {
  const config = useApp((s) => s.config);
  const name = termOf(config, 'nav.hosting', 'אירוח משפחתי');
  const units = termOf(config, 'entity.hostUnits', 'יחידות');
  return (
    <div>
      <PageHead title={'🏡 ' + name} sub={'הזמנות · ' + units + ' · ניקיון · מטבח · שבת · תחזוקה · דוחות'} />
      <Empty>🏡 {name} — המודול בבנייה</Empty>
    </div>
  );
}
