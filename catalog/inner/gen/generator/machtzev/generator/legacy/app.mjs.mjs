// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/legacy/app.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ENTITY_RE = /^\s*(צור\s+)?(ישות|טופס|טבלת)(\s|$)/;
const ROLE_RE = /^\s*(תפקיד|הרשאת)\s+/;
const heWords = (s) => [...(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]).join(' ').slice(0, 30);
export function inner$buildApp$allLines(specText) {
    const allLines = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    return allLines;
}
export function inner$buildApp$roleLines(specText) {
    const allLines = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const roleLines = allLines.filter((l) => ROLE_RE.test(l));
    return roleLines;
}
export function inner$buildApp$roleLines$$step(allLines) {
    const roleLines = allLines.filter((l) => ROLE_RE.test(l));
    return roleLines;
}
export function inner$buildApp$lines(specText) {
    const allLines = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const lines = allLines.filter((l) => !ROLE_RE.test(l));
    return lines;
}
export function inner$buildApp$lines$$step(allLines) {
    const lines = allLines.filter((l) => !ROLE_RE.test(l));
    return lines;
}
export function inner$buildApp$isEntity(line) {
    const isEntity = ENTITY_RE.test(line);
    return isEntity;
}
export function inner$buildApp$entNames(screens) {
    const entNames = screens.filter((s) => s.kind === 'ent').map((s) => s.name);
    return entNames;
}
export function inner$buildApp$sysSpecs(screens) {
    const entNames = screens.filter((s) => s.kind === 'ent').map((s) => s.name);
    const sysSpecs = {
        app_audit: ['הירו 🧾 יומן פעולות | audit — כל שינוי מתועד', 'כותרת פעולות אחרונות', 'אטום DataGrid יומן פעולות', 'חישוב תיעוד פעולה (runAudit)', 'באנר audit: משתמש · פעולה · ערך-קודם · ערך-חדש · תאריך'],
        app_flags: ['הירו 🎚️ דגלי-יכולת | הפעלה/כיבוי מודולים', 'כותרת מודולים', ...entNames.slice(0, 12).map((n) => `אטום AnimatedToggle ${n}`), 'באנר כיבוי מודול לא מוחק נתונים — rollback נשמר'],
        app_settings: ['הירו ⚙️ הגדרות | סנכרון · גיבוי · הרשאות', 'אטום LiveStatusDot מחובר · מסונכרן', 'אטום AnimatedToggle עבודה אופליין', 'אטום NeonButton גיבוי עכשיו', 'באנר סנכרון · זיהוי-התנגשויות · גיבוי · ייצוא'],
    };
    return sysSpecs;
}
export function inner$buildApp$sysSpecs$$step(entNames) {
    const sysSpecs = {
        app_audit: ['הירו 🧾 יומן פעולות | audit — כל שינוי מתועד', 'כותרת פעולות אחרונות', 'אטום DataGrid יומן פעולות', 'חישוב תיעוד פעולה (runAudit)', 'באנר audit: משתמש · פעולה · ערך-קודם · ערך-חדש · תאריך'],
        app_flags: ['הירו 🎚️ דגלי-יכולת | הפעלה/כיבוי מודולים', 'כותרת מודולים', ...entNames.slice(0, 12).map((n) => `אטום AnimatedToggle ${n}`), 'באנר כיבוי מודול לא מוחק נתונים — rollback נשמר'],
        app_settings: ['הירו ⚙️ הגדרות | סנכרון · גיבוי · הרשאות', 'אטום LiveStatusDot מחובר · מסונכרן', 'אטום AnimatedToggle עבודה אופליין', 'אטום NeonButton גיבוי עכשיו', 'באנר סנכרון · זיהוי-התנגשויות · גיבוי · ייצוא'],
    };
    return sysSpecs;
}
export function inner$buildApp$spec(sl) {
    const spec = sl.join('\n');
    return spec;
}
export function inner$buildApp$sub(s) {
    const sub = s.kind === 'ent'
        ? `${s.schema.length} שדות${s.stages && s.stages.length ? ` · ${s.stages.length} שלבים` : ''}`
        : `${s.atoms} רכיבים`;
    return sub;
}
export function inner$buildApp$hubSpec(hubLines) {
    const hubSpec = hubLines.join('\n');
    return hubSpec;
}
export function inner$buildApp$roles(specText, screens) {
    const allLines = specText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
    const roleLines = allLines.filter((l) => ROLE_RE.test(l));
    const roles = roleLines.map((l) => {
        const [rn, allow] = l.replace(ROLE_RE, '').split(/\s*:\s*/);
        const role = heWords(rn);
        const all = /הכל|כל המסכים/.test(allow || '');
        const allowed = all ? screens.map((s) => s.slug)
            : screens.filter((s) => (allow || '').split(/[,\n]/).some((w) => s.name.includes(w.trim()) || w.trim().includes(s.name))).map((s) => s.slug);
        return { role, all, allowed };
    });
    return roles;
}
export function inner$buildApp$roles$$step(roleLines, screens) {
    const roles = roleLines.map((l) => {
        const [rn, allow] = l.replace(ROLE_RE, '').split(/\s*:\s*/);
        const role = heWords(rn);
        const all = /הכל|כל המסכים/.test(allow || '');
        const allowed = all ? screens.map((s) => s.slug)
            : screens.filter((s) => (allow || '').split(/[,\n]/).some((w) => s.name.includes(w.trim()) || w.trim().includes(s.name))).map((s) => s.slug);
        return { role, all, allowed };
    });
    return roles;
}
export function inner$buildApp$map$rn(l) {
    const [rn, allow] = l.replace(ROLE_RE, '').split(/\s*:\s*/);
    return rn;
}
export function inner$buildApp$map$allow(l) {
    const [rn, allow] = l.replace(ROLE_RE, '').split(/\s*:\s*/);
    return allow;
}
export function inner$buildApp$map$role(l) {
    const [rn, allow] = l.replace(ROLE_RE, '').split(/\s*:\s*/);
    const role = heWords(rn);
    return role;
}
export function inner$buildApp$map$role$$step(rn) {
    const role = heWords(rn);
    return role;
}
export function inner$buildApp$map$all(l) {
    const [rn, allow] = l.replace(ROLE_RE, '').split(/\s*:\s*/);
    const all = /הכל|כל המסכים/.test(allow || '');
    return all;
}
export function inner$buildApp$map$all$$step(allow) {
    const all = /הכל|כל המסכים/.test(allow || '');
    return all;
}
export function inner$buildApp$map$allowed(screens, l) {
    const [rn, allow] = l.replace(ROLE_RE, '').split(/\s*:\s*/);
    const all = /הכל|כל המסכים/.test(allow || '');
    const allowed = all ? screens.map((s) => s.slug)
        : screens.filter((s) => (allow || '').split(/[,\n]/).some((w) => s.name.includes(w.trim()) || w.trim().includes(s.name))).map((s) => s.slug);
    return allowed;
}
export function inner$buildApp$map$allowed$$step(screens, allow, all) {
    const allowed = all ? screens.map((s) => s.slug)
        : screens.filter((s) => (allow || '').split(/[,\n]/).some((w) => s.name.includes(w.trim()) || w.trim().includes(s.name))).map((s) => s.slug);
    return allowed;
}

export const SIGS = {
  inner$buildApp$allLines: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$roleLines: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$roleLines$$step: [{"name":"allLines","d":{"t":"any"},"opt":false}],
  inner$buildApp$lines: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildApp$lines$$step: [{"name":"allLines","d":{"t":"any"},"opt":false}],
  inner$buildApp$isEntity: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$buildApp$entNames: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$sysSpecs: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$sysSpecs$$step: [{"name":"entNames","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$spec: [{"name":"sl","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$buildApp$sub: [{"name":"s","d":{"t":"or","of":[{"t":"obj","p":[["slug",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["spec",{"t":"str"},false],["schema",{"t":"arr","of":{"t":"obj","p":[["label",{"t":"any"},false],["type",{"t":"str"},false],["required",{"t":"bool"},false],["unique",{"t":"bool"},false],["enumVals",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},false],["formula",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["def",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["members",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},false],["pattern",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["range",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["min",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["max",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false]]}]},false]]}},false],["stages",{"t":"arr","of":{"t":"str"}},false],["atoms",{"t":"undef"},true]]},{"t":"obj","p":[["slug",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"str"},false],["spec",{"t":"str"},false],["atoms",{"t":"num"},false],["schema",{"t":"undef"},true],["stages",{"t":"undef"},true]]}]},"opt":false}],
  inner$buildApp$hubSpec: [{"name":"hubLines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$buildApp$roles: [{"name":"specText","d":{"t":"any"},"opt":false},{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$roles$$step: [{"name":"roleLines","d":{"t":"any"},"opt":false},{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildApp$map$rn: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$allow: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$role: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$role$$step: [{"name":"rn","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$all: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$all$$step: [{"name":"allow","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$allowed: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$buildApp$map$allowed$$step: [{"name":"screens","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"allow","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"bool"},"opt":false}],
};
