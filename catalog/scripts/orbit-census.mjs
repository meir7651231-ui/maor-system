#!/usr/bin/env node
/**
 * 📇 מפקד-החלקים של אורביט (CATALOG, 14.10.2026) — כותב את `catalog/sources/orbit.json` לפי `catalog/contract.md`.
 *
 * מקורות (קריאה בלבד, בלי להריץ קוד של האפליקציה):
 *   1. הפלט של המפרק — `src/lib/atoms/engines/generated/*.ts` (17 מנועים · 733 חלקים) ⇒ engine + function.
 *   2. שמונת המנועים הקטנים — `src/lib/atoms/parts/*.ts` (שם והסבר מ-`explain.ts`) ⇒ brick (+ function לשאר הייצוא).
 *   3. שלושת כרטיסי-היד — `src/lib/atoms/engines/{zmanim,whatNeed,bookings}.ts` ⇒ engine + particle.
 *   4. פונקציות טהורות ב-`src/lib/*.ts` שהמפרק לא קורא (תאריך, לוח עברי, כסף, טקסט, חיפוש…) ⇒ function.
 *   5. ספריות הטלפון `telephony/lib/*.mjs` (זמנים, לוח עברי, תפריט) ⇒ function (lang js).
 * החתימות נקראות דרך ה-API של המהדר `typescript`. הדוגמאות — רק מקבצי-בדיקה, ורק אחרי סינון (בלי טלפון/מייל/ת״ז/כתובת/טוקן).
 * השמות: מההערות העבריות בקוד ⇒ צורת-פועל (`verbify`) ⇒ דריסה ידנית מ-`catalog/names/orbit.json`.
 *
 *   node catalog/scripts/orbit-census.mjs           # כותב
 *   node catalog/scripts/orbit-census.mjs --check   # יציאה 1 אם הקובץ לא מעודכן או לא עומד בחוזה
 *   node catalog/scripts/orbit-census.mjs --report  # מדפיס שמות שעדיין לא עברו את כללי-השם
 * דטרמיניסטי: אותו קוד ⇒ אותו קובץ (generatedAt: null; ref = ענף@sha של ה-HEAD רק בכתיבה, ולא נבדק ב---check).
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import * as K from '../../src/lib/atoms/decompose/kinds.ts';
import * as W from '../../src/lib/atoms/decompose/words.ts';
import { ATOM_EXPLAIN, ENGINE_EXPLAIN } from '../../src/lib/atoms/explain.ts';
import { ATOM_CARDS } from '../../src/lib/atoms/cards.ts';
import { ATOM_OUTPUT } from '../../src/lib/atoms/contract.ts';
import { ZMANIM_CARD } from '../../src/lib/atoms/engines/zmanim.ts';
import { WHAT_NEED_CARD } from '../../src/lib/atoms/engines/whatNeed.ts';
import { BOOKINGS_CARD } from '../../src/lib/atoms/engines/bookings.ts';
import { validatePart, validateSource, NAME_VERBS } from '../lib/check.mjs';
import { shapeKindOfType } from '../lib/kind-shape.mjs';
import { byId } from '../self/parts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'catalog/sources/orbit.json');
const NAMES = join(ROOT, 'catalog/names/orbit.json');
const SOURCE = 'orbit';
const rel = (p) => relative(ROOT, p).split('\\').join('/');
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/* ═══════════════ תצורה (גלויה) ═══════════════ */

/** קבצי `src/lib` שנכנסים (אם הם טהורים — נבדק). השאר: ממשק, ענן, אחסון, הצפנה, דפדפן. */
const LIB_FILES = [
  'annualReport', 'bulkContact', 'callerId', 'configPatch', 'courseDaily', 'csvx', 'date-util', 'dedup', 'donationPartition',
  'hebdate', 'hebrew', 'hebrewNumber', 'ics', 'installKit', 'mapsLink', 'monthGrid', 'payLink', 'plannedMatch', 'pricing',
  'projectSchedule', 'search', 'smtpUrl', 'supporterAgg', 'supporterPartition', 'tel', 'templates', 'vcardImport', 'wa', 'warehouse', 'widgetLayout',
];
/** ספריות הטלפון: רק החישוביות (לא קבצים שכותבים קבצים/מריצים/מייצרים XML). */
const TEL_FILES = ['zmanim', 'hebcal', 'routing', 'normalize', 'prompts', 'billing', 'cti', 'channels', 'security', 'validators', 'reminders', 'simulate'];
const IMPURE_IMPORT = /^(react|react-dom|zustand|firebase|idb|three|node:)(\/|$)|\/store\/|\/store$|\.tsx$|\/(cloud|persist|pwa)$/;
const IMPURE_CODE = /\b(document|window|localStorage|sessionStorage|navigator|indexedDB|useApp|process|require)\b\s*[.(]/;
/** גוף שתלוי בשעון או באקראי ⇒ pure:false. */
const CLOCK_CODE = /\bDate\.now\s*\(|\bMath\.random\s*\(|\bnew Date\(\s*\)|\bperformance\.now\s*\(|\bcrypto\./;

/** החלק הראשי של כל מנוע-קטן (brick). */
const BRICK_MAIN = { divide: 'divideSpan', merge: 'mergeRuns', next: 'nextAfter', round: 'roundTo', offset: 'offsetAll', escalate: 'escalationState', rotate: 'fairAssign', fuzzy: 'fuzzyFind' };

/** הסוגים של החלקים הפנימיים בכרטיסי-היד (אין להם חתימה — נקבע ביד, לפי ההערה שליד כל חלק בכרטיס). */
const PARTICLE_KINDS = {
  zmanim: {
    1: ['date', 'number'], 2: ['date', 'number'], 3: ['geo', 'times'], 4: ['geo', 'times'], 5: ['times', 'text'], 6: ['times', 'times'],
    7: ['span', 'sequence'], 8: ['times', 'times'], 9: ['times', 'times'], 10: ['date', 'text'], 11: ['date', 'choice'], 12: ['number', 'text'],
    13: ['sequence', 'sequence'], 14: ['times', 'times'], 15: ['geo', 'bool'],
  },
  whatNeed: {
    1: ['text', 'text'], 2: ['text', 'text'], 3: ['text', 'choice'], 4: ['text', 'list'], 5: ['list', 'sequence'], 6: ['record:listing', 'choice'],
    7: ['record:listing', 'waiting'], 8: ['waiting', 'sequence'], 9: ['text', 'bool'], 10: ['text', 'text'], 11: ['list', 'sequence'], 12: ['record:db', 'list'],
  },
  bookings: {
    1: ['span', 'number'], 2: ['span', 'bool'], 3: ['span', 'bool'], 4: ['span', 'amount'], 5: ['record:hostBooking', 'amount'], 6: ['record:hostBooking', 'choice'],
    7: ['date', 'list'], 8: ['record:hostUnit', 'choice'], 9: ['date', 'text'], 10: ['record:hostBooking', 'waiting'], 11: ['record:hostUnit', 'bool'],
    12: ['span', 'sequence'], 13: ['record:db', 'list'],
  },
};
const CARDS = [
  ['zmanim', ZMANIM_CARD, 'ZMANIM_CARD'],
  ['whatNeed', WHAT_NEED_CARD, 'WHAT_NEED_CARD'],
  ['bookings', BOOKINGS_CARD, 'BOOKINGS_CARD'],
];

/* ═══════════════ קריאת קוד ═══════════════ */

const sfCache = new Map();
/** תוכנית-מהדר אחת על כל הקבצים — רק כדי להסיק טיפוס-חזרה כשלא נכתב (הקוד לא רץ). */
let program = null;
let checker = null;
function startProgram(files) {
  program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, allowJs: true, checkJs: false,
    strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true, jsx: ts.JsxEmit.ReactJSX, types: [], lib: ['lib.es2023.d.ts', 'lib.dom.d.ts'],
  });
  checker = program.getTypeChecker();
}
function sourceOf(path) {
  const fromProgram = program?.getSourceFile(path);
  if (fromProgram) return fromProgram;
  if (!sfCache.has(path)) {
    const kind = path.endsWith('.mjs') || path.endsWith('.js') ? ts.ScriptKind.JS : ts.ScriptKind.TS;
    sfCache.set(path, ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, kind));
  }
  return sfCache.get(path);
}

function docOf(node, sf) {
  const jsdoc = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  const parts = jsdoc.map((d) => (typeof d.comment === 'string' ? d.comment : (ts.getTextOfJSDocComment(d.comment) ?? ''))).filter(Boolean);
  if (parts.length) return norm(parts[parts.length - 1]);
  const text = sf.getFullText();
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
  const lines = ranges.map((r) => text.slice(r.pos, r.end).replace(/^\/\/|^\/\*+|\*+\/$/g, '').replace(/^\s*\*\s?/gm, ' '));
  return norm(lines.join(' '));
}

function isPureFile(sf) {
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) {
      const spec = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? st.moduleSpecifier.text : '';
      const typeOnly = ts.isImportDeclaration(st) ? !!st.importClause?.isTypeOnly : !!st.isTypeOnly;
      if (spec && !typeOnly && IMPURE_IMPORT.test(spec)) return false;
    }
  }
  return !IMPURE_CODE.test(sf.getFullText().replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ''));
}

/** כל הפונקציות המיוצאות בקובץ: שם, פרמטרים, טיפוס-חזרה, גוף, הערה. */
function exportedFns(path) {
  const sf = sourceOf(path);
  const out = new Map();
  const jsTypes = (node) => {
    // JS: טיפוסים מ-JSDoc (@param {T} name · @returns {T})
    const params = {};
    let ret = '';
    for (const tag of ts.getJSDocTags(node)) {
      if (ts.isJSDocParameterTag(tag) && tag.typeExpression) params[tag.name.getText(sf)] = norm(tag.typeExpression.type.getText(sf));
      if (ts.isJSDocReturnTag(tag) && tag.typeExpression) ret = norm(tag.typeExpression.type.getText(sf));
    }
    return { params, ret };
  };
  const add = (node, name, fn) => {
    const js = jsTypes(fn);
    const params = fn.parameters.map((p) => {
      const pname = ts.isIdentifier(p.name) ? p.name.text : ts.isObjectBindingPattern(p.name) ? 'opts' : 'items';
      let type = p.type ? norm(p.type.getText(sf)) : (js.params[pname] ?? '');
      if (!type && p.initializer) type = literalType(p.initializer);
      return { name: pname, type, optional: !!p.questionToken || !!p.initializer };
    });
    const ret = fn.type ? norm(fn.type.getText(sf)) : js.ret || inferredReturn(fn);
    out.set(name, { node, name, params, ret, body: fn.body ? fn.body.getText(sf) : '', doc: docOf(node, sf), line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 });
  };
  for (const st of sf.statements) {
    const exported = (st.modifiers ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isFunctionDeclaration(st) && st.name && st.body) add(st, st.name.text, st);
    else if (ts.isVariableStatement(st))
      for (const d of st.declarationList.declarations) {
        const init = d.initializer;
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && ts.isIdentifier(d.name)) add(st, d.name.text, init);
      }
  }
  return out;
}

/** טיפוס-החזרה שהמהדר מסיק (קצר בלבד — טיפוס ארוך מדי לא עוזר לשילוב ⇒ ''). */
function inferredReturn(fn) {
  if (!checker) return '';
  try {
    const sig = checker.getSignatureFromDeclaration(fn);
    if (!sig) return '';
    const t = norm(checker.typeToString(checker.getReturnTypeOfSignature(sig), undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope));
    return t.length <= 120 && !/\bany\b|import\(/.test(t) ? t : '';
  } catch {
    return '';
  }
}

function literalType(init) {
  if (ts.isNumericLiteral(init) || (ts.isPrefixUnaryExpression(init) && ts.isNumericLiteral(init.operand))) return 'number';
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) return 'string';
  if (init.kind === ts.SyntaxKind.TrueKeyword || init.kind === ts.SyntaxKind.FalseKeyword) return 'boolean';
  if (ts.isArrayLiteralExpression(init)) return 'unknown[]';
  if (ts.isObjectLiteralExpression(init)) return 'object';
  return '';
}

/* ═══════════════ הסוגים — מילון אחד ═══════════════ */

/** שמות-הטיפוסים מ-domain.ts ⇒ record:<ישות>. */
function domainTypes() {
  const sf = sourceOf(join(ROOT, 'src/types/domain.ts'));
  const names = new Set(['Db']);
  for (const st of sf.statements) if ((ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) && st.name) names.add(st.name.text);
  return names;
}
const DOMAIN = domainTypes();

/** כינויי-טיפוס (type X = …) — מ-domain.ts ומהקובץ של החלק. כינוי לאיחוד-מחרוזות ⇒ choice, לפרימיטיב ⇒ הפרימיטיב. */
function aliasesOf(path) {
  const sf = sourceOf(path);
  const m = new Map();
  for (const st of sf.statements) if (ts.isTypeAliasDeclaration(st) && !st.typeParameters) m.set(st.name.text, norm(st.type.getText(sf)));
  return m;
}
const DOMAIN_ALIASES = aliasesOf(join(ROOT, 'src/types/domain.ts'));
let fileAliases = new Map();
function aliasOf(t) {
  if (DATE_TYPE.test(t) || CLOCK_TYPE.test(t)) return null;
  return fileAliases.get(t) ?? DOMAIN_ALIASES.get(t) ?? null;
}
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const DATE_TYPE = /^(IsoDate|IsoDay|DateIso|HebDate)$/;
const CLOCK_TYPE = /^(TimeHM|HHMM|Hm|ClockTime)$/;
const SPAN_TYPE = /^(Span|MinuteSpan|DateRange|Range|Window|ClosedWindow)$|^\{ ?(from|start): [^;]+; (to|end): [^;]+;? ?\}$/;
const MONEY_NAME = /(amount|price|total|sum|cost|ils|usd|fee|budget|balance|due|paid|debt|owed|revenue|income|money|nis|shekel|value|ltv|charge|payment)/i;
const MOMENT_NAME = /(^now$|Ms$|^ms$|^ts$|^t$|nowMs|^when$|^epoch)/;
const CLOCK_NAME = /^(hm|time|clock|hhmm|start|end|from|to|t1|t2|at)$|(Hm|HM|Time)$/;
const GEO_NAME = /^(lat|lon|lng|geo|latLon|coords|loc|location|city|tenantGeo)$/i;
const IMAGE_NAME = /(photo|image|img|logo|dataUri|avatar|picture)/i;
const SOUND_NAME = /(audio|sound|voice|wav|mp3)/i;
const FILE_NAME = /(file|blob|csv|vcf|ics|xlsx|buffer|bytes)$/i;

/** טיפוס + שם ⇒ אחד מסוגי המילון המשותף (catalog/contract.md §3). דטרמיניסטי. */
export function kindOf(rawType, name = '', depth = 0, objName = '') {
  let t = norm(rawType).replace(/^readonly /, '');
  const solo = K.unionParts(t);
  if (solo.length === 1 && solo[0] !== t) t = solo[0];
  // מקום · קול · תמונה · תור — לפי הצורה (המיפוי המשותף, catalog/lib/kind-shape.mjs); כינוי-טיפוס נבדק כשנפתח
  const sk = shapeKindOfType(t, name);
  if (sk) return sk;
  if (!t || t === 'unknown' || t === 'object' || t === 'any') return kindByName(name);
  const al = depth < 4 ? aliasOf(t) : null;
  if (al && !al.startsWith('{')) {
    if (/^[A-Z]\w*( \| [A-Z]\w*)+$/.test(al)) return 'record:' + lowerFirst(t);
    const k = kindOf(al, name, depth + 1, objName);
    return k === 'unknown' && /^[A-Z][A-Za-z0-9]+$/.test(t) ? 'record:' + lowerFirst(t) : k;
  }
  let m = /^Promise<(.+)>$/.exec(t);
  if (m) return kindOf(m[1], name, depth, objName);
  m = /^(Partial|Readonly|Required|NonNullable)<(.+)>$/.exec(t) || /^(Pick|Omit)<([A-Za-z_]\w*),.*>$/.exec(t);
  if (m) return kindOf(m[2], name, depth, objName);
  const parts = K.unionParts(t);
  if (parts.length > 1) {
    const lits = K.stringLiterals(t);
    if (lits.length === parts.length || parts.every((x) => /^-?\d+$|^'[^']*'$|^"[^"]*"$/.test(x))) return 'choice';
    if (parts.every((p) => /^(true|false|boolean)$/.test(p))) return 'bool';
    const ks = [...new Set(parts.map((p) => kindOf(p, name, depth, objName)))];
    if (ks.length === 1) return ks[0];
    const nonUnknown = ks.filter((k) => k !== 'unknown');
    return nonUnknown.length === 1 ? nonUnknown[0] : 'unknown';
  }
  if (parts.length === 1) t = parts[0];
  if (/^'[^']*'$|^"[^"]*"$/.test(t)) return 'choice';
  const el = K.arrayElement(t);
  if (el !== null) {
    const ek = kindOf(el, '');
    if (ek === 'date' || ek === 'times' || DATE_TYPE.test(el) || CLOCK_TYPE.test(el)) return 'times';
    if (/^(Run|Piece|boolean)$/.test(el) || /(steps|runs|pieces|queue|order|sorted|series|timeline|ladder|plan|schedule|path)$/i.test(name)) return 'sequence';
    if (ek === 'image') return 'image';
    return 'list';
  }
  if (/^(Map|Set|ReadonlyMap|ReadonlySet)<|^Record<|^\{ ?\[/.test(t)) return 'list';
  if (t.endsWith('[]') || /^\[.*\]$/.test(t) || /^(readonly )?Array</.test(t)) return 'list';
  if (/\['(status|kind|type|mode|stage)'\]$/.test(t)) return 'choice';
  if (/^(boolean|true|false)$/.test(t)) return 'bool';
  if (DATE_TYPE.test(t)) return 'date';
  if (CLOCK_TYPE.test(t)) return 'times';
  if (t === 'Date') return 'times';
  if (SPAN_TYPE.test(t)) return 'span';
  if (/^(Blob|File|ArrayBuffer|Uint8Array|Buffer)$/.test(t)) return 'file';
  if (/^(HTMLElement|HTMLCanvasElement|ReactNode|JSX\.Element|ReactElement|CSSProperties|React\.\w+)$/.test(t)) return 'ui';
  if (/^(Geo|LatLon|LatLng|Coords|GeoPoint|City)$/.test(t)) return 'geo';
  if (/^(Kind)$/.test(t)) return 'choice';
  if (t === 'number' || t === 'bigint') {
    if (MOMENT_NAME.test(name)) return 'times';
    if (GEO_NAME.test(name)) return 'geo';
    if (MONEY_NAME.test(name) || K.MONEY_NAME.test(name)) return 'amount';
    return 'number';
  }
  if (t === 'string') return stringKind(name);
  if (/^\{.*\}$/.test(t)) {
    if (/\b(lat|lon)\b/.test(t)) return 'geo';
    if (/\b(from|start)\??: /.test(t) && /\b(to|end)\??: /.test(t)) return 'span';
    return objName ? 'record:' + objName : 'unknown';
  }
  if (DOMAIN.has(t)) return 'record:' + lowerFirst(t);
  if (/^[A-Z][A-Za-z0-9]+$/.test(t) && t.length > 2 && !/^(T|M|I|P|K|V|Kind|Opts|Options)$/.test(t)) return 'record:' + lowerFirst(t);
  return 'unknown';
}

function stringKind(name) {
  if (K.DATE_NAME.test(name) || /^(iso|fromIso|toIso|day|dateIso|start|end|from|to|checkIn|checkOut|since|until)$/i.test(name) || name.endsWith('Iso')) return 'date';
  if (CLOCK_NAME.test(name)) return 'times';
  if (IMAGE_NAME.test(name)) return 'image';
  if (SOUND_NAME.test(name)) return 'sound';
  if (FILE_NAME.test(name)) return 'file';
  if (/^(city|address)$/i.test(name)) return 'geo';
  return 'text';
}

function kindByName(name) {
  if (!name) return 'unknown';
  if (/^(is|has|can|should|allow)[A-Z]/.test(name)) return 'bool';
  if (/^db$/.test(name)) return 'record:db';
  if (/^(config|cfg|orgConfig)$/.test(name)) return 'record:orgConfig';
  if (/^(tenant|tenantId|vertical|call|menu|plan|snap|ledger|scan)$/.test(name)) return name.endsWith('Id') ? 'text' : 'record:' + name;
  if (/(Iso|^iso|^date)$/.test(name) || K.DATE_NAME.test(name)) return 'date';
  if (MOMENT_NAME.test(name)) return 'times';
  if (/^(n|count|qty|days|minutes|min|step|idx|index|num|size|limit|max)$/i.test(name)) return 'number';
  if (MONEY_NAME.test(name)) return 'amount';
  if (/^(text|s|str|q|query|label|name|title|raw|phone|tel|num|msg|message)$/i.test(name)) return 'text';
  if (/(list|items|rows|arr|all)$/i.test(name) || name.endsWith('s')) return 'list';
  if (GEO_NAME.test(name)) return 'geo';
  return 'unknown';
}

/** סוג-ה-Orbit של המפרק (6 סוגים) ⇒ המילון המשותף (שמות זהים). */
const fromOrbitKind = (k) => (k ? k : null);

/* ═══════════════ השמות — צורת פועל ═══════════════ */

/** שם-פעולה בתחילת השם ⇒ פועל בהווה. */
const LEAD_VERB = {
  סינון: 'מסנן', 'סינון+מיון': 'מסנן וממיין', 'סינון+חיפוש+מיון': 'מסנן, מחפש וממיין', תיקון: 'מתקן', ריפוי: 'מרפא', שמירת: 'שומר את', בניית: 'בונה את',
  הזזת: 'מזיז את', התאמת: 'מתאים את', איחוד: 'מאחד', הסרת: 'מסיר את', פענוח: 'מפענח את', פירוק: 'מפרק את', נרמול: 'מנרמל את', נירמול: 'מנרמל את',
  מחיקת: 'מוחק את', ניקוי: 'מנקה את', החלת: 'מחיל את', הוספת: 'מוסיף את', יצירת: 'יוצר את', המרת: 'ממיר את', זריעת: 'זורע את', הכפלת: 'מכפיל את',
  ספירת: 'סופר את', ספירה: 'סופר', חישוב: 'מחשב את', תכנון: 'מתכנן את', שכפול: 'משכפל את', סיווג: 'מסווג את', מיפוי: 'ממפה את', גזירת: 'גוזר את',
  פתרון: 'פותר את', סגירת: 'סוגר את', השחרת: 'מסתיר את', הקראה: 'מקריא את', דחייה: 'דוחה את', 'דחייה/הסתרה': 'דוחה או מסתיר את', 'קידום/ביטול': 'מקדם או מבטל את',
  סנכרון: 'מסנכרן את', בדיקת: 'בודק את', הדגשה: 'מדגיש את', ערבוב: 'מערבב את', איזון: 'מאזן את', הקרנת: 'מקרין את', סימולציה: 'מדמה את', עיצוב: 'מעצב את',
  חיווט: 'מחבר את', אגרגציית: 'מצרף את', הכנסת: 'מכניס את', מילוי: 'ממלא את', הרכבה: 'מרכיב את', פריסת: 'פורס את', ולידציית: 'בודק תקינות של',
  התחלת: 'מתחיל את', שליחה: 'שולח את', חיוג: 'מחייג', הושבה: 'מושיב', הושבת: 'מושיב את', תמחור: 'מתמחר את', אימות: 'מאמת את', מיון: 'ממיין את',
  חיפוש: 'מחפש את', קיבוץ: 'מקבץ את', צירוף: 'מצרף את', פיצול: 'מפצל את', עיגול: 'מעגל את', השוואת: 'משווה את', קריאת: 'קורא את', כתיבת: 'כותב את',
  ייצוא: 'מייצא את', ייבוא: 'מייבא את', הצגת: 'מציג את', טעינת: 'טוען את', עדכון: 'מעדכן את', הפקת: 'מפיק את', זיהוי: 'מזהה את', המרה: 'ממיר', ניתוח: 'מנתח את',
  הערכת: 'מעריך את', קביעת: 'קובע את', חילוץ: 'מחלץ את', הפרדת: 'מפריד את', השלמת: 'משלים את', דירוג: 'מדרג את', תרגום: 'מתרגם את', פיענוח: 'מפענח את',
  ביטול: 'מבטל את', אישור: 'מאשר את', צביעת: 'צובע את', קיצור: 'מקצר את', 'נקה': 'מנקה', 'סנכרן': 'מסנכרן', 'מלא': 'ממלא',
};
/** מילים פותחות שכבר פועל בהווה (או "האם" ⇒ "בודק אם"). */
const ALREADY_VERB = new Set([
  'בונה', 'מחשב', 'מחזיר', 'בודק', 'מוצא', 'ממיין', 'מסנן', 'יוצר', 'הופך', 'מחלק', 'מאחד', 'מנרמל', 'מעגל', 'מזיז', 'סופר', 'מסדר', 'מוסיף',
  'מוריד', 'מבין', 'מזהה', 'מסתיר', 'מחליף', 'מראה', 'שולח', 'מעביר', 'אומר', 'מצייר', 'פותח', 'סוגר', 'מזהיר', 'קובע', 'כותב', 'ממיר', 'גוזר',
  'מריץ', 'מרים', 'מקבץ', 'מפרק', 'מתקן', 'מרפא', 'מנקה', 'מציע', 'מצרף', 'מפצל', 'מאמת', 'מחפש', 'מפענח', 'קורא', 'מוחק', 'מסכם', 'מתרגם',
  'מתאים', 'מדרג', 'מחבר', 'מקצר', 'מפיק', 'מייצא', 'מייבא', 'מכין', 'מבטל', 'מאשר', 'משלים', 'מעדכן', 'מקדם', 'מדמה', 'מתכנן', 'מחייג', 'נותן',
  'מצמיד', 'מצביע', 'מקבל', 'מוציא', 'שומר', 'טוען', 'ממלא', 'מגדיר', 'מפריד', 'מחלץ', 'מעריך', 'צובע', 'מושיב', 'מסווג', 'ממפה', 'משווה', 'מציג',
  'מחיל', 'זורע', 'מכפיל', 'משכפל', 'פותר', 'מקריא', 'דוחה', 'מסנכרן', 'מדגיש', 'מערבב', 'מאזן', 'מקרין', 'מעצב', 'מכניס', 'מרכיב', 'פורס', 'מתחיל',
  'יודע', 'מתמחר', 'מנתח', 'מתזמן', 'מגביל', 'מקפל', 'ממזער', 'מגלגל', 'מונה', 'מודד', 'מעריך', 'מסמן', 'עונה', 'מגיש', 'עובר', 'מדלג', 'רושם', 'מצטט',
]);

/** מילה פותחת ⇒ פועל, לפי מה שהחלק נותן. */
function headVerb(gives) {
  if (gives === 'bool') return 'בודק';
  if (gives === 'amount' || gives === 'number') return 'מחשב את';
  if (gives === 'text') return 'כותב את';
  if (gives === 'list' || gives === 'sequence' || gives === 'times') return 'מוצא את';
  if (gives === 'date') return 'מחשב את';
  if (gives === 'choice') return 'קובע את';
  if (gives === 'span') return 'מחשב את';
  if (gives === 'ui' || gives === 'image') return 'מצייר את';
  if (gives === 'file') return 'מכין את';
  if (gives && gives.startsWith('record:')) return 'בונה את';
  return 'מחזיר את';
}

const LATIN_SWAPS = [
  [/\bDD\/MM\/YYYY\b/g, 'יום/חודש/שנה'], [/\bD\.M\b/g, 'יום.חודש'], [/\bCSV\b|\bcsv\b/g, 'טבלה'], [/\bISO\b/g, 'תאריך'], [/\bKPI\b/g, 'מדדי'],
  [/\bHTML\b/g, 'דף'], [/\bJSON\b/g, 'קובץ'], [/\bICS\b/g, 'יומן'], [/\bRFM\b/g, 'תדירות וסכום'], [/\bSMS\b/g, 'מסרון'], [/\bURL\b|\burl\b/g, 'קישור'],
  [/\bE\.?164\b/g, 'בינלאומי'], [/\bID\b/g, 'מזהה'], [/\bPDF\b/g, 'מסמך'], [/\bvCard\b|\bVCF\b/gi, 'כרטיס איש-קשר'], [/\bslug\b/g, 'כינוי'],
  [/\bstore\b/g, 'מאגר'], [/\bpreset\b/g, 'ברירת-מחדל'], [/\bscan\b/g, 'סריקה'], [/\bExcel\b/g, 'אקסל'], [/\bWhatsApp\b/gi, 'וואטסאפ'],
  [/\bseed\b/g, 'זרע'], [/\bDb\b|\bdb\b/g, 'המאגר'], [/\bN\b/g, 'כמה'], [/\bn\b/g, 'כמה'], [/\[a, b\)/g, ''], [/\bIVR\b/g, 'תפריט טלפוני'],
];

/** שם מההערה ⇒ צורת-פועל עברית קצרה (≤ 9 מילים), בלי לטינית. '' אם אי אפשר. */
export function verbify(raw, gives) {
  let s = norm(String(raw ?? '').replace(/\*\*/g, '').replace(/[`"“”״׳']/g, (c) => (c === '״' || c === '׳' ? c : '')));
  s = s.replace(/^חלק בלי הסבר.*$/, '');
  for (const [re, to] of LATIN_SWAPS) s = s.replace(re, to);
  s = s.replace(/…$/, '').replace(/[⧉Σ±]/g, '').replace(/\s*\(.*$/, '').replace(/\s+=\s+.*$/, '');
  s = s.replace(/(?<=[א-ת])-(?=[א-ת])/g, ' ').replace(/^ה(?=[א-ת]{3})/, (m) => m); // מקף בין מילים ⇒ רווח
  s = norm(W.plainWords(s));
  // רק עד הפסיק הראשון; בלי "(כמו) במקור"/"של המקור" (הערות-פורט, לא תוכן)
  s = s.split(/,\s|\s·\s|\s\/\s/)[0].replace(/\s?(כמו\s)?(של\s|ב)המקור\b|\s?במקור\b/g, '');
  // מילה עם אותיות לטיניות (שם-משתנה בתוך ההערה) ⇒ יורדת; מילת-יחס שנשארה תלויה בסוף ⇒ יורדת
  s = norm(s.split(' ').filter((w) => !/[A-Za-z]/.test(w) && !/^[\d{}[\]+=→⇒<>|.]+$/.test(w)).join(' '));
  s = s.replace(/(\s(של|מ|ל|ב|עם|את|מתוך|לפי|עבור|על|אל|אם|או|ו|עד|כ|ה|פר|אחרי|לפני|בין|מול|כש|ש))+$/, '').replace(/^(של|את)\s/, '');
  if (!s) return '';
  const words = s.split(' ');
  const first = words[0];
  const rest = words.slice(1).join(' ');
  /** "את" רק לפני מיודע (מתחיל ב-ה, "כל ה…") — "מחשב גיל", "מחשב את הגיל". */
  const obj = (verb, tail) => {
    if (!tail) return '';
    const v = verb.replace(/ את$/, '');
    return norm(v + (/^(ה|כל ה)/.test(tail) ? ' את ' : ' ') + tail);
  };
  let out;
  if (ALREADY_VERB.has(first)) out = s;
  else if (first === 'האם') out = rest ? 'בודק אם ' + rest : '';
  else if (LEAD_VERB[first]) out = /\sאת$/.test(LEAD_VERB[first]) ? obj(LEAD_VERB[first], rest) : norm(LEAD_VERB[first] + ' ' + rest);
  else if (/^(מה|מי|כמה|איזה|איזו|איך|מתי|איפה)$/.test(first)) out = 'אומר ' + s;
  else if (/^(כל|רק)$/.test(first)) out = 'מוצא ' + s;
  else if (gives === 'bool') out = 'בודק אם ' + s;
  else out = obj(headVerb(gives), s);
  out = norm(out.replace(/(^|\s)([לבמהוכש]) (?=[א-ת])/g, '$1$2').replace(/(\S+)( \1)+(?=\s|$)/g, '$1'));
  const ws = out.split(' ').filter(Boolean);
  if (ws.length < 2) return '';
  if (ws.length > 9) out = ws.slice(0, 9).join(' ').replace(/(\s(של|מ|ל|ב|עם|את|מתוך|לפי|עבור|על|אל|אם|או|ו|עד|כ|ה|פר|אחרי|לפני|בין|מול))+$/, '');
  return out.replace(/[,;:\-–—]+$/, '').trim();
}

/** משפט "מה הוא עושה" — פשוט, עברית, נקודה בסוף. */
function doesOf(computes, name) {
  let s = norm(String(computes ?? '').replace(/\*\*/g, ''));
  s = s.replace(/^(תיקון\s?[A-Za-z0-9-]*(\s\([^)]*\))?|item \d+\s?·)\s*:?\s*/, '').replace(/^[^:]{0,40}?[A-Za-z][^:]{0,40}:\s/, '');
  s = s.replace(/\s?\([^)]*(?:[A-Za-z]|טהור|במקור|המקור)[^)]*\)/g, '').replace(/\s?—\s?(במקור|טהור)\.?$/, '');
  for (const [re, to] of LATIN_SWAPS) s = s.replace(re, to);
  s = norm(s.replace(/`[^`]*`/g, ''));
  if (!s || !W.hasHebrew(s) || /^אין הסבר|^מחשב את [A-Za-z]/.test(s) || s.replace(/[^א-ת]/g, '').length < 6) s = name;
  if (s.length > 200) s = s.slice(0, 199).replace(/\s+\S*$/, '') + '…';
  if (!/[.!?…]$/.test(s)) s += '.';
  return s;
}

/* ═══════════════ דוגמאות — רק מבדיקות, מסוננות ═══════════════ */

const SECRET = [
  /@/, /https?:/i, /\b\d{9}\b/, /(?:\+?972|0)5\d[-\s]?\d{3}[-\s]?\d{4}/, /\b0\d{1,2}[-\s]?\d{7}\b/, /\b\d{7,}\b/, /[A-Za-z0-9_-]{24,}/,
  /(רחוב|רח׳|שדרות|דירה|ת"ז|ת״ז|טלפון|נייד|מייל|token|secret|password|apikey|api_key)/i,
];
/** שמות-אנשים נפוצים (גם בדויים) — דוגמה שיש בה אחד מהם לא נכנסת. עדיף לוותר על דוגמה מאשר לפרסם שם. */
const PERSON_NAME = /(^|[\s"'״׳.-])(ר׳|הרב|משה|כהן|לוי|ישראל|ישראלי|רות|שרה|רבקה|רחל|לאה|דוד|יוסי|יוסף|אברהם|יצחק|יעקב|ברגר|שטרן|מרים|חנה|אסתר|שמואל|אהרן|דבורה|נחום|פלוני|אלמוני|גולדברג|פרידמן|שפירא|אליהו|מנחם|שלמה|יהודה|בנימין|נשמת)(?=$|[\s"'״׳.,:-])/;
const PERSON_KEY = /^(name|firstName|famName|lastName|first|last|guest|guestName|requester|father|mother|who|by|contact|fullName)$/i;

/** האם ערך-דוגמה בטוח לפרסום. */
function safeValue(v) {
  if (v === null || typeof v === 'boolean') return true;
  if (typeof v === 'number') return Number.isFinite(v) && !/\d{7,}/.test(String(Math.abs(v)).replace('.', '')) || /^\d{12,13}$/.test(String(v)) === false;
  if (typeof v === 'string') {
    if (v.length > 60) return false;
    const iso = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(v);
    if (iso) return true;
    if (v.replace(/\D/g, '').length >= 7) return false; // טלפון/ת״ז גם עם רווחים ומקפים
    return !SECRET.some((re) => re.test(v)) && !PERSON_NAME.test(v);
  }
  if (Array.isArray(v)) return v.length <= 8 && v.every(safeValue);
  if (typeof v === 'object') {
    const ks = Object.keys(v);
    if (ks.length > 8) return false;
    if (ks.some((k) => /^(phone\d?|email|idNum|address|token|key|secret|pin|password|health)$/i.test(k) || PERSON_KEY.test(k))) return false;
    return ks.every((k) => safeValue(v[k]));
  }
  return false;
}

/** ביטוי-מילולי ⇒ ערך JSON (או undefined אם לא מילולי). */
function literalValue(e) {
  if (!e) return undefined;
  if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression?.(e)) return literalValue(e.expression);
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  if (ts.isNumericLiteral(e)) return Number(e.text.replace(/_/g, ''));
  if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(e.operand)) return -Number(e.operand.text.replace(/_/g, ''));
  if (e.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (e.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (e.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(e)) {
    const out = e.elements.map(literalValue);
    return out.some((x) => x === undefined) ? undefined : out;
  }
  if (ts.isObjectLiteralExpression(e)) {
    const out = {};
    for (const p of e.properties) {
      if (!ts.isPropertyAssignment(p)) return undefined;
      const k = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : null;
      const v = literalValue(p.initializer);
      if (k === null || v === undefined) return undefined;
      out[k] = v;
    }
    return out;
  }
  return undefined;
}

function listFiles(dir, re, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (f === 'node_modules' || f === 'dist') continue;
    if (statSync(p).isDirectory()) listFiles(p, re, acc);
    else if (re.test(f)) acc.push(p);
  }
  return acc;
}

/** כל קריאה `expect(fn(…)).toBe(x)` / `eq(label, fn(…), x)` עם ערכים מילוליים ⇒ דוגמה לשם-הפונקציה. הראשונה הבטוחה מנצחת. */
function collectExamples() {
  const files = [...listFiles(join(ROOT, 'src'), /\.test\.tsx?$/), join(ROOT, 'telephony/test.mjs')].filter(existsSync);
  const ex = new Map(); // fnName ⇒ [{in,out,file}]
  const push = (fn, args, out, file) => {
    if (!ex.has(fn)) ex.set(fn, []);
    ex.get(fn).push({ in: args, out, file });
  };
  for (const file of files) {
    const sf = sourceOf(file);
    const visit = (n) => {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && /^(toBe|toEqual|toStrictEqual)$/.test(n.expression.name.text)) {
        const inner = n.expression.expression;
        if (ts.isCallExpression(inner) && ts.isIdentifier(inner.expression) && inner.expression.text === 'expect' && inner.arguments.length === 1) {
          const call = inner.arguments[0];
          if (ts.isCallExpression(call) && ts.isIdentifier(call.expression)) {
            const args = call.arguments.map(literalValue);
            const out = literalValue(n.arguments[0]);
            if (!args.some((a) => a === undefined) && out !== undefined) push(call.expression.text, args, out, file);
          }
        }
      }
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'eq' && n.arguments.length === 3) {
        const call = n.arguments[1];
        if (ts.isCallExpression(call) && ts.isIdentifier(call.expression)) {
          const args = call.arguments.map(literalValue);
          const out = literalValue(n.arguments[2]);
          if (!args.some((a) => a === undefined) && out !== undefined) push(call.expression.text, args, out, file);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return ex;
}

/** דוגמה לחלק: מבדיקה שמייבאת את הקובץ שלו (או מאותה תיקייה), אחרי סינון. */
function exampleFor(examples, fnName, path, params) {
  const list = examples.get(fnName);
  if (!list) return null;
  const base = basename(path).replace(/\.(ts|mjs)$/, '');
  for (const e of list) {
    const text = readFileSync(e.file, 'utf8');
    const imports = new RegExp(`from ['"][^'"]*\\b${base.replace(/[-.]/g, '\\$&')}(\\.m?[jt]s)?['"]`).test(text);
    if (!imports) continue;
    if (e.in.length > Math.max(params.length, 1)) continue;
    if (!safeValue(e.in) || !safeValue(e.out)) continue;
    if (JSON.stringify(e).length > 400) continue;
    const inObj = {};
    e.in.forEach((v, i) => (inObj[params[i]?.name ?? 'arg' + i] = v));
    return { in: inObj, out: e.out };
  }
  return null;
}

/* ═══════════════ הרכבה ═══════════════ */

function readGenerated() {
  const D = join(ROOT, 'src/lib/atoms/engines/generated');
  const ids = JSON.parse(/GENERATED_IDS = (\[.*?\])/.exec(readFileSync(join(D, 'lazy.ts'), 'utf8'))[1]);
  return ids.map((id) => {
    const text = readFileSync(join(D, id + '.ts'), 'utf8');
    const i = text.indexOf('GenEngine = ');
    const constName = /export const (\w+): GenEngine/.exec(text)[1];
    return { engine: JSON.parse(text.slice(i + 'GenEngine = '.length).trim().replace(/;\s*$/, '')), file: 'src/lib/atoms/engines/generated/' + id + '.ts', constName };
  });
}

function partFromFn({ path, fn, lang, what, decomposed, overrideName, overrideDoes, tags, examples, nameOverrides }) {
  fileAliases = aliasesOf(join(ROOT, path));
  const id = `${SOURCE}:${path}#${fn.name}`;
  const takes = fn.params.map((p) => {
    let kind = kindOf(p.type, p.name);
    if (kind === 'unknown' && decomposed?.takes?.length === 1 && fn.params.length === 1) kind = fromOrbitKind(decomposed.takes[0]);
    if (kind === 'unknown') {
      const v = K.classifyField(p.type, p.name).kind;
      if (v) kind = v === 'times' && !K.arrayElement(p.type) ? 'date' : v;
    }
    return { name: p.name, kind, type: p.type || 'unknown' };
  });
  const objName = fn.name.replace(/Of$/, '').replace(/^(build|make|compute|get)([A-Z])/, (_, __, ch) => ch.toLowerCase());
  // שם-הפונקציה כשם-הערך: fmt*/‏*Label/‏*Text ⇒ טקסט לתצוגה; iso*/‏*Iso ⇒ תאריך
  const retName = /^(fmt|format|render|esc)|(Label|Text|Html|Line|Title|Words|Href|Url)$/.test(fn.name) ? 'label' : /^iso|Iso$|IsoOf$|^addDays|^shift|^nextOccur/.test(fn.name) ? 'iso' : fn.name.replace(/^(get|of)/, '');
  let gk = fn.ret ? kindOf(fn.ret, retName, 0, objName) : retByName(fn.name);
  const dk = decomposed?.gives ?? K.classifyReturn(fn.ret, fn.name).kind;
  if ((gk === 'unknown' || gk === 'list') && (dk === 'sequence' || dk === 'waiting' || dk === 'span' || (gk === 'unknown' && dk))) gk = dk === 'times' && !K.arrayElement(fn.ret) ? 'date' : dk;
  // מחרוזת שההערה אומרת עליה מה היא: "HH:MM" ⇒ שעה · ISO/‏YYYY-MM-DD ⇒ תאריך
  if (gk === 'text' && /^string( \| null)?$/.test(fn.ret || 'string')) {
    const d = (decomposed?.computes ?? '') + ' ' + fn.doc;
    if (/"?H{1,2}:MM"?\s*\.?\s*$|^[^⇒→]*"?H{1,2}:MM"?|שעת[- ]/.test(d) && !/דקות/.test(d.split(/⇒|→/)[0] ?? '')) gk = 'times';
    else if (/(^|[\s-])(ISO|YYYY-MM-DD)\b|תאריך-ISO/.test(d) && !/⇒\s*"?\d|תצוגת|DD\/MM/.test(d)) gk = 'date';
  }
  const gives = { kind: gk, type: fn.ret || 'unknown' };
  const auto = verbify(overrideName ?? (decomposed?.name || W.shortName(fn.doc)), gk);
  const name = nameOverrides[id] ?? auto;
  const doesSrc = overrideDoes ?? (decomposed?.computes || W.oneSentence(fn.doc));
  const pure = !CLOCK_CODE.test(fn.body);
  return {
    id,
    source: SOURCE,
    path,
    symbol: fn.name,
    lang,
    what,
    name,
    does: doesOf(doesSrc, name),
    takes,
    gives,
    pure,
    example: exampleFor(examples, fn.name, path, fn.params),
    tags: [...new Set(tags)].sort(),
    _auto: auto,
  };
}

function retByName(n) {
  if (/^(is|has|can|should)[A-Z]/.test(n)) return 'bool';
  if (/(CsvRows|Rows|List|Of[A-Z]\w*s)$/.test(n)) return 'list';
  if (/(Label|Text|Html|Line|Title|Name)$/.test(n)) return 'text';
  if (/(Total|Sum|Amount|Balance|Price)$/.test(n)) return 'amount';
  if (/(Count|Index|Days|Nights)$/.test(n)) return 'number';
  return 'unknown';
}

export function build() {
  const gen = readGenerated();
  const files = new Set();
  for (const { engine: e } of gen) for (const gp of e.parts) files.add(join(ROOT, `${e.from}/${gp.fn.split('#')[0]}.ts`));
  for (const c of ATOM_CARDS) files.add(join(ROOT, `src/lib/atoms/parts/${c.id}.ts`));
  for (const f of LIB_FILES) files.add(join(ROOT, `src/lib/${f}.ts`));
  for (const f of TEL_FILES) files.add(join(ROOT, `telephony/lib/${f}.mjs`));
  sfCache.clear();
  startProgram([...files].filter(existsSync).sort());
  const nameOverrides = existsSync(NAMES) ? JSON.parse(readFileSync(NAMES, 'utf8')).names ?? {} : {};
  const examples = collectExamples();
  const parts = [];

  // 1 · הפלט של המפרק
  for (const { engine: e, file, constName } of gen) {
    const engId = `${SOURCE}:${file}#${constName}`;
    const placeKinds = [...new Set(e.places.map((p) => p.kind))].sort();
    const ee = verbify(e.computes, 'list');
    parts.push({
      id: engId, source: SOURCE, path: file, symbol: constName, lang: 'machine', what: 'engine',
      name: nameOverrides[engId] ?? ee, does: doesOf(e.computes, e.name),
      takes: [{ name: 'db', kind: 'record:db', type: 'Db' }],
      gives: { kind: 'list', type: 'GenPlace[]' },
      pure: true, example: null,
      tags: ['engine', 'module:' + e.id, 'decomposed', ...placeKinds.map((k) => 'place:' + k), ...e.entities.map((x) => 'entity:' + x)].sort(),
      _auto: ee,
    });
    for (const gp of e.parts) {
      const [file2, fnName] = gp.fn.split('#');
      const path = `${e.from}/${file2}.ts`;
      const fns = exportedFns(join(ROOT, path));
      const fn = fns.get(fnName);
      if (!fn) throw new Error('המפרק מצביע על פונקציה שלא נמצאה: ' + path + '#' + fnName);
      parts.push(
        partFromFn({
          path, fn, lang: 'ts', what: 'function', decomposed: gp, examples, nameOverrides,
          tags: ['module:' + e.id, 'decomposed', ...(gp.atom ? ['brick:' + gp.atom] : [])],
        }),
      );
    }
  }

  // 2 · שמונת המנועים הקטנים
  for (const card of ATOM_CARDS) {
    const path = `src/lib/atoms/parts/${card.id}.ts`;
    const fns = exportedFns(join(ROOT, path));
    const ex = ATOM_EXPLAIN[card.id];
    for (const fn of [...fns.values()].sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const isMain = BRICK_MAIN[card.id] === fn.name;
      const p = partFromFn({
        path, fn, lang: 'ts', what: isMain ? 'brick' : 'function', examples, nameOverrides,
        overrideName: isMain ? ex.name : undefined, overrideDoes: isMain ? ex.explain : undefined,
        tags: ['brick:' + card.id, 'atoms', ...(isMain ? card.worksOn.map((k) => 'works-on:' + k) : [])],
      });
      if (isMain) {
        const out = ATOM_OUTPUT[card.id];
        p.gives = { kind: out === 'same' ? card.worksOn[0] : out, type: p.gives.type };
        if (p.takes[0]) p.takes[0] = { ...p.takes[0], kind: card.worksOn[0] };
        const [i, o] = (ex.examples.find((x) => safeValue(x.replace(' ← ', ' '))) ?? ex.examples[0]).split(' ← ');
        p.example = safeValue(i) && safeValue(o) ? { in: { [p.takes[0]?.name ?? 'input']: i }, out: o } : null;
      }
      parts.push(p);
    }
  }

  // 3 · כרטיסי-היד
  for (const [id, card, constName] of CARDS) {
    const path = `src/lib/atoms/engines/${id}.ts`;
    const eid = `${SOURCE}:${path}#${constName}`;
    const exp = ENGINE_EXPLAIN[id];
    const ee = verbify(exp.explain, 'list');
    parts.push({
      id: eid, source: SOURCE, path, symbol: constName, lang: 'machine', what: 'engine',
      name: nameOverrides[eid] ?? ee, does: doesOf(exp.explain, exp.name),
      takes: [{ name: 'db', kind: 'record:db', type: 'Db' }], gives: { kind: 'list', type: 'Place[]' },
      pure: true, example: (() => { const x = exp.examples.find((e) => safeValue(e.replace(' ← ', ' '))); if (!x) return null; const [i, o] = x.split(' ← '); return { in: { input: i }, out: o }; })(),
      tags: ['engine', 'hand-card', 'card:' + id, ...[...new Set(card.places.map((p) => 'place:' + p.kind))].sort()],
      _auto: ee,
    });
    for (const ip of card.parts) {
      const [tk, gk] = PARTICLE_KINDS[id][ip.num];
      const pid = `${SOURCE}:${path}#${constName}.${ip.num}`;
      parts.push({
        id: pid, source: SOURCE, path, symbol: `${constName}.${ip.num}`, lang: 'machine', what: 'particle',
        name: nameOverrides[pid] ?? ip.name, does: doesOf(ip.computes, ip.name),
        takes: [{ name: 'input', kind: tk, type: 'unknown' }], gives: { kind: gk, type: 'unknown' },
        pure: true, example: null,
        tags: ['card:' + id, 'hand-card', ...(ip.atom ? ['brick:' + ip.atom] : [])].sort(),
        _auto: ip.name,
      });
    }
  }

  // 4 · src/lib
  for (const f of LIB_FILES) {
    const path = `src/lib/${f}.ts`;
    const abs = join(ROOT, path);
    if (!existsSync(abs) || !isPureFile(sourceOf(abs))) continue;
    for (const fn of [...exportedFns(abs).values()].sort((a, b) => (a.name < b.name ? -1 : 1)))
      parts.push(partFromFn({ path, fn, lang: 'ts', what: 'function', examples, nameOverrides, tags: ['lib', 'lib:' + f] }));
  }

  // 5 · telephony/lib
  for (const f of TEL_FILES) {
    const path = `telephony/lib/${f}.mjs`;
    const abs = join(ROOT, path);
    if (!existsSync(abs) || !isPureFile(sourceOf(abs))) continue;
    for (const fn of [...exportedFns(abs).values()].sort((a, b) => (a.name < b.name ? -1 : 1)))
      parts.push(partFromFn({ path, fn, lang: 'js', what: 'function', examples, nameOverrides, tags: ['telephony', 'telephony:' + f] }));
  }

  parts.sort(byId);
  const seen = new Set();
  for (const p of parts) {
    if (seen.has(p.id)) throw new Error('מזהה כפול: ' + p.id);
    seen.add(p.id);
  }
  return parts;
}

function refOf() {
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT }).toString().trim();
    const sha = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: ROOT }).toString().trim();
    return `${branch}@${sha}`;
  } catch {
    return 'unknown@unknown';
  }
}

function serialize(parts, ref) {
  const clean = parts.map(({ _auto, ...p }) => p);
  return JSON.stringify({ source: SOURCE, repo: 'meir7651231-ui/maor-system', ref, generatedAt: null, parts: clean }, null, 1) + '\n';
}

function main() {
  const args = new Set(process.argv.slice(2));
  const parts = build();
  const errors = [];
  const strip = ({ _auto, ...p }) => p;
  for (const p of parts) for (const e of validatePart(strip(p))) errors.push(p.id + ' — ' + e);
  if (args.has('--report')) {
    const bad = parts.filter((p) => validatePart(strip(p)).some((e) => e.startsWith('name')));
    for (const p of bad) console.log(p.id, '|', p._auto, '|', p.does);
    console.log('names failing:', bad.length, '/', parts.length);
    return;
  }
  if (args.has('--check')) {
    if (!existsSync(OUT)) {
      console.error('הקטלוג: catalog/sources/orbit.json חסר. להרצה: node catalog/scripts/orbit-census.mjs');
      process.exit(1);
    }
    const cur = JSON.parse(readFileSync(OUT, 'utf8'));
    const want = serialize(parts, cur.ref);
    const srcErr = validateSource(cur);
    if (readFileSync(OUT, 'utf8') !== want || srcErr.length || errors.length) {
      console.error('הקטלוג: orbit.json לא מעודכן או לא עומד בחוזה.', [...srcErr, ...errors].slice(0, 20).join('\n'));
      console.error('להרצה: node catalog/scripts/orbit-census.mjs');
      process.exit(1);
    }
    console.log(`הקטלוג: orbit.json מעודכן — ${parts.length} חלקים.`);
    return;
  }
  if (errors.length) {
    console.error(errors.slice(0, 40).join('\n'));
    console.error(`הקטלוג: ${errors.length} הפרות-חוזה — לא נכתב. (--report לשמות)`);
    process.exit(1);
  }
  writeFileSync(OUT, serialize(parts, refOf()));
  console.log(`הקטלוג: נכתבו ${parts.length} חלקים ל-${rel(OUT)}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
export { NAME_VERBS };
