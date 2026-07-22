/**
 * הגדרות ← ערכת נושא — בחירת אחת מארבע ערכות + דריסת צבע הדגשה ארגוני.
 * הבחירה נשמרת ב-db.ui (theme/accent) ולכן נכללת בגיבוי; ההחלה על ה-DOM
 * נעשית ב-store (applyTheme) — כאן רק תצוגה ופעולות.
 */
import { useApp } from '../../store/useApp';
import { Btn } from '../ui';
import { Section, SectionNote } from './lib';

interface ThemeDef {
  key: string;
  name: string;
  desc: string;
  bg: string;
  panel: string;
  accent: string;
  nav: string;
  ink: string;
}

const THEMES: ThemeDef[] = [
  {
    key: 'or-rishon',
    name: 'אור ראשון',
    desc: 'שמנת וזהב — המראה הקלאסי',
    bg: '#f6f3ec',
    panel: '#fffdf8',
    accent: '#f3c76b',
    nav: '#211d17',
    ink: '#2e2c26',
  },
  {
    key: 'heichal',
    name: 'היכל',
    desc: 'כהה ויוקרתי, זהב על שחור',
    bg: '#12100c',
    panel: '#1b1812',
    accent: '#e9bd63',
    nav: '#0b0906',
    ink: '#f2ead8',
  },
  {
    key: 'tsohar',
    name: 'צֹהַר',
    desc: 'בהיר ונקי, טורקיז עסקי',
    bg: '#faf9f7',
    panel: '#ffffff',
    accent: '#0e7a6c',
    nav: '#ffffff',
    ink: '#1c1a17',
  },
  {
    key: 'kehila',
    name: 'קהילה',
    desc: 'חם ומשחקי, פינות מעוגלות',
    bg: '#fdf8ef',
    panel: '#ffffff',
    accent: '#178f80',
    nav: 'linear-gradient(180deg, #1a9c8b 0%, #0e6f63 100%)',
    ink: '#26221c',
  },
];

function ThemeCard(props: { def: ThemeDef; active: boolean; onPick: () => void }) {
  const d = props.def;
  return (
    <button
      type="button"
      onClick={props.onPick}
      aria-pressed={props.active}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: 160,
        padding: 8,
        textAlign: 'right',
        borderRadius: 12,
        border: props.active ? '2px solid var(--accent-deep)' : '1px solid var(--line)',
        background: 'var(--panel)',
        boxShadow: props.active ? 'var(--shadow)' : 'none',
      }}
    >
      {/* תצוגה מוקדמת זעירה: פס ניווט + רקע + פאנל + נקודת הדגשה */}
      <span
        aria-hidden
        style={{
          display: 'flex',
          height: 58,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--line)',
        }}
      >
        <span style={{ width: 20, flexShrink: 0, background: d.nav }} />
        <span style={{ flex: 1, background: d.bg, padding: 6 }}>
          <span
            style={{
              display: 'block',
              height: 16,
              borderRadius: 4,
              background: d.panel,
              border: '1px solid rgba(128, 128, 128, 0.25)',
            }}
          />
          <span
            style={{
              display: 'inline-block',
              width: 13,
              height: 13,
              borderRadius: '50%',
              background: d.accent,
              marginTop: 6,
            }}
          />
          <span
            style={{
              display: 'inline-block',
              width: 34,
              height: 5,
              borderRadius: 3,
              background: d.ink,
              opacity: 0.55,
              margin: '0 6px 3px 0',
            }}
          />
        </span>
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
        {props.active ? '✓ ' : ''}
        {d.name}
      </span>
      <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{d.desc}</span>
    </button>
  );
}

export function ThemeSection() {
  const uiTheme = useApp((s) => s.db.ui.theme);
  const uiAccent = useApp((s) => s.db.ui.accent);
  const config = useApp((s) => s.config);
  const setTheme = useApp((s) => s.setTheme);
  const setAccent = useApp((s) => s.setAccent);
  const toast = useApp((s) => s.toast);

  const activeKey = uiTheme ?? config.theme;
  const activeDef = THEMES.find((t) => t.key === activeKey) ?? THEMES[0];
  const accent = uiAccent ?? config.accent ?? activeDef.accent;
  const customized = !!(uiAccent ?? config.accent);

  return (
    <Section id="sec-theme" title="🎨 ערכת נושא" sub="המראה נשמר בנתונים ונכלל בקובץ הגיבוי">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {THEMES.map((t) => (
          <ThemeCard
            key={t.key}
            def={t}
            active={t.key === activeKey}
            onPick={() => {
              setTheme(t.key);
              toast(`ערכת הנושא "${t.name}" הוחלה ✓`);
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <label htmlFor="org-accent" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
          צבע הדגשה מותאם (לוגו הארגון)
        </label>
        <input
          id="org-accent"
          type="color"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          style={{ width: 46, height: 32, padding: 2, cursor: 'pointer', flexShrink: 0 }}
        />
        <Btn
          sm
          disabled={!customized}
          onClick={() => {
            setAccent(undefined);
            toast('צבע ההדגשה חזר לצבע הערכה');
          }}
        >
          איפוס צבע
        </Btn>
      </div>
      <SectionNote>
        צבע ההדגשה דורס את צבע הערכה הנבחרת (כפתורים, סימון פעיל בניווט) — שימושי להתאמה למיתוג
        הארגון.
      </SectionNote>
    </Section>
  );
}
