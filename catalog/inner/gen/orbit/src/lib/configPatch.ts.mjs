// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/configPatch.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CONFIG_MAP_FIELDS = ['features', 'modules', 'terms', 'integrations', 'templates', 'roles', 'telephony'];
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const isMap = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
export function inner$configPatchOps$keys(prev, n) {
    const p = (prev ?? {});
    const keys = new Set([...Object.keys(p), ...Object.keys(n)]);
    return keys;
}
export function inner$configPatchOps$keys$$step(p, n) {
    const keys = new Set([...Object.keys(p), ...Object.keys(n)]);
    return keys;
}
export function inner$configPatchOps$pm(pv) {
    const pm = isMap(pv) ? pv : {};
    return pm;
}
export function inner$configPatchOps$nm(nv) {
    const nm = isMap(nv) ? nv : {};
    return nm;
}
export function inner$configPatchOps$mkeys(pv, nv) {
    const pm = isMap(pv) ? pv : {};
    const nm = isMap(nv) ? nv : {};
    const mkeys = new Set([...Object.keys(pm), ...Object.keys(nm)]);
    return mkeys;
}
export function inner$configPatchOps$mkeys$$step(pm, nm) {
    const mkeys = new Set([...Object.keys(pm), ...Object.keys(nm)]);
    return mkeys;
}
export function inner$applyConfigPatch$out(base) {
    const out = JSON.parse(JSON.stringify(base));
    return out;
}
export function inner$applyConfigPatch$m(out, mapKey) {
    const m = isMap(out[mapKey]) ? out[mapKey] : {};
    return m;
}
export function inner$configPatchOps$ops$$after_loop(prev, n) {
    const ops = [];
    const p = (prev ?? {});
    const keys = new Set([...Object.keys(p), ...Object.keys(n)]);
    for (const k of [...keys].sort()) {
        if (k === 'slug')
            continue; // ה-slug = הכתובת; לא נכתב מהאשף
        const pv = p[k];
        const nv = n[k];
        if (CONFIG_MAP_FIELDS.includes(k) && (isMap(pv) || isMap(nv))) {
            const pm = isMap(pv) ? pv : {};
            const nm = isMap(nv) ? nv : {};
            if (!isMap(nv) && prev !== null && isMap(pv)) {
                // המפה כולה הוסרה (נדיר) — מוחקים כל מפתח שהיה, לא את המפה (שומר על תאימות קוראים)
                for (const mk of Object.keys(pm).sort())
                    ops.push({ path: [k, mk], del: true });
                continue;
            }
            const mkeys = new Set([...Object.keys(pm), ...Object.keys(nm)]);
            for (const mk of [...mkeys].sort()) {
                const a = pm[mk];
                const b = nm[mk];
                if (!(mk in nm)) {
                    if (prev !== null)
                        ops.push({ path: [k, mk], del: true });
                }
                else if (prev === null || !same(a, b))
                    ops.push({ path: [k, mk], value: b });
            }
            continue;
        }
        if (!(k in n) || nv === undefined) {
            if (prev !== null && k in p)
                ops.push({ path: [k], del: true });
        }
        else if (prev === null || !same(pv, nv))
            ops.push({ path: [k], value: nv });
    }
    return ops;
}
export function inner$applyConfigPatch$out$$after_loop(base, ops) {
    const out = JSON.parse(JSON.stringify(base));
    for (const op of ops) {
        if (op.path.length === 1) {
            if (op.del)
                delete out[op.path[0]];
            else
                out[op.path[0]] = JSON.parse(JSON.stringify(op.value ?? null));
            continue;
        }
        const [mapKey, k] = op.path;
        const m = isMap(out[mapKey]) ? out[mapKey] : {};
        if (op.del)
            delete m[k];
        else
            m[k] = JSON.parse(JSON.stringify(op.value ?? null));
        out[mapKey] = m;
    }
    return out;
}

export const SIGS = {
  inner$configPatchOps$keys: [{"name":"prev","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},"opt":false},{"name":"n","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$configPatchOps$keys$$step: [{"name":"p","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$configPatchOps$pm: [{"name":"pv","d":{"t":"any"},"opt":false}],
  inner$configPatchOps$nm: [{"name":"nv","d":{"t":"any"},"opt":false}],
  inner$configPatchOps$mkeys: [{"name":"pv","d":{"t":"any"},"opt":false},{"name":"nv","d":{"t":"any"},"opt":false}],
  inner$configPatchOps$mkeys$$step: [{"name":"pm","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"nm","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$applyConfigPatch$out: [{"name":"base","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$applyConfigPatch$m: [{"name":"out","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"mapKey","d":{"t":"str"},"opt":false}],
  inner$configPatchOps$ops$$after_loop: [{"name":"prev","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},"opt":false},{"name":"n","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$applyConfigPatch$out$$after_loop: [{"name":"base","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"ops","d":{"t":"arr","of":{"t":"obj","n":"ConfigPatchOp","p":[["path",{"t":"arr","of":{"t":"str"}},false],["value",{"t":"any"},true],["del",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true]]}},"opt":false}],
};
