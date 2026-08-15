// ambient — fflate@0.6.11 מפרסם types ב-`lib/index.d.ts` אך שדה ה-`exports`
// שלו לא ממפה אותם ל-moduleResolution המודרני (‏bundler), אז TS רואה 'any'
// מרומז. הצהרה מינימלית ל-4 הפונקציות שאנו משתמשים בהן (חתימות נאמנות ל-API).
declare module 'fflate' {
  /** פורק zip ל-{path: bytes}. */
  export function unzipSync(data: Uint8Array): Record<string, Uint8Array>;
  /** אורז {path: bytes} ל-zip. */
  export function zipSync(data: Record<string, Uint8Array>): Uint8Array;
  /** ‏bytes → מחרוזת (UTF-8; latin1=true ל-windows-1252). */
  export function strFromU8(dat: Uint8Array, latin1?: boolean): string;
  /** מחרוזת → bytes (UTF-8; latin1=true). */
  export function strToU8(str: string, latin1?: boolean): Uint8Array;
}
