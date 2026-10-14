// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/DonationModal.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$DonationModal$plannedOn(config) {
    const plannedOn = config.features?.['supporters.plannedcharges'] === true;
    return plannedOn;
}
export function inner$DonationModal$fn$c(d) {
    const c = (d.cat || '').trim();
    return c;
}
export function inner$DonationModal$save$amt(amount) {
    const amt = Math.round(Number(amount) * 100) / 100;
    return amt;
}
export function inner$DonationModal$save$desig(sponsorOn, designation) {
    const desig = sponsorOn ? designation.trim() : '';
    return desig;
}
export function inner$DonationModal$save$purp(purposeOn, purpose) {
    const purp = purposeOn ? purpose.trim() : '';
    return purp;
}
export function inner$DonationModal$save$noteParts(sponsorOn, designation, purposeOn, purpose) {
    const desig = sponsorOn ? designation.trim() : '';
    const purp = purposeOn ? purpose.trim() : '';
    const noteParts = [desig ? 'ייעוד: ' + desig : '', purp ? 'עבודה: ' + purp : ''].filter(Boolean);
    return noteParts;
}
export function inner$DonationModal$save$noteParts$$step(desig, purp) {
    const noteParts = [desig ? 'ייעוד: ' + desig : '', purp ? 'עבודה: ' + purp : ''].filter(Boolean);
    return noteParts;
}

export const SIGS = {
  inner$DonationModal$plannedOn: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$DonationModal$fn$c: [{"name":"d","d":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$DonationModal$save$amt: [{"name":"amount","d":{"t":"str"},"opt":false}],
  inner$DonationModal$save$desig: [{"name":"sponsorOn","d":{"t":"bool"},"opt":false},{"name":"designation","d":{"t":"str"},"opt":false}],
  inner$DonationModal$save$purp: [{"name":"purposeOn","d":{"t":"bool"},"opt":false},{"name":"purpose","d":{"t":"str"},"opt":false}],
  inner$DonationModal$save$noteParts: [{"name":"sponsorOn","d":{"t":"bool"},"opt":false},{"name":"designation","d":{"t":"str"},"opt":false},{"name":"purposeOn","d":{"t":"bool"},"opt":false},{"name":"purpose","d":{"t":"str"},"opt":false}],
  inner$DonationModal$save$noteParts$$step: [{"name":"desig","d":{"t":"str"},"opt":false},{"name":"purp","d":{"t":"str"},"opt":false}],
};
