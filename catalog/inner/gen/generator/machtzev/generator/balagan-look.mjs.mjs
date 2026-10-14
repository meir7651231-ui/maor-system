// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/balagan-look.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$filter$m(LOOK_RE, a) {
    const m = a.spec.match(LOOK_RE);
    return m;
}
export function inner$homeSlots$i(h) {
    const i = h.s.indexOf('DsScaffold(');
    return i;
}
export function inner$homeSlots$j(h) {
    const i = h.s.indexOf('DsScaffold(');
    const j = h.s.indexOf('children: [', i);
    return j;
}
export function inner$homeSlots$j$$step(h, i) {
    const j = h.s.indexOf('children: [', i);
    return j;
}
export function inner$homeSlots$k(h) {
    const i = h.s.indexOf('DsScaffold(');
    const j = h.s.indexOf('children: [', i);
    let k = j + 'children: ['.length;
    return k;
}
export function inner$homeSlots$k$$step(j) {
    let k = j + 'children: ['.length;
    return k;
}
export function inner$navMax$m(sh) {
    const m = sh.s.match(/IndexedStack\(index: _t\.clamp\(0, (\d+)\)/);
    return m;
}
export function inner$navMax$n(sh) {
    const m = sh.s.match(/IndexedStack\(index: _t\.clamp\(0, (\d+)\)/);
    const n = m ? +m[1] + 1 : 99;
    return n;
}
export function inner$navMax$n$$step(m) {
    const n = m ? +m[1] + 1 : 99;
    return n;
}
export function inner$onePrimary$tab(sh) {
    const tab = sh.s.slice(sh.s.indexOf('class _RootTab'));
    return tab;
}
export function inner$onePrimary$n(sh) {
    const tab = sh.s.slice(sh.s.indexOf('class _RootTab'));
    const n = (tab.match(/Forge\w*Btn|DsPrimaryButton|ForgeFab/g) || []).length;
    return n;
}
export function inner$onePrimary$n$$step(tab) {
    const n = (tab.match(/Forge\w*Btn|DsPrimaryButton|ForgeFab/g) || []).length;
    return n;
}
export function inner$threeOnTop$secs(x) {
    const secs = (x.s.match(/^\/\/   [^⚪\n]+ = /gm) || []).length;
    return secs;
}
export function inner$threeOnTop$fold(x) {
    const fold = x.s.includes('DsFold(');
    return fold;
}
export function inner$screenQuestion$first$cf(c, f) {
    const cf = c.find((x) => x.f === f.replace('.dart', '_content.dart'));
    return cf;
}
export function inner$screenQuestion$first$m(c, f, i) {
    const cf = c.find((x) => x.f === f.replace('.dart', '_content.dart'));
    const m = cf.s.match(new RegExp(`const String \\w+_c${i} = '([^']*)'`));
    return m;
}
export function inner$screenQuestion$first$m$$step(i, cf) {
    const m = cf.s.match(new RegExp(`const String \\w+_c${i} = '([^']*)'`));
    return m;
}
export function inner$screenQuestion$qRp(rp) {
    const qRp = rp.s.match(/DsScaffold\(title: (\w+_c(\d+))/);
    return qRp;
}
export function inner$diffMoney$withDiff(rp) {
    const withDiff = rp.filter((x) => x.s.includes('DsDiffRow('));
    return withDiff;
}
export function inner$calmEmpty$tab(sh) {
    const tab = sh.s.slice(sh.s.indexOf('class _RootTab'));
    return tab;
}
export function inner$overdueFirst$o(h) {
    const o = h.s.indexOf('if (overdue.isNotEmpty) DsSection(');
    return o;
}
export function inner$overdueFirst$td(h) {
    const td = h.s.indexOf('if (todayItems.isNotEmpty) DsSection(');
    return td;
}
export function inner$daySingle$src(h) {
    const src = h.s.replace(/\bbh\w+/g, '');
    return src;
}
export function inner$daySingle$inline(h) {
    const src = h.s.replace(/\bbh\w+/g, '');
    const inline = [...src.matchAll(/\b\w*Week\w*\b/g)].map((m) => m[0]).filter((w) => !/^(_wd|weekStart|balaganWeekOf|balaganWeekName)$/.test(w)).filter((w) => !new RegExp(`MaterialPageRoute<void>\\(builder: \\(_\\) => ${w}\\(`).test(src));
    return inline;
}
export function inner$daySingle$inline$$step(src) {
    const inline = [...src.matchAll(/\b\w*Week\w*\b/g)].map((m) => m[0]).filter((w) => !/^(_wd|weekStart|balaganWeekOf|balaganWeekName)$/.test(w)).filter((w) => !new RegExp(`MaterialPageRoute<void>\\(builder: \\(_\\) => ${w}\\(`).test(src));
    return inline;
}
export function inner$noSnoozeToday$sn(h) {
    const sn = h.s.slice(h.s.indexOf('void _snoozeAll('), h.s.indexOf('void _snoozeAll(') + 1400);
    return sn;
}
export function inner$manualLock$ap(h) {
    const ap = h.s.slice(h.s.search(/void _?autopilot\(\)/), h.s.indexOf('Future<void> _digest'));
    return ap;
}
export function inner$onlyByRule$n(h) {
    const n = (h.s.match(/\.show\(/g) || []).length;
    return n;
}
export function inner$proposalSource$pb(h) {
    const pb = h.s.slice(h.s.search(/\b_?proposals\(/), h.s.search(/void _?autopilot\(\)/));
    return pb;
}
export function inner$proposalSource$cards(h) {
    const pb = h.s.slice(h.s.search(/\b_?proposals\(/), h.s.search(/void _?autopilot\(\)/));
    const cards = pb.split('DsApproveCard(').slice(1);
    return cards;
}
export function inner$proposalSource$cards$$step(pb) {
    const cards = pb.split('DsApproveCard(').slice(1);
    return cards;
}
export function inner$nextStep$hasChain(SL, spec) {
    const hasChain = new RegExp('^\\s*' + SL.chainWord + '\\s*:', 'm').test(spec);
    return hasChain;
}
export function inner$sendOnlyTap$ap(x) {
    const ap = x.s.search(/void _?autopilot\(\)/);
    return ap;
}
export function inner$sendOnlyTap$body(x) {
    const ap = x.s.search(/void _?autopilot\(\)/);
    const body = x.s.slice(ap, x.s.indexOf('Future<void> _digest', ap));
    return body;
}
export function inner$sendOnlyTap$body$$step(x, ap) {
    const body = x.s.slice(ap, x.s.indexOf('Future<void> _digest', ap));
    return body;
}

export const SIGS = {
  inner$filter$m: [{"name":"LOOK_RE","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$homeSlots$i: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$homeSlots$j: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$homeSlots$j$$step: [{"name":"h","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$homeSlots$k: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$homeSlots$k$$step: [{"name":"j","d":{"t":"any"},"opt":false}],
  inner$navMax$m: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$navMax$n: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$navMax$n$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$onePrimary$tab: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$onePrimary$n: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$onePrimary$n$$step: [{"name":"tab","d":{"t":"any"},"opt":false}],
  inner$threeOnTop$secs: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$threeOnTop$fold: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$screenQuestion$first$cf: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$screenQuestion$first$m: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$screenQuestion$first$m$$step: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"cf","d":{"t":"any"},"opt":false}],
  inner$screenQuestion$qRp: [{"name":"rp","d":{"t":"any"},"opt":false}],
  inner$diffMoney$withDiff: [{"name":"rp","d":{"t":"any"},"opt":false}],
  inner$calmEmpty$tab: [{"name":"sh","d":{"t":"any"},"opt":false}],
  inner$overdueFirst$o: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$overdueFirst$td: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$daySingle$src: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$daySingle$inline: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$daySingle$inline$$step: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$noSnoozeToday$sn: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$manualLock$ap: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$onlyByRule$n: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$proposalSource$pb: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$proposalSource$cards: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$proposalSource$cards$$step: [{"name":"pb","d":{"t":"any"},"opt":false}],
  inner$nextStep$hasChain: [{"name":"SL","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$sendOnlyTap$ap: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$sendOnlyTap$body: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$sendOnlyTap$body$$step: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"ap","d":{"t":"any"},"opt":false}],
};
