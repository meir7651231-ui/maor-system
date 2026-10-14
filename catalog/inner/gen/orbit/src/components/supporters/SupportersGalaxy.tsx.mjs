// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/SupportersGalaxy.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SupportersGalaxy$useMemo$arr(nodes) {
    const arr = [...nodes].sort((a, b) => (b.atRisk ? 1 : 0) - (a.atRisk ? 1 : 0) || b.size - a.size);
    return arr;
}
export function inner$SupportersGalaxy$useEffect$rgba$n(hex) {
    const n = parseInt(hex.slice(1), 16);
    return n;
}
export function inner$SupportersGalaxy$useEffect$frame$pulse(t) {
    const pulse = 1 + 0.06 * Math.sin(t * 0.05);
    return pulse;
}
export function inner$SupportersGalaxy$useEffect$frame$rot(reduce, t) {
    const rot = reduce ? 0 : t * 0.0009;
    return rot;
}
export function inner$SupportersGalaxy$useEffect$frame$ang(reduce, t, n) {
    const rot = reduce ? 0 : t * 0.0009;
    const ang = n.angle * 6.2832 + rot + n.radius * 0.4;
    return ang;
}
export function inner$SupportersGalaxy$useEffect$frame$ang$$step(rot, n) {
    const ang = n.angle * 6.2832 + rot + n.radius * 0.4;
    return ang;
}
export function inner$SupportersGalaxy$useEffect$frame$x(reduce, t, cx, maxR, n) {
    const rot = reduce ? 0 : t * 0.0009;
    const ang = n.angle * 6.2832 + rot + n.radius * 0.4;
    const x = cx + Math.cos(ang) * n.radius * maxR;
    return x;
}
export function inner$SupportersGalaxy$useEffect$frame$x$$step(cx, maxR, n, ang) {
    const x = cx + Math.cos(ang) * n.radius * maxR;
    return x;
}
export function inner$SupportersGalaxy$useEffect$frame$y(reduce, t, cy, maxR, n) {
    const TILT = 0.6;
    const rot = reduce ? 0 : t * 0.0009;
    const ang = n.angle * 6.2832 + rot + n.radius * 0.4;
    const y = cy + Math.sin(ang) * n.radius * maxR * TILT;
    return y;
}
export function inner$SupportersGalaxy$useEffect$frame$y$$step(cy, maxR, n, ang) {
    const TILT = 0.6;
    const y = cy + Math.sin(ang) * n.radius * maxR * TILT;
    return y;
}
export function inner$SupportersGalaxy$useEffect$frame$depth(reduce, t, n) {
    const rot = reduce ? 0 : t * 0.0009;
    const ang = n.angle * 6.2832 + rot + n.radius * 0.4;
    const depth = 0.72 + 0.28 * ((Math.sin(ang) + 1) / 2);
    return depth;
}
export function inner$SupportersGalaxy$useEffect$frame$depth$$step(ang) {
    const depth = 0.72 + 0.28 * ((Math.sin(ang) + 1) / 2);
    return depth;
}
export function inner$SupportersGalaxy$useEffect$frame$sz(reduce, t, n) {
    const rot = reduce ? 0 : t * 0.0009;
    const ang = n.angle * 6.2832 + rot + n.radius * 0.4;
    const depth = 0.72 + 0.28 * ((Math.sin(ang) + 1) / 2);
    const sz = (2 + n.size * 6) * depth;
    return sz;
}
export function inner$SupportersGalaxy$useEffect$frame$sz$$step(n, depth) {
    const sz = (2 + n.size * 6) * depth;
    return sz;
}
export function inner$SupportersGalaxy$useEffect$frame$fl(t, n) {
    const fl = 0.5 + 0.5 * Math.sin(t * 0.12 + n.radius * 9);
    return fl;
}
export function inner$SupportersGalaxy$useEffect$frame$d(mx, my, p) {
    const d = Math.hypot(p.x - mx, p.y - my);
    return d;
}
export function inner$SupportersGalaxy$useEffect$onClick$mx(e, r) {
    const mx = e.clientX - r.left;
    return mx;
}
export function inner$SupportersGalaxy$useEffect$onClick$my(e, r) {
    const my = e.clientY - r.top;
    return my;
}
export function inner$SupportersGalaxy$useEffect$onClick$d(e, r, p) {
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const d = Math.hypot(p.x - mx, p.y - my);
    return d;
}
export function inner$SupportersGalaxy$useEffect$onClick$d$$step(mx, my, p) {
    const d = Math.hypot(p.x - mx, p.y - my);
    return d;
}
export function inner$SupportersGalaxy$atRiskCount(nodes) {
    const atRiskCount = nodes.reduce((a, n) => a + (n.atRisk ? 1 : 0), 0);
    return atRiskCount;
}
export function inner$SupportersGalaxy$offsetLabel(offsetDays) {
    const offsetLabel = offsetDays === 0 ? 'היום' : offsetDays % 365 === 0 ? 'בעוד ' + offsetDays / 365 + ' שנה' : 'בעוד ' + offsetDays + ' ימים';
    return offsetLabel;
}
export function inner$SupportersGalaxy$newlyAtRisk(nodes, baseRisk) {
    const atRiskCount = nodes.reduce((a, n) => a + (n.atRisk ? 1 : 0), 0);
    const newlyAtRisk = Math.max(0, atRiskCount - baseRisk);
    return newlyAtRisk;
}
export function inner$SupportersGalaxy$newlyAtRisk$$step(baseRisk, atRiskCount) {
    const newlyAtRisk = Math.max(0, atRiskCount - baseRisk);
    return newlyAtRisk;
}
export function inner$SupportersGalaxy$useEffect$frame$best$$after_loop(pos, mx, my) {
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
export function inner$SupportersGalaxy$useEffect$frame$bd$$after_loop(pos, mx, my) {
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
export function inner$SupportersGalaxy$useEffect$onClick$best$$after_loop(posRef, e, r) {
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
export function inner$SupportersGalaxy$useEffect$onClick$bd$$after_loop(posRef, e, r) {
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
  inner$SupportersGalaxy$useMemo$arr: [{"name":"nodes","d":{"t":"arr","of":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]}},"opt":false}],
  inner$SupportersGalaxy$useEffect$rgba$n: [{"name":"hex","d":{"t":"str"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$pulse: [{"name":"t","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$rot: [{"name":"reduce","d":{"t":"bool"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$ang: [{"name":"reduce","d":{"t":"bool"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$ang$$step: [{"name":"rot","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$x: [{"name":"reduce","d":{"t":"bool"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"cx","d":{"t":"num"},"opt":false},{"name":"maxR","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$x$$step: [{"name":"cx","d":{"t":"num"},"opt":false},{"name":"maxR","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false},{"name":"ang","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$y: [{"name":"reduce","d":{"t":"bool"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"cy","d":{"t":"num"},"opt":false},{"name":"maxR","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$y$$step: [{"name":"cy","d":{"t":"num"},"opt":false},{"name":"maxR","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false},{"name":"ang","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$depth: [{"name":"reduce","d":{"t":"bool"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$depth$$step: [{"name":"ang","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$sz: [{"name":"reduce","d":{"t":"bool"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$sz$$step: [{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false},{"name":"depth","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$fl: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$d: [{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false},{"name":"p","d":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$onClick$mx: [{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$onClick$my: [{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$onClick$d: [{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"p","d":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$onClick$d$$step: [{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false},{"name":"p","d":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]},"opt":false}],
  inner$SupportersGalaxy$atRiskCount: [{"name":"nodes","d":{"t":"arr","of":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]}},"opt":false}],
  inner$SupportersGalaxy$offsetLabel: [{"name":"offsetDays","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$newlyAtRisk: [{"name":"nodes","d":{"t":"arr","of":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]}},"opt":false},{"name":"baseRisk","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$newlyAtRisk$$step: [{"name":"baseRisk","d":{"t":"num"},"opt":false},{"name":"atRiskCount","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$best$$after_loop: [{"name":"pos","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},"opt":false},{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$frame$bd$$after_loop: [{"name":"pos","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},"opt":false},{"name":"mx","d":{"t":"num"},"opt":false},{"name":"my","d":{"t":"num"},"opt":false}],
  inner$SupportersGalaxy$useEffect$onClick$best$$after_loop: [{"name":"posRef","d":{"t":"obj","n":"RefObject","p":[["current",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$SupportersGalaxy$useEffect$onClick$bd$$after_loop: [{"name":"posRef","d":{"t":"obj","n":"RefObject","p":[["current",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["r",{"t":"num"},false],["node",{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},false]]}},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"MouseEvent","p":[["altKey",{"t":"bool"},false],["button",{"t":"num"},false],["buttons",{"t":"num"},false],["clientX",{"t":"num"},false],["clientY",{"t":"num"},false],["ctrlKey",{"t":"bool"},false],["layerX",{"t":"num"},false],["layerY",{"t":"num"},false],["metaKey",{"t":"bool"},false],["movementX",{"t":"num"},false],["movementY",{"t":"num"},false],["offsetX",{"t":"num"},false],["offsetY",{"t":"num"},false],["pageX",{"t":"num"},false],["pageY",{"t":"num"},false],["relatedTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["shiftKey",{"t":"bool"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["getModifierState",{"t":"fn"},false],["initMouseEvent",{"t":"fn"},false],["detail",{"t":"num"},false],["view",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["which",{"t":"num"},false],["initUIEvent",{"t":"fn"},false],["bubbles",{"t":"bool"},false],["cancelBubble",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["composed",{"t":"bool"},false],["currentTarget",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["returnValue",{"t":"bool"},false],["srcElement",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["target",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"EventTarget","p":[["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]}]},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
};
