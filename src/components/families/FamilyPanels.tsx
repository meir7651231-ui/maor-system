/**
 * פאנלים של כרטיס המשפחה: מסמכים (רשומות שם בלבד), מדד אמינות (+/- ולוג),
 * שיבוצים לחוגים (כולל ＋ שיבוץ לחוג), אירועים מקושרים והיסטוריה נגזרת
 * (כולל ⬇ דוח משפחה מלא כקובץ טקסט).
 */
import { useRef, useState, type ReactNode } from 'react';
import type { Db, Enrollment, Family, FamilyDoc } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { useApp } from '../../store/useApp';
import { featureOn, moduleOn, termOf } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty, TextInput } from '../ui';
import { downloadText } from '../reports/csv';
import { paidOf, payBal, planWord, punchConfirmStep, PUNCH_CONFIRM_MS, type PunchArm } from '../courses/lib';
import { AbsenceModal } from '../courses/AbsenceModal';
import { ManageModal } from '../courses/ManageModal';
import { EventModal } from '../calendar/EventModal';
import { nextOccurIso } from '../calendar/calLib';
import { ageOf, chipStyle, CRED_HELP_TEXT, EVENT_META, famHistoryOf, fmtDate, isoToday, STATUS_META, tierOf } from './lib';
import { useArmed } from '../useArmed';
import { JoinModal } from './JoinModal';

function SectionCard(props: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>{props.title}</h2>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
}

/** מסמכים — רשומות שם בלבד (ללא קבצים, כמו במקור). הסרה בדפוס לחיצה-כפולה. */
export function DocsPanel(props: { fam: Family }) {
  const upsertFamily = useApp((s) => s.upsertFamily);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const [name, setName] = useState('');
  const [armedId, setArmedId] = useState<string | null>(null);

  function addDoc() {
    const n = name.trim();
    if (!n) return;
    const doc: FamilyDoc = { id: nextId('d'), name: n, addedAt: isoToday() };
    upsertFamily({ ...props.fam, docs: [...props.fam.docs, doc] });
    setName('');
    toast('המסמך "' + n + '" נרשם בתיק');
  }

  function removeDoc(id: string) {
    if (armedId !== id) {
      setArmedId(id);
      return;
    }
    upsertFamily({ ...props.fam, docs: props.fam.docs.filter((d) => d.id !== id) });
    setArmedId(null);
    toast('המסמך הוסר מהתיק');
  }

  return (
    <SectionCard title="מסמכים בתיק">
      {props.fam.docs.length === 0 && <Empty>אין מסמכים בתיק — הוסיפו ספח, הזמנה או המלצה</Empty>}
      {props.fam.docs.map((d) => (
        <div
          key={d.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 11px',
            border: '1px solid var(--line)',
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          <span aria-hidden>🖇</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{d.name}</span>
          <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>נוסף {fmtDate(d.addedAt)}</span>
          <Btn sm kind={armedId === d.id ? 'danger' : 'plain'} onClick={() => removeDoc(d.id)}>
            {armedId === d.id ? 'לאשר הסרה?' : '✕'}
          </Btn>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextInput value={name} onChange={setName} placeholder={'שם המסמך — למשל: ספח ת"ז — אב.pdf'} />
        </div>
        <Btn onClick={addDoc} disabled={!name.trim()}>
          + הוספה
        </Btn>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
        רישום שמות מסמכים בלבד — העלאת קבצים תחובר בגרסה המחוברת
      </div>
    </SectionCard>
  );
}

/** מדד אמינות — ציון 0–1000, דרגה, לוג שינויים והתאמות ידניות. */
export function CredPanel(props: { fam: Family }) {
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const [overrideVal, setOverrideVal] = useState('');
  // "איך משפרים?" (P3 פריט 8) — קופסת כללי הניקוד מהלגאסי
  const [helpOpen, setHelpOpen] = useState(false);

  const cred = props.fam.cred;
  const tier = tierOf(cred.score);

  function applyOverride() {
    const raw = overrideVal.trim();
    const v = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isInteger(v) || v < 0 || v > 1000) {
      toast('ציון Override חייב להיות 0–1000');
      return;
    }
    addCred(props.fam.id, v - cred.score, 'Override ידני של מנהל → ' + v);
    setOverrideVal('');
    toast('הציון עודכן ידנית');
  }

  return (
    <SectionCard title={termOf(config, 'entity.cred', 'מדד אמינות')} actions={<span style={chipStyle(tier.bg, tier.c)}>{tier.label}</span>}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{cred.score}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>/ 1000</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'rgba(33,29,23,.08)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: 99,
            background: tier.dot,
            width: Math.min(100, Math.round(cred.score / 10)) + '%',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Btn sm onClick={() => addCred(props.fam.id, 15, 'פעולה קהילתית (תרומה/עזרה)')}>
          + פעולה קהילתית (15)
        </Btn>
        <Btn sm onClick={() => addCred(props.fam.id, 5, 'התאמה ידנית של מנהל')}>
          +5
        </Btn>
        <Btn sm onClick={() => addCred(props.fam.id, -5, 'התאמה ידנית של מנהל')}>
          −5
        </Btn>
        <Btn sm onClick={() => setHelpOpen((v) => !v)}>
          איך משפרים?
        </Btn>
      </div>
      {helpOpen && (
        <div
          style={{
            background: 'var(--paper-soft, #faf6ec)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '8px 11px',
            fontSize: 11.5,
            lineHeight: 1.7,
            color: 'var(--ink-soft)',
          }}
        >
          {CRED_HELP_TEXT}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextInput value={overrideVal} onChange={setOverrideVal} placeholder="Override 0–1000" dir="ltr" />
        </div>
        <Btn sm onClick={applyOverride}>
          עדכון ידני
        </Btn>
      </div>
      {cred.log.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין עדיין רישומי ניקוד ל{termOf(config, 'entity.family', 'משפחה')} זו</div>
      ) : (
        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
          {cred.log.slice(0, 8).map((l, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'baseline',
                padding: '5px 0',
                borderBottom: '1px solid var(--line)',
                fontSize: 12.5,
              }}
            >
              <span style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{fmtDate(l.date)}</span>
              <span
                style={{
                  fontWeight: 800,
                  color: l.delta > 0 ? '#12803c' : l.delta < 0 ? '#b91c1c' : '#8b8474',
                  direction: 'ltr',
                }}
              >
                {(l.delta > 0 ? '+' : '') + l.delta}
              </span>
              <span style={{ flex: 1 }}>{l.reason}</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/** שיבוצים לחוגים של בני המשפחה — כולל ＋ שיבוץ לחוג ופעולות תפעול ישירות מהכרטיס. */
export function EnrollPanel(props: { fam: Family }) {
  const courses = useApp((s) => s.db.courses);
  const enrollments = useApp((s) => s.db.enrollments);
  const punch = useApp((s) => s.punch);
  const addCred = useApp((s) => s.addCred);
  const deleteEnrollment = useApp((s) => s.deleteEnrollment);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const joinOn = featureOn(config, 'families.join');
  // מחיקה בשני קליקים (P3 פריט 19, shell.armdel)
  const { confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  // פעולות תפעול מהכרטיס (P0.3, עוגן לגאסי: כרטיס המשפחה מנקב/מחסר/מנהל ישירות)
  const cardOpsOn = featureOn(config, 'families.cardops');
  const punchOn = featureOn(config, 'courses.punch');
  // אישור כפול לניקוב (P1.3, legacy:330-342) — חל גם על הניקוב מהכרטיס
  const punchConfirmOn = featureOn(config, 'courses.punch.confirm');
  const [joinOpen, setJoinOpen] = useState(false);
  const [opModal, setOpModal] = useState<{ kind: 'absence' | 'manage'; enrollmentId: string } | null>(null);
  const [punchArm, setPunchArm] = useState<PunchArm | null>(null);
  const punchArmTimer = useRef(0);
  const memberIds = new Set(props.fam.members.map((m) => m.id));
  const list = enrollments.filter((e) => memberIds.has(e.memberId));

  // מודול החוגים כבוי ⇒ אין פאנל שיבוצים בכרטיס המשפחה (החוזה: כבוי = מוסתר בכל המשטחים)
  if (!moduleOn(config, 'courses')) return null;

  const STATUS: Record<string, string> = { active: 'פעיל', paused: 'מוקפא ⏸', ended: 'הסתיים' };

  /** ניקוב מהכרטיס — אותן חסימות ואותו store.punch כמו doPunch במסך החוגים. */
  function doPunch(e: Enrollment) {
    if (e.status === 'paused') return toast('ה' + termOf(config, 'entity.enrollment', 'שיבוץ') + ' מוקפא — הפשירו אותו בניהול ה' + termOf(config, 'entity.enrollment', 'שיבוץ') + ' (⚙)');
    if (e.status === 'ended') return toast('ה' + termOf(config, 'entity.enrollment', 'שיבוץ') + ' הסתיים — ניתן לחדש בניהול ה' + termOf(config, 'entity.enrollment', 'שיבוץ') + ' (⚙)');
    if (e.used >= e.purchased) {
      setOpModal({ kind: 'manage', enrollmentId: e.id });
      return;
    }
    // אישור כפול (legacy:335-338): לחיצה ראשונה מזיינת, שנייה בתוך 3ש׳ מבצעת
    const step = punchConfirmStep(punchConfirmOn, punchArm, e.id, Date.now());
    if (!step.fire) {
      setPunchArm(step.next);
      window.clearTimeout(punchArmTimer.current);
      punchArmTimer.current = window.setTimeout(() => setPunchArm(null), PUNCH_CONFIRM_MS);
      return;
    }
    setPunchArm(null);
    punch(e.id);
    addCred(props.fam.id, 5, 'נוכחות (Check-in)');
    toast('הניקוב נרשם בהצלחה');
  }

  /** הסרת שיבוץ מהכרטיס — שני קליקים (P3 פריט 19); ה-store מוחק גם את תזכורת התשלום. */
  function removeEnroll(e: Enrollment, memberFirst: string, courseName: string) {
    const msg =
      'להסיר את ה' + termOf(config, 'entity.enrollment', 'שיבוץ') + ' של ' + (memberFirst || '—') +
      ' ל"' + courseName + '"? הפעולה תמחק גם את התשלומים והנוכחות שלו.\n\nלא ניתן לבטל.';
    if (!confirmTwice('enr-' + e.id, msg)) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תסיר לצמיתות');
      return;
    }
    deleteEnrollment(e.id);
    toast('ה' + termOf(config, 'entity.enrollment', 'שיבוץ') + ' הוסר לצמיתות');
  }

  return (
    <SectionCard
      title={termOf(config, 'nav.courses', 'חוגים') + ' פעילים וניקובים'}
      actions={
        joinOn ? (
          <Btn onClick={() => setJoinOpen(true)}>
            ➕ {termOf(config, 'entity.enrollment', 'שיבוץ')} ל{termOf(config, 'entity.course', 'חוג')}
          </Btn>
        ) : undefined
      }
    >
      {list.length === 0 ? (
        <Empty>
          {joinOn
            ? 'אין ' +
              termOf(config, 'entity.enrollments', 'שיבוצים') +
              ' פעילים — לחצו על "➕ ' +
              termOf(config, 'entity.enrollment', 'שיבוץ') +
              ' ל' +
              termOf(config, 'entity.course', 'חוג') +
              '"'
            : 'אין ' + termOf(config, 'entity.enrollments', 'שיבוצים') + ' פעילים'}
        </Empty>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{termOf(config, 'entity.student', 'תלמיד/ה')}</th>
                <th>קורס</th>
                <th>מסלול</th>
                <th>יתרה</th>
                <th>סטטוס</th>
                {cardOpsOn && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const m = props.fam.members.find((x) => x.id === e.memberId);
                const c = courses.find((x) => x.id === e.courseId);
                const rem = e.purchased - e.used;
                const barColor = rem <= 0 ? '#dc2626' : rem <= 2 ? '#d97706' : '#16a34a';
                const noBalance = e.plan === 'punch' && rem <= 0;
                return (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{m?.first ?? '—'}</td>
                    <td>{c?.name ?? '—'}</td>
                    <td>
                      {(e.plan === 'punch' ? 'כרטיסייה · ' + e.purchased + ' ניקובים' : planWord(e.plan)) +
                        (e.group ? ' · ' + e.group : '')}
                    </td>
                    <td>
                      {e.plan === 'punch' ? (
                        <span style={{ fontWeight: 700, color: barColor }}>
                          {rem} מתוך {e.purchased}
                        </span>
                      ) : (
                        <span>{e.used} נוכחויות</span>
                      )}
                    </td>
                    <td>{STATUS[e.status] ?? e.status}</td>
                    {cardOpsOn && (
                      <td>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {punchOn && e.plan === 'punch' && (
                            <Btn sm kind={noBalance ? 'plain' : 'primary'} onClick={() => doPunch(e)}>
                              {noBalance ? 'חידוש ←' : punchArm?.id === e.id ? 'לאשר ניקוב?' : 'ניקוב'}
                            </Btn>
                          )}
                          {c && (
                            <Btn
                              sm
                              title="רישום חיסור (נימוק חובה)"
                              onClick={() => setOpModal({ kind: 'absence', enrollmentId: e.id })}
                            >
                              🤒
                            </Btn>
                          )}
                          {c && (
                            <Btn
                              sm
                              title={'ניהול ' + termOf(config, 'entity.enrollment', 'שיבוץ') + ': קניית כרטיסייה, מסלול, הקפאה, הסרה'}
                              onClick={() => setOpModal({ kind: 'manage', enrollmentId: e.id })}
                            >
                              ⚙
                            </Btn>
                          )}
                          <Btn sm kind="danger" title={'הסרת ה' + termOf(config, 'entity.enrollment', 'שיבוץ')} onClick={() => removeEnroll(e, m?.first ?? '', c?.name ?? '—')}>
                            🗑
                          </Btn>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {joinOn && joinOpen && <JoinModal family={props.fam} onClose={() => setJoinOpen(false)} />}
      {cardOpsOn &&
        opModal &&
        (() => {
          // חיווט למודאלים הקיימים של מסך החוגים — לא שכפול לוגיקה
          const en = enrollments.find((x) => x.id === opModal.enrollmentId);
          const c = en && courses.find((x) => x.id === en.courseId);
          if (!en || !c) return null;
          return opModal.kind === 'absence' ? (
            <AbsenceModal enrollmentId={en.id} course={c} onClose={() => setOpModal(null)} />
          ) : (
            <ManageModal enrollmentId={en.id} course={c} onClose={() => setOpModal(null)} />
          );
        })()}
    </SectionCard>
  );
}

/** אירועים מיוחדים המקושרים למשפחה (אזכרה/שמחה/תזכורת) — כולל ➕ אירוע מהכרטיס. */
export function EventsPanel(props: { fam: Family }) {
  const events = useApp((s) => s.db.events);
  const config = useApp((s) => s.config);
  const historyOn = featureOn(config, 'families.history');
  const cardOpsOn = featureOn(config, 'families.cardops');
  const [evOpen, setEvOpen] = useState(false);
  const list = events.filter((e) => e.famId === props.fam.id && !e.done);

  // פאנל ההיסטוריה מרונדר כאן כדי להופיע בכרטיס המשפחה בלי לגעת ב-FamilyDetail
  return (
    <>
      <SectionCard
        title="אירועים מיוחדים"
        actions={
          cardOpsOn ? (
            <Btn sm onClick={() => setEvOpen(true)} title={'אירוע חדש המקושר ל' + termOf(config, 'entity.familyOf', 'משפחת') + ' ' + props.fam.name}>
              ➕ הוספת אירוע
            </Btn>
          ) : undefined
        }
      >
        {list.length === 0 ? (
          <Empty>אין אירועים מקושרים ל{termOf(config, 'entity.family', 'משפחה')} — ניתן להוסיף מתוך לוח השנה</Empty>
        ) : (
          list.map((ev) => {
            const meta = EVENT_META[ev.type] ?? EVENT_META.org;
            // 'הקרוב:' לאירועים חוזרים-בעברי (P3 אימות פריט 17; לגאסי nextOccurLabel)
            const nextOcc = nextOccurIso(ev, isoToday());
            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  border: '1px solid var(--line)',
                  borderRadius: 11,
                  padding: '9px 11px',
                }}
              >
                <span style={chipStyle(meta.bg, meta.c)}>{ev.type === 'custom' && ev.customType ? ev.customType : meta.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{ev.title}</div>
                  <div style={{ fontSize: 11.5, color: '#9a6414', fontWeight: 600 }}>
                    {fmtDate(ev.date)}
                    {ev.time ? ' · ' + ev.time : ''}
                    {ev.date ? ' · ' + hebDateFull(ev.date) : ''}
                    {nextOcc && nextOcc !== ev.date ? ' · הקרוב: ' + fmtDate(nextOcc) : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </SectionCard>
      {cardOpsOn && evOpen && (
        <EventModal
          ev={null}
          date={isoToday()}
          prefill={{ famId: props.fam.id }}
          saveToast={'האירוע נוסף ללוח ולכרטיס ' + termOf(config, 'entity.familyOf', 'משפחת') + ' ' + props.fam.name}
          onClose={() => setEvOpen(false)}
        />
      )}
      {historyOn && <HistoryPanel fam={props.fam} />}
    </>
  );
}

/** תאריך ISO ‏→ DD/MM לתצוגת ההיסטוריה. */
function fmtDM(iso: string): string {
  return iso.length >= 10 ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : iso;
}

/** שורות דוח המשפחה המלא (port של expReport מהמקור) — טקסט להורדה. */
function familyReportLines(db: Db, f: Family, config: OrgConfig): string[] {
  const ids = new Set(f.members.map((m) => m.id));
  // ברירת המחדל 700 זהה לכל שאר המשטחים (emptyFamily · כרטיס · finder · בית) — בלי פער
  const tier = tierOf(f.cred?.score ?? 700);
  const L: string[] = [
    'דוח ' + termOf(config, 'entity.family', 'משפחה') + ' מלא — ' + termOf(config, 'entity.familyOf', 'משפחת') + ' ' + f.name,
    'הופק: ' + hebDateFull(isoToday()) + ' · ' + new Date().toLocaleString('he-IL'),
    '='.repeat(46),
    '',
    '— פרטי ה' + termOf(config, 'entity.family', 'משפחה') + ' —',
    'אב: ' + (f.father || '—') + (f.fatherId ? ' · ת"ז ' + f.fatherId : ''),
    'אם: ' + (f.mother || '—') + (f.motherId ? ' · ת"ז ' + f.motherId : ''),
    'טלפון: ' + (f.phone || '—') + (f.phone2 ? ' · ' + f.phone2 : '') + (f.email ? ' · ' + f.email : ''),
    'כתובת: ' + ([f.address, f.city].filter(Boolean).join(', ') || '—'),
    'קהילה: ' + (f.community || '—') + ' · שפה: ' + (f.language || '—') + ' · מצב משפחתי: ' + (f.maritalStatus || '—'),
    'סטטוס: ' + STATUS_META[f.status].label +
      (f.createdAt ? ' · הצטרפה: ' + hebDateFull(f.createdAt) + ' (' + fmtDate(f.createdAt) + ')' : ''),
    'קופת צדקה: ' + (f.tzedaka || '—') + ' · הנחה: ' + (f.discount || '—') + ' · ספח מלא: ' + (f.fullSefach ? 'קיים' : 'חסר'),
    termOf(config, 'entity.cred', 'מדד אמינות') + ': ' + (f.cred?.score ?? '—') + ' (' + tier.label + ')',
  ];
  if (f.notes) L.push('הערות: ' + f.notes);
  L.push('', '— ' + termOf(config, 'entity.members', 'בני משפחה') + ' —');
  for (const m of f.members) {
    const age = ageOf(m.birth);
    L.push(
      '• ' + m.first + (m.isParent ? ' (הורה)' : '') + ' · ' + (m.gender === 'f' ? 'נקבה' : 'זכר') +
        (m.birth ? ' · ' + hebDateFull(m.birth) + ' (' + fmtDate(m.birth) + ')' + (age != null ? ' · גיל ' + age : '') : '') +
        (m.school ? ' · ' + m.school + (m.grade ? ' ' + m.grade : '') : '') +
        (m.phone ? ' · ' + m.phone : '') +
        (m.health ? ' · רגישויות: ' + m.health : ''),
    );
  }
  if (!f.members.length) L.push('(אין ' + termOf(config, 'entity.members', 'בני משפחה') + ')');
  L.push('', '— ' + termOf(config, 'entity.enrollments', 'שיבוצים') + ' ל' + termOf(config, 'nav.courses', 'חוגים') + ' —');
  let anyE = false;
  for (const e of db.enrollments) {
    if (!ids.has(e.memberId)) continue;
    anyE = true;
    const first = f.members.find((x) => x.id === e.memberId)?.first ?? '';
    const cname = db.courses.find((x) => x.id === e.courseId)?.name ?? '';
    const paid = paidOf(e);
    L.push(
      '• ' + first + ' — ' + cname + (e.group ? ' · ' + e.group : '') + ' · ' +
        (e.plan === 'punch' ? 'כרטיסייה ' + (e.purchased - e.used) + '/' + e.purchased : planWord(e.plan)) +
        (e.enrolledAt ? ' · נרשם ' + hebDateFull(e.enrolledAt) : '') +
        (e.status === 'paused' ? ' · מוקפא' : e.status === 'ended' ? ' · הסתיים' : ''),
    );
    if (e.totalDue || paid) {
      L.push(
        '   תשלומים: סה"כ עסקה ₪' + (e.totalDue || 0) + ' · שולם ₪' + paid + ' · יתרה ₪' + payBal(e) +
          (e.dueDate ? ' · תשלום הבא: ' + hebDateFull(e.dueDate) : ''),
      );
    }
    for (const p of e.payments) L.push('   🧾 ' + p.rid + ' · ' + hebDateFull(p.date) + ' · ₪' + p.amount + ' · ' + p.method);
    for (const a of e.absences) {
      L.push('   ✕ ' + (a.noshow ? 'No-Show' : 'חיסור') + ' · ' + hebDateFull(a.date) + (a.reason ? ' · ' + a.reason : ''));
    }
    if (e.note) L.push('   📝 ' + e.note);
  }
  if (!anyE) L.push('(אין ' + termOf(config, 'entity.enrollments', 'שיבוצים') + ')');
  L.push('', '— היסטוריית פעולות —');
  const hist = famHistoryOf(db, f, config);
  for (const h of hist) L.push('[' + fmtDate(h.date) + '] ' + h.tag + ': ' + h.text);
  if (!hist.length) L.push('(אין פעולות מתועדות)');
  return L;
}

/**
 * היסטוריה — עד 40 הפעולות האחרונות של המשפחה, נגזרות מהנתונים הקיימים
 * (שיבוצים, תשלומים, היעדרויות, מדד אמינות, מסמכים, הצטרפות). פאנל מתקפל
 * + ⬇ דוח משפחה מלא כקובץ טקסט. מרונדר מתוך EventsPanel — לא לייבא בנפרד.
 */
function HistoryPanel(props: { fam: Family }) {
  const db = useApp((s) => s.db);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const reportOn = featureOn(config, 'families.report');
  const [open, setOpen] = useState(false);

  const hist = famHistoryOf(db, props.fam, config);

  function exportReport() {
    downloadText('family-' + props.fam.name + '.txt', familyReportLines(db, props.fam, config));
    toast('דוח ה' + termOf(config, 'entity.family', 'משפחה') + ' המלא ירד למחשב');
  }

  return (
    <SectionCard
      title={'היסטוריה (' + hist.length + ')'}
      actions={
        <div style={{ display: 'flex', gap: 6 }}>
          {reportOn && (
            <Btn sm onClick={exportReport}>
              ⬇ דוח {termOf(config, 'entity.family', 'משפחה')}
            </Btn>
          )}
          <Btn sm onClick={() => setOpen((v) => !v)}>
            {open ? '▲ סגירה' : '▼ הצגה'}
          </Btn>
        </div>
      }
    >
      {!open ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          עד 40 הפעולות האחרונות — {termOf(config, 'entity.enrollments', 'שיבוצים')}, תשלומים, היעדרויות, מדד אמינות, מסמכים והצטרפות.
        </div>
      ) : hist.length === 0 ? (
        <Empty>אין פעולות מתועדות ל{termOf(config, 'entity.family', 'משפחה')} זו</Empty>
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {hist.map((h, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'baseline',
                padding: '6px 0',
                borderBottom: '1px solid var(--line)',
                fontSize: 12.5,
              }}
            >
              <span style={{ color: 'var(--ink-faint)', whiteSpace: 'nowrap', fontWeight: 700 }} title={fmtDate(h.date)}>
                {fmtDM(h.date)}
              </span>
              <span style={chipStyle(h.bg, h.c)}>{h.tag}</span>
              <span style={{ flex: 1 }}>{h.text}</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
