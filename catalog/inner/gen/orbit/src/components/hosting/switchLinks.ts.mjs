// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/switchLinks.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function groupMinyanim(list) {
    const out = [];
    for (const m of list) {
        let g = out.find((x) => x.shul === m.shul && x.place === m.place);
        if (!g) {
            g = { shul: m.shul, place: m.place, days: [] };
            out.push(g);
        }
        let day = g.days.find((x) => x.dayName === m.dayName);
        if (!day) {
            day = { dayName: m.dayName, items: [] };
            g.days.push(day);
        }
        day.items.push(m.prayer + ' ' + m.time);
    }
    return out;
}
function closedWhy(d) {
    if (!d.valid || !d.closed)
        return '';
    if (d.isShabbat)
        return 'בשבת' + (d.holiday ? ' · ' + d.holiday : '');
    return 'ביום טוב · ' + (d.holiday ?? '');
}
export function inner$groupMinyanim$g(out, m) {
    let g = out.find((x) => x.shul === m.shul && x.place === m.place);
    return g;
}
export function inner$groupMinyanim$day(m, g) {
    let day = g.days.find((x) => x.dayName === m.dayName);
    return day;
}
export function inner$shabbatFamilyText$where(p) {
    const where = [p.unit.trim(), p.biz.trim() ? '(' + p.biz.trim() + ')' : ''].filter(Boolean).join(' ');
    return where;
}
export function inner$shabbatFamilyText$groups(p) {
    const groups = groupMinyanim(p.minyanim);
    return groups;
}
export function inner$cleanNeed$type(t) {
    const type = (t.type || '').trim();
    return type;
}
export function inner$sacredGuardLines$a(checkIn) {
    const a = closedWhy(checkIn);
    return a;
}
export function inner$sacredGuardLines$b(checkOut) {
    const b = closedWhy(checkOut);
    return b;
}
export function inner$groupMinyanim$out$$after_loop(list) {
    const out = [];
    for (const m of list) {
        let g = out.find((x) => x.shul === m.shul && x.place === m.place);
        if (!g) {
            g = { shul: m.shul, place: m.place, days: [] };
            out.push(g);
        }
        let day = g.days.find((x) => x.dayName === m.dayName);
        if (!day) {
            day = { dayName: m.dayName, items: [] };
            g.days.push(day);
        }
        day.items.push(m.prayer + ' ' + m.time);
    }
    return out;
}

export const SIGS = {
  inner$groupMinyanim$g: [{"name":"out","d":{"t":"arr","of":{"t":"obj","n":"ShulGroup","p":[["shul",{"t":"str"},false],["place",{"t":"str"},false],["days",{"t":"arr","of":{"t":"obj","p":[["dayName",{"t":"str"},false],["items",{"t":"arr","of":{"t":"str"}},false]]}},false]]}},"opt":false},{"name":"m","d":{"t":"obj","n":"MinyanEntry","p":[["iso",{"t":"str"},false],["dayName",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false]]},"opt":false}],
  inner$groupMinyanim$day: [{"name":"m","d":{"t":"obj","n":"MinyanEntry","p":[["iso",{"t":"str"},false],["dayName",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false]]},"opt":false},{"name":"g","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ShulGroup","p":[["shul",{"t":"str"},false],["place",{"t":"str"},false],["days",{"t":"arr","of":{"t":"obj","p":[["dayName",{"t":"str"},false],["items",{"t":"arr","of":{"t":"str"}},false]]}},false]]}]},"opt":false}],
  inner$shabbatFamilyText$where: [{"name":"p","d":{"t":"obj","p":[["guest",{"t":"str"},false],["unit",{"t":"str"},false],["biz",{"t":"str"},false],["shabbat",{"t":"obj","n":"ShabbatOutput","p":[["friIso",{"t":"str"},false],["satIso",{"t":"str"},false],["candle",{"t":"str"},false],["end",{"t":"str"},false],["rabbeinuTam",{"t":"str"},false],["hebDate",{"t":"str"},false],["holiday",{"t":"str"},false],["mevarchim",{"t":"str"},false],["current",{"t":"bool"},false],["loc",{"t":"str"},false],["brand",{"t":"str"},false]]},false],["minyanim",{"t":"arr","of":{"t":"obj","n":"MinyanEntry","p":[["iso",{"t":"str"},false],["dayName",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$shabbatFamilyText$groups: [{"name":"p","d":{"t":"obj","p":[["guest",{"t":"str"},false],["unit",{"t":"str"},false],["biz",{"t":"str"},false],["shabbat",{"t":"obj","n":"ShabbatOutput","p":[["friIso",{"t":"str"},false],["satIso",{"t":"str"},false],["candle",{"t":"str"},false],["end",{"t":"str"},false],["rabbeinuTam",{"t":"str"},false],["hebDate",{"t":"str"},false],["holiday",{"t":"str"},false],["mevarchim",{"t":"str"},false],["current",{"t":"bool"},false],["loc",{"t":"str"},false],["brand",{"t":"str"},false]]},false],["minyanim",{"t":"arr","of":{"t":"obj","n":"MinyanEntry","p":[["iso",{"t":"str"},false],["dayName",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$cleanNeed$type: [{"name":"t","d":{"t":"obj","n":"Pick","p":[["type",{"t":"str"},false]]},"opt":false}],
  inner$sacredGuardLines$a: [{"name":"checkIn","d":{"t":"obj","n":"DayInfoOutput","p":[["iso",{"t":"str"},false],["valid",{"t":"bool"},false],["hebDate",{"t":"str"},false],["hebDayMonth",{"t":"str"},false],["hebDay",{"t":"str"},false],["hebMonth",{"t":"str"},false],["hebYear",{"t":"str"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["dayName",{"t":"str"},false],["isShabbat",{"t":"bool"},false],["isYomTov",{"t":"bool"},false],["closed",{"t":"bool"},false]]},"opt":false}],
  inner$sacredGuardLines$b: [{"name":"checkOut","d":{"t":"obj","n":"DayInfoOutput","p":[["iso",{"t":"str"},false],["valid",{"t":"bool"},false],["hebDate",{"t":"str"},false],["hebDayMonth",{"t":"str"},false],["hebDay",{"t":"str"},false],["hebMonth",{"t":"str"},false],["hebYear",{"t":"str"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["dayName",{"t":"str"},false],["isShabbat",{"t":"bool"},false],["isYomTov",{"t":"bool"},false],["closed",{"t":"bool"},false]]},"opt":false}],
  inner$groupMinyanim$out$$after_loop: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"MinyanEntry","p":[["iso",{"t":"str"},false],["dayName",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false]]}},"opt":false}],
};
