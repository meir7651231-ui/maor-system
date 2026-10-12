/**
 * 📒 פרנסה׳לע — טופס לוח-הקהילה (אשכול 5): מודעה · בית-כנסת ומניינים · אירוע · מספר-חירום.
 * זהו גם "מסך-העריכה של הגבאי" שחסר במקור (בתי-כנסת/מניינים/אירועים/מספרי-חירום נקראו מההגדרות
 * בלי שום ממשק). זמני-מניין: "06:45" קבוע · "sh-15" שקיעה−15 · "tz+0" צאת · "nz-0" נץ — נבדקים מול
 * זמני-היום של מיקום-הקהילה (resolveTimeToken). מודעה של מי שאינו מאשר ⇒ ממתינה (store).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import type { PrPost, PrPostKind } from '../../types/domain';
import { Btn, Chip, Field, FormError, Modal, Select, TextInput } from '../ui';
import { addDaysIso, dayTimes, resolveTimeToken } from './zmanimBoard';
import { usePrNow, usePrPerms } from './hooks';
import { PR_NOTICE_KIND_LABELS, PR_POST_KIND_LABELS, PR_PRAYERS } from './labels';

export function emptyPrPost(kind: PrPostKind = 'notice'): PrPost {
  return {
    id: '', kind, title: '', text: '', place: '', phone: '', noticeKind: '', prayers: [], days: [], date: '', time: '', until: '',
    approved: false, pinned: false, createdAt: '', updatedAt: '',
  };
}

const DAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

/** טוקנים מטקסט חופשי ("06:00, 06:45 sh-15") — מופרדים בפסיק/רווח. */
export function splitTokens(s: string): string[] {
  return s
    .split(/[,،\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function PostForm(props: { post: PrPost | null; kind?: PrPostKind; onClose: () => void }) {
  const config = useApp((s) => s.config);
  const upsertPrPost = useApp((s) => s.upsertPrPost);
  const toast = useApp((s) => s.toast);
  const { canApprove } = usePrPerms();
  const now = usePrNow();
  const base = props.post;
  const [f, setF] = useState<PrPost>(() => {
    if (base) return { ...base, prayers: base.prayers.map((p) => ({ ...p, times: [...p.times] })), days: [...base.days] };
    const k = props.kind ?? 'notice';
    // מודעה רגילה יורדת מהלוח כברירת-מחדל אחרי שבוע (המקור); מניין/אירוע/חירום — עד שיוסרו
    return { ...emptyPrPost(k), until: k === 'notice' ? addDaysIso(now.todayIso, 7) : '', prayers: k === 'minyan' ? PR_PRAYERS.map((p) => ({ prayer: p, times: [] })) : [] };
  });
  // טקסט-הזמנים פר-תפילה (נשמר כמחרוזת בעריכה, מפוצל בשמירה)
  const [timesText, setTimesText] = useState<string[]>(() => f.prayers.map((p) => p.times.join(', ')));
  const [error, setError] = useState('');

  const word = termOf(config, 'entity.prPost', 'מודעה');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const set = (patch: Partial<PrPost>) => setF((x) => ({ ...x, ...patch }));
  const sampleDay = dayTimes(now.todayIso, now.loc);

  function setPrayerName(i: number, prayer: string) {
    setF((x) => ({ ...x, prayers: x.prayers.map((p, j) => (j === i ? { ...p, prayer } : p)) }));
  }

  function save() {
    if (!f.title.trim()) return setError(f.kind === 'minyan' ? 'חסר: שם בית הכנסת' : f.kind === 'emergency' ? 'חסר: שם המוקד' : 'חסרה כותרת');
    if (f.kind === 'emergency' && !f.phone.trim()) return setError('למספר-חירום חובה טלפון');
    let prayers = f.prayers;
    if (f.kind === 'minyan') {
      prayers = f.prayers.map((p, i) => ({ prayer: p.prayer.trim(), times: splitTokens(timesText[i] ?? '') })).filter((p) => p.prayer && p.times.length);
      const bad = prayers.flatMap((p) => p.times.filter((t) => !resolveTimeToken(t, sampleDay)));
      if (bad.length) return setError('זמן לא מובן: ' + bad.join(', ') + ' — כתבו 06:45 / sh-15 / tz+0 / nz-0');
      if (!prayers.length) return setError('הוסיפו לפחות תפילה אחת עם זמן');
    }
    const res = upsertPrPost({
      ...f,
      title: f.title.trim(),
      text: f.text.trim(),
      place: f.place.trim(),
      phone: f.phone.trim(),
      time: f.time.trim(),
      prayers: f.kind === 'minyan' ? prayers : [],
      noticeKind: f.kind === 'notice' ? f.noticeKind : '',
    });
    if (!res.ok || !res.post) return;
    toast(res.post.approved ? (base ? 'עודכן בלוח' : 'נתלה בלוח') : 'נשלח ל' + gabbai + ' — יופיע אחרי אישור');
    props.onClose();
  }

  return (
    <Modal title={(base ? '✎ עריכת ' : '➕ הוספת ') + (f.kind === 'notice' ? word : PR_POST_KIND_LABELS[f.kind].replace(/^\S+\s/, ''))} onClose={props.onClose}>
      <FormError error={error} />
      {!base && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {(Object.keys(PR_POST_KIND_LABELS) as PrPostKind[]).map((k) => (
            <Chip
              key={k}
              on={f.kind === k}
              onClick={() => {
                set({ kind: k, until: k === 'notice' ? f.until || addDaysIso(now.todayIso, 7) : '', prayers: k === 'minyan' && !f.prayers.length ? PR_PRAYERS.map((p) => ({ prayer: p, times: [] })) : f.prayers });
                if (k === 'minyan' && !f.prayers.length) setTimesText(PR_PRAYERS.map(() => ''));
              }}
            >
              {PR_POST_KIND_LABELS[k]}
            </Chip>
          ))}
        </div>
      )}

      {f.kind === 'notice' && (
        <div className="form-grid">
          <Field label="סוג">
            <Select
              value={f.noticeKind}
              onChange={(v) => set({ noticeKind: v })}
              options={[{ value: '', label: 'כללי' }, ...Object.entries(PR_NOTICE_KIND_LABELS).map(([k, l]) => ({ value: k, label: l }))]}
            />
          </Field>
          <Field label="כותרת *">
            <TextInput value={f.title} onChange={(v) => set({ title: v.slice(0, 80) })} placeholder="למשל: לרגל הולדת הבן" />
          </Field>
          <Field label="מקום">
            <TextInput value={f.place} onChange={(v) => set({ place: v.slice(0, 60) })} />
          </Field>
          <Field label="מתי">
            <TextInput value={f.time} onChange={(v) => set({ time: v.slice(0, 40) })} placeholder="ליל ש״ק / 15:00" />
          </Field>
          <Field label="טלפון לפרטים">
            <TextInput value={f.phone} onChange={(v) => set({ phone: v.slice(0, 20) })} dir="ltr" />
          </Field>
          <Field label="יורד מהלוח בתאריך">
            <input type="date" dir="ltr" value={f.until} onChange={(e) => set({ until: e.target.value })} />
          </Field>
        </div>
      )}

      {f.kind === 'minyan' && (
        <>
          <div className="form-grid">
            <Field label="שם בית הכנסת *">
              <TextInput value={f.title} onChange={(v) => set({ title: v.slice(0, 80) })} placeholder="בית המדרש הגדול" />
            </Field>
            <Field label="כתובת">
              <TextInput value={f.place} onChange={(v) => set({ place: v.slice(0, 60) })} placeholder="רחוב החסידים 2" />
            </Field>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '4px 0' }}>
            זמן קבוע 06:45 · sh-15 = רבע שעה לפני השקיעה · tz+0 = צאת הכוכבים · nz-0 = נץ החמה (ותיקין). מפרידים בפסיק.
          </div>
          {f.prayers.map((p, i) => {
            const toks = splitTokens(timesText[i] ?? '');
            return (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                <TextInput value={p.prayer} onChange={(v) => setPrayerName(i, v.slice(0, 30))} ariaLabel="תפילה" placeholder="שחרית" />
                <TextInput
                  value={timesText[i] ?? ''}
                  onChange={(v) => setTimesText((t) => t.map((x, j) => (j === i ? v : x)))}
                  ariaLabel={'זמני ' + (p.prayer || 'התפילה')}
                  dir="ltr"
                  placeholder="06:00, 06:45, sh-15"
                />
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }} dir="ltr">
                  {toks.map((t) => resolveTimeToken(t, sampleDay) || '⚠ ' + t).join(' · ')}
                </span>
                <Btn
                  sm
                  onClick={() => {
                    setF((x) => ({ ...x, prayers: x.prayers.filter((_, j) => j !== i) }));
                    setTimesText((t) => t.filter((_, j) => j !== i));
                  }}
                  title="הסרת התפילה"
                >
                  ✕
                </Btn>
              </div>
            );
          })}
          <Btn
            sm
            onClick={() => {
              setF((x) => ({ ...x, prayers: [...x.prayers, { prayer: '', times: [] }] }));
              setTimesText((t) => [...t, '']);
            }}
          >
            ➕ תפילה
          </Btn>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>ימים (ריק = כל יום)</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {DAY_SHORT.map((d, i) => (
                <Chip key={i} on={f.days.includes(i)} onClick={() => set({ days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i].sort() })}>
                  {d}
                </Chip>
              ))}
            </div>
          </div>
        </>
      )}

      {f.kind === 'event' && (
        <div className="form-grid">
          <Field label="כותרת *">
            <TextInput value={f.title} onChange={(v) => set({ title: v.slice(0, 80) })} placeholder="מלווה מלכה ושיחה" />
          </Field>
          <Field label="תאריך">
            <input type="date" dir="ltr" value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="מתי (טקסט)">
            <TextInput value={f.time} onChange={(v) => set({ time: v.slice(0, 40) })} placeholder="מוצ״ש · 21:30" />
          </Field>
          <Field label="מקום">
            <TextInput value={f.place} onChange={(v) => set({ place: v.slice(0, 60) })} />
          </Field>
          <Field label="יורד מהלוח בתאריך (ריק = עד שיוסר)">
            <input type="date" dir="ltr" value={f.until} onChange={(e) => set({ until: e.target.value })} />
          </Field>
        </div>
      )}

      {f.kind === 'emergency' && (
        <div className="form-grid">
          <Field label="שם המוקד *">
            <TextInput value={f.title} onChange={(v) => set({ title: v.slice(0, 60) })} placeholder="מד״א" />
          </Field>
          <Field label="טלפון *">
            <TextInput value={f.phone} onChange={(v) => set({ phone: v.slice(0, 20) })} dir="ltr" placeholder="101" />
          </Field>
        </div>
      )}

      {f.kind !== 'minyan' && (
        <Field label={f.kind === 'emergency' ? 'הערה' : 'פרטים'}>
          <textarea
            rows={f.kind === 'emergency' ? 1 : 3}
            value={f.text}
            onChange={(e) => set({ text: e.target.value.slice(0, 400) })}
            placeholder={f.kind === 'notice' ? 'מה, למי, ומה מבקשים מהקהילה' : ''}
          />
        </Field>
      )}

      {canApprove && (
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, marginTop: 6 }}>
          <input type="checkbox" checked={f.pinned} onChange={(e) => set({ pinned: e.target.checked })} />
          נעוץ בראש הלוח
        </label>
      )}
      {!canApprove && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 6 }}>{'ה' + gabbai + ' מאשר/ת כל ' + word + ' לפני שהיא נתלית.'}</div>}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {canApprove ? 'שמירה ותלייה' : 'שליחה ל' + gabbai}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
