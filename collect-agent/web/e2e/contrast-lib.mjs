// סורק ניגודיות AA בדפדפן (גבי עיצוב) — משותף ל-landing-contrast.mjs ול-app-contrast.mjs.
// לכל צומת-טקסט נראה: הצבע המחושב מול הרקע האפקטיבי (שכבות הרקע הלא-שקופות במעלה העץ, מורכבות על לבן), אחרי
// פענוח oklch/rgba דרך canvas. סף 4.5:1, או 3:1 לטקסט גדול (≥24px, או ≥18.66px ומשקל ≥700). רקע-תמונה ⇒ מדולג.
// טקסט בכפתור מושבת (disabled) פטור לפי WCAG 1.4.3.
export async function scan(page) {
  return page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgba = s => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const mix = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
    const bgOf = el => {
      const layers = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { img: true };
        const c = rgba(cs.backgroundColor);
        if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
      }
      let base = [255, 255, 255];
      for (const l of layers.reverse()) base = mix(l, base);
      return { rgb: base };
    };
    const out = [], skipped = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      const t = n.textContent.trim(); const el = n.parentElement;
      if (!t || !el) continue;
      const cs = getComputedStyle(el);
      if (el.closest('button:disabled, [aria-disabled="true"]')) continue;
      if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[aria-hidden="true"]') || !el.getClientRects().length) continue;
      const bg = bgOf(el); if (bg.img) { skipped.push(t.slice(0, 30)); continue; }
      const fg = mix(rgba(cs.color), bg.rgb), op = parseFloat(cs.opacity);
      const a = lum(fg), b = lum(bg.rgb), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
      const need = large ? 3 : 4.5;
      if (r < need || op < 1) out.push({ t: t.slice(0, 40), r: +r.toFixed(2), need, px, color: cs.color, op, tag: el.tagName.toLowerCase(), cls: el.className });
    }
    return { fails: out, skipped };
  });
}
