// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/logic-proof.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const envOf = (ex) => (ex && ex[2] && typeof ex[2] === 'object') ? ex[2] : {};
const dartLambdaType = (ret) => { const t = String(ret || 'dynamic').replace(/\?$/, ''); return /^(bool|String|int|double|num)$/.test(t) ? t : /^List/.test(t) ? 'List<dynamic>' : /^Map/.test(t) ? 'Map<dynamic, dynamic>' : 'dynamic'; };
const SIG_RE = /^([A-Za-z_][A-Za-z0-9_<>?,. ]*?)\s+([a-z][A-Za-z0-9_]*)\(([\s\S]*?)\)\s*(?:\{|=>|async)/m;
export function inner$treeDart$walk$xs(v, idx) {
    const xs = Array.from({ length: v.m }, (_, j) => `x${idx}_${j}`);
    return xs;
}
export function inner$proveFile$decl$e(examples, args) {
    const e = envOf(examples[+args.split('\u0000')[1]]);
    return e;
}
export function inner$proveFile$humansOf(pure, env) {
    const humansOf = new Map(pure.map((c) => [c, c.tree ? (env.human || []).filter((h) => JSON.stringify(c.tree).includes(`"name":"${h.name}"`)).map((h) => h.name) : []]));
    return humansOf;
}
export function inner$proveFile$call$args(argsJ) {
    const args = argsJ.split('\u0000')[0];
    return args;
}
export function inner$proveFile$resFile(file) {
    const resFile = file + '.res';
    return resFile;
}
export function inner$proveFile$nCells(pure, nEx) {
    const nCells = pure.length * nEx;
    return nCells;
}
export function inner$proveFile$header(id, pure, imps, file, nEx) {
    const resFile = file + '.res';
    const header = [`// מוכיח: ${id} — ${pure.length}×${nEx}`, `import 'dart:io';`, `import 'dart:convert';`, ...(imps ? imps.split('\n') : []), `final _raf = File(r'${resFile}').openSync(mode: FileMode.write);`, `void emit(String s){ _raf.writeStringSync(s + '\\n'); _raf.flushSync(); }`, `void main() {`];
    return header;
}
export function inner$proveFile$header$$step(id, pure, imps, resFile, nEx) {
    const header = [`// מוכיח: ${id} — ${pure.length}×${nEx}`, `import 'dart:io';`, `import 'dart:convert';`, ...(imps ? imps.split('\n') : []), `final _raf = File(r'${resFile}').openSync(mode: FileMode.write);`, `void emit(String s){ _raf.writeStringSync(s + '\\n'); _raf.flushSync(); }`, `void main() {`];
    return header;
}
export function inner$proveFile$first(id, pure, imps, file, nEx) {
    const resFile = file + '.res';
    const header = [`// מוכיח: ${id} — ${pure.length}×${nEx}`, `import 'dart:io';`, `import 'dart:convert';`, ...(imps ? imps.split('\n') : []), `final _raf = File(r'${resFile}').openSync(mode: FileMode.write);`, `void emit(String s){ _raf.writeStringSync(s + '\\n'); _raf.flushSync(); }`, `void main() {`];
    const first = header.length + 1;
    return first;
}
export function inner$proveFile$first$$step(header) {
    const first = header.length + 1;
    return first;
}
export function inner$proveFile$map$map$cid(i, j) {
    const cid = i + ':' + j;
    return cid;
}
export function inner$proveFile$m(l) {
    const m = l.match(/^(\d+:\d+):([012])(?::(.*))?$/);
    return m;
}
export function inner$proveFile$timedOut(r) {
    const timedOut = !!(r.error || r.signal) || r.status === null;
    return timedOut;
}
export function inner$proveFile$progressed(known, before) {
    let progressed = known.size > before;
    return progressed;
}
export function inner$proveFile$i(cid) {
    const i = +cid.split(':')[0];
    return i;
}
export function inner$dartLambdaType$t(ret) {
    const t = String(ret || 'dynamic').replace(/\?$/, '');
    return t;
}
export function inner$buildInterp$keep(rows) {
    const keep = rows.filter((x) => !x.x);
    return keep;
}
export function inner$buildInterpOnce$files(rows) {
    const files = [...new Set(rows.map((r) => r.file))];
    return files;
}
export function inner$buildInterpOnce$pre(rows) {
    const files = [...new Set(rows.map((r) => r.file))];
    const pre = new Map(files.map((f, i) => [f, `a${i}`]));
    return pre;
}
export function inner$buildInterpOnce$pre$$step(files) {
    const pre = new Map(files.map((f, i) => [f, `a${i}`]));
    return pre;
}
export function inner$buildInterpOnce$table(rows) {
    const files = [...new Set(rows.map((r) => r.file))];
    const pre = new Map(files.map((f, i) => [f, `a${i}`]));
    const table = rows.map((r) => `  '${r.id}': ${pre.get(r.file)}.${r.id},`);
    return table;
}
export function inner$buildInterpOnce$table$$step(rows, pre) {
    const table = rows.map((r) => `  '${r.id}': ${pre.get(r.file)}.${r.id},`);
    return table;
}
export function inner$buildInterpOnce$rets(rows) {
    const rets = rows.map((r) => `  '${r.id}': '${dartLambdaType(r.ret)}',`);
    return rets;
}
export function inner$buildInterpOnce$pts(rows) {
    const pts = rows.map((r) => `  '${r.id}': <String>[${(r.params || []).map((t) => { const m = String(t || '').match(/^(.+?)\s+Function\(/); return `'${m ? dartLambdaType(m[1].trim()) : ''}'`; }).join(', ')}],`);
    return pts;
}
export function inner$buildInterpOnce$map$map$m(t) {
    const m = String(t || '').match(/^(.+?)\s+Function\(/);
    return m;
}
export function inner$buildInterpOnce$EX(examples) {
    const EX = examples.map((ex) => `  <dynamic>[${ex[0]}],`).join('\n');
    return EX;
}
export function inner$buildInterpOnce$CK(examples) {
    const CK = examples.map((ex) => `  (dynamic r) => (${ex[1]}),`).join('\n');
    return CK;
}
export function inner$buildInterpOnce$WORLD(env) {
    const WORLD = env.world ? `${env.world.type} newWorld() => ${env.world.init};` : `dynamic newWorld() => null;`;
    return WORLD;
}
export function inner$buildInterpOnce$src$$step(needId, rows, examples, imps, table, rets, pts, EX, CK, NOW, HUM, WORLD) {
    const src = `// רתמה-מפורשת: ${needId} — ${rows.length} אטומים · ${examples.length} דוגמאות (up-interp · לקמפל פעם אחת)
  import 'dart:io';
  import 'dart:convert';
  ${imps.join('\n')}
  
  final Map<String, Function> T = <String, Function>{
  ${table.join('\n')}
  };
  final Map<String, String> RET = <String, String>{
  ${rets.join('\n')}
  };
  final Map<String, List<String>> PT = <String, List<String>>{
  ${pts.join('\n')}
  };
  final List<List<dynamic>> EX = <List<dynamic>>[
  ${EX}
  ];
  final List<bool Function(dynamic)> CK = <bool Function(dynamic)>[
  ${CK}
  ];
  final List<dynamic> NOW = <dynamic>[
  ${NOW}
  ];
  final List<Map<String, dynamic>> HUM = <Map<String, dynamic>>[
  ${HUM}
  ];
  ${WORLD}
  class Missing implements Exception {}
  String _v(dynamic r) { try { return jsonEncode(jsonEncode(r)); } catch (_) { return jsonEncode(r.toString()); } }   // ערך כ-JSON כשאפשר (שקילות חוצה-שפה), אחרת toString
  
  Function lam(Function g, int m, List<dynamic> rest, String ret) {
    // תקע-למבדה מוקלד לפי טיפוס-ההחזרה של החלקיק (Dart בודק טיפוסי-פונקציה בזמן-ריצה)
    switch (ret) {
      case 'bool': return m == 1 ? (dynamic x) => Function.apply(g, [x, ...rest]) as bool : m == 2 ? (dynamic x, dynamic y) => Function.apply(g, [x, y, ...rest]) as bool : (dynamic x, dynamic y, dynamic z) => Function.apply(g, [x, y, z, ...rest]) as bool;
      case 'String': return m == 1 ? (dynamic x) => Function.apply(g, [x, ...rest]) as String : m == 2 ? (dynamic x, dynamic y) => Function.apply(g, [x, y, ...rest]) as String : (dynamic x, dynamic y, dynamic z) => Function.apply(g, [x, y, z, ...rest]) as String;
      case 'int': return m == 1 ? (dynamic x) => Function.apply(g, [x, ...rest]) as int : m == 2 ? (dynamic x, dynamic y) => Function.apply(g, [x, y, ...rest]) as int : (dynamic x, dynamic y, dynamic z) => Function.apply(g, [x, y, z, ...rest]) as int;
      case 'double': return m == 1 ? (dynamic x) => Function.apply(g, [x, ...rest]) as double : m == 2 ? (dynamic x, dynamic y) => Function.apply(g, [x, y, ...rest]) as double : (dynamic x, dynamic y, dynamic z) => Function.apply(g, [x, y, z, ...rest]) as double;
      case 'num': return m == 1 ? (dynamic x) => Function.apply(g, [x, ...rest]) as num : m == 2 ? (dynamic x, dynamic y) => Function.apply(g, [x, y, ...rest]) as num : (dynamic x, dynamic y, dynamic z) => Function.apply(g, [x, y, z, ...rest]) as num;
      case 'List<dynamic>': return m == 1 ? (dynamic x) => Function.apply(g, [x, ...rest]) as List<dynamic> : m == 2 ? (dynamic x, dynamic y) => Function.apply(g, [x, y, ...rest]) as List<dynamic> : (dynamic x, dynamic y, dynamic z) => Function.apply(g, [x, y, z, ...rest]) as List<dynamic>;
      default: return m == 1 ? (dynamic x) => Function.apply(g, [x, ...rest]) : m == 2 ? (dynamic x, dynamic y) => Function.apply(g, [x, y, ...rest]) : (dynamic x, dynamic y, dynamic z) => Function.apply(g, [x, y, z, ...rest]);
    }
  }
  
  dynamic ev(Map<String, dynamic> n, List<dynamic> p, int j, dynamic w, [String? want]) {
    switch (n['k']) {
      case 'p': return p[n['i'] as int];
      case 'c': return n['cv'];
      case 't': return NOW[j];
      case 'h': { final h = HUM[j]; if (!h.containsKey(n['name'])) throw Missing(); return h[n['name']]; }
      case 'w': return w;
      case 'g': { final ok = ev(n['pred'] as Map<String, dynamic>, p, j, w); if (ok == true) ev(n['body'] as Map<String, dynamic>, p, j, w); return w; }
      case 'f': { final g = T[n['id']]!; final rest = [for (final a in (n['args'] as List)) ev(a as Map<String, dynamic>, p, j, w)]; return lam(g, n['m'] as int, rest, (want != null && want.isNotEmpty) ? want : (RET[n['id']] ?? 'dynamic')); }
      default: { final g = T[n['id']]!; final pts = PT[n['id']]; final al = n['args'] as List; final args = [for (var i = 0; i < al.length; i++) ev(al[i] as Map<String, dynamic>, p, j, w, (pts != null && i < pts.length) ? pts[i] : null)]; return Function.apply(g, args); }
    }
  }
  
  // up-examples · חיישן-דוגמאות-חלשות: מוטציות של הדוגמה הראשונה (null/''/0/false/'x' · מחרוזת+x · רשימה בלי ראשון · מפה בלי מפתח) ⇒ קלטים-מבחינים בין עצים שעברו את כל הדוגמאות
  List<dynamic> _mut(dynamic v) {
    if (v == null) return <dynamic>['', 0, false, 'x'];
    if (v is bool) return <dynamic>[!v, null];
    if (v is num) return <dynamic>[0, 1, -1, v + 1, v * 2, null];
    if (v is String) return <dynamic>['', 'a', v + 'x', ' ' + v, null];
    if (v is List) { final out = <dynamic>[<dynamic>[]]; if (v.isNotEmpty) { out.add(v.sublist(1)); for (final m in _mut(v[0])) out.add(<dynamic>[m, ...v.sublist(1)]); } return out; }
    if (v is Map) { final out = <dynamic>[]; try { out.add(<String, dynamic>{}); for (final k in v.keys) { for (final m in <dynamic>[null, '', 0, false, 'x']) { final c = Map<String, dynamic>.from(v); c[k] = m; out.add(c); } final d = Map<String, dynamic>.from(v); d.remove(k); out.add(d); } } catch (_) {} return out; }
    return <dynamic>[];
  }
  List<List<dynamic>> _probes() {
    final out = <List<dynamic>>[]; if (EX.isEmpty) return out; final base = EX[0];
    for (var i = 0; i < base.length; i++) for (final m in _mut(base[i])) { final c = List<dynamic>.from(base); c[i] = m; out.add(c); if (out.length >= 80) return out; }
    return out;
  }
  void main(List<String> argv) {
    final trees = (jsonDecode(File(argv[0]).readAsStringSync()) as List);
    final out = StringBuffer();
    if (argv.length > 1 && argv[1] == '--probe') {
      final ps = _probes();
      for (var p = 0; p < ps.length; p++) out.write('P:\$p:\${_v(ps[p])}\\n');
      for (var i = 0; i < trees.length; i++) {
        final t = trees[i] as Map<String, dynamic>; final isVoid = t['void'] == true; final root = t['tree'] as Map<String, dynamic>;
        for (var p = 0; p < ps.length; p++) {
          try { final w = newWorld(); dynamic r = ev(root, ps[p], 0, w); if (isVoid) r = w; out.write('\$i:\$p:1:\${_v(r)}\\n'); }
          catch (_) { out.write('\$i:\$p:2:\\n'); }
        }
      }
      stdout.write(out.toString()); return;
    }
    for (var i = 0; i < trees.length; i++) {
      final t = trees[i] as Map<String, dynamic>; final isVoid = t['void'] == true; final root = t['tree'] as Map<String, dynamic>;
      for (var j = 0; j < EX.length; j++) {
        try {
          final w = newWorld();
          dynamic r = ev(root, EX[j], j, w); if (isVoid) r = w;
          final ok = CK[j](r);
          out.write('\$i:\$j:\${ok ? 1 : 0}:\${_v(r)}\\n');
        } on Missing catch (_) { out.write('\$i:\$j:2:\\n'); }
        catch (_) { out.write('\$i:\$j:2:\\n'); }
      }
    }
    stdout.write(out.toString());
  }
  `;
    return src;
}
export function inner$buildInterpOnce$dill(file) {
    const dill = file.replace(/\.dart$/, '.dill');
    return dill;
}
export function inner$evalInterp$treesFile(interp, opts) {
    const treesFile = interp.dill.replace(/\.dill$/, (opts.probe ? '.probe' : '') + '.trees.json');
    return treesFile;
}
export function inner$evalInterp$lines(r) {
    const lines = (r.stdout || '').split('\n');
    return lines;
}
export function inner$evalInterp$m(l) {
    const m = l.match(/^P:(\d+):(.*)$/);
    return m;
}
export function inner$evalInterp$m_L248(l) {
    const m = l.match(/^(\d+):(\d+):([012]):(.*)$/);
    return m;
}
export function inner$evalInterp$m_L252(l) {
    const m = l.match(/^(\d+):(\d+):([012]):(.*)$/);
    return m;
}
export function inner$jsTwinRows$cacheKey(hideDart, sig) {
    const cacheKey = hideDart.join(',') + '|' + (sig ? JSON.stringify(sig) : '');
    return cacheKey;
}
export function inner$jsTwinRows$m(src) {
    const m = src.match(/export\s+function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
    return m;
}
export function inner$jsTwinRows$pnames(src) {
    const m = src.match(/export\s+function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
    const pnames = m[2].split(',').map((x) => x.trim().split('=')[0].trim()).filter(Boolean);
    return pnames;
}
export function inner$jsTwinRows$pnames$$step(m) {
    const pnames = m[2].split(',').map((x) => x.trim().split('=')[0].trim()).filter(Boolean);
    return pnames;
}
export function inner$jsTwinRows$ev(EV, f) {
    const ev = EV[f.replace(/\.mjs$/, '')];
    return ev;
}
export function inner$jsTwinRows$dsig(dart) {
    const dsig = dart.match(SIG_RE);
    return dsig;
}
export function inner$jsTwinRows$params(dart) {
    const dsig = dart.match(SIG_RE);
    const params = dsig[3].trim() ? dsig[3].split(',').map((p) => p.trim().replace(/\s+[A-Za-z_]\w*$/, '').replace(/\?$/, '')) : [];
    return params;
}
export function inner$jsTwinRows$params$$step(dsig) {
    const params = dsig[3].trim() ? dsig[3].split(',').map((p) => p.trim().replace(/\s+[A-Za-z_]\w*$/, '').replace(/\?$/, '')) : [];
    return params;
}
export function inner$jsTwinRows$body(JS_HELPERS, dart) {
    const body = dart + '\n' + JS_HELPERS.split('\n').filter((l) => !/^import /.test(l) && !new RegExp('\\b' + (l.match(/^\w+\s+(_\w+)\(/) || [])[1] + '\\(').test(dart)).join('\n');
    return body;
}
export function inner$evalInterp$probes$$after_loop(r) {
    const lines = (r.stdout || '').split('\n');
    const probes = [];
    for (const l of lines) {
        const m = l.match(/^P:(\d+):(.*)$/);
        if (m) {
            try {
                probes[+m[1]] = JSON.parse(m[2]);
            }
            catch {
                probes[+m[1]] = m[2];
            }
        }
    }
    return probes;
}

export const SIGS = {
  inner$treeDart$walk$xs: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$proveFile$decl$e: [{"name":"examples","d":{"t":"any"},"opt":false},{"name":"args","d":{"t":"any"},"opt":false}],
  inner$proveFile$humansOf: [{"name":"pure","d":{"t":"any"},"opt":false},{"name":"env","d":{"t":"obj","p":[]},"opt":false}],
  inner$proveFile$call$args: [{"name":"argsJ","d":{"t":"any"},"opt":false}],
  inner$proveFile$resFile: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$proveFile$nCells: [{"name":"pure","d":{"t":"any"},"opt":false},{"name":"nEx","d":{"t":"num"},"opt":false}],
  inner$proveFile$header: [{"name":"id","d":{"t":"any"},"opt":false},{"name":"pure","d":{"t":"any"},"opt":false},{"name":"imps","d":{"t":"str"},"opt":false},{"name":"file","d":{"t":"any"},"opt":false},{"name":"nEx","d":{"t":"any"},"opt":false}],
  inner$proveFile$header$$step: [{"name":"id","d":{"t":"any"},"opt":false},{"name":"pure","d":{"t":"any"},"opt":false},{"name":"imps","d":{"t":"str"},"opt":false},{"name":"resFile","d":{"t":"str"},"opt":false},{"name":"nEx","d":{"t":"any"},"opt":false}],
  inner$proveFile$first: [{"name":"id","d":{"t":"any"},"opt":false},{"name":"pure","d":{"t":"any"},"opt":false},{"name":"imps","d":{"t":"str"},"opt":false},{"name":"file","d":{"t":"any"},"opt":false},{"name":"nEx","d":{"t":"any"},"opt":false}],
  inner$proveFile$first$$step: [{"name":"header","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$proveFile$map$map$cid: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$proveFile$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$proveFile$timedOut: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$proveFile$progressed: [{"name":"known","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"before","d":{"t":"num"},"opt":false}],
  inner$proveFile$i: [{"name":"cid","d":{"t":"any"},"opt":false}],
  inner$dartLambdaType$t: [{"name":"ret","d":{"t":"any"},"opt":false}],
  inner$buildInterp$keep: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildInterpOnce$files: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$pre: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$pre$$step: [{"name":"files","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildInterpOnce$table: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$table$$step: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"pre","d":{"t":"map","k":{"t":"any"},"v":{"t":"str"}},"opt":false}],
  inner$buildInterpOnce$rets: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$pts: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$map$map$m: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$EX: [{"name":"examples","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$CK: [{"name":"examples","d":{"t":"any"},"opt":false}],
  inner$buildInterpOnce$WORLD: [{"name":"env","d":{"t":"obj","p":[]},"opt":false}],
  inner$buildInterpOnce$src$$step: [{"name":"needId","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"any"},"opt":false},{"name":"examples","d":{"t":"any"},"opt":false},{"name":"imps","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"table","d":{"t":"any"},"opt":false},{"name":"rets","d":{"t":"any"},"opt":false},{"name":"pts","d":{"t":"any"},"opt":false},{"name":"EX","d":{"t":"any"},"opt":false},{"name":"CK","d":{"t":"any"},"opt":false},{"name":"NOW","d":{"t":"any"},"opt":false},{"name":"HUM","d":{"t":"any"},"opt":false},{"name":"WORLD","d":{"t":"str"},"opt":false}],
  inner$buildInterpOnce$dill: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$evalInterp$treesFile: [{"name":"interp","d":{"t":"any"},"opt":false},{"name":"opts","d":{"t":"obj","p":[]},"opt":false}],
  inner$evalInterp$lines: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$evalInterp$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$evalInterp$m_L248: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$evalInterp$m_L252: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$jsTwinRows$cacheKey: [{"name":"hideDart","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sig","d":{"t":"null"},"opt":false}],
  inner$jsTwinRows$m: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$jsTwinRows$pnames: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$jsTwinRows$pnames$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$jsTwinRows$ev: [{"name":"EV","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$jsTwinRows$dsig: [{"name":"dart","d":{"t":"any"},"opt":false}],
  inner$jsTwinRows$params: [{"name":"dart","d":{"t":"any"},"opt":false}],
  inner$jsTwinRows$params$$step: [{"name":"dsig","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$jsTwinRows$body: [{"name":"JS_HELPERS","d":{"t":"any"},"opt":false},{"name":"dart","d":{"t":"any"},"opt":false}],
  inner$evalInterp$probes$$after_loop: [{"name":"r","d":{"t":"any"},"opt":false}],
};
