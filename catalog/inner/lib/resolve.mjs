/**
 * 🔓 פותח-הפונקציות · תוכנית-מהדר לריפו (INNER v2, 14.10.2026).
 * כמו makeProgram של הקטלוג, ועוד דבר אחד: ייבוא בתוך הריפו נפתר גם דרך `paths` של ה-tsconfig/jsconfig הקרוב
 * לקובץ (BuildSmart: ‏`@/*` ⇒ ‏`src/*` ב-app/; ‏MMMM: אותו דבר בכל artifact). כל תיקייה עם ה-paths שלה —
 * לכן הפתרון נעשה לפי הקובץ המייבא, לא פעם אחת לכל התוכנית. מיפוי לחבילה (react ⇒ preact/compat) לא נכנס:
 * רק יעדים בתוך הריפו. בלי tsconfig עם paths (אורביט) ⇒ בדיוק makeProgram. טהור-קריאה: לא כותב ולא מריץ.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const BASE_OPTIONS = {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  allowJs: true, checkJs: false, jsx: ts.JsxEmit.Preserve, strict: true, skipLibCheck: true, noEmit: true, resolveJsonModule: true, allowImportingTsExtensions: true,
};

/** paths של קובץ-הגדרות (כולל extends יחסי), עם התיקייה שהם יחסיים אליה. null = אין. */
function pathsOf(file, seen = new Set()) {
  if (seen.has(file) || !fs.existsSync(file)) return null;
  seen.add(file);
  const raw = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, 'utf8')).config ?? {};
  const co = raw.compilerOptions ?? {};
  if (co.paths) {
    const dir = path.dirname(file);
    const base = co.baseUrl ? path.resolve(dir, co.baseUrl) : dir;
    return { paths: co.paths, base };
  }
  for (const ext of [].concat(raw.extends ?? [])) {
    if (typeof ext !== 'string' || !ext.startsWith('.')) continue;
    const f = path.resolve(path.dirname(file), ext.endsWith('.json') ? ext : ext + '.json');
    const got = pathsOf(f, seen);
    if (got) return got;
  }
  return null;
}

/** תוכנית לקבצי-הריפו; root = שורש-הריפו (לא מחפשים הגדרות מעליו). */
export function makeRepoProgram(files, root) {
  const options = { ...BASE_OPTIONS };
  const host = ts.createCompilerHost(options);
  const rootAbs = path.resolve(root);
  const cfgMemo = new Map(); // תיקייה ⇒ {paths, base} | null
  const cfgFor = (dir) => {
    if (cfgMemo.has(dir)) return cfgMemo.get(dir);
    let got = null;
    for (const name of ['tsconfig.json', 'jsconfig.json']) { got = pathsOf(path.join(dir, name)); if (got) break; }
    if (!got && dir !== rootAbs && dir.startsWith(rootAbs + path.sep)) got = cfgFor(path.dirname(dir));
    cfgMemo.set(dir, got);
    return got;
  };
  const optMemo = new Map();
  const optionsFor = (containing) => {
    const cfg = cfgFor(path.dirname(path.resolve(containing)));
    if (!cfg) return options;
    const key = cfg.base + '\0' + JSON.stringify(cfg.paths);
    if (!optMemo.has(key)) {
      // רק יעדים בתוך הריפו (לא node_modules) — מיפוי-חבילות לא משנה את מה שהמהדר רואה היום
      const inRepo = Object.fromEntries(Object.entries(cfg.paths)
        .map(([k, v]) => [k, (Array.isArray(v) ? v : []).filter((t) => !/node_modules/.test(t))])
        .filter(([, v]) => v.length));
      optMemo.set(key, { ...options, paths: inRepo, pathsBasePath: cfg.base });
    }
    return optMemo.get(key);
  };
  const cache = ts.createModuleResolutionCache(host.getCurrentDirectory(), (x) => x, options);
  host.resolveModuleNameLiterals = (lits, containingFile, _ref, _opts, containingSourceFile) =>
    lits.map((lit) => {
      const o = optionsFor(containingFile);
      const mode = ts.getModeForUsageLocation(containingSourceFile, lit, o);
      return ts.resolveModuleName(lit.text, containingFile, o, host, o === options ? cache : undefined, undefined, mode);
    });
  return ts.createProgram(files, options, host);
}
