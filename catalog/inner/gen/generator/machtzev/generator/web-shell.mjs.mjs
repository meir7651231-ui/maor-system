// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/web-shell.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const hex = (c) => '#' + (c || '0xFF000000').replace(/^0x/i, '').slice(2).toUpperCase();
export function inner$opt$i(argv, f) {
    const i = argv.indexOf(f);
    return i;
}
export function inner$identity$src(e0, chain) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    return src;
}
export function inner$identity$title(e0, chain) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    let title = (src.match(/title:\s*'([^']*)'/) || [])[1] || null;
    return title;
}
export function inner$identity$title$$step(src) {
    let title = (src.match(/title:\s*'([^']*)'/) || [])[1] || null;
    return title;
}
export function inner$identity$id(e0, chain) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const id = (src.match(/title:\s*([A-Za-z_]\w*)/) || [])[1];
    return id;
}
export function inner$identity$id$$step(src) {
    const id = (src.match(/title:\s*([A-Za-z_]\w*)/) || [])[1];
    return id;
}
export function inner$identity$tid(e0, chain) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const tid = (src.match(/themes\['([^']+)'\]/) || [])[1];
    return tid;
}
export function inner$identity$tid$$step(src) {
    const tid = (src.match(/themes\['([^']+)'\]/) || [])[1];
    return tid;
}
export function inner$identity$tname(e0, chain, ds) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const tid = (src.match(/themes\['([^']+)'\]/) || [])[1];
    const tname = tid ? (ds.match(new RegExp(`'${tid}':\\s*(\\w+)`)) || [])[1] : null;
    return tname;
}
export function inner$identity$tname$$step(ds, tid) {
    const tname = tid ? (ds.match(new RegExp(`'${tid}':\\s*(\\w+)`)) || [])[1] : null;
    return tname;
}
export function inner$identity$trow(e0, chain, ds) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const tid = (src.match(/themes\['([^']+)'\]/) || [])[1];
    const tname = tid ? (ds.match(new RegExp(`'${tid}':\\s*(\\w+)`)) || [])[1] : null;
    const trow = tname ? (ds.match(new RegExp(`static const ${tname} = DsPureTheme\\(([^;]*)\\)`)) || [])[1] : null;
    return trow;
}
export function inner$identity$trow$$step(ds, tname) {
    const trow = tname ? (ds.match(new RegExp(`static const ${tname} = DsPureTheme\\(([^;]*)\\)`)) || [])[1] : null;
    return trow;
}
export function inner$identity$accent(e0, chain, ds) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const tid = (src.match(/themes\['([^']+)'\]/) || [])[1];
    const tname = tid ? (ds.match(new RegExp(`'${tid}':\\s*(\\w+)`)) || [])[1] : null;
    const trow = tname ? (ds.match(new RegExp(`static const ${tname} = DsPureTheme\\(([^;]*)\\)`)) || [])[1] : null;
    const accent = hex(trow ? (trow.match(/\ba:\s*Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1] : (ds.match(/static const accent = Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1]);
    return accent;
}
export function inner$identity$accent$$step(ds, trow) {
    const accent = hex(trow ? (trow.match(/\ba:\s*Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1] : (ds.match(/static const accent = Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1]);
    return accent;
}
export function inner$identity$sid(e0, chain) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const sid = (src.match(/skins\['([^']+)'\]/) || [])[1];
    return sid;
}
export function inner$identity$sid$$step(src) {
    const sid = (src.match(/skins\['([^']+)'\]/) || [])[1];
    return sid;
}
export function inner$identity$srow(e0, chain, ds) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const sid = (src.match(/skins\['([^']+)'\]/) || [])[1];
    const srow = sid ? (ds.match(new RegExp(`'${sid}':\\s*DsPureSkin\\(([^)]*canvas[^;]*?)\\)\\}`)) || ds.match(new RegExp(`'${sid}':\\s*DsPureSkin\\(([^;]*)\\)`)) || [])[1] : null;
    return srow;
}
export function inner$identity$srow$$step(ds, sid) {
    const srow = sid ? (ds.match(new RegExp(`'${sid}':\\s*DsPureSkin\\(([^)]*canvas[^;]*?)\\)\\}`)) || ds.match(new RegExp(`'${sid}':\\s*DsPureSkin\\(([^;]*)\\)`)) || [])[1] : null;
    return srow;
}
export function inner$identity$canvas(e0, chain, ds) {
    const src = chain.find((c) => /MaterialApp\(/.test(c) && /title:/.test(c)) || e0;
    const sid = (src.match(/skins\['([^']+)'\]/) || [])[1];
    const srow = sid ? (ds.match(new RegExp(`'${sid}':\\s*DsPureSkin\\(([^)]*canvas[^;]*?)\\)\\}`)) || ds.match(new RegExp(`'${sid}':\\s*DsPureSkin\\(([^;]*)\\)`)) || [])[1] : null;
    const canvas = hex(srow ? (srow.match(/canvas:\s*Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1] : (ds.match(/static const canvas = Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1]);
    return canvas;
}
export function inner$identity$canvas$$step(ds, srow) {
    const canvas = hex(srow ? (srow.match(/canvas:\s*Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1] : (ds.match(/static const canvas = Color\((0x[0-9A-Fa-f]{8})\)/) || [])[1]);
    return canvas;
}
export function inner$identity$emoji(title, body, EMO) {
    const emoji = ([...body.matchAll(/'([^']*)'/g)].map((m) => (m[1].match(EMO) || [])[0]).find(Boolean)) || (title || '?')[0];
    return emoji;
}
export function inner$writeShell$swSrc(id) {
    const swSrc = `// ☁️ חולל ע"י web-shell (G59 · הכרעה-31) — מקלט-דחיפה. אל תערוך ידנית.
  //   גרסאות מקובעות בכוונה: CDN לא-מקובע משנה את המקלט מתחת לפריסה שלא נגעה בו.
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  
  const q = new URLSearchParams(self.location.search);
  const cfg = { apiKey: q.get('apiKey'), projectId: q.get('projectId'), appId: q.get('appId'), messagingSenderId: q.get('messagingSenderId') || '', authDomain: q.get('authDomain') || '' };
  if (cfg.apiKey && cfg.projectId && cfg.appId) {
    firebase.initializeApp(cfg);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const n = payload.notification || {};
      const d = payload.data || {};
      self.registration.showNotification(n.title || ${JSON.stringify(id.title)}, {
        body: n.body || '',
        icon: 'icon.svg',
        dir: 'rtl',
        lang: 'he',
        tag: d.rid ? 'due-' + d.rid : undefined,   // תזכורת אחת לתיק, לא ערימה
        data: d,
      });
    });
    self.addEventListener('notificationclick', (e) => {
      e.notification.close();
      e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
        for (const w of ws) { if ('focus' in w) return w.focus(); }
        return self.clients.openWindow(new URL('.', self.registration.scope).href);   // הורה-ה-scope = שורש-האפליקציה (בלי רגקס — נמלט-לרעה בתבנית)
      }));
    });
  }
  `;
    return swSrc;
}
export function inner$prune$keep(js, fams) {
    const keep = fams.filter((f) => /^(MaterialIcons|packages\/)/.test(f.family) || js.includes(`"${f.family}"`));
    return keep;
}
export function inner$prune$kept(js, fams) {
    const keep = fams.filter((f) => /^(MaterialIcons|packages\/)/.test(f.family) || js.includes(`"${f.family}"`));
    const kept = new Set(keep.flatMap((f) => f.fonts.map((x) => x.asset)));
    return kept;
}
export function inner$prune$kept$$step(keep) {
    const kept = new Set(keep.flatMap((f) => f.fonts.map((x) => x.asset)));
    return kept;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$identity$src: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$identity$title: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$identity$title$$step: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$identity$id: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$identity$id$$step: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$identity$tid: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$identity$tid$$step: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$identity$tname: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ds","d":{"t":"any"},"opt":false}],
  inner$identity$tname$$step: [{"name":"ds","d":{"t":"any"},"opt":false},{"name":"tid","d":{"t":"any"},"opt":false}],
  inner$identity$trow: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ds","d":{"t":"any"},"opt":false}],
  inner$identity$trow$$step: [{"name":"ds","d":{"t":"any"},"opt":false},{"name":"tname","d":{"t":"any"},"opt":false}],
  inner$identity$accent: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ds","d":{"t":"any"},"opt":false}],
  inner$identity$accent$$step: [{"name":"ds","d":{"t":"any"},"opt":false},{"name":"trow","d":{"t":"any"},"opt":false}],
  inner$identity$sid: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$identity$sid$$step: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$identity$srow: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ds","d":{"t":"any"},"opt":false}],
  inner$identity$srow$$step: [{"name":"ds","d":{"t":"any"},"opt":false},{"name":"sid","d":{"t":"any"},"opt":false}],
  inner$identity$canvas: [{"name":"e0","d":{"t":"any"},"opt":false},{"name":"chain","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ds","d":{"t":"any"},"opt":false}],
  inner$identity$canvas$$step: [{"name":"ds","d":{"t":"any"},"opt":false},{"name":"srow","d":{"t":"any"},"opt":false}],
  inner$identity$emoji: [{"name":"title","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false},{"name":"EMO","d":{"t":"any"},"opt":false}],
  inner$writeShell$swSrc: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$prune$keep: [{"name":"js","d":{"t":"any"},"opt":false},{"name":"fams","d":{"t":"any"},"opt":false}],
  inner$prune$kept: [{"name":"js","d":{"t":"any"},"opt":false},{"name":"fams","d":{"t":"any"},"opt":false}],
  inner$prune$kept$$step: [{"name":"keep","d":{"t":"any"},"opt":false}],
};
