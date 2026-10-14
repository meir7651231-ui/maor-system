// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/apply.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function planApply(current = {}, desired = {}) {
    const creates = [];
    const updates = [];
    const unchanged = [];
    const deletes = [];
    for (const [p, content] of Object.entries(desired)) {
        if (!(p in current))
            creates.push(p);
        else if (current[p] !== content)
            updates.push(p);
        else
            unchanged.push(p);
    }
    for (const p of Object.keys(current)) {
        if (!(p in desired))
            deletes.push(p);
    }
    creates.sort();
    updates.sort();
    unchanged.sort();
    deletes.sort();
    const changed = creates.length + updates.length + deletes.length > 0;
    return { creates, updates, deletes, unchanged, changed };
}
function secretBreaks(name) {
    if (name.startsWith('GSM_'))
        return 'gateway';
    if (name.startsWith('VM_PW__'))
        return 'voicemail';
    if (name.startsWith('REC_KEY'))
        return 'recording';
    if (/^PROVISION_PW__[^_]+(?:-[^_]+)*__/.test(name))
        return 'ext-auth';
    if (name.startsWith('PROVISION_PW__'))
        return 'provision';
    return 'other';
}
const inV = (m) => Array.isArray(m.inboundVoiceNumbers) ? m.inboundVoiceNumbers : [];
const outS = (m) => Array.isArray(m.outboundSims) ? m.outboundSims : [];
const ident = (n) => `${n.e164}:${n.channel}`;
const sig = (m) => outS(m).map((n) => `${n.id}:${ident(n)}`).sort().join('|');
export function inner$planApply$changed(creates, updates, deletes) {
    const changed = creates.length + updates.length + deletes.length > 0;
    return changed;
}
export function inner$planTenants$plan(currentByTenant, t) {
    const cur = currentByTenant[t.tenantId] || {};
    const plan = planApply(cur, t.desired);
    return plan;
}
export function inner$planTenants$plan$$step(t, cur) {
    const plan = planApply(cur, t.desired);
    return plan;
}
export function inner$pushSnapshot$h(history, snap) {
    const h = [...(Array.isArray(history) ? history : []), snap];
    return h;
}
export function inner$restoreFrom$s(history, version) {
    const s = (history || []).find((x) => x.version === version);
    return s;
}
export function inner$reloadPlan$sipDelUpd(plan) {
    const sipDelUpd = [...(plan.deletes || []), ...(plan.updates || [])].some((p) => p.startsWith('sip_profiles/'));
    return sipDelUpd;
}
export function inner$reloadPlan$sipCreate(plan) {
    const sipCreate = (plan.creates || []).some((p) => p.startsWith('sip_profiles/'));
    return sipCreate;
}
export function inner$healthReport$worst(items) {
    const worst = items.some((i) => i.level === 'critical') ? 'critical' : items.some((i) => i.level === 'warn') ? 'warn' : 'ok';
    return worst;
}
export function inner$pushAudit$l(log, entry) {
    const l = [...(Array.isArray(log) ? log : []), entry];
    return l;
}
export function inner$migrationRisk$pById(prev) {
    const pById = new Map(outS(prev).map((n) => [n.id, ident(n)]));
    return pById;
}
export function inner$migrationRisk$survivorSwapped(prev, next) {
    const pById = new Map(outS(prev).map((n) => [n.id, ident(n)]));
    const survivorSwapped = outS(next).some((n) => pById.has(n.id) && pById.get(n.id) !== ident(n));
    return survivorSwapped;
}
export function inner$migrationRisk$survivorSwapped$$step(next, pById) {
    const survivorSwapped = outS(next).some((n) => pById.has(n.id) && pById.get(n.id) !== ident(n));
    return survivorSwapped;
}
export function inner$migrationRisk$equalCountSwap(prev, next) {
    const equalCountSwap = outS(next).length === outS(prev).length && sig(prev) && sig(prev) !== sig(next);
    return equalCountSwap;
}
export function inner$migrationRisk$removed(prev, next) {
    const removed = inV(prev).filter((p) => !inV(next).some((n) => n.id === p.id));
    return removed;
}
export function inner$applyWithRollback$plan(current, desired) {
    const plan = planApply(current, desired);
    return plan;
}
export function inner$lineDiff$a(aStr) {
    const a = String(aStr || '').split('\n');
    return a;
}
export function inner$lineDiff$b(bStr) {
    const b = String(bStr || '').split('\n');
    return b;
}
export function inner$lineDiff$i(n) {
    let i = n - 1;
    return i;
}
export function inner$lineDiff$j(m) {
    let j = m - 1;
    return j;
}
export function inner$detailedDiff$plan(current, desired) {
    const plan = planApply(current, desired);
    return plan;
}
export function inner$changelogEntry$plan(prevFiles, nextFiles) {
    const plan = planApply(prevFiles || {}, nextFiles || {});
    return plan;
}
export function inner$batchSummary$entries(plans) {
    const entries = Object.entries(plans || {});
    return entries;
}
export function inner$planTenants$plans$$after_loop(tenants, currentByTenant) {
    const plans = {};
    const owner = {};
    const collisions = [];
    let anyChanged = false;
    for (const t of tenants) {
        const cur = currentByTenant[t.tenantId] || {};
        const plan = planApply(cur, t.desired);
        plans[t.tenantId] = plan;
        if (plan.changed)
            anyChanged = true;
        for (const p of Object.keys(t.desired)) {
            // manifest.json הוא פר-פלט; בהחלה-מרובה הוא נכתב לתיקיית-לקוח נפרדת.
            // כאן בודקים חפיפה על נתיבי-המרכזייה המשותפים (dialplan/directory/gateways).
            if (p === 'manifest.json')
                continue;
            if (owner[p] && owner[p] !== t.tenantId) {
                collisions.push({ path: p, tenants: [owner[p], t.tenantId] });
            }
            else {
                owner[p] = t.tenantId;
            }
        }
    }
    return plans;
}
export function inner$planTenants$owner$$after_loop(tenants, currentByTenant) {
    const plans = {};
    const owner = {};
    const collisions = [];
    let anyChanged = false;
    for (const t of tenants) {
        const cur = currentByTenant[t.tenantId] || {};
        const plan = planApply(cur, t.desired);
        plans[t.tenantId] = plan;
        if (plan.changed)
            anyChanged = true;
        for (const p of Object.keys(t.desired)) {
            // manifest.json הוא פר-פלט; בהחלה-מרובה הוא נכתב לתיקיית-לקוח נפרדת.
            // כאן בודקים חפיפה על נתיבי-המרכזייה המשותפים (dialplan/directory/gateways).
            if (p === 'manifest.json')
                continue;
            if (owner[p] && owner[p] !== t.tenantId) {
                collisions.push({ path: p, tenants: [owner[p], t.tenantId] });
            }
            else {
                owner[p] = t.tenantId;
            }
        }
    }
    return owner;
}
export function inner$planTenants$collisions$$after_loop(tenants, currentByTenant) {
    const plans = {};
    const owner = {};
    const collisions = [];
    let anyChanged = false;
    for (const t of tenants) {
        const cur = currentByTenant[t.tenantId] || {};
        const plan = planApply(cur, t.desired);
        plans[t.tenantId] = plan;
        if (plan.changed)
            anyChanged = true;
        for (const p of Object.keys(t.desired)) {
            // manifest.json הוא פר-פלט; בהחלה-מרובה הוא נכתב לתיקיית-לקוח נפרדת.
            // כאן בודקים חפיפה על נתיבי-המרכזייה המשותפים (dialplan/directory/gateways).
            if (p === 'manifest.json')
                continue;
            if (owner[p] && owner[p] !== t.tenantId) {
                collisions.push({ path: p, tenants: [owner[p], t.tenantId] });
            }
            else {
                owner[p] = t.tenantId;
            }
        }
    }
    return collisions;
}
export function inner$planTenants$anyChanged$$after_loop(tenants, currentByTenant) {
    const plans = {};
    const owner = {};
    const collisions = [];
    let anyChanged = false;
    for (const t of tenants) {
        const cur = currentByTenant[t.tenantId] || {};
        const plan = planApply(cur, t.desired);
        plans[t.tenantId] = plan;
        if (plan.changed)
            anyChanged = true;
        for (const p of Object.keys(t.desired)) {
            // manifest.json הוא פר-פלט; בהחלה-מרובה הוא נכתב לתיקיית-לקוח נפרדת.
            // כאן בודקים חפיפה על נתיבי-המרכזייה המשותפים (dialplan/directory/gateways).
            if (p === 'manifest.json')
                continue;
            if (owner[p] && owner[p] !== t.tenantId) {
                collisions.push({ path: p, tenants: [owner[p], t.tenantId] });
            }
            else {
                owner[p] = t.tenantId;
            }
        }
    }
    return anyChanged;
}
export function inner$secretPreflight$missing$$after_loop(bundles, env) {
    const missing = [];
    for (const b of bundles) {
        const tid = b.tenantId || (b.manifest && b.manifest.tenantId) || '?';
        const seen = new Set();
        for (const content of Object.values(b.files || {})) {
            // סוד = $${NAME} עם NAME שמתחיל אות-גדולה (GSM_/PROVISION_/VM_/REC_); משתני-
            // FreeSWITCH מובנים (sounds_dir/recordings_dir) מתחילים אות-קטנה ⇒ מוחרגים.
            for (const m of String(content).matchAll(/\$\$\{([A-Z][A-Za-z0-9_-]*)\}/g)) {
                const name = m[1];
                if (seen.has(name))
                    continue;
                seen.add(name);
                if (env[name] === undefined || env[name] === '') {
                    missing.push({ tenantId: tid, secret: name, breaks: secretBreaks(name) });
                }
            }
        }
    }
    return missing;
}
export function inner$batchSummary$creates$$after_loop(plans) {
    const entries = Object.entries(plans || {});
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let changedTenants = 0;
    for (const [, p] of entries) {
        creates += p.creates.length;
        updates += p.updates.length;
        deletes += p.deletes.length;
        if (p.changed)
            changedTenants++;
    }
    return creates;
}
export function inner$batchSummary$updates$$after_loop(plans) {
    const entries = Object.entries(plans || {});
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let changedTenants = 0;
    for (const [, p] of entries) {
        creates += p.creates.length;
        updates += p.updates.length;
        deletes += p.deletes.length;
        if (p.changed)
            changedTenants++;
    }
    return updates;
}
export function inner$batchSummary$deletes$$after_loop(plans) {
    const entries = Object.entries(plans || {});
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let changedTenants = 0;
    for (const [, p] of entries) {
        creates += p.creates.length;
        updates += p.updates.length;
        deletes += p.deletes.length;
        if (p.changed)
            changedTenants++;
    }
    return deletes;
}
export function inner$batchSummary$changedTenants$$after_loop(plans) {
    const entries = Object.entries(plans || {});
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let changedTenants = 0;
    for (const [, p] of entries) {
        creates += p.creates.length;
        updates += p.updates.length;
        deletes += p.deletes.length;
        if (p.changed)
            changedTenants++;
    }
    return changedTenants;
}

export const SIGS = {
  inner$planApply$changed: [{"name":"creates","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"updates","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"deletes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$planTenants$plan: [{"name":"currentByTenant","d":{"t":"rec","of":{"t":"rec","of":{"t":"str"}}},"opt":false},{"name":"t","d":{"t":"obj","p":[["tenantId",{"t":"str"},false],["desired",{"t":"rec","of":{"t":"str"}},false]]},"opt":false}],
  inner$planTenants$plan$$step: [{"name":"t","d":{"t":"obj","p":[["tenantId",{"t":"str"},false],["desired",{"t":"rec","of":{"t":"str"}},false]]},"opt":false},{"name":"cur","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
  inner$pushSnapshot$h: [{"name":"history","d":{"t":"any"},"opt":false},{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$restoreFrom$s: [{"name":"history","d":{"t":"any"},"opt":false},{"name":"version","d":{"t":"any"},"opt":false}],
  inner$reloadPlan$sipDelUpd: [{"name":"plan","d":{"t":"any"},"opt":false}],
  inner$reloadPlan$sipCreate: [{"name":"plan","d":{"t":"any"},"opt":false}],
  inner$healthReport$worst: [{"name":"items","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$pushAudit$l: [{"name":"log","d":{"t":"any"},"opt":false},{"name":"entry","d":{"t":"any"},"opt":false}],
  inner$migrationRisk$pById: [{"name":"prev","d":{"t":"any"},"opt":false}],
  inner$migrationRisk$survivorSwapped: [{"name":"prev","d":{"t":"any"},"opt":false},{"name":"next","d":{"t":"any"},"opt":false}],
  inner$migrationRisk$survivorSwapped$$step: [{"name":"next","d":{"t":"any"},"opt":false},{"name":"pById","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$migrationRisk$equalCountSwap: [{"name":"prev","d":{"t":"any"},"opt":false},{"name":"next","d":{"t":"any"},"opt":false}],
  inner$migrationRisk$removed: [{"name":"prev","d":{"t":"any"},"opt":false},{"name":"next","d":{"t":"any"},"opt":false}],
  inner$applyWithRollback$plan: [{"name":"current","d":{"t":"any"},"opt":false},{"name":"desired","d":{"t":"any"},"opt":false}],
  inner$lineDiff$a: [{"name":"aStr","d":{"t":"any"},"opt":false}],
  inner$lineDiff$b: [{"name":"bStr","d":{"t":"any"},"opt":false}],
  inner$lineDiff$i: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$lineDiff$j: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$detailedDiff$plan: [{"name":"current","d":{"t":"obj","p":[]},"opt":false},{"name":"desired","d":{"t":"obj","p":[]},"opt":false}],
  inner$changelogEntry$plan: [{"name":"prevFiles","d":{"t":"any"},"opt":false},{"name":"nextFiles","d":{"t":"any"},"opt":false}],
  inner$batchSummary$entries: [{"name":"plans","d":{"t":"any"},"opt":false}],
  inner$planTenants$plans$$after_loop: [{"name":"tenants","d":{"t":"arr","of":{"t":"obj","p":[["tenantId",{"t":"str"},false],["desired",{"t":"rec","of":{"t":"str"}},false]]}},"opt":false},{"name":"currentByTenant","d":{"t":"rec","of":{"t":"rec","of":{"t":"str"}}},"opt":false}],
  inner$planTenants$owner$$after_loop: [{"name":"tenants","d":{"t":"arr","of":{"t":"obj","p":[["tenantId",{"t":"str"},false],["desired",{"t":"rec","of":{"t":"str"}},false]]}},"opt":false},{"name":"currentByTenant","d":{"t":"rec","of":{"t":"rec","of":{"t":"str"}}},"opt":false}],
  inner$planTenants$collisions$$after_loop: [{"name":"tenants","d":{"t":"arr","of":{"t":"obj","p":[["tenantId",{"t":"str"},false],["desired",{"t":"rec","of":{"t":"str"}},false]]}},"opt":false},{"name":"currentByTenant","d":{"t":"rec","of":{"t":"rec","of":{"t":"str"}}},"opt":false}],
  inner$planTenants$anyChanged$$after_loop: [{"name":"tenants","d":{"t":"arr","of":{"t":"obj","p":[["tenantId",{"t":"str"},false],["desired",{"t":"rec","of":{"t":"str"}},false]]}},"opt":false},{"name":"currentByTenant","d":{"t":"rec","of":{"t":"rec","of":{"t":"str"}}},"opt":false}],
  inner$secretPreflight$missing$$after_loop: [{"name":"bundles","d":{"t":"arr","of":{"t":"obj","p":[["tenantId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["files",{"t":"rec","of":{"t":"str"}},false]]}},"opt":false},{"name":"env","d":{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}},"opt":false}],
  inner$batchSummary$creates$$after_loop: [{"name":"plans","d":{"t":"any"},"opt":false}],
  inner$batchSummary$updates$$after_loop: [{"name":"plans","d":{"t":"any"},"opt":false}],
  inner$batchSummary$deletes$$after_loop: [{"name":"plans","d":{"t":"any"},"opt":false}],
  inner$batchSummary$changedTenants$$after_loop: [{"name":"plans","d":{"t":"any"},"opt":false}],
};
