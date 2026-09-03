/**
 * 📇 gcontactsSync — סנכרון אנשי-קשר של הארגון ל-Google Contacts (People API).
 *
 * הכרעת-בעלים 1.9 "סנכרון-חי לגוגל, כל אנשי-הקשר". השרת מחזיק **refresh-token
 * פר-ארגון בכספת** (orgSecrets/{slug}.gcontactsRefresh) + client-id/secret
 * גלובליים (env GCONTACTS_CLIENT_ID/SECRET — אפליקציית-OAuth אחת של הבעלים).
 * לכל ארגון עם ההרחבה דלוקה ורענון-טוקן: OAuth2 refresh → access-token →
 * People API upsert. זיהוי-חוזר דרך clientData.maorKey ⇒ **בלי כפילויות** —
 * ריצה-חוזרת מעדכנת את אותו איש-קשר במקום ליצור חדש.
 *
 * דורמנטי לחלוטין בלי env-creds או בלי refresh-token (return מוקדם). אפס-נגיעה
 * בכסף/קבלות. שני שערים: מתוזמן-יומי (כל הארגונים) + on-demand (onRequest, מנהל).
 *
 * הליבה הטהורה (toPersonBody / planContactWrites / collectContacts) מיוצאת
 * ונבדקת ביחידה (gcontactsSync.test.mjs) — בלי firebase/googleapis.
 */
'use strict';

// ── ליבה טהורה (בלי firebase/googleapis) ─────────────────────────────────────
const clean = (s) => (typeof s === 'string' ? s.trim() : '');

function uniqPhones(raw) {
  const seen = new Set();
  const out = [];
  for (const p of raw) {
    const v = clean(p);
    if (!v) continue;
    let d = v.replace(/\D/g, '');
    if (d.startsWith('972')) d = d.slice(3);
    d = d.replace(/^0+/, '');
    if (!d || seen.has(d)) continue;
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
    if (!v || !v.includes('@')) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

/** מפתח-יציב לזיהוי-חוזר — חייב להיות זהה ל-src/lib/googleContacts.contactStableKey. */
function stableKey(kind, id) {
  return 'maor:' + kind + ':' + id;
}

/** איסוף אנשי-הקשר מאוספי-הארגון (משפחות/תורמים/מתנדבים) לרשומה אחידה. */
function collectContacts(data, org) {
  const out = [];
  for (const f of data.families || []) {
    const name = clean(f.name);
    if (!name) continue;
    const phones = uniqPhones([f.phone, f.phone2, ...((f.members || []).flatMap((m) => [m.phone, m.phone2]))]);
    const emails = uniqEmails([f.email]);
    if (!phones.length && !emails.length) continue;
    out.push({ id: f.id, kind: 'family', name, phones, emails, address: clean(f.address), city: clean(f.city), org });
  }
  for (const s of data.supporters || []) {
    const name = clean(s.name);
    if (!name) continue;
    const phones = uniqPhones([s.phone, ...((s.phones || []).map((p) => p.num))]);
    const emails = uniqEmails([s.email]);
    if (!phones.length && !emails.length) continue;
    out.push({ id: s.id, kind: 'supporter', name, phones, emails, address: clean(s.address), city: clean(s.city), org });
  }
  for (const v of data.volunteers || []) {
    const name = clean(v.name);
    if (!name) continue;
    const phones = uniqPhones([v.phone]);
    if (!phones.length) continue;
    out.push({ id: v.id, kind: 'volunteer', name, phones, emails: [], address: '', city: clean(v.area), org });
  }
  return out;
}

/** OrgContact → People API Person body (זהה למיפוי ה-client, plus maorKey). */
function toPersonBody(c) {
  const person = {
    names: [{ givenName: c.name }],
    clientData: [{ key: 'maorKey', value: stableKey(c.kind, c.id) }],
  };
  if (c.phones.length) person.phoneNumbers = c.phones.map((num, i) => ({ value: num, type: i === 0 ? 'main' : 'other' }));
  if (c.emails.length) person.emailAddresses = c.emails.map((value) => ({ value }));
  if (c.address || c.city) person.addresses = [{ streetAddress: c.address, city: c.city }];
  if (c.org) person.organizations = [{ name: c.org }];
  const kindLabel = c.kind === 'family' ? 'משפחה' : c.kind === 'supporter' ? 'תורם/ת' : 'מתנדב/ת';
  person.userDefined = [{ key: 'מאור', value: kindLabel }];
  return person;
}

/**
 * תוכנית-כתיבה אידמפוטנטית: מול אנשי-הקשר הקיימים ב-Google (existing =
 * מפה maorKey → {resourceName, etag}), מחליטים create/update פר-איש-קשר.
 * מי שלא נמצא ⇒ create; מי שנמצא ⇒ update (עם resourceName+etag). לעולם לא
 * מוחקים (בטיחות — איש-קשר שהוסר אצלנו נשאר ב-Google).
 */
function planContactWrites(contacts, existingByKey) {
  const creates = [];
  const updates = [];
  for (const c of contacts) {
    const key = stableKey(c.kind, c.id);
    const body = toPersonBody(c);
    const ex = existingByKey && existingByKey[key];
    if (ex && ex.resourceName) {
      updates.push({ resourceName: ex.resourceName, etag: ex.etag, person: body });
    } else {
      creates.push({ person: body });
    }
  }
  return { creates, updates };
}

module.exports = { collectContacts, toPersonBody, planContactWrites, stableKey };

// ── חיווט-השרת (נטען רק בסביבת-Functions; מדולג בבדיקות-יחידה) ────────────────
if (process.env.FUNCTIONS_EMULATOR !== undefined || process.env.K_SERVICE || process.env.GCLOUD_PROJECT) {
  try {
    const { onSchedule } = require('firebase-functions/v2/scheduler');
    const { onRequest } = require('firebase-functions/v2/https');
    const { getFirestore } = require('firebase-admin/firestore');
    require('firebase-admin/app');

    const CONTACT_COLS = ['families', 'supporters', 'volunteers'];
    // לקוח-השורש (org='root'): הנתונים באוספי-השורש, לא ב-orgs/root/… (כמו incomingCol ב-solaPull).
    const colFor = (db, org, name) => (org === 'root' ? db.collection(name) : db.collection('orgs').doc(org).collection(name));
    const ORG_RE = /^[a-z0-9-]{2,40}$/;
    // מיילי-העל: env + עוגן-קשיח (משקף את allowlist-השורש ב-firestore.rules) — **התאמה-מלאה**, לא substring.
    const superSet = () => new Set(['meir7651231@gmail.com', ...String(process.env.SUPER_ADMIN_EMAILS || '').toLowerCase().split(/[,\s]+/).filter(Boolean)]);
    const PERSON_FIELDS = 'names,clientData';

    // אישורי-הארגון: **הכספת גוברת** (orgSecrets/{slug}) — refresh + client-id/secret;
    // ‏env הוא נפילה-לאחור בלבד ל-client-id/secret. כך הבעלים מזין הכל בתוך האתר
    // (הגדרות←אבטחה←כספת), בלי שורת-פקודה. חסר refresh ⇒ הארגון מדולג.
    async function credsFor(db, slug) {
      const doc = await db.doc('orgSecrets/' + slug).get();
      const d = doc.exists ? doc.data() : {};
      return {
        refresh: clean(d.gcontactsRefresh),
        clientId: clean(d.gcontactsClientId) || clean(process.env.GCONTACTS_CLIENT_ID),
        clientSecret: clean(d.gcontactsClientSecret) || clean(process.env.GCONTACTS_CLIENT_SECRET),
      };
    }

    function peopleClient(creds) {
      const { google } = require('googleapis');
      const oauth = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
      oauth.setCredentials({ refresh_token: creds.refresh });
      return google.people({ version: 'v1', auth: oauth });
    }

    // מפת אנשי-הקשר הקיימים ב-Google לפי maorKey (עמוד-אחר-עמוד).
    async function existingByKey(people) {
      const map = {};
      let pageToken;
      do {
        const res = await people.people.connections.list({
          resourceName: 'people/me', personFields: PERSON_FIELDS, pageSize: 1000, pageToken,
        });
        for (const p of res.data.connections || []) {
          const cd = (p.clientData || []).find((x) => x.key === 'maorKey');
          if (cd && cd.value) map[cd.value] = { resourceName: p.resourceName, etag: p.etag };
        }
        pageToken = res.data.nextPageToken;
      } while (pageToken);
      return map;
    }

    async function syncOneOrg(db, slug, cfg, vaultOrg) {
      const creds = await credsFor(db, vaultOrg || slug);
      if (!creds.refresh) return { skipped: 'no-refresh-token' };
      if (!creds.clientId || !creds.clientSecret) return { skipped: 'no-oauth-app' };
      const data = {};
      for (const col of CONTACT_COLS) {
        const snap = await colFor(db, slug, col).get();
        data[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const org = (cfg && cfg.orgName) || slug;
      const contacts = collectContacts(data, org);
      const people = peopleClient(creds);
      const existing = await existingByKey(people);
      const { creates, updates } = planContactWrites(contacts, existing);
      let created = 0, updated = 0;
      // createContact פר-איש-קשר (People אין batchCreate עם clientData אמין); בלוקים קטנים.
      for (const c of creates) {
        await people.people.createContact({ requestBody: c.person }).then(() => created++).catch((e) => console.error('gcontacts create ' + slug + ': ' + String(e).slice(0, 200)));
      }
      for (const u of updates) {
        await people.people.updateContact({
          resourceName: u.resourceName,
          updatePersonFields: 'names,phoneNumbers,emailAddresses,addresses,organizations,clientData,userDefined',
          requestBody: Object.assign({ etag: u.etag }, u.person),
        }).then(() => updated++).catch((e) => console.error('gcontacts update ' + slug + ': ' + String(e).slice(0, 200)));
      }
      const status = { at: new Date().toISOString(), total: contacts.length, created, updated };
      await colFor(db, slug, 'gcontactsSync').doc('status').set(status, { merge: true }).catch(() => {});
      return status;
    }

    async function syncAll() {
      // דורמנטי לפי-ארגון: syncOneOrg מדלג כשאין creds בכספת/env (no-refresh/no-oauth).
      const db = getFirestore();
      const orgs = await db.collection('platformOrgs').get();
      for (const org of orgs.docs) {
        const cfg = (org.data() || {}).config || {};
        if (!cfg.integrations || !cfg.integrations.gcontacts || cfg.integrations.gcontacts.enabled !== true) continue;
        try {
          await syncOneOrg(db, org.id, cfg);
        } catch (e) {
          console.error('gcontactsSync ' + org.id + ': ' + String(e).slice(0, 300));
        }
      }
    }

    // מתוזמן — יומי 04:10 (מחוץ לשעות-הלילה של הגיבוי/תזכורות).
    exports.gcontactsSync = onSchedule(
      { schedule: 'every day 04:10', timeZone: 'Asia/Jerusalem', secrets: ['GCONTACTS_CLIENT_ID', 'GCONTACTS_CLIENT_SECRET'], timeoutSeconds: 540, memory: '256MiB' },
      async () => { await syncAll(); },
    );

    // on-demand — "סנכרן עכשיו" מהאפליקציה. אימות: Bearer ID-token של מנהל/מייל-על.
    exports.gcontactsSyncNow = onRequest(
      { secrets: ['GCONTACTS_CLIENT_ID', 'GCONTACTS_CLIENT_SECRET'], timeoutSeconds: 300, memory: '256MiB', cors: true },
      async (req, res) => {
        try {
          const db = getFirestore();
          const bearer = /^Bearer (.+)$/.exec(req.get('authorization') || '');
          const slug = clean(req.query.org) || clean((req.body || {}).org);
          if (!(ORG_RE.test(slug) || slug === 'root')) { res.status(400).json({ error: 'bad-org' }); return; }
          // vault: רק ללקוח-השורש מותר להצביע על מגירת-הכספת של ה-slug האמיתי (כמו solaPull)
          const vaultRaw = clean(req.query.vault) || clean((req.body || {}).vault);
          const vaultOrg = slug === 'root' && ORG_RE.test(vaultRaw) ? vaultRaw : slug;
          const { getAuth } = require('firebase-admin/auth');
          let email = '';
          if (bearer) { try { email = (await getAuth().verifyIdToken(bearer[1])).email || ''; } catch { /* invalid */ } }
          if (!email) { res.status(401).json({ error: 'unauthorized' }); return; }
          const el = email.toLowerCase();
          const isSuper = superSet().has(el);
          const orgDoc = slug === 'root' ? null : await db.doc('platformOrgs/' + slug).get();
          const od = orgDoc && orgDoc.exists ? orgDoc.data() : {};
          // root ⇒ מיילי-על בלבד (כמו solaPull); ארגון-פלטפורמה ⇒ מנהל/חבר או מייל-על
          const isMgr = slug !== 'root' && (clean(od.manager).toLowerCase() === el || (od.members || []).map((x) => String(x).toLowerCase()).includes(el));
          if (!isSuper && !isMgr) { res.status(403).json({ error: 'forbidden' }); return; }
          // ארגון-פלטפורמה: ההרחבה חייבת להיות דלוקה (אותו שער כמו המתוזמן); root = קונפיג סטטי, השער אצל הלקוח
          if (slug !== 'root') {
            const cfg = od.config || {};
            if (!cfg.integrations || !cfg.integrations.gcontacts || cfg.integrations.gcontacts.enabled !== true) { res.status(403).json({ error: 'gcontacts-disabled' }); return; }
          }
          // cooldown 60s פר-ארגון — מגן על מכסת People API מלחיצות-חוזרות
          const prev = await colFor(db, slug, 'gcontactsSync').doc('status').get().catch(() => null);
          const lastAt = prev && prev.exists ? Date.parse(prev.data().at || 0) : 0;
          if (lastAt && Date.now() - lastAt < 60_000) { res.status(429).json({ error: 'cooldown' }); return; }
          const status = await syncOneOrg(db, slug, (od.config || {}), vaultOrg);
          res.json({ ok: true, status });
        } catch (e) {
          console.error('gcontactsSyncNow: ' + String(e).slice(0, 300));
          res.status(500).json({ error: 'sync-failed' });
        }
      },
    );
  } catch (e) {
    console.error('gcontactsSync wiring: ' + String(e).slice(0, 200));
  }
}
