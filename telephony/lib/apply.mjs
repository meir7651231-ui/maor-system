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
