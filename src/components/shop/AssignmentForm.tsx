/**
 * טופס שיוך מוצר למוטב (חנות 5) — מוצר, משפחה (datalist) → בן/בת רשות,
 * קריטריוני זכאות (checkboxes + "הנחה אפקטיבית: N%"), since, הערות.
 * מאחורי shop.inlinecreate: יצירת משפחה/בן-משפחה חדשים כרשומות CRM
 * אמיתיות (הכרעת בעלים 7 — upsertFamily/upsertMember הקיימים; תשתית
 * משותפת, לא זליגת נתוני-מודול; הדפוס הועתק מ-tzedaka/CoordinatorForm).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { emptyFamily, emptyMember, type ShopAssignment, type ShopAssignmentStatus } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';
import { itemOf, itemRemaining, maxDiscountPct } from './lib';

export function AssignmentForm(props: { assignment: ShopAssignment | null; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertShopAssignment = useApp((s) => s.upsertShopAssignment);
  const upsertFamily = useApp((s) => s.upsertFamily);
  const upsertMember = useApp((s) => s.upsertMember);
  const nextId = useApp((s) => s.nextId);
  const addShopWait = useApp((s) => s.addShopWait);
  const toast = useApp((s) => s.toast);
  const inlineOn = featureOn(config, 'shop.inlinecreate');
  const criteriaOn = featureOn(config, 'shop.criteria');
  const a = props.assignment;
  const term = termOf(config, 'entity.shopAssignment', 'שיוך');

  const [f, setF] = useState({
    productId: a?.productId ?? (db.shopProducts.find((p) => p.active)?.id ?? ''),
    famId: a?.famId ?? '',
    memberId: a?.memberId ?? '',
    criterionIds: a?.criterionIds ?? ([] as string[]),
    since: a?.since || isoToday(),
    status: a?.status ?? ('active' as ShopAssignmentStatus),
    notes: a?.notes ?? '',
  });
  const [famText, setFamText] = useState(db.families.find((x) => x.id === a?.famId)?.name ?? '');
  const [error, setError] = useState('');
  // הוספת לא-רשומים (shop.inlinecreate) — דפוס tzedaka/CoordinatorForm אחד-לאחד
  const [newFamOpen, setNewFamOpen] = useState(false);
  const [newFam, setNewFam] = useState({ name: '', phone: '', kind: 'supported' as 'donor' | 'supported' });
  const [newMemOpen, setNewMemOpen] = useState(false);
  const [newMem, setNewMem] = useState({ first: '', gender: 'm' as 'm' | 'f', isParent: false });

  const fam = db.families.find((x) => x.id === f.famId);
  const pct = maxDiscountPct(f.criterionIds, db.shopCriteria);

  function pickFamily(text: string) {
    setFamText(text);
    const hit = db.families.find((x) => x.name === text.trim());
    setF({ ...f, famId: hit?.id ?? '', memberId: '' });
  }

  function toggleCriterion(id: string) {
    setF({
      ...f,
      criterionIds: f.criterionIds.includes(id) ? f.criterionIds.filter((x) => x !== id) : [...f.criterionIds, id],
    });
  }

  function createFamily() {
    if (!newFam.name.trim()) return setError('שם ה' + termOf(config, 'entity.family', 'משפחה') + ' החדשה הוא שדה חובה');
    const id = nextId('f');
    upsertFamily({
      ...emptyFamily(),
      id,
      createdAt: isoToday(),
      name: newFam.name.trim(),
      phone: newFam.phone.trim(),
      // הסיווג נרשם בהערות הכרטיס — קריא לכל צוות המשרד
      notes: newFam.kind === 'donor' ? 'סווגה תורמת (חנות)' : 'סווגה נתמכת (חנות)',
    });
    setF({ ...f, famId: id, memberId: '' });
    setFamText(newFam.name.trim());
    setNewFamOpen(false);
    toast(termOf(config, 'entity.familyOf', 'משפחת') + ' ' + newFam.name.trim() + ' נוצרה במערכת וקושרה');
  }

  function createMember() {
    if (!f.famId) return setError('בחרו קודם ' + termOf(config, 'entity.family', 'משפחה'));
    if (!newMem.first.trim()) return setError('שם הילד/ההורה החדש הוא שדה חובה');
    const id = nextId('m');
    upsertMember(f.famId, {
      ...emptyMember(),
      id,
      first: newMem.first.trim(),
      gender: newMem.gender,
      ...(newMem.isParent ? { isParent: true } : {}),
    });
    setF({ ...f, memberId: id });
    setNewMemOpen(false);
    toast(newMem.first.trim() + ' נוסף/ה לכרטיס ה' + termOf(config, 'entity.family', 'משפחה') + ' וקושר/ה');
  }

  function save() {
    if (!f.productId) return setError('בחרו ' + termOf(config, 'entity.shopProduct', 'מוצר') + ' מהקטלוג');
    if (!f.famId) return setError('בחרו ' + termOf(config, 'entity.family', 'משפחה') + ' מהרשימה (או צרו חדשה)');
    upsertShopAssignment({
      id: a?.id ?? '',
      productId: f.productId,
      famId: f.famId,
      memberId: f.memberId,
      criterionIds: f.criterionIds,
      since: f.since,
      status: f.status,
      notes: f.notes.trim(),
      redemptions: a?.redemptions ?? [],
    });
    toast(a ? 'ה' + term + ' עודכן' : term + ' חדש נרשם');
    props.onClose();
  }

  // רשימת המתנה (SHOP6 חנות 27): רכיבי החבילה שאזל מלאם — הצעה אוטומטית
  const outOfStock = (db.shopProducts.find((p) => p.id === f.productId)?.components ?? [])
    .filter((c) => c.itemId && itemRemaining(db, c.itemId) === 0)
    .map((c) => itemOf(db, c));

  return (
    <Modal title={(a ? 'עריכת ' : '➕ הוספת ') + term} onClose={props.onClose}>
      <FormError error={error} />
      {!a && outOfStock.length > 0 && f.famId && (
        <div style={{ background: '#fdf1d4', color: '#9a6414', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>{'⚠ אזל המלאי: ' + outOfStock.map((i) => i.name).join(', ')}</span>
          <Btn
            sm
            onClick={() => {
              let added = 0;
              for (const i of outOfStock) if (addShopWait(i.itemId, f.famId, '')) added++;
              if (added) toast('נוספה לרשימת ההמתנה של ' + added + ' פריטים');
            }}
          >
            ⏳ להוסיף לרשימת ההמתנה?
          </Btn>
        </div>
      )}
      <div className="form-grid">
        <Field label={termOf(config, 'entity.shopProduct', 'מוצר') + ' *'}>
          <Select
            value={f.productId}
            onChange={(v) => setF({ ...f, productId: v })}
            options={[
              { value: '', label: '— בחירה —' },
              ...db.shopProducts.map((p) => ({ value: p.id, label: p.name + (p.active ? '' : ' (לא פעיל)') })),
            ]}
          />
        </Field>
        <Field label={termOf(config, 'entity.family', 'משפחה') + ' *'}>
          <input
            list="shop-assign-fam"
            value={famText}
            onChange={(e) => pickFamily(e.target.value)}
            placeholder={'הקלידו שם ' + termOf(config, 'entity.family', 'משפחה')}
          />
          <datalist id="shop-assign-fam">
            {db.families.map((x) => (
              <option key={x.id} value={x.name} />
            ))}
          </datalist>
        </Field>
        {fam && (
          <Field label={termOf(config, 'entity.member', 'בן/בת המשפחה') + ' (רשות)'}>
            <Select
              value={f.memberId}
              onChange={(v) => setF({ ...f, memberId: v })}
              options={[
                { value: '', label: 'כל ה' + termOf(config, 'entity.family', 'משפחה') },
                ...fam.members.map((m) => ({ value: m.id, label: m.first + (m.isParent ? ' (הורה)' : '') })),
              ]}
            />
          </Field>
        )}
        <Field label="מאז">
          <HebDateInput value={f.since} onChange={(v) => setF({ ...f, since: v })} />
        </Field>
        {a && (
          <Field label="סטטוס">
            <Select
              value={f.status}
              onChange={(v) => setF({ ...f, status: (v === 'done' || v === 'stopped' ? v : 'active') as ShopAssignmentStatus })}
              options={[
                { value: 'active', label: '▶ פעיל' },
                { value: 'done', label: '✅ הושלם' },
                { value: 'stopped', label: '⏸ הופסק' },
              ]}
            />
          </Field>
        )}
      </div>
      {criteriaOn && db.shopCriteria.length > 0 && (
        <Field label={termOf(config, 'entity.shopCriterion', 'קריטריון') + 'י זכאות'}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {db.shopCriteria.map((c) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                <input type="checkbox" checked={f.criterionIds.includes(c.id)} onChange={() => toggleCriterion(c.id)} />
                {c.name + ' (' + c.discountPct + '%)'}
              </label>
            ))}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>{'הנחה אפקטיבית: ' + pct + '%'}</div>
        </Field>
      )}
      {inlineOn && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <Btn sm onClick={() => setNewFamOpen((v) => !v)}>{'➕ ' + termOf(config, 'entity.family', 'משפחה') + ' חדשה'}</Btn>
          {fam && <Btn sm onClick={() => setNewMemOpen((v) => !v)}>➕ ילד/הורה חדש</Btn>}
        </div>
      )}
      {inlineOn && newFamOpen && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
          <div className="form-grid">
            <Field label={'שם ה' + termOf(config, 'entity.family', 'משפחה') + ' *'}>
              <TextInput value={newFam.name} onChange={(v) => setNewFam({ ...newFam, name: v })} />
            </Field>
            <Field label="טלפון">
              <TextInput value={newFam.phone} onChange={(v) => setNewFam({ ...newFam, phone: v })} dir="ltr" />
            </Field>
            <Field label="סיווג">
              <Select
                value={newFam.kind}
                onChange={(v) => setNewFam({ ...newFam, kind: v === 'donor' ? 'donor' : 'supported' })}
                options={[
                  { value: 'supported', label: '🤲 נתמכת' },
                  { value: 'donor', label: '💛 תורמת' },
                ]}
              />
            </Field>
          </div>
          <Btn sm kind="primary" onClick={createFamily}>יצירה וקישור</Btn>
        </div>
      )}
      {inlineOn && newMemOpen && fam && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
          <div className="form-grid">
            <Field label="שם פרטי *">
              <TextInput value={newMem.first} onChange={(v) => setNewMem({ ...newMem, first: v })} />
            </Field>
            <Field label="מגדר">
              <Select
                value={newMem.gender}
                onChange={(v) => setNewMem({ ...newMem, gender: v === 'f' ? 'f' : 'm' })}
                options={[
                  { value: 'm', label: 'בן' },
                  { value: 'f', label: 'בת' },
                ]}
              />
            </Field>
            <Field label="תפקיד">
              <Select
                value={newMem.isParent ? '1' : '0'}
                onChange={(v) => setNewMem({ ...newMem, isParent: v === '1' })}
                options={[
                  { value: '0', label: 'ילד/ה' },
                  { value: '1', label: 'הורה' },
                ]}
              />
            </Field>
          </div>
          <Btn sm kind="primary" onClick={createMember}>יצירה וקישור</Btn>
        </div>
      )}
      <Field label="הערות">
        <textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
