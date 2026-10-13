/**
 * 🧩 ארגז המנועים — המסך מול התפר, עם מקור-דוגמה (fixtures) בלבד.
 * אידיום-הפרויקט: renderToStaticMarkup לרינדור, והפעלת onClick ישירה על עץ-האלמנטים
 * של רכיבי-הצעדים הטהורים (אין testing-library בריפו — לא הוספנו תלות).
 */
import { describe, expect, it } from 'vitest';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  EMPTY_SOURCE_TEXT,
  EngineBoxBody,
  EngineBoxScreen,
  FutureList,
  NO_FIT_TEXT,
  OptionRow,
  PickStep,
  PlugStep,
  StartStep,
} from '../EngineBoxScreen';
import { Btn } from '../../ui';
import { linksLabel, pickableParts, resolveStart } from '../model';
import { fixtureSource, P_HOST, PRODUCT } from './fixtures';

const html = (el: ReactElement) => renderToStaticMarkup(el);

/** כל האלמנטים בעץ; רכיבי-פונקציה טהורים (חוץ מ-Btn, שמזוהה כמות-שהוא) נפרשים. */
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
const btnByText = (tree: ReactNode, text: string) =>
  walk(tree).find((e) => e.type === Btn && (e.props as { children: ReactNode }).children === text) as
    | ReactElement<{ onClick: () => void }>
    | undefined;

describe('צעד 1 · במה מתחילים?', () => {
  it('מציג את המוצרים ואת "או ממנוע אחד" עם כל המנועים', () => {
    const src = fixtureSource();
    const out = html(createElement(EngineBoxBody, { source: src }));
    expect(out).toContain('במה מתחילים?');
    expect(out).toContain('data-step="start"');
    expect(out).toContain('data-start="parnasa"');
    expect(out).toContain('או ממנוע אחד');
    expect(out).toContain('data-start="lone"');
  });

  it('לחיצה על מוצר מעבירה את המזהה שלו', () => {
    const seen: string[] = [];
    const tree = StartStep({ products: [PRODUCT], parts: [P_HOST], onStart: (id) => seen.push(id) });
    for (const e of walk(tree)) {
      const p = e.props as { 'data-start'?: string; onClick?: () => void };
      if (p['data-start'] && p.onClick) p.onClick();
    }
    expect(seen).toEqual(['parnasa', 'host']);
  });
});

describe('צעד 2 · איזה מנוע להוסיף?', () => {
  it('מנועי-ההתחלה עצמם לא מוצעים', () => {
    const src = fixtureSource();
    const start = resolveStart(src, 'parnasa')!;
    expect(pickableParts(src, start).map((p) => p.id)).toEqual(['host', 'line', 'lone']);
    const out = html(createElement(EngineBoxBody, { source: src, initial: { start: 'parnasa' } }));
    expect(out).toContain('איזה מנוע להוסיף?');
    expect(out).toContain('data-pick="host"');
    expect(out).not.toContain('data-pick="dir"');
    expect(out).not.toContain('data-pick="board"');
    // צ׳יפ הכלי ושורת "מה הוא עושה"
    expect(out).toContain('אירוח משפחתי');
    expect(out).toContain('יחידות פנויות ושיבוץ אורחים');
  });

  it('התחלה ממנוע בודד — רק הוא מוחרג', () => {
    const src = fixtureSource();
    const start = resolveStart(src, 'host')!;
    expect(start.kind).toBe('part');
    expect(pickableParts(src, start).map((p) => p.id)).toEqual(['dir', 'board', 'line', 'lone']);
  });

  it('כותרת: שם ההתחלה + כמה חיבורים יש עכשיו + חזרה', () => {
    const out = html(createElement(EngineBoxBody, { source: fixtureSource(), initial: { start: 'parnasa' } }));
    expect(out).toContain('פרנסה׳לע');
    expect(out).toContain('חיבור אחד עכשיו');
    expect(out).toContain('התחלה אחרת');
    expect(linksLabel(0)).toBe('עוד אין חיבורים');
    expect(linksLabel(3)).toBe('3 חיבורים');
  });
});

describe('צעד 3 · איפה אפשר לחבר?', () => {
  it('שורה לכל מקום-חיבור: נותן/מקבל, צ׳יפ-התקע והתוצאה', () => {
    const out = html(createElement(EngineBoxBody, { source: fixtureSource(), initial: { start: 'parnasa', picked: 'host' } }));
    expect(out).toContain('data-step="plug"');
    expect(out).toContain('הלוח מראה איפה יש מקום לישון הלילה');
    expect(out).toContain('המארח רואה חשמלאי זמין ליד היחידה');
    expect(out).toContain('נותן');
    expect(out).toContain('מקבל');
    expect(out).toContain('יחידות פנויות');
    expect(out).toContain('מנוע אחר');
    // מחובר ⇒ "✓ מחובר" + "נתק"; לא-מחובר ⇒ "חבר"
    expect(out).toContain('✓ מחובר');
    expect(out).toContain('>נתק<');
    expect(out).toContain('>חבר<');
  });

  it('חבר/נתק נקראים עם המפתח הנכון', () => {
    const src = fixtureSource();
    const opts = src.options('parnasa', 'host');
    const calls: string[] = [];
    const rowFree = OptionRow({ option: opts[1], canEdit: true, onConnect: (k) => calls.push('c:' + k), onDisconnect: (k) => calls.push('d:' + k) });
    btnByText(rowFree, 'חבר')!.props.onClick();
    const rowLinked = OptionRow({ option: opts[0], canEdit: true, onConnect: (k) => calls.push('c:' + k), onDisconnect: (k) => calls.push('d:' + k) });
    expect(btnByText(rowLinked, 'חבר')).toBeUndefined();
    btnByText(rowLinked, 'נתק')!.props.onClick();
    expect(calls).toEqual(['c:dir>host', 'd:host>board']);
  });

  it('קריאה בלבד (canEdit=false) — אין כפתורים בכלל', () => {
    const out = html(createElement(EngineBoxBody, { source: fixtureSource({ canEdit: false }), initial: { start: 'parnasa', picked: 'host' } }));
    expect(out).toContain('הלוח מראה איפה יש מקום לישון הלילה');
    expect(out).not.toContain('>חבר<');
    expect(out).not.toContain('>נתק<');
    const opts = fixtureSource().options('parnasa', 'host');
    const row = OptionRow({ option: opts[1], canEdit: false, onConnect: () => {}, onDisconnect: () => {} });
    expect(walk(row).some((e) => e.type === Btn)).toBe(false);
  });

  it('אין התאמה ⇒ "המנוע הזה עוד לא מתחבר למוצר הזה"', () => {
    const out = html(createElement(EngineBoxBody, { source: fixtureSource(), initial: { start: 'parnasa', picked: 'lone' } }));
    expect(out).toContain(NO_FIT_TEXT);
    const tree = PlugStep({ picked: P_HOST, options: [], future: [], canEdit: true, onConnect: () => {}, onDisconnect: () => {} });
    expect(html(tree)).toContain(NO_FIT_TEXT);
  });

  it('"בקרוב" — רשימה נפרדת, מסומנת "עוד לא זמין", בלי שום כפתור', () => {
    const src = fixtureSource();
    const items = src.future('parnasa', 'host');
    const out = html(FutureList({ items })!);
    expect(out).toContain('בקרוב');
    expect(out).toContain('עוד לא זמין');
    expect(out).toContain('דירוג מארחים במדריך');
    expect(out).toContain('aria-disabled="true"');
    expect(out).not.toContain('<button');
    expect(walk(FutureList({ items })).some((e) => typeof (e.props as { onClick?: unknown }).onClick === 'function')).toBe(false);
    // נפרד מרשימת-החיבורים: התוצאה העתידית לא בתוך eb-options
    const full = html(createElement(EngineBoxBody, { source: src, initial: { start: 'parnasa', picked: 'host' } }));
    const optionsPart = full.slice(full.indexOf('eb-options'), full.indexOf('eb-future'));
    expect(optionsPart).not.toContain('דירוג מארחים במדריך');
    expect(FutureList({ items: [] })).toBeNull();
  });
});

describe('מצבים ריקים', () => {
  it('source=null ⇒ "הארגז בהרכבה — עוד מעט" (ובלי שום צעד)', () => {
    const out = html(createElement(EngineBoxScreen, { source: null, onClose: () => {} }));
    expect(out).toContain(EMPTY_SOURCE_TEXT);
    expect(out).toContain('ארגז המנועים');
    expect(out).not.toContain('data-step');
  });

  it('ארגז ריק ⇒ מצב-ריק כן גם בצעד 1', () => {
    const out = html(createElement(EngineBoxBody, { source: fixtureSource({ empty: true }) }));
    expect(out).toContain(EMPTY_SOURCE_TEXT);
  });

  it('אין מנועים להוסיף ⇒ הודעה ברורה', () => {
    expect(html(PickStep({ parts: [], onPick: () => {} }))).toContain('אין עוד מנועים בארגז להוסיף');
  });
});
