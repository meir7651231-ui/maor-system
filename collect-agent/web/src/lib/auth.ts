// טוקן בעלים ל-API (שער האבטחה של השרת, team/qa.md S1). sessionStorage בלבד — נמחק בסגירת הלשונית.
// אותו מפתח כמו /ui ⇒ הדבקה אחת לשני הממשקים. קישור מ-demo.sh: #/dashboard?token=… (fragment — לא נשלח לשרת).
export const TOKEN_KEY = 'gabi_owner_token';

export interface Storage { getItem(k: string): string | null; setItem(k: string, v: string): void }

/** קורא token= מה-hash, שומר, ומחזיר hash נקי (כדי שהטוקן לא יישאר בשורת הכתובת). */
export function takeTokenFromHash(hash: string, store: Storage): string {
  const m = /[?&]token=([A-Za-z0-9_\-.~]{32,})/.exec(hash);
  if (!m) return hash;
  store.setItem(TOKEN_KEY, m[1]);
  return hash.replace(/[?&]token=[^&]*/, '').replace(/\?$/, '');
}

export const readToken = (store: Storage | undefined): string => {
  try { return store?.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
};

/** דף החייב (/pay/{code}) — ציבורי; מחזיר את הקוד או null. */
export function payCodeOf(pathname: string): string | null {
  const m = /^\/pay\/([A-Za-z0-9]{4,32})\/?$/.exec(pathname);
  return m ? m[1] : null;
}
