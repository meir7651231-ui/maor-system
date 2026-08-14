// ─────────────────────────────────────────────────────────────────────────────
// telephony · apply — התכנון: מצב-רצוי מול מצב-קיים → מפת-שינויים אידמפוטנטית.
//
// זה מה שהופך את המנוע למוצר שהמפעיל מנהל מרכזית ("אני מנהל הכל אצלי"):
// מריצים generate לכל לקוח, וכאן מחשבים מה בדיוק להחיל על ספריית-המרכזייה —
// יצירות/עדכונים/מחיקות — בלי לגעת במה שלא השתנה, ועם נתיב-שחזור.
//
// טהור: מחשב תוכנית בלבד; הכתיבה-בפועל ל-fs היא runner דק (apply-cli).
// אינווריאנט רב-דיירות: כל לקוח מחזיק אך-ורק נתיבים ששמו בתוכם (tenantId) ⇒
// לקוחות לא דורכים זה על זה. isolation נבדק ב-ratchet.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * משווה מצב-קיים למצב-רצוי (שתי מפות path→content) ומחזיר תוכנית.
 * @param {Record<string,string>} current  קבצי-המצב-הנוכחי (תצלום אחרון)
 * @param {Record<string,string>} desired   קבצי-המצב-הרצוי (מ-generateConfig)
 * @returns {{creates:string[], updates:string[], deletes:string[], unchanged:string[], changed:boolean}}
 */
export function planApply(current = {}, desired = {}) {
  const creates = [];
  const updates = [];
  const unchanged = [];
  const deletes = [];
  for (const [p, content] of Object.entries(desired)) {
    if (!(p in current)) creates.push(p);
    else if (current[p] !== content) updates.push(p);
    else unchanged.push(p);
  }
  for (const p of Object.keys(current)) {
    if (!(p in desired)) deletes.push(p);
  }
  creates.sort();
  updates.sort();
  unchanged.sort();
  deletes.sort();
  const changed = creates.length + updates.length + deletes.length > 0;
  return { creates, updates, deletes, unchanged, changed };
}

/**
 * תוכנית-שחזור: איך לחזור מ-desired בחזרה ל-current. פשוט הופכים את הכיוון —
 * החלת התצלום-הקודם משחזרת ביט-לביט. שומרים prev כדי שאפשר יהיה לגלגל אחורה.
 * @param {Record<string,string>} prev  התצלום שקדם להחלה
 * @param {Record<string,string>} next  התצלום שהוחל
 * @returns {{restoreFiles:Record<string,string>, plan:object}}
 */
export function rollbackPlan(prev = {}, next = {}) {
  // לשחזור: כל קובץ שהיה ב-prev חוזר; קבצים שנוצרו ב-next ואינם ב-prev נמחקים.
  return { restoreFiles: { ...prev }, plan: planApply(next, prev) };
}

/**
 * תוכנית רב-דיירת: לכל לקוח מחשב plan מול התצלום שלו, ומאמת שאין חפיפת-נתיבים
 * בין לקוחות (isolation). מחזיר תוכניות פר-לקוח + התנגשויות (אמורות להיות ריקות).
 * @param {Array<{tenantId:string, desired:Record<string,string>}>} tenants
 * @param {Record<string, Record<string,string>>} currentByTenant  tenantId → תצלום
 * @returns {{plans:Record<string,object>, collisions:Array, anyChanged:boolean}}
 */
export function planTenants(tenants, currentByTenant = {}) {
  const plans = {};
  const owner = {}; // path → tenantId (לבדיקת-חפיפה)
  const collisions = [];
  let anyChanged = false;
  for (const t of tenants) {
    const cur = currentByTenant[t.tenantId] || {};
    const plan = planApply(cur, t.desired);
    plans[t.tenantId] = plan;
    if (plan.changed) anyChanged = true;
    for (const p of Object.keys(t.desired)) {
      // manifest.json הוא פר-פלט; בהחלה-מרובה הוא נכתב לתיקיית-לקוח נפרדת.
      // כאן בודקים חפיפה על נתיבי-המרכזייה המשותפים (dialplan/directory/gateways).
      if (p === 'manifest.json') continue;
      if (owner[p] && owner[p] !== t.tenantId) {
        collisions.push({ path: p, tenants: [owner[p], t.tenantId] });
      } else {
        owner[p] = t.tenantId;
      }
    }
  }
  return { plans, collisions, anyChanged };
}

/** תקציר קריא-לאדם של תוכנית-החלה. */
export function summarize(plan) {
  return `+${plan.creates.length} ~${plan.updates.length} -${plan.deletes.length} =${plan.unchanged.length}`;
}

// ── 61. תצלומים-מגורסים + היסטוריית-שחזור ─────────────────────────────────────
/** יוצר רשומת-תצלום. version/ts נמסרים (דטרמיניזם — אין Date.now). */
export function snapshot(files, { version, ts = null, note = '' } = {}) {
  return { version, ts, note, files: { ...files } };
}
/** מוסיף תצלום להיסטוריה (טבעת — שומר cap אחרונים). */
export function pushSnapshot(history, snap, cap = 20) {
  const h = [...(Array.isArray(history) ? history : []), snap];
  return h.length > cap ? h.slice(h.length - cap) : h;
}
/** שולף קבצים מתצלום לפי version לשחזור. null אם לא-קיים. */
export function restoreFrom(history, version) {
  const s = (history || []).find((x) => x.version === version);
  return s ? { ...s.files } : null;
}

// ── 62. זיהוי-סחף מול המצב-על-הדיסק ──────────────────────────────────────────
/** מה על-הדיסק שונה מהתצלום האחרון-שהוחל. drifted=נערך-מחוץ-למנוע, missing=נמחק. */
export function detectDrift(lastApplied = {}, onDisk = {}) {
  const drifted = [];
  const missing = [];
  for (const [p, content] of Object.entries(lastApplied)) {
    if (!(p in onDisk)) missing.push(p);
    else if (onDisk[p] !== content) drifted.push(p);
  }
  drifted.sort();
  missing.sort();
  return { drifted, missing, clean: drifted.length + missing.length === 0 };
}

// ── 63. תוכנית-reload של FreeSWITCH ──────────────────────────────────────────
/** פקודות ה-fs_cli להרצה אחרי-החלה, לפי מה שהשתנה. */
export function reloadPlan(plan) {
  const cmds = [];
  const touched = [...plan.creates, ...plan.updates, ...plan.deletes];
  if (touched.some((p) => p.startsWith('dialplan/') || p.startsWith('directory/'))) cmds.push('reloadxml');
  // שער שנמחק חייב restart-פרופיל (rescan לא מוריד gateway קיים); שאר-שינויי-שער = rescan.
  if ((plan.deletes || []).some((p) => p.startsWith('sip_profiles/'))) cmds.push('sofia profile internal restart reloadxml');
  else if (touched.some((p) => p.startsWith('sip_profiles/'))) cmds.push('sofia profile internal rescan reloadxml');
  return [...new Set(cmds)];
}

// ── 64. בדיקות-בריאות (מודל) ─────────────────────────────────────────────────
/**
 * מפרש סטטוס-חי (registration/latency פר-gateway/ext) לרמות ok/warn/critical.
 * @param {{gateways?:Record<string,{state?:string,latencyMs?:number}>,
 *          extensions?:Record<string,{registered?:boolean}>}} status
 */
export function healthReport(status = {}) {
  const items = [];
  for (const [name, g] of Object.entries(status.gateways || {})) {
    let level = 'ok';
    if (g.state && g.state.toUpperCase() !== 'REGED' && g.state.toUpperCase() !== 'NOREG') level = 'critical';
    if (typeof g.latencyMs === 'number' && g.latencyMs > 400) level = level === 'critical' ? 'critical' : 'warn';
    items.push({ kind: 'gateway', name, level, detail: `${g.state || '?'}${g.latencyMs != null ? ` ${g.latencyMs}ms` : ''}` });
  }
  for (const [ext, e] of Object.entries(status.extensions || {})) {
    items.push({ kind: 'extension', name: ext, level: e.registered ? 'ok' : 'warn', detail: e.registered ? 'רשום' : 'לא-רשום' });
  }
  const worst = items.some((i) => i.level === 'critical') ? 'critical' : items.some((i) => i.level === 'warn') ? 'warn' : 'ok';
  return { overall: worst, items };
}

// ── 65. לוג-פעולות (טבעת-500, כמו maor AuditEntry) ────────────────────────────
/** מוסיף רשומת-audit לטבעת. entry = {ts?, actor?, action, target?, detail?}. */
export function pushAudit(log, entry, cap = 500) {
  const l = [...(Array.isArray(log) ? log : []), entry];
  return l.length > cap ? l.slice(l.length - cap) : l;
}

// ── 65ב. preflight-סודות: זיהוי שער-מת/אימות-שבור לפני-החלה ────────────────────
/** מסווג שם-סוד לקטגוריית-הכשל שהוא ישבור אם יחסר. */
function secretBreaks(name) {
  if (name.startsWith('GSM_')) return 'gateway';
  if (name.startsWith('VM_PW__')) return 'voicemail';
  if (name.startsWith('REC_KEY')) return 'recording';
  if (/^PROVISION_PW__[^_]+(?:-[^_]+)*__/.test(name)) return 'ext-auth';
  if (name.startsWith('PROVISION_PW__')) return 'provision';
  return 'other';
}
/**
 * מצליב את משתני-הסוד ($${NAME}) שהקבצים-שחוללו דורשים מול מפת-env נתונה, ומחזיר
 * אילו חסרים. הסיבה #1 לשער-דומם היא env-var לא-מוגדר — שקט לחלוטין בזמן-ריצה
 * (XML תקין, apply מצליח, reloadxml עובר, השער פשוט לא-נרשם). הופך אותו לאזהרה
 * רועשת בזמן-החלה. טהור (env מוזרק) — downstream.
 * @param {Array<{tenantId?:string, files:Record<string,string>}>} bundles תוצרי generateConfig
 * @param {Record<string,string|undefined>} env מפת-סביבה (למשל process.env)
 * @returns {{ok:boolean, missing:Array<{tenantId:string,secret:string,breaks:string}>}}
 */
export function secretPreflight(bundles, env = {}) {
  const missing = [];
  for (const b of bundles) {
    const tid = b.tenantId || (b.manifest && b.manifest.tenantId) || '?';
    const seen = new Set();
    for (const content of Object.values(b.files || {})) {
      // סוד = $${NAME} עם NAME שמתחיל אות-גדולה (GSM_/PROVISION_/VM_/REC_); משתני-
      // FreeSWITCH מובנים (sounds_dir/recordings_dir) מתחילים אות-קטנה ⇒ מוחרגים.
      for (const m of String(content).matchAll(/\$\$\{([A-Z][A-Za-z0-9_-]*)\}/g)) {
        const name = m[1];
        if (seen.has(name)) continue;
        seen.add(name);
        if (env[name] === undefined || env[name] === '') {
          missing.push({ tenantId: tid, secret: name, breaks: secretBreaks(name) });
        }
      }
    }
  }
  return { ok: missing.length === 0, missing };
}

// ── 66. apply אטומי + rollback-אוטומטי-בכשל ──────────────────────────────────
/**
 * מחיל desired דרך writeFn(path, content). אם writeFn זורק — משחזר את current
 * (כותב בחזרה את מה שכבר נכתב) ומחזיר rolledBack. writeFn חייב להיות אידמפוטנטי.
 * @returns {{ok:boolean, written:string[], rolledBack:boolean, error?:string}}
 */
export function applyWithRollback(current, desired, writeFn, deleteFn) {
  const plan = planApply(current, desired);
  const toWrite = [...plan.creates, ...plan.updates];
  const written = [];
  try {
    for (const p of toWrite) {
      writeFn(p, desired[p]);
      written.push(p);
    }
    return { ok: true, written, rolledBack: false };
  } catch (e) {
    // שחזור: קובץ-שהיה (update) חוזר לתוכנו; קובץ-שנוצר (create) נמחק אם יש deleteFn,
    // אחרת נשאר על-הדיסק (residual) והשחזור לא-מלא.
    const restored = [];
    const residual = [];
    for (const p of written) {
      try {
        if (p in current) { writeFn(p, current[p]); restored.push(p); }
        else if (deleteFn) { deleteFn(p); restored.push(p); }
        else residual.push(p); // create בלי deleteFn — לא ניתן להסרה
      } catch { residual.push(p); }
    }
    return { ok: false, written: [], restored, residual, rolledBack: residual.length === 0, error: String(e && e.message ? e.message : e) };
  }
}

// ── 67. dry-run מפורט: diff פר-שורה (LCS) ────────────────────────────────────
/** diff-שורות בין שתי מחרוזות. מחזיר [{op:'same'|'add'|'del', line}]. */
export function lineDiff(aStr, bStr) {
  const a = String(aStr || '').split('\n');
  const b = String(bStr || '').split('\n');
  const n = a.length, m = b.length;
  // טבלת-LCS.
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ op: 'same', line: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ op: 'del', line: a[i] }); i++; }
    else { out.push({ op: 'add', line: b[j] }); j++; }
  }
  while (i < n) out.push({ op: 'del', line: a[i++] });
  while (j < m) out.push({ op: 'add', line: b[j++] });
  return out;
}
/** תקציר diff פר-קובץ בין current ל-desired (רק קבצים שהשתנו). */
export function detailedDiff(current = {}, desired = {}) {
  const plan = planApply(current, desired);
  const out = {};
  for (const p of plan.updates) {
    const d = lineDiff(current[p], desired[p]);
    out[p] = { added: d.filter((x) => x.op === 'add').length, removed: d.filter((x) => x.op === 'del').length, diff: d };
  }
  return out;
}

// ── 68. תיוג-גרסה + changelog ────────────────────────────────────────────────
/** רשומת-changelog בין שני תצלומים. version/note נמסרים. */
export function changelogEntry(prevFiles, nextFiles, { version, note = '' } = {}) {
  const plan = planApply(prevFiles || {}, nextFiles || {});
  return {
    version,
    note,
    summary: summarize(plan),
    created: plan.creates,
    updated: plan.updates,
    deleted: plan.deletes,
  };
}

// ── 69. נעילת-לקוח (freeze) ──────────────────────────────────────────────────
/** תוכנית-החלה שמכבדת freeze: לקוח-נעול ⇒ no-op עם frozen=true. */
export function planApplyRespectingFreeze(current, desired, frozen) {
  if (frozen) return { creates: [], updates: [], deletes: [], unchanged: Object.keys(desired), changed: false, frozen: true };
  return { ...planApply(current, desired), frozen: false };
}

// ── 70. סיכום-אצווה (apply-מרובה) ────────────────────────────────────────────
/** מסכם מפת-תוכניות (tenantId→plan) לאצווה: כמה השתנו, סה״כ פעולות. */
export function batchSummary(plans) {
  const entries = Object.entries(plans || {});
  let creates = 0, updates = 0, deletes = 0, changedTenants = 0;
  for (const [, p] of entries) {
    creates += p.creates.length;
    updates += p.updates.length;
    deletes += p.deletes.length;
    if (p.changed) changedTenants++;
  }
  return { tenants: entries.length, changedTenants, creates, updates, deletes };
}
