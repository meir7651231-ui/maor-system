/**
 * 🧩 ארגז המנועים — הכניסה האמיתית (ENGINEBOX-B 13.10): בונה את המקור מהליבה (source.ts) מעל ה-store ומרנדר את המסך.
 * נטען lazy מ-App (chunk משלו) — הקטלוג והמתאים לא נכנסים לבנדל-הראשי.
 * "חבר"/"נתק" ⇒ linkEngine/unlinkEngine (אימות מול הקטלוג · הרשאה · שורת-לוג); המקור נבנה מחדש כש-db.ui.engineLinks משתנה.
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { canEditEngineLinks } from '../../lib/config';
import { EngineBoxScreen } from './EngineBoxScreen';
import { engineBoxSource } from './source';

export function EngineBoxEntry(props: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const links = useApp((s) => s.db.ui.engineLinks);
  const email = useApp((s) => s.cloud.user?.email);
  const linkEngine = useApp((s) => s.linkEngine);
  const unlinkEngine = useApp((s) => s.unlinkEngine);
  const toast = useApp((s) => s.toast);
  const source = useMemo(
    () =>
      engineBoxSource({
        config,
        links,
        canEdit: canEditEngineLinks(config, email),
        connect: (key) => void linkEngine(key).then((ok) => ok && toast('🔌 המנוע חובר ✓')),
        disconnect: (key) => void unlinkEngine(key).then((ok) => ok && toast('המנוע נותק')),
      }),
    [config, links, email, linkEngine, unlinkEngine, toast],
  );
  return <EngineBoxScreen source={source} onClose={props.onClose} />;
}
