// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/enginebox/EngineBoxScreen.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DOORS = [
    { id: 'goal', emoji: '🎯', title: 'תגיד מה אתה רוצה', sub: 'כותבים מה רוצים' },
    { id: 'atoms', emoji: '🧬', title: 'בנה בעצמך', sub: 'מנוע + חלק קטן' },
    { id: 'plug', emoji: '🔌', title: 'חבר מנוע מוכן', sub: 'מנוע שלם למוצר' },
];
export function inner$BoxDoors$doors(props) {
    const doors = props.goal === false ? DOORS.filter((d) => d.id !== 'goal') : DOORS;
    return doors;
}
export function inner$BoxDoors$map$on(props, d) {
    const on = props.tab === d.id;
    return on;
}
export function inner$EngineBoxBody$step(start, picked) {
    const step = !start ? 'start' : !picked ? 'pick' : 'plug';
    return step;
}
export function inner$EngineBoxBody$goalOn(props, source, tab) {
    const hasGoal = !!source?.goal;
    const atomsGoal = !!props.atoms?.goal;
    const goalOn = (hasGoal || atomsGoal) && tab === 'goal';
    return goalOn;
}
export function inner$EngineBoxBody$goalOn$$step(tab, hasGoal, atomsGoal) {
    const goalOn = (hasGoal || atomsGoal) && tab === 'goal';
    return goalOn;
}
export function inner$EngineBoxBody$hasAtoms(props) {
    const hasAtoms = props.atoms !== undefined;
    return hasAtoms;
}
export function inner$EngineBoxBody$atomsOn(props, tab) {
    const hasAtoms = props.atoms !== undefined;
    const atomsOn = hasAtoms && tab === 'atoms';
    return atomsOn;
}
export function inner$EngineBoxBody$atomsOn$$step(tab, hasAtoms) {
    const atomsOn = hasAtoms && tab === 'atoms';
    return atomsOn;
}

export const SIGS = {
  inner$BoxDoors$doors: [{"name":"props","d":{"t":"obj","p":[["tab",{"t":"lit","v":["plug","goal","atoms"]},false],["onTab",{"t":"fn"},false],["goal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$BoxDoors$map$on: [{"name":"props","d":{"t":"obj","p":[["tab",{"t":"lit","v":["plug","goal","atoms"]},false],["onTab",{"t":"fn"},false],["goal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false},{"name":"d","d":{"t":"obj","p":[["id",{"t":"lit","v":["plug","goal","atoms"]},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["sub",{"t":"str"},false]]},"opt":false}],
  inner$EngineBoxBody$step: [{"name":"start","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"BoxStart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["kind",{"t":"lit","v":["product","part"]},false],["parts",{"t":"arr","of":{"t":"obj","n":"BoxPart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["what",{"t":"str"},false]]}},false]]}]},"opt":false},{"name":"picked","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"BoxPart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["what",{"t":"str"},false]]}]},"opt":false}],
  inner$EngineBoxBody$goalOn: [{"name":"props","d":{"t":"obj","p":[["source",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EngineBoxSource","p":[["products",{"t":"fn"},false],["parts",{"t":"fn"},false],["options",{"t":"fn"},false],["future",{"t":"fn"},false],["linkedCount",{"t":"fn"},false],["connect",{"t":"fn"},false],["disconnect",{"t":"fn"},false],["canEdit",{"t":"bool"},false],["goal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["applyRoute",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["requestEngine",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}]},false],["initial",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["start",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["picked",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["tab",{"t":"or","of":[{"t":"lit","v":["plug","goal","atoms"]},{"t":"undef"}]},true],["goal",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["atoms",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"AtomsSource","p":[["engines",{"t":"fn"},false],["atoms",{"t":"fn"},false],["capabilities",{"t":"fn"},false],["preview",{"t":"fn"},false],["chains",{"t":"fn"},false],["create",{"t":"fn"},false],["remove",{"t":"fn"},false],["canEdit",{"t":"bool"},false],["capHost",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["capState",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["blockedBy",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["saveChain",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["goal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["connectGoal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["found",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["verified",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}]},true]]},"opt":false},{"name":"source","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EngineBoxSource","p":[["products",{"t":"fn"},false],["parts",{"t":"fn"},false],["options",{"t":"fn"},false],["future",{"t":"fn"},false],["linkedCount",{"t":"fn"},false],["connect",{"t":"fn"},false],["disconnect",{"t":"fn"},false],["canEdit",{"t":"bool"},false],["goal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["applyRoute",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["requestEngine",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}]},"opt":false},{"name":"tab","d":{"t":"lit","v":["plug","goal","atoms"]},"opt":false}],
  inner$EngineBoxBody$goalOn$$step: [{"name":"tab","d":{"t":"lit","v":["plug","goal","atoms"]},"opt":false},{"name":"hasGoal","d":{"t":"bool"},"opt":false},{"name":"atomsGoal","d":{"t":"bool"},"opt":false}],
  inner$EngineBoxBody$hasAtoms: [{"name":"props","d":{"t":"obj","p":[["source",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EngineBoxSource","p":[["products",{"t":"fn"},false],["parts",{"t":"fn"},false],["options",{"t":"fn"},false],["future",{"t":"fn"},false],["linkedCount",{"t":"fn"},false],["connect",{"t":"fn"},false],["disconnect",{"t":"fn"},false],["canEdit",{"t":"bool"},false],["goal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["applyRoute",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["requestEngine",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}]},false],["initial",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["start",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["picked",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["tab",{"t":"or","of":[{"t":"lit","v":["plug","goal","atoms"]},{"t":"undef"}]},true],["goal",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["atoms",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"AtomsSource","p":[["engines",{"t":"fn"},false],["atoms",{"t":"fn"},false],["capabilities",{"t":"fn"},false],["preview",{"t":"fn"},false],["chains",{"t":"fn"},false],["create",{"t":"fn"},false],["remove",{"t":"fn"},false],["canEdit",{"t":"bool"},false],["capHost",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["capState",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["blockedBy",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["saveChain",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["goal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["connectGoal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["found",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["verified",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}]},true]]},"opt":false}],
  inner$EngineBoxBody$atomsOn: [{"name":"props","d":{"t":"obj","p":[["source",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EngineBoxSource","p":[["products",{"t":"fn"},false],["parts",{"t":"fn"},false],["options",{"t":"fn"},false],["future",{"t":"fn"},false],["linkedCount",{"t":"fn"},false],["connect",{"t":"fn"},false],["disconnect",{"t":"fn"},false],["canEdit",{"t":"bool"},false],["goal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["applyRoute",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["requestEngine",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}]},false],["initial",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["start",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["picked",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["tab",{"t":"or","of":[{"t":"lit","v":["plug","goal","atoms"]},{"t":"undef"}]},true],["goal",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["atoms",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"AtomsSource","p":[["engines",{"t":"fn"},false],["atoms",{"t":"fn"},false],["capabilities",{"t":"fn"},false],["preview",{"t":"fn"},false],["chains",{"t":"fn"},false],["create",{"t":"fn"},false],["remove",{"t":"fn"},false],["canEdit",{"t":"bool"},false],["capHost",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["capState",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["blockedBy",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["saveChain",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["goal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["connectGoal",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["found",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["verified",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]}]},true]]},"opt":false},{"name":"tab","d":{"t":"lit","v":["plug","goal","atoms"]},"opt":false}],
  inner$EngineBoxBody$atomsOn$$step: [{"name":"tab","d":{"t":"lit","v":["plug","goal","atoms"]},"opt":false},{"name":"hasAtoms","d":{"t":"bool"},"opt":false}],
};
