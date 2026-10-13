/**
 * 🧩 ארגז המנועים — המתאם (ENGINEBOX-B 13.10): התפר של המסך (`EngineBoxSource`, ./types) מעל הליבה האמיתית
 * (`src/lib/enginebox/` — קטלוג · מתאים · חיבורים).
 *
 *   · products() — המוצרים שלפחות חלק אחד שלהם בארגז של הארגון, רק עם החלקים שבארגז.
 *   · parts()    — הארגז (catalogFor — המודול והדגל דלוקים).
 *   · options/future(start, picked) — connectOptions/futureOptions; `start` = מזהה-מוצר **או** מזהה-חלק בודד.
 *   · linkedCount(start) — החיבורים שבתוקף (חסר ⇒ ברירת-המחדל) שנוגעים בחלקי-ההתחלה ושני צדדיהם בארגז.
 *   · connect/disconnect — מועברים כמות-שהם (ה-store: linkEngine/unlinkEngine — אימות, הרשאה ולוג שם).
 * המפתחות = `linkKey` של הליבה (נותן>מחבר>מקבל) — יציבים וייחודיים. טהור: בלי React/store/DOM — הכול בהזרקה.
 * נטען רק מתוך ה-chunk העצל של הארגז (EngineBoxEntry) — הבנדל-הראשי לא מייבא את הקטלוג או את המתאים.
 */
import type { OrgConfig } from '../../types/config';
import { catalogFor, connectOptions, futureOptions, type ConnectOption, type FutureOption } from '../../lib/enginebox/match';
import { PRODUCTS, partById, productById, type Part } from '../../lib/enginebox/parts';
import { effectiveLinks, parseLink } from '../../lib/enginebox/links';
import type { BoxFuture, BoxOption, BoxPart, BoxProduct, EngineBoxSource } from './types';

export interface EngineBoxDeps {
  readonly config: OrgConfig;
  /** `db.ui.engineLinks` (חסר ⇒ ברירת-המחדל). */
  readonly links: readonly string[] | undefined;
  readonly canEdit: boolean;
  connect(key: string): void;
  disconnect(key: string): void;
}

/** חלק בארגז ⇒ כרטיס-התפר. */
export function boxPart(p: Part): BoxPart {
  return { id: p.id, name: p.name, emoji: p.emoji, from: p.from, what: p.what };
}

const ghost = (id: string, name: string): BoxPart => {
  const p = partById(id);
  return p ? boxPart(p) : { id, name, emoji: '🧩', from: '', what: '' };
};

function toOption(o: ConnectOption): BoxOption {
  return { key: o.key, giver: ghost(o.giver, o.giverName), needer: ghost(o.needer, o.neederName), plugLabel: o.plugLabel, result: o.result, side: o.side, linked: o.linked };
}

function toFuture(o: FutureOption): BoxFuture {
  return { giver: ghost(o.giver, o.giverName), needer: ghost(o.needer, o.neederName), plugLabel: o.plugLabel, result: o.result };
}

export function engineBoxSource(deps: EngineBoxDeps): EngineBoxSource {
  const { config, links } = deps;
  const catalog = catalogFor(config);
  const inBox = new Set(catalog.map((p) => p.id));

  /** חלקי-ההתחלה שבארגז (מוצר ⇒ חלקיו; חלק ⇒ הוא עצמו). */
  const startParts = (start: string): string[] => {
    const product = productById(start);
    const ids = product ? product.parts : partById(start) ? [start] : [];
    return ids.filter((id) => inBox.has(id));
  };

  return {
    canEdit: deps.canEdit,
    products(): BoxProduct[] {
      const out: BoxProduct[] = [];
      for (const pr of PRODUCTS) {
        const parts = pr.parts.filter((id) => inBox.has(id)).map((id) => boxPart(partById(id)!));
        if (parts.length) out.push({ id: pr.id, name: pr.name, emoji: pr.emoji, parts });
      }
      return out;
    },
    parts(): BoxPart[] {
      return catalog.map(boxPart);
    },
    options(start, picked) {
      return connectOptions({ start, picked, stored: links, config }).map(toOption);
    },
    future(start, picked) {
      return futureOptions({ start, picked, stored: links, config }).map(toFuture);
    },
    linkedCount(start) {
      const mine = new Set(startParts(start));
      if (!mine.size) return 0;
      let n = 0;
      for (const k of effectiveLinks(links)) {
        const l = parseLink(k);
        if (l && inBox.has(l.giver) && inBox.has(l.needer) && (mine.has(l.giver) || mine.has(l.needer))) n++;
      }
      return n;
    },
    connect(key) {
      if (deps.canEdit) deps.connect(key);
    },
    disconnect(key) {
      if (deps.canEdit) deps.disconnect(key);
    },
  };
}
