/**
 * 📒 פרנסה׳לע — hooks משותפים למסכי-המודול (אשכול 5): הרשאות-הגבאי, שעון-הקהילה המתקתק (אזור-
 * הזמן של הקהילה — לא שעון-המכשיר) ושם-המותג. מנויים צרים בלבד (לא מנוי-DB-מלא — ratchet db-watch).
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { prCan } from './transitions';
import { clockAt, makeClosureFn, resolveZmanimLoc, type PrClock, type PrClosureFn, type PrZmanimLoc } from './zmanimBoard';

/** הרשאות-גבאי של המשתמש הנוכחי — אותו prCan שה-store אוכף (מקור-אמת אחד). */
export function usePrPerms(): { canApprove: boolean; canDelete: boolean } {
  const config = useApp((s) => s.config);
  const email = useApp((s) => s.cloud.user?.email);
  const isMgr = useApp((s) => s.cloud.isManager) === true;
  return {
    canApprove: prCan(config, email, isMgr, 'parnasa.approve'),
    canDelete: prCan(config, email, isMgr, 'parnasa.delete'),
  };
}

/** "עכשיו" של המסך — מתעדכן כל דקה (פתוח-עכשיו, המניין הבא, חלונות-הניתוב). */
export function useNowMs(stepMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

/** שעון-הקהילה: הרגע + המיקום + שעון-הקיר באזור-הזמן + פונקציית-סגירת שבת/יו״ט. */
export interface PrNow {
  nowMs: number;
  loc: PrZmanimLoc;
  clock: PrClock;
  todayIso: string;
  closureAt: PrClosureFn;
}

export function usePrNow(stepMs = 60_000): PrNow {
  const nowMs = useNowMs(stepMs);
  const z = useApp((s) => s.db.ui.parnasa?.zmanim);
  const loc = useMemo(() => resolveZmanimLoc(z), [z]);
  const closureAt = useMemo(() => makeClosureFn(loc), [loc]);
  const clock = useMemo(() => clockAt(nowMs, loc.tz), [nowMs, loc]);
  return useMemo(() => ({ nowMs, loc, clock, todayIso: clock.iso, closureAt }), [nowMs, loc, clock, closureAt]);
}

/** שם-המותג להודעות (brandOf במקור): "פרנסה׳לע של {קהילה}" כשהוגדר שם-קהילה. */
export function usePrBrand(): string {
  const config = useApp((s) => s.config);
  const community = useApp((s) => s.db.ui.parnasa?.communityName);
  const name = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const c = (community ?? '').trim();
  return c ? name + ' של ' + c : name;
}
