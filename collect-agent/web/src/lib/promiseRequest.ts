// הכרעת ראש צוות q21-19 (20.11): הבטחה מעבר ל-14 יום ⇒ השרת מקבל עד 14 ופותח «בדוק ואשר» (owner_actions) —
// בעל העסק מאשר את המועד המבוקש או מסרב (POST /customers/{cid}/promise-request {approve}).
export const PROMISE_REVIEW_PREFIX = 'בדוק ואשר:';

/** הכרטיס הוא בקשת מועד מעבר למגבלה — לפי הפעולה שהשרת ניסח (app/conversation.py, promise_over_limit). */
export function isPromiseOverLimit(d: { intent: string; owner_actions: string[] }): boolean {
  return d.intent === 'promise' && d.owner_actions.some(a => a.startsWith(PROMISE_REVIEW_PREFIX));
}

/** מבקר 197 (השרת): ההכרעה מנסחת עדכון ללקוח — טיוטה חדשה **לאישור** (`draft`) שמחליפה תשובה שעוד לא יצאה
 *  (`replaced`). null ⇒ אין עדכון (הלקוח ביקש הסרה / אין כתובת לערוץ). */
export type PromiseCustomerUpdate = { draft: number; replaced: number[] } | null;
export type PromiseDecision = { customer: number; requested: string; approved: boolean; paused_until: string;
  customer_update?: PromiseCustomerUpdate };

/** מנהל 360 (עיצוב, פתוח מ-356): אחרי «בדוק ואשר» בעל העסק לא ידע שנוצר עדכון ללקוח שממתין **לאישורו** — הטוסט
 *  אמר רק «אושר». עכשיו: מה הוכרע + מה קורה עם הלקוח (עדכון בתור / התשובה הקודמת הוחלפה / אין עדכון ולמה). */
export function promiseDecisionText(r: Pick<PromiseDecision, 'approved' | 'customer_update'>): string {
  const head = r.approved ? '✓ המועד המבוקש אושר — אין תזכורות עד אז' : 'המועד לא אושר — התזכורות יחזרו אחרי 14 יום';
  const u = r.customer_update;
  if (!u) return `${head} · ללקוח/ה לא נוסח עדכון (ביקש/ה הסרה או שאין כתובת)`;
  const swap = u.replaced.length ? 'התשובה הקודמת הוחלפה, ו' : '';
  return `${head} · ${swap}עדכון ללקוח/ה ממתין לאישורך בתור`;
}

/** מזהה הכרטיס בתור שאליו קופצים אחרי ההכרעה (null ⇒ אין עדכון). */
export function promiseUpdateAnchor(r: Pick<PromiseDecision, 'customer_update'>): string | null {
  return r.customer_update ? `draft-${r.customer_update.draft}` : null;
}
