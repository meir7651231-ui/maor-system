/**
 * 💬 כפתור "שלחו לנו בוואטסאפ" (22.10) — קישור wa.me ממולא למספר-הבעלים;
 * ההודעה יוצאת מהוואטסאפ של הנרשם עצמו (אפס API). מוצג רק כשיש href.
 */
export function OwnerWaButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="orbit-primary"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 0 12px', background: '#25D366', color: '#06301a', textDecoration: 'none', fontWeight: 800 }}
    >
      <span aria-hidden>💬</span> {label}
    </a>
  );
}
