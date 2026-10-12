/**
 * 📒 פרנסה׳לע — טופס בקשת-תושב "מה צריך?" (אשכול 5, נוסח המקור §3.7). דחוף · בשקט · הצעת-עבודה.
 * זיהוי-רגישות (sensitiveTopic) מסמן "בשקט" אוטומטית (אלא אם נגעו בתיבה; לעולם לא להצעת-עבודה).
 * בקשה שקטה: פרטי-הפונה נשמרים **אצל הגבאי בלבד** — לעסקים מוצג רק הטקסט (businessView, נאכף במנוע).
 * השער מוצע מהמושג המוביל בטקסט (analyzeQuery), עד שבוחרים ידנית.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import type { PrRequest } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { analyzeQuery, categoryOf, PR_CATEGORIES, PR_CONCEPTS, requestRecipients, sensitiveTopic } from './lib';

export function emptyPrRequest(): PrRequest {
  return {
    id: '', text: '', category: '', area: '', urgent: false, quiet: false, job: false,
    requester: { name: '', phone: '' }, status: 'open', responses: [], createdAt: '', updatedAt: '',
  };
}

/** השער של המושג המוביל בטקסט ('' = לא זוהה). */
function suggestedCategory(text: string): string {
  const top = analyzeQuery(text).cons[0]?.k;
  return top ? (PR_CONCEPTS.find((c) => c.k === top)?.c ?? '') : '';
}

export function RequestForm(props: { request: PrRequest | null; draft?: Partial<PrRequest> | null; onClose: () => void; onSaved?: (r: PrRequest) => void }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const upsertPrRequest = useApp((s) => s.upsertPrRequest);
  const toast = useApp((s) => s.toast);
  const base = props.request;
  const [f, setF] = useState<PrRequest>(() => {
    const init: PrRequest = { ...emptyPrRequest(), ...base, ...props.draft };
    // טיוטה מ"לא מצאתי" — אותו זיהוי כמו בהקלדה: שער מהמושג המוביל, נושא רגיש ⇒ בשקט
    if (!base && init.text) {
      if (!init.category) init.category = suggestedCategory(init.text);
      if (!init.job && sensitiveTopic(init.text)) init.quiet = true;
    }
    return init;
  });
  const [catTouched, setCatTouched] = useState<boolean>(() => !!base || !!props.draft?.category);
  const [quietTouched, setQuietTouched] = useState<boolean>(!!base);
  const [error, setError] = useState('');

  const word = termOf(config, 'entity.prRequest', 'בקשה');
  const words = termOf(config, 'entity.prListings', 'עסקים');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const sens = f.job ? '' : sensitiveTopic(f.text);
  const set = (patch: Partial<PrRequest>) => setF((x) => ({ ...x, ...patch }));
  const recipients = f.category ? requestRecipients({ ...f, job: false }, listings).length : 0;
  const inCat = f.category ? listings.filter((l) => l.status === 'approved' && l.category === f.category).length : 0;

  function onText(text: string) {
    const t = text.slice(0, 600);
    const patch: Partial<PrRequest> = { text: t };
    if (!catTouched) patch.category = suggestedCategory(t);
    // נושא רגיש ⇒ "בשקט" אוטומטית (המקור), כל עוד לא נגעו בתיבה ולא הצעת-עבודה
    if (!quietTouched && !f.job) patch.quiet = !!sensitiveTopic(t);
    set(patch);
  }

  function save() {
    if (!f.text.trim()) return setError('כתבו מה צריך');
    const res = upsertPrRequest({ ...f, job: f.quiet ? false : f.job });
    if (!res.ok || !res.request) return;
    toast(res.request.quiet ? 'ה' + word + ' נשמרה בשקט — לעסקים בלי פרטי הפונה' : base ? 'ה' + word + ' עודכנה' : 'ה' + word + ' נשמרה ומנותבת לבעלי המקצוע בתחום');
    props.onSaved?.(res.request);
    props.onClose();
  }

  return (
    <Modal title={(base ? '✎ עריכת ' : '➕ הוספת ') + word} onClose={props.onClose}>
      <FormError error={error} />
      <Field label="מה אתם מחפשים? *">
        <textarea
          rows={3}
          value={f.text}
          onChange={(e) => onText(e.target.value)}
          placeholder="למשל: מחפש מלמד פרטי לגמרא לבן כיתה ז׳, פעמיים בשבוע בערב"
        />
      </Field>
      <div className="form-grid">
        <Field label="תחום">
          <Select
            value={f.category}
            onChange={(v) => {
              setCatTouched(true);
              set({ category: v });
            }}
            options={[{ value: '', label: 'לא משנה' }, ...PR_CATEGORIES.map((c) => ({ value: c.key, label: c.icon + ' ' + c.name }))]}
          />
        </Field>
        <Field label="אזור">
          <TextInput value={f.area} onChange={(v) => set({ area: v.slice(0, 60) })} placeholder="בני ברק" />
        </Field>
        <Field label="שם הפונה">
          <TextInput value={f.requester.name} onChange={(v) => set({ requester: { ...f.requester, name: v.slice(0, 60) } })} />
        </Field>
        <Field label="טלפון לחזרה (רשות)">
          <TextInput value={f.requester.phone} onChange={(v) => set({ requester: { ...f.requester, phone: v.slice(0, 20) } })} dir="ltr" placeholder="050-0000000" />
        </Field>
      </div>
      {f.category && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 6 }}>
          {'במדריך יש ' + inCat + ' ' + words + ' ב' + categoryOf(f.category).short + ' · ' + recipients + ' מהם מקבלים ניתוב ישיר (השאר — דרך ה' + gabbai + ')'}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, margin: '6px 0' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={f.urgent} onChange={(e) => set({ urgent: e.target.checked })} />
          דחוף (צריך היום)
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={f.quiet}
            onChange={(e) => {
              setQuietTouched(true);
              set({ quiet: e.target.checked, job: e.target.checked ? false : f.job });
            }}
          />
          בשקט (לא בלוח, בלי השם)
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={f.job}
            onChange={(e) => set({ job: e.target.checked, quiet: e.target.checked ? false : f.quiet })}
          />
          זו הצעת עבודה (מחפשים עובד)
        </label>
      </div>
      {sens && (
        <div style={{ fontSize: 12.5, border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px', marginBottom: 6 }}>
          {'זיהינו נושא רגיש (' + sens + '). '}
          {'לעסקים מוצג רק הטקסט — בלי שם ובלי טלפון; פרטי הפונה נשמרים אצל ה' + gabbai + ' בלבד.'}
        </div>
      )}
      {f.quiet && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          {'🔒 ' + word + ' בשקט: לא עוברת לכל הקהילה, ובסגירה ("נמצא") נמחקת יחד עם כל התשובות.'}
        </div>
      )}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {f.quiet ? 'שליחה בשקט' : 'שמירת ה' + word}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
