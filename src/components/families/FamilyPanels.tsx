/**
 * פאנלים של כרטיס המשפחה: מסמכים (רשומות שם בלבד), מדד אמינות (+/- ולוג),
 * שיבוצים לחוגים (כולל ＋ שיבוץ לחוג), אירועים מקושרים והיסטוריה נגזרת
 * (כולל ⬇ דוח משפחה מלא כקובץ טקסט).
 */
import { useState, type ReactNode } from 'react';
import type { Db, Family, FamilyDoc } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, moduleOn } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty, TextInput } from '../ui';
import { downloadText } from '../reports/csv';
import { paidOf, payBal, planWord } from '../courses/lib';
import { ageOf, chipStyle, EVENT_META, famHistoryOf, fmtDate, isoToday, STATUS_META, tierOf } from './lib';
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
  const [overrideVal, setOverrideVal] = useState('');

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
    <SectionCard title="מדד אמינות" actions={<span style={chipStyle(tier.bg, tier.c)}>{tier.label}</span>}>
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
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextInput value={overrideVal} onChange={setOverrideVal} placeholder="Override 0–1000" dir="ltr" />
        </div>
        <Btn sm onClick={applyOverride}>
          עדכון ידני
        </Btn>
      </div>
      {cred.log.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין עדיין רישומי ניקוד למשפחה זו</div>
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

/** שיבוצים לחוגים של בני המשפחה — כולל ＋ שיבוץ לחוג ישירות מהכרטיס. */
export function EnrollPanel(props: { fam: Family }) {
  const courses = useApp((s) => s.db.courses);
  const enrollments = useApp((s) => s.db.enrollments);
  const config = useApp((s) => s.config);
  const joinOn = featureOn(config, 'families.join');
  const [joinOpen, setJoinOpen] = useState(false);
  const memberIds = new Set(props.fam.members.map((m) => m.id));
  const list = enrollments.filter((e) => memberIds.has(e.memberId));

  // מודול החוגים כבוי ⇒ אין פאנל שיבוצים בכרטיס המשפחה (החוזה: כבוי = מוסתר בכל המשטחים)
  if (!moduleOn(config, 'courses')) return null;

  const STATUS: Record<string, string> = { active: 'פעיל', paused: 'מוקפא ⏸', ended: 'הסתיים' };

  return (
    <SectionCard
      title="קורסים פעילים וניקובים"
      actions={joinOn ? <Btn onClick={() => setJoinOpen(true)}>+ שיבוץ לחוג</Btn> : undefined}
    >
      {list.length === 0 ? (
        <Empty>{joinOn ? 'אין שיבוצים פעילים — לחצו על "+ שיבוץ לחוג"' : 'אין שיבוצים פעילים'}</Empty>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>תלמיד/ה</th>
                <th>קורס</th>
                <th>מסלול</th>
                <th>יתרה</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const m = props.fam.members.find((x) => x.id === e.memberId);
                const c = courses.find((x) => x.id === e.courseId);
                const rem = e.purchased - e.used;
                const barColor = rem <= 0 ? '#dc2626' : rem <= 2 ? '#d97706' : '#16a34a';
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {joinOn && joinOpen && <JoinModal family={props.fam} onClose={() => setJoinOpen(false)} />}
    </SectionCard>
  );
}

/** אירועים מיוחדים המקושרים למשפחה (אזכרה/שמחה/תזכורת) — תצוגה בלבד. */
export function EventsPanel(props: { fam: Family }) {
  const events = useApp((s) => s.db.events);
  const config = useApp((s) => s.config);
  const historyOn = featureOn(config, 'families.history');
  const list = events.filter((e) => e.famId === props.fam.id && !e.done);

  // פאנל ההיסטוריה מרונדר כאן כדי להופיע בכרטיס המשפחה בלי לגעת ב-FamilyDetail
  return (
    <>
      <SectionCard title="אירועים מיוחדים">
        {list.length === 0 ? (
          <Empty>אין אירועים מקושרים למשפחה — ניתן להוסיף מתוך לוח השנה</Empty>
        ) : (
          list.map((ev) => {
            const meta = EVENT_META[ev.type] ?? EVENT_META.org;
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
                  </div>
                </div>
              </div>
            );
          })
        )}
      </SectionCard>
      {historyOn && <HistoryPanel fam={props.fam} />}
    </>
  );
}

/** תאריך ISO ‏→ DD/MM לתצוגת ההיסטוריה. */
function fmtDM(iso: string): string {
  return iso.length >= 10 ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : iso;
}

/** שורות דוח המשפחה המלא (port של expReport מהמקור) — טקסט להורדה. */
function familyReportLines(db: Db, f: Family): string[] {
  const ids = new Set(f.members.map((m) => m.id));
  // ברירת המחדל 700 זהה לכל שאר המשטחים (emptyFamily · כרטיס · finder · בית) — בלי פער
  const tier = tierOf(f.cred?.score ?? 700);
  const L: string[] = [
    'דוח משפחה מלא — משפחת ' + f.name,
    'הופק: ' + hebDateFull(isoToday()) + ' · ' + new Date().toLocaleString('he-IL'),
    '='.repeat(46),
    '',
    '— פרטי המשפחה —',
    'אב: ' + (f.father || '—') + (f.fatherId ? ' · ת"ז ' + f.fatherId : ''),
    'אם: ' + (f.mother || '—') + (f.motherId ? ' · ת"ז ' + f.motherId : ''),
    'טלפון: ' + (f.phone || '—') + (f.phone2 ? ' · ' + f.phone2 : '') + (f.email ? ' · ' + f.email : ''),
    'כתובת: ' + ([f.address, f.city].filter(Boolean).join(', ') || '—'),
    'קהילה: ' + (f.community || '—') + ' · שפה: ' + (f.language || '—') + ' · מצב משפחתי: ' + (f.maritalStatus || '—'),
    'סטטוס: ' + STATUS_META[f.status].label +
      (f.createdAt ? ' · הצטרפה: ' + hebDateFull(f.createdAt) + ' (' + fmtDate(f.createdAt) + ')' : ''),
    'קופת צדקה: ' + (f.tzedaka || '—') + ' · הנחה: ' + (f.discount || '—') + ' · ספח מלא: ' + (f.fullSefach ? 'קיים' : 'חסר'),
    'מדד אמינות: ' + (f.cred?.score ?? '—') + ' (' + tier.label + ')',
  ];
  if (f.notes) L.push('הערות: ' + f.notes);
  L.push('', '— בני המשפחה —');
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
  if (!f.members.length) L.push('(אין בני משפחה)');
  L.push('', '— שיבוצים לחוגים —');
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
  if (!anyE) L.push('(אין שיבוצים)');
  L.push('', '— היסטוריית פעולות —');
  const hist = famHistoryOf(db, f);
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

  const hist = famHistoryOf(db, props.fam);

  function exportReport() {
    downloadText('family-' + props.fam.name + '.txt', familyReportLines(db, props.fam));
    toast('דוח המשפחה המלא ירד למחשב');
  }

  return (
    <SectionCard
      title={'היסטוריה (' + hist.length + ')'}
      actions={
        <div style={{ display: 'flex', gap: 6 }}>
          {reportOn && (
            <Btn sm onClick={exportReport}>
              ⬇ דוח משפחה
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
          עד 40 הפעולות האחרונות — שיבוצים, תשלומים, היעדרויות, מדד אמינות, מסמכים והצטרפות.
        </div>
      ) : hist.length === 0 ? (
        <Empty>אין פעולות מתועדות למשפחה זו</Empty>
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
