/**
 * צירוף קבצים לחוג (בקשת-בעלים 13.8 א') — מסמכים/תמונות מוטמעים + קישורים.
 * store-agnostic: מקבל value: CourseFile[] ו-onChange. אחסון local-first:
 *  - תמונה ⇒ pickAndCompressImage (thumbnail JPEG).
 *  - מסמך ⇒ readFileAsDataUrl (תקרת 3MB — מגן על מכסת ה-localStorage).
 *  - קישור ⇒ https URL חיצוני (Drive/YouTube) — לסרטונים כבדים, בלי מגבלת-נפח.
 */
import { useState } from 'react';
import type { CourseFile } from '../../types/domain';
import { safeHttpsUrl } from '../../lib/config';
import { guardExport } from '../../lib/exportGate';
import { pickAndCompressImage, readFileAsDataUrl } from '../../lib/imagePick';
import { Btn, TextInput } from '../ui';

function fmtBytes(n: number | undefined): string {
  if (!n) return '';
  if (n < 1024) return n + 'B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + 'KB';
  return (n / 1024 / 1024).toFixed(1) + 'MB';
}

function newFileId(): string {
  return 'cf' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function iconOf(f: CourseFile): string {
  if (f.kind === 'link') return '🔗';
  if (f.kind === 'image') return '🖼️';
  if (f.mime?.includes('pdf')) return '📕';
  if (f.mime?.startsWith('video/')) return '🎬';
  if (f.mime?.startsWith('audio/')) return '🎵';
  return '📄';
}

export function CourseFilesField(props: { value: CourseFile[] | undefined; onChange: (files: CourseFile[]) => void }) {
  const files = props.value ?? [];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const add = (f: CourseFile) => props.onChange([...files, f]);
  const remove = (id: string) => props.onChange(files.filter((x) => x.id !== id));

  function onPick(file: File | undefined, image: boolean) {
    setErr('');
    if (!file) return;
    setBusy(true);
    const p = image ? pickAndCompressImage(file) : readFileAsDataUrl(file);
    void p
      .then((data) =>
        add({
          id: newFileId(),
          name: file.name || (image ? 'תמונה' : 'קובץ'),
          kind: image ? 'image' : 'file',
          data,
          mime: file.type || '',
          size: image ? undefined : file.size,
        }),
      )
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'טעינת הקובץ נכשלה'))
      .finally(() => setBusy(false));
  }

  function addLink() {
    setErr('');
    const url = safeHttpsUrl(linkUrl.trim());
    if (!url) return setErr('כתובת לא תקינה — נדרש https://…');
    add({ id: newFileId(), name: linkName.trim() || url, kind: 'link', data: url });
    setLinkName('');
    setLinkUrl('');
    setLinkOpen(false);
  }

  return (
    <div>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {files.map((f) => (
            <div
              key={f.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 8, padding: '5px 9px' }}
            >
              <span style={{ fontSize: 16 }}>{iconOf(f)}</span>
              <a href={f.data} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!guardExport()) e.preventDefault(); }} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                {f.name}
              </a>
              {f.size ? <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{fmtBytes(f.size)}</span> : null}
              <Btn sm kind="danger" onClick={() => remove(f.id)}>
                ✕
              </Btn>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex', fontSize: 13 }}>
          🖼️ תמונה…
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; onPick(file, true); }} />
        </label>
        <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex', fontSize: 13 }}>
          📄 מסמך…
          <input type="file" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; onPick(file, false); }} />
        </label>
        <Btn sm onClick={() => setLinkOpen((v) => !v)}>
          🔗 קישור (סרטון…)
        </Btn>
        {busy && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>טוען…</span>}
      </div>
      {linkOpen && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          <TextInput value={linkName} onChange={setLinkName} placeholder="שם (למשל: סרטון הדגמה)" />
          <TextInput value={linkUrl} onChange={setLinkUrl} dir="ltr" placeholder="https://… (YouTube / Drive)" />
          <Btn sm kind="primary" onClick={addLink}>
            הוספה
          </Btn>
        </div>
      )}
      {err && <div style={{ fontSize: 12, color: 'var(--danger, #c0392b)', marginTop: 6 }}>{err}</div>}
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 6 }}>
        מסמכים/תמונות נשמרים במכשיר (עד 3MB לקובץ) ונוסעים עם הגיבוי; לסרטונים כבדים — הוסיפו קישור.
      </div>
    </div>
  );
}
