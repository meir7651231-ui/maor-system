// 📦 נוצר אוטומטית ע"י catalog/runtime/bundle.mjs מתוך ההרכבה של «מוקד-חלוקה» — לא לערוך ביד.
// כל פונקציה כאן היא החלק המוכח עצמו, מהקוד המקורי (הליבות · אורביט · החלקים הפנימיים); זמן-הריצה רק מחבר.
//#region catalog/combiner/graph.mjs
/**
* 🕸️ צורת `graph` של מכונת-השילוב (MACHINE-V2, 14.10.2026) — כמה חלקים מוכחים, מחוברים לפי מתכון.
*
* `chain` מעביר פלט של חלק אחד לקלט הראשון של הבא. יש פעולות שצריכות **אותו קלט בכמה מקומות** (קו-הרוחב נכנס גם לזמני-היום
* וגם לסיבוב) — לכן המתכון (catalog/combiner/verb-recipes.json) מתאר צמתים: לכל צומת חלק מוכח אחד בשמו המלא, ולכל קלט שלו
* חוט: `$קלט` / `$קלט.שדה` (מהבקשה) · `@צומת` / `@צומת.שדה` (מפלט של צומת קודם) · מספר (קבוע מוצהר) · אובייקט (רשומה שמורכבת מחוטים).
* החוטים לא מחשבים כלום — רק מעבירים ובוחרים שדה. כל החישוב נעשה בחלקים; הקבועים מוצהרים במתכון עם הסבר (`consts`).
* טהור: הקריאה לחלק מוזרקת (`callNode`), בלי שעון ובלי I/O. רץ ב-node ובדפדפן.
*/
/** חוט ⇒ ערך. זורק אם החוט מצביע על משהו שאין (צומת לפני שרץ, שדה חסר). */
function wire(w, inputs, vals) {
	if (typeof w === "number" || typeof w === "boolean" || w === null) return w;
	if (typeof w === "string") {
		const m = /^([$@])([\w-]+)((?:\.[\w-]+)*)$/.exec(w);
		if (!m) throw new Error("חוט לא מובן: " + w);
		const base = m[1] === "$" ? inputs[m[2]] : vals[m[2]];
		if (base === void 0) throw new Error("אין " + w);
		let v = base;
		for (const k of m[3].split(".").filter(Boolean)) {
			if (v === null || typeof v !== "object" || !(k in v)) throw new Error("אין שדה " + k + " ב-" + w);
			v = v[k];
		}
		return v;
	}
	if (Array.isArray(w)) return w.map((x) => wire(x, inputs, vals));
	if (typeof w === "object") return Object.fromEntries(Object.entries(w).map(([k, x]) => [k, wire(x, inputs, vals)]));
	throw new Error("חוט לא מובן");
}
/**
* מריץ את הגרף. callNode(k, args) ⇒ {v} | {err} | {async} (כמו callerFor של ארגז-החול).
* מחזיר {v} — הפלט של צומת `out` — או את השגיאה הראשונה, עם שם הצומת.
*/
function runGraph(g, args, callNode) {
	const inputs = Object.fromEntries(g.inputs.map((n, k) => [n, args[k]]));
	const vals = {};
	for (let k = 0; k < g.nodes.length; k++) {
		const n = g.nodes[k];
		let a;
		try {
			a = wire(n.args, inputs, vals);
		} catch (e) {
			return { err: n.id + ": " + String(e?.message || e) };
		}
		const r = callNode(k, a);
		if (!r || r.async) return { async: true };
		if ("err" in r) return { err: n.id + ": " + r.err };
		if (r.v === null || r.v === void 0 || typeof r.v === "number" && !Number.isFinite(r.v)) return { err: n.id + ": אין ערך" };
		vals[n.id] = r.v;
	}
	return { v: vals[g.out] };
}
//#endregion
//#region catalog/runtime/runtime.mjs
/**
* ▶️ זמן-הריצה של המכונה (PRODUCT, 14.10.2026) — הרכבה ⇒ פונקציות שאפשר לקרוא להן.
*
* המכונה עוצרת בתוכנית מוכחת: לכל צורך — חלק אחד, חלק פנימי, או שילוב (שרשרת · זוג · אותו-חלק-על-החומר · גרף).
* כאן התוכנית נהיית קוד: `makeRuntime(assembly, parts)` מחזיר לכל צורך פונקציה שמריצה **את החלק המוכח עצמו**
* (או את השילוב, באותו חיבור שהמאמת בדק — combine.mjs: composeChain / compose('pair') / composeOn / composeGraph).
* בלי שורת-חישוב אחת משלו: רק מעביר פלט לקלט, כמו המכונה.
*
* טהור: בלי DOM, בלי node, בלי שעון — רץ בדפדפן וב-node. `parts` = מפתח-חלק ⇒ הפונקציה (מהחבילה parts.bundle.mjs
* בדפדפן, או מהמודולים עצמם ב-node). `assembly` = מה ש-catalog/runtime/manifest.mjs כותב מההרכבה של המכונה.
*/
/** קריאה לחלק: {v} או {err} — כמו callerFor של ארגז-החול (שגיאה לא זורקת החוצה באמצע שרשרת). */
function call(fn, args) {
	try {
		return { v: fn(...args) };
	} catch (err) {
		return { err: String(err && err.message || err) };
	}
}
/** הפונקציה של צעד: חלק מהחבילה לפי המפתח שלו. חסר ⇒ שגיאה ברורה מיד (לא באמצע ריצה). */
function partFn(parts, step) {
	const fn = parts[step.key];
	if (typeof fn !== "function") throw new Error("חלק חסר בחבילה: " + step.key + " (" + step.id + ")");
	return fn;
}
/**
* צורך אחד ⇒ פונקציה. אותו חיבור כמו מכונת-השילוב:
*   single / on — החלק עצמו (ב-on החומר נכנס לקלט הפתוח — אין המרה, רק הקלט עצמו)
*   chain       — C(a…, b…, c…) = P3(P2(P1(a…), b…), c…)        (הקלטים הנוספים של כל שלב לפי הסדר)
*   pair        — C(x, y, k…, r…) = P2(P1(x, k…), P1(y, k…), r…)   (`at` = המקום של "הדבר" בקלטים של P1)
*   graph       — כל צומת = חלק; החוטים רק מעבירים/בוחרים שדה (graph.mjs)
*/
function needFunction(need, parts) {
	const fns = need.steps.map((s) => partFn(parts, s));
	const form = need.form;
	if (form === "single" || form === "on") {
		const f = fns[0];
		return (...args) => f(...args);
	}
	if (form === "chain") {
		const ar = need.steps.map((s) => s.arity);
		return (...args) => {
			let at = ar[0];
			let r = call(fns[0], args.slice(0, at));
			for (let k = 1; k < fns.length && !("err" in r); k++) {
				const extra = ar[k] - 1;
				r = call(fns[k], [r.v, ...args.slice(at, at + extra)]);
				at += extra;
			}
			if ("err" in r) throw new Error(r.err);
			return r.v;
		};
	}
	if (form === "pair") {
		const n1 = need.steps[0].arity;
		const at = need.combo.at ?? 0;
		const with1 = (x, k) => {
			const a = k.slice();
			a.splice(at, 0, x);
			return a;
		};
		return (...args) => {
			const k = args.slice(2, 1 + n1);
			const a = call(fns[0], with1(args[0], k));
			if ("err" in a) throw new Error(a.err);
			const b = call(fns[0], with1(args[1], k));
			if ("err" in b) throw new Error(b.err);
			const c = call(fns[1], [
				a.v,
				b.v,
				...args.slice(1 + n1)
			]);
			if ("err" in c) throw new Error(c.err);
			return c.v;
		};
	}
	if (form === "graph") {
		const g = need.combo.graph;
		const byPart = new Map(need.steps.map((s, k) => [s.id, fns[k]]));
		const nodeFns = g.nodes.map((n) => byPart.get(n.part));
		return (...args) => {
			const r = runGraph(g, args, (k, a) => call(nodeFns[k], a));
			if ("err" in r) throw new Error(r.err);
			return r.v;
		};
	}
	throw new Error("צורה לא מוכרת: " + form);
}
/** כל הצרכים ⇒ {מזהה-צורך: פונקציה}. צורך בלי חלק (🔎/⛏️) ⇒ לא מופיע — אין פונקציה מומצאת. */
function makeRuntime(assembly, parts) {
	const out = {};
	for (const need of assembly.needs) if (need.steps?.length) out[need.id] = needFunction(need, parts);
	return out;
}
//#endregion
//#region catalog/core/random.mjs
/**
* 🎲 מגריל (random) — רצף מספרים בין 0 ל-1 שנראה אקראי, אבל אותו זרע ⇒ אותו רצף בדיוק.
* הליבה בלי עולם של: mulberry32 של המאמת (atoms/verify/gen.ts), הגרלות-הדמו, פיזור-הכוכבים בגלקסיה. מקורות: origins.json.
* טהור: ה"מזל" נכנס כזרע — אין Math.random.
* @param {{seed: number}} spec
* @param {number} count
* @returns {number[]}
*/
function random(spec, count) {
	let a = fin$3(spec?.seed) >>> 0 || 2654435769;
	const n = Math.min(5e3, Math.floor(Math.abs(fin$3(count))));
	const out = [];
	for (let k = 0; k < n; k++) {
		a = a + 1831565813 >>> 0;
		let t = a;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		out.push(((t ^ t >>> 14) >>> 0) / 4294967296);
	}
	return out;
}
function fin$3(x) {
	const v = Number(x);
	return Number.isFinite(v) ? Math.trunc(v) : 0;
}
//#endregion
//#region catalog/core/random-points.mjs
/**
* 🎲 מגריל — נקודות: `count` נקודות במקומות "אקראיים" בריבוע 0..1 — אותו זרע ⇒ אותן נקודות בדיוק.
* הליבה בלי עולם של אבק-הזהב בפרנס׳לע (src/components/parnasa/Ambient.tsx:63):
*   `{ x: Math.random() * w, y: Math.random() * h, … }` — שתי הגרלות לכל חלקיק, אחת ל-x ואחת ל-y.
* כאן: אותן שתי הגרלות, מליבת «מגריל» עם זרע (catalog/core/random.mjs) — בלי Math.random; w = h = 1 (מי שמצייר מכפיל בגודל).
* הגרלה 2k ⇒ x של הנקודה k, הגרלה 2k+1 ⇒ y שלה — לבקש עוד נקודות לא משנה את הראשונות.
* @param {{seed: number}} spec
* @param {number} count
* @returns {{x: number, y: number}[]}
*/
function randomPoints(spec, count) {
	const n = Math.min(2500, Math.floor(Math.abs(Number(count) || 0)));
	const r = random(spec, 2 * n);
	const out = [];
	for (let k = 0; k < n; k++) out.push({
		x: r[2 * k],
		y: r[2 * k + 1]
	});
	return out;
}
//#endregion
//#region catalog/core/by-distance.mjs
/**
* 📏 ממיין — נקודות לפי מרחק: הקרובה למוצא קודם. אותו מרחק ⇒ לפי x ואז לפי y (כך הסדר לא תלוי באיך שהגיעו).
* הליבה בלי עולם של בחירת-השכנים ברשת-הסינפסות (src/lib/three-scene.ts:122–124):
*   `cand.push([a.distanceToSquared(nodes[j]), j]); cand.sort((p, q) => p[0] - q[0]);`
* @param {{x: number, y: number}[]} points
* @param {{x: number, y: number}} from
* @returns {{x: number, y: number}[]}
*/
function byDistance(points, from) {
	const fx = Number(from?.x) || 0;
	const fy = Number(from?.y) || 0;
	const d2 = (p) => (Number(p.x) - fx) ** 2 + (Number(p.y) - fy) ** 2;
	return (Array.isArray(points) ? points : []).filter(Boolean).slice().sort((p, q) => d2(p) - d2(q) || Number(p.x) - Number(q.x) || Number(p.y) - Number(q.y));
}
//#endregion
//#region catalog/core/nearest-point.mjs
/**
* 🎯 בוחר את הקיצוני — הנקודה הקרובה ביותר: מכל הנקודות, זו שהמרחק שלה מהמוצא הכי קטן (אין נקודות ⇒ null).
* הליבה בלי עולם של "בדיקת-הריחוף" של הגלקסיה (src/components/supporters/SupportersGalaxy.tsx:124–125):
*   `let best = null, bd = 16; for (const p of pos) { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd + p.r) { bd = d; best = p; } }`
*   — כל כוכב קרוב יותר מהטוב-עד-עכשיו מחליף אותו (bd יורד), ובסוף `best` = הכוכב הקרוב לעכבר.
* מה שהוסר: סף-הריחוף (16 פיקסלים + רדיוס הכוכב) — כאן אין מסך; הקרובה ביותר תמיד נבחרת.
* בונה על ליבת «ממיין» (by-distance.mjs — אותו מרחק, ושוויון נשבר לפי x ואז y): הקרובה = הראשונה בסדר-המרחק.
* כך הבחירה לא תלויה בסדר שבו הנקודות הגיעו (בגלקסיה — הראשון שנמצא במרחק שווה נשאר).
* @param {{x: number, y: number}[]} points
* @param {{x: number, y: number}} from
* @returns {{x: number, y: number} | null}
*/
function nearestPoint(points, from) {
	return byDistance(points, from)[0] ?? null;
}
//#endregion
//#region catalog/core/group-by-side.mjs
/**
* 🗂️ מקבץ — נקודות לפי צד: כל נקודה הולכת לאזור שלה לפי הצד של המרכז שבו היא נמצאת (מימין/משמאל · למעלה/למטה).
* הליבה בלי עולם של "שתי האונות" של כדור-המוח בדף ההרשמה (src/lib/three-scene.ts:121):
*   `Math.sign(nodes[j].x) !== Math.sign(a.x)` — כל צומת שייך לאונה לפי סימן ה-x שלו (הסדק המרכזי באמצע).
* כאן: אותו מבחן-סימן, יחסית למרכז נתון, על x ועל y — ארבעה אזורים (ועל הקו עצמו — אזור "0").
* הסדר בתוך כל אזור = סדר ההגעה; איזה אזור — רק לפי הנקודה עצמה.
* @param {{x: number, y: number}[]} points
* @param {{x: number, y: number}} center
* @returns {Record<string, {x: number, y: number}[]>}
*/
function groupBySide(points, center) {
	const cx = Number(center?.x) || 0;
	const cy = Number(center?.y) || 0;
	const s = (v) => {
		const k = Math.sign(v);
		return k > 0 ? "+" : k < 0 ? "-" : "0";
	};
	const out = {};
	for (const p of Array.isArray(points) ? points : []) {
		if (!p) continue;
		const key = s(Number(p.x) - cx) + s(Number(p.y) - cy);
		(out[key] ??= []).push(p);
	}
	return out;
}
//#endregion
//#region catalog/core/near-net.mjs
/**
* 🕸️ מחבר לשכנים (connect) — נקודות ⇒ רשת: כל נקודה מתחברת ל-`near` הנקודות הקרובות אליה, כל קשת פעם אחת,
* והמחיר של קשת = המרחק בין שתי הנקודות.
* הליבה בלי עולם של "רשת הסינפסות" של כדור-המוח בדף ההרשמה (src/lib/three-scene.ts:114–131):
*   לכל צומת — רשימת המועמדים לפי `distanceToSquared`, ממוינת, ושלושת הקרובים נקשרים; מפתח `min_max` מונע קשת כפולה.
* מה שהוסר: אובייקטי THREE (‏LineSegments) והאילוץ "באותה אונה" (סימן ה-x — במוח יש שתי אונות; כאן אין עולם).
* הנקודות וכל שאר השדות של ההגדרה נשמרים כמו שהם — מתווספות רק הקשתות (כמו במוח: אותם צמתים + הקווים).
* טהור ודטרמיניסטי: שוויון-מרחק נשבר לפי האינדקס.
* שדות נוספים (למשל `sources` — מאיפה גל מתחיל) עוברים כמו שהם, כדי שמי שמקבל את הרשת יקבל גם אותם.
* @param {{points: {x: number, y: number}[], near: 1|2|3, sources?: (0|1|2|3|4|5)[]}} spec
* @returns {{points: {x: number, y: number}[], near: number, edges: {a: number, b: number, w: number}[]}}
*/
function nearNet(spec) {
	const pts = Array.isArray(spec?.points) ? spec.points : [];
	const k = Math.max(1, Math.min(8, Math.floor(Math.abs(Number(spec?.near)) || 1)));
	const ok = (p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y));
	const edges = [];
	const seen = /* @__PURE__ */ new Set();
	for (let i = 0; i < pts.length; i++) {
		if (!ok(pts[i])) continue;
		const cand = [];
		for (let j = 0; j < pts.length; j++) {
			if (i === j || !ok(pts[j])) continue;
			cand.push([(pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2, j]);
		}
		cand.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
		for (let n = 0; n < Math.min(k, cand.length); n++) {
			const j = cand[n][1];
			const key = Math.min(i, j) + "_" + Math.max(i, j);
			if (seen.has(key)) continue;
			seen.add(key);
			edges.push({
				a: Math.min(i, j),
				b: Math.max(i, j),
				w: Math.sqrt(cand[n][0])
			});
		}
	}
	return {
		...spec,
		edges
	};
}
//#endregion
//#region catalog/core/shortest-path.mjs
/**
* 🧭 דרך קצרה (shortest-path) — ברשת של נקודות וקשתות עם מחיר, הדרך הזולה ביותר מנקודה לנקודה (דייקסטרה).
* הליבה בלי עולם של: findShortestPath של בנייה-חכמה (שרשרת-מחברים בין שני מוצרי-אינסטלציה, תור-עדיפויות),
* hopsBetween (BFS = דייקסטרה כשכל קשת עולה 1). מקורות: origins.json.
* טהור; קשתות לא-מכוונות; מחיר שלילי ⇒ ערכו המוחלט.
* @param {{edges: {a: 0|1|2|3|4|5, b: 0|1|2|3|4|5, w: number}[]}} spec
* @param {0|1|2|3|4|5} from
* @param {0|1|2|3|4|5} to
* @returns {{cost: number, path: number[]} | null} null — אין דרך
*/
function shortestPath(spec, from, to) {
	const adj = /* @__PURE__ */ new Map();
	const add = (u, v, w) => {
		if (!adj.has(u)) adj.set(u, []);
		adj.get(u).push([v, w]);
	};
	for (const e of Array.isArray(spec?.edges) ? spec.edges : []) {
		const a = e?.a;
		const b = e?.b;
		const w = Math.abs(Number(e?.w));
		if (a == null || b == null || !Number.isFinite(w)) continue;
		add(a, b, w);
		add(b, a, w);
	}
	const dist = /* @__PURE__ */ new Map([[from, 0]]);
	const prev = /* @__PURE__ */ new Map();
	const done = /* @__PURE__ */ new Set();
	for (;;) {
		let u;
		let best = Infinity;
		for (const [n, d] of dist) if (!done.has(n) && (d < best || d === best && String(n) < String(u))) {
			best = d;
			u = n;
		}
		if (u === void 0) return null;
		if (u === to) break;
		done.add(u);
		for (const [v, w] of adj.get(u) ?? []) {
			const nd = best + w;
			if (!dist.has(v) || nd < dist.get(v)) {
				dist.set(v, nd);
				prev.set(v, u);
			}
		}
	}
	const path = [to];
	while (path[0] !== from) path.unshift(prev.get(path[0]));
	return {
		cost: dist.get(to),
		path
	};
}
//#endregion
//#region catalog/core/move-along-path.mjs
/**
* 🛤️ מתקדם במסלול (move-along-path) — נקודה שזזה על דרך של תחנות: 0 = בתחנה הראשונה, 1 = באחרונה,
* ובאמצע — בדיוק על הדרך, לפי המרחק שעבר (לא לפי מספר התחנות).
* הליבה בלי עולם של: התקדמות-משלוח איסוף→בדרך→נמסר, מסלול-מתנדב, מטבע שמחליק לקופה. מקורות: origins.json.
* טהור: ההתקדמות מוזרקת (0..1).
* @param {{points: {x: number, y: number}[]}} spec
* @param {number} progress
* @returns {{x: number, y: number} | null}
*/
function moveAlongPath(spec, progress) {
	const pts = (Array.isArray(spec?.points) ? spec.points : []).map((p) => ({
		x: fin$2(p?.x),
		y: fin$2(p?.y)
	}));
	if (!pts.length) return null;
	if (pts.length === 1) return { ...pts[0] };
	const seg = [];
	let total = 0;
	for (let k = 1; k < pts.length; k++) {
		const d = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
		seg.push(d);
		total += d;
	}
	const p = Math.min(1, Math.max(0, fin$2(progress)));
	if (p <= 0 || total === 0) return { ...pts[0] };
	if (p >= 1) return { ...pts[pts.length - 1] };
	let left = p * total;
	for (let k = 0; k < seg.length; k++) {
		if (left <= seg[k] || k === seg.length - 1) {
			const t = seg[k] ? Math.min(1, left / seg[k]) : 0;
			return {
				x: pts[k].x + (pts[k + 1].x - pts[k].x) * t,
				y: pts[k].y + (pts[k + 1].y - pts[k].y) * t
			};
		}
		left -= seg[k];
	}
	return { ...pts[pts.length - 1] };
}
function fin$2(x) {
	const v = Number(x);
	return Number.isFinite(v) ? v : 0;
}
//#endregion
//#region catalog/core/countdown.mjs
/**
* ⏳ סופר לאחור (countdown) — כמה נשאר עד הרגע: יורד בדיוק במה שעבר, נעצר באפס ולא יורד מתחתיו.
* הליבה בלי עולם של: "עוד 3:12" בשעון-הכסף, "נותרו X ימים" בקופון, ספירה לזמן התפילה, שליחה-חוזרת של קוד. מקורות: origins.json.
* טהור: "כמה עבר" מוזרק (לא שעון).
* @param {{total: number}} spec
* @param {number} elapsed
* @returns {number}
*/
function countdown(spec, elapsed) {
	const total = fin$1(spec?.total);
	const e = Math.max(0, fin$1(elapsed));
	return Math.max(0, total - e);
}
function fin$1(x) {
	const v = Number(x);
	return Number.isFinite(v) ? v : 0;
}
[
	{
		key: "wa.delivery",
		label: "🚚 הודעת-מסירה (חלוקה)",
		vars: ["name", "org"],
		def: "שלום {name}, משלוח מ{org} בדרך אליכם היום 🚚"
	},
	{
		key: "wa.payment",
		label: "💳 תזכורת-תשלום (חוגים)",
		vars: [
			"org",
			"what",
			"amount"
		],
		def: "שלום, תזכורת ידידותית מ{org}: יתרה לתשלום עבור {what} — ₪{amount}. תודה רבה!"
	},
	{
		key: "wa.birthday",
		label: "🎂 ברכת יום-הולדת",
		vars: ["first", "org"],
		def: "מזל טוב ל{first} ליום ההולדת! 🎂 באהבה, {org}"
	},
	{
		key: "wa.dialer",
		label: "📞 הודעת-חייגן (לא ענה)",
		vars: ["name", "org"],
		def: "שלום {name}, ניסינו להשיג אתכם מ{org} ולא הצלחנו — נשמח שתחזרו אלינו 🙏"
	},
	{
		key: "wa.paylink",
		label: "💳 שליחת קישור-תשלום",
		vars: [
			"name",
			"org",
			"link"
		],
		def: "שלום {name}, תודה על השיחה! לתרומה מקוונת ל{org}: {link} 🙏"
	}
].map((d) => d.key);
//#endregion
//#region src/lib/validate.ts
/** נרמול טקסט לחיפוש עברי: מסיר ניקוד, אותיות סופיות → רגילות, גרשיים. */
function normSearch(t) {
	return String(t || "").toLowerCase().replace(/[֑-ׇ]/g, "").replace(/[ךםןףץ]/g, (ch) => ({
		ך: "כ",
		ם: "מ",
		ן: "נ",
		ף: "פ",
		ץ: "צ"
	})[ch]).replace(/['"׳״\-–._]/g, "").trim();
}
Object.entries({
	"כהן": [
		"cohen",
		"kohen",
		"коэн"
	],
	"לוי": ["levi", "леви"],
	"מזרחי": ["mizrahi", "мизрахи"],
	"פרידמן": [
		"fridman",
		"friedman",
		"фридман"
	],
	"אברמוב": ["abramov", "абрамов"],
	"שרעבי": ["sharabi", "шараби"],
	"גולדשטיין": ["goldstein", "гольдштейн"],
	"בן דוד": [
		"bendavid",
		"ben david",
		"бен давид"
	],
	"אוחיון": ["ohayon", "охайон"],
	"משה": [
		"moshe",
		"моше",
		"מוישי",
		"מוישה"
	],
	"שרה": [
		"sara",
		"sarah",
		"сара",
		"שרהלה"
	],
	"דוד": [
		"david",
		"давид",
		"דודי"
	],
	"תמר": ["tamar", "тамар"],
	"יוסף": [
		"yosef",
		"иосиф",
		"יוסי"
	],
	"רחל": [
		"rachel",
		"рахель",
		"רחלי"
	],
	"בנימין": [
		"binyamin",
		"беньямин",
		"בני"
	],
	"נועה": ["noa", "ноа"],
	"איתן": ["eitan", "эйтан"],
	"הודיה": ["hodaya"],
	"מיכאל": [
		"michael",
		"михаил",
		"מיכי"
	],
	"ליאה": ["lea", "лея"],
	"יונתן": [
		"yonatan",
		"йонатан",
		"יוני"
	],
	"אבישי": ["avishai"],
	"טליה": ["talia", "талия"],
	"עומר": ["omer"],
	"אגם": ["agam"],
	"ליאם": ["liam"],
	"רומי": ["romi"],
	"אליה": ["eliya", "элия"],
	"צבי": ["zvi", "цви"],
	"אסתר": [
		"esther",
		"эстер",
		"אסתי"
	],
	"כינור": ["violin", "скрипка"],
	"גיטרה": ["guitar", "гитара"],
	"פסנתר": [
		"piano",
		"пианино",
		"פסנטר"
	],
	"אורגנית": [
		"organ",
		"орган",
		"אורגן"
	],
	"מסאז׳": [
		"massage",
		"массаж",
		"מסאז",
		"עיסוי"
	],
	"גרפיקה": ["graphics", "графика"],
	"פיתוח קול": ["vocal", "שירה"],
	"אומנות": ["art", "אמנות"],
	"צילום": [
		"photo",
		"photography",
		"фото",
		"מצלמה"
	],
	"ספרות": [
		"writing",
		"литература",
		"כתיבה",
		"ספר"
	],
	"אפייה": [
		"baking",
		"выпечка",
		"בישול",
		"קונדיטוריה"
	],
	"אנגלית": [
		"english",
		"английский",
		"שפה"
	],
	"העצמה": ["empowerment", "ביטחון עצמי"],
	"התעמלות": [
		"fitness",
		"гимнастика",
		"ספורט",
		"כושר",
		"ג׳ים"
	],
	"רפלקסולוגיה": [
		"reflexology",
		"рефлексология",
		"עיסוי"
	],
	"ציור": [
		"art",
		"рисование",
		"אמנות",
		"יצירה"
	],
	"תפירה": [
		"sewing",
		"шитьё",
		"מחט"
	],
	"אפילציה": [
		"epilation",
		"эпиляция",
		"טיפוח"
	],
	"מוזיקה": [
		"music",
		"музыка",
		"נגינה",
		"כינור",
		"גיטרה",
		"אורגנית"
	],
	"ירושלים": ["jerusalem", "иерусалим"],
	"בני ברק": ["bnei brak", "бней брак"],
	"פתח תקווה": ["petah tikva", "петах тиква"],
	"ראש העין": ["rosh haayin"],
	"מודיעין עילית": ["modiin illit"],
	"ביתר עילית": ["beitar illit"]
}).map(([heb, aliases]) => ({
	heb,
	nheb: normSearch(heb),
	aliases,
	naliases: aliases.map((a) => normSearch(a))
}));
//#endregion
//#region src/components/shop7/lib.ts
/** סדר המכונה הלינארית — קדימה בלבד. */
const ORDER = [
	"pickup",
	"enroute",
	"delivered"
];
/** הסטטוס הבא — קדימה; delivered הוא סופי (מחזיר את עצמו). */
function advanceStatus(status) {
	const i = ORDER.indexOf(status);
	return i < 0 || i >= ORDER.length - 1 ? "delivered" : ORDER[i + 1];
}
const MIN = 6e4;
const fin = (v) => typeof v === "number" && Number.isFinite(v);
function cleanSteps(steps) {
	if (!Array.isArray(steps)) return [];
	return steps.map((s) => ({
		to: Array.isArray(s?.to) ? s.to.filter((x) => typeof x === "string") : [],
		waitMin: fin(s?.waitMin) && s.waitMin > 0 ? s.waitMin : 0
	}));
}
/** ההמתנה האפקטיבית של שלב: שלב בלי מקבלים — אפס (עוברים מיד); בדחוף — לכל היותר urgentWaitMin. */
function waitOf(step, input) {
	if (!step.to.length) return 0;
	if (input.urgent === true) {
		const u = fin(input.urgentWaitMin) && input.urgentWaitMin >= 0 ? input.urgentWaitMin : 60;
		return Math.min(step.waitMin, u);
	}
	return step.waitMin;
}
/** איפה זה עומד עכשיו: השלב, למי זה אצלו, ומתי עובר הלאה. */
function escalationState(input) {
	const steps = cleanSteps(input?.steps);
	if (!steps.length) return {
		stepIndex: -1,
		currentTo: [],
		nextMoveMs: null,
		done: true
	};
	const now = fin(input?.nowMs) ? input.nowMs : 0;
	const answered = fin(input?.answeredMs) && input.answeredMs <= now ? input.answeredMs : null;
	const stopAt = answered ?? now;
	const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
	let i = 0;
	let at = created;
	for (; i < steps.length - 1; i++) {
		const next = at + waitOf(steps[i], input) * MIN;
		if (stopAt < next && steps[i].to.length) break;
		at = next;
	}
	const last = i === steps.length - 1;
	if (answered !== null || last) return {
		stepIndex: i,
		currentTo: steps[i].to,
		nextMoveMs: null,
		done: true
	};
	return {
		stepIndex: i,
		currentTo: steps[i].to,
		nextMoveMs: at + waitOf(steps[i], input) * MIN,
		done: false
	};
}
//#endregion
//#region catalog/inner/gen/orbit/src/components/families/ReenrollFamilyPanel.tsx.mjs
function inner$ReenrollFamilyPanel$regEnroll(enrollments, regEnrollId) {
	return regEnrollId ? enrollments.find((e) => e.id === regEnrollId) ?? null : null;
}
//#endregion
//#region src/components/supporters/prayer.ts
/** מונה פעילים (לא-הוזכרו) — לצ׳יפ בכותרת. */
function prayerOpenCount(list) {
	return (list ?? []).filter((p) => !p.done).length;
}
/** טקסט להעתקה/שיתוף — שורה לשם: "שם — הערה" (הערה ריקה ⇒ רק שם); הוזכרו בסוף עם ✓. */
function prayerListText(list, title = "") {
	const open = list.filter((p) => !p.done);
	const done = list.filter((p) => p.done);
	const line = (p) => (p.done ? "✓ " : "") + p.name + (p.note.trim() ? " — " + p.note.trim() : "");
	return [
		title,
		...open.map(line),
		...done.map(line)
	].filter(Boolean).join("\n");
}
//#endregion
//#region src/components/hosting/transitions.ts
const DAY_MS = 864e5;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
function isIso(v) {
	return typeof v === "string" && ISO_RE.test(v);
}
function utcOf(iso) {
	return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
}
/** ISO + n ימים — לא-תקין ⇒ ''. */
function addDaysIso(iso, n) {
	if (!isIso(iso)) return "";
	return new Date(utcOf(iso) + n * DAY_MS).toISOString().slice(0, 10);
}
//#endregion
//#region catalog/core/require-source.mjs
/**
* 🔗 require-source · דורש מקור — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
*
* פריט בלי מקור נדחה; פריט עם מקור עובר כמו שהוא; ולעולם לא ממציאים מקור.
* "מקור" = שדה src/source/sources: טקסט לא-ריק, או {t|title|url} לא-ריק, או רשימה לא-ריקה של כאלה —
* וכל קישור בו חייב להיות https (כמו safeHttpsUrl באורביט וכמו שער יומן-הבינה: `src` = {t, url:^https://}).
*/
const HTTPS = /^https:\/\/[^\s]+$/;
function oneSource(s) {
	if (typeof s === "string") return s.trim().length > 0 && (!/^[a-z][a-z0-9+.-]*:/i.test(s.trim()) || HTTPS.test(s.trim()));
	if (!s || typeof s !== "object" || Array.isArray(s)) return false;
	const url = s.url ?? s.href;
	if (url !== void 0 && !(typeof url === "string" && HTTPS.test(url.trim()))) return false;
	const t = s.t ?? s.title ?? s.text;
	return typeof t === "string" && t.trim().length > 0 || typeof url === "string" && HTTPS.test(url.trim());
}
/** האם לפריט יש מקור תקין. @param {any} item @returns {boolean} */
function hasSource(item) {
	if (!item || typeof item !== "object" || Array.isArray(item)) return false;
	const k = [
		"src",
		"source",
		"sources"
	].find((x) => Object.hasOwn(item, x) && item[x] != null);
	if (!k) return false;
	const v = item[k];
	return Array.isArray(v) ? v.length > 0 && v.every(oneSource) : oneSource(v);
}
/**
* @param {{text: string, src?: {t: string, url: string}[]}[]} items
* @returns {{accepted: any[], rejected: number[]}} המקובלים (כמו שהם, לפי הסדר) · אינדקסים של הנדחים
*/
function requireSource(items) {
	const accepted = [];
	const rejected = [];
	(Array.isArray(items) ? items : []).forEach((it, k) => hasSource(it) ? accepted.push(it) : rejected.push(k));
	return {
		accepted,
		rejected
	};
}
//#endregion
//#region src/components/courses/lib.ts
/** סיכום-נוכחות ליום: כמה מהרשימה מסומנים-נוכחים (presents כולל את התאריך). */
function sheetSummary(roster, dateIso) {
	return {
		present: roster.filter((e) => (e.presents ?? []).includes(dateIso)).length,
		total: roster.length
	};
}
//#endregion
//#region __product_entry__.mjs
const PARTS = {
	"core-c:catalog/core/random-points.mjs#randomPoints": randomPoints,
	"core-c:catalog/core/nearest-point.mjs#nearestPoint": nearestPoint,
	"core-c:catalog/core/group-by-side.mjs#groupBySide": groupBySide,
	"core-c:catalog/core/by-distance.mjs#byDistance": byDistance,
	"core-c:catalog/core/near-net.mjs#nearNet": nearNet,
	"core:catalog/core/shortest-path.mjs#shortestPath": shortestPath,
	"core:catalog/core/move-along-path.mjs#moveAlongPath": moveAlongPath,
	"core:catalog/core/countdown.mjs#countdown": countdown,
	"orbit:src/components/shop7/lib.ts#advanceStatus": advanceStatus,
	"orbit:src/lib/atoms/parts/escalate.ts#escalationState": escalationState,
	"inner-orbit:src/components/families/ReenrollFamilyPanel.tsx#ReenrollFamilyPanel.regEnroll": inner$ReenrollFamilyPanel$regEnroll,
	"orbit:src/components/supporters/prayer.ts#prayerOpenCount": prayerOpenCount,
	"orbit:src/components/hosting/transitions.ts#addDaysIso": addDaysIso,
	"core-b:catalog/core/require-source.mjs#requireSource": requireSource,
	"orbit:src/components/supporters/prayer.ts#prayerListText": prayerListText,
	"orbit:src/components/courses/lib.ts#sheetSummary": sheetSummary
};
const ASSEMBLY = {
	"word": "מוקד-חלוקה",
	"emoji": "🧺",
	"does": "מוקד חלוקת סלים לחג: משפחות על המפה, כל אחת למתנדב הקרוב, מסלול קצר, מעקב מסירה עד דוח סוף היום",
	"world": "מוצרים",
	"counts": {
		"needs": 16,
		"proven": 14,
		"inner": 1,
		"combo": 1,
		"open": 0
	},
	"needs": [
		{
			"id": "n1",
			"behavior": "משפחות כנקודות במקומות על מפת העיירה",
			"verb": "random",
			"verbHe": "מגריל",
			"material": "geo",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "core-c:catalog/core/random-points.mjs#randomPoints",
				"key": "core-c:catalog/core/random-points.mjs#randomPoints",
				"name": "מחשב נקודות במקומות אקראיים מזרע",
				"role": "random",
				"roleHe": "מגריל",
				"project": "ליבות-החומר",
				"inner": false,
				"proof": "proven",
				"cases": 41,
				"laws": [
					"random.replay",
					"random.range",
					"random.seeded",
					"random.even"
				],
				"arity": 2,
				"module": "catalog/core/random-points.mjs",
				"export": "randomPoints",
				"home": "core-c:catalog/core/random-points.mjs#randomPoints",
				"origins": [
					{
						"project": "אורביט",
						"file": "src/components/parnasa/Ambient.tsx",
						"line": 63,
						"best": true
					},
					{
						"project": "אורביט",
						"file": "src/components/parnasa/Ambient.tsx",
						"line": 100
					},
					{
						"project": "המחולל",
						"file": "machtzev/pure/motion-family.html",
						"line": 150
					}
				]
			}]
		},
		{
			"id": "n2",
			"behavior": "כל משפחה למתנדב הקרוב אליה",
			"verb": "extreme",
			"verbHe": "בוחר את הקיצוני",
			"material": "geo",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "core-c:catalog/core/nearest-point.mjs#nearestPoint",
				"key": "core-c:catalog/core/nearest-point.mjs#nearestPoint",
				"name": "בוחר את הנקודה הקרובה ביותר למוצא",
				"role": "extreme",
				"roleHe": "בוחר את הקיצוני",
				"project": "ליבות-החומר",
				"inner": false,
				"proof": "proven",
				"cases": 21,
				"laws": ["extreme.split", "extreme.order-free"],
				"arity": 2,
				"module": "catalog/core/nearest-point.mjs",
				"export": "nearestPoint",
				"home": "core-c:catalog/core/nearest-point.mjs#nearestPoint",
				"origins": [
					{
						"project": "אורביט",
						"file": "src/components/supporters/SupportersGalaxy.tsx",
						"line": 125,
						"best": true
					},
					{
						"project": "אורביט",
						"file": "src/components/supporters/SupportersUniverse3D.tsx",
						"line": 111
					},
					{
						"project": "אורביט",
						"file": "src/components/parnasa/envelope.ts",
						"line": 187
					}
				]
			}]
		},
		{
			"id": "n3",
			"behavior": "אזורים בעיירה לפי הצד של המרכז",
			"verb": "group",
			"verbHe": "מקבץ",
			"material": "geo",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "core-c:catalog/core/group-by-side.mjs#groupBySide",
				"key": "core-c:catalog/core/group-by-side.mjs#groupBySide",
				"name": "מקבץ נקודות לפי הצד של המרכז",
				"role": "group",
				"roleHe": "מקבץ",
				"project": "ליבות-החומר",
				"inner": false,
				"proof": "proven",
				"cases": 21,
				"laws": ["group.partition", "group.order-free"],
				"arity": 2,
				"module": "catalog/core/group-by-side.mjs",
				"export": "groupBySide",
				"home": "core-c:catalog/core/group-by-side.mjs#groupBySide",
				"origins": [{
					"project": "אורביט",
					"file": "src/lib/three-scene.ts",
					"line": 121,
					"best": true
				}, {
					"project": "אורביט",
					"file": "src/lib/three-scene.ts",
					"line": 74
				}]
			}]
		},
		{
			"id": "n4",
			"behavior": "סדר התחנות של כל מתנדב לפי המרחק",
			"verb": "sort",
			"verbHe": "ממיין",
			"material": "geo",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "core-c:catalog/core/by-distance.mjs#byDistance",
				"key": "core-c:catalog/core/by-distance.mjs#byDistance",
				"name": "ממיין נקודות לפי המרחק מהמוצא",
				"role": "sort",
				"roleHe": "ממיין",
				"project": "ליבות-החומר",
				"inner": false,
				"proof": "proven",
				"cases": 32,
				"laws": [
					"sort.perm",
					"sort.order-free",
					"sort.consistent"
				],
				"arity": 2,
				"module": "catalog/core/by-distance.mjs",
				"export": "byDistance",
				"home": "core-c:catalog/core/by-distance.mjs#byDistance",
				"origins": [{
					"project": "אורביט",
					"file": "src/lib/three-scene.ts",
					"line": 122,
					"best": true
				}, {
					"project": "אורביט",
					"file": "src/components/parnasa/envelope.ts",
					"line": 187
				}]
			}]
		},
		{
			"id": "n5",
			"behavior": "הדרך הקצרה בין התחנות",
			"verb": "shortest-path",
			"verbHe": "מוצא דרך קצרה",
			"material": "geo",
			"status": "combo",
			"statusHe": "✅ מוכח — שילוב",
			"form": "chain",
			"steps": [{
				"id": "core-c:catalog/core/near-net.mjs#nearNet",
				"key": "core-c:catalog/core/near-net.mjs#nearNet",
				"name": "מחבר כל נקודה לשכנות הקרובות אליה",
				"role": "connect",
				"roleHe": "מחבר לשכנים",
				"project": "ליבות-החומר",
				"inner": false,
				"proof": "proven",
				"cases": 48,
				"laws": [
					"connect.keeps",
					"connect.real",
					"connect.nearest",
					"connect.only"
				],
				"arity": 1,
				"module": "catalog/core/near-net.mjs",
				"export": "nearNet",
				"home": "core-c:catalog/core/near-net.mjs#nearNet",
				"origins": [
					{
						"project": "אורביט",
						"file": "src/lib/three-scene.ts",
						"line": 114,
						"best": true
					},
					{
						"project": "אורביט",
						"file": "src/lib/three-scene.ts",
						"line": 127
					},
					{
						"project": "בנייה חכמה",
						"file": "app_flutter/lib/features/card_keyboard/hop_graph.dart",
						"line": 155
					},
					{
						"project": "בנייה חכמה",
						"file": "app_flutter/lib/logic/install_engine.dart",
						"line": 759
					}
				]
			}, {
				"id": "core:catalog/core/shortest-path.mjs#shortestPath",
				"key": "core:catalog/core/shortest-path.mjs#shortestPath",
				"name": "מוצא את הדרך הזולה ברשת נקודות",
				"role": "shortest-path",
				"roleHe": "מוצא דרך קצרה",
				"project": "הליבה",
				"inner": false,
				"proof": "proven",
				"cases": 24,
				"laws": ["shortest-path.valid", "shortest-path.shortest"],
				"arity": 3,
				"module": "catalog/core/shortest-path.mjs",
				"export": "shortestPath",
				"home": "core:catalog/core/shortest-path.mjs#shortestPath",
				"origins": [
					{
						"project": "בנייה חכמה",
						"file": "app_flutter/lib/logic/install_engine.dart",
						"line": 759,
						"best": true
					},
					{
						"project": "המחולל",
						"file": "new/dart/find_shortest_path.dart",
						"line": 51
					},
					{
						"project": "בנייה חכמה",
						"file": "app_flutter/lib/features/card_keyboard/hop_graph.dart",
						"line": 135
					},
					{
						"project": "אורביט",
						"file": "src/lib/engineroute/route.ts",
						"line": 298
					},
					{
						"project": "המחולל",
						"file": "lab-rings/lab13/wide2frames.mjs",
						"line": 29
					},
					{
						"project": "המחולל",
						"file": "lab-rings/viz/anneal.js",
						"line": 9
					},
					{
						"project": "סורק QA",
						"file": "scanner.py",
						"line": 94
					}
				]
			}],
			"combo": {
				"recipe": "catalog/recipes/combo-shortest-path-geo.json",
				"verb": "shortest-path",
				"form": "chain",
				"holds": "24/24",
				"laws": ["shortest-path.valid", "shortest-path.shortest"],
				"line": "עבר 24/24 חוקים של מוצא דרך קצרה",
				"hint": "הדרך המהירה בין מקומות = קודם רשת: כל מקום מתחבר לקרובים אליו (רשת-הסינפסות של כדור-המוח בדף ההרשמה, three-scene.ts:114), ואז הדרך הזולה ברשת (דייקסטרה — מוצא-הדרך של בנייה-חכמה, install_engine.dart:759)"
			}
		},
		{
			"id": "n6",
			"behavior": "הרכבים נוסעים במסלול על המפה",
			"verb": "move-along-path",
			"verbHe": "מתקדם במסלול",
			"material": "geo",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "core:catalog/core/move-along-path.mjs#moveAlongPath",
				"key": "core:catalog/core/move-along-path.mjs#moveAlongPath",
				"name": "מזיז נקודה לאורך מסלול של תחנות",
				"role": "move-along-path",
				"roleHe": "מתקדם במסלול",
				"project": "הליבה",
				"inner": false,
				"proof": "proven",
				"cases": 36,
				"laws": [
					"move-along-path.ends",
					"move-along-path.onpath",
					"move-along-path.even"
				],
				"arity": 2,
				"module": "catalog/core/move-along-path.mjs",
				"export": "moveAlongPath",
				"home": "core:catalog/core/move-along-path.mjs#moveAlongPath",
				"origins": [
					{
						"project": "אורביט",
						"file": "src/components/parnasa/coinFx.ts",
						"line": 211,
						"best": true
					},
					{
						"project": "אורביט",
						"file": "src/components/shop7/lib.ts",
						"line": 12
					},
					{
						"project": "אורביט",
						"file": "src/components/shop7/lib.ts",
						"line": 137
					},
					{
						"project": "בנייה חכמה",
						"file": "index.html",
						"line": 7843
					},
					{
						"project": "בנייה חכמה",
						"file": "app_flutter/lib/screens/install_studio_screen.dart",
						"line": 1853
					},
					{
						"project": "המחולל",
						"file": "design/orbit-nothinglost.html",
						"line": 173
					},
					{
						"project": "המחולל",
						"file": "lab-rings/viz/rings-live.html",
						"line": 323
					},
					{
						"project": "הישיבה",
						"file": "yeshiva/daf.py",
						"line": 281
					},
					{
						"project": "MMMM",
						"file": "artifacts/api-server/src/swarm/agents.ts",
						"line": 218
					}
				]
			}]
		},
		{
			"id": "n7",
			"behavior": "ספירה לאחור עד החג",
			"verb": "countdown",
			"verbHe": "סופר לאחור",
			"material": "times",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "core:catalog/core/countdown.mjs#countdown",
				"key": "core:catalog/core/countdown.mjs#countdown",
				"name": "סופר לאחור עד אפס בדיוק",
				"role": "countdown",
				"roleHe": "סופר לאחור",
				"project": "הליבה",
				"inner": false,
				"proof": "proven",
				"cases": 26,
				"laws": [
					"countdown.start",
					"countdown.down",
					"countdown.zero"
				],
				"arity": 2,
				"module": "catalog/core/countdown.mjs",
				"export": "countdown",
				"home": "core:catalog/core/countdown.mjs#countdown",
				"origins": [
					{
						"project": "אורביט",
						"file": "src/components/timer/MoneyTimer.tsx",
						"line": 117,
						"best": true
					},
					{
						"project": "אורביט",
						"file": "src/components/hosting/kitchen.ts",
						"line": 85
					},
					{
						"project": "אורביט",
						"file": "src/components/lock/LockScreen.tsx",
						"line": 40
					},
					{
						"project": "אורביט",
						"file": "src/lib/publicSite.ts",
						"line": 225
					},
					{
						"project": "אורביט",
						"file": "src/components/shop/lib.ts",
						"line": 221
					},
					{
						"project": "בנייה חכמה",
						"file": "app_flutter/lib/screens/login_sheet.dart",
						"line": 203
					},
					{
						"project": "בנייה חכמה",
						"file": "index.html",
						"line": 7847
					},
					{
						"project": "המחולל",
						"file": "machtzev/pure/temporal-family.html",
						"line": 291
					},
					{
						"project": "המחולל",
						"file": "new/dart-ui-bs/countdown_timer.dart",
						"line": 21
					},
					{
						"project": "הישיבה",
						"file": "arena/shop/pricing.py",
						"line": 171
					},
					{
						"project": "סורק QA",
						"file": "exposure_audit.py",
						"line": 201
					},
					{
						"project": "14kk",
						"file": "archive/final-bridge.js",
						"line": 650
					}
				]
			}]
		},
		{
			"id": "n8",
			"behavior": "הסטטוס הבא של המשלוח: איסוף ⇒ בדרך ⇒ נמסר",
			"verb": "route",
			"verbHe": "מנתב לפי ערוץ",
			"material": "choice",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "orbit:src/components/shop7/lib.ts#advanceStatus",
				"key": "orbit:src/components/shop7/lib.ts#advanceStatus",
				"name": "קובע את הסטטוס הבא",
				"role": "route",
				"roleHe": "מנתב לפי ערוץ",
				"project": "אורביט",
				"inner": false,
				"proof": "proven",
				"cases": 48,
				"laws": [
					"route.one",
					"route.few",
					"route.det",
					"route.default"
				],
				"arity": 1,
				"module": "src/components/shop7/lib.ts",
				"export": "advanceStatus",
				"home": "orbit:src/components/shop7/lib.ts#advanceStatus",
				"origins": [{
					"project": "אורביט",
					"file": "src/components/shop7/lib.ts",
					"line": 15,
					"best": true
				}]
			}]
		},
		{
			"id": "n9",
			"behavior": "משלוח שמאחר עובר הלאה כשאין תשובה",
			"verb": "escalate",
			"verbHe": "מסלים בזמן",
			"material": "waiting",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "orbit:src/lib/atoms/parts/escalate.ts#escalationState",
				"key": "orbit:src/lib/atoms/parts/escalate.ts#escalationState",
				"name": "מעביר הלאה כשאין תשובה",
				"role": "escalate",
				"roleHe": "מסלים בזמן",
				"project": "אורביט",
				"inner": false,
				"proof": "proven",
				"cases": 400,
				"laws": [
					"escalate.answered",
					"escalate.nobody-skipped",
					"escalate.plan",
					"escalate.state"
				],
				"arity": 1,
				"module": "src/lib/atoms/parts/escalate.ts",
				"export": "escalationState",
				"home": "orbit:src/lib/atoms/parts/escalate.ts#escalationState",
				"origins": [{
					"project": "אורביט",
					"file": "src/lib/atoms/parts/escalate.ts",
					"line": 84,
					"best": true
				}]
			}]
		},
		{
			"id": "n10",
			"behavior": "מתנדב שלא עונה ⇒ הבקשה עוברת הלאה למתנדב הבא",
			"verb": "escalate",
			"verbHe": "מסלים בזמן",
			"material": "waiting",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "orbit:src/lib/atoms/parts/escalate.ts#escalationState",
				"key": "orbit:src/lib/atoms/parts/escalate.ts#escalationState",
				"name": "מעביר הלאה כשאין תשובה",
				"role": "escalate",
				"roleHe": "מסלים בזמן",
				"project": "אורביט",
				"inner": false,
				"proof": "proven",
				"cases": 400,
				"laws": [
					"escalate.answered",
					"escalate.nobody-skipped",
					"escalate.plan",
					"escalate.state"
				],
				"arity": 1,
				"module": "src/lib/atoms/parts/escalate.ts",
				"export": "escalationState",
				"home": "orbit:src/lib/atoms/parts/escalate.ts#escalationState",
				"origins": [{
					"project": "אורביט",
					"file": "src/lib/atoms/parts/escalate.ts",
					"line": 84,
					"best": true
				}]
			}]
		},
		{
			"id": "n11",
			"behavior": "משפחה חדשה בהמתנה נבחרת לפי המזהה שלה",
			"verb": "lookup",
			"verbHe": "מחפש לפי מפתח",
			"material": "waiting",
			"status": "inner",
			"statusHe": "✅ מוכח — חלק פנימי",
			"form": "single",
			"steps": [{
				"id": "inner-orbit:src/components/families/ReenrollFamilyPanel.tsx#ReenrollFamilyPanel.regEnroll",
				"key": "inner-orbit:src/components/families/ReenrollFamilyPanel.tsx#ReenrollFamilyPanel.regEnroll",
				"name": "בוחר ערך לפי תנאי",
				"role": "lookup",
				"roleHe": "מחפש לפי מפתח",
				"project": "אורביט",
				"inner": true,
				"proof": "proven",
				"cases": 24,
				"laws": ["lookup.member", "lookup.first"],
				"arity": 2,
				"module": "catalog/inner/gen/orbit/src/components/families/ReenrollFamilyPanel.tsx.mjs",
				"export": "inner$ReenrollFamilyPanel$regEnroll",
				"home": "inner-orbit:src/components/families/ReenrollFamilyPanel.tsx#ReenrollFamilyPanel.regEnroll",
				"origins": [{
					"project": "אורביט",
					"file": "src/components/families/ReenrollFamilyPanel.tsx",
					"line": 54,
					"best": true
				}]
			}]
		},
		{
			"id": "n12",
			"behavior": "כמה סלים נותרו — סופר את השמות שעוד לא נמסרו",
			"verb": "count",
			"verbHe": "סופר",
			"material": "list",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "orbit:src/components/supporters/prayer.ts#prayerOpenCount",
				"key": "orbit:src/components/supporters/prayer.ts#prayerOpenCount",
				"name": "סופר שמות שעוד לא הוזכרו",
				"role": "count",
				"roleHe": "סופר",
				"project": "אורביט",
				"inner": false,
				"proof": "proven",
				"cases": 35,
				"laws": [
					"count.empty",
					"count.add",
					"count.bound"
				],
				"arity": 1,
				"module": "src/components/supporters/prayer.ts",
				"export": "prayerOpenCount",
				"home": "orbit:src/components/supporters/prayer.ts#prayerOpenCount",
				"origins": [{
					"project": "אורביט",
					"file": "src/components/supporters/prayer.ts",
					"line": 39,
					"best": true
				}]
			}]
		},
		{
			"id": "n13",
			"behavior": "תזכורת לכל מתנדב — תאריך יום לפני החלוקה",
			"verb": "offset",
			"verbHe": "מזיז",
			"material": "date",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "orbit:src/components/hosting/transitions.ts#addDaysIso",
				"key": "orbit:src/components/hosting/transitions.ts#addDaysIso",
				"name": "מחשב תאריך כמה ימים",
				"role": "offset",
				"roleHe": "מזיז",
				"project": "אורביט",
				"inner": false,
				"proof": "proven",
				"cases": 24,
				"laws": ["offset.zero", "offset.compose"],
				"arity": 2,
				"module": "src/components/hosting/transitions.ts",
				"export": "addDaysIso",
				"home": "orbit:src/components/hosting/transitions.ts#addDaysIso",
				"origins": [{
					"project": "אורביט",
					"file": "src/components/hosting/transitions.ts",
					"line": 90,
					"best": true
				}]
			}]
		},
		{
			"id": "n14",
			"behavior": "מסירה נחשבת רק עם אישור מהמקבל",
			"verb": "require-source",
			"verbHe": "דורש מקור",
			"material": "list",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "core-b:catalog/core/require-source.mjs#requireSource",
				"key": "core-b:catalog/core/require-source.mjs#requireSource",
				"name": "מקבל רק פריטים עם מקור",
				"role": "require-source",
				"roleHe": "דורש מקור",
				"project": "ליבות-הפעלים",
				"inner": false,
				"proof": "proven",
				"cases": 36,
				"laws": [
					"source.reject",
					"source.pass",
					"source.never-invent"
				],
				"arity": 1,
				"module": "catalog/core/require-source.mjs",
				"export": "requireSource",
				"home": "core-b:catalog/core/require-source.mjs#requireSource",
				"origins": [
					{
						"project": "יומן הבינה",
						"file": "schema.json",
						"line": 46
					},
					{
						"project": "יומן הבינה",
						"file": "verify.mjs",
						"line": 138
					},
					{
						"project": "יומן הבינה",
						"file": "engine.js",
						"line": 25
					},
					{
						"project": "אורביט",
						"file": "src/lib/config.ts",
						"line": 112
					},
					{
						"project": "הישיבה",
						"file": "yeshiva/gate.py",
						"line": 1721
					},
					{
						"project": "הישיבה",
						"file": "yeshiva/gate.py",
						"line": 1420
					},
					{
						"project": "המחולל",
						"file": "machtzev/quarry-check.mjs",
						"line": 10
					},
					{
						"project": "המחולל",
						"file": "new/atoms/safe-https-url.mjs",
						"line": 3
					},
					{
						"project": "בנייה חכמה",
						"file": "edge-proxy/worker.js",
						"line": 66
					}
				]
			}]
		},
		{
			"id": "n15",
			"behavior": "הודעה לכל מתנדב: טקסט להעתקה/שיתוף של הרשימה שלו",
			"verb": "format",
			"verbHe": "מעצב לטקסט",
			"material": "text",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "orbit:src/components/supporters/prayer.ts#prayerListText",
				"key": "orbit:src/components/supporters/prayer.ts#prayerListText",
				"name": "כותב טקסט להעתקה/שיתוף",
				"role": "format",
				"roleHe": "מעצב לטקסט",
				"project": "אורביט",
				"inner": false,
				"proof": "proven",
				"cases": 13,
				"laws": ["format.injective", "format.det"],
				"arity": 2,
				"module": "src/components/supporters/prayer.ts",
				"export": "prayerListText",
				"home": "orbit:src/components/supporters/prayer.ts#prayerListText",
				"origins": [{
					"project": "אורביט",
					"file": "src/components/supporters/prayer.ts",
					"line": 44,
					"best": true
				}]
			}]
		},
		{
			"id": "n16",
			"behavior": "דוח סוף יום: כמה נמסרו מתוך הרשימה, לכל אזור",
			"verb": "tally",
			"verbHe": "סופר לפי קבוצה",
			"material": "list",
			"status": "proven",
			"statusHe": "✅ מוכח בהרצה",
			"form": "single",
			"steps": [{
				"id": "orbit:src/components/courses/lib.ts#sheetSummary",
				"key": "orbit:src/components/courses/lib.ts#sheetSummary",
				"name": "בונה סיכום נוכחות ליום",
				"role": "tally",
				"roleHe": "סופר לפי קבוצה",
				"project": "אורביט",
				"inner": false,
				"proof": "proven",
				"cases": 24,
				"laws": ["tally.total", "tally.add"],
				"arity": 2,
				"module": "src/components/courses/lib.ts",
				"export": "sheetSummary",
				"home": "orbit:src/components/courses/lib.ts#sheetSummary",
				"origins": [{
					"project": "אורביט",
					"file": "src/components/courses/lib.ts",
					"line": 406,
					"best": true
				}]
			}]
		}
	]
};
const runtime = () => makeRuntime(ASSEMBLY, PARTS);
//#endregion
export { ASSEMBLY, PARTS, makeRuntime, needFunction, runtime };
