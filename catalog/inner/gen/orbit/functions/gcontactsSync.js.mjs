// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/gcontactsSync.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const clean = (s) => (typeof s === 'string' ? s.trim() : '');
function uniqPhones(raw) {
    const seen = new Set();
    const out = [];
    for (const p of raw) {
        const v = clean(p);
        if (!v)
            continue;
        let d = v.replace(/\D/g, '');
        if (d.startsWith('972'))
            d = d.slice(3);
        d = d.replace(/^0+/, '');
        if (!d || seen.has(d))
            continue;
        seen.add(d);
        out.push(v);
    }
    return out;
}
function uniqEmails(raw) {
    const seen = new Set();
    const out = [];
    for (const e of raw) {
        const v = clean(e);
        if (!v || !v.includes('@'))
            continue;
        const k = v.toLowerCase();
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(v);
    }
    return out;
}
function stableKey(kind, id) {
    return 'maor:' + kind + ':' + id;
}
function collectContacts(data, org) {
    const out = [];
    for (const f of data.families || []) {
        const name = clean(f.name);
        if (!name)
            continue;
        const phones = uniqPhones([f.phone, f.phone2, ...((f.members || []).flatMap((m) => [m.phone, m.phone2]))]);
        const emails = uniqEmails([f.email]);
        if (!phones.length && !emails.length)
            continue;
        out.push({ id: f.id, kind: 'family', name, phones, emails, address: clean(f.address), city: clean(f.city), org });
    }
    for (const s of data.supporters || []) {
        const name = clean(s.name);
        if (!name)
            continue;
        const phones = uniqPhones([s.phone, ...((s.phones || []).map((p) => p.num))]);
        const emails = uniqEmails([s.email]);
        if (!phones.length && !emails.length)
            continue;
        out.push({ id: s.id, kind: 'supporter', name, phones, emails, address: clean(s.address), city: clean(s.city), org });
    }
    for (const v of data.volunteers || []) {
        const name = clean(v.name);
        if (!name)
            continue;
        const phones = uniqPhones([v.phone]);
        if (!phones.length)
            continue;
        out.push({ id: v.id, kind: 'volunteer', name, phones, emails: [], address: '', city: clean(v.area), org });
    }
    return out;
}
function toPersonBody(c) {
    const person = {
        names: [{ givenName: c.name }],
        clientData: [{ key: 'maorKey', value: stableKey(c.kind, c.id) }],
    };
    if (c.phones.length)
        person.phoneNumbers = c.phones.map((num, i) => ({ value: num, type: i === 0 ? 'main' : 'other' }));
    if (c.emails.length)
        person.emailAddresses = c.emails.map((value) => ({ value }));
    if (c.address || c.city)
        person.addresses = [{ streetAddress: c.address, city: c.city }];
    if (c.org)
        person.organizations = [{ name: c.org }];
    const kindLabel = c.kind === 'family' ? 'משפחה' : c.kind === 'supporter' ? 'תורם/ת' : 'מתנדב/ת';
    person.userDefined = [{ key: 'מאור', value: kindLabel }];
    return person;
}
function planContactWrites(contacts, existingByKey) {
    const creates = [];
    const updates = [];
    for (const c of contacts) {
        const key = stableKey(c.kind, c.id);
        const body = toPersonBody(c);
        const ex = existingByKey && existingByKey[key];
        if (ex && ex.resourceName) {
            updates.push({ resourceName: ex.resourceName, etag: ex.etag, person: body });
        }
        else {
            creates.push({ person: body });
        }
    }
    return { creates, updates };
}
export function inner$uniqPhones$v(p) {
    const v = clean(p);
    return v;
}
export function inner$uniqPhones$d(p) {
    const v = clean(p);
    let d = v.replace(/\D/g, '');
    return d;
}
export function inner$uniqPhones$d$$step(v) {
    let d = v.replace(/\D/g, '');
    return d;
}
export function inner$uniqEmails$v(e) {
    const v = clean(e);
    return v;
}
export function inner$uniqEmails$k(e) {
    const v = clean(e);
    const k = v.toLowerCase();
    return k;
}
export function inner$uniqEmails$k$$step(v) {
    const k = v.toLowerCase();
    return k;
}
export function inner$collectContacts$name(f) {
    const name = clean(f.name);
    return name;
}
export function inner$collectContacts$phones(f) {
    const phones = uniqPhones([f.phone, f.phone2, ...((f.members || []).flatMap((m) => [m.phone, m.phone2]))]);
    return phones;
}
export function inner$collectContacts$emails(f) {
    const emails = uniqEmails([f.email]);
    return emails;
}
export function inner$collectContacts$name_L68(s) {
    const name = clean(s.name);
    return name;
}
export function inner$collectContacts$phones_L70(s) {
    const phones = uniqPhones([s.phone, ...((s.phones || []).map((p) => p.num))]);
    return phones;
}
export function inner$collectContacts$emails_L71(s) {
    const emails = uniqEmails([s.email]);
    return emails;
}
export function inner$collectContacts$name_L76(v) {
    const name = clean(v.name);
    return name;
}
export function inner$collectContacts$phones_L78(v) {
    const phones = uniqPhones([v.phone]);
    return phones;
}
export function inner$toPersonBody$person(c) {
    const person = {
        names: [{ givenName: c.name }],
        clientData: [{ key: 'maorKey', value: stableKey(c.kind, c.id) }],
    };
    return person;
}
export function inner$toPersonBody$kindLabel(c) {
    const kindLabel = c.kind === 'family' ? 'משפחה' : c.kind === 'supporter' ? 'תורם/ת' : 'מתנדב/ת';
    return kindLabel;
}
export function inner$planContactWrites$key(c) {
    const key = stableKey(c.kind, c.id);
    return key;
}
export function inner$planContactWrites$body(c) {
    const body = toPersonBody(c);
    return body;
}
export function inner$existingByKey$cd(p) {
    const cd = (p.clientData || []).find((x) => x.key === 'maorKey');
    return cd;
}
export function inner$syncOneOrg$contacts(slug, cfg, data) {
    const org = (cfg && cfg.orgName) || slug;
    const contacts = collectContacts(data, org);
    return contacts;
}
export function inner$syncOneOrg$contacts$$step(data, org) {
    const contacts = collectContacts(data, org);
    return contacts;
}
export function inner$syncOneOrg$creates(slug, cfg, data, existing) {
    const org = (cfg && cfg.orgName) || slug;
    const contacts = collectContacts(data, org);
    const { creates, updates } = planContactWrites(contacts, existing);
    return creates;
}
export function inner$syncOneOrg$creates$$step(contacts, existing) {
    const { creates, updates } = planContactWrites(contacts, existing);
    return creates;
}
export function inner$syncOneOrg$updates(slug, cfg, data, existing) {
    const org = (cfg && cfg.orgName) || slug;
    const contacts = collectContacts(data, org);
    const { creates, updates } = planContactWrites(contacts, existing);
    return updates;
}
export function inner$syncOneOrg$updates$$step(contacts, existing) {
    const { creates, updates } = planContactWrites(contacts, existing);
    return updates;
}
export function inner$onRequest$bearer(req) {
    const bearer = /^Bearer (.+)$/.exec(req.get('authorization') || '');
    return bearer;
}
export function inner$onRequest$slug(req) {
    const slug = clean(req.query.org) || clean((req.body || {}).org);
    return slug;
}
export function inner$onRequest$vaultRaw(req) {
    const vaultRaw = clean(req.query.vault) || clean((req.body || {}).vault);
    return vaultRaw;
}
export function inner$onRequest$vaultOrg(ORG_RE, req) {
    const slug = clean(req.query.org) || clean((req.body || {}).org);
    const vaultRaw = clean(req.query.vault) || clean((req.body || {}).vault);
    const vaultOrg = slug === 'root' && ORG_RE.test(vaultRaw) ? vaultRaw : slug;
    return vaultOrg;
}
export function inner$onRequest$vaultOrg$$step(ORG_RE, slug, vaultRaw) {
    const vaultOrg = slug === 'root' && ORG_RE.test(vaultRaw) ? vaultRaw : slug;
    return vaultOrg;
}
export function inner$onRequest$el(email) {
    const el = email.toLowerCase();
    return el;
}
export function inner$onRequest$isMgr(req, email, od) {
    const slug = clean(req.query.org) || clean((req.body || {}).org);
    const el = email.toLowerCase();
    const isMgr = slug !== 'root' && clean(od.manager).toLowerCase() === el;
    return isMgr;
}
export function inner$onRequest$isMgr$$step(slug, el, od) {
    const isMgr = slug !== 'root' && clean(od.manager).toLowerCase() === el;
    return isMgr;
}
export function inner$uniqPhones$seen$$after_loop(raw) {
    const seen = new Set();
    const out = [];
    for (const p of raw) {
        const v = clean(p);
        if (!v)
            continue;
        let d = v.replace(/\D/g, '');
        if (d.startsWith('972'))
            d = d.slice(3);
        d = d.replace(/^0+/, '');
        if (!d || seen.has(d))
            continue;
        seen.add(d);
        out.push(v);
    }
    return seen;
}
export function inner$uniqPhones$out$$after_loop(raw) {
    const seen = new Set();
    const out = [];
    for (const p of raw) {
        const v = clean(p);
        if (!v)
            continue;
        let d = v.replace(/\D/g, '');
        if (d.startsWith('972'))
            d = d.slice(3);
        d = d.replace(/^0+/, '');
        if (!d || seen.has(d))
            continue;
        seen.add(d);
        out.push(v);
    }
    return out;
}
export function inner$uniqEmails$seen$$after_loop(raw) {
    const seen = new Set();
    const out = [];
    for (const e of raw) {
        const v = clean(e);
        if (!v || !v.includes('@'))
            continue;
        const k = v.toLowerCase();
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(v);
    }
    return seen;
}
export function inner$uniqEmails$out$$after_loop(raw) {
    const seen = new Set();
    const out = [];
    for (const e of raw) {
        const v = clean(e);
        if (!v || !v.includes('@'))
            continue;
        const k = v.toLowerCase();
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(v);
    }
    return out;
}
export function inner$planContactWrites$creates$$after_loop(contacts, existingByKey) {
    const creates = [];
    const updates = [];
    for (const c of contacts) {
        const key = stableKey(c.kind, c.id);
        const body = toPersonBody(c);
        const ex = existingByKey && existingByKey[key];
        if (ex && ex.resourceName) {
            updates.push({ resourceName: ex.resourceName, etag: ex.etag, person: body });
        }
        else {
            creates.push({ person: body });
        }
    }
    return creates;
}
export function inner$planContactWrites$updates$$after_loop(contacts, existingByKey) {
    const creates = [];
    const updates = [];
    for (const c of contacts) {
        const key = stableKey(c.kind, c.id);
        const body = toPersonBody(c);
        const ex = existingByKey && existingByKey[key];
        if (ex && ex.resourceName) {
            updates.push({ resourceName: ex.resourceName, etag: ex.etag, person: body });
        }
        else {
            creates.push({ person: body });
        }
    }
    return updates;
}

export const SIGS = {
  inner$uniqPhones$v: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$uniqPhones$d: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$uniqPhones$d$$step: [{"name":"v","d":{"t":"str"},"opt":false}],
  inner$uniqEmails$v: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$uniqEmails$k: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$uniqEmails$k$$step: [{"name":"v","d":{"t":"str"},"opt":false}],
  inner$collectContacts$name: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$collectContacts$phones: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$collectContacts$emails: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$collectContacts$name_L68: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$collectContacts$phones_L70: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$collectContacts$emails_L71: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$collectContacts$name_L76: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$collectContacts$phones_L78: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$toPersonBody$person: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$toPersonBody$kindLabel: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$planContactWrites$key: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$planContactWrites$body: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$existingByKey$cd: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$syncOneOrg$contacts: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cfg","d":{"t":"any"},"opt":false},{"name":"data","d":{"t":"obj","n":"data","p":[]},"opt":false}],
  inner$syncOneOrg$contacts$$step: [{"name":"data","d":{"t":"obj","n":"data","p":[]},"opt":false},{"name":"org","d":{"t":"any"},"opt":false}],
  inner$syncOneOrg$creates: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cfg","d":{"t":"any"},"opt":false},{"name":"data","d":{"t":"obj","n":"data","p":[]},"opt":false},{"name":"existing","d":{"t":"obj","n":"map","p":[]},"opt":false}],
  inner$syncOneOrg$creates$$step: [{"name":"contacts","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["kind",{"t":"str"},false],["name",{"t":"str"},false],["phones",{"t":"arr","of":{"t":"str"}},false],["emails",{"t":"arr","of":{"t":"str"}},false],["address",{"t":"str"},false],["city",{"t":"str"},false],["org",{"t":"any"},false]]}},"opt":false},{"name":"existing","d":{"t":"obj","n":"map","p":[]},"opt":false}],
  inner$syncOneOrg$updates: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cfg","d":{"t":"any"},"opt":false},{"name":"data","d":{"t":"obj","n":"data","p":[]},"opt":false},{"name":"existing","d":{"t":"obj","n":"map","p":[]},"opt":false}],
  inner$syncOneOrg$updates$$step: [{"name":"contacts","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["kind",{"t":"str"},false],["name",{"t":"str"},false],["phones",{"t":"arr","of":{"t":"str"}},false],["emails",{"t":"arr","of":{"t":"str"}},false],["address",{"t":"str"},false],["city",{"t":"str"},false],["org",{"t":"any"},false]]}},"opt":false},{"name":"existing","d":{"t":"obj","n":"map","p":[]},"opt":false}],
  inner$onRequest$bearer: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$slug: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$vaultRaw: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$vaultOrg: [{"name":"ORG_RE","d":{"t":"any"},"opt":false},{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$vaultOrg$$step: [{"name":"ORG_RE","d":{"t":"any"},"opt":false},{"name":"slug","d":{"t":"str"},"opt":false},{"name":"vaultRaw","d":{"t":"str"},"opt":false}],
  inner$onRequest$el: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$onRequest$isMgr: [{"name":"req","d":{"t":"any"},"opt":false},{"name":"email","d":{"t":"str"},"opt":false},{"name":"od","d":{"t":"any"},"opt":false}],
  inner$onRequest$isMgr$$step: [{"name":"slug","d":{"t":"str"},"opt":false},{"name":"el","d":{"t":"str"},"opt":false},{"name":"od","d":{"t":"any"},"opt":false}],
  inner$uniqPhones$seen$$after_loop: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$uniqPhones$out$$after_loop: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$uniqEmails$seen$$after_loop: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$uniqEmails$out$$after_loop: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$planContactWrites$creates$$after_loop: [{"name":"contacts","d":{"t":"any"},"opt":false},{"name":"existingByKey","d":{"t":"any"},"opt":false}],
  inner$planContactWrites$updates$$after_loop: [{"name":"contacts","d":{"t":"any"},"opt":false},{"name":"existingByKey","d":{"t":"any"},"opt":false}],
};
