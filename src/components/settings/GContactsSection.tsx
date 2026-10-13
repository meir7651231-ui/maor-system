/**
 * 📇 סעיף "סנכרון אנשי-קשר ל-Google" (הרחבת gcontacts, opt-in · admin+ענן).
 *
 * הכרעת-בעלים 1.9 "סנכרון-חי לגוגל, כל אנשי-הקשר". שני מסלולים:
 *  🔄 **סנכרון-חי** — כפתור "סנכרן עכשיו" קורא ל-gcontactsSyncNow (People API,
 *     refresh-token בכספת); דורמנטי עד שהבעלים מקים OAuth (RUNBOOK-GCONTACTS).
 *  ⬇ **ייצוא vCard** — עובד מיד, בלי שרת: קובץ .vcf שמייבאים ל-contacts.google.com.
 *
 * מגודר `integrationOn(config,'gcontacts')` + `isAdminAuthority` — חסר ⇒ אינו מרונדר
 * (ביט-זהה להיום). התצוגה נגזרת מהמאגר (משפחות+תורמים+מתנדבים); אפס-כסף/קבלות.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { useDbWatch } from '../../store/dbWatch';
import { integrationOn, integrationSetting, isAdminAuthority, termOf } from '../../lib/config';
import { guardExport } from '../../lib/exportGate';
import { collectOrgContacts, contactsVcf, syncStats, GCONTACTS_GROUP_DEFAULT } from '../../lib/googleContacts';
import { Btn } from '../ui';

const SYNC_FN = 'https://us-central1-maor-system.cloudfunctions.net/gcontactsSyncNow';

export function GContactsSection() {
  const config = useApp((s) => s.config);
  const db = useDbWatch('families', 'supporters', 'volunteers', 'orgName');
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const isManager = useApp((s) => s.cloud.isManager);
  const toast = useApp((s) => s.toast);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  const contacts = useMemo(
    () => collectOrgContacts(db.families, db.supporters, db.volunteers, config.orgName || db.orgName || ''),
    [db.families, db.supporters, db.volunteers, config.orgName, db.orgName],
  );
  const stats = syncStats(contacts);

  // גידור: ההרחבה נמכרה (opt-in) + מנהל. חסר ⇒ אינו מרונדר.
  // נחיל ב׳ 3.9 (F1): סמכות-מנהל אפקטיבית — בארגון-פלטפורמה בלי adminEmails עובד/ת אינו/ה מנהל
  if (!integrationOn(config, 'gcontacts') || !isAdminAuthority(config, cloudUser?.email, !!isManager)) return null;

  const group = integrationSetting(config, 'gcontacts', 'groupName') || GCONTACTS_GROUP_DEFAULT;
  // TP-8 (נחיל ב׳ 3.9): מונחי-הישויות דרך termOf — ה-fallback = הליטרל ההיסטורי (ביט-זהה ללקוח-החי)
  const fams = termOf(config, 'nav.families', 'משפחות');
  const sups = termOf(config, 'nav.supporters', 'תורמים');
  const vols = termOf(config, 'entity.volunteers', 'מתנדבים');

  function exportVcf() {
    if (!guardExport()) return; // 🔐 שער יציאת-מידע (core.export)
    if (!contacts.length) { toast('אין אנשי-קשר לייצוא'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contactsVcf(contacts)], { type: 'text/vcard;charset=utf-8' }));
    a.download = 'maor-contacts.vcf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('ירד קובץ אנשי-הקשר — ייבאו ב-contacts.google.com → ייבוא');
  }

  async function syncNow() {
    if (busy) return;
    setBusy(true);
    setResult('');
    try {
      // ייבוא-עצל של שכבת-הענן — firebase נשאר מחוץ לבנדל-ההגדרות (ratchet bundle-light)
      const { syncGContacts } = await import('../../lib/cloud');
      const s = await syncGContacts(SYNC_FN);
      if (s.skipped === 'no-refresh-token' || s.skipped === 'no-oauth-app') {
        setResult('הסנכרון-החי טרם חובר — יש להזין את מפתחות Google בכספת (הגדרות←אבטחה) לפי מדריך-ההקמה. בינתיים ניתן לייצא vCard.');
      } else {
        setResult('סונכרן ✓ · ' + (s.created || 0) + ' חדשים · ' + (s.updated || 0) + ' עודכנו (מתוך ' + (s.total ?? stats.total) + ')');
      }
    } catch (e) {
      setResult('⚠ ' + (e instanceof Error ? e.message : 'סנכרון נכשל'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="sec-gcontacts" style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '10px 0 6px' }}>📇 סנכרון אנשי-קשר ל-Google</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
        כל אנשי-הקשר — {fams}, {sups} ו{vols} — נשמרים ל-Google Contacts שלכם (קבוצה
        "{group}"). הסנכרון מזהה כל איש-קשר לפי מפתח-פנימי, כך שריצה חוזרת מעדכנת
        במקום לשכפל. סה"כ כרגע: <b>{stats.total}</b> ({stats.families} {fams} · {stats.supporters} {sups} · {stats.volunteers} {vols}).
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {cloudOn && (
          <Btn kind="primary" onClick={() => void syncNow()} disabled={busy} title="סנכרון-חי דרך Google People API (דורש חיבור-OAuth חד-פעמי)">
            {busy ? 'מסנכרן…' : '🔄 סנכרן עכשיו ל-Google'}
          </Btn>
        )}
        <Btn onClick={exportVcf} title="ייצוא קובץ vCard לייבוא-ידני ב-contacts.google.com — עובד מיד, בלי חיבור">
          ⬇ ייצוא vCard (ייבוא-ידני)
        </Btn>
      </div>
      {result && <div style={{ fontSize: 12.5, color: result.startsWith('⚠') ? '#b91c1c' : 'var(--ink-soft)' }}>{result}</div>}
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>
        הסנכרון-החי דורש חיבור חד-פעמי של חשבון-Google (OAuth) — ראו מדריך-ההקמה.
        עד אז, "⬇ ייצוא vCard" מייצר קובץ שמייבאים ידנית ל-Google Contacts.
      </p>
    </section>
  );
}
