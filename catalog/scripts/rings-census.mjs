#!/usr/bin/env node
// מפקד-חלקים · מנוע-הטבעות — כל לבנה עם שם מ-lab13/shelf3.json הופכת לחלק (Part) בפורמט המשותף.
// קורא רק מ-git (ref קבוע) של הריפו `-ai-chat-server` (קריאה-בלבד), מריץ כל לבנה פעם אחת במכונה הקפדנית
// (lab13/machine3s.mjs, 16 תאים) כדי לתת דוגמה אמיתית, וכותב catalog/sources/rings.json — דטרמיניסטי, ממוין לפי id.
//
// הרצה:   node catalog/scripts/rings-census.mjs [--repo <נתיב-לשכפול>] [--ref claude/lab-rings|<sha>] [--check]
//   --repo   ברירת-מחדל: $CATALOG_SRC_REPO או ../meir7651231-ui/-ai-chat-server (יחסית לשורש maor-system)
//   --ref    ענף (נפתר ל-origin/<ענף>) או sha. ברירת-מחדל: claude/lab-rings
//   --check  לא כותב; יוצא 1 אם הקובץ הקיים שונה ממה שהיה נוצר עכשיו.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { byId } from '../self/parts.mjs'; // 🧩 SELF-V2: «ממיין» — חלק-המכונה המוכח (במקום העתק מקומי)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'catalog/sources/rings.json');
const SHELF = 'lab-rings/lab13/shelf3.json';
const RUNNER = 'lab-rings/lab13/machine3s.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const CHECK = args.includes('--check');
const REPO = path.resolve(ROOT, opt('--repo', process.env.CATALOG_SRC_REPO || '../meir7651231-ui/-ai-chat-server'));
const REF = opt('--ref', 'claude/lab-rings');

const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
function resolveRef(ref) {
  for (const r of [`origin/${ref}`, ref]) { try { return git('rev-parse', '--verify', `${r}^{commit}`).trim(); } catch { /* הבא */ } }
  throw new Error(`ref לא נמצא: ${ref}`);
}
// 🧪 SELF-V2: ה-sha נקרא מ-git בפעם הראשונה שצריך (לא בטעינה) — טהור-בטעינה
let SHA_; const SHA = () => (SHA_ ??= resolveRef(REF));
const show = (p) => git('show', `${SHA()}:${p}`);

// ── המכונה: מחלצים את machine3s.mjs ואת מה שהוא קורא (import יחסי + קבצי-טקסט) לתיקייה זמנית ──
async function loadMachine() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rings-census-'));
  const base = path.posix.dirname(RUNNER); const seen = new Set();
  const pull = (name) => {
    if (seen.has(name)) return; seen.add(name);
    let txt; try { txt = show(`${base}/${name}`); } catch { return; }
    fs.writeFileSync(path.join(dir, name), txt);
    if (!name.endsWith('.mjs')) return;
    for (const m of txt.matchAll(/['"]\.?\/?([\w.-]+\.(?:mjs|txt))['"]/g)) pull(m[1]);
  };
  pull(path.posix.basename(RUNNER));
  const mod = await import(pathToFileURL(path.join(dir, path.posix.basename(RUNNER))).href);
  return { run: mod.run, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

// ── סיווג לבנה: מה היא לוקחת ומה היא נותנת ──
// רשימה = רשימה מקושרת: הראש בתא 1, «הבא» של כל איבר שמור בתא שלו (8–15), 0 = סוף. ערכי-הרשימה = כתובות 8–15.
const LIST_TO_LIST = /^(הפוך רשימה|מיין רשימה|בלי |רק )/;
const LIST_IN = /רשימה|ספור|^רר?\d|^בלי |^רק |עליות|ירידות|ממוינת|השני בגודלו|^הגדול כפול הקטן$|סכום בלי הגדול|כמה מעל האמצע|גדול וקטן/;
const KEY_LIST = /^(חפש ברשימה|ספור גדולים מ-X)$/;     // תא 0 = מפתח, תא 1 = ראש-הרשימה
const ADDR = /כתובת/;
const CELL_NAMES = { 0: 'א', 1: 'ב', 3: 'ג', 4: 'ד', 2: 'תא2' };

function classify(b) {
  const isList = LIST_IN.test(b.name);
  if (b.name === 'ועוד 1 באותו תא') return { mode: 'self', takes: [{ name: 'תא 2', kind: 'number', type: 'cell2:0..15' }], gives: { kind: 'number', type: 'cell2:0..15' } };
  if (b.name === 'גדול וקטן') return { mode: 'list', takes: [{ name: 'רשימה', kind: 'list', type: 'linked-list@cell1' }], gives: { kind: 'sequence', type: 'cells6,7:[max,min]' } };
  if (isList) {
    const takes = KEY_LIST.test(b.name) ? [{ name: 'מפתח', kind: 'number', type: 'cell0:0..15' }] : [];
    takes.push({ name: 'רשימה', kind: 'list', type: 'linked-list@cell1' });
    const gives = LIST_TO_LIST.test(b.name) ? { kind: 'list', type: 'linked-list@cell1' } : { kind: 'number', type: `cell${b.out}:0..15` };
    return { mode: KEY_LIST.test(b.name) ? 'keylist' : 'list', takes, gives };
  }
  if (b.name === 'כתוב לכתובת שבתא') return { mode: 'write', takes: [{ name: 'כתובת', kind: 'number', type: 'cell0:8..15' }, { name: 'ערך', kind: 'number', type: 'cell1:0..15' }], gives: { kind: 'number', type: 'cell[cell0]:0..15' } };
  const ins = (b.ins || []).filter((c) => c !== b.out);
  return {
    mode: ADDR.test(b.name) ? 'addr' : 'num',
    takes: ins.map((c) => ({ name: CELL_NAMES[c] || `תא ${c}`, kind: 'number', type: `cell${c}:0..15` })),
    gives: { kind: 'number', type: `cell${b.out}:0..15` },
  };
}

// ── שם בעברית פשוטה (צירוף-פועל, עד 9 מילים) ──
const FAMILY = /^(רר|ר|מ|ש)(\d+)\s+/;
function verbName(raw) {
  let n = raw.replace(FAMILY, '').replace(/\s*\((?:מספרים|מספר)\)\s*/g, ' ').trim();
  let m;
  if (n.startsWith('אם (')) return 'בחר בין שני מספרים לפי תנאי';
  if (n === 'שלוש פעמים') return 'הכפל את המספר ב-3';
  n = n.replace(/\s+\([^)]*\)$/, '');
  if ((m = n.match(/^תנאי:\s*(.+)$/))) return `בדוק אם המספר הוא אחד מ-${m[1]}`;
  if ((m = n.match(/^קבוע (\d+)/))) return `תן את המספר הקבוע ${m[1]}`;
  if ((m = n.match(/^ועוד (\d+)$/))) return `הוסף ${m[1]} למספר`;
  if (n === 'ועוד 1 באותו תא') return 'הוסף 1 למספר שבאותו תא';
  if ((m = n.match(/^פחות (\d+)$/))) return `הפחת ${m[1]} מהמספר`;
  if ((m = n.match(/^כפול (\d+)$/))) return `הכפל את המספר ב-${m[1]}`;
  if (n === 'חצי') return 'חשב חצי מהמספר';
  if (n === 'העתק') return 'העתק את המספר';
  if (n === 'לא') return 'הפוך את כל הביטים של המספר';
  if (n === 'כפל') return 'הכפל שני מספרים';
  if (n === 'חילוק') return 'חלק מספר במספר';
  if (n === 'חיסור') return 'החסר מספר ממספר';
  if (n === 'חיבור מספרים') return 'חבר שני מספרים';
  if ((m = n.match(/^בלי (.+)$/))) return `הסר את ${m[1]} מהרשימה`;
  if ((m = n.match(/^רק (.+)$/))) return `השאר ברשימה רק את ${m[1]}`;
  if (n.endsWith('?') || n.startsWith('האם ')) return `בדוק אם ${n.replace(/\?$/, '').replace(/^האם /, '').trim()}`;
  if (n === 'כתוב לכתובת שבתא') return 'כתוב ערך לכתובת שבתא';
  if (n === 'קח מהכתובת שבתא') return 'קח ערך מהכתובת שבתא';
  if (/^(הפוך|מיין|ספור|חפש|דלג|בחר|הגבל|צעד)(?=\s|$)/.test(n)) return n;
  return `חשב ${n}`;
}
const clip = (s, k) => s.split(/\s+/).slice(0, k).join(' ').replace(/[\s,:;·]+$/, '');

// ── דוגמה מהרצה אמיתית (קלטים קבועים, בלי לכלוך — דטרמיניסטי) ──
const SAMPLE_LIST = [12, 9, 14, 10];
function chainList(mem, l) { mem[1] = l[0] || 0; l.forEach((a, i) => { mem[a] = l[i + 1] || 0; }); }
function walk(mem, head) { const out = []; let a = head; for (let i = 0; a && i < 10; i++) { out.push(a); a = mem[a]; } return out; }
function example(run, b, c) {
  const mem = Array.from({ length: 16 }, () => 0); let inp;
  if (c.mode === 'list' || c.mode === 'keylist') {
    const cap = b.name.match(/עד (\d+)/);   // לבנה שהחוזה שלה מוגבל באורך — מקבלת רשימה בתוך החוזה
    const l = cap ? SAMPLE_LIST.slice(0, Math.min(+cap[1], SAMPLE_LIST.length)) : SAMPLE_LIST.slice();
    chainList(mem, l); inp = { 'רשימה': l };
    if (c.mode === 'keylist') { mem[0] = 10; inp = { 'מפתח': 10, ...inp }; }
  } else if (c.mode === 'self') { mem[2] = 4; inp = { 'תא 2': 4 }; }
  else if (c.mode === 'write') { mem[0] = 9; mem[1] = 5; inp = { 'כתובת': 9, 'ערך': 5 }; }
  else if (c.mode === 'addr') { mem[0] = 9; mem[9] = 7; inp = { 'כתובת': 9, 'בתא 9': 7 }; }
  else {
    const flag = b.name.match(/^תנאי:\s*(\d+)/);   // תנאי: מראים מספר מתוך הקבוצה (התשובה 15 = כן)
    const vals = { 0: flag ? +flag[1] : 6, 1: 3, 3: 2, 4: 5 }; inp = {};
    for (const t of c.takes) { const cell = +t.type.match(/^cell(\d+)/)[1]; mem[cell] = vals[cell] ?? 1; inp[t.name] = mem[cell]; }
    if (b.name.startsWith('דלג אם')) mem[2] = 0;
  }
  const r = run(b.prog, mem, { maxSteps: 200000 });
  if (!r) return null;
  let out;
  if (c.gives.kind === 'list') out = walk(r.mem, r.mem[1]);
  else if (c.gives.kind === 'sequence') out = [r.mem[6], r.mem[7]];
  else if (c.mode === 'write') out = r.mem[9];
  else out = r.mem[b.out];
  return { in: inp, out };
}

function does(b, c) {
  const what = b.name.replace(FAMILY, '');
  const from = c.takes.map((t) => t.kind === 'list' ? 'רשימה מקושרת (ראש בתא 1)' : t.type.split(':')[0].replace('cell', 'תא ')).join(', ');
  const to = c.gives.kind === 'list' ? 'מסדרת מחדש את הרשימה במקום' : c.gives.kind === 'sequence' ? 'שמה בתא 6 את הגדול ובתא 7 את הקטן' : `שמה את התוצאה ב${c.gives.type.split(':')[0].replace(/^cell(\d+)$/, 'תא $1').replace('cell[cell0]', 'תא שכתובתו בתא 0')}`;
  return `לבנה «${what}» במכונת 16 התאים: לוקחת ${from || 'את תא 2'} ו${to} (חשבון מודולו 16).`;
}

async function build() {
  const shelf = JSON.parse(show(SHELF));
  const { run, cleanup } = await loadMachine();
  const parts = [];
  try {
    const seen = new Map();
    for (const b of shelf.named) {
      const c = classify(b);
      const fam = b.name.match(FAMILY);
      let symbol = b.name; const k = (seen.get(symbol) || 0) + 1; seen.set(symbol, k); if (k > 1) symbol = `${symbol}~${k}`;
      const tags = ['rings', 'lab13', 'shelf3', `steps:${b.prog.length}`];
      if (fam) tags.push(`family:${fam[1]}`);
      if (b.recipe) tags.push('recipe');
      if (b.movable) tags.push('movable');
      if (b.name.startsWith('תנאי:')) tags.push('flag:15=true');
      parts.push({
        id: `rings:${SHELF}#${symbol}`, source: 'rings', path: SHELF, symbol, lang: 'machine', what: 'brick',
        name: clip(verbName(b.name), 9), does: does(b, c), takes: c.takes, gives: c.gives, pure: true,
        example: example(run, b, c), tags: tags.sort(),
      });
    }
  } finally { cleanup(); }
  parts.sort(byId);
  return { source: 'rings', repo: 'meir7651231-ui/-ai-chat-server', ref: `${REF.replace(/^origin\//, '')}@${SHA()}`, generatedAt: null, parts };
}

async function main() {
  const text = JSON.stringify(await build(), null, 2) + '\n';
  if (CHECK) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error(`✗ ${path.relative(ROOT, OUT)} לא מעודכן — הרץ: node catalog/scripts/rings-census.mjs`); process.exit(1); }
    console.log(`✓ ${path.relative(ROOT, OUT)} מעודכן`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, text);
    const p = JSON.parse(text).parts; console.log(`✓ ${p.length} לבנים · ${p.filter((x) => x.example).length} עם דוגמה ⇒ ${path.relative(ROOT, OUT)}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
