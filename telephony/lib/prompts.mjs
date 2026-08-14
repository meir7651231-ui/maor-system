// ─────────────────────────────────────────────────────────────────────────────
// telephony · prompts — ברכות/הכרזות: אילו הקלטות המפעיל צריך + בחירת-מצב.
// טהור. הדיאלפלן מנגן קבצי-קול (FreeSWITCH לא עושה TTS); כאן מחשבים את רשימת
// ההקלטות הנדרשות (עם נוסח-מוצע לכל אחת) ואת יכולות-הברכה של הלקוח.
// downstream: אפס-ספק — ההקלטות מקומיות בשרת-המפעיל.
// ─────────────────────────────────────────────────────────────────────────────

import { featureOn, termOf, expandTerms } from './config.mjs';

/** נתיב-בסיס להקלטות פר-לקוח בשרת. */
export function promptDir(tenant) {
  return `$\${sounds_dir}/telephony/${tenant.tenantId}`;
}

/**
 * רשימת ההקלטות שהלקוח צריך להקליט — לפי הדגלים שהודלקו. כל פריט:
 * {file, state, text} כאשר text = נוסח-מוצע (מורחב עם %org%). לתצוגה ב-onboarding.
 */
export function requiredPrompts(tenant) {
  const out = [];
  const R = tenant.routing || {};
  if (featureOn(tenant, 'voice.greeting')) {
    out.push({ file: 'greeting-open.wav', state: 'open', text: expandTerms(tenant, termOf(tenant, 'greetingDay')) });
    out.push({ file: 'greeting-closed.wav', state: 'closed', text: expandTerms(tenant, termOf(tenant, 'greetingNight')) });
    if (featureOn(tenant, 'calendar.hebrew')) {
      out.push({ file: 'greeting-holiday.wav', state: 'holiday', text: expandTerms(tenant, 'שלום, הגעתם ל%org%. אנו סגורים לרגל החג. חג שמח!') });
    }
  }
  if (featureOn(tenant, 'voice.ivr') && R.ivr) {
    out.push({ file: 'ivr/menu.wav', state: 'ivr-menu', text: R.ivr.greeting || 'תפריט ראשי' });
    out.push({ file: 'ivr/invalid.wav', state: 'ivr-invalid', text: 'בחירה לא-תקינה, נסו שוב.' });
  }
  // מספרי-הכרזה (announcement-only): כל אחד ההקלטה שלו.
  for (const n of tenant.numbers) {
    if (n.role === 'announcement') {
      out.push({ file: `announce-${n.id}.wav`, state: 'announcement', text: n.announcementText || `הכרזה עבור ${n.label}` });
    }
  }
  if (featureOn(tenant, 'emergency') && tenant.emergency && tenant.emergency.active) {
    out.push({ file: 'greeting-emergency.wav', state: 'emergency', text: tenant.emergency.message || expandTerms(tenant, 'שלום, הגעתם ל%org%. אנו סגורים היום. נשוב בהקדם.') });
  }
  return out;
}

/** יכולות-ברכה/הודעה אפקטיביות — נגזרת מהדגלים, לתצוגה/manifest. */
export function promptCapabilities(tenant) {
  return {
    greetings: featureOn(tenant, 'voice.greeting'),
    holidayGreeting: featureOn(tenant, 'voice.greeting') && featureOn(tenant, 'calendar.hebrew'),
    emergency: featureOn(tenant, 'emergency') && !!(tenant.emergency && tenant.emergency.active),
    callerNameGreeting: featureOn(tenant, 'cti.namegreeting') && tenant.cti && tenant.cti.mode !== 'off',
    voicemailTranscription: featureOn(tenant, 'voicemail.transcription'),
    holdMusic: termOf(tenant, 'holdMusic', 'ברירת-מחדל') !== 'ברירת-מחדל',
    announcementLines: tenant.numbers.filter((n) => n.role === 'announcement').map((n) => n.id),
  };
}
