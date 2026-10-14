#!/usr/bin/env node
/**
 * 🎯 Dart — מועמדים פנימיים, **סטטי בלבד** (INNER, 14.10.2026) ⇒ catalog/inner/dart-candidates.json.
 *
 * אין Dart SDK בסביבה, ולכן חלקי ה-Dart של הקטלוג לא רצים — ואי-אפשר להוכיח את הערכים-שבתוכם. כאן רק **רשימה**:
 * בכל קובץ Dart שיש לו חלק בקטלוג, כל `final|var|const|double|int|num|bool|String x = <ביטוי>;` בתוך גוף (מוזח),
 * שהביטוי שלו הוא חישוב (חשבון · math.* · השוואה · תנאי). לכל אחד: קובץ · שורה · שם · סוג-הפעולה בשורש.
 * `proven: false` לכולם — ביושר. לא נכתב טקסט-הביטוי (פרטיות + רעש), רק הצורה.
 *   node catalog/inner/scripts/dart.mjs   (שכפולים ב-../catsrc)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SRC = path.resolve(ROOT, process.env.CATALOG_SRC || '../catsrc');
const SOURCES = { generator: 'generator', buildsmart: 'buildsmart' };
const DECL = /^(\s+)(?:final|var|const|late\s+final|double|int|num|bool|String)\s+(?:[A-Za-z_<>?, ]+\s+)?([A-Za-z_]\w*)\s*=\s*(.+);\s*$/;

/** סוג-הפעולה בשורש ביטוי Dart (גס, לפי סימנים). */
export function dartOp(e) {
  if (/^\(?[\w.]+\)?$/.test(e) || /^['"]/.test(e) || /^-?\d+(\.\d+)?$/.test(e)) return null;
  if (/\?[^?.].*:/.test(e) && !/\?\?/.test(e)) return 'conditional';
  if (/\b(math\.)?(sin|cos)\(/.test(e)) return 'wave';
  if (/\b(math\.)?(sqrt|pow|exp|log|atan2|asin|acos|atan)\(/.test(e)) return 'math';
  if (/\.(clamp)\(/.test(e) || /\b(math\.)?(max|min)\(/.test(e)) return 'clamp';
  if (/[<>]=?|==|!=/.test(e.replace(/<[A-Za-z, ]+>/g, ''))) return 'compare';
  if (/\.(round|floor|ceil|toInt|truncate)\(/.test(e)) return 'round';
  if (/%|~\//.test(e)) return 'cycle';
  if (/[*/]/.test(e)) return 'scale';
  if (/\s[+-]\s/.test(e)) return 'add';
  if (/\.(map|where|fold|reduce|any|every|firstWhere|length)\b/.test(e)) return 'list';
  return null;
}

const out = { version: 1, generatedAt: null, proven: false, note: 'Dart: אין SDK בסביבה — מועמדים סטטיים בלבד, אף אחד לא הוכח בהרצה.', sources: {} };
for (const [source, dir] of Object.entries(SOURCES)) {
  const base = path.join(SRC, dir);
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/sources', source + '.json'), 'utf8'));
  const files = [...new Set(doc.parts.filter((p) => p.lang === 'dart').map((p) => p.path))].sort();
  if (!fs.existsSync(base)) { out.sources[source] = { skipped: 'no-clone', dartFiles: files.length }; continue; }
  const cands = []; const ops = {};
  for (const rel of files) {
    const abs = path.join(base, rel);
    if (!fs.existsSync(abs)) continue;
    const lines = fs.readFileSync(abs, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const m = DECL.exec(line);
      if (!m) return;
      const op = dartOp(m[3].trim());
      if (!op) return;
      ops[op] = (ops[op] ?? 0) + 1;
      cands.push([rel, i + 1, m[2], op]);
    });
  }
  out.sources[source] = { dartFiles: files.length, candidates: cands.length, ops: Object.fromEntries(Object.entries(ops).sort((a, b) => b[1] - a[1])), list: cands };
  console.log(`${source}: ${files.length} קובצי Dart · ${cands.length} מועמדים (proven: false)`);
}
fs.writeFileSync(path.join(ROOT, 'catalog/inner/dart-candidates.json'), JSON.stringify(out, null, 1).replace(/\[\n\s+("[^"]*"),\n\s+(\d+),\n\s+("[^"]*"),\n\s+("[^"]*")\n\s+\]/g, '[$1, $2, $3, $4]') + '\n');
