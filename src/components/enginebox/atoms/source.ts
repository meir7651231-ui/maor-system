/**
 * 🧬 מנועים וחלקים — המקור האמיתי של המסך (ATOMS, 14.10.2026): `AtomsSource` מעל הכרטיסים, היכולות השמורות והתצוגות.
 *
 * engines/atoms = ENGINE_CARDS/ATOM_CARDS (לא עותק) · capabilities = `db.ui.capabilities` מחוטא מול הכרטיסים ·
 * preview = `previewOf` על נתוני-הארגון ("עכשיו" מוזרק מהכניסה) · chains = `chainsFor` עם השורות המחושבות ·
 * create/remove = פעולות-ה-store (אימות · הרשאה · שורת-לוג שם). השם של המנוע החדש נקבע כאן לפי מזהה-המקום האמיתי
 * (`suggestedName` — "מנוע תורים"), לא לפי מילים בשם-המקום.
 * נטען ב-import() מתוך EngineBoxEntry (chunk משלו) — הבנדל-הראשי לא מכיר את הקובץ, את הכרטיסים או את התצוגות.
 *
 * 🏭 FACTORY 14.10: הארגז מציג **רק מה שהמפעל אימת** (`engines/generated/verified.ts`, נכתב ע״י `npm run atoms:factory`) —
 * באפשרויות של כל שאלה, בהרכבה ("להתחיל מהסוף") ובשרשראות. המנועים שנמצאו אוטומטית (המפרק) נטענים מנוע-מנוע
 * (`GENERATED_LOADERS`, `loadFound`) ומוצגים בקבוצה "מנועים שנמצאו אוטומטית" (`found`), כל אפשרות עם "✅ מאומת" (`verified`).
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
import { answerGoal, type GoalPick } from '../../../lib/atoms/goal';
import { generatedCards, genEngine, registerGenerated } from '../../../lib/atoms/engines/registry';
import { GENERATED_LOADERS } from '../../../lib/atoms/engines/generated/lazy';
import { VERIFIED, VERIFIED_ENGINES } from '../../../lib/atoms/engines/generated/verified';
import type { AtomChain, AtomsSource, GoalPickView, GoalView } from './seam';

export interface AtomsDeps {
  db: Partial<Db> | null | undefined;
  config: OrgConfig | null;
  nowMs: number;
  canEdit: boolean;
  /** CHAIN 14.10: מחזיר (אם יש) את ההבטחה של ה-store — "שמור כמנוע" יוצר את הראשון ורק אחריו את הבנוי עליו. */
  create: (c: Capability) => void | Promise<unknown>;
  remove: (id: string) => void;
  /** FACTORY 14.10 (תוספתי): מצב-צנעה (store.privacyMode) ⇒ מקומות של משפחות ומקבלי-סיוע לא מוצגים. */
  privacyMode?: boolean;
}

/** FACTORY 14.10: טוען ורושם את המנועים שנמצאו אוטומטית ויש להם חיבור מאומת — כל אחד ב-chunk משלו. כשל ⇒ בלי הקבוצה. */
export async function loadFound(): Promise<void> {
  const want = VERIFIED_ENGINES.filter((id) => !genEngine(id) && GENERATED_LOADERS[id]);
  const got = await Promise.all(want.map((id) => GENERATED_LOADERS[id]().catch(() => null)));
  registerGenerated(got.filter((g): g is NonNullable<typeof g> => !!g));
}

/** המפתח של המפעל למנוע/אפשרות: שרשרת ⇒ המזהה עצמו; ישיר "<מנוע>:<מקום>:<חלק>" ⇒ "<מקום>:<חלק>". */
export function verifiedKey(capId: string): string {
  if (capId.includes('>')) return capId;
  const seg = capId.split(':');
  return seg.length === 3 ? seg[1] + ':' + seg[2] : capId;
}
const checksOf = (key: string): number => (Object.prototype.hasOwnProperty.call(VERIFIED, key) ? VERIFIED[key] : 0);

/** כרטיס עם רק האפשרויות שאומתו (מקום בלי אף חלק מאומת — יורד). */
export function verifiedCard(card: EngineCard, keyOf: (place: string, atom: string) => string = (p, a) => p + ':' + a): EngineCard {
  const places = card.places
    .map((p) => ({ ...p, results: Object.fromEntries(Object.entries(p.results).filter(([a]) => checksOf(keyOf(p.id, a)) > 0)) }))
    .filter((p) => Object.keys(p.results).length > 0);
  return { ...card, places };
}

/** הכלי שבו המנוע שנמצא חי (במקום נתיב-הקוד של המפרק) — שפת הלקוח, כמו "אירוח משפחתי" בכרטיסי-היד. */
const FOUND_FROM: Readonly<Record<string, string>> = {
  supporters: 'תורמים',
  courses: 'חוגים',
  families: 'משפחות',
  calendar: 'לוח שנה',
  diary: 'יומן חדרים',
  tzedaka: 'קופות צדקה',
  shop: 'חנות',
  shop7: 'חלוקה',
  hosting: 'אירוח משפחתי',
  parnasa: 'פרנסה׳לע',
  platform: 'צוות',
  zmanimBoard: 'פרנסה׳לע',
};

/** מנוע שנמצא אוטומטית במודול שיש לו כבר כרטיס-יד ⇒ שם שאומר שזה "עוד" ולא כפילות. */
const FOUND_NAME: Readonly<Record<string, string>> = {
  hosting: 'עוד במנהל ההזמנות',
  parnasa: 'עוד ב"מה צריך?"',
  zmanimBoard: 'עוד במחשבון הזמנים',
};

export function atomsSource(deps: AtomsDeps): AtomsSource {
  const caps = sanitizeCapabilities(deps.db?.ui?.capabilities);
  const ctx = { db: deps.db, config: deps.config, nowMs: deps.nowMs, caps, privacyMode: deps.privacyMode === true };
  // FACTORY 14.10: רק מה שאומת — כרטיסי-היד וכרטיסי המנועים שנמצאו
  const hand = ENGINE_CARDS.map((c) => verifiedCard(c));
  const found = generatedCards()
    .filter((c) => VERIFIED_ENGINES.includes(c.id))
    .map((c) => {
      const card = verifiedCard({ ...c, name: FOUND_NAME[c.id] ?? c.name, from: FOUND_FROM[c.id] ?? 'נמצא אוטומטית' });
      const checks = card.places.reduce((n, p) => n + Object.keys(p.results).reduce((m, a) => m + checksOf(p.id + ':' + a), 0), 0);
      return { id: c.id, card, verified: { checks } };
    })
    .filter((f) => f.card.places.length > 0);
  const allCards = [...hand, ...found.map((f) => f.card)];
  const allow = (key: string): boolean => checksOf(key) > 0;
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
  // GOAL 14.10: הבחירות מהצ'יפים — רק חלק/מקום כטקסט (המנוע בודק מול הכרטיסים)
  const picksOf = (picks: readonly GoalPickView[]): GoalPick[] =>
    (Array.isArray(picks) ? picks : []).map((p) => ({ atom: typeof p?.atom === 'string' ? (p.atom as GoalPick['atom']) : undefined, place: typeof p?.place === 'string' ? p.place : undefined }));
  const answer = (text: string, picks: readonly GoalPickView[]) => answerGoal(text, picksOf(picks), allCards, ctx, caps, { allow });
  return {
    engines: (): EngineCard[] => [...hand],
    found: () => found,
    verified: (capId) => {
      const n = checksOf(verifiedKey(capId));
      return n > 0 ? { checks: n } : undefined;
    },
    atoms: (): AtomCard[] => [...ATOM_CARDS],
    capabilities: () => caps,
    preview: (c) => previewOf(c, ctx),
    chains: (engineId): AtomChain[] =>
      chainsFor(engineId, ctx, caps).flatMap((ch) => {
        // FACTORY 14.10: רק שרשרת שאומתה (המזהה של המנוע השני)
        if (!allow(capabilityId(ch.engine, ch.steps[0].place, ch.steps[0].atom) + '>' + ch.steps[1].atom)) return [];
        const p = plan(ch);
        const saved = p && byId(childId(p.parent.id, p.child.atom));
        return [{ atoms: [ch.steps[0].atom, ch.steps[1].atom] as [string, string], name: ch.name, result: ch.explain, lines: ch.lines, canSave: !!p, savedId: saved ? saved.id : undefined }];
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
      const card = c ? capHostCard(c, caps) : null;
      // FACTORY 14.10: על מנוע שנוצר — רק חלק שהשרשרת שלו אומתה
      return card ? verifiedCard(card, (_p, a) => childId(id, a)) : null;
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
    goal: (text, picks): GoalView => {
      const a = answer(text, picks);
      return {
        status: a.status,
        results: a.results.map((r) => ({ id: r.id, sentence: r.sentence, title: r.title, lines: r.lines, steps: r.steps.length, saved: r.saved })),
        questions: a.questions.map((q) => ({ text: q.text, chips: q.chips.map((c) => ({ label: c.label, pick: { ...c.pick } })) })),
      };
    },
    connectGoal: (text, picks, resultId) => {
      if (!deps.canEdit) return null;
      const r = answer(text, picks).results.find((x) => x.id === resultId);
      if (!r) return null;
      // לפי הסדר: כל מנוע נוצר רק אחרי שמה שהוא בנוי עליו נשמר (אותו מסלול כמו "שמור כמנוע"); השמות כבר נקבעו בהרכבה
      let done: Promise<unknown> = Promise.resolve();
      for (const c of r.create) done = done.then(() => deps.create(c));
      void done;
      return r.id;
    },
  };
}
