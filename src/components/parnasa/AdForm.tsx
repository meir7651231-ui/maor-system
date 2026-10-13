/**
 * 📒 פרנסה׳לע — טופס משבצת-פרסום / חסות (אשכול 5). משבצת: מודעה בחוברת (עמוד/חצי/קטנה) · חסות על
 * שער-מקצוע · שורת-חסות בלוח. המחיר נטען מהמחירון (priceOf) עד שנוגעים בו. **רישום בלבד — לא קבלה**:
 * התשלום בקישור-הסליקה של הארגון (payLink, מגודר-הרחבה), וסימון "שולם" ידני (הכרעה 4).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import type { PrAd, PrAdKind, PrAdSlot, PrPriceKey } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { OrbitLayer } from './skin';
import { adDraftError, PR_CATEGORIES, priceOf } from './lib';
import { PR_AD_KIND_LABELS, PR_AD_SLOT_LABELS } from './labels';

export function emptyPrAd(slot: PrAdSlot = 'booklet'): PrAd {
  return {
    id: '', slot, kind: slot === 'booklet' ? 'half' : 'line', target: '', advertiser: '', headline: '', body: '', phone: '', from: '', to: '',
    price: 0, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '',
  };
}

/** מפתח-המחירון למשבצת/גודל. */
export function priceKeyOf(slot: PrAdSlot, kind: PrAdKind): PrPriceKey {
  if (slot === 'category') return 'sponsor';
  if (slot === 'board') return 'board';
  return kind === 'full' || kind === 'small' ? kind : 'half';
}

export function AdForm(props: { ad: PrAd | null; slot?: PrAdSlot; target?: string; onClose: () => void }) {
  const config = useApp((s) => s.config);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrAd = useApp((s) => s.upsertPrAd);
  const toast = useApp((s) => s.toast);
  const base = props.ad;
  const [f, setF] = useState<PrAd>(() => {
    if (base) return { ...base };
    const a = emptyPrAd(props.slot ?? 'booklet');
    return { ...a, target: props.target ?? '', price: priceOf(prefs, priceKeyOf(a.slot, a.kind)) };
  });
  const [priceTouched, setPriceTouched] = useState(!!base);
  const [priceText, setPriceText] = useState(() => String(f.price));
  const [error, setError] = useState('');

  const word = termOf(config, 'entity.prAd', 'פרסומת');
  const set = (patch: Partial<PrAd>) => setF((x) => ({ ...x, ...patch }));

  function setSlotKind(slot: PrAdSlot, kind: PrAdKind) {
    const k: PrAdKind = slot === 'booklet' ? (kind === 'line' ? 'half' : kind) : 'line';
    const patch: Partial<PrAd> = { slot, kind: k, target: slot === f.slot ? f.target : '' };
    if (!priceTouched) {
      patch.price = priceOf(prefs, priceKeyOf(slot, k));
      setPriceText(String(patch.price));
    }
    set(patch);
  }

  function save() {
    const price = Number(priceText.trim());
    const draft: PrAd = { ...f, price: Number.isFinite(price) ? price : NaN, advertiser: f.advertiser.trim(), headline: f.headline.trim(), body: f.body.trim(), phone: f.phone.trim() };
    // תוספות-העיצוב (אתר · מטבע-פלטינה · מונוגרמה) — ריק ⇒ חסר (בלי שדות-ריקים ברשומה)
    const url = (f.url ?? '').trim();
    const mono = (f.mono ?? '').trim();
    draft.url = url && f.slot !== 'booklet' ? url : undefined;
    draft.coin = f.slot === 'category' && f.coin ? true : undefined;
    draft.mono = draft.coin && mono ? mono : undefined;
    const err = adDraftError(draft);
    if (err) return setError(err);
    const res = upsertPrAd(draft);
    if (!res.ok) return;
    toast(base ? 'ה' + word + ' עודכנה' : 'ה' + word + ' נשמרה');
    props.onClose();
  }

  return (
    <OrbitLayer>
    <Modal title={(base ? '✎ עריכת ' : '➕ הוספת ') + word} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="משבצת">
          <Select
            value={f.slot}
            onChange={(v) => setSlotKind(v as PrAdSlot, f.kind)}
            options={(Object.keys(PR_AD_SLOT_LABELS) as PrAdSlot[]).map((s) => ({ value: s, label: PR_AD_SLOT_LABELS[s] }))}
          />
        </Field>
        {f.slot === 'booklet' && (
          <Field label="גודל">
            <Select
              value={f.kind}
              onChange={(v) => setSlotKind('booklet', v as PrAdKind)}
              options={(['full', 'half', 'small'] as const).map((k) => ({ value: k, label: PR_AD_KIND_LABELS[k] + ' · ' + priceOf(prefs, k) + ' ₪' }))}
            />
          </Field>
        )}
        {f.slot === 'category' && (
          <Field label={f.coin ? 'התחום שהמטבע פותח *' : 'השער שבחסות *'}>
            <Select
              value={f.target}
              onChange={(v) => set({ target: v })}
              options={[{ value: '', label: 'בחרו שער…' }, ...PR_CATEGORIES.map((c) => ({ value: c.key, label: c.num + ' · ' + c.icon + ' ' + c.name }))]}
            />
          </Field>
        )}
        <Field label="המפרסם *">
          <TextInput value={f.advertiser} onChange={(v) => set({ advertiser: v.slice(0, 60) })} />
        </Field>
        <Field label={f.slot === 'booklet' ? 'כותרת המודעה' : 'שורה קצרה'}>
          <TextInput value={f.headline} onChange={(v) => set({ headline: v.slice(0, f.slot === 'booklet' ? 60 : 70) })} />
        </Field>
        <Field label="טלפון">
          <TextInput value={f.phone} onChange={(v) => set({ phone: v.slice(0, 20) })} dir="ltr" />
        </Field>
        {f.slot !== 'booklet' && (
          <Field label="אתר (רשות)">
            <TextInput value={f.url ?? ''} onChange={(v) => set({ url: v.slice(0, 120) })} dir="ltr" />
          </Field>
        )}
        {f.slot === 'category' && f.coin && (
          <Field label="מונוגרמה (שתי אותיות על המטבע)">
            <TextInput value={f.mono ?? ''} onChange={(v) => set({ mono: v.slice(0, 3) })} placeholder="למשל ש״מ" />
          </Field>
        )}
        <Field label="מתאריך (ריק = מיד)">
          <input type="date" dir="ltr" value={f.from} onChange={(e) => set({ from: e.target.value })} />
        </Field>
        <Field label="עד תאריך (ריק = עד שיבוטל)">
          <input type="date" dir="ltr" value={f.to} onChange={(e) => set({ to: e.target.value })} />
        </Field>
        <Field label="מחיר (₪)">
          <TextInput
            value={priceText}
            onChange={(v) => {
              setPriceTouched(true);
              setPriceText(v.replace(/[^\d.]/g, ''));
            }}
            dir="ltr"
          />
        </Field>
      </div>
      {f.slot === 'booklet' && (
        <Field label="נוסח המודעה">
          <textarea rows={4} value={f.body} onChange={(e) => set({ body: e.target.value.slice(0, 400) })} />
        </Field>
      )}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13.5, margin: '6px 0' }}>
        {f.slot === 'category' && (
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={!!f.coin} onChange={(e) => set({ coin: e.target.checked })} />
            מטבע פלטינה בחסות (בדף הבית, במקום חסות על השער)
          </label>
        )}
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={f.paid} onChange={(e) => set({ paid: e.target.checked })} />
          שולם
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} />
          פעילה
        </label>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>💳 רישום בלבד — התשלום בקישור-הסליקה של הארגון; אין כאן קבלה ואין נגיעה בתרומות.</div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירה
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
    </OrbitLayer>
  );
}
