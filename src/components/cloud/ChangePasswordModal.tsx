/**
 * 🔑 שינוי סיסמה מתוך האפליקציה (איפוס-סיסמה 9.8) — למשתמש-ענן מחובר, מתפריט-
 * החשבון. אימות-מחדש עם הסיסמה הנוכחית (דרישת Firebase) ואז החלפה; הסשן נשאר
 * מחובר. מי ששכח את הנוכחית — "שכחתי סיסמה" במסך הכניסה שולח מייל איפוס.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Field, Modal, TextInput } from '../ui';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const cloudChangePassword = useApp((s) => s.cloudChangePassword);
  const toast = useApp((s) => s.toast);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy) return;
    if (!current) return setError('הזינו את הסיסמה הנוכחית');
    if (next.length < 6) return setError('הסיסמה החדשה קצרה מדי — לפחות 6 תווים');
    if (next !== next2) return setError('הסיסמה החדשה ואימותה אינם זהים');
    if (next === current) return setError('הסיסמה החדשה זהה לנוכחית');
    setBusy(true);
    setError('');
    try {
      await cloudChangePassword(current, next);
      toast('🔑 הסיסמה הוחלפה בהצלחה');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההחלפה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="🔑 שינוי סיסמה" onClose={onClose}>
      <Field label="סיסמה נוכחית">
        <TextInput value={current} onChange={setCurrent} type="password" dir="ltr" />
      </Field>
      <Field label="סיסמה חדשה (לפחות 6 תווים)">
        <TextInput value={next} onChange={setNext} type="password" dir="ltr" />
      </Field>
      <Field label="אימות הסיסמה החדשה">
        <TextInput value={next2} onChange={setNext2} type="password" dir="ltr" />
      </Field>
      {error && (
        <div role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>
          {error}
        </div>
      )}
      <div className="modal-actions">
        <Btn kind="primary" onClick={() => void save()} disabled={busy}>
          {busy ? 'מחליף…' : 'החלפת הסיסמה'}
        </Btn>
        <Btn onClick={onClose} disabled={busy}>ביטול</Btn>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
        שכחתם את הסיסמה הנוכחית? התנתקו ולחצו "שכחתי סיסמה" במסך הכניסה — יישלח מייל איפוס.
      </div>
    </Modal>
  );
}
