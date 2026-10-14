// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/audit-routes.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function allMatches(str, re) {
    const out = [];
    for (const m of String(str || '').matchAll(re))
        out.push(m[1]);
    return out;
}
export function inner$auditRoutes$dialplan(bundle) {
    const files = (bundle && bundle.files) || {};
    const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
    return dialplan;
}
export function inner$auditRoutes$dialplan$$step(files) {
    const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
    return dialplan;
}
export function inner$auditRoutes$directory(bundle) {
    const files = (bundle && bundle.files) || {};
    const directory = Object.entries(files).find(([p]) => p.startsWith('directory/'));
    return directory;
}
export function inner$auditRoutes$directory$$step(files) {
    const directory = Object.entries(files).find(([p]) => p.startsWith('directory/'));
    return directory;
}
export function inner$auditRoutes$gateways(bundle) {
    const files = (bundle && bundle.files) || {};
    const gateways = Object.entries(files).find(([p]) => p.startsWith('sip_profiles/gateways/'));
    return gateways;
}
export function inner$auditRoutes$gateways$$step(files) {
    const gateways = Object.entries(files).find(([p]) => p.startsWith('sip_profiles/gateways/'));
    return gateways;
}
export function inner$auditRoutes$dp(bundle) {
    const files = (bundle && bundle.files) || {};
    const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
    const dp = dialplan ? dialplan[1] : '';
    return dp;
}
export function inner$auditRoutes$dp$$step(dialplan) {
    const dp = dialplan ? dialplan[1] : '';
    return dp;
}
export function inner$auditRoutes$dir(bundle) {
    const files = (bundle && bundle.files) || {};
    const directory = Object.entries(files).find(([p]) => p.startsWith('directory/'));
    const dir = directory ? directory[1] : '';
    return dir;
}
export function inner$auditRoutes$dir$$step(directory) {
    const dir = directory ? directory[1] : '';
    return dir;
}
export function inner$auditRoutes$gw(bundle) {
    const files = (bundle && bundle.files) || {};
    const gateways = Object.entries(files).find(([p]) => p.startsWith('sip_profiles/gateways/'));
    const gw = gateways ? gateways[1] : '';
    return gw;
}
export function inner$auditRoutes$gw$$step(gateways) {
    const gw = gateways ? gateways[1] : '';
    return gw;
}
export function inner$auditRoutes$userIds(bundle) {
    const files = (bundle && bundle.files) || {};
    const directory = Object.entries(files).find(([p]) => p.startsWith('directory/'));
    const dir = directory ? directory[1] : '';
    const userIds = new Set(allMatches(dir, /<user id="([A-Za-z0-9_]+)"/g));
    return userIds;
}
export function inner$auditRoutes$userIds$$step(dir) {
    const userIds = new Set(allMatches(dir, /<user id="([A-Za-z0-9_]+)"/g));
    return userIds;
}
export function inner$auditRoutes$gatewayNames(bundle) {
    const files = (bundle && bundle.files) || {};
    const gateways = Object.entries(files).find(([p]) => p.startsWith('sip_profiles/gateways/'));
    const gw = gateways ? gateways[1] : '';
    const gatewayNames = new Set(allMatches(gw, /<gateway name="([A-Za-z0-9_]+)"/g));
    return gatewayNames;
}
export function inner$auditRoutes$gatewayNames$$step(gw) {
    const gatewayNames = new Set(allMatches(gw, /<gateway name="([A-Za-z0-9_]+)"/g));
    return gatewayNames;
}
export function inner$auditRoutes$reachable(bundle) {
    const files = (bundle && bundle.files) || {};
    const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
    const dp = dialplan ? dialplan[1] : '';
    const reachable = new Set(allMatches(dp, /field="destination_number" expression="\^([A-Za-z0-9_]+)\$"/g));
    return reachable;
}
export function inner$auditRoutes$reachable$$step(dp) {
    const reachable = new Set(allMatches(dp, /field="destination_number" expression="\^([A-Za-z0-9_]+)\$"/g));
    return reachable;
}
export function inner$allMatches$out$$after_loop(str, re) {
    const out = [];
    for (const m of String(str || '').matchAll(re))
        out.push(m[1]);
    return out;
}
export function inner$auditRoutes$dangling$$after_loop(bundle) {
    const files = (bundle && bundle.files) || {};
    const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
    const directory = Object.entries(files).find(([p]) => p.startsWith('directory/'));
    const dp = dialplan ? dialplan[1] : '';
    const dir = directory ? directory[1] : '';
    const userIds = new Set(allMatches(dir, /<user id="([A-Za-z0-9_]+)"/g));
    const dangling = [];
    for (const ext of allMatches(dp, /user\/([A-Za-z0-9_]+)@/g)) {
        if (!userIds.has(ext) && !dangling.includes(ext))
            dangling.push(ext);
    }
    return dangling;
}
export function inner$auditRoutes$orphanTransfers$$after_loop(bundle) {
    const files = (bundle && bundle.files) || {};
    const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
    const dp = dialplan ? dialplan[1] : '';
    const reachable = new Set(allMatches(dp, /field="destination_number" expression="\^([A-Za-z0-9_]+)\$"/g));
    const orphanTransfers = [];
    for (const label of allMatches(dp, /data="([A-Za-z0-9_]+) XML tenant_/g)) {
        if (!reachable.has(label) && !orphanTransfers.includes(label))
            orphanTransfers.push(label);
    }
    return orphanTransfers;
}
export function inner$auditRoutes$missingGateways$$after_loop(bundle) {
    const files = (bundle && bundle.files) || {};
    const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
    const gateways = Object.entries(files).find(([p]) => p.startsWith('sip_profiles/gateways/'));
    const dp = dialplan ? dialplan[1] : '';
    const gw = gateways ? gateways[1] : '';
    const gatewayNames = new Set(allMatches(gw, /<gateway name="([A-Za-z0-9_]+)"/g));
    const missingGateways = [];
    for (const g of allMatches(dp, /sofia\/gateway\/([A-Za-z0-9_]+)\//g)) {
        if (!gatewayNames.has(g) && !missingGateways.includes(g))
            missingGateways.push(g);
    }
    return missingGateways;
}

export const SIGS = {
  inner$auditRoutes$dialplan: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$dialplan$$step: [{"name":"files","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
  inner$auditRoutes$directory: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$directory$$step: [{"name":"files","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
  inner$auditRoutes$gateways: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$gateways$$step: [{"name":"files","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
  inner$auditRoutes$dp: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$dp$$step: [{"name":"dialplan","d":{"t":"or","of":[{"t":"undef"},{"t":"tup","of":[{"t":"str"},{"t":"str"}]}]},"opt":false}],
  inner$auditRoutes$dir: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$dir$$step: [{"name":"directory","d":{"t":"or","of":[{"t":"undef"},{"t":"tup","of":[{"t":"str"},{"t":"str"}]}]},"opt":false}],
  inner$auditRoutes$gw: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$gw$$step: [{"name":"gateways","d":{"t":"or","of":[{"t":"undef"},{"t":"tup","of":[{"t":"str"},{"t":"str"}]}]},"opt":false}],
  inner$auditRoutes$userIds: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$userIds$$step: [{"name":"dir","d":{"t":"str"},"opt":false}],
  inner$auditRoutes$gatewayNames: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$gatewayNames$$step: [{"name":"gw","d":{"t":"str"},"opt":false}],
  inner$auditRoutes$reachable: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$reachable$$step: [{"name":"dp","d":{"t":"str"},"opt":false}],
  inner$allMatches$out$$after_loop: [{"name":"str","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$auditRoutes$dangling$$after_loop: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$orphanTransfers$$after_loop: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$auditRoutes$missingGateways$$after_loop: [{"name":"bundle","d":{"t":"obj","p":[["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
};
