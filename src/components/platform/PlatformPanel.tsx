/**
 * ☁️ לוח הבקרה של הבעלים (CLOUD2 ענן 4) — נפתח ב-#platform, **למיילי-על
 * בלבד** (השער ב-App, דפוס #builder). שלושה אזורים: בקשות ממתינות
 * (אישור⇒סלאג+יצירת ארגון all-off / דחייה), רשימת לקוחות (קישור להעתקה),
 * ועורך הלקוח — הלב: כל מתג נכתב **מיד** למסמך הענן ⇒ הלקוח המחובר רואה
 * חי (onSnapshot, ענן 2). "שמור — הוקם" ⇒ provisioned:true.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { normalizeConfig } from '../../lib/config';
import { featureEffectiveOn } from '../builder/sections';
import { FEATURES, TERM_DEFS } from '../../types/features';
import type { OrgConfig } from '../../types/config';
import { THEME_LABELS } from '../builder/handoff';
import { VERTICAL_PACKS, applyVerticalPack } from '../../lib/verticalPacks';
import { industryLabel, needLabel, sizeLabel } from '../../lib/signupWizard';
import { Btn, Chip, Field, FormError, Modal, Select, TextInput } from '../ui';
import { useArmed } from '../useArmed';
import { ALL_MODULES, MODULE_LABELS, allOffConfig, isValidSlug, orgLink, slugify } from './lib';

type CloudMod = typeof import('../../store/cloudSync');
interface ReqRow {
  uid: string;
  orgName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  at?: string;
  // פרופיל האשף (SIGNUP3)
  industry?: string;
  size?: string;
  needs?: string[];
}
interface OrgRow {
  slug: string;
  orgName?: string;
  provisioned?: boolean;
  members?: string[];
  config?: unknown;
}
interface LeadRow {
  id: string;
  contactName?: string;
  phone?: string;
  preferredTime?: string;
  notes?: string;
  at?: string;
}
/** בקשת-הצטרפות של עובד/ת (ORGADMIN) — מוצגת גם לבעלים: בלי זה, ארגון בלי
 *  מנהל-ממונה (או כשהבעלים הוא המנהל בפועל) לא היה רואה את הבקשה בשום מסך. */
interface JoinReqRow {
  slug: string;
  orgName?: string;
  uid: string;
  email?: string;
  name?: string;
  phone?: string;
  at?: string;
}

export function PlatformPanel(props: { onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(true);
  const [mod, setMod] = useState<CloudMod | null>(null);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [joinReqs, setJoinReqs] = useState<JoinReqRow[]>([]);
  // 🗑 מחיקת-לקוח (5.8) — מודאל עם הקלדת-הסלאג לאישור (הרסני, בלי דרך חזרה)
  const [delOrg, setDelOrg] = useState<OrgRow | null>(null);
  const [delTyped, setDelTyped] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [approveReq, setApproveReq] = useState<ReqRow | null>(null);
  const [slug, setSlug] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  /** חבילת-הפתיחה באישור (צינור-30-הדקות) — נזרעת מתחום-ההרשמה; '' = לידה all-off. */
  const [seedPack, setSeedPack] = useState('');
  const [slugErr, setSlugErr] = useState('');
  // עורך הלקוח
  const [sel, setSel] = useState('');
  const [cfg, setCfg] = useState<OrgConfig | null>(null);
  const [featModule, setFeatModule] = useState('');

  async function refresh(m: CloudMod) {
    setLoading(true);
    const [reqs, allRaw, lds] = await Promise.all([
      m.fetchOrgRequests().catch(() => []),
      m.fetchAllOrgs().catch(() => []),
      m.fetchOrgLeads().catch(() => []),
    ]);
    // מצבות-מחיקה (deleted:true) אינן לקוחות — מסוננות מהרשימה
    const all = allRaw.filter((o) => !o.deleted);
    setRequests(reqs);
    setOrgs(all);
    setLeads(lds);
    // בקשות-הצטרפות של עובדים (ORGADMIN) — הבעלים רואה את כולן, מכל הארגונים.
    // בלי זה בקשת "קוד מהבוס" נראתה רק בפאנל-המנהל (cloud.isManager) — ארגון
    // בלי מנהל-ממונה ⇒ הבקשה נעלמת מכל עין. כשל-קריאה פר-ארגון ⇒ [] (רך).
    const perOrg = await Promise.all(
      all.map(async (o) => {
        const rs = await m.fetchOrgJoinRequests(o.slug).catch(() => []);
        return rs.map((r) => ({ slug: o.slug, orgName: o.orgName, ...r }));
      }),
    );
    setJoinReqs(perOrg.flat());
    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    void import('../../store/cloudSync').then((m) => {
      if (!alive) return;
      setMod(m);
      void refresh(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  function openApprove(r: ReqRow) {
    setApproveReq(r);
    setSlug(slugify(r.orgName ?? '', orgs.map((o) => o.slug)));
    setManagerEmail((r.email ?? '').trim().toLowerCase());
    // צינור-30-הדקות: התחום שהלקוח בחר באשף-ההרשמה = חבילת-הפתיחה המוצעת
    // (הבעלים יכול להחליף/לבטל במודאל). לא תואם-חבילה ⇒ לידה all-off כרגיל.
    setSeedPack(VERTICAL_PACKS.some((p) => p.id === r.industry) ? (r.industry as string) : '');
    setSlugErr('');
  }

  /** הקמה ידנית (5.8 — טלפון-מסונן חוסם Firestore אצל הלקוח ⇒ אין בקשה):
   *  אותו מודאל-אישור בדיוק, בלי מסמך-בקשה — הבעלים מקליד שם+מייל בשיחה. */
  function openManualCreate() {
    setApproveReq({ uid: '', orgName: '', email: '' });
    setSlug('');
    setManagerEmail('');
    setSeedPack('');
    setSlugErr('');
  }

  async function approve() {
    if (!mod || !approveReq) return;
    if (!approveReq.orgName?.trim()) return setSlugErr('שם הארגון חסר');
    if (!isValidSlug(slug)) return setSlugErr('סלאג: אותיות לטיניות קטנות/ספרות/מקפים, 2-40 תווים');
    if (orgs.some((o) => o.slug === slug)) return setSlugErr('הסלאג כבר תפוס — בחרו אחר');
    // ORGADMIN — מייל-העל ממנה את המנהל ידנית (ברירת-מחדל = המבקש). המנהל = חבר
    // ראשון + org.manager; הוא ינהל את העובדות של הארגון שלו (Rules v3).
    const mgr = managerEmail.trim().toLowerCase();
    if (!mgr || !mgr.includes('@')) return setSlugErr('מייל המנהל חסר/לא תקין');
    // ציד-באגים 3.8.2026 (🟡): בדיקת-התנגשות טרייה מהענן (לא רק הרשימה בזיכרון
    // שעלולה להיות ישנה) — אחרת אישור עם slug קיים היה דורס ארגון חי (members/
    // manager/config) דרך merge:true. קריאה→כתיבה סוגרת את הפער כמעט לגמרי.
    const existing = await mod.fetchOrgCloudConfig(slug).catch(() => null);
    if (existing) return setSlugErr('הסלאג כבר קיים בענן — בחרו אחר');
    // לידה: all-off (הכרעת ארכיטקט), או — צינור-30-הדקות — זריעת חבילת-הוורטיקל
    // שהלקוח בחר בהרשמה (seedPack; הבעלים אישר/החליף במודאל). הזריעה = נקודת-פתיחה
    // בלבד: העריכה-החיה נפתחת מיד אחרי, והבעלים מכוונן מול הלקוח.
    const born = allOffConfig(slug, approveReq.orgName ?? '');
    const cfg0 = seedPack ? applyVerticalPack(born, seedPack) : born;
    await mod.writeOrgCloudDoc(slug, {
      config: cfg0 as unknown as Record<string, unknown>,
      manager: mgr,
      members: [mgr],
      provisioned: false,
      orgName: approveReq.orgName ?? '',
      createdAt: new Date().toISOString(),
    });
    if (approveReq.uid) await mod.deleteOrgRequest(approveReq.uid); // הקמה-ידנית = אין מסמך-בקשה למחוק
    const packLabel = seedPack ? VERTICAL_PACKS.find((p) => p.id === seedPack)?.label : '';
    toast('הארגון "' + (approveReq.orgName ?? slug) + '" אושר' + (packLabel ? ' עם חבילת "' + packLabel + '"' : '') + ' — אמרו ללקוח להתחבר שוב');
    setApproveReq(null);
    await refresh(mod);
    openEditor(slug);
  }

  async function reject(r: ReqRow) {
    if (!mod) return;
    if (!confirmTwice('rej-' + r.uid, 'לדחות את הבקשה של "' + (r.orgName ?? r.email) + '"? הבקשה תימחק')) return;
    await mod.deleteOrgRequest(r.uid);
    toast('הבקשה נדחתה ונמחקה');
    await refresh(mod);
  }

  /** אישור עובד/ת מהלוח (ORGADMIN) — אותה פעולה כמו פאנל-המנהל: members+מחיקת-הבקשה.
   *  תיקון 21.8 (ממצא-נחיל): addOrgMember (arrayUnion אטומי) במקום דריסת המערך המלא
   *  מ-state אולי-ישן — אישור-מקביל אצל המנהל לא נמחק עוד בשקט. */
  async function approveJoin(r: JoinReqRow) {
    if (!mod || !r.email) return;
    const { addOrgMember } = await import('../../lib/cloudConfig');
    await addOrgMember(r.slug, r.email);
    await mod.deleteOrgJoinRequest(r.slug, r.uid).catch(() => {});
    toast('העובד/ת ' + r.email + ' אושר/ה לארגון ' + (r.orgName || r.slug) + ' — שיתחברו שוב');
    await refresh(mod);
  }

  async function rejectJoin(r: JoinReqRow) {
    if (!mod) return;
    if (!confirmTwice('rejj-' + r.slug + r.uid, 'לדחות את בקשת-ההצטרפות של "' + (r.email ?? r.uid) + '"? הבקשה תימחק')) return;
    await mod.deleteOrgJoinRequest(r.slug, r.uid).catch(() => {});
    toast('בקשת-ההצטרפות נדחתה');
    await refresh(mod);
  }

  /** 🗑 מחיקת-לקוח מלאה — כל הנתונים + מסמך-הארגון; מותנית בהקלדת הסלאג. */
  async function deleteOrgConfirmed() {
    if (!mod || !delOrg || delBusy) return;
    if (delTyped.trim() !== delOrg.slug) return;
    setDelBusy(true);
    try {
      const { ENTITY_COLLECTIONS } = await import('../../lib/cloud-diff');
      const n = await mod.deleteOrgCompletely(delOrg.slug, ENTITY_COLLECTIONS);
      toast('הלקוח "' + (delOrg.orgName || delOrg.slug) + '" נמחק (' + n + ' מסמכים). את חשבונות-ההתחברות מוחקים בקונסולה ← Authentication');
      if (sel === delOrg.slug) { setSel(''); setCfg(null); }
      setDelOrg(null);
      await refresh(mod);
    } catch {
      toast('⚠ המחיקה נכשלה באמצע — לחצו שוב להשלמה (מה שנמחק נשאר מחוק)');
    } finally {
      setDelBusy(false);
    }
  }

  function openEditor(s: string) {
    setSel(s);
    const row = orgs.find((o) => o.slug === s);
    const norm = row?.config ? normalizeConfig(row.config) : null;
    setCfg(norm ? { ...norm, slug: s } : allOffConfig(s, row?.orgName ?? ''));
  }

  /** הלב של העריכה-בלייב: כל שינוי נכתב מיד למסמך הענן — הלקוח רואה חי. */
  function updateCfg(next: OrgConfig) {
    if (!mod || !sel) return;
    setCfg(next);
    void mod.writeOrgCloudConfig(sel, next).catch(() => toast('⚠ הכתיבה לענן נכשלה — נסו שוב'));
  }

  async function markProvisioned() {
    if (!mod || !sel) return;
    await mod.writeOrgCloudDoc(sel, { provisioned: true });
    toast('✓ הוקם — יש לו אתר');
    await refresh(mod);
  }

  const featGroups = [...new Set(FEATURES.map((f) => f.module))];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', overflowY: 'auto', padding: '18px 16px 60px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>☁️ לוח הבקרה — פלטפורמת מאור</h1>
          <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
            {mod && <Btn sm onClick={() => void refresh(mod)}>🔄 רענון</Btn>}
            <Btn sm onClick={props.onClose}>✕ סגירה</Btn>
          </span>
        </div>

        {/* בקשות ממתינות */}
        <section className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800 }}>📥 בקשות ממתינות ({requests.length})</h2>
            {/* הקמה-ידנית (5.8): לקוח שהתקשר / שבקשתו לא נקלטה (טלפון-מסונן) — מקימים בלי בקשה */}
            <span style={{ marginInlineStart: 'auto' }}>
              <Btn sm onClick={openManualCreate}>➕ הקמה ידנית</Btn>
            </span>
          </div>
          {loading && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>טוען…</div>}
          {!loading && requests.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין בקשות ממתינות</div>}
          {requests.map((r) => (
            <div key={r.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 700 }}>{r.orgName || '—'}</span>
              {r.contactName && <span style={{ fontSize: 12.5 }}>{r.contactName}</span>}
              {/* הזרימה מבוססת שיחה — הטלפון לחיץ (tel:) */}
              {r.phone && (
                <a href={'tel:' + r.phone} style={{ fontSize: 12.5, direction: 'ltr', fontWeight: 700 }}>
                  {'📞 ' + r.phone}
                </a>
              )}
              <span style={{ fontSize: 12.5, direction: 'ltr' }}>{r.email}</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{(r.at ?? '').slice(0, 16).replace('T', ' ')}</span>
              <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                <Btn sm kind="primary" onClick={() => openApprove(r)}>✓ אישור</Btn>
                <Btn sm kind="danger" onClick={() => void reject(r)}>{armed === 'rej-' + r.uid ? 'שוב לדחייה' : '🗑 דחייה'}</Btn>
              </span>
              {/* פרופיל האשף (SIGNUP3) — תחום · גודל · צרכים; שורה מלאה מתחת */}
              {(r.industry || r.size || (r.needs && r.needs.length > 0)) && (
                <div style={{ flexBasis: '100%', fontSize: 11.5, color: 'var(--ink-soft)', display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {r.industry && <span style={{ fontWeight: 700 }}>🏷 {industryLabel(r.industry)}</span>}
                  {r.size && <span>· {sizeLabel(r.size)}</span>}
                  {r.needs && r.needs.length > 0 && <span>· {r.needs.map(needLabel).join(' · ')}</span>}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* בקשות-הצטרפות של עובדים (ORGADMIN) — הבעלים רואה את כולן, גם כשאין
            מנהל-ממונה לארגון (אחרת הבקשה לא נראית בשום מסך) */}
        {joinReqs.length > 0 && (
          <section className="card" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>👥 בקשות-הצטרפות של עובדים ({joinReqs.length})</h2>
            {joinReqs.map((r) => (
              <div key={r.slug + r.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontWeight: 700 }}>{r.name || r.email || '—'}</span>
                <span style={{ fontSize: 12.5, direction: 'ltr' }}>{r.email}</span>
                {r.phone && (
                  <a href={'tel:' + r.phone} style={{ fontSize: 12.5, direction: 'ltr', fontWeight: 700 }}>
                    {'📞 ' + r.phone}
                  </a>
                )}
                <span style={{ fontSize: 12 }}>{'⬅ ' + (r.orgName || r.slug)}</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{(r.at ?? '').slice(0, 16).replace('T', ' ')}</span>
                <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                  <Btn sm kind="primary" onClick={() => void approveJoin(r)}>✓ אישור</Btn>
                  <Btn sm kind="danger" onClick={() => void rejectJoin(r)}>{armed === 'rejj-' + r.slug + r.uid ? 'שוב לדחייה' : '🗑 דחייה'}</Btn>
                </span>
              </div>
            ))}
          </section>
        )}

        {/* לידים "נחזור אליכם" (SIGNUP) — פניות בלי חשבון */}
        {leads.length > 0 && (
          <section className="card" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>📞 פניות "נחזור אליכם" ({leads.length})</h2>
            {leads.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontWeight: 700 }}>{l.contactName || '—'}</span>
                {l.phone && (
                  <a href={'tel:' + l.phone} style={{ fontSize: 12.5, direction: 'ltr', fontWeight: 700 }}>
                    {'📞 ' + l.phone}
                  </a>
                )}
                {l.preferredTime && <span style={{ fontSize: 12 }}>{'זמן נוח: ' + l.preferredTime}</span>}
                {l.notes && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{l.notes}</span>}
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginInlineStart: 'auto' }}>{(l.at ?? '').slice(0, 16).replace('T', ' ')}</span>
              </div>
            ))}
          </section>
        )}

        {/* רשימת לקוחות */}
        <section className="card" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🏢 לקוחות ({orgs.length})</h2>
          {!loading && orgs.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>עדיין אין לקוחות בפלטפורמה</div>}
          {orgs.map((o) => (
            <div key={o.slug} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => openEditor(o.slug)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: sel === o.slug ? 800 : 600, padding: 0, fontSize: 13.5 }}
              >
                {(o.orgName || o.slug) + ' · ' + o.slug}
              </button>
              <Chip on={!!o.provisioned}>{o.provisioned ? 'הוקם' : 'בהקמה'}</Chip>
              <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                <Btn
                  sm
                  onClick={() => {
                    const link = orgLink(window.location.origin, window.location.pathname, o.slug);
                    void navigator.clipboard?.writeText(link).then(
                      () => toast('הקישור הועתק: ' + link),
                      () => toast(link),
                    );
                  }}
                >
                  📋 העתק קישור
                </Btn>
                <Btn sm onClick={() => openEditor(o.slug)}>✏️ עריכה חיה</Btn>
                {/* אשף-הרכבה קשור-ענן (5.8): האשף המלא על הלקוח — הבעלים רואה חי */}
                <Btn sm onClick={() => { window.location.hash = '#builder=' + o.slug; }}>🧩 אשף הרכבה</Btn>
                <Btn sm kind="danger" onClick={() => { setDelOrg(o); setDelTyped(''); }}>🗑</Btn>
              </span>
            </div>
          ))}
        </section>

        {/* עורך הלקוח — הלב: כל מתג נכתב מיד לענן והלקוח רואה חי */}
        {sel && cfg && (
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>{'🎛 עריכה חיה — ' + (cfg.orgName || sel)}</h2>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>כל שינוי מופיע אצל הלקוח מיד, בלי רענון</span>
              <span style={{ marginInlineStart: 'auto' }}>
                <Btn kind="primary" sm onClick={() => void markProvisioned()}>💾 שמור — הוקם</Btn>
              </span>
            </div>

            <Field label="חבילת ורטיקל (נקודת פתיחה מהירה)">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {VERTICAL_PACKS.map((p) => (
                  <Btn key={p.id} sm onClick={() => { updateCfg(applyVerticalPack(cfg, p.id)); toast('חבילת "' + p.label + '" הוחלה — הלקוח רואה עכשיו'); }}>
                    {p.emoji + ' ' + p.label}
                  </Btn>
                ))}
              </div>
            </Field>

            <Field label="מודולים (בית והגדרות — תמיד)">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ALL_MODULES.map((m) => (
                  <Chip
                    key={m}
                    on={cfg.modules[m] !== false}
                    onClick={() => updateCfg({ ...cfg, modules: { ...cfg.modules, [m]: cfg.modules[m] === false } })}
                  >
                    {MODULE_LABELS[m]}
                  </Chip>
                ))}
              </div>
            </Field>

            <div className="form-grid">
              <Field label="ערכת נושא">
                <Select
                  value={cfg.theme}
                  onChange={(v) => updateCfg({ ...cfg, theme: v })}
                  options={Object.entries(THEME_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </Field>
              <Field label="שם הארגון">
                <TextInput value={cfg.orgName} onChange={(v) => updateCfg({ ...cfg, orgName: v })} />
              </Field>
            </div>

            <Field label="דגלים עדינים (לפי מודול)">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {featGroups.map((g) => (
                  <Chip key={g} on={featModule === g} onClick={() => setFeatModule(featModule === g ? '' : g)}>
                    {g}
                  </Chip>
                ))}
              </div>
              {featModule && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {FEATURES.filter((f) => f.module === featModule).map((f) => (
                    <Chip
                      key={f.key}
                      // תיקון 21.8 (ממצא-נחיל): הצ'יפ קרא `!== false` — לכל 13 דגלי-ה-opt-in
                      // (חסר=כבוי!) הוא היה הפוך: ארגון-חדש all-off הציג 🟢 על מסך כבוי,
                      // ולחיצת-"הדלקה" כתבה ערך שאינו true ⇒ בלתי-ניתן-להדלקה מהלוח.
                      on={featureEffectiveOn(cfg, f)}
                      onClick={() => {
                        // שיקוף setFeatures של האשף: כיבוי=false מפורש; הדלקה —
                        // opt-in כותב true מפורש, דגל-רגיל מוחק את המפתח (חסר=פעיל).
                        const features = { ...cfg.features };
                        if (featureEffectiveOn(cfg, f)) features[f.key] = false;
                        else if (f.optIn) features[f.key] = true;
                        else delete features[f.key];
                        updateCfg({ ...cfg, features });
                      }}
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              )}
            </Field>

            {/* מתגים ברמת-הקונפיג (לא-FEATURES) — לא הופיעו ברשת-הדגלים ⇒ חסרו
                לארגון-חדש שמוקם מהלוח. donationSplit = פיצול-תרומות פר-ייעוד. */}
            <Field label="מתגים מתקדמים (ברמת-הקונפיג)">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={cfg.donationSplit === true}
                  onChange={(e) => updateCfg({ ...cfg, donationSplit: e.target.checked ? true : undefined })}
                  style={{ width: 'auto', marginTop: 2, accentColor: 'var(--accent-deep)' }}
                />
                <span style={{ lineHeight: 1.35 }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>🔀 פיצול-תרומות פר-ייעוד</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                    אכיפת-הרשאת-ייעוד לעובדות בשכבת-הנתונים. לארגון עם תרומות קיימות — יש להריץ
                    מיגרציה (הגדרות←אבטחה). ארגון-חדש: הדלקה כאן מספיקה.
                  </span>
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={cfg.supporterEnforce === true}
                  onChange={(e) => updateCfg({ ...cfg, supporterEnforce: e.target.checked ? true : undefined })}
                  style={{ width: 'auto', marginTop: 2, accentColor: 'var(--accent-deep)' }}
                />
                <span style={{ lineHeight: 1.35 }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>🔒 אכיפת-נתונים מלאה פר-ייעוד</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                    תומכים · לוח · לוג — עובדת רואה רק את הייעוד שלה. לארגון עם נתונים קיימים — יש
                    להריץ מיגרציה (הגדרות←אבטחה). ארגון-חדש: הדלקה כאן מספיקה.
                  </span>
                </span>
              </label>
            </Field>

            <Field label="מונחים (ריק = ברירת המחדל)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {TERM_DEFS.map((t) => (
                  <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ flex: 'none', width: 110, color: 'var(--ink-faint)' }}>{t.label}</span>
                    <input
                      value={cfg.terms?.[t.key] ?? ''}
                      placeholder={t.fallback}
                      onChange={(e) => {
                        const terms = { ...cfg.terms };
                        if (e.target.value) terms[t.key] = e.target.value;
                        else delete terms[t.key];
                        updateCfg({ ...cfg, terms });
                      }}
                      style={{ width: '100%' }}
                    />
                  </label>
                ))}
              </div>
            </Field>
          </section>
        )}
      </div>

      {delOrg && (
        <Modal title={'🗑 מחיקת לקוח — ' + (delOrg.orgName || delOrg.slug)} onClose={() => setDelOrg(null)}>
          <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
            פעולה <b>בלתי-הפיכה</b>: כל נתוני-הענן של הארגון (משפחות, תרומות, קבלות, הכול) + מסמך-הארגון
            נמחקים לתמיד. הנתונים המקומיים במכשיר-הלקוח לא נמחקים מכאן, אבל האתר שלו יפסיק לעבוד.
            <br />
            חשבונות-ההתחברות (Auth) נמחקים בנפרד בקונסולה ← Authentication.
          </div>
          <Field label={'לאישור — הקלידו את הסלאג: ' + delOrg.slug}>
            <TextInput value={delTyped} onChange={setDelTyped} dir="ltr" placeholder={delOrg.slug} />
          </Field>
          <div className="modal-actions">
            <Btn kind="danger" disabled={delTyped.trim() !== delOrg.slug || delBusy} onClick={() => void deleteOrgConfirmed()}>
              {delBusy ? 'מוחק…' : '🗑 מחיקה סופית'}
            </Btn>
            <Btn onClick={() => setDelOrg(null)}>ביטול</Btn>
          </div>
        </Modal>
      )}
      {approveReq && (
        <Modal title={approveReq.uid ? '✓ אישור — ' + (approveReq.orgName ?? '') : '➕ הקמה ידנית — לקוח בשיחה'} onClose={() => setApproveReq(null)}>
          <FormError error={slugErr} />
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
            {!approveReq.uid
              ? 'ללא מסמך-בקשה: מקלידים שם ומייל בשיחה — הלקוח מתחבר עם המייל הזה אחרי שנרשם (או שכבר נרשם ובקשתו לא נקלטה).'
              : seedPack
                ? 'הארגון ייוולד עם חבילת-התחום שהלקוח בחר בהרשמה — מכווננים יחד בעריכה החיה. לאחר האישור אמרו לו: "תתחבר שוב".'
                : 'הארגון ייוולד כשהכול כבוי — מדליקים יחד עם הלקוח בעריכה החיה. לאחר האישור אמרו לו: "תתחבר שוב".'}
          </div>
          {/* שדה שם-הארגון: בהקמה-ידנית, וגם בבקשת-חילוץ בלי שם (ריפוי-עצמי
              מינימלי ממכשיר-אחר) — בלעדיו הבקשה הייתה בלתי-ניתנת-לאישור */}
          {(!approveReq.uid || !(approveReq.orgName ?? '').trim()) && (
            <Field label="שם הארגון *">
              <TextInput
                value={approveReq.orgName ?? ''}
                onChange={(v) => {
                  setApproveReq({ ...approveReq, orgName: v });
                  setSlug(slugify(v, orgs.map((o) => o.slug)));
                }}
                placeholder="עמותת אור"
              />
            </Field>
          )}
          <Field label="חבילת-פתיחה (מהתחום שנבחר בהרשמה)">
            <Select
              value={seedPack}
              onChange={setSeedPack}
              options={[
                { value: '', label: 'בלי חבילה — הכול כבוי' },
                ...VERTICAL_PACKS.map((p) => ({ value: p.id, label: p.label })),
              ]}
            />
          </Field>
          <Field label="סלאג (כתובת הלקוח) *">
            <TextInput value={slug} onChange={setSlug} dir="ltr" placeholder="amutat-or" />
          </Field>
          <Field label="מייל מנהל-הארגון *">
            <TextInput value={managerEmail} onChange={setManagerEmail} dir="ltr" placeholder="manager@org.org" />
          </Field>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>
            המנהל ינהל את העובדות של הארגון שלו (הרשמה, אישור, כרטיס-עובד) — רק בתוך מה שתדליק לו.
          </div>
          <div className="modal-actions">
            <Btn kind="primary" onClick={() => void approve()}>✓ אישור ויצירת הארגון</Btn>
            <Btn onClick={() => setApproveReq(null)}>ביטול</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
