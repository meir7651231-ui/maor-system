/** קורא את SIGS ממודול-gen **כטקסט** (בלי לייבא ובלי להריץ): שורה לכל פונקציה, `  name: [ … ],`. */
export function readSigs(text) {
  const out = {};
  const at = text.lastIndexOf('\nexport const SIGS = {\n');
  if (at < 0) return out;
  for (const line of text.slice(at).split('\n').slice(2)) {
    const m = /^ {2}([A-Za-z0-9_$]+): (\[.*\]),$/.exec(line);
    if (m) out[m[1]] = JSON.parse(m[2]);
  }
  return out;
}
