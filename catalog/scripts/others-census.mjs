#!/usr/bin/env node
// others-census.mjs — מפקד החלקים של חמשת הריפואים "האחרים":
// yeshiva-engine · qa-scanner · yoman-habina · 14kk · MMMM.
//
// קורא קוד בלבד (py/js/mjs/ts/tsx) — לעולם לא קבצי נתונים/קונפיג (json/env/yml).
// מחלץ חתימות בלבד: שם, פרמטרים (שם + טיפוס מוצהר — בלי ערכי-ברירת-מחדל, שם עלולים לשבת סודות),
// טיפוס-חזרה, שורת-תיעוד ראשונה, סימני-טוהר, ו"טבלאות-כללים" שכתובות בקוד בעברית
// (מהלכי הישיבה, שלבי הביקורת, בדיקות-החשיפה של הסורק). Python ⇒ `python3 -I` עם המודול ast;
// TS/JS ⇒ TypeScript compiler API. אף קוד של הריפואים לא מורץ.
//
// שימוש:
//   node catalog/scripts/others-census.mjs [--root /home/user] [--out catalog/sources] [--check]
// כל ריפו נמצא ב-<root>/<dir> (ראה REPOS.dirs). ריפו חסר ⇒ לא נכתב קובץ (הקובץ הקיים נשמר) + אזהרה.
// --check: לא כותב; יציאה 1 אם קובץ כלשהו היה משתנה.
// הפלט דטרמיניסטי: generatedAt=null, החלקים ממוינים לפי id, אין חותמות-זמן.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')
const require = createRequire(join(REPO_ROOT, 'package.json'))
const ts = require('typescript')

const argv = process.argv.slice(2)
const arg = (k, d) => {
  const i = argv.indexOf(k)
  return i >= 0 ? argv[i + 1] : d
}
const ROOT = arg('--root', '/home/user')
const OUT = resolve(REPO_ROOT, arg('--out', 'catalog/sources'))
const CHECK = argv.includes('--check')
const RAW = arg('--raw', null)

// ================================================================ הריפואים
// include/exclude = ביטויים רגולריים על הנתיב היחסי (exclude גובר).
// keepImpure = נתיבים שבהם גם פונקציה ציבורית לא-טהורה היא "מנוע לשימוש חוזר" (לא סקריפט חד-פעמי).
const REPOS = [
  {
    source: 'yeshiva',
    repo: 'meir7651231-ui/yeshiva-engine',
    dirs: ['yeshiva-engine'],
    include: [/^yeshiva\/.*\.py$/, /^arena\/shop\/.*\.py$/, /^random\/minisql\/minisql\/.*\.py$/, /^bench\/(score|report|tasks)\.py$/, /^harness\/(guard|police)\.mjs$/],
    exclude: [/__init__\.py$/, /__main__\.py$/, /\/cli\.py$/, /\/seed\.py$/, /conftest\.py$/],
    keepImpure: [/^yeshiva\//, /^arena\//, /^random\//, /^bench\//],
  },
  {
    source: 'qa-scanner',
    repo: 'meir7651231-ui/qa-scanner',
    dirs: ['meir7651231-ui/qa-scanner', 'qa-scanner'],
    include: [/^[^/]+\.py$/],
    exclude: [/^run_batch\.py$/, /^auto_audit\.py$/],
    keepImpure: [/./],
  },
  {
    source: 'yoman-habina',
    repo: 'meir7651231-ui/yoman-habina',
    dirs: ['yoman-habina'],
    include: [/^engine\.js$/, /^verify\.mjs$/],
    exclude: [],
    keepImpure: [/./],
  },
  {
    source: '14kk',
    repo: 'meir7651231-ui/14kk',
    dirs: ['14kk'],
    // הליבה: שרתי-ה-API, השירותים, ה-MVP והפרוטוקולים. בחוץ: גרסאות-גיבוי, ארכיון, בדיקות/דיבאג/תיקונים חד-פעמיים, מסכי-UI.
    include: [/\.(js|mjs|cjs)$/],
    exclude: [
      /^archive\//, /^unused_files_backup\//, /^frontend\//, /node_modules/, /(^|\/)tests?\//,
      /(^|\/)(test|debug|fix|get_chat_id|quick_test|check_|clean|setup_|build_|add_|full_aegis|ultimate_aegis|platform_status|development_progress|simple_aegis|run_aegis|start_protocols)/,
      /\.config\.js$/, /^database\//, /healthcheck\.js$/, /^lib\/shared_/,
    ],
    keepImpure: [/^services\/(api-gateway|auth-service)\//],
  },
  {
    source: 'mmmm',
    repo: 'meir7651231-ui/MMMM',
    dirs: ['mmmm', 'MMMM'],
    // ספריות + שרת-ה-API. בחוץ: shadcn/ui (ספריית-צד-שלישי מועתקת), קוד-מחולל (orval), מסכים, תצורות.
    include: [/\.(ts|tsx|js|mjs)$/],
    exclude: [/components\/ui\//, /node_modules/, /\.generated\//, /\/generated\//, /\.config\.ts$/, /(^|\/)(main|App)\.tsx$/, /\/pages\//, /\.d\.ts$/, /build\.mjs$/, /mockupPreviewPlugin/, /scripts\/src\/hello/],
    keepImpure: [/^lib\//, /^artifacts\/api-server\/src\/swarm\//],
  },
]

// ================================================================ Python (ast)
const PY = String.raw`
import ast, json, sys, hashlib
IMPURE_CALLS = {'open','print','input','exec','eval','compile','__import__','exit','quit','sync_playwright','urlopen'}
IMPURE_ROOTS = {'os','sys','subprocess','time','random','requests','urllib','socket','shutil','datetime','Path','http','smtplib','dns','ssl','logging','tempfile','glob','threading','asyncio','sqlite3','webbrowser','pw','page','browser','fcntl','importlib'}
IMPURE_METHODS = {'write','write_text','write_bytes','read_text','read_bytes','unlink','mkdir','append','extend','pop','remove','insert','clear','update','add','discard','setdefault','sort','send','sendall','recv','connect','close','flush','seek','truncate','popitem','rmdir','rename','touch','glob','rglob','iterdir','exists','is_file','is_dir','stat','open','run','check_output','Popen','sleep','now','today','randint','choice','shuffle','post','put','commit','execute','fetchall','fetchone','goto','fsync'}
RULE_TABLES = {'BUG_STEPS','AUDIT_STEPS','MENU'}
def ann(n):
    if n is None: return None
    try: return ast.unparse(n)
    except Exception: return None
def doc1(n):
    d = ast.get_docstring(n)
    if not d: return None
    for line in d.strip().splitlines():
        line=line.strip()
        if line: return line[:300]
    return None
def root_name(n):
    while isinstance(n,(ast.Attribute,ast.Subscript,ast.Call)): n=n.value if not isinstance(n,ast.Call) else n.func
    return n.id if isinstance(n,ast.Name) else None
def body_wo_doc(fn):
    b=list(fn.body)
    if b and isinstance(b[0],ast.Expr) and isinstance(getattr(b[0],'value',None),ast.Constant) and isinstance(b[0].value.value,str): b=b[1:]
    return b
def is_stub(fn):
    b=body_wo_doc(fn)
    if not b: return True
    if len(b)==1 and isinstance(b[0],ast.Pass): return True
    if len(b)==1 and isinstance(b[0],ast.Return) and b[0].value is not None:
        try:
            ast.literal_eval(b[0].value); return True
        except Exception: return False
    return False
def purity(fn, module_globals, local_params):
    reasons=set(); assigned=set()
    for node in ast.walk(fn):
        if isinstance(node,ast.Name) and isinstance(node.ctx,ast.Store): assigned.add(node.id)
    for node in ast.walk(fn):
        if isinstance(node,(ast.Global,ast.Nonlocal)): reasons.add('global')
        if isinstance(node,ast.Await): reasons.add('async')
        if isinstance(node,ast.Call):
            f=node.func
            if isinstance(f,ast.Name):
                if f.id in IMPURE_CALLS or f.id in IMPURE_ROOTS: reasons.add('io:'+f.id)
            elif isinstance(f,ast.Attribute):
                r=root_name(f)
                if r in IMPURE_ROOTS: reasons.add('io:'+r)
                if f.attr in IMPURE_METHODS and r not in ('re','math','str','itertools','functools','json'):
                    if r is None or r in local_params or r in ('self','cls') or (r in module_globals and r not in assigned):
                        reasons.add('mut:'+f.attr)
        if isinstance(node,(ast.Assign,ast.AugAssign,ast.AnnAssign)):
            tgts = node.targets if isinstance(node,ast.Assign) else [node.target]
            for t in tgts:
                if isinstance(t,(ast.Attribute,ast.Subscript)):
                    r=root_name(t)
                    if r in local_params or r in ('self','cls') or (r in module_globals and r not in assigned): reasons.add('mut:attr')
        if isinstance(node,ast.Delete): reasons.add('mut:del')
    return sorted(reasons)
def params(fn, skip_self):
    a=fn.args; out=[]
    allp = list(a.posonlyargs)+list(a.args)
    for i,p in enumerate(allp):
        if skip_self and i==0 and p.arg in ('self','cls'): continue
        out.append({'name':p.arg,'type':ann(p.annotation)})
    if a.vararg: out.append({'name':'*'+a.vararg.arg,'type':ann(a.vararg.annotation)})
    for p in a.kwonlyargs: out.append({'name':p.arg,'type':ann(p.annotation)})
    if a.kwarg: out.append({'name':'**'+a.kwarg.arg,'type':ann(a.kwarg.annotation)})
    return out
def calls_in(fn):
    names=set(); selfs=set()
    for node in ast.walk(fn):
        if isinstance(node,ast.Call):
            f=node.func
            if isinstance(f,ast.Name): names.add(f.id)
            elif isinstance(f,ast.Attribute) and isinstance(f.value,ast.Name) and f.value.id in ('self','cls'): selfs.add(f.attr)
    return sorted(names), sorted(selfs)
def sconst(n):
    if isinstance(n,ast.Constant) and isinstance(n.value,str): return n.value
    if isinstance(n,ast.JoinedStr):
        parts=[v.value for v in n.values if isinstance(v,ast.Constant) and isinstance(v.value,str)]
        s=''.join(parts).strip()
        return s or None
    return None
def tuple_names(tree):
    out={}
    for node in ast.walk(tree):
        if isinstance(node,ast.Tuple) and len(node.elts)==2 and sconst(node.elts[0]) is not None:
            v=node.elts[1]
            if isinstance(v,ast.IfExp): v=v.body
            if isinstance(v,ast.Call) and isinstance(v.func,ast.Name): out.setdefault(v.func.id,sconst(node.elts[0]))
    return out
def seed_kinds(tree):
    out=[]
    for node in ast.walk(tree):
        if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id=='Seed' and node.args and sconst(node.args[0]):
            if node.args[0].value not in out: out.append(node.args[0].value)
    return out
def move_tables(tree):
    # רשימות של X(...) כש-X הוא dataclass במודול עם שדות key+pattern — "מהלכים" (חוקי-זיהוי על טקסט)
    fields={}
    for n in tree.body:
        if isinstance(n,ast.ClassDef):
            fl=[b.target.id for b in n.body if isinstance(b,ast.AnnAssign) and isinstance(b.target,ast.Name)]
            if 'key' in fl and 'pattern' in fl: fields[n.name]=fl
    out=[]
    for n in tree.body:
        if isinstance(n,(ast.Assign,ast.AnnAssign)) and isinstance(getattr(n,'value',None),(ast.List,ast.Tuple)):
            tname = (n.targets[0].id if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) else (n.target.id if isinstance(n,ast.AnnAssign) and isinstance(n.target,ast.Name) else '?'))
            for e in n.value.elts:
                if isinstance(e,ast.Call) and isinstance(e.func,ast.Name) and e.func.id in fields:
                    fl=fields[e.func.id]; rec={'cls':e.func.id,'table':tname,'line':e.lineno}
                    for i,a in enumerate(e.args):
                        if i<len(fl) and fl[i]!='pattern': rec[fl[i]]=sconst(a)
                    for k in e.keywords:
                        if k.arg and k.arg!='pattern': rec[k.arg]=sconst(k.value)
                    if rec.get('key'): out.append(rec)
    return out
def rule_tables(tree):
    out=[]
    for n in tree.body:
        if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in RULE_TABLES and isinstance(n.value,(ast.Tuple,ast.List)):
            for e in n.value.elts:
                if isinstance(e,ast.Tuple) and e.elts and sconst(e.elts[0]):
                    desc = sconst(e.elts[1]) if len(e.elts)>2 else None
                    out.append({'table':n.targets[0].id,'name':sconst(e.elts[0]),'desc':desc,'line':e.lineno})
    return out
def rule_calls(tree):
    # self.add(<id>, g, "שם הבדיקה", <passed>, "חומרה", ...)  ·  Issue/Finding("חומרה", "סוג", ...)
    out=[]
    def visit(node, fn):
        for ch in ast.iter_child_nodes(node):
            if isinstance(ch,(ast.FunctionDef,ast.AsyncFunctionDef)): visit(ch, ch.name); continue
            if isinstance(ch,ast.Call):
                f=ch.func
                if isinstance(f,ast.Attribute) and f.attr=='add' and isinstance(f.value,ast.Name) and f.value.id=='self' and len(ch.args)>=5 and sconst(ch.args[2]):
                    gid = ch.args[0].value if isinstance(ch.args[0],ast.Constant) else None
                    out.append({'kind':'check','group':fn,'id':gid,'name':sconst(ch.args[2]),'sev':sconst(ch.args[4]),'line':ch.lineno})
                elif isinstance(f,ast.Name) and f.id in ('Issue','Finding') and len(ch.args)>=2 and sconst(ch.args[1]):
                    out.append({'kind':'issue','group':fn,'id':None,'name':sconst(ch.args[1]),'sev':sconst(ch.args[0]),'line':ch.lineno})
            visit(ch, fn)
    visit(tree, None)
    return out
res=[]
base=sys.argv[1]
for path in sys.argv[2:]:
    src=open(base+'/'+path,encoding='utf-8',errors='replace').read()
    try: tree=ast.parse(src)
    except SyntaxError:
        res.append({'path':path,'error':'syntax','items':[]}); continue
    gl=set()
    for n in tree.body:
        if isinstance(n,(ast.Assign,ast.AnnAssign)):
            for t in (n.targets if isinstance(n,ast.Assign) else [n.target]):
                if isinstance(t,ast.Name): gl.add(t.id)
    imports={}
    pdir=path.split('/')[:-1]
    for node in ast.walk(tree):
        if isinstance(node,ast.ImportFrom) and node.level>=1:
            d=pdir[:len(pdir)-(node.level-1)] if node.level>1 else pdir
            target='/'.join(d+(node.module.split('.') if node.module else []))
            for a in node.names: imports[a.asname or a.name]=[target+'.py',a.name]
    mod={'path':path,'imports':imports,'doc':doc1(tree),'named':tuple_names(tree),'seeds':seed_kinds(tree),'moves':move_tables(tree),
         'tables':rule_tables(tree),'checks':rule_calls(tree),'items':[]}
    def fn_item(fn, qual, cls=None):
        pl=params(fn, cls is not None)
        local={p['name'].lstrip('*') for p in pl}
        names,selfs=calls_in(fn)
        h=hashlib.sha1(ast.dump(ast.Module(body=body_wo_doc(fn),type_ignores=[])).encode()).hexdigest()[:16]
        mod['items'].append({'kind':'function','symbol':qual,'cls':cls,'line':fn.lineno,'params':pl,'returns':ann(fn.returns),
            'doc':doc1(fn),'impure':purity(fn,gl,local),'async':isinstance(fn,ast.AsyncFunctionDef),
            'decorators':[ann(d) for d in fn.decorator_list],'calls':names,'selfcalls':selfs,'hash':h,'stub':is_stub(fn),
            'loc':(fn.end_lineno or fn.lineno)-fn.lineno+1})
    for n in tree.body:
        if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)):
            fn_item(n,n.name)
        elif isinstance(n,ast.ClassDef):
            fields=[{'name':b.target.id,'type':ann(b.annotation)} for b in n.body if isinstance(b,ast.AnnAssign) and isinstance(b.target,ast.Name)]
            methods=[b.name for b in n.body if isinstance(b,(ast.FunctionDef,ast.AsyncFunctionDef))]
            mod['items'].append({'kind':'class','symbol':n.name,'line':n.lineno,'doc':doc1(n),'bases':[ann(b) for b in n.bases],
                'decorators':[ann(d) for d in n.decorator_list],'fields':fields,'methods':methods,'loc':(n.end_lineno or n.lineno)-n.lineno+1})
            for b in n.body:
                if isinstance(b,(ast.FunctionDef,ast.AsyncFunctionDef)): fn_item(b,n.name+'.'+b.name,n.name)
    res.append(mod)
json.dump(res,sys.stdout,ensure_ascii=False)
`

function pyExtract(base, files) {
  if (!files.length) return []
  const out = execFileSync('python3', ['-I', '-c', PY, base, ...files], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  return JSON.parse(out)
}

// ================================================================ TS/JS (compiler API)
const JS_IMPURE_ROOTS = new Set(['console', 'process', 'fs', 'require', 'fetch', 'axios', 'document', 'window', 'localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'http', 'https', 'net', 'bot', 'app', 'db', 'mongoose', 'pool', 'client', 'res', 'req', 'navigator', 'XMLHttpRequest', 'WebSocket', 'io', 'socket', 'redis', 'child_process', 'execSync', 'spawn', 'exec', 'openai', 'anthropic', 'router', 'jwt', 'bcrypt', 'ffmpeg', 'chromium', 'logger'])
const JS_IMPURE_METHODS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'set', 'delete', 'clear', 'add', 'appendChild', 'removeChild', 'insertBefore', 'setAttribute', 'addEventListener', 'writeFileSync', 'readFileSync', 'writeFile', 'readFile', 'send', 'emit', 'save', 'insertOne', 'findOne', 'query', 'listen'])
const SAFE_ROOTS = new Set(['Math', 'Object', 'Array', 'JSON', 'String', 'Number', 'Boolean', 'RegExp', 'Promise', 'Symbol', 'Uint8Array', 'Float32Array', 'Int16Array', 'Buffer'])

function jsDoc(node, sf) {
  const ranges = ts.getLeadingCommentRanges(sf.text, node.getFullStart()) || []
  for (let i = ranges.length - 1; i >= 0; i--) {
    const c = sf.text.slice(ranges[i].pos, ranges[i].end)
    const lines = c.replace(/^\/\*\*?|\*\/$/g, '').split('\n').map((l) => l.replace(/^\s*(\*|\/\/)\s?/, '').replace(/[─═━]+/g, ' ').trim())
    const line = lines.find((l) => l && !l.startsWith('@') && (/[א-ת]/.test(l) || l.split(/\s+/).length >= 3))
    if (line) return line.slice(0, 300)
  }
  return null
}

function rootOf(expr) {
  while (expr && (ts.isPropertyAccessExpression(expr) || ts.isElementAccessExpression(expr) || ts.isCallExpression(expr) || ts.isNonNullExpression(expr))) expr = expr.expression
  if (!expr) return null
  if (ts.isIdentifier(expr)) return expr.text
  if (expr.kind === ts.SyntaxKind.ThisKeyword) return 'this'
  return null
}

function jsAnalyze(fnNode, params) {
  const reasons = new Set()
  const locals = new Set()
  const calls = new Set()
  const selfcalls = new Set()
  const collect = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) locals.add(n.name.text)
    if ((ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n)) && n.name) locals.add(n.name.text)
    if (ts.isParameter(n) && ts.isIdentifier(n.name)) locals.add(n.name.text)
    ts.forEachChild(n, collect)
  }
  if (fnNode.body) collect(fnNode.body)
  const visit = (n) => {
    if (ts.isAwaitExpression(n)) reasons.add('async')
    if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && (['WebSocket', 'XMLHttpRequest', 'AudioContext', 'MediaRecorder', 'Worker'].includes(n.expression.text) || (n.expression.text === 'Date' && !(n.arguments && n.arguments.length)))) reasons.add('io:' + n.expression.text)
    if (ts.isCallExpression(n)) {
      const r = rootOf(n.expression)
      if (ts.isIdentifier(n.expression)) {
        calls.add(n.expression.text)
        if (JS_IMPURE_ROOTS.has(n.expression.text)) reasons.add('io:' + n.expression.text)
      }
      if (r && JS_IMPURE_ROOTS.has(r) && !locals.has(r) && !params.has(r)) reasons.add('io:' + r)
      if (r && (r === 'req' || r === 'res') && params.has(r)) reasons.add('io:http')
      if (ts.isPropertyAccessExpression(n.expression)) {
        const m = n.expression.name.text
        if (r === 'this' && n.expression.expression.kind === ts.SyntaxKind.ThisKeyword) selfcalls.add(m)
        if (r === 'Math' && m === 'random') reasons.add('io:random')
        if (r === 'Date' && m === 'now') reasons.add('io:now')
        if (JS_IMPURE_METHODS.has(m) && r && !SAFE_ROOTS.has(r) && (params.has(r) || r === 'this' || !locals.has(r))) reasons.add('mut:' + m)
      }
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && n.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
      const l = n.left
      if (ts.isPropertyAccessExpression(l) || ts.isElementAccessExpression(l)) {
        const r = rootOf(l)
        if (r && (params.has(r) || r === 'this' || !locals.has(r))) reasons.add('mut:attr')
      } else if (ts.isIdentifier(l) && !locals.has(l.text) && !params.has(l.text)) reasons.add('global')
    }
    if ((ts.isPostfixUnaryExpression(n) || ts.isPrefixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken) && ts.isIdentifier(n.operand) && !locals.has(n.operand.text) && !params.has(n.operand.text)) reasons.add('global')
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) reasons.add('jsx')
    ts.forEachChild(n, visit)
  }
  if (fnNode.body) visit(fnNode.body)
  return { impure: [...reasons].sort(), calls: [...calls].sort(), selfcalls: [...selfcalls].sort() }
}

function jsStub(fn) {
  const b = fn.body
  if (!b) return false
  if (!ts.isBlock(b)) return isLiteral(b)
  const stmts = b.statements
  if (!stmts.length) return true
  return stmts.length === 1 && ts.isReturnStatement(stmts[0]) && !!stmts[0].expression && isLiteral(stmts[0].expression)
}
function isLiteral(e) {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e)) e = e.expression
  if (ts.isStringLiteral(e) || ts.isNumericLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return true
  if (e.kind === ts.SyntaxKind.TrueKeyword || e.kind === ts.SyntaxKind.FalseKeyword || e.kind === ts.SyntaxKind.NullKeyword) return true
  if (ts.isArrayLiteralExpression(e)) return e.elements.every(isLiteral)
  if (ts.isObjectLiteralExpression(e)) return e.properties.every((p) => ts.isPropertyAssignment(p) && isLiteral(p.initializer))
  if (ts.isPrefixUnaryExpression(e)) return isLiteral(e.operand)
  return false
}

function jsParams(fn, sf) {
  return fn.parameters.map((p) => ({
    name: ts.isIdentifier(p.name) ? (p.dotDotDotToken ? '...' : '') + p.name.text : p.name.kind === ts.SyntaxKind.ObjectBindingPattern ? '{' + p.name.elements.map((e) => (ts.isIdentifier(e.name) ? e.name.text : '?')).join(',') + '}' : '[…]',
    type: p.type ? p.type.getText(sf) : null,
  }))
}

function jsExtract(base, files) {
  const mods = []
  for (const path of files) {
    const text = readFileSync(join(base, path), 'utf8')
    const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : path.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JSX
    const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind)
    const mod = { path, doc: null, named: {}, seeds: [], moves: [], tables: [], checks: [], items: [] }
    const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1
    const push = (fn, symbol, cls, node) => {
      const pl = jsParams(fn, sf)
      const set = new Set(pl.map((p) => p.name.replace(/^\.\.\./, '')))
      const a = jsAnalyze(fn, set)
      const bodyText = fn.body ? fn.body.getText(sf).replace(/\s+/g, ' ') : ''
      mod.items.push({
        kind: 'function', symbol, cls, line: lineOf(node), params: pl,
        returns: fn.type ? fn.type.getText(sf) : null, doc: jsDoc(node, sf), impure: a.impure,
        async: !!(fn.modifiers && fn.modifiers.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)), decorators: [],
        calls: a.calls, selfcalls: a.selfcalls, hash: createHash('sha1').update(bodyText).digest('hex').slice(0, 16), stub: jsStub(fn),
        loc: sf.getLineAndCharacterOfPosition(node.getEnd()).line - lineOf(node) + 2,
      })
    }
    const unwrap = (e) => {
      while (e && (ts.isParenthesizedExpression(e) || ts.isAsExpression(e))) e = e.expression
      return e
    }
    const walkScope = (stmts, depth) => {
      for (const s of stmts) {
        if (ts.isFunctionDeclaration(s) && s.name && s.body) {
          push(s, s.name.text, null, s)
        } else if (ts.isVariableStatement(s)) {
          for (const d of s.declarationList.declarations) {
            if (!ts.isIdentifier(d.name) || !d.initializer) continue
            const init = unwrap(d.initializer)
            if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) push(init, d.name.text, null, s)
          }
        } else if (ts.isClassDeclaration(s) && s.name) {
          const methods = s.members.filter((m) => (ts.isMethodDeclaration(m) || ts.isConstructorDeclaration(m)) && m.body)
          const fields = s.members.filter((m) => ts.isPropertyDeclaration(m) && m.name).map((m) => ({ name: m.name.getText(sf), type: m.type ? m.type.getText(sf) : null }))
          mod.items.push({ kind: 'class', symbol: s.name.text, line: lineOf(s), doc: jsDoc(s, sf), bases: (s.heritageClauses || []).flatMap((h) => h.types.map((t) => t.getText(sf))), decorators: [], fields, methods: methods.map((m) => (m.name ? m.name.getText(sf) : 'constructor')), loc: 0 })
          for (const m of methods) if (m.name) push(m, s.name.text + '.' + m.name.getText(sf), s.name.text, m)
        } else if (ts.isExpressionStatement(s) && depth < 2) {
          // IIFE: (function(){ ... })()  /  (() => {...})()
          let e = unwrap(s.expression)
          if (e && ts.isCallExpression(e)) {
            const callee = unwrap(e.expression)
            if (callee && (ts.isFunctionExpression(callee) || ts.isArrowFunction(callee)) && callee.body && ts.isBlock(callee.body)) walkScope(callee.body.statements, depth + 1)
          }
        }
      }
    }
    walkScope(sf.statements, 0)
    mods.push(mod)
  }
  return mods
}

// ================================================================ סריקה
function gitInfo(base) {
  const g = (...a) => execFileSync('git', ['-C', base, ...a], { encoding: 'utf8' }).trim()
  return { ref: `${g('rev-parse', '--abbrev-ref', 'HEAD')}@${g('rev-parse', 'HEAD')}`, files: g('ls-files').split('\n').filter(Boolean) }
}

function scanRepo(cfg) {
  const dir = cfg.dirs.map((d) => join(ROOT, d)).find((d) => existsSync(join(d, '.git')))
  if (!dir) return { cfg, missing: true, ref: null, mods: [], allFiles: [] }
  const { ref, files } = gitInfo(dir)
  const chosen = files.filter((f) => cfg.include.some((r) => r.test(f)) && !cfg.exclude.some((r) => r.test(f))).sort()
  const py = chosen.filter((f) => f.endsWith('.py'))
  const js = chosen.filter((f) => /\.(m?js|cjs|tsx?)$/.test(f))
  const mods = [...pyExtract(dir, py), ...jsExtract(dir, js)].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  return { cfg, missing: false, ref, dir, mods, allFiles: files }
}

// ================================================================ עברית פשוטה — שמות
// פועל ⇒ שם-פועל. צירופי-שם מתהפכים (סמיכות: "code quality score" ⇒ "ציון איכות קוד").
const VERB = {
  get: 'להביא', fetch: 'להביא', load: 'לטעון', read: 'לקרוא', check: 'לבדוק', test: 'לבדוק', verify: 'לאמת', validate: 'לאמת',
  assess: 'להעריך', estimate: 'להעריך', evaluate: 'להעריך', generate: 'להפיק', create: 'ליצור', make: 'ליצור', build: 'לבנות',
  init: 'לאתחל', initialize: 'לאתחל', setup: 'להכין', calculate: 'לחשב', calc: 'לחשב', compute: 'לחשב', run: 'להריץ',
  handle: 'לטפל ב', analyze: 'לנתח', identify: 'לזהות', detect: 'לזהות', define: 'להגדיר', use: 'להשתמש ב', report: 'לדווח על',
  list: 'לרשום', update: 'לעדכן', delete: 'למחוק', remove: 'להסיר', query: 'לשאול', send: 'לשלוח', start: 'להפעיל',
  add: 'להוסיף', communicate: 'לתקשר עם', render: 'להציג', show: 'להציג', display: 'להציג', describe: 'לתאר', scan: 'לסרוק',
  parse: 'לפרק', save: 'לשמור', extract: 'לחלץ', process: 'לעבד', apply: 'להחיל', select: 'לבחור', insert: 'להכניס', push: 'לדחוף',
  find: 'למצוא', search: 'לחפש', perform: 'לבצע', execute: 'לבצע', predict: 'לחזות', count: 'לספור', ask: 'לשאול', track: 'לעקוב אחרי',
  format: 'לעצב', import: 'לייבא', export: 'לייצא', suggest: 'להציע', propose: 'להציע', summarize: 'לסכם', authorize: 'לאשר',
  capture: 'לגבות', void: 'לבטל', cancel: 'לבטל', decode: 'לפענח', encode: 'לקודד', drop: 'להפיל', join: 'לחבר', connect: 'לחבר',
  resolve: 'לפתור', aggregate: 'לצבור', fix: 'לתקן', stop: 'לעצור', map: 'למפות', commit: 'לאשר סופית', accept: 'לקבל',
  expect: 'לדרוש', sort: 'למיין', walk: 'לעבור על', bind: 'לקשור', merge: 'למזג', split: 'לפצל', borrow: 'לשאול', close: 'לסגור',
  open: 'לפתוח', explain: 'להסביר', reserve: 'לשריין', release: 'לשחרר', consume: 'לצרוך', receive: 'לקלוט', allocate: 'להקצות',
  clamp: 'להגביל', place: 'להגיש', pay: 'לשלם', fulfill: 'לספק', restock: 'לחדש מלאי', require: 'לדרוש', dedupe: 'להסיר כפילויות',
  tokenize: 'לפרק למילים', peek: 'להציץ ב', advance: 'לקדם', rewrite: 'לשכתב', begin: 'להתחיל', revert: 'לבטל', flush: 'לרוקן',
  recover: 'לשחזר', dump: 'לפרוק', coerce: 'להמיר', convert: 'להמיר', compare: 'להשוות', rank: 'לדרג', filter: 'לסנן', crawl: 'לסרוק',
  collect: 'לאסוף', boot: 'לאתחל', fail: 'להציג כשל', optimize: 'לייעל', organize: 'לארגן', review: 'לבקר', implement: 'ליישם',
  document: 'לתעד', learn: 'ללמוד', authenticate: 'לאמת', subscribe: 'להירשם ל', publish: 'לפרסם', serve: 'להגיש', notify: 'להודיע על',
  ensure: 'לוודא', edit: 'לערוך', reset: 'לאפס', clear: 'לנקות', grow: 'להגדיל', pull: 'למשוך', dispatch: 'לשגר', infer: 'להסיק',
  strip: 'להסיר', truncate: 'לקצר', monitor: 'לנטר', write: 'לכתוב', enter: 'להיכנס', exit: 'לצאת', rebalance: 'לאזן מחדש',
  materialize: 'לממש', upload: 'להעלות', login: 'להתחבר', register: 'לרשום', logout: 'להתנתק', backup: 'לגבות', sync: 'לסנכרן',
  mine: 'לכרות', interrogate: 'לחקור', reconcile: 'להשוות', emit: 'לפלוט', clean: 'לנקות', step: 'לבצע צעד', screenshot: 'לצלם',
  set: 'לקבוע', trigger: 'להפעיל', setWebhook: 'לקבוע', hash: 'לגבב', look: 'לבדוק', group: 'לקבץ', score: 'לנקד', plan: 'לתכנן',
  segment: 'לפלח', segmentCode: 'לפלח', support: 'לתמוך ב', explain_: 'להסביר', grade: 'לדרג', measure: 'למדוד', match: 'להתאים',
  scheduled: 'לתזמן', schedule: 'לתזמן', compile: 'להדר', transition: 'להעביר', sum: 'לסכם', mul: 'להכפיל', sub: 'לחסר', neg: 'להפוך סימן',
  attach: 'לצרף', append: 'להוסיף', wrap: 'לעטוף', print: 'להדפיס', translate: 'לתרגם', notify_: 'להודיע', invite: 'להזמין',
  quote: 'לתמחר', price: 'לתמחר', refund: 'להחזיר כסף על', ship: 'לשלוח', subscribe_: 'להירשם', normalize: 'לנרמל', stringify: 'להמיר לטקסט',
  read_: 'לקרוא', make_: 'ליצור', analyse: 'לנתח', proposeSolutions: 'להציע', document_: 'לתעד', assign: 'לשבץ', approve: 'לאשר',
  maintain: 'לתחזק', poll: 'לדגום', serialize: 'להמיר לטקסט', deserialize: 'לפענח', guard: 'לשמור על', judge: 'לשפוט',
  explainPlan: 'להסביר', walk_: 'לעבור', fallback: 'להציע חלופה', director: 'לנהל', infer_: 'להסיק', collapse: 'לקרוס', choose: 'לבחור',
}
const NOUN = {
  agent: 'סוכן', agents: 'סוכנים', url: 'כתובת', urls: 'כתובות', risk: 'סיכון', risks: 'סיכונים', profile: 'פרופיל', profiles: 'פרופילים',
  message: 'הודעה', messages: 'הודעות', market: 'שוק', options: 'אפשרויות', code: 'קוד', asset: 'נכס', assets: 'נכסים', text: 'טקסט',
  item: 'פריט', items: 'פריטים', ai: 'AI', files: 'קבצים', file: 'קובץ', innovation: 'חדשנות', activity: 'פעילות', quality: 'איכות',
  score: 'ציון', request: 'בקשה', requests: 'בקשות', user: 'משתמש', users: 'משתמשים', performance: 'ביצועים', status: 'מצב',
  scalability: 'יכולת גדילה', response: 'תגובה', json: 'JSON', table: 'טבלה', children: 'ילדים', analytics: 'אנליטיקה', protocol: 'פרוטוקול',
  telegram: 'טלגרם', monitoring: 'ניטור', final: 'סופי', mutation: 'שינוי', voice: 'קול', stream: 'זרם', order: 'הזמנה', orders: 'הזמנות',
  index: 'אינדקס', type: 'סוג', types: 'סוגים', security: 'אבטחה', metrics: 'מדדים', health: 'בריאות', integration: 'אינטגרציה',
  integrations: 'אינטגרציות', outfits: 'תלבושות', outfit: 'תלבושת', exprs: 'ביטויים', expr: 'ביטוי', timeline: 'ציר זמן', growth: 'צמיחה',
  strategy: 'אסטרטגיה', stats: 'סטטיסטיקה', context: 'הקשר', features: 'יכולות', audio: 'שמע', speech: 'דיבור', event: 'אירוע',
  line: 'שורה', lines: 'שורות', rate: 'שיעור', project: 'פרויקט', api: 'API', summary: 'סיכום', chat: 'צ׳אט', settings: 'הגדרות',
  value: 'ערך', values: 'ערכים', task: 'משימה', tasks: 'משימות', age: 'גיל', manager: 'מנהל', dashboard: 'לוח מחוונים',
  optimization: 'אופטימיזציה', structure: 'מבנה', business: 'עסק', automation: 'אוטומציה', potential: 'פוטנציאל', standards: 'תקנים',
  buffer: 'חוצץ', playback: 'השמעה', products: 'מוצרים', product: 'מוצר', service: 'שירות', payment: 'תשלום', payments: 'תשלומים',
  intent: 'כוונה', revenue: 'הכנסות', token: 'אסימון', tokens: 'אסימונים', server: 'שרת', body: 'גוף', protocols: 'פרוטוקולים',
  webhook: 'webhook', recommendations: 'המלצות', milestone: 'אבן דרך', milestones: 'אבני דרך', documentation: 'תיעוד', analysis: 'ניתוח',
  competitive: 'תחרותי', level: 'רמה', success: 'הצלחה', connected: 'מחובר', last: 'אחרון', team: 'צוות', recent: 'אחרונים',
  category: 'קטגוריה', path: 'נתיב', log: 'יומן', coupon: 'קופון', pricing: 'תמחור', tax: 'מס', future: 'עתיד', syntax: 'תחביר',
  column: 'עמודה', exists: 'קיים', scalar: 'ערך יחיד', transaction: 'עסקה', sql: 'SQL', bound: 'גבול', issue: 'תקלה', issues: 'תקלות',
  communication: 'תקשורת', technical: 'טכני', opportunities: 'הזדמנויות', term: 'מונח', mvp: 'MVP', toast: 'הודעה קופצת', notes: 'הערות',
  sse: 'SSE', batch: 'אצווה', catalog: 'קטלוג', len: 'אורך', audit: 'ביקורת', available: 'זמין', percent: 'אחוז', str: 'טקסט',
  engine: 'מנוע', shipping: 'משלוח', weight: 'משקל', group: 'קבוצה', bug: 'באג', ref: 'הפניה', agg: 'צבירה', limit: 'מגבלה',
  op: 'פעולה', one: 'אחד', simple: 'פשוט', like: 'LIKE', images: 'תמונות', image: 'תמונה', part: 'חלק', data: 'נתונים',
  endpoints: 'נקודות קצה', steps: 'צעדים', config: 'תצורה', resource: 'משאב', resources: 'משאבים', supervision: 'פיקוח',
  utilization: 'ניצול', efficiency: 'יעילות', complexity: 'מורכבות', positioning: 'מיצוב', memory: 'זיכרון', cost: 'עלות',
  implementation: 'יישום', solutions: 'פתרונות', help: 'עזרה', command: 'פקודה', hub: 'מרכז', id: 'מזהה', ids: 'מזהים', tech: 'טכנולוגיה',
  tools: 'כלים', meeting: 'פגישה', keys: 'מפתחות', key: 'מפתח', base: 'בסיס', media: 'מדיה', inventory: 'מלאי', reservation: 'שריון',
  warehouses: 'מחסנים', warehouse: 'מחסן', money: 'כסף', zero: 'אפס', min: 'מינימום', gateway: 'שער', price: 'מחיר', snapshot: 'צילום מצב',
  margin: 'רווח', top: 'מובילים', zone: 'אזור', rule: 'כלל', rules: 'כללים', slug: 'מזהה כתובת', lang: 'שפה', errors: 'שגיאות',
  error: 'שגיאה', literal: 'ערך מילולי', unary: 'אונרי', subquery: 'תת-שאילתה', call: 'קריאה', case: 'מקרה', node: 'צומת', leaf: 'עלה',
  range: 'טווח', result: 'תוצאה', results: 'תוצאות', database: 'מסד נתונים', schema: 'סכמה', col: 'עמודה', name: 'שם', info: 'מידע',
  opt: 'אפשרות', html: 'HTML', email: 'דוא״ל', deep: 'עמוק', page: 'עמוד', content: 'תוכן', completion: 'השלמה', middleware: 'שכבת ביניים',
  routes: 'נתיבים', system: 'מערכת', handling: 'טיפול', insights: 'תובנות', duplicates: 'כפילויות', java: 'Java', script: 'סקריפט',
  cleanup: 'ניקוי', continuous: 'רציף', connection: 'חיבור', connections: 'חיבורים', overall: 'כולל', supervisor: 'מפקח', budget: 'תקציב',
  developer: 'מפתח', dependency: 'תלות', dependencies: 'תלויות', analyzer: 'מנתח', active: 'פעיל', secrets: 'סודות', assessment: 'הערכה',
  roadmap: 'מפת דרכים', usage: 'שימוש', bottlenecks: 'צווארי בקבוק', optimizations: 'שיפורים', breakthrough: 'פריצת דרך', size: 'גודל',
  fit: 'התאמה', years: 'שנים', trends: 'מגמות', technology: 'טכנולוגיה', proposition: 'הצעה', channels: 'ערוצים', financial: 'פיננסי',
  mitigation: 'מיתון', required: 'נדרש', logic: 'לוגיקה', solution: 'פתרון', full: 'מלא', auth: 'הזדהות', password: 'סיסמה',
  subscription: 'מנוי', action: 'פעולה', callback: 'קריאה חוזרת', answer: 'תשובה', phases: 'שלבים', architecture: 'ארכיטקטורה',
  style: 'סגנון', executive: 'מנהלים', work: 'עבודה', mobile: 'נייד', director: 'במאי', details: 'פרטים', ring: 'טבעת', processor: 'מעבד',
  pcm: 'PCM', float: 'עשרוני', sequence: 'רצף', recorder: 'מקליט', wav: 'WAV', compatible: 'תואם', sku: 'מק״ט', post: 'פוסט',
  family: 'משפחה', variants: 'גרסאות', bus: 'אוטובוס', stock: 'מלאי', lot: 'אצווה', qty: 'כמות', hand: 'יד', currency: 'מטבע',
  mismatch: 'אי-התאמה', ratio: 'יחס', state: 'מצב', totals: 'סכומים', cart: 'עגלה', net: 'נטו', gross: 'ברוטו', discount: 'הנחה',
  subtotal: 'סכום ביניים', unit: 'יחידה', targets: 'יעדים', version: 'גרסה', conflict: 'התנגשות', repository: 'מאגר', bucket: 'דלי',
  sales: 'מכירות', total: 'סה״כ', day: 'יום', inclusive: 'כולל', dimensional: 'נפחי', billable: 'לחיוב', cell: 'תא', module: 'מודול',
  novel: 'חדש', states: 'מצבים', assumptions: 'הנחות', fn: 'פונקציה', injectable: 'ניתן להזרקה', rejected: 'נדחה', documented: 'מתועד',
  checks: 'בדיקות', examples: 'דוגמאות', example: 'דוגמה', noise: 'רעש', runner: 'מריץ', readable: 'קריא', sentences: 'משפטים',
  tests: 'בדיקות', contacts: 'אנשי קשר', found: 'נמצא', shop: 'חנות', unchanged: 'ללא שינוי', binary: 'בינארי', null: 'ריק', label: 'תווית',
  tree: 'עץ', depth: 'עומק', mini: 'מיני', constraint: 'אילוץ', scope: 'היקף', subplan: 'תת-תוכנית', rows: 'שורות', row: 'שורה',
  outer: 'חיצוני', num: 'מספר', pred: 'תנאי', nested: 'מקונן', loop: 'לולאה', distinct: 'ייחודי', union: 'איחוד', parser: 'מפרק',
  statement: 'משפט', clause: 'סעיף', primary: 'ראשי', conjuncts: 'תנאים', refs: 'הפניות', planner: 'מתכנן', alias: 'כינוי', where: 'תנאי',
  form: 'צורה', storage: 'אחסון', savepoint: 'נקודת שמירה', autocommit: 'שמירה אוטומטית', point: 'נקודה', wal: 'יומן כתיבה',
  snap: 'צילום', truthy: 'אמיתי', tail: 'סוף', hashes: 'חתימות', icon: 'סמל', meta: 'מטא', legal: 'משפטי', seo: 'קידום', perf: 'ביצועים',
  trust: 'אמינות', policies: 'מדיניות', links: 'קישורים', card: 'כרטיס', prices: 'מחירים', alive: 'חי', nums: 'מספרים', rendered: 'מרונדר',
  finding: 'ממצא', platform: 'פלטפורמה', shopify: 'Shopify', jsonld: 'JSON-LD', universal: 'כלליות', paras: 'פסקאות', src: 'מקור',
  why: 'למה', box: 'תיבה', runhead: 'כותרת רצה', masthead: 'כותרת עיתון', front: 'עמוד ראשי', cards: 'כרטיסים', briefs: 'מבזקים',
  twoup: 'שני טורים', supplement: 'מוסף', opinion: 'דעה', forecast: 'תחזית', colophon: 'קולופון', validator: 'מאמת', strings: 'מחרוזות',
  injection: 'הזרקה', island: 'אי נתונים', smoke: 'עשן', advanced: 'מתקדם', overview: 'סקירה', roles: 'תפקידים', permissions: 'הרשאות',
  csv: 'CSV', optimized: 'מיטבי', reports: 'דוחות', logs: 'יומנים', cache: 'מטמון', basic: 'בסיסי', smart: 'חכם', changes: 'שינויים',
  change: 'שינוי', comprehensive: 'מקיף', suite: 'חבילה', frontend: 'צד לקוח', construction: 'בנייה', network: 'רשת',
  connectivity: 'קישוריות', availability: 'זמינות', cycle: 'מחזור', progress: 'התקדמות', todo: 'משימות', foundation: 'יסודות',
  systems: 'מערכות', deployment: 'פריסה', directory: 'תיקייה', adherence: 'עמידה', coverage: 'כיסוי', productivity: 'פריון',
  diagnostic: 'אבחון', configuration: 'תצורה', configs: 'תצורות', functions: 'פונקציות', imports: 'ייבואים', predictions: 'תחזיות',
  cyclomatic: 'ציקלומטית', cognitive: 'קוגניטיבית', debt: 'חוב', maintainability: 'תחזוקתיות', churn: 'נטישה', coupling: 'צימוד',
  cohesion: 'לכידות', readability: 'קריאות', testability: 'בדיקתיות', modularity: 'מודולריות', reusability: 'שימוש חוזר', naming: 'שמות',
  vulnerabilities: 'פגיעויות', input: 'קלט', validation: 'אימות', authentication: 'הזדהות', encryption: 'הצפנה', access: 'גישה',
  control: 'בקרה', trail: 'שובל', cpu: 'מעבד', latency: 'השהיה', throughput: 'תפוקה', novelty: 'חידוש', creativity: 'יצירתיות',
  uniqueness: 'ייחודיות', patentable: 'בר-פטנט', research: 'מחקר', disruption: 'שיבוש', technological: 'טכנולוגית', advancement: 'התקדמות',
  profit: 'רווח', roi: 'החזר השקעה', advantage: 'יתרון', sustainability: 'קיימות', trajectory: 'מסלול', edge: 'יתרון', position: 'מעמד',
  share: 'נתח', competitors: 'מתחרים', unique: 'ייחודי', barriers: 'חסמים', threats: 'איומים', savings: 'חיסכון', time: 'זמן',
  reduction: 'הפחתה', improvement: 'שיפור', year: 'שנה', three: 'שלוש', five: 'חמש', differentiation: 'בידול', target: 'יעד',
  audience: 'קהל', distribution: 'הפצה', capacity: 'קיבולת', limits: 'מגבלות', benefits: 'תועלות', operational: 'תפעולי',
  regulatory: 'רגולטורי', priorities: 'עדיפויות', quick: 'מהיר', wins: 'הישגים', impact: 'השפעה', current: 'נוכחי', short: 'קצר',
  medium: 'בינוני', investment: 'השקעה', services: 'שירותים', confidence: 'ביטחון', entities: 'ישויות', interaction: 'אינטראקציה',
  general: 'כללי', contextual: 'הקשרית', aegis: 'Aegis', reviewing: 'ביקורת', learning: 'למידה', conversation: 'שיחה', polling: 'דגימה',
  updates: 'עדכונים', brain: 'מוח', maintenance: 'תחזוקה', optional: 'אופציונלי', webhooks: 'webhooks', stripe: 'Stripe', zapier: 'Zapier',
  zaps: 'זאפים', zap: 'זאפ', slack: 'Slack', notification: 'התראה', git: 'git', repositories: 'מאגרים', workflow: 'תהליך', view: 'צפייה',
  conversion: 'המרה', session: 'שיחה', bot: 'בוט', unknown: 'לא מוכר', private: 'פרטי', emoji: 'אימוג׳י', notifications: 'התראות',
  language: 'שפה', privacy: 'פרטיות', backup: 'גיבוי', model: 'מודל', streams: 'זרמים', customer: 'לקוח', segments: 'פלחים',
  competition: 'תחרות', entry: 'כניסה', scaling: 'הגדלה', funding: 'מימון', costs: 'עלויות', profitability: 'רווחיות', hiring: 'גיוס',
  culture: 'תרבות', skills: 'כישורים', marketplace: 'שוק', enterprise: 'ארגונים', microservices: 'מיקרו-שירותים', optimizer: 'מייעל',
  components: 'רכיבים', interfaces: 'ממשקים', flow: 'זרימה', critical: 'קריטי', buffers: 'חוצצים', infrastructure: 'תשתית',
  training: 'הדרכה', needs: 'צרכים', plans: 'תוכניות', meetings: 'פגישות', reporting: 'דיווח', capabilities: 'יכולות', analyst: 'מנתח',
  qa: 'בקרת איכות', suggestions: 'הצעות', swarm: 'נחיל', requirements: 'דרישות', getter: 'מקור', method: 'שיטה', headers: 'כותרות',
  bom: 'BOM', string: 'מחרוזת', field: 'שדה', title: 'כותרת', supported: 'נתמך', mime: 'MIME', abort: 'ביטול', block: 'גוש',
  blocks: 'גושים', complete: 'שלם', done: 'סיום', blob: 'קובץ', base64: 'base64', provider: 'ספק', fake: 'מדומה', percent_: 'אחוז',
  tiered: 'מדורג', quantity: 'כמות', usable: 'שמיש', rowids: 'מזהי שורות', ident: 'מזהה', primarykey: 'מפתח ראשי', mod: 'מודול',
  wardrobe: 'ארון', brands: 'מותגים', colors: 'צבעים', prefs: 'העדפות', occasion: 'אירוע', season: 'עונה', mood: 'מצב רוח', look: 'מראה',
  directions: 'כיוונים', base_: 'בסיס', medium_: 'בינוני', dom: 'DOM', sev: 'חומרה', issue_: 'תקלה', dns: 'DNS', chrome: 'כרום',
  report: 'דוח', parts: 'חלקים', island_: 'אי', headline: 'כותרת', kpi: 'מדד', domain: 'דומיין', crumbs: 'פירורים', ledger: 'פנקס',
  seed: 'זרע', seeds: 'זרעים', nikud: 'ניקוד', dibur: 'דיבור המתחיל', unit_: 'יחידה', units: 'יחידות', commentators: 'מפרשים',
  sources: 'מקורות', source: 'מקור', claims: 'דינים', claim: 'דין', laws: 'חוקים', dims: 'ממדים', cases: 'מקרים', severity: 'חומרה',
  kind: 'סוג', unbuilt: 'לא בנויים', moves: 'מהלכים', move: 'מהלך', placement: 'מיקום', siman: 'סימן', idents: 'זיהויים', ref_: 'הפניה',
  markers: 'סימנים', dict: 'מילון', reply: 'תשובה', prompt: 'בקשה', diff: 'שינויים', tool: 'כלי', cmd: 'פקודה', facts: 'עובדות',
  candidates: 'מועמדים', candidates_: 'מועמדים', commands: 'פקודות', placements: 'מיקומים', mode: 'מצב', main: 'ראשי', counter: 'מונה',
  sched: 'לוח זמנים', dedupe_: 'כפילויות', bp: 'נקודות בסיס', g: 'גרם', positive: 'חיובי', negative: 'שלילי', bool: 'בוליאני',
  cents: 'אגורות', iso: 'תאריך', b: 'B', s: 'שניות', x: 'X', y: 'Y', lt: 'קטן מ', eq: 'שווה', re: 'ביטוי רגולרי', sha: 'חתימה', uniq: 'ייחודיים',
  stub: 'בדל', doh: 'DNS', sh: 'מעטפת', ok: 'הצלחה', bad: 'כישלון', head: 'כותרת', p: 'שורת יומן', el: 'אלמנט', tag: 'תגית', add_: 'הוספה',
  island__: 'אי', mvp_: 'MVP', sync: 'סנכרון', next: 'הבא', all: 'כל', is: 'האם', has: 'יש', can: 'יכול', no: 'בלי', not: 'לא', and: 'וגם',
  or: 'או', the: '', a: '', an: '', self: 'עצמי', other: 'אחר', fast: 'מהיר', slow: 'איטי', new: 'חדש', old: 'ישן', default: 'ברירת מחדל',
  custom: 'מותאם', supported_: 'נתמך', ensure_: 'וידוא', compatible_: 'תואם', format: 'פורמט', id_: 'מזהה', key_: 'מפתח',
  plan: 'תוכנית', testing: 'בדיקות', architect: 'ארכיטקט', strategic: 'אסטרטגי', segment: 'מקטע', list: 'רשימה', aggregate: 'צבירה',
  between: 'BETWEEN', buy: 'קנה', cast: 'המרת סוג', checkpoint: 'נקודת ביקורת', conjoin: 'צירוף תנאים', cur: 'נוכחי', def: 'הגדרה',
  dispute: 'מחלוקת', fixed: 'קבוע', forward: 'קדימה', get: 'קבל', identification: 'זיהוי', join: 'צירוף', kw: 'מילת מפתח', off: 'הנחה',
  only: 'בלבד', output: 'פלט', pushable: 'ניתן לדחיפה', quote: 'הצעת מחיר', r: 'R', raises: 'זורק שגיאה', rebase: 'בסיס חדש',
  refundable: 'ניתן להחזר', rewrite: 'שכתוב', scan: 'סריקה', star: 'כוכבית', t: 'T', process: 'תהליך', github: 'GitHub', openai: 'OpenAI',
  javascript: 'JavaScript', pcm16: 'PCM16', float32: 'Float32', reader: 'קורא', writer: 'כותב', plugin: 'תוסף', selection: 'בחירה',
  expression: 'ביטוי', projection: 'הטלה', aggregation: 'צבירה', sorting: 'מיון', offset: 'היסט', having: 'HAVING', distinct_: 'ייחודי',
  scan_: 'סריקה', insert: 'הכנסה', update: 'עדכון', delete: 'מחיקה', create: 'יצירה', drop: 'הסרה', select: 'בחירה', values_: 'ערכים',
  tx: 'עסקה', undo: 'ביטול', redo: 'ביצוע חוזר', journal: 'יומן', page_: 'עמוד', header: 'כותרת', cursor: 'סמן', btree: 'עץ B',
  hash_: 'גיבוב', merge: 'מיזוג', sort: 'מיון', limit_: 'הגבלה', filter: 'סינון', apply: 'החלה', fire: 'הפעלה', covers: 'מכסה',
  report_: 'דוח', receipt: 'קבלה', invoice: 'חשבונית', refund: 'החזר', capture: 'גבייה', authorize: 'אישור', void: 'ביטול', charge: 'חיוב',
  card_: 'כרטיס', region: 'אזור', rates: 'תעריפים', table_: 'טבלה', zones: 'אזורים', mm: 'מ״מ', kg: 'ק״ג', grams: 'גרמים',
  vat: 'מע״מ', exempt: 'פטור', lines_: 'שורות', subscriber: 'מנוי', bus_: 'אוטובוס', events: 'אירועים', handlers: 'מטפלים', sink: 'יעד',
  sql_in: 'IN', sql_is: 'IS', c: 'C', collapse: 'קריסה', explain: 'הסבר', hash: 'גיבוב', uses: 'שימושים', wh: 'מחסן', yes: 'כן',
  ok_: 'תקין', fail: 'כשל', check: 'בדיקה', checks_: 'בדיקות', guard: 'שומר', police: 'שוטר', armed: 'דרוך', judge: 'שופט',
}
const PREP = { by: 'לפי', for: 'עבור', from: 'מתוך', to: 'ל', with: 'עם', of: 'של', in: 'ב', via: 'דרך', on: 'על', within: 'בתוך', into: 'לתוך', about: 'על', per: 'לכל', than: 'מ', at: 'ב', as: 'כ' }
const BOOL_HEAD = new Set(['is', 'has', 'can', 'should', 'looks', 'was', 'does', 'needs', 'in'])

function splitIdent(s) {
  return s
    .replace(/GitHub/g, 'Github').replace(/OpenAI/g, 'Openai').replace(/JavaScript/g, 'Javascript').replace(/PCM16/g, 'Pcm16').replace(/Float32/g, 'Float32')
    .replace(/^_+|_+$/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-$]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
}
function heNoun(w) {
  if (Object.prototype.hasOwnProperty.call(NOUN, w)) return NOUN[w]
  if (/^\d+$/.test(w)) return w
  return null
}
// צירוף-שם באנגלית ⇒ עברית: מתהפך (הראש קודם), מילות-יחס מפרידות בין צירופים.
function nounPhrase(tokens, unknown) {
  const chunks = [[]]
  const preps = []
  for (const t of tokens) {
    if (PREP[t] !== undefined) {
      preps.push(PREP[t])
      chunks.push([])
    } else chunks[chunks.length - 1].push(t)
  }
  const out = []
  chunks.forEach((c, i) => {
    if (!c.length) return // מילת-יחס בסוף ("products_in") — נשמטת
    if (i > 0 && preps[i - 1]) out.push(preps[i - 1])
    const he = c
      .slice()
      .reverse()
      .map((t) => {
        const h = heNoun(t)
        if (h === null) unknown.add(t)
        return h === null ? t : h
      })
      .filter((x) => x !== '')
    out.push(...he)
  })
  return out.join(' ').replace(/\s+/g, ' ').replace(/ ל /g, ' ל').replace(/ ב /g, ' ב').trim()
}

const DUNDER = { __add__: 'לחבר שני סכומים', __sub__: 'לחסר סכום מסכום', __mul__: 'להכפיל סכום במספר', __neg__: 'להפוך סימן של סכום', __lt__: 'להשוות מי קטן יותר', __eq__: 'לבדוק אם שניים שווים', __bool__: 'לבדוק אם הערך לא ריק', __truediv__: 'לחלק סכום', __abs__: 'להחזיר ערך מוחלט' }

function autoName(symbol, givesKind, unknown, classWhat = null) {
  const last = symbol.split('.').pop()
  if (DUNDER[last]) return DUNDER[last]
  const toks = splitIdent(last)
  if (classWhat) return `${classWhat === 'engine' ? 'להפעיל' : 'לייצג'} ${nounPhrase(toks.map((t) => (t === 'in' ? 'sql_in' : t === 'is' ? 'sql_is' : t)), unknown)}`.trim()
  if (!toks.length) return 'לבצע פעולה'
  const [h, ...rest] = toks
  if (BOOL_HEAD.has(h)) {
    const np = nounPhrase(rest, unknown)
    return `לבדוק אם ${h === 'has' ? 'יש ' : ''}${np}`.trim()
  }
  if (h === 'to' && rest.length) return `להמיר ל${nounPhrase(rest, unknown)}`
  if (VERB[h] && !(toks.length === 1 && NOUN[h] && !['get', 'check', 'run', 'scan', 'render', 'parse', 'count', 'merge', 'split', 'learn', 'mine', 'step', 'collapse', 'reconcile', 'interrogate', 'place', 'quote', 'price', 'score', 'group', 'report', 'sync', 'hash'].includes(h))) {
    const v = VERB[h]
    const rest2 = / (ב|ל|עם|על|אחרי)$/.test(v) && rest.length && PREP[rest[0]] !== undefined ? rest.slice(1) : rest
    const np = nounPhrase(rest2, unknown)
    return (v.endsWith(' ב') || v.endsWith(' ל') ? v.trimEnd() + (np ? np : '') : `${v} ${np}`).trim()
  }
  // אין פועל ⇒ הפועל נגזר מהתוצאה
  const np = nounPhrase(toks, unknown)
  const v = givesKind === 'bool' ? 'לבדוק' : givesKind === 'text' ? 'לנסח' : givesKind === 'list' ? 'לרשום' : givesKind === 'number' || givesKind === 'amount' ? 'לחשב' : givesKind === 'ui' ? 'להציג' : 'להפיק'
  return `${v} ${np}`.trim()
}

function clip9(s) {
  const w = s.split(/\s+/).filter(Boolean)
  return w.length <= 9 ? w.join(' ') : w.slice(0, 9).join(' ')
}

// ================================================================ סוגים (kind)
const ENTITY_FROM_TYPE = (t) => t.replace(/['"]/g, '').replace(/\[.*$/, '').replace(/^.*\./, '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
const PRIM = new Set(['str', 'string', 'int', 'float', 'number', 'bool', 'boolean', 'any', 'object', 'none', 'null', 'undefined', 'void', 'unknown', 'dict', 'list', 'tuple', 'set', 'frozenset', 'bytes', 'decimal', 'path', 'callable', 'iterable', 'sequence', 'mapping', 'record', 'array', 'promise', 'iterator', 'type'])

function kindOfType(t, name = '', forReturn = false) {
  if (!t) return null
  let s = t.trim().replace(/^'([A-Z][\w.]*)'$/, '$1').replace(/^"([A-Z][\w.]*)"$/, '$1')
  if (/^[A-Z]$/.test(s)) return 'unknown'
  if (/^Promise<(.+)>$/.test(s)) s = s.replace(/^Promise<(.+)>$/, '$1')
  s = s.replace(/\s*\|\s*(None|null|undefined)\b/g, '').replace(/^(Optional)\[(.+)\]$/, '$2').trim()
  const l = s.toLowerCase()
  if (/^(str|string)$/.test(l) || l.startsWith('literal[') || /^['"]/.test(l)) return 'text'
  if (/^(bool|boolean)$/.test(l)) return 'bool'
  if (/^(int|float|number|decimal|bigint)$/.test(l)) return /amount|price|cents|total|money|cost|fee|tax|sum|balance|subtotal|discount/i.test(name) ? 'amount' : 'number'
  if (/^money\b/.test(l)) return 'amount'
  if (/^(list|tuple|set|frozenset|iterable|sequence|iterator|array)\b|\[\]$|^readonly /.test(l)) return 'list'
  if (/^(path|bytes|buffer|blob|file|arraybuffer)\b/.test(l)) return /audio|wav|pcm/i.test(name) ? 'sound' : 'file'
  if (/float32array|int16array|audiobuffer/.test(l)) return 'sound'
  if (/^(date|datetime)\b/.test(l)) return 'date'
  if (/^(timedelta)\b/.test(l)) return 'span'
  if (/^(dict|mapping|record|object)\b|^\{/.test(l)) return 'record:' + ((!forReturn && entityFromName(name)) || 'map')
  if (/^(callable|function)\b|=>/.test(l)) return 'unknown'
  if (/^(none|void|undefined|null)$/.test(l)) return null
  if (/^(re\.pattern|regexp)$/.test(l)) return 'text'
  if (/^(htmlelement|element|jsx\.element|reactnode|react\.reactnode)/.test(l)) return 'ui'
  if (/^[A-Z][A-Za-z0-9_]*$/.test(s) || /^'[A-Z]/.test(t)) {
    const e = ENTITY_FROM_TYPE(s)
    return PRIM.has(e) ? 'unknown' : 'record:' + e
  }
  return null
}
function entityFromName(n) {
  const c = n.replace(/^[*.{]+|[}]+$/g, '').toLowerCase()
  if (!c || c.length < 2) return null
  return c.replace(/[^a-z0-9_]/g, '').replace(/s$/, '') || null
}
function kindOfName(n0) {
  const n = n0.replace(/^[.*]+/, '')
  const l = n.toLowerCase()
  if (n0.startsWith('*') || n0.startsWith('...')) return 'list'
  if (/^(is|has|can|should)_?[a-z]/.test(n) || /^(human|write|consume|inclusive|low_?inclusive|high_?inclusive|render|check_links)$/i.test(n)) return 'bool'
  if (/amount|price|cents|subtotal|total|money|cost|fee|balance/i.test(n)) return 'amount'
  if (/^(n|i|k|count|limit|depth|width|timeout|delay|qty|quantity|order|divisor|max\w*|min\w*|wait_ms|max_pages|report_every|rank|size|num|idx|index|dur|sample_?rate|max_?length|seq|daf|value_?num)$/i.test(n)) return 'number'
  if (/^(date|day|today|iso|dl|deadline)$/i.test(l) || /date$/i.test(n)) return 'date'
  if (/^(ts|time|hour|timestamp)$/i.test(l)) return 'times'
  if (/^(range|span|window|period|time_?range)$/i.test(l)) return 'span'
  if (/^(lines|items|segments|args|argv|files|records|claims|rules|seeds|idents|disputes|slots|placements|issues|findings|products|arr|list|clauses|qs|changes|inputs|outputs|sources|names|codes|cart|tasks|values|exprs|steps|keywords|stmts|rows|records|texts|messages)$/i.test(n)) return 'list'
  if (/(^|_)(path|file|filename|out_png|out_pdf|screenshot_path|workletpath|dir|root|d)$/i.test(n)) return 'file'
  if (/audio|wav|pcm|blob|voice|sound/i.test(n)) return 'sound'
  if (/image|img|png|photo/i.test(n)) return 'image'
  if (/^(lat|lng|lon|geo|location|region)$/i.test(n)) return /region/i.test(n) ? 'text' : 'geo'
  if (/^(text|prompt|reply|content|message|msg|s|t|w|word|line|src|html|sql|query|name|title|url|u|domain|host|label|key|code|cmd|command|pattern|matter|tool|kind|sev|where|detail|note|phrase|position|measure|term|concept|law|dim|tractate|side|heb|corpus|unit|work|branch|tag|cls|edition|msgstr|base|start_url|service_?name|service_?url|zap_?name|channel|category|goal|page|chat_?id|user_?id|mood|season|occasion|webhook_?url|lang|currency|sku|warehouse|region|transcript_path|path_?str|mishna_term|claimed_slot|action|flag|digest|f|c|v|typ|raw|block|body|diff|summary|description)$/i.test(n)) return 'text'
  if (/^(fn|cb|callback|on_?event|getter|on[A-Z].*|next)$/.test(n)) return 'unknown'
  if (/^(req|res|request|response)$/i.test(n)) return 'record:http'
  if (/^(e|err|error)$/i.test(n)) return 'record:error'
  const ent = entityFromName(n)
  return ent ? 'record:' + ent : 'unknown'
}
function takesOf(params) {
  return params.map((p) => {
    const k = kindOfType(p.type, p.name) || kindOfName(p.name)
    return { name: p.name, kind: k, type: p.type || null }
  })
}
const TEXTY_RET = /^(render|format|summary|summarize|cite|_?prose|clean|strip|truncate|str|to_?str|describe|explain|el|tag|icon|head|why|src_?line|runhead|_?norm|_?digest|_?clean|_?yes|_?marker|_?cell|whoLabel|cn)/i
function givesOf(it, sym) {
  const last = sym.split('.').pop()
  let k = kindOfType(it.returns, last, true)
  if (it.returns && /^(str|string)\s*\|\s*(None|null)$/i.test(it.returns.trim())) k = 'text'
  if (k) return { kind: k, type: it.returns || null }
  const l = last.replace(/^_+/, '')
  if (/^(is|has|can|should|looks|holds|same|compatible|subsumes|contradicts|covers|possible|open|exists|alive|ok)([A-Z_]|$)/.test(l)) return { kind: 'bool', type: it.returns || null }
  if (/^render[A-Z]/.test(l)) return { kind: 'ui', type: it.returns || null }
  if (/^use[A-Z]/.test(l)) return { kind: 'ui', type: it.returns || null }
  if (TEXTY_RET.test(l)) return { kind: 'text', type: it.returns || null }
  if (/^(calculate|calc|compute|count|estimate|score|rate|percent|len|depth|available|on_hand|severity)/i.test(l)) return { kind: 'number', type: it.returns || null }
  if (/^(extract|find|list|split|collect|identify|generate[A-Z].*(Steps|Recommendations|Suggestions|List)|propose|segment|issues|imperatives|details|signals)/i.test(l)) return { kind: 'list', type: it.returns || null }
  if (/^(check|validate|verify|detect|analyze)/i.test(l)) return { kind: 'choice', type: it.returns || null }
  if (/^(get|generate|create|build|make|parse|analy|assess|perform|load|fetch|profile|summar)/i.test(l)) return { kind: 'record:' + (splitIdent(l).slice(1).join('_').replace(/s$/, '') || 'result'), type: it.returns || null }
  return { kind: 'unknown', type: it.returns || null }
}

// ================================================================ מילון-יד (עברית פשוטה) לחלקים המרכזיים
// מפתח = "<path>#<symbol>". ערך = [name, does?, what?, gives-kind?]
const HAND = {
  // ---- yeshiva · השקלא-וטריא
  'yeshiva/dialectic.py#find_kushyot': ['למצוא סתירות בין דינים במאגר', 'עובר על כל הדינים במאגר ומחזיר כל זוג שסותר זה את זה — קושיא.', 'rule'],
  'yeshiva/dialectic.py#terutzim': ['להציע תירוצים לסתירה, מהחזק לחלש', 'לכל קושיא מציע חילוק, אוקימתא, הכרעה או מחלוקת — מסודרים מהתירוץ החזק לחלש.', 'rule'],
  'yeshiva/dialectic.py#rules_outcome': ['לפסוק דין מתוך כללים בלבד', 'הכלל המסוים ביותר גובר, ואחריו — המקור הבכיר.', 'rule'],
  'yeshiva/dialectic.py#nafka_minot': ['למצוא מקרים שבהם שתי הגדרות חלוקות', 'מחפש את המקרים הכלליים ביותר שבהם שתי הגדרות נותנות דין שונה — נפקא מינה.', 'rule'],
  'yeshiva/dialectic.py#run_chakira': ['להריץ חקירה בין שתי הגדרות', 'מוצא נפקא מינות, ראיות ודחיות, ומכריע: שמע מינה א, שמע מינה ב, או תיקו.', 'rule'],
  'yeshiva/dialectic.py#tzrichuta': ['לבדוק אם שני דינים צריכים זה את זה', 'צריכותא: האם כל דין מלמד משהו שהשני לא מלמד, או שאחד מהם מיותר.', 'rule'],
  'yeshiva/dialectic.py#kal_vachomer': ['להסיק קל וחומר ממקרה קל לחמור', 'אם הדין חל במקרה הקל — מסיק שהוא חל גם בחמור, ובודק פירכות.', 'rule'],
  'yeshiva/dialectic.py#binyan_av': ['לבנות כלל אב מכמה מקרים דומים', 'מוצא את הצד השווה בין כמה דינים ובונה ממנו כלל, ובודק פירכות.', 'rule'],
  'yeshiva/dialectic.py#_kushya_kind': ['לסווג סתירה ולסדר לפי בכירות המקור'],
  'yeshiva/dialectic.py#_outcome_from': ['לפסוק דין מרשימת דינים וכללים נתונה'],
  'yeshiva/dialectic.py#_geder_outcome': ['לפסוק דין במקרה לפי הגדרה אחת'],
  'yeshiva/dialectic.py#_complement': ['למצוא ערך אחר לאותו ממד'],
  'yeshiva/engine.py#YeshivaEngine': ['להריץ סוגיא שלמה או לענות על שאלה', 'המנוע הראשי: מקבל מאגר דינים, מוצא קושיות, מתרץ, חוקר, ועונה על שאלת דין.', 'engine'],
  'yeshiva/engine.py#YeshivaEngine.sugya': ['להריץ סוגיא: קושיות, תירוצים וחקירות', 'מריץ את כל השקלא-וטריא על המאגר ומחזיר פרוטוקול בלשון הגמרא.', 'engine'],
  'yeshiva/engine.py#YeshivaEngine.ask': ['לענות על שאלת דין במקרה נתון', 'מחזיר את הדין במקרה, יחד עם הנימוק המלא.'],
  'yeshiva/engine.py#Answer': ['לייצג תשובת דין עם הנימוק שלה', 'תשובה: החוק, המקרה, התוצאה והפרוטוקול שהוביל אליה.', 'brick'],
  'yeshiva/engine.py#_marker': ['לבחור סימן גמרא לדין לפי מקורו'],
  // ---- yeshiva · מאגר הידע ואבני היסוד
  'yeshiva/knowledge.py#KnowledgeBase': ['לנהל מאגר דינים, כללים ומקורות', 'מה נאמר, מי אמר, באיזה מקרה, ואילו כללים נובעים מזה.', 'engine'],
  'yeshiva/knowledge.py#KnowledgeBase.claims_on': ['להביא את הדינים על חוק במקרה'],
  'yeshiva/knowledge.py#KnowledgeBase.laws': ['לרשום את כל החוקים שבמאגר'],
  'yeshiva/knowledge.py#KnowledgeBase.dims_relevant_to': ['למצוא ממדים שמשנים את הדין'],
  'yeshiva/knowledge.py#KnowledgeBase.sources': ['לרשום את כל המקורות שבמאגר'],
  'yeshiva/knowledge.py#KnowledgeBase.derive': ['לגזור כל מה שאפשר לומר על מקרה'],
  'yeshiva/knowledge.py#KnowledgeBase.outcome': ['לפסוק דין במקרה לפי המקור הבכיר'],
  'yeshiva/knowledge.py#KnowledgeBase.cases_over': ['לפרוש את כל המקרים על פני ממדים'],
  'yeshiva/knowledge.py#KnowledgeBase.severity_index': ['להביא את דרגת החומרה של ערך'],
  'yeshiva/knowledge.py#KnowledgeBase.compare_severity': ['להשוות חומרה בין שני מקרים'],
  'yeshiva/terms.py#source': ['ליצור מקור עם דרגת תוקף'],
  'yeshiva/terms.py#Source': ['לייצג מקור: מי אמר ובאיזה תוקף', null, 'brick'],
  'yeshiva/terms.py#Case': ['לייצג מקרה כזוגות של ממד וערך', null, 'brick'],
  'yeshiva/terms.py#Case.of': ['ליצור מקרה מזוגות של ממד וערך'],
  'yeshiva/terms.py#Case.get': ['להביא את ערך הממד במקרה'],
  'yeshiva/terms.py#Case.dims': ['לרשום את הממדים שהמקרה מציין'],
  'yeshiva/terms.py#Case.as_dict': ['להמיר מקרה למילון'],
  'yeshiva/terms.py#Case.is_general': ['לבדוק אם המקרה כללי'],
  'yeshiva/terms.py#Case.compatible': ['לבדוק אם שני מקרים יכולים לחפוף'],
  'yeshiva/terms.py#Case.subsumes': ['לבדוק אם מקרה אחד כולל את השני'],
  'yeshiva/terms.py#Case.conflicts': ['למצוא ממדים שבהם שני מקרים חלוקים'],
  'yeshiva/terms.py#Case.only_in_self': ['למצוא ממדים שרק מקרה אחד מציין'],
  'yeshiva/terms.py#Case.narrowed': ['לצמצם מקרה בתנאי נוסף — אוקימתא'],
  'yeshiva/terms.py#Case.merged': ['למזג שני מקרים לאחד'],
  'yeshiva/terms.py#Claim': ['לייצג דין: במקרה X החוק אמת או שקר', null, 'brick'],
  'yeshiva/terms.py#Claim.contradicts': ['לבדוק אם שני דינים סותרים זה את זה'],
  'yeshiva/terms.py#Claim.same_ruling': ['לבדוק אם שני דינים פוסקים אותו דבר'],
  'yeshiva/terms.py#Claim.covers': ['לבדוק אם דין מדבר על המקרה הנתון'],
  'yeshiva/terms.py#Rule': ['לייצג כלל: כשמתקיים תנאי, הדין כך', null, 'brick'],
  'yeshiva/terms.py#Rule.applies_to': ['לבדוק אם כלל חל על מקרה'],
  'yeshiva/terms.py#Rule.fire': ['להפעיל כלל על מקרה ולקבל דין'],
  'yeshiva/terms.py#Geder': ['לייצג הגדרה מושגית — צד אחד של חקירה', null, 'brick'],
  'yeshiva/terms.py#Geder.laws': ['לרשום את החוקים שההגדרה נוגעת בהם'],
  'yeshiva/terms.py#Geder.dims': ['לרשום את הממדים שההגדרה תלויה בהם'],
  'yeshiva/terms.py#enumerate_cases': ['למנות את כל צירופי המקרים מעל ממדים'],
  'yeshiva/trace.py#Trace': ['לרשום פרוטוקול שקלא וטריא עם הזחות', null, 'engine'],
  'yeshiva/trace.py#Trace.render': ['להציג פרוטוקול שקלא וטריא כטקסט מוזח'],
  'yeshiva/trace.py#Trace.to_dict': ['להמיר פרוטוקול למילון'],
  'yeshiva/trace.py#Trace.markers': ['לרשום את סימני הגמרא של הצעדים'],
  'yeshiva/trace.py#Step': ['לייצג צעד אחד בפרוטוקול', null, 'brick'],
  // ---- yeshiva · המהלכים כמבני נתונים
  'yeshiva/moves.py#_yes': ['לתרגם אמת או שקר ל"כן", "לא", "לא מצינו"', null, 'particle'],
  'yeshiva/moves.py#Kushya': ['לייצג קושיא: סתירה בין שני דינים', null, 'brick'],
  'yeshiva/moves.py#Kushya.render': ['לנסח קושיא בלשון בית המדרש', null, 'rule'],
  'yeshiva/moves.py#Terutz': ['לייצג תירוץ לקושיא עם חוזקו', null, 'brick'],
  'yeshiva/moves.py#Terutz.render': ['לנסח תירוץ בשורה אחת', null, 'rule'],
  'yeshiva/moves.py#NafkaMina': ['לייצג נפקא מינה בין שני צדדים', null, 'brick'],
  'yeshiva/moves.py#NafkaMina.render': ['לנסח נפקא מינה בין שני צדדים', null, 'rule'],
  'yeshiva/moves.py#Raya': ['לייצג ראיה לצד אחד בחקירה', null, 'brick'],
  'yeshiva/moves.py#Raya.render': ['לנסח ראיה: "תא שמע" או "זכר לדבר"', null, 'rule'],
  'yeshiva/moves.py#Dichuy': ['לייצג דחייה של ראיה', null, 'brick'],
  'yeshiva/moves.py#Dichuy.render': ['לנסח דחייה של ראיה: "ודחי"', null, 'rule'],
  'yeshiva/moves.py#ChakiraResult': ['לייצג תוצאת חקירה בין שתי הגדרות', null, 'brick'],
  'yeshiva/moves.py#ChakiraResult.standing': ['להביא את הראיות שעומדות לצד אחד'],
  'yeshiva/moves.py#Tzrichuta': ['לייצג צריכותא בין שני דינים', null, 'brick'],
  'yeshiva/moves.py#KalVachomer': ['לייצג קל וחומר ופירכותיו', null, 'brick'],
  'yeshiva/moves.py#KalVachomer.holds': ['לבדוק אם הקל וחומר עומד', null, 'rule'],
  'yeshiva/moves.py#BinyanAv': ['לייצג בנין אב ופירכותיו', null, 'brick'],
  'yeshiva/moves.py#BinyanAv.holds': ['לבדוק אם בנין האב עומד', null, 'rule'],
  // ---- yeshiva · מאימתי (המנוע שמקשה)
  'yeshiva/maimatai.py#lex': ['ליצור רשומת מילון למילה ולמושגיה'],
  'yeshiva/maimatai.py#World': ['לבנות עולם סוגיא: מקורות, מילון וגזירות', null, 'engine'],
  'yeshiva/maimatai.py#World.entries_in': ['למצוא מילות מילון בטקסט לפי מיקומן'],
  'yeshiva/maimatai.py#World.concepts_of': ['להביא את המושגים שבטקסט'],
  'yeshiva/maimatai.py#World.sources_sharing': ['למצוא מקורות שחולקים מושג עם הטקסט'],
  'yeshiva/maimatai.py#World.order_sources_for': ['למצוא מקורות שמסדרים מושגים באותו סדר'],
  'yeshiva/maimatai.py#World.term_for': ['למצוא את המונח המקביל במקור — "והכי קתני"'],
  'yeshiva/maimatai.py#World.lexicon_report': ['לדווח איזו מילה שימשה באילו טקסטים'],
  'yeshiva/maimatai.py#World.measure_of': ['למצוא את השיעור שתשובה מדברת עליו'],
  'yeshiva/maimatai.py#World.derive': ['לגזור את כל מה שאפשר לפני הריצה'],
  'yeshiva/maimatai.py#World.src': ['להביא מקור לפי שמו'],
  'yeshiva/maimatai.py#World.cite': ['לצטט מקור לפי שמו'],
  'yeshiva/maimatai.py#Question': ['לייצג שאלה, תשובתה וענפיה', null, 'brick'],
  'yeshiva/maimatai.py#Question.open': ['לבדוק אם שאלה נשארה פתוחה'],
  'yeshiva/maimatai.py#Question.walk': ['לעבור על עץ השאלות'],
  'yeshiva/maimatai.py#Reading': ['לייצג קריאה אחת של מילה דו-משמעית', null, 'brick'],
  'yeshiva/maimatai.py#LexEntry': ['לייצג מילה, מושגיה וקריאותיה', null, 'brick'],
  'yeshiva/maimatai.py#Argument': ['לייצג טיעון שמכריע בין קריאות', null, 'brick'],
  'yeshiva/maimatai.py#Source': ['לייצג מקור שתשובה נשענת עליו', null, 'brick'],
  'yeshiva/maimatai.py#Teaching': ['לייצג מה שניסוח עקיף מלמד', null, 'brick'],
  'yeshiva/maimatai.py#Statement': ['לייצג משפט במשנה ופרטיו', null, 'brick'],
  'yeshiva/maimatai.py#Reconciliation': ['לייצג השוואה בין המנוע לדף', null, 'brick'],
  'yeshiva/maimatai.py#Reconciliation.render': ['לנסח דוח השוואה מול הגמרא'],
  'yeshiva/maimatai.py#_clean': ['לנקות מילה מסימני פיסוק', null, 'particle'],
  'yeshiva/maimatai.py#_impersonal': ['לזהות לשון רבים סתמית כמו "קורין"', null, 'rule'],
  'yeshiva/maimatai.py#_teachings': ['להביא מה שניסוח עקיף מלמד'],
  'yeshiva/maimatai.py#_teaching': ['להביא לימוד אחד מניסוח עקיף'],
  'yeshiva/maimatai.py#_presupposition': ['לשאול "היכא קאי" — על מה המשפט נשען', 'שואל על ההנחה המוקדמת שהמשפט בנוי עליה.', 'rule'],
  'yeshiva/maimatai.py#_missing_slots': ['לשאול על פרטים חסרים במשפט', 'מי? מתי? — פרטים שהמשפט לא אמר ונדרשים לו.', 'rule'],
  'yeshiva/maimatai.py#_order': ['לשאול "מאי שנא ברישא" על סדר', 'למה פתח בזה ולא בזה — ומה מצדיק את הסדר.', 'rule'],
  'yeshiva/maimatai.py#_ei_hachi': ['להקשות "אי הכי" על תירוץ הסדר', null, 'rule'],
  'yeshiva/maimatai.py#_indirect': ['לשאול "לימא" על ניסוח עקיף', null, 'rule'],
  'yeshiva/maimatai.py#_obvious': ['לשאול "פשיטא" על דבר מובן מאליו', 'אם הדבר פשוט — למה צריך לומר אותו? מה הוא מלמד.', 'rule'],
  'yeshiva/maimatai.py#_ambiguous_terms': ['לשאול "מאי" על מונח דו-משמעי', 'מונח שיש לו יותר מקריאה אחת — באיזו קריאה מדובר.', 'rule'],
  'yeshiva/maimatai.py#_taama': ['לשאול טעם לשני גבולות לאותו דבר', null, 'rule'],
  'yeshiva/maimatai.py#_generalization': ['לשאול על הכללה ממקרה לכלל', null, 'rule'],
  'yeshiva/maimatai.py#_maaseh_listor': ['להקשות "מעשה לסתור" על מעשה במשנה', null, 'rule'],
  'yeshiva/maimatai.py#_ramei': ['להקשות "ורמינהו" ממקור שעונה אחרת', null, 'rule'],
  'yeshiva/maimatai.py#_dispute': ['לשאול "במאי קמיפלגי" על מחלוקת', null, 'rule'],
  'yeshiva/maimatai.py#_mai_taama': ['לשאול "מאי טעמא" של כל צד', null, 'rule'],
  'yeshiva/maimatai.py#_shma_mina': ['לגזור "שמע מינה" — עיקרון מדין פרטי', null, 'rule'],
  'yeshiva/maimatai.py#_hilchata': ['לשאול "הלכתא כמאן" אחרי מחלוקת', null, 'rule'],
  'yeshiva/maimatai.py#_muchlefet': ['לשאול "מוחלפת השיטה" כשהחומרה מתהפכת', null, 'rule'],
  'yeshiva/maimatai.py#_tnan_hatam': ['להשוות "תנן התם" למשנה במסכת אחרת', null, 'rule'],
  'yeshiva/maimatai.py#_man_tanna': ['לשאול "מאן תנא" על דין סתמי', null, 'rule'],
  'yeshiva/maimatai.py#parse_opinions': ['לפרק משפט משנה לדעות החולקים'],
  'yeshiva/maimatai.py#strictness': ['לסווג עמדה כמחמירה או מקלה', null, 'rule', 'choice'],
  'yeshiva/maimatai.py#cited_verse': ['לחלץ את הפסוק שעמדה מצטטת'],
  'yeshiva/maimatai.py#split_clauses': ['לפצל טקסט למשפטים לפי פיסוק'],
  'yeshiva/maimatai.py#interrogate_source': ['לחקור מקור: אפשר לקרוא אותו אחרת?', null, 'rule'],
  'yeshiva/maimatai.py#interrogate': ['להעלות את כל השאלות על משפט', 'כל השאלות שהמשפט מעורר — וכל תשובה שנשענת על מקור נחקרת בעצמה.', 'engine'],
  'yeshiva/maimatai.py#reconcile': ['להשוות את שאלות המנוע למה שבדף', '"מה פספסתי?" — מה המנוע שאל כמו הגמרא, מה הוסיף ומה החסיר.'],
  'yeshiva/maimatai.py#interrogate_sugya': ['לחקור סוגיא שלמה משפט אחר משפט', null, 'engine'],
  'yeshiva/maimatai.py#interrogate_trace': ['לחקור משפט ולהחזיר פרוטוקול'],
  // ---- yeshiva · השער (gate)
  'yeshiva/gate.py#detect': ['להריץ גלאי "מאימתי" על בקשה', 'מריץ על טקסט הבקשה את כל הגלאים ומחזיר את השאלות שצריך לשאול לפני שמתחילים.', 'engine'],
  'yeshiva/gate.py#teacher_checks': ['להריץ את כל כללי המורים על תשובה', 'מריץ על התשובה את כל הגלאים (שיעור, כיצד, ואלו הן…) ומחזיר מה חסר.', 'engine'],
  'yeshiva/gate.py#Seed': ['לייצג שאלה שהשער מרים', null, 'brick'],
  'yeshiva/gate.py#seed_stats': ['לספור כמה כל שאלה נשאלה ושינתה'],
  'yeshiva/gate.py#_dormant': ['לבדוק אם שאלה נרדמה כי מעולם לא שינתה'],
  'yeshiva/gate.py#teiku': ['לבדוק "תיקו": הערכה בלי נתונים קובעים', null, 'rule', 'choice'],
  'yeshiva/gate.py#rename_pair': ['לחלץ שם ישן ושם חדש מבקשת שינוי שם'],
  'yeshiva/gate.py#named_files': ['לחלץ שמות קבצים מתוך בקשה'],
  'yeshiva/gate.py#doc_commands': ['למצוא פקודות בקבצי תיעוד שהשתנו'],
  'yeshiva/gate.py#docs_are_true': ['להריץ פקודות מהתיעוד ולבדוק שהן עובדות', null, 'rule', 'list'],
  'yeshiva/gate.py#lo_shanu': ['לבדוק "לא שנו": שינוי שנגע במקום הלא נכון', null, 'rule', 'choice'],
  'yeshiva/gate.py#gufa_kashya': ['לזהות בקשה שסותרת את עצמה', null, 'rule', 'choice'],
  'yeshiva/gate.py#vechi_teima': ['לבדוק "וכי תימא": הכרעה בלי ההתנגדות החזקה', null, 'rule', 'choice'],
  'yeshiva/gate.py#details': ['לחלץ פרטים מצוטטים ושמות מהבקשה'],
  'yeshiva/gate.py#yitur': ['למצוא פרטים מהבקשה שהושמטו בתשובה', null, 'rule', 'choice'],
  'yeshiva/gate.py#_is_build': ['לבדוק אם הבקשה היא משימת בנייה'],
  'yeshiva/gate.py#veraminhu': ['לבדוק "ורמינהו": פונקציה ששונתה בלי בדיקה', null, 'rule', 'choice'],
  'yeshiva/gate.py#_content_words': ['לחלץ מילות תוכן בלי מילות קישור', null, 'particle'],
  'yeshiva/gate.py#_present': ['לבדוק אם מילה מופיעה, גם בלי תחילית', null, 'particle'],
  'yeshiva/gate.py#_decision_prompt': ['לבדוק אם הבקשה מבקשת הכרעה'],
  'yeshiva/gate.py#imperatives': ['לחלץ ציוויים (פועל ומושא) מהבקשה'],
  'yeshiva/gate.py#abarbanel_triggers': ['למצוא בבקשה מה מדליק שאלה של אברבנאל', null, 'rule', 'list'],
  'yeshiva/gate.py#_is_diag': ['לבדוק אם הבקשה מדווחת על תקלה'],
  'yeshiva/gate.py#_is_audit': ['לבדוק אם הבקשה מבקשת ביקורת קוד'],
  'yeshiva/gate.py#audit_file': ['לבקר קובץ קוד אחד לפי שלבי הגמרא', null, 'rule', 'list'],
  'yeshiva/gate.py#_prose': ['להסיר קוד ונתיבים ולהשאיר רק לשון', null, 'particle'],
  'yeshiva/gate.py#ein_mearvin': ['לבדוק "אין מערבין": פיגום שדלף לתוצר', null, 'rule', 'choice'],
  'yeshiva/gate.py#deliverable_checks': ['להריץ את כללי התשובה על קובץ תוצר', null, 'engine'],
  'yeshiva/gate.py#_is_text_task': ['לבדוק אם המשימה היא כתיבת טקסט'],
  'yeshiva/gate.py#_is_open_diag': ['לבדוק אם זו שאלת אבחון בלי נתונים'],
  'yeshiva/gate.py#_decision_or_design': ['לבדוק אם הבקשה היא הכרעה או תכנון'],
  'yeshiva/gate.py#signals': ['למצוא בבקשה סימנים שמדליקים שאלות'],
  'yeshiva/gate.py#generic_audience': ['לזהות קהל כללי בלי פירוט, כמו "לילד"', null, 'rule', 'choice'],
  'yeshiva/gate.py#answered': ['לבדוק אם הבקשה כבר ענתה על שאלה', null, 'rule', 'choice'],
  'yeshiva/gate.py#answered_in': ['לפרט על מה הבקשה כבר ענתה'],
  'yeshiva/gate.py#split_active': ['להפריד שאלות פעילות משאלות רדומות'],
  'yeshiva/gate.py#scope_hint': ['לגזור מהבקשה אילו קבצים מותר לגעת'],
  'yeshiva/gate.py#tree_sig': ['לחתום על תוכן כל הקבצים בפרויקט'],
  'yeshiva/gate.py#denied': ['להחליט אם כלי חסום עכשיו, ולמה', null, 'rule', 'choice'],
  'yeshiva/gate.py#_clean': ['לנקות מילה מסימני פיסוק', null, 'particle'],
  'yeshiva/gate.py#_variants': ['להפיק צורות של מילה בלי תחיליות', null, 'particle'],
  'yeshiva/gate.py#_norm': ['להחזיר את הצורה המוכרת של מילה', null, 'particle'],
  'yeshiva/gate.py#novel_facts': ['למצוא עובדות בתשובה שלא היו בבקשה', null, 'rule', 'list'],
  'yeshiva/gate.py#_unacked_facts': ['למצוא עובדות חדשות שעוד לא סווגו'],
  'yeshiva/gate.py#_digest': ['לחשב טביעת אצבע קצרה לבקשה', null, 'particle'],
  'yeshiva/gate.py#_is_mutation': ['לבדוק אם פעולת כלי משנה משהו'],
  'yeshiva/gate.py#_changes_tree': ['לבדוק אם פעולה משנה את עץ הקבצים'],
  'yeshiva/gate.py#_multi': ['לאסוף ערכים חוזרים של דגל בשורת פקודה', null, 'particle'],
  'yeshiva/gate.py#_kv_args': ['לפרק ארגומנטים בצורת מפתח=ערך', null, 'particle'],
  // ---- yeshiva · שיעורא
  'yeshiva/shiura.py#UnionFind': ['לאחד קבוצות של דברים שקולים', 'איחוד-חיפוש: מי זהה למי, אחרי שרשרת זיהויים.', 'engine'],
  'yeshiva/shiura.py#UnionFind.same': ['לבדוק אם שני שיעורים זוהו כאחד'],
  'yeshiva/shiura.py#_collapses': ['למצוא מחלוקות שקורסות בגלל זיהוי'],
  'yeshiva/shiura.py#collapse_test': ['להריץ מבחן קריסה על זיהויים', 'אם שני שיעורים זהים — מחלוקת עליהם קורסת; מחזיר את הקריסות ואת הדרכים לתקן.', 'rule'],
  'yeshiva/shiura.py#place': ['למצוא היכן על הציר יושב שיעור', null, 'rule'],
  'yeshiva/shiura.py#render_placement': ['לנסח את המיקומים האפשריים של שיעור'],
  'yeshiva/shiura.py#check_siman': ['לבדוק שסימן מתרחש בזמן הנכון', '"והלא כהנים מבעוד יום הם טובלים!" — סימן שמתרחש בזמן אחר אינו סימן.', 'rule'],
  'yeshiva/shiura.py#Collapse.render': ['לנסח קריסה של מחלוקת'],
  'yeshiva/shiura.py#CollapseResult.holds': ['לבדוק אם אין קריסות'],
  'yeshiva/shiura.py#CollapseResult.render': ['לנסח את תוצאת מבחן הקריסה'],
  'yeshiva/shiura.py#Placement.possible': ['לבדוק אם מיקום השיעור אפשרי'],
  // ---- yeshiva · הלומדים (דף, רש"י, מפרשים, פוסקים, שו"ת)
  'yeshiva/daf.py#strip_nikud': ['להסיר ניקוד וטעמים מטקסט עברי', null, 'particle'],
  'yeshiva/daf.py#scan': ['לסרוק עמוד גמרא ולמצוא מהלכים ידועים', null, 'engine'],
  'yeshiva/daf.py#Scan.by_kind': ['להביא מהלכים שנמצאו לפי סוג'],
  'yeshiva/daf.py#Scan.unbuilt_task_moves': ['לרשום מהלכים שנמצאו ועוד לא נבנו'],
  'yeshiva/daf.py#next_ref': ['למצוא את הדף הבא ללמוד בפנקס'],
  'yeshiva/daf.py#update_seed_states': ['להחליט אילו זרעי שאלה ערים או קבורים', null, 'rule'],
  'yeshiva/daf.py#summary_line': ['לנסח שורת סיכום לדף שנלמד'],
  'yeshiva/daf.py#active_seeds': ['להביא את זרעי השאלה הפעילים לשער'],
  'yeshiva/daf.py#fetch': ['להביא עמוד גמרא מספריא, בלי ניקוד'],
  'yeshiva/daf.py#Move': ['לייצג מהלך גמרא: תבנית, שאלה וסוג', null, 'brick'],
  'yeshiva/rashi.py#split_dibur': ['לפצל דיבור המתחיל מהפירוש שלו', null, 'particle'],
  'yeshiva/rashi.py#scan': ['לסרוק רש"י ולמצוא מהלכים ידועים', null, 'engine'],
  'yeshiva/rashi.py#fetch': ['להביא את רש"י על עמוד מספריא'],
  'yeshiva/mefarshim.py#units': ['למנות יחידות לימוד בתורה ובש"ס'],
  'yeshiva/mefarshim.py#clean': ['לנקות טקסט פירוש מתגיות וניקוד', null, 'particle'],
  'yeshiva/mefarshim.py#scan': ['לסרוק פירוש ולמצוא מהלכי המפרשים', null, 'engine'],
  'yeshiva/mefarshim.py#commentators_for': ['לרשום את המפרשים של קורפוס'],
  'yeshiva/mefarshim.py#next_unit': ['למצוא את היחידה הבאה ללמוד'],
  'yeshiva/mefarshim.py#profile': ['לבנות פרופיל מהלכים לכל מפרש'],
  'yeshiva/mefarshim.py#fetch': ['להביא פירוש על יחידה מספריא'],
  'yeshiva/poskim.py#scan': ['לסרוק פסק ולמצוא מהלכי הפוסקים', null, 'engine'],
  'yeshiva/poskim.py#profile': ['לבנות פרופיל מהלכים לכל פוסק'],
  'yeshiva/poskim.py#step': ['ללמוד יחידה אחת מהפוסק שתורו הגיע'],
  'yeshiva/shut.py#scan': ['לסרוק תשובה ולמצוא מהלכי השו"ת', null, 'engine'],
  'yeshiva/shut.py#profile': ['לבנות פרופיל מהלכים לכל משיב'],
  'yeshiva/shut.py#step': ['ללמוד סימן אחד מהשו"ת שתורו הגיע'],
  'yeshiva/mine.py#source_of': ['לזהות מסכת או ספר לפי קובץ'],
  'yeshiva/mine.py#mine': ['לכרות מועמדים למהלכים חדשים מהמטמון', null, 'engine'],
  'yeshiva/daf.py#seed_stats': ['לספור כמה כל זרע שאלה נשאל ושינה'],
  'yeshiva/daf.py#learn': ['ללמוד עמוד גמרא ולרשום אותו בפנקס'],
  'yeshiva/daf.py#Scan': ['לייצג תוצאת סריקה של עמוד', null, 'brick'],
  'yeshiva/rashi.py#learn': ['ללמוד את רש"י על עמוד ולרשום בפנקס'],
  'yeshiva/rashi.py#summary_line': ['לנסח שורת סיכום לרש"י שנלמד'],
  'yeshiva/rashi.py#Scan': ['לייצג תוצאת סריקה של רש"י', null, 'brick'],
  'yeshiva/rashi.py#Scan.unbuilt_output_moves': ['לרשום מהלכי רש"י שעוד לא נבנו'],
  'yeshiva/rashi.py#RMove': ['לייצג מהלך של רש"י: תבנית, שאלה וסוג', null, 'brick'],
  'yeshiva/mefarshim.py#learn': ['ללמוד את המפרשים על יחידה'],
  'yeshiva/mefarshim.py#summary_line': ['לנסח שורת סיכום ליחידה שנלמדה'],
  'yeshiva/mefarshim.py#Scan': ['לייצג תוצאת סריקה של פירוש', null, 'brick'],
  'yeshiva/mefarshim.py#Scan.unbuilt': ['לרשום מהלכי מפרשים שעוד לא נבנו'],
  'yeshiva/mefarshim.py#CMove': ['לייצג מהלך של המפרשים: תבנית, שאלה וסוג', null, 'brick'],
  'yeshiva/poskim.py#learn': ['ללמוד פסק ולרשום אותו בפנקס'],
  'yeshiva/poskim.py#summary_line': ['לנסח שורת סיכום לפסק שנלמד'],
  'yeshiva/poskim.py#next_part': ['לבחור את חלק הפוסקים הבא בתור'],
  'yeshiva/poskim.py#Scan': ['לייצג תוצאת סריקה של פסק', null, 'brick'],
  'yeshiva/poskim.py#Scan.unbuilt': ['לרשום מהלכי פוסקים שעוד לא נבנו'],
  'yeshiva/poskim.py#PMove': ['לייצג מהלך של הפוסקים: תבנית, שאלה וסוג', null, 'brick'],
  'yeshiva/shut.py#learn': ['ללמוד תשובה ולרשום אותה בפנקס'],
  'yeshiva/shut.py#summary_line': ['לנסח שורת סיכום לתשובה שנלמדה'],
  'yeshiva/shut.py#next_part': ['לבחור את חלק השו"ת הבא בתור'],
  'yeshiva/shut.py#Scan': ['לייצג תוצאת סריקה של תשובה', null, 'brick'],
  'yeshiva/shut.py#Scan.unbuilt': ['לרשום מהלכי שו"ת שעוד לא נבנו'],
  'yeshiva/shut.py#SMove': ['לייצג מהלך של השו"ת: תבנית, שאלה וסוג', null, 'brick'],
  'yeshiva/dialectic.py#_yes': ['לתרגם אמת או שקר ל"כן", "לא", "לא מצינו"', null, 'particle'],
  'yeshiva/engine.py#_yes': ['לתרגם אמת או שקר ל"כן", "לא", "לא מצינו"', null, 'particle'],
  'yeshiva/shiura.py#Identification': ['לייצג זיהוי: שני שיעורים הם אחד', null, 'brick'],
  'yeshiva/shiura.py#Dispute': ['לייצג מחלוקת על שיעור', null, 'brick'],
  'yeshiva/shiura.py#CollapseResult': ['לייצג תוצאת מבחן קריסה', null, 'brick'],
  'bench/tasks.py#age_injectable': ['לבדוק שאפשר להזריק את "היום" לחישוב גיל', null, 'rule', 'bool'],
  'bench/tasks.py#age_future_rejected': ['לבדוק שתאריך לידה עתידי נדחה', null, 'rule', 'bool'],
  'bench/tasks.py#age_documented': ['לבדוק שחישוב הגיל מתועד', null, 'rule', 'bool'],
  'bench/tasks.py#raises': ['לבדוק שפונקציה זורקת את השגיאה הצפויה', null, 'rule', 'bool'],
  'bench/tasks.py#novel': ['למצוא בקובץ עובדות שלא היו בבקשה', null, 'rule', 'list'],
  'bench/tasks.py#sched_checks': ['לבנות את בדיקות מתזמן המשימות'],
  'bench/tasks.py#_found': ['לבדוק אם טקסט נמצא בקובץ', null, 'particle', 'bool'],
  'bench/tasks.py#_code_only': ['להסיר הערות ותיעוד ולהשאיר קוד', null, 'particle'],
  'bench/tasks.py#_sentences': ['לספור משפטים בטקסט', null, 'particle', 'number'],
  'bench/tasks.py#_syntax_noise': ['למדוד כמה סימני תחביר יש בדוגמאות', null, 'rule', 'number'],
  'bench/tasks.py#_errors_readable': ['לבדוק שהודעות השגיאה מובנות לילד', null, 'rule', 'bool'],
  'bench/tasks.py#_dedupe': ['למצוא את פונקציית הסרת הכפילויות בתוצר'],
  'bench/tasks.py#Check': ['לייצג בדיקה אחת של משימת מבחן', null, 'brick'],
  'bench/tasks.py#Task': ['לייצג משימת מבחן לסוכן', null, 'brick'],
  'bench/score.py#score': ['לנקד תוצר של סוכן מול בדיקות המשימה', null, 'engine'],
  'bench/score.py#materialize': ['לשלוף קובצי תוצר מענף לתיקייה זמנית'],
  // ---- yeshiva · arena/shop (חנות-אימון)
  'arena/shop/money.py#Money._check': ['לוודא ששני סכומים באותו מטבע', null, 'rule', 'choice'],
  'arena/shop/money.py#sum_money': ['לסכם רשימת סכומי כסף'],
  'arena/shop/money.py#Money.percent': ['לחשב אחוז מסכום, מעוגל לאגורה'],
  'arena/shop/money.py#Money.clamp_min_zero': ['להגביל סכום שלא יירד מאפס'],
  'arena/shop/payments.py#Gateway.authorize': ['לאשר תשלום מול הסולק'],
  'arena/shop/payments.py#Gateway.capture': ['לגבות תשלום שאושר'],
  'arena/shop/payments.py#Gateway.refund': ['להחזיר תשלום ללקוח'],
  'arena/shop/payments.py#Gateway.void': ['לבטל תשלום לפני גבייה'],
  'arena/shop/payments.py#PaymentIntent.refundable': ['לחשב כמה עוד אפשר להחזיר', null, 'function', 'amount'],
  'arena/shop/catalog.py#Catalog.products_in': ['לרשום את המוצרים בקטגוריה'],
  'arena/shop/catalog.py#Catalog.variants_of': ['לרשום את הגרסאות של מוצר'],
  'arena/shop/catalog.py#Catalog.is_within': ['לבדוק אם קטגוריה נמצאת בתוך אחרת'],
  'arena/shop/catalog.py#Catalog.path': ['לרשום את שרשרת הקטגוריות עד השורש'],
  'arena/shop/catalog.py#parse_sku': ['לפרק מק"ט למשפחה ולגרסה'],
  'arena/shop/events.py#AuditLog.for_order': ['לרשום את האירועים של הזמנה'],
  'arena/shop/events.py#AuditLog.of': ['לרשום אירועים מסוג מסוים'],
  'arena/shop/events.py#EventBus': ['לשדר אירועים למנויים', null, 'engine'],
  'arena/shop/inventory.py#Inventory.on_hand': ['לספור כמה יחידות יש במחסן'],
  'arena/shop/inventory.py#Inventory.available': ['לספור כמה יחידות פנויות למכירה'],
  'arena/shop/reports.py#SalesReport': ['להפיק דוח מכירות לפי מוצר וקטגוריה', null, 'engine'],
  'arena/shop/reports.py#Bucket.margin': ['לחשב רווח: הכנסה פחות עלות'],
  'arena/shop/repo.py#Repository': ['לשמור ולטעון הזמנות מקובץ', null, 'engine'],

  'arena/shop/money.py#Money': ['לחשב כסף באגורות שלמות בלי טעויות עיגול', 'כסף באגורות שלמות; עיגול אחד בלבד, במקום אחד.', 'engine'],
  'arena/shop/money.py#Money.of': ['ליצור סכום כסף מעוגל לאגורה'],
  'arena/shop/money.py#Money.zero': ['ליצור סכום אפס במטבע נתון'],
  'arena/shop/money.py#Money.allocate': ['לחלק סכום לפי יחסים בלי לאבד אגורה'],
  'arena/shop/pricing.py#PricingEngine': ['לתמחר עגלה עם קופונים והנחות כמות', null, 'engine'],
  'arena/shop/pricing.py#Coupon.usable': ['לבדוק אם קופון תקף להיום ולסכום', null, 'rule', 'choice'],
  'arena/shop/tax.py#TaxEngine': ['לחשב מס לפי מוצר ואזור', null, 'engine'],
  'arena/shop/shipping.py#ShippingEngine': ['לתמחר משלוח לפי משקל ואזור', null, 'engine'],
  'arena/shop/shipping.py#dimensional_weight_g': ['לחשב משקל נפחי בגרמים'],
  'arena/shop/inventory.py#Inventory': ['לנהל מלאי במחסנים: קליטה, שריון וניכוי', null, 'engine'],
  'arena/shop/orders.py#OrderService': ['לנהל הזמנה מהגשה ועד משלוח והחזר', null, 'engine'],
  'arena/shop/orders.py#Order.transition': ['להעביר הזמנה למצב חדש, רק אם מותר', null, 'rule'],
  'arena/shop/payments.py#PaymentGateway': ['לאשר, לגבות ולהחזיר תשלומים', null, 'engine'],
  // ---- yeshiva · minisql
  'random/minisql/minisql/database.py#Database': ['להריץ מסד נתונים SQL קטן בקובץ', 'מסד SQL זעיר: מפרק שאילתה, מתכנן, מבצע, ושומר עם יומן-כתיבה ועסקאות.', 'engine'],
  'random/minisql/minisql/btree.py#BTree': ['לאנדקס ערכים בעץ B מאוזן', null, 'engine'],
  'random/minisql/minisql/lexer.py#tokenize': ['לפרק שאילתת SQL לאסימונים'],
  'random/minisql/minisql/parser.py#Parser': ['לפרק שאילתת SQL לעץ תחביר', null, 'engine'],
  'random/minisql/minisql/planner.py#Planner': ['לתכנן איך להריץ שאילתת SQL', null, 'engine'],
  'random/minisql/minisql/executor.py#Executor': ['לבצע תוכנית שאילתה על הטבלאות', null, 'engine'],
  'random/minisql/minisql/storage.py#Storage': ['לשמור טבלאות לקובץ עם יומן כתיבה', null, 'engine'],
  'random/minisql/minisql/values.py#coerce': ['להמיר ערך לסוג העמודה', null, 'rule'],
  'random/minisql/minisql/values.py#type_name': ['להחזיר את שם הסוג של ערך'],
  'random/minisql/minisql/values.py#truthy': ['לבדוק אמת בלוגיקה של SQL (גם "לא ידוע")'],
  'random/minisql/minisql/values.py#sql_and': ['לחשב "וגם" בלוגיקה תלת-ערכית'],
  'random/minisql/minisql/values.py#sql_or': ['לחשב "או" בלוגיקה תלת-ערכית'],
  'random/minisql/minisql/values.py#sql_not': ['לחשב "לא" בלוגיקה תלת-ערכית'],
  'random/minisql/minisql/values.py#compare': ['להשוות שני ערכים כמו SQL'],
  'random/minisql/minisql/values.py#group_key': ['ליצור מפתח קיבוץ משורת ערכים'],
  'random/minisql/minisql/values.py#like': ['לבדוק התאמת טקסט לתבנית LIKE', null, 'rule', 'bool'],
  'random/minisql/minisql/values.py#_like_re': ['להמיר תבנית LIKE לביטוי רגולרי', null, 'particle'],
  // ---- yeshiva · harness + bench
  'harness/police.mjs#icon': ['לבחור סמל ✅/❌ לתוצאת בדיקה', null, 'particle'],
  'harness/police.mjs#tail': ['להביא את סוף הפלט של פקודה', null, 'particle'],
  'harness/guard.mjs#uniq': ['להסיר כפילויות מרשימה', null, 'particle'],
  'harness/guard.mjs#stub': ['לבחור בדל במקום פקודה הרסנית לפי סיומת'],
  'bench/report.py#group': ['לקבץ ריצות לפי משימה וזרוע'],
  'bench/report.py#summarize': ['לסכם ציונים לכל משימה וזרוע'],
  'bench/report.py#render': ['להציג טבלת סיכום של ריצות'],
  'bench/tasks.py#states_assumptions': ['לבדוק אם טקסט אומר במפורש מה הניח', null, 'rule', 'bool'],
  // ---- qa-scanner
  'exposure_audit.py#Audit': ['לבדוק אתר ב-116 בדיקות חשיפה', 'מריץ על אתר בדיקות מקובצות: משפטי, נגישות, דוא"ל, אבטחה, קידום, ביצועים, אמינות ועוד.', 'engine'],
  'exposure_audit.py#render_html': ['לטעון דף בדפדפן אמיתי ולהחזיר את ה-DOM'],
  'exposure_audit.py#doh': ['לשאול רשומת DNS דרך HTTPS'],
  'exposure_audit.py#get': ['להוריד עמוד אינטרנט עם מטמון'],
  'exposure_audit.py#report': ['להדפיס דוח חשיפה מקובץ לפי תחום'],
  'make_report.py#build_report': ['לבנות דוח PDF מעוצב לאתר', null, 'engine'],
  'make_report.py#screenshot': ['לצלם את דף הבית של אתר'],
  'make_report.py#_issue_card': ['לבנות כרטיס HTML לממצא אחד', null, 'component', 'ui'],
  'scanner.py#scan_page': ['לבדוק עמוד אחד לטעויות לפני פרסום', null, 'engine'],
  'scanner.py#_prices': ['לחלץ מחירים מתוך טקסט', null, 'particle'],
  'scanner.py#check_url_alive': ['לבדוק אם קישור עדיין עובד', null, 'rule', 'bool'],
  'scanner.py#crawl': ['לסרוק אתר עמוד אחר עמוד', null, 'engine'],
  'scanner.py#report': ['להדפיס דוח תקלות לפי חומרה'],
  'scanner.py#Issue': ['לייצג תקלה שנמצאה באתר', null, 'brick'],
  'scanner2.py#_nums': ['לחלץ מספרים מתוך טקסט', null, 'particle'],
  'scanner2.py#analyze_product': ['לבדוק מוצר בודד בחנות לטעויות', null, 'engine'],
  'scanner2.py#scan_rendered': ['לבדוק עמוד אחרי שהדפדפן הריץ אותו', null, 'engine'],
  'scanner2.py#crawl': ['לסרוק אתר בדפדפן אמיתי', null, 'engine'],
  'scanner2.py#report': ['להדפיס דוח תקלות לפי חומרה'],
  'scanner2.py#Issue': ['לייצג תקלה שנמצאה באתר', null, 'brick'],
  'scanner3.py#detect_platform': ['לזהות על איזו פלטפורמה בנויה החנות', null, 'rule', 'choice'],
  'scanner3.py#products_from_shopify': ['להביא רשימת מוצרים רשמית מ-Shopify'],
  'scanner3.py#products_from_jsonld': ['לחלץ מוצרים מנתוני Schema.org בדף'],
  'scanner3.py#check_products': ['לבדוק רשימת מוצרים לטעויות מחיר ומלאי', null, 'engine'],
  'scanner3.py#check_universal': ['לבדוק עמוד בבדיקות שלא תלויות בפלטפורמה', null, 'engine'],
  'scanner3.py#scan': ['לסרוק חנות לפי מקור האמת שלה', null, 'engine'],
  'scanner3.py#get': ['להוריד עמוד אינטרנט'],
  'scanner3.py#report': ['להדפיס דוח ממצאים לפי חומרה'],
  'scanner3.py#Finding': ['לייצג ממצא שנמצא באתר', null, 'brick'],
  // ---- yoman-habina
  'engine.js#render': ['להציג גיליון עיתון שלם מקובץ JSON', 'בונה את כל העיתון: כותרת, ואז כל מדור לפי סוגו (עמוד ראשי, כרטיסים, מבזקים, מוסף, דעה, תחזית).', 'engine'],
  'engine.js#boot': ['לטעון גיליון ולהציג אותו', null, 'engine'],
  'engine.js#el': ['ליצור אלמנט HTML עם מחלקה ותוכן', null, 'particle', 'ui'],
  'engine.js#add': ['להוסיף ילד לאלמנט אם קיים', null, 'particle', 'ui'],
  'engine.js#paras': ['להפוך רשימת טקסטים לפסקאות', null, 'component', 'ui'],
  'engine.js#srcLine': ['להציג שורת מקור עם קישור', null, 'component', 'ui'],
  'engine.js#tag': ['להציג תגית נושא קטנה', null, 'component', 'ui'],
  'engine.js#whyBox': ['להציג תיבת "למה זה חשוב"', null, 'component', 'ui'],
  'engine.js#runhead': ['להציג כותרת רצה של מדור', null, 'component', 'ui'],
  'engine.js#renderMasthead': ['להציג את כותרת העיתון והתאריך', null, 'component', 'ui'],
  'engine.js#renderFront': ['להציג את העמוד הראשי', null, 'component', 'ui'],
  'engine.js#renderCards': ['להציג מדור כרטיסי ידיעות', null, 'component', 'ui'],
  'engine.js#renderBriefs': ['להציג מדור מבזקים קצרים', null, 'component', 'ui'],
  'engine.js#renderTwoup': ['להציג מדור בשני טורים', null, 'component', 'ui'],
  'engine.js#renderSupplement': ['להציג את המוסף האישי', null, 'component', 'ui'],
  'engine.js#renderOpinion': ['להציג מדור דעה', null, 'component', 'ui'],
  'engine.js#renderForecast': ['להציג מדור תחזית', null, 'component', 'ui'],
  'engine.js#renderColophon': ['להציג את הקולופון בתחתית', null, 'component', 'ui'],
  'engine.js#fail': ['להציג הודעת כשל במקום העיתון', null, 'component', 'ui'],
  'verify.mjs#makeValidator': ['לבנות בודק סכמה עצמאי מ-JSON Schema', 'בונה בודק שמוודא שגיליון תואם לסכמה: שדות חובה, סוגים, ערכים מותרים ושדות לא מוכרים.', 'engine'],
  'verify.mjs#walkStrings': ['לעבור על כל המחרוזות בתוך מבנה נתונים', null, 'particle'],
  'verify.mjs#collectUrls': ['לאסוף את כל הכתובות מגיליון'],
  'verify.mjs#partSchema': ['לבדוק כל גיליון מול הסכמה', null, 'rule', 'choice'],
  'verify.mjs#partInjection': ['לחפש הזרקות קוד וקישורים לא מאובטחים', null, 'rule', 'choice'],
  'verify.mjs#partSmoke': ['לפתוח את העיתון בדפדפן ולבדוק שהכול נטען', null, 'rule', 'choice'],
  'verify.mjs#islandHtml': ['לשתול גיליון בתוך דף HTML כאי נתונים'],
  'verify.mjs#allContent': ['לרשום את כל קובצי הגיליונות לבדיקה'],
  'verify.mjs#readJSON': ['לקרוא קובץ JSON'],
  'verify.mjs#startServer': ['להרים שרת קבצים מקומי לבדיקה'],
  // ---- mmmm
  'lib/api-client-react/src/custom-fetch.ts#customFetch': ['לשלוח בקשת רשת עם טיפול בשגיאות', 'עוטף fetch: מוסיף כתובת בסיס והרשאה, מפענח JSON או טקסט, וזורק שגיאה קריאה.', 'engine'],
  'lib/api-client-react/src/custom-fetch.ts#mergeHeaders': ['למזג כמה קבוצות כותרות לאחת'],
  'lib/api-client-react/src/custom-fetch.ts#stripBom': ['להסיר סימן BOM מתחילת טקסט', null, 'particle'],
  'lib/api-client-react/src/custom-fetch.ts#looksLikeJson': ['לבדוק אם טקסט נראה כמו JSON', null, 'particle'],
  'lib/api-client-react/src/custom-fetch.ts#truncate': ['לקצר טקסט לאורך מרבי', null, 'particle'],
  'lib/api-client-react/src/custom-fetch.ts#buildErrorMessage': ['לנסח הודעת שגיאה קריאה מתשובת שרת'],
  'lib/api-client-react/src/custom-fetch.ts#inferResponseType': ['לנחש אם התשובה JSON, טקסט או קובץ'],
  'lib/api-client-react/src/custom-fetch.ts#getMediaType': ['לחלץ את סוג התוכן מהכותרות'],
  'lib/api-client-react/src/custom-fetch.ts#isJsonMediaType': ['לבדוק אם סוג התוכן הוא JSON', null, 'particle'],
  'lib/api-client-react/src/custom-fetch.ts#isTextMediaType': ['לבדוק אם סוג התוכן הוא טקסט', null, 'particle'],
  'lib/api-client-react/src/custom-fetch.ts#hasNoBody': ['לבדוק אם לתשובה אין גוף'],
  'lib/api-client-react/src/custom-fetch.ts#resolveMethod': ['לקבוע את שיטת הבקשה (GET/POST)'],
  'lib/api-client-react/src/custom-fetch.ts#applyBaseUrl': ['להוסיף כתובת בסיס לכתובת יחסית'],
  'lib/api-client-react/src/custom-fetch.ts#getStringField': ['לקרוא שדה טקסט מאובייקט בבטחה', null, 'particle'],
  'lib/integrations-openai-ai-react/src/audio/audio-utils.ts#decodePCM16ToFloat32': ['לפענח שמע PCM16 לפורמט ניגון בדפדפן'],
  'lib/integrations-openai-ai-react/src/audio/useVoiceStream.ts#useVoiceStream': ['להזרים קול לשרת ולנגן את התשובה', null, 'engine', 'ui'],
  'lib/integrations-openai-ai-react/src/audio/useVoiceStream.ts#readSseDataFromBlock': ['לחלץ נתונים מגוש אירועי SSE', null, 'particle'],
  'lib/integrations-openai-ai-react/src/audio/useVoiceStream.ts#extractCompleteSseBlocks': ['לפצל זרם SSE לגושים שלמים'],
  'lib/integrations-openai-ai-react/src/audio/useVoiceStream.ts#parseVoiceStreamEvent': ['לפענח אירוע מזרם הקול'],
  'lib/integrations-openai-ai-react/src/audio/useVoiceRecorder.ts#useVoiceRecorder': ['להקליט קול מהמיקרופון', null, 'engine', 'ui'],
  'lib/integrations-openai-ai-react/src/audio/useAudioPlayback.ts#useAudioPlayback': ['לנגן שמע שמגיע בחתיכות', null, 'engine', 'ui'],
  'lib/integrations-openai-ai-react/src/audio/useAudioPlayback.ts#SequenceBuffer': ['לסדר חתיכות שמע לפי מספר רצף', null, 'engine'],
  'lib/integrations-openai-ai-react/src/audio/audio-playback-worklet.js#RingBuffer': ['לאגור שמע בחוצץ מעגלי', null, 'engine'],
  'lib/integrations-openai-ai-server/src/audio/client.ts#detectAudioFormat': ['לזהות פורמט שמע לפי הבתים הראשונים', null, 'rule', 'choice'],
  'lib/integrations-openai-ai-server/src/audio/client.ts#convertToWav': ['להמיר כל קובץ שמע ל-WAV'],
  'lib/integrations-openai-ai-server/src/audio/client.ts#ensureCompatibleFormat': ['לוודא שקובץ השמע בפורמט נתמך'],
  'lib/integrations-openai-ai-server/src/batch/utils.ts#batchProcess': ['לעבד רשימה בקבוצות עם הגבלת קצב', null, 'engine'],
  'artifacts/api-server/src/swarm/agents.ts#runSwarm': ['להריץ נחיל סוכנים שמציע תלבושות', 'במאי ⇒ מנתח סגנון ⇒ סוכן שוק ⇒ בקרת איכות; כל שלב בונה על הקודם.', 'engine'],
  'artifacts/api-server/src/swarm/agents.ts#runDirectorAgent': ['לפרק פרופיל לבריף סטיילינג', null, 'engine'],
  'artifacts/api-server/src/swarm/agents.ts#runStyleAnalystAgent': ['לנתח סגנון ולהגדיר כיוון למראה', null, 'engine'],
  'artifacts/api-server/src/swarm/agents.ts#runMarketAgent': ['למפות כיוון מראה לפריטים בשוק', null, 'engine'],
  'artifacts/api-server/src/swarm/agents.ts#runQAAgent': ['לבקר ולשפר את הצעות התלבושת', null, 'engine'],
  'artifacts/api-server/src/swarm/agents.ts#fallbackSuggestions': ['להציע תלבושות קבועות כשאין חיבור', null, 'function'],
  'artifacts/api-server/src/routes/notes.ts#extractFromText': ['לחלץ מותגים וצבעים מתוך הערה חופשית'],
  'artifacts/api-server/src/routes/notes.ts#buildSummary': ['לנסח סיכום העדפות לבוש'],
  'artifacts/agents-chat/src/lib/utils.ts#cn': ['לחבר שמות מחלקות CSS בלי כפילויות', null, 'particle'],
  'artifacts/agents-chat/src/hooks/use-toast.ts#reducer': ['לעדכן רשימת הודעות קופצות לפי פעולה'],
  'artifacts/agents-chat/src/hooks/use-toast.ts#toast': ['להציג הודעה קופצת', null, 'component', 'ui'],
  'artifacts/agents-chat/src/hooks/use-mobile.tsx#useIsMobile': ['לבדוק אם המסך בגודל נייד', null, 'component', 'bool'],
  'ask-director-keys.js#extractKeyRequirements': ['לחלץ דרישות מפתחות מתשובת סוכן'],
  'final_meeting.js#getRequestDetails': ['להרכיב פרטי בקשה לספק של סוכן'],
}

// ================================================================ דוגמאות (נבדקו ידנית מול הקוד; מנוקות מכל מידע אישי)
const EXAMPLES = {
  'yeshiva/daf.py#strip_nikud': { in: { s: 'שָׁלוֹם' }, out: 'שלום' },
  'yeshiva/gate.py#ve_elu_hen': { in: { text: '- תפוח\n- בננה וכו\'' }, out: 'רשימה פתוחה («- בננה וכו\'») — \'ואלו הן\': מנה את כל הפריטים, או אמור כמה יש ולמה לא כולם כאן' },
  'yeshiva/gate.py#imperatives': { in: { prompt: 'תוסיף לוג ותכתוב בדיקה' }, out: [['תוסיף', 'לוג ותכתוב']] },
  'yeshiva/gate.py#generic_audience': { in: { prompt: 'תסביר את זה לילד' }, out: 'לילד' },
  'yeshiva/rashi.py#split_dibur': { in: { s: 'מאימתי – משעה שהכהנים נכנסים' }, out: ['מאימתי', 'משעה שהכהנים נכנסים'] },
  'yeshiva/maimatai.py#strictness': { in: { position: 'לא יצא' }, out: 'מחמיר' },
  'random/minisql/minisql/values.py#sql_and': { in: { a: true, b: null }, out: null },
  'random/minisql/minisql/values.py#like': { in: { text: 'hello', pattern: 'h%' }, out: true },
  'arena/shop/shipping.py#dimensional_weight_g': { in: { dims_mm: [100, 100, 100], divisor: 5000 }, out: 200 },
  'yeshiva/gate.py#_kv_args': { in: { args: ['--matter', 'X'] }, out: { matter: 'X' } },
  'scanner.py#_prices': { in: { text: 'מחיר: ₪49.90, במבצע ₪0' }, out: [49.9, 0.0] },
  'scanner3.py#detect_platform': { in: { url: 'https://shop.example', html: '<script src="cdn.shopify.com/x.js">' }, out: 'shopify' },
  'lib/api-client-react/src/custom-fetch.ts#stripBom': { in: { text: '﻿{"a":1}' }, out: '{"a":1}' },
  'lib/api-client-react/src/custom-fetch.ts#truncate': { in: { text: 'abcdefghij', maxLength: 5 }, out: 'abcd…' },
  'lib/api-client-react/src/custom-fetch.ts#isJsonMediaType': { in: { mediaType: 'application/problem+json' }, out: true },
  'lib/integrations-openai-ai-server/src/audio/client.ts#detectAudioFormat': { in: { buffer: 'RIFF....WAVE (בתים)' }, out: 'wav' },
  'artifacts/agents-chat/src/lib/utils.ts#cn': { in: { inputs: ['px-2', 'px-4', 'font-bold'] }, out: 'px-4 font-bold' },
  'engine.js#tag': { in: { t: { text: 'כלים' } }, out: '<span class="tag">כלים</span>' },
}

// ================================================================ בניית חלקים
const KIND_HE = { span: 'טווח', amount: 'סכום', number: 'מספר', times: 'זמנים', date: 'תאריך', sequence: 'רצף', list: 'רשימה', waiting: 'המתנה', text: 'טקסט', bool: 'כן/לא', geo: 'מיקום', image: 'תמונה', sound: 'שמע', file: 'קובץ', choice: 'הכרעה', ui: 'תצוגה', unknown: 'משהו' }
const kindHe = (k) => (k.startsWith('record:') ? `רשומת ${k.slice(7)}` : KIND_HE[k] || k)
const langOf = (p) => (p.endsWith('.py') ? 'py' : /\.tsx?$/.test(p) ? 'ts' : 'js')

function heDoc(d) {
  if (!d || !/[א-ת]/.test(d)) return null
  let s = d.replace(/\s+/g, ' ').trim()
  // משפט ראשון שלם (עד נקודה/סימן-שאלה מחוץ לגרשיים), לכל היותר ~180 תווים
  const m = s.match(/^(.{20,180}?[.?!])(\s|$)/)
  if (m) s = m[1]
  else if (s.length > 180) s = s.slice(0, 177).replace(/\s+\S*$/, '') + '…'
  if (!/[.?!…]$/.test(s)) s += '.'
  return s
}
function autoDoes(name, takes, gives, stub) {
  const t = takes.length ? 'מקבל ' + [...new Set(takes.map((x) => kindHe(x.kind)))].slice(0, 3).join(', ') : 'בלי קלט'
  return `${name} — ${t}, ומחזיר ${kindHe(gives.kind)}.${stub ? ' (שלד: מחזיר ערך קבוע)' : ''}`
}

function decideWhat(it, sym, hand, path, src) {
  if (hand && hand[2]) return hand[2]
  const last = sym.split('.').pop()
  if (it.kind === 'class') {
    const nonDunder = it.methods.filter((m) => !m.startsWith('__') && m !== 'constructor' && m !== 'render' && m !== '__str__')
    return nonDunder.length >= 2 ? 'engine' : 'brick'
  }
  if (/^use[A-Z]/.test(last)) return 'component'
  if (/^render[A-Z]/.test(last) && langOf(path) !== 'py') return 'component'
  if (src === 'yeshiva' && path === 'yeshiva/gate.py' && it.named) return 'rule'
  if (!it.impure.length && it.loc <= 6 && /^_|^(strip|clean|trim|truncate|is[A-Z]|has[A-Z]|cn|uniq|opt|has|sh|ok)/.test(last)) return 'particle'
  if (/^(check|validate|verify|detect)[A-Z_]/.test(last) && !it.impure.length) return 'rule'
  return 'function'
}

function buildParts(scan) {
  const { cfg, mods } = scan
  const src = cfg.source
  const parts = []
  const unknownWords = new Set()
  const stats = { dupes: 0, skippedImpure: 0, skippedExceptions: 0, skippedCli: 0, skippedDunder: 0, stubs: 0, autoNamed: 0, handNamed: 0 }
  const seenHash = new Map()
  const keepImpure = (p) => (cfg.keepImpure || []).some((r) => r.test(p))

  // ---- טוהר טרנזיטיבי: פונקציה שקוראת לפונקציה/מתודה לא-טהורה (באותו מודול, באותה מחלקה, או ביבוא-יחסי) — לא טהורה
  const global = new Map()
  for (const mod of mods) for (const it of mod.items) if (it.kind === 'function') global.set(`${mod.path}#${it.symbol}`, it)
  let changed = true
  while (changed) {
    changed = false
    for (const mod of mods) {
      for (const it of mod.items) {
        if (it.kind !== 'function' || it.impure.length) continue
        const callees = [
          ...(it.calls || []).map((c) => global.get(`${mod.path}#${c}`) || (mod.imports && mod.imports[c] ? global.get(`${mod.imports[c][0]}#${mod.imports[c][1]}`) : null)),
          ...(it.selfcalls || []).map((c) => global.get(`${mod.path}#${it.cls}.${c}`)),
        ]
        const hit = callees.find((x) => x && x !== it && x.impure.length)
        if (hit) {
          it.impure = ['calls:' + hit.symbol]
          changed = true
        }
      }
    }
  }
  for (const mod of mods) {
    const classes = new Map(mod.items.filter((i) => i.kind === 'class').map((c) => [c.symbol, c]))
    for (const it of mod.items) {
      const sym = it.symbol
      const last = sym.split('.').pop()
      const id = `${src}:${mod.path}#${sym}`
      const handKey = `${mod.path}#${sym}`
      const hand = HAND[handKey]
      if (it.kind === 'class') {
        if ((it.bases || []).some((b) => /Exception|Error$|^Error\b/.test(b || ''))) {
          stats.skippedExceptions++
          continue
        }
        if ((it.bases || []).some((b) => /\bEnum\b/.test(b || ''))) continue
      } else {
        if (last.length <= 1 || /^(main|cli|_?tell)$/.test(last) || last.startsWith('cmd_') || last.startsWith('test') || /^_one$/.test(last) || /^(_load|_save|_fresh|locked)$/.test(last)) {
          stats.skippedCli++
          continue
        }
        if (last === 'constructor' || (/^__\w+__$/.test(last) && !DUNDER[last])) {
          stats.skippedDunder++
          continue
        }
        const isMethod = !!it.cls
        const impure = it.impure.length > 0
        if (impure && !hand) {
          if (isMethod || last.startsWith('_') || !keepImpure(mod.path)) {
            stats.skippedImpure++
            continue
          }
        }
        if (isMethod && classes.has(it.cls) && (classes.get(it.cls).bases || []).some((b) => /Exception|Error$/.test(b || ''))) continue
        if (!hand && it.params.some((p) => /^(req|res)$/.test(p.name)) && isMethod) {
          stats.skippedImpure++
          continue
        }
        // כפילות בדיוק (אותו גוף) — נשמר המופע הראשון
        if (it.hash && it.loc > 2) {
          const key = `${last}:${it.hash}`
          if (seenHash.has(key) && !hand) {
            stats.dupes++
            continue
          }
          if (!seenHash.has(key)) seenHash.set(key, id)
        }
      }

      let takes, gives
      if (it.kind === 'class') {
        takes = takesOf(it.fields || [])
        gives = { kind: 'record:' + ENTITY_FROM_TYPE(sym), type: sym }
      } else {
        takes = takesOf(it.params)
        gives = givesOf(it, sym)
      }
      if (hand && hand[3]) gives = { kind: hand[3], type: gives.type }
      // גלאי השער: טקסט נכנס, הכרעה יוצאת
      const ruleName = mod.named && mod.named[last]
      if (src === 'yeshiva' && mod.path === 'yeshiva/gate.py' && ruleName) gives = { kind: 'choice', type: gives.type }

      const unk = new Set()
      let name
      if (hand) {
        name = hand[0]
        stats.handNamed++
      } else if (ruleName) {
        name = `לבדוק "${ruleName}" בתשובה`
        stats.handNamed++
      } else {
        name = autoName(sym, gives.kind, unk, it.kind === 'class' ? decideWhat({ ...it, named: false }, sym, null, mod.path, src) : null)
        stats.autoNamed++
      }
      unk.forEach((w) => unknownWords.add(w))
      name = clip9(name)
      const what = decideWhat({ ...it, named: !!ruleName }, sym, hand, mod.path, src)
      const doc = heDoc(it.doc)
      let does = (hand && hand[1]) || (hand && langOf(mod.path) !== 'py' ? null : doc) || autoDoes(name, takes, gives, it.stub)
      if (it.stub && !/שלד/.test(does)) does += ' (שלד: מחזיר ערך קבוע)'
      if (it.stub) stats.stubs++
      const tags = new Set([mod.path.split('/').length > 1 ? mod.path.split('/').slice(0, -1).join('/') : mod.path.replace(/\.\w+$/, '')])
      if (it.cls) tags.add('method')
      if (it.async) tags.add('async')
      if (it.stub) tags.add('stub')
      if (ruleName) tags.add('detector:' + ruleName)
      if (!hand && !ruleName) tags.add('name:auto')
      if (unk.size) tags.add('name:english-residue')
      if (last.startsWith('_')) tags.add('private')
      const pure = it.kind === 'class' ? false : it.impure.length === 0
      if (it.kind === 'class') {
        const ms = (classes.get(sym) && classes.get(sym).methods) || []
        if (ms.length) tags.add('methods:' + ms.filter((m) => !m.startsWith('__') && m !== 'constructor').length)
      }
      parts.push({
        id, source: src, path: mod.path, symbol: sym, lang: langOf(mod.path), what, name, does,
        takes, gives, pure, example: EXAMPLES[handKey] || null, tags: [...tags].sort(),
      })
    }

    // ---- מהלכי הישיבה (טבלאות Move/RMove/CMove/PMove/SMove)
    const layer = { 'yeshiva/daf.py': 'גמרא', 'yeshiva/rashi.py': 'רש"י', 'yeshiva/mefarshim.py': 'מפרשים', 'yeshiva/poskim.py': 'פוסקים', 'yeshiva/shut.py': 'שו"ת' }[mod.path]
    const seenMove = new Set()
    for (const mv of mod.moves || []) {
      let sym = `${mv.table}[${mv.key}]`
      while (seenMove.has(sym)) sym += "'"
      seenMove.add(sym)
      const does = [mv.does, mv.question].filter(Boolean).join(' — שאלה לבקשה: ')
      parts.push({
        id: `${src}:${mod.path}#${sym}`, source: src, path: mod.path, symbol: sym, lang: 'py', what: 'rule',
        name: clip9(`לזהות בטקסט את המהלך "${mv.key}"`),
        does: (does ? `${layer ? layer + ': ' : ''}${does}` : `מזהה בטקסט את המהלך "${mv.key}".`).replace(/\s+/g, ' '),
        takes: [{ name: 'text', kind: 'text', type: 'str' }], gives: { kind: 'choice', type: 'bool' }, pure: true, example: null,
        tags: ['dialectic-move', layer ? 'layer:' + layer : 'layer:?', ...(mv.kind ? ['move-kind:' + mv.kind] : []), ...(mv.family ? ['family:' + mv.family] : []), ...(mv.built ? ['built:' + mv.built] : ['built:none'])].sort(),
      })
    }
    // ---- טבלאות-כללים בשער (שלבי אבחון/ביקורת, תפריט אברבנאל)
    const seenTbl = new Set()
    for (const r of mod.tables || []) {
      let sym = `${r.table}[${r.name}]`
      while (seenTbl.has(sym)) sym += "'"
      seenTbl.add(sym)
      const what = { BUG_STEPS: 'שלב אבחון באג', AUDIT_STEPS: 'שלב ביקורת קוד', MENU: 'סוג תשובה של אברבנאל' }[r.table]
      parts.push({
        id: `${src}:${mod.path}#${sym}`, source: src, path: mod.path, symbol: sym, lang: 'py', what: 'rule',
        name: clip9(`לבדוק "${r.name}" בתשובה`),
        does: r.desc ? `${what}: ${r.desc.replace(/\s+/g, ' ')}` : `${what} "${r.name}" — מזוהה בתשובה לפי תבנית מילים.`,
        takes: [{ name: 'reply', kind: 'text', type: 'str' }], gives: { kind: 'choice', type: 'bool' }, pure: true, example: null,
        tags: ['gate-table', 'table:' + r.table].sort(),
      })
    }
    // ---- בדיקות-החשיפה והתקלות של הסורק (self.add / Issue / Finding)
    const seenChk = new Set()
    for (const c of mod.checks || []) {
      const base = c.kind === 'check' ? `${c.group || 'audit'}[${c.id ?? c.name}]` : `${c.group || 'scan'}:issue[${c.name}]`
      if (seenChk.has(base)) continue
      seenChk.add(base)
      const groupHe = { legal: 'משפטי', a11y: 'נגישות', email: 'דוא"ל', security: 'אבטחה', seo: 'קידום בגוגל', perf: 'ביצועים', trust: 'אמינות', policies_deep: 'מדיניות לעומק', catalog: 'קטלוג', links: 'קישורים', email_deep: 'דוא"ל לעומק', images_weight: 'משקל תמונות', meta: 'מטא' }[c.group] || c.group || ''
      parts.push({
        id: `${src}:${mod.path}#${base}`, source: src, path: mod.path, symbol: base, lang: 'py', what: 'rule',
        name: clip9(c.kind === 'check' ? `לבדוק באתר: ${c.name}` : `לזהות באתר: ${c.name}`),
        does: c.kind === 'check'
          ? `בדיקת חשיפה${groupHe ? ' בתחום ' + groupHe : ''}: "${c.name}"${c.sev ? ' (חומרה: ' + c.sev + ')' : ''}.`
          : `תקלה שהסורק מסמן: "${c.name}"${c.sev ? ' (חומרה: ' + c.sev + ')' : ''}.`,
        takes: [{ name: 'page', kind: 'record:page', type: null }], gives: { kind: c.kind === 'check' ? 'bool' : 'choice', type: null }, pure: true, example: null,
        tags: [c.kind === 'check' ? 'exposure-check' : 'scan-issue', ...(c.group ? ['group:' + c.group] : []), ...(c.sev ? ['severity:' + c.sev] : [])].sort(),
      })
    }
    // ---- זרעי-השאלה של גלאי "מאימתי" (השאלות ש-detect מרים)
    if (src === 'yeshiva' && mod.path === 'yeshiva/gate.py') {
      for (const k of mod.seeds || []) {
        parts.push({
          id: `${src}:${mod.path}#detect[${k}]`, source: src, path: mod.path, symbol: `detect[${k}]`, lang: 'py', what: 'rule',
          name: clip9(`להרים את השאלה "${k}" לפני שמתחילים`),
          does: `גלאי "מאימתי": כשצורת הבקשה מעידה על כך, השער עוצר ושואל "${k}" לפני שנוגעים במשימה.`,
          takes: [{ name: 'prompt', kind: 'text', type: 'str' }], gives: { kind: 'choice', type: 'Seed | None' }, pure: true, example: null,
          tags: ['gate-seed', 'detector:' + k].sort(),
        })
      }
    }
  }
  // מזהים ייחודיים (אותו שם פעמיים באותו קובץ — לדוגמה מתודה שהוגדרה פעמיים)
  const seen = new Map()
  for (const p of parts) {
    const n = seen.get(p.id) || 0
    seen.set(p.id, n + 1)
    if (n) p.id = `${p.id}~${n + 1}`
  }
  parts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return { parts, stats, unknownWords: [...unknownWords].sort() }
}

// ================================================================ ריצה
const FILE = { yeshiva: 'yeshiva.json', 'qa-scanner': 'qa-scanner.json', 'yoman-habina': 'yoman-habina.json', '14kk': '14kk.json', mmmm: 'mmmm.json' }

function main() {
  mkdirSync(OUT, { recursive: true })
  let drift = 0
  const summary = []
  const rawDump = []
  for (const cfg of REPOS) {
    const scan = scanRepo(cfg)
    if (scan.missing) {
      console.warn(`⚠ ${cfg.repo}: לא נמצא תחת ${ROOT} — הקובץ הקיים נשמר`)
      summary.push({ source: cfg.source, missing: true })
      continue
    }
    if (RAW) rawDump.push({ source: cfg.source, ref: scan.ref, mods: scan.mods })
    const { parts, stats, unknownWords } = buildParts(scan)
    const doc = { source: cfg.source, repo: cfg.repo, ref: scan.ref, generatedAt: null, parts }
    const text = JSON.stringify(doc, null, 2) + '\n'
    const file = join(OUT, FILE[cfg.source])
    const old = existsSync(file) ? readFileSync(file, 'utf8') : null
    if (old !== text) {
      drift++
      if (!CHECK) writeFileSync(file, text)
    }
    const by = (k) => parts.reduce((m, p) => ((m[p[k]] = (m[p[k]] || 0) + 1), m), {})
    summary.push({ source: cfg.source, ref: scan.ref, files: scan.mods.length, parts: parts.length, what: by('what'), lang: by('lang'), pure: parts.filter((p) => p.pure).length, stats, unknownWords: unknownWords.length, unknownSample: unknownWords.slice(0, 30) })
  }
  if (RAW) writeFileSync(RAW, JSON.stringify(rawDump))
  console.log(JSON.stringify(summary, null, 1))
  if (CHECK && drift) {
    console.error(`✖ ${drift} קבצי-מקור אינם מעודכנים — הריצו: node catalog/scripts/others-census.mjs`)
    process.exit(1)
  }
}

main()
