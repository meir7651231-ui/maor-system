// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/wheel/CourseWheel.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CX = 200;
const CY = 200;
const R = 178;
const AGE_BANDS = [
    { key: '3-6', label: '3–6', lo: 3, hi: 6 },
    { key: '7-10', label: '7–10', lo: 7, hi: 10 },
    { key: '11-14', label: '11–14', lo: 11, hi: 14 },
    { key: '15+', label: '15+', lo: 15, hi: 120 },
];
function rad(deg) {
    return (deg * Math.PI) / 180;
}
const ease = (t) => t < 0.28 ? (t / 0.28) * (t / 0.28) * 0.12 : 0.12 + 0.88 * (1 - Math.pow(1 - (t - 0.28) / 0.72, 3));
export function inner$arcPath$x0(a0) {
    const x0 = CX + R * Math.cos(rad(a0));
    return x0;
}
export function inner$arcPath$y0(a0) {
    const y0 = CY + R * Math.sin(rad(a0));
    return y0;
}
export function inner$arcPath$x1(a1) {
    const x1 = CX + R * Math.cos(rad(a1));
    return x1;
}
export function inner$arcPath$y1(a1) {
    const y1 = CY + R * Math.sin(rad(a1));
    return y1;
}
export function inner$arcPath$large(a0, a1) {
    const large = a1 - a0 > 180 ? 1 : 0;
    return large;
}
export function inner$CourseWheel$useMemo$band(locks) {
    const band = AGE_BANDS.find((b) => b.key === locks.age);
    return band;
}
export function inner$CourseWheel$spin$step(n) {
    const step = 360 / n;
    return step;
}
export function inner$CourseWheel$spin$targetMod(n, idx, jitter) {
    const step = 360 / n;
    const targetMod = ((360 - (idx * step + jitter)) % 360 + 360) % 360;
    return targetMod;
}
export function inner$CourseWheel$spin$targetMod$$step(step, idx, jitter) {
    const targetMod = ((360 - (idx * step + jitter)) % 360 + 360) % 360;
    return targetMod;
}
export function inner$CourseWheel$spin$target(n, idx, jitter, from, turns) {
    const step = 360 / n;
    const targetMod = ((360 - (idx * step + jitter)) % 360 + 360) % 360;
    const target = Math.ceil(from / 360) * 360 + turns * 360 + targetMod;
    return target;
}
export function inner$CourseWheel$spin$target$$step(targetMod, from, turns) {
    const target = Math.ceil(from / 360) * 360 + turns * 360 + targetMod;
    return target;
}
export function inner$CourseWheel$spin$delta(n, idx, jitter, from, turns) {
    const step = 360 / n;
    const targetMod = ((360 - (idx * step + jitter)) % 360 + 360) % 360;
    const target = Math.ceil(from / 360) * 360 + turns * 360 + targetMod;
    const delta = target - from;
    return delta;
}
export function inner$CourseWheel$spin$delta$$step(from, target) {
    const delta = target - from;
    return delta;
}
export function inner$CourseWheel$spin$frame$p(t0, now) {
    const dur = 4200;
    const p = Math.min(1, (now - t0) / dur);
    return p;
}
export function inner$CourseWheel$spin$frame$r(from, delta, t0, now) {
    const dur = 4200;
    const p = Math.min(1, (now - t0) / dur);
    const r = from + delta * ease(p);
    return r;
}
export function inner$CourseWheel$spin$frame$r$$step(from, delta, p) {
    const r = from + delta * ease(p);
    return r;
}
export function inner$CourseWheel$priceLabel$p(c) {
    const p = '₪' + (c.price || 0);
    return p;
}
export function inner$CourseWheel$step(n) {
    const step = n > 0 ? 360 / n : 360;
    return step;
}
export function inner$CourseWheel$only(courses, n) {
    const only = n === 1 ? courses[0] : null;
    return only;
}
export function inner$CourseWheel$fontSize(n) {
    const fontSize = n <= 6 ? 15 : n <= 10 ? 13 : n <= 16 ? 11.5 : n <= 24 ? 10 : 8.5;
    return fontSize;
}
export function inner$CourseWheel$maxChars(n) {
    const maxChars = n <= 8 ? 16 : n <= 16 ? 12 : 9;
    return maxChars;
}
export function inner$CourseWheel$map$a0(step, i) {
    const a0 = -90 + i * step;
    return a0;
}
export function inner$CourseWheel$map$mid(step, i) {
    const a0 = -90 + i * step;
    const mid = a0 + step / 2;
    return mid;
}
export function inner$CourseWheel$map$mid$$step(step, a0) {
    const mid = a0 + step / 2;
    return mid;
}
export function inner$CourseWheel$map$isWin(spinning, winner, c) {
    const isWin = winner?.id === c.id && !spinning;
    return isWin;
}
export function inner$CourseWheel$map$a(step, i) {
    const a = rad(-90 + i * step);
    return a;
}

export const SIGS = {
  inner$arcPath$x0: [{"name":"a0","d":{"t":"num"},"opt":false}],
  inner$arcPath$y0: [{"name":"a0","d":{"t":"num"},"opt":false}],
  inner$arcPath$x1: [{"name":"a1","d":{"t":"num"},"opt":false}],
  inner$arcPath$y1: [{"name":"a1","d":{"t":"num"},"opt":false}],
  inner$arcPath$large: [{"name":"a0","d":{"t":"num"},"opt":false},{"name":"a1","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$useMemo$band: [{"name":"locks","d":{"t":"obj","n":"Locks","p":[["gender",{"t":"lit","v":["m","f","all"]},false],["age",{"t":"str"},false],["day",{"t":"num"},false],["cat",{"t":"str"},false]]},"opt":false}],
  inner$CourseWheel$spin$step: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$targetMod: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false},{"name":"jitter","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$targetMod$$step: [{"name":"step","d":{"t":"num"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false},{"name":"jitter","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$target: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false},{"name":"jitter","d":{"t":"num"},"opt":false},{"name":"from","d":{"t":"num"},"opt":false},{"name":"turns","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$target$$step: [{"name":"targetMod","d":{"t":"num"},"opt":false},{"name":"from","d":{"t":"num"},"opt":false},{"name":"turns","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$delta: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false},{"name":"jitter","d":{"t":"num"},"opt":false},{"name":"from","d":{"t":"num"},"opt":false},{"name":"turns","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$delta$$step: [{"name":"from","d":{"t":"num"},"opt":false},{"name":"target","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$frame$p: [{"name":"t0","d":{"t":"num"},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$frame$r: [{"name":"from","d":{"t":"num"},"opt":false},{"name":"delta","d":{"t":"num"},"opt":false},{"name":"t0","d":{"t":"num"},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$spin$frame$r$$step: [{"name":"from","d":{"t":"num"},"opt":false},{"name":"delta","d":{"t":"num"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$priceLabel$p: [{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$CourseWheel$step: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$only: [{"name":"courses","d":{"t":"arr","of":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$fontSize: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$maxChars: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$map$a0: [{"name":"step","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$map$mid: [{"name":"step","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$map$mid$$step: [{"name":"step","d":{"t":"num"},"opt":false},{"name":"a0","d":{"t":"num"},"opt":false}],
  inner$CourseWheel$map$isWin: [{"name":"spinning","d":{"t":"bool"},"opt":false},{"name":"winner","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$CourseWheel$map$a: [{"name":"step","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
};
