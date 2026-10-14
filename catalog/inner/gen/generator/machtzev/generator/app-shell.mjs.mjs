// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/app-shell.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const clsOf = (slug) => 'Gen' + slug.replace(/(^|_)([a-z0-9])/g, (_, __, c) => c.toUpperCase()) + 'Screen';
export function inner$renderRootPage$imports(root) {
    const imports = new Set([`import 'gen_${root.slug}.dart';`, "import 'gen_behaviors.dart';"]);
    return imports;
}
export function inner$renderRootPage$goal(root, title) {
    const goal = `${root.name} ${title}`;
    return goal;
}
export function inner$renderRootPage$factFields(root) {
    const factFields = root.schema.filter((f) => !(f.members && f.members.length));
    return factFields;
}
export function inner$renderRootPage$phoneLabels(SL0, root) {
    const phoneLabels = root.schema.filter((f) => !/^(num|date|bool|multiline)$/.test(f.type || '') && String(f.label).split(/\s+/).some((w) => (SL0.typePhone || []).includes(w))).map((f) => f.label);
    return phoneLabels;
}
export function inner$renderRootPage$imgLabels(SL0, root) {
    const imgLabels = root.schema.filter((f) => !/^(num|date|bool)$/.test(f.type || '') && String(f.label).split(/\s+/).some((w) => (SL0.typeImage || []).includes(w))).map((f) => f.label);
    return imgLabels;
}
export function inner$renderRootPage$locLabels(SL0, root) {
    const locLabels = root.schema.filter((f) => !/^(num|date|bool|multiline)$/.test(f.type || '') && String(f.label).split(/\s+/).some((w) => (SL0.typeLocation || []).includes(w))).map((f) => f.label);
    return locLabels;
}
export function inner$renderRootPage$lastStage(root) {
    const lastStage = root.stages && root.stages.length ? root.stages.length - 1 : -1;
    return lastStage;
}
export function inner$renderRootPage$cls(slug) {
    const cls = clsOf(slug);
    return cls;
}
export function inner$renderHome$imports(slug, rootPage) {
    const imports = new Set([`import 'gen_${rootPage.slug}.dart';`, `import '../dart-data-bs/auto/gen_${slug}_content.dart';`, `import '../dart-ui-bs/ds/ds.dart';`, `import '../dart-ui-bs/ds/ds_store.dart';`, `import 'package:url_launcher/url_launcher.dart';`]);
    return imports;
}
export function inner$renderHome$openRecs(root) {
    const openRecs = root.stages && root.stages.length ? `appStore.records('${root.slug}').where((r) => appStore.stageOf('${root.slug}', r[AppStore.idKey] ?? '') < ${root.stages.length - 1}).toList()` : `appStore.records('${root.slug}')`;
    return openRecs;
}
export function inner$renderHome$cls(slug) {
    const cls = clsOf(slug);
    return cls;
}
export function inner$renderHome$dateFields(root) {
    const dateFields = root.schema.filter((f) => f.type === 'date').map((f) => ({ label: f.label, hard: !!f.required }));
    return dateFields;
}
export function inner$renderHome$lastStage(root) {
    const lastStage = root.stages && root.stages.length ? root.stages.length - 1 : -1;
    return lastStage;
}
export function inner$renderHome$sendFn2(sendFn, sendLog) {
    const sendFn2 = sendFn.replace('    final text = ', `    ${sendLog}\n    final text = `);
    return sendFn2;
}
export function inner$renderBehavior$cls(slug) {
    const cls = clsOf(slug);
    return cls;
}
export function inner$renderShell$imports(root, rootPage, hub) {
    const imports = new Set([`import 'gen_${hub.slug}.dart';`, `import 'gen_${root.slug}.dart';`, `import 'gen_${rootPage.slug}.dart';`]);
    return imports;
}
export function inner$renderShell$labels(root, dashboard, homeIsRoot, L) {
    const labels = homeIsRoot ? [root.name, dashboard ? L.shellHome : null, L.shellMore].filter(Boolean) : [dashboard ? L.shellHome : null, root.name, L.shellMore].filter(Boolean);
    return labels;
}
export function inner$renderShell$tabs(dashboard, hub, home, homeIsRoot) {
    const tabs = (homeIsRoot ? [`_RootTab()`, dashboard ? `const ${dashboard.cls}()` : null, `const ${hub.cls}()`] : [home ? `const ${home.cls}()` : dashboard ? `const ${dashboard.cls}()` : null, `_RootTab()`, `const ${hub.cls}()`]).filter(Boolean);
    return tabs;
}
export function inner$renderShell$map$file(sy) {
    const file = `gen_synth_${sy.cls.toLowerCase()}.dart`;
    return file;
}
export function inner$renderShell$cls(slug) {
    const cls = clsOf(slug);
    return cls;
}
export function inner$pickRoot$best$$after_loop(entMeta, backRefs) {
    let best = null;
    for (const e of entMeta) {
        const n = (backRefs[e.name] || []).length;
        if (n > 0 && (!best || n > best.n))
            best = { e, n };
    }
    return best;
}

export const SIGS = {
  inner$renderRootPage$imports: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderRootPage$goal: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"title","d":{"t":"any"},"opt":false}],
  inner$renderRootPage$factFields: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderRootPage$phoneLabels: [{"name":"SL0","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderRootPage$imgLabels: [{"name":"SL0","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderRootPage$locLabels: [{"name":"SL0","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderRootPage$lastStage: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderRootPage$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderHome$imports: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"rootPage","d":{"t":"any"},"opt":false}],
  inner$renderHome$openRecs: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderHome$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderHome$dateFields: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderHome$lastStage: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderHome$sendFn2: [{"name":"sendFn","d":{"t":"str"},"opt":false},{"name":"sendLog","d":{"t":"str"},"opt":false}],
  inner$renderBehavior$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderShell$imports: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"rootPage","d":{"t":"any"},"opt":false},{"name":"hub","d":{"t":"any"},"opt":false}],
  inner$renderShell$labels: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"dashboard","d":{"t":"any"},"opt":false},{"name":"homeIsRoot","d":{"t":"bool"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderShell$tabs: [{"name":"dashboard","d":{"t":"any"},"opt":false},{"name":"hub","d":{"t":"any"},"opt":false},{"name":"home","d":{"t":"null"},"opt":false},{"name":"homeIsRoot","d":{"t":"bool"},"opt":false}],
  inner$renderShell$map$file: [{"name":"sy","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"null"},false],["role",{"t":"any"},false],["tried",{"t":"num"},false],["fit",{"t":"num"},false],["best",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["ms",{"t":"num"},false],["why",{"t":"str"},false]]},{"t":"obj","p":[["role",{"t":"any"},false],["tried",{"t":"num"},false],["fit",{"t":"num"},false],["ms",{"t":"num"},false],["cls",{"t":"str"},false],["file",{"t":"str"},false],["html",{"t":"str"},false],["atom",{"t":"obj","p":[["family",{"t":"any"},false],["cls",{"t":"str"},false],["file",{"t":"str"},false],["seam",{"t":"any"},false],["states",{"t":"bool"},false],["stateIds",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},false],["fieldSlots",{"t":"num"},false],["fieldDemo",{"t":"arr","of":{"t":"any"}},false],["sig",{"t":"obj","p":[["root",{"t":"obj","p":[["tag",{"t":"any"},false],["decorated",{"t":"bool"},false],["interactive",{"t":"bool"},false],["dir",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},false],["svg",{"t":"bool"},false],["input",{"t":"any"},false],["series",{"t":"any"},false],["fills",{"t":"any"},false],["slots",{"t":"arr","of":{"t":"undef"}},false],["numEmph",{"t":"num"},false]]},false],["child",{"t":"bool"},false],["bare",{"t":"bool"},false],["control",{"t":"bool"},false],["actions",{"t":"num"},false],["items",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["slots",{"t":"num"},false],["demo",{"t":"num"},false],["selectable",{"t":"bool"},false],["selected",{"t":"bool"},false],["cells",{"t":"num"},false],["variants",{"t":"null"},false]]}]},false],["columns",{"t":"any"},false],["values",{"t":"num"},false]]},false],["score",{"t":"num"},false],["src",{"t":"str"},false],["best",{"t":"undef"},true],["why",{"t":"undef"},true]]}]},"opt":false}],
  inner$renderShell$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$pickRoot$best$$after_loop: [{"name":"entMeta","d":{"t":"any"},"opt":false},{"name":"backRefs","d":{"t":"any"},"opt":false}],
};
