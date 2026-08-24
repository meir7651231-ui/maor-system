/**
 * טופס תומכ/ת — כרטיס מלא: פרטי קשר, ת"ז (עם ספרת ביקורת), קטגוריה,
 * ייעוד התרומה והערות. יצירה ועריכה באותו מודאל.
 */
import { useState } from 'react';
import type { Supporter, SupPhone } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { normSearch, validIsraeliId } from '../../lib/validate';
import { Btn, Field, FormError, Modal, TextInput } from '../ui';
import { allDonationPurposes, cleanSupPhones, fixPhone, phoneRegion } from './lib';

export interface SupporterFormProps {
  /** null — תומכת חדשה. */
  supporter: Supporter | null;
  /** נסגר עם id כשנוצרה תומכת חדשה (לפתיחת הכרטיס). */
  onClose: (newId?: string) => void;
}

export function SupporterForm(props: SupporterFormProps) {
  const upsertSupporter = useApp((s) => s.upsertSupporter);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);

  const sp = props.supporter;
  const [f, setF] = useState({
    name: sp?.name ?? '',
    phone: sp?.phone ?? '',
    email: sp?.email ?? '',
    address: sp?.address ?? '',
    city: sp?.city ?? '',
    idNum: sp?.idNum ?? '',
    cat: sp?.cat ?? '',
    forWho: sp?.forWho ?? '',
    notes: sp?.notes ?? '',
  });
  // ריבוי-טלפונים (בקשת-שטח) — מספרים נוספים מעבר לראשי, כל אחד עם תווית והערה.
  const [phones, setPhones] = useState<SupPhone[]>(sp?.phones ? sp.phones.map((p) => ({ ...p })) : []);
  const [error, setError] = useState('');

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const nextIdFn = useApp((s) => s.nextId);
  const addPhone = () => setPhones([...phones, { id: nextIdFn('ph'), num: '', label: '', note: '', wa: false }]);
  const setPhone = (i: number, patch: Partial<SupPhone>) => setPhones(phones.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const removePhone = (i: number) => setPhones(phones.filter((_, j) => j !== i));

  function save() {
    if (!f.name.trim()) {
      setError('שם ' + termOf(config, 'entity.supporter', 'התומך/ת') + ' הוא שדה חובה');
      return;
    }
    const idn = f.idNum.trim();
    if (idn && !validIsraeliId(idn.replace(/\D/g, ''))) {
      setError('ת"ז לא תקינה — ספרת ביקורת שגויה');
      return;
    }
    const vals = {
      name: f.name.trim(),
      phone: fixPhone(f.phone.trim()),
      email: f.email.trim(),
      address: f.address.trim(),
      city: f.city.trim(),
      idNum: idn,
      cat: f.cat.trim(),
      forWho: f.forWho.trim(),
      notes: f.notes.trim(),
      phones: cleanSupPhones(phones),
    };

    if (sp) {
      upsertSupporter({ ...sp, ...vals });
      toast('כרטיס ' + termOf(config, 'entity.supporter', 'התומך/ת') + ' עודכן — משתקף מיד בטבלה, בחיפוש ובגיבוי');
      props.onClose();
      return;
    }

    // מניעת כפילות — שם מנורמל זהה + טלפון תואם (או חסר), כמו במקור
    const digits = vals.phone.replace(/\D/g, '');
    const dup = useApp
      .getState()
      .db.supporters.some(
        (x) =>
          normSearch(x.name) === normSearch(vals.name) &&
          (!digits || !x.phone || x.phone.replace(/\D/g, '') === digits),
      );
    if (dup) {
      setError(termOf(config, 'entity.supporter', 'תומך/ת') + ' בשם הזה כבר קיימ/ת — פתחו את הכרטיס מהטבלה');
      return;
    }

    const id = nextId('sp');
    upsertSupporter({
      id,
      ...vals,
      count: 0,
      ils: 0,
      usd: 0,
      first: '',
      last: '',
      nextDate: '',
      donations: [],
    });
    toast('ה' + termOf(config, 'entity.supporter', 'תומך/ת') + ' "' + vals.name + '" נוסף/ה — אפשר לרשום ' + termOf(config, 'entity.donation', 'תרומה') + ' בכרטיס');
    props.onClose(id);
  }

  return (
    <Modal
      title={
        sp
          ? 'כרטיס ' + termOf(config, 'entity.supporter', 'תומך/ת') + ' — עריכה מלאה'
          : 'הוספת ' + termOf(config, 'entity.supporter', 'תומך/ת') + ' — כרטיס מלא'
      }
      onClose={() => props.onClose()}
    >
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם מלא *">
          <TextInput value={f.name} onChange={set('name')} placeholder={'שם התומכ/ת או ה' + termOf(config, 'entity.family', 'משפחה')} />
        </Field>
        <Field label="טלפון ראשי">
          <TextInput value={f.phone} onChange={set('phone')} dir="ltr" placeholder="050-0000000" />
        </Field>
        <Field label="אימייל">
          <TextInput value={f.email} onChange={set('email')} dir="ltr" type="email" />
        </Field>
        <Field label='ת"ז'>
          <TextInput value={f.idNum} onChange={set('idNum')} dir="ltr" placeholder="לקבלות מס" />
        </Field>
        <Field label="כתובת">
          <TextInput value={f.address} onChange={set('address')} />
        </Field>
        {/* עיר (P3 — סגירת סטיית P2): נכנסת לעמודת "עיר" בדוח המותאם המלא */}
        <Field label="עיר">
          <TextInput value={f.city} onChange={set('city')} />
        </Field>
        <Field label="קטגוריה">
          <TextInput value={f.cat} onChange={set('cat')} placeholder="קרן / עסק / פרטי…" />
        </Field>
        <Field label={'ייעוד ' + termOf(config, 'entity.donation', 'התרומה') + ' (עבור)'}>
          <TextInput value={f.forWho} onChange={set('forWho')} placeholder="מלגות, פעילות, כללי…" />
          {/* בקשת-בעלים 15.8 ("פר תורם"): הייעוד-שעל-הכרטיס הוא מסנן-ההרשאה
              פר-עובד/ת. צ'יפים של הייעודים הקיימים + רמז, רק כשהיכולת דלוקה. */}
          {featureOn(config, 'supporters.purpose') && (
            <>
              {(() => {
                const known = allDonationPurposes(useApp.getState().db.supporters).filter((p) => p !== f.forWho);
                return known.length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {known.slice(0, 8).map((p) => (
                      <button key={p} type="button" className="chip" onClick={() => set('forWho')(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 }}>
                🔐 הייעוד קובע אילו עובדות רואות את התורם/ת — עובדת מוגבלת רואה רק את הייעוד שהוקצה לה (ריק = משותף, גלוי לכולן).
              </div>
            </>
          )}
        </Field>
        <Field label="הערות">
          <TextInput value={f.notes} onChange={set('notes')} />
        </Field>
      </div>

      {/* ריבוי-טלפונים (בקשת-שטח) — וואטסאפ/בית/עבודה, כל אחד עם תווית והערה "ממי זה" */}
      <div style={{ marginTop: 12, borderTop: '1px solid var(--line, #e6ddce)', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>📞 טלפונים נוספים</span>
          <Btn sm onClick={addPhone}>➕ הוסף טלפון</Btn>
        </div>
        {phones.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink-faint, #8a8378)' }}>אפשר להוסיף וואטסאפ, בית, עבודה — עם הערה ממי המספר.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {phones.map((p, i) => {
              const reg = p.num ? phoneRegion(p.num) : null;
              return (
                <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                    <TextInput value={p.num} onChange={(v) => setPhone(i, { num: v })} dir="ltr" placeholder="מספר" ariaLabel="מספר טלפון נוסף" />
                  </div>
                  <div style={{ flex: '0 1 110px' }}>
                    <TextInput value={p.label ?? ''} onChange={(v) => setPhone(i, { label: v })} placeholder="תווית (בית/עבודה)" ariaLabel="תווית" />
                  </div>
                  <div style={{ flex: '1 1 130px', minWidth: 110 }}>
                    <TextInput value={p.note ?? ''} onChange={(v) => setPhone(i, { note: v })} placeholder="ממי זה" ariaLabel="ממי המספר" />
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={!!p.wa} onChange={(e) => setPhone(i, { wa: e.target.checked })} /> 💬 וואטסאפ
                  </label>
                  {reg && (
                    <span style={{ fontSize: 11, color: reg === 'intl' ? '#a5651a' : '#2f7d52', fontWeight: 700 }}>{reg === 'intl' ? '🌍 חו"ל' : '🇮🇱 ישראל'}</span>
                  )}
                  <button type="button" onClick={() => removePhone(i)} aria-label="הסר מספר" title="הסר" style={{ cursor: 'pointer', border: 0, background: 'transparent', fontSize: 15 }}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירה
        </Btn>
        <Btn onClick={() => props.onClose()}>ביטול</Btn>
      </div>
    </Modal>
  );
}
