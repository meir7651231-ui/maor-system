// מנהל 328: «צוות ותפקידים» מעל GET /team · POST /team/{id}/role · POST /team/{id}/deactivate · POST /team/{id}/reactivate (מנהל 329).
// טהור — נבדק ב-tests/lib.check.ts. השרת אוכף הכול (403 לעובד, 422 לבעלים האחרון/לעצמכם); כאן רק כפתורים כנים.
import type { Me } from '../api.ts';

export type Role = 'owner' | 'staff';
export interface TeamUser { id: number; name: string; email: string; role: Role; active: boolean; created_at: string }
export interface Team { users: TeamUser[]; me: number | null }

export const ROLE_LABEL: Record<Role, string> = { owner: 'בעל העסק', staff: 'עובד' };

/** רק בעל העסק רואה את המסך: הטוקן המשותף, או עובד מחובר בתפקיד בעלים. me=null ⇒ לא מציגים (השרת יחזיר 403). */
export const teamVisible = (me: Me | null) => me != null && (me.kind === 'owner' || me.owner === true);

const activeOwners = (t: Team) => t.users.filter(u => u.active && u.role === 'owner').length;

export interface RowActions { toggleRole: Role | null; deactivate: boolean; reactivate: boolean; why: string | null }

/** אילו פעולות מוצגות לשורה — מראה של Users.set_role_id / deactivate_id. */
export function rowActions(t: Team, u: TeamUser): RowActions {
  // מנהל 329: מושבת ⇒ «הפעלה מחדש» (חוזר כעובד; קידום = פעולה נפרדת). מראה של Users.reactivate_id.
  if (!u.active) return { toggleRole: null, deactivate: false, reactivate: true, why: 'מושבת — חוזר כעובד' };
  const lastOwner = u.role === 'owner' && activeOwners(t) <= 1;
  const self = t.me === u.id;
  return {
    toggleRole: u.role === 'owner' ? (lastOwner ? null : 'staff') : 'owner',
    deactivate: !self && !lastOwner,
    reactivate: false,
    why: lastOwner ? 'בעל העסק הפעיל היחיד — קודם מנו בעלים נוסף' : self ? 'זה אתם' : null,
  };
}

export const roleButtonLabel = (to: Role) => to === 'owner' ? 'מינוי לבעל העסק' : 'הורדה לעובד';

export type TeamAct = Role | 'deactivate' | 'reactivate';

export function confirmText(u: TeamUser, act: TeamAct): string {
  if (act === 'reactivate') return `להפעיל מחדש את ${u.name}? יחזור כעובד ויוכל להיכנס עם הסיסמה והאימות הדו-שלבי שלו.`;
  if (act === 'deactivate') return `להשבית את ${u.name}? כל הכניסות הפתוחות שלו ינותקו מיד.`;
  return act === 'owner'
    ? `למנות את ${u.name} לבעל העסק? הוא יוכל לחדש שליחה אחרי שחזור ולנהל את הצוות.`
    : `להוריד את ${u.name} לעובד?`;
}
