// הרכיב היחיד של הלוגו. כל הצורה באה מ-brand/logo.ts (מקור יחיד) — להחלפת לוגו לא נוגעים כאן.
import { useId } from 'react';
import { markInner, GAPS, NAME, SLOGAN, TILE, VIEWBOX } from '../brand/logo.ts';

export { BRAND, SLOGAN } from '../brand/logo.ts';

/**
 * הסמל (יד שמשחררת מטבע לארנק). `dark` = מוצג על רקע כהה ⇒ דיו קרם ומטבע ירוק-בהיר.
 * `tile` ⇒ על אריח נייבי (כמו אייקון האפליקציה). בגדלים קטנים (<48) הרווח מטבע↔ארנק מוגדל לשורת-פיקסל נקייה.
 */
export function LogoMark({ size = 36, className = '', dark = false, tile = false }: { size?: number; className?: string; dark?: boolean; tile?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const onDark = dark || tile;
  const gap = size < 48 ? GAPS.inline : GAPS.master;
  const inner = (tile ? TILE : '') + markInner({ onDark, size: tile ? 54 : 60, gap, id });
  return (
    <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width={size} height={size} className={className} aria-hidden="true"
      data-logo="hand-wallet" data-variant={onDark ? 'dark' : 'light'} data-tile={tile ? 'navy' : 'none'}
      // תוכן קבוע מהקוד (לא קלט משתמש) — בטוח
      dangerouslySetInnerHTML={{ __html: inner }} />
  );
}

export function Logo({ dark = false, size = 36 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={`${NAME} – ${SLOGAN}`}>
      <LogoMark size={size} dark={dark} />
      <span className="leading-none">
        <span className={`block font-display font-extrabold text-2xl ${dark ? 'text-white' : 'text-ink-900'}`}>{NAME}</span>
        <span className={`block text-[11px] font-medium mt-0.5 ${dark ? 'text-ink-400' : 'text-ink-500'}`}>{SLOGAN}</span>
      </span>
    </span>
  );
}
