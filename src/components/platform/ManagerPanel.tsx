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
  orgEnabledModules,
  orgJoinLink,
  overrideOf,
  removeMember,
  setEmployeeOverride,
} from './lib';
import type { ModuleKey, OrgConfig } from '../../types/config';
import type { OrgCloudDoc, OrgJoinRequestDoc } from '../../lib/cloudConfig';

type CloudMod = typeof import('../../store/cloudSync');
type JoinRow = OrgJoinRequestDoc & { uid: string };

export function ManagerPanel(props: { onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const managerMail = useApp((s) => s.cloud.user?.email ?? '');
  const slug = config.slug;
  const { armed, confirmTwice } = useArmed(true);

  const [mod, setMod] = useState<CloudMod | null>(null);
  const [org, setOrg] = useState<OrgCloudDoc | null>(null);
  const [reqs, setReqs] = useState<JoinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState('');

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
  const employees = (org?.members ?? []).filter((m) => m.trim().toLowerCase() !== managerMail.trim().toLowerCase());
  const inviteLink =
    org?.joinCode && typeof window !== 'undefined'
      ? orgJoinLink(window.location.origin, window.location.pathname, slug, org.joinCode)
      : '';

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

  async function removeEmp(email: string) {
    if (!mod || !org) return;
    const { members, memberConfigs } = removeMember(org, email);
    await mod.writeOrgCloudDoc(slug, { members, memberConfigs });
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
                />
                <Btn sm onClick={() => void navigator.clipboard?.writeText(inviteLink).then(() => toast('הקישור הועתק'))}>
                  📋 העתק קישור
                </Btn>
              </Field>
            )}
          </div>

          {/* 2 · בקשות-הצטרפות ממתינות */}
          <h3 style={{ fontSize: 14, margin: '10px 0 6px' }}>בקשות ממתינות ({reqs.length})</h3>
          {reqs.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין בקשות חדשות.</div>}
          {reqs.map((r) => (
            <div key={r.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span style={{ flex: 1 }} dir="ltr">{r.email}</span>
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
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </Modal>
  );
}
