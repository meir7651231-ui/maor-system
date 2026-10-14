/**
 * 🔍 חלק `fuzzy` — חיפוש סלחני (פורק ממנוע "מה צריך?", חלק 4: tokMatch — תחיליות, גזע ושגיאת-כתיב אחת).
 * לא יודע איפה הוא מחפש: שמות, עסקים, הערות — טקסט מול טקסט. טהור, לא זורק.
 */
import { levenshtein } from '../../search';

/**
 * נרמול עברי לחיפוש: מקף-עברי ⇒ רווח, בלי ניקוד/גרשיים, פיסוק ⇒ רווח, סופיות ⇒ רגילות, וו⇒ו,
 * יי⇒י, רווחים מכווצים, אותיות קטנות. (זהה לנרמול של "מה צריך?").
 */
export function normHe(s: unknown): string {
  return String(s ?? '')
    .replace(/־/g, ' ')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[״׳"'`]/g, '')
    .replace(/[.,!?;:()\-/\\+*_=&]/g, ' ')
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ')
    .replace(/וו/g, 'ו')
    .replace(/יי/g, 'י')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** אותיות-השימוש (ו ה ב ל מ ש כ וצירופיהן) — מוסרות רק כשנשארות ≥3 אותיות. */
const PREFIX_RE = /^(וכש|וש|וה|וב|ול|ומ|שה|שב|של|מה|בה|לה|כש|ו|ה|ב|ל|מ|ש|כ)(?=.{3,})/;
const stem = (w: string): string => (w.length > 3 ? w.replace(/(ות|ימ|ה|ת)$/, '') : w);
const lev = (a: string, b: string): number => (Math.abs(a.length - b.length) > 2 ? 9 : levenshtein(a, b));

/**
 * ציון מילה מול מילה (שתיהן מנורמלות): זהה 3 · אחרי-תחילית 2.8 · אותו גזע 2.6 · תחילית+גזע 2.5 ·
 * המילה מתחילה במה שהוקלד 2.2 (1.2 לשתי אותיות) · מה שהוקלד מתחיל במילה 2.2 · שגיאת-כתיב 1.6 · 0.
 * `maxTypos` = 0 מכבה את שגיאת-הכתיב. עם 1 — אותה טבלה בדיוק כמו tokMatch.
 */
export function wordScore(tok: string, s: string, maxTypos = 1): number {
  if (typeof tok !== 'string' || typeof s !== 'string' || !tok || !s) return 0;
  if (tok === s) return 3;
  const st = tok.replace(PREFIX_RE, '');
  if (st === s) return 2.8;
  if (tok.length >= 4 && stem(tok) === stem(s)) return 2.6;
  if (st.length >= 4 && stem(st) === stem(s)) return 2.5;
  if (tok.length >= 2 && s.startsWith(tok)) return tok.length >= 3 ? 2.2 : 1.2;
  if (s.length >= 3 && (tok.startsWith(s) || st.startsWith(s))) return 2.2;
  const typos = maxTypos === 1 ? 1 : 0;
  if (typos > 0 && tok.length >= 4 && s.length >= 4 && Math.min(lev(tok, s), lev(st, s)) <= typos) return 1.6;
  return 0;
}

export interface FuzzyCandidate {
  id: string;
  text: string;
}

/**
 * חיפוש: כל מילה בשאילתה חייבת להתאים למילה כלשהי בטקסט (וגם); הציון = סכום ההתאמה הטובה ביותר
 * לכל מילה. מחזיר מזהים מהציון הגבוה לנמוך; שוויון ⇒ בסדר המקורי. שאילתה ריקה ⇒ [].
 */
export function fuzzyFind(query: string, candidates: readonly FuzzyCandidate[], maxTypos = 1): string[] {
  const toks = normHe(query).split(' ').filter(Boolean);
  if (!toks.length || !Array.isArray(candidates)) return [];
  const hits: { id: string; score: number; i: number }[] = [];
  candidates.forEach((c, i) => {
    if (!c || typeof c.id !== 'string' || c.text == null) return;
    const words = normHe(c.text).split(' ').filter(Boolean);
    let score = 0;
    for (const t of toks) {
      let best = 0;
      for (const w of words) best = Math.max(best, wordScore(t, w, maxTypos));
      if (!best) return;
      score += best;
    }
    hits.push({ id: c.id, score, i });
  });
  hits.sort((a, b) => b.score - a.score || a.i - b.i);
  return hits.map((h) => h.id);
}
