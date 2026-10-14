// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/DonationCalendar.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function localIso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function inner$DonCalGrid$useEffect$f(props) {
    const f = new Date(props.focusIso + 'T12:00:00');
    return f;
}
export function inner$DonCalGrid$useEffect$a(props) {
    const a = new Date(props.anchorIso + 'T12:00:00');
    return a;
}
export function inner$DonCalGrid$useMemo$arr(m, e) {
    const arr = m.get(e.date) ?? [];
    return arr;
}
export function inner$DonCalGrid$useMemo$d(offset, anchor) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset);
    return d;
}
export function inner$DonCalGrid$useMemo$iso(offset, anchor) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset);
    const iso = localIso(d);
    return iso;
}
export function inner$DonCalGrid$useMemo$iso$$step(d) {
    const iso = localIso(d);
    return iso;
}
export function inner$DonCalGrid$useMemo$base(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset * 7);
    return base;
}
export function inner$DonCalGrid$useMemo$sunday(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset * 7);
    const sunday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
    return sunday;
}
export function inner$DonCalGrid$useMemo$sunday$$step(base) {
    const sunday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
    return sunday;
}
export function inner$DonCalGrid$useMemo$d_L100(offset, anchor, i) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset * 7);
    const sunday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    return d;
}
export function inner$DonCalGrid$useMemo$d_L100$$step(sunday, i) {
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    return d;
}
export function inner$DonCalGrid$useMemo$iso_L101(offset, anchor, i) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset * 7);
    const sunday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    const iso = localIso(d);
    return iso;
}
export function inner$DonCalGrid$useMemo$iso_L101$$step(d) {
    const iso = localIso(d);
    return iso;
}
export function inner$DonCalGrid$useMemo$sat(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset * 7);
    const sunday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
    const sat = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    return sat;
}
export function inner$DonCalGrid$useMemo$sat$$step(sunday) {
    const sat = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    return sat;
}
export function inner$DonCalGrid$useMemo$base_L114(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
    return base;
}
export function inner$DonCalGrid$useMemo$sy(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
    const sy = base.getFullYear();
    return sy;
}
export function inner$DonCalGrid$useMemo$sy$$step(base) {
    const sy = base.getFullYear();
    return sy;
}
export function inner$DonCalGrid$useMemo$sm(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
    const sm = base.getMonth();
    return sm;
}
export function inner$DonCalGrid$useMemo$sm$$step(base) {
    const sm = base.getMonth();
    return sm;
}
export function inner$DonCalGrid$useMemo$start(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
    const sy = base.getFullYear();
    const sm = base.getMonth();
    const start = new Date(sy, sm, 1 - base.getDay());
    return start;
}
export function inner$DonCalGrid$useMemo$start$$step(base, sy, sm) {
    const start = new Date(sy, sm, 1 - base.getDay());
    return start;
}
export function inner$DonCalGrid$useMemo$d_L120(offset, anchor, i) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
    const sy = base.getFullYear();
    const sm = base.getMonth();
    const start = new Date(sy, sm, 1 - base.getDay());
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$DonCalGrid$useMemo$d_L120$$step(start, i) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$DonCalGrid$useMemo$last(offset, anchor) {
    const base = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
    const sy = base.getFullYear();
    const sm = base.getMonth();
    const last = new Date(sy, sm + 1, 0);
    return last;
}
export function inner$DonCalGrid$useMemo$last$$step(sy, sm) {
    const last = new Date(sy, sm + 1, 0);
    return last;
}
export function inner$DonCalGrid$useMemo$count(anchor, dim) {
    const ref = new Date(anchor);
    const first = new Date(ref);
    const count = Math.ceil((first.getDay() + dim) / 7) * 7;
    return count;
}
export function inner$DonCalGrid$useMemo$count$$step(first, dim) {
    const count = Math.ceil((first.getDay() + dim) / 7) * 7;
    return count;
}
export function inner$DonCalGrid$useMemo$d_L160(anchor, i) {
    const ref = new Date(anchor);
    const first = new Date(ref);
    const start = new Date(first);
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$DonCalGrid$useMemo$d_L160$$step(start, i) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$DonCalGrid$activeDay(mode, dayIso, view) {
    const activeDay = mode === 'day' ? view.cells[0]?.iso ?? null : dayIso;
    return activeDay;
}
export function inner$DonCalGrid$dayList(mode, dayIso, byDay, view) {
    const activeDay = mode === 'day' ? view.cells[0]?.iso ?? null : dayIso;
    const dayList = activeDay ? byDay.get(activeDay) ?? [] : [];
    return dayList;
}
export function inner$DonCalGrid$dayList$$step(byDay, activeDay) {
    const dayList = activeDay ? byDay.get(activeDay) ?? [] : [];
    return dayList;
}
export function inner$DonCalGrid$map$dons(c) {
    const dons = c.entries.filter((e) => e.amount);
    return dons;
}
export function inner$DonCalGrid$map$marks(c) {
    const marks = c.entries.filter((e) => !e.amount);
    return marks;
}
export function inner$DonCalGrid$map$ils(c) {
    const dons = c.entries.filter((e) => e.amount);
    const ils = dons.filter((e) => e.cur !== '$').reduce((t, e) => t + e.amount, 0);
    return ils;
}
export function inner$DonCalGrid$map$ils$$step(dons) {
    const ils = dons.filter((e) => e.cur !== '$').reduce((t, e) => t + e.amount, 0);
    return ils;
}
export function inner$DonCalGrid$map$usd(c) {
    const dons = c.entries.filter((e) => e.amount);
    const usd = dons.filter((e) => e.cur === '$').reduce((t, e) => t + e.amount, 0);
    return usd;
}
export function inner$DonCalGrid$map$usd$$step(dons) {
    const usd = dons.filter((e) => e.cur === '$').reduce((t, e) => t + e.amount, 0);
    return usd;
}
export function inner$DonCalGrid$map$has(c) {
    const has = c.entries.length > 0;
    return has;
}
export function inner$DonationCalendar$last(supporter) {
    const last = supporter.donations.reduce((a, d) => (d.date > a ? d.date : a), '');
    return last;
}
export function inner$DonCalGrid$useMemo$m$$after_loop(props) {
    const m = new Map();
    for (const e of props.entries) {
        const arr = m.get(e.date) ?? [];
        arr.push(e);
        m.set(e.date, arr);
    }
    return m;
}

export const SIGS = {
  inner$DonCalGrid$useEffect$f: [{"name":"props","d":{"t":"obj","p":[["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[]}},false],["anchorIso",{"t":"str"},false],["onGo",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["focusIso",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["config",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true]]},"opt":false}],
  inner$DonCalGrid$useEffect$a: [{"name":"props","d":{"t":"obj","p":[["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[]}},false],["anchorIso",{"t":"str"},false],["onGo",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["focusIso",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["config",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true]]},"opt":false}],
  inner$DonCalGrid$useMemo$arr: [{"name":"m","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}},"opt":false},{"name":"e","d":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$DonCalGrid$useMemo$d: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$iso: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$iso$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$base: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sunday: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sunday$$step: [{"name":"base","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$d_L100: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$d_L100$$step: [{"name":"sunday","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$iso_L101: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$iso_L101$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sat: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sat$$step: [{"name":"sunday","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$base_L114: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sy: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sy$$step: [{"name":"base","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sm: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$sm$$step: [{"name":"base","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$start: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$start$$step: [{"name":"base","d":{"t":"date"},"opt":false},{"name":"sy","d":{"t":"num"},"opt":false},{"name":"sm","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$d_L120: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$d_L120$$step: [{"name":"start","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$last: [{"name":"offset","d":{"t":"num"},"opt":false},{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$DonCalGrid$useMemo$last$$step: [{"name":"sy","d":{"t":"num"},"opt":false},{"name":"sm","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$count: [{"name":"anchor","d":{"t":"date"},"opt":false},{"name":"dim","d":{"t":"lit","v":[30,29]},"opt":false}],
  inner$DonCalGrid$useMemo$count$$step: [{"name":"first","d":{"t":"date"},"opt":false},{"name":"dim","d":{"t":"lit","v":[30,29]},"opt":false}],
  inner$DonCalGrid$useMemo$d_L160: [{"name":"anchor","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$useMemo$d_L160$$step: [{"name":"start","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$DonCalGrid$activeDay: [{"name":"mode","d":{"t":"lit","v":["week","month","day"]},"opt":false},{"name":"dayIso","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"view","d":{"t":"obj","p":[["cells",{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["day",{"t":"num"},false],["heb",{"t":"str"},false],["inMonth",{"t":"bool"},false],["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},false],["label",{"t":"str"},false],["subLabel",{"t":"str"},false],["todayIso",{"t":"str"},false]]},"opt":false}],
  inner$DonCalGrid$dayList: [{"name":"mode","d":{"t":"lit","v":["week","month","day"]},"opt":false},{"name":"dayIso","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"byDay","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}},"opt":false},{"name":"view","d":{"t":"obj","p":[["cells",{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["day",{"t":"num"},false],["heb",{"t":"str"},false],["inMonth",{"t":"bool"},false],["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},false],["label",{"t":"str"},false],["subLabel",{"t":"str"},false],["todayIso",{"t":"str"},false]]},"opt":false}],
  inner$DonCalGrid$dayList$$step: [{"name":"byDay","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}},"opt":false},{"name":"activeDay","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$DonCalGrid$map$dons: [{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["day",{"t":"num"},false],["heb",{"t":"str"},false],["inMonth",{"t":"bool"},false],["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$DonCalGrid$map$marks: [{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["day",{"t":"num"},false],["heb",{"t":"str"},false],["inMonth",{"t":"bool"},false],["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$DonCalGrid$map$ils: [{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["day",{"t":"num"},false],["heb",{"t":"str"},false],["inMonth",{"t":"bool"},false],["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$DonCalGrid$map$ils$$step: [{"name":"dons","d":{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$DonCalGrid$map$usd: [{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["day",{"t":"num"},false],["heb",{"t":"str"},false],["inMonth",{"t":"bool"},false],["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$DonCalGrid$map$usd$$step: [{"name":"dons","d":{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$DonCalGrid$map$has: [{"name":"c","d":{"t":"obj","p":[["iso",{"t":"str"},false],["day",{"t":"num"},false],["heb",{"t":"str"},false],["inMonth",{"t":"bool"},false],["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["","₪","$"]},false],["src",{"t":"str"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["spId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$DonationCalendar$last: [{"name":"supporter","d":{"t":"obj","n":"Supporter","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["idNum",{"t":"str"},false],["extId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["count",{"t":"num"},false],["ils",{"t":"num"},false],["usd",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["nextDate",{"t":"str"},false],["nextNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["prayerNames",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["nextEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["hok",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["ayin",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},true],["calls",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},true]]},"opt":false}],
  inner$DonCalGrid$useMemo$m$$after_loop: [{"name":"props","d":{"t":"obj","p":[["entries",{"t":"arr","of":{"t":"obj","n":"SupCalEntry","p":[]}},false],["anchorIso",{"t":"str"},false],["onGo",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["focusIso",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["config",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true]]},"opt":false}],
};
