// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/AyinCard.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AyinCard$showNames(a) {
    const showNames = a.stage !== 'done';
    return showNames;
}
export function inner$AyinCard$payGateOn(cfg) {
    const payGateOn = cfg.features?.['supporters.ayin.paygate'] === true;
    return payGateOn;
}
export function inner$AyinCard$totalCost(cost, matCost) {
    const totalCost = cost + matCost;
    return totalCost;
}
export function inner$AyinCard$submitName$eyes(eyesIn) {
    const eyes = eyesIn === '' ? '' : Math.max(0, +eyesIn.replace(/\D/g, '') || 0);
    return eyes;
}
export function inner$AyinCard$submitTime$hours(tHours) {
    const hours = +tHours.replace(/[^\d.]/g, '') || 0;
    return hours;
}
export function inner$AyinCard$submitMat$qty(mQty) {
    const qty = +mQty.replace(/[^\d.]/g, '') || 0;
    return qty;
}
export function inner$AyinCard$map$done(cur, i) {
    const done = i < cur;
    return done;
}
export function inner$AyinCard$map$on(cur, i) {
    const on = i === cur;
    return on;
}
export function inner$AyinCard$map$clickable(cur, revertOn, i) {
    const clickable = revertOn && i <= cur;
    return clickable;
}
export function inner$AyinCard$map$pillStyle(cur, revertOn, i) {
    const done = i < cur;
    const on = i === cur;
    const clickable = revertOn && i <= cur;
    const pillStyle = {
        border: '1px solid ' + (on ? '#211d17' : done ? '#cde9d6' : '#ded7c8'),
        background: on ? '#211d17' : done ? '#e4f5ea' : '#fff',
        color: on ? '#f3c76b' : done ? '#12803c' : '#b3ab9a',
        borderRadius: 99,
        padding: '4px 12px',
        fontSize: 11.5,
        fontWeight: 800,
        cursor: clickable && !on ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
    };
    return pillStyle;
}
export function inner$AyinCard$map$pillStyle$$step(done, on, clickable) {
    const pillStyle = {
        border: '1px solid ' + (on ? '#211d17' : done ? '#cde9d6' : '#ded7c8'),
        background: on ? '#211d17' : done ? '#e4f5ea' : '#fff',
        color: on ? '#f3c76b' : done ? '#12803c' : '#b3ab9a',
        borderRadius: 99,
        padding: '4px 12px',
        fontSize: 11.5,
        fontWeight: 800,
        cursor: clickable && !on ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
    };
    return pillStyle;
}
export function inner$AyinCard$map$fn$v(e) {
    const v = e.target.value.replace(/\D/g, '');
    return v;
}
export function inner$AyinCard$map$t(schedule, n) {
    const t = schedule.tasks.find((x) => x.id === n.id);
    return t;
}
export function inner$AyinCard$map$others(a, n) {
    const others = a.names.filter((o) => o.id !== n.id);
    return others;
}
export function inner$AyinCard$map$map$dn(a, d) {
    const dn = a.names.find((x) => x.id === d);
    return dn;
}

export const SIGS = {
  inner$AyinCard$showNames: [{"name":"a","d":{"t":"obj","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$AyinCard$payGateOn: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$AyinCard$totalCost: [{"name":"cost","d":{"t":"num"},"opt":false},{"name":"matCost","d":{"t":"num"},"opt":false}],
  inner$AyinCard$submitName$eyes: [{"name":"eyesIn","d":{"t":"str"},"opt":false}],
  inner$AyinCard$submitTime$hours: [{"name":"tHours","d":{"t":"str"},"opt":false}],
  inner$AyinCard$submitMat$qty: [{"name":"mQty","d":{"t":"str"},"opt":false}],
  inner$AyinCard$map$done: [{"name":"cur","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AyinCard$map$on: [{"name":"cur","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AyinCard$map$clickable: [{"name":"cur","d":{"t":"num"},"opt":false},{"name":"revertOn","d":{"t":"bool"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AyinCard$map$pillStyle: [{"name":"cur","d":{"t":"num"},"opt":false},{"name":"revertOn","d":{"t":"bool"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AyinCard$map$pillStyle$$step: [{"name":"done","d":{"t":"bool"},"opt":false},{"name":"on","d":{"t":"bool"},"opt":false},{"name":"clickable","d":{"t":"bool"},"opt":false}],
  inner$AyinCard$map$fn$v: [{"name":"e","d":{"t":"obj","n":"ChangeEvent","p":[["target",{"t":"obj","p":[]},false],["nativeEvent",{"t":"any"},false],["currentTarget",{"t":"obj","p":[]},false],["bubbles",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["preventDefault",{"t":"fn"},false],["isDefaultPrevented",{"t":"fn"},false],["stopPropagation",{"t":"fn"},false],["isPropagationStopped",{"t":"fn"},false],["persist",{"t":"fn"},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false}],
  inner$AyinCard$map$t: [{"name":"schedule","d":{"t":"obj","n":"ProjectSchedule","p":[["tasks",{"t":"arr","of":{"t":"obj","n":"ScheduledTask","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["start",{"t":"num"},false],["end",{"t":"num"},false],["days",{"t":"num"},false],["deps",{"t":"arr","of":{"t":"str"}},false],["critical",{"t":"bool"},false]]}},false],["total",{"t":"num"},false]]},"opt":false},{"name":"n","d":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]},"opt":false}],
  inner$AyinCard$map$others: [{"name":"a","d":{"t":"obj","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false},{"name":"n","d":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]},"opt":false}],
  inner$AyinCard$map$map$dn: [{"name":"a","d":{"t":"obj","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false},{"name":"d","d":{"t":"str"},"opt":false}],
};
