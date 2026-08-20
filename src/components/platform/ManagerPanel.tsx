/**
 * פאנל-המנהל (ORGADMIN) — "האשף הייחודי" של מנהל-הארגון. **לא** אשף-ההקמה:
 * מגודר cloud.isManager, מצומצם ל-`orgEnabledModules` (רק מה שהבעלים הדליק לארגון).
 * שלוש פעולות: (1) מתג "הרשמת-עובדים" + קישור-הזמנה · (2) אישור/דחיית בקשות ·
 * (3) כרטיס-עובד לכל עובדת — הדלקה/כיבוי המודולים שהבעלים אישר, פר-מייל.
 * הכתיבות מוגבלות ב-Rules v3 לשדות members/memberConfigs/joinOpen/joinCode.
 * ראה knowledge/BUILD-ORDER-ORGADMIN-2026-08-03.md.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Chip, Field, Modal, TextInput } from '../ui';
import { useArmed } from '../useArmed';
import {
  MODULE_LABELS,
  approveMember,
  genJoinCode,
  orgEnabledFeatures,
  orgEnabledModules,
  orgJoinFullCode,
  orgJoinLink,
  overrideOf,
  removeMember,
  setEmployeeOverride,
} from './lib';
import { FEATURES } from '../../types/features';
import { WIZARD_SECTIONS } from '../builder/sections';
import { featureOn } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import { agoLabel, teamIntel, teamSummary } from './teamIntel';
import { allDonationPurposes } from '../supporters/lib';
import type { ModuleKey, OrgConfig } from '../../types/config';
import type { OrgCloudDoc, OrgJoinRequestDoc } from '../../lib/cloudConfig';

type CloudMod = typeof import('../../store/cloudSync');
type JoinRow = OrgJoinRequestDoc & { uid: string };

export function ManagerPanel(props: { onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const managerMail = useApp((s) => s.cloud.user?.email ?? '');
  // 🕵️ מודיעין-עובדים: הלוג נקרא כמו-שהוא (בלי ?? [] בסלקטור — לקח React #185)
  const auditRaw = useApp((s) => s.db.audit);
  const slug = config.slug;
  const { armed, confirmTwice } = useArmed(true);

  const [mod, setMod] = useState<CloudMod | null>(null);
  const [org, setOrg] = useState<OrgCloudDoc | null>(null);
  const [reqs, setReqs] = useState<JoinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState('');
  const [featModule, setFeatModule] = useState('');
  // ג' (13.8) — הקצאת ייעודי-תרומה פר-עובד/ת: הייעודים הקיימים + הוספה חופשית
  const knownPurposes = allDonationPurposes(useApp.getState().db.supporters);
  const [desigInput, setDesigInput] = useState('');

  async function refresh(m: CloudMod) {
    setLoading(true);
    const [doc, jr] = await Promise.all([
      m.fetchOrgCloudConfig(slug).catch(() => null),
      m.fetchOrgJoinRequests(slug).catch(() => [] as JoinRow[]),
    ]);
    setOrg(doc);
    setReqs(jr);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // הכפתורים שהמנהל בכלל רואה = רק מה שהבעלים הדליק לארגון (התקרה)
  const scope: ModuleKey[] = orgEnabledModules((config as OrgConfig) ?? {});
  // תת-הדגלים שהמנהל יכול לחלק = דגלים דלוקים-בארגון תחת מודול-דלוק (אותה תקרה)
  const featScope = orgEnabledFeatures((config as OrgConfig) ?? {}, FEATURES);
  // תיקון 20.8 (בקשת-בעלים "למה אין ❓ לעובדת"): הקבוצות הוצגו כמזהים גולמיים
  // באנגלית ('shell', 'home'…) — מי שחיפש "עזרה" לא מצא. עכשיו: תווית עברית
  // + אימוג'י מהאשף, בסדר-המסכים של האפליקציה.
  const groupLabelOf = (m: string): string => {
    const sec = WIZARD_SECTIONS.find((s) => s.id === m);
    return sec ? `${sec.emoji} ${sec.title}` : m;
  };
  const groupOrder = WIZARD_SECTIONS.map((s) => s.id as string);
  const featGroups = [...new Set(featScope.map((f) => f.module))].sort(
    (a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b),
  );
  const employees = (org?.members ?? []).filter((m) => m.trim().toLowerCase() !== managerMail.trim().toLowerCase());
  const inviteLink =
    org?.joinCode && typeof window !== 'undefined'
      ? orgJoinLink(window.location.origin, window.location.pathname, slug, org.joinCode)
      : '';
  // "קוד מהבוס" — לעובד/ת שנרשם/ת במסך-האחיד (הרשמת-עובד/ת): slug.code
  const fullCode = org?.joinCode ? orgJoinFullCode(slug, org.joinCode) : '';

  async function toggleJoinOpen() {
    if (!mod || !org) return;
    const on = !org.joinOpen;
    // הדלקה ראשונה בלי קוד ⇒ מייצרים קוד-הזמנה יציב
    const joinCode = org.joinCode || genJoinCode(slug + ':' + new Date().toISOString());
    await mod.writeOrgCloudDoc(slug, { joinOpen: on, joinCode });
    await refresh(mod);
    toast(on ? 'הרשמת-עובדים הופעלה — שתפו את הקישור' : 'הרשמת-עובדים כובתה');
  }

  async function approve(r: JoinRow) {
    if (!mod || !org || !r.email) return;
    const { members } = approveMember(org, r.email);
    await mod.writeOrgCloudDoc(slug, { members });
    await mod.deleteOrgJoinRequest(slug, r.uid).catch(() => {});
    await refresh(mod);
    toast('העובד/ת ' + r.email + ' אושר/ה — כעת אפשר לקבוע לו/ה כרטיס');
  }

  async function rejectReq(r: JoinRow) {
    if (!mod) return;
    await mod.deleteOrgJoinRequest(slug, r.uid).catch(() => {});
    await refresh(mod);
    toast('הבקשה נדחתה');
  }

  async function toggleModuleFor(email: string, m: ModuleKey) {
    if (!mod || !org) return;
    const ov = overrideOf(email, org);
    const curOff = ov.modules?.[m] === false;
    const nextModules = { ...ov.modules, [m]: curOff ? true : false }; // curOff→הדלקה · דלוק→כיבוי
    const { memberConfigs } = setEmployeeOverride(org, email, { ...ov, modules: nextModules });
    await mod.writeOrgCloudDoc(slug, { memberConfigs });
    await refresh(mod);
  }

  async function toggleFeatureFor(email: string, key: string) {
    if (!mod || !org) return;
    const ov = overrideOf(email, org);
    const curOff = ov.features?.[key] === false;
    const nextFeatures = { ...ov.features, [key]: curOff ? true : false }; // curOff→הדלקה · דלוק→כיבוי
    const { memberConfigs } = setEmployeeOverride(org, email, { ...ov, features: nextFeatures });
    await mod.writeOrgCloudDoc(slug, { memberConfigs });
    await refresh(mod);
  }

  // ג' (13.8) — קביעת ייעודי-התרומה שהעובד/ת רשאי/ת לראות (ריק = הכל)
  async function setDesignationsFor(email: string, designations: string[]) {
    if (!mod || !org) return;
    const ov = overrideOf(email, org);
    const clean = [...new Set(designations.map((s) => s.trim()).filter(Boolean))];
    const { memberConfigs } = setEmployeeOverride(org, email, { ...ov, designations: clean });
    await mod.writeOrgCloudDoc(slug, { memberConfigs });
    await refresh(mod);
  }
  function toggleDesignationFor(email: string, p: string) {
    const cur = (org ? overrideOf(email, org) : {}).designations ?? [];
    void setDesignationsFor(email, cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
  }

  async function removeEmp(email: string) {
    if (!mod || !org) return;
    const { members } = removeMember(org, email);
    await mod.writeOrgCloudDoc(slug, { members });
    // ציד-באגים 3.8 (🟠): merge:true לא מוחק מפתח-מפה ⇒ מוחקים את כרטיס-העובד מפורשות
    await mod.deleteOrgMemberConfig(slug, email).catch(() => {});
    await refresh(mod);
    toast('העובד/ת הוסר/ה');
  }

  return (
    <Modal title={'👥 ניהול העובדות — ' + (org?.orgName || config.orgName || slug)} onClose={props.onClose} wide>
      {loading && <div className="empty">טוען…</div>}
      {!loading && (
        <>
          {/* 1 · הרשמת-עובדים + קישור-הזמנה */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Chip on={!!org?.joinOpen} onClick={() => void toggleJoinOpen()}>
                {org?.joinOpen ? '🟢 הרשמת-עובדים פעילה' : '⚪ הרשמת-עובדים כבויה'}
              </Chip>
            </div>
            {org?.joinOpen && inviteLink && (
              <Field label="קישור-הזמנה לעובדות (שתפו איתן)">
                <TextInput
                  value={inviteLink}
                  onChange={() => {}}
                  dir="ltr"
                  readOnly
                  ariaLabel="קישור-הזמנה לעובדות"
                />
                <Btn
                  sm
                  onClick={() =>
                    void navigator.clipboard
                      ?.writeText(inviteLink)
                      .then(() => toast('הקישור הועתק'))
                      .catch(() => toast('העתקה נכשלה — סמנו והעתיקו ידנית'))
                  }
                >
                  📋 העתק קישור
                </Btn>
              </Field>
            )}
            {org?.joinOpen && fullCode && (
              <Field label="קוד-הזמנה לעובד/ת (למי שנרשם/ת בלשונית 'הרשמת עובד/ת')">
                <TextInput value={fullCode} onChange={() => {}} dir="ltr" readOnly ariaLabel="קוד-הזמנה לעובד/ת" />
                <Btn
                  sm
                  onClick={() =>
                    void navigator.clipboard
                      ?.writeText(fullCode)
                      .then(() => toast('הקוד הועתק'))
                      .catch(() => toast('העתקה נכשלה — סמנו והעתיקו ידנית'))
                  }
                >
                  📋 העתק קוד
                </Btn>
              </Field>
            )}
          </div>

          {/* 2 · בקשות-הצטרפות ממתינות */}
          <h3 style={{ fontSize: 14, margin: '10px 0 6px' }}>בקשות ממתינות ({reqs.length})</h3>
          {reqs.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין בקשות חדשות.</div>}
          {reqs.map((r) => (
            <div key={r.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span dir="ltr">{r.email}</span>
                {r.phone && <span dir="ltr" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{r.phone}</span>}
              </span>
              <Btn sm kind="primary" onClick={() => void approve(r)}>✓ אישור</Btn>
              <Btn sm onClick={() => void rejectReq(r)}>דחייה</Btn>
            </div>
          ))}

          {/* 3 · כרטיסי-עובד — רק המודולים שהבעלים הדליק לארגון */}
          <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>העובדות ({employees.length})</h3>
          {employees.length === 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין עדיין עובדות מאושרות.</div>
          )}
          {employees.map((email) => {
            const ov = org ? overrideOf(email, org) : {};
            const isOpen = openCard === email;
            return (
              <div key={email} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1 }} dir="ltr">{email}</span>
                  <Btn sm onClick={() => setOpenCard(isOpen ? '' : email)}>{isOpen ? 'סגור' : '🃏 כרטיס-עובד'}</Btn>
                  <Btn
                    sm
                    onClick={() => {
                      if (confirmTwice(email, 'להסיר את ' + email + ' מהארגון?')) void removeEmp(email);
                    }}
                  >
                    {armed === email ? 'בטוח?' : '🗑'}
                  </Btn>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 8 }}>
                    {/* 🔐 מאסטר-מתג הוצאת-מידע (13.8, בקשת-בעלים) — חוסם לעובד/ת כל
                        ייצוא/גיבוי/דו"ח-מותאם בלחיצה אחת. ov.features['core.export']===false = חסום. */}
                    <div style={{ marginBottom: 10, padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 9, background: ov.features?.['core.export'] === false ? '#fdecec' : 'var(--surface-2, #fafaf7)' }}>
                      <Chip on={ov.features?.['core.export'] !== false} onClick={() => void toggleFeatureFor(email, 'core.export')}>
                        {ov.features?.['core.export'] === false ? '⛔ הוצאת מידע חסומה' : '🔓 הוצאת מידע מותרת'}
                      </Chip>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 5 }}>
                        כיבוי חוסם לעובד/ת ייצוא CSV, הורדת גיבוי ודו"חות-מותאמים.
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
                      מדליקים/מכבים לעובד/ת — רק הכפתורים שהודלקו לארגון:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {scope.length === 0 && <span style={{ fontSize: 12 }}>לא הודלקו מודולים לארגון.</span>}
                      {scope.map((m) => (
                        <Chip key={m} on={ov.modules?.[m] !== false} onClick={() => void toggleModuleFor(email, m)}>
                          {MODULE_LABELS[m]}
                        </Chip>
                      ))}
                    </div>

                    {/* תת-דגלים פר-עובד/ת — לפי מודול, בתוך תקרת-הארגון (100% שליטה) */}
                    {featGroups.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
                          יכולות פר-עובד/ת — בוחרים מסך ומכבים/מדליקים יכולת. ⚠️ כרטיס-עובד =
                          <b> הגבלה בלבד</b>: אפשר לכבות לעובד/ת יכולת שדלוקה בארגון; יכולת
                          שכבויה ברמת-הארגון מדליקים קודם באשף-הארגון (היא לא תופיע כאן).
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                          {featGroups.map((g) => (
                            <Chip key={g} on={featModule === g} onClick={() => setFeatModule(featModule === g ? '' : g)}>
                              {groupLabelOf(g)}
                            </Chip>
                          ))}
                        </div>
                        {featModule && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {featScope
                              .filter((f) => f.module === featModule)
                              .map((f) => (
                                <Chip
                                  key={f.key}
                                  on={ov.features?.[f.key] !== false}
                                  onClick={() => void toggleFeatureFor(email, f.key)}
                                >
                                  {f.label}
                                </Chip>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ג' (13.8) — ייעודי-תרומה מותרים לעובד/ת (הרשאת-תצוגה) */}
                    {featScope.some((f) => f.key === 'supporters.purpose') && (
                      <div style={{ marginTop: 10, borderTop: '1px dashed var(--line)', paddingTop: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
                          🔐 ייעודי-תרומה שהעובד/ת רואה — ריק = רואה הכל; בחירת ייעודים מגבילה לאותם ייעודים בלבד:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                          {knownPurposes.length === 0 && (
                            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>אין עדיין ייעודים — הוסיפו ידנית או ברישום תרומה.</span>
                          )}
                          {knownPurposes.map((p) => (
                            <Chip key={p} on={(ov.designations ?? []).includes(p)} onClick={() => toggleDesignationFor(email, p)}>
                              {p}
                            </Chip>
                          ))}
                          {(ov.designations ?? [])
                            .filter((p) => !knownPurposes.includes(p))
                            .map((p) => (
                              <Chip key={p} on onClick={() => toggleDesignationFor(email, p)}>
                                {p}
                              </Chip>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <TextInput value={openCard === email ? desigInput : ''} onChange={setDesigInput} placeholder="הוספת ייעוד ידנית…" />
                          <Btn
                            sm
                            onClick={() => {
                              const p = desigInput.trim();
                              if (!p) return;
                              const cur = ov.designations ?? [];
                              if (!cur.includes(p)) void setDesignationsFor(email, [...cur, p]);
                              setDesigInput('');
                            }}
                          >
                            הוספה
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 🕵️ מודיעין-עובדים (20.8) — נגזרת-טהורה של לוג-הפעולות פר-עובד/ת:
              מי פעיל, מה עושים, מתי — בלי שום נתון-חדש. מגודר settings.teamintel. */}
          {featureOn((config as OrgConfig) ?? {}, 'settings.teamintel') && (() => {
            const audit = auditRaw ?? [];
            const today = isoToday();
            const team = teamIntel(audit, [managerMail, ...employees], today);
            const sum = teamSummary(team);
            if (audit.length === 0) {
              return (
                <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--ink-faint)' }}>
                  🕵️ מודיעין-עובדים יופיע כאן ברגע שיהיו פעולות בלוג (הלוג מתמלא מעצמו תוך-כדי עבודה).
                </div>
              );
            }
            return (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <h3 style={{ fontSize: 14, margin: '0 0 4px' }}>🕵️ מודיעין-עובדים</h3>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>
                  {sum.week.toLocaleString('he-IL')} פעולות בשבוע האחרון · {sum.activeToday} פעילים היום
                  {sum.top ? ' · 🏆 ' + sum.top : ''}
                </div>
                {team.map((w) => {
                  const max = w.byAct[0]?.n ?? 1;
                  return (
                    <div
                      key={w.email}
                      style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: '8px 10px', marginBottom: 6 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <b style={{ fontSize: 13, direction: 'ltr' }}>{w.email}</b>
                        {w.email === managerMail && <span style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>(מנהל/ת)</span>}
                        <span style={{ marginInlineStart: 'auto', fontSize: 12, color: w.today > 0 ? 'var(--green)' : 'var(--ink-faint)' }}>
                          {agoLabel(w.lastAt, today)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '3px 0' }}>
                        {w.actions.toLocaleString('he-IL')} פעולות · {w.last7} בשבוע · {w.daysActive} ימי-פעילות
                        {w.peakHour != null ? ` · שעת-שיא ${String(w.peakHour).padStart(2, '0')}:00` : ''}
                      </div>
                      {w.byAct.slice(0, 3).map((a) => (
                        <div key={a.act} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                          <span style={{ flex: '0 0 110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.act}</span>
                          <span style={{ flex: 1, height: 6, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }} aria-hidden>
                            <span style={{ display: 'block', height: '100%', width: `${Math.round((a.n / max) * 100)}%`, background: 'var(--accent)' }} />
                          </span>
                          <span style={{ flex: '0 0 auto', color: 'var(--ink-faint)' }}>{a.n}</span>
                        </div>
                      ))}
                      {w.recent.length > 0 && (
                        <details style={{ marginTop: 4 }}>
                          <summary style={{ cursor: 'pointer', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                            הפעולות האחרונות ({w.recent.length})
                          </summary>
                          {w.recent.map((a, i) => (
                            <div key={i} style={{ fontSize: 11.5, color: 'var(--ink-soft)', padding: '2px 0' }}>
                              {a.at.slice(0, 10)} {a.at.slice(11, 16)} · {a.act} — {a.what}
                            </div>
                          ))}
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}
    </Modal>
  );
}
