/**
 * 🎨 ratchet — ארגז המנועים בעיצוב החדש (ATOMS-DESIGN 14.10.2026, knowledge/DESIGN-ENGINEBOX-2026-10-14.md).
 * אידיום-הפרויקט: renderToStaticMarkup + הפעלת onClick ישירה על עץ-האלמנטים.
 *
 * ננעל:
 *  (א) שלוש הדלתות: 🎯 תגיד מה אתה רוצה · 🧬 בנה בעצמך · 🔌 חבר מנוע מוכן — tablist אמיתי, "בנה בעצמך" פתוחה, לחיצה מחליפה.
 *  (ב) מונה 1-2-3 בכל צעד (aria-current="step"), וכשנוצר מנוע — שלושתם ✓.
 *  (ג) הצעד הבא: "✨ נוצר מנוע חדש" מציע "בנה עליו" (רק כשאפשר) ו"עוד חלק"; "חבר" בפס הדביק עם משפט שאומר מה יקרה;
 *      הפרטים מראים "מתחבר אל <המקום>" ואת התוצאה כגיבור.
 *  (ד) החריצים לאינטגרציה — נתוני-דוגמה בלבד: "✅ מאומת · N בדיקות" ליד אפשרות וליד מנוע שנוצר · "🤖 מנועים שנמצאו אוטומטית".
 *      בלי נתונים ⇒ אין זכר (ביט-זהה).
 *  (ה) נגישות: כל כפתור-אימוג'י עם שם; "חזור" ראשון בפס העליון; יעד-מגע ≥ 44px במקורות ה-CSS.
 *  (ו) צבע: אפס צבע קשיח ב-CSS של הארגז (רק tokens של הערכה; צל שחור-שקוף מותר) · תנועה כבויה ב-prefers-reduced-motion.
 *  (ז) המילים האסורות לא נכנסו לטקסטים החדשים.
 */
import { describe, expect, it } from 'vitest';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Btn } from '../../ui';
import { optionsFor } from '../../../lib/atoms/contract';
import { EngineBoxBody, BoxDoors, DOORS, DOORS_LEAD } from '../EngineBoxScreen';
import { AtomsBody } from '../atoms/AtomsBody';
import * as steps from '../atoms/AtomSteps';
import { A_DIVIDE, atomsFixture, CAP_QUEUE, E_BOOK, E_ZMANIM } from './atoms-fixtures';
import { fixtureSource } from './fixtures';
import { readFileSync } from 'node:fs';

// vitest לא טוען CSS (גם לא ?raw) — קוראים את המקור מהדיסק
const atomsCss = readFileSync('src/components/enginebox/atoms/atoms.css', 'utf8');
const boxCss = readFileSync('src/components/enginebox/enginebox.css', 'utf8');

const html = (el: ReactElement) => renderToStaticMarkup(el);
const body = (src: ReturnType<typeof atomsFixture>, initial?: Parameters<typeof AtomsBody>[0]['initial']) => html(createElement(AtomsBody, { source: src, initial }));

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

describe('🎨 (א) שלוש הדלתות', () => {
  it('🎯 · 🧬 · 🔌 בסדר של הבעלים, tablist, "בנה בעצמך" פתוחה כברירת-מחדל', () => {
    const out = html(createElement(EngineBoxBody, { source: { ...fixtureSource(), goal: () => null }, atoms: atomsFixture() }));
    expect(out).toContain(DOORS_LEAD);
    expect(out).toContain('role="tablist"');
    expect([...out.matchAll(/role="tab"[^>]*data-tab="(\w+)"/g)].map((m) => m[1])).toEqual(['goal', 'atoms', 'plug']);
    for (const d of DOORS) expect(out).toContain(d.title);
    expect(DOORS.map((d) => d.emoji + ' ' + d.title)).toEqual(['🎯 תגיד מה אתה רוצה', '🧬 בנה בעצמך', '🔌 חבר מנוע מוכן']);
    expect(out).toMatch(/aria-selected="true" class="eb-door eb-door-on" data-tab="atoms"/);
    expect(out).toContain('data-atoms="engines"');
  });

  it('לחיצה על דלת ⇒ onTab; בלי 🎯 במקור ⇒ שתי דלתות', () => {
    const got: string[] = [];
    const btns = walk(BoxDoors({ tab: 'atoms', onTab: (t) => got.push(t) })).filter((e) => e.type === 'button');
    expect(btns.map((b) => (b.props as Record<string, string>)['data-tab'])).toEqual(['goal', 'atoms', 'plug']);
    (btns[2].props as { onClick: () => void }).onClick();
    expect(got).toEqual(['plug']);
    const two = html(createElement(EngineBoxBody, { source: fixtureSource(), atoms: atomsFixture() }));
    expect([...two.matchAll(/role="tab"[^>]*data-tab="(\w+)"/g)].map((m) => m[1])).toEqual(['atoms', 'plug']);
  });

  it('בלי atoms — אין דלתות (הזרימה הישנה, ביט-זהה — נעול גם ב-atoms-ratchet (א))', () => {
    const out = html(createElement(EngineBoxBody, { source: { ...fixtureSource(), goal: () => null } }));
    expect(out).not.toContain('eb-doors');
    expect(out).toContain('class="eb-tabs"');
  });
});

describe('🎨 (ב) מונה 1-2-3', () => {
  const at = (h: string) => Number(/data-steps-at="(\d)"/.exec(h)?.[1]);
  it('צעד לכל מסך, aria-current על הנוכחי, ✓ על מה שהושלם', () => {
    expect(at(body(atomsFixture()))).toBe(0);
    expect(at(body(atomsFixture(), { host: 'bookings' }))).toBe(1);
    expect(at(body(atomsFixture(), { host: 'bookings', atom: 'divide' }))).toBe(2);
    expect(at(body(atomsFixture(), { host: 'bookings', atom: 'divide', place: 'bookings.hours' }))).toBe(2);
    const made = body(atomsFixture({ caps: [CAP_QUEUE] }), { host: 'bookings', made: CAP_QUEUE.id });
    expect(at(made)).toBe(3);
    expect(made).not.toContain('aria-current="step"');
    expect(made.split('at-step-done').length - 1).toBe(3);
    const two = body(atomsFixture(), { host: 'bookings' });
    expect(two.match(/aria-current="step"/g)).toHaveLength(1);
    for (const l of steps.STEP_LABELS) expect(two).toContain(l);
    expect(steps.STEP_LABELS).toEqual(['בחר מנוע', 'בחר מה להוסיף', 'ראה תוצאה וחבר']);
  });
});

describe('🎨 (ג) הצעד הבא תמיד ברור', () => {
  it('הפרטים: "מתחבר אל" + המקום, התוצאה כגיבור, "חבר" בפס דביק שאומר מה יקרה', () => {
    const out = body(atomsFixture(), { host: 'bookings', atom: 'divide', place: 'bookings.hours' });
    expect(out).toContain('data-snap="1"');
    expect(out).toContain('מתחבר אל');
    expect(out).toContain(steps.RESULT_LABEL);
    expect(out).toMatch(/class="at-actions at-sticky"><button[^>]*class="btn primary"[^>]*>חבר וצור מנוע חדש</);
    expect(out).toContain(steps.CONNECT_HINT);
    // "חזור" — הכפתור הראשון בפס העליון (e2e: '.at-head button'.first())
    expect(out).toMatch(/<div class="at-head"><button[^>]*>→ מקום אחר</);
  });

  it('"✨ נוצר מנוע חדש": "בנה עליו" רק כשאפשר + "עוד חלק"; לחיצה ⇒ הפעולה', () => {
    let built = 0;
    let more = 0;
    const tree = steps.CreatedCard({ capability: CAP_QUEUE, preview: null, onBuildOn: () => built++, onMore: () => more++ });
    const btns = walk(tree).filter((e) => e.type === Btn) as ReactElement<{ onClick: () => void; children: ReactNode }>[];
    expect(btns).toHaveLength(2);
    btns[0].props.onClick();
    btns[1].props.onClick();
    expect([built, more]).toEqual([1, 1]);
    const out = html(tree);
    expect(out).toContain('data-made-open="' + CAP_QUEUE.id + '"');
    expect(out).toContain(steps.MADE_HINT.replace(/"/g, '&quot;'));
    // בלי בנה-עליו (מקור בלי capHost) ⇒ רק "עוד חלק"
    const made = body(atomsFixture({ caps: [CAP_QUEUE] }), { host: 'bookings', made: CAP_QUEUE.id });
    expect(made).not.toContain('data-made-open');
    expect(made).toContain('>' + steps.MORE_PARTS_TEXT + '<');
    // בלי שום צעד-הבא ⇒ בלי השורה
    expect(html(steps.CreatedCard({ capability: CAP_QUEUE, preview: null }))).not.toContain('at-made-next');
  });

  it('"המנועים שיצרת" — בצעד 1 מיד אחרי המכונות, עם ההסבר; בצעדים האחרים בסוף בלי ההסבר', () => {
    const one = body(atomsFixture({ caps: [CAP_QUEUE] }));
    expect(one.indexOf('at-mine-lead')).toBeGreaterThan(one.indexOf('data-host="bookings"'));
    expect(one).toContain(steps.CREATED_HOST_HINT);
    const two = body(atomsFixture({ caps: [CAP_QUEUE] }), { host: 'bookings' });
    expect(two).toContain('data-capability="' + CAP_QUEUE.id + '"');
    expect(two).not.toContain('at-mine-lead');
  });
});

describe('🎨 (ד) החריצים לאינטגרציה (נתוני-דוגמה בלבד)', () => {
  const FOUND = [{ id: 'auto:1', card: { ...E_ZMANIM, id: 'auto1' as typeof E_ZMANIM.id, name: 'מנוע שנמצא', emoji: '🤖' }, verified: { checks: 12 } }];
  it('"✅ מאומת · N בדיקות" ליד אפשרות בשאלה (לפי מזהה המנוע שייווצר) וליד מנוע שנוצר', () => {
    const opts = optionsFor(A_DIVIDE, E_BOOK);
    const q = html(steps.QuestionStep({ atom: A_DIVIDE, options: opts, onOption: () => {}, verified: { [opts[0].place]: { checks: 12 } } }));
    expect(q).toContain('data-verified="12"');
    expect(q).toContain('✅ מאומת · 12 בדיקות');
    expect(q.match(/data-verified=/g)).toHaveLength(1);
    expect(steps.verifiedLabel(1)).toBe('✅ מאומת · בדיקה אחת');
    // דרך המקור: source.verified(capId)
    const src = { ...atomsFixture({ caps: [CAP_QUEUE] }), verified: (id: string) => (id === CAP_QUEUE.id ? { checks: 3 } : undefined) };
    expect(body(src)).toContain('✅ מאומת · 3 בדיקות');
    const qs = body(src, { host: 'bookings', atom: 'divide' });
    expect(qs).toContain('data-verified="3"'); // bookings.hours ⇒ CAP_QUEUE.id
    // 0 בדיקות / חסר ⇒ כלום
    expect(html(createElement(steps.VerifiedStamp, { verified: { checks: 0 } }))).toBe('');
    expect(html(createElement(steps.VerifiedStamp, {}))).toBe('');
  });

  it('"🤖 מנועים שנמצאו אוטומטית" בגריד המנועים; לחיצה ⇒ נפתח כמו מנוע גדול', () => {
    const hosts: string[] = [];
    const tree = steps.EnginesStep({ engines: [E_BOOK], atoms: [], open: null, onToggle: () => {}, onHost: (id) => hosts.push(id), found: FOUND });
    const out = html(tree);
    expect(out).toContain(steps.FOUND_TITLE);
    expect(out).toContain('data-host-found="auto1"');
    expect(out).toContain('✅ מאומת · 12 בדיקות');
    expect(out).not.toContain('data-engine="auto1"'); // בלי מגירת "ממה הוא בנוי"
    const el = walk(tree).find((e) => (e.props as Record<string, unknown>)['data-host-found'] === 'auto1')!;
    (el.props as { onClick: () => void }).onClick();
    expect(hosts).toEqual(['auto:1']);
    const viaSrc = body({ ...atomsFixture(), found: () => FOUND });
    expect(viaSrc).toContain('data-found-group="1"');
    // נפתח: צעד 2 עם החלקים, כמו מנוע גדול
    expect(body({ ...atomsFixture(), found: () => FOUND }, { host: 'auto:1' })).toContain('data-atoms="atom"');
  });

  it('בלי החריצים ⇒ אין זכר', () => {
    const out = body(atomsFixture({ caps: [CAP_QUEUE] }), { host: 'bookings', atom: 'divide' });
    expect(out).not.toContain('data-verified');
    expect(body(atomsFixture())).not.toContain('data-found-group');
  });
});

describe('🎨 (ה) נגישות', () => {
  it('כל אימוג׳י-קישוט aria-hidden; כפתור-פנים של מנוע שנוצר עם שם; יעדי-מגע ≥ 44px', () => {
    const out = body(atomsFixture());
    for (const m of out.matchAll(/<span class="(at-tile|eb-door-emoji|at-plug)[^"]*"([^>]*)>/g)) expect(m[2], m[1]).toContain('aria-hidden="true"');
    const tree = steps.CreatedList({ capabilities: [CAP_QUEUE], engines: [E_BOOK], canEdit: true, armed: null, onRemoveTap: () => {}, onOpen: () => {} });
    expect(html(tree!)).toMatch(/data-host-cap="[^"]+" aria-label="בנה עליו: מנוע תורים"/);
    for (const sel of ['.at-parts-toggle', '.at-choice', '.at-head .btn', '.at-actions .btn']) {
      const rule = new RegExp(sel.replace(/\./g, '\\.') + '[^{]*\\{[^}]*min-height: (\\d+)px');
      expect(Number(rule.exec(atomsCss)?.[1] ?? 0), sel).toBeGreaterThanOrEqual(44);
    }
    expect(boxCss).toMatch(/button\[aria-label="סגירה"\] \{ width: 44px !important; height: 44px !important/);
  });
});

describe('🎨 (ו) צבע ותנועה', () => {
  it('אפס צבע קשיח בארגז — רק tokens של הערכה (צל rgba(0,0,0,…) מותר)', () => {
    for (const [name, css] of [['atoms.css', atomsCss], ['enginebox.css', boxCss]] as const) {
      const noShadows = css.replace(/rgba\(0, 0, 0, 0?\.\d+\)/g, '');
      expect(noShadows.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g), name).toBeNull();
    }
  });
  it('prefers-reduced-motion מכבה את כל התנועה', () => {
    expect(atomsCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.at-body \*, \.eb-body \* \{ animation: none !important; transition: none !important; \}/);
  });
});

describe('🎨 (ז) עברית פשוטה', () => {
  it('בלי המילים האסורות בטקסטים החדשים', () => {
    const BANNED = [/מיזוג/, /ניתוב/, /הסלמה/, /סלחני/, /יחסי/, /אטום/, /(?<!ב)רצף/, /טווח/];
    const visible = [
      ...steps.STEP_LABELS, steps.HOST_TITLE, steps.HOST_HINT, steps.CONNECT_TEXT, steps.PARTS_TOGGLE_TEXT, steps.PICK_ENGINE_TEXT,
      steps.PICK_OPTION_TEXT, steps.RESULT_LABEL, steps.TUNE_TITLE, steps.CONNECT_HINT, steps.MADE_HINT, steps.MORE_PARTS_TEXT,
      steps.MINE_TITLE, steps.FOUND_TITLE, steps.verifiedLabel(5), DOORS_LEAD, ...DOORS.flatMap((d) => [d.title, d.sub]),
    ];
    for (const t of visible) for (const w of BANNED) expect(w.test(t), t).toBe(false);
  });
});
