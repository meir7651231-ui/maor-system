/**
 * לוגיקת "מעקב טיפול" (feature supporters.ayin) — פונקציות טהורות בלבד:
 * סדר השלבים, פענוח תוויות דרך מילון המונחים (termOf), חוקיות כפתור-החכם,
 * מעברי שלב ובניית שורות הדוח היומי. אין כאן React / DOM / store — הכול נבדק ביחידה.
 *
 * הפיצ'ר כללי לחלוטין: כל טקסט גלוי עובר דרך termOf כדי שכל ארגון יקרא לו בשמו
 * (nav.ayin / entity.ayinItem / entity.ayinUnit + תוויות השלבים ayin.stage.*).
 * מפתחות השלבים הפנימיים (new/lead/eyes/answer/done) קבועים — רק התצוגה משתנה.
 */
import type { AyinCase, AyinStage, Supporter } from '../types/domain';
import type { OrgConfig } from '../types/config';
import type { Cell } from './csvx';
import { termOf } from './config';
import { normSearch } from './validate';
import { isoToday } from './date-util';

/** סדר השלבים — קבוע; התוויות נגזרות דרך termOf. */
export const AYIN_STAGES: readonly AyinStage[] = ['new', 'lead', 'eyes', 'answer', 'done'];

/** ברירות מחדל ניטרליות לתוויות השלבים (ניתנות לשינוי-שם באשף). */
const STAGE_FALLBACK: Record<AyinStage, string> = {
  new: 'חדש',
  lead: 'בהכנה',
  eyes: 'רישום',
  answer: 'מסירה',
  done: 'הושלם',
};

/** תווית שלב מותאמת-ארגון. */
export function stageLabel(cfg: OrgConfig, stage: AyinStage): string {
  return termOf(cfg, 'ayin.stage.' + stage, STAGE_FALLBACK[stage]);
}

/** שם הפיצ'ר (כותרת הלוח/הכרטיס). */
export function featLabel(cfg: OrgConfig): string {
  return termOf(cfg, 'nav.ayin', 'מעקב טיפול');
}

/** שם פריט בודד למעקב. */
export function itemLabel(cfg: OrgConfig): string {
  return termOf(cfg, 'entity.ayinItem', 'שם לטיפול');
}

/** שם מונה הפריט. */
export function unitLabel(cfg: OrgConfig): string {
  return termOf(cfg, 'entity.ayinUnit', 'כמות');
}

/** מיקום השלב בסדר (0..4). */
export function stageIndex(stage: AyinStage): number {
  const i = AYIN_STAGES.indexOf(stage);
  return i < 0 ? 0 : i;
}

/** השלב הבא, או null בשלב האחרון. */
export function nextStage(stage: AyinStage): AyinStage | null {
  const i = stageIndex(stage);
  return i < AYIN_STAGES.length - 1 ? AYIN_STAGES[i + 1] : null;
}

/** patch לחזרה לשלב קודם — חזרה לפני שלב המסירה מבטלת את דגל הדחיפה. */
export function revertPatch(stage: AyinStage): Partial<AyinCase> {
  const patch: Partial<AyinCase> = { stage };
  if (stageIndex(stage) < stageIndex('answer')) patch.answerPushed = false;
  return patch;
}

/** נרמול שם להשוואת כפילויות — נרמול חיפוש עברי + הסרת רווחים (כמו normName במקור). */
export function normName(s: string): string {
  return normSearch(s).replace(/\s/g, '');
}

/** האם התיק "פעיל" — כלומר עבר אינטראקציה כלשהי ולכן מופיע בלוח הטיפול. */
export function ayinActive(a: AyinCase | null | undefined): boolean {
  if (!a) return false;
  return (
    a.stage !== 'new' ||
    a.names.length > 0 ||
    !!a.lastTouch ||
    a.answers.length > 0 ||
    a.log.length > 0
  );
}

/** סכום המונים על פני כל הפריטים. */
export function eyesTotal(a: AyinCase): number {
  return a.names.reduce((t, x) => t + (+x.eyes || 0), 0);
}

/**
 * האם הכפתור-החכם מוצג בשלב הנוכחי — שלב 'new' דורש לפחות פריט אחד,
 * שלב 'eyes' דורש שנרשם מונה לפחות לאחד הפריטים, 'done' מסתיים.
 */
export function ayinActionVisible(a: AyinCase): boolean {
  const st = a.stage;
  if (st === 'done') return false;
  if (st === 'new') return a.names.length > 0;
  if (st === 'eyes') return a.names.some((n) => n.eyes !== '' && n.eyes != null);
  return true;
}

/** תווית הכפתור-החכם (המקדם לשלב הבא) לפי השלב הנוכחי. */
export function ayinAdvanceLabel(cfg: OrgConfig, a: AyinCase): string {
  const st = a.stage;
  if (st === 'new') return stageLabel(cfg, 'lead') + ' ←';
  if (st === 'lead') return '✓ אישור — ' + stageLabel(cfg, 'lead');
  if (st === 'eyes') return stageLabel(cfg, 'answer') + ' ←';
  if (st === 'answer') return a.answerPushed ? '✓ ' + stageLabel(cfg, 'done') : '📞 דחיפה ללוח';
  return '';
}

/** תוצאת תכנון מעבר-שלב — patch לתיק, מפרט אירוע לוח, וטוסט. */
export interface AyinAdvancePlan {
  patch: Partial<AyinCase>;
  /** אירוע שיש לכתוב ללוח (null = אין). */
  event: { title: string; done: boolean } | null;
  toast: string;
}

/**
 * תכנון פעולת הכפתור-החכם — טהור (לא נוגע ב-store/לוח). מחזיר null אם הכפתור
 * לא אמור לפעול בשלב הנוכחי. ה-store מיישם את ה-patch ויוצר את אירוע הלוח.
 */
export function planAyinAdvance(
  cfg: OrgConfig,
  name: string,
  a: AyinCase,
): AyinAdvancePlan | null {
  if (!ayinActionVisible(a)) return null;
  const feat = featLabel(cfg);
  const item = itemLabel(cfg);
  const unit = unitLabel(cfg);
  const st = a.stage;
  if (st === 'new') {
    return {
      patch: { stage: 'lead' },
      event: { title: `${feat}: ${stageLabel(cfg, 'lead')} — ${name} (${a.names.length} ${item})`, done: false },
      toast: `נרשמו ${a.names.length} — נכנס ללוח: ${stageLabel(cfg, 'lead')}`,
    };
  }
  if (st === 'lead') {
    return {
      patch: { stage: 'eyes' },
      event: { title: `${feat}: ${stageLabel(cfg, 'lead')} ✓ — ${name}`, done: true },
      toast: `אושר — נרשם בלוח ובדוח. עכשיו: ${stageLabel(cfg, 'eyes')}`,
    };
  }
  if (st === 'eyes') {
    const eyes = eyesTotal(a);
    return {
      patch: { stage: 'answer' },
      event: { title: `${feat}: ${stageLabel(cfg, 'answer')} — ${name} (${eyes} ${unit})`, done: false },
      toast: `נרשם — נכנס ללוח: ${stageLabel(cfg, 'answer')}`,
    };
  }
  // st === 'answer'
  if (!a.answerPushed) {
    return {
      patch: { answerPushed: true },
      event: { title: `${feat}: ${stageLabel(cfg, 'answer')} — ${name}`, done: false },
      toast: 'נמסר — נרשם בלוח היומי ובכרטיס',
    };
  }
  return {
    patch: { stage: 'done' },
    event: { title: `${feat}: ${stageLabel(cfg, 'done')} — ${name}`, done: true },
    toast: 'הטיפול הושלם ✓ — נרשם בלוח',
  };
}

/**
 * הוספת פריט לתיק — טהור. dedup לפי שם מנורמל. מחזיר תיק חדש + אולי רשומת log,
 * או שגיאה (השם ריק / כבר קיים).
 */
export function planAddName(
  a: AyinCase,
  rawName: string,
  eyes: number | '',
  id: string,
): { ok: true; names: AyinCase['names']; log?: AyinCase['log'] } | { ok: false; error: string } {
  const nm = rawName.trim();
  if (!nm) return { ok: false, error: 'הקלידו שם לפני ההוספה' };
  const key = normName(nm);
  if (a.names.some((x) => normName(x.name) === key)) {
    return { ok: false, error: `השם "${nm}" כבר ברשימה` };
  }
  const names = [...a.names, { id, name: nm, eyes, done: false }];
  if (eyes !== '' && eyes != null) {
    return { ok: true, names, log: [{ date: isoToday(), eyes: +eyes, name: nm }, ...a.log] };
  }
  return { ok: true, names };
}

/**
 * שורות הדוח היומי — כל מי שטופל היום (lastTouch או רשומת log מהיום).
 * כותרות עוברות דרך מילון המונחים כדי להישאר כלליות. שורה ראשונה = כותרות.
 */
export function ayinDailyRows(cfg: OrgConfig, supporters: Supporter[], todayIso: string): Cell[][] {
  const unit = unitLabel(cfg);
  const item = itemLabel(cfg);
  const rows: Cell[][] = [
    ['שם', 'טלפון', `${unit} היום`, 'שלב', item, 'מתי לדבר שוב', 'הערה'],
  ];
  const touched = supporters.filter(
    (sp) => sp.ayin && (sp.ayin.lastTouch === todayIso || sp.ayin.log.some((l) => l.date === todayIso)),
  );
  for (const sp of touched) {
    const a = sp.ayin!;
    const logToday = a.log.filter((l) => l.date === todayIso);
    const eyesToday = logToday.length
      ? logToday.reduce((t, l) => t + (+l.eyes || 0), 0)
      : eyesTotal(a) || '';
    const namesLine = a.names
      .map((n) => n.name + (n.eyes !== '' && n.eyes != null ? ' ·' + n.eyes : '') + (n.done ? ' ✓' : ''))
      .join(' · ');
    const noteLine = a.answers.map((x) => x.note).join(' | ') || a.note || '';
    rows.push([
      sp.name,
      sp.phone || '',
      eyesToday,
      stageLabel(cfg, a.stage),
      namesLine,
      a.nextTalk ? fmtD(a.nextTalk) : '',
      noteLine,
    ]);
  }
  return rows;
}

/** תצוגת תאריך DD/MM/YYYY מ-ISO (מקומי לדוח). */
function fmtD(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
