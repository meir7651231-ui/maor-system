/**
 * 🔌 המרכזייה — ☀ תקציר-היום (BUILD-ORDER-SWITCHBOARD-2026-10-13, חיבור ד׳): "2 הגעות, הנזילה טופלה, שבת נכנסת 17:43".
 *
 * `todaySummary(ctx)` עובר על כל יכולת **זמינה** שהספק שלה נטען ושיש לה `today`, שואל אותה דרך `ask` (אותם שערים),
 * ואוסף שורות עבריות בסדר-הרישום. ספק שנכשל — שותק (לעולם לא זורק). טהור: אותו ctx ⇒ אותן שורות.
 * עזרי-הטקסט (כותרת · טקסט-להעתקה · קישור-שיתוף) — טהורים, בלי DOM.
 */
import type { OrgConfig } from '../../types/config';
import { isoAt, type SummaryLine, type SwitchCtx } from './contract';
import { ask, listAbilities, todayHook, type AbilityId, type AbilityInfo } from './registry';

/** שורות-התקציר מכל יכולת זמינה שנטענה (בסדר-הרישום; ריקות נזרקות). */
export function todaySummary(ctx: SwitchCtx): SummaryLine[] {
  const out: SummaryLine[] = [];
  let infos: AbilityInfo[] = [];
  try {
    infos = listAbilities(ctx.config);
  } catch {
    return out;
  }
  for (const info of infos) {
    const hook = todayHook(info.id);
    if (!hook) continue;
    const r = ask(info.id as AbilityId, ctx, hook.input as never);
    if (!r.ok) continue;
    let lines: readonly string[] = [];
    try {
      lines = hook.lines(r.value as never, ctx);
    } catch {
      continue; // מנסח שנכשל — הכלי שותק, השאר ממשיכים
    }
    if (!Array.isArray(lines)) continue;
    for (const t of lines) {
      const text = typeof t === 'string' ? t.replace(/\s+/g, ' ').trim() : '';
      if (text) out.push({ ability: info.id, module: info.module, text });
    }
  }
  return out;
}

/**
 * תנאי-הכרטיס (חיבור ד׳): יש יכולת זמינה של כלי **אחר** מ-self. כלי יחיד ⇒ אין "מערכת אחת" לאסוף ⇒ הכרטיס לא מוצג
 * (והמסך ביט-זהה).
 */
export function hasOtherTool(config: OrgConfig, self: string): boolean {
  return listAbilities(config).some((a) => a.module !== self);
}

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;

/** "☀ תקציר היום · יום רביעי 14/10" — בשעון-הארגון. */
export function summaryHeader(nowMs: number): string {
  const iso = isoAt(nowMs);
  const dow = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay();
  return '☀ תקציר היום · יום ' + (DAY_NAMES[dow] ?? '') + ' ' + iso.slice(8, 10) + '/' + iso.slice(5, 7);
}

/** הטקסט להעתקה/שיתוף: כותרת + שורה לכל פריט. */
export function summaryText(lines: readonly SummaryLine[], header: string): string {
  return [header, ...lines.map((l) => '• ' + l.text)].join('\n');
}

/** קישור "שתף בוואטסאפ" בלי נמען — wa.me, או סכמת-האפליקציה (מצב סינון-כשר — `whatsapp.mode = 'app'`). */
export function shareWaUrl(text: string, appScheme: boolean): string {
  const t = encodeURIComponent(text);
  return appScheme ? 'whatsapp://send?text=' + t : 'https://wa.me/?text=' + t;
}
