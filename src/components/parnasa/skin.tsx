/**
 * 📒 פרנסה׳לע — ערכת-הממשק של המקור (עיצוב 1): השפה החזותית של האפליקציה המקורית בתוך אורביט.
 *
 * כל מחלקה בקידומת pn- (parnasa.css — הסקין מוגבל-השורש), אייקוני-הקו מהספרייה של המקור (‎#pn-i-…, svgDefs.ts),
 * חותם-הזהב, תג-המצב (פתוח/בקרוב/סגור/שבת), הפושקע. שכבת-הפורטל עוטפת ב-‎.pn עם אותה ערכה (בהיר/לילה, אותיות
 * גדולות, שבת) כדי שהגיליון/האור-הקופסה/השכבות יחולו עליהם בסקין — כמו `HPortal` של האירוח.
 * HTML גולמי (RawHtml) — רק למחרוזות-SVG סטטיות שנבנות מקבועי-המקור (מטבעות/פושקע/באנרים); כל טקסט-משתמש
 * שנכנס אליהן עובר esc() — ננעל ב-parnasa-skin.test.
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PN_SVG_DEFS } from './svgDefs';
import type { PrOpenState } from './lib';

/** "btn primary" ⇒ "pn-btn pn-primary" — שמות-המחלקות של המקור בקידומת-הסקין. */
export function pn(names: string): string {
  return names
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => 'pn-' + c)
    .join(' ');
}

/** חיבור מחלקות מותנה. */
export function cx(...xs: Array<string | false | null | undefined | 0>): string {
  return xs.filter(Boolean).join(' ');
}

/** esc() של המקור — לכל טקסט שנכנס למחרוזת-SVG/HTML. */
export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** משתני-CSS מקומיים (‎--pn-i, ‎--pn-c…) לסגנון-inline. */
export function vars(o: Record<string, string | number>, extra: CSSProperties = {}): CSSProperties {
  const out: Record<string, string | number> = { ...(extra as Record<string, string | number>) };
  for (const [k, v] of Object.entries(o)) out['--pn-' + k] = v;
  return out as CSSProperties;
}

/** אייקון-קו של המקור: ic(name, "f") ⇒ <svg class="i f"><use href="#i-name"/></svg>. */
export function Ic(props: { n: string; f?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <svg className={cx('pn-i', props.f && 'pn-f', props.className)} style={props.style} aria-hidden="true" focusable="false">
      <use href={'#pn-i-' + props.n} />
    </svg>
  );
}

/** הכתר של המקור (CROWN) — חותמות "מומלץ", כתרי-חסות. */
export function Crown(props: { style?: CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true" focusable="false" style={props.style} className={props.className}>
      <path d="M2 14 L3.4 4.5 L8 9 L12 2 L16 9 L20.6 4.5 L22 14Z" fill="currentColor" />
    </svg>
  );
}

/** חותם-הזהב ("מומלץ"). */
export function Seal(props: { children?: ReactNode }) {
  return (
    <span className="pn-seal">
      <Crown />
      {props.children ?? 'מומלץ'}
    </span>
  );
}

/** משבצת-הפושקע (‎.pm — רסטר-הסמל של המקור). */
export function Pm(props: { c?: string }) {
  return <span className={cx('pn-pm', props.c && pn(props.c))} aria-hidden="true" />;
}

/** תג-מצב (stPill במקור): פנוי עכשיו · נפתח בקרוב · סגור עכשיו · חוזר במוצ״ש. */
export function StPill(props: { st: PrOpenState | null; brief?: boolean }) {
  const st = props.st;
  if (!st) return null;
  return (
    <span className={'pn-st pn-' + st.k}>
      <i />
      {st.t}
      {st.sub && !props.brief ? <small>{'· ' + st.sub}</small> : null}
    </span>
  );
}

/** HTML-SVG סטטי (מטבע/פושקע/באנר/defs) — רק ממחוללי-המקור; טקסט-משתמש בתוכו עבר esc(). */
export function RawHtml(props: { html: string; className?: string; style?: CSSProperties; tag?: 'span' | 'div' | 'g' }) {
  const Tag = props.tag ?? 'span';
  return <Tag className={props.className} style={props.style} dangerouslySetInnerHTML={{ __html: props.html }} />;
}

/** ה-<defs> של המקור (אייקונים, צבעי-מטבעות, שכבות-באנר) — פעם אחת בשורש-המודול. */
export function PnDefs() {
  return <RawHtml html={PN_SVG_DEFS} className="pn-defs" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />;
}

/* ═══════════════ הקשר-הסקין: ערכה + שכבת-פורטל ═══════════════ */

/** מצב-התצוגה של הצופה — מועבר לשכבת-הפורטל כדי שתלבש אותה ערכה. */
export interface PnSkin {
  theme: 'light' | 'dark' | null;
  big: boolean;
  calm: boolean;
  period: string;
}
export const PnSkinCtx = createContext<PnSkin>({ theme: null, big: false, calm: false, period: '' });
export function usePnSkin(): PnSkin {
  return useContext(PnSkinCtx);
}

/** תכונות-השורש של הסקין (שורש-המודול ושכבת-הפורטל). */
export function skinAttrs(s: PnSkin): Record<string, string | undefined> {
  return {
    'data-pn-theme': s.theme ?? undefined,
    'data-calm': s.calm ? '' : undefined,
    'data-period': s.period || undefined,
  };
}

/** שכבת-הפורטל — עוטפת ב-‎.pn כדי שהסקין (טוקנים/גופנים/ערכה) יחול על הגיליון והשכבות. ברינדור-שרת — inline. */
export function PnPortal(props: { children: ReactNode }) {
  const s = usePnSkin();
  const node = (
    <div className={cx('pn pn-portal', s.big && 'pn-big')} {...skinAttrs(s)}>
      {props.children}
    </div>
  );
  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}

/**
 * שכבת-אורביט: מודאל/כפתור-צף של אורביט שנפתח מתוך המודול (טפסים שעוד לא הולבשו, StickyBackBar) — מוצג על body,
 * מחוץ לשורש-המבודד של הסקין (‎.pn-root יוצר הקשר-ערימה), כדי שיעלה מעל הכרום של אורביט כמו בכל מסך. ברינדור-שרת — inline.
 */
export function OrbitLayer(props: { children: ReactNode }) {
  if (typeof document === 'undefined') return <>{props.children}</>;
  return createPortal(props.children, document.body);
}
