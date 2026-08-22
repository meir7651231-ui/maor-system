/**
 * אשף ההרכבה ברזולוציה מלאה — המסך של המטמיע בלבד (נפתח עם #builder בכתובת).
 *
 * זרימת העבודה: יושבים עם הלקוח, עוברים מסך-מסך (מקטע לכל מודול), מוסיפים /
 * מסירים יכולות ומשנים מונחים — וכל שינוי מוחל מיידית דרך setConfig, כך
 * שהלקוח רואה את המערכת שלו נולדת מולו. בסיום: "📦 צור חבילה" מוריד
 * config.json (כולל features + terms) + דף מסירה בעברית.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { clearConfigOverride, featureOn, integrationSetting, normalizeConfig, termOf } from '../../lib/config';
import { VERTICAL_PACKS, applyVerticalPack } from '../../lib/verticalPacks';
import { ALL_MODULES, MODULE_LABELS as MODULE_SHORT } from '../platform/lib';
import { computeQuote, readPrices, shekel, writePrices, SIZE_LABELS, type DealMode, type OrgSize, type PriceTable } from '../../lib/pricing';
import {
  DEFAULT_CONFIG,
  type LocalizedText,
  type ModuleKey,
  type OrgConfig,
  type PublicSiteContent,
  type PublicSiteEvent,
  type PublicSiteFaq,
  type PublicSiteMilestone,
  type PublicSitePayMethod,
  type PublicSiteService,
  type PublicSiteStat,
  type PublicSiteTestimonial,
  type PublicSiteTier,
} from '../../types/config';
import { FEATURES, TERM_DEFS, type FeatureDef, type TermDef } from '../../types/features';
import { Btn, Chip, Field, FormError, TextInput } from '../ui';
import { buildHandoffHtml, downloadTextFile, INTEGRATION_LABELS, INTEGRATION_STATUS, liveAddons, THEME_LABELS } from './handoff';
import { featureEffectiveOn, WIZARD_SECTIONS, type WizardSectionDef } from './sections';
import {
  diffCount,
  filterFeatureRows,
  groupFeatures,
  integrationMatches,
  ROW_FILTER_LABELS,
  wizardDiff,
  type RowFilter,
} from './wizardLib';
import { TEMPLATE_DEFS } from '../../lib/templates';
import { TelephonyPanel } from '../telephony/TelephonyPanel';
import { emptyTelephonyConfig } from '../telephony/lib';

const DEFAULT_APP_URL = 'https://meir7651231-ui.github.io/maor-system/';

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
  id?: string;
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
      id={props.id}
      style={{
        scrollMarginTop: 8,
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

/** שורת יכולת — checkbox + תווית + תיאור; ⭐ ל-opt-in; dense מסתיר את התיאור. */
function FeatureRow(props: { f: FeatureDef; on: boolean; dense?: boolean; onToggle: (on: boolean) => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: props.dense ? '3px 2px' : '5px 2px',
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
      <span style={{ lineHeight: 1.35, minWidth: 0 }}>
        <span style={{ color: 'var(--ink)' }}>{props.f.label}</span>
        {props.f.optIn && (
          <span
            title="opt-in — כבוי כברירת-מחדל; דלוק ללקוח רק כשמסומן כאן"
            style={{
              fontSize: 10,
              fontWeight: 700,
              marginInlineStart: 6,
              padding: '1px 6px',
              borderRadius: 999,
              border: '1px solid var(--line)',
              color: 'var(--ink-faint)',
              whiteSpace: 'nowrap',
            }}
          >
            ⭐ opt-in
          </span>
        )}
        {!props.dense && (
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>{props.f.desc}</span>
        )}
      </span>
    </label>
  );
}

/** שורת מונח — ✏️ + תווית + שדה שינוי-שם (placeholder = ברירת המחדל). */
function TermRow(props: { t: TermDef; value: string; onChange: (v: string) => void }) {
  // התצוגה החיה — מה שיופיע בפועל באפליקציה: הדריסה אם הוקלדה, אחרת ברירת המחדל.
  const effective = props.value.trim() || props.t.fallback;
  const overridden = props.value.trim() !== '' && props.value.trim() !== props.t.fallback;
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
      <span
        title="כך זה מופיע באפליקציה"
        style={{
          flex: '0 0 auto',
          maxWidth: 110,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 11.5,
          fontWeight: 600,
          color: overridden ? 'var(--accent-deep, var(--accent))' : 'var(--ink-faint)',
        }}
      >
        → {effective}
      </span>
    </label>
  );
}

/** קלט-מחיר יחיד (₪) — מספר שלם ≥0; קלט לא-תקין → 0. */
function PriceInput(props: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={props.value}
      onChange={(e) => {
        const n = Number(e.target.value);
        props.onChange(Number.isFinite(n) && n >= 0 ? Math.round(n) : 0);
      }}
      dir="ltr"
      style={{ width: 88, fontSize: 12.5, padding: '3px 6px', textAlign: 'left' }}
      aria-label={'מחיר'}
    />
  );
}

/** שורת-מחיר בטבלת-העריכה: תווית + קלט-₪. */
function PriceRow(props: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.label}</span>
      <PriceInput value={props.value} onChange={props.onChange} />
    </>
  );
}

/* עורך-רשימות גנרי לאתר-הציבורי: שורה לכל פריט + ↑↓ + 🗑 + "➕ הוספה".
   כל פעולה בונה מערך חדש ומעבירה ל-onChange (⇒ setSite ⇒ patch — אותו live-apply). */
const MINI_BTN: CSSProperties = { fontSize: 12, lineHeight: 1, padding: '3px 7px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink-soft)', cursor: 'pointer' };
const NUM_STYLE: CSSProperties = { width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 8px' };
const TA_STYLE: CSSProperties = { width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', fontFamily: 'inherit', resize: 'vertical', minHeight: 46 };

/** כותרת-תת-קבוצה בעורך האתר-הציבורי. */
function SubHead({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 2px', borderTop: '1px solid var(--line-soft)', paddingTop: 10 }}>{children}</div>;
}

function ListEditor<T extends object>({ items, onChange, empty, addLabel, row }: {
  items: T[];
  onChange: (next: T[]) => void;
  empty: () => T;
  addLabel: string;
  row: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
}) {
  const setAt = (i: number, patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeAt = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    const tmp = next[i]; next[i] = next[j]; next[j] = tmp;
    onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
      {items.map((it, i) => (
        <div key={i} style={{ border: '1px solid var(--line-soft)', borderRadius: 8, padding: '6px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 11, color: 'var(--ink-faint)' }}>#{i + 1}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="הזז למעלה" style={MINI_BTN}>↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="הזז למטה" style={MINI_BTN}>↓</button>
            <button type="button" onClick={() => removeAt(i)} aria-label="מחיקה" style={{ ...MINI_BTN, color: '#b3362a' }}>🗑</button>
          </div>
          {row(it, (patch) => setAt(i, patch))}
        </div>
      ))}
      <div><Btn onClick={() => onChange([...items, empty()])}>➕ {addLabel}</Btn></div>
    </div>
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
  /** אשף 2.0: סינון-שורות (דלוקות/כבויות/opt-in/שונו) + מצב-צפוף + מחסנית-ביטול. */
  const [rowFilter, setRowFilter] = useState<RowFilter>('all');
  const [dense, setDense] = useState(false);
  const [hist, setHist] = useState<OrgConfig[]>([]);
  /** אילו מקטעים פתוחים — 'branding' פתוח כברירת מחדל, השאר מקופלים. */
  const [open, setOpen] = useState<Record<string, boolean>>({ branding: true });
  /** חיבור ענן: הטקסט שהודבק מקונסולת Firebase + שגיאת פענוח. */
  const [fbText, setFbText] = useState('');
  const [fbErr, setFbErr] = useState('');
  /** תמחור (מכשיר-המטמיע): סוג-עסקה + גודל-ארגון + טבלת-מחירים עריכה. */
  const [dealMode, setDealMode] = useState<DealMode>('subscription');
  const [size, setSize] = useState<OrgSize>('small');
  const [prices, setPrices] = useState<PriceTable>(() => readPrices());
  const setPrice = (patch: Partial<PriceTable>) => {
    const next = { ...prices, ...patch };
    setPrices(next);
    writePrices(next);
  };
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
  /** תצלום למחסנית-הביטול — לפני כל שינוי (עד 25 צעדים אחורה). */
  const snap = () => setHist((h) => [...h.slice(-24), config]);
  const patch = (p: Partial<OrgConfig>) => {
    snap();
    setConfig({ ...config, ...p });
  };
  /** ↩ ביטול הצעד האחרון — משחזר קונפיג + ערכה/צבע כפי שהיו. */
  const undo = () => {
    const prev = hist[hist.length - 1];
    if (!prev) return;
    setHist((h) => h.slice(0, -1));
    setConfig(prev);
    setTheme(prev.theme);
    setAccent(prev.accent);
    toast('↩ הצעד האחרון בוטל');
  };

  const setName = (orgName: string) =>
    patch({ orgName, ...(slugTouched ? {} : { slug: suggestSlug(orgName) || 'default' }) });

  const toggleModule = (k: ModuleKey) =>
    patch({ modules: { ...config.modules, [k]: config.modules[k] === false } });

  /** הדלקה = מחיקת המפתח (חסר = פעיל) — שומר על config.json נקי מרעש.
      ⚠️ חריג opt-in (20.8): דגל שהקוד דורש בו `=== true` (קוקפיט/מודיעין/גלקסיה/
      ריברנד) — הדלקה חייבת לכתוב true מפורש; מחיקה הייתה משאירה אותו כבוי. */
  const setFeatures = (keys: string[], on: boolean) => {
    const optIn = new Set(FEATURES.filter((f) => f.optIn).map((f) => f.key));
    const features = { ...config.features };
    for (const k of keys) {
      if (on) {
        if (optIn.has(k)) features[k] = true;
        else delete features[k];
      } else features[k] = false;
    }
    patch({ features });
  };

  const setTerm = (key: string, value: string) => {
    const terms = { ...config.terms };
    if (value) terms[key] = value;
    else delete terms[key];
    patch({ terms });
  };

  const toggleIntegration = (k: string) => {
    const cur = config.integrations?.[k]?.enabled ?? false;
    patch({ integrations: { ...config.integrations, [k]: { ...config.integrations?.[k], enabled: !cur } } });
  };
  /** גל ג׳: כתיבת הגדרת-הרחבה (payUrl וכו') — נשמרת בקונפיג ומסתנכרנת חי. */
  const setIntegrationField = (k: string, field: string, v: string) => {
    patch({ integrations: { ...config.integrations, [k]: { enabled: true, ...config.integrations?.[k], [field]: v } } });
  };

  /* 🌐 האתר-הציבורי — עריכה חיה של config.site דרך אותו צינור patch כמו כל האשף.
     טקסט רב-לשוני נערך בעברית (putHe שומר en/yi קיימים). מספרים/תאריך = ערכים גולמיים;
     החיטוי (allowlist, https, תקרות) קורה ב-normalizeSite בטעינה/ייצוא. */
  const wsite = config.site ?? {};
  const setSite = (p: Partial<PublicSiteContent>) => patch({ site: { ...config.site, ...p } });
  const siteHe = (v?: LocalizedText): string => (typeof v === 'string' ? v : v?.he ?? '');
  const putHe = (old: LocalizedText | undefined, v: string): LocalizedText | undefined =>
    !v.trim() ? undefined : old && typeof old === 'object' ? { ...old, he: v } : v;
  const setSiteText = (key: keyof PublicSiteContent, v: string) =>
    setSite({ [key]: putHe(wsite[key] as LocalizedText | undefined, v) } as Partial<PublicSiteContent>);
  const setCamp = (p: Partial<NonNullable<PublicSiteContent['campaign']>>) =>
    setSite({ campaign: { ...wsite.campaign, ...p } });
  const setSiteContact = (p: Partial<NonNullable<PublicSiteContent['contact']>>) =>
    setSite({ contact: { ...wsite.contact, ...p } });
  const setFounder = (p: Partial<NonNullable<PublicSiteContent['founder']>>) =>
    setSite({ founder: { ...wsite.founder, ...p } });
  const setCalcF = (p: Partial<NonNullable<PublicSiteContent['calc']>>) =>
    setSite({ calc: { ...wsite.calc, ...p } });
  const setGrowth = (p: Partial<NonNullable<PublicSiteContent['growth']>>) =>
    setSite({ growth: { ...wsite.growth, ...p } });
  const setTransp = (p: Partial<NonNullable<PublicSiteContent['transparency']>>) =>
    setSite({ transparency: { ...wsite.transparency, ...p } });
  const setSiteForm = (p: Partial<NonNullable<PublicSiteContent['contactForm']>>) =>
    setSite({ contactForm: { ...wsite.contactForm, ...p } });
  /** רשימות-מחרוזת (מרקיזה/מדליונים/הטבות/גלריה): "שורה לכל פריט". */
  const heLines = (arr?: LocalizedText[]): string => (arr ?? []).map((v) => siteHe(v)).join('\n');
  const toLines = (text: string): string[] => text.split('\n').map((s) => s.trim()).filter(Boolean);
  const previewSite = () => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('site', '1');
      u.hash = '';
      window.open(u.toString(), '_blank', 'noopener');
    } catch {
      /* דפדפן ללא URL — מדלגים */
    }
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

  /** אשף 2.0: דוח-השינויים מול ברירת-המחדל — מזין את מונה-✏️ ואת סינון "שונו". */
  const diff = useMemo(() => wizardDiff(config, FEATURES, TERM_DEFS), [config]);
  const changedTotal = diffCount(diff);

  /** הצעת-המחיר החיה — מתעדכנת עם כל מתג/מחיר/גודל. שמות-מודול מכבדים termOf. */
  const quote = useMemo(() => {
    const nameOf = (m: ModuleKey) => termOf(config, `nav.${m}`, MODULE_SHORT[m] ?? m);
    // כנות-תמחור: רק הרחבות **ממומשות** נכנסות להצעה — דרך liveAddons (מקור-אמת יחיד)
    return computeQuote(config, size, prices, nameOf, liveAddons(config), dealMode);
  }, [config, size, prices, dealMode]);

  const createPackage = () => {
    if (!config.orgName.trim()) {
      toast('חסר שם ארגון — זה הדבר היחיד שחובה');
      return;
    }
    downloadTextFile(`config-${config.slug}.json`, configJson, 'application/json');
    downloadTextFile(`handoff-${config.slug}.html`, buildHandoffHtml(config, appUrl, installer, quote));
    toast('📦 החבילה ירדה: config + דף מסירה (כולל הצעת-מחיר). את ה-config מעלים ל-public/c/' + config.slug + '/');
  };

  /**
   * טעינת config.json שמור — לפתיחה-מחדש ועריכה של מערכת לקוח קיימת. הקובץ
   * עובר normalizeConfig (אותו נרמול של הטעינה הרגילה), כך שקלט פגום נדחה בבטחה.
   * מוחל חי דרך setConfig + ערכה/צבע, בדיוק כמו בחירת חבילה.
   */
  const importConfig = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        toast('שגיאה בקריאת הקובץ — ודאו שזה config.json תקין');
        return;
      }
      const cfg = normalizeConfig(parsed);
      if (!cfg) {
        toast('קובץ ה-config אינו תקין — לא נטען');
        return;
      }
      snap();
      setConfig(cfg);
      setTheme(cfg.theme);
      setAccent(cfg.accent);
      setSlugTouched(true);
      toast('✅ נטען config של "' + (cfg.orgName || cfg.slug) + '" — אפשר לערוך ולייצא מחדש');
    };
    reader.readAsText(file);
  };

  const resetToDefault = () => {
    snap();
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

  /** צ'יפ ניווט (כמו במסך ההגדרות): פותח את המקטע וגולל אליו. */
  const jumpTo = (domId: string, key: string) => {
    setOpen((o) => ({ ...o, [key]: true }));
    requestAnimationFrame(() =>
      document.getElementById(domId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const q = query.trim();
  const searching = q.length > 0;
  /** חיפוש-כולל: גם ההרחבות נמצאות (הפער מביקורת 20.8 — "וואטסאפ" לא נמצא). */
  const intMatches = useMemo(() => (searching ? integrationMatches(q, INTEGRATION_LABELS) : []), [searching, q]);
  const filtering = rowFilter !== 'all';
  /** שורת צ'יפי-הניווט — מיתוג, מקטע לכל מסך, והרחבות (בסדר המסכים באפליקציה). */
  const navChips: { domId: string; key: string; label: string }[] = [
    { domId: 'wz-vertical', key: 'vertical', label: '🏢 סוג העסק' },
    { domId: 'wz-branding', key: 'branding', label: '🏷️ מיתוג' },
    ...WIZARD_SECTIONS.map((s) => ({ domId: `wz-${s.id}`, key: s.id, label: `${s.emoji} ${s.title}` })),
    { domId: 'wz-integrations', key: 'integrations', label: '🔌 הרחבות' },
    { domId: 'wz-telephony', key: 'telephony', label: '☎️ טלפוניה' },
  ];

  /** מקטע מודול אחד — יכולות + מונחים, מסונן לפי החיפוש. */
  const renderModuleSection = (sec: WizardSectionDef) => {
    const mk = sec.module;
    const feats = FEATURES.filter((f) => f.module === sec.id);
    const terms = TERM_DEFS.filter((t) => sec.termKeys.includes(t.key));
    // סדר-הסינון: קודם חיפוש-טקסט, ואז סינון-המצב (דלוקות/כבויות/opt-in/שונו)
    const searched = searching ? feats.filter((f) => f.label.includes(q) || f.desc.includes(q) || f.key.includes(q)) : feats;
    const visFeats = filterFeatureRows(config, searched, rowFilter, diff);
    const visTerms =
      rowFilter === 'optin'
        ? []
        : searching
          ? terms.filter((t) => t.label.includes(q) || t.fallback.includes(q))
          : rowFilter === 'changed'
            ? terms.filter((t) => diff.terms.includes(t.key))
            : rowFilter === 'off'
              ? []
              : terms;
    // מסלול-B: פיצול-תרומות פר-ייעוד — דגל ברמת-הקונפיג (לא features), מוצג כטוגל
    // במקטע התורמים ליד שאר היכולות. ברירת-מחדל כבוי (חסר=כבוי, רק true מדליק).
    const showSplit =
      sec.id === 'supporters' &&
      rowFilter === 'all' &&
      (!searching || 'פיצול תרומות פר-ייעוד אכיפת הרשאה לעובדות ייעוד'.includes(q));
    if ((searching || filtering) && !visFeats.length && !visTerms.length && !showSplit) return null;

    const modOn = mk ? config.modules[mk] !== false : true;
    // opt-in-aware: דגל-optIn חסר = כבוי; דגל-רגיל חסר = דלוק (featureEffectiveOn).
    const onCount = feats.filter((f) => featureEffectiveOn(config, f)).length;
    const secChanged = feats.filter((f) => diff.features.includes(f.key)).length +
      terms.filter((t) => diff.terms.includes(t.key)).length;
    const sectionOpen = searching || filtering || isOpen(sec.id);

    return (
      <SectionShell
        key={sec.id}
        id={`wz-${sec.id}`}
        emoji={sec.emoji}
        title={sec.title}
        meta={feats.length ? `${onCount}/${feats.length} יכולות${secChanged ? ` · ✏️${secChanged}` : ''}` : undefined}
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
              {/* אשף 2.0: תת-קבוצות אוטומטיות לפי קידומת-המפתח — פירוט מלא שנשאר סרוק */}
              {groupFeatures(visFeats).map((g) => (
                <div key={g.label ?? '_general'}>
                  {g.label && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', padding: '8px 0 2px' }}>
                      {g.label} <span style={{ fontWeight: 400, color: 'var(--ink-faint)' }}>· {g.items.length}</span>
                    </div>
                  )}
                  {g.items.map((f) => (
                    <FeatureRow
                      key={f.key}
                      f={f}
                      dense={dense}
                      on={featureEffectiveOn(config, f)}
                      onToggle={(on) => setFeatures([f.key], on)}
                    />
                  ))}
                </div>
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
          {showSplit && (
            <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 6, paddingTop: 6 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '5px 2px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.donationSplit === true}
                  onChange={(e) => patch({ donationSplit: e.target.checked ? true : undefined })}
                  style={{ width: 'auto', marginTop: 2, accentColor: 'var(--accent-deep)' }}
                />
                <span style={{ lineHeight: 1.35 }}>
                  <span style={{ color: 'var(--ink)' }}>🔀 פיצול-תרומות פר-ייעוד (אכיפת-הרשאה לעובדות)</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                    כל עובדת רואה רק תרומות של הייעודים שהוקצו לה — האכיפה בשכבת-הנתונים (הענן). דורש
                    ענן מחובר; לארגון עם תרומות קיימות הריצו קודם את המיגרציה ב-הגדרות←אבטחה.
                  </span>
                </span>
              </label>
              {/* אכיפת-נתונים מלאה (15.8): תומכים+לוח+לוג פר-ייעוד — מתג-קונפיג לצד הפיצול */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 2px', fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.supporterEnforce === true}
                  onChange={(e) => patch({ supporterEnforce: e.target.checked ? true : undefined })}
                  style={{ width: 'auto', marginTop: 2, accentColor: 'var(--accent-deep)' }}
                />
                <span style={{ lineHeight: 1.35 }}>
                  <span style={{ color: 'var(--ink)' }}>🔒 אכיפת-נתונים מלאה פר-ייעוד (תומכים · לוח · לוג)</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                    עובדת רואה **רק** תורמים/אירועים בייעוד שלה, ולא לוג-פעולות של אחרות. דורש ענן;
                    לארגון עם נתונים קיימים הריצו קודם מיגרציה (הגדרות←אבטחה). ארגון-חדש: הדלקה כאן מספיקה.
                  </span>
                </span>
              </label>
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
            placeholder="🔍 חיפוש יכולת, מונח או הרחבה…"
            aria-label="חיפוש יכולת, מונח או הרחבה"
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
        {/* אשף 2.0: שורת-פיקוד — סינון-מצב · ✏️ שינויים · צפוף/מפורט · ↩ ביטול */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          {(Object.keys(ROW_FILTER_LABELS) as RowFilter[]).map((k) => (
            <Chip key={k} on={rowFilter === k} onClick={() => setRowFilter(rowFilter === k ? 'all' : k)}>
              {k === 'changed' && changedTotal > 0 ? `${ROW_FILTER_LABELS[k]} · ${changedTotal}` : ROW_FILTER_LABELS[k]}
            </Chip>
          ))}
          <span style={{ flex: 1 }} />
          <Chip on={dense} onClick={() => setDense(!dense)}>
            {dense ? '☰ צפוף' : '📖 מפורט'}
          </Chip>
          {hist.length > 0 && (
            <Btn sm onClick={undo} title={`ביטול הצעד האחרון (${hist.length} במחסנית)`}>
              ↩ ביטול
            </Btn>
          )}
        </div>
        {/* שורת ניווט מהיר — צ'יפים למקטעים, כמו במסך ההגדרות. מוסתר בזמן חיפוש
            (אז ממילא כל המקטעים פרוסים). */}
        {!searching && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }} className="no-print">
            {navChips.map((c) => (
              <button
                key={c.domId}
                type="button"
                onClick={() => jumpTo(c.domId, c.key)}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--line)',
                  background: 'var(--hover-bg, var(--panel))',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 40px' }}>
        {/* סוג עסק — חבילת-ורטיקל בלחיצה: מחילה סט מונחים + מודולים כנקודת-פתיחה */}
        {!searching && (
          <SectionShell
            id="wz-vertical"
            emoji="🏢"
            title="סוג העסק"
            meta="נקודת פתיחה — כוונון ידני בהמשך"
            open={isOpen('vertical', true)}
            onToggleOpen={() => flipOpen('vertical', true)}
          >
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', padding: '2px 0 10px' }}>
              בחירה מלבישה זהות מלאה לענף — מונחים, מודולים, <b>ערכת-נושא, צבע, אימוג'י ותנועה</b>. הענן והמיילים נשמרים; צבע שבחרת ידנית נשמר. אפשר לכוונן הכול למטה.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VERTICAL_PACKS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    snap();
                    const next = applyVerticalPack(config, p.id);
                    setConfig(next);
                    // תצוגה חיה: מיישרים גם את דריסת-המשתמש (db.ui) לערכי-החבילה,
                    // כדי שהערכה/הצבע יתחלפו מיד בתצוגה (setConfig לבד נחסם ע"י db.ui).
                    setTheme(next.theme);
                    setAccent(next.accent);
                    toast(`חבילת "${p.label}" הוחלה — מונחים, מודולים ועיצוב עודכנו`);
                  }}
                  style={{
                    flex: '1 1 140px',
                    textAlign: 'start',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {p.emoji} {p.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{p.sub}</div>
                </button>
              ))}
            </div>
          </SectionShell>
        )}
        {/* מיתוג — שם, מזהה, לוגו, ערכה וצבע (מוסתר בזמן חיפוש יכולות) */}
        {!searching && (
          <SectionShell
            id="wz-branding"
            emoji="🏷️"
            title="מיתוג"
            open={isOpen('branding', true)}
            onToggleOpen={() => flipOpen('branding', true)}
          >
            <Field label="שם הארגון">
              <TextInput value={config.orgName} onChange={setName} placeholder="למשל: מאור החסד" />
            </Field>
            {featureOn(config, 'core.taxreceipt') && (
              <>
                <Field label='מספר עמותה/מלכ"ר (לקבלת סעיף 46)'>
                  <TextInput
                    value={config.orgTaxId ?? ''}
                    onChange={(v) => patch({ orgTaxId: v })}
                    dir="ltr"
                    placeholder="580000000"
                  />
                </Field>
                <Field label="שם החותם על קבלות">
                  <TextInput
                    value={config.orgSignatory ?? ''}
                    onChange={(v) => patch({ orgSignatory: v })}
                    placeholder="למשל: הגזבר"
                  />
                </Field>
              </>
            )}
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
            <Field label="אימוג'י הארגון (אייקון האתר וה-favicon — לא חובה)">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <TextInput
                  value={config.emoji ?? ''}
                  onChange={(v) => patch({ emoji: v.trim().slice(0, 12) || undefined })}
                  placeholder="למשל: 🏗️"
                />
                {config.emoji ? (
                  <span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden>{config.emoji}</span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>באין — האות הראשונה של השם</span>
                )}
              </div>
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
                    // accentCustom=true ⇒ החלפת-ורטיקל תשמר את הצבע הידני (הכרעת-בעלים)
                    patch({ accent: e.target.value, accentCustom: true });
                    setAccent(e.target.value);
                  }}
                  style={{ width: 46, height: 32, padding: 2 }}
                />
                <Btn sm onClick={() => { patch({ accent: undefined, accentCustom: undefined }); setAccent(undefined); }}>
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
                        snap();
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

        {/* הרחבות (INTEGRATIONS גל א׳) — טקסונומיית-כנות: live נמכר · included כלול ·
            roadmap מושבת (אי-אפשר למכור בטעות מה שלא קיים). מוסתר בזמן חיפוש. */}
        {(!searching || intMatches.length > 0) && (
          <SectionShell
            id="wz-integrations"
            emoji="🔌"
            title="הרחבות"
            meta={diff.integrationsOn.length ? `${diff.integrationsOn.length} דלוקות · ממומשות בלבד נמכרות` : 'ממומשות בלבד נמכרות'}
            open={searching || isOpen('integrations')}
            onToggleOpen={() => flipOpen('integrations')}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6 }}>
              {Object.entries(INTEGRATION_LABELS)
                .filter(([k]) => INTEGRATION_STATUS[k] === 'live' && (!searching || intMatches.includes(k)))
                .map(([k, label]) => (
                  <Chip key={k} on={config.integrations?.[k]?.enabled ?? false} onClick={() => toggleIntegration(k)}>
                    {label}
                  </Chip>
                ))}
              {/* דגל-תקוע (ביקורת 4.8): קונפיג מיובא עם הרחבה לא-ממומשת דלוקה —
                  מוצג גלוי להסרה, שלא ירכב שקוף לתוך ייצוא/מסירה עתידיים */}
              {Object.entries(config.integrations ?? {})
                .filter(([k, v]) => v.enabled && INTEGRATION_STATUS[k] !== 'live')
                .map(([k]) => (
                  <Chip key={'stale-' + k} on onClick={() => toggleIntegration(k)}>
                    {(INTEGRATION_LABELS[k] ?? k) + ' — 🔜 לא-ממומש (הסרה ✕)'}
                  </Chip>
                ))}
            </div>
            {/* גל ג׳ "עד-המפתח": הגדרות-ההרחבות שדורשות URL — מוצגות רק כשהצ'יפ דלוק */}
            {config.integrations?.payments?.enabled && (
              <div style={{ marginTop: 8 }}>
                <Field label="💳 כתובת עמוד-התשלום של הארגון (נדרים-פלוס / Grow / קארדקום; https)">
                  <TextInput
                    value={integrationSetting(config, 'payments', 'payUrl')}
                    onChange={(v) => setIntegrationField('payments', 'payUrl', v)}
                    dir="ltr"
                    placeholder="https://www.matara.pro/nedarimplus/online/?mosad=…"
                  />
                </Field>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  אפשר תבנית עם {'{amount}'}/{'{name}'} — אחרת הסכום מתווסף כ-amount. בלי כתובת — הכפתורים לא מוצגים.
                </div>
                <Field label="🔄 כתובת פונקציית משיכת-נדרים (nedarimPull; https) — לכפתור 'משוך וסנכרן'">
                  <TextInput
                    value={integrationSetting(config, 'payments', 'pullUrl')}
                    onChange={(v) => setIntegrationField('payments', 'pullUrl', v)}
                    dir="ltr"
                    placeholder="https://nedarimpull-xxxx-uc.a.run.app"
                  />
                </Field>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  כתובת ה-Cloud Function שנפרסה. עם כתובת זו, מייל-על מקבל כפתור 🔄 "משוך וסנכרן עכשיו" במסך-הסנכרון (בלי כתובות ידניות; אימות בטוקן-כניסה).
                </div>
                {/* סולה (21.8, חיווט-כמו-נדרים): בלי השדה הזה אין דרך להדליק את כפתור-
                    המשיכה לארגון-ענן (הקונפיג שלו חי בענן, לא בריפו) — "אני לא רואה את הכפתור". */}
                <Field label="💳 סולה (Sola) — כתובת פונקציית-המשיכה (solaPullUrl)">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <TextInput
                      value={integrationSetting(config, 'payments', 'solaPullUrl')}
                      onChange={(v) => setIntegrationField('payments', 'solaPullUrl', v)}
                      dir="ltr"
                      placeholder="https://us-central1-maor-system.cloudfunctions.net/solaPull"
                    />
                    {!integrationSetting(config, 'payments', 'solaPullUrl') && (
                      <Btn sm onClick={() => setIntegrationField('payments', 'solaPullUrl', 'https://us-central1-maor-system.cloudfunctions.net/solaPull')}>
                        מילוי אוטומטי
                      </Btn>
                    )}
                  </div>
                </Field>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  עם כתובת זו (+ ‏xKey בכספת: הגדרות←מפתחות-ההרחבות), מנהל/מייל-על מקבל כפתור "🔄 משיכה מסולה" בתשלומים-הנכנסים.
                </div>
              </div>
            )}
            {config.integrations?.campaign?.enabled && (
              <div style={{ marginTop: 8 }}>
                <Field label="📣 קישור הקמפיין החי (Charidy / JGive / אחר; https)">
                  <TextInput
                    value={integrationSetting(config, 'campaign', 'url')}
                    onChange={(v) => setIntegrationField('campaign', 'url', v)}
                    dir="ltr"
                    placeholder="https://…"
                  />
                </Field>
              </div>
            )}
            {config.integrations?.ai?.enabled && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
                🤖 מפתח-ה-API מוזן אצל הלקוח (הגדרות ← עוזר חכם) — מקומי-למכשיר, לא בקונפיג.
              </div>
            )}
            {config.integrations?.sheets?.enabled && (
              <div style={{ marginTop: 8 }}>
                <Field label="📊 מזהה גיליון-Google (spreadsheetId) — לייצוא-הלילי">
                  <TextInput
                    value={integrationSetting(config, 'sheets', 'spreadsheetId')}
                    onChange={(v) => setIntegrationField('sheets', 'spreadsheetId', v)}
                    dir="ltr"
                    placeholder="1AbC…"
                  />
                </Field>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  דורש את שרת-ההרחבות פרוס (RUNBOOK-FUNCTIONS) + שיתוף הגיליון עם מייל-ה-service-account.
                </div>
              </div>
            )}
            {/* צרור-הלילה (ROADMAP-100 ‏#3): יעדי תקציר-הבוקר של remindersNightly */}
            {config.integrations?.sms?.enabled && (
              <div style={{ marginTop: 8 }}>
                <Field label="📱 טלפון-המנהל לתקציר-הבוקר היומי (תזכורות אוטומטיות)">
                  <TextInput
                    value={integrationSetting(config, 'sms', 'adminPhone')}
                    onChange={(v) => setIntegrationField('sms', 'adminPhone', v)}
                    dir="ltr"
                    placeholder="050-0000000"
                  />
                </Field>
              </div>
            )}
            {/* 📝 תבניות-הודעה עריכות (#12) — מוצג כשוואטסאפ דלוק; ריק = ברירת-המחדל */}
            {config.integrations?.whatsapp?.enabled && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📝 נוסחי ההודעות של הארגון</div>
                {TEMPLATE_DEFS.map((d) => (
                  <Field key={d.key} label={d.label + ' — משתנים: ' + d.vars.map((v) => '{' + v + '}').join(' ')}>
                    <TextInput
                      value={config.templates?.[d.key] ?? ''}
                      onChange={(v) => {
                        const templates = { ...config.templates };
                        if (v.trim()) templates[d.key] = v;
                        else delete templates[d.key];
                        patch({ templates });
                      }}
                      placeholder={d.def}
                    />
                  </Field>
                ))}
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  ריק = הנוסח המובנה. ההודעה תמיד נפתחת לעריכה לפני שליחה — זו נקודת-הפתיחה.
                </div>
              </div>
            )}
            {config.integrations?.mail?.enabled && (
              <div style={{ marginTop: 8 }}>
                <Field label="📧 מייל-היעד לתקציר-הבוקר היומי (תזכורות אוטומטיות)">
                  <TextInput
                    value={integrationSetting(config, 'mail', 'digestTo')}
                    onChange={(v) => setIntegrationField('mail', 'digestTo', v)}
                    dir="ltr"
                    placeholder="manager@org.org"
                  />
                </Field>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  מייל-הקבלות לתורם נשלח אוטומטית לכתובת-התורם; התקציר — לכתובת שכאן. דורש שרת-הרחבות פרוס.
                </div>
              </div>
            )}
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
              כלול במערכת (בלי תוספת):{' '}
              {Object.entries(INTEGRATION_LABELS)
                .filter(
                  ([k]) =>
                    INTEGRATION_STATUS[k] === 'included' &&
                    // כנות: קבלות-§46 חיות במודול התורמים — כבוי ⇒ לא "כלול" (ביקורת 4.8)
                    (k !== 'receipts' || config.modules.supporters !== false),
                )
                .map(([, label]) => label)
                .join(' · ')}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 }}>
              🔜 בפיתוח (לא נמכר עדיין):{' '}
              {Object.entries(INTEGRATION_LABELS)
                .filter(([k]) => INTEGRATION_STATUS[k] === 'roadmap')
                .map(([, label]) => label)
                .join(' · ')}
            </div>
          </SectionShell>
        )}

        {/* 🌐 האתר הציבורי (דף-התרומות) — עריכת config.site בסגנון-האשף.
            אותו צינור live-apply (patch): כל שינוי מוחל מיד ומסתנכרן; "🔎 תצוגה מקדימה"
            פותח את האתר בכרטיסייה חדשה. מוסתר בזמן חיפוש. */}
        {!searching && (() => {
          const siteShown = !!config.site && config.site.enabled !== false;
          const camp = wsite.campaign ?? {};
          const phonesText = (wsite.contact?.phones ?? []).join(', ');
          return (
          <SectionShell
            id="wz-site"
            emoji="🌐"
            title="האתר הציבורי"
            meta="דף-תרומות · מוזן מהקונפיג"
            open={isOpen('publicsite')}
            onToggleOpen={() => flipOpen('publicsite')}
            headerEnd={
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  cursor: 'pointer',
                  color: siteShown ? 'var(--ink-soft)' : 'var(--ink-faint)',
                  whiteSpace: 'nowrap',
                }}
              >
                <input
                  type="checkbox"
                  checked={siteShown}
                  onChange={() => setSite({ enabled: !siteShown })}
                  aria-label="האתר הציבורי מוצג"
                  style={{ width: 'auto', accentColor: 'var(--accent-deep)' }}
                />
                {siteShown ? 'מוצג' : 'מוסתר'}
              </label>
            }
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', paddingTop: 6, marginBottom: 4 }}>
              <Btn onClick={previewSite}>🔎 תצוגה מקדימה</Btn>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                נפתח בכרטיסייה חדשה (‎?site‎). כל שינוי כאן מוחל מיד.
              </span>
            </div>

            {/* 🎨 מיתוג */}
            <SubHead>🎨 מיתוג</SubHead>
            <Field label="שורת-מותג (מתחת לשם, בניווט)">
              <TextInput value={siteHe(wsite.brandLine)} onChange={(v) => setSiteText('brandLine', v)} placeholder="אור לאלמנה וליתום" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
              <Field label="אייקון">
                <TextInput value={wsite.icon ?? ''} onChange={(v) => setSite({ icon: v || undefined })} placeholder="🕯️" />
              </Field>
              <Field label="תג מעל הכותרת (Hero)">
                <TextInput value={siteHe(wsite.heroBadge)} onChange={(v) => setSiteText('heroBadge', v)} placeholder="2,800 משפחות איתנו היום" />
              </Field>
            </div>

            {/* ✍️ טקסטים ראשיים (עברית; en/yi קיימים נשמרים) */}
            <SubHead>✍️ טקסטים ראשיים</SubHead>
            <Field label="כותרת ראשית (Hero)">
              <TextInput value={siteHe(wsite.heroTitle)} onChange={(v) => setSiteText('heroTitle', v)} placeholder="הבית של" />
            </Field>
            <Field label="מילה מודגשת (בקורל, שורה שנייה)">
              <TextInput value={siteHe(wsite.titleAccent)} onChange={(v) => setSiteText('titleAccent', v)} placeholder="האלמנות." />
            </Field>
            <Field label="תת-כותרת (פסקת פתיחה)">
              <TextInput value={siteHe(wsite.tagline)} onChange={(v) => setSiteText('tagline', v)} placeholder="כבר 24 שנה…" />
            </Field>
            <Field label="רצועת קמפיין עליונה (טיקר)">
              <TextInput value={siteHe(wsite.ticker)} onChange={(v) => setSiteText('ticker', v)} placeholder="קמפיין החגים · ₪X נאספו · מתעדכן חי" />
            </Field>
            <Field label="שורת מיקרו (מתחת לכפתור)">
              <TextInput value={siteHe(wsite.microCopy)} onChange={(v) => setSiteText('microCopy', v)} placeholder="כל ₪9 = ארוחה חמה לילד ♡" />
            </Field>

            {/* 🧩 שירותים */}
            <SubHead>🧩 שירותים (מה אנחנו עושות)</SubHead>
            <Field label="כותרת הסעיף">
              <TextInput value={siteHe(wsite.servicesHeading)} onChange={(v) => setSiteText('servicesHeading', v)} placeholder="שישה דרכים לחבק משפחה" />
            </Field>
            <ListEditor<PublicSiteService>
              items={wsite.services ?? []}
              onChange={(v) => setSite({ services: v })}
              empty={() => ({ title: '' })}
              addLabel="שירות"
              row={(it, set) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 6 }}>
                    <Field label="אייקון"><TextInput value={it.icon ?? ''} onChange={(v) => set({ icon: v })} placeholder="🍞" /></Field>
                    <Field label="כותרת"><TextInput value={siteHe(it.title)} onChange={(v) => set({ title: putHe(it.title, v) ?? '' })} /></Field>
                  </div>
                  <Field label="תיאור"><TextInput value={siteHe(it.text)} onChange={(v) => set({ text: putHe(it.text, v) })} /></Field>
                </>
              )}
            />

            {/* 📈 מספרים + גרף */}
            <SubHead>📈 מספרים</SubHead>
            <ListEditor<PublicSiteStat>
              items={wsite.stats ?? []}
              onChange={(v) => setSite({ stats: v })}
              empty={() => ({ value: '', label: '' })}
              addLabel="מספר"
              row={(it, set) => (
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6 }}>
                  <Field label="ערך"><TextInput dir="ltr" value={it.value} onChange={(v) => set({ value: v })} placeholder="2,800" /></Field>
                  <Field label="תווית"><TextInput value={siteHe(it.label)} onChange={(v) => set({ label: putHe(it.label, v) })} placeholder="משפחות בליווי" /></Field>
                </div>
              )}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="תווית גרף-הצמיחה">
                <TextInput value={siteHe(wsite.growth?.label)} onChange={(v) => setGrowth({ label: putHe(wsite.growth?.label, v) })} placeholder="סלים · 12 חודשים" />
              </Field>
              <Field label="שינוי (טקסט)">
                <TextInput value={wsite.growth?.delta ?? ''} onChange={(v) => setGrowth({ delta: v || undefined })} placeholder="+38% מהשנה שעברה" />
              </Field>
            </div>

            {/* 🛡️ שקיפות ואמון */}
            <SubHead>🛡️ שקיפות ואמון</SubHead>
            <Field label="כותרת">
              <TextInput value={siteHe(wsite.transparency?.heading)} onChange={(v) => setTransp({ heading: putHe(wsite.transparency?.heading, v) })} placeholder="כל שקל מתועד…" />
            </Field>
            <Field label="טקסט">
              <TextInput value={siteHe(wsite.transparency?.text)} onChange={(v) => setTransp({ text: putHe(wsite.transparency?.text, v) })} />
            </Field>
            <Field label="מדליוני-אמון (שורה לכל אחד)">
              <textarea style={TA_STYLE} value={heLines(wsite.transparency?.badges)} onChange={(e) => setTransp({ badges: toLines(e.target.value) })} placeholder={'ניהול תקין 2026\nאישור סעיף 46\nדו״ח שנתי פתוח'} />
            </Field>

            {/* 📖 סיפור + מייסד + ציר-זמן */}
            <SubHead>📖 סיפור</SubHead>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="כותרת הסיפור"><TextInput value={siteHe(wsite.storyTitle)} onChange={(v) => setSiteText('storyTitle', v)} placeholder="24 שנה של בית חם." /></Field>
              <Field label="מילה מודגשת"><TextInput value={siteHe(wsite.storyTitleAccent)} onChange={(v) => setSiteText('storyTitleAccent', v)} placeholder="וזה רק מתחיל." /></Field>
            </div>
            <Field label="הסיפור (פסקה)">
              <textarea style={TA_STYLE} value={siteHe(wsite.story)} onChange={(e) => setSiteText('story', e.target.value)} placeholder="לפני 24 שנה…" />
            </Field>
            <Field label="צ׳יפ-ברכה">
              <TextInput value={siteHe(wsite.storyBadge)} onChange={(v) => setSiteText('storyBadge', v)} placeholder="בברכת גדולי ישראל ♡" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="שם המייסד/ת"><TextInput value={siteHe(wsite.founder?.name)} onChange={(v) => setFounder({ name: putHe(wsite.founder?.name, v) })} placeholder="מרים לוצקין · מייסדת" /></Field>
              <Field label="תמונת מייסד/ת (https)"><TextInput dir="ltr" value={wsite.founder?.photo ?? ''} onChange={(v) => setFounder({ photo: v || undefined })} placeholder="https://…jpg" /></Field>
            </div>
            <Field label="ציטוט המייסד/ת">
              <TextInput value={siteHe(wsite.founder?.quote)} onChange={(v) => setFounder({ quote: putHe(wsite.founder?.quote, v) })} placeholder="חסד אמיתי זה לא לתת — זה להיות שם." />
            </Field>
            <div style={{ fontSize: 12, fontWeight: 600, margin: '6px 0 0', color: 'var(--ink-soft)' }}>ציר-זמן (אבני-דרך)</div>
            <ListEditor<PublicSiteMilestone>
              items={wsite.timeline ?? []}
              onChange={(v) => setSite({ timeline: v })}
              empty={() => ({ year: '', title: '' })}
              addLabel="אבן-דרך"
              row={(it, set) => (
                <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 6 }}>
                  <Field label="שנה"><TextInput dir="ltr" value={it.year} onChange={(v) => set({ year: v })} placeholder="2002" /></Field>
                  <Field label="כותרת"><TextInput value={siteHe(it.title)} onChange={(v) => set({ title: putHe(it.title, v) ?? '' })} placeholder="ההתחלה" /></Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="הערה"><TextInput value={siteHe(it.note)} onChange={(v) => set({ note: putHe(it.note, v) })} placeholder="סל ראשון לשכנה" /></Field>
                  </div>
                </div>
              )}
            />

            {/* 🧮 מחשבון */}
            <SubHead>🧮 מחשבון-השפעה</SubHead>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
              <Field label="₪ ליחידה">
                <input type="number" min={1} dir="ltr" value={wsite.calc?.unitAmount ?? ''} onChange={(e) => setCalcF({ unitAmount: e.target.value ? Math.max(1, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} />
              </Field>
              <Field label="שם היחידה">
                <TextInput value={siteHe(wsite.calc?.unit)} onChange={(v) => setCalcF({ unit: putHe(wsite.calc?.unit, v) })} placeholder="ארוחות חמות" />
              </Field>
            </div>
            <Field label="הערת המחשבון">
              <TextInput value={siteHe(wsite.calc?.note)} onChange={(v) => setCalcF({ note: putHe(wsite.calc?.note, v) })} placeholder="כל ₪9 = ארוחה חמה לילד ♡" />
            </Field>

            {/* 📊 קמפיין */}
            <SubHead>📊 קמפיין</SubHead>
            <Field label="כותרת הקמפיין (מעל בוחר-התרומה)">
              <TextInput value={siteHe(camp.title)} onChange={(v) => setCamp({ title: putHe(camp.title, v) })} placeholder="בחרו את התרומה שלכם" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="🎯 יעד הגיוס (₪)">
                <input type="number" min={0} dir="ltr" value={camp.goal ?? ''} onChange={(e) => setCamp({ goal: e.target.value ? Math.max(0, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} />
              </Field>
              <Field label="💰 נאסף עד כה (₪)">
                <input type="number" min={0} dir="ltr" value={camp.raised ?? ''} onChange={(e) => setCamp({ raised: e.target.value ? Math.max(0, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} />
              </Field>
            </div>
            <Field label="📅 תאריך יעד (סוף הקמפיין · לספירה לאחור)">
              <input type="date" dir="ltr" value={camp.end ?? ''} onChange={(e) => setCamp({ end: e.target.value || undefined })} style={NUM_STYLE} />
            </Field>

            {/* 💳 בוחר-תרומה */}
            <SubHead>💳 בוחר-תרומה</SubHead>
            <Field label="🔗 כפתור התרומה (https) — קישור לעמוד-הסליקה">
              <TextInput dir="ltr" value={wsite.donateUrl ?? ''} onChange={(v) => setSite({ donateUrl: v })} placeholder="https://pay.example/give" />
            </Field>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              ריק — הכפתור נופל אוטומטית לקישור-התשלום מ«הרחבות ← 💳 תשלומים» אם הוגדר.
            </div>
            <Field label="הערת-תחתית">
              <TextInput value={siteHe(wsite.donateNote)} onChange={(v) => setSiteText('donateNote', v)} placeholder="תרומות מוכרות למס לפי סעיף 46 · ביטול בכל רגע" />
            </Field>
            <div style={{ fontSize: 12, fontWeight: 600, margin: '6px 0 0', color: 'var(--ink-soft)' }}>אמצעי-תשלום</div>
            <ListEditor<PublicSitePayMethod>
              items={wsite.paymentMethods ?? []}
              onChange={(v) => setSite({ paymentMethods: v })}
              empty={() => ({ label: '', detail: '' })}
              addLabel="אמצעי-תשלום"
              row={(it, set) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 6 }}>
                    <Field label="שם"><TextInput value={siteHe(it.label)} onChange={(v) => set({ label: putHe(it.label, v) ?? '' })} placeholder="אונליין" /></Field>
                    <Field label="פרטים"><TextInput value={siteHe(it.detail)} onChange={(v) => set({ detail: putHe(it.detail, v) ?? '' })} placeholder="אשראי / ביט / PayPal" /></Field>
                  </div>
                  <Chip on={!!it.ltr} onClick={() => set({ ltr: !it.ltr })}>{it.ltr ? '↤ שמאל (LTR)' : 'יישור אוטומטי'}</Chip>
                </>
              )}
            />

            {/* 💬 עדויות */}
            <SubHead>💬 עדויות</SubHead>
            <ListEditor<PublicSiteTestimonial>
              items={wsite.testimonials ?? []}
              onChange={(v) => setSite({ testimonials: v })}
              empty={() => ({ quote: '' })}
              addLabel="עדות"
              row={(it, set) => (
                <>
                  <Field label="ציטוט"><TextInput value={siteHe(it.quote)} onChange={(v) => set({ quote: putHe(it.quote, v) ?? '' })} /></Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <Field label="שם"><TextInput value={it.author ?? ''} onChange={(v) => set({ author: v })} placeholder="ר׳" /></Field>
                    <Field label="תפקיד/מיקום"><TextInput value={siteHe(it.role)} onChange={(v) => set({ role: putHe(it.role, v) })} placeholder="אם לשלושה · ירושלים" /></Field>
                  </div>
                </>
              )}
            />

            {/* 🎯 מסלולי-שותפות */}
            <SubHead>🎯 מסלולי-שותפות</SubHead>
            <ListEditor<PublicSiteTier>
              items={wsite.tiers ?? []}
              onChange={(v) => setSite({ tiers: v })}
              empty={() => ({ name: '' })}
              addLabel="מסלול"
              row={(it, set) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 6 }}>
                    <Field label="שם"><TextInput value={siteHe(it.name)} onChange={(v) => set({ name: putHe(it.name, v) ?? '' })} placeholder="שותפה ♡" /></Field>
                    <Field label="סכום (₪)"><input type="number" min={0} dir="ltr" value={it.amount ?? ''} onChange={(e) => set({ amount: e.target.value ? Math.max(0, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} /></Field>
                    <Field label="לתקופה"><TextInput value={siteHe(it.period)} onChange={(v) => set({ period: putHe(it.period, v) })} placeholder="/ חודש" /></Field>
                  </div>
                  <Field label="הטבות (שורה לכל אחת)">
                    <textarea style={TA_STYLE} value={heLines(it.perks)} onChange={(e) => set({ perks: toLines(e.target.value) })} placeholder={'2 סלים שבועיים\nשם על לוח השותפים'} />
                  </Field>
                  <Chip on={!!it.featured} onClick={() => set({ featured: !it.featured })}>{it.featured ? '★ מודגש (הכי אהוב)' : 'רגיל'}</Chip>
                </>
              )}
            />

            {/* 📅 אירועים */}
            <SubHead>📅 אירועים</SubHead>
            <ListEditor<PublicSiteEvent>
              items={wsite.events ?? []}
              onChange={(v) => setSite({ events: v })}
              empty={() => ({ title: '' })}
              addLabel="אירוע"
              row={(it, set) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6 }}>
                    <Field label="תאריך (תצוגה)"><TextInput value={it.date ?? ''} onChange={(v) => set({ date: v })} placeholder="14 ספט׳" /></Field>
                    <Field label="כותרת"><TextInput value={siteHe(it.title)} onChange={(v) => set({ title: putHe(it.title, v) ?? '' })} placeholder="מגבית ערב ראש השנה" /></Field>
                  </div>
                  <Field label="פרטים"><TextInput value={siteHe(it.meta)} onChange={(v) => set({ meta: putHe(it.meta, v) })} placeholder="שידור חי · כל הארץ" /></Field>
                </>
              )}
            />

            {/* ❓ שאלות ותשובות */}
            <SubHead>❓ שאלות נפוצות</SubHead>
            <ListEditor<PublicSiteFaq>
              items={wsite.faq ?? []}
              onChange={(v) => setSite({ faq: v })}
              empty={() => ({ q: '', a: '' })}
              addLabel="שאלה"
              row={(it, set) => (
                <>
                  <Field label="שאלה"><TextInput value={siteHe(it.q)} onChange={(v) => set({ q: putHe(it.q, v) ?? '' })} placeholder="לאן הולך הכסף שלי?" /></Field>
                  <Field label="תשובה"><textarea style={TA_STYLE} value={siteHe(it.a)} onChange={(e) => set({ a: putHe(it.a, e.target.value) ?? '' })} /></Field>
                </>
              )}
            />

            {/* 🖼️ גלריה + מרקיזה */}
            <SubHead>🖼️ גלריה ומרקיזה</SubHead>
            <Field label="תמונות גלריה (כתובת https · שורה לכל תמונה)">
              <textarea style={TA_STYLE} dir="ltr" value={(wsite.gallery ?? []).join('\n')} onChange={(e) => setSite({ gallery: toLines(e.target.value) })} placeholder={'https://…/1.jpg\nhttps://…/2.jpg'} />
            </Field>
            <Field label="מרקיזה נגללת (שורה לכל פריט)">
              <textarea style={TA_STYLE} value={heLines(wsite.marquee)} onChange={(e) => setSite({ marquee: toLines(e.target.value) })} placeholder={'סל למשפחה = ₪90\n92% מכל שקל — ישירות למשפחות'} />
            </Field>

            {/* 📰 חדשות */}
            <SubHead>📰 חדשות</SubHead>
            <Field label="עדכון «מה חדש»">
              <TextInput value={siteHe(wsite.news)} onChange={(v) => setSiteText('news', v)} placeholder="נפתחה ההרשמה למלגות…" />
            </Field>

            {/* 📞 פרטי קשר */}
            <SubHead>📞 פרטי קשר</SubHead>
            <Field label="טלפונים (מופרדים בפסיק)">
              <TextInput dir="ltr" value={phonesText} onChange={(v) => setSiteContact({ phones: v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) })} placeholder="02-000-0000, 058-000-0000" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="וואטסאפ"><TextInput dir="ltr" value={wsite.contact?.whatsapp ?? ''} onChange={(v) => setSiteContact({ whatsapp: v })} placeholder="058-000-0000" /></Field>
              <Field label="אימייל"><TextInput dir="ltr" value={wsite.contact?.email ?? ''} onChange={(v) => setSiteContact({ email: v })} placeholder="info@org.org.il" /></Field>
            </div>
            <Field label="שעות פעילות"><TextInput value={siteHe(wsite.contact?.hours)} onChange={(v) => setSiteContact({ hours: putHe(wsite.contact?.hours, v) })} placeholder="א׳–ה׳ 9:00–17:00 · ו׳ עד 12:00" /></Field>
            <Field label="כתובת"><TextInput value={siteHe(wsite.contact?.address)} onChange={(v) => setSiteContact({ address: putHe(wsite.contact?.address, v) })} placeholder="רחוב… , עיר" /></Field>
            <Field label="הערת-תחתית משפטית"><TextInput value={siteHe(wsite.contact?.taxNote)} onChange={(v) => setSiteContact({ taxNote: putHe(wsite.contact?.taxNote, v) })} placeholder="ע.ר. 580… · אישור ניהול תקין" /></Field>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <Chip on={wsite.contactForm?.enabled !== false} onClick={() => setSiteForm({ enabled: wsite.contactForm?.enabled === false })}>
                {wsite.contactForm?.enabled !== false ? '✅ טופס-קשר מוצג' : 'טופס-קשר מוסתר'}
              </Chip>
            </div>
            <Field label="הערת טופס-הקשר"><TextInput value={siteHe(wsite.contactForm?.note)} onChange={(v) => setSiteForm({ note: putHe(wsite.contactForm?.note, v) })} placeholder="מענה תוך יום עסקים · דיסקרטיות מלאה" /></Field>
          </SectionShell>
          );
        })()}

        {/* ☎️ טלפוניה (downstream בלבד) — מקטע-חי המחווט את מנוע-הטלפוניה הטהור:
            הזנת ציוד-הלקוח → סימולציית עץ-הטלפון + דוח-אמון → הפקת קונפיג-מרכזייה.
            מבודד לחלוטין: אין ספק/API/trunk, אפס נגיעה בכסף/קבלות. מוסתר בזמן חיפוש. */}
        {!searching && (() => {
          // מתג-מקטע opt-in — **ברירת-מחדל כבוי** (הפוך ממודול): רק enabled:true מדליק.
          const telOn = config.telephony?.enabled === true;
          const setTelOn = (on: boolean) =>
            patch({ telephony: { ...(config.telephony ?? emptyTelephonyConfig()), enabled: on } });
          return (
          <SectionShell
            id="wz-telephony"
            emoji="☎️"
            title="טלפוניה"
            meta="איחוד-קווים · downstream בלבד"
            open={isOpen('telephony')}
            onToggleOpen={() => flipOpen('telephony')}
            headerEnd={
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  cursor: 'pointer',
                  color: telOn ? 'var(--ink-soft)' : 'var(--ink-faint)',
                  whiteSpace: 'nowrap',
                }}
              >
                <input
                  type="checkbox"
                  checked={telOn}
                  onChange={() => setTelOn(!telOn)}
                  aria-label="מודול טלפוניה פעיל"
                  style={{ width: 'auto', accentColor: 'var(--accent-deep)' }}
                />
                {telOn ? 'פעיל' : 'כבוי'}
              </label>
            }
          >
            <div style={{ opacity: telOn ? 1 : 0.55 }}>
              <TelephonyPanel
                value={config.telephony}
                onChange={(telephony) => patch({ telephony: { ...telephony, enabled: telOn } })}
                orgName={config.orgName}
                slug={config.slug || 'default'}
              />
            </div>
          </SectionShell>
          );
        })()}

        {/* 💰 תמחור חי — מתעדכן עם כל מתג. המחירים נשמרים מקומית (מכשיר-המטמיע). */}
        <section
          aria-label="תמחור והצעה"
          style={{ marginTop: 16, border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', background: 'var(--panel)' }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <Chip on={dealMode === 'subscription'} onClick={() => setDealMode('subscription')}>💳 מנוי חודשי</Chip>
            <Chip on={dealMode === 'enterprise'} onClick={() => setDealMode('enterprise')}>💼 Enterprise (על הענן שלו)</Chip>
          </div>

          {dealMode === 'subscription' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0 }}>💰 הצעת מחיר — חי</h3>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{shekel(quote.monthly)}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-faint)' }}> / חודש</span></div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                שנתי מראש {shekel(quote.yearlyDiscounted)} <small>(חודשיים חינם)</small>{quote.setup > 0 ? ` · הקמה ${shekel(quote.setup)}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)', alignSelf: 'center' }}>גודל הארגון:</span>
                {(['small', 'medium', 'large'] as OrgSize[]).map((s) => (
                  <Chip key={s} on={size === s} onClick={() => setSize(s)}>
                    {SIZE_LABELS[s]} ×{prices.sizeMult[s]}
                  </Chip>
                ))}
              </div>
              {quote.lines.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
                  בסיס {shekel(quote.base)}
                  {quote.lines.map((l) => (
                    <span key={l.key}> · {l.label} {shekel(l.price)}</span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0 }}>💼 Enterprise — על הענן שלו</h3>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{shekel(quote.enterpriseOneTime)}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-faint)' }}> חד-פעמי</span></div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                + תחזוקה שנתית {shekel(quote.enterpriseAnnual)} · הנתונים והתשתית בבעלות הלקוח
              </div>
              <div style={{ display: 'flex', gap: '6px 10px', flexWrap: 'wrap', marginTop: 10, fontSize: 12.5, alignItems: 'center' }}>
                <span>חד-פעמי:</span>
                <PriceInput value={prices.enterprise.oneTime} onChange={(n) => setPrice({ enterprise: { ...prices.enterprise, oneTime: n } })} />
                <span>תחזוקה שנתית:</span>
                <PriceInput value={prices.enterprise.annualMaintenance} onChange={(n) => setPrice({ enterprise: { ...prices.enterprise, annualMaintenance: n } })} />
              </div>
            </>
          )}

          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--ink-soft)' }}>✏️ עריכת מחירים (נשמר אצלך)</summary>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 10px', alignItems: 'center', marginTop: 8, fontSize: 12.5 }}>
              <span>מנוי בסיס / חודש</span>
              <PriceInput value={prices.base} onChange={(n) => setPrice({ base: n })} />
              {ALL_MODULES.map((m) => (
                <PriceRow
                  key={m}
                  label={termOf(config, `nav.${m}`, MODULE_SHORT[m] ?? m)}
                  value={prices.modules[m] ?? 0}
                  onChange={(n) => setPrice({ modules: { ...prices.modules, [m]: n } })}
                />
              ))}
              {Object.keys(INTEGRATION_LABELS)
                .filter((k) => INTEGRATION_STATUS[k] === 'live')
                .map((k) => (
                  <PriceRow
                    key={k}
                    label={INTEGRATION_LABELS[k]}
                    value={prices.integrations[k] ?? 0}
                    onChange={(n) => setPrice({ integrations: { ...prices.integrations, [k]: n } })}
                  />
                ))}
              <span>הקמה חד-פעמית</span>
              <PriceInput value={prices.setup} onChange={(n) => setPrice({ setup: n })} />
            </div>
          </details>
        </section>

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
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--hover-bg, var(--panel))',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
            }}
            title="טעינת config.json שמור — פתיחה ועריכה של מערכת לקוח קיימת"
          >
            📂 טען config שמור לעריכה
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                importConfig(e.target.files?.[0]);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />
          </label>
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
              overflowY: 'hidden',
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
