/**
 * 📒 פרנסה׳לע — ⚙ הגדרות המודול (אשכול 5; db.ui.parnasa — גבאי בלבד, נאכף גם ב-store): שם הקהילה ·
 * מצב-האישור · טלפון לפרסום · נוסחי-ההקדשה · מחירון · מיקום-הזמנים. הנוסח מהמקור (§3.9 "הגדרות").
 * המחירון = רישום והצעת-מחיר לטפסים בלבד — אין כאן סליקה ואין קבלות (הכרעה 4).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { integrationOn, termOf } from '../../lib/config';
import type { ParnasaPrefs, PrPriceKey } from '../../types/domain';
import { Btn, Field, Select, TextInput } from '../ui';
import { PR_PRICE_DEFAULTS } from './model';
import { requireApprovalOf } from './lib';
import { ZmanimLocationEditor } from './ZmanimLocationEditor';
import { PR_PRICE_LABELS } from './labels';

export function SettingsTab() {
  const config = useApp((s) => s.config);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const setParnasaPrefs = useApp((s) => s.setParnasaPrefs);
  const toast = useApp((s) => s.toast);
  const [f, setF] = useState(() => ({
    communityName: prefs?.communityName ?? '',
    requireApproval: requireApprovalOf(prefs),
    contactPhone: prefs?.contactPhone ?? '',
    dedication: prefs?.dedication ?? '',
    bookletDedication: prefs?.bookletDedication ?? '',
  }));
  const [prices, setPrices] = useState<Record<PrPriceKey, string>>(() => {
    const out = {} as Record<PrPriceKey, string>;
    for (const [k] of PR_PRICE_LABELS) out[k] = prefs?.prices?.[k] !== undefined ? String(prefs.prices[k]) : '';
    return out;
  });

  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const words = termOf(config, 'entity.prListings', 'עסקים');

  function save() {
    const p: Partial<Record<PrPriceKey, number>> = {};
    for (const [k] of PR_PRICE_LABELS) {
      const t = prices[k].trim();
      if (!t) continue;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 0) {
        toast('מחיר לא תקין: ' + t);
        return;
      }
      p[k] = n;
    }
    const patch: Partial<ParnasaPrefs> = {
      communityName: f.communityName.trim() || undefined,
      requireApproval: f.requireApproval ? undefined : false,
      contactPhone: f.contactPhone.trim() || undefined,
      dedication: f.dedication.trim() || undefined,
      bookletDedication: f.bookletDedication.trim() || undefined,
      prices: Object.keys(p).length ? p : undefined,
    };
    if (setParnasaPrefs(patch)) toast('ההגדרות נשמרו');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>כללי</h2>
        <div className="form-grid">
          <Field label="שם הקהילה / החסידות">
            <TextInput value={f.communityName} onChange={(v) => setF({ ...f, communityName: v.slice(0, 60) })} />
          </Field>
          <Field label="אישור כרטיסים">
            <Select
              value={f.requireApproval ? '1' : '0'}
              onChange={(v) => setF({ ...f, requireApproval: v === '1' })}
              options={[
                { value: '1', label: 'כרטיס חדש מופיע רק אחרי אישור' },
                { value: '0', label: 'כרטיס מופיע מיד' },
              ]}
            />
          </Field>
          <Field label="טלפון לפרסום ולחסויות (מוצג בחוברת)">
            <TextInput value={f.contactPhone} onChange={(v) => setF({ ...f, contactPhone: v.slice(0, 20) })} dir="ltr" />
          </Field>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          {'באישור דלוק — גם עריכת פרטים של ' + words + ' מאושרים ע״י מי שאינו ' + gabbai + ' מחזירה אותם ל"ממתין" (תיקון מול המקור, שם האישור היה חד-פעמי).'}
        </div>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>הקדשה</h2>
        <Field label="נוסח ההקדשה">
          <TextInput value={f.dedication} onChange={(v) => setF({ ...f, dedication: v.slice(0, 140) })} />
        </Field>
        <Field label="נוסח ההקדשה בחוברת (ריק = כמו ההקדשה)">
          <textarea rows={2} value={f.bookletDedication} onChange={(e) => setF({ ...f, bookletDedication: e.target.value.slice(0, 240) })} />
        </Field>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>מחירון (₪)</h2>
        <div className="form-grid">
          {PR_PRICE_LABELS.map(([k, label, unit]) => (
            <Field key={k} label={label + ' — ' + unit}>
              <TextInput value={prices[k]} onChange={(v) => setPrices({ ...prices, [k]: v.replace(/[^\d.]/g, '') })} dir="ltr" placeholder={String(PR_PRICE_DEFAULTS[k])} />
            </Field>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          {'רישום והצעת-מחיר לטפסים בלבד — אין כאן סליקה ואין קבלות' + (integrationOn(config, 'payments') ? '; התשלום — בקישור-הסליקה של הארגון.' : '.')}
        </div>
      </section>

      <div>
        <Btn kind="primary" onClick={save}>
          💾 שמירת ההגדרות
        </Btn>
      </div>

      <section className="card">
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>📍 מיקום הזמנים</h2>
        <ZmanimLocationEditor />
      </section>
    </div>
  );
}
