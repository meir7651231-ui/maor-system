/**
 * 💰 מחשבון-מחיר ללקוח (מסך-ההרשמה) — הלקוח מדליק/מכבה שירותים ורואה חי כמה זה
 * יעלה לו בחודש. **צרכן דק** של מנוע-התמחור הקיים (`lib/pricing.computeQuote`) —
 * אפס לוגיקת-תמחור חדשה: אותו חישוב של הבעלים באשף, אותה טבלת-מחירים.
 *
 * המחירים נגזרים מ-`config.prices` (הבעלים עורך באשף) ⇒ נופלים ל-DEFAULT_PRICES
 * (placeholder). ההרחבות המוצגות = רק 'live' (INTEGRATION_STATUS) — אי-אפשר
 * "למכור" מה שלא קיים. פאנל-זכוכית כהה תואם-תמה (כמו שאר מודאלי-אורביט).
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { ALL_MODULES, MODULE_LABELS } from '../platform/lib';
import { INTEGRATION_LABELS, INTEGRATION_STATUS } from '../builder/handoff';
import { computeQuote, DEFAULT_PRICES, SIZE_LABELS, shekel, type OrgSize } from '../../lib/pricing';
import type { ModuleKey } from '../../types/config';

const MODULE_EMOJI: Record<ModuleKey, string> = {
  families: '👨‍👩‍👧‍👦',
  courses: '🎨',
  calendar: '📅',
  diary: '📖',
  supporters: '💛',
  reports: '📊',
  tzedaka: '🪙',
  shop: '🛍️',
  shop7: '🚚',
};
const SIZES: OrgSize[] = ['small', 'medium', 'large'];
const SIZE_SUB: Record<OrgSize, string> = { small: 'עד ~150', medium: '~150–600', large: '600+' };
// ההרחבות שנמכרות בפועל (live) — לפי טקסונומיית-הכנות
const LIVE_ADDONS = Object.keys(INTEGRATION_STATUS).filter((k) => INTEGRATION_STATUS[k] === 'live');

export function PricingModal({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const prices = config.prices ?? DEFAULT_PRICES;
  const nameOf = (m: ModuleKey) => termOf(config, 'nav.' + m, MODULE_LABELS[m] ?? m);

  // מודולים בתשלום (מחיר>0) ניתנים-לבחירה; מחיר-0 = כלול בבסיס תמיד
  const paidModules = ALL_MODULES.filter((m) => (prices.modules[m] ?? 0) > 0);
  const includedModules = ALL_MODULES.filter((m) => (prices.modules[m] ?? 0) === 0);

  const [size, setSize] = useState<OrgSize>('small');
  const [onMods, setOnMods] = useState<Set<ModuleKey>>(new Set());
  const [onAddons, setOnAddons] = useState<Set<string>>(new Set());

  const toggleMod = (m: ModuleKey) => setOnMods((p) => { const n = new Set(p); n.has(m) ? n.delete(m) : n.add(m); return n; });
  const toggleAddon = (k: string) => setOnAddons((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const quote = useMemo(() => {
    // cfg סינתטי — כלולים+נבחרים ON, שאר בתשלום OFF
    const modules: Partial<Record<ModuleKey, boolean>> = {};
    for (const m of ALL_MODULES) modules[m] = (prices.modules[m] ?? 0) === 0 || onMods.has(m);
    const addons = [...onAddons].map((k) => ({ key: k, label: INTEGRATION_LABELS[k] ?? k }));
    return computeQuote({ modules }, size, prices, nameOf, addons, 'subscription');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, onMods, onAddons, config]);

  const rowStyle = (on: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    marginBottom: 7,
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'right',
    font: 'inherit',
    color: '#fff',
    border: '1.5px solid ' + (on ? 'var(--o-accent)' : 'rgba(255,255,255,.14)'),
    background: on ? 'rgba(var(--o-accent-rgb),.15)' : 'rgba(255,255,255,.035)',
    transition: 'border-color .12s, background .12s',
  });

  return (
    <div className="orbit-overlay" onClick={onClose} role="dialog" aria-label="מחשבון מחיר">
      <div className="orbit-panel" onClick={(e) => e.stopPropagation()}>
        <div className="orbit-panel-bar">
          <span>💰 כמה יעלה לי בחודש?</span>
          <button type="button" className="orbit-panel-x" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
        <div className="orbit-panel-body">
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--o-muted)', lineHeight: 1.6 }}>
            בחרו את מה שרלוונטי לכם — המחיר מתעדכן חי. אומדן להתרשמות; נסגור יחד את המחיר המדויק בשיחה.
          </p>

          {/* גודל הארגון */}
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--o-muted)', margin: '0 0 7px' }}>גודל הארגון</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                style={{
                  flex: 1,
                  padding: '9px 6px',
                  borderRadius: 11,
                  cursor: 'pointer',
                  font: 'inherit',
                  color: '#fff',
                  border: '1.5px solid ' + (size === s ? 'var(--o-accent)' : 'rgba(255,255,255,.14)'),
                  background: size === s ? 'rgba(var(--o-accent-rgb),.16)' : 'rgba(255,255,255,.035)',
                }}
              >
                <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{SIZE_LABELS[s]}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--o-muted)' }}>{SIZE_SUB[s]} משפחות</span>
              </button>
            ))}
          </div>

          {/* כלול בבסיס */}
          {includedModules.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'var(--o-muted)', alignSelf: 'center' }}>כלול בבסיס:</span>
              {includedModules.map((m) => (
                <span key={m} style={{ fontSize: 12, padding: '4px 9px', borderRadius: 99, background: 'rgba(var(--o-accent-rgb),.12)', border: '1px solid rgba(var(--o-accent-rgb),.24)' }}>
                  {MODULE_EMOJI[m]} {nameOf(m)}
                </span>
              ))}
            </div>
          )}

          {/* מודולים בתשלום */}
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--o-muted)', margin: '0 0 7px' }}>מודולים</div>
          {paidModules.map((m) => {
            const on = onMods.has(m);
            return (
              <button key={m} type="button" style={rowStyle(on)} onClick={() => toggleMod(m)}>
                <span style={{ fontSize: 19 }} aria-hidden>{MODULE_EMOJI[m]}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{nameOf(m)}</span>
                <span style={{ fontSize: 13, color: on ? '#fff' : 'var(--o-muted)' }}>+{shekel(prices.modules[m] ?? 0)}</span>
                <span aria-hidden style={{ opacity: on ? 1 : 0.3 }}>{on ? '☑' : '☐'}</span>
              </button>
            );
          })}

          {/* הרחבות (live) */}
          {LIVE_ADDONS.length > 0 && (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--o-muted)', margin: '12px 0 7px' }}>הרחבות</div>
              {LIVE_ADDONS.map((k) => {
                const on = onAddons.has(k);
                return (
                  <button key={k} type="button" style={rowStyle(on)} onClick={() => toggleAddon(k)}>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{INTEGRATION_LABELS[k] ?? k}</span>
                    <span style={{ fontSize: 13, color: on ? '#fff' : 'var(--o-muted)' }}>+{shekel(prices.integrations[k] ?? 0)}</span>
                    <span aria-hidden style={{ opacity: on ? 1 : 0.3 }}>{on ? '☑' : '☐'}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* סה"כ */}
          <div style={{ marginTop: 18, padding: '16px 16px 14px', borderRadius: 16, background: 'linear-gradient(180deg, rgba(var(--o-accent-rgb),.16), rgba(var(--o-accent-rgb),.05))', border: '1px solid rgba(var(--o-accent-rgb),.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: 'var(--o-muted)' }}>סה״כ משוער</div>
            <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, margin: '2px 0' }}>
              {shekel(quote.monthly)}
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--o-muted)' }}> / חודש</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--o-muted)' }}>
              או {shekel(quote.yearlyDiscounted)} לשנה · חודשיים חינם 🎁
            </div>
            {size !== 'small' && (
              <div style={{ fontSize: 11, color: 'var(--o-muted)', marginTop: 4 }}>כולל מכפיל-גודל ×{quote.sizeMult}</div>
            )}
          </div>

          <button type="button" className="orbit-primary" style={{ width: '100%' }} onClick={onClose}>
            בואו נתחיל 🚀
          </button>
          <p style={{ fontSize: 11, color: 'var(--o-muted)', textAlign: 'center', margin: '10px 2px 0', lineHeight: 1.5 }}>
            המחיר להתרשמות בלבד ואינו מחייב. נסגור יחד את החבילה המדויקת בשיחת-הקמה קצרה.
          </p>
        </div>
      </div>
    </div>
  );
}
