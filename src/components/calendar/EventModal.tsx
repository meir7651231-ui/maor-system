/**
 * מודאל אירוע — הוספה ועריכה של אירוע יומן על כל שדות OrgEvent,
 * כולל הד תאריך עברי וחיווי חזרה שנתית, ומחיקה בדפוס שתי-לחיצות.
 */
import { useMemo, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { hebDateFull } from '../../lib/hebrew';
import { nextOccurIso, orgBlockError, QUICK_DATE_CHIPS, quickDate, roomClashError, softClashSuffix } from './calLib';
import { isoToday } from '../../lib/date-util';
import {
  HEBREW_RECURRING,
  type EventPriority,
  type EventType,
  type OrgEvent,
} from '../../types/domain';

/** תוויות סוגי האירוע בעברית (מקומי — לא נדרש ייצוא). */
const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'org', label: 'ארגוני' },
  { value: 'reminder', label: 'תזכורת' },
  { value: 'call', label: 'שיחה' },
  { value: 'wedding', label: 'חתונה' },
  { value: 'memorial', label: 'אזכרה' },
  { value: 'anniversary', label: 'יום נישואין' },
  { value: 'bday', label: 'יום הולדת' },
  { value: 'custom', label: 'מותאם' },
];

const PRIORITY_OPTIONS: { value: EventPriority; label: string }[] = [
  { value: 'green', label: 'רגיל (ירוק)' },
  { value: 'orange', label: 'בינוני (כתום)' },
  { value: 'red', label: 'דחוף (אדום)' },
];

interface FormState {
  title: string;
  date: string;
  time: string;
  type: EventType;
  customType: string;
  notes: string;
  price: string;
  roomId: string;
  famId: string;
  priority: EventPriority;
  done: boolean;
}

export function EventModal(props: {
  /** אירוע קיים לעריכה, או null להוספה. */
  ev: OrgEvent | null;
  /** תאריך התחלתי לאירוע חדש (ISO). */
  date: string;
  /** ערכים התחלתיים לאירוע חדש — למשל הזמנת משבצת חדר מהיומן או "➕ אירוע" מכרטיס המשפחה. */
  prefill?: { time?: string; roomId?: string; type?: EventType; notes?: string; famId?: string };
  /** טקסט toast מותאם לשמירת אירוע חדש (ברירת מחדל: 'האירוע נוסף ללוח'). */
  saveToast?: string;
  onClose: () => void;
}) {
  const { ev, date, prefill, saveToast, onClose } = props;
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const rooms = useApp((s) => s.db.rooms);
  const families = useApp((s) => s.db.families);
  const upsertEvent = useApp((s) => s.upsertEvent);
  const deleteEvent = useApp((s) => s.deleteEvent);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);

  const [f, setF] = useState<FormState>(() => ({
    title: ev?.title ?? '',
    date: ev?.date ?? date,
    time: ev?.time ?? prefill?.time ?? '',
    type: ev?.type ?? prefill?.type ?? 'org',
    customType: ev?.customType ?? '',
    notes: ev?.notes ?? prefill?.notes ?? '',
    price: ev && ev.price ? String(ev.price) : '',
    roomId: ev?.roomId ?? prefill?.roomId ?? '',
    famId: ev?.famId ?? prefill?.famId ?? '',
    priority: ev?.priority ?? 'green',
    done: ev?.done ?? false,
  }));
  const [error, setError] = useState('');
  const [armDelete, setArmDelete] = useState(false);
  const armedAt = useRef(0);
  // UX סבב-ה׳ (השלמה): רוב האירועים = תזכורת/שיחה — מחיר/חדר/שיוך/דחיפות/בוצע
  // מתקפלים. נפתח אוטומטית כשעורכים אירוע שכבר יש בו ערך, או כש-prefill מביא
  // חדר/שיוך (הזמנת-משבצת מהיומן חייבת להציג את החדר). כל השדות נשמרים.
  const [moreOpen, setMoreOpen] = useState<boolean>(
    () =>
      (!!ev && !!(ev.price || ev.roomId || ev.famId || ev.done || (ev.priority && ev.priority !== 'green'))) ||
      !!(prefill?.roomId || prefill?.famId),
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const roomOptions = useMemo(
    () => [
      { value: '', label: 'ללא ' + termOf(config, 'entity.room', 'חדר') },
      ...rooms.map((r) => ({ value: r.id, label: r.name })),
    ],
    [rooms, config],
  );
  const famOptions = useMemo(
    () => [
      { value: '', label: 'ללא שיוך' },
      ...families.map((fam) => ({
        value: fam.id,
        label: termOf(config, 'entity.familyOf', 'משפחת') + ' ' + fam.name,
      })),
    ],
    [families, config],
  );

  const recurring = HEBREW_RECURRING.has(f.type);
  // המופע הבא (לגאסי nextOccurLabel) — מוצג רק לאירוע חוזר עם תאריך
  const nextOcc = useMemo(
    () => (recurring && f.date ? nextOccurIso({ type: f.type, date: f.date }, isoToday()) : ''),
    [recurring, f.type, f.date],
  );
  const hebLine = f.date
    ? 'תאריך עברי: ' + hebDateFull(f.date) + (recurring ? ' · חוזר מדי שנה בתאריך העברי הזה' : '') +
      (nextOcc && nextOcc !== f.date ? ' · המופע הבא: ' + hebDateFull(nextOcc) + ' (' + nextOcc.split('-').reverse().join('/') + ')' : '')
    : '';

  function save() {
    if (!f.title.trim()) {
      setError('כותרת היא שדה חובה');
      return;
    }
    if (!f.date) {
      setError('יש לבחור תאריך');
      return;
    }
    if (f.type === 'custom' && !f.customType.trim()) {
      setError('בחרתם סוג "מותאם" — הקלידו את סוג האירוע');
      return;
    }
    if (f.price.trim() && !Number.isFinite(Number(f.price))) {
      // !Number.isFinite חוסם גם NaN וגם Infinity (קלט "1e400") — אחרת Infinity
      // עובר ונשמר, מסודר ל-null ומשחית את שדה המחיר.
      setError('מחיר האירוע חייב להיות מספר');
      return;
    }
    // ולידציות חסימה — מדולגות כשהפיצ'ר calendar.blocking כבוי
    if (featureOn(config, 'calendar.blocking')) {
      // התנגשות חדר — אירוע אחר או מפגש חוג באותה שעה (כמו במקור)
      if (featureOn(config, 'calendar.blocking.roomclash')) {
        const clash = roomClashError(db, config, f, ev?.id);
        if (clash) {
          setError(clash);
          return;
        }
      }
      // אירוע ארגוני אסור בשבת ובחג מלא
      if (f.type === 'org' && featureOn(config, 'calendar.blocking.shabbat')) {
        const blocked = orgBlockError(f.date);
        if (blocked) {
          setError(blocked);
          return;
        }
      }
    }
    // ביקורת 6.8: פורסים את האירוע הקיים קודם — בלי זה עריכה מהלוח מחקה שדות-קישור
    // שאינם בטופס (spId של מעקב-עי"ן, mainEventId של פגישות-חנות ⇒ שחרור-חדר נשבר)
    const next: OrgEvent = {
      // ‏TS/JS מתעלמים מ-null בפריסה — אין צורך ב-fallback (אזהרת lint 11.8)
      ...ev,
      id: ev?.id ?? nextId('ev'),
      title: f.title.trim(),
      date: f.date,
      time: f.time,
      type: f.type,
      customType: f.type === 'custom' ? f.customType.trim() : '',
      notes: f.notes,
      price: Number(f.price) || 0,
      roomId: f.roomId,
      famId: f.famId,
      priority: f.priority,
      done: f.done,
    };
    upsertEvent(next);
    // אזהרה רכה (P3 פריט 5) — לא חוסמת; החסימות הקשיחות כבר עברו למעלה
    const clashNote = softClashSuffix(db.events, next.date, next.time, next.id);
    toast((ev ? 'האירוע עודכן' : (saveToast ?? 'האירוע נוסף ללוח')) + clashNote);
    onClose();
  }

  function del() {
    if (!ev) return;
    if (!armDelete) {
      setArmDelete(true);
      armedAt.current = Date.now();
      return;
    }
    // מתעלמים מאישור שנוחת פחות מ-400ms מהזריון — לחיצה כפולה טבעית משגרת שני
    // קליקים, וה-render של הזריון קורה ביניהם; בלי זה הקליק השני היה מוחק בלי
    // שהמשתמש הספיק לקרוא את "לחצו שוב לאישור".
    if (Date.now() - armedAt.current < 400) return;
    deleteEvent(ev.id);
    toast('האירוע נמחק מהלוח');
    onClose();
  }

  return (
    <Modal title={ev ? 'עריכת אירוע' : 'אירוע חדש'} onClose={onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="כותרת *">
            <TextInput value={f.title} onChange={(v) => set('title', v)} placeholder="לדוגמה: ישיבת צוות" />
          </Field>
        </div>
        <Field label="תאריך *">
          <div>
            {/* צ׳יפי תאריכים מהירים (P2 פער 26) — ההזזה מהיום, טהורה ב-quickDate */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
              {QUICK_DATE_CHIPS.map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => set('date', quickDate(isoToday(), kind))}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: '2px 9px',
                    borderRadius: 999,
                    border: '1px solid var(--line)',
                    background: 'var(--panel)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <HebDateInput value={f.date} onChange={(iso) => set('date', iso)} />
          </div>
        </Field>
        <Field label="שעה">
          <TextInput type="time" value={f.time} onChange={(v) => set('time', v)} dir="ltr" />
        </Field>
        <Field label="סוג">
          <Select
            value={f.type}
            onChange={(v) => set('type', v as EventType)}
            options={TYPE_OPTIONS}
          />
        </Field>
        {f.type === 'custom' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="סוג אירוע — מותאם *">
              <TextInput
                value={f.customType}
                onChange={(v) => set('customType', v)}
                placeholder="לדוגמה: בר מצווה, ברית, סיום מחזור…"
              />
            </Field>
          </div>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="הערות">
            <textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>
      </div>
      {/* פשוט/מתקדם — אותו דפוס-קיפול כמו טופס-המשפחה; כל השדות נשמרים */}
      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--accent-deep, var(--accent))', padding: '2px 0 10px', textAlign: 'start' }}
      >
        {(moreOpen ? '▲ פחות פרטים' : '▼ פרטים נוספים') + ' — מחיר, ' + termOf(config, 'entity.room', 'חדר') + ', שיוך, דחיפות…'}
      </button>
      {moreOpen && (
        <div className="form-grid">
          <Field label="רמת דחיפות">
            <Select
              value={f.priority}
              onChange={(v) => set('priority', v as EventPriority)}
              options={PRIORITY_OPTIONS}
            />
          </Field>
          <Field label="מחיר האירוע (₪)">
            <TextInput type="number" value={f.price} onChange={(v) => set('price', v)} dir="ltr" placeholder="0" />
          </Field>
          <Field label={termOf(config, 'entity.room', 'חדר') + ' (רשות)'}>
            <Select value={f.roomId} onChange={(v) => set('roomId', v)} options={roomOptions} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label={'שיוך ל' + termOf(config, 'entity.family', 'משפחה') + ' (רשות)'}>
              <Select value={f.famId} onChange={(v) => set('famId', v)} options={famOptions} />
            </Field>
          </div>
        </div>
      )}

      {hebLine && (
        <div
          style={{
            background: '#faf6ec',
            border: '1px solid #eee3c8',
            borderRadius: 10,
            padding: '7px 12px',
            fontSize: 12.5,
            fontWeight: 600,
            color: '#9a6414',
            marginBottom: 12,
          }}
        >
          <span style={{ color: 'var(--amber-deep)' }}>✦</span> {hebLine}
        </div>
      )}

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={f.done}
          onChange={(e) => set('done', e.target.checked)}
          style={{ width: 'auto' }}
        />
        בוצע ✓
      </label>

      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {ev ? 'שמירת שינויים' : 'הוספה ללוח'}
        </Btn>
        <Btn onClick={onClose}>ביטול</Btn>
        {ev && (
          <Btn kind="danger" onClick={del} title="מחיקת האירוע מהלוח">
            {armDelete ? 'לחצו שוב לאישור המחיקה' : '🗑 מחיקה'}
          </Btn>
        )}
      </div>
    </Modal>
  );
}
