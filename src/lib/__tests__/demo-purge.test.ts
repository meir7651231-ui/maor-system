/**
 * ratchet — 🧹 הסרת נתוני-הדמו בלבד (בקשת-בעלים 14.9 "איפה אני מאפס את הנתונים דמו שנכנסו"):
 * הדמו נטען במכשיר-ענן לפני המשיכה ומוזג לנתונים האמיתיים; "איפוס" מוחק הכול (גם בענן).
 * planDemoPurge מסיר רק מזהים שבקובץ-הדמו; הסטור מטביע מצבות; ה-UI בסעיף-האיפוס; DemoDrop
 * מוסתר בארגון-ענן.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { demoIdSets, planDemoPurge, purgeSummary } from '../demoPurge';
import { emptyDb } from '../../types/domain';
import type { Db, Family, Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const demo = JSON.parse(readFileSync(new URL('../../../public/demo.json', import.meta.url), 'utf8')) as Partial<Db>;
const fam = (id: string): Family => ({ ...(demo.families![0] as Family), id, name: 'אמיתי ' + id });
const sup = (id: string): Supporter => ({ ...(demo.supporters![0] as Supporter), id, name: 'תורם ' + id });

describe('planDemoPurge — טהור', () => {
  it('מזהי-הדמו נאספים מכל אוסף-מערך-עם-id בקובץ (60 משפחות · 15 תורמים · 150 שיבוצים…)', () => {
    const sets = demoIdSets(demo);
    expect(sets.families.size).toBe(60);
    expect(sets.supporters.size).toBe(15);
    expect(sets.enrollments.size).toBe(150);
    expect(sets.families.has('f128')).toBe(true);
    expect(sets.supporters.has('sp639')).toBe(true);
  });
  it('מסיר רק רשומות-דמו; רשומות אמיתיות (מזהה אחר) נשארות ביט-זהות; המונים לא נגעים', () => {
    const db: Db = { ...emptyDb(), families: [fam('f-real-1'), demo.families![0] as Family, demo.families![1] as Family], supporters: [sup('sp-real'), demo.supporters![0] as Supporter], receiptSeq: 77 };
    const plan = planDemoPurge(db, demo);
    expect(plan.total).toBe(3);
    expect(plan.removed).toEqual({ families: 2, supporters: 1 });
    expect(plan.next.families.map((f) => f.id)).toEqual(['f-real-1']);
    expect(plan.next.supporters.map((s) => s.id)).toEqual(['sp-real']);
    expect(plan.next.receiptSeq).toBe(77);
    expect(plan.next.families[0]).toBe(db.families[0]); // אותו אובייקט — אפס נגיעה
  });
  it('מאגר בלי דמו ⇒ total 0 ואותו db; סיכום בעברית', () => {
    const db: Db = { ...emptyDb(), families: [fam('x')] };
    const plan = planDemoPurge(db, demo);
    expect(plan.total).toBe(0);
    expect(plan.next.families).toBe(db.families);
    expect(purgeSummary({ families: 2, supporters: 1 })).toBe('משפחות 2 · תורמים 1');
  });
});

describe('purgeDemoData — סטור', () => {
  beforeEach(() => {
    useApp.getState().setDb(() => ({ ...emptyDb(), families: [fam('real'), demo.families![0] as Family], supporters: [demo.supporters![0] as Supporter] }));
  });
  it('מסיר, מחזיר מונים, ומטביע מצבות-מחיקה לרשומות שהוסרו', () => {
    const r = useApp.getState().purgeDemoData(demo);
    expect(r.total).toBe(2);
    const db = useApp.getState().db;
    expect(db.families.map((f) => f.id)).toEqual(['real']);
    expect(db.supporters.length).toBe(0);
    const ids = (db.delLog ?? []).map((d) => d.id);
    expect(ids).toContain('f128');
    expect(ids).toContain('sp639');
  });
});

describe('הגנות-מקור', () => {
  it('הסטור: שער-מנהל בענן + withRemovalTombstones + לוג', () => {
    const s = src('../../store/useApp.ts');
    const i = s.indexOf('purgeDemoData(demo) {');
    expect(i).toBeGreaterThan(0);
    const body = s.slice(i, i + 1200);
    expect(body).toContain('isAdminAuthority(get().config, cl.user?.email, !!cl.isManager)');
    expect(body).toContain('set({ db: withRemovalTombstones(prev, plan.next) });');
    expect(body).toContain("logAudit('🧹 הסרת נתוני-דמו'");
  });
  it('הגדרות: בלוק-ההסרה בסעיף-האיפוס, בדיקה לפני הסרה, שתי לחיצות', () => {
    const s = src('../../components/settings/SettingsView.tsx');
    expect(s).toContain('<DemoPurgeBlock />');
    expect(s).toContain('🔍 בדיקה — כמה רשומות-דמו יש במאגר?');
    expect(s).toContain("if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3500); return; }");
    expect(s).toContain('purgeDemoData(demo!);');
  });
  it('App: כפתור-הדמו מוסתר בארגון-ענן (יש firebase ולא ?org=demo)', () => {
    const s = src('../../App.tsx');
    expect(s).toContain("famCount === 0 && !(config.firebase && config.slug !== 'demo') && <DemoDrop />");
  });
});
