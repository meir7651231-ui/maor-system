/**
 * כרטיס מעקב הטיפול (feature supporters.ayin) — פאנל בתוך כרטיס התומכ/ת:
 * שלבים לחיצים, כפתור-חכם מסנכרן-לוח, רשימת פריטים (שם + מונה + בוצע),
 * תשובות/הערות מתוארכות, מועד "לדבר שוב" (עברי/לועזי) והיסטוריית מונה.
 * כל התוויות עוברות דרך מילון המונחים — כללי וניתן לשינוי-שם מלא.
 */
import { useState } from 'react';
import type { Supporter } from '../../types/domain';
import { emptyAyin } from '../../types/domain';
import { useApp } from '../../store/useApp';
import {
  AYIN_STAGES,
  ayinActionVisible,
  ayinAdvanceLabel,
  eyesTotal,
  featLabel,
  itemLabel,
  stageIndex,
  stageLabel,
  unitLabel,
} from '../../lib/ayin';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { fmtDate } from './lib';

export function AyinCard(props: { supporter: Supporter }) {
  const sp = props.supporter;
  const a = sp.ayin ?? emptyAyin();
  const cfg = useApp((s) => s.config);
  const advance = useApp((s) => s.ayinAdvance);
  const revert = useApp((s) => s.ayinRevert);
  const addName = useApp((s) => s.ayinAddName);
  const toggleName = useApp((s) => s.ayinToggleName);
  const setNameEyes = useApp((s) => s.ayinSetNameEyes);
  const removeName = useApp((s) => s.ayinRemoveName);
  const addAnswer = useApp((s) => s.ayinAddAnswer);
  const editAnswer = useApp((s) => s.ayinEditAnswer);
  const deleteAnswer = useApp((s) => s.ayinDeleteAnswer);
  const setNextTalk = useApp((s) => s.ayinSetNextTalk);
  const callAgain = useApp((s) => s.ayinCallAgain);
  const restart = useApp((s) => s.ayinRestart);

  const [nameIn, setNameIn] = useState('');
  const [eyesIn, setEyesIn] = useState('');
  const [note, setNote] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const feat = featLabel(cfg);
  const item = itemLabel(cfg);
  const unit = unitLabel(cfg);
  const cur = stageIndex(a.stage);
  const showNames = a.stage === 'new' || a.stage === 'lead' || a.stage === 'eyes';

  function submitName() {
    const eyes = eyesIn === '' ? '' : Math.max(0, +eyesIn.replace(/\D/g, '') || 0);
    addName(sp.id, nameIn, eyes);
    setNameIn('');
    setEyesIn('');
  }

  function saveNote() {
    if (editIdx != null) editAnswer(sp.id, editIdx, note);
    else addAnswer(sp.id, note);
    setNote('');
    setEditIdx(null);
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 15 }}>🗂 {feat}</h3>
        <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          {a.lastTouch ? 'עדכון אחרון: ' + fmtDate(a.lastTouch) : 'טרם עודכן'}
        </span>
      </div>

      {/* שלבים — לחיצה על שלב שהושלם מחזירה אליו */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {AYIN_STAGES.map((st, i) => {
          const done = i < cur;
          const on = i === cur;
          const clickable = i <= cur;
          return (
            <button
              key={st}
              disabled={!clickable || on}
              onClick={() => revert(sp.id, st)}
              title={on ? 'השלב הנוכחי' : done ? 'שלב שהושלם — לחיצה חוזרת אליו' : ''}
              style={{
                border: '1px solid ' + (on ? '#211d17' : done ? '#cde9d6' : '#ded7c8'),
                background: on ? '#211d17' : done ? '#e4f5ea' : '#fff',
                color: on ? '#f3c76b' : done ? '#12803c' : '#b3ab9a',
                borderRadius: 99,
                padding: '4px 12px',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: clickable && !on ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
              }}
            >
              {(done ? '✓ ' : '') + stageLabel(cfg, st)}
            </button>
          );
        })}
      </div>

      {ayinActionVisible(a) && (
        <div>
          <Btn kind="primary" onClick={() => advance(sp.id)} title="הכפתור החכם — מקדם לשלב הבא ומסנכרן ללוח ולדוח היומי">
            {ayinAdvanceLabel(cfg, a)}
          </Btn>
        </div>
      )}

      {/* פריטים למעקב */}
      {showNames && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            {item} ({a.names.length})
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <input
              value={nameIn}
              onChange={(e) => setNameIn(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitName()}
              placeholder={item}
              style={{ flex: '1 1 140px', minWidth: 120 }}
            />
            <input
              value={eyesIn}
              onChange={(e) => setEyesIn(e.target.value.replace(/\D/g, ''))}
              placeholder={unit}
              dir="ltr"
              style={{ width: 70 }}
            />
            <Btn sm kind="primary" onClick={submitName}>
              + הוספה
            </Btn>
          </div>
          {a.names.length === 0 ? (
            <Empty>עדיין לא נוספו פריטים — הוסיפו את הראשון למעלה</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {a.names.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: n.done ? '#f3faf5' : '#fff',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    padding: '6px 10px',
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{n.name}</span>
                  <input
                    value={n.eyes === '' ? '' : String(n.eyes)}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setNameEyes(sp.id, n.id, v === '' ? '' : +v);
                    }}
                    placeholder={unit}
                    dir="ltr"
                    style={{ width: 60, padding: '3px 6px', fontSize: 12 }}
                    title={unit}
                  />
                  <button
                    onClick={() => toggleName(sp.id, n.id)}
                    title={n.done ? 'סימון שהטיפול בפריט ממתין' : 'סימון שהטיפול בפריט בוצע'}
                    style={{
                      background: n.done ? '#e4f5ea' : '#fdeaea',
                      color: n.done ? '#12803c' : '#b91c1c',
                      border: 'none',
                      borderRadius: 6,
                      padding: '3px 9px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {n.done ? '✓' : '✗'}
                  </button>
                  <button
                    onClick={() => removeName(sp.id, n.id)}
                    title="הסרה"
                    style={{ color: 'var(--ink-faint)', fontWeight: 800 }}
                  >
                    🗑
                  </button>
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                {a.names.length} · {a.names.filter((x) => x.done).length} בוצעו · סה"כ {unit}: {eyesTotal(a)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* תשובות / הערות */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>תשובות / הערות ({a.answers.length})</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveNote()}
            placeholder={editIdx != null ? 'עריכת הערה…' : 'תשובה / הערה חדשה…'}
            style={{ flex: 1 }}
          />
          <Btn sm kind="primary" onClick={saveNote}>
            {editIdx != null ? 'עדכון' : 'שמירה'}
          </Btn>
        </div>
        {a.answers.map((an, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--line-soft)' }}
          >
            <span style={{ color: 'var(--ink-faint)', fontSize: 11.5, whiteSpace: 'nowrap' }}>{fmtDate(an.date)}</span>
            <span style={{ flex: 1 }}>{an.note}</span>
            <button
              onClick={() => {
                setNote(an.note);
                setEditIdx(i);
              }}
              title="מחזיר לשדה ההערה"
              style={{ color: 'var(--ink-faint)', fontWeight: 700 }}
            >
              ✎
            </button>
            <button onClick={() => deleteAnswer(sp.id, i)} title="מחיקה" style={{ color: 'var(--ink-faint)', fontWeight: 700 }}>
              🗑
            </button>
          </div>
        ))}
      </div>

      {/* מתי לדבר שוב */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>מתי לדבר שוב</div>
        <HebDateInput value={a.nextTalk || ''} onChange={(iso) => setNextTalk(sp.id, iso, a.nextTalkTime || '')} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          <input
            type="time"
            dir="ltr"
            value={a.nextTalkTime || ''}
            onChange={(e) => setNextTalk(sp.id, a.nextTalk || '', e.target.value)}
            style={{ width: 120 }}
          />
          <Btn sm onClick={() => callAgain(sp.id)} title="כותב תזכורת ללוח השנה">
            🔁 שוב
          </Btn>
        </div>
      </div>

      {/* היסטוריית מונה */}
      {a.log.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>היסטוריית {unit}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {a.log.slice(0, 30).map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>
                  {hebDateFull(l.date)} · {fmtDate(l.date)}
                  {l.name ? ' · ' + l.name : ''}
                </span>
                <span style={{ fontWeight: 700 }}>{l.eyes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        <Btn sm onClick={() => restart(sp.id)} title="פתיחת מחזור טיפול חדש מההתחלה — ההיסטוריה נשמרה">
          ↻ מחזור חדש
        </Btn>
      </div>
    </div>
  );
}
