// הכרעת ראש צוות q21-19 (20.11): הבטחה מעבר ל-14 יום ⇒ השרת מקבל עד 14 ופותח «בדוק ואשר» (owner_actions) —
// בעל העסק מאשר את המועד המבוקש או מסרב (POST /customers/{cid}/promise-request {approve}).
export const PROMISE_REVIEW_PREFIX = 'בדוק ואשר:';

/** הכרטיס הוא בקשת מועד מעבר למגבלה — לפי הפעולה שהשרת ניסח (app/conversation.py, promise_over_limit). */
export function isPromiseOverLimit(d: { intent: string; owner_actions: string[] }): boolean {
  return d.intent === 'promise' && d.owner_actions.some(a => a.startsWith(PROMISE_REVIEW_PREFIX));
}
