/**
 * לוח מעקב הטיפול — תור חוצה-תומכות בראש מסך התורמים. סינון לפי שלב, מיון,
 * וכפתור חכם לכל שורה. כל התוויות עוברות דרך מילון המונחים (feature כללי).
 * מוצג רק כשהפיצ'ר supporters.ayin דלוק (הגייטינג בקורא — SupportersView).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import {
  AYIN_STAGES,
  ayinActionVisible,
  ayinActive,
  ayinAdvanceLabel,
  featLabel,
  stageIndex,
  stageLabel,
} from '../../lib/ayin';
import type { AyinCase, AyinStage } from '../../types/domain';
import { fmtDate } from './lib';

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
  return (
    a.names
      .map((n) => n.name + (n.eyes !== '' && n.eyes != null ? ' ·' + n.eyes : ''))
      .join(' · ') || '—'
  );
}

export function AyinBoard(props: { onOpen: (id: string) => void }) {
  const db = useApp((s) => s.db);
  const cfg = useApp((s) => s.config);
  const advance = useApp((s) => s.ayinAdvance);

  const [filter, setFilter] = useState<'all' | AyinStage>('all');
  const [sort, setSort] = useState<'target' | 'last' | 'name' | 'stage'>('target');
  const [open, setOpen] = useState(true);

  const active = db.supporters.filter((sp) => ayinActive(sp.ayin));
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
          marginBottom: open ? 10 : 0,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#9a6414' }}>
          🗂 לוח {feat} · {active.length}
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
          <button
            onClick={() => setOpen(!open)}
            style={{
              border: '1px solid #ecd9a8',
              background: '#fff',
              color: '#9a6414',
              borderRadius: 99,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {open ? 'הסתר' : 'הצג'}
          </button>
        </div>
      </div>

      {open &&
        (rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#9a8a63', padding: '6px 2px' }}>
            אין פריטים פעילים בלוח — פתחו כרטיס תומכ/ת והתחילו מעקב.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {rows.map((sp) => {
              const a = sp.ayin!;
              const showBtn = ayinActionVisible(a);
              return (
                <div
                  key={sp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => props.onOpen(sp.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      props.onOpen(sp.id);
                    }
                  }}
                  title="פתיחת כרטיס התומכת"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(90px,.9fr) 1.6fr 1.1fr .8fr .8fr auto',
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
                    }}
                  >
                    {namesLineOf(a)}
                  </div>
                  <div style={{ fontSize: 11, color: '#9a6414', fontWeight: 800 }}>
                    {a.nextTalk ? fmtDate(a.nextTalk) : '—'}
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
        ))}
    </div>
  );
}
