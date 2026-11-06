// הרכיב היחיד של הלוגו. כל הצורה באה מ-brand/logo.ts (מקור יחיד) — להחלפת לוגו לא נוגעים כאן.
import { markInner, NAME, SLOGAN, VIEWBOX } from '../brand/logo.ts';

export { BRAND, SLOGAN } from '../brand/logo.ts';

/**
 * הסמל. `dark` = מוצג על רקע כהה ⇒ אריח קרם מאחוריו (העין נשארת navy).
 * `tile` מכריח אריח גם על רקע בהיר (למשל אייקון אפליקציה).
 */
export function LogoMark({ size = 36, className = '', dark = false, tile }: { size?: number; className?: string; dark?: boolean; tile?: boolean }) {
  const withTile = tile ?? dark;
  return (
    <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width={size} height={size} className={className} aria-hidden="true"
      data-logo="gimel-smile" data-tile={withTile ? 'cream' : 'none'}
      // תוכן קבוע מהקוד (לא קלט משתמש) — בטוח
      dangerouslySetInnerHTML={{ __html: markInner(withTile) }} />
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
