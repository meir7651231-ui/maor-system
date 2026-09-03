/**
 * לוח מעקב הטיפול — תור חוצה-תומכות בראש מסך התורמים. סינון לפי שלב, מיון,
 * וכפתור חכם לכל שורה. כל התוויות עוברות דרך מילון המונחים (feature כללי).
 * מוצג רק כשהפיצ'ר supporters.ayin דלוק (הגייטינג בקורא — SupportersView).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { useDbWatch } from '../../store/dbWatch';
import { featureOn, termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import {
  AYIN_STAGES,
  ayinActionVisible,
  ayinActive,
  ayinAdvanceLabel,
  featLabel,
  stageIndex,
  stageLabel,
  unitLabel,
} from '../../lib/ayin';
import type { AyinCase, AyinStage } from '../../types/domain';
import { fmtDate, supporterVisibleForDesignations } from './lib';

/** תבנית-הגריד של שורה ושל שורת-הכותרות — זהה, כדי שהעמודות יתיישרו. */
// עמודה אחרונה ברוחב קבוע (לא auto): בשורות בלי כפתור-חכם הטראק היה 0px וה-fr-ים נדדו עד ~90px מול הכותרות (אימות-ריצה 3.9).
const ROW_GRID = 'minmax(90px,.9fr) 1.6fr 1.1fr .8fr .8fr 140px';

/** גלולות השלבים לשורה — הושלמו (ירוק) · נוכחי (כהה) · עתידיים (עמום). */
function StageChips(props: { cfg: ReturnType<typeof useApp.getState>['config']; stage: AyinStage }) {
  const cur = stageIndex(props.stage);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {AYIN_STAGES.map((st, i) => {
        const done = i < cur;
        const on = i === cur;
        return (
          <span
            key={st}
            style={{
              border: '1px solid ' + (on ? '#211d17' : done ? '#cde9d6' : '#e8e2d4'),
              background: on ? '#211d17' : done ? '#e4f5ea' : '#faf7f0',
              color: on ? '#f3c76b' : done ? '#12803c' : '#b3ab9a',
              borderRadius: 99,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            {(done ? '✓ ' : '') + stageLabel(props.cfg, st)}
          </span>
        );
      })}
    </div>
  );
}

function namesLineOf(a: AyinCase): string {
  // כמו בלגאסי (script:2920 — בדיקת-אמת): מונה ריק / 0 לא מודפס (" ·0" הוסר).
  return (
    a.names
      .map((n) => n.name + ((+n.eyes || 0) > 0 ? ' ·' + n.eyes : ''))
      .join(' · ') || '—'
  );
}

export function AyinBoard(props: { onOpen: (id: string) => void }) {
  const db = useDbWatch('supporters');
  const cfg = useApp((s) => s.config);
  const advance = useApp((s) => s.ayinAdvance);
  // 🔒 ייעוד-הרשאה (13.8): לוח-הטיפול לא יחשוף שמות תורמים לעובד/ת שאינו מורשה לייעודם.
  const allowedDesignations = useApp((s) => s.cloud.allowedDesignations ?? null);
  const desigLimit = featureOn(cfg, 'supporters.purpose') ? allowedDesignations : null;

  const [filter, setFilter] = useState<'all' | AyinStage>('all');
  const [sort, setSort] = useState<'target' | 'last' | 'name' | 'stage'>('target');
  // הקיפול היחיד הוא של העוטף ב-SupportersView ("▼ הצגה / ▲ הסתרה", הכרעת-בעלים 19.8) —
  // מתג-קיפול פנימי כפול הוסר (ביקורת 3.9).
  const today = isoToday();
  // 💳 שער-תשלום (opt-in מפורש, כמו AyinCard) — חסר-הדגל ⇒ אין צ'יפ, ביט-זהה.
  const payGateOn = cfg.features?.['supporters.ayin.paygate'] === true;

  const active = db.supporters.filter(
    (sp) => ayinActive(sp.ayin) && supporterVisibleForDesignations(sp, desigLimit),
  );
  let rows = filter === 'all' ? active : active.filter((sp) => (sp.ayin!.stage || 'new') === filter);
  rows = [...rows].sort((sa, sb) => {
    const aa = sa.ayin!;
    const ab = sb.ayin!;
    if (sort === 'name') return sa.name.localeCompare(sb.name, 'he');
    if (sort === 'last') return (ab.lastTouch || '').localeCompare(aa.lastTouch || '');
    if (sort === 'stage') return stageIndex(aa.stage) - stageIndex(ab.stage);
    return (aa.nextTalk || '9999').localeCompare(ab.nextTalk || '9999');
  });

  const feat = featLabel(cfg);
  const selStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid #ecd9a8',
    borderRadius: 9,
    fontSize: 11,
    fontWeight: 700,
    background: '#fff',
    color: '#9a6414',
  };

  return (
    <div
      style={{
        background: '#fdf7e6',
        border: '1px solid #ecd9a8',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#9a6414' }}>
          🗂 לוח {feat} · {filter === 'all' ? active.length : rows.length + ' מתוך ' + active.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | AyinStage)}
            title="סינון לפי שלב"
            style={selStyle}
          >
            <option value="all">כל השלבים</option>
            {AYIN_STAGES.map((st) => (
              <option key={st} value={st}>
                {stageLabel(cfg, st)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            title="מיון"
            style={selStyle}
          >
            <option value="target">🎯 יעד קרוב</option>
            <option value="last">עדכון אחרון</option>
            <option value="name">שם א׳-ת׳</option>
            <option value="stage">לפי שלב</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: '#9a8a63', padding: '6px 2px' }}>
          {active.length > 0
            ? 'אין פריטים בשלב זה'
            : 'אין פריטים פעילים בלוח — פתחו כרטיס ' + termOf(cfg, 'entity.supporter', 'תומך/ת') + ' והתחילו מעקב.'}
        </div>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* שורת-כותרות (לגאסי markup:1412-1414) — אותה תבנית-גריד כמו השורות;
                במובייל מוסתרת (global.css .ayin-head) כי השורה נשברת לשתי עמודות. */}
            <div
              className="ayin-row ayin-head"
              style={{
                display: 'grid',
                gridTemplateColumns: ROW_GRID,
                gap: 8,
                padding: '0 12px 2px',
                fontSize: 10.5,
                fontWeight: 800,
                color: '#8b8474',
              }}
            >
              <span>שם</span>
              <span>שלב הטיפול</span>
              <span>{'שמות + ' + unitLabel(cfg)}</span>
              <span>🎯 יעד</span>
              <span>עדכון אחרון</span>
              <span>הפעולה הבאה</span>
            </div>
            {rows.map((sp) => {
              const a = sp.ayin!;
              const showBtn = ayinActionVisible(a);
              // 🎯 יעד שעבר (ביקורת-ריצה 3.9, F4): מסומן באדום + ⚠ + title — לא זהה לעתידי.
              const overdue = !!a.nextTalk && a.nextTalk < today;
              return (
                <div
                  key={sp.id}
                  className="ayin-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => props.onOpen(sp.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      props.onOpen(sp.id);
                    }
                  }}
                  title={'פתיחת כרטיס ' + termOf(cfg, 'entity.supporter', 'התומך/ת')}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: ROW_GRID,
                    gap: 8,
                    alignItems: 'center',
                    background: '#fff',
                    border: '1px solid rgba(33,29,23,.07)',
                    borderRadius: 11,
                    padding: '9px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 12.5, minWidth: 0 }}>{sp.name}</div>
                  <StageChips cfg={cfg} stage={a.stage} />
                  <div
                    style={{
                      fontSize: 11,
                      color: '#4d463c',
                      fontWeight: 700,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{namesLineOf(a)}</span>
                    {/* 💰 סימון-שולם על השורה — רק כשהשער דלוק (opt-in); כבוי ⇒ ביט-זהה */}
                    {payGateOn && a.paid && (
                      <span
                        title="שולם"
                        style={{
                          background: '#e4f5ea',
                          color: '#12803c',
                          border: '1px solid #cde9d6',
                          borderRadius: 99,
                          padding: '1px 7px',
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        💰 שולם
                      </span>
                    )}
                  </div>
                  <div
                    style={{ fontSize: 11, color: overdue ? '#b3261e' : '#9a6414', fontWeight: 800 }}
                    title={overdue ? 'באיחור' : undefined}
                  >
                    {a.nextTalk
                      ? (overdue ? '⚠ ' : '') + fmtDate(a.nextTalk) + (a.nextTalkTime ? ' · ' + a.nextTalkTime : '')
                      : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8b8474', fontWeight: 700 }}>
                    {a.lastTouch ? fmtDate(a.lastTouch) : '—'}
                  </div>
                  <div>
                    {showBtn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          advance(sp.id);
                        }}
                        title="הכפתור החכם — מקדם לשלב הבא ומסנכרן ללוח"
                        style={{
                          background: '#211d17',
                          color: '#f3c76b',
                          border: 'none',
                          borderRadius: 9,
                          padding: '6px 10px',
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ayinAdvanceLabel(cfg, a)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
      )}
    </div>
  );
}
