/**
 * כיוון-יוצא · משיכת היסטוריית-עסקאות מנדרים-פלוס (GetHistoryJson) → רשומות
 * "תשלום-נכנס". **טהור** (בלי firebase/רשת) כדי שיהיה ניתן-לבדיקה ביחידה.
 *
 * רשת-הביטחון: ה-webhook הוא "ניסיון-אחד-בלבד" (מסמך נדרים) — אם מאור לא היה
 * זמין ברגע החיוב, העסקה אבדה. משיכה-תקופתית מנדרים סוגרת את הפער: כל עסקה
 * שנוצרה מאז ה-cursor האחרון נמשכת ונכתבת (dedup לפי TransactionId ⇒ מה שה-
 * webhook כבר תפס לא משוכפל).
 *
 * נדרים מחזיר את אותם שדות כמו ה-CallBack (ClientName/Amount/Currency/…), לכן
 * אותו `mapPaymentCallback` ממפה. הערות-מסמך: עסקה מבוטלת ⇒ Amount=0; זיכוי ⇒
 * Amount שלילי + "זיכוי עסקה:" בהערות. פאזה-1 (משיכה בטוחה) מתעדת **חיובים
 * חיוביים בלבד** (כמו ה-webhook) — מבוטלות/זיכויים = פאזה מאוחרת מודעת-כסף.
 */
const { mapPaymentCallback } = require('./paymentMap');

/**
 * תאריך-עסקה של נדרים ("dd/MM/yyyy HH:mm:ss") → ISO "yyyy-MM-dd". נדרים ישראלי
 * ⇒ יום/חודש/שנה. מחזיר '' אם אין תאריך תקין (הלקוח ייפול ל-isoToday במיפוי).
 */
function nedarimDateToIso(raw) {
  const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(raw || ''));
  if (!m) return '';
  const [, d, mo, y] = m;
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/**
 * @param {Array<Record<string, unknown>>} rows - מערך ה-JSON מ-GetHistoryJson
 * @param {string} org - slug הארגון (מהודהד ל-mapPaymentCallback לצורך שדה org)
 * @returns {{ writes: Array<{id: string, data: Record<string, unknown>}>, cursor: number }}
 *   writes — רשומות-לכתיבה (id דטרמיניסטי לדדופ); cursor — ה-TransactionId הגבוה
 *   ביותר שנראה (לשמירה ולשליחה כ-LastId בפנייה הבאה). cursor מתקדם על **כל**
 *   השורות (גם מבוטלות) כדי לא למשוך אותן שוב, גם אם לא נכתבו.
 */
function planHistoryWrites(rows, org) {
  const writes = [];
  let cursor = 0;
  for (const r of Array.isArray(rows) ? rows : []) {
    const tid = String(r.TransactionId ?? r.Transaction ?? '').trim();
    const idNum = Number(tid);
    if (Number.isFinite(idNum) && idNum > cursor) cursor = idNum;
    if (!tid) continue; // בלי TransactionId אי-אפשר לדדופ — מדלגים (ה-webhook יתפוס)
    const m = mapPaymentCallback({ ...r, org });
    // פאזה-מודעת-כסף (20.8, לפי תיעוד-נדרים): **חיוב** = Amount חיובי · **זיכוי** =
    // Amount שלילי (מקזז את הצבירה) · **ביטול** = Amount 0. קולטים את שלושתם (dedup
    // לפי tid), עם kind — הלקוח מקזז/מסמן בהתאם. (היה: רק חיובי, ⇒ ניפוח-נטו.)
    const kind = m.amount < 0 ? 'refund' : m.amount === 0 ? 'cancel' : 'charge';
    // נפילות-ברירת-מחדל: Firestore דוחה undefined (שדה חסר מהמפה ⇒ create נכשל).
    // כל שדה שהמפה לא החזירה נכתב כמחרוזת-ריקה (מטבע ⇒ '₪'), כך שהמשיכה עמידה
    // גם מול גרסת-מפה חלקית/ותיקה.
    // שדות ל-hist[] של כרטיס-התומך (תאריך-אמת, מספר-קבלת-נדרים, 4 ספרות אחרונות)
    // + מזהה-תורם (ToremId) כשנדרים מחזיר אותו בעסקה — מפתח-השיוך ל-100% התאמה.
    // מקור-אמת יחיד: mapPaymentCallback (זהה ל-webhook) — מונע פערי-מיפוי בין המסלולים.
    // (הבאג הישן: `r.ToremId` הופיע פעמיים בחילוץ-הידני ⇒ הווריאנט ToremID נשמט.)
    const dIso = m.d;
    const receipt = m.receipt;
    const last4 = m.last4;
    const toremId = m.toremId;
    writes.push({
      id: 'nedarim-' + tid,
      data: {
        amount: m.amount,
        currency: m.currency || '₪',
        name: m.name || '',
        phone: m.phone || '',
        email: m.email || '',
        zeout: m.zeout || '',
        category: m.category || '',
        kevaId: m.kevaId || '',
        reference: m.reference || tid,
        txnId: tid,
        d: dIso, // תאריך-העסקה האמיתי (ISO) — ל-hist[].d; ריק ⇒ הלקוח ייפול ל-isoToday
        receipt, // KabalaId — מספר-הקבלה של נדרים (מנפיק §46) ⇒ hist[].receipt
        last4, // 4 ספרות אחרונות של הכרטיס ⇒ hist[].last4
        toremId, // מזהה-תורם נדרים (אם מסופק) ⇒ שיוך-ישיר לרשימת-התורמים
        source: 'pull', // מבחין ממקור-ה-webhook (אבחון); ה-doc-id זהה ⇒ אין כפילות
        status: 'pending',
        ...(kind !== 'charge' ? { kind } : {}), // 'refund'/'cancel' — חיוב רגיל נשאר ביט-זהה
      },
    });
  }
  return { writes, cursor };
}

module.exports = { planHistoryWrites, nedarimDateToIso };
