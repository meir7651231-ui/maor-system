// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/app-from-sentences.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const pascal = (s) => s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, (c) => c.toUpperCase());
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`;
const isNumDemo = (t) => /^[\d.,%+\-\s]+$/.test(t) && /\d/.test(t);
const kpiFields = (sk, valueExpr, labelExpr) => `[${Array.from({ length: sk.slots }, (_, i) => (i === sk.valueIdx ? valueExpr : i === sk.labelIdx ? labelExpr : "''")).join(', ')}]`;
const textFields = (sk, titleExpr, subExpr) => `[${Array.from({ length: sk.slots }, (_, i) => (i === sk.titleIdx ? titleExpr : i === sk.subIdx ? subExpr : "''")).join(', ')}]`;
export function inner$resolveSkin$a(m, cls) {
    const a = (m.atoms || []).find((x) => x.cls === cls);
    return a;
}
export function inner$resolveSkin$numIdx(m, cls) {
    const a = (m.atoms || []).find((x) => x.cls === cls);
    const numIdx = a.fieldDemo.map((t, i) => (isNumDemo(t) ? i : -1)).filter((i) => i >= 0);
    return numIdx;
}
export function inner$resolveSkin$numIdx$$step(a) {
    const numIdx = a.fieldDemo.map((t, i) => (isNumDemo(t) ? i : -1)).filter((i) => i >= 0);
    return numIdx;
}
export function inner$resolveSkin$base(m, role, cls) {
    const a = (m.atoms || []).find((x) => x.cls === cls);
    const base = { role, cls: a.cls, family: a.family, slots: a.fieldSlots, demo: a.fieldDemo, barrel: `../dart-forge-bs/${a.family}/${a.family}.dart`, itemSlots: a.items ? a.items.slots : 0, bare: !!a.bare, hasItems: !!a.items, stateIds: a.stateIds || null, variantIds: a.items && a.items.variants ? a.items.variants : null };
    return base;
}
export function inner$resolveSkin$base$$step(role, a) {
    const base = { role, cls: a.cls, family: a.family, slots: a.fieldSlots, demo: a.fieldDemo, barrel: `../dart-forge-bs/${a.family}/${a.family}.dart`, itemSlots: a.items ? a.items.slots : 0, bare: !!a.bare, hasItems: !!a.items, stateIds: a.stateIds || null, variantIds: a.items && a.items.variants ? a.items.variants : null };
    return base;
}
export function inner$resolveSkin$labelIdx(m, cls, valueIdx) {
    const a = (m.atoms || []).find((x) => x.cls === cls);
    const labelIdx = a.fieldDemo.findIndex((t, i) => i !== valueIdx);
    return labelIdx;
}
export function inner$resolveSkin$labelIdx$$step(a, valueIdx) {
    const labelIdx = a.fieldDemo.findIndex((t, i) => i !== valueIdx);
    return labelIdx;
}
export function inner$resolveSkin$minSlots(R) {
    const minSlots = R.need === 'text1' ? 1 : 2;
    return minSlots;
}
export function inner$resolveSkin$textIdx(m, cls) {
    const a = (m.atoms || []).find((x) => x.cls === cls);
    const textIdx = a.fieldDemo.map((t, i) => (/[a-z֐-׿]/.test(t) ? i : -1)).filter((i) => i >= 0);
    return textIdx;
}
export function inner$resolveSkin$textIdx$$step(a) {
    const textIdx = a.fieldDemo.map((t, i) => (/[a-z֐-׿]/.test(t) ? i : -1)).filter((i) => i >= 0);
    return textIdx;
}
export function inner$resolveSkin$subIdx(m, cls) {
    const a = (m.atoms || []).find((x) => x.cls === cls);
    const textIdx = a.fieldDemo.map((t, i) => (/[a-z֐-׿]/.test(t) ? i : -1)).filter((i) => i >= 0);
    const titleIdx = textIdx[0] ?? 0;
    const subIdx = textIdx[1] ?? (titleIdx + 1 < a.fieldSlots ? titleIdx + 1 : -1);
    return subIdx;
}
export function inner$resolveSkin$subIdx$$step(a, textIdx, titleIdx) {
    const subIdx = textIdx[1] ?? (titleIdx + 1 < a.fieldSlots ? titleIdx + 1 : -1);
    return subIdx;
}
export function inner$resolveSkin$bad(ids, tm) {
    const bad = tm.filter((t) => !ids.includes(t));
    return bad;
}
export function inner$buildApp$N(name) {
    const N = pascal(name);
    return N;
}
export function inner$buildApp$modSkin(skins) {
    const MOD_ROLES = ['stat', 'hero', 'button', 'statusChip', 'banner', 'emptyState', 'mediaRow', 'section', 'frame', 'segmented', 'chip', 'meter', 'glass', 'timeline', 'field', 'enumField', 'numberField', 'dateField', 'search', 'pageHeader', 'table', 'bars', 'calendar', 'board'];
    const modSkin = MOD_ROLES.some((r) => skins[r]) ? Object.fromEntries(MOD_ROLES.map((r) => [r, skins[r] || null])) : null;
    return modSkin;
}
export function inner$buildApp$modSkin$$step(skins, MOD_ROLES) {
    const modSkin = MOD_ROLES.some((r) => skins[r]) ? Object.fromEntries(MOD_ROLES.map((r) => [r, skins[r] || null])) : null;
    return modSkin;
}
export function inner$buildApp$hub(name, mods, skipped, skins) {
    const N = pascal(name);
    const sk = skins.kpi || null;
    const skNav = skins.navTile || null;
    const skEmpty = skins.empty || null;
    const hub = [`// 🏗️ ${N}App — אפליקציה ממשפטים (GENMAX·G9 · §22): ${mods.length} מודולים · מחולל דטרמיניסטי: app-from-sentences.mjs (sentence⇒entity⇒pickModule⇒retarget) — כל מודול חצוב מהזהב, לא נכתב`,
        ...mods.map((m) => `//   "${m.text}" ⇒ ${m.entity} ⇐ ${m.module} (${m.pick.strength} · שמות ${m.pick.names}/${m.pick.fields})`),
        ...skipped.map((s) => `//   ⚪ "${s.text}" ⇒ ${s.reason}`),
        `//   G10b-ב · תפר-הזרקה (db) ⇒ בדיקה שמזריקה שדה-סכמה שמור על רשומת-המסך ורואה את העמודה מאירה: ${mods.map((m) => `${m.entity}:${m.facts.seedSeam ? `${m.facts.seedSeam.reserved.length} עמודות` : '∅'}`).join(' · ')}`,
        `//   G12c · תפקידי-עור: ${Object.values(skins).map((x) => `${x.role}=${x.cls}`).join(' · ') || 'DS'}`,
        `//   G12b · עור: ${sk ? `forge — אריח-KPI = ${sk.cls} (${sk.family} · ${sk.slots} חריצים · תוכן-העיצוב ${JSON.stringify(sk.demo)} ⇒ ערך בחריץ ${sk.valueIdx}, תווית בחריץ ${sk.labelIdx}, השאר '') — הצבה של הבעלים ב-app-golden, מאומתת מבנית` : 'DS (KpiTile) — ברירת-מחדל, ביט-זהה'}`,
        `//   G10b · עם הקפיצה נשלח גם initialMetric=heroKey ⇒ הטבלה במודול מסוננת לשורות-המדד (באנר + ביטול): ${mods.map((m) => `${m.entity}:${m.facts.metricSeam ? 'initialMetric' : '∅'}`).join(' · ')}`,
        `//   G10a · אריח-hero ⇒ טאפ פותח את המודול על הרשומה-הראשונה של המדד (<E>Facts.heroFirstId ⇒ <E>Screen(initialPanelId)) — תפר-כניסה חצוב מצורת initialPanel של זהב-המורים: ${mods.map((m) => `${m.entity}:${m.facts.entrySeam || '∅'}`).join(' · ')}`,
        `//   G9b · KPI-רכזת נגזר: כל אריח = ${'<E>'}Facts של המודול (count חי של הזרע · hero = המדד שהזהב הכריז/צבע-סכנה) — אפס ערך מומצא: ${mods.map((m) => `${m.facts.cls}.${m.facts.heroKey}`).join(' · ')}`,
        `import 'package:flutter/material.dart';`, `import '../dart-ui-bs/ds/ds.dart';`, ...[...new Set([sk, skNav, skEmpty].filter(Boolean).map((x) => x.barrel))].map((b) => `import '${b}'; // G12b/c · עור-forge`), ...(sk ? [] : [`import '../dart-ui-bs/premium/dataviz/kpi_tile.dart';`]),
        `import '../dart-ui-bs/ds/ds_search.dart'; // איתור: חיפוש-מבוקר (value+onChanged)`, `import '../dart-ui-bs/premium/feedback/empty_state.dart'; // אין-תוצאות`,
        `import '../dart-maor/smart-filter.dart'; // איתור: סינון+מיון-לפי-ציון (מדף)`, `import '../dart-maor/smart-score.dart'; // איתור: ניקוד רב-מילתי AND (מדף)`,
        `import '../dart-maor/norm-search.dart'; // איתור: נרמול-חיפוש עברי (מדף)`, `import '../dart-data-maor/norm-search-strings.dart'; // NORM_SEARCH_T (אטום-דאטה)`,
        ...mods.map((m) => `import '${m.file}' show ${m.screen}, ${m.facts.cls}; // רק התפר הציבורי (מסך+עובדות) — מחלקות-ציבוריות אחרות של הזהב (DashInput) לא מתנגשות`), '',
        `class ${N}App extends StatelessWidget {`, `  const ${N}App({super.key});`, '  @override',
        `  Widget build(BuildContext context) => MaterialApp(title: ${q(name)}, debugShowCheckedModeBanner: false, theme: ThemeData(brightness: Brightness.dark, useMaterial3: true, fontFamily: DsTokens.fontBody), home: const ${N}HubScreen()); // גופן-הגוף של ה-DS (מצורף לחבילה) — לא Roboto-מ-CDN: האתר-המחולל עצמאי גם בלי רשת (L69)`, '}', '',
        `class ${N}HubScreen extends StatefulWidget {`, `  const ${N}HubScreen({super.key});`, '  @override', `  State<${N}HubScreen> createState() => _${N}HubScreenState();`, '}', '',
        `class _${N}HubScreenState extends State<${N}HubScreen> {`,
        `  static void _go(BuildContext c, Widget screen) => Navigator.push(c, MaterialPageRoute(builder: (_) => screen));`,
        `  static const modules = <String>[${mods.map((m) => q(m.title)).join(', ')}]; // ${mods.length} מסכים מחווטים`,
        `  String _q = ''; // חיפוש-רכזת נגזר (G9c): DsSearch ⊕ smartFilter ⊕ smartScore ⊕ normSearch — צורת-האיתור של הזהב (23-ג), לא .contains שטוח`,
        `  static String _norm(dynamic q) => normSearch(q, NORM_SEARCH_T);`,
        `  static Iterable _expand(dynamic q, dynamic norm) => [norm(q)];`,
        `  static num _score(dynamic exp, dynamic term) => _norm(term).contains('${'$'}exp') ? 100 : 0;`,
        `  static num _scoreOf(dynamic q, dynamic terms) => smartScore(q, terms, _norm, _expand, _score) as num;`,
        `  static bool _hasQuery(dynamic q) => (q as String).trim().isNotEmpty;`,
        `  // שורות-החיפוש = נגזרת של תפר-העובדות: כותרת · מונח-הישות · המשפט · תוויות-המדדים — אפס דאטה-חדש`,
        `  static final rows = <Map<String, dynamic>>[`,
        ...mods.map((m, i) => `    {'i': ${i}, 'title': ${q(m.title)}, 'label': ${m.facts.cls}.label, 'text': ${q(m.text)}, 'terms': [for (final d in ${m.facts.cls}.metricDefs) '${'$'}{d['label']}']},`),
        '  ];',
        `  static List<String> termsOf(Map<String, dynamic> r) => ['${'$'}{r['title']}', '${'$'}{r['label']}', '${'$'}{r['text']}', ...(r['terms'] as List).cast<String>()];`,
        `  static List<Map<String, dynamic>> searchModules(List<Map<String, dynamic>> rs, String q) => (smartFilter(q, rs, (it) => termsOf(it as Map<String, dynamic>), _hasQuery, _scoreOf) as List).cast<Map<String, dynamic>>();`,
        '  @override',
        `  Widget build(BuildContext context) {`,
        `    final vis = searchModules(rows, _q).map((r) => r['i'] as int).toSet();`,
        `    return DsScaffold(title: ${q(name)}, subtitle: '${mods.length} מודולים ממשפטים · כל אחד חצוב מהזהב', icon: '🧬', children: [`,
        `      DsSearch(value: _q, onChanged: (v) => setState(() => _q = v)),`,
        `      const SizedBox(height: 8),`,
        `      Wrap(spacing: 12, runSpacing: 12, children: [ // KPI-רכזת (G9b): עובדות-אמת בלבד — כמו _Home של הזהב (מסכים-מחוברים + הדחוף של כל מודול)`,
        sk ? `        SizedBox(width: 168, child: ${sk.cls}(fields: ${kpiFields(sk, "'${vis.length}/${modules.length}'", "'מסכים מחוברים'")})),` : `        SizedBox(width: 168, child: KpiTile(glyph: '🧬', value: '${'$'}{vis.length}/${'$'}{modules.length}', label: 'מסכים מחוברים')),`,
        ...mods.map((m, i) => m.facts.entrySeam
            ? `        if (vis.contains(${i})) GestureDetector(key: const ValueKey('hero-${m.entity}'), onTap: () { final id = ${m.facts.cls}.heroFirstId; _go(context, id == null ? const ${m.screen}() : ${m.screen}(${m.facts.entrySeam}: id${m.facts.metricSeam ? `, initialMetric: ${m.facts.cls}.heroKey` : ''})); }, child: SizedBox(width: 168, child: ${sk ? `${sk.cls}(fields: ${kpiFields(sk, `${m.facts.cls}.hero`, `${m.facts.cls}.heroLabel`)})` : `KpiTile(glyph: '🧬', value: ${m.facts.cls}.hero, label: ${m.facts.cls}.heroLabel)`})), // ${m.entity} · ${m.facts.heroHow} · טאפ ⇒ המודול פתוח על רשומת-ה-hero הראשונה (G10a)`
            : `        if (vis.contains(${i})) SizedBox(key: const ValueKey('hero-${m.entity}'), width: 168, child: ${sk ? `${sk.cls}(fields: ${kpiFields(sk, `${m.facts.cls}.hero`, `${m.facts.cls}.heroLabel`)})` : `KpiTile(glyph: '🧬', value: ${m.facts.cls}.hero, label: ${m.facts.cls}.heroLabel)`}), // ${m.entity} · ${m.facts.heroHow} · אין תפר-כניסה (אין זרע/פאנל)`),
        '      ]),', '      const SizedBox(height: 8),',
        `      if (vis.isEmpty) ${skEmpty ? `${skEmpty.cls}(fields: ${textFields(skEmpty, "'אין מודול שתואם לחיפוש'", "'נסה מילה אחרת'")})` : "const EmptyState(glyph: '🔍', message: 'אין מודול שתואם לחיפוש')"} else DsSection(title: 'כלים · ${'$'}{vis.length}', children: [`,
        ...mods.map((m, i) => {
            const subE = m.facts.count ? `'${'$'}{${m.facts.cls}.count} ${'$'}{${m.facts.cls}.label} · ${q(m.text).slice(1, -1)}'` : q(m.text);
            return skNav
                ? `        if (vis.contains(${i})) GestureDetector(key: const ValueKey('nav-${m.entity}'), behavior: HitTestBehavior.opaque, onTap: () => _go(context, const ${m.screen}()), child: ${skNav.cls}(fields: ${textFields(skNav, q(m.title), subE)})), // אריח-ניווט forge (G12c)`
                : `        if (vis.contains(${i})) DsNavTile(glyph: '🧬', title: ${q(m.title)}, sub: ${subE}, onTap: () => _go(context, const ${m.screen}())),`;
        }),
        '      ]),', '    ]);', '  }', '}', ''].join('\n');
    return hub;
}
export function inner$buildApp$hub$$step(name, N, mods, skipped, skins, sk, skNav, skEmpty) {
    const hub = [`// 🏗️ ${N}App — אפליקציה ממשפטים (GENMAX·G9 · §22): ${mods.length} מודולים · מחולל דטרמיניסטי: app-from-sentences.mjs (sentence⇒entity⇒pickModule⇒retarget) — כל מודול חצוב מהזהב, לא נכתב`,
        ...mods.map((m) => `//   "${m.text}" ⇒ ${m.entity} ⇐ ${m.module} (${m.pick.strength} · שמות ${m.pick.names}/${m.pick.fields})`),
        ...skipped.map((s) => `//   ⚪ "${s.text}" ⇒ ${s.reason}`),
        `//   G10b-ב · תפר-הזרקה (db) ⇒ בדיקה שמזריקה שדה-סכמה שמור על רשומת-המסך ורואה את העמודה מאירה: ${mods.map((m) => `${m.entity}:${m.facts.seedSeam ? `${m.facts.seedSeam.reserved.length} עמודות` : '∅'}`).join(' · ')}`,
        `//   G12c · תפקידי-עור: ${Object.values(skins).map((x) => `${x.role}=${x.cls}`).join(' · ') || 'DS'}`,
        `//   G12b · עור: ${sk ? `forge — אריח-KPI = ${sk.cls} (${sk.family} · ${sk.slots} חריצים · תוכן-העיצוב ${JSON.stringify(sk.demo)} ⇒ ערך בחריץ ${sk.valueIdx}, תווית בחריץ ${sk.labelIdx}, השאר '') — הצבה של הבעלים ב-app-golden, מאומתת מבנית` : 'DS (KpiTile) — ברירת-מחדל, ביט-זהה'}`,
        `//   G10b · עם הקפיצה נשלח גם initialMetric=heroKey ⇒ הטבלה במודול מסוננת לשורות-המדד (באנר + ביטול): ${mods.map((m) => `${m.entity}:${m.facts.metricSeam ? 'initialMetric' : '∅'}`).join(' · ')}`,
        `//   G10a · אריח-hero ⇒ טאפ פותח את המודול על הרשומה-הראשונה של המדד (<E>Facts.heroFirstId ⇒ <E>Screen(initialPanelId)) — תפר-כניסה חצוב מצורת initialPanel של זהב-המורים: ${mods.map((m) => `${m.entity}:${m.facts.entrySeam || '∅'}`).join(' · ')}`,
        `//   G9b · KPI-רכזת נגזר: כל אריח = ${'<E>'}Facts של המודול (count חי של הזרע · hero = המדד שהזהב הכריז/צבע-סכנה) — אפס ערך מומצא: ${mods.map((m) => `${m.facts.cls}.${m.facts.heroKey}`).join(' · ')}`,
        `import 'package:flutter/material.dart';`, `import '../dart-ui-bs/ds/ds.dart';`, ...[...new Set([sk, skNav, skEmpty].filter(Boolean).map((x) => x.barrel))].map((b) => `import '${b}'; // G12b/c · עור-forge`), ...(sk ? [] : [`import '../dart-ui-bs/premium/dataviz/kpi_tile.dart';`]),
        `import '../dart-ui-bs/ds/ds_search.dart'; // איתור: חיפוש-מבוקר (value+onChanged)`, `import '../dart-ui-bs/premium/feedback/empty_state.dart'; // אין-תוצאות`,
        `import '../dart-maor/smart-filter.dart'; // איתור: סינון+מיון-לפי-ציון (מדף)`, `import '../dart-maor/smart-score.dart'; // איתור: ניקוד רב-מילתי AND (מדף)`,
        `import '../dart-maor/norm-search.dart'; // איתור: נרמול-חיפוש עברי (מדף)`, `import '../dart-data-maor/norm-search-strings.dart'; // NORM_SEARCH_T (אטום-דאטה)`,
        ...mods.map((m) => `import '${m.file}' show ${m.screen}, ${m.facts.cls}; // רק התפר הציבורי (מסך+עובדות) — מחלקות-ציבוריות אחרות של הזהב (DashInput) לא מתנגשות`), '',
        `class ${N}App extends StatelessWidget {`, `  const ${N}App({super.key});`, '  @override',
        `  Widget build(BuildContext context) => MaterialApp(title: ${q(name)}, debugShowCheckedModeBanner: false, theme: ThemeData(brightness: Brightness.dark, useMaterial3: true, fontFamily: DsTokens.fontBody), home: const ${N}HubScreen()); // גופן-הגוף של ה-DS (מצורף לחבילה) — לא Roboto-מ-CDN: האתר-המחולל עצמאי גם בלי רשת (L69)`, '}', '',
        `class ${N}HubScreen extends StatefulWidget {`, `  const ${N}HubScreen({super.key});`, '  @override', `  State<${N}HubScreen> createState() => _${N}HubScreenState();`, '}', '',
        `class _${N}HubScreenState extends State<${N}HubScreen> {`,
        `  static void _go(BuildContext c, Widget screen) => Navigator.push(c, MaterialPageRoute(builder: (_) => screen));`,
        `  static const modules = <String>[${mods.map((m) => q(m.title)).join(', ')}]; // ${mods.length} מסכים מחווטים`,
        `  String _q = ''; // חיפוש-רכזת נגזר (G9c): DsSearch ⊕ smartFilter ⊕ smartScore ⊕ normSearch — צורת-האיתור של הזהב (23-ג), לא .contains שטוח`,
        `  static String _norm(dynamic q) => normSearch(q, NORM_SEARCH_T);`,
        `  static Iterable _expand(dynamic q, dynamic norm) => [norm(q)];`,
        `  static num _score(dynamic exp, dynamic term) => _norm(term).contains('${'$'}exp') ? 100 : 0;`,
        `  static num _scoreOf(dynamic q, dynamic terms) => smartScore(q, terms, _norm, _expand, _score) as num;`,
        `  static bool _hasQuery(dynamic q) => (q as String).trim().isNotEmpty;`,
        `  // שורות-החיפוש = נגזרת של תפר-העובדות: כותרת · מונח-הישות · המשפט · תוויות-המדדים — אפס דאטה-חדש`,
        `  static final rows = <Map<String, dynamic>>[`,
        ...mods.map((m, i) => `    {'i': ${i}, 'title': ${q(m.title)}, 'label': ${m.facts.cls}.label, 'text': ${q(m.text)}, 'terms': [for (final d in ${m.facts.cls}.metricDefs) '${'$'}{d['label']}']},`),
        '  ];',
        `  static List<String> termsOf(Map<String, dynamic> r) => ['${'$'}{r['title']}', '${'$'}{r['label']}', '${'$'}{r['text']}', ...(r['terms'] as List).cast<String>()];`,
        `  static List<Map<String, dynamic>> searchModules(List<Map<String, dynamic>> rs, String q) => (smartFilter(q, rs, (it) => termsOf(it as Map<String, dynamic>), _hasQuery, _scoreOf) as List).cast<Map<String, dynamic>>();`,
        '  @override',
        `  Widget build(BuildContext context) {`,
        `    final vis = searchModules(rows, _q).map((r) => r['i'] as int).toSet();`,
        `    return DsScaffold(title: ${q(name)}, subtitle: '${mods.length} מודולים ממשפטים · כל אחד חצוב מהזהב', icon: '🧬', children: [`,
        `      DsSearch(value: _q, onChanged: (v) => setState(() => _q = v)),`,
        `      const SizedBox(height: 8),`,
        `      Wrap(spacing: 12, runSpacing: 12, children: [ // KPI-רכזת (G9b): עובדות-אמת בלבד — כמו _Home של הזהב (מסכים-מחוברים + הדחוף של כל מודול)`,
        sk ? `        SizedBox(width: 168, child: ${sk.cls}(fields: ${kpiFields(sk, "'${vis.length}/${modules.length}'", "'מסכים מחוברים'")})),` : `        SizedBox(width: 168, child: KpiTile(glyph: '🧬', value: '${'$'}{vis.length}/${'$'}{modules.length}', label: 'מסכים מחוברים')),`,
        ...mods.map((m, i) => m.facts.entrySeam
            ? `        if (vis.contains(${i})) GestureDetector(key: const ValueKey('hero-${m.entity}'), onTap: () { final id = ${m.facts.cls}.heroFirstId; _go(context, id == null ? const ${m.screen}() : ${m.screen}(${m.facts.entrySeam}: id${m.facts.metricSeam ? `, initialMetric: ${m.facts.cls}.heroKey` : ''})); }, child: SizedBox(width: 168, child: ${sk ? `${sk.cls}(fields: ${kpiFields(sk, `${m.facts.cls}.hero`, `${m.facts.cls}.heroLabel`)})` : `KpiTile(glyph: '🧬', value: ${m.facts.cls}.hero, label: ${m.facts.cls}.heroLabel)`})), // ${m.entity} · ${m.facts.heroHow} · טאפ ⇒ המודול פתוח על רשומת-ה-hero הראשונה (G10a)`
            : `        if (vis.contains(${i})) SizedBox(key: const ValueKey('hero-${m.entity}'), width: 168, child: ${sk ? `${sk.cls}(fields: ${kpiFields(sk, `${m.facts.cls}.hero`, `${m.facts.cls}.heroLabel`)})` : `KpiTile(glyph: '🧬', value: ${m.facts.cls}.hero, label: ${m.facts.cls}.heroLabel)`}), // ${m.entity} · ${m.facts.heroHow} · אין תפר-כניסה (אין זרע/פאנל)`),
        '      ]),', '      const SizedBox(height: 8),',
        `      if (vis.isEmpty) ${skEmpty ? `${skEmpty.cls}(fields: ${textFields(skEmpty, "'אין מודול שתואם לחיפוש'", "'נסה מילה אחרת'")})` : "const EmptyState(glyph: '🔍', message: 'אין מודול שתואם לחיפוש')"} else DsSection(title: 'כלים · ${'$'}{vis.length}', children: [`,
        ...mods.map((m, i) => {
            const subE = m.facts.count ? `'${'$'}{${m.facts.cls}.count} ${'$'}{${m.facts.cls}.label} · ${q(m.text).slice(1, -1)}'` : q(m.text);
            return skNav
                ? `        if (vis.contains(${i})) GestureDetector(key: const ValueKey('nav-${m.entity}'), behavior: HitTestBehavior.opaque, onTap: () => _go(context, const ${m.screen}()), child: ${skNav.cls}(fields: ${textFields(skNav, q(m.title), subE)})), // אריח-ניווט forge (G12c)`
                : `        if (vis.contains(${i})) DsNavTile(glyph: '🧬', title: ${q(m.title)}, sub: ${subE}, onTap: () => _go(context, const ${m.screen}())),`;
        }),
        '      ]),', '    ]);', '  }', '}', ''].join('\n');
    return hub;
}
export function inner$buildApp$map$subE(m) {
    const subE = m.facts.count ? `'${'$'}{${m.facts.cls}.count} ${'$'}{${m.facts.cls}.label} · ${q(m.text).slice(1, -1)}'` : q(m.text);
    return subE;
}
export function inner$buildApp$tileType(skins) {
    const skNav = skins.navTile || null;
    const tileType = skNav ? skNav.cls : 'DsNavTile';
    return tileType;
}
export function inner$buildApp$tileType$$step(skNav) {
    const tileType = skNav ? skNav.cls : 'DsNavTile';
    return tileType;
}
export function inner$buildApp$emptyType(skins) {
    const skEmpty = skins.empty || null;
    const emptyType = skEmpty ? skEmpty.cls : 'EmptyState';
    return emptyType;
}
export function inner$buildApp$emptyType$$step(skEmpty) {
    const emptyType = skEmpty ? skEmpty.cls : 'EmptyState';
    return emptyType;
}
export function inner$buildApp$entry(name) {
    const N = pascal(name);
    const entry = [`// 🌐 ${N}App · נקודת-כניסה (GENMAX·G11b): flutter build web -t lib/genesis/dart-gen-bs/gen_main_${name.toLowerCase()}.dart — האפליקציה-ממשפטים כאתר. מחולל: app-from-sentences.mjs`,
        `import 'package:flutter/material.dart';`, `import 'gen_app_${name.toLowerCase()}.dart';`, '', `void main() => runApp(const ${N}App());`, ''].join('\n');
    return entry;
}
export function inner$buildApp$entry$$step(name, N) {
    const entry = [`// 🌐 ${N}App · נקודת-כניסה (GENMAX·G11b): flutter build web -t lib/genesis/dart-gen-bs/gen_main_${name.toLowerCase()}.dart — האפליקציה-ממשפטים כאתר. מחולל: app-from-sentences.mjs`,
        `import 'package:flutter/material.dart';`, `import 'gen_app_${name.toLowerCase()}.dart';`, '', `void main() => runApp(const ${N}App());`, ''].join('\n');
    return entry;
}
export function inner$arg$i(k, process) {
    const i = process.argv.indexOf(k);
    return i;
}

export const SIGS = {
  inner$resolveSkin$a: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$numIdx: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$numIdx$$step: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$base: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$base$$step: [{"name":"role","d":{"t":"str"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$labelIdx: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"valueIdx","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$labelIdx$$step: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"valueIdx","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$minSlots: [{"name":"R","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$textIdx: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$textIdx$$step: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$subIdx: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$resolveSkin$subIdx$$step: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"textIdx","d":{"t":"any"},"opt":false},{"name":"titleIdx","d":{"t":"num"},"opt":false}],
  inner$resolveSkin$bad: [{"name":"ids","d":{"t":"any"},"opt":false},{"name":"tm","d":{"t":"any"},"opt":false}],
  inner$buildApp$N: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$buildApp$modSkin: [{"name":"skins","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$buildApp$modSkin$$step: [{"name":"skins","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"MOD_ROLES","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$buildApp$hub: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"skipped","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"skins","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$buildApp$hub$$step: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"N","d":{"t":"any"},"opt":false},{"name":"mods","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"skipped","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"skins","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"sk","d":{"t":"any"},"opt":false},{"name":"skNav","d":{"t":"any"},"opt":false},{"name":"skEmpty","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$subE: [{"name":"m","d":{"t":"obj","p":[["text",{"t":"any"},false],["entity",{"t":"any"},false],["module",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["file",{"t":"any"},false],["screen",{"t":"str"},false],["title",{"t":"any"},false],["code",{"t":"any"},false],["pick",{"t":"any"},false],["facts",{"t":"any"},false]]},"opt":false}],
  inner$buildApp$tileType: [{"name":"skins","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$buildApp$tileType$$step: [{"name":"skNav","d":{"t":"any"},"opt":false}],
  inner$buildApp$emptyType: [{"name":"skins","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$buildApp$emptyType$$step: [{"name":"skEmpty","d":{"t":"any"},"opt":false}],
  inner$buildApp$entry: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$buildApp$entry$$step: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"N","d":{"t":"any"},"opt":false}],
  inner$arg$i: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
};
