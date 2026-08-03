/**
 * 📖 המדריך המהיר — מודאל תוכן מהקובץ החי (P2 פער 29, legacy:2891-2913).
 * נפתח מהחיפוש המהיר או ב-#guide. גייט: shell.guide.
 * התוכן כולו ב-src/lib/guide.ts (טהור); כאן רק העטיפה הנגישה.
 */
import { useApp } from '../store/useApp';
import { moduleOn, termOf } from '../lib/config';
import {
  GUIDE_FOOT,
  GUIDE_INTRO,
  GUIDE_INTRO_LABEL,
  GUIDE_RECIPES_LABEL,
  guideRecipes,
  guideSections,
} from '../lib/guide';
import { Modal } from './ui';

export function GuideModal({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const sections = guideSections((m) => moduleOn(config, m), config);
  return (
    <Modal title="📖 המדריך המהיר" onClose={onClose}>
      <div
        style={{
          background: 'var(--ink)',
          color: '#f5f1e8',
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 12.5,
          lineHeight: 1.8,
          marginBottom: 12,
        }}
      >
        <b style={{ color: 'var(--gold, #f3c76b)' }}>{GUIDE_INTRO_LABEL}</b> {GUIDE_INTRO}
      </div>
      <div style={{ fontSize: 13, lineHeight: 2 }}>
        {sections.map((s) => (
          <div key={s.title}>
            <b style={{ color: 'var(--accent, #9a6414)' }}>
              {s.term ? termOf(config, s.term, s.title) : s.title}
            </b>
            {' — ' + s.text}
          </div>
        ))}
      </div>
      <div
        style={{
          background: 'var(--paper-soft, #faf6ec)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 12.5,
          lineHeight: 2,
          marginTop: 12,
        }}
      >
        <b style={{ color: 'var(--accent, #9a6414)' }}>{GUIDE_RECIPES_LABEL}</b>
        <br />
        {guideRecipes(config)}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>{GUIDE_FOOT}</div>
    </Modal>
  );
}
