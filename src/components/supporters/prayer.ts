/**
 * 🙏 שמות לתפילה — מנוע טהור (בקשת-בעלים 5.9 "לשמור בתורמים שמות לתפילה עם הערות
 * בתוך הכרטיס"). בלי store/DOM. דדופ לפי שם מנורמל; הערה חופשית לכל שם.
 */
import type { PrayerName } from '../../types/domain';

export function normPrayerName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

export interface PrayerPlan {
  list: PrayerName[];
  /** true ⇒ השם כבר קיים (לא נוסף). */
  dup: boolean;
}

/** הוספת שם — דדופ (שם מנורמל), הערה מנוקה, addedAt מוזרק (דטרמיניסטי). */
export function planAddPrayerName(list: readonly PrayerName[], id: string, name: string, note: string, todayIso: string): PrayerPlan {
  const nm = name.trim().replace(/\s+/g, ' ');
  if (!nm) return { list: [...list], dup: false };
  const key = normPrayerName(nm);
  if (list.some((p) => normPrayerName(p.name) === key)) return { list: [...list], dup: true };
  return { list: [...list, { id, name: nm, note: note.trim(), addedAt: todayIso, done: false }], dup: false };
}

export function setPrayerNote(list: readonly PrayerName[], id: string, note: string): PrayerName[] {
  return list.map((p) => (p.id === id ? { ...p, note } : p));
}

export function togglePrayerName(list: readonly PrayerName[], id: string): PrayerName[] {
  return list.map((p) => (p.id === id ? { ...p, done: !p.done } : p));
}

export function removePrayerName(list: readonly PrayerName[], id: string): PrayerName[] {
  return list.filter((p) => p.id !== id);
}

/** מונה פעילים (לא-הוזכרו) — לצ׳יפ בכותרת. */
export function prayerOpenCount(list: readonly PrayerName[] | undefined): number {
  return (list ?? []).filter((p) => !p.done).length;
}

/** טקסט להעתקה/שיתוף — שורה לשם: "שם — הערה" (הערה ריקה ⇒ רק שם); הוזכרו בסוף עם ✓. */
export function prayerListText(list: readonly PrayerName[], title = ''): string {
  const open = list.filter((p) => !p.done);
  const done = list.filter((p) => p.done);
  const line = (p: PrayerName) => (p.done ? '✓ ' : '') + p.name + (p.note.trim() ? ' — ' + p.note.trim() : '');
  return [title, ...open.map(line), ...done.map(line)].filter(Boolean).join('\n');
}
