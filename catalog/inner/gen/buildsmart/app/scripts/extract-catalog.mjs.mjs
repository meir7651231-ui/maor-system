// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/scripts/extract-catalog.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$liftConst$re(name) {
    const re = new RegExp(`\\bconst\\s+${name}\\s*=`);
    return re;
}
export function inner$liftConst$start(lines, name) {
    const re = new RegExp(`\\bconst\\s+${name}\\s*=`);
    const start = lines.findIndex((l) => re.test(l));
    return start;
}
export function inner$liftConst$start$$step(lines, re) {
    const start = lines.findIndex((l) => re.test(l));
    return start;
}
export function inner$liftConst$openChar(lines, name) {
    const re = new RegExp(`\\bconst\\s+${name}\\s*=`);
    const start = lines.findIndex((l) => re.test(l));
    const openChar = lines[start].match(/=\s*\{/) ? '{' : '[';
    return openChar;
}
export function inner$liftConst$openChar$$step(lines, start) {
    const openChar = lines[start].match(/=\s*\{/) ? '{' : '[';
    return openChar;
}
export function inner$liftConst$closeChar(lines, name) {
    const re = new RegExp(`\\bconst\\s+${name}\\s*=`);
    const start = lines.findIndex((l) => re.test(l));
    const openChar = lines[start].match(/=\s*\{/) ? '{' : '[';
    const closeChar = openChar === '{' ? '}' : ']';
    return closeChar;
}
export function inner$liftConst$closeChar$$step(openChar) {
    const closeChar = openChar === '{' ? '}' : ']';
    return closeChar;
}
export function inner$map$base64(raw) {
    const base64 = raw.image.split(',', 2)[1];
    return base64;
}
export function inner$map$accessories(raw) {
    const accessories = Array.isArray(raw.acc)
        ? raw.acc.map((a) => ({
            name: String(a.name ?? ''),
            emoji: String(a.img ?? '🧩'),
            price: typeof a.price === 'number' ? a.price : 0,
            qty: typeof a.qty === 'number' ? a.qty : 1,
            why: typeof a.why === 'string' ? a.why : undefined,
            must: a.must === true,
            ...(Array.isArray(a.sizes) ? { sizes: a.sizes } : {}),
        }))
        : [];
    return accessories;
}
export function inner$map$out(id, raw) {
    const out = {
        id,
        name: String(raw.name ?? id),
        emoji: String(raw.img ?? '📦'),
        categoryName: String(raw.cat ?? 'אחר'),
    };
    return out;
}
export function inner$map$out_L221(o) {
    const out = { name: String(o.name ?? '') };
    return out;
}
export function inner$liftConst$depth$$after_loop(lines, name) {
    const re = new RegExp(`\\bconst\\s+${name}\\s*=`);
    const start = lines.findIndex((l) => re.test(l));
    const openChar = lines[start].match(/=\s*\{/) ? '{' : '[';
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 0;
    let end = -1;
    for (let i = start; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === openChar)
                depth++;
            else if (ch === closeChar) {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }
        if (end >= 0)
            break;
    }
    return depth;
}
export function inner$liftConst$end$$after_loop(lines, name) {
    const re = new RegExp(`\\bconst\\s+${name}\\s*=`);
    const start = lines.findIndex((l) => re.test(l));
    const openChar = lines[start].match(/=\s*\{/) ? '{' : '[';
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 0;
    let end = -1;
    for (let i = start; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === openChar)
                depth++;
            else if (ch === closeChar) {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }
        if (end >= 0)
            break;
    }
    return end;
}

export const SIGS = {
  inner$liftConst$re: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$liftConst$start: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$liftConst$start$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$liftConst$openChar: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$liftConst$openChar$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"any"},"opt":false}],
  inner$liftConst$closeChar: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$liftConst$closeChar$$step: [{"name":"openChar","d":{"t":"lit","v":["{","["]},"opt":false}],
  inner$map$base64: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$map$accessories: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$map$out: [{"name":"id","d":{"t":"str"},"opt":false},{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$map$out_L221: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$liftConst$depth$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$liftConst$end$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
};
