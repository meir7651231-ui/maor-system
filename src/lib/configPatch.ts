/**
 * 🩹 תיקון-קונפיג נקודתי (6.10.2026, "40 יום נדלק ונכבה לבד"):
 *
 * הבאג: לוח-הבקרה והאשף-המרוחק כתבו לענן את **כל** הקונפיג מתצלום-המסך שלהם. שני משטחים
 * (שני טאבים / לוח-בקרה + אשף) שנפתחו בזמנים שונים מחזיקים תצלומים שונים — וכל לחיצה באחד
 * דורסת את מה שהשני כבר שינה (לקח 3.9: "תצלום ⇒ apply גורף = דריסה"). אחרי #504 (החלפה
 * אמיתית במקום merge:true) הדריסה הפכה גלויה: דגל שהודלק כאן כובה משם, ולהפך.
 *
 * הפתרון: כותבים **רק מה שהמשתמש שינה** — diff בין הקונפיג-הקודם לחדש, כרשימת פעולות
 * שדה-שדה (מפות features/modules/terms/… ברמת-מפתח; שאר השדות — ערך שלם). סדרת כתיבות
 * ממקורות שונים מתכנסת (האחרון מנצח פר-מפתח) במקום להתחלף.
 *
 * טהור לחלוטין — אפס Firestore/DOM. ההמרה ל-FieldPath/deleteField ב-cloudConfig.
 */
import type { OrgConfig } from '../types/config';

/** פעולה אחת: `path` תחת `config` (למשל ['features','supporters.segula']); `value` חסר = מחיקת-השדה. */
export interface ConfigPatchOp {
  path: string[];
  value?: unknown;
  del?: true;
}

/** מפות ברמת-מפתח (מפתח-אחד = שינוי-אחד); שאר השדות העליונים נכתבים כערך שלם. */
export const CONFIG_MAP_FIELDS = ['features', 'modules', 'terms', 'integrations', 'templates', 'roles', 'telephony'] as const;

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const isMap = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/**
 * רשימת-הפעולות שמביאה את הענן מ-prev ל-next — דטרמיניסטית, ממוינת לפי נתיב.
 * prev=null (לא ידוע) ⇒ כותבים הכול (כל מפתח של כל מפה + כל שדה) — בלי מחיקות.
 */
export function configPatchOps(prev: OrgConfig | null, next: OrgConfig): ConfigPatchOp[] {
  const ops: ConfigPatchOp[] = [];
  const p = (prev ?? {}) as Record<string, unknown>;
  const n = next as unknown as Record<string, unknown>;
  const keys = new Set([...Object.keys(p), ...Object.keys(n)]);
  for (const k of [...keys].sort()) {
    if (k === 'slug') continue; // ה-slug = הכתובת; לא נכתב מהאשף
    const pv = p[k];
    const nv = n[k];
    if ((CONFIG_MAP_FIELDS as readonly string[]).includes(k) && (isMap(pv) || isMap(nv))) {
      const pm = isMap(pv) ? pv : {};
      const nm = isMap(nv) ? nv : {};
      if (!isMap(nv) && prev !== null && isMap(pv)) {
        // המפה כולה הוסרה (נדיר) — מוחקים כל מפתח שהיה, לא את המפה (שומר על תאימות קוראים)
        for (const mk of Object.keys(pm).sort()) ops.push({ path: [k, mk], del: true });
        continue;
      }
      const mkeys = new Set([...Object.keys(pm), ...Object.keys(nm)]);
      for (const mk of [...mkeys].sort()) {
        const a = pm[mk];
        const b = nm[mk];
        if (!(mk in nm)) {
          if (prev !== null) ops.push({ path: [k, mk], del: true });
        } else if (prev === null || !same(a, b)) ops.push({ path: [k, mk], value: b });
      }
      continue;
    }
    if (!(k in n) || nv === undefined) {
      if (prev !== null && k in p) ops.push({ path: [k], del: true });
    } else if (prev === null || !same(pv, nv)) ops.push({ path: [k], value: nv });
  }
  return ops;
}

/** החלת רשימת-פעולות על קונפיג (לסימולציה/בדיקות) — מחזיר עותק. */
export function applyConfigPatch(base: OrgConfig, ops: readonly ConfigPatchOp[]): OrgConfig {
  const out = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  for (const op of ops) {
    if (op.path.length === 1) {
      if (op.del) delete out[op.path[0]];
      else out[op.path[0]] = JSON.parse(JSON.stringify(op.value ?? null));
      continue;
    }
    const [mapKey, k] = op.path;
    const m = isMap(out[mapKey]) ? (out[mapKey] as Record<string, unknown>) : {};
    if (op.del) delete m[k];
    else m[k] = JSON.parse(JSON.stringify(op.value ?? null));
    out[mapKey] = m;
  }
  return out as unknown as OrgConfig;
}
