/**
 * עזרי מודול התורמים — ציון RFM משוקלל, דרגות זהב/כסף/ארד,
 * פורמט תאריכים וטלפון. עזרים מקומיים בלבד — אין גישה ל-store או ל-DOM.
 */
import type { CSSProperties } from 'react';
import type { Supporter } from '../../types/domain';

/** תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO). */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** שווי כולל בש"ח — דולר לפי שער 3.7 (כמו במקור). */
export function supTotalIls(sp: Supporter): number {
  return (sp.ils || 0) + (sp.usd || 0) * 3.7;
}

/**
 * ציון משוקלל 0–1000 בסגנון RFM — ספי הניקוד verbatim מהמקור:
 * R — טריות (ימים מאז התרומה האחרונה), F — תדירות (מספר תרומות), M — סכום מצטבר.
 */
export function supScore(sp: Supporter): number {
  const tot = supTotalIls(sp);
  const days = sp.last
    ? Math.floor((Date.now() - new Date(sp.last + 'T12:00:00').getTime()) / 86400000)
    : 9999;
  const R = days <= 30 ? 350 : days <= 90 ? 280 : days <= 180 ? 200 : days <= 365 ? 120 : 40;
  const F = sp.count >= 10 ? 300 : sp.count >= 5 ? 230 : sp.count >= 3 ? 160 : sp.count >= 2 ? 100 : 50;
  const M = tot >= 5000 ? 350 : tot >= 2000 ? 280 : tot >= 1000 ? 210 : tot >= 500 ? 140 : tot >= 100 ? 80 : 40;
  return R + F + M;
}

export interface SupTier {
  label: string;
  bg: string;
  c: string;
  dot: string;
}

/** דרגה לפי הציון — זהה לחלוקה ולצבעים במקור (800/600/400). */
export function supTier(sc: number): SupTier {
  if (sc >= 800) return { label: 'זהב', bg: '#fdf3dd', c: '#9a6414', dot: '#f3c76b' };
  if (sc >= 600) return { label: 'כסף', bg: '#eef1f5', c: '#44546a', dot: '#94a3b8' };
  if (sc >= 400) return { label: 'ארד', bg: '#f6ead1', c: '#9a6414', dot: '#d97706' };
  return { label: 'רדומה', bg: '#eceae2', c: '#8b8474', dot: '#a8a29e' };
}

export const TIER_ORDER = ['זהב', 'כסף', 'ארד', 'רדומה'] as const;

/** צ'יפ דרגה/סטטוס קטן בסגנון אחיד. */
export function chipStyle(bg: string, c: string): CSSProperties {
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: bg,
    color: c,
    whiteSpace: 'nowrap',
  };
}

/** עיצוב טלפון ישראלי חסר-אפס — כמו fixPhone במקור. */
export function fixPhone(p: string): string {
  const raw = String(p || '').trim();
  const d = raw.replace(/\D/g, '');
  if (!d || d[0] === '0') return raw;
  if (d.length === 9) return '0' + d.slice(0, 2) + '-' + d.slice(2);
  if (d.length === 8) return '0' + d[0] + '-' + d.slice(1);
  return raw;
}

/** "₪1,200 + $300" או "—" כשאין כלום. */
export function totalLabel(sp: Supporter): string {
  const ils = sp.ils ? '₪' + sp.ils.toLocaleString('he-IL') : '';
  const usd = sp.usd ? '$' + sp.usd.toLocaleString('he-IL') : '';
  return ils && usd ? ils + ' + ' + usd : ils || usd || '—';
}
