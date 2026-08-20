/**
 * פלטת-הפיקוד (קופיילוט ⌘K) — תצוגה בלבד מעל מנוע `commands.ts`.
 * חיפוש + ניווט-מקלדת (↑↓ Enter Esc); הרצת-פקודה מוחזרת ל-host דרך onRun.
 */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { Modal } from '../ui';
import { buildCommands, filterCommands, type Command, type CommandContext } from './commands';

const GROUP_C: Record<Command['group'], { bg: string; c: string }> = {
  ניווט: { bg: 'var(--info-bg, #e8eefb)', c: 'var(--info, #1d4ed8)' },
  פעולה: { bg: 'var(--accent-soft, #fbeecb)', c: 'var(--accent-deep, #a05008)' },
  תורם: { bg: 'var(--good-bg, #e7f2e8)', c: 'var(--good, #2e7d32)' },
};

export function CommandPalette(props: {
  ctx: CommandContext;
  onRun: (cmd: Command) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const all = useMemo(() => buildCommands(props.ctx), [props.ctx]);
  const results = useMemo(() => filterCommands(all, q, 12), [all, q]);

  const idx = Math.min(active, Math.max(0, results.length - 1));

  const run = (c: Command | undefined) => {
    if (!c) return;
    props.onRun(c);
    props.onClose();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[idx]);
    }
  };

  return (
    <Modal title="⌘ בקש והמערכת תעשה" onClose={props.onClose}>
      <input
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKey}
        placeholder="חיפוש פעולה או תורם…  (למשל: ייבוא · חלון העבודה · שם-תורם)"
        aria-label="חיפוש פקודה"
        style={{
          width: '100%',
          padding: '11px 14px',
          fontSize: 15,
          borderRadius: 12,
          border: '1.5px solid var(--accent, #e6c98c)',
          background: 'var(--panel, #fffdf8)',
          color: 'var(--ink)',
          fontFamily: 'inherit',
        }}
      />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 360, overflowY: 'auto' }}>
        {results.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-faint)' }}>
            אין התאמה — נסו מילה אחרת
          </div>
        ) : (
          results.map((c, i) => {
            const gc = GROUP_C[c.group];
            return (
              <button
                key={c.id}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  textAlign: 'start',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid ' + (i === idx ? 'var(--accent, #e6c98c)' : 'transparent'),
                  background: i === idx ? 'var(--panel-2, #faf6ec)' : 'transparent',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'var(--ink)',
                }}
              >
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14.5 }}>
                  {c.label}
                  {c.hint ? <span style={{ color: 'var(--ink-faint)', fontWeight: 400, fontSize: 12.5 }}>{' · ' + c.hint}</span> : null}
                </span>
                <span
                  style={{
                    flex: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: '2px 9px',
                    background: gc.bg,
                    color: gc.c,
                  }}
                >
                  {c.group}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
