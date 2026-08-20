/**
 * שכבת-הפיקוד (קופיילוט ⌘K) — מנוע טהור.
 *
 * בונה רשימת-פקודות שעוטפת פעולות **קיימות** של מסך התורמים (ניווט/פתיחת-מודל/
 * הוספה/פתיחת-כרטיס) ומסננת אותן לפי שאילתה. אפס פעולה חדשה — קיצור-דרך לקיים.
 * טהור לגמרי: אין store/DOM, הפקודה = מתאר `{kind, arg?}` שה-host מריץ.
 */
export type CommandKind =
  | 'add'
  | 'work'
  | 'data'
  | 'import'
  | 'customreport'
  | 'dedup'
  | 'incoming'
  | 'nedarim'
  | 'openDonor';

export type CommandGroup = 'ניווט' | 'פעולה' | 'תורם';

export interface Command {
  id: string;
  kind: CommandKind;
  label: string;
  hint?: string;
  group: CommandGroup;
  /** טקסט-חיפוש מנורמל (שם + מילות-מפתח). */
  keywords: string;
  /** ארגומנט — מזהה-תורם לפקודת openDonor. */
  arg?: string;
}

export interface CommandContext {
  supporters: readonly { id: string; name: string; phone?: string }[];
  cockpitOn: boolean;
  importOn: boolean;
  customReportOn: boolean;
  dedupCount: number;
  /** integrationOn('payments') && ענן-מחובר. */
  paymentsOn: boolean;
  /** termOf entity.supporter — "תומך/ת" בברירת-מחדל. */
  supporterTerm: string;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** בונה את רשימת-הפקודות המלאה לפי ההקשר (דגלים) + כרטיס-לכל-תורם. */
export function buildCommands(ctx: CommandContext): Command[] {
  const out: Command[] = [];
  const push = (c: Command) => out.push({ ...c, keywords: norm(c.label + ' ' + c.keywords) });

  push({ id: 'cmd:add', kind: 'add', label: '➕ הוספת ' + ctx.supporterTerm, group: 'פעולה', keywords: 'הוספה חדש חדשה תורם add new' });
  if (ctx.cockpitOn) {
    push({ id: 'cmd:work', kind: 'work', label: '🎯 חלון העבודה', group: 'ניווט', keywords: 'קוקפיט משימות עבודה היום cockpit' });
    push({ id: 'cmd:data', kind: 'data', label: '☰ מסך הנתונים', group: 'ניווט', keywords: 'טבלה נתונים רשימה סינון data' });
  }
  if (ctx.importOn) push({ id: 'cmd:import', kind: 'import', label: '⬆ ייבוא מקובץ CSV', group: 'פעולה', keywords: 'ייבוא csv excel קובץ import' });
  if (ctx.customReportOn) push({ id: 'cmd:customreport', kind: 'customreport', label: '📊 דו״ח מותאם', group: 'פעולה', keywords: 'דוח מותאם ייצוא טווח report export' });
  if (ctx.dedupCount > 0) push({ id: 'cmd:dedup', kind: 'dedup', label: '🔗 איחוד כפולים · ' + ctx.dedupCount, group: 'פעולה', keywords: 'כפולים מיזוג איחוד dedup merge' });
  if (ctx.paymentsOn) {
    push({ id: 'cmd:incoming', kind: 'incoming', label: '💰 תשלומים נכנסים', group: 'פעולה', keywords: 'תשלומים נכנסים סליקה payments' });
    push({ id: 'cmd:nedarim', kind: 'nedarim', label: '🔄 סנכרון מנדרים', group: 'פעולה', keywords: 'נדרים סנכרון nedarim sync' });
  }

  for (const sp of ctx.supporters) {
    push({
      id: 'donor:' + sp.id,
      kind: 'openDonor',
      arg: sp.id,
      label: sp.name || 'ללא שם',
      hint: 'פתיחת כרטיס',
      group: 'תורם',
      keywords: (sp.name || '') + ' ' + (sp.phone || ''),
    });
  }
  return out;
}

/**
 * מסנן פקודות לפי שאילתה. ריק ⇒ הפעולות (בלי כרטיסי-תורם) בראש. אחרת: כל אסימוני-
 * השאילתה חייבים להתקיים, דירוג לפי איכות-ההתאמה בתווית.
 */
export function filterCommands(commands: readonly Command[], query: string, limit = 12): Command[] {
  const q = norm(query);
  if (!q) return commands.filter((c) => c.kind !== 'openDonor').slice(0, limit);

  const tokens = q.split(' ');
  const scored: { c: Command; score: number }[] = [];
  for (const c of commands) {
    if (!tokens.every((t) => c.keywords.includes(t))) continue;
    const nl = norm(c.label);
    let score = nl === q ? 100 : nl.startsWith(q) ? 60 : nl.includes(q) ? 40 : 20;
    // הטיה קלה לטובת פעולות על-פני כרטיסי-תורם בשוויון
    if (c.kind !== 'openDonor') score += 5;
    scored.push({ c, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.c);
}
