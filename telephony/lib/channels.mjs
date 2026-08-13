// ─────────────────────────────────────────────────────────────────────────────
// telephony · channels — המודל הרב-ערוצי, downstream לגמרי.
//
// קול מטופל בדיאלפלן (generate.mjs). כאן מוגדר איך הערוצים שאינם-קול מגיעים
// אלינו — בלי אף ספק, בלי Business API, בלי שער-SMS-מסחרי:
//   · ווצאפ = קישור-מכשיר (WhatsApp ריבוי-מכשירים). מקשרים את מכשיר-העמותה
//     כמכשיר-נלווה; ההודעות זורמות לתיבה-מאוחדת. לא Business API, לא מספר-חדש.
//   · SMS = דרך ה-SIM שכבר בשער-ה-GSM של הלקוח (שולח/מקבל SMS בערוץ שלו).
//
// כל הערוצים מתאחדים דרך אותו גשר-CTI (cti.mjs): הודעה ממספר-מוכר קופצת
// לאותו כרטיס Family/Supporter כמו שיחה. downstream: קריאה בלבד, אפס-ספק.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * בונה תוכנית-ערוצים לכל מספר שאינו-קול-בלבד. מחזיר את דרך-הטיפול downstream
 * וסימון-CTI. זהו הקלט של גשר-ההודעות (מודול-ריצה נפרד) ושל התיבה-המאוחדת.
 * @param {object} tenant  tenant מנורמל
 * @returns {{whatsapp:Array, sms:Array, unifiedInbox:object}}
 */
export function channelPlan(tenant) {
  const whatsapp = [];
  const sms = [];
  for (const n of tenant.numbers) {
    const ch = n.channels || [];
    if (ch.includes('whatsapp') || n.onramp === 'device-link') {
      whatsapp.push({
        id: n.id,
        e164: n.e164,
        label: n.label,
        method: 'device-link', // WhatsApp ריבוי-מכשירים — לא Business API
        provider: null, // אין ספק. downstream.
        setup: 'קשר את מכשיר-העמותה כמכשיר-נלווה (Linked Device) בתפריט ווצאפ.',
        cti: tenant.cti && tenant.cti.mode !== 'off',
      });
    }
    if (ch.includes('sms')) {
      sms.push({
        id: n.id,
        e164: n.e164,
        label: n.label,
        method: n.onramp === 'sim-in-gateway' ? 'sim-gateway' : 'customer-forward',
        provider: null, // אין שער-SMS מסחרי. ה-SIM עצמו.
        ...(Number.isInteger(n.gatewayChannel) ? { gatewayChannel: n.gatewayChannel } : {}),
        cti: tenant.cti && tenant.cti.mode !== 'off',
      });
    }
  }
  return {
    whatsapp,
    sms,
    // כל הערוצים (קול+ווצאפ+SMS) מצליבים מול אותו directory של מאור.
    unifiedInbox: {
      cti: tenant.cti || { org: null, mode: 'off' },
      channels: [
        'voice',
        ...(whatsapp.length ? ['whatsapp'] : []),
        ...(sms.length ? ['sms'] : []),
      ],
    },
  };
}

/**
 * אינווריאנט-שמירה: מוודא שאין דליפת-ספק בתוכנית-הערוצים. כל provider חייב null.
 * @returns {boolean}
 */
export function isPureDownstream(plan) {
  const all = [...(plan.whatsapp || []), ...(plan.sms || [])];
  return all.every((x) => x.provider === null && x.method !== 'business-api' && x.method !== 'sms-provider');
}
