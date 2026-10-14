// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/buffer.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const alt = (ws) => (ws || []).map((w) => String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const lit = (v) => "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$') + "'";
export function inner$bufferDeclsOf$ents(form) {
    const ents = form.things.filter((t) => t.fields && t.fields.length && t.examples && t.examples.length);
    return ents;
}
export function inner$bufferDeclsOf$rm(SL, seg) {
    const rm = seg.match(new RegExp(`(?:${alt(SL.releaseWords)})\\s+(\\d+)\\s+(?:${alt(SL.everyWords)})\\s+(?:(\\d+(?:\\.\\d+)?)\\s+)?(\\S+)`));
    return rm;
}
export function inner$bufferDeclsOf$cm(SL, seg) {
    const rm = seg.match(new RegExp(`(?:${alt(SL.releaseWords)})\\s+(\\d+)\\s+(?:${alt(SL.everyWords)})\\s+(?:(\\d+(?:\\.\\d+)?)\\s+)?(\\S+)`));
    const cm = seg.slice(0, rm.index).match(new RegExp(`(?:${alt(SL.bufferWords)})\\s+(\\d+)`));
    return cm;
}
export function inner$bufferDeclsOf$cm$$step(SL, seg, rm) {
    const cm = seg.slice(0, rm.index).match(new RegExp(`(?:${alt(SL.bufferWords)})\\s+(\\d+)`));
    return cm;
}
export function inner$bufferDeclsOf$fi(ent) {
    const fi = ent.fields.findIndex((f, i) => i > 0 && ent.examples.every((r) => /^-?\d+(\.\d+)?$/.test(String(r[i] ?? '').trim())));
    return fi;
}
export function inner$emit$in0(b) {
    const in0 = Math.min(b.sum, b.ceiling);
    return in0;
}
export function inner$emit$out0(b) {
    const in0 = Math.min(b.sum, b.ceiling);
    const out0 = b.sum - in0;
    return out0;
}
export function inner$emit$out0$$step(b, in0) {
    const out0 = b.sum - in0;
    return out0;
}
export function inner$emit$adm1(b) {
    const in0 = Math.min(b.sum, b.ceiling);
    const adm1 = Math.min(b.sum, Math.min(b.batch, in0) + b.ceiling);
    return adm1;
}
export function inner$emit$adm1$$step(b, in0) {
    const adm1 = Math.min(b.sum, Math.min(b.batch, in0) + b.ceiling);
    return adm1;
}
export function inner$emit$after1(b) {
    const in0 = Math.min(b.sum, b.ceiling);
    const adm1 = Math.min(b.sum, Math.min(b.batch, in0) + b.ceiling);
    const after1 = adm1 - Math.min(b.batch, in0);
    return after1;
}
export function inner$emit$after1$$step(b, in0, adm1) {
    const after1 = adm1 - Math.min(b.batch, in0);
    return after1;
}
export function inner$emit$out1(b) {
    const in0 = Math.min(b.sum, b.ceiling);
    const adm1 = Math.min(b.sum, Math.min(b.batch, in0) + b.ceiling);
    const out1 = b.sum - adm1;
    return out1;
}
export function inner$emit$out1$$step(b, adm1) {
    const out1 = b.sum - adm1;
    return out1;
}
export function inner$emit$test(b, cls, slug, seedSlug, pkg) {
    const in0 = Math.min(b.sum, b.ceiling);
    const out0 = b.sum - in0;
    const adm1 = Math.min(b.sum, Math.min(b.batch, in0) + b.ceiling);
    const after1 = adm1 - Math.min(b.batch, in0);
    const out1 = b.sum - adm1;
    const test = seedSlug ? [`// 🎯 מבחן-קבלה (אזור-המתנה): הדוגמאות ⇒ בפנים עד התקרה, השאר בחוץ · שחרור מנה מוריד ומכניס מבחוץ · שחרור שני מיד — חסום (קצב). חולל; אל תערוך.`,
        `import 'package:flutter/material.dart';`, `import 'package:flutter_test/flutter_test.dart';`, `import 'package:${pkg}/genesis/dart-gen-bs/gen_${seedSlug}.dart';`, `import 'package:${pkg}/genesis/dart-gen-bs/gen_${slug}.dart';`,
        'void main() {', `  testWidgets(${lit(`אזור-המתנה: ${b.sum} ממתינים, תקרה ${b.ceiling}, מנה ${b.batch} כל ${b.everyMin} דק׳`)}, (tester) async {`,
        '    seedExamples();', `    await tester.pumpWidget(const MaterialApp(home: ${cls}()));`, '    await tester.pump();',
        `    expect(find.text('${in0} / ${b.ceiling}'), findsOneWidget, reason: ${lit(`הגיעו ${b.sum} · בפנים לעולם לא יותר מ-${b.ceiling}`)});`,
        ...(out0 > 0 ? [`    expect(find.byKey(const Key('buf-out')), findsOneWidget, reason: ${lit(`${out0} ממתינים בחוץ`)});`] : []),
        ...(in0 >= b.ceiling ? [`    expect(find.byKey(const Key('buf-over')), findsOneWidget);`] : in0 >= b.ceiling * 0.9 ? [`    expect(find.byKey(const Key('buf-near')), findsOneWidget);`] : []),
        `    await tester.tap(find.byKey(const Key('buf-release'))); await tester.pump();`,
        `    expect(find.text('${after1} / ${b.ceiling}'), findsOneWidget, reason: ${lit(`שחרור מנה: ${in0} ⇒ ${in0 - Math.min(b.batch, in0)}, ומבחוץ נכנסים ${adm1 - in0} ⇒ ${after1}`)});`,
        ...(out1 === 0 && out0 > 0 ? [`    expect(find.byKey(const Key('buf-out')), findsNothing, reason: ${lit('כל מי שחיכה בחוץ נכנס')});`] : []),
        `    await tester.tap(find.byKey(const Key('buf-release')), warnIfMissed: false); await tester.pump();`,
        `    expect(find.text('${after1} / ${b.ceiling}'), findsOneWidget, reason: ${lit(`שחרור שני מיד — חסום עד ${b.everyMin} דק׳`)});`,
        `    expect(find.byKey(const Key('buf-next')), findsOneWidget);`, '  });', '}', ''].join('\n') : null;
    return test;
}
export function inner$emit$test$$step(b, cls, slug, seedSlug, pkg, in0, out0, adm1, after1, out1) {
    const test = seedSlug ? [`// 🎯 מבחן-קבלה (אזור-המתנה): הדוגמאות ⇒ בפנים עד התקרה, השאר בחוץ · שחרור מנה מוריד ומכניס מבחוץ · שחרור שני מיד — חסום (קצב). חולל; אל תערוך.`,
        `import 'package:flutter/material.dart';`, `import 'package:flutter_test/flutter_test.dart';`, `import 'package:${pkg}/genesis/dart-gen-bs/gen_${seedSlug}.dart';`, `import 'package:${pkg}/genesis/dart-gen-bs/gen_${slug}.dart';`,
        'void main() {', `  testWidgets(${lit(`אזור-המתנה: ${b.sum} ממתינים, תקרה ${b.ceiling}, מנה ${b.batch} כל ${b.everyMin} דק׳`)}, (tester) async {`,
        '    seedExamples();', `    await tester.pumpWidget(const MaterialApp(home: ${cls}()));`, '    await tester.pump();',
        `    expect(find.text('${in0} / ${b.ceiling}'), findsOneWidget, reason: ${lit(`הגיעו ${b.sum} · בפנים לעולם לא יותר מ-${b.ceiling}`)});`,
        ...(out0 > 0 ? [`    expect(find.byKey(const Key('buf-out')), findsOneWidget, reason: ${lit(`${out0} ממתינים בחוץ`)});`] : []),
        ...(in0 >= b.ceiling ? [`    expect(find.byKey(const Key('buf-over')), findsOneWidget);`] : in0 >= b.ceiling * 0.9 ? [`    expect(find.byKey(const Key('buf-near')), findsOneWidget);`] : []),
        `    await tester.tap(find.byKey(const Key('buf-release'))); await tester.pump();`,
        `    expect(find.text('${after1} / ${b.ceiling}'), findsOneWidget, reason: ${lit(`שחרור מנה: ${in0} ⇒ ${in0 - Math.min(b.batch, in0)}, ומבחוץ נכנסים ${adm1 - in0} ⇒ ${after1}`)});`,
        ...(out1 === 0 && out0 > 0 ? [`    expect(find.byKey(const Key('buf-out')), findsNothing, reason: ${lit('כל מי שחיכה בחוץ נכנס')});`] : []),
        `    await tester.tap(find.byKey(const Key('buf-release')), warnIfMissed: false); await tester.pump();`,
        `    expect(find.text('${after1} / ${b.ceiling}'), findsOneWidget, reason: ${lit(`שחרור שני מיד — חסום עד ${b.everyMin} דק׳`)});`,
        `    expect(find.byKey(const Key('buf-next')), findsOneWidget);`, '  });', '}', ''].join('\n') : null;
    return test;
}

export const SIGS = {
  inner$bufferDeclsOf$ents: [{"name":"form","d":{"t":"any"},"opt":false}],
  inner$bufferDeclsOf$rm: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$bufferDeclsOf$cm: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$bufferDeclsOf$cm$$step: [{"name":"SL","d":{"t":"obj","n":"SL","p":[]},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false},{"name":"rm","d":{"t":"any"},"opt":false}],
  inner$bufferDeclsOf$fi: [{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$emit$in0: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$emit$out0: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$emit$out0$$step: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"in0","d":{"t":"num"},"opt":false}],
  inner$emit$adm1: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$emit$adm1$$step: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"in0","d":{"t":"num"},"opt":false}],
  inner$emit$after1: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$emit$after1$$step: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"in0","d":{"t":"num"},"opt":false},{"name":"adm1","d":{"t":"num"},"opt":false}],
  inner$emit$out1: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$emit$out1$$step: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"adm1","d":{"t":"num"},"opt":false}],
  inner$emit$test: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"slug","d":{"t":"any"},"opt":false},{"name":"seedSlug","d":{"t":"null"},"opt":false},{"name":"pkg","d":{"t":"str"},"opt":false}],
  inner$emit$test$$step: [{"name":"b","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"slug","d":{"t":"any"},"opt":false},{"name":"seedSlug","d":{"t":"null"},"opt":false},{"name":"pkg","d":{"t":"str"},"opt":false},{"name":"in0","d":{"t":"num"},"opt":false},{"name":"out0","d":{"t":"num"},"opt":false},{"name":"adm1","d":{"t":"num"},"opt":false},{"name":"after1","d":{"t":"num"},"opt":false},{"name":"out1","d":{"t":"num"},"opt":false}],
};
