/**
 * אשף ההרכבה ברזולוציה מלאה — המסך של המטמיע בלבד (נפתח עם #builder בכתובת).
 *
 * זרימת העבודה: יושבים עם הלקוח, עוברים מסך-מסך (מקטע לכל מודול), מוסיפים /
 * מסירים יכולות ומשנים מונחים — וכל שינוי מוחל מיידית דרך setConfig, כך
 * שהלקוח רואה את המערכת שלו נולדת מולו. בסיום: "📦 צור חבילה" מוריד
 * config.json (כולל features + terms) + דף מסירה בעברית.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { clearConfigOverride } from '../../lib/config';
import { DEFAULT_CONFIG, type ModuleKey, type OrgConfig } from '../../types/config';
import { FEATURES, TERM_DEFS, type FeatureDef, type TermDef } from '../../types/features';
import { Btn, Chip, Field, FormError, TextInput } from '../ui';
import { buildHandoffHtml, downloadTextFile, INTEGRATION_LABELS, THEME_LABELS } from './handoff';
import { featureEffectiveOn, WIZARD_SECTIONS, type WizardSectionDef } from './sections';

const DEFAULT_APP_URL = 'https://meir7651231-ui.github.io/buildsmart/maor/';

/**
 * "פלטפורמה אחת — אלפי עמותות" (רצועת ה-white-label ממוקאפ צֹהַר):
 * ארבעה ארגוני הדגמה — לחיצה מלבישה שם+צבע+ערכה על המערכת החיה (patch),
 * כדי שהמטמיע יראה בפגישה את "המערכת מתלבשת" על הלקוח. הדגמה בלבד.
 */
const PLATFORM_DEMOS: {
  org: string;
  colorName: string;
  desc: string;
  accent: string;
  theme: string;
}[] = [
  { org: 'מאור החסד', colorName: 'ירוק צהר', desc: 'הארגון שלך', accent: '#0e7a6c', theme: 'tsohar' },
  { org: 'יד ביד ת״א', colorName: 'סגול רויאל', desc: 'ארגון חונכות', accent: '#8a3ffc', theme: 'tsohar' },
  { org: 'לב פתוח', colorName: 'אדום שני', desc: 'בית תמחוי', accent: '#b3362a', theme: 'tsohar' },
  { org: 'אופק לילדים', colorName: 'כחול עומק', desc: 'קרן מלגות', accent: '#1554b0', theme: 'tsohar' },
];

/**
 * חילוץ סלחני של קונפיגורציית Firebase מהטקסט שמדביקים מהקונסולה —
 * מקבל גם את קטע ה-JS (const firebaseConfig = {...}) וגם JSON נקי.
 * ארבעת שדות החובה: apiKey, authDomain, projectId, appId.
 */
function parseFirebaseSnippet(text: string): NonNullable<OrgConfig['firebase']> | null {
  const pick = (key: string): string | undefined => {
    const m = text.match(new RegExp(`["']?${key}["']?\\s*[:=]\\s*["']([^"']+)["']`));
    return m?.[1];
  };
  const apiKey = pick('apiKey');
  const authDomain = pick('authDomain');
  const projectId = pick('projectId');
  const appId = pick('appId');
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  const storageBucket = pick('storageBucket');
  const messagingSenderId = pick('messagingSenderId');
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    ...(storageBucket ? { storageBucket } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {}),
  };
}

/** slug לטיני מהשם — מספיק טוב כברירת מחדל, ניתן לעריכה ידנית. */
function suggestSlug(name: string): string {
  const map: Record<string, string> = {
    א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'ch', ט: 't',
    י: 'y', כ: 'k', ך: 'k', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's',
    ע: 'a', פ: 'p', ף: 'p', צ: 'tz', ץ: 'tz', ק: 'k', ר: 'r', ש: 'sh', ת: 't',
  };
  return name
    .split('')
    .map((ch) => map[ch] ?? (/[a-z0-9]/i.test(ch) ? ch.toLowerCase() : ' '))
    .join('')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30);
}

/* ————— רכיבי מקטע (ברמת המודול — יציבות פוקוס בשדות בזמן הקלדה) ————— */

/** מעטפת מקטע מתקפל: כותרת-כפתור (חץ + שם + ספירה) + טוגל-אב אופציונלי. */
function SectionShell(props: {
  emoji: string;
  title: string;
  meta?: string;
  open: boolean;
  onToggleOpen: () => void;
  headerEnd?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        border: '1px solid var(--line)',
        borderRadius: 10,
        marginBottom: 8,
        background: 'var(--panel)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px' }}>
        <button
          type="button"
          onClick={props.onToggleOpen}
          aria-expanded={props.open}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'start',
            fontSize: 13.5,
            fontWeight: 600,
            color: 'var(--ink)',
            padding: 2,
          }}
        >
          <span aria-hidden style={{ fontSize: 10, color: 'var(--ink-faint)', width: 10 }}>
            {props.open ? '▼' : '◀'}
          </span>
          <span>
            {props.emoji} {props.title}
          </span>
          {props.meta && (
            <span style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--ink-faint)' }}>{props.meta}</span>
          )}
        </button>
        {props.headerEnd}
      </div>
      {props.open && <div style={{ padding: '0 12px 10px' }}>{props.children}</div>}
    </section>
  );
}

/** שורת יכולת — checkbox + תווית + תיאור קטן. */
function FeatureRow(props: { f: FeatureDef; on: boolean; onToggle: (on: boolean) => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '5px 2px',
        fontSize: 13,
        cursor: 'pointer',
        borderTop: '1px solid var(--line-soft)',
      }}
    >
      <input
        type="checkbox"
        checked={props.on}
        onChange={(e) => props.onToggle(e.target.checked)}
        style={{ width: 'auto', marginTop: 2, accentColor: 'var(--accent-deep)' }}
      />
      <span style={{ lineHeight: 1.35 }}>
        <span style={{ color: 'var(--ink)' }}>{props.f.label}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>{props.f.desc}</span>
      </span>
    </label>
  );
}

/** שורת מונח — ✏️ + תווית + שדה שינוי-שם (placeholder = ברירת המחדל). */
function TermRow(props: { t: TermDef; value: string; onChange: (v: string) => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '3px 2px',
        fontSize: 12.5,
        color: 'var(--ink-soft)',
      }}
    >
      <span style={{ flex: '0 0 128px' }}>✏️ {props.t.label}</span>
      <input
        value={props.value}
        placeholder={props.t.fallback}
        onChange={(e) => props.onChange(e.target.value)}
        style={{ flex: 1, minWidth: 0, fontSize: 13, padding: '4px 8px' }}
      />
    </label>
  );
}

export function BuilderWizard({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const setConfig = useApp((s) => s.setConfig);
  const setTheme = useApp((s) => s.setTheme);
  const setAccent = useApp((s) => s.setAccent);
  const toast = useApp((s) => s.toast);
  const [appUrl, setAppUrl] = useState(DEFAULT_APP_URL);
  const [installer, setInstaller] = useState('מאיר — הקמת מערכות לעמותות');
  const [slugTouched, setSlugTouched] = useState(config.slug !== 'default');
  const [query, setQuery] = useState('');
  /** אילו מקטעים פתוחים — 'branding' פתוח כברירת מחדל, השאר מקופלים. */
  const [open, setOpen] = useState<Record<string, boolean>>({ branding: true });
  /** חיבור ענן: הטקסט שהודבק מקונסולת Firebase + שגיאת פענוח. */
  const [fbText, setFbText] = useState('');
  const [fbErr, setFbErr] = useState('');
  /** הדגמת הפלטפורמה: תצלום המיתוג שלפני ההדגמה — ל"החזרה" בלחיצה אחת. */
  const [demoPrev, setDemoPrev] = useState<{
    orgName: string;
    accent: string | undefined;
    theme: string;
  } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /**
   * עדכון קונפיגורציה חלקי — מוחל חי + נשמר כדריסת ריצה.
   * זהו צינור ה-live-apply היחיד: כל אינטראקציה (גם "סמן הכול" על מקטע שלם)
   * מזוקקת ל-patch() אחד = קריאת setConfig אחת = render + שמירה אחת.
   */
  const patch = (p: Partial<OrgConfig>) => setConfig({ ...config, ...p });

  const setName = (orgName: string) =>
    patch({ orgName, ...(slugTouched ? {} : { slug: suggestSlug(orgName) || 'default' }) });

  const toggleModule = (k: ModuleKey) =>
    patch({ modules: { ...config.modules, [k]: config.modules[k] === false } });

  /** הדלקה = מחיקת המפתח (חסר = פעיל) — שומר על config.json נקי מרעש. */
  const setFeatures = (keys: string[], on: boolean) => {
    const features = { ...(config.features ?? {}) };
    for (const k of keys) {
      if (on) delete features[k];
      else features[k] = false;
    }
    patch({ features });
  };

  const setTerm = (key: string, value: string) => {
    const terms = { ...(config.terms ?? {}) };
    if (value) terms[key] = value;
    else delete terms[key];
    patch({ terms });
  };

  const toggleIntegration = (k: string) => {
    const cur = config.integrations?.[k]?.enabled ?? false;
    patch({ integrations: { ...(config.integrations ?? {}), [k]: { enabled: !cur } } });
  };

  const pickTheme = (theme: string) => {
    patch({ theme });
    setTheme(theme); // גם העדפת המשתמש — כדי שהתצוגה תתעדכן מיד בכל מקרה
  };

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ logoDataUri: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const configJson = useMemo(
    () => JSON.stringify({ ...config, slug: config.slug || 'default' }, null, 2),
    [config],
  );

  const activeCount = useMemo(() => FEATURES.filter((f) => featureEffectiveOn(config, f)).length, [config]);

  const createPackage = () => {
    if (!config.orgName.trim()) {
      toast('חסר שם ארגון — זה הדבר היחיד שחובה');
      return;
    }
    downloadTextFile(`config-${config.slug}.json`, configJson, 'application/json');
    downloadTextFile(`handoff-${config.slug}.html`, buildHandoffHtml(config, appUrl, installer));
    toast('📦 החבילה ירדה: config + דף מסירה. את ה-config מעלים ל-public/c/' + config.slug + '/');
  };

  const resetToDefault = () => {
    // עותק טרי — לא מוסרים את אובייקט ברירת המחדל עצמו ל-store (הגנה ממוטציה)
    setConfig({ ...DEFAULT_CONFIG, modules: {}, features: {}, terms: {}, integrations: {} });
    // setConfig שומר דריסה ב-localStorage — מוחקים אותה אחריו כדי שהאיפוס יהיה אמיתי
    clearConfigOverride();
    setTheme(DEFAULT_CONFIG.theme);
    setAccent(undefined);
    toast('האשף אופס — חזרה לברירת המחדל');
  };

  /** לחיצה על כרטיס ארגון — מלביש שם+צבע+ערכה חיים; התצלום נשמר פעם אחת. */
  const applyPlatformDemo = (d: (typeof PLATFORM_DEMOS)[number]) => {
    if (!demoPrev) setDemoPrev({ orgName: config.orgName, accent: config.accent, theme: config.theme });
    patch({ orgName: d.org, accent: d.accent, theme: d.theme });
    setTheme(d.theme);
    setAccent(d.accent);
    toast(`🎪 המערכת התלבשה על "${d.org}" — לחצו "החזרה" כדי לחזור`);
  };

  /** החזרת המיתוג שלפני ההדגמה — שם, צבע וערכה כפי שהיו. */
  const restorePlatformDemo = () => {
    if (!demoPrev) return;
    patch({ orgName: demoPrev.orgName, accent: demoPrev.accent, theme: demoPrev.theme });
    setTheme(demoPrev.theme);
    setAccent(demoPrev.accent);
    setDemoPrev(null);
    toast('המיתוג שלפני ההדגמה הוחזר ✓');
  };

  const isOpen = (id: string, def = false) => open[id] ?? def;
  const flipOpen = (id: string, def = false) =>
    setOpen((o) => ({ ...o, [id]: !(o[id] ?? def) }));

  const q = query.trim();
  const searching = q.length > 0;

  /** מקטע מודול אחד — יכולות + מונחים, מסונן לפי החיפוש. */
  const renderModuleSection = (sec: WizardSectionDef) => {
    const mk = sec.module;
    const feats = FEATURES.filter((f) => f.module === sec.id);
    const terms = TERM_DEFS.filter((t) => sec.termKeys.includes(t.key));
    const visFeats = searching ? feats.filter((f) => f.label.includes(q) || f.desc.includes(q)) : feats;
    const visTerms = searching ? terms.filter((t) => t.label.includes(q) || t.fallback.includes(q)) : terms;
    if (searching && !visFeats.length && !visTerms.length) return null;

    const modOn = mk ? config.modules[mk] !== false : true;
    const onCount = feats.filter((f) => config.features?.[f.key] !== false).length;
    const sectionOpen = searching || isOpen(sec.id);

    return (
      <SectionShell
        key={sec.id}
        emoji={sec.emoji}
        title={sec.title}
        meta={feats.length ? `${onCount}/${feats.length} יכולות` : undefined}
        open={sectionOpen}
        onToggleOpen={() => flipOpen(sec.id)}
        headerEnd={
          mk ? (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                cursor: 'pointer',
                color: modOn ? 'var(--ink-soft)' : 'var(--ink-faint)',
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={modOn}
                onChange={() => toggleModule(mk)}
                aria-label={`מודול ${sec.title} פעיל`}
                style={{ width: 'auto', accentColor: 'var(--accent-deep)' }}
              />
              {modOn ? 'פעיל' : 'כבוי'}
            </label>
          ) : undefined
        }
      >
        <div style={{ opacity: mk && !modOn ? 0.55 : 1 }}>
          {visFeats.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 6, padding: '4px 0 6px' }}>
                <Btn sm onClick={() => setFeatures(feats.map((f) => f.key), true)}>
                  סמן הכול
                </Btn>
                <Btn sm onClick={() => setFeatures(feats.map((f) => f.key), false)}>
                  נקה הכול
                </Btn>
              </div>
              {visFeats.map((f) => (
                <FeatureRow
                  key={f.key}
                  f={f}
                  on={config.features?.[f.key] !== false}
                  onToggle={(on) => setFeatures([f.key], on)}
                />
              ))}
            </>
          )}
          {visTerms.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 6, paddingTop: 6 }}>
              {visTerms.map((t) => (
                <TermRow
                  key={t.key}
                  t={t}
                  value={config.terms?.[t.key] ?? ''}
                  onChange={(v) => setTerm(t.key, v)}
                />
              ))}
            </div>
          )}
        </div>
      </SectionShell>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        insetInlineEnd: 0,
        width: 'min(560px, 96vw)',
        background: 'var(--panel)',
        borderInlineStart: '3px solid var(--accent)',
        boxShadow: 'var(--shadow-lift)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-label="אשף ההרכבה"
    >
      {/* כותרת + מונה + חיפוש — נשארים למעלה בזמן גלילה */}
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <h2 style={{ fontSize: 18, flex: 1 }}>🎛️ אשף ההרכבה</h2>
          <Btn sm onClick={onClose}>✕ סגירה</Btn>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>
          עוברים מסך-מסך עם הלקוח: מוסיפים, מסירים ומשנים שמות — הכול מוחל חי על המערכת שמאחור.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 חיפוש יכולת או מונח…"
            aria-label="חיפוש יכולת או מונח"
            style={{ flex: 1, fontSize: 13, padding: '6px 10px' }}
          />
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--dark)',
              whiteSpace: 'nowrap',
            }}
          >
            {activeCount} יכולות פעילות מתוך {FEATURES.length}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 40px' }}>
        {/* מיתוג — שם, מזהה, לוגו, ערכה וצבע (מוסתר בזמן חיפוש יכולות) */}
        {!searching && (
          <SectionShell
            emoji="🏷️"
            title="מיתוג"
            open={isOpen('branding', true)}
            onToggleOpen={() => flipOpen('branding', true)}
          >
            <Field label="שם הארגון">
              <TextInput value={config.orgName} onChange={setName} placeholder="למשל: מאור החסד" />
            </Field>
            <Field label="מזהה לקוח (לועזי, לכתובת)">
              <TextInput
                value={config.slug}
                onChange={(v) => {
                  setSlugTouched(true);
                  patch({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
                }}
                dir="ltr"
              />
            </Field>
            <Field label="לוגו (לא חובה)">
              <input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0])} />
              {config.logoDataUri && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <img src={config.logoDataUri} alt="לוגו" style={{ height: 34, borderRadius: 8 }} />
                  <Btn sm onClick={() => patch({ logoDataUri: undefined })}>הסרה</Btn>
                </div>
              )}
            </Field>
            <Field label="ערכת נושא">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(THEME_LABELS).map(([k, label]) => (
                  <Chip key={k} on={config.theme === k} onClick={() => pickTheme(k)}>
                    {label.split(' ')[0]}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="צבע מותאם (לא חובה)">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={config.accent ?? '#f3c76b'}
                  onChange={(e) => {
                    patch({ accent: e.target.value });
                    setAccent(e.target.value);
                  }}
                  style={{ width: 46, height: 32, padding: 2 }}
                />
                <Btn sm onClick={() => { patch({ accent: undefined }); setAccent(undefined); }}>
                  צבע הערכה
                </Btn>
              </div>
            </Field>

            {/* חיבור ענן — הדבקת ה-firebaseConfig מהקונסולה; מתקפל, לא חובה */}
            <details style={{ marginTop: 4 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--ink-soft)', padding: '4px 0' }}>
                ☁️ חיבור ענן (Firebase) — לא חובה
              </summary>
              <div style={{ padding: '6px 0 2px' }}>
                {config.firebase ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: '1px solid #3fae5a',
                        color: '#3fae5a',
                        direction: 'ltr',
                      }}
                    >
                      ✓ מחובר: {config.firebase.projectId}
                    </span>
                    <Btn
                      sm
                      onClick={() => {
                        const next = { ...config };
                        delete next.firebase;
                        setConfig(next);
                        setFbText('');
                        setFbErr('');
                      }}
                    >
                      הסרה
                    </Btn>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={fbText}
                      onChange={(e) => setFbText(e.target.value)}
                      dir="ltr"
                      rows={6}
                      placeholder={'הדביקו כאן את קטע ה-firebaseConfig מקונסולת Firebase, למשל:\nconst firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};'}
                      style={{
                        width: '100%',
                        fontSize: 11.5,
                        fontFamily: 'monospace',
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid var(--line)',
                        background: 'var(--bg)',
                        color: 'var(--ink)',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Btn
                        sm
                        kind="primary"
                        onClick={() => {
                          const fb = parseFirebaseSnippet(fbText);
                          if (!fb) {
                            setFbErr('לא זוהתה קונפיגורציה — ודאו שהודבקו apiKey, authDomain, projectId ו-appId');
                            return;
                          }
                          setFbErr('');
                          setFbText('');
                          patch({ firebase: fb });
                          toast('☁️ חיבור הענן נשמר — ייכנס לתוקף ב-config.json של הלקוח');
                        }}
                      >
                        חיבור
                      </Btn>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                        מחייב פרויקט Firebase נפרד לכל לקוח
                      </span>
                    </div>
                    <FormError error={fbErr} />
                  </>
                )}
              </div>
            </details>
          </SectionShell>
        )}

        {/* מקטע לכל מסך — בסדר המסכים באפליקציה */}
        {WIZARD_SECTIONS.map(renderModuleSection)}

        {/* הרחבות — נשארות כ-chips (מוסתר בזמן חיפוש יכולות) */}
        {!searching && (
          <SectionShell
            emoji="🔌"
            title="הרחבות שנמכרו"
            meta="יופעלו בפגישת המשך"
            open={isOpen('integrations')}
            onToggleOpen={() => flipOpen('integrations')}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6 }}>
              {Object.entries(INTEGRATION_LABELS).map(([k, label]) => (
                <Chip
                  key={k}
                  on={config.integrations?.[k]?.enabled ?? false}
                  onClick={() => toggleIntegration(k)}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </SectionShell>
        )}

        <div style={{ borderTop: '1px dashed var(--line)', margin: '14px 0', paddingTop: 12 }}>
          <Field label="כתובת האתר (לדף המסירה)">
            <TextInput value={appUrl} onChange={setAppUrl} dir="ltr" />
          </Field>
          <Field label="חתימת המטמיע">
            <TextInput value={installer} onChange={setInstaller} />
          </Field>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn kind="primary" onClick={createPackage}>📦 צור חבילה — config + דף מסירה</Btn>
          <Btn onClick={resetToDefault}>איפוס האשף לברירת מחדל</Btn>
        </div>

        {/* רצועת ה-white-label ממוקאפ צֹהַר — הדגמת "המערכת מתלבשת" בפגישה */}
        <section
          aria-label="הדגמת הפלטפורמה"
          style={{
            marginTop: 16,
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '12px 14px',
            background: 'linear-gradient(180deg, var(--bg), var(--panel))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }}>
              🎪 פלטפורמה אחת — אלפי עמותות, כל אחת בצבעים שלה
            </h3>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                borderRadius: 999,
                padding: '1px 8px',
                border: '1px solid var(--line)',
                color: 'var(--ink-faint)',
                whiteSpace: 'nowrap',
              }}
            >
              הדגמה
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '3px 0 10px' }}>
            אותה מערכת בדיוק; כל ארגון בוחר צבע, לוגו ושם — והמערכת כולה מתלבשת עליו.
            לחצו על כרטיס כדי לראות את זה חי:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
            {PLATFORM_DEMOS.map((d) => {
              const on = config.orgName === d.org && config.accent === d.accent;
              return (
                <button
                  key={d.org}
                  type="button"
                  onClick={() => applyPlatformDemo(d)}
                  title={`להלביש את המערכת על "${d.org}"`}
                  style={{
                    border: on ? '1.5px solid var(--accent)' : '1.5px solid var(--line)',
                    boxShadow: on ? '0 0 0 3px var(--stat-tint)' : undefined,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--panel)',
                    textAlign: 'right',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span
                    style={{
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 10px',
                      gap: 6,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 11.5,
                      background: d.accent,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,.35)',
                        flexShrink: 0,
                      }}
                    />
                    {d.org}
                  </span>
                  <span style={{ padding: '7px 10px', fontSize: 10.5, color: 'var(--ink-faint)' }}>
                    <b style={{ display: 'block', color: 'var(--ink)', fontSize: 11.5, fontWeight: 600 }}>
                      {d.colorName}
                    </b>
                    {d.desc}
                  </span>
                </button>
              );
            })}
          </div>
          {demoPrev && (
            <div style={{ marginTop: 10 }}>
              <Btn sm onClick={restorePlatformDemo} title="חזרה לשם, לצבע ולערכה שלפני ההדגמה">
                ⤴ החזרה — {demoPrev.orgName || 'המיתוג הקודם'}
              </Btn>
            </div>
          )}
        </section>

        <details style={{ marginTop: 14, fontSize: 12 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--ink-faint)' }}>config.json (תצוגה)</summary>
          <pre
            dir="ltr"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 10,
              overflowX: 'auto',
              fontSize: 11,
            }}
          >
            {configJson}
          </pre>
        </details>

        <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 12 }}>
          פרסום ללקוח: מעלים את הקובץ ל-<code dir="ltr">maor/public/c/{config.slug}/config.json</code>{' '}
          בריפו ודוחפים — הכתובת <code dir="ltr">?org={config.slug}</code> חיה תוך דקות. הנתונים של כל
          לקוח מבודדים אוטומטית.
        </p>
      </div>
    </div>
  );
}
