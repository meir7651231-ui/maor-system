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

export function PlatformPanel(props: { onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(true);
  const [mod, setMod] = useState<CloudMod | null>(null);
  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveReq, setApproveReq] = useState<ReqRow | null>(null);
  const [slug, setSlug] = useState('');
  const [slugErr, setSlugErr] = useState('');
  // עורך הלקוח
  const [sel, setSel] = useState('');
  const [cfg, setCfg] = useState<OrgConfig | null>(null);
  const [featModule, setFeatModule] = useState('');

  async function refresh(m: CloudMod) {
    setLoading(true);
    const [reqs, all, lds] = await Promise.all([
      m.fetchOrgRequests().catch(() => []),
      m.fetchAllOrgs().catch(() => []),
      m.fetchOrgLeads().catch(() => []),
    ]);
    setRequests(reqs);
    setOrgs(all);
    setLeads(lds);
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
    setSlugErr('');
  }

  async function approve() {
    if (!mod || !approveReq) return;
    if (!isValidSlug(slug)) return setSlugErr('סלאג: אותיות לטיניות קטנות/ספרות/מקפים, 2-40 תווים');
    if (orgs.some((o) => o.slug === slug)) return setSlugErr('הסלאג כבר תפוס — בחרו אחר');
    const email = (approveReq.email ?? '').trim().toLowerCase();
    // לידה all-off (הכרעת ארכיטקט) — הבעלים מדליק בלייב מה שסוכם בשיחה
    await mod.writeOrgCloudDoc(slug, {
      config: allOffConfig(slug, approveReq.orgName ?? '') as unknown as Record<string, unknown>,
      members: email ? [email] : [],
      provisioned: false,
      orgName: approveReq.orgName ?? '',
      createdAt: new Date().toISOString(),
    });
    await mod.deleteOrgRequest(approveReq.uid);
    toast('הארגון "' + (approveReq.orgName ?? slug) + '" אושר — אמרו ללקוח להתחבר שוב');
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
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>📥 בקשות ממתינות ({requests.length})</h2>
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
                      on={cfg.features?.[f.key] !== false}
                      onClick={() =>
                        updateCfg({ ...cfg, features: { ...cfg.features, [f.key]: cfg.features?.[f.key] === false } })
                      }
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              )}
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

      {approveReq && (
        <Modal title={'✓ אישור — ' + (approveReq.orgName ?? '')} onClose={() => setApproveReq(null)}>
          <FormError error={slugErr} />
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
            הארגון ייוולד כשהכול כבוי — מדליקים יחד עם הלקוח בעריכה החיה. לאחר האישור אמרו לו: "תתחבר שוב".
          </div>
          <Field label="סלאג (כתובת הלקוח) *">
            <TextInput value={slug} onChange={setSlug} dir="ltr" placeholder="amutat-or" />
          </Field>
          <div className="modal-actions">
            <Btn kind="primary" onClick={() => void approve()}>✓ אישור ויצירת הארגון</Btn>
            <Btn onClick={() => setApproveReq(null)}>ביטול</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
