/**
 * 📞 מנוע חייגן-הקופות (22.10) — טהור, בלי store/DOM. אותה מכונת-מצב כמו lib/dialer
 * (תור לפי-סדר · הנוכחי בחזית · לא-ענה/דלג חוזרים לסוף-התור · ↩ ביטול), אבל עם
 * תוצאות של קופות ובמבנה נפרד — בידוד הקופות מהתורמים (הכרעת בעלים 30.7).
 * חויגים: המשפחה שהקופה אצלה (הכרעת-בעלים 22.10 "א").
 */
import type { Db, TzDialerCampaign, TzDialLogEntry, TzDialOutcome } from '../../types/domain';

export const TZ_REQUEUE: readonly TzDialOutcome[] = ['noanswer', 'skip'];

export const TZ_OUTCOME_LABELS: Record<TzDialOutcome, string> = {
  scheduled: 'תואם ריקון',
  noanswer: 'לא ענה',
  callback: 'לחזור',
  lost: 'הקופה לא אצלם / אבדה',
  done: 'טופל',
  skip: 'דילוג',
};

/** הטלפון לחיוג של קופה — של המשפחה שהקופה אצלה; '' כשאין משפחה או טלפון. */
export function tzBoxPhone(db: Pick<Db, 'families'>, box: { famId: string }): string {
  if (!box.famId) return '';
  const fam = db.families.find((f) => f.id === box.famId);
  return (fam?.phone ?? '').trim();
}

/** פתיחת קמפיין: דדופ + סינון-ריקים; הסדר נשמר. */
export function tzStartCampaign(name: string, ids: string[], iso: string): TzDialerCampaign {
  const queue = [...new Set(ids.filter(Boolean))];
  return { name, startedAt: iso, queue, total: queue.length, log: [] };
}

export function tzCurrentId(c: TzDialerCampaign): string | null {
  return c.queue.length ? c.queue[0] : null;
}

/** תוצאה על הנוכחי: נרשמת ליומן ומקדמת; לא-ענה/דלג ⇒ לסוף-התור. בלי נוכחי — no-op. */
export function tzApplyOutcome(c: TzDialerCampaign, entry: Omit<TzDialLogEntry, 'id'>): TzDialerCampaign {
  const id = tzCurrentId(c);
  if (!id) return c;
  const rest = c.queue.slice(1);
  const queue = TZ_REQUEUE.includes(entry.outcome) ? [...rest, id] : rest;
  const e: TzDialLogEntry = { id, ...entry };
  if (!e.note?.trim()) delete e.note;
  return { ...c, queue, log: [...c.log, e] };
}

/** ↩ ביטול האחרון — המתקשר חוזר לחזית (ומוסר מסוף-התור אם הוחזר לשם). */
export function tzUndoLast(c: TzDialerCampaign): TzDialerCampaign {
  const last = c.log[c.log.length - 1];
  if (!last) return c;
  let queue = c.queue;
  if (TZ_REQUEUE.includes(last.outcome)) {
    const at = queue.lastIndexOf(last.id);
    if (at >= 0) queue = [...queue.slice(0, at), ...queue.slice(at + 1)];
  }
  return { ...c, queue: [last.id, ...queue], log: c.log.slice(0, -1) };
}

/** התקדמות: כמה נסגרו/נותרו + ספירה פר-תוצאה (לא-ענה/דלג — פר-קופה, לא פר-ניסיון). */
export function tzProgress(c: TzDialerCampaign): { total: number; remaining: number; finalized: number; counts: Record<TzDialOutcome, number> } {
  const counts: Record<TzDialOutcome, number> = { scheduled: 0, noanswer: 0, callback: 0, lost: 0, done: 0, skip: 0 };
  const seen = new Set<string>();
  for (const e of c.log) {
    if (TZ_REQUEUE.includes(e.outcome)) {
      const k = e.outcome + '|' + e.id;
      if (seen.has(k)) continue;
      seen.add(k);
    }
    counts[e.outcome]++;
  }
  const remaining = new Set(c.queue).size;
  return { total: c.total, remaining, finalized: Math.max(0, c.total - remaining), counts };
}

/** סיכום-CSV: שורה פר-ניסיון, בסדר כרונולוגי. */
export function tzCampaignCsvRows(c: TzDialerCampaign, nameOf: (boxId: string) => string): (string | number)[][] {
  const rows: (string | number)[][] = [['קופה', 'תוצאה', 'הערה', 'מתי']];
  for (const e of c.log) rows.push([nameOf(e.id), TZ_OUTCOME_LABELS[e.outcome], e.note ?? '', e.at]);
  return rows;
}
