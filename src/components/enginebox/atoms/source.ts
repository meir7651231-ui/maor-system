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
import { capabilityId, type AtomCard, type Capability, type EngineCard } from '../../../lib/atoms/contract';
import { ATOM_CARDS } from '../../../lib/atoms/cards';
import { ENGINE_CARDS } from '../../../lib/atoms/engines';
import { sanitizeCapabilities, suggestedChildName, suggestedName } from '../../../lib/atoms/capabilities';
import { chainsFor, previewOf, type Chain } from '../../../lib/atoms/preview';
import { capHostCard, capStatus, childCapability, childId, childrenOf, outputPlaceFor } from '../../../lib/atoms/chain';
import { chainChildParams } from '../../../lib/atoms/chainPreview';
import type { AtomChain, AtomsSource } from './seam';

export interface AtomsDeps {
  db: Partial<Db> | null | undefined;
  config: OrgConfig | null;
  nowMs: number;
  canEdit: boolean;
  /** CHAIN 14.10: מחזיר (אם יש) את ההבטחה של ה-store — "שמור כמנוע" יוצר את הראשון ורק אחריו את הבנוי עליו. */
  create: (c: Capability) => void | Promise<unknown>;
  remove: (id: string) => void;
}

export function atomsSource(deps: AtomsDeps): AtomsSource {
  const caps = sanitizeCapabilities(deps.db?.ui?.capabilities);
  const ctx = { db: deps.db, config: deps.config, nowMs: deps.nowMs, caps };
  const byId = (id: string) => caps.find((c) => c.id === id) ?? null;
  const nameOf = (c: Capability): string => {
    const parent = c.parent ? byId(c.parent) : null;
    return parent ? suggestedChildName(parent, c.atom) : suggestedName(c.place, c.atom);
  };
  /** CHAIN 14.10: שרשרת מוצעת ⇒ הראשון (קיים או חדש) + המנוע שבנוי עליו (המקום = פלט שמתאים לחלק השני). */
  const plan = (ch: Chain): { parent: Capability; child: Capability } | null => {
    const [a, b] = ch.steps;
    if (!a || !b) return null;
    const id0 = capabilityId(ch.engine, a.place, a.atom);
    const parent = byId(id0) ?? { id: id0, engine: ch.engine, place: a.place, atom: a.atom, params: {}, name: suggestedName(a.place, a.atom) };
    const place = outputPlaceFor(parent, b.atom);
    if (!place) return null;
    return { parent, child: childCapability(parent, place.id, b.atom, chainChildParams(ch.id, caps), suggestedChildName(parent, b.atom)) };
  };
  return {
    engines: (): EngineCard[] => [...ENGINE_CARDS],
    atoms: (): AtomCard[] => [...ATOM_CARDS],
    capabilities: () => caps,
    preview: (c) => previewOf(c, ctx),
    chains: (engineId): AtomChain[] =>
      chainsFor(engineId, ctx, caps).map((ch) => {
        const p = plan(ch);
        const saved = p && byId(childId(p.parent.id, p.child.atom));
        return { atoms: [ch.steps[0].atom, ch.steps[1].atom], name: ch.name, result: ch.explain, lines: ch.lines, canSave: !!p, savedId: saved ? saved.id : undefined };
      }),
    create: (c) => {
      if (deps.canEdit) return deps.create({ ...c, name: nameOf(c) });
    },
    remove: (id) => {
      if (deps.canEdit) deps.remove(id);
    },
    canEdit: deps.canEdit,
    capHost: (id) => {
      const c = byId(id);
      return c ? capHostCard(c, caps) : null;
    },
    capState: (id) => {
      const c = byId(id);
      return c ? capStatus(c, caps) : 'bad';
    },
    blockedBy: (id) => childrenOf(id, caps).map((c) => c.name),
    saveChain: (engineId, index) => {
      const ch = chainsFor(engineId, ctx, caps)[index];
      const p = ch && deps.canEdit ? plan(ch) : null;
      if (!p) return null;
      if (byId(p.child.id)) return p.child.id;
      const first = byId(p.parent.id) ? undefined : deps.create(p.parent);
      void Promise.resolve(first).then(() => deps.create(p.child));
      return p.child.id;
    },
  };
}
