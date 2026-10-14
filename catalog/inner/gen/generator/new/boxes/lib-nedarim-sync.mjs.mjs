// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/lib-nedarim-sync.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$keysOf$ext(o) {
    const ext = (o.extId || '').trim();
    return ext;
}
export function inner$keysOf$em(o) {
    const em = (o.email || '').trim().toLowerCase();
    return em;
}
export function inner$curOf$raw(charge) {
    const raw = String(charge.currency || '').trim();
    return raw;
}
export function inner$histDedupKey$txn(h) {
    const txn = (h.txn || '').trim();
    return txn;
}
export function inner$histDedupKey$ref(h) {
    const ref = (h.ref || '').trim();
    return ref;
}
export function inner$hokDayFromDate$d(iso) {
    const d = Number((iso || '').slice(8, 10));
    return d;
}
export function inner$monthsAgo$y1(dateIso) {
    const [y1, m1] = dateIso.slice(0, 7).split('-').map(Number);
    return y1;
}
export function inner$monthsAgo$m1(dateIso) {
    const [y1, m1] = dateIso.slice(0, 7).split('-').map(Number);
    return m1;
}
export function inner$monthsAgo$y2(todayIso) {
    const [y2, m2] = todayIso.slice(0, 7).split('-').map(Number);
    return y2;
}
export function inner$monthsAgo$m2(todayIso) {
    const [y2, m2] = todayIso.slice(0, 7).split('-').map(Number);
    return m2;
}
export function inner$modeOf$k(c, n) {
    const k = (c.get(n) ?? 0) + 1;
    return k;
}
export function inner$modeStr$k(c, s) {
    const k = (c.get(s) ?? 0) + 1;
    return k;
}
export function inner$supFromDonor$phone(d) {
    const phone = (d.phone || d.phone2 || d.phone3 || '').trim();
    return phone;
}
export function inner$supFromDonor$extraPhones(d) {
    const phone = (d.phone || d.phone2 || d.phone3 || '').trim();
    const extraPhones = [d.phone2, d.phone3].map((p) => (p || '').trim()).filter((p) => p && p !== phone);
    return extraPhones;
}
export function inner$supFromDonor$extraPhones$$step(d, phone) {
    const extraPhones = [d.phone2, d.phone3].map((p) => (p || '').trim()).filter((p) => p && p !== phone);
    return extraPhones;
}
export function inner$supFromDonor$notes(d, LIB_NEDARIM_SYNC_TERMS) {
    const phone = (d.phone || d.phone2 || d.phone3 || '').trim();
    const extraPhones = [d.phone2, d.phone3].map((p) => (p || '').trim()).filter((p) => p && p !== phone);
    const notes = [d.notes, extraPhones.length ? LIB_NEDARIM_SYNC_TERMS.k32 + extraPhones.join(', ') : '']
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .join(' · ');
    return notes;
}
export function inner$supFromDonor$notes$$step(d, extraPhones, LIB_NEDARIM_SYNC_TERMS) {
    const notes = [d.notes, extraPhones.length ? LIB_NEDARIM_SYNC_TERMS.k32 + extraPhones.join(', ') : '']
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .join(' · ');
    return notes;
}
export function inner$supFromCharge$id(c, seq, anon, LIB_NEDARIM_SYNC_TERMS) {
    const id = c.toremId
        ? LIB_NEDARIM_SYNC_TERMS.k38 + c.toremId
        : anon
            ? LIB_NEDARIM_SYNC_TERMS.k39
            : LIB_NEDARIM_SYNC_TERMS.k40 + (c.txnId || String(seq));
    return id;
}
export function inner$modeOf$c$$after_loop(nums) {
    const c = new Map();
    let best = nums[0] ?? 1;
    let bestN = 0;
    for (const n of nums) {
        const k = (c.get(n) ?? 0) + 1;
        c.set(n, k);
        if (k > bestN) {
            bestN = k;
            best = n;
        }
    }
    return c;
}
export function inner$modeOf$best$$after_loop(nums) {
    const c = new Map();
    let best = nums[0] ?? 1;
    let bestN = 0;
    for (const n of nums) {
        const k = (c.get(n) ?? 0) + 1;
        c.set(n, k);
        if (k > bestN) {
            bestN = k;
            best = n;
        }
    }
    return best;
}
export function inner$modeOf$bestN$$after_loop(nums) {
    const c = new Map();
    let best = nums[0] ?? 1;
    let bestN = 0;
    for (const n of nums) {
        const k = (c.get(n) ?? 0) + 1;
        c.set(n, k);
        if (k > bestN) {
            bestN = k;
            best = n;
        }
    }
    return bestN;
}
export function inner$modeStr$c$$after_loop(strs) {
    const c = new Map();
    let best = strs[0] ?? '';
    let bestN = 0;
    for (const s of strs) {
        const k = (c.get(s) ?? 0) + 1;
        c.set(s, k);
        if (k > bestN) {
            bestN = k;
            best = s;
        }
    }
    return c;
}
export function inner$modeStr$best$$after_loop(strs) {
    const c = new Map();
    let best = strs[0] ?? '';
    let bestN = 0;
    for (const s of strs) {
        const k = (c.get(s) ?? 0) + 1;
        c.set(s, k);
        if (k > bestN) {
            bestN = k;
            best = s;
        }
    }
    return best;
}
export function inner$modeStr$bestN$$after_loop(strs) {
    const c = new Map();
    let best = strs[0] ?? '';
    let bestN = 0;
    for (const s of strs) {
        const k = (c.get(s) ?? 0) + 1;
        c.set(s, k);
        if (k > bestN) {
            bestN = k;
            best = s;
        }
    }
    return bestN;
}

export const SIGS = {
  inner$keysOf$ext: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$keysOf$em: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$curOf$raw: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$histDedupKey$txn: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$histDedupKey$ref: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$hokDayFromDate$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$monthsAgo$y1: [{"name":"dateIso","d":{"t":"any"},"opt":false}],
  inner$monthsAgo$m1: [{"name":"dateIso","d":{"t":"any"},"opt":false}],
  inner$monthsAgo$y2: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$monthsAgo$m2: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$modeOf$k: [{"name":"c","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$modeStr$k: [{"name":"c","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$supFromDonor$phone: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$supFromDonor$extraPhones: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$supFromDonor$extraPhones$$step: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"phone","d":{"t":"any"},"opt":false}],
  inner$supFromDonor$notes: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"LIB_NEDARIM_SYNC_TERMS","d":{"t":"obj","p":[["k1",{"t":"str"},false],["k2",{"t":"str"},false],["k3",{"t":"str"},false],["k4",{"t":"str"},false],["k5",{"t":"str"},false],["k6",{"t":"str"},false],["k7",{"t":"str"},false],["k8",{"t":"str"},false],["k9",{"t":"str"},false],["k10",{"t":"str"},false],["k11",{"t":"str"},false],["k12",{"t":"str"},false],["k13",{"t":"str"},false],["k14",{"t":"str"},false],["k15",{"t":"str"},false],["k16",{"t":"str"},false],["k17",{"t":"str"},false],["k18",{"t":"str"},false],["k19",{"t":"str"},false],["k20",{"t":"str"},false],["k21",{"t":"str"},false],["k22",{"t":"str"},false],["k23",{"t":"str"},false],["k24",{"t":"str"},false],["k25",{"t":"str"},false],["k26",{"t":"str"},false],["k27",{"t":"str"},false],["k28",{"t":"str"},false],["k29",{"t":"str"},false],["k30",{"t":"str"},false],["k31",{"t":"str"},false],["k32",{"t":"str"},false],["k33",{"t":"str"},false],["k34",{"t":"str"},false],["k35",{"t":"str"},false],["k36",{"t":"str"},false],["k37",{"t":"str"},false],["k38",{"t":"str"},false],["k39",{"t":"str"},false],["k40",{"t":"str"},false]]},"opt":false}],
  inner$supFromDonor$notes$$step: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"extraPhones","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"LIB_NEDARIM_SYNC_TERMS","d":{"t":"obj","p":[["k1",{"t":"str"},false],["k2",{"t":"str"},false],["k3",{"t":"str"},false],["k4",{"t":"str"},false],["k5",{"t":"str"},false],["k6",{"t":"str"},false],["k7",{"t":"str"},false],["k8",{"t":"str"},false],["k9",{"t":"str"},false],["k10",{"t":"str"},false],["k11",{"t":"str"},false],["k12",{"t":"str"},false],["k13",{"t":"str"},false],["k14",{"t":"str"},false],["k15",{"t":"str"},false],["k16",{"t":"str"},false],["k17",{"t":"str"},false],["k18",{"t":"str"},false],["k19",{"t":"str"},false],["k20",{"t":"str"},false],["k21",{"t":"str"},false],["k22",{"t":"str"},false],["k23",{"t":"str"},false],["k24",{"t":"str"},false],["k25",{"t":"str"},false],["k26",{"t":"str"},false],["k27",{"t":"str"},false],["k28",{"t":"str"},false],["k29",{"t":"str"},false],["k30",{"t":"str"},false],["k31",{"t":"str"},false],["k32",{"t":"str"},false],["k33",{"t":"str"},false],["k34",{"t":"str"},false],["k35",{"t":"str"},false],["k36",{"t":"str"},false],["k37",{"t":"str"},false],["k38",{"t":"str"},false],["k39",{"t":"str"},false],["k40",{"t":"str"},false]]},"opt":false}],
  inner$supFromCharge$id: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"seq","d":{"t":"any"},"opt":false},{"name":"anon","d":{"t":"bool"},"opt":false},{"name":"LIB_NEDARIM_SYNC_TERMS","d":{"t":"obj","p":[["k1",{"t":"str"},false],["k2",{"t":"str"},false],["k3",{"t":"str"},false],["k4",{"t":"str"},false],["k5",{"t":"str"},false],["k6",{"t":"str"},false],["k7",{"t":"str"},false],["k8",{"t":"str"},false],["k9",{"t":"str"},false],["k10",{"t":"str"},false],["k11",{"t":"str"},false],["k12",{"t":"str"},false],["k13",{"t":"str"},false],["k14",{"t":"str"},false],["k15",{"t":"str"},false],["k16",{"t":"str"},false],["k17",{"t":"str"},false],["k18",{"t":"str"},false],["k19",{"t":"str"},false],["k20",{"t":"str"},false],["k21",{"t":"str"},false],["k22",{"t":"str"},false],["k23",{"t":"str"},false],["k24",{"t":"str"},false],["k25",{"t":"str"},false],["k26",{"t":"str"},false],["k27",{"t":"str"},false],["k28",{"t":"str"},false],["k29",{"t":"str"},false],["k30",{"t":"str"},false],["k31",{"t":"str"},false],["k32",{"t":"str"},false],["k33",{"t":"str"},false],["k34",{"t":"str"},false],["k35",{"t":"str"},false],["k36",{"t":"str"},false],["k37",{"t":"str"},false],["k38",{"t":"str"},false],["k39",{"t":"str"},false],["k40",{"t":"str"},false]]},"opt":false}],
  inner$modeOf$c$$after_loop: [{"name":"nums","d":{"t":"any"},"opt":false}],
  inner$modeOf$best$$after_loop: [{"name":"nums","d":{"t":"any"},"opt":false}],
  inner$modeOf$bestN$$after_loop: [{"name":"nums","d":{"t":"any"},"opt":false}],
  inner$modeStr$c$$after_loop: [{"name":"strs","d":{"t":"any"},"opt":false}],
  inner$modeStr$best$$after_loop: [{"name":"strs","d":{"t":"any"},"opt":false}],
  inner$modeStr$bestN$$after_loop: [{"name":"strs","d":{"t":"any"},"opt":false}],
};
