/**
 * באנר "מערכת ריקה" — מוצג מ-App כשאין משפחות (גם אחרי איפוס מלא).
 * שלוש דרכים למלא את המערכת:
 *  1. טעינת נתוני דמו בלחיצה (מושך את public/demo.json הארוז).
 *  2. בחירת קובץ גיבוי מהמחשב.
 *  3. גרירה-ושחרור של קובץ לכאן.
 * כולן עוברות דרך parseBackupFile ← restoreDb.
 */
import { useRef, useState, type DragEvent } from 'react';
import { useApp } from '../store/useApp';
import { parseBackupFile } from '../store/persist';
import { Btn } from './ui';

export function DemoDrop() {
  const restoreDb = useApp((s) => s.restoreDb);
  const toast = useApp((s) => s.toast);
  const [over, setOver] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    try {
      restoreDb(parseBackupFile(await file.text()));
    } catch (e) {
      toast('⚠ ' + (e instanceof Error ? e.message : 'טעינת הקובץ נכשלה'));
    }
  }

  async function loadDemo() {
    if (loadingDemo) return;
    setLoadingDemo(true);
    try {
      // נתיב יחסי — עובד גם תחת תת-נתיב פריסה (base: './')
      const res = await fetch(`${import.meta.env.BASE_URL}demo.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error('קובץ הדמו לא נמצא');
      restoreDb(parseBackupFile(await res.text()));
      toast('נתוני הדמו נטענו — אפשר להתנסות בחופשיות ✓');
    } catch (e) {
      toast('⚠ טעינת הדמו נכשלה — ' + (e instanceof Error ? e.message : 'נסו שוב'));
    } finally {
      setLoadingDemo(false);
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
      <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 200 }}>
        המערכת ריקה — התחילו כאן
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: 'var(--ink-faint)', marginTop: 2 }}>
          טענו נתוני דמו להתנסות, או שחזרו קובץ גיבוי (גם בגרירה לכאן).
        </span>
      </span>
      <Btn kind="primary" sm onClick={() => void loadDemo()} disabled={loadingDemo}>
        {loadingDemo ? 'טוען…' : '📊 טעינת נתוני דמו'}
      </Btn>
      <Btn sm onClick={() => fileRef.current?.click()}>
        בחירת קובץ גיבוי…
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
