/**
 * ratchet — 🧰 ארגז-המנועים, החיווט הסופי (ENGINEBOX-FINAL 13.10): שני הרעיונות הקיצוניים של הבעלים על המסך.
 *
 * ננעל:
 *  (א) הלשוניות: מקור עם `goal` ⇒ "🔌 לחבר מנוע" / "🎯 להתחיל מהסוף"; מקור בלי ⇒ אין לשוניות (שלב ב׳ ביט-זהה); לחיצה מחליפה.
 *  (ב) המשפט של הבעלים ⇒ הדרך (צעדים) + כרטיס-החסר הכן ("בקרוב") + "חבר את כל הדרך" כשמשהו בדרך מנותק.
 *  (ג) "חבר את כל הדרך" ⇒ linkEngine לכל מפתח לפי הסדר (ה-store האמיתי), שורת-לוג לכל חיבור, טוסט אחד; אחרי ⇒ "✓ כבר מחובר".
 *  (ד) "בקשו מהמחולל" ⇒ שורת-לוג כנה "בקשה למנוע חדש" עם התקע והמשפט; בלי אוסף חדש ובלי שרת.
 *  (ה) קריאה-בלבד: המסלולים מוצגים, אין שום כפתור, והמקור לא כותב גם אם קוראים לו.
 *  (ו) 📊 "מה היה קורה בחודש האחרון": מספרים אמיתיים מנתוני-הארגון לאפשרות מזוּרעת; null ⇒ אין שורה בכלל; בלי שמות-אורחים.
 *  (ז) הגנות-מקור: הבנדל-הראשי (App/main/store/persist) לא מייבא את המתאם/מנוע-המסלול/מנוע-ההשפעה; המתאם נטען ב-import()
 *      מתוך הכניסה העצלה; rankByRecipes לא מחווט (אין מקור-ספירות — רדום עד מתכוני-ענן).
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { ask, installProvider } from '../../../lib/switchboard/registry';
import { abilities as hostingAbilities } from '../../hosting/abilities';
import { abilities as parnasaAbilities } from '../../parnasa/abilities';
import { B, cfgWith, fixtureDb, G, restoreStore, setupStore, U } from '../../../lib/switchboard/__tests__/fixture';
import { goalRoutes } from '../../../lib/enginebox/goal/routeAdapter';
import { impactOf } from '../../../lib/enginebox/impact';
import { DEFAULT_LINKS, effectiveLinks } from '../../../lib/enginebox/links';
import { APPLY_TEXT, GoalPanel, LINKED_TEXT, REQUEST_TEXT } from '../GoalPanel';
import { BoxTabs, EngineBoxBody, IMPACT_TITLE, PlugStep, TAB_GOAL_TEXT, TAB_PLUG_TEXT, type BoxTab } from '../EngineBoxScreen';
import { applyRouteKeys, applyRouteToast, engineBoxSource, engineRequestLine, type EngineBoxDeps } from '../source';
import type { EngineBoxSource } from '../types';
import { fixtureSource } from './fixtures';
import entrySrc from '../EngineBoxEntry.tsx?raw';

const OWNER = 'אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר';
const NOW_MS = Date.parse('2026-10-14T09:00:00Z');
const BOTH = cfgWith({ parnasa: true, hosting: true });

const noop = () => {};
function src(over: Partial<EngineBoxDeps> = {}): EngineBoxSource {
  return engineBoxSource({ config: BOTH, links: undefined, canEdit: true, connect: noop, disconnect: noop, goalRoutes, ...over });
}

/** כל הכפתורים בעץ-אלמנטים (בלי DOM) — אידיום הפרויקט. */
function walk(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) node.forEach((n) => walk(n, out));
  else if (isValidElement(node)) {
    out.push(node);
    walk((node.props as { children?: ReactNode }).children, out);
  }
  return out;
}
const textOf = (n: ReactNode): string =>
  Array.isArray(n) ? n.map(textOf).join('') : isValidElement(n) ? textOf((n.props as { children?: ReactNode }).children) : n == null || typeof n === 'boolean' ? '' : String(n);

beforeAll(() => {
  installProvider('hosting', hostingAbilities);
  installProvider('parnasa', parnasaAbilities);
});
afterEach(() => restoreStore());

describe('(א) הלשוניות', () => {
  it('מקור עם goal ⇒ שתי לשוניות, הראשונה פעילה; מקור בלי ⇒ אין לשוניות (שלב ב׳ ביט-זהה)', () => {
    const out = renderToStaticMarkup(createElement(EngineBoxBody, { source: src() }));
    expect(out).toContain(TAB_PLUG_TEXT);
    expect(out).toContain(TAB_GOAL_TEXT);
    expect(out).toMatch(/aria-selected="true"[^>]*data-tab="plug"/);
    expect(out).toContain('במה מתחילים?');
    const legacy = renderToStaticMarkup(createElement(EngineBoxBody, { source: fixtureSource() }));
    expect(legacy).not.toContain(TAB_GOAL_TEXT);
    expect(legacy).not.toContain('eb-tabs');
  });

  it('לחיצה על "🎯 להתחיל מהסוף" מחליפה; בלשונית-המטרה מוצג הפאנל, לא צעדי-החיבור', () => {
    const picked: BoxTab[] = [];
    const tabs = walk(BoxTabs({ tab: 'plug', onTab: (t) => picked.push(t) })).filter((e) => e.type === 'button');
    expect(tabs.map((b) => textOf(b))).toEqual([TAB_PLUG_TEXT, TAB_GOAL_TEXT]);
    (tabs[1]!.props as { onClick: () => void }).onClick();
    expect(picked).toEqual(['goal']);
    const out = renderToStaticMarkup(createElement(EngineBoxBody, { source: src(), initial: { tab: 'goal' } }));
    expect(out).toMatch(/aria-selected="true"[^>]*data-tab="goal"/);
    expect(out).toContain('מה אתה רוצה שייצא?');
    expect(out).not.toContain('במה מתחילים?');
  });
});

describe('(ב) המשפט של הבעלים על המסך', () => {
  it('הדרך + החסר הכן ("בקרוב") + "חבר את כל הדרך" (חיבורי-הלוח מתחילים מנותקים)', () => {
    const out = renderToStaticMarkup(createElement(EngineBoxBody, { source: src(), initial: { tab: 'goal', goal: OWNER, start: 'hosting' } }));
    expect(out).toContain('מתחילים מ:');
    expect(out).toContain('להזמין · הזמנה');
    expect(out).toContain('הוסף את 📞 הקו (טלפון כשר)');
    expect(out).toContain('📞 הקו (טלפון כשר) מקבל מקום פנוי מ-🛏️ יחידות ותפוסה');
    expect(out).toContain('הזמנה עוד לא זמין · בקרוב');
    expect(out).toContain('שלוחה בקו עוד לא זמין · בקרוב');
    expect(out).toContain(APPLY_TEXT);
    expect(out).toContain(REQUEST_TEXT);
  });

  it('המתאם עוד נטען (goalRoutes=null) ⇒ הלשונית קיימת, בלי תוצאה ובלי לזרוק', () => {
    const s = src({ goalRoutes: null });
    expect(s.goal?.(OWNER, 'hosting')).toBeNull();
    const out = renderToStaticMarkup(createElement(EngineBoxBody, { source: s, initial: { tab: 'goal', goal: OWNER } }));
    expect(out).toContain(TAB_GOAL_TEXT);
    expect(out).not.toContain('eg-route');
  });
});

describe('(ג) "חבר את כל הדרך" — ה-store האמיתי', () => {
  it('linkEngine לכל מפתח לפי הסדר, שורת-לוג לכל חיבור, טוסט אחד — ואחרי ⇒ "✓ כבר מחובר"', async () => {
    setupStore(BOTH, fixtureDb());
    const toasts: string[] = [];
    const applied: Promise<number>[] = [];
    const s0 = src({
      links: useApp.getState().db.ui.engineLinks,
      applyRoute: (keys) => applied.push(applyRouteKeys(keys, useApp.getState().linkEngine).then((n) => (toasts.push(applyRouteToast(n)), n))),
    });
    const result = s0.goal!(OWNER, 'hosting')!;
    const route = result.routes[0]!;
    expect(route.alreadyLinked).toBe(false);
    const missingNow = route.linkKeys.filter((k) => !effectiveLinks(undefined).has(k));
    expect(missingNow.length).toBeGreaterThan(0);

    // הכפתור בפאנל ⇒ source.applyRoute ⇒ linkEngine
    const panel = GoalPanel({ text: OWNER, result, canEdit: true, onText: noop, onApply: (k) => s0.applyRoute!(k), onRequestEngine: noop });
    const out0 = renderToStaticMarkup(panel);
    expect(out0).toContain(APPLY_TEXT);
    const card = walk(panel).find((e) => (e.props as { route?: unknown }).route === route)!;
    const btn = walk((card.type as (p: unknown) => ReactNode)(card.props)).find((e) => textOf(e) === APPLY_TEXT && typeof (e.props as { onClick?: unknown }).onClick === 'function')!;
    (btn.props as { onClick: () => void }).onClick();
    expect(applied).toHaveLength(1);
    const n = await applied[0]!;

    expect(n).toBe(missingNow.length);
    const after = effectiveLinks(useApp.getState().db.ui.engineLinks);
    for (const k of route.linkKeys) expect(after.has(k), k).toBe(true);
    for (const k of DEFAULT_LINKS) expect(after.has(k), 'ברירת-המחדל נשמרה: ' + k).toBe(true);
    const audit = useApp.getState().db.audit ?? [];
    expect(audit.filter((a) => a.act === 'חיבור מנוע')).toHaveLength(n);
    expect(toasts).toEqual([applyRouteToast(n)]);
    expect(toasts[0]).toContain(String(n));

    // המקור נבנה מחדש מהמצב החדש ⇒ אותה דרך = "✓ כבר מחובר"
    const s1 = src({ links: useApp.getState().db.ui.engineLinks });
    const again = s1.goal!(OWNER, 'hosting')!;
    expect(again.routes[0]!.alreadyLinked).toBe(true);
    const out1 = renderToStaticMarkup(GoalPanel({ text: OWNER, result: again, canEdit: true, onText: noop, onApply: noop, onRequestEngine: noop }));
    expect(out1).toContain(LINKED_TEXT);
    expect(out1).not.toContain('>' + APPLY_TEXT + '<');
  });

  it('מפתח שכבר מחובר לא נספר ולא נרשם פעמיים; הכול מחובר ⇒ "הדרך כבר מחוברת"', async () => {
    setupStore(BOTH, fixtureDb());
    const k = DEFAULT_LINKS[0]!;
    expect(await applyRouteKeys([k, k], useApp.getState().linkEngine)).toBe(0);
    expect((useApp.getState().db.audit ?? []).filter((a) => a.act === 'חיבור מנוע')).toHaveLength(0);
    expect(applyRouteToast(0)).toBe('הדרך כבר מחוברת');
    expect(applyRouteToast(1)).toBe('🔌 חובר חיבור אחד — הדרך מחוברת ✓');
  });
});

describe('(ד) "בקשו מהמחולל"', () => {
  it('שורת-לוג כנה: "בקשה למנוע חדש" · "שלוחה בקו — «המשפט»"', () => {
    setupStore(BOTH, fixtureDb());
    const calls: string[] = [];
    const s = src({ requestEngine: (plug, text) => (useApp.getState().logAccess('בקשה למנוע חדש', engineRequestLine(plug, text)), calls.push(plug)) });
    const result = s.goal!(OWNER, 'hosting')!;
    const panel = GoalPanel({ text: OWNER, result, canEdit: true, onText: noop, onApply: noop, onRequestEngine: (p, t) => s.requestEngine!(p, t) });
    const missingCard = walk(panel).find((e) => Array.isArray((e.props as { missing?: unknown }).missing))!;
    const reqBtns = walk((missingCard.type as (p: unknown) => ReactNode)(missingCard.props)).filter(
      (e) => textOf(e) === REQUEST_TEXT && typeof (e.props as { onClick?: unknown }).onClick === 'function',
    );
    expect(reqBtns.length).toBe(2);
    (reqBtns[1]!.props as { onClick: () => void }).onClick();
    expect(calls).toEqual(['voice.menu']);
    const line = (useApp.getState().db.audit ?? []).find((a) => a.act === 'בקשה למנוע חדש')!;
    expect(line.what).toBe('שלוחה בקו — «' + OWNER + '»');
    expect(engineRequestLine('voice.menu', 'א\nב   ג')).toBe('שלוחה בקו — «א ב ג»');
    expect(engineRequestLine('voice.menu', 'א'.repeat(300)).length).toBeLessThan(140);
  });

  it('הכניסה מחווטת את הבקשה ללוג + טוסט, ואת "חבר את כל הדרך" ל-linkEngine', () => {
    expect(entrySrc).toContain("REQUEST_ACT = 'בקשה למנוע חדש'");
    expect(entrySrc).toContain("REQUEST_TOAST = 'הבקשה נרשמה בלוג הפעולות'");
    expect(entrySrc).toContain('logAccess(REQUEST_ACT, engineRequestLine(plug, text))');
    expect(entrySrc).toContain('applyRouteKeys(keys, linkEngine)');
  });
});

describe('(ה) קריאה-בלבד', () => {
  it('המסלולים מוצגים, בלי שום כפתור-פעולה; המקור לא כותב גם אם קוראים לו', () => {
    let wrote = 0;
    const s = src({ canEdit: false, links: [], applyRoute: () => wrote++, requestEngine: () => wrote++ });
    const out = renderToStaticMarkup(createElement(EngineBoxBody, { source: s, initial: { tab: 'goal', goal: OWNER, start: 'hosting' } }));
    expect(out).toContain('eg-route');
    expect(out).toContain('הזמנה עוד לא זמין · בקרוב');
    expect(out).not.toContain('>' + APPLY_TEXT + '<');
    expect(out).not.toContain(REQUEST_TEXT);
    s.applyRoute!(['host.units>availability>pr.phone']);
    s.requestEngine!('voice.menu', OWNER);
    expect(wrote).toBe(0);
  });
});

describe('(ו) 📊 מה היה קורה בחודש האחרון', () => {
  // שלוש הזמנות עם ליל-שבת בחלון (18.9 · 2.10 · 9.10), עם אורחת בעלת-שם — שהשם שלה לעולם לא יופיע
  const db = fixtureDb({
    hostUnits: [U({ id: 'hu1', name: 'צימר הגפן' }), U({ id: 'hu3', name: 'דירת הנחל', type: 'דירה' })],
    hostRecords: [G({ id: 'hg9', name: 'שרה הסודית' })] as never,
    hostBookings: [
      B({ id: 'b1', unitId: 'hu1', checkIn: '2026-09-18', checkOut: '2026-09-20', guestId: 'hg9' }),
      B({ id: 'b2', unitId: 'hu1', checkIn: '2026-10-09', checkOut: '2026-10-11', status: 'in', guestId: 'hg9' }),
      B({ id: 'b3', unitId: 'hu3', checkIn: '2026-10-01', checkOut: '2026-10-04', status: 'done', guestId: 'hg9' }),
    ],
  });
  const impact = (key: string) => {
    const im = impactOf(key, { db, config: BOTH, nowMs: NOW_MS, ask });
    return im ? { headline: im.headline, count: im.count, examples: im.examples } : null;
  };

  it('אפשרות מזוּרעת (זמני-השבת ⇒ כרטיס-השהייה) ⇒ שורה עם המספרים האמיתיים, קטנה מהתוצאה, בלי שם-אורח', () => {
    const s = src({ impact });
    const opts = s.options('hosting', 'pr.zmanim');
    const stay = opts.find((o) => o.key === 'pr.zmanim>times.shabbat>host.stay')!;
    expect(stay.impact?.count).toBe(3);
    expect(stay.impact?.headline).toContain('ב-30 הימים האחרונים היו 3 הזמנות עם שבת');
    const out = renderToStaticMarkup(createElement(PlugStep, { picked: s.parts().find((p) => p.id === 'pr.zmanim')!, options: opts, future: [], canEdit: true, onConnect: noop, onDisconnect: noop }));
    expect(out).toContain(IMPACT_TITLE);
    expect(out).toContain('data-impact="pr.zmanim&gt;times.shabbat&gt;host.stay"');
    expect(out).toContain('היו 3 הזמנות עם שבת');
    expect(out).toContain('צימר הגפן');
    expect(out).not.toContain('שרה הסודית');
    // התוצאה לפני השורה (הטקסט הגדול קודם)
    expect(out.indexOf('eb-result')).toBeLessThan(out.indexOf('eb-impact'));
  });

  it('השפעה null ⇒ אין שורה בכלל (לא "אין נתונים", לא 0 מומצא); מקור בלי impact ⇒ ביט-זהה', () => {
    const s = src({ impact: () => null });
    const opts = s.options('hosting', 'pr.zmanim');
    expect(opts.length).toBeGreaterThan(0);
    for (const o of opts) expect(o.impact).toBeNull();
    const picked = s.parts().find((p) => p.id === 'pr.zmanim')!;
    const out = renderToStaticMarkup(createElement(PlugStep, { picked, options: opts, future: [], canEdit: true, onConnect: noop, onDisconnect: noop }));
    expect(out).not.toContain('eb-impact');
    expect(out).not.toContain(IMPACT_TITLE);
    const plain = src().options('hosting', 'pr.zmanim');
    for (const o of plain) expect('impact' in o).toBe(false);
    // ארגון בלי שום הזמנה ⇒ null אמיתי מהמנוע
    expect(impactOf('pr.zmanim>times.shabbat>host.stay', { db: fixtureDb({ hostBookings: [] }), config: BOTH, nowMs: NOW_MS, ask })).toBeNull();
  });

  it('מדד שזורק לא מפיל את המסך ⇒ null', () => {
    const s = src({ impact: () => { throw new Error('x'); } });
    for (const o of s.options('hosting', 'pr.zmanim')) expect(o.impact).toBeNull();
  });
});

describe('(ז) הגנות-מקור — הבנדל-הראשי והעצלות', () => {
  const RAW: Record<string, string> = import.meta.glob(['/src/**/*.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const prod = Object.entries(RAW).filter(([p]) => !p.includes('__tests__') && !p.includes('.test.'));
  const MAIN = ['/src/App.tsx', '/src/main.tsx', '/src/store/useApp.ts', '/src/store/persist.ts', '/src/store/cloudSync.ts'];

  it('הבנדל-הראשי לא מזכיר את המתאם / מנוע-המסלול / מנוע-ההשפעה', () => {
    for (const p of MAIN) {
      const s = RAW[p];
      expect(s, p).toBeTypeOf('string');
      expect(s!, p).not.toMatch(/goal\/routeAdapter|engineroute|enginebox\/impact/);
    }
  });

  it('המתאם נטען רק ב-import() מתוך הכניסה העצלה; מנוע-המסלול רק דרך המתאם; ההשפעה רק בכניסה', () => {
    expect(prod.length).toBeGreaterThan(100);
    for (const [path, s] of prod) {
      const code = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (/['"][^'"]*engineroute['"/]/.test(code)) expect(path, 'engineroute').toMatch(/\/lib\/(engineroute|enginebox\/goal)\//);
      if (/import\(\s*['"][^'"]*goal\/routeAdapter['"]\s*\)/.test(code)) expect(path).toBe('/src/components/enginebox/EngineBoxEntry.tsx');
    }
    expect(entrySrc).toContain("import('../../lib/enginebox/goal/routeAdapter')");
  });

  it('rankByRecipes רדום — אין מקור-ספירות (דורש שרת/מתכוני-ענן), לא מומצאים נתונים', () => {
    for (const [path, s] of prod) {
      if (path.includes('/lib/engineroute/')) continue;
      expect(s.includes('rankByRecipes'), path).toBe(false);
    }
  });
});
