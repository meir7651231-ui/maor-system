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
  await setDoc(doc(db, 'orgs/acme/meta/org'), { orgName: 'Acme', seq: 100, receiptSeq: 50, donationSeq: 50, shopReceiptSeq: 10 });
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

console.log('\n═══ ו׳ · #6 · "רק מנהל מנפיק קבלה" (יצירת-תרומה בשרת) ═══');
await T('עובד לא-מנהל לא יוצר תרומה (קבלת-§46)', assertFails(setDoc(doc(emp, 'orgs/acme/donations/D-forged'), { pkey: '_shared_', supporterId: 's1', donation: { rid: 'D-forged', amount: 99999 } })));
await T('עובדת-מוגבלת לא יוצרת תרומה', assertFails(setDoc(doc(ltd, 'orgs/acme/donations/D-forged2'), { pkey: 'fundA', supporterId: 's2', donation: { rid: 'D-forged2', amount: 100 } })));
await T('מנהל כן מנפיק קבלה (יצירת-תרומה)', assertSucceeds(setDoc(doc(boss, 'orgs/acme/donations/D-100'), { pkey: '_shared_', supporterId: 's1', donation: { rid: 'D-100', amount: 100 } })));
await T('מייל-על כן מנפיק קבלה', assertSucceeds(setDoc(doc(su, 'orgs/acme/donations/D-101'), { pkey: '_shared_', supporterId: 's1', donation: { rid: 'D-101', amount: 100 } })));

console.log('\n═══ ז׳ · #7 · מונוטוניות-מוני-קבלות ב-meta/org ═══');
await T('🔴 עובד לא מגלגל-אחורה donationSeq (מונע שכפול-rid)', assertFails(updateDoc(doc(emp, 'orgs/acme/meta/org'), { donationSeq: 1 })));
await T('🔴 עובד לא מנמיך receiptSeq', assertFails(updateDoc(doc(emp, 'orgs/acme/meta/org'), { receiptSeq: 0 })));
await T('כתיבה-לגיטימית: הרמת-מונה מותרת (סנכרון תקין)', assertSucceeds(updateDoc(doc(emp, 'orgs/acme/meta/org'), { donationSeq: 60 })));
await T('כתיבה-לגיטימית: מונה שווה + שדה-אחר מותר', assertSucceeds(updateDoc(doc(emp, 'orgs/acme/meta/org'), { orgName: 'Acme חדש' })));
await T('הקפצה-מעלה מותרת (רצף עם פער — לא שכפול)', assertSucceeds(updateDoc(doc(emp, 'orgs/acme/meta/org'), { donationSeq: 999 })));

console.log('\n═══ ח׳ · נחיל-הרשמה 17.8 · הקשחת platformRequests/joinRequests (#2/#3) ═══');
// כל תרחיש-create = uid ייחודי תואם-מסמך (הכלל create-only if auth.uid == uid);
// מסמך-לשימוש-חוזר היה נהפך ל-update ⇒ נדחה מטעם אחר (לא ה-hasOnly שנבדק).
const ctxOf = (uid) => env.authenticatedContext(uid, { email: uid + '@org.com' }).firestore();
// ✅ הרשמת-אשף מלאה (8 שדות: 5 בסיס + industry/size/needs) — חייבת לעבור (לא לשבור!)
await T('הרשמה-מלאה (8 שדות אשף) מותרת', assertSucceeds(setDoc(doc(ctxOf('nu1'), 'platformRequests/nu1'), {
  orgName: 'עמותה חדשה', contactName: 'ישראל', phone: '050-1234567', email: 'nu1@org.com',
  at: '2026-08-18T00:00:00.000Z', industry: 'or-rishon', size: 'small', needs: ['crm', 'donations'],
})));
// ✅ הרשמה-מינימלית (5 שדות-בסיס, נפילת writeOrgRequestResilient) — חייבת לעבור
await T('הרשמה-מינימלית (5 שדות-בסיס) מותרת', assertSucceeds(setDoc(doc(ctxOf('nu2'), 'platformRequests/nu2'), {
  orgName: 'עמותה', contactName: 'ישראל', phone: '050-1234567', email: 'nu2@org.com', at: '2026-08-18T00:00:00.000Z',
})));
// ❌ שדה-זר (מחוץ ל-allowlist) — נחסם (מונע מסמך-ענק/הזרקת-שדות)
await T('🔴 שדה-זר ב-platformRequests נחסם (hasOnly)', assertFails(setDoc(doc(ctxOf('nu3'), 'platformRequests/nu3'), {
  orgName: 'x', email: 'nu3@org.com', evil: 'x'.repeat(500000),
})));
// ❌ מחרוזת חורגת-גודל — נחסמת
await T('🔴 orgName ענק ב-platformRequests נחסם (תקרת-גודל)', assertFails(setDoc(doc(ctxOf('nu4'), 'platformRequests/nu4'), {
  orgName: 'x'.repeat(5000), email: 'nu4@org.com',
})));
// ❌ uid לא-תואם — נחסם (זהות)
await T('🔴 כתיבת-בקשה תחת uid של אחר נחסמת', assertFails(setDoc(doc(ctxOf('nu5'), 'platformRequests/someoneelse'), { email: 'nu5@org.com' })));
// ✅ בקשת-הצטרפות לגיטימית (5 שדות מוכרים) — מותרת
await T('joinRequest לגיטימי (5 שדות) מותר', assertSucceeds(setDoc(doc(ctxOf('nj1'), 'platformOrgs/acme/joinRequests/nj1'), {
  email: 'nj1@org.com', name: 'ישראל', phone: '050-1234567', code: 'abc', at: '2026-08-18T00:00:00.000Z',
})));
// ❌ joinRequest עם שדה-זר — נחסם (DoS חוצה-ארגון)
await T('🔴 שדה-זר/ענק ב-joinRequest נחסם (hasOnly)', assertFails(setDoc(doc(ctxOf('nj2'), 'platformOrgs/acme/joinRequests/nj2'), {
  email: 'nj2@org.com', junk: 'x'.repeat(500000),
})));

console.log('\n═══ ט׳ · 💬 צ׳אט-תמיכה חי — בידוד + אכיפת-from (17.8) ═══');
// ✅ הלקוח כותב הודעה בשיחה שלו (uid תואם, from:'user')
await T('לקוח כותב הודעה בשיחה-שלו (from:user)', assertSucceeds(setDoc(doc(emp, 'supportChats/emp/messages/m1'), { from: 'user', text: 'שלום, יש לי שאלה', at: '2026-08-18T10:00:00.000Z' })));
// ✅ מייל-על משיב (from:'admin')
await T('מייל-על משיב (from:admin)', assertSucceeds(setDoc(doc(su, 'supportChats/emp/messages/m2'), { from: 'admin', text: 'בשמחה, איך אפשר לעזור?', at: '2026-08-18T10:01:00.000Z' })));
// ✅ הלקוח קורא את השיחה שלו
await T('לקוח קורא את השיחה שלו', assertSucceeds(getDoc(doc(emp, 'supportChats/emp/messages/m2'))));
// ❌ לקוח כותב בשיחה של מישהו אחר
await T('🔴 לקוח לא כותב בשיחת-אחר (בידוד)', assertFails(setDoc(doc(emp, 'supportChats/stranger/messages/x'), { from: 'user', text: 'פריצה', at: '2026-08-18T10:00:00.000Z' })));
// ❌ לקוח קורא שיחה של אחר
await T('🔴 לקוח לא קורא שיחת-אחר', assertFails(getDoc(doc(emp, 'supportChats/stranger/messages/m1'))));
// ❌ לקוח מתחזה ל-admin (from:'admin' בשיחה שלו)
await T('🔴 לקוח לא מתחזה לתמיכה (from:admin)', assertFails(setDoc(doc(emp, 'supportChats/emp/messages/fake'), { from: 'admin', text: 'תשובה מזויפת', at: '2026-08-18T10:00:00.000Z' })));
// ❌ הודעה ענקית (DoS)
await T('🔴 הודעת-ענק נחסמת (תקרת 2000)', assertFails(setDoc(doc(emp, 'supportChats/emp/messages/big'), { from: 'user', text: 'x'.repeat(5000), at: '2026-08-18T10:00:00.000Z' })));
// ❌ שדה-זר בהודעה
await T('🔴 שדה-זר בהודעה נחסם (hasOnly)', assertFails(setDoc(doc(emp, 'supportChats/emp/messages/j'), { from: 'user', text: 'x', at: '2026-08-18T10:00:00.000Z', evil: 'y' })));
// ✅ מייל-על קורא כל שיחה (תיבת-התמיכה)
await T('מייל-על קורא כל שיחה', assertSucceeds(getDoc(doc(su, 'supportChats/emp/messages/m1'))));

await env.cleanup();
console.log(`\n── סיכום red-team ── ${pass} עברו · ${fail} נכשלו`);
if (fail > 0) { console.log('❌ יש חור-אבטחה — Rules לא חוסמים תרחיש-תקיפה!'); process.exit(1); }
console.log('🛡️ כל תרחישי-התקיפה נחסמו · כל הזרימות-הלגיטימיות עבדו');
