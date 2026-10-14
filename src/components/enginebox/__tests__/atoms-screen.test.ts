/**
 * 🧬 ארגז המנועים · "מנועים וחלקים" (ATOMS-SCREEN 14.10.2026) — המסך מול התפר עם מקור-דוגמה.
 * אידיום-הפרויקט: renderToStaticMarkup לרינדור, והפעלת onClick ישירה על עץ-האלמנטים של רכיבי-הצעדים הטהורים.
 *
 * ננעל:
 *  (א) כרטיסי-המנועים והפירוק (חלקים ממוספרים; חלק שקיים בארגז ⇒ צ׳יפ "בארגז ✂️").
 *  (ב) מנוע-בית + חלק ⇒ השאלה האחת, ורק המקומות המתאימים (סוג + משפט-תוצאה) עם התוצאה, בסדר המקומות — דרך optionsFor של החוזה.
 *  (ג) טופס-הפרטים מציג את ברירות-המחדל; "חבר" ⇒ create עם id מ-capabilityId ו-params מהטופס.
 *  (ד) "הסר" בשתי לחיצות. (ה) שרשראות. (ו) קריאה-בלבד ⇒ אין "חבר"/"הסר". (ז) source=null ⇒ מצב-ריק כן.
 */
import { describe, expect, it } from 'vitest';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Btn } from '../../ui';
import { capabilityId, optionsFor } from '../../../lib/atoms/contract';
import { AtomsBody } from '../atoms/AtomsBody';
import {
  ATOMS_EMPTY_TEXT,
  AtomGrid,
  ChainsList,
  CONNECT_TEXT,
  CreatedList,
  DetailsStep,
  EnginesStep,
  HOST_TITLE,
  NO_PLACE_TEXT,
  PREVIEW_SOON_TEXT,
  QuestionStep,
  REMOVE_ARMED_TEXT,
  REMOVE_TEXT,
} from '../atoms/AtomSteps';
import { buildCapability, capabilityName, cleanParams, connectCapability, detailDefaults, removeTap } from '../atoms/naming';
import { A_DIVIDE, A_MERGE, A_NEXT, atomsFixture, CAP_QUEUE, E_BOOK, E_NEED, E_ZMANIM } from './atoms-fixtures';

const html = (el: ReactElement | null) => (el ? renderToStaticMarkup(el) : '');
const body = (src: ReturnType<typeof atomsFixture> | null, initial?: Parameters<typeof AtomsBody>[0]['initial']) =>
  html(createElement(AtomsBody, { source: src, initial }));

function walk(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) { node.forEach((n) => walk(n, out)); return out; }
  if (!isValidElement(node)) return out;
  out.push(node);
  if (typeof node.type === 'function' && node.type !== Btn) {
    walk((node.type as (p: unknown) => ReactNode)(node.props), out);
    return out;
  }
  walk((node.props as { children?: ReactNode }).children, out);
  return out;
}
const btnText = (tree: ReactNode, text: string) =>
  walk(tree).find((e) => e.type === Btn && (e.props as { children: ReactNode }).children === text) as
    | ReactElement<{ onClick: () => void }>
    | undefined;
const clickAttr = (tree: ReactNode, attr: string, val: string) => {
  const el = walk(tree).find((e) => (e.props as Record<string, unknown>)[attr] === val);
  (el!.props as { onClick: () => void }).onClick();
};

describe('(א) המנועים והפירוק', () => {
  it('כרטיס לכל מנוע: אימוג׳י, שם, צ׳יפ-הכלי ושורת computes', () => {
    const out = body(atomsFixture());
    expect(out).toContain('data-atoms="engines"');
    for (const e of [E_ZMANIM, E_NEED, E_BOOK]) {
      expect(out).toContain(`data-engine="${e.id}"`);
      expect(out).toContain(e.computes);
    }
    expect(out).toContain('אירוח משפחתי');
    // DESIGN 14.10 (מכוון): הכותרת של צעד 1 — "איזה מנוע יש לך?" (היה 'יש לך מנוע · איזה חלק לחבר אליו?'), והמסך הראשון
    // מאוחד — כל מנוע פעם אחת (היה: רשימת "המנועים" + גריד "יש לך מנוע" עם אותם מנועים פעמיים)
    expect(out).toContain(HOST_TITLE);
    for (const e of [E_ZMANIM, E_NEED, E_BOOK]) {
      expect(out.split(`data-host="${e.id}"`).length - 1, e.id).toBe(1);
      expect(out.split(`data-engine="${e.id}"`).length - 1, e.id).toBe(1);
    }
    // מונה 1-2-3, צעד 1 נוכחי
    expect(out).toMatch(/class="at-step at-step-now" aria-current="step"><span class="at-step-n" aria-hidden="true">1</);
    expect(out).not.toContain('data-parts'); // סגור עד שלוחצים
  });

  it('לחיצה פותחת את הפירוק: חלקים ממוספרים, וחלק-ארגז מקבל צ׳יפ "בארגז ✂️"', () => {
    const seen: string[] = [];
    const engines = [E_ZMANIM, E_NEED, E_BOOK];
    clickAttr(EnginesStep({ engines, atoms: [A_DIVIDE, A_MERGE, A_NEXT], open: null, onToggle: (id) => seen.push(id) }), 'data-engine', 'zmanim');
    expect(seen).toEqual(['zmanim']);
    const out = body(atomsFixture(), { open: 'zmanim' });
    expect(out).toContain('data-parts="zmanim"');
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('data-num="7"');
    expect(out).toContain('שעות זמניות = היום חלקי 12');
    expect(out).toContain('בארגז ✂️');
    expect(out).toContain('בארגז 🔗');
    // "שקיעה" (#5) אינו חלק-ארגז ⇒ בלי צ׳יפ
    const sunset = out.slice(out.indexOf('data-num="5"'), out.indexOf('data-num="7"'));
    expect(sunset).not.toContain('בארגז');
  });
});

describe('(ב) מנוע-בית ⇒ חלק ⇒ השאלה האחת', () => {
  it('בוחרים מנוע-בית ⇒ גריד כל החלקים מכל המנועים עם "מתוך מנוע הזמנים · 7"', () => {
    const hosts: string[] = [];
    // DESIGN 14.10 (מכוון): "יש לך מנוע" אוחד לתוך EnginesStep — אותו כרטיס, "בחר" (data-host) ⇒ onHost (היה HostStep נפרד)
    clickAttr(EnginesStep({ engines: [E_ZMANIM, E_BOOK], atoms: [], open: null, onToggle: () => {}, onHost: (id) => hosts.push(id) }), 'data-host', 'bookings');
    expect(hosts).toEqual(['bookings']);
    const out = body(atomsFixture(), { host: 'bookings' });
    expect(out).toContain('data-atoms="atom"');
    expect(out).toContain('🛏️ מנוע ההזמנות');
    for (const a of [A_DIVIDE, A_MERGE, A_NEXT]) expect(out).toContain(`data-atom="${a.id}"`);
    expect(out).toContain('מתוך מנוע הזמנים · 7');
    expect(out).toContain('מתוך מנוע הזמנים · 13');
    expect(out).toContain(A_DIVIDE.computes);
    const atoms: string[] = [];
    clickAttr(AtomGrid({ host: E_BOOK, atoms: [A_DIVIDE], engines: [E_BOOK], onAtom: (id) => atoms.push(id) }), 'data-atom', 'divide');
    expect(atoms).toEqual(['divide']);
  });

  it('השאלה גדולה, ורק מקומות מהסוג עם תוצאה — בסדר המקומות', () => {
    const out = body(atomsFixture(), { host: 'bookings', atom: 'divide' });
    expect(out).toContain('data-atoms="question"');
    expect(out).toMatch(/class="at-question"[^>]*>מה לחלק\?</);
    const order = ['bookings.hours', 'bookings.stay', 'bookings.pay', 'bookings.price'];
    const idx = order.map((p) => out.indexOf(`data-place="${p}"`));
    expect(idx.every((i) => i > 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    expect(out).toContain('תורים שווים לאורך היום');
    expect(out).toContain('תשלומים שווים');
    expect(out).toContain('מחיר לאדם');
    // הלילות = רצף (לא הסוג של "חלק") ⇒ לא מוצע גם כשיש משפט; הערה = בלי משפט ⇒ לא מוצע
    expect(out).not.toContain('bookings.nights');
    expect(out).not.toContain('לא אמור להופיע');
    expect(out).not.toContain('bookings.note');
    // צ׳יפ-סוג קטן — בשפה פשוטה (ATOMS-NAMES: KIND_PLAIN, לא "סכום או כמות"/"טווח")
    expect(out).toContain('>סכום<');
    expect(out).toContain('>מ… עד…<');
    expect(out).not.toContain('סכום או כמות');
    // אותה רשימה בדיוק כמו optionsFor של החוזה (בלי שכפול ההתאמה)
    const opts = optionsFor(A_DIVIDE, E_BOOK);
    const picked: string[] = [];
    const tree = QuestionStep({ atom: A_DIVIDE, options: opts, onOption: (p) => picked.push(p) });
    expect(walk(tree).filter((e) => (e.props as Record<string, unknown>)['data-place']).map((e) => (e.props as Record<string, string>)['data-place'])).toEqual(order);
    clickAttr(tree, 'data-place', 'bookings.pay');
    expect(picked).toEqual(['bookings.pay']);
  });

  it('אין מקום מתאים ⇒ "החלק הזה לא מתחבר למנוע הזה"', () => {
    expect(body(atomsFixture(), { host: 'bookings', atom: 'next' })).toContain(NO_PLACE_TEXT);
    expect(html(QuestionStep({ atom: A_NEXT, options: [], onOption: () => {} }))).toContain(NO_PLACE_TEXT);
  });
});

describe('(ג) הפרטים ו"חבר"', () => {
  it('הטופס מציג את ברירות-המחדל (מספר, דקות, בחירה)', () => {
    const out = body(atomsFixture(), { host: 'bookings', atom: 'divide', place: 'bookings.hours' });
    expect(out).toContain('data-atoms="details"');
    expect(out).toContain('לכמה חלקים?');
    expect(out).toMatch(/data-detail="parts"[^>]*|value="4"[^>]*data-detail="parts"/);
    expect(out).toMatch(/value="4"/);
    expect(out).toMatch(/value="10"/);
    expect(out).toContain('דקות');
    expect(out).toMatch(/aria-pressed="true"[^>]*data-choice="round:none"/);
    expect(out).toContain('תורים שווים לאורך היום');
    expect(out).toContain('>' + CONNECT_TEXT + '<');
  });

  it('"חבר" ⇒ create עם id מ-capabilityId ו-params מהטופס (מנוקים)', () => {
    const src = atomsFixture();
    const option = optionsFor(A_DIVIDE, E_BOOK)[0];
    const values = { ...detailDefaults(A_DIVIDE.details), parts: '6', round: 'up' };
    let connected = 0;
    const tree = DetailsStep({ atom: A_DIVIDE, option, values, canEdit: true, onValue: () => {}, onConnect: () => connected++ });
    btnText(tree, CONNECT_TEXT)!.props.onClick();
    expect(connected).toBe(1);
    const cap = connectCapability(src, E_BOOK, A_DIVIDE, option, values)!;
    expect(src.log.create).toEqual([cap]);
    expect(cap).toEqual({
      id: capabilityId('bookings', 'bookings.hours', 'divide'),
      engine: 'bookings', place: 'bookings.hours', atom: 'divide',
      params: { parts: 6, gap: 10, round: 'up' },
      name: 'מנוע תורים',
    });
    // ערך שינוי בטופס מגיע ל-onValue
    const changes: [string, number | string][] = [];
    const t2 = DetailsStep({ atom: A_DIVIDE, option, values, canEdit: true, onValue: (id, v) => changes.push([id, v]), onConnect: () => {} });
    clickAttr(t2, 'data-choice', 'round:up');
    expect(changes).toEqual([['round', 'up']]);
  });

  it('ניקוי: מחוץ לגבולות ⇒ נחתך, לא-מספר ⇒ ברירת-מחדל, בחירה לא-קיימת ⇒ ברירת-מחדל', () => {
    expect(cleanParams(A_DIVIDE.details, { parts: '999', gap: 'abc', round: 'zzz' })).toEqual({ parts: 50, gap: 10, round: 'none' });
    expect(cleanParams(A_DIVIDE.details, { parts: 1 })).toEqual({ parts: 2, gap: 10, round: 'none' });
  });

  it('שמות: טבלה קצרה + נפילה "<מנוע> + <חלק>"', () => {
    expect(capabilityName(E_BOOK, A_DIVIDE, 'שעות הפתיחה של היום')).toBe('מנוע תורים');
    expect(capabilityName(E_BOOK, A_DIVIDE, 'הסכום לתשלום')).toBe('מנוע תשלומים');
    expect(capabilityName(E_BOOK, A_DIVIDE, 'המחיר הכולל')).toBe('מנוע מחיר לאדם');
    expect(capabilityName(E_BOOK, A_NEXT, 'משהו אחר')).toBe('מנוע ההזמנות + הבא בתור');
    expect(buildCapability(E_BOOK, A_MERGE, optionsFor(A_MERGE, E_BOOK)[0], {}).name).toBe('מנוע חלונות פנויים');
  });

  it('אחרי "חבר": כרטיס "✨ נוצר מנוע חדש" עם שורות-התצוגה; null ⇒ "התצוגה תגיע בקרוב"', () => {
    const out = body(atomsFixture({ caps: [CAP_QUEUE] }), { host: 'bookings', made: CAP_QUEUE.id });
    expect(out).toContain('✨ נוצר מנוע חדש: מנוע תורים');
    expect(out).toContain('08:00–10:00');
    expect(out).toContain('המנועים שיצרת');
    const soon = body(atomsFixture({ caps: [CAP_QUEUE], preview: null }), { host: 'bookings', made: CAP_QUEUE.id });
    expect(soon).toContain(PREVIEW_SOON_TEXT);
  });
});

describe('(ד) "הסר" בשתי לחיצות', () => {
  it('לחיצה ראשונה חומשת, שנייה על אותו פריט מסירה', () => {
    expect(removeTap(null, 'a')).toEqual({ armed: 'a', remove: false });
    expect(removeTap('a', 'a')).toEqual({ armed: null, remove: true });
    expect(removeTap('b', 'a')).toEqual({ armed: 'a', remove: false });
    const taps: string[] = [];
    const idle = CreatedList({ capabilities: [CAP_QUEUE], engines: [E_BOOK], canEdit: true, armed: null, onRemoveTap: (id) => taps.push(id) });
    btnText(idle, REMOVE_TEXT)!.props.onClick();
    const armed = CreatedList({ capabilities: [CAP_QUEUE], engines: [E_BOOK], canEdit: true, armed: CAP_QUEUE.id, onRemoveTap: (id) => taps.push(id) });
    expect(btnText(armed, REMOVE_TEXT)).toBeUndefined();
    btnText(armed, REMOVE_ARMED_TEXT)!.props.onClick();
    expect(taps).toEqual([CAP_QUEUE.id, CAP_QUEUE.id]);
    expect(CreatedList({ capabilities: [], engines: [], canEdit: true, armed: null, onRemoveTap: () => {} })).toBeNull();
  });
});

describe('(ה) שרשראות', () => {
  it('מתחת למנוע-הבית: שני אימוג׳י-חלקים, שם ומשפט-תוצאה', () => {
    const out = body(atomsFixture(), { host: 'bookings' });
    expect(out).toContain('שרשראות');
    expect(out).toContain('data-chain="divide&gt;merge"');
    expect(out).toContain('✂️ ← 🔗');
    expect(out).toContain('תורים באורך משתנה');
    expect(out).toContain('מחלקים את היום ומאחדים תורים צמודים');
    expect(body(atomsFixture(), { host: 'zmanim' })).not.toContain('שרשראות');
    expect(ChainsList({ chains: [], atoms: [] })).toBeNull();
  });
});

describe('(ו) קריאה בלבד', () => {
  it('canEdit=false ⇒ בלי "חבר" ובלי "הסר" (וגם connectCapability לא כותב)', () => {
    const src = atomsFixture({ canEdit: false, caps: [CAP_QUEUE] });
    const details = body(src, { host: 'bookings', atom: 'divide', place: 'bookings.hours' });
    expect(details).toContain('לכמה חלקים?');
    expect(details).not.toContain('>' + CONNECT_TEXT + '<');
    expect(details).not.toContain('>' + REMOVE_TEXT + '<');
    expect(details).toContain('readOnly');
    const option = optionsFor(A_DIVIDE, E_BOOK)[0];
    const tree = DetailsStep({ atom: A_DIVIDE, option, values: {}, canEdit: false, onValue: () => {}, onConnect: () => {} });
    expect(walk(tree).some((e) => e.type === Btn)).toBe(false);
    const list = CreatedList({ capabilities: [CAP_QUEUE], engines: [E_BOOK], canEdit: false, armed: null, onRemoveTap: () => {} });
    expect(walk(list).some((e) => e.type === Btn)).toBe(false);
    expect(connectCapability(src, E_BOOK, A_DIVIDE, option, {})).toBeNull();
    expect(src.log.create).toEqual([]);
  });
});

describe('(ז) מצב-ריק', () => {
  it('source=null או ארגז ריק ⇒ "🧬 החלקים בהרכבה — עוד מעט"', () => {
    expect(body(null)).toContain(ATOMS_EMPTY_TEXT);
    expect(body(atomsFixture({ empty: true }))).toContain(ATOMS_EMPTY_TEXT);
    expect(body(null)).not.toContain('data-engine');
  });
});

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

describe('(ח) ATOMS-NAMES · הסבר צמוד עם דוגמאות', () => {
  it('כל כרטיס-מנוע וכרטיס-חלק: שם, משפט-הסבר, דוגמה ראשונה גלויה ושתיים מאחורי "עוד דוגמאות"', async () => {
    const { ATOM_EXPLAIN, ENGINE_EXPLAIN } = await import('../../../lib/atoms/explain');
    const { MORE_EXAMPLES_TEXT } = await import('../atoms/AtomSteps');
    const engines = body(atomsFixture());
    for (const id of ['zmanim', 'whatNeed', 'bookings'] as const) {
      expect(engines).toContain(`data-examples="${id}"`);
      // הדוגמה מפוצלת סביב החץ — בודקים את שני הצדדים ואת החץ המודגש
      const [inp, out] = ENGINE_EXPLAIN[id].examples[0].split('←').map(esc);
      expect(engines).toContain(inp);
      expect(engines).toContain(out);
    }
    expect(engines).toContain('class="at-ex-arrow">←<');
    expect(engines).toContain('<summary>' + MORE_EXAMPLES_TEXT + '</summary>');
    // בגריד-החלקים: כל חלק עם דוגמאות, והדוגמאות לא בתוך הכפתור
    const grid = body(atomsFixture(), { host: 'bookings' });
    for (const id of ['divide', 'merge', 'next'] as const) {
      expect(grid).toContain(`data-examples="${id}"`);
      expect(grid).toContain(esc(ATOM_EXPLAIN[id].examples[2].split('←')[1]));
    }
    expect(grid).not.toMatch(/<button[^>]*>(?:(?!<\/button>)[\s\S])*<details/);
    // השאלה: "✂️ <שם> שואל:" + השאלה + ההסבר + הדוגמאות
    const q = body(atomsFixture(), { host: 'bookings', atom: 'divide' });
    expect(q).toContain(A_DIVIDE.name + ' שואל:');
    expect(q).toContain('class="at-what at-q-explain">' + A_DIVIDE.computes);
    expect(q).toContain('data-examples="divide"');
  });
});
