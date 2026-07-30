/**
 * פאנל קריטריוני הזכאות (חנות 4, מאחורי shop.criteria) — מתקפל בתחתית
 * הקטלוג: שם + אחוז הנחה, עם כפתורי הוספה-מהירה לשתי הדוגמאות של הבעלים
 * ("יתום מאם" / "יתום מאבא" — ממלאים את הטופס, לא שומרים לבד; הכרעה 4).
 * מחיקת קריטריון מנקה אותו מכל השיוכים.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { ShopCriterion } from '../../types/domain';
import { Btn, Field, FormError, TextInput } from '../ui';
import { useArmed } from '../useArmed';

const QUICK_FILL = [
  { name: 'יתום מאם', pct: '50' },
  { name: 'יתום מאבא', pct: '50' },
];

export function CriteriaPanel() {
  const criteria = useApp((s) => s.db.shopCriteria);
  const config = useApp((s) => s.config);
  const upsertShopCriterion = useApp((s) => s.upsertShopCriterion);
  const deleteShopCriterion = useApp((s) => s.deleteShopCriterion);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const term = termOf(config, 'entity.shopCriterion', 'קריטריון');

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', pct: '', notes: '' });
  const [error, setError] = useState('');

  function startEdit(c: ShopCriterion) {
    setEditId(c.id);
    setF({ name: c.name, pct: String(c.discountPct), notes: c.notes });
  }
  function save() {
    if (!f.name.trim()) return setError('שם ה' + term + ' הוא שדה חובה');
    const pct = f.pct.trim() === '' ? 0 : +f.pct;
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return setError('אחוז ההנחה חייב להיות בין 0 ל-100');
    upsertShopCriterion({ id: editId ?? '', name: f.name.trim(), discountPct: Math.round(pct), notes: f.notes.trim() });
    toast(editId ? 'ה' + term + ' עודכן' : '"' + f.name.trim() + '" נוסף לרשימת ה' + term + 'ים');
    setEditId(null);
    setF({ name: '', pct: '', notes: '' });
    setError('');
  }
  function remove(c: ShopCriterion) {
    if (!confirmTwice('shc-' + c.id, 'למחוק את "' + c.name + '"? יוסר מכל השיוכים')) return;
    deleteShopCriterion(c.id);
    toast('"' + c.name + '" הוסר מכל השיוכים');
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, padding: 0 }}
        aria-expanded={open}
      >
        {(open ? '▼' : '◀') + ' 🎯 ' + term + 'י זכאות (' + criteria.length + ')'}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {criteria.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 700 }}>{c.name}</span>
              <span style={{ fontSize: 12.5 }}>{'הנחה ' + c.discountPct + '%'}</span>
              {c.notes && <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{c.notes}</span>}
              <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                <Btn sm onClick={() => startEdit(c)}>✏️</Btn>
                <Btn sm kind="danger" onClick={() => remove(c)}>{armed === 'shc-' + c.id ? 'שוב למחיקה' : '🗑'}</Btn>
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0 4px' }}>
            {QUICK_FILL.map((q) => (
              <Btn key={q.name} sm onClick={() => { setEditId(null); setF({ name: q.name, pct: q.pct, notes: '' }); }}>
                {'⚡ ' + q.name}
              </Btn>
            ))}
          </div>
          <FormError error={error} />
          <div className="form-grid">
            <Field label={'שם ה' + term + ' *'}>
              <TextInput value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="יתום מאם" />
            </Field>
            <Field label="אחוז הנחה (0-100)">
              <TextInput value={f.pct} onChange={(v) => setF({ ...f, pct: v })} type="number" dir="ltr" placeholder="50" />
            </Field>
            <Field label="הערות">
              <TextInput value={f.notes} onChange={(v) => setF({ ...f, notes: v })} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn sm kind="primary" onClick={save}>{editId ? 'עדכון' : '➕ הוספת ' + termOf(config, 'entity.shopCriterion', 'קריטריון')}</Btn>
            {editId && <Btn sm onClick={() => { setEditId(null); setF({ name: '', pct: '', notes: '' }); }}>ביטול עריכה</Btn>}
          </div>
        </div>
      )}
    </div>
  );
}
