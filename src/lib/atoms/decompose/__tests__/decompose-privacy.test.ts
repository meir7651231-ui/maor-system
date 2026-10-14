/**
 * 🔒 המפרק · פרטיות — כלל קשיח (ATOMS-DECOMPOSE, 14.10.2026).
 * מריצים **כל** מקום שנוצר × כל חלק מתאים × כמה צירופי-פרטים, על נתוני-הדמו ועל ארגון-האירוח/פרנסה׳לע, ואוספים כל מילה
 * שהתצוגה מראה. אף אחת מהן לא יכולה להיות: שם של משפחה/הורה/ילד/תורם/מורה/מתנדב/רכז/אורח/מבקש/מפרסם, טלפון, מייל, ת״ז,
 * מידע רפואי, הערות או טקסט חופשי. וגם: מצב-צנעה מסתיר את מקומות המשפחות ומקבלי-הסיוע, והמילים האסורות של הבעלים לא מופיעות.
 */
import { describe, expect, it } from 'vitest';
import { ATOM_IDS } from '../../contract';
import { GENERATED_ENGINES } from '../../engines/generated';
import { genericPreviewOf, type GenericCtx } from '../genericPreview';
import { hasForbidden } from '../words';
import { DEMO_DB, meterCtxs } from './meterFixture';
import { QUIET_TEXT, QUIET_WORDS, RAW_TEXTS, REQUESTERS, richDb } from '../../__tests__/previewsFixture';

const PARAM_VARIANTS: Record<string, number | string>[] = [{}, { count: 5 }, { by: 'item' }, { by: 'size', size: 7 }, { maxTypos: 0 }, { minLength: 1, maxGap: 2 }];

function allOutput(ctxs: readonly GenericCtx[]): string[] {
  const out: string[] = [];
  for (const e of GENERATED_ENGINES)
    for (const pl of e.places)
      for (const atom of ATOM_IDS) {
        if (!pl.results[atom]) continue;
        for (const ctx of ctxs)
          for (const params of PARAM_VARIANTS) {
            const pv = genericPreviewOf(pl, atom, params, ctx);
            if (pv) out.push(pv.title, ...pv.lines);
          }
      }
  return out;
}

/** כל הסודות שבנתונים: שמות אנשים, פרטי-קשר, ת״ז, בריאות, הערות וטקסט חופשי. */
function secretsOf(db: Record<string, unknown>): string[] {
  const s = new Set<string>();
  const add = (v: unknown): void => {
    if (typeof v === 'string' && v.trim().length >= 3) s.add(v.trim());
  };
  const PERSON_OR_FREE = /^(name|first|father|mother|phone\d?|email|idNum|fatherId|motherId|health|notes?|address|text|desc|description|body|reason|advertiser|headline|forWho|designation|nextNote|answeredNote|title)$/;
  const walk = (v: unknown, inPerson: boolean, depth: number): void => {
    if (depth > 6 || !v || typeof v !== 'object') return;
    if (Array.isArray(v)) return v.forEach((x) => walk(x, inPerson, depth + 1));
    const o = v as Record<string, unknown>;
    const person = inPerson || 'phone' in o || 'email' in o || 'first' in o || 'idNum' in o;
    for (const [k, x] of Object.entries(o)) {
      if (typeof x === 'string' && (PERSON_OR_FREE.test(k) || (person && /name/i.test(k)))) add(x);
      else walk(x, person, depth + 1);
    }
  };
  for (const key of ['families', 'supporters', 'teachers', 'volunteers', 'tzCoordinators', 'hostRecords', 'prRequests', 'prAds', 'prListings', 'events', 'deliveries', 'tasks'])
    walk(db[key], false, 0);
  return [...s];
}

/** שמות שמותר לראות (תוויות של דברים, לא של אנשים): חוגים, יחידות, קטגוריות. */
function allowed(db: Record<string, unknown>): Set<string> {
  const ok = new Set<string>();
  for (const c of (db.courses as { name?: string }[]) ?? []) if (c.name) ok.add(c.name);
  for (const u of (db.hostUnits as { name?: string }[]) ?? []) if (u.name) ok.add(u.name);
  return ok;
}

describe('🔒 המפרק — אין פרטים אישיים בשום תצוגה', () => {
  const ctxs = meterCtxs();
  const text = allOutput(ctxs).join('\n');

  it('יש מה לבדוק (מאות שורות)', () => {
    expect(text.split('\n').length).toBeGreaterThan(300);
  });

  it.each([
    ['הדמו', DEMO_DB as unknown as Record<string, unknown>],
    ['האירוח ופרנסה׳לע', richDb() as unknown as Record<string, unknown>],
  ])('%s: אף שם, טלפון, מייל, ת״ז או טקסט חופשי', (_n, db) => {
    const ok = allowed(db);
    // מילה שלמה (לא חלק ממילה: "רות" בתוך "בתורות" הוא לא השם רות)
    const esc = (x: string): string => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const leaks = secretsOf(db).filter((sec) => !ok.has(sec) && new RegExp('(^|[^א-ת\\w])' + esc(sec) + '($|[^א-ת\\w])').test(text));
    expect(leaks).toEqual([]);
  });

  it('הבקשה השקטה, המבקשים והטקסטים הגולמיים של הבקשות — לא מופיעים', () => {
    for (const w of [QUIET_TEXT, ...QUIET_WORDS, ...REQUESTERS, ...RAW_TEXTS]) expect(text).not.toContain(w);
  });

  it('אין צורה של טלפון, מייל או ת״ז', () => {
    expect(text).not.toMatch(/0\d{1,2}-?\d{7}/);
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/\b\d{9}\b/);
  });

  it('מילה מטקסט מוצגת רק במקום שמסומן echo — ואף מקום של רשומה עם טלפון לא מסומן', () => {
    for (const e of GENERATED_ENGINES)
      for (const pl of e.places) {
        if (pl.kind !== 'text' || !pl.spec.echo) continue;
        expect(pl.spec.path).toMatch(/^(name|title|cat|category|label|mealName|semester|sector|type|unit)$/);
        expect(['families', 'supporters', 'teachers', 'volunteers', 'tzCoordinators', 'prRequests', 'prListings', 'prAds', 'events']).not.toContain(pl.spec.entity);
        expect(pl.spec.where?.kind).not.toBe('guest');
        expect(pl.spec.where?.kind).not.toBe('staff');
      }
  });

  it('אין מקום על שדה רגיש (טלפון/מייל/ת״ז/בריאות/כתובת)', () => {
    for (const e of GENERATED_ENGINES)
      for (const pl of e.places) {
        const all = [pl.spec.path, pl.spec.to ?? '', pl.spec.groupBy ?? ''].join('.');
        expect(all).not.toMatch(/(^|\.|\[\])(phone\d?|phones|email|idNum|fatherId|motherId|health|address|whatsapp)(\.|\[|$)/);
      }
  });

  it('מצב-צנעה: מקומות המשפחות ומקבלי-הסיוע מחזירים null', () => {
    const priv = meterCtxs(true);
    let checked = 0;
    for (const e of GENERATED_ENGINES)
      for (const pl of e.places) {
        if (!pl.personal) continue;
        for (const atom of ATOM_IDS) {
          if (!pl.results[atom]) continue;
          for (const ctx of priv) expect(genericPreviewOf(pl, atom, {}, ctx)).toBeNull();
          checked++;
        }
      }
    expect(checked).toBeGreaterThan(20);
    const fam = GENERATED_ENGINES.find((e) => e.id === 'families')!;
    expect(fam.places.every((p) => p.personal)).toBe(true);
  });
});

describe('🗣️ המפרק — כלל-השמות של הבעלים (בלי מיזוג/ניתוב/הסלמה/סלחני/יחסי/אטום/רצף/טווח)', () => {
  it('שמות המנועים, החלקים, המקומות ומשפטי-התוצאה', () => {
    const bad: string[] = [];
    for (const e of GENERATED_ENGINES) {
      for (const t of [e.name, e.computes]) if (hasForbidden(t)) bad.push(e.id + ': ' + t);
      for (const p of e.parts) for (const t of [p.name, p.computes]) if (hasForbidden(t)) bad.push(p.fn + ': ' + t);
      for (const p of e.places) for (const t of [p.name, ...Object.values(p.results)]) if (t && hasForbidden(t)) bad.push(p.id + ': ' + t);
      for (const p of e.fnPlaces) if (hasForbidden(p.name)) bad.push(p.id + ': ' + p.name);
    }
    expect(bad).toEqual([]);
  });

  it('כל שורות התצוגה', () => {
    const lines = allOutput(meterCtxs()).filter((l) => hasForbidden(l));
    expect(lines).toEqual([]);
  });
});
