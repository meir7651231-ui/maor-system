/**
 * 🔒 ratchet — 🎯 "מה אתה רוצה לקבל?" במסך (ATOMS-GOAL, 14.10.2026).
 *  (א) המקור: `goal` ⇒ עד 3 הרכבות מוכחות / שאלות; `connectGoal` יוצר לפי הסדר — ההורה ורק אחרי שנשמר הבנוי עליו; מורה ⇒ כלום.
 *  (ב) המסך: הכרטיס העליון בלשונית (רק בצעד המנועים) · 6 צ'יפי-דוגמה · כרטיס-הרכבה עם המשפט, השורות האמיתיות ו"חבר" ·
 *      שאלה סגורה כצ'יפים · "לא מצאתי" כן · צפייה בלבד בלי "חבר" · בלי המילים האסורות.
 *  (ג) משקל: המסך לא מייבא את lib/atoms/goal.ts (נשאר ב-chunk של המקור).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Db, HostStaff } from '../../../types/domain';
import { fixtureDb, NOW_MS } from '../../../lib/switchboard/__tests__/fixture';
import type { Capability } from '../../../lib/atoms/contract';
import { atomsSource } from '../atoms/source';
import { AtomsBody } from '../atoms/AtomsBody';
import { GOAL_CONNECT_TEXT, GOAL_EXAMPLES, GOAL_MADE_TEXT, GOAL_NONE_TEXT, GOAL_SAVED_TEXT, GOAL_TITLE_TEXT, GoalAnswer, GoalCard } from '../atoms/GoalCard';
import goalCardSrc from '../atoms/GoalCard.tsx?raw';
import bodySrc from '../atoms/AtomsBody.tsx?raw';
import screenSrc from '../EngineBoxScreen.tsx?raw';
import { EngineBoxBody } from '../EngineBoxScreen';
import seamSrc from '../atoms/seam.ts?raw';

const STAFF = (id: string, name: string): HostStaff => ({ id, kind: 'staff', name, role: 'ניקיון', phone: '', createdAt: 'x', updatedAt: 'x' });
const DB = (caps: Capability[] = []): Db => {
  const b = fixtureDb();
  return { ...b, hostRecords: [...b.hostRecords, STAFF('hs1', 'דנה'), STAFF('hs2', 'רבקה')], ui: { ...b.ui, capabilities: caps } };
};
const src = (caps: Capability[] = [], over: Partial<Parameters<typeof atomsSource>[0]> = {}) =>
  atomsSource({ db: DB(caps), config: null, nowMs: NOW_MS, canEdit: true, create: vi.fn(), remove: vi.fn(), ...over });
const text = (h: string) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '');
const card = (s: ReturnType<typeof src>, t?: string) => renderToStaticMarkup(createElement(GoalCard, { source: s, initialText: t }));

describe('🎯 (א) המקור', () => {
  it('goal ⇒ ההרכבה עם המשפט והשורות האמיתיות', () => {
    const v = src().goal!('תורים של 40 דקות בחלון הניקיון', []);
    expect(v.status).toBe('ok');
    expect(v.results[0]).toMatchObject({ id: 'bookings:bookings.turnover:divide', sentence: '✂️ מחלק לחלקים שווים את חלון הניקיון, כל חלק 40 דקות ← 6 תורים', steps: 1, saved: false });
    expect(v.results[0].lines[0]).toBe('11:00–11:40 · דנה');
  });

  it('שאלה סגורה ⇒ צ\'יפ ⇒ תשובה', () => {
    const s = src();
    const q = s.goal!('לחלק', []);
    expect(q.status).toBe('ask');
    const chip = q.questions[0].chips.find((c) => c.label === '🛏️ חלון הניקיון')!;
    expect(s.goal!('לחלק', [chip.pick]).results[0].id).toBe('bookings:bookings.turnover:divide');
  });

  it('connectGoal: שרשרת ⇒ ההורה, ורק אחרי שנשמר — הבנוי עליו (עם parent); מורה ⇒ כלום', async () => {
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const create = vi.fn((c: Capability) => {
      order.push(c.id);
      return c.parent ? Promise.resolve(true) : gate.then(() => true);
    });
    const s = src([], { create });
    const id = 'bookings:bookings.nights:merge>next';
    expect(s.connectGoal!('3 לילות פנויים ברצף', [], id)).toBe(id);
    await Promise.resolve();
    expect(order).toEqual(['bookings:bookings.nights:merge']);
    release();
    await gate;
    await new Promise((r) => setTimeout(r, 0));
    expect(order).toEqual(['bookings:bookings.nights:merge', id]);
    expect(create.mock.calls[1][0]).toMatchObject({ id, parent: 'bookings:bookings.nights:merge', name: 'מנוע החלון הפנוי הבא' });
    const teacher = vi.fn();
    expect(src([], { create: teacher, canEdit: false }).connectGoal!('3 לילות פנויים ברצף', [], id)).toBeNull();
    expect(teacher).not.toHaveBeenCalled();
    // הרכבה שלא קיימת ⇒ null
    expect(s.connectGoal!('3 לילות פנויים ברצף', [], 'nope')).toBeNull();
  });
});

describe('🎯 (ב) המסך', () => {
  // DESIGN 14.10 (שינוי מכוון במיזוג): הכרטיס עבר מראש "מנועים וחלקים" לדלת הראשונה "🎯 תגיד מה אתה רוצה" — אותו רכיב,
  // אותו מקור, אותה לוגיקה. היה: "הכרטיס העליון בלשונית — רק בצעד המנועים, לפני רשימת המנועים" (AtomsBody).
  it('הכרטיס בדלת הראשונה "🎯 תגיד מה אתה רוצה" — ולא ב"בנה בעצמך"', () => {
    const door = renderToStaticMarkup(createElement(EngineBoxBody, { source: null, atoms: src(), initial: { tab: 'goal' } }));
    expect(door).toContain(GOAL_TITLE_TEXT);
    expect(door).toMatch(/aria-selected="true"[^>]*data-tab="goal"/);
    expect(door).not.toContain('id="at-h-engines"');
    // הדלת קיימת גם כשרק "מנועים וחלקים" יודעים להרכיב (v1 בלי goal) — ובחלקים עצמם אין כרטיס
    const home = renderToStaticMarkup(createElement(EngineBoxBody, { source: null, atoms: src() }));
    expect([...home.matchAll(/role="tab"[^>]*data-tab="(\w+)"/g)].map((m) => m[1])).toEqual(['goal', 'atoms', 'plug']);
    expect(home).not.toContain(GOAL_TITLE_TEXT);
    expect(renderToStaticMarkup(createElement(AtomsBody, { source: src() }))).not.toContain(GOAL_TITLE_TEXT);
    // מקור בלי goal (תפר ישן) ⇒ אין כרטיס ואין דלת 🎯
    const { goal: _g, connectGoal: _c, ...old } = src();
    void _g;
    void _c;
    const oldHome = renderToStaticMarkup(createElement(EngineBoxBody, { source: null, atoms: old }));
    expect(oldHome).not.toContain(GOAL_TITLE_TEXT);
    expect(oldHome).not.toContain('data-tab="goal"');
  });

  it('6 צ\'יפי-דוגמה, תיבה עם תווית, ובלי תשובה עד ששואלים', () => {
    const h = card(src());
    for (const g of GOAL_EXAMPLES) expect(h).toContain('data-goal-example="' + g + '"');
    expect(h).toContain('aria-label="' + GOAL_TITLE_TEXT + '"');
    expect(h).toContain('data-goal="idle"');
    expect(h).not.toContain('data-goal-result');
  });

  it('הרכבה: המשפט, השורות האמיתיות ו"חבר"', () => {
    const h = card(src(), 'תורים של 40 דקות בחלון הניקיון');
    expect(h).toContain('data-goal="ok"');
    expect(text(h)).toContain('✂️ מחלק לחלקים שווים את חלון הניקיון, כל חלק 40 דקות ← 6 תורים');
    expect(text(h)).toContain('14:20–15:00 · רבקה');
    expect(text(h)).toContain(GOAL_CONNECT_TEXT);
  });

  it('שרשרת "3 לילות פנויים ברצף" ⇒ גם כרטיס של 2 חלקים', () => {
    const h = text(card(src(), '3 לילות פנויים ברצף'));
    expect(h).toContain('2 חלקים');
    expect(h).toContain('בית ההארחה · 3 לילות פנויים ברצף מ-15/10 עד 18/10');
  });

  it('לא ברור ⇒ שאלה סגורה כצ\'יפים, בלי כרטיסי-הרכבה', () => {
    const h = card(src(), 'לחלק');
    expect(h).toContain('data-goal="ask"');
    expect(h).toContain('data-goal-chip="bookings.turnover"');
    expect(h).not.toContain('data-goal-result');
    expect(text(h)).toContain('✂️ מה לחלק?');
  });

  it('אין הרכבה ⇒ השורה הכנה', () => {
    expect(text(card(src(), 'תזכורת יומיים לפני כל הגעה'))).toContain(GOAL_NONE_TEXT);
  });

  it('צפייה בלבד ⇒ בלי "חבר"; שמור ⇒ "כבר מחובר ✓"; אחרי "חבר" ⇒ "✨ נוצר מנוע חדש"', () => {
    expect(text(card(src([], { canEdit: false }), 'תורים של 40 דקות בחלון הניקיון'))).not.toContain(GOAL_CONNECT_TEXT);
    const saved: Capability = { id: 'bookings:bookings.turnover:divide', engine: 'bookings', place: 'bookings.turnover', atom: 'divide', params: { by: 'size', parts: 12, size: 40, gap: 0, remainder: 'drop' }, name: 'מנוע תורים' };
    expect(text(card(src([saved]), 'תורים של 40 דקות בחלון הניקיון'))).toContain(GOAL_SAVED_TEXT);
    const view = src().goal!('תורים של 40 דקות בחלון הניקיון', []);
    const h = renderToStaticMarkup(createElement(GoalAnswer, { view, canEdit: true, made: view.results[0].id, onConnect: () => undefined, onPick: () => undefined }));
    expect(text(h)).toContain(GOAL_MADE_TEXT);
  });

  it('"חבר" ו"צ\'יפ" קוראים לפעולות (עץ-האלמנטים)', () => {
    const view = src().goal!('3 לילות פנויים ברצף', []);
    const onConnect = vi.fn();
    const el = GoalAnswer({ view, canEdit: true, made: null, onConnect, onPick: vi.fn() });
    const btns: { props: { onClick?: () => void } }[] = [];
    const walk = (n: unknown): void => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(walk);
      const x = n as { type?: unknown; props?: { onClick?: () => void; children?: unknown } };
      if (x.props?.onClick) btns.push(x as never);
      walk(x.props?.children);
    };
    walk(el);
    btns[0].props.onClick!();
    expect(onConnect).toHaveBeenCalledWith(view.results[0].id);
  });

  it('בלי המילים האסורות של הבעלים בטקסטים של המסך', () => {
    const BANNED = /מיזוג|ניתוב|הסלמה|סלחני|יחסי|אטום|(?<!ב)רצף|טווח/;
    const strings = goalCardSrc.match(/'[^'\n]*[א-ת][^'\n]*'/g) ?? [];
    for (const s of strings) expect(s).not.toMatch(BANNED);
  });
});

describe('🎯 (ג) משקל ותפר', () => {
  it('המסך לא מייבא את המנוע (lib/atoms/goal) — רק התפר; ב-AtomsBody רק שורת-חיבור אחת', () => {
    expect(goalCardSrc).not.toMatch(/from '[^']*lib\/atoms\/goal'/);
    expect(bodySrc).not.toMatch(/from '[^']*lib\/atoms\/goal'/);
    // DESIGN 14.10: החיבור עבר ל-EngineBoxScreen (הדלת 🎯) — שם import (שם + נתיב) + שורה אחת; ב-AtomsBody רק הערה שמפנה
    expect(bodySrc).not.toMatch(/import \{ GoalCard \}/);
    expect(screenSrc.match(/GoalCard/g)?.length).toBe(3);
    expect(seamSrc).toMatch(/goal\?\(text: string/);
  });
});
