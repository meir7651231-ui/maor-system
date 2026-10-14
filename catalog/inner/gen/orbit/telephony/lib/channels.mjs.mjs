// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/channels.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$whatsappRouting$agents(tenant) {
    const office = (tenant.destinations && tenant.destinations.office && tenant.destinations.office.ext) || [];
    const manager = (tenant.destinations && tenant.destinations.manager && tenant.destinations.manager.ext) || '';
    const agents = [...new Set([...office, manager].filter(Boolean))];
    return agents;
}
export function inner$whatsappRouting$agents$$step(office, manager) {
    const agents = [...new Set([...office, manager].filter(Boolean))];
    return agents;
}
export function inner$whatsappRouting$waNums(tenant) {
    const waNums = (tenant.numbers || []).filter((n) => (n.channels || []).includes('whatsapp') || n.onramp === 'device-link');
    return waNums;
}
export function inner$whatsappRouting$lines(tenant) {
    const office = (tenant.destinations && tenant.destinations.office && tenant.destinations.office.ext) || [];
    const manager = (tenant.destinations && tenant.destinations.manager && tenant.destinations.manager.ext) || '';
    const agents = [...new Set([...office, manager].filter(Boolean))];
    const waNums = (tenant.numbers || []).filter((n) => (n.channels || []).includes('whatsapp') || n.onramp === 'device-link');
    const lines = waNums.map((n) => ({
        id: n.id,
        e164: n.e164,
        label: n.label || '',
        agents, // fan-out לכל מכשירי-הצוות (ריבוי-מכשירים)
        replyAs: n.e164, // עונים מזהות מספר-הווצאפ של העמותה
    }));
    return lines;
}
export function inner$whatsappRouting$lines$$step(agents, waNums) {
    const lines = waNums.map((n) => ({
        id: n.id,
        e164: n.e164,
        label: n.label || '',
        agents, // fan-out לכל מכשירי-הצוות (ריבוי-מכשירים)
        replyAs: n.e164, // עונים מזהות מספר-הווצאפ של העמותה
    }));
    return lines;
}
export function inner$assignMessage$list(agents) {
    const list = Array.isArray(agents) ? agents.filter(Boolean) : [];
    return list;
}
export function inner$senderIdentity$sim(tenant) {
    const sim = (tenant.numbers || []).find((n) => (n.channels || []).includes('sms') && n.onramp === 'sim-in-gateway');
    return sim;
}
export function inner$matchMessageContact$peer(m) {
    const peer = m.direction === 'inbound' ? m.from : m.to;
    return peer;
}
export function inner$channelPlan$whatsapp$$after_loop(tenant) {
    const whatsapp = [];
    const sms = [];
    for (const n of tenant.numbers || []) { // נחיל-6 R6-13: מגן על קלט-חלקי (כמו שאר הפונקציות)
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
        // SMS אמיתי רק דרך SIM-בשער. הפניית-לקוח (customer-forward) אינה מעבירה SMS.
        if (ch.includes('sms') && n.onramp === 'sim-in-gateway') {
            sms.push({
                id: n.id,
                e164: n.e164,
                label: n.label,
                method: 'sim-gateway',
                provider: null, // אין שער-SMS מסחרי. ה-SIM עצמו.
                ...(Number.isInteger(n.gatewayChannel) ? { gatewayChannel: n.gatewayChannel } : {}),
                cti: tenant.cti && tenant.cti.mode !== 'off',
            });
        }
    }
    return whatsapp;
}
export function inner$channelPlan$sms$$after_loop(tenant) {
    const whatsapp = [];
    const sms = [];
    for (const n of tenant.numbers || []) { // נחיל-6 R6-13: מגן על קלט-חלקי (כמו שאר הפונקציות)
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
        // SMS אמיתי רק דרך SIM-בשער. הפניית-לקוח (customer-forward) אינה מעבירה SMS.
        if (ch.includes('sms') && n.onramp === 'sim-in-gateway') {
            sms.push({
                id: n.id,
                e164: n.e164,
                label: n.label,
                method: 'sim-gateway',
                provider: null, // אין שער-SMS מסחרי. ה-SIM עצמו.
                ...(Number.isInteger(n.gatewayChannel) ? { gatewayChannel: n.gatewayChannel } : {}),
                cti: tenant.cti && tenant.cti.mode !== 'off',
            });
        }
    }
    return sms;
}

export const SIGS = {
  inner$whatsappRouting$agents: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$whatsappRouting$agents$$step: [{"name":"office","d":{"t":"any"},"opt":false},{"name":"manager","d":{"t":"any"},"opt":false}],
  inner$whatsappRouting$waNums: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$whatsappRouting$lines: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$whatsappRouting$lines$$step: [{"name":"agents","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"waNums","d":{"t":"any"},"opt":false}],
  inner$assignMessage$list: [{"name":"agents","d":{"t":"any"},"opt":false}],
  inner$senderIdentity$sim: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$matchMessageContact$peer: [{"name":"m","d":{"t":"obj","p":[["contactRef",{"t":"any"},true],["id",{"t":"str"},false],["channel",{"t":"any"},false],["direction",{"t":"str"},false],["from",{"t":"any"},false],["to",{"t":"any"},false],["text",{"t":"any"},false],["ts",{"t":"any"},false]]},"opt":false}],
  inner$channelPlan$whatsapp$$after_loop: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$channelPlan$sms$$after_loop: [{"name":"tenant","d":{"t":"any"},"opt":false}],
};
