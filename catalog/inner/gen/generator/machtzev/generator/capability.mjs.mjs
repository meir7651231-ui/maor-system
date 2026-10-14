// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/capability.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const escRe = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const definalize = (s) => String(s).replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ');
const hw = (s) => [...String(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]);
export function inner$fileOf$a(ATOM_INDEX, cls) {
    const a = ATOM_INDEX.find((e) => e.cls === cls);
    return a;
}
export function inner$relOpOf$t(words) {
    const t = definalize([].concat(words).join(' '));
    return t;
}
export function inner$deprefix$s(w) {
    const s = String(w);
    return s;
}
export function inner$detectAlertClause$t(text) {
    const t = String(text || '');
    return t;
}
export function inner$detectAlertClause$wm(WHEN, text) {
    const t = String(text || '');
    const wm = t.match(WHEN);
    return wm;
}
export function inner$detectAlertClause$wm$$step(WHEN, t) {
    const wm = t.match(WHEN);
    return wm;
}
export function inner$detectAlertClause$before(WHEN, text) {
    const t = String(text || '');
    const wm = t.match(WHEN);
    const before = t.slice(0, wm.index);
    return before;
}
export function inner$detectAlertClause$before$$step(t, wm) {
    const before = t.slice(0, wm.index);
    return before;
}
export function inner$detectAlertClause$after(WHEN, text) {
    const t = String(text || '');
    const wm = t.match(WHEN);
    let after = t.slice(wm.index + wm[0].length);
    return after;
}
export function inner$detectAlertClause$after$$step(t, wm) {
    let after = t.slice(wm.index + wm[0].length);
    return after;
}
export function inner$detectAlertClause$WW(SL_T) {
    const WW = (SL_T.windowWords || []).map(escRe).join('|');
    return WW;
}
export function inner$detectAlertClause$wm_L61(SL_T, after) {
    const WW = (SL_T.windowWords || []).map(escRe).join('|');
    const wm = after.match(new RegExp('\\s*[֐-׿]?-?(\\d+(?:\\.\\d+)?)\\s+(\\S+)\\s+(?:' + WW + ')'));
    return wm;
}
export function inner$detectAlertClause$wm_L61$$step(after, WW) {
    const wm = after.match(new RegExp('\\s*[֐-׿]?-?(\\d+(?:\\.\\d+)?)\\s+(\\S+)\\s+(?:' + WW + ')'));
    return wm;
}
export function inner$detectAlertClause$HW(SL_T) {
    const HW = (SL_T.horizonWords || []).map(escRe).join('|');
    return HW;
}
export function inner$detectAlertClause$hm(SL_T, after) {
    const HW = (SL_T.horizonWords || []).map(escRe).join('|');
    const hm = after.match(new RegExp('\\s*(?:' + HW + ')\\s+(\\d+(?:\\.\\d+)?)\\s+(\\S+)'));
    return hm;
}
export function inner$detectAlertClause$hm$$step(after, HW) {
    const hm = after.match(new RegExp('\\s*(?:' + HW + ')\\s+(\\d+(?:\\.\\d+)?)\\s+(\\S+)'));
    return hm;
}
export function inner$detectAlertClause$afterN(after) {
    const afterN = definalize(after);
    return afterN;
}
export function inner$detectAlertClause$m(after, r) {
    const afterN = definalize(after);
    const m = afterN.match(r.re);
    return m;
}
export function inner$detectAlertClause$m$$step(afterN, r) {
    const m = afterN.match(r.re);
    return m;
}
export function inner$detectAlertClause$g(r) {
    const g = new RegExp(r.re.source, (r.re.flags || '').includes('g') ? r.re.flags : r.re.flags + 'g');
    return g;
}
export function inner$detectAlertClause$xPart(after, relM) {
    const xPart = after.slice(0, relM.index);
    return xPart;
}
export function inner$detectAlertClause$yPart(after, relM) {
    const yPart = after.slice(relM.index + relM[0].length);
    return yPart;
}
export function inner$detectAlertClause$xWords(after, relM) {
    const xPart = after.slice(0, relM.index);
    const xWords = [...String(xPart).matchAll(/[֐-׿][֐-׿״׳]*|[A-Za-z][A-Za-z0-9_]*|\d{1,2}:\d{2}/g)].map((m) => m[0]);
    return xWords;
}
export function inner$detectAlertClause$xWords$$step(xPart) {
    const xWords = [...String(xPart).matchAll(/[֐-׿][֐-׿״׳]*|[A-Za-z][A-Za-z0-9_]*|\d{1,2}:\d{2}/g)].map((m) => m[0]);
    return xWords;
}
export function inner$detectAlertClause$yWords(after, relM) {
    const yPart = after.slice(relM.index + relM[0].length);
    const yWords = hw(yPart);
    return yWords;
}
export function inner$detectAlertClause$yWords$$step(yPart) {
    const yWords = hw(yPart);
    return yWords;
}
export function inner$detectAlertClause$yNum(after, relM) {
    const yPart = after.slice(relM.index + relM[0].length);
    const yNum = (yPart.match(/\d+(?:\.\d+)?/) || [null])[0];
    return yNum;
}
export function inner$detectAlertClause$yNum$$step(yPart) {
    const yNum = (yPart.match(/\d+(?:\.\d+)?/) || [null])[0];
    return yNum;
}
export function inner$detectAlertClause$fn$m(yPart) {
    const m = yPart.match(/\d+(?:\.\d+)?\s*([֐-׿]+)/);
    return m;
}
export function inner$detectAlertClause$fn$m_L84(yPart) {
    const m = yPart.match(/\d+(?:\.\d+)?\s*([֐-׿'׳]+)/);
    return m;
}
export function inner$detectAlertClause$fn$m_L85(yPart) {
    const m = yPart.match(/\d+(?:\.\d+)?\s*([֐-׿]+)/);
    return m;
}
export function inner$clausesByForm$unitOnly(SL_T, ws, i) {
    const TU = { ...(SL_T.timeUnits || {}) };
    for (const w of SL_T.timeUnitsAsk || [])
        TU[w] = 'ask';
    const unitOnly = TU[ws[i]] && !/^\d+$/.test(ws[i - 1] || '');
    return unitOnly;
}
export function inner$clausesByForm$unitOnly$$step(ws, TU, i) {
    const unitOnly = TU[ws[i]] && !/^\d+$/.test(ws[i - 1] || '');
    return unitOnly;
}
export function inner$clausesByForm$j(i) {
    let j = i - 1;
    return j;
}
export function inner$clausesByForm$x(frame, ws, j) {
    const F = new Set(frame);
    const x = ws.slice(0, j).filter((w) => !F.has(w) && !/^\d+$/.test(w));
    return x;
}
export function inner$clausesByForm$x$$step(ws, F, j) {
    const x = ws.slice(0, j).filter((w) => !F.has(w) && !/^\d+$/.test(w));
    return x;
}
export function inner$clausesByForm$n(SL_T, ws, i) {
    const TU = { ...(SL_T.timeUnits || {}) };
    for (const w of SL_T.timeUnitsAsk || [])
        TU[w] = 'ask';
    const unitOnly = TU[ws[i]] && !/^\d+$/.test(ws[i - 1] || '');
    const n = unitOnly ? 1 : ws[i];
    return n;
}
export function inner$clausesByForm$n$$step(ws, i, unitOnly) {
    const n = unitOnly ? 1 : ws[i];
    return n;
}
export function inner$clausesByForm$unit(SL_T, ws, i) {
    const TU = { ...(SL_T.timeUnits || {}) };
    for (const w of SL_T.timeUnitsAsk || [])
        TU[w] = 'ask';
    const unitOnly = TU[ws[i]] && !/^\d+$/.test(ws[i - 1] || '');
    const unit = unitOnly ? TU[ws[i]] : (TU[ws[i + 1]] || null);
    return unit;
}
export function inner$clausesByForm$unit$$step(ws, TU, i, unitOnly) {
    const unit = unitOnly ? TU[ws[i]] : (TU[ws[i + 1]] || null);
    return unit;
}
export function inner$clausesByForm$after(SL_T, ws, i) {
    const TU = { ...(SL_T.timeUnits || {}) };
    for (const w of SL_T.timeUnitsAsk || [])
        TU[w] = 'ask';
    const unitOnly = TU[ws[i]] && !/^\d+$/.test(ws[i - 1] || '');
    const unit = unitOnly ? TU[ws[i]] : (TU[ws[i + 1]] || null);
    const after = unitOnly ? i + 1 : (unit ? i + 2 : i + 1);
    return after;
}
export function inner$clausesByForm$after$$step(i, unitOnly, unit) {
    const after = unitOnly ? i + 1 : (unit ? i + 2 : i + 1);
    return after;
}
export function inner$detectLevelsClause$hm(COND, head) {
    const hm = String(head || '').trim().match(new RegExp(COND.levels.head));
    return hm;
}
export function inner$detectLevelsClause$tm(COND, tail) {
    const tm = String(tail || '').trim().match(new RegExp(COND.levels.tail));
    return tm;
}
export function inner$detectLevelsClause$thresholds(COND, tail) {
    const tm = String(tail || '').trim().match(new RegExp(COND.levels.tail));
    const thresholds = [...new Set(tm[1].split(',').map((v) => +v.trim()).filter((v) => !isNaN(v)))].sort((a, b) => b - a);
    return thresholds;
}
export function inner$detectLevelsClause$thresholds$$step(tm) {
    const thresholds = [...new Set(tm[1].split(',').map((v) => +v.trim()).filter((v) => !isNaN(v)))].sort((a, b) => b - a);
    return thresholds;
}
export function inner$detectAllClauses$pieces(CONN_RE, seg) {
    const pieces = seg.split(CONN_RE);
    return pieces;
}
export function inner$detectAllClauses$conn(CONN_RE, seg, i) {
    const pieces = seg.split(CONN_RE);
    const conn = i > 0 ? pieces[i - 1] : null;
    return conn;
}
export function inner$detectAllClauses$conn$$step(pieces, i) {
    const conn = i > 0 ? pieces[i - 1] : null;
    return conn;
}
export function inner$detectAllClauses$m(WHEN, part) {
    const m = part.match(WHEN);
    return m;
}
export function inner$emitAppFrom$m(OBJ_RE, text) {
    const m = String(text || '').match(OBJ_RE);
    return m;
}
export function inner$emitAppFrom$trig(units) {
    const trig = units.find((u) => u.alert)?.trigger || '';
    return trig;
}
export function inner$emitAppFrom$alertAtom(picked) {
    const alertAtom = new Set(['AlertBanner']).has(picked) ? picked : 'AlertBanner';
    return alertAtom;
}
export function inner$emitAppFrom$gFills(gauge) {
    const gFills = gauge.fills.length ? ', ' + gauge.fills.join(', ') : '';
    return gFills;
}
export function inner$emitAppFrom$rFills(readout) {
    const rFills = readout.fills.length ? ', ' + readout.fills.join(', ') : '';
    return rFills;
}
export function inner$emitAppFrom$hasAlert(units) {
    const hasAlert = units.some((u) => u.alert);
    return hasAlert;
}
export function inner$emitAppFrom$impPaths(gauge, readout) {
    const impPaths = [`../${gauge.file.replace(/\.dart$/, '')}.dart`, `../${readout.file.replace(/\.dart$/, '')}.dart`];
    return impPaths;
}
export function inner$emitAppFrom$imps(impPaths) {
    const imps = [...new Set(impPaths)].map((p) => `import '${p}';`).join('\n');
    return imps;
}
export function inner$emitAppFrom$stateVars(units) {
    const stateVars = units.map((u) => `  double _v${u.i} = ${u.thr != null ? u.thr : 55};`).join('\n');
    return stateVars;
}
export function inner$emitAppFrom$body(units, gauge, readout, picked) {
    const alertAtom = new Set(['AlertBanner']).has(picked) ? picked : 'AlertBanner';
    const gFills = gauge.fills.length ? ', ' + gauge.fills.join(', ') : '';
    const rFills = readout.fills.length ? ', ' + readout.fills.join(', ') : '';
    const body = units.map((u) => {
        const thr = u.thr != null ? u.thr : 60, smax = Math.max(100, thr * 2);
        const cmp = u.alert ? `_v${u.i} ${u.op} ${thr}` : 'false';
        const rLabel = u.alert ? `(${cmp}) ? 'חריגה · ${u.label}' : 'תקין · ${u.label}'` : `'${u.label}'`;
        const alertW = u.alert
            ? `\n        if (${cmp})\n          Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: ${alertAtom}(label: 'חריגה — ${u.label}', height: 46, radius: 14, accentColor: skin.err, baseColor: skin.raised, fillColor: skin.surface)),`
            : '';
        return `        Padding(padding: const EdgeInsets.only(top: 10, right: 14), child: Align(alignment: Alignment.centerRight, child: Text('${u.label}', style: TextStyle(color: skin.mut, fontSize: 13)))),
          Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Center(child: ${gauge.cls}(${gauge.p.value}: (_v${u.i} / ${smax}).clamp(0.0, 1.0)${gFills}))),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: ${readout.cls}(${readout.p.value}: _v${u.i}, ${readout.p.label}: ${rLabel}${rFills})),${alertW}
          Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: Slider(value: _v${u.i}, max: ${smax}, onChanged: (v) => setState(() => _v${u.i} = v))),
          Divider(color: skin.hair, height: 24),`;
    }).join('\n');
    return body;
}
export function inner$emitAppFrom$body$$step(units, gauge, readout, alertAtom, gFills, rFills) {
    const body = units.map((u) => {
        const thr = u.thr != null ? u.thr : 60, smax = Math.max(100, thr * 2);
        const cmp = u.alert ? `_v${u.i} ${u.op} ${thr}` : 'false';
        const rLabel = u.alert ? `(${cmp}) ? 'חריגה · ${u.label}' : 'תקין · ${u.label}'` : `'${u.label}'`;
        const alertW = u.alert
            ? `\n        if (${cmp})\n          Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: ${alertAtom}(label: 'חריגה — ${u.label}', height: 46, radius: 14, accentColor: skin.err, baseColor: skin.raised, fillColor: skin.surface)),`
            : '';
        return `        Padding(padding: const EdgeInsets.only(top: 10, right: 14), child: Align(alignment: Alignment.centerRight, child: Text('${u.label}', style: TextStyle(color: skin.mut, fontSize: 13)))),
          Padding(padding: const EdgeInsets.symmetric(vertical: 6), child: Center(child: ${gauge.cls}(${gauge.p.value}: (_v${u.i} / ${smax}).clamp(0.0, 1.0)${gFills}))),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: ${readout.cls}(${readout.p.value}: _v${u.i}, ${readout.p.label}: ${rLabel}${rFills})),${alertW}
          Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: Slider(value: _v${u.i}, max: ${smax}, onChanged: (v) => setState(() => _v${u.i} = v))),
          Divider(color: skin.hair, height: 24),`;
    }).join('\n');
    return body;
}
export function inner$emitAppFrom$map$thr(u) {
    const thr = u.thr != null ? u.thr : 60;
    return thr;
}
export function inner$emitAppFrom$map$smax(u) {
    const thr = u.thr != null ? u.thr : 60;
    const smax = Math.max(100, thr * 2);
    return smax;
}
export function inner$emitAppFrom$map$smax$$step(thr) {
    const smax = Math.max(100, thr * 2);
    return smax;
}
export function inner$emitAppFrom$map$cmp(u) {
    const thr = u.thr != null ? u.thr : 60;
    const cmp = u.alert ? `_v${u.i} ${u.op} ${thr}` : 'false';
    return cmp;
}
export function inner$emitAppFrom$map$cmp$$step(u, thr) {
    const cmp = u.alert ? `_v${u.i} ${u.op} ${thr}` : 'false';
    return cmp;
}
export function inner$emitAppFrom$map$rLabel(u) {
    const thr = u.thr != null ? u.thr : 60;
    const cmp = u.alert ? `_v${u.i} ${u.op} ${thr}` : 'false';
    const rLabel = u.alert ? `(${cmp}) ? 'חריגה · ${u.label}' : 'תקין · ${u.label}'` : `'${u.label}'`;
    return rLabel;
}
export function inner$emitAppFrom$map$rLabel$$step(u, cmp) {
    const rLabel = u.alert ? `(${cmp}) ? 'חריגה · ${u.label}' : 'תקין · ${u.label}'` : `'${u.label}'`;
    return rLabel;
}
export function inner$emitAppFrom$map$alertW(alertAtom, u) {
    const thr = u.thr != null ? u.thr : 60;
    const cmp = u.alert ? `_v${u.i} ${u.op} ${thr}` : 'false';
    const alertW = u.alert
        ? `\n        if (${cmp})\n          Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: ${alertAtom}(label: 'חריגה — ${u.label}', height: 46, radius: 14, accentColor: skin.err, baseColor: skin.raised, fillColor: skin.surface)),`
        : '';
    return alertW;
}
export function inner$emitAppFrom$map$alertW$$step(alertAtom, u, cmp) {
    const alertW = u.alert
        ? `\n        if (${cmp})\n          Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: ${alertAtom}(label: 'חריגה — ${u.label}', height: 46, radius: 14, accentColor: skin.err, baseColor: skin.raised, fillColor: skin.surface)),`
        : '';
    return alertW;
}
export function inner$emitAppFrom$heCount(clauses, units) {
    const heCount = units.length + (clauses.length ? ' ניטורים' : ' תצוגה');
    return heCount;
}
export function inner$clausesByForm$TU$$after_loop(SL_T) {
    const TU = { ...(SL_T.timeUnits || {}) };
    for (const w of SL_T.timeUnitsAsk || [])
        TU[w] = 'ask';
    return TU;
}

export const SIGS = {
  inner$fileOf$a: [{"name":"ATOM_INDEX","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$relOpOf$t: [{"name":"words","d":{"t":"any"},"opt":false}],
  inner$deprefix$s: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$t: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$wm: [{"name":"WHEN","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$wm$$step: [{"name":"WHEN","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$before: [{"name":"WHEN","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$before$$step: [{"name":"t","d":{"t":"str"},"opt":false},{"name":"wm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$detectAlertClause$after: [{"name":"WHEN","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$after$$step: [{"name":"t","d":{"t":"str"},"opt":false},{"name":"wm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$detectAlertClause$WW: [{"name":"SL_T","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$wm_L61: [{"name":"SL_T","d":{"t":"any"},"opt":false},{"name":"after","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$wm_L61$$step: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"WW","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$HW: [{"name":"SL_T","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$hm: [{"name":"SL_T","d":{"t":"any"},"opt":false},{"name":"after","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$hm$$step: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"HW","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$afterN: [{"name":"after","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$m: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$m$$step: [{"name":"afterN","d":{"t":"str"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$g: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$xPart: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"relM","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$yPart: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"relM","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$xWords: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"relM","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$xWords$$step: [{"name":"xPart","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$yWords: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"relM","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$yWords$$step: [{"name":"yPart","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$yNum: [{"name":"after","d":{"t":"str"},"opt":false},{"name":"relM","d":{"t":"any"},"opt":false}],
  inner$detectAlertClause$yNum$$step: [{"name":"yPart","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$fn$m: [{"name":"yPart","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$fn$m_L84: [{"name":"yPart","d":{"t":"str"},"opt":false}],
  inner$detectAlertClause$fn$m_L85: [{"name":"yPart","d":{"t":"str"},"opt":false}],
  inner$clausesByForm$unitOnly: [{"name":"SL_T","d":{"t":"any"},"opt":false},{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$unitOnly$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"TU","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$j: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$x: [{"name":"frame","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$x$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"F","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$n: [{"name":"SL_T","d":{"t":"any"},"opt":false},{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$n$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"unitOnly","d":{"t":"any"},"opt":false}],
  inner$clausesByForm$unit: [{"name":"SL_T","d":{"t":"any"},"opt":false},{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$unit$$step: [{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"TU","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"unitOnly","d":{"t":"any"},"opt":false}],
  inner$clausesByForm$after: [{"name":"SL_T","d":{"t":"any"},"opt":false},{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$clausesByForm$after$$step: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"unitOnly","d":{"t":"any"},"opt":false},{"name":"unit","d":{"t":"any"},"opt":false}],
  inner$detectLevelsClause$hm: [{"name":"COND","d":{"t":"any"},"opt":false},{"name":"head","d":{"t":"any"},"opt":false}],
  inner$detectLevelsClause$tm: [{"name":"COND","d":{"t":"any"},"opt":false},{"name":"tail","d":{"t":"any"},"opt":false}],
  inner$detectLevelsClause$thresholds: [{"name":"COND","d":{"t":"any"},"opt":false},{"name":"tail","d":{"t":"any"},"opt":false}],
  inner$detectLevelsClause$thresholds$$step: [{"name":"tm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$detectAllClauses$pieces: [{"name":"CONN_RE","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$detectAllClauses$conn: [{"name":"CONN_RE","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$detectAllClauses$conn$$step: [{"name":"pieces","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$detectAllClauses$m: [{"name":"WHEN","d":{"t":"any"},"opt":false},{"name":"part","d":{"t":"str"},"opt":false}],
  inner$emitAppFrom$m: [{"name":"OBJ_RE","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$trig: [{"name":"units","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$alertAtom: [{"name":"picked","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$gFills: [{"name":"gauge","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false}],
  inner$emitAppFrom$rFills: [{"name":"readout","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false}],
  inner$emitAppFrom$hasAlert: [{"name":"units","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$impPaths: [{"name":"gauge","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false},{"name":"readout","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false}],
  inner$emitAppFrom$imps: [{"name":"impPaths","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$emitAppFrom$stateVars: [{"name":"units","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$body: [{"name":"units","d":{"t":"any"},"opt":false},{"name":"gauge","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false},{"name":"readout","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false},{"name":"picked","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$body$$step: [{"name":"units","d":{"t":"any"},"opt":false},{"name":"gauge","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false},{"name":"readout","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false},{"name":"alertAtom","d":{"t":"any"},"opt":false},{"name":"gFills","d":{"t":"str"},"opt":false},{"name":"rFills","d":{"t":"str"},"opt":false}],
  inner$emitAppFrom$map$thr: [{"name":"u","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$map$smax: [{"name":"u","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$map$smax$$step: [{"name":"thr","d":{"t":"num"},"opt":false}],
  inner$emitAppFrom$map$cmp: [{"name":"u","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$map$cmp$$step: [{"name":"u","d":{"t":"any"},"opt":false},{"name":"thr","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$map$rLabel: [{"name":"u","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$map$rLabel$$step: [{"name":"u","d":{"t":"any"},"opt":false},{"name":"cmp","d":{"t":"str"},"opt":false}],
  inner$emitAppFrom$map$alertW: [{"name":"alertAtom","d":{"t":"any"},"opt":false},{"name":"u","d":{"t":"any"},"opt":false}],
  inner$emitAppFrom$map$alertW$$step: [{"name":"alertAtom","d":{"t":"any"},"opt":false},{"name":"u","d":{"t":"any"},"opt":false},{"name":"cmp","d":{"t":"str"},"opt":false}],
  inner$emitAppFrom$heCount: [{"name":"clauses","d":{"t":"any"},"opt":false},{"name":"units","d":{"t":"any"},"opt":false}],
  inner$clausesByForm$TU$$after_loop: [{"name":"SL_T","d":{"t":"any"},"opt":false}],
};
