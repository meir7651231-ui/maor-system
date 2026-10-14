// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/SupportersUniverse3D.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SupportersUniverse3D$useMemo$arr(nodes) {
    const arr = [...nodes].sort((a, b) => (b.atRisk ? 1 : 0) - (a.atRisk ? 1 : 0) || b.size - a.size);
    return arr;
}
export function inner$SupportersUniverse3D$useEffect$rgba$n(hex) {
    const n = parseInt(hex.slice(1), 16);
    return n;
}
export function inner$SupportersUniverse3D$useEffect$frame$sz(n, p) {
    const sz = Math.max(1.2, (2 + n.size * 6) * p.scale);
    return sz;
}
export function inner$SupportersUniverse3D$useEffect$frame$fade(p) {
    const fade = 0.5 + 0.5 * Math.min(1, Math.max(0, p.scale - 0.5));
    return fade;
}
export function inner$SupportersUniverse3D$useEffect$frame$fl(t, n) {
    const fl = 0.5 + 0.5 * Math.sin(t * 0.12 + n.x * 9);
    return fl;
}
export function inner$SupportersUniverse3D$useEffect$frame$d(mx, my, p) {
    const d = Math.hypot(p.x - mx, p.y - my);
    return d;
}
export function inner$SupportersUniverse3D$useEffect$onClick$mx(e, r) {
    const mx = e.clientX - r.left;
    return mx;
}
export function inner$SupportersUniverse3D$useEffect$onClick$my(e, r) {
    const my = e.clientY - r.top;
    return my;
}
export function inner$SupportersUniverse3D$useEffect$onClick$d(e, r, p) {
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const d = Math.hypot(p.x - mx, p.y - my);
    return d;
}
export function inner$SupportersUniverse3D$useEffect$onClick$d$$step(mx, my, p) {
    const d = Math.hypot(p.x - mx, p.y - my);
    return d;
}
export function inner$SupportersUniverse3D$atRiskCount(nodes) {
    const atRiskCount = nodes.reduce((a, n) => a + (n.atRisk ? 1 : 0), 0);
    return atRiskCount;
}
export function inner$SupportersUniverse3D$useEffect$frame$best$$after_loop(pos, mx, my) {
    let best = null;
    let bd = 16;
    for (const p of pos) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < bd + p.r) {
            bd = d;
            best = p;
        }
    }
    return best;
}
export function inner$SupportersUniverse3D$useEffect$frame$bd$$after_loop(pos, mx, my) {
    let best = null;
    let bd = 16;
    for (const p of pos) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < bd + p.r) {
            bd = d;
            best = p;
        }
    }
    return bd;
}
export function inner$SupportersUniverse3D$useEffect$onClick$best$$after_loop(posRef, e, r) {
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best = null;
    let bd = 18;
    for (const p of posRef.current) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < bd + p.r) {
            bd = d;
            best = p.id;
        }
    }
    return best;
}
export function inner$SupportersUniverse3D$useEffect$onClick$bd$$after_loop(posRef, e, r) {
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best = null;
    let bd = 18;
    for (const p of posRef.current) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < bd + p.r) {
            bd = d;
            best = p.id;
        }
    }
    return bd;
}

export const SIGS = {
  inner$SupportersUniverse3D$useMemo$arr: [{"name":"nodes","d":{"t":"arr","of":{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]}},"opt":false}],
  inner$SupportersUniverse3D$useEffect$rgba$n: [{"name":"hex","d":{"t":"str"},"opt":false}],
  inner$SupportersUniverse3D$useEffect$frame$sz: [{"name":"n","d":{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false},{"name":"p","d":{"t":"obj","p":[["sx",{"t":"num"},false],["sy",{"t":"num"},false],["depth",{"t":"num"},false],["scale",{"t":"num"},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$frame$fade: [{"name":"p","d":{"t":"obj","p":[["sx",{"t":"num"},false],["sy",{"t":"num"},false],["depth",{"t":"num"},false],["scale",{"t":"num"},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$frame$fl: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$frame$d: [{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false},{"name":"p","d":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$onClick$mx: [{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$onClick$my: [{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$onClick$d: [{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"p","d":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$onClick$d$$step: [{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false},{"name":"p","d":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]},"opt":false}],
  inner$SupportersUniverse3D$atRiskCount: [{"name":"nodes","d":{"t":"arr","of":{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]}},"opt":false}],
  inner$SupportersUniverse3D$useEffect$frame$best$$after_loop: [{"name":"pos","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},"opt":false},{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false}],
  inner$SupportersUniverse3D$useEffect$frame$bd$$after_loop: [{"name":"pos","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},"opt":false},{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false}],
  inner$SupportersUniverse3D$useEffect$onClick$best$$after_loop: [{"name":"posRef","d":{"t":"obj","n":"RefObject","p":[["current",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$SupportersUniverse3D$useEffect$onClick$bd$$after_loop: [{"name":"posRef","d":{"t":"obj","n":"RefObject","p":[["current",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"UniverseNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
};
