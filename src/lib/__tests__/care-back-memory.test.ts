/**
 * ratchet — שומר-מסך במעקב-טיפול (בקשת-בעלים 17.9, בהודעה קולית: "שיחזור בדיוק לאותו מקום במקש
 * חזור — גם במעקב טיפול"): (א) הלוח נשאר פתוח + מסנניו נשמרים בחזרה מכרטיס/ממסך אחר; (ב) מסך-השמות
 * חוזר מאליו אחרי כרטיס (לא נסגר בפתיחה), עם אותם מסננים ואותה גלילת-טבלה (useElementScrollMemory).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { _resetScrollMemory, recallScroll, rememberScroll } from '../scrollMemory';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

describe('useElementScrollMemory — מיכל-גלילה פנימי', () => {
  it('מוגדר ומחווט: recall במעלה (double-rAF) + remember בכל גלילה', () => {
    const s = src('../scrollMemory.ts');
    expect(s).toContain('export function useElementScrollMemory<T extends HTMLElement = HTMLDivElement>(key: string)');
    expect(s).toContain("requestAnimationFrame(() => requestAnimationFrame(() => { el.scrollTop = y; }))");
    expect(s).toContain("el.addEventListener('scroll', onScroll, { passive: true })");
    _resetScrollMemory();
    rememberScroll('names.table', 240);
    expect(recallScroll('names.table')).toBe(240);
  });
});

describe('חיווט — לוח-המעקב ומסך-השמות', () => {
  const view = src('../../components/supporters/SupportersView.tsx');
  const board = src('../../components/supporters/AyinBoard.tsx');
  const names = src('../../components/supporters/AyinNamesBoard.tsx');
  it('SupportersView: הלוח ומסך-השמות זכורים; פתיחת-כרטיס ממסך-השמות לא סוגרת אותו', () => {
    expect(view).toContain("useRemembered('sup.ayinBoardOpen', false)");
    expect(view).toContain("useRemembered('sup.ayinNamesOpen', false)");
    const i = view.indexOf('onOpenSupporter={(id) => {');
    const block = view.slice(i, i + 260);
    expect(block).not.toContain('setAyinNamesOpen(false)');
    expect(block).toContain('setSelId(id);');
  });
  it('AyinBoard: filter/sort/region זכורים', () => {
    for (const k of ['filter', 'sort', 'region']) expect(board, k).toMatch(new RegExp(`const \\[${k}, set[A-Za-z]+\\] = useRemembered(<[^\\n]*?>)?\\('ayin\\.${k}'`));
  });
  it('AyinNamesBoard: q/status/stageF/regionF זכורים + ref-גלילה על מיכל-הטבלה', () => {
    for (const k of ['q', 'status', 'stageF', 'regionF']) expect(names, k).toMatch(new RegExp(`const \\[${k}, set[A-Za-z]+\\] = useRemembered(<[^\\n]*?>)?\\('names\\.${k}'`));
    expect(names).toContain("useElementScrollMemory<HTMLDivElement>('names.table')");
    expect(names).toContain("<div ref={namesScrollRef} style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>");
  });
});
