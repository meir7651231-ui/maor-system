/**
 * 🔌 המרכזייה במסך (BUILD-ORDER-SWITCHBOARD-2026-10-13) — דבק-React, רק למסכים העצלים (אירוח · פרנסה׳לע).
 *
 * `useSwitchCtx(nowMs, ids)` טוען בעצלות את ספקי היכולות `ids` **שזמינות בקונפיג** (loadProviders — רק כלי דלוק, רק מה
 * שנחוץ), ומחזיר ctx טרי ל-`ask`/`todaySummary`. ה-db נצפה **רק** במפתחות שהספקים הצהירו (`REGISTRY.reads`) — אותו מנוע
 * כמו useDbWatch (useSyncExternalStore + השוואה על מפתחות-הצפייה), כך שהמסך לא מתרנדר על כל כתיבה במסך אחר.
 * ספק שנטען ⇒ ctx חדש ⇒ הצרכן שואל שוב. ids ריק / אף יכולת לא זמינה ⇒ אין טעינה ואין צפייה נוספת ⇒ המסך ביט-זהה.
 */
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useApp } from '../../store/useApp';
import { loadProviders, readsFor, subscribeSwitchboard, switchboardVersion, type AbilityId } from '../../lib/switchboard/registry';
import type { SwitchCtx } from '../../lib/switchboard/contract';
import type { Db } from '../../types/domain';

/** רשימת-יכולות ריקה (יציבה) — "המסך לא צריך את המרכזייה כרגע". */
export const NO_ABILITIES: readonly AbilityId[] = [];

/** ה-db, מתחדש רק כשמפתח-צפייה השתנה (או כשרשימת-הצפייה עצמה השתנתה). */
function useWatchedDb(keys: readonly (keyof Db)[]): Db {
  const keysRef = useRef(keys);
  const keysKey = keys.join('|');
  const lastKeysKey = useRef(keysKey);
  const cache = useRef<Db | null>(null);
  keysRef.current = keys;
  if (lastKeysKey.current !== keysKey) {
    lastKeysKey.current = keysKey;
    cache.current = null;
  }
  const getSnapshot = useCallback(() => {
    const cur = useApp.getState().db;
    const prev = cache.current;
    if (prev === null || prev === cur) {
      cache.current = cur;
      return cur;
    }
    if (keysRef.current.some((k) => !Object.is(prev[k], cur[k]))) cache.current = cur;
    return cache.current ?? cur;
  }, []);
  const subscribe = useCallback((cb: () => void) => useApp.subscribe(cb), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useSwitchCtx(nowMs: number, ids: readonly AbilityId[]): SwitchCtx {
  const config = useApp((s) => s.config);
  const idsKey = ids.join('|');
  const keys = useMemo(() => readsFor(config, idsKey ? idsKey.split('|') : []), [config, idsKey]);
  const ver = useSyncExternalStore(subscribeSwitchboard, switchboardVersion, switchboardVersion);
  useEffect(() => {
    // loadProviders מסנן בעצמו לזמינות ⇒ ids שאף אחת מהן לא זמינה = אפס טעינה. (לא keys.length: ספק-ליבה כמו הלוח העברי
    // לא קורא מה-db — reads ריק — ועדיין צריך להיטען.)
    if (idsKey) void loadProviders(config, idsKey.split('|'));
  }, [config, idsKey]);
  const db = useWatchedDb(keys);
  return useMemo((): SwitchCtx => {
    void ver; // ספק שנטען/נכשל ⇒ ctx חדש ⇒ הצרכנים שואלים שוב
    return { db, config, nowMs };
  }, [db, config, nowMs, ver]);
}
