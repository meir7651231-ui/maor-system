/**
 * לוח-חתימה על-מסך (INTEGRATIONS גל ג׳, הרחבת `esign`) — canvas בבנייה עצמית,
 * אפס ספק חיצוני: המקבל/ת חותם/ת באצבע/עכבר, נשמר dataURL JPEG קטן (q0.7,
 * תקרה ~40KB — לא מנפחים את ה-DB/ענן). כנות-תווית: "חתימה על מסך", לא חתימה
 * מאושרת-משפטית של ספק-חתימות.
 */
import { useEffect, useRef, useState } from 'react';
import { Btn, Modal } from './ui';

const MAX_DATAURL = 40_000; // ~40KB — חתימה על canvas 400×160 ב-JPEG קטנה בהרבה

export function SignaturePad(props: { title: string; onSave: (dataUrl: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#1a2b4a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setDirty(true);
  };
  const up = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    setDirty(false);
    setErr('');
  };

  const save = () => {
    if (!dirty) return setErr('חסרה חתימה — חתמו על הלוח או דלגו');
    const url = canvasRef.current!.toDataURL('image/jpeg', 0.7);
    if (url.length > MAX_DATAURL) return setErr('החתימה מורכבת מדי — נקו ונסו שוב');
    props.onSave(url);
  };

  return (
    <Modal title={props.title} onClose={props.onClose}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
        חתימה על מסך (אצבע/עכבר) — נשמרת על רשומת-המסירה. אפשר לדלג.
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={160}
        style={{ width: '100%', maxWidth: 420, border: '1.5px dashed var(--line)', borderRadius: 10, background: '#fff', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />
      {err && <div style={{ color: 'var(--danger, #b3362a)', fontSize: 12.5, marginTop: 6 }}>{err}</div>}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>✍️ שמירת חתימה</Btn>
        <Btn onClick={clear}>ניקוי</Btn>
        <Btn onClick={props.onClose}>דילוג</Btn>
      </div>
    </Modal>
  );
}
