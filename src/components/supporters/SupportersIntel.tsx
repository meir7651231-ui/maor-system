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
import { portfolioIntel } from './portfolio';

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

function Tile(props: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="card" style={{ padding: '12px 13px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}</div>
      <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-.4px', margin: '3px 0 1px', color: props.tone || 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{props.value}</div>
      {props.note ? <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700 }}>{props.note}</div> : null}
    </div>
  );
}

function DeepDive(props: { sp: Supporter; intel: DonorIntel }) {
  const { intel, sp } = props;
  const tier = supTier(intel.rfm.score);
  const mo = intel.scan.monthly;
  const max = Math.max(1, ...mo);
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
        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: tier.bg, color: tier.c }}>{tier.label} {intel.rfm.score}</span>
      </div>

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

export function SupportersIntel(props: {
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  onOpen: (id: string) => void;
  onExit?: () => void;
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
        <Tile label="שימור 12ח׳" value={portfolio.retention12m + '%'} tone="var(--good, #2e7d32)" />
        <Tile label="₪ בסכנה" value={KILO(portfolio.atRiskMoney)} note={portfolio.atRiskCount + ' תורמים'} tone="var(--warn, #b45309)" />
        <Tile label={'ריכוזיות (top-' + portfolio.topN + ')'} value={portfolio.concentrationTopN + '%'} />
        <Tile label="מתנה ממוצעת" value={ILS(portfolio.avgGift)} />
      </div>

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

        {selected ? <DeepDive sp={selected.sp} intel={selected.intel} /> : null}
      </div>
    </div>
  );
}
