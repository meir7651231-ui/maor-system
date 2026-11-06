export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <path d="M32 5C17.1 5 5 15.6 5 28.7c0 7.4 3.9 14 10 18.4L13.2 58l11.4-6.3c2.4.6 4.8.9 7.4.9 14.9 0 27-10.6 27-23.9S46.9 5 32 5Z" fill="#10B981" />
      <path d="M20 39V19h9.5a6.5 6.5 0 0 1 6.5 6.5V32M28 26v13h9.5A6.5 6.5 0 0 0 44 32.5V19" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="49" cy="47" r="11" fill="#0F172A" stroke="#fff" strokeWidth="3" />
      <path d="m44 47.2 3.4 3.4L54 44" fill="none" stroke="#10B981" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ dark = false, size = 36 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="גבי – העוזר לגביית חובות">
      <LogoMark size={size} />
      <span className="leading-none">
        <span className={`block font-display font-extrabold text-2xl ${dark ? 'text-white' : 'text-ink-900'}`}>גבי</span>
        <span className={`block text-[11px] font-medium mt-0.5 ${dark ? 'text-ink-400' : 'text-ink-500'}`}>העוזר לגביית חובות</span>
      </span>
    </span>
  );
}
