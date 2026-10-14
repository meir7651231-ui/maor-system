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
 *
 * ATOMS 14.10 — 🧬 "מנועים וחלקים" (לשונית-הפתיחה): המקור האמיתי (`atoms/source.ts` — הכרטיסים, החלקים, התצוגות) נטען ב-import()
 *   מתוך ה-chunk הזה (chunk משלו); עד שנטען ⇒ `null` (מצב-ריק כן). "חבר"/"הסר" ⇒ createCapability/removeCapability
 *   (אימות מול הכרטיסים · אותה הרשאה · שורת-לוג). התצוגות מחושבות על db של הארגון עם אותו `nowMs`.
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
import type { AtomsSource } from './atoms/seam';
import type { AtomsDeps } from './atoms/source';

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
  const createCapability = useApp((s) => s.createCapability);
  const removeCapability = useApp((s) => s.removeCapability);
  const logAccess = useApp((s) => s.logAccess);
  const toast = useApp((s) => s.toast);
  // הרגע — פעם אחת בפתיחת-הארגז (קצה-ה-UI; המנוע עצמו טהור)
  const [nowMs] = useState(() => Date.now());
  const sw = useSwitchCtx(nowMs, IMPACT_ABILITIES);
  const [goalFn, setGoalFn] = useState<EngineBoxDeps['goalRoutes']>(null);
  const [atomsFn, setAtomsFn] = useState<((d: AtomsDeps) => AtomsSource) | null>(null);

  useEffect(() => {
    let alive = true;
    import('../../lib/enginebox/goal/routeAdapter')
      .then((m) => alive && setGoalFn(() => m.goalRoutes))
      .catch(() => undefined);
    import('./atoms/source')
      .then((m) => alive && setAtomsFn(() => m.atomsSource))
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
  // ATOMS 14.10: לשונית "🧬 מנועים וחלקים" — המקור האמיתי (כרטיסי-המנועים והחלקים) מחובר בסשן הסופי; עד אז מצב-ריק כן
  const canEdit = canEditEngineLinks(config, email);
  const atoms = useMemo(
    () =>
      atomsFn
        ? atomsFn({
            db,
            config,
            nowMs,
            canEdit,
            create: (c) => createCapability(c).then((ok) => ok && toast('✨ נוצר מנוע חדש')),
            remove: (id) => void removeCapability(id).then((ok) => ok && toast('המנוע הוסר')),
          })
        : null,
    [atomsFn, db, config, nowMs, canEdit, createCapability, removeCapability, toast],
  );
  return <EngineBoxScreen source={source} atoms={atoms} onClose={props.onClose} />;
}
