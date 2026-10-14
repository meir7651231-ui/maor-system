/**
 * 🧬 מנועים וחלקים — המקור האמיתי של המסך (ATOMS, 14.10.2026): `AtomsSource` מעל הכרטיסים, היכולות השמורות והתצוגות.
 *
 * engines/atoms = ENGINE_CARDS/ATOM_CARDS (לא עותק) · capabilities = `db.ui.capabilities` מחוטא מול הכרטיסים ·
 * preview = `previewOf` על נתוני-הארגון ("עכשיו" מוזרק מהכניסה) · chains = `chainsFor` עם השורות המחושבות ·
 * create/remove = פעולות-ה-store (אימות · הרשאה · שורת-לוג שם). השם של המנוע החדש נקבע כאן לפי מזהה-המקום האמיתי
 * (`suggestedName` — "מנוע תורים"), לא לפי מילים בשם-המקום.
 * נטען ב-import() מתוך EngineBoxEntry (chunk משלו) — הבנדל-הראשי לא מכיר את הקובץ, את הכרטיסים או את התצוגות.
 */
import type { Db } from '../../../types/domain';
import type { OrgConfig } from '../../../types/config';
import type { AtomCard, Capability, EngineCard } from '../../../lib/atoms/contract';
import { ATOM_CARDS } from '../../../lib/atoms/cards';
import { ENGINE_CARDS } from '../../../lib/atoms/engines';
import { sanitizeCapabilities, suggestedName } from '../../../lib/atoms/capabilities';
import { chainsFor, previewOf } from '../../../lib/atoms/preview';
import type { AtomChain, AtomsSource } from './seam';

export interface AtomsDeps {
  db: Partial<Db> | null | undefined;
  config: OrgConfig | null;
  nowMs: number;
  canEdit: boolean;
  create: (c: Capability) => void;
  remove: (id: string) => void;
}

export function atomsSource(deps: AtomsDeps): AtomsSource {
  const caps = sanitizeCapabilities(deps.db?.ui?.capabilities);
  const ctx = { db: deps.db, config: deps.config, nowMs: deps.nowMs };
  return {
    engines: (): EngineCard[] => [...ENGINE_CARDS],
    atoms: (): AtomCard[] => [...ATOM_CARDS],
    capabilities: () => caps,
    preview: (c) => previewOf(c, ctx),
    chains: (engineId): AtomChain[] =>
      chainsFor(engineId, ctx, caps).map((ch) => ({ atoms: [ch.steps[0].atom, ch.steps[1].atom], name: ch.name, result: ch.explain, lines: ch.lines })),
    create: (c) => {
      if (deps.canEdit) deps.create({ ...c, name: suggestedName(c.place, c.atom) });
    },
    remove: (id) => {
      if (deps.canEdit) deps.remove(id);
    },
    canEdit: deps.canEdit,
  };
}
