/**
 * באנר "מערכת ריקה" — מוצג מ-App כשאין משפחות (גם אחרי איפוס מלא).
 * טעינת קובץ גיבוי/דמו בגרירה-ושחרור או בבחירת קובץ, דרך parseBackupFile ← restoreDb.
 */
import { useRef, useState, type DragEvent } from 'react';
import { useApp } from '../store/useApp';
import { parseBackupFile } from '../store/persist';
import { Btn } from './ui';

export function DemoDrop() {
  const restoreDb = useApp((s) => s.restoreDb);
  const toast = useApp((s) => s.toast);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    try {
      restoreDb(parseBackupFile(await file.text()));
    } catch (e) {
      toast('⚠ ' + (e instanceof Error ? e.message : 'טעינת הקובץ נכשלה'));
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div
      className="no-print"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 18px',
        marginBottom: 18,
        borderRadius: 'var(--radius)',
        border: '2px dashed ' + (over ? 'var(--accent-deep)' : 'var(--line)'),
        background: over ? 'var(--hover-bg)' : 'var(--panel)',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{ fontSize: 22 }} aria-hidden>
        📂
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 220 }}>
        מערכת ריקה — גררו קובץ גיבוי/דמו לכאן או בחרו קובץ
      </span>
      <Btn sm onClick={() => fileRef.current?.click()}>
        בחירת קובץ…
      </Btn>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        aria-label="בחירת קובץ גיבוי או דמו"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
