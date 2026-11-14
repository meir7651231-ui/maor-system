import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { InvoiceStatus } from '../lib/domain.ts';

type Variant = 'primary' | 'dark' | 'ghost' | 'outline' | 'danger';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-ink-900 hover:bg-[#34D399] shadow-sm',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
  ghost: 'text-ink-700 hover:bg-ink-100',
  outline: 'border border-ink-200 bg-white text-ink-800 hover:bg-ink-50',
  danger: 'text-critical hover:bg-red-50',
};
export function Button({ variant = 'primary', size = 'md', className = '', ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-10 sm:h-9 px-3 text-sm' : size === 'lg' ? 'h-13 px-7 text-lg' : 'h-11 px-5';
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer ${sz} ${VARIANT[variant]} ${className}`} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-card border border-ink-200/60 ${className}`}>{children}</div>;
}

const STATUS: Record<InvoiceStatus, [string, string]> = {
  open: ['פתוחה', 'bg-amber-50 text-amber-700 ring-amber-200'],
  reminded: ['נשלחה תזכורת', 'bg-sky-50 text-sky-700 ring-sky-200'],
  promised: ['הבטיח לשלם', 'bg-violet-50 text-violet-700 ring-violet-200'],
  paid: ['שולמה', 'bg-brand-50 text-brand-700 ring-brand-100'],
  disputed: ['במחלוקת', 'bg-red-50 text-red-700 ring-red-200'],
};
export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const [label, cls] = STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset whitespace-nowrap ${cls}`}>{label}</span>;
}

export function LateBadge({ days }: { days: number }) {
  if (days <= 0) return <span className="text-xs text-ink-500">בעוד {Math.abs(days)} ימים</span>;
  const cls = days > 60 ? 'text-critical' : days > 30 ? 'text-late' : 'text-due';
  return <span className={`text-sm font-bold ${cls}`}><span className="num">{days}</span> ימי איחור</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-ink-800 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-500 mt-1">{hint}</span>}
    </label>
  );
}
export const inputCls = 'w-full h-11 rounded-xl border border-ink-200 bg-white px-3.5 text-ink-900 placeholder:text-ink-400 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none';

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? 'bg-brand' : 'bg-ink-200'}`}>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'right-6' : 'right-1'}`} />
    </button>
  );
}
