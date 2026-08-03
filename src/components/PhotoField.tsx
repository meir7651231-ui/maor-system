/**
 * שדה-תמונה לישויות (פיצ'ר גלריה, הכרעת בעלים "כל מה שצריך תמונה — חוגים,
 * מוצרים וכו'"). מציג תצוגה-מקדימה, כפתור העלאה (בחירת-קובץ → כיווץ ל-thumbnail
 * דרך pickAndCompressImage) והסרה. הערך = data URL (JPEG מכווץ) או undefined.
 * שימוש חוזר בכל טופס-ישות; אין תלות ב-store (מקבל value/onChange).
 */
import { useRef, useState } from 'react';
import { Btn, Field } from './ui';
import { pickAndCompressImage } from '../lib/imagePick';

export function PhotoField(props: {
  label?: string;
  value: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // מאפשר בחירה חוזרת של אותו קובץ
    if (!file) return;
    setErr('');
    setBusy(true);
    try {
      props.onChange(await pickAndCompressImage(file));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'העלאת התמונה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={props.label ?? 'תמונה'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {props.value ? (
          <img
            src={props.value}
            alt="תצוגה מקדימה"
            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }}
          />
        ) : (
          <div
            style={{
              width: 56, height: 56, borderRadius: 8, border: '1px dashed var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', fontSize: 20,
            }}
          >
            🖼️
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void onFile(e)} />
        <Btn sm type="button" onClick={() => inputRef.current?.click()}>
          {busy ? 'מעלה…' : props.value ? 'החלף תמונה' : '📷 העלה תמונה'}
        </Btn>
        {props.value && (
          <Btn sm type="button" onClick={() => props.onChange(undefined)}>
            הסר
          </Btn>
        )}
      </div>
      {err && <div style={{ color: 'var(--danger, #b23)', fontSize: 12, marginTop: 4 }}>{err}</div>}
    </Field>
  );
}
