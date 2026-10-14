// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/sheetFx.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$trapTab$z(f) {
    const z = f[f.length - 1];
    return z;
}
export function inner$mountSheet$anim$K(to) {
    const K = to > 0 ? 260 : 380;
    return K;
}
export function inner$mountSheet$anim$C(to) {
    const C = to > 0 ? 32 : 30;
    return C;
}
export function inner$mountSheet$anim$f$dt(last, t) {
    const dt = Math.min(0.032, (t - last) / 1000);
    return dt;
}
export function inner$mountSheet$anim$f$a(SP, K, C) {
    const a = -K * (SP.y - SP.to) - C * SP.v;
    return a;
}
export function inner$mountSheet$onScroll$on(body, c) {
    const on = body.scrollTop > c.offsetHeight - 64;
    return on;
}
export function inner$mountSheet$move$dy(y0, e) {
    const dy = e.clientY - y0;
    return dy;
}

export const SIGS = {
  inner$trapTab$z: [{"name":"f","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$mountSheet$anim$K: [{"name":"to","d":{"t":"num"},"opt":false}],
  inner$mountSheet$anim$C: [{"name":"to","d":{"t":"num"},"opt":false}],
  inner$mountSheet$anim$f$dt: [{"name":"last","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$mountSheet$anim$f$a: [{"name":"SP","d":{"t":"obj","p":[["y",{"t":"num"},false],["v",{"t":"num"},false],["to",{"t":"num"},false],["run",{"t":"num"},false]]},"opt":false},{"name":"K","d":{"t":"lit","v":[260,380]},"opt":false},{"name":"C","d":{"t":"lit","v":[30,32]},"opt":false}],
  inner$mountSheet$onScroll$on: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false}],
  inner$mountSheet$move$dy: [{"name":"y0","d":{"t":"num"},"opt":false},{"name":"e","d":{"t":"obj","n":"PointerEvent","p":[["altitudeAngle",{"t":"num"},false],["azimuthAngle",{"t":"num"},false],["height",{"t":"num"},false],["isPrimary",{"t":"bool"},false],["persistentDeviceId",{"t":"num"},false],["pointerId",{"t":"num"},false],["pointerType",{"t":"str"},false],["pressure",{"t":"num"},false],["tangentialPressure",{"t":"num"},false],["tiltX",{"t":"num"},false],["tiltY",{"t":"num"},false],["twist",{"t":"num"},false],["width",{"t":"num"},false],["getCoalescedEvents",{"t":"fn"},false],["getPredictedEvents",{"t":"fn"},false],["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false]]},"opt":false}],
};
