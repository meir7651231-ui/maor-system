// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/billing.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PLANS = {
    basic: { name: 'בסיסי', base: 90, perExt: 0, includedMinutes: 0, perMinute: 0, maxExt: 3 },
    standard: { name: 'רגיל', base: 190, perExt: 15, includedMinutes: 500, perMinute: 0.1, maxExt: 10 },
    pro: { name: 'מורחב', base: 390, perExt: 12, includedMinutes: 2000, perMinute: 0.08, maxExt: 50 },
};
export function inner$normalizeCdr$dur(raw) {
    const dur = Number(raw.billsec ?? 0) || 0;
    return dur;
}
export function inner$meterUsage$mins(c) {
    const mins = Math.ceil(c.billsec / 60);
    return mins;
}
export function inner$computeInvoice$items(planKey) {
    const plan = PLANS[planKey] || PLANS.basic;
    const items = [{ label: `מנוי ${plan.name}`, amount: plan.base }];
    return items;
}
export function inner$computeInvoice$items$$step(plan) {
    const items = [{ label: `מנוי ${plan.name}`, amount: plan.base }];
    return items;
}
export function inner$computeInvoice$exts(opt) {
    const exts = Math.max(0, (opt.extensions || 0));
    return exts;
}
export function inner$computeInvoice$outMin(usage) {
    const outMin = usage.outbound ? (usage.outbound.minutes || 0) : 0;
    return outMin;
}
export function inner$computeInvoice$billableMin(planKey, usage) {
    const plan = PLANS[planKey] || PLANS.basic;
    const outMin = usage.outbound ? (usage.outbound.minutes || 0) : 0;
    const billableMin = Math.max(0, outMin - plan.includedMinutes);
    return billableMin;
}
export function inner$computeInvoice$billableMin$$step(plan, outMin) {
    const billableMin = Math.max(0, outMin - plan.includedMinutes);
    return billableMin;
}
export function inner$computeInvoice$total(items) {
    const total = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
    return total;
}

export const SIGS = {
  inner$normalizeCdr$dur: [{"name":"raw","d":{"t":"obj","p":[]},"opt":false}],
  inner$meterUsage$mins: [{"name":"c","d":{"t":"obj","p":[["uuid",{"t":"str"},false],["tenantId",{"t":"str"},false],["direction",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["line",{"t":"str"},false],["startedAt",{"t":"str"},false],["billsec",{"t":"num"},false],["answered",{"t":"bool"},false],["hangupCause",{"t":"str"},false]]},"opt":false}],
  inner$computeInvoice$items: [{"name":"planKey","d":{"t":"str"},"opt":false}],
  inner$computeInvoice$items$$step: [{"name":"plan","d":{"t":"any"},"opt":false}],
  inner$computeInvoice$exts: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["extensions",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$computeInvoice$outMin: [{"name":"usage","d":{"t":"obj","p":[["minutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["outbound",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["minutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},true]]},"opt":false}],
  inner$computeInvoice$billableMin: [{"name":"planKey","d":{"t":"str"},"opt":false},{"name":"usage","d":{"t":"obj","p":[["minutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["outbound",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["minutes",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},true]]},"opt":false}],
  inner$computeInvoice$billableMin$$step: [{"name":"plan","d":{"t":"any"},"opt":false},{"name":"outMin","d":{"t":"num"},"opt":false}],
  inner$computeInvoice$total: [{"name":"items","d":{"t":"arr","of":{"t":"obj","p":[["label",{"t":"str"},false],["amount",{"t":"any"},false]]}},"opt":false}],
};
