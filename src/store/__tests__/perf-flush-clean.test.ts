/**
 * ⚡ ratchet — ביצועי ההתמדה (12.10.2026): flush ביציאה/הסתרה מדלג כשאין מה לכתוב.
 *
 * המדידה: pagehide/visibilitychange(hidden) קראו ל-flushSaveSync שמסריאל את **כל** המסמך
 * סינכרונית — 34MB אצל הלקוח האמיתי (0.5–0.8s קיפאון בכל מעבר-טאב/מזעור) — גם כשלא השתנה
 * דבר מאז השמירה האחרונה. הכלל: !dirty && db === lastSaved ⇒ דילוג; עריכה ממתינה ⇒ כתיבה
 * סינכרונית כמו היום (ה-flush נשאר רשת-הביטחון של ה-debounce).
 *
 * הבדיקה מדמה window/document לפני טעינת ה-store (המאזינים נרשמים רק כשיש window).
 */
import { describe, expect, it, vi } from 'vitest';
import { emptyDb } from '../../types/domain';
import useAppSrc from '../useApp.ts?raw';

class MemStorage {
  m = new Map<string, string>();
  sets = 0;
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string): void { if (k === 'maor_db') this.sets++; this.m.set(k, String(v)); }
  removeItem(k: string): void { this.m.delete(k); }
  clear(): void { this.m.clear(); }
  key(i: number): string | null { return [...this.m.keys()][i] ?? null; }
  get length(): number { return this.m.size; }
}
const ls = new MemStorage();
const g = globalThis as unknown as Record<string, unknown>;
g.localStorage = ls;
g.sessionStorage = new MemStorage();
const win = new EventTarget();
g.window = win;
g.document = { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} };

describe('⚡ ratchet — flush ביציאה: דילוג כשאין עריכה ממתינה', () => {
  it('pagehide בלי עריכה ⇒ אפס setItem; עם עריכה ⇒ כתיבה סינכרונית; אחרי שמירה-מוצלחת ⇒ שוב דילוג', async () => {
    vi.useFakeTimers();
    const { useApp } = await import('../useApp');
    const fire = () => win.dispatchEvent(new Event('pagehide'));
    // מצב-התחלה: ready בלי עריכה — lastSaved טרם נקבע ⇒ שמרני: כותבים (כמו היום)
    useApp.setState({ ready: true, needDecrypt: false, staleTab: false, db: { ...emptyDb(), orgName: 'טעון' } });
    useApp.getState().setDb({ orgName: 'עריכה-1' }); // dirty
    ls.sets = 0;
    fire();
    expect(ls.sets).toBe(1); // עריכה ממתינה ⇒ נכתב סינכרונית
    // ה-debounce (500ms) שומר ומנקה dirty + lastSaved
    await vi.advanceTimersByTimeAsync(600);
    await vi.advanceTimersByTimeAsync(0);
    expect(useApp.getState().saveOk).toBe(true);
    ls.sets = 0;
    fire();
    fire();
    expect(ls.sets).toBe(0); // אין מה לכתוב — לא מסריאלים 34MB לשווא
    // עריכה חדשה ⇒ שוב כותב
    useApp.getState().setDb({ orgName: 'עריכה-2' });
    fire();
    expect(ls.sets).toBe(1);
    expect(ls.getItem('maor_db')).toContain('עריכה-2');
    vi.useRealTimers();
  });

  it('הגנת-מקור: הדילוג לפני שער-ready/needDecrypt, והשורות המוגנות נשארו', () => {
    expect(useAppSrc).toMatch(/const flush = \(\) => \{[\s\S]{0,600}if \(!dirty && s\.db === lastSaved\) return;[\s\S]{0,300}if \(!s\.ready \|\| s\.needDecrypt\) return;\s*\n\s*if \(!s\.staleTab\) flushSaveSync\(s\.db\);/);
    expect(useAppSrc).toContain('if (ok) lastSaved = saving;');
    expect(useAppSrc).toContain('if (ok && get().db === saving) dirty = false;');
  });
});
