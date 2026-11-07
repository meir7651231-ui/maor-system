/**
 * 🪙 סעיף «גבי – תזכורות תשלום» (הרחבת gabi, 7.11.2026 · roadmap, דורמנטי).
 *
 * כרטיס-המוצר (לוגו · סלוגן · מחיר · ימי-ניסיון) + כפתור «התחברות לגבי» שפותח את גבי
 * עם מסירה חתומה וקצרת-מועד (lib/gabi.ts — org+email+exp, HMAC-SHA256). **אפס קריאות-רשת**:
 * החתימה מקומית (WebCrypto) והכפתור רק מנווט (window.open) לכתובת https שהוגדרה.
 *
 * גידור: `integrationOn(config,'gabi')` + סמכות-מנהל — חסר ⇒ אינו מרונדר (ביט-זהה לכל
 * ארגון קיים; ratchet gabi-store.test). הסוד: **מקומי-למכשיר** (nsLsKey — לא בקונפיג,
 * לא בענן, לא בגיבוי — אותו דפוס כמו מפתח-ה-AI). בלי כתובת/סוד/מייל ⇒ הכפתור כבוי + סיבה.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { nsLsKey } from '../../store/persist';
import { integrationSetting, safeHttpsUrl } from '../../lib/config';
import { buildGabiHandoffUrl, gabiConnectBlocker, gabiPriceLine, gabiSectionVisible, GABI_PRODUCT, newGabiNonce } from '../../lib/gabi';
import { Btn, Field, TextInput } from '../ui';
import { Section, SectionNote } from './lib';

const SECRET_KEY = 'maor_gabi_handoff_secret';

function readSecret(): string {
  try {
    return localStorage.getItem(nsLsKey(SECRET_KEY)) ?? '';
  } catch {
    return '';
  }
}

function writeSecret(v: string): void {
  try {
    const t = v.trim();
    if (t) localStorage.setItem(nsLsKey(SECRET_KEY), t);
    else localStorage.removeItem(nsLsKey(SECRET_KEY));
  } catch {
    /* localStorage חסום */
  }
}

export function GabiSection() {
  const config = useApp((s) => s.config);
  const cloudUser = useApp((s) => s.cloud.user);
  const isManager = useApp((s) => !!s.cloud.isManager);
  const toast = useApp((s) => s.toast);
  const [secret, setSecret] = useState(readSecret);
  const [saved, setSaved] = useState(readSecret);
  const [busy, setBusy] = useState(false);

  // גידור: ההרחבה הודלקה במפורש (חסר=כבוי) + מנהל-אפקטיבי. אחרת — כלום.
  // (מקור-אמת: gabiSectionVisible ≡ integrationOn(config, 'gabi') && isAdminAuthority(…))
  if (!gabiSectionVisible(config, cloudUser?.email, isManager)) return null;

  const base = safeHttpsUrl(integrationSetting(config, 'gabi', 'baseUrl'));
  const email = cloudUser?.email ?? '';
  const slug = config.slug || 'default';
  const blocker = gabiConnectBlocker(config, email, saved);

  async function connect() {
    if (busy || blocker || !base) return;
    setBusy(true);
    try {
      const url = await buildGabiHandoffUrl({
        baseUrl: base, slug, email, secret: saved,
        nowSec: Math.floor(Date.now() / 1000), nonce: newGabiNonce(),
      });
      if (!url) { toast('לא ניתן לבנות קישור-חיבור — בדקו כתובת וסוד'); return; }
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section id="sec-gabi" title={'🪙 ' + GABI_PRODUCT.name} sub="מוצר נפרד · בהשקה בקרוב — לא נגבה דרך אורביט כרגע">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <img src={GABI_PRODUCT.logoSrc} alt="גבי" width={48} height={48} />
        <div>
          <div style={{ fontWeight: 800 }}>{GABI_PRODUCT.slogan}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{gabiPriceLine()}</div>
        </div>
      </div>
      <Field label="סוד-חיבור (מונפק ע״י גבי)">
        <TextInput value={secret} onChange={setSecret} dir="ltr" type="password" placeholder="••••" />
      </Field>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn onClick={() => { writeSecret(secret); setSaved(secret.trim()); toast(secret.trim() ? 'הסוד נשמר במכשיר זה' : 'הסוד נמחק מהמכשיר'); }}>
          שמירת סוד
        </Btn>
        <Btn kind="primary" disabled={!!blocker || busy} onClick={() => void connect()}>
          🔗 התחברות לגבי
        </Btn>
      </div>
      {blocker && <SectionNote>{blocker}</SectionNote>}
      <SectionNote>
        הקישור חתום ותקף לדקות ספורות בלבד; כולל את מזהה-הארגון ואת המייל שלך — לא נתוני-לקוחות.
        הסוד נשמר במכשיר זה בלבד — לא בענן ולא בגיבוי.
      </SectionNote>
    </Section>
  );
}
