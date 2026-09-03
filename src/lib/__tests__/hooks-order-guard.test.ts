/**
 * ratchet — נחיל ב׳ (3.9.2026): hook אחרי return-מוקדם = React #300 ("Rendered more hooks…").
 * נתפס פעמיים באותו סבב (FamiliesView useMemo אחרי `if (selected) return`; AuditTrailSection
 * useApp אחרי featureOn-return) — הקריס פתיחת-כרטיס-משפחה ב-launch-readiness.
 * היוריסטיקה: בגוף-קומפוננטה (indent 2), `return` בשורה ברמת-2 שקודם לקריאת-hook ברמת-2.
 * גס במכוון (אפס false-positives על העץ הנוכחי); אם ייתפס מקרה-לגיטימי — לתקן את הקוד, לא להרפות.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function walk(d: string, out: string[] = []): string[] {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) {
      if (!p.includes('__tests__')) walk(p, out);
    } else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

export function hooksAfterEarlyReturn(files: string[]): string[] {
  const hits: string[] = [];
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').split('\n');
    let inFn = false;
    let sawReturn = -1;
    let name = '';
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      const m =
        L.match(/^(export\s+)?(default\s+)?function\s+([A-Z]\w*)\s*\(/) ||
        L.match(/^(export\s+)?const\s+([A-Z]\w*)\s*(:[^=]*)?=\s*(React\.memo\()?\(?\s*(\{|\w+)/);
      if (m) {
        inFn = true;
        sawReturn = -1;
        name = m[3] || m[2];
        continue;
      }
      if (inFn && L.startsWith('}')) {
        inFn = false;
        continue;
      }
      if (!inFn) continue;
      if (/^ {2}(if\s*\(.*\)\s*)?return\b/.test(L) && !/^ {2}return \(/.test(L) && !/^ {2}return </.test(L)) {
        if (sawReturn < 0) sawReturn = i;
      }
      const hook = /^ {2}(const|let|var)?\s*[[{]?[\w\s,[\]{}:]*=?\s*use[A-Z]\w*\(/.test(L) || /^ {2}use[A-Z]\w*\(/.test(L);
      if (sawReturn >= 0 && hook) hits.push(`${f.replace(ROOT + '/', '')}:${i + 1} hook after early return at line ${sawReturn + 1} (${name})`);
    }
  }
  return hits;
}

describe('⚛️ hooks-order — אין hook אחרי return מוקדם בקומפוננטות', () => {
  it('src/**/*.tsx נקי (React #300)', () => {
    const hits = hooksAfterEarlyReturn(walk(join(ROOT, 'src')));
    expect(hits).toEqual([]);
  });
});
