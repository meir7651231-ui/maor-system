// לוגו גבי (הכרעת מאיר 6.11): האות ג בירוק #10B981 עם בסיס מחייך ועין נייבי #0F172A. בועת הצ'אט הירוקה בוטלה.
// על רקע כהה העין בצבע השמנת #FBF8F1, כדי שלא תיעלם.
export const BRAND = { green: '#10B981', navy: '#0F172A', cream: '#FBF8F1' } as const;
export const SLOGAN = 'תזכורות תשלום';

export function LogoMark({ size = 36, className = '', dark = false }: { size?: number; className?: string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" data-logo="gimel-smile">
      <path d="M22 13h12a4 4 0 0 1 4 4v20" fill="none" stroke={BRAND.green} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 37l-11 9" fill="none" stroke={BRAND.green} strokeWidth="7" strokeLinecap="round" />
      <path d="M14 50q18 12 36 0" fill="none" stroke={BRAND.green} strokeWidth="5" strokeLinecap="round" />
      <circle cx="48" cy="21" r="4.5" fill={dark ? BRAND.cream : BRAND.navy} />
    </svg>
  );
}

export function Logo({ dark = false, size = 36 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={`גבי – ${SLOGAN}`}>
      <LogoMark size={size} dark={dark} />
      <span className="leading-none">
        <span className={`block font-display font-extrabold text-2xl ${dark ? 'text-white' : 'text-ink-900'}`}>גבי</span>
        <span className={`block text-[11px] font-medium mt-0.5 ${dark ? 'text-ink-400' : 'text-ink-500'}`}>{SLOGAN}</span>
      </span>
    </span>
  );
}
