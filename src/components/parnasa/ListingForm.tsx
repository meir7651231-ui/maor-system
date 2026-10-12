/**
 * 📒 פרנסה׳לע — טופס עסק / בעל-מקצוע (אשכול 5). "ליבה + פרטים-נוספים" (מוסכמת UX-SIMPLE); תוויות
 * מהמקור (מפרט §1.2). השמירה דרך upsertPrListing — מכונת-האישור ב-store קובעת את הסטטוס (לא-מאשר ⇒
 * ממתין), ושדות-הגבאי (מקור/קוד-חיוג/הדגשה/הערה-פנימית) מוצגים רק למאשר.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import type { PrHours, PrListing, PrService } from '../../types/domain';
import { Btn, Chip, Field, FormError, Modal, Select, TextInput } from '../ui';
import { dialCodeTaken, nextDialCode, PR_CATEGORIES, PR_LANG_NAMES, requireApprovalOf, validDialCode } from './lib';
import { hmToMin } from './zmanimBoard';
import { usePrPerms } from './hooks';
import { PR_DOW_LETTERS } from './labels';

/** עסק ריק לטופס (מזהה '' ⇒ ה-store מקצה). */
export function emptyPrListing(): PrListing {
  return {
    id: '', source: 'owner', name: '', title: '', category: '', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'pending', dialCode: '', featuredUntil: '', recs: [], createdAt: '', updatedAt: '',
  };
}

const LANG_KEYS = Object.keys(PR_LANG_NAMES);

export function ListingForm(props: { listing: PrListing | null; onClose: () => void; onSaved?: (l: PrListing) => void }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrListing = useApp((s) => s.upsertPrListing);
  const toast = useApp((s) => s.toast);
  const { canApprove } = usePrPerms();
  const base = props.listing;
  const isNew = !base;
  const [f, setF] = useState<PrListing>(() => (base ? { ...base, hours: base.hours.map((h) => ({ ...h })), services: base.services.map((s) => ({ ...s })) } : emptyPrListing()));
  const [hasWa, setHasWa] = useState<boolean>(() => (base ? !!base.whatsapp : true));
  const [more, setMore] = useState<boolean>(!isNew);
  const [consent, setConsent] = useState(!isNew);
  const [error, setError] = useState('');

  const word = termOf(config, 'entity.prListing', 'עסק');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const requireApproval = requireApprovalOf(prefs);
  const set = (patch: Partial<PrListing>) => setF((x) => ({ ...x, ...patch }));

  function setHour(i: number, patch: Partial<PrHours>) {
    setF((x) => ({ ...x, hours: x.hours.map((h, j) => (j === i ? { ...h, ...patch } : h)) }));
  }
  function setService(i: number, patch: Partial<PrService>) {
    setF((x) => ({ ...x, services: x.services.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  }

  function save() {
    const name = f.name.trim();
    const phone = f.phone.trim();
    if (!name) return setError('חסר: שם מלא / שם ה' + word);
    if (!f.category) return setError('חסר: תחום');
    if (!phone) return setError('חסר: טלפון');
    if (isNew && !consent) return setError('צריך לסמן שהתקבלה הסכמת בעל ה' + word + ' להופיע במדריך');
    for (const h of f.hours) {
      const a = hmToMin(h.from);
      const b = hmToMin(h.to);
      if (a === null || b === null || a === b) return setError('שעות-פעילות: לכל חלון — שעת פתיחה וסגירה תקינות ושונות');
    }
    const code = f.dialCode.trim();
    if (canApprove && !validDialCode(code)) return setError('קוד-חיוג: שלוש ספרות בין 101 ל-999 (או ריק — יוקצה אוטומטית באישור)');
    if (canApprove && code && dialCodeTaken(listings, code, base?.id)) return setError('קוד-החיוג ' + code + ' כבר תפוס');
    const draft: PrListing = {
      ...f,
      name,
      phone,
      title: f.title.trim(),
      phone2: f.phone2.trim(),
      whatsapp: hasWa ? phone : '',
      city: f.city.trim(),
      area: f.area.trim(),
      hoursNote: f.hoursNote.trim(),
      desc: f.desc.trim(),
      tagline: (f.tagline ?? '').trim(),
      kashrut: f.kashrut.trim(),
      notes: f.notes.trim(),
      dialCode: code,
      services: f.services.map((s) => ({ name: s.name.trim(), price: s.price.trim(), note: s.note.trim() })).filter((s) => s.name),
    };
    const res = upsertPrListing(draft);
    if (!res.ok || !res.listing) return;
    const l = res.listing;
    if (l.status === 'pending') toast('נשלח לאישור ה' + gabbai + ' — יופיע במדריך אחרי אישור');
    else if (isNew) toast(l.name + ' נוסף/ה למדריך' + (l.dialCode ? ' · קוד חיוג ' + l.dialCode : ''));
    else toast('הכרטיס עודכן');
    props.onSaved?.(l);
    props.onClose();
  }

  const saveLabel = !isNew ? 'שמירה' : !canApprove && requireApproval ? 'שליחה לאישור ה' + gabbai : 'הוספה למדריך';

  return (
    <Modal title={(isNew ? '➕ הוספת ' : '✎ עריכת ') + word} onClose={props.onClose} wide>
      <FormError error={error} />
      <div className="form-grid">
        <Field label={'שם מלא / שם ה' + word + ' *'}>
          <TextInput value={f.name} onChange={(v) => set({ name: v.slice(0, 60) })} placeholder="ר׳ יעקב כהן" />
        </Field>
        <Field label="במה עובדים? (במשפט קצר)">
          <TextInput value={f.title} onChange={(v) => set({ title: v.slice(0, 80) })} placeholder="חשמלאי מוסמך, תיקוני קצרים ולוחות" />
        </Field>
        <Field label="תחום *">
          <Select
            value={f.category}
            onChange={(v) => set({ category: v })}
            options={[{ value: '', label: 'בחרו תחום…' }, ...PR_CATEGORIES.map((c) => ({ value: c.key, label: c.num + ' · ' + c.icon + ' ' + c.name }))]}
          />
        </Field>
        <Field label="טלפון *">
          <TextInput value={f.phone} onChange={(v) => set({ phone: v.slice(0, 20) })} placeholder="050-0000000" dir="ltr" />
        </Field>
        <Field label="עיר / שכונה">
          <TextInput value={f.city} onChange={(v) => set({ city: v.slice(0, 40) })} />
        </Field>
        <Field label="אזורי שירות">
          <TextInput value={f.area} onChange={(v) => set({ area: v.slice(0, 80) })} placeholder="ירושלים והסביבה" />
        </Field>
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '4px 0 10px', fontSize: 13.5 }}>
        <input type="checkbox" checked={hasWa} onChange={(e) => setHasWa(e.target.checked)} />
        יש וואטסאפ במספר
      </label>

      <Btn sm onClick={() => setMore((v) => !v)}>{more ? '▾ פחות פרטים' : '▸ פרטים נוספים — שעות, שירותים ומחירים, שפות, השגחה'}</Btn>
      {more && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-grid">
            <Field label="טלפון נוסף">
              <TextInput value={f.phone2} onChange={(v) => set({ phone2: v.slice(0, 20) })} dir="ltr" />
            </Field>
            <Field label="משפט מפתח">
              <TextInput value={f.tagline ?? ''} onChange={(v) => set({ tagline: v.slice(0, 90) })} placeholder="עבודה נקייה, מחיר הוגן, ובזמן" />
            </Field>
            <Field label="שירות מתאים ל">
              <Select
                value={f.aud ?? 'all'}
                onChange={(v) => set({ aud: v === 'men' || v === 'women' ? v : 'all' })}
                options={[
                  { value: 'all', label: 'כולם' },
                  { value: 'men', label: 'גברים' },
                  { value: 'women', label: 'נשים' },
                ]}
              />
            </Field>
            <Field label="השגחה (לעסקי מזון)">
              <TextInput value={f.kashrut} onChange={(v) => set({ kashrut: v.slice(0, 80) })} placeholder="בד״ץ …" />
            </Field>
          </div>

          <Field label="על העסק — ניסיון, מה כן ומה לא (מילים כמו ״נזילות״ או ״לוחות חשמל״ עוזרות למצוא אתכם)">
            <textarea rows={3} value={f.desc} onChange={(e) => set({ desc: e.target.value.slice(0, 700) })} />
          </Field>

          <fieldset style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
            <legend style={{ fontWeight: 800, fontSize: 13.5 }}>ימים ושעות</legend>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, marginBottom: 6 }}>
              <input type="checkbox" checked={f.always} onChange={(e) => set({ always: e.target.checked })} />
              זמין 24/7 (חוץ משבת וחג — נאכף אוטומטית לפי לוח-השנה)
            </label>
            {!f.always && (
              <>
                {f.hours.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <Select
                      ariaLabel="יום"
                      value={String(h.dow)}
                      onChange={(v) => setHour(i, { dow: Number(v) })}
                      options={PR_DOW_LETTERS.map((d, k) => ({ value: String(k), label: d }))}
                    />
                    <input type="time" dir="ltr" aria-label="משעה" value={h.from} onChange={(e) => setHour(i, { from: e.target.value })} />
                    <span>–</span>
                    <input type="time" dir="ltr" aria-label="עד שעה" value={h.to} onChange={(e) => setHour(i, { to: e.target.value })} />
                    <Btn sm onClick={() => setF((x) => ({ ...x, hours: x.hours.filter((_, j) => j !== i) }))} title="הסרת החלון">
                      ✕
                    </Btn>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn sm onClick={() => setF((x) => ({ ...x, hours: [...x.hours, { dow: 0, from: '08:00', to: '19:00' }] }))}>➕ חלון שעות</Btn>
                  {f.hours.length === 0 && (
                    <Btn
                      sm
                      onClick={() =>
                        set({
                          hours: [0, 1, 2, 3, 4].map((d) => ({ dow: d, from: '08:00', to: '19:00' })).concat([{ dow: 5, from: '08:00', to: '12:00' }]),
                        })
                      }
                    >
                      א׳–ה׳ 08:00–19:00 · ו׳ עד 12:00
                    </Btn>
                  )}
                </div>
              </>
            )}
            <div style={{ marginTop: 6 }}>
              <Field label="שעות במילים (לתצוגה)">
                <TextInput value={f.hoursNote} onChange={(v) => set({ hoursNote: v.slice(0, 80) })} placeholder="א׳–ה׳ 8:00–19:00, ו׳ עד 12:00" />
              </Field>
            </div>
          </fieldset>

          <fieldset style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
            <legend style={{ fontWeight: 800, fontSize: 13.5 }}>שירותים ומחירים</legend>
            {f.services.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                <TextInput ariaLabel="שירות" value={s.name} onChange={(v) => setService(i, { name: v.slice(0, 60) })} placeholder="שירות" />
                <TextInput ariaLabel="מחיר" value={s.price} onChange={(v) => setService(i, { price: v.slice(0, 24) })} placeholder="150 / מ־300 / לפי הצעה" />
                <TextInput ariaLabel="הערה" value={s.note} onChange={(v) => setService(i, { note: v.slice(0, 100) })} placeholder="הערה" />
                <Btn sm onClick={() => setF((x) => ({ ...x, services: x.services.filter((_, j) => j !== i) }))} title="הסרת השירות">
                  ✕
                </Btn>
              </div>
            ))}
            {f.services.length < 12 && (
              <Btn sm onClick={() => setF((x) => ({ ...x, services: [...x.services, { name: '', price: '', note: '' }] }))}>➕ שירות</Btn>
            )}
          </fieldset>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>שפות</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LANG_KEYS.map((k) => (
                <Chip
                  key={k}
                  on={f.languages.includes(k)}
                  onClick={() => set({ languages: f.languages.includes(k) ? f.languages.filter((x) => x !== k) : [...f.languages, k] })}
                >
                  {PR_LANG_NAMES[k]}
                </Chip>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13.5 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={!!f.disc} onChange={(e) => set({ disc: e.target.checked })} />
              הנחה לאנשי הקהילה
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={!!f.free} onChange={(e) => set({ free: e.target.checked })} />
              גמ״ח / בהתנדבות
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={f.emergency} onChange={(e) => set({ emergency: e.target.checked })} />
              זמינים לקריאות חירום
            </label>
          </div>
        </div>
      )}

      {canApprove && (
        <fieldset style={{ border: '1px dashed var(--line)', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
          <legend style={{ fontWeight: 800, fontSize: 13.5 }}>{'🛡 שדות ה' + gabbai}</legend>
          <div className="form-grid">
            <Field label="מקור הרישום">
              <Select
                value={f.source}
                onChange={(v) => set({ source: v === 'gabbai' ? 'gabbai' : 'owner' })}
                options={[
                  { value: 'owner', label: 'בעל ה' + word + ' מסר בעצמו — זמין בוואטסאפ, מקבל בקשות' },
                  { value: 'gabbai', label: 'הוזן ע״י ה' + gabbai + ' — טלפון כשר, לא מקבל בקשות' },
                ]}
              />
            </Field>
            <Field label="קוד חיוג (3 ספרות — מודפס בחוברת)">
              <TextInput value={f.dialCode} onChange={(v) => set({ dialCode: v.replace(/\D/g, '').slice(0, 3) })} dir="ltr" placeholder="ריק = יוקצה באישור" />
            </Field>
            <Field label="כרטיס מודגש עד (ריק = לא מודגש)">
              <input type="date" dir="ltr" value={f.featuredUntil} onChange={(e) => set({ featuredUntil: e.target.value })} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <Btn sm onClick={() => set({ dialCode: nextDialCode(listings) })}>🎲 הקוד הבא</Btn>
          </div>
          <Field label={'הערה פנימית (רק ל' + gabbai + ' — לא בחוברת ולא בייצוא)'}>
            <textarea rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
        </fieldset>
      )}

      {isNew && (
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 12, fontSize: 13.5, fontWeight: 700 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          {'קיבלתי את הסכמת בעל ה' + word + ' להופיע במדריך'}
        </label>
      )}
      {!canApprove && requireApproval && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 8 }}>
          {'כרטיס חדש — ועריכת פרטים של כרטיס קיים — מופיע במדריך רק אחרי אישור ה' + gabbai + '.'}
        </div>
      )}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {saveLabel}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
