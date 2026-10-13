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
import { allDonationPurposes, cleanSupPhones, composeName, fixPhone } from './lib';
import { PhonesEditor } from '../PhonesEditor';

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
  const lastNameOn = featureOn(config, 'supporters.lastname'); // 🪪 שם פרטי/משפחה בנפרד (13.10)
  const [f, setF] = useState({
    name: sp?.name ?? '',
    firstName: sp?.firstName ?? '',
    lastName: sp?.lastName ?? '',
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
  // הקלדת שם-פרטי/משפחה ממלאת את השם-המלא **רק** כשהוא ריק או עדיין זהה לצירוף הקודם —
  // שם-מלא שהוקלד/יובא אחרת (למשל "כהן ישראל" מנדרים) לא נדרס בשקט (הוא מה שמודפס על הקבלה).
  const setSplit = (k: 'firstName' | 'lastName') => (v: string) =>
    setF((p) => {
      const next = { ...p, [k]: v };
      const follows = !p.name.trim() || p.name.trim() === composeName(p.firstName, p.lastName);
      return follows ? { ...next, name: composeName(next.firstName, next.lastName) } : next;
    });

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
    // 🪪 שם פרטי/משפחה — המפתחות נכתבים רק כשיש ערך (תורם בלי פיצול נשאר ביט-זהה; ניקוי ⇒ הסרה)
    const withSplit = (rec: Supporter): Supporter => {
      const { firstName: _f, lastName: _l, ...rest } = rec;
      const fn = f.firstName.trim();
      const ln = f.lastName.trim();
      return { ...rest, ...(fn ? { firstName: fn } : {}), ...(ln ? { lastName: ln } : {}) };
    };

    if (sp) {
      upsertSupporter(withSplit({ ...sp, ...vals }));
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
    upsertSupporter(withSplit({
      id,
      ...vals,
      count: 0,
      ils: 0,
      usd: 0,
      first: '',
      last: '',
      nextDate: '',
      donations: [],
    }));
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
        {lastNameOn && (
          <>
            <Field label="שם פרטי">
              <TextInput value={f.firstName} onChange={setSplit('firstName')} placeholder="ישראל" />
            </Field>
            <Field label="שם משפחה">
              <TextInput value={f.lastName} onChange={setSplit('lastName')} placeholder="כהן" />
            </Field>
          </>
        )}
        <Field label={lastNameOn ? 'שם מלא (מופיע על הקבלה) *' : 'שם מלא *'}>
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

      {/* ריבוי-טלפונים (בקשת-שטח) — וואטסאפ/בית/עבודה, כל אחד עם תווית והערה "ממי זה" (רכיב משותף עם משפחות) */}
      <PhonesEditor phones={phones} onChange={setPhones} />

      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירה
        </Btn>
        <Btn onClick={() => props.onClose()}>ביטול</Btn>
      </div>
    </Modal>
  );
}
