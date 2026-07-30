/**
 * נגישות — הלוגיקה הטהורה של סולם הגופן והמתגים (P2 פער 31).
 *
 * מקור האמת: legacy-main-script.js:3184-3194 — זום 0.8–1.6 בצעדי 0.1
 * (uiInc/uiDec, 'maorclean2_ui_scale') + 4 מתגי acc ('maorclean2_acc').
 * ה-FAB הצף (♿, markup:2919) נגיש מכל מסך; התוויות כאן מילה-במילה.
 *
 * קובץ טהור: אין React/DOM/localStorage — עיגול הצעדים וניתוח ההעדפות
 * נבדקים ביחידה. ההחלה על ה-DOM ב-components/settings/a11yApply.ts.
 */

/** גבולות הזום כמו בלגאסי (script:3193-3194): min .8, max 1.6, צעד .1. */
export const SCALE_MIN = 0.8;
export const SCALE_MAX = 1.6;
export const SCALE_STEP = 0.1;

export interface AccPrefs {
  contrast: boolean;
  noanim: boolean;
  /** הדגשת כפתורים וקישורים — קו תחתון לקישורים, מסגרת עדינה לכפתורים. */
  links: boolean;
  /** ריווח טקסט מוגדל — אותיות, מילים ושורות. */
  spacing: boolean;
}

/** 4 המתגים בסדר ובנוסח הלגאסי (script:3185). */
export const A11Y_FAB_TOGGLES: ReadonlyArray<readonly [keyof AccPrefs, string]> = [
  ['contrast', 'ניגודיות גבוהה'],
  ['links', 'הדגשת כפתורים וקישורים'],
  ['noanim', 'עצירת אנימציות ותנועה'],
  ['spacing', 'ריווח טקסט מוגדל'],
];

/** הצמדה לגבולות; ערך לא-מספרי = 1 (ברירת המחדל). */
export function clampScale(v: number): number {
  if (!Number.isFinite(v)) return 1;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, v));
}

/**
 * צעד אחד למעלה/למטה — העיגול כמו בלגאסי (Math.round(v*10)/10, script:3193)
 * כדי שלא יצטברו שאריות float (‎1.1+0.1=1.2000000000000002‎).
 */
export function stepScale(v: number, dir: 1 | -1): number {
  return clampScale(Math.round((clampScale(v) + dir * SCALE_STEP) * 10) / 10);
}

/** ניתוח JSON ההעדפות — קלט פגום/חלקי מתקבל בשקט כברירות מחדל. */
export function parseAcc(raw: string | null): AccPrefs {
  const off: AccPrefs = { contrast: false, noanim: false, links: false, spacing: false };
  if (!raw) return off;
  try {
    const a = JSON.parse(raw) as Partial<AccPrefs> | null;
    return { contrast: !!a?.contrast, noanim: !!a?.noanim, links: !!a?.links, spacing: !!a?.spacing };
  } catch {
    return off;
  }
}
