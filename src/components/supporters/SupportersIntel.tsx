/**
 * מרכז-המודיעין לתורמים — תצוגה מעל מנועי intel + portfolio.
 *
 * טבלה עמוקה (RFM מפורק · LTV · מגמה · תחזית-מתנה · סיכון-נטישה) + רצועת-מודיעין-תיק
 * + כרטיס-צלילה פר-תורם. כל המדדים memoized (מעבר-יחיד לתורם) ⇒ מתאים לעשרות-אלפים.
 * מגודר opt-in מפורש (`supporters.intel === true`) ⇒ אפס-השפעה על הלקוח-החי.
 */
import { useMemo, useState } from 'react';
import type { OrgConfig } from '../../types/config';
import type { Supporter } from '../../types/domain';
import { Btn } from '../ui';
import { supTier } from './lib';
import { donorIntel, type DonorIntel } from './intel';
import { activeByMonth, portfolioIntel, tierTrendCounts } from './portfolio';
import { timeMachine, type TimeMachine } from './timemachine';
import { donorRhythm, seasonality, type Seasonality } from './seasonality';
import { donorSignals, portfolioSignals, type PortfolioSignals, type SignalKind } from './signals';
import { intelCsvRows } from './intelExport';
import { donorRanks, type DonorRank } from './ranks';
import { acquisitionCohorts, type RetentionReport } from './retention';
import { paretoReport, type ParetoReport } from './pareto';
import { tierMigration, type TierMigration } from './tierMigration';
import { downloadCsv } from '../../lib/csvx';
import { featureOn } from '../../lib/config';

const ILS = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
const KILO = (n: number) => (n >= 1000 ? '₪' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : ILS(n));
const MONTHS_HE = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
function monthLabel(iso: string): string {
  const m = +iso.slice(5, 7);
  return m >= 1 && m <= 12 ? MONTHS_HE[m - 1] : '';
}

type SortKey = 'score' | 'ltv' | 'churn' | 'forecast';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'ציון' },
  { key: 'ltv', label: 'ערך-חיים' },
  { key: 'churn', label: 'סיכון-נטישה' },
  { key: 'forecast', label: 'תחזית' },
];

function riskColor(c: number): string {
  return c >= 60 ? 'var(--red, #b3261e)' : c >= 35 ? 'var(--warn, #b45309)' : 'var(--good, #2e7d32)';
}

function Tile(props: { label: string; value: string; note?: string; tone?: string; onClick?: () => void }) {
  const clickable = !!props.onClick;
  return (
    <div className="card" onClick={props.onClick}
      style={{ padding: '12px 13px', cursor: clickable ? 'pointer' : 'default', outline: clickable ? '1px solid var(--line, #e4dbc9)' : undefined }}
      title={clickable ? 'סינון לרשימה' : undefined}>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}{clickable ? ' ↗' : ''}</div>
      <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-.4px', margin: '3px 0 1px', color: props.tone || 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{props.value}</div>
      {props.note ? <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700 }}>{props.note}</div> : null}
    </div>
  );
}

function DeepDive(props: { sp: Supporter; intel: DonorIntel; rate: number; today: string; rank?: DonorRank; onOpen: (id: string) => void }) {
  const { intel, sp, rank } = props;
  const tier = supTier(intel.rfm.score);
  const mo = intel.scan.monthly;
  const max = Math.max(1, ...mo);
  const rhythm = donorRhythm(sp, props.rate);
  const sigs = donorSignals(sp, props.today, props.rate);
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--panel-2, #f7f2e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
          {(sp.name || '💛').charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{sp.name || 'ללא שם'}</h3>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{sp.cat || '—'} · {intel.scan.count} מתנות</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: tier.bg, color: tier.c }}>{tier.label} {intel.rfm.score}</span>
          {rank ? <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700 }} title={'דירוג לפי ערך-חיים · אחוזון ' + rank.percentile}>#{rank.ltvRank}/{rank.total} · אחוזון {rank.percentile}</span> : null}
          <Btn sm onClick={() => props.onOpen(sp.id)} title="פתיחת הכרטיס המלא — תרומה · תודה · הו״ק · עריכה">פתח כרטיס ↗</Btn>
        </div>
      </div>

      {/* rhythm + signals badges */}
      {(rhythm.topMonth || sigs.length) ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
          {rhythm.seasonal ? (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--gold-soft, #fbeecb)', color: 'var(--gold-deep, #a05008)' }} title={'רוב הנתינה בחודש ' + MONTHS_HE[rhythm.topMonth - 1]}>🗓️ עונתי · שיא {MONTHS_HE[rhythm.topMonth - 1]}</span>
          ) : rhythm.topMonth ? (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--panel-2, #f7f2e8)', color: 'var(--ink-soft)' }}>🗓️ שיא {MONTHS_HE[rhythm.topMonth - 1]}</span>
          ) : null}
          {sigs.map((s, i) => {
            const m = SIGNAL_META[s.kind];
            return <span key={s.kind + i} title={s.detail} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: m.bg, color: m.color }}>{m.emoji} {s.detail}</span>;
          })}
        </div>
      ) : null}

      {/* giving timeline */}
      <div style={{ borderTop: '1px solid var(--line-soft, #efe8d9)', paddingTop: 11, marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', marginBottom: 7 }}>ציר-זמן נתינה · 12 חודשים</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
          {mo.map((v, i) => (
            <div key={i} title={ILS(v)} style={{ flex: 1, height: Math.max(2, (v / max) * 48), background: v > 0 ? 'var(--accent-deep, #a05008)' : 'var(--line, #e4dbc9)', borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
      </div>

      {/* RFM gauges */}
      <div style={{ borderTop: '1px solid var(--line-soft, #efe8d9)', paddingTop: 11, marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', marginBottom: 7 }}>פירוק הציון · R · F · M</div>
        {([['R', intel.rfm.rPct, 'טריות'], ['F', intel.rfm.fPct, 'תדירות'], ['M', intel.rfm.mPct, 'סכום']] as const).map(([k, pct, name]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 62px', gap: 8, alignItems: 'center', fontSize: 11.5, marginBottom: 6 }}>
            <b>{k}</b>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--line, #e4dbc9)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: pct + '%', background: pct < 40 ? riskColor(70) : 'var(--gold-deep, #a05008)', borderRadius: 99 }} />
            </div>
            <span style={{ textAlign: 'end', color: 'var(--ink-faint)' }}>{name}</span>
          </div>
        ))}
      </div>

      {/* forecast */}
      {intel.forecast ? (
        <div style={{ borderTop: '1px solid var(--line-soft, #efe8d9)', paddingTop: 11, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', marginBottom: 7 }}>תחזית המתנה-הבאה</div>
          <div style={{ background: 'var(--info-bg, #e7eefb)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--info, #1d4ed8)', fontVariantNumeric: 'tabular-nums' }}>{ILS(intel.forecast.amount)}</span>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>
              חלון צפוי: {monthLabel(intel.forecast.dueIso)} {intel.forecast.dueIso.slice(0, 4)} · ביטחון <b>{intel.forecast.confidence}%</b>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const TIER_DOT: Record<string, string> = { 'זהב': '#c98a12', 'כסף': '#5f6b82', 'ארד': '#b5591a', 'רדומה': '#7c7565' };

const SIGNAL_META: Record<SignalKind, { label: string; emoji: string; color: string; bg: string }> = {
  reactivated: { label: 'חזרו', emoji: '🔄', color: 'var(--good, #2e7d32)', bg: 'var(--good-bg, #e7f4e8)' },
  jump: { label: 'קפצו', emoji: '📈', color: 'var(--info, #1d4ed8)', bg: 'var(--info-bg, #e7eefb)' },
  firstgift: { label: 'חדשים', emoji: '✨', color: 'var(--gold-deep, #a05008)', bg: 'var(--gold-soft, #fbeecb)' },
  drop: { label: 'ירדו', emoji: '📉', color: 'var(--warn, #b45309)', bg: 'var(--warn-bg, #fdf0e1)' },
  lapsing: { label: 'גולשים', emoji: '⚠️', color: 'var(--red, #b3261e)', bg: 'var(--red-bg, #fdecea)' },
};
const SIGNAL_ORDER: SignalKind[] = ['lapsing', 'drop', 'reactivated', 'jump', 'firstgift'];

function CohortBand(props: {
  cohort: ReturnType<typeof tierTrendCounts>;
  active: number[];
  scoreBins: number[];
  migration: TierMigration;
}) {
  const { cohort, active, scoreBins, migration } = props;
  const maxA = Math.max(1, ...active);
  const maxB = Math.max(1, ...scoreBins);
  const n = active.length;
  const areaPts = active.map((v, i) => `${(i / (n - 1)) * 300},${104 - (v / maxA) * 84}`).join(' ');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      {/* מיגרציית-דרגות */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>מיגרציית-דרגות</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 10 }}>מעברים אמיתיים מול לפני שנה</div>

        {/* מעברים אמיתיים (as-of לפני-שנה מול היום) */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--good-bg, #e7f4e8)', color: 'var(--good, #2e7d32)' }} title="עלו דרגה מאז לפני שנה">▲ {migration.promoted} עלו</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--red-bg, #fdecea)', color: 'var(--red, #b3261e)' }} title="ירדו דרגה">▼ {migration.demoted} ירדו</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--panel-2, #f7f2e8)', color: 'var(--ink-soft)' }}>= {migration.stable} יציבים</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--gold-soft, #fbeecb)', color: 'var(--gold-deep, #a05008)' }} title="גויסו מאז">✨ {migration.newDonors} חדשים</span>
        </div>
        {migration.flows.length ? (
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {migration.flows.slice(0, 3).map((f) => (
              <div key={f.from + f.to}><b>{f.count}</b> {f.from} <span style={{ color: 'var(--ink-faint)' }}>←</span> {f.to}</div>
            ))}
          </div>
        ) : null}

        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8, borderTop: '1px solid var(--line-soft, #efe8d9)', paddingTop: 10 }}>מגמה נוכחית פר-דרגה</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {cohort.map((row) => {
            const t = Math.max(1, row.total);
            return (
              <div key={row.tier} style={{ display: 'grid', gridTemplateColumns: '54px 1fr 34px', gap: 9, alignItems: 'center', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: TIER_DOT[row.tier] }} />{row.tier}</span>
                <span style={{ height: 9, borderRadius: 99, background: 'var(--line, #e4dbc9)', overflow: 'hidden', display: 'flex' }}>
                  <i style={{ width: (row.rising / t) * 100 + '%', background: 'var(--good, #2e7d32)' }} />
                  <i style={{ width: (row.stable / t) * 100 + '%', background: TIER_DOT[row.tier] }} />
                  <i style={{ width: (row.falling / t) * 100 + '%', background: 'var(--red, #b3261e)' }} />
                </span>
                <span style={{ textAlign: 'end', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{row.total}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--ink-soft)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--good, #2e7d32)', display: 'inline-block' }} />עולה</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--red, #b3261e)', display: 'inline-block' }} />יורד</span>
        </div>
      </div>

      {/* עקומת-פעילות */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>עקומת-פעילות</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 12 }}>תורמים פעילים פר-חודש · 12ח׳</div>
        <svg width="100%" height="120" viewBox="0 0 300 120" preserveAspectRatio="none" style={{ overflow: 'visible' }} role="img" aria-label="עקומת-פעילות חודשית">
          <line x1="0" y1="104" x2="300" y2="104" stroke="var(--line, #e4dbc9)" />
          <polyline points={areaPts} fill="none" stroke="var(--gold-deep, #a05008)" strokeWidth="2.5" />
          <polyline points={`0,104 ${areaPts} 300,104`} fill="var(--gold-soft, #fbeecb)" opacity="0.5" stroke="none" />
          <text x="4" y="14" style={{ fontSize: 9.5, fill: 'var(--ink-faint)' }}>{maxA}</text>
          <text x="250" y="118" style={{ fontSize: 9.5, fill: 'var(--ink-faint)' }}>החודש</text>
        </svg>
      </div>

      {/* פיזור-ציון */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>פיזור-ציון (RFM)</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 12 }}>10 סלים · 0–1000</div>
        <svg width="100%" height="120" viewBox="0 0 300 120" preserveAspectRatio="none" style={{ overflow: 'visible' }} role="img" aria-label="פיזור-ציון">
          <line x1="0" y1="104" x2="300" y2="104" stroke="var(--line, #e4dbc9)" />
          {scoreBins.map((v, i) => {
            const h = (v / maxB) * 88;
            return <rect key={i} x={4 + i * 30} y={104 - h} width={24} height={Math.max(2, h)} rx="3" fill="var(--gold, #e7a72e)" />;
          })}
          <text x="4" y="118" style={{ fontSize: 9.5, fill: 'var(--ink-faint)' }}>0</text>
          <text x="272" y="118" style={{ fontSize: 9.5, fill: 'var(--ink-faint)' }}>1000</text>
        </svg>
      </div>
    </div>
  );
}

function labelForOffset(off: number): string {
  if (off === 0) return 'היום';
  if (off % 365 === 0) return '+' + off / 365 + ' שנה';
  return '+' + off + ' ימים';
}

/**
 * מכונת-הזמן — "אם לא תעשה כלום": מקרינה את התיק קדימה לאופקים, ומראה כמה תורמים
 * וכסף גולשים-לסכנה ומה צפוי-להיכנס. סרגל-אופק אינטראקטיבי (בורר את הפירוט התחתון).
 */
function TimeBand(props: { machine: TimeMachine }) {
  const { machine } = props;
  const H = machine.horizons;
  const [sel, setSel] = useState(H.length - 1); // ברירת-מחדל: האופק-הרחוק
  const maxRisk = Math.max(1, ...H.map((h) => h.atRiskCount));
  const cur = H[Math.min(sel, H.length - 1)];

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>מכונת-הזמן</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>הקרנת-התיק קדימה — "אם לא תעשה כלום"</div>
      </div>

      {/* עלות-אי-הפעולה */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, margin: '12px 0' }}>
        <div style={{ background: 'var(--red-bg, #fdecea)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700 }}>יגלשו-לסכנה עד {labelForOffset(H[H.length - 1].offsetDays)}</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--red, #b3261e)', fontVariantNumeric: 'tabular-nums' }}>{machine.erosionDonors} תורמים</div>
        </div>
        <div style={{ background: 'var(--red-bg, #fdecea)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700 }}>שווי-סיכון מתפתח</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--red, #b3261e)', fontVariantNumeric: 'tabular-nums' }}>{KILO(machine.erosionMoney)}</div>
        </div>
        <div style={{ background: 'var(--info-bg, #e7eefb)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700 }}>צפוי-להיכנס (אם הרצף נמשך)</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--info, #1d4ed8)', fontVariantNumeric: 'tabular-nums' }}>{KILO(machine.incomingEnd)}</div>
        </div>
      </div>

      {/* עקומת-דעיכה: תורמים-בסכנה פר-אופק (לחיץ) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 92, marginTop: 6 }}>
        {H.map((h, i) => {
          const on = i === sel;
          return (
            <button key={h.offsetDays} type="button" onClick={() => setSel(i)}
              title={labelForOffset(h.offsetDays) + ' · ' + h.atRiskCount + ' בסכנה'}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: on ? 'var(--red, #b3261e)' : 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>{h.atRiskCount}</span>
              <span style={{ width: '100%', maxWidth: 46, height: Math.max(4, (h.atRiskCount / maxRisk) * 60), background: on ? 'var(--red, #b3261e)' : 'var(--red-soft, #f3b8b2)', borderRadius: '4px 4px 0 0', transition: 'height .2s' }} />
              <span style={{ fontSize: 10, color: on ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: on ? 800 : 600, whiteSpace: 'nowrap' }}>{labelForOffset(h.offsetDays)}</span>
            </button>
          );
        })}
      </div>

      {/* פירוט האופק-הנבחר */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 14, borderTop: '1px solid var(--line-soft, #efe8d9)', paddingTop: 12, fontSize: 12 }}>
        <div><span style={{ color: 'var(--ink-faint)' }}>בסכנה </span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{cur.atRiskCount}</b></div>
        <div><span style={{ color: 'var(--ink-faint)' }}>חדשים-בסכנה </span><b style={{ color: 'var(--red, #b3261e)', fontVariantNumeric: 'tabular-nums' }}>+{cur.newlyAtRisk}</b></div>
        <div><span style={{ color: 'var(--ink-faint)' }}>שווי-סיכון </span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{KILO(cur.atRiskMoney)}</b></div>
        <div><span style={{ color: 'var(--ink-faint)' }}>עדיין-פעילים </span><b style={{ color: 'var(--good, #2e7d32)', fontVariantNumeric: 'tabular-nums' }}>{cur.activeCount}</b></div>
        <div><span style={{ color: 'var(--ink-faint)' }}>צפוי-נכנס </span><b style={{ color: 'var(--info, #1d4ed8)', fontVariantNumeric: 'tabular-nums' }}>{KILO(cur.expectedIncoming)}</b></div>
      </div>
    </div>
  );
}

/**
 * ריכוזיות (פארטו/לורנץ) — עד כמה התיק תלוי במעטים. עקומת-לורנץ מול קו-השוויון +
 * מדד-ג׳יני + סף "כמה-מעט תורמים = חצי מהכסף". סיכון-ריכוזיות במבט-אחד.
 */
function ParetoBand(props: { report: ParetoReport }) {
  const { report } = props;
  if (report.donors === 0) return null;
  // הקו הופך: אחוז-תורמים על ציר-x (מהגדול), אחוז-כסף על ציר-y. גובה 120, רוחב 300.
  const pts = report.curve.map((p) => `${(p.donorPct / 100) * 300},${120 - (p.moneyPct / 100) * 120}`).join(' ');
  const giniColor = report.gini >= 70 ? 'var(--red, #b3261e)' : report.gini >= 45 ? 'var(--warn, #b45309)' : 'var(--good, #2e7d32)';
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>ריכוזיות התיק</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>עד כמה התיק תלוי במעטים (פארטו/ג׳יני)</div>
        <div style={{ marginInlineStart: 'auto', fontSize: 11.5, color: 'var(--ink-soft)' }}>ג׳יני <b style={{ color: giniColor }}>{report.gini}</b></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 160px', gap: 16, alignItems: 'center', marginTop: 8 }}>
        <svg width="100%" height="140" viewBox="0 0 300 132" preserveAspectRatio="none" style={{ overflow: 'visible' }} role="img" aria-label="עקומת-לורנץ">
          <line x1="0" y1="120" x2="300" y2="120" stroke="var(--line, #e4dbc9)" />
          <line x1="0" y1="0" x2="0" y2="120" stroke="var(--line, #e4dbc9)" />
          {/* קו-שוויון */}
          <line x1="0" y1="120" x2="300" y2="0" stroke="var(--line, #e4dbc9)" strokeDasharray="4 4" />
          {/* עקומת-פארטו + מילוי */}
          <polyline points={`0,120 ${pts} 300,120`} fill="var(--gold-soft, #fbeecb)" opacity="0.55" stroke="none" />
          <polyline points={pts} fill="none" stroke="var(--gold-deep, #a05008)" strokeWidth="2.5" />
          <text x="4" y="12" style={{ fontSize: 9.5, fill: 'var(--ink-faint)' }}>כסף</text>
          <text x="250" y="131" style={{ fontSize: 9.5, fill: 'var(--ink-faint)' }}>תורמים</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
          <div><div style={{ color: 'var(--ink-faint)', fontSize: 11 }}>20% הגדולים</div><b style={{ fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>{report.top20Share}%</b> <span style={{ color: 'var(--ink-faint)' }}>מהכסף</span></div>
          <div><div style={{ color: 'var(--ink-faint)', fontSize: 11 }}>חצי מהכסף מ־</div><b style={{ fontSize: 17, color: giniColor, fontVariantNumeric: 'tabular-nums' }}>{report.halfDonorPct}%</b> <span style={{ color: 'var(--ink-faint)' }}>מהתורמים</span></div>
          <div><div style={{ color: 'var(--ink-faint)', fontSize: 11 }}>80% מהכסף מ־</div><b style={{ fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>{report.eightyDonorPct}%</b> <span style={{ color: 'var(--ink-faint)' }}>מהתורמים</span></div>
        </div>
      </div>
    </div>
  );
}

function retColor(pct: number): string {
  return pct >= 66 ? 'var(--good, #2e7d32)' : pct >= 40 ? 'var(--warn, #b45309)' : 'var(--red, #b3261e)';
}

/**
 * קוהורטת-הגיוס — שימור לפי **שנת-הגיוס**: לכל מחזור, כמה גויסו וכמה עדיין-פעילים.
 * חושף אם הגיוס-האחרון "דולף" מול מחזורים-ותיקים.
 */
function RetentionBand(props: { report: RetentionReport }) {
  const { report } = props;
  if (report.cohorts.length === 0) return null;
  const maxSize = Math.max(1, ...report.cohorts.map((c) => c.size));
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>קוהורטת-גיוס</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>שימור לפי שנת-הצטרפות</div>
        <div style={{ marginInlineStart: 'auto', fontSize: 11.5, color: 'var(--ink-soft)' }}>שימור-כולל <b style={{ color: retColor(report.overallRetention) }}>{report.overallRetention}%</b></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {report.cohorts.map((c) => (
          <div key={c.year} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 92px', gap: 10, alignItems: 'center', fontSize: 12 }}>
            <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{c.year}</span>
            <span style={{ position: 'relative', height: 20, borderRadius: 6, background: 'var(--line, #e4dbc9)', overflow: 'hidden' }} title={c.size + ' גויסו · ' + c.activeNow + ' פעילים'}>
              {/* רוחב = גודל-המחזור יחסית; מילוי = הפעילים */}
              <span style={{ position: 'absolute', inset: 0, width: (c.size / maxSize) * 100 + '%', background: 'var(--panel-2, #f7f2e8)' }} />
              <span style={{ position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: ((c.activeNow / maxSize)) * 100 + '%', background: retColor(c.retentionPct) }} />
              <span style={{ position: 'absolute', insetInlineStart: 6, top: 2, fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{c.activeNow}/{c.size}</span>
            </span>
            <span style={{ textAlign: 'end', fontWeight: 800, color: retColor(c.retentionPct), fontVariantNumeric: 'tabular-nums' }}>{c.retentionPct}% · {KILO(c.ltv)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * מפת-העונתיות — **מתי** נכנס הכסף. 12 עמודות-חודש (חוצה-שנים), שיא/שפל מודגשים,
 * וריכוזיות-עונתית ("X% מהכסף השנתי מגיע בחודש-Y"). תזמון-קמפיין במבט-אחד.
 */
function SeasonBand(props: { season: Seasonality }) {
  const { season } = props;
  const max = Math.max(1, ...season.byMonth.map((m) => m.ils));
  const peakLabel = season.peakMonth ? MONTHS_HE[season.peakMonth - 1] : '—';
  const troughLabel = season.troughMonth ? MONTHS_HE[season.troughMonth - 1] : '—';

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>מפת-העונתיות</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>מתי נכנס הכסף — פר-חודש, חוצה-שנים</div>
        {season.peakMonth ? (
          <div style={{ marginInlineStart: 'auto', fontSize: 11.5, color: 'var(--ink-soft)' }}>
            שיא <b style={{ color: 'var(--gold-deep, #a05008)' }}>{peakLabel}</b> · {season.peakShare}% מהכסף · שפל {troughLabel}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 96, marginTop: 12 }}>
        {season.byMonth.map((m) => {
          const isPeak = m.month === season.peakMonth && m.ils > 0;
          const isTrough = m.month === season.troughMonth && m.gifts > 0 && !isPeak;
          const h = Math.max(3, (m.ils / max) * 74);
          const bg = isPeak ? 'var(--gold-deep, #a05008)' : isTrough ? 'var(--warn, #b45309)' : m.ils > 0 ? 'var(--gold, #e7a72e)' : 'var(--line, #e4dbc9)';
          return (
            <div key={m.month} title={MONTHS_HE[m.month - 1] + ' · ' + ILS(m.ils) + ' · ' + m.gifts + ' מתנות · ' + m.donors + ' תורמים'}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9.5, fontWeight: isPeak ? 800 : 600, color: isPeak ? 'var(--gold-deep, #a05008)' : 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{m.ils > 0 ? KILO(m.ils).replace('₪', '') : ''}</span>
              <span style={{ width: '100%', maxWidth: 40, height: h, background: bg, borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: 10, color: isPeak ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: isPeak ? 800 : 600 }}>{MONTHS_HE[m.month - 1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * לוח-האותות — **מה השתנה**: מונים פר-סוג-אות (גולשים · ירדו · חזרו · קפצו · חדשים) +
 * רשימת ה"מזיזים" הדחופים. משלים את ה-RFM הסטטי בזיהוי-סטיות-דפוס.
 */
function SignalsBand(props: { signals: PortfolioSignals; onOpen: (id: string) => void }) {
  const { signals } = props;
  const [filter, setFilter] = useState<SignalKind | null>(null);
  const movers = filter ? signals.movers.filter((m) => m.kind === filter) : signals.movers;

  if (signals.total === 0) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2 }}>לוח-האותות</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>אין חריגות-דפוס כרגע — התיק יציב. ✅</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>לוח-האותות</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>מה השתנה בדפוס — {signals.total} אותות</div>
      </div>

      {/* מונים פר-סוג (לחיצים = סינון) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {SIGNAL_ORDER.filter((k) => signals.counts[k] > 0).map((k) => {
          const m = SIGNAL_META[k];
          const on = filter === k;
          return (
            <button key={k} type="button" onClick={() => setFilter(on ? null : k)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 10, cursor: 'pointer', border: on ? '1.5px solid ' + m.color : '1px solid var(--line, #e4dbc9)', background: on ? m.bg : 'var(--panel, #fff)' }}>
              <span>{m.emoji}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{m.label}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: m.color, fontVariantNumeric: 'tabular-nums' }}>{signals.counts[k]}</span>
            </button>
          );
        })}
      </div>

      {/* המזיזים */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {movers.slice(0, 8).map((s, i) => {
          const m = SIGNAL_META[s.kind];
          return (
            <div key={s.id + s.kind + i} onClick={() => props.onOpen(s.id)}
              style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 9, background: 'var(--panel-2, #f7f2e8)', cursor: 'pointer' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.bg, fontSize: 13 }}>{m.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{s.detail}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: m.color, fontVariantNumeric: 'tabular-nums' }}>{KILO(s.ils)}</span>
              <Btn sm onClick={() => props.onOpen(s.id)} title="פתיחת כרטיס">פתח</Btn>
            </div>
          );
        })}
        {movers.length > 8 ? <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'center', paddingTop: 4 }}>ועוד {movers.length - 8}…</div> : null}
      </div>
    </div>
  );
}

export function SupportersIntel(props: {
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  onOpen: (id: string) => void;
  onExit?: () => void;
  /** דריל-אין מאריח → סינון הטבלה במסך-הנתונים (atrisk/gave12m). */
  onSegment?: (key: 'atrisk' | 'gave12m') => void;
}) {
  const [sort, setSort] = useState<SortKey>('score');
  const [selId, setSelId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const rate = props.usdRate || 3.7;

  // מעבר-יחיד לתורם, memoized — הבסיס לכל הטבלה והתיק.
  const rows = useMemo(
    () => props.supporters.map((sp) => ({ sp, intel: donorIntel(sp, today, rate) })).filter((r) => r.intel.scan.count > 0),
    [props.supporters, today, rate],
  );
  const portfolio = useMemo(() => portfolioIntel(props.supporters, today, rate), [props.supporters, today, rate]);
  const cohort = useMemo(() => tierTrendCounts(props.supporters, today, rate), [props.supporters, today, rate]);
  const active = useMemo(() => activeByMonth(props.supporters, today, 12, rate), [props.supporters, today, rate]);
  const machine = useMemo(() => timeMachine(props.supporters, today, rate), [props.supporters, today, rate]);
  const season = useMemo(() => seasonality(props.supporters, rate), [props.supporters, rate]);
  const signals = useMemo(() => portfolioSignals(props.supporters, today, rate), [props.supporters, today, rate]);
  const ranks = useMemo(() => donorRanks(props.supporters, today, rate), [props.supporters, today, rate]);
  const retention = useMemo(() => acquisitionCohorts(props.supporters, today, rate), [props.supporters, today, rate]);
  const pareto = useMemo(() => paretoReport(props.supporters, today, rate), [props.supporters, today, rate]);
  const migration = useMemo(() => tierMigration(props.supporters, today, 12, rate), [props.supporters, today, rate]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (sort === 'ltv') return b.intel.ltv - a.intel.ltv;
      if (sort === 'churn') return b.intel.churn - a.intel.churn;
      if (sort === 'forecast') return (b.intel.forecast?.amount ?? 0) - (a.intel.forecast?.amount ?? 0);
      return b.intel.rfm.score - a.intel.rfm.score;
    });
    return arr;
  }, [rows, sort]);

  const shown = sorted.slice(0, 60);
  const selected = shown.find((r) => r.sp.id === selId) ?? shown[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>מרכז המודיעין</h1>
        {props.onExit ? (
          <Btn onClick={props.onExit} title="חזרה למסך-הנתונים">☰ מסך הנתונים</Btn>
        ) : null}
        {featureOn(props.config, 'core.export') ? (
          <Btn sm onClick={() => downloadCsv('intel-' + today + '.csv', intelCsvRows(props.supporters, today, rate))} title="ייצוא כל המודיעין ל-CSV">⬇ CSV מלא</Btn>
        ) : null}
        <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>מיון:</span>
          {SORTS.map((s) => (
            <button key={s.key} type="button" onClick={() => setSort(s.key)}
              className={'chip' + (sort === s.key ? ' on' : '')} style={{ cursor: 'pointer' }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* portfolio tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <Tile label="שווי-תיק (LTV)" value={KILO(portfolio.ltv)} note={portfolio.count + ' תורמים'} />
        <Tile label="תחזית 90 יום" value={KILO(portfolio.forecast90)} note="צפי-נכנס" />
        <Tile label="שימור 12ח׳" value={portfolio.retention12m + '%'} tone="var(--good, #2e7d32)" onClick={props.onSegment ? () => props.onSegment!('gave12m') : undefined} />
        <Tile label="₪ בסכנה" value={KILO(portfolio.atRiskMoney)} note={portfolio.atRiskCount + ' תורמים'} tone="var(--warn, #b45309)" onClick={props.onSegment ? () => props.onSegment!('atrisk') : undefined} />
        <Tile label={'ריכוזיות (top-' + portfolio.topN + ')'} value={portfolio.concentrationTopN + '%'} />
        <Tile label="מתנה ממוצעת" value={ILS(portfolio.avgGift)} />
      </div>

      {/* לוח-האותות — מה השתנה בדפוס */}
      {featureOn(props.config, 'supporters.intel.signals') && <SignalsBand signals={signals} onOpen={props.onOpen} />}

      {/* table + deep-dive */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr .9fr 1.1fr .9fr auto', gap: 10, padding: '10px 14px', fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', borderBottom: '1px solid var(--line, #e4dbc9)' }}>
              <span>תורם/ת</span><span>ציון · RFM</span><span>LTV</span><span>תחזית</span><span>סיכון</span><span></span>
            </div>
            {shown.map(({ sp, intel }) => {
              const tier = supTier(intel.rfm.score);
              const isSel = selected && selected.sp.id === sp.id;
              return (
                <div key={sp.id} onClick={() => setSelId(sp.id)}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr .9fr 1.1fr .9fr auto', gap: 10, padding: '10px 14px', alignItems: 'center', borderBottom: '1px solid var(--line-soft, #efe8d9)', cursor: 'pointer', background: isSel ? 'var(--gold-soft, #fbeecb)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, background: 'var(--panel-2, #f7f2e8)' }}>{(sp.name || '💛').charAt(0)}</span>
                    <div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sp.name || 'ללא שם'}</div><div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{sp.cat || '—'}</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 900, fontSize: 14, color: tier.c }}>{intel.rfm.score}</span>
                    <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 18 }}>
                      {([intel.rfm.rPct, intel.rfm.fPct, intel.rfm.mPct] as number[]).map((p, i) => (
                        <i key={i} style={{ width: 4, height: Math.max(3, (p / 100) * 18), background: p < 40 ? riskColor(70) : 'var(--gold, #e7a72e)', borderRadius: 2, display: 'block' }} />
                      ))}
                    </span>
                  </div>
                  <div><span style={{ fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{KILO(intel.ltv)}</span></div>
                  <div style={{ fontSize: 12.5 }}>
                    {intel.forecast ? (<><b style={{ fontVariantNumeric: 'tabular-nums' }}>{KILO(intel.forecast.amount)}</b> <span style={{ fontSize: 10.5, color: 'var(--info, #1d4ed8)' }}>{intel.forecast.confidence}%</span></>) : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                  </div>
                  <div>
                    <div style={{ height: 6, borderRadius: 99, background: 'var(--line, #e4dbc9)', overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: intel.churn + '%', background: riskColor(intel.churn), borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 10, color: riskColor(intel.churn), fontWeight: 700, marginTop: 2 }}>{intel.churn}%</div>
                  </div>
                  <Btn sm onClick={() => props.onOpen(sp.id)} title="פתיחת כרטיס">פתח</Btn>
                </div>
              );
            })}
            {shown.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>אין תורמים עם היסטוריית-נתינה עדיין.</div> : null}
            {sorted.length > 60 ? <div style={{ padding: 10, textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)' }}>מוצגים 60 מתוך {sorted.length} · מסך-הנתונים המלא קליק אחד</div> : null}
          </div>
        </div>

        {selected ? <DeepDive sp={selected.sp} intel={selected.intel} rate={rate} today={today} rank={ranks.get(selected.sp.id)} onOpen={props.onOpen} /> : null}
      </div>

      {/* מפת-העונתיות — מתי נכנס הכסף */}
      {featureOn(props.config, 'supporters.intel.season') && <SeasonBand season={season} />}

      {/* קוהורטת-גיוס — שימור לפי שנת-הצטרפות */}
      {featureOn(props.config, 'supporters.intel.retention') && <RetentionBand report={retention} />}

      {/* ריכוזיות התיק — פארטו/ג׳יני */}
      {featureOn(props.config, 'supporters.intel.pareto') && <ParetoBand report={pareto} />}

      {/* מכונת-הזמן — הקרנת-התיק קדימה */}
      {featureOn(props.config, 'supporters.intel.time') && <TimeBand machine={machine} />}

      {/* רצועת-קוהורטה — מיגרציה · פעילות · פיזור-ציון */}
      {featureOn(props.config, 'supporters.intel.cohort') && <CohortBand cohort={cohort} active={active} scoreBins={portfolio.scoreBins} migration={migration} />}
    </div>
  );
}
