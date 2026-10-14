// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/hebrew.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$scanHebYear$hit(hebYearScan, hebYear) {
    const hit = hebYearScan.get(hebYear);
    return hit;
}
export function inner$scanHebYear$gy(hebYear, HEB_CAL) {
    const gy = hebYear - HEB_CAL.hebYearOffset;
    return gy;
}

export const SIGS = {
  inner$scanHebYear$hit: [{"name":"hebYearScan","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"hebYear","d":{"t":"any"},"opt":false}],
  inner$scanHebYear$gy: [{"name":"hebYear","d":{"t":"num"},"opt":false},{"name":"HEB_CAL","d":{"t":"obj","p":[["anchor",{"t":"num"},false],["hebYearOffset",{"t":"num"},false],["scanWindowDays",{"t":"num"},false],["approx",{"t":"obj","p":[["a",{"t":"num"},false],["b",{"t":"num"},false]]},false],["leap",{"t":"obj","p":[["a",{"t":"num"},false],["b",{"t":"num"},false],["m",{"t":"num"},false],["t",{"t":"num"},false]]},false],["months",{"t":"obj","p":[["a",{"t":"num"},false],["b",{"t":"num"},false],["c",{"t":"num"},false]]},false],["carry",{"t":"obj","p":[["base",{"t":"num"},false],["p0",{"t":"num"},false],["q",{"t":"num"},false],["parts",{"t":"num"},false]]},false],["postpone",{"t":"obj","p":[["m",{"t":"num"},false],["k",{"t":"num"},false],["t",{"t":"num"},false]]},false],["span",{"t":"obj","p":[["hi",{"t":"num"},false],["lo",{"t":"num"},false]]},false],["yearLens",{"t":"obj","p":[["longMid",{"t":"arr","of":{"t":"num"}},false],["shortMid",{"t":"arr","of":{"t":"num"}},false]]},false],["shortMonths",{"t":"arr","of":{"t":"num"}},false],["flexLong",{"t":"num"},false],["flexShort",{"t":"num"},false],["leapFlex",{"t":"num"},false],["monthsInLeap",{"t":"num"},false],["monthsInPlain",{"t":"num"},false],["shortLen",{"t":"num"},false],["longLen",{"t":"num"},false],["nisan",{"t":"num"},false],["tishrei",{"t":"num"},false],["names",{"t":"arr","of":{"t":"str"}},false],["leapName12",{"t":"str"},false],["greg",{"t":"obj","p":[["yearDays",{"t":"num"},false],["c4",{"t":"num"},false],["c100",{"t":"num"},false],["c400",{"t":"num"},false],["mA",{"t":"num"},false],["mB",{"t":"num"},false],["mC",{"t":"num"},false],["leapAdj",{"t":"num"},false],["plainAdj",{"t":"num"},false]]},false],["yearMin",{"t":"num"},false],["yearMax",{"t":"num"},false],["noonHour",{"t":"num"},false],["knownMonthsEn",{"t":"arr","of":{"t":"str"}},false],["cldrWarn",{"t":"str"},false]]},"opt":false}],
};
