/**
 * 🌐 מסך «עריכת האתר» למנהל-הארגון (29.10.2026, «מערכת לשליטה … פתוח למנהל הארגון לעריכת האתר»).
 *
 * נפתח ב-‎#site-edit‎ אחרי התחברות (App — לפני שער-החברות). ההרשאה = המייל ב-publicSites/{slug}.editors
 * (או מייל-על); נאכפת גם ב-Rules v5. העורך = SiteContentEditor המשותף עם האשף (אותם שדות בדיוק).
 * זרימה: טיוטה מקומית ⇒ «💾 שמירה ופרסום» ⇒ ענן ⇒ האתר-הציבורי קורא בטעינה הבאה (REST). אין כאן שום
 * נגיעה בנתוני-המשרד. מייל-על בלבד: הפעלה ראשונה (יצירת המסמך מהתוכן הנוכחי) + ניהול רשימת-העורכים.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin, normalizeConfig, normalizeSite } from '../../lib/config';
import { SITE_DOMAINS, publicSiteSlugFor } from '../../lib/siteDomains';
import { SiteContentEditor } from '../builder/SiteContentEditor';
import { Btn } from '../ui';
import type { PublicSiteContent } from '../../types/config';
import type { PublicSiteDoc } from '../../lib/cloudConfig';

const PublicSite = lazy(async () => ({ default: (await import('../public/PublicSite')).PublicSite }));

type Phase = 'loading' | 'none' | 'denied' | 'unverified' | 'edit' | 'error';

/** כתובת האתר-החי של הארגון: הדומיין שלו אם יש, אחרת ‎?org=…&site=1‎. */
export function liveSiteUrl(slug: string): string {
  const dom = Object.entries(SITE_DOMAINS).find(([, d]) => d.slug === slug)?.[0];
  if (dom) return `https://${dom}/`;
  try {
    const u = new URL(window.location.href);
    u.hash = '';
    u.searchParams.set('org', slug);
    u.searchParams.set('site', '1');
    return u.toString();
  } catch {
    return `./?org=${encodeURIComponent(slug)}&site=1`;
  }
}

/** תוכן-האתר מקובץ-הקונפיג הסטטי (public/c/<slug>/config.json) — לזריעה הראשונה. כשל ⇒ undefined. */
async function fetchStaticSite(slug: string): Promise<PublicSiteContent | undefined> {
  try {
    const res = await fetch(new URL(`c/${encodeURIComponent(slug)}/config.json`, document.baseURI).toString(), { cache: 'no-cache' });
    return res.ok ? normalizeConfig(await res.json())?.site : undefined;
  } catch {
    return undefined;
  }
}

/** האם המייל רשאי לערוך (מסמך-האתר + מייל-על). טהור. */
export function canEditSite(email: string | null | undefined, d: PublicSiteDoc | null): boolean {
  const e = (email || '').trim().toLowerCase();
  if (!e) return false;
  if (isSuperAdmin(e)) return true;
  return !!d?.editors?.some((x) => x.trim().toLowerCase() === e);
}

export function SiteEditorPage({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const email = useApp((s) => s.cloud.user?.email ?? '');
  const toast = useApp((s) => s.toast);
  // משרד-פלטפורמה (mavr-hchsd) עורך את האתר של הדומיין שלו (maor-hachesed) — officeSlug ב-SITE_DOMAINS
  const slug = publicSiteSlugFor(config.slug) ?? (config.slug || 'default');
  const superUser = isSuperAdmin(email);

  const [phase, setPhase] = useState<Phase>('loading');
  const [docData, setDocData] = useState<PublicSiteDoc | null>(null);
  const [draft, setDraft] = useState<PublicSiteContent>({});
  const [saved, setSaved] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [armClose, setArmClose] = useState(false);
  const [editorsText, setEditorsText] = useState('');
  const baseSite = useRef<PublicSiteContent | undefined>(config.site);

  const load = async () => {
    setPhase('loading');
    try {
      const m = await import('../../store/cloudSync');
      const d = await m.fetchPublicSiteDoc(slug);
      // נקודת-הזריעה: במשרד שאינו האתר עצמו — התוכן הנוכחי של האתר (קובץ-הקונפיג שלו), לא ה-site של המשרד
      if (!d && slug !== config.slug) baseSite.current = await fetchStaticSite(slug);
      setDocData(d);
      setEditorsText((d?.editors ?? []).join(', '));
      if (!d) { setPhase(superUser ? 'none' : 'denied'); return; }
      if (!canEditSite(email, d)) { setPhase('denied'); return; }
      // Rules v5 דורשים מייל-מאומת לעורך (חסימת חטיפת-זהות-מוקדמת) — בודקים כאן כדי להסביר, לא רק להיכשל בשמירה
      if (!superUser && !(await m.refreshEmailVerified())) { setPhase('unverified'); return; }
      const site = normalizeSite(d.site) ?? baseSite.current ?? {};
      setDraft(site);
      setSaved(JSON.stringify(site));
      setPhase('edit');
    } catch {
      setPhase('error');
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- טעינה פעם אחת לפי slug/מייל
  useEffect(() => { void load(); }, [slug, email]);

  const dirty = phase === 'edit' && JSON.stringify(draft) !== saved;
  useEffect(() => { if (!dirty) setArmClose(false); }, [dirty]);

  // תצוגה-מקדימה: האתר האמיתי (PublicSite) עם הטיוטה — בזיכרון בלבד, לא נשמר בשום מקום
  useEffect(() => {
    if (!preview) return;
    const prev = useApp.getState().config;
    useApp.setState({ config: { ...prev, site: normalizeSite(draft) ?? draft } });
    return () => { useApp.setState((st) => ({ config: { ...st.config, site: prev.site } })); };
  }, [preview, draft]);

  const save = async () => {
    if (busy) return;
    const clean = normalizeSite(draft);
    if (!clean) { toast('אין מה לשמור — התוכן ריק'); return; }
    setBusy(true);
    try {
      const m = await import('../../store/cloudSync');
      await m.savePublicSite(slug, clean, email);
      setDraft(clean);
      setSaved(JSON.stringify(clean));
      setDocData((d) => ({ ...(d ?? {}), site: clean as Record<string, unknown>, updatedAt: new Date().toISOString(), updatedBy: email.toLowerCase() }));
      toast('✅ נשמר — האתר מתעדכן לכל המבקרים');
    } catch {
      toast('❌ השמירה נכשלה — בדקו חיבור/הרשאה ונסו שוב');
    } finally {
      setBusy(false);
    }
  };

  const createDoc = async () => {
    if (busy) return;
    const editors = editorsText.split(/[,\s]+/).filter((x) => x.includes('@'));
    setBusy(true);
    try {
      const m = await import('../../store/cloudSync');
      await m.createPublicSite(slug, normalizeSite(baseSite.current) ?? {}, editors, email);
      toast('✅ עריכת-האתר הופעלה');
      await load();
    } catch {
      toast('❌ ההפעלה נכשלה — רק מנהל-המערכת רשאי');
    } finally {
      setBusy(false);
    }
  };

  const saveEditors = async () => {
    if (busy) return;
    const editors = editorsText.split(/[,\s]+/).filter((x) => x.includes('@'));
    setBusy(true);
    try {
      const m = await import('../../store/cloudSync');
      await m.setPublicSiteEditors(slug, editors);
      setDocData((d) => ({ ...(d ?? {}), editors: editors.map((x) => x.toLowerCase()) }));
      toast('✅ רשימת-העורכים עודכנה');
    } catch {
      toast('❌ העדכון נכשל');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (dirty && !armClose) { setArmClose(true); return; }
    onClose();
  };

  const stamp = useMemo(() => {
    if (!docData?.updatedAt) return '';
    try {
      const d = new Date(docData.updatedAt);
      return `נשמר לאחרונה ${d.toLocaleDateString('he-IL')} ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}${docData.updatedBy ? ' · ' + docData.updatedBy : ''}`;
    } catch { return ''; }
  }, [docData]);

  const bar = (
    <div style={{ position: 'sticky', top: 0, zIndex: 300, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--panel)', borderBottom: '1px solid var(--line)', boxShadow: '0 4px 14px rgba(0,0,0,.06)' }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginInlineEnd: 'auto' }}>🌐 עריכת האתר — {config.orgName || slug}</div>
      {phase === 'edit' && (
        <>
          <span style={{ fontSize: 12, color: dirty ? '#b3362a' : 'var(--ink-faint)' }}>{dirty ? '● יש שינויים שלא נשמרו' : stamp || 'אין שינויים'}</span>
          <Btn onClick={() => setPreview((p) => !p)}>{preview ? '✏️ חזרה לעריכה' : '👁 תצוגה מקדימה'}</Btn>
          <Btn kind="primary" disabled={!dirty || busy} onClick={() => void save()}>{busy ? 'שומר…' : '💾 שמירה ופרסום'}</Btn>
          {dirty && <Btn onClick={() => setDraft(JSON.parse(saved) as PublicSiteContent)}>↩ ביטול שינויים</Btn>}
          <a href={liveSiteUrl(slug)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>🔗 לאתר החי</a>
        </>
      )}
      <Btn onClick={close}>{armClose ? 'לחצו שוב — לסגור בלי לשמור' : '✕ סגירה'}</Btn>
    </div>
  );

  let body: ReactNode;
  if (phase === 'loading') body = <div className="empty">טוען את תוכן האתר…</div>;
  else if (phase === 'error') body = <div className="empty">לא הצלחנו לטעון. <Btn onClick={() => void load()}>נסו שוב</Btn></div>;
  else if (phase === 'denied')
    body = (
      <div className="empty" style={{ maxWidth: 520, margin: '60px auto', lineHeight: 1.7 }}>
        <div style={{ fontSize: 34 }}>🔒</div>
        <div style={{ fontWeight: 800, fontSize: 17 }}>אין לך הרשאה לערוך את האתר של {config.orgName || slug}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-faint)' }}>מחובר/ת כ-{email}. לבקשת הרשאה — פנו למנהל המערכת.</div>
      </div>
    );
  else if (phase === 'unverified')
    body = (
      <div className="empty" style={{ maxWidth: 540, margin: '60px auto', lineHeight: 1.7 }}>
        <div style={{ fontSize: 34 }}>✉️</div>
        <div style={{ fontWeight: 800, fontSize: 17 }}>צריך לאמת את המייל לפני העריכה</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          שלחנו קישור-אימות ל-<b dir="ltr">{email}</b>. פתחו את המייל, לחצו על הקישור, וחזרו לכאן.
          (זו הגנה: כך רק בעל/ת המייל האמיתי/ת יכול/ה לערוך את האתר.)
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <Btn kind="primary" onClick={() => void load()}>אימתתי — המשך</Btn>
          <Btn onClick={() => { void import('../../store/cloudSync').then((m) => m.resendEmailVerification()).then(() => toast('נשלח שוב — בדקו גם בספאם'), () => toast('השליחה נכשלה — נסו בעוד דקה')); }}>שליחה חוזרת</Btn>
        </div>
      </div>
    );
  else if (phase === 'none')
    body = (
      <div style={{ maxWidth: 620, margin: '40px auto', padding: 16, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>🚀 הפעלת עריכת-האתר למנהל הארגון</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '8px 0 14px' }}>
          התוכן הנוכחי של האתר יועתק לענן, והעורכים שתרשמו כאן יוכלו לשנות אותו בעצמם (רק את האתר — לא את נתוני-המשרד).
        </div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>מיילים של עורכים (מופרדים בפסיק)</label>
        <input value={editorsText} onChange={(e) => setEditorsText(e.target.value)} dir="ltr" placeholder="manager@example.com" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginTop: 6 }} />
        <div style={{ marginTop: 14 }}><Btn kind="primary" disabled={busy} onClick={() => void createDoc()}>{busy ? 'מפעיל…' : 'הפעלה'}</Btn></div>
      </div>
    );
  else if (preview)
    body = (
      <Suspense fallback={<div className="empty">טוען תצוגה…</div>}>
        <PublicSite onEnter={() => setPreview(false)} />
      </Suspense>
    );
  else
    body = (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '12px 16px 60px' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '6px 0 10px', lineHeight: 1.6 }}>
          כל השדות כאן הם מה שהמבקרים רואים באתר. שדה ריק — לא מוצג באתר. השינויים נשמרים רק בלחיצה על «💾 שמירה ופרסום».
        </div>
        <SiteContentEditor site={draft} onChange={setDraft} />
        {superUser && (
          <div style={{ marginTop: 26, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div style={{ fontWeight: 800 }}>👥 מי רשאי לערוך (מנהל-מערכת בלבד)</div>
            <input value={editorsText} onChange={(e) => setEditorsText(e.target.value)} dir="ltr" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', margin: '6px 0' }} />
            <Btn disabled={busy} onClick={() => void saveEditors()}>שמירת רשימת-העורכים</Btn>
          </div>
        )}
      </div>
    );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {bar}
      {body}
    </div>
  );
}

/**
 * כניסה ייעודית לעריכת-האתר (‎#site-edit‎, לפני התחברות): כניסה · יצירת חשבון (עם מייל-אימות) · שכחתי סיסמה.
 * לא מסך-ההרשמה-לארגון של הפלטפורמה — עורך-אתר אינו ארגון חדש ואינו חבר-משרד.
 */
export function SiteEditorLogin() {
  const config = useApp((s) => s.config);
  const cloudSignIn = useApp((s) => s.cloudSignIn);
  const cloudResetPassword = useApp((s) => s.cloudResetPassword);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    if (busy) return;
    setBusy(true); setMsg('');
    try { await fn(); if (ok) setMsg(ok); }
    catch (e) { setMsg((e as Error)?.message || 'משהו השתבש — נסו שוב'); }
    finally { setBusy(false); }
  };
  const valid = email.includes('@') && password.length >= 6;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <form onSubmit={(e) => { e.preventDefault(); if (valid) void run(() => cloudSignIn(email.trim(), password)); }} style={{ width: '100%', maxWidth: 400, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, boxShadow: '0 10px 30px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: 28 }}>🌐</div>
        <h1 style={{ fontSize: 20, margin: '6px 0 2px' }}>עריכת האתר — {config.orgName || config.slug}</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>התחברו עם המייל שאושר לעריכת האתר.</div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>אימייל
          <input type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '9px 10px' }} />
        </label>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginTop: 10 }}>סיסמה
          <input type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '9px 10px' }} />
        </label>
        {msg && <div role="status" style={{ fontSize: 13, marginTop: 10, color: 'var(--ink-soft)' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Btn kind="primary" type="submit" disabled={!valid || busy}>{busy ? '…' : 'כניסה'}</Btn>
          <Btn disabled={!valid || busy} onClick={() => void run(async () => { const m = await import('../../store/cloudSync'); await m.signUp(email.trim(), password); }, 'החשבון נוצר — שלחנו מייל-אימות. לחצו על הקישור שבו.')}>יצירת חשבון</Btn>
          <Btn disabled={!email.includes('@') || busy} onClick={() => void run(() => cloudResetPassword(email.trim()), 'שלחנו מייל לאיפוס הסיסמה.')}>שכחתי סיסמה</Btn>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 12 }}>סיסמה — לפחות 6 תווים. יצירת חשבון לא נותנת הרשאה: ההרשאה ניתנת ע״י מנהל המערכת.</div>
      </form>
    </div>
  );
}
