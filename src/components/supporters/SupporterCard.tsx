/**
 * כרטיס-התורם המאוחד — מעטפת-לשוניות מעל הכרטיס הקיים. **אפס-שכפול, אפס-סחף:**
 * לשונית "הכרטיס" מרנדרת את `SupporterDetail` המלא כמו-שהוא (כל היכולות נשמרות),
 * ולשונית "מודיעין" מוסיפה ניתוח-עומק פר-תורם (RFM · תחזית · סיכון · קצב · אותות ·
 * דירוג). מגודר opt-in מפורש (`supporters.card === true`) ⇒ כבוי = הכרטיס הרגיל.
 */
import { useMemo, useState } from 'react';
import type { OrgConfig } from '../../types/config';
import type { Supporter } from '../../types/domain';
import { Btn } from '../ui';
import { CallBtn } from '../CallBtn';
import { WaBtn } from '../WaBtn';
import { integrationOn, telephonyOn } from '../../lib/config';
import { isoToday, supTier } from './lib';
import { SupporterDetail } from './SupporterDetail';
import { donorIntel } from './intel';
import { donorRhythm } from './seasonality';
import { donorSignals, type SignalKind } from './signals';
import { donorRanks } from './ranks';

const ILS = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
const KILO = (n: number) => (n >= 1000 ? '₪' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : ILS(n));
const MONTHS_HE = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
const SIGNAL_META: Record<SignalKind, { emoji: string; color: string; bg: string }> = {
  reactivated: { emoji: '🔄', color: 'var(--good, #2e7d32)', bg: 'var(--good-bg, #e7f4e8)' },
  jump: { emoji: '📈', color: 'var(--info, #1d4ed8)', bg: 'var(--info-bg, #e7eefb)' },
  firstgift: { emoji: '✨', color: 'var(--gold-deep, #a05008)', bg: 'var(--gold-soft, #fbeecb)' },
  drop: { emoji: '📉', color: 'var(--warn, #b45309)', bg: 'var(--warn-bg, #fdf0e1)' },
  lapsing: { emoji: '⚠️', color: 'var(--red, #b3261e)', bg: 'var(--red-bg, #fdecea)' },
};
function riskColor(c: number): string {
  return c >= 60 ? 'var(--red, #b3261e)' : c >= 35 ? 'var(--warn, #b45309)' : 'var(--good, #2e7d32)';
}

function Tile(props: { label: string; value: string; tone?: string; note?: string }) {
  return (
    <div className="card" style={{ padding: '11px 13px' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 1px', color: props.tone || 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{props.value}</div>
      {props.note ? <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700 }}>{props.note}</div> : null}
    </div>
  );
}

function IntelPanel(props: { supporter: Supporter; supporters: Supporter[]; usdRate: number; config: OrgConfig; onGoCard: () => void }) {
  const rate = props.usdRate || 3.7;
  // 🐛 (21.8): toISOString = UTC ⇒ בין חצות מקומי ל-02:00/03:00 "היום" היה אתמול.
  const today = isoToday();
  const intel = useMemo(() => donorIntel(props.supporter, today, rate), [props.supporter, today, rate]);
  const rhythm = useMemo(() => donorRhythm(props.supporter, rate), [props.supporter, rate]);
  const sigs = useMemo(() => donorSignals(props.supporter, today, rate), [props.supporter, today, rate]);
  const rank = useMemo(() => donorRanks(props.supporters, today, rate).get(props.supporter.id), [props.supporters, today, rate, props.supporter.id]);
  const tier = supTier(intel.rfm.score);
  const mo = intel.scan.monthly;
  const max = Math.max(1, ...mo);

  if (intel.scan.count === 0) {
    return <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>אין עדיין היסטוריית-נתינה לניתוח.</div>;
  }

  const sp = props.supporter;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* שורת-פעולה — הניתוח מוביל לפעולה (לא רק קריאה) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {telephonyOn(props.config) && sp.phone ? <CallBtn phone={sp.phone} title={'חיוג ל' + sp.name} /> : null}
        {integrationOn(props.config, 'whatsapp') && sp.phone ? <WaBtn phone={sp.phone} title={'וואטסאפ ל' + sp.name} /> : null}
        <Btn onClick={props.onGoCard} title="מעבר ללשונית הכרטיס — רישום תרומה · תודה · הו״ק · עריכה">✎ עריכה ופעולות בכרטיס</Btn>
        <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>הפעולות המלאות (תרומה · תודה · הו״ק · עריכה) בלשונית "📇 הכרטיס"</span>
      </div>

      {/* אריחי-על */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        <Tile label="דרגה · ציון" value={tier.label + ' ' + intel.rfm.score} tone={tier.c} note={rank ? '#' + rank.ltvRank + '/' + rank.total + ' · אחוזון ' + rank.percentile : undefined} />
        <Tile label="ערך-חיים" value={KILO(intel.ltv)} note={intel.scan.count + ' מתנות'} />
        <Tile label="מתנה ממוצעת" value={ILS(intel.avgGift)} />
        <Tile label="סיכון-נטישה" value={intel.churn + '%'} tone={riskColor(intel.churn)} />
      </div>

      {/* אותות + קצב */}
      {(sigs.length || rhythm.topMonth) ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {rhythm.topMonth ? (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: rhythm.seasonal ? 'var(--gold-soft, #fbeecb)' : 'var(--panel-2, #f7f2e8)', color: rhythm.seasonal ? 'var(--gold-deep, #a05008)' : 'var(--ink-soft)' }}>🗓️ {rhythm.seasonal ? 'עונתי · ' : ''}שיא {MONTHS_HE[rhythm.topMonth - 1]}</span>
          ) : null}
          {sigs.map((s, i) => {
            const m = SIGNAL_META[s.kind];
            return <span key={s.kind + i} title={s.detail} style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: m.bg, color: m.color }}>{m.emoji} {s.detail}</span>;
          })}
        </div>
      ) : null}

      {/* ציר-זמן + RFM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-faint)', marginBottom: 8 }}>ציר-זמן נתינה · 12 חודשים</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 54 }}>
            {mo.map((v, i) => (
              <div key={i} title={ILS(v)} style={{ flex: 1, height: Math.max(2, (v / max) * 54), background: v > 0 ? 'var(--accent-deep, #a05008)' : 'var(--line, #e4dbc9)', borderRadius: '3px 3px 0 0' }} />
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-faint)', marginBottom: 8 }}>פירוק הציון · R · F · M</div>
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
      </div>

      {/* תחזית */}
      {intel.forecast ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-faint)', marginBottom: 7 }}>תחזית המתנה-הבאה</div>
          <div style={{ background: 'var(--info-bg, #e7eefb)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--info, #1d4ed8)', fontVariantNumeric: 'tabular-nums' }}>{ILS(intel.forecast.amount)}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginInlineStart: 8 }}>
              {MONTHS_HE[+intel.forecast.dueIso.slice(5, 7) - 1]} {intel.forecast.dueIso.slice(0, 4)} · ביטחון <b>{intel.forecast.confidence}%</b>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SupporterCard(props: {
  supporter: Supporter;
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'card' | 'intel'>('card');
  const TABS: { key: 'card' | 'intel'; label: string }[] = [
    { key: 'card', label: '📇 הכרטיס' },
    { key: 'intel', label: '📊 מודיעין' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* מעטפת-לשוניות */}
      <div role="tablist" aria-label="מבט כרטיס-התורם" style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, background: 'var(--panel-2, #f7f2e8)', border: '1px solid var(--line, #e4dbc9)', alignSelf: 'flex-start' }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button key={t.key} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.key)}
              style={{ padding: '6px 14px', borderRadius: 9, cursor: on ? 'default' : 'pointer', border: 'none', fontSize: 13, fontWeight: on ? 800 : 600, background: on ? 'var(--panel, #fff)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink-soft)', boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'card' ? (
        <SupporterDetail supporter={props.supporter} onBack={props.onBack} />
      ) : (
        <IntelPanel supporter={props.supporter} supporters={props.supporters} usdRate={props.usdRate} config={props.config} onGoCard={() => setTab('card')} />
      )}
    </div>
  );
}
