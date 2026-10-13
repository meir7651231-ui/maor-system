/**
 * 🙏 שמות לתפילה — מנוע טהור (בקשת-בעלים 5.9 "לשמור בתורמים שמות לתפילה עם הערות
 * בתוך הכרטיס"). בלי store/DOM. דדופ לפי שם מנורמל; הערה חופשית לכל שם.
 */
import type { PrayerName, Supporter } from '../../types/domain';

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

// ---------- 🖨 קובץ מסודר להדפסה/PDF (בקשת-בעלים 13.10 "שמות לתפילה להורדה — קובץ מסודר") ----------

/** קבוצת-שמות של תורם אחד לקובץ. */
export interface PrayerGroup {
  supId: string;
  supName: string;
  names: PrayerName[];
}

/**
 * השמות הפעילים (טרם-הוזכרו) מכל התורמים, מקובצים לפי תורם וממוינים לפי שם-התורם.
 * תורם בלי שמות-פעילים לא נכלל. הקורא אחראי להעביר רק תורמים גלויים (ייעוד-הרשאה).
 */
export function prayerGroups(supporters: readonly Pick<Supporter, 'id' | 'name' | 'prayerNames'>[]): PrayerGroup[] {
  return supporters
    .map((s) => ({ supId: s.id, supName: (s.name || '').trim(), names: (Array.isArray(s.prayerNames) ? s.prayerNames : []).filter((p) => p && !p.done && p.name) }))
    .filter((g) => g.names.length > 0)
    .sort((a, b) => a.supName.localeCompare(b.supName, 'he'));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * מסמך-HTML מסודר להדפסה (ושמירה כ-PDF): כותרת + תאריך + ספירה, ותחת כל תורם רשימה ממוספרת
 * "שם — הערה". RTL, ידידותי-להדפסה (קבוצה לא נחצית בין עמודים). escaping מלא — אפס הזרקת-HTML.
 */
export function prayerDocHtml(groups: readonly PrayerGroup[], opts: { title: string; dateLabel: string }): string {
  const total = groups.reduce((n, g) => n + g.names.length, 0);
  const body = groups.length
    ? groups
        .map(
          (g) =>
            `<section class="grp"><h2>${esc(g.supName || '—')}</h2><ol>` +
            g.names.map((p) => {
              const note = (p.note || '').trim();
              return `<li>${esc(p.name)}${note ? `<span class="note"> — ${esc(note)}</span>` : ''}</li>`;
            }).join('') +
            `</ol></section>`,
        )
        .join('')
    : '<p class="empty">אין שמות לתפילה.</p>';
  return (
    `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${esc(opts.title)}</title><style>` +
    `@page{margin:14mm}body{font-family:Arial,'Segoe UI',sans-serif;color:#1d1b16;margin:0;padding:8px 4px;line-height:1.55}` +
    `h1{font-size:22px;margin:0 0 2px}.meta{color:#6b6559;font-size:13px;margin-bottom:16px;border-bottom:1px solid #d8cfbf;padding-bottom:8px}` +
    `.grp{break-inside:avoid;margin:0 0 14px}h2{font-size:16px;margin:0 0 4px}ol{margin:0;padding-inline-start:22px}li{font-size:15px;margin:2px 0}` +
    `.note{color:#6b6559;font-size:13.5px}.empty{color:#6b6559}` +
    `</style></head><body><h1>${esc(opts.title)}</h1><div class="meta">${esc(opts.dateLabel)} · ${total} שמות</div>${body}</body></html>`
  );
}

/** טקסט להעתקה/שיתוף — שורה לשם: "שם — הערה" (הערה ריקה ⇒ רק שם); הוזכרו בסוף עם ✓. */
export function prayerListText(list: readonly PrayerName[], title = ''): string {
  const open = list.filter((p) => !p.done);
  const done = list.filter((p) => p.done);
  const line = (p: PrayerName) => (p.done ? '✓ ' : '') + p.name + (p.note.trim() ? ' — ' + p.note.trim() : '');
  return [title, ...open.map(line), ...done.map(line)].filter(Boolean).join('\n');
}
