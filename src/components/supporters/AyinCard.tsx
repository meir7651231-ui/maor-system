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
  boqLineAmount,
  boqTotal,
  eyesTotal,
  matCostTotal,
  timeCostTotal,
  timeHoursTotal,
  featLabel,
  itemLabel,
  stageIndex,
  stageLabel,
  unitLabel,
} from '../../lib/ayin';
import { featureOn, integrationOn, integrationSetting } from '../../lib/config';
import { payLink } from '../../lib/payLink';
import { scheduleTasks } from '../../lib/projectSchedule';
import { kitProgress, DEFAULT_KIT_LABELS } from '../../lib/installKit';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { fmtDate, supIls } from './lib';

export function AyinCard(props: { supporter: Supporter }) {
  const sp = props.supporter;
  const a = { ...emptyAyin(), ...(sp.ayin ?? {}) }; // ayin חלקי (גיבוי-ישן/ענן) — כל תת-מערך מובטח
  const cfg = useApp((s) => s.config);
  const advance = useApp((s) => s.ayinAdvance);
  const setPaid = useApp((s) => s.ayinSetPaid);
  const revert = useApp((s) => s.ayinRevert);
  const addName = useApp((s) => s.ayinAddName);
  const toggleName = useApp((s) => s.ayinToggleName);
  const setNameEyes = useApp((s) => s.ayinSetNameEyes);
  const setNameRate = useApp((s) => s.ayinSetNameRate);
  const setNameNote = useApp((s) => s.ayinSetNameNote);
  const removeName = useApp((s) => s.ayinRemoveName);
  const addAnswer = useApp((s) => s.ayinAddAnswer);
  const editAnswer = useApp((s) => s.ayinEditAnswer);
  const deleteAnswer = useApp((s) => s.ayinDeleteAnswer);
  const setNextTalk = useApp((s) => s.ayinSetNextTalk);
  const callAgain = useApp((s) => s.ayinCallAgain);
  const restart = useApp((s) => s.ayinRestart);
  const addTime = useApp((s) => s.ayinAddTime);
  const removeTime = useApp((s) => s.ayinRemoveTime);
  const addMat = useApp((s) => s.ayinAddMat);
  const removeMat = useApp((s) => s.ayinRemoveMat);
  const setSchedule = useApp((s) => s.ayinSetNameSchedule);
  const setKit = useApp((s) => s.ayinSetKit);
  const saveTpl = useApp((s) => s.saveQuoteTemplate);
  const applyTpl = useApp((s) => s.applyQuoteTemplate);
  const deleteTpl = useApp((s) => s.deleteQuoteTemplate);
  const templatesRaw = useApp((s) => s.db.ui.quoteTemplates);

  const [nameIn, setNameIn] = useState('');
  const [eyesIn, setEyesIn] = useState('');
  const [note, setNote] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [tHours, setTHours] = useState('');
  const [tRate, setTRate] = useState('');
  const [tNote, setTNote] = useState('');
  const [mName, setMName] = useState('');
  const [mQty, setMQty] = useState('');
  const [mCost, setMCost] = useState('');
  const [tplName, setTplName] = useState('');
  const [tplSaving, setTplSaving] = useState(false);
  const [kitIn, setKitIn] = useState('');

  const feat = featLabel(cfg);
  const item = itemLabel(cfg);
  const unit = unitLabel(cfg);
  const cur = stageIndex(a.stage);
  // בקשת-בעלים 30.8: השמות נשארים על המסך גם בשלב 'מסירה' (answer) — יורדים
  // מהמסך רק כשהתיק 'הושלם' (done), שאז הם בהיסטוריה. קודם נעלמו כבר במסירה.
  const showNames = a.stage !== 'done';
  // גידור-דגלים (FLAGMAX): חזרה-לשלב / יומן-תשובות / "מתי לדבר שוב" / מחזור-חדש —
  // חסר-דגל = פעיל (עטיפה = אפס-שינוי-ברירת-מחדל); false מסתיר.
  const revertOn = featureOn(cfg, 'supporters.ayin.revert');
  // 💳 שער-תשלום (בקשת-בעלים 25.8, opt-in) — חסר-הדגל ⇒ מוסתר, ביט-זהה להיום.
  const payGateOn = cfg.features?.['supporters.ayin.paygate'] === true;
  // 💳 קישור-תשלום לנדרים בתוך השער (בקשת-בעלים 31.8: "בתשלום לפני הושלם
  // תתן כרטיס לתשלום קישור לנדרים"). אותה בניית-קישור כמו בכרטיס-התומך —
  // דורש הרחבת-תשלומים דלוקה + payUrl בקונפיג; אחרת null (אפס-שינוי).
  const ayinPayHref = payGateOn && integrationOn(cfg, 'payments')
    ? payLink(integrationSetting(cfg, 'payments', 'payUrl'), 0, sp.name)
    : null;
  // כתב-כמויות/הצעת-מחיר — רק בהקשר מסחרי (§46 כבוי) + דגל. בעמותה מוסתר לגמרי.
  const boqOn = featureOn(cfg, 'supporters.ayin.boq') && !featureOn(cfg, 'core.taxreceipt');
  const timeOn = featureOn(cfg, 'supporters.ayin.time') && !featureOn(cfg, 'core.taxreceipt');
  const ils = (n: number) => '₪' + Math.round(n).toLocaleString('en-US');
  const quote = boqOn ? boqTotal(a) : 0;
  const collected = boqOn ? supIls(sp) : 0;
  const cost = timeOn ? timeCostTotal(a) : 0;
  const timeRows = a.time || [];
  const matOn = featureOn(cfg, 'supporters.ayin.mat') && !featureOn(cfg, 'core.taxreceipt');
  const matCost = matOn ? matCostTotal(a) : 0;
  const matRows = a.mat || [];
  const totalCost = cost + matCost;
  const pnlOn = boqOn || timeOn || matOn;
  // ורטיקל-הסטודיו (פריט 6): גאנט-תלויות + install-kit — מסחרי בלבד (§46 כבוי).
  const ganttOn = featureOn(cfg, 'supporters.ayin.gantt') && !featureOn(cfg, 'core.taxreceipt');
  const kitOn = featureOn(cfg, 'supporters.ayin.kit') && !featureOn(cfg, 'core.taxreceipt');
  const schedule = ganttOn ? scheduleTasks(a.names) : { tasks: [], total: 0 };
  const kit = kitProgress(a);
  const tpls = templatesRaw || []; // אין ?? בסלקטור zustand (React #185) — ברירת-מחדל כאן
  function doSaveTpl() {
    if (!tplName.trim()) return;
    saveTpl(sp.id, tplName);
    setTplName('');
    setTplSaving(false);
  }

  function submitName() {
    const eyes = eyesIn === '' ? '' : Math.max(0, +eyesIn.replace(/\D/g, '') || 0);
    addName(sp.id, nameIn, eyes);
    setNameIn('');
    setEyesIn('');
  }

  function submitTime() {
    const hours = +tHours.replace(/[^\d.]/g, '') || 0;
    if (hours <= 0) return;
    addTime(sp.id, { date: '', hours, note: tNote, rate: +tRate.replace(/[^\d.]/g, '') || 0 });
    setTHours('');
    setTRate('');
    setTNote('');
  }

  function submitMat() {
    const qty = +mQty.replace(/[^\d.]/g, '') || 0;
    if (!mName.trim() || qty <= 0) return;
    addMat(sp.id, { name: mName, qty, cost: +mCost.replace(/[^\d.]/g, '') || 0 });
    setMName('');
    setMQty('');
    setMCost('');
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
          const clickable = revertOn && i <= cur;
          const pillStyle = {
            border: '1px solid ' + (on ? '#211d17' : done ? '#cde9d6' : '#ded7c8'),
            background: on ? '#211d17' : done ? '#e4f5ea' : '#fff',
            color: on ? '#f3c76b' : done ? '#12803c' : '#b3ab9a',
            borderRadius: 99,
            padding: '4px 12px',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: clickable && !on ? 'pointer' : 'default',
            whiteSpace: 'nowrap',
          } as const;
          // supporters.ayin.revert כבוי ⇒ הגלולות תצוגה-בלבד (span, בלי חזרה-אחורה)
          if (!revertOn) {
            return (
              <span key={st} style={pillStyle}>
                {(done ? '✓ ' : '') + stageLabel(cfg, st)}
              </span>
            );
          }
          return (
            <button
              key={st}
              disabled={!clickable || on}
              onClick={() => revert(sp.id, st)}
              title={on ? 'השלב הנוכחי' : done ? 'שלב שהושלם — לחיצה חוזרת אליו' : ''}
              style={pillStyle}
            >
              {(done ? '✓ ' : '') + stageLabel(cfg, st)}
            </button>
          );
        })}
      </div>

      {/* 💳 שער-תשלום (בקשת-בעלים 25.8, opt-in) — סטטוס-שולם + סימון-ידני;
          רישום-תרומה בכרטיס מסמן שולם אוטומטית. חסר-הדגל ⇒ מוסתר (ביט-זהה). */}
      {payGateOn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: 999,
              background: a.paid ? '#e4f5ea' : '#fdeaea',
              color: a.paid ? '#12803c' : '#b91c1c',
            }}
          >
            {a.paid ? '💰 שולם ✓' : '💰 טרם שולם'}
          </span>
          <Btn sm onClick={() => setPaid(sp.id, !a.paid)} title="סימון/ביטול תשלום — רישום תרומה בכרטיס מסמן שולם אוטומטית">
            {a.paid ? 'ביטול סימון' : 'סמן שולם'}
          </Btn>
          {/* 💳 קישור-תשלום לנדרים — נפתח בעמוד-הסליקה של הארגון, השם ממולא.
              מוצג רק כשטרם-שולם ויש עמוד-תרומה מוגדר (הרחבת-תשלומים דלוקה). */}
          {!a.paid && ayinPayHref && (
            <a
              href={ayinPayHref}
              target="_blank"
              rel="noopener noreferrer"
              className="chip"
              title="עמוד-התשלום בנדרים — קישור לתשלום מקוון, השם ממולא"
              aria-label="פתיחת עמוד-התשלום בנדרים"
              style={{ textDecoration: 'none' }}
            >
              💳 תשלום בנדרים
            </a>
          )}
          {!a.paid && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>נדרש תשלום כדי להשלים</span>}
        </div>
      )}

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
                    placeholder={boqOn ? 'כמות' : unit}
                    dir="ltr"
                    style={{ width: 56, padding: '3px 6px', fontSize: 12 }}
                    title={boqOn ? 'כמות' : unit}
                  />
                  {/* בקשת-בעלים 19.8: הערת-טקסט חופשית ליד המונה */}
                  <input
                    value={n.note || ''}
                    onChange={(e) => setNameNote(sp.id, n.id, e.target.value)}
                    placeholder="הערה"
                    style={{ flex: 1, minWidth: 60, padding: '3px 6px', fontSize: 12 }}
                    title="הערת-טקסט חופשית"
                  />
                  {boqOn && (
                    <>
                      <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>×</span>
                      <input
                        value={n.rate ? String(n.rate) : ''}
                        onChange={(e) => setNameRate(sp.id, n.id, +e.target.value.replace(/[^\d.]/g, '') || 0)}
                        placeholder="₪ ליח׳"
                        dir="ltr"
                        style={{ width: 66, padding: '3px 6px', fontSize: 12 }}
                        title="מחיר ליחידה"
                      />
                      <span style={{ minWidth: 66, textAlign: 'left', fontWeight: 700, fontSize: 12.5, direction: 'ltr' }}>
                        {ils(boqLineAmount(n))}
                      </span>
                    </>
                  )}
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
                {boqOn && quote > 0 && (
                  <span style={{ fontWeight: 800, color: 'var(--ink)' }}> · סה"כ הצעה: <span style={{ direction: 'ltr', display: 'inline-block' }}>{ils(quote)}</span></span>
                )}
              </div>
            </div>
          )}
          {/* תבניות-הצעה (למידה מ-BuildSmart) — שמור/החל BOQ בקליק */}
          {boqOn && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 700 }}>תבניות-הצעה:</span>
              {tpls.map((t) => (
                <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 999, padding: '2px 4px 2px 9px', fontSize: 12 }}>
                  <button onClick={() => applyTpl(sp.id, t.id)} title={'החל ' + t.lines.length + ' שורות'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--ink)' }}>📋 {t.name}</button>
                  <button onClick={() => deleteTpl(t.id)} title="מחק תבנית" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontWeight: 800 }}>✕</button>
                </span>
              ))}
              {tplSaving ? (
                <>
                  <input autoFocus value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="שם התבנית" onKeyDown={(e) => { if (e.key === 'Enter') doSaveTpl(); }} style={{ width: 120, padding: '3px 6px', fontSize: 12 }} />
                  <Btn sm onClick={doSaveTpl}>✓ שמור</Btn>
                  <Btn sm onClick={() => { setTplSaving(false); setTplName(''); }}>ביטול</Btn>
                </>
              ) : (
                <Btn sm onClick={() => setTplSaving(true)} disabled={a.names.length === 0}>💾 שמור כתבנית</Btn>
              )}
            </div>
          )}
        </div>
      )}

      {/* שעתון הפרויקט (ורטיקל מסחרי) */}
      {timeOn && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>⏱️ שעתון הפרויקט ({timeRows.length})</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <input value={tHours} onChange={(e) => setTHours(e.target.value)} placeholder="שעות" dir="ltr" style={{ width: 60, padding: '4px 6px', fontSize: 12 }} />
            <span style={{ color: 'var(--ink-faint)', alignSelf: 'center' }}>×</span>
            <input value={tRate} onChange={(e) => setTRate(e.target.value)} placeholder="₪/שעה" dir="ltr" style={{ width: 72, padding: '4px 6px', fontSize: 12 }} />
            <input
              value={tNote}
              onChange={(e) => setTNote(e.target.value)}
              placeholder="תיאור (אופציונלי)"
              style={{ flex: 1, minWidth: 110, padding: '4px 6px', fontSize: 12 }}
              onKeyDown={(e) => { if (e.key === 'Enter') submitTime(); }}
            />
            <Btn sm onClick={submitTime}>+ הוספה</Btn>
          </div>
          {timeRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {timeRows.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 6 }}>
                  <span style={{ color: 'var(--ink-faint)', direction: 'ltr' }}>{fmtDate(e.date)}</span>
                  <span style={{ fontWeight: 700 }}>{e.hours} ש׳</span>
                  {e.rate ? <span style={{ color: 'var(--ink-faint)' }}>× {ils(e.rate)}</span> : null}
                  <span style={{ flex: 1 }}>{e.note}</span>
                  <span style={{ fontWeight: 700, direction: 'ltr' }}>{ils((+e.hours || 0) * (e.rate || 0))}</span>
                  <button onClick={() => removeTime(sp.id, i)} title="הסרה" style={{ color: 'var(--ink-faint)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>🗑</button>
                </div>
              ))}
              <div style={{ fontSize: 12.5, marginTop: 4, fontWeight: 700 }}>
                סה"כ שעות: {timeHoursTotal(a)} · עלות-עבודה: <span style={{ direction: 'ltr', display: 'inline-block' }}>{ils(cost)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* חומרים ורכש (ורטיקל מסחרי) */}
      {matOn && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🧱 חומרים ורכש ({matRows.length})</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="חומר / פריט" style={{ flex: 1, minWidth: 110, padding: '4px 6px', fontSize: 12 }} onKeyDown={(e) => { if (e.key === 'Enter') submitMat(); }} />
            <input value={mQty} onChange={(e) => setMQty(e.target.value)} placeholder="כמות" dir="ltr" style={{ width: 56, padding: '4px 6px', fontSize: 12 }} />
            <span style={{ color: 'var(--ink-faint)', alignSelf: 'center' }}>×</span>
            <input value={mCost} onChange={(e) => setMCost(e.target.value)} placeholder="₪ ליח׳" dir="ltr" style={{ width: 66, padding: '4px 6px', fontSize: 12 }} />
            <Btn sm onClick={submitMat}>+ הוספה</Btn>
          </div>
          {matRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {matRows.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 6 }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                  <span style={{ color: 'var(--ink-faint)', direction: 'ltr' }}>{m.qty} × {ils(m.cost)}</span>
                  <span style={{ fontWeight: 700, direction: 'ltr' }}>{ils((+m.qty || 0) * (+m.cost || 0))}</span>
                  <button onClick={() => removeMat(sp.id, i)} title="הסרה" style={{ color: 'var(--ink-faint)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>🗑</button>
                </div>
              ))}
              <div style={{ fontSize: 12.5, marginTop: 4, fontWeight: 700 }}>
                סה"כ חומרים: <span style={{ direction: 'ltr', display: 'inline-block' }}>{ils(matCost)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* רווחיות הפרויקט — P&L מרוכז (הצעה − עבודה − חומרים = רווח; נגבה/יתרה) */}
      {pnlOn && (quote > 0 || totalCost > 0) && (
        <div style={{ border: '1px solid var(--accent, var(--line))', borderRadius: 10, padding: '10px 12px', background: 'var(--accent-soft, var(--panel))' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>💰 רווחיות הפרויקט</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', fontSize: 13 }}>
            {boqOn && quote > 0 && <span style={{ fontWeight: 800 }}>הצעה: <span style={{ direction: 'ltr', display: 'inline-block' }}>{ils(quote)}</span></span>}
            {totalCost > 0 && (
              <span>
                עלות: <b style={{ direction: 'ltr', display: 'inline-block' }}>{ils(totalCost)}</b>
                <span style={{ color: 'var(--ink-faint)', fontSize: 11.5 }}> (עבודה {ils(cost)} · חומרים {ils(matCost)})</span>
              </span>
            )}
            {boqOn && quote > 0 && (
              <span style={{ fontWeight: 800, color: quote - totalCost >= 0 ? '#12803c' : '#b91c1c' }}>
                רווח גולמי: <span style={{ direction: 'ltr', display: 'inline-block' }}>{ils(quote - totalCost)}</span>
              </span>
            )}
          </div>
          {boqOn && quote > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', fontSize: 13, marginTop: 5, borderTop: '1px solid var(--line-soft, var(--line))', paddingTop: 5 }}>
              <span>נגבה: <b style={{ direction: 'ltr', display: 'inline-block' }}>{ils(collected)}</b></span>
              <span style={{ color: quote - collected > 0 ? '#b45309' : '#12803c', fontWeight: 700 }}>
                {quote - collected > 0 ? 'יתרה לגבייה: ' : 'שולם במלואו '}
                {quote - collected > 0 && <span style={{ direction: 'ltr', display: 'inline-block' }}>{ils(quote - collected)}</span>}
              </span>
            </div>
          )}
        </div>
      )}

      {/* גאנט-תלויות (ורטיקל-הסטודיו) — משך+תלויות פר-שורה, ותצוגת-סרגלים */}
      {ganttOn && a.names.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            📅 גאנט הפרויקט{schedule.total > 0 ? ' · ' + schedule.total + ' ימים' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {a.names.map((n) => {
              const t = schedule.tasks.find((x) => x.id === n.id);
              const others = a.names.filter((o) => o.id !== n.id);
              return (
                <div key={n.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ flex: 1, minWidth: 90, fontWeight: 600, fontSize: 12.5 }}>{n.name}{t?.critical ? <span title="נתיב-קריטי" style={{ color: '#b91c1c', marginInlineStart: 5 }}>◆</span> : null}</span>
                    <label style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>ימים:
                      <input value={n.days ?? ''} onChange={(e) => setSchedule(sp.id, n.id, +e.target.value || 0, n.deps || [])}
                        dir="ltr" style={{ width: 44, marginInlineStart: 4, padding: '2px 4px', fontSize: 12 }} />
                    </label>
                    {others.length > 0 && (
                      <select value="" onChange={(e) => { if (e.target.value) setSchedule(sp.id, n.id, n.days || 0, [...(n.deps || []), e.target.value]); }}
                        title="הוסף תלות (אחרי…)" style={{ fontSize: 11.5, padding: '2px 4px', maxWidth: 130 }}>
                        <option value="">+ אחרי…</option>
                        {others.filter((o) => !(n.deps || []).includes(o.id)).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    )}
                  </div>
                  {(n.deps || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                      {(n.deps || []).map((d) => {
                        const dn = a.names.find((x) => x.id === d);
                        return dn ? (
                          <button key={d} type="button" onClick={() => setSchedule(sp.id, n.id, n.days || 0, (n.deps || []).filter((x) => x !== d))}
                            title="הסר תלות" style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--panel-2, #f7f2e8)', cursor: 'pointer' }}>
                            אחרי {dn.name} ✕
                          </button>
                        ) : null;
                      })}
                    </div>
                  )}
                  {t && schedule.total > 0 && (
                    <div style={{ position: 'relative', height: 10, marginTop: 5, background: 'var(--line-soft, #efe8d9)', borderRadius: 5 }}>
                      <div style={{ position: 'absolute', insetBlock: 0, insetInlineStart: (t.start / schedule.total) * 100 + '%', width: Math.max(3, (t.days / schedule.total) * 100) + '%', background: t.critical ? '#d1495b' : 'var(--accent, #a05008)', borderRadius: 5 }} title={'יום ' + t.start + '–' + t.end} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* install-kit — צ'ק-ליסט מסירה (ורטיקל-הסטודיו) */}
      {kitOn && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            📦 ערכת-מסירה ({kit.done}/{kit.total}){kit.ready ? <span style={{ color: '#12803c', fontSize: 12 }}>✓ מוכן למסירה</span> : null}
          </div>
          {kit.total > 0 && (
            <div style={{ height: 6, background: 'var(--line-soft, #efe8d9)', borderRadius: 4, marginBottom: 8 }}>
              <div style={{ height: '100%', width: kit.pct + '%', background: kit.ready ? '#12803c' : 'var(--accent, #a05008)', borderRadius: 4 }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {(a.kit || []).map((k, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={k.done} onChange={() => setKit(sp.id, (a.kit || []).map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />
                <span style={{ flex: 1, textDecoration: k.done ? 'line-through' : 'none', color: k.done ? 'var(--ink-faint)' : 'inherit' }}>{k.label}</span>
                <button onClick={(e) => { e.preventDefault(); setKit(sp.id, (a.kit || []).filter((_, j) => j !== i)); }} title="הסרה" style={{ color: 'var(--ink-faint)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>🗑</button>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <input value={kitIn} onChange={(e) => setKitIn(e.target.value)} placeholder="פריט-מסירה חדש…" style={{ flex: 1, minWidth: 130, padding: '4px 6px', fontSize: 12 }}
              onKeyDown={(e) => { if (e.key === 'Enter' && kitIn.trim()) { setKit(sp.id, [...(a.kit || []), { label: kitIn.trim(), done: false }]); setKitIn(''); } }} />
            <Btn sm onClick={() => { if (kitIn.trim()) { setKit(sp.id, [...(a.kit || []), { label: kitIn.trim(), done: false }]); setKitIn(''); } }}>+ הוספה</Btn>
            {(a.kit || []).length === 0 && (
              <Btn sm onClick={() => setKit(sp.id, DEFAULT_KIT_LABELS.map((label) => ({ label, done: false })))} title="טעינת ערכת-ברירת-מחדל">⚡ ערכה מומלצת</Btn>
            )}
          </div>
        </div>
      )}

      {/* תשובות / הערות */}
      {featureOn(cfg, 'supporters.ayin.answers') && (
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
            <button onClick={() => { deleteAnswer(sp.id, i); setEditIdx(null); }} title="מחיקה" style={{ color: 'var(--ink-faint)', fontWeight: 700 }}>
              🗑
            </button>
          </div>
        ))}
      </div>
      )}

      {/* מתי לדבר שוב */}
      {featureOn(cfg, 'supporters.ayin.nexttalk') && (
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
          {/* כמו בלגאסי (script:2957): "🔁 שוב" רק כשיש מועד — בלי תאריך היה נכתב אירוע-להיום */}
          <Btn
            sm
            onClick={() => callAgain(sp.id)}
            disabled={!a.nextTalk}
            title={a.nextTalk ? 'כותב תזכורת ללוח השנה' : 'בחרו קודם תאריך "מתי לדבר שוב" — אז התזכורת תיכתב ללוח'}
          >
            🔁 שוב
          </Btn>
        </div>
      </div>
      )}

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

      {/* ✓ באנר-סיום (לגאסי doneLine, markup:2730-2731) — ב'הושלם' השמות יורדים מהמסך,
          והסיכום הזה מחליף אותם: כמה נמסרו וסה"כ המונה. */}
      {a.stage === 'done' && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#12803c',
            background: '#e4f5ea',
            border: '1px solid #cde9d6',
            borderRadius: 10,
            padding: '8px 12px',
          }}
        >
          {'✓ הטיפול הושלם · ' + a.names.length + ' ' + item + ' נמסרו · ' + unit + ' ' + eyesTotal(a)}
        </div>
      )}

      {featureOn(cfg, 'supporters.ayin.restart') && (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <Btn sm onClick={() => restart(sp.id)} title="פתיחת מחזור טיפול חדש מההתחלה — ההיסטוריה נשמרה">
            ↻ מחזור חדש
          </Btn>
        </div>
      )}
    </div>
  );
}
