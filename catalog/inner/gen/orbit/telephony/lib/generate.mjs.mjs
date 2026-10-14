// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/generate.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const XML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => XML_ESC[c]);
}
function voiceNumbers(tenant) {
    return tenant.numbers.filter((n) => n.channels.includes('voice') && n.onramp !== 'device-link');
}
const HHMM_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const hhmmMin = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
function outboundSims(tenant) {
    return tenant.numbers
        .filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
        .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
}
export function inner$daysToWday$w(days) {
    const w = days.map((d) => d + 1).sort((a, b) => a - b);
    return w;
}
export function inner$fsTime$h(hhmm) {
    const [h, m] = hhmm.split(':');
    return h;
}
export function inner$fsTime$m(hhmm) {
    const [h, m] = hhmm.split(':');
    return m;
}
export function inner$hhmmMin$h(s) {
    const [h, m] = String(s).split(':').map(Number);
    return h;
}
export function inner$hhmmMin$m(s) {
    const [h, m] = String(s).split(':').map(Number);
    return m;
}
export function inner$windowsFor$friEnd(friEndRaw) {
    const friEnd = HHMM_RE.test(friEndRaw) ? friEndRaw : '15:00';
    return friEnd;
}
export function inner$windowsFor$nonSh(oh) {
    const nonSh = oh.days.filter((d) => d !== 5 && d !== 6);
    return nonSh;
}
export function inner$windowsFor$cap(oh, friEndRaw) {
    const friEnd = HHMM_RE.test(friEndRaw) ? friEndRaw : '15:00';
    const cap = hhmmMin(friEnd) < hhmmMin(oh.end) ? friEnd : oh.end;
    return cap;
}
export function inner$windowsFor$cap$$step(oh, friEnd) {
    const cap = hhmmMin(friEnd) < hhmmMin(oh.end) ? friEnd : oh.end;
    return cap;
}
export function inner$dialplanXml$ctx(tenant) {
    const ctx = `tenant_${tenant.tenantId}`;
    return ctx;
}
export function inner$dialplanXml$gw(tenant) {
    const gw = `${tenant.tenantId}-gw`;
    return gw;
}
export function inner$dialplanXml$vnums(tenant) {
    const vnums = voiceNumbers(tenant);
    return vnums;
}
export function inner$dialplanXml$sims(tenant) {
    const sims = outboundSims(tenant);
    return sims;
}
export function inner$dialplanXml$ringSep(tenant) {
    const R = tenant.routing || {};
    const ringSep = R.ringStrategy === 'sequential' ? '|' : R.ringStrategy === 'enterprise' ? ':_:' : ',';
    return ringSep;
}
export function inner$dialplanXml$ringSep$$step(R) {
    const ringSep = R.ringStrategy === 'sequential' ? '|' : R.ringStrategy === 'enterprise' ? ':_:' : ',';
    return ringSep;
}
export function inner$dialplanXml$officeBridge(tenant, office) {
    const R = tenant.routing || {};
    const ringSep = R.ringStrategy === 'sequential' ? '|' : R.ringStrategy === 'enterprise' ? ':_:' : ',';
    const officeBridge = office.ext
        .map((e) => `user/${esc(e)}@${esc(tenant.tenantId)}`)
        .join(ringSep);
    return officeBridge;
}
export function inner$dialplanXml$officeBridge$$step(tenant, office, ringSep) {
    const officeBridge = office.ext
        .map((e) => `user/${esc(e)}@${esc(tenant.tenantId)}`)
        .join(ringSep);
    return officeBridge;
}
export function inner$dialplanXml$yt(w) {
    const yt = w.kind === 'yomtov';
    return yt;
}
export function inner$dialplanXml$entryActions$hasHours(n) {
    const hasHours = n.hours && Array.isArray(n.hours.days) && n.hours.start && n.hours.end;
    return hasHours;
}
export function inner$dialplanXml$dst(n) {
    const dst = `destination_number" expression="^line_${esc(n.id)}$`;
    return dst;
}
export function inner$dialplanXml$qAnnounce(tenant, pdir) {
    const R = tenant.routing || {};
    const qAnnounce = R.queue.announcePosition ? `${pdir}/queue-position.wav` : 'undef';
    return qAnnounce;
}
export function inner$dialplanXml$qAnnounce$$step(R, pdir) {
    const qAnnounce = R.queue.announcePosition ? `${pdir}/queue-position.wav` : 'undef';
    return qAnnounce;
}
export function inner$dialplanXml$pickSims(tenant, kosherMode) {
    const sims = outboundSims(tenant);
    const pickSims = kosherMode ? sims.filter((n) => n.kosher) : sims;
    return pickSims;
}
export function inner$dialplanXml$pickSims$$step(sims, kosherMode) {
    const pickSims = kosherMode ? sims.filter((n) => n.kosher) : sims;
    return pickSims;
}
export function inner$dialplanXml$def(tenant, kosherMode) {
    const sims = outboundSims(tenant);
    const pickSims = kosherMode ? sims.filter((n) => n.kosher) : sims;
    const def = kosherMode
        ? (pickSims.find((n) => n.id === tenant.outbound.defaultNumberId) || pickSims[0])
        : (sims.find((n) => n.id === tenant.outbound.defaultNumberId) || sims[0]);
    return def;
}
export function inner$dialplanXml$def$$step(tenant, sims, kosherMode, pickSims) {
    const def = kosherMode
        ? (pickSims.find((n) => n.id === tenant.outbound.defaultNumberId) || pickSims[0])
        : (sims.find((n) => n.id === tenant.outbound.defaultNumberId) || sims[0]);
    return def;
}
export function inner$dialplanXml$maxConc(tenant) {
    const sims = outboundSims(tenant);
    const sec = tenant.security || {};
    const maxConc = Number.isInteger(sec.maxConcurrentOut) && sec.maxConcurrentOut > 0 ? sec.maxConcurrentOut : Math.max(1, sims.length);
    return maxConc;
}
export function inner$dialplanXml$maxConc$$step(sims, sec) {
    const maxConc = Number.isInteger(sec.maxConcurrentOut) && sec.maxConcurrentOut > 0 ? sec.maxConcurrentOut : Math.max(1, sims.length);
    return maxConc;
}
export function inner$dialplanXml$maxCallSec(tenant) {
    const sec = tenant.security || {};
    const maxCallSec = Number.isInteger(sec.maxCallSec) && sec.maxCallSec > 0 ? sec.maxCallSec : 3600;
    return maxCallSec;
}
export function inner$dialplanXml$maxCallSec$$step(sec) {
    const maxCallSec = Number.isInteger(sec.maxCallSec) && sec.maxCallSec > 0 ? sec.maxCallSec : 3600;
    return maxCallSec;
}
export function inner$dialplanXml$fbSims(tenant, kosherMode) {
    const sims = outboundSims(tenant);
    const pickSims = kosherMode ? sims.filter((n) => n.kosher) : sims;
    const def = kosherMode
        ? (pickSims.find((n) => n.id === tenant.outbound.defaultNumberId) || pickSims[0])
        : (sims.find((n) => n.id === tenant.outbound.defaultNumberId) || sims[0]);
    const fbSims = (tenant.outbound.failover || [])
        .map((id) => sims.find((n) => n.id === id))
        .filter((n) => n && (!kosherMode || n.kosher) && n.id !== def.id);
    return fbSims;
}
export function inner$dialplanXml$fbSims$$step(tenant, sims, kosherMode, def) {
    const fbSims = (tenant.outbound.failover || [])
        .map((id) => sims.find((n) => n.id === id))
        .filter((n) => n && (!kosherMode || n.kosher) && n.id !== def.id);
    return fbSims;
}
export function inner$dialplanXml$digits(tenant) {
    const R = tenant.routing || {};
    const digits = R.ivr.options.map((o) => o.digit).join('');
    return digits;
}
export function inner$dialplanXml$digits$$step(R) {
    const digits = R.ivr.options.map((o) => o.digit).join('');
    return digits;
}
export function inner$dialplanXml$sd(tenant) {
    const sd = `$\${sounds_dir}/ivr/${esc(tenant.tenantId)}`;
    return sd;
}
export function inner$dialplanXml$ivrExts(tenant) {
    const R = tenant.routing || {};
    const ivrExts = R.ivr ? R.ivr.options.flatMap((o) => (o.dest.type === 'ext' ? [o.dest.value] : o.dest.type === 'ringgroup' ? o.dest.value : [])) : [];
    return ivrExts;
}
export function inner$dialplanXml$ivrExts$$step(R) {
    const ivrExts = R.ivr ? R.ivr.options.flatMap((o) => (o.dest.type === 'ext' ? [o.dest.value] : o.dest.type === 'ringgroup' ? o.dest.value : [])) : [];
    return ivrExts;
}
export function inner$dialplanXml$allExts(tenant, office, manager) {
    const R = tenant.routing || {};
    const ivrExts = R.ivr ? R.ivr.options.flatMap((o) => (o.dest.type === 'ext' ? [o.dest.value] : o.dest.type === 'ringgroup' ? o.dest.value : [])) : [];
    const allExts = [...new Set([...office.ext, manager.ext, ...(R.overflow || []), ...ivrExts, ...(R.priority && R.priority.ext ? [R.priority.ext] : []), ...(tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [])])].filter((e) => /^[0-9]+$/.test(e));
    return allExts;
}
export function inner$dialplanXml$allExts$$step(tenant, office, manager, R, ivrExts) {
    const allExts = [...new Set([...office.ext, manager.ext, ...(R.overflow || []), ...ivrExts, ...(R.priority && R.priority.ext ? [R.priority.ext] : []), ...(tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [])])].filter((e) => /^[0-9]+$/.test(e));
    return allExts;
}
export function inner$dialplanXml$gctx(tenant, n) {
    const gctx = `tenant_${tenant.tenantId}_gw${n.gatewayChannel}`;
    return gctx;
}
export function inner$destActions$dom(tenant) {
    const dom = esc(tenant.tenantId);
    return dom;
}
export function inner$directoryXml$priorityExt(tenant) {
    const R = tenant.routing || {};
    const priorityExt = R.priority && R.priority.ext ? [R.priority.ext] : [];
    return priorityExt;
}
export function inner$directoryXml$priorityExt$$step(R) {
    const priorityExt = R.priority && R.priority.ext ? [R.priority.ext] : [];
    return priorityExt;
}
export function inner$directoryXml$mourningExt(tenant) {
    const mourningExt = tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [];
    return mourningExt;
}
export function inner$directoryXml$users(tenant, office, manager, vm, ivrExts) {
    const R = tenant.routing || {};
    const priorityExt = R.priority && R.priority.ext ? [R.priority.ext] : [];
    const mourningExt = tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [];
    const exts = [...new Set([...office.ext, manager.ext, ...(R.overflow || []), ...ivrExts, ...priorityExt, ...mourningExt])];
    const users = [...exts, ...(exts.includes(vm.box) ? [] : [vm.box])];
    return users;
}
export function inner$directoryXml$users$$step(vm, exts) {
    const users = [...exts, ...(exts.includes(vm.box) ? [] : [vm.box])];
    return users;
}
export function inner$directoryXml$isManager(manager, ext) {
    const isManager = ext === manager.ext;
    return isManager;
}
export function inner$directoryXml$isVmBox(tenant, office, manager, vm, ivrExts, ext) {
    const R = tenant.routing || {};
    const priorityExt = R.priority && R.priority.ext ? [R.priority.ext] : [];
    const mourningExt = tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [];
    const exts = [...new Set([...office.ext, manager.ext, ...(R.overflow || []), ...ivrExts, ...priorityExt, ...mourningExt])];
    const isVmBox = ext === vm.box && !exts.includes(vm.box);
    return isVmBox;
}
export function inner$directoryXml$isVmBox$$step(vm, exts, ext) {
    const isVmBox = ext === vm.box && !exts.includes(vm.box);
    return isVmBox;
}
export function inner$directoryXml$vmMail(tenant, office, manager, vm, ivrExts, ext) {
    const R = tenant.routing || {};
    const priorityExt = R.priority && R.priority.ext ? [R.priority.ext] : [];
    const mourningExt = tenant.mourning && tenant.mourning.ext ? [tenant.mourning.ext] : [];
    const exts = [...new Set([...office.ext, manager.ext, ...(R.overflow || []), ...ivrExts, ...priorityExt, ...mourningExt])];
    const isManager = ext === manager.ext;
    const isVmBox = ext === vm.box && !exts.includes(vm.box);
    const vmMail = isManager || isVmBox ? vm.email : office.ext.includes(ext) ? office.email : undefined;
    return vmMail;
}
export function inner$directoryXml$vmMail$$step(office, vm, ext, isManager, isVmBox) {
    const vmMail = isManager || isVmBox ? vm.email : office.ext.includes(ext) ? office.email : undefined;
    return vmMail;
}
export function inner$gatewaysXml$gw(tenant) {
    const gw = `${tenant.tenantId}-gw`;
    return gw;
}
export function inner$gatewaysXml$sims(tenant) {
    const sims = outboundSims(tenant);
    return sims;
}
export function inner$manifest$vnums(tenant) {
    const vnums = voiceNumbers(tenant);
    return vnums;
}
export function inner$manifest$sims(tenant) {
    const sims = outboundSims(tenant);
    return sims;
}
export function inner$manifest$pickS(tenant, kMode) {
    const sims = outboundSims(tenant);
    const pickS = kMode ? sims.filter((n) => n.kosher) : sims;
    return pickS;
}
export function inner$manifest$pickS$$step(sims, kMode) {
    const pickS = kMode ? sims.filter((n) => n.kosher) : sims;
    return pickS;
}
export function inner$manifest$defSim(tenant, kMode) {
    const sims = outboundSims(tenant);
    const pickS = kMode ? sims.filter((n) => n.kosher) : sims;
    const defId = tenant.outbound && tenant.outbound.defaultNumberId;
    const defSim = kMode ? (pickS.find((n) => n.id === defId) || pickS[0]) : (sims.find((n) => n.id === defId) || sims[0]);
    return defSim;
}
export function inner$manifest$defSim$$step(sims, kMode, pickS, defId) {
    const defSim = kMode ? (pickS.find((n) => n.id === defId) || pickS[0]) : (sims.find((n) => n.id === defId) || sims[0]);
    return defSim;
}
export function inner$manifest$skipped(tenant) {
    const skipped = tenant.numbers.filter((n) => n.onramp === 'device-link' || !n.channels.includes('voice'));
    return skipped;
}
export function inner$daysToWday$parts$$after_loop(days) {
    const w = days.map((d) => d + 1).sort((a, b) => a - b);
    const parts = [];
    let start = w[0];
    let prev = w[0];
    for (let i = 1; i <= w.length; i++) {
        if (i < w.length && w[i] === prev + 1) {
            prev = w[i];
            continue;
        }
        parts.push(start === prev ? `${start}` : `${start}-${prev}`);
        if (i < w.length) {
            start = w[i];
            prev = w[i];
        }
    }
    return parts;
}
export function inner$daysToWday$start$$after_loop(days) {
    const w = days.map((d) => d + 1).sort((a, b) => a - b);
    const parts = [];
    let start = w[0];
    let prev = w[0];
    for (let i = 1; i <= w.length; i++) {
        if (i < w.length && w[i] === prev + 1) {
            prev = w[i];
            continue;
        }
        parts.push(start === prev ? `${start}` : `${start}-${prev}`);
        if (i < w.length) {
            start = w[i];
            prev = w[i];
        }
    }
    return start;
}
export function inner$daysToWday$prev$$after_loop(days) {
    const w = days.map((d) => d + 1).sort((a, b) => a - b);
    const parts = [];
    let start = w[0];
    let prev = w[0];
    for (let i = 1; i <= w.length; i++) {
        if (i < w.length && w[i] === prev + 1) {
            prev = w[i];
            continue;
        }
        parts.push(start === prev ? `${start}` : `${start}-${prev}`);
        if (i < w.length) {
            start = w[i];
            prev = w[i];
        }
    }
    return prev;
}

export const SIGS = {
  inner$daysToWday$w: [{"name":"days","d":{"t":"any"},"opt":false}],
  inner$fsTime$h: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$fsTime$m: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$hhmmMin$h: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$hhmmMin$m: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$windowsFor$friEnd: [{"name":"friEndRaw","d":{"t":"any"},"opt":false}],
  inner$windowsFor$nonSh: [{"name":"oh","d":{"t":"any"},"opt":false}],
  inner$windowsFor$cap: [{"name":"oh","d":{"t":"any"},"opt":false},{"name":"friEndRaw","d":{"t":"any"},"opt":false}],
  inner$windowsFor$cap$$step: [{"name":"oh","d":{"t":"any"},"opt":false},{"name":"friEnd","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$ctx: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$gw: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$vnums: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$sims: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$ringSep: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$ringSep$$step: [{"name":"R","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$officeBridge: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"office","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$officeBridge$$step: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"office","d":{"t":"any"},"opt":false},{"name":"ringSep","d":{"t":"lit","v":[",","|",":_:"]},"opt":false}],
  inner$dialplanXml$yt: [{"name":"w","d":{"t":"obj","p":[["startIso",{"t":"any"},false],["startTime",{"t":"any"},false],["endIso",{"t":"any"},false],["endTime",{"t":"any"},false],["reason",{"t":"any"},false],["kind",{"t":"any"},false],["days",{"t":"any"},false]]},"opt":false}],
  inner$dialplanXml$entryActions$hasHours: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$dst: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$qAnnounce: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"pdir","d":{"t":"str"},"opt":false}],
  inner$dialplanXml$qAnnounce$$step: [{"name":"R","d":{"t":"any"},"opt":false},{"name":"pdir","d":{"t":"str"},"opt":false}],
  inner$dialplanXml$pickSims: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false}],
  inner$dialplanXml$pickSims$$step: [{"name":"sims","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false}],
  inner$dialplanXml$def: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false}],
  inner$dialplanXml$def$$step: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"sims","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false},{"name":"pickSims","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$maxConc: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$maxConc$$step: [{"name":"sims","d":{"t":"any"},"opt":false},{"name":"sec","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$maxCallSec: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$maxCallSec$$step: [{"name":"sec","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$fbSims: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false}],
  inner$dialplanXml$fbSims$$step: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"sims","d":{"t":"any"},"opt":false},{"name":"kosherMode","d":{"t":"bool"},"opt":false},{"name":"def","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$digits: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$digits$$step: [{"name":"R","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$sd: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$ivrExts: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$ivrExts$$step: [{"name":"R","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$allExts: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"office","d":{"t":"any"},"opt":false},{"name":"manager","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$allExts$$step: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"office","d":{"t":"any"},"opt":false},{"name":"manager","d":{"t":"any"},"opt":false},{"name":"R","d":{"t":"any"},"opt":false},{"name":"ivrExts","d":{"t":"any"},"opt":false}],
  inner$dialplanXml$gctx: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$destActions$dom: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$directoryXml$priorityExt: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$directoryXml$priorityExt$$step: [{"name":"R","d":{"t":"any"},"opt":false}],
  inner$directoryXml$mourningExt: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$directoryXml$users: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"office","d":{"t":"any"},"opt":false},{"name":"manager","d":{"t":"any"},"opt":false},{"name":"vm","d":{"t":"any"},"opt":false},{"name":"ivrExts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$directoryXml$users$$step: [{"name":"vm","d":{"t":"any"},"opt":false},{"name":"exts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$directoryXml$isManager: [{"name":"manager","d":{"t":"any"},"opt":false},{"name":"ext","d":{"t":"any"},"opt":false}],
  inner$directoryXml$isVmBox: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"office","d":{"t":"any"},"opt":false},{"name":"manager","d":{"t":"any"},"opt":false},{"name":"vm","d":{"t":"any"},"opt":false},{"name":"ivrExts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ext","d":{"t":"any"},"opt":false}],
  inner$directoryXml$isVmBox$$step: [{"name":"vm","d":{"t":"any"},"opt":false},{"name":"exts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ext","d":{"t":"any"},"opt":false}],
  inner$directoryXml$vmMail: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"office","d":{"t":"any"},"opt":false},{"name":"manager","d":{"t":"any"},"opt":false},{"name":"vm","d":{"t":"any"},"opt":false},{"name":"ivrExts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ext","d":{"t":"any"},"opt":false}],
  inner$directoryXml$vmMail$$step: [{"name":"office","d":{"t":"any"},"opt":false},{"name":"vm","d":{"t":"any"},"opt":false},{"name":"ext","d":{"t":"any"},"opt":false},{"name":"isManager","d":{"t":"bool"},"opt":false},{"name":"isVmBox","d":{"t":"bool"},"opt":false}],
  inner$gatewaysXml$gw: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$gatewaysXml$sims: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$manifest$vnums: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$manifest$sims: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$manifest$pickS: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"kMode","d":{"t":"bool"},"opt":false}],
  inner$manifest$pickS$$step: [{"name":"sims","d":{"t":"any"},"opt":false},{"name":"kMode","d":{"t":"bool"},"opt":false}],
  inner$manifest$defSim: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"kMode","d":{"t":"bool"},"opt":false}],
  inner$manifest$defSim$$step: [{"name":"sims","d":{"t":"any"},"opt":false},{"name":"kMode","d":{"t":"bool"},"opt":false},{"name":"pickS","d":{"t":"any"},"opt":false},{"name":"defId","d":{"t":"any"},"opt":false}],
  inner$manifest$skipped: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$daysToWday$parts$$after_loop: [{"name":"days","d":{"t":"any"},"opt":false}],
  inner$daysToWday$start$$after_loop: [{"name":"days","d":{"t":"any"},"opt":false}],
  inner$daysToWday$prev$$after_loop: [{"name":"days","d":{"t":"any"},"opt":false}],
};
