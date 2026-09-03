/**
 * פאנל-המנהל (ORGADMIN) — "האשף הייחודי" של מנהל-הארגון. **לא** אשף-ההקמה:
 * מגודר cloud.isManager, מצומצם ל-`orgEnabledModules` (רק מה שהבעלים הדליק לארגון).
 * שלוש פעולות: (1) מתג "הרשמת-עובדים" + קישור-הזמנה · (2) אישור/דחיית בקשות ·
 * (3) כרטיס-עובד לכל עובדת — הדלקה/כיבוי המודולים שהבעלים אישר, פר-מייל.
 * הכתיבות מוגבלות ב-Rules v3 לשדות members/memberConfigs/joinOpen/joinCode.
 * ראה knowledge/BUILD-ORDER-ORGADMIN-2026-08-03.md.
 */
import { useEffect, useState } from 'react';
import { presetMatches, presetModules, ROLE_PRESETS } from './rolePresets';
import { useApp } from '../../store/useApp';
import { Btn, Chip, Field, Modal, TextInput } from '../ui';
import { useArmed } from '../useArmed';
import {
  MODULE_LABELS,
  genJoinCode,
  orgEnabledFeatures,
  orgEnabledModules,
  orgJoinFullCode,
  orgJoinLink,
  overrideOf,
  setEmployeeOverride,
  isGrantableFeature,
} from './lib';
import { FEATURES } from '../../types/features';
import { WIZARD_SECTIONS } from '../builder/sections';
import { featureOn } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import { agoLabel, goalProgress, quietWorkers, teamCsvRows, teamIntel, teamSummary, trendOf } from './teamIntel';
import { openTasksFor, overdueContactTaskDrafts, PRI_LABELS, taskStatsFor } from '../../lib/worktasks';
import { downloadCsv } from '../../lib/csvx';
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
  // 📋 מכין-העבודה (WORKPREP): משימות + תורמים לשיבוץ + פעולות
  const tasksRaw = useApp((s) => s.db.tasks);
  const supporters = useApp((s) => s.db.supporters);
  const addWorkTasks = useApp((s) => s.addWorkTasks);
  const deleteWorkTask = useApp((s) => s.deleteWorkTask);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPri, setTaskPri] = useState<1 | 2 | 3>(2);
  const [taskDue, setTaskDue] = useState('');
  const [taskSupQ, setTaskSupQ] = useState('');
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
    // תיקון 21.8 (ממצא-נחיל): כתיבת members המלא מ-state (אולי-ישן) דרסה בשקט
    // עובד/ת שאושרו במקביל במסך אחר — addOrgMember = arrayUnion אטומי בשרת.
    const { addOrgMember } = await import('../../lib/cloudConfig');
    await addOrgMember(slug, r.email);
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

  /** 👤 פרופיל-תפקיד בקליק (VISION-LIGHT #2): מלביש מפת-מודולים שלמה בבת-אחת.
   *  אותו נתיב-כתיבה בדיוק כמו הצ'יפים (setEmployeeOverride+writeOrgCloudDoc). */
  async function applyRolePreset(email: string, presetKey: string) {
    if (!mod || !org) return;
    const preset = ROLE_PRESETS.find((r) => r.key === presetKey);
    if (!preset) return;
    const ov = overrideOf(email, org);
    const { memberConfigs } = setEmployeeOverride(org, email, { ...ov, modules: presetModules(preset, scope) });
    await mod.writeOrgCloudDoc(slug, { memberConfigs });
    await refresh(mod);
    toast('👤 הפרופיל "' + preset.label + '" הוחל על ' + email + ' — אפשר להמשיך לכוונן בצ\'יפים');
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
    // יכולת-הדלקה-פר-עובד (בחירה-מרובה וכו') = כבויה כברירת-מחדל לעובד; הקליק **מדליק**
    // (true=grant) או מבטל (false). יכולת רגילה = דלוקה כברירת-מחדל; הקליק מכבה (הגבלה).
    const grant = isGrantableFeature(key);
    const cur = grant ? ov.features?.[key] === true : ov.features?.[key] !== false;
    const nextFeatures = { ...ov.features, [key]: cur ? false : true };
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
  /** 🎯 יעד-שבועי פר-עובד/ת (התפרעות-מלאה 20.8) — additive על כרטיס-העובד בענן. */
  async function setGoalFor(email: string, goal: number) {
    if (!mod || !org) return;
    if (goal > 0) {
      const ov = overrideOf(email, org);
      const { memberConfigs } = setEmployeeOverride(org, email, { ...ov, weeklyGoal: Math.round(goal) });
      await mod.writeOrgCloudDoc(slug, { memberConfigs });
    } else {
      // תיקון 21.8 (ממצא-נחיל): `delete next.weeklyGoal` + setDoc(merge:true) ממזג-עומק
      // ⇒ השדה מעולם לא נמחק בענן (יעד 40 חזר אחרי איפוס-ל-0). מחיקת-שדה נקודתית
      // (FieldPath+deleteField, דפוס deleteOrgMemberConfig). dynamic-import — firebase
      // נשאר מחוץ לבנדל הראשי (הפאנל ממילא חי רק בענן).
      const { clearEmployeeField } = await import('../../lib/cloudConfig');
      await clearEmployeeField(slug, email, 'weeklyGoal');
    }
    await refresh(mod);
  }
  function toggleDesignationFor(email: string, p: string) {
    const cur = (org ? overrideOf(email, org) : {}).designations ?? [];
    void setDesignationsFor(email, cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
  }

  async function removeEmp(email: string) {
    if (!mod || !org) return;
    // תיקון 21.8 (ממצא-נחיל): הסרה אטומית (arrayRemove) במקום דריסת המערך המלא
    // מ-state אולי-ישן — כתיבה-מקבילה לא מוחקת עוד עובד/ת אחרים בשקט.
    const { removeOrgMember } = await import('../../lib/cloudConfig');
    await removeOrgMember(slug, email);
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
                    {/* 👤 פרופילי-תפקיד בקליק (VISION-LIGHT #2) — נקודת-פתיחה; הצ'יפים ממשיכים לכוונן */}
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
                      👤 פרופיל בקליק — מלביש כרטיס שלם (אפשר לכוונן אחר-כך):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {ROLE_PRESETS.map((r) => (
                        <Chip key={r.key} on={presetMatches(r, ov.modules, scope)} onClick={() => void applyRolePreset(email, r.key)}>
                          <span title={r.desc}>{r.icon} {r.label}</span>
                        </Chip>
                      ))}
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
                              .map((f) => {
                                // יכולת-הדלקה = כבויה כברירת-מחדל (on רק כשהודלקה במפורש);
                                // רגילה = דלוקה אלא-אם כובתה. תווית 🔓 מסמנת "הדלקה פר-עובד".
                                const grant = isGrantableFeature(f.key);
                                const on = grant ? ov.features?.[f.key] === true : ov.features?.[f.key] !== false;
                                return (
                                  <Chip
                                    key={f.key}
                                    on={on}
                                    onClick={() => void toggleFeatureFor(email, f.key)}
                                  >
                                    {(grant ? '🔓 ' : '') + f.label}
                                  </Chip>
                                );
                              })}
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

                    {/* 📋 מכין-העבודה (WORKPREP, 20.8) — המנהל משבץ לעובד/ת את יום-העבודה:
                        משימה חופשית / קשורה-לתורם, עדיפות, יעד, ושיבוץ-המוני של יעדי-קשר
                        שעברו. הביצוע אצל העובדת ב"המשימות שלי" (מסך-הבית). */}
                    {featureOn((config as OrgConfig) ?? {}, 'settings.workprep') && (() => {
                      const tasks = tasksRaw ?? [];
                      const today = isoToday();
                      const st = taskStatsFor(tasks, email, today);
                      const open = openTasksFor(tasks, email);
                      const supMatches = taskSupQ.trim()
                        ? supporters.filter((sp) => sp.name.includes(taskSupQ.trim())).slice(0, 5)
                        : [];
                      const assign = (title: string, ref?: { kind: 'supporter'; id: string }) => {
                        if (!title.trim()) return;
                        addWorkTasks([{ assignee: email, title: title.trim(), pri: taskPri, ...(taskDue ? { due: taskDue } : {}), ...(ref ? { ref } : {}) }]);
                        setTaskTitle('');
                        setTaskSupQ('');
                      };
                      const bulk = () => {
                        const drafts = overdueContactTaskDrafts(supporters, tasks, email, today);
                        if (!drafts.length) return toast('אין יעדי-קשר שעברו שטרם שובצו');
                        addWorkTasks(drafts);
                      };
                      return (
                        <div style={{ marginTop: 10, borderTop: '1px dashed var(--line)', paddingTop: 8 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                            📋 מכין-העבודה — {st.open} פתוחות{st.overdue ? ` · ⏰ ${st.overdue} באיחור` : ''} · ✓ {st.doneWeek} השבוע
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                            <input
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              placeholder="משימה חדשה — למשל: לסגור את רשימת החג…"
                              aria-label={'משימה חדשה ל-' + email}
                              style={{ flex: '1 1 180px', fontSize: 12.5, padding: '5px 8px' }}
                            />
                            <select value={taskPri} onChange={(e) => setTaskPri(Number(e.target.value) as 1 | 2 | 3)} aria-label="עדיפות" style={{ fontSize: 12, padding: '4px 6px' }}>
                              {( [1, 2, 3] as const).map((p) => <option key={p} value={p}>{PRI_LABELS[p]}</option>)}
                            </select>
                            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} aria-label="תאריך-יעד" dir="ltr" style={{ fontSize: 12, padding: '4px 6px' }} />
                            <Btn sm kind="primary" onClick={() => assign(taskTitle)}>➕ שיבוץ</Btn>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                            <input
                              value={taskSupQ}
                              onChange={(e) => setTaskSupQ(e.target.value)}
                              placeholder="🔎 שיבוץ-תורם — חיפוש שם…"
                              aria-label="חיפוש תורם לשיבוץ"
                              style={{ flex: '1 1 160px', fontSize: 12.5, padding: '5px 8px' }}
                            />
                            <Btn sm onClick={bulk} title="כל התורמים שיעד-הקשר שלהם עבר וטרם שובצו — משימת 📞 לכל אחד">
                              📞 שיבוץ כל יעדי-הקשר שעברו
                            </Btn>
                          </div>
                          {supMatches.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                              {supMatches.map((sp) => (
                                <Chip key={sp.id} onClick={() => assign('📞 להתקשר — ' + sp.name, { kind: 'supporter', id: sp.id })}>
                                  📞 {sp.name}
                                </Chip>
                              ))}
                            </div>
                          )}
                          {open.slice(0, 8).map((t) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '2px 0', color: 'var(--ink-soft)' }}>
                              <span>{(PRI_LABELS[t.pri] ?? PRI_LABELS[2]).slice(0, 2)}</span>
                              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                              {t.due && <span style={{ color: t.due < today ? 'var(--red)' : 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{t.due.slice(5).split('-').reverse().join('/')}</span>}
                              <Btn sm onClick={() => deleteWorkTask(t.id)} title="ביטול המשימה">🗑</Btn>
                            </div>
                          ))}
                          {open.length > 8 && <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>+{open.length - 8} נוספות בתור</div>}
                        </div>
                      );
                    })()}
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
            const goals: Record<string, number | undefined> = Object.fromEntries(
              team.map((w) => [w.email, org ? (overrideOf(w.email, org) as { weeklyGoal?: number }).weeklyGoal : undefined]),
            );
            const quiet = quietWorkers(team.filter((w) => w.email !== managerMail), 3);
            const teamMaxWeek = Math.max(1, ...team.map((w) => w.last7));
            return (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 14, margin: 0, flex: 1 }}>🕵️ מודיעין-עובדים</h3>
                  {featureOn((config as OrgConfig) ?? {}, 'core.export') && (
                    <Btn sm onClick={() => downloadCsv('team-intel-' + today + '.csv', teamCsvRows(team, goals))}>
                      ⬇ דוח-צוות CSV
                    </Btn>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '4px 0 8px' }}>
                  {sum.week.toLocaleString('he-IL')} פעולות בשבוע האחרון · {sum.activeToday} פעילים היום
                  {sum.top ? ' · 🏆 ' + sum.top : ''}
                </div>
                {/* ⚠️ עובדות-שקטות — 3+ ימים בלי שום פעולה */}
                {quiet.length > 0 && (
                  <div style={{ fontSize: 12, color: '#9a6414', background: '#fdf1d4', border: '1px solid #ecd9a8', borderRadius: 9, padding: '6px 10px', marginBottom: 8 }}>
                    ⚠️ שקטות 3+ ימים:{' '}
                    {quiet.map((w) => w.email + (w.quietDays >= 99 ? ' (ללא פעילות)' : ' (' + w.quietDays + ' ימים)')).join(' · ')}
                  </div>
                )}
                {team.map((w) => {
                  const max = w.byAct[0]?.n ?? 1;
                  const sparkMax = Math.max(1, ...w.spark14);
                  const gp = goalProgress(w, goals[w.email]);
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
                        {w.actions.toLocaleString('he-IL')} פעולות · {w.last7} בשבוע{' '}
                        <span
                          title={`מגמה מול שבוע-קודם (${w.prevWeek})`}
                          style={{ fontWeight: 700, color: w.last7 > w.prevWeek ? 'var(--green)' : w.last7 < w.prevWeek ? 'var(--red)' : 'var(--ink-faint)' }}
                        >
                          {trendOf(w)}
                        </span>{' '}
                        · {w.daysActive} ימי-פעילות
                        {w.peakHour != null ? ` · שעת-שיא ${String(w.peakHour).padStart(2, '0')}:00` : ''}
                      </div>
                      {/* פס-14-יום + פס-השוואה-לצוות */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 4px' }}>
                        <span title="14 הימים האחרונים (ישן→חדש)" style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 16 }} aria-hidden>
                          {w.spark14.map((n, i) => (
                            <span key={i} style={{ width: 4, height: Math.max(2, Math.round((n / sparkMax) * 16)), background: n ? 'var(--accent)' : 'var(--line-soft)', borderRadius: 1 }} />
                          ))}
                        </span>
                        <span title="חלקה מפעילות-השבוע של הצוות" style={{ flex: 1, height: 5, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }} aria-hidden>
                          <span style={{ display: 'block', height: '100%', width: `${Math.round((w.last7 / teamMaxWeek) * 100)}%`, background: 'var(--accent-deep, var(--accent))' }} />
                        </span>
                      </div>
                      {/* 🎯 יעד-שבועי — קלט-מנהל + פס-התקדמות; נשמר בכרטיס-העובד בענן */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, margin: '2px 0 4px' }}>
                        <span>🎯 יעד-שבועי:</span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={goals[w.email] ?? ''}
                          onBlur={(e) => void setGoalFor(w.email, Number(e.target.value) || 0)}
                          dir="ltr"
                          aria-label={'יעד-שבועי ל-' + w.email}
                          style={{ width: 64, fontSize: 11.5, padding: '2px 6px' }}
                        />
                        {gp && (
                          <>
                            <span style={{ flex: 1, height: 6, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }} aria-hidden>
                              <span style={{ display: 'block', height: '100%', width: gp.pct + '%', background: gp.done ? 'var(--green)' : 'var(--accent)' }} />
                            </span>
                            <span style={{ color: gp.done ? 'var(--green)' : 'var(--ink-faint)', fontWeight: 700 }}>
                              {gp.done ? '✓ הושג' : gp.pct + '%'}
                            </span>
                          </>
                        )}
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
