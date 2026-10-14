/**
 * 🧬 ארגז המנועים · לשונית "מנועים וחלקים" (ATOMS-SCREEN 14.10.2026).
 *
 * חזון-הבעלים: לא מחברים מוצרים גמורים — מפרקים מנועים. כל מנוע גדול בנוי מחלקים קטנים
 * ("חלק לשווים", "מיזוג רצפים"); חלק לא יודע למה משתמשים בו. יש לך מנוע ⇒ בוחרים חלק ⇒
 * הוא שואל שאלה אחת ומציע רק מה שבמנוע שלך מהסוג שלו, עם התוצאה ⇒ פרטים ⇒ "חבר" ⇒ מנוע חדש.
 *
 * מדבר רק עם התפר (`AtomsSource`, ./seam). ההתאמה = `optionsFor` של החוזה (לא משוכפלת כאן).
 * source=null ⇒ מצב-ריק כן. canEdit=false ⇒ צפייה בלבד, בלי "חבר"/"הסר".
 */
import { useEffect, useRef, useState } from 'react';
import { optionsFor } from '../../../lib/atoms/contract';
import type { AtomsSource } from './seam';
import { buildCapability, buildChildCapability, connectCapability, detailDefaults, removeTap, type DetailValues } from './naming';
import {
  ATOMS_EMPTY_TEXT,
  AtomGrid,
  AtomsHeader,
  ChainsList,
  CreatedCard,
  CreatedList,
  DetailsStep,
  MAX_GEN_TEXT,
  NOTHING_FITS_TEXT,
  blockedText,
  EnginesStep,
  HostStep,
  QuestionStep,
} from './AtomSteps';
import { GoalCard } from './GoalCard';
import './atoms.css';

export type AtomsStep = 'engines' | 'atom' | 'question' | 'details' | 'made';

export interface AtomsInitial { host?: string; atom?: string; place?: string; open?: string; made?: string }

const ARM_MS = 3500;

export function AtomsBody(props: { source: AtomsSource | null; initial?: AtomsInitial }) {
  const { source } = props;
  const ini = props.initial;
  const [open, setOpen] = useState<string | null>(ini?.open ?? null);
  const [hostId, setHostId] = useState<string | null>(ini?.host ?? null);
  const [atomId, setAtomId] = useState<string | null>(ini?.atom ?? null);
  const [placeId, setPlaceId] = useState<string | null>(ini?.place ?? null);
  const [values, setValues] = useState<DetailValues | null>(null);
  const [madeId, setMadeId] = useState<string | null>(ini?.made ?? null);
  const [armed, setArmed] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ id: string; text: string } | null>(null);
  // מונה-רענון: create/remove משנים את המקור מחוץ ל-React
  const [, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const engines = source ? source.engines() : [];
  const atoms = source ? source.atoms() : [];
  // CHAIN 14.10: המארח יכול להיות מנוע שנוצר (המזהה שלו) — כרטיס-מנוע שהמקום היחיד בו הוא הפלט שלו
  const baseHost = engines.find((e) => e.id === hostId) ?? null;
  const capHost = !baseHost && hostId && source?.capHost ? source.capHost(hostId) : null;
  const host = baseHost ?? capHost;
  const parentId = capHost ? hostId : null;
  const hostAtoms = capHost ? atoms.filter((a) => optionsFor(a, capHost).length > 0) : atoms;
  const atom = host ? hostAtoms.find((a) => a.id === atomId) ?? null : null;
  const options = host && atom ? optionsFor(atom, host) : [];
  const option = options.find((o) => o.place === placeId) ?? null;
  const caps = source ? source.capabilities() : [];
  const stateOf = (id: string) => (source?.capState ? source.capState(id) : 'ok');
  const createdHosts = source?.capHost
    ? caps.flatMap((c) => {
        const card = source.capHost!(c.id);
        // רק מנוע שיש על מה לבנות (פלט עם חלקים שמתחברים) — אחרת אין כפתור ואין כרטיס ✨
        return card && card.places.length ? [{ id: c.id, card }] : [];
      })
    : [];
  const openable = new Set(createdHosts.map((h) => h.id));
  const made = madeId ? caps.find((c) => c.id === madeId) ?? null : null;
  const step: AtomsStep = made ? 'made' : !host ? 'engines' : !atom ? 'atom' : !option ? 'question' : 'details';

  // פוקוס לכותרת-הצעד בכל מעבר — קורא-מסך שומע איפה הוא
  useEffect(() => {
    if (step !== 'engines') ref.current?.querySelector<HTMLElement>('[tabindex="-1"]')?.focus();
  }, [step]);

  if (!source || (engines.length === 0 && atoms.length === 0)) {
    return <div className="empty at-empty" data-atoms="empty">{ATOMS_EMPTY_TEXT}</div>;
  }

  const reset = () => { setAtomId(null); setPlaceId(null); setValues(null); setMadeId(null); };
  const back = () => {
    if (step === 'made') { setMadeId(null); setAtomId(null); setPlaceId(null); setValues(null); }
    else if (step === 'details') { setPlaceId(null); setValues(null); }
    else if (step === 'question') setAtomId(null);
    else { reset(); setHostId(null); }
  };
  const backLabel = step === 'details' ? 'מקום אחר' : step === 'question' ? 'חלק אחר' : step === 'made' ? 'עוד חלק' : 'מנוע אחר';
  const vals = values ?? (atom ? detailDefaults(atom.details) : {});
  // ATOMS 14.10: התוצאה האמיתית ליד כל אפשרות (עם ברירות-המחדל) ובטופס (עם מה שנבחר) — רק כשהמקור מחשב תצוגות
  const build = (h: typeof host & object, a: typeof atom & object, o: (typeof options)[number], v: DetailValues) =>
    parentId ? buildChildCapability(parentId, h, a, o, v) : buildCapability(h, a, o, v);
  const optionPreviews =
    step === 'question' && host && atom ? Object.fromEntries(options.map((o) => [o.place, source.preview(build(host, atom, o, detailDefaults(atom.details)))])) : undefined;
  const livePreview = step === 'details' && host && atom && option ? source.preview(build(host, atom, option, vals)) : undefined;

  const openHost = (id: string) => { reset(); setBlocked(null); setHostId(id); };
  const saveChain = (index: number) => {
    if (!host || !source.saveChain) return;
    const id = source.saveChain(host.id, index);
    if (id) { setMadeId(id); setTick((t) => t + 1); }
  };
  const connect = () => {
    if (!host || !atom || !option) return;
    const cap = connectCapability(source, host, atom, option, vals, parentId ?? undefined);
    if (!cap) return;
    setMadeId(cap.id);
    setTick((t) => t + 1);
  };
  const onRemoveTap = (id: string) => {
    // CHAIN 14.10: מנוע שיש מנוע שבנוי עליו — לא מוסר; אומרים מה להסיר קודם (בלי הסרה-בשרשרת שקטה)
    const kids = source.blockedBy ? source.blockedBy(id) : [];
    if (kids.length) { setArmed(null); setBlocked({ id, text: blockedText(kids) }); return; }
    setBlocked(null);
    const r = removeTap(armed, id);
    setArmed(r.armed);
    if (timer.current) clearTimeout(timer.current);
    if (r.armed) timer.current = setTimeout(() => setArmed(null), ARM_MS);
    if (r.remove) {
      source.remove(id);
      if (madeId === id) setMadeId(null);
      if (hostId === id) { reset(); setHostId(null); }
      setTick((t) => t + 1);
    }
  };

  return (
    <div ref={ref} className="at-body" data-atoms={step}>
      {host && <AtomsHeader host={host} onBack={back} backLabel={backLabel} />}
      {step === 'engines' && (
        <>
          {source.goal && <GoalCard source={source} />}
          <EnginesStep engines={engines} atoms={atoms} open={open} onToggle={(id) => setOpen((o) => (o === id ? null : id))} />
          <HostStep engines={engines} created={createdHosts} onHost={openHost} />
        </>
      )}
      {step === 'atom' && host && (
        <>
          <AtomGrid
            host={host}
            atoms={hostAtoms}
            engines={engines}
            onAtom={setAtomId}
            emptyText={capHost ? ((hostId ?? '').split('>').length >= 3 ? MAX_GEN_TEXT : NOTHING_FITS_TEXT) : undefined}
          />
          {!capHost && <ChainsList chains={source.chains(host.id)} atoms={atoms} canEdit={source.canEdit} onSave={saveChain} />}
        </>
      )}
      {step === 'question' && atom && <QuestionStep atom={atom} options={options} previews={optionPreviews} onOption={(p) => { setPlaceId(p); setValues(detailDefaults(atom.details)); }} />}
      {step === 'details' && atom && option && (
        <DetailsStep
          atom={atom}
          option={option}
          values={vals}
          canEdit={source.canEdit}
          onValue={(id, v) => setValues({ ...vals, [id]: v })}
          onConnect={connect}
          preview={livePreview}
        />
      )}
      {step === 'made' && made && <CreatedCard capability={made} preview={source.preview(made)} />}
      <CreatedList
        capabilities={caps}
        engines={engines}
        canEdit={source.canEdit}
        armed={armed}
        onRemoveTap={onRemoveTap}
        onOpen={source.capHost ? openHost : undefined}
        canOpen={(id) => openable.has(id)}
        stateOf={stateOf}
        blocked={blocked}
      />
    </div>
  );
}
