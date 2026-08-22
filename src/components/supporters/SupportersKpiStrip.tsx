/**
 * רצועת-KPI חיה מעל הטבלה — לב הריברנד: החוכמה שהייתה קבורה (סיכון · הו״ק · דרגות)
 * עולה למעלה, וכל אריח/צ׳יפ הוא **מסנן** על הטבלה הקיימת. נגזרת טהורה של
 * הנתונים (portfolio + cockpit), memoized. מגודר opt-in (`supporters.rebrand`).
 */
import { useMemo } from 'react';
import type { OrgConfig } from '../../types/config';
import type { Supporter } from '../../types/domain';
import { featureOn, termOf } from '../../lib/config';
import { hokDue, hokMonthlyTotal, isoToday, supTier } from './lib';
import { cockpitAtRisk, cockpitCollectedThisMonth } from './cockpit';
import { portfolioIntel } from './portfolio';

const ILS = (n: number) => (n >= 1000 ? '₪' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : '₪' + Math.round(n).toLocaleString('he-IL'));
const TIER_ORDER = ['זהב', 'כסף', 'ארד', 'רדומה'] as const;

function Tile(props: { label: string; value: string; tone?: string; onClick?: () => void }) {
  const clickable = !!props.onClick;
  return (
    <div onClick={props.onClick} title={clickable ? 'סינון לרשימה' : undefined}
      style={{ flex: '1 1 130px', minWidth: 120, background: 'var(--panel-2, #f7f2e8)', border: clickable ? '1px solid var(--warn, #b45309)' : '1px solid var(--line, #e4dbc9)', borderRadius: 12, padding: '10px 13px', cursor: clickable ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}{clickable ? ' ↗' : ''}</div>
      <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-.4px', marginTop: 2, color: props.tone || 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{props.value}</div>
    </div>
  );
}

export function SupportersKpiStrip(props: {
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  activeTier: string | null;
  onTier: (t: string) => void;
  onHokDue: () => void;
  /** קליק על אריח-הסיכון → סינון הטבלה לרשימת-הבסיכון. */
  onRisk?: () => void;
}) {
  // 🐛 (21.8): toISOString = UTC ⇒ בין חצות מקומי ל-02:00/03:00 "היום" היה אתמול.
  const today = isoToday();
  const rate = props.usdRate || 3.7;
  const hokOn = featureOn(props.config, 'supporters.hok');

  const portfolio = useMemo(() => portfolioIntel(props.supporters, today, rate), [props.supporters, today, rate]);
  const collected = useMemo(() => cockpitCollectedThisMonth(props.supporters, today, rate), [props.supporters, today, rate]);
  // 🐛 (21.8): בלי todayIso הו"ק-נדרים שפגה (>2 חודשים שקט) נספרה ב"צפוי מהו״ק" —
  // בעוד תור-המשימות (hokDue) כבר מחריג אותה. אותו-כלל לשני המשטחים.
  const hokExpected = useMemo(() => hokMonthlyTotal(props.supporters, rate, today), [props.supporters, rate, today]);
  const dueCount = useMemo(() => (hokOn ? hokDue(props.supporters, today).length : 0), [props.supporters, today, hokOn]);
  // 🐛 קוהרנטיות אריח↔סינון (21.8): האריח הקליקי "בסיכון נטישה" הציג את
  // portfolio.atRiskCount (churn≥60) אבל הקליק סינן לסגמנט 'atrisk' = cockpitAtRisk
  // (אוכלוסייה אחרת) ⇒ המספר על האריח לא תאם את הרשימה שנפתחה. הכלל: אריח קליקי
  // מציג את אותה אוכלוסייה שהוא פותח; atRiskCount נשאר לאנליטיקה לא-קליקית.
  const atRiskClickCount = useMemo(() => cockpitAtRisk(props.supporters, today).length, [props.supporters, today]);

  return (
    <div className="card" style={{ padding: '13px 15px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 11 }}>
      {/* אריחי-מדד */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Tile label={'סה״כ ' + termOf(props.config, 'nav.supporters', 'תורמים')} value={String(portfolio.count)} />
        <Tile label="נגבה החודש" value={ILS(collected)} tone="var(--good, #2e7d32)" />
        {hokOn ? <Tile label="צפוי מהו״ק" value={ILS(hokExpected)} /> : null}
        <Tile label="בסיכון נטישה" value={String(atRiskClickCount)} tone="var(--warn, #b45309)" onClick={props.onRisk} />
        <Tile label="שווי-תיק" value={ILS(portfolio.ltv)} />
      </div>

      {/* צ׳יפי-סינון: דרגות + הו״ק — לחיצה מסננת את הטבלה */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 700 }}>סינון מהיר:</span>
        {TIER_ORDER.map((t) => {
          const n = portfolio.tierCounts[t] || 0;
          const tier = supTier(t === 'זהב' ? 850 : t === 'כסף' ? 650 : t === 'ארד' ? 450 : 200);
          const on = props.activeTier === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => props.onTier(t)}
              title={'סינון לדרגת ' + t}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 11px',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', font: 'inherit',
                border: '1px solid ' + (on ? 'transparent' : 'var(--line, #e4dbc9)'),
                background: on ? 'var(--dark, #211d17)' : 'var(--panel, #fffdf8)',
                color: on ? 'var(--gold, #f3c76b)' : 'var(--ink)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 99, background: tier.dot }} />
              {t} <span style={{ opacity: 0.75, fontWeight: 800 }}>{n}</span>
            </button>
          );
        })}
        {hokOn && dueCount > 0 ? (
          <button
            type="button"
            onClick={props.onHokDue}
            title="סינון להוראות-קבע שטרם נרשמו החודש"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 11px',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', font: 'inherit',
              border: '1px solid var(--line, #e4dbc9)', background: 'var(--warn-bg, #f9ecd7)', color: 'var(--warn, #b45309)',
            }}
          >
            ⏳ הו״ק להיום <span style={{ fontWeight: 800 }}>{dueCount}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
