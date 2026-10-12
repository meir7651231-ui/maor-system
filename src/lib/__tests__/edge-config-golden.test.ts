/**
 * ratchet (ד) — 🌉 מצב-מסונן (12.10.2026): הוספת `edgeProxy` ל-normalizeConfig/resolveOrgConfig
 * חייבת להשאיר כל קונפיג קיים **ביט-זהה**. ה-golden (fixtures/edge-config-golden.json) הוקלט
 * **לפני** השינוי, על הקוד של 5c7ebbb: sha256(קלט) + sha256(JSON.stringify(פלט)) לכל פריט:
 *   • כל public/**\/config.json (השורש · הלקוח-החי · הדמו) דרך normalizeConfig
 *   • DEFAULT_CONFIG
 *   • 13 חבילות-הוורטיקל × 4 בסיסים (DEFAULT + 3 הסטטיים-הגולמיים) דרך normalizeConfig
 *   • resolveOrgConfig(סטטי-מנורמל, חבילה-כמסמך-ענן) — 3 × 13
 * פריט שהקלט שלו השתנה מאז (עריכת-קונפיג/חבילה לגיטימית) — מדולג: הראיה היא על הקוד, לא על
 * הנתונים; אבל לפחות מחצית הפריטים חייבים להיבדק. הקלטה-מחדש (רק בכוונה): EDGE_GOLDEN_RECORD=1.
 */
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';
import { normalizeConfig, resolveOrgConfig } from '../config';
import { VERTICAL_PACKS, applyVerticalPack } from '../verticalPacks';

const ROOT = resolve(__dirname, '../../..');
const GOLDEN = resolve(__dirname, 'fixtures/edge-config-golden.json');

type Golden = Record<string, { in: string; out: string }>;

const h = (v: unknown) => createHash('sha256').update(JSON.stringify(v) ?? 'undefined').digest('hex').slice(0, 20);

function staticConfigs(): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'config.json') out.push([relative(ROOT, p), JSON.parse(readFileSync(p, 'utf8')) as unknown]);
    }
  };
  walk(join(ROOT, 'public'));
  return out.sort(([a], [b]) => (a < b ? -1 : 1));
}

function corpus(): Array<{ name: string; input: unknown; output: () => unknown }> {
  const items: Array<{ name: string; input: unknown; output: () => unknown }> = [];
  const statics = staticConfigs();
  for (const [p, raw] of statics) items.push({ name: 'static:' + p, input: raw, output: () => normalizeConfig(raw) });
  items.push({ name: 'default', input: DEFAULT_CONFIG, output: () => normalizeConfig(DEFAULT_CONFIG) });
  // החבילה מוחלת על הקלט הגולמי — כך ה-hash-של-הקלט לא תלוי ב-normalizeConfig הנבדק.
  const bases: Array<[string, OrgConfig]> = [['default', DEFAULT_CONFIG], ...statics.map(([p, raw]) => [p, raw as OrgConfig] as [string, OrgConfig])];
  for (const [bn, base] of bases) {
    for (const pack of VERTICAL_PACKS) {
      const applied = applyVerticalPack(base, pack.id);
      items.push({ name: `pack:${pack.id}@${bn}`, input: applied, output: () => normalizeConfig(applied) });
    }
  }
  for (const [p, raw] of statics) {
    for (const pack of VERTICAL_PACKS) {
      const cloud = applyVerticalPack(DEFAULT_CONFIG, pack.id);
      items.push({
        name: `resolve:${p}+${pack.id}`,
        input: [raw, cloud],
        output: () => resolveOrgConfig(normalizeConfig(raw) as OrgConfig, cloud),
      });
    }
  }
  return items;
}

describe('🌉 edgeProxy — קורפוס-הקונפיגים הקיים מנורמל ביט-זהה (golden לפני-השינוי)', () => {
  it('כל פלט = בדיוק הפלט שהוקלט לפני הוספת edgeProxy', () => {
    const items = corpus();
    if (process.env.EDGE_GOLDEN_RECORD === '1') {
      const rec: Golden = {};
      for (const it of items) rec[it.name] = { in: h(it.input), out: h(it.output()) };
      writeFileSync(GOLDEN, JSON.stringify(rec, null, 1) + '\n');
    }
    expect(existsSync(GOLDEN)).toBe(true);
    const golden = JSON.parse(readFileSync(GOLDEN, 'utf8')) as Golden;
    let checked = 0;
    for (const it of items) {
      const g = golden[it.name];
      if (!g || g.in !== h(it.input)) continue; // הקלט עצמו השתנה ⇒ לא-רלוונטי לראיה על הקוד
      expect(h(it.output()), it.name).toBe(g.out);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(Math.ceil(Object.keys(golden).length / 2));
  });

  it('אף פלט בקורפוס לא נושא edgeProxy (חסר בקלט ⇒ חסר בפלט)', () => {
    for (const it of corpus()) {
      const out = it.output() as Record<string, unknown> | null;
      expect(out && Object.prototype.hasOwnProperty.call(out, 'edgeProxy'), it.name).toBeFalsy();
    }
  });
});
