/**
 * לוח מעקב הטיפול — תור חוצה-תומכות בראש מסך התורמים. סינון לפי שלב, מיון,
 * וכפתור חכם לכל שורה. כל התוויות עוברות דרך מילון המונחים (feature כללי).
 * מוצג רק כשהפיצ'ר supporters.ayin דלוק (הגייטינג בקורא — SupportersView).
 */
import { useState } from 'react';
import { useRemembered } from '../../lib/filterMemory';
import { useApp } from '../../store/useApp';
import { useDbWatch } from '../../store/dbWatch';
import { featureOn, termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import { hebDateFull } from '../../lib/hebrew';
import { HebDateInput } from '../HebDateInput';
import {
  AYIN_STAGES,
  ayinActionVisible,
  ayinActive,
  ayinAdvanceLabel,
  ayinOnBoard,
  featLabel,
  stageIndex,
  stageLabel,
  unitLabel,
} from '../../lib/ayin';
import { emptyAyin, type AyinCase, type AyinStage, type Supporter } from '../../types/domain';
import { activeRecurSeries, dueRecurReminder, fmtDate, RECUR_MODES, recurDef, supHasRegion, supporterVisibleForDesignations, type RecurMode } from './lib';

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
  // 🕯 (6.10) אירועי-הלוח נצפים גם הם — מצב-הסגולה של כל שורה נגזר מהם (segulaStatus).
  const db = useDbWatch('supporters', 'events');
  const cfg = useApp((s) => s.config);
  const advance = useApp((s) => s.ayinAdvance);
  // 🎯 «קשר הבא» מהלוח (בקשת-בעלים 6.10) — אותו מנגנון של הכרטיס ושל מעקב-הטיפול (store.setSupporterNext):
  // תאריך על התומך/ת + תזכורת-שיחה בלוח-השנה. מגודר כמו הקובייה בכרטיס (supporters.nextdate).
  const setSupporterNext = useApp((s) => s.setSupporterNext);
  const setSupporterNextNote = useApp((s) => s.setSupporterNextNote);
  const toast = useApp((s) => s.toast);
  const restart = useApp((s) => s.ayinRestart);
  // 🕯 סגולת 40 יום מהלוח (בקשת-בעלים 6.10 «תכניס את הכפתור בלוח מעקב טיפול»): אותו מנגנון של הכרטיס
  // (store.seedSegulaReminders — 5 תזכורות-לוח + קשר-הבא), מגודר באותו דגל (supporters.segula, חסר=דלוק).
  // שורה שכבר רצה לה סגולה מציגה צ'יפ-מצב «🕯 יום N/40» במקום הכפתור (לא זורעים פעמיים).
  const seedSegula = useApp((s) => s.seedSegulaReminders);
  const toggleEventDone = useApp((s) => s.toggleEventDone);
  const segulaOn = featureOn(cfg, 'supporters.segula');
  // 🕯▾ תפריט-החזרה הפתוח (6.10 «יש גם שבועי ויומי»): 40 יום · יומי · שבועי · חודשי — כמו הבורר בכרטיס, בכמות ברירת-המחדל.
  const [recurMenuId, setRecurMenuId] = useState<string | null>(null);
  const nextDateOn = featureOn(cfg, 'supporters.nextdate');
  const restartOn = featureOn(cfg, 'supporters.ayin.restart');
  // התיק שסומן «✓ הושלם» מהלוח ברגע זה — נשאר על הלוח עם שאלת «קשר הבא?» עד שקובעים/מדלגים
  // (הכרעת-בעלים 3.9 «הושלם יורד מהלוח» נשמרת — זו עצירה של רגע אחד, לא שורה קבועה).
  const [nextPromptId, setNextPromptId] = useState<string | null>(null);
  // 📝 (6.10 «בקשר הבא חסר במעקב טיפול על מה לדבר, שמירה וטופל»): טיוטת «על מה לדבר» של השורה הפתוחה —
  // נטענת מ-sp.nextNote בפתיחת-השאלה, נשמרת ב-💾 (ובסגירה) דרך store.setSupporterNextNote (אותו מנגנון של הכרטיס).
  const [nextTopic, setNextTopic] = useState('');
  const openNextPrompt = (sp: Supporter) => {
    setNextTopic(sp.nextNote || '');
    setNextPromptId(sp.id);
  };
  // 🔒 ייעוד-הרשאה (13.8): לוח-הטיפול לא יחשוף שמות תורמים לעובד/ת שאינו מורשה לייעודם.
  const allowedDesignations = useApp((s) => s.cloud.allowedDesignations ?? null);
  const desigLimit = featureOn(cfg, 'supporters.purpose') ? allowedDesignations : null;

  const [filter, setFilter] = useRemembered<'all' | AyinStage>('ayin.filter', 'all');
  const [sort, setSort] = useRemembered<'target' | 'last' | 'name' | 'stage'>('ayin.sort', 'target');
  // 🌍 סינון ישראל/חו"ל (בקשת-בעלים 6.9) — לפי אזור-הטלפון של התומך/ת (אותו מסווג כמו במסך-התורמים)
  const [region, setRegion] = useRemembered<'all' | 'il' | 'intl'>('ayin.region', 'all');
  // הקיפול היחיד הוא של העוטף ב-SupportersView ("▼ הצגה / ▲ הסתרה", הכרעת-בעלים 19.8) —
  // מתג-קיפול פנימי כפול הוסר (ביקורת 3.9).
  const today = isoToday();
  // 💳 שער-תשלום (opt-in מפורש, כמו AyinCard) — חסר-הדגל ⇒ אין צ'יפ, ביט-זהה.
  const payGateOn = cfg.features?.['supporters.ayin.paygate'] === true;

  // הכרעת-בעלים 3.9: מקרה שהושלם יורד מהלוח (ayinOnBoard); סינון "הושלם" עדיין מציג אותם.
  const visible = db.supporters.filter((sp) => supporterVisibleForDesignations(sp, desigLimit) && (region === 'all' || supHasRegion(sp, region)));
  const active = visible.filter((sp) => ayinOnBoard(sp.ayin));
  // 🎯 «הגיע הזמן» (בקשת-בעלים 6.10 «שיעלה בלוח ברגע שהזמן מגיע»): תיק שהושלם ונקבע לו «קשר הבא»
  // חוזר ללוח ביום-היעד (ונשאר עד שמטפלים — קשר-בוצע / תאריך-חדש / מחזור-חדש). היום = isoToday, בלי Date.now.
  const isDueNext = (sp: Supporter): boolean =>
    nextDateOn && ayinActive(sp.ayin) && (sp.ayin!.stage || 'new') === 'done' && !!sp.nextDate && sp.nextDate <= today;
  const due = visible.filter(isDueNext);
  // 🕯 «הגיע הזמן» לתזכורת-סדרה (6.10 «האם הוא קופץ בלוח כמו הקשר הבא»): תזכורת שתאריכה ≤ היום ולא
  // סומנה ✓ מעלה את התומך/ת ללוח — גם בלי תיק-טיפול פעיל — עד שמסמנים ✓ בוצע. נגזרת-מצב, היום מוזרק.
  const dueRemOf = (sp: Supporter) => (segulaOn ? dueRecurReminder(db.events, sp.id, today) : null);
  const dueRem = visible.filter((sp) => !!dueRemOf(sp));
  let rows =
    filter === 'all' ? [...due, ...dueRem.filter((sp) => !due.includes(sp)), ...active.filter((sp) => !dueRem.includes(sp))]
    : filter === 'done' ? visible.filter((sp) => ayinActive(sp.ayin) && (sp.ayin!.stage || 'new') === 'done')
    : active.filter((sp) => (sp.ayin!.stage || 'new') === filter);
  if (nextPromptId && !rows.some((sp) => sp.id === nextPromptId)) {
    const held = visible.find((sp) => sp.id === nextPromptId && ayinActive(sp.ayin));
    if (held) rows = [held, ...rows];
  }
  rows = [...rows].sort((sa, sb) => {
    const aa = sa.ayin ?? emptyAyin();
    const ab = sb.ayin ?? emptyAyin();
    if (sort === 'name') return sa.name.localeCompare(sb.name, 'he');
    if (sort === 'last') return (ab.lastTouch || '').localeCompare(aa.lastTouch || '');
    if (sort === 'stage') return stageIndex(aa.stage) - stageIndex(ab.stage);
    const tgt = (sp: Supporter) => dueRemOf(sp)?.date || ((sp.ayin?.stage || 'new') === 'done' ? sp.nextDate : sp.ayin?.nextTalk) || '9999';
    return tgt(sa).localeCompare(tgt(sb));
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
          🗂 לוח {feat} · {filter === 'all' || filter === 'done' ? rows.length : rows.length + ' מתוך ' + active.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <select value={region} onChange={(e) => setRegion(e.target.value as 'all' | 'il' | 'intl')} title="סינון לפי אזור-טלפון: ישראל / חו״ל" aria-label="אזור" style={selStyle}>
            <option value="all">🌍 ישראל + חו״ל</option>
            <option value="il">🇮🇱 ישראל</option>
            <option value="intl">✈️ חו״ל</option>
          </select>
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
              // תומך/ת שעלה ללוח רק בגלל תזכורת-סדרה (6.10) ייתכן בלי תיק-טיפול — מציגים «אין תיק» בלי כפתור-חכם.
              const hasCase = !!sp.ayin;
              const a = sp.ayin ?? emptyAyin();
              const dueR = dueRemOf(sp);
              const series = segulaOn ? activeRecurSeries(db.events, sp.id, today) : [];
              const showBtn = hasCase && ayinActionVisible(a);
              // 🎯 יעד שעבר (ביקורת-ריצה 3.9, F4): מסומן באדום + ⚠ + title — לא זהה לעתידי.
              const overdue = !!a.nextTalk && a.nextTalk < today;
              const isDone = (a.stage || 'new') === 'done';
              const dueNext = isDueNext(sp);
              const promptOpen = nextDateOn && isDone && nextPromptId === sp.id;
              return (
                <div key={sp.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div
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
                    background: dueNext || dueR ? '#fff4ea' : '#fff',
                    border: '1px solid ' + (dueNext || dueR ? '#f3c58a' : 'rgba(33,29,23,.07)'),
                    borderRadius: 11,
                    padding: '9px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 12.5, minWidth: 0 }}>{sp.name}</div>
                  {hasCase ? <StageChips cfg={cfg} stage={a.stage} /> : <span style={{ fontSize: 10.5, color: '#b3ab9a', fontWeight: 700 }}>אין תיק טיפול</span>}
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
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{hasCase ? namesLineOf(a) : '—'}</span>
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
                  {dueR ? (
                    <div
                      style={{ fontSize: 11, color: '#b3261e', fontWeight: 800 }}
                      title={recurDef(dueR.mode).label + ' — תזכורת ' + dueR.day + '/' + dueR.target + (dueR.overdueDays ? ' · באיחור ' + dueR.overdueDays + ' ימים' : ' · היום')}
                    >
                      {recurDef(dueR.mode).emoji + ' הגיע הזמן · ' + fmtDate(dueR.date)}
                    </div>
                  ) : isDone && sp.nextDate ? (
                    <div
                      style={{ fontSize: 11, color: dueNext ? '#b3261e' : '#12803c', fontWeight: 800 }}
                      title={dueNext ? 'קשר הבא — הגיע הזמן' : 'קשר הבא שנקבע אחרי שהטיפול הושלם'}
                    >
                      {(dueNext ? '📞 ' : '🎯 ') + fmtDate(sp.nextDate)}
                    </div>
                  ) : (
                  <div
                    style={{ fontSize: 11, color: overdue ? '#b3261e' : '#9a6414', fontWeight: 800 }}
                    title={overdue ? 'באיחור' : undefined}
                  >
                    {a.nextTalk
                      ? (overdue ? '⚠ ' : '') + fmtDate(a.nextTalk) + (a.nextTalkTime ? ' · ' + a.nextTalkTime : '')
                      : '—'}
                  </div>
                  )}
                  <div style={{ fontSize: 11, color: '#8b8474', fontWeight: 700 }}>
                    {a.lastTouch ? fmtDate(a.lastTouch) : '—'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch' }}>
                    {/* 🎯 תיק שהושלם: כפתור «קשר הבא» במקום הכפתור-החכם (שאינו מוצג ב-done) */}
                    {nextDateOn && isDone && !showBtn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (promptOpen) setNextPromptId(null); else openNextPrompt(sp);
                        }}
                        title={dueNext ? 'הגיע הזמן לקשר הבא — ' + hebDateFull(sp.nextDate!) : sp.nextDate ? 'קשר הבא: ' + hebDateFull(sp.nextDate) + ' — לחיצה לשינוי' : 'קביעת קשר הבא אחרי שהטיפול הושלם — נכנס ללוח השנה'}
                        style={{
                          background: dueNext ? '#211d17' : sp.nextDate ? '#e4f5ea' : '#fff',
                          color: dueNext ? '#f3c76b' : sp.nextDate ? '#12803c' : '#9a6414',
                          border: '1px solid ' + (dueNext ? '#211d17' : sp.nextDate ? '#cde9d6' : '#ecd9a8'),
                          borderRadius: 9,
                          padding: '6px 10px',
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dueNext ? '📞 הגיע הזמן' : sp.nextDate ? '🎯 ' + fmtDate(sp.nextDate) : '🎯 קשר הבא'}
                      </button>
                    )}
                    {showBtn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // «✓ הושלם» מהלוח ⇒ השורה נשארת רגע עם שאלת «קשר הבא?» (במקום להיעלם)
                          const finishing = a.stage === 'answer' && !!a.answerPushed;
                          advance(sp.id);
                          if (finishing && nextDateOn) openNextPrompt(sp);
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
                    {/* 🕯 סדרות-תזכורת (6.10): פעילה ⇒ צ'יפ-מצב לכל סדרה (לחיצה על השורה פותחת כרטיס); הגיע-הזמן ⇒ «✓ בוצע»;
                        אין סדרה ⇒ «🕯 40 יום ▾» עם תפריט 40 יום · יומי · שבועי · חודשי (כמו הבורר בכרטיס, כמות ברירת-מחדל). */}
                    {segulaOn && dueR && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEventDone(dueR.id);
                          toast('✓ ' + recurDef(dueR.mode).label + ' — תזכורת ' + dueR.day + '/' + dueR.target + ' סומנה כבוצעה');
                        }}
                        title={'סימון התזכורת שהגיע יומה כבוצעה — ' + recurDef(dueR.mode).label + ' ' + dueR.day + '/' + dueR.target}
                        style={{ background: '#211d17', color: '#f3c76b', border: 'none', borderRadius: 9, padding: '6px 10px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {'✓ בוצע · ' + recurDef(dueR.mode).emoji + ' ' + dueR.day + '/' + dueR.target}
                      </button>
                    )}
                    {segulaOn && series.filter((x) => !dueR || x.mode !== dueR.mode).map(({ mode, st }) => (
                      <span
                        key={mode}
                        title={recurDef(mode).label + ' פעילה · ' + (mode === 'segula' ? 'יום ' : 'תזכורת ') + st.day + ' מתוך ' + st.target + (st.next ? ' · הבאה: ' + fmtDate(st.next) : '') + ' · סיום: ' + fmtDate(st.end) + ' — לחיצה פותחת את הכרטיס'}
                        style={{ background: '#e4f5ea', color: '#12803c', border: '1px solid #cde9d6', borderRadius: 9, padding: '4px 10px', fontSize: 10.5, fontWeight: 800, whiteSpace: 'nowrap', textAlign: 'center' }}
                      >
                        {recurDef(mode).emoji + (mode === 'segula' ? ' יום ' : ' ') + st.day + '/' + st.target}
                      </span>
                    ))}
                    {segulaOn && series.length === 0 && !dueR && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecurMenuId(recurMenuId === sp.id ? null : sp.id);
                        }}
                        title="התחלת סדרת-תזכורות מהיום: 40 יום (סגולה לזיווג) · יומי · שבועי · חודשי — נכנס לקשר-הבא וללוח השנה"
                        aria-expanded={recurMenuId === sp.id}
                        style={{ background: '#fff', color: '#9a6414', border: '1px solid #ecd9a8', borderRadius: 9, padding: '5px 10px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        🕯 40 יום ▾
                      </button>
                    )}
                    {segulaOn && series.length === 0 && !dueR && recurMenuId === sp.id && (
                      <div className="ayin-recur-menu" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {RECUR_MODES.map((m) => (
                          <button
                            key={m.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              seedSegula(sp.id, today, 'זיווג', m.key as RecurMode);
                              setRecurMenuId(null);
                            }}
                            title={m.label + (m.key === 'segula' ? ' — ימים 1·7·21·35·40' : ' — ' + m.defaultCount + ' תזכורות מהיום')}
                            style={{ background: '#faf7f0', color: '#4d463c', border: '1px solid #ecd9a8', borderRadius: 99, padding: '3px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {m.emoji + ' ' + m.chip + (m.key === 'segula' ? '' : ' ×' + m.defaultCount)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {promptOpen && (
                  <div
                    className="ayin-next-prompt"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      margin: '0 10px',
                      background: '#fff',
                      border: '1px dashed #ecd9a8',
                      borderTop: 'none',
                      borderRadius: '0 0 11px 11px',
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: dueNext ? '#b3261e' : '#9a6414' }}>
                        {dueNext ? '📞 הגיע הזמן לקשר הבא — ' + sp.name : '🎯 קשר הבא — ' + sp.name + ' · הטיפול הושלם'}
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {/* ✓ טופל (6.10) — תמיד זמין (לא רק כשהגיע הזמן): הקשר בוצע ⇒ התאריך+התזכורת+ההערה יורדים, התיק יורד מהלוח */}
                      <button
                        onClick={() => {
                          setSupporterNext(sp.id, '', '');
                          setSupporterNextNote(sp.id, '');
                          setNextPromptId(null);
                          toast('✓ טופל — הקשר בוצע, התיק ירד מהלוח');
                        }}
                        title="הקשר בוצע/טופל — התזכורת יורדת מלוח-השנה, ההערה נמחקת והתיק יורד מהלוח (ההיסטוריה נשמרת)"
                        style={{ background: '#e4f5ea', color: '#12803c', border: '1px solid #cde9d6', borderRadius: 9, padding: '3px 9px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                      >
                        {dueNext ? '✓ טופל · הקשר בוצע' : '✓ טופל'}
                      </button>
                      {dueNext && restartOn && (
                        <button
                          onClick={() => {
                            setSupporterNext(sp.id, '', '');
                            restart(sp.id);
                            setNextPromptId(null);
                            toast('נפתח מחזור טיפול חדש — התיק חזר ללוח בשלב הראשון');
                          }}
                          title="פתיחת מחזור טיפול חדש מההתחלה — ההיסטוריה נשמרת"
                          style={{ background: '#211d17', color: '#f3c76b', border: 'none', borderRadius: 9, padding: '3px 9px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                        >
                          ↻ מחזור טיפול חדש
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSupporterNextNote(sp.id, nextTopic);
                          setNextPromptId(null);
                        }}
                        title="בלי קשר הבא כרגע — אפשר לקבוע אחר-כך מסינון «הושלם» או מהכרטיס"
                        style={{ background: 'transparent', border: '1px solid #ecd9a8', borderRadius: 9, padding: '3px 9px', fontSize: 10.5, fontWeight: 800, color: '#8b8474', cursor: 'pointer' }}
                      >
                        {sp.nextDate ? 'סגירה' : 'דלג'}
                      </button>
                      </div>
                    </div>
                    <HebDateInput
                      value={sp.nextDate || ''}
                      onChange={(iso) => {
                        // 6.10: הנושא מהטיוטה (על מה לדבר) נכנס ל-notes של תזכורת-הלוח; ריק ⇒ ברירת-המחדל «אחרי סיום …»
                        setSupporterNext(sp.id, iso, nextTopic.trim() || 'אחרי סיום ' + feat);
                        if (iso && nextTopic.trim()) setSupporterNextNote(sp.id, nextTopic);
                        toast(iso ? 'נקבע קשר הבא ' + hebDateFull(iso) + ' — נכנס ללוח השנה' : 'תאריך הקשר הבא נוקה');
                      }}
                    />
                    {/* 📝 על מה לדבר בפעם הבאה + 💾 שמירה (6.10) — כמו בכרטיס, אותו שדה (sp.nextNote) */}
                    <textarea
                      value={nextTopic}
                      onChange={(e) => setNextTopic(e.currentTarget.value)}
                      onBlur={() => setSupporterNextNote(sp.id, nextTopic)}
                      rows={2}
                      placeholder="על מה לדבר בפעם הבאה — למשל: לעדכן על הקבלה · לבקש חידוש הו״ק · לברר כתובת"
                      aria-label="על מה לדבר בפעם הבאה"
                      style={{ width: '100%', resize: 'vertical', minHeight: 44, fontSize: 12, border: '1px solid #ecd9a8', borderRadius: 9, padding: '6px 8px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => {
                          setSupporterNextNote(sp.id, nextTopic);
                          toast('📝 «על מה לדבר» נשמר ✓');
                        }}
                        title="שמירת «על מה לדבר» על התומך/ת ובתזכורת-הלוח"
                        style={{ background: '#211d17', color: '#f3c76b', border: 'none', borderRadius: 9, padding: '4px 10px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                      >
                        💾 שמירה
                      </button>
                      {sp.nextNote ? <span style={{ fontSize: 11, color: '#4d463c' }}>📝 {sp.nextNote}</span> : null}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#8b8474' }}>
                      {dueNext
                        ? 'התאריך הגיע · אפשר לסמן שהקשר בוצע, לקבוע תאריך חדש, או לפתוח מחזור טיפול חדש'
                        : sp.nextDate ? hebDateFull(sp.nextDate) + ' · תזכורת 📞 בלוח השנה ובכרטיס' : 'קביעת תאריך תוסיף תזכורת שיחה ללוח השנה — כמו «קשר הבא» בכרטיס'}
                    </div>
                  </div>
                )}
                </div>
              );
            })}
          </div>
      )}
    </div>
  );
}
