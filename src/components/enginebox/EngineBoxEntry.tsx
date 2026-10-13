/**
 * 🧩 ארגז המנועים — הכניסה האמיתית (ENGINEBOX-B 13.10): בונה את המקור מהליבה (source.ts) מעל ה-store ומרנדר את המסך.
 * נטען lazy מ-App (chunk משלו) — הקטלוג והמתאים לא נכנסים לבנדל-הראשי.
 * "חבר"/"נתק" ⇒ linkEngine/unlinkEngine (אימות מול הקטלוג · הרשאה · שורת-לוג); המקור נבנה מחדש כש-db.ui.engineLinks משתנה.
 *
 * FINAL 13.10 — שני הרעיונות הקיצוניים של הבעלים:
 *   · 🎯 "להתחיל מהסוף": המתאם (`goal/routeAdapter` + מנוע-המסלול) נטען ב-import() **מתוך** ה-chunk הזה (chunk שלישי);
 *     "חבר את כל הדרך" ⇒ linkEngine לכל מפתח לפי הסדר + טוסט אחד; "בקשו מהמחולל" ⇒ שורת-לוג כנה (logAccess) + טוסט.
 *   · 📊 "מה היה קורה בחודש האחרון": impactOf על נתוני-הארגון, `nowMs` נלקח כאן (קצה-ה-UI) פעם אחת בפתיחה, ה-ask של
 *     המרכזייה עם הספקים הנחוצים (useSwitchCtx ⇒ loadProviders — רק כלים דלוקים). נקרא רק לאפשרויות של המנוע שנבחר.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { canEditEngineLinks } from '../../lib/config';
import { ask, type AbilityId } from '../../lib/switchboard/registry';
import { impactOf } from '../../lib/enginebox/impact';
import { useSwitchCtx } from '../switchboard/useSwitchCtx';
import { EngineBoxScreen } from './EngineBoxScreen';
import { applyRouteKeys, applyRouteToast, engineBoxSource, engineRequestLine, type EngineBoxDeps } from './source';
import type { BoxImpact } from './types';

/** היכולות שמדדי-ההשפעה שואלים (impact/index.ts) — loadProviders מסנן לזמינות בקונפיג. */
const IMPACT_ABILITIES: readonly AbilityId[] = ['parnasa.shabbat', 'parnasa.minyanim', 'parnasa.findPro', 'parnasa.emergency', 'hosting.availability'];

export const REQUEST_ACT = 'בקשה למנוע חדש';
export const REQUEST_TOAST = 'הבקשה נרשמה בלוג הפעולות';

export function EngineBoxEntry(props: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  // מנוי-מלא רשום (db-watch FULL_SUB_CAP): db שלם מוזן למנוע-ההשפעה ולספקי-המרכזייה; רק בזמן שהמודאל פתוח
  const db = useApp((s) => s.db);
  const links = db.ui.engineLinks;
  const email = useApp((s) => s.cloud.user?.email);
  const linkEngine = useApp((s) => s.linkEngine);
  const unlinkEngine = useApp((s) => s.unlinkEngine);
  const logAccess = useApp((s) => s.logAccess);
  const toast = useApp((s) => s.toast);
  // הרגע — פעם אחת בפתיחת-הארגז (קצה-ה-UI; המנוע עצמו טהור)
  const [nowMs] = useState(() => Date.now());
  const sw = useSwitchCtx(nowMs, IMPACT_ABILITIES);
  const [goalFn, setGoalFn] = useState<EngineBoxDeps['goalRoutes']>(null);

  useEffect(() => {
    let alive = true;
    import('../../lib/enginebox/goal/routeAdapter')
      .then((m) => alive && setGoalFn(() => m.goalRoutes))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const source = useMemo(
    () =>
      engineBoxSource({
        config,
        links,
        canEdit: canEditEngineLinks(config, email),
        connect: (key) => void linkEngine(key).then((ok) => ok && toast('🔌 המנוע חובר ✓')),
        disconnect: (key) => void unlinkEngine(key).then((ok) => ok && toast('המנוע נותק')),
        impact: (key): BoxImpact | null => {
          void sw; // ספק שנטען ⇒ sw חדש ⇒ המקור נבנה מחדש ⇒ השורה מתעדכנת
          const im = impactOf(key, { db, config, nowMs, ask });
          return im ? { headline: im.headline, count: im.count, examples: im.examples } : null;
        },
        goalRoutes: goalFn,
        applyRoute: (keys) => void applyRouteKeys(keys, linkEngine).then((n) => toast(applyRouteToast(n))),
        requestEngine: (plug, text) => {
          logAccess(REQUEST_ACT, engineRequestLine(plug, text));
          toast(REQUEST_TOAST);
        },
      }),
    [config, links, db, email, linkEngine, unlinkEngine, logAccess, toast, sw, nowMs, goalFn],
  );
  return <EngineBoxScreen source={source} onClose={props.onClose} />;
}
