// הלוגו: ג עם חיוך בבסיס ועין נייבי (הכרעת מאיר 6.11 — לא בועה). מקור יחיד גם ל-public/*.svg
export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <path d="M21 13h15v26" fill="none" stroke="#10B981" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M36 39 25 49" fill="none" stroke="#10B981" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="28.5" cy="23" r="3.6" fill="#0F172A"/>
      <path d="M17 53.5q15 9 30 0" fill="none" stroke="#10B981" strokeWidth="4.5" strokeLinecap="round"/>
    </svg>
  );
}

export const TAGLINE = 'הכסף שלך חוזר. בלי שתצטרך לרדוף.';

export function Logo({ dark = false, size = 36 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={`גבי – ${TAGLINE}`}>
      <LogoMark size={size} />
      <span className="leading-none">
        <span className={`block font-display font-extrabold text-2xl ${dark ? 'text-white' : 'text-ink-900'}`}>גבי</span>
        <span className={`block text-[11px] font-medium mt-0.5 ${dark ? 'text-ink-400' : 'text-ink-500'}`}>{TAGLINE}</span>
      </span>
    </span>
  );
}
