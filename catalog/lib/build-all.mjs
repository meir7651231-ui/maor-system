/** קורא את המקורות וההתנהגות מהדיסק ומחזיר {נתיב: טקסט} לכל קובצי-הקטלוג המשותפים. */
import fs from 'node:fs';
import path from 'node:path';
import { buildIndex, indexText, verbsJson, verbsMd, alphabetMd } from './build-index.mjs';

export function readDir(dir) {
  if (!fs.existsSync(dir)) return {};
  const out = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) out[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return out;
}

export function buildAll(root, atomLaws) {
  const sources = readDir(path.join(root, 'catalog/sources'));
  const behaviors = readDir(path.join(root, 'catalog/behavior'));
  const vj = verbsJson(atomLaws);
  return {
    'catalog/index.json': indexText(buildIndex(sources, behaviors)),
    'catalog/verbs.json': JSON.stringify(vj, null, 1) + '\n',
    'catalog/verbs.md': verbsMd(vj),
    'catalog/alphabet.md': alphabetMd(sources, behaviors),
  };
}
