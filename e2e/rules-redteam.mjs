/**
 * red-team — "לקוח שקנה את המערכת הופך לתוקף": מוכיח מול אמולטור-Firestore אמיתי
 * ש-Rules חוסמים לקוח-משלם (חבר-ארגון מאומת שמריץ SDK מהקונסולה) מ: (א) הורדת/גניבת
 * נתוני לקוחות אחרים, (ב) הצצה חוצת-עובדות בתוך הארגון, (ג) הסלמה/השתלטות-פלטפורמה,
 * (ד) הפלה/השחתה ("לשפל"). כל תרחיש-תקיפה = assertFails; כל זרימה-לגיטימית = assertSucceeds.
 * הרצה: firebase emulators:exec --only firestore --project demo-maor 'node e2e/rules-redteam.mjs'
 */
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const SUPER = 'meir7651231@gmail.com'; // מייל-העל (superAdmin ב-Rules)

const env = await initializeTestEnvironment({
  projectId: 'demo-maor',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

// ── זריעה (עוקפת Rules): שני ארגונים; acme = הארגון של התוקף. ────────────────
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'platformOrgs/acme'), {
    members: ['boss@acme.com', 'emp@acme.com', 'ltd@acme.com'],
    manager: 'boss@acme.com',
    memberConfigs: { 'ltd@acme.com': { designations: ['fundA'] } }, // עובדת-מוגבלת
    config: { orgName: 'Acme' },
  });
  await setDoc(doc(db, 'platformOrgs/other'), { members: ['x@other.com'], manager: 'x@other.com', config: { orgName: 'Other' } });
  await setDoc(doc(db, 'orgs/acme/families/f1'), { name: 'משפחה של acme' });
  await setDoc(doc(db, 'orgs/acme/donations/D-1'), { pkey: 'fundB', supporterId: 's1', donation: { rid: 'D-1', amount: 100 } });
  await setDoc(doc(db, 'orgs/acme/donations/D-2'), { pkey: 'fundA', supporterId: 's2', donation: { rid: 'D-2', amount: 50 } });
  await setDoc(doc(db, 'orgs/acme/supporters/s3'), { name: 'תורם fundB', skey: 'fundB' });
  await setDoc(doc(db, 'orgs/acme/_enc/envelope'), { ct: 'ciphertext' });
  await setDoc(doc(db, 'orgSecrets/acme'), { yemotToken: 'SECRET' });
  await setDoc(doc(db, 'orgs/other/families/f9'), { name: 'סוד של לקוח אחר' });
  await setDoc(doc(db, 'orgs/other/donations/D-9'), { pkey: '_shared_', donation: { rid: 'D-9', amount: 999 } });
});

const emp = env.authenticatedContext('emp', { email: 'emp@acme.com' }).firestore();       // חבר-מלא של acme (הלקוח/עובד)
const ltd = env.authenticatedContext('ltd', { email: 'ltd@acme.com' }).firestore();       // עובדת-מוגבלת (fundA בלבד)
const stranger = env.authenticatedContext('str', { email: 'evil@nowhere.com' }).firestore(); // זר מאומת (לא-חבר)
const boss = env.authenticatedContext('boss', { email: 'boss@acme.com' }).firestore();     // מנהל acme
const su = env.authenticatedContext('su', { email: SUPER }).firestore();                   // מייל-על

let pass = 0, fail = 0;
const T = async (name, p) => {
  try { await p; console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n       ${String(e).split('\n')[0]}`); fail++; }
};

console.log('\n═══ א׳ · גניבת נתוני לקוחות אחרים (חוצה-ארגון) ═══');
await T('חבר-acme לא קורא families של ארגון אחר', assertFails(getDoc(doc(emp, 'orgs/other/families/f9'))));
await T('חבר-acme לא קורא תרומה של ארגון אחר', assertFails(getDoc(doc(emp, 'orgs/other/donations/D-9'))));
await T('חבר-acme לא קורא את מסמך-הארגון של לקוח אחר', assertFails(getDoc(doc(emp, 'platformOrgs/other'))));
await T('חבר-acme לא ממנה (list) את כל הלקוחות בפלטפורמה', assertFails(getDocs(collection(emp, 'platformOrgs'))));
await T('חבר-acme לא קורא כספת-סודות (גם לא של עצמו)', assertFails(getDoc(doc(emp, 'orgSecrets/acme'))));
await T('זר מאומת לא קורא נתוני acme', assertFails(getDoc(doc(stranger, 'orgs/acme/families/f1'))));

console.log('\n═══ ב׳ · הצצה חוצה-עובדות בתוך הארגון (ייעוד) ═══');
await T('עובדת-מוגבלת (fundA) לא קוראת תרומת-fundB', assertFails(getDoc(doc(ltd, 'orgs/acme/donations/D-1'))));
await T('עובדת-מוגבלת לא קוראת תומך-fundB', assertFails(getDoc(doc(ltd, 'orgs/acme/supporters/s3'))));
await T('🔴 עובדת-מוגבלת לא הופכת pkey ל-_shared_ (חור-#177)', assertFails(updateDoc(doc(ltd, 'orgs/acme/donations/D-1'), { pkey: '_shared_' })));
await T('🔴 עובדת-מוגבלת לא הופכת skey ל-_shared_ על תומך-fundB', assertFails(updateDoc(doc(ltd, 'orgs/acme/supporters/s3'), { skey: '_shared_' })));
await T('🔴 עובדת-מוגבלת לא מוחקת קבלת-§46 של fundB', assertFails(deleteDoc(doc(ltd, 'orgs/acme/donations/D-1'))));

console.log('\n═══ ג׳ · הסלמה / השתלטות-פלטפורמה ═══');
await T('חבר-acme לא ממנה עצמו מנהל (עדכון platformOrgs/acme)', assertFails(updateDoc(doc(emp, 'platformOrgs/acme'), { manager: 'emp@acme.com' })));
await T('חבר-acme לא משנה חברי-ארגון (members)', assertFails(updateDoc(doc(emp, 'platformOrgs/acme'), { members: ['emp@acme.com'] })));
await T('חבר-acme לא יוצר ארגון-פלטפורמה חדש', assertFails(setDoc(doc(emp, 'platformOrgs/evilcorp'), { members: ['emp@acme.com'] })));
await T('חבר-acme לא כותב לנתוני ארגון אחר', assertFails(setDoc(doc(emp, 'orgs/other/families/hack'), { name: 'x' })));

console.log('\n═══ ד׳ · הפלה / השחתה ("לשפל") ═══');
await T('חבר-acme לא מוחק את מסמך-הארגון של לקוח אחר', assertFails(deleteDoc(doc(emp, 'platformOrgs/other'))));
await T('חבר-acme לא מוחק נתוני ארגון אחר', assertFails(deleteDoc(doc(emp, 'orgs/other/families/f9'))));
await T('🔴 חבר-acme לא מוחק את כספת-ה-DEK (DoS-הצפנה)', assertFails(deleteDoc(doc(emp, 'orgs/acme/_enc/envelope'))));
await T('חבר-acme לא כותב לכספת-הסודות', assertFails(setDoc(doc(emp, 'orgSecrets/acme'), { yemotToken: 'stolen' })));

console.log('\n═══ ה׳ · בקרות-חיוב (הלקוח הלגיטימי כן עובד) ═══');
await T('חבר-acme קורא את נתוני הארגון שלו', assertSucceeds(getDoc(doc(emp, 'orgs/acme/families/f1'))));
await T('חבר-acme כותב לנתוני הארגון שלו', assertSucceeds(setDoc(doc(emp, 'orgs/acme/families/f2'), { name: 'חדש' })));
await T('חבר לא-מוגבל קורא תרומות', assertSucceeds(getDoc(doc(emp, 'orgs/acme/donations/D-1'))));
await T('עובדת-מוגבלת (fundA) כן קוראת תרומת-fundA', assertSucceeds(getDoc(doc(ltd, 'orgs/acme/donations/D-2'))));
await T('מנהל-acme קורא הכל בארגונו', assertSucceeds(getDoc(doc(boss, 'orgs/acme/donations/D-1'))));
await T('מנהל-acme כותב את כספת-ה-DEK (הפעלת-הצפנה)', assertSucceeds(setDoc(doc(boss, 'orgs/acme/_enc/envelope'), { ct: 'y' })));
await T('מייל-על קורא כל ארגון', assertSucceeds(getDoc(doc(su, 'orgs/other/families/f9'))));

await env.cleanup();
console.log(`\n── סיכום red-team ── ${pass} עברו · ${fail} נכשלו`);
if (fail > 0) { console.log('❌ יש חור-אבטחה — Rules לא חוסמים תרחיש-תקיפה!'); process.exit(1); }
console.log('🛡️ כל תרחישי-התקיפה נחסמו · כל הזרימות-הלגיטימיות עבדו');
