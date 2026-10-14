// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/enginebox/plugs.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PLUG_TYPES = [
    { id: 'times.shabbat', label: 'זמני שבת', desc: 'הדלקת נרות, צאת השבת ור״ת של שבת מסוימת לפי מיקום הקהילה' },
    { id: 'times.prayers', label: 'מניינים', desc: 'תפילות בציבור לפי בית כנסת, כתובת, יום ושעה' },
    { id: 'times.blocked', label: 'שבת וחג סגורים', desc: 'האם עכשיו שבת או יום טוב — כדי לסגור מה שאסור להפעיל בהם' },
    { id: 'pro.match', label: 'בעל מקצוע מתאים', desc: 'בעלי מקצוע מהמדריך שמתאימים לצורך שנכתב במילים, פתוחים עכשיו קודם' },
    { id: 'emergency', label: 'מספרי חירום', desc: 'רשימת מספרי החירום של הקהילה (מד״א, משטרה, כיבוי ומקומיים)' },
    { id: 'availability', label: 'מקום פנוי', desc: 'אילו יחידות אירוח פנויות בלילה מסוים — בלי מחירים ובלי שמות אורחים' },
    { id: 'booking', label: 'הזמנה', desc: 'בקשת הזמנה של מקום שנרשמת לאישור' },
    { id: 'request.text', label: 'בקשה בעברית', desc: 'בקשה שנכתבה במילים רגילות ("נזילה במקלחת") להעברה לטיפול' },
    { id: 'message.text', label: 'הודעה מוכנה', desc: 'נוסח הודעה מוכן לשליחה לאדם (בוואטסאפ או במסרון)' },
    { id: 'voice.menu', label: 'שלוחה בקו', desc: 'תפריט שמושמע למתקשר בקו הטלפון ונבחר במקש' },
    { id: 'print.page', label: 'דף להדפסה', desc: 'עמוד מוכן להדפסה או לחוברת' },
    { id: 'date.hebrew', label: 'תאריך עברי', desc: 'תאריך עברי, חג ופרשה של יום מסוים' },
    { id: 'reminder', label: 'תזכורת', desc: 'תזכורת ביום ובשעה מסוימים' },
    { id: 'payment.link', label: 'קישור תשלום', desc: 'קישור לעמוד הסליקה של הארגון — קישור בלבד, בלי הנפקת מסמכים' },
    { id: 'person', label: 'אדם או משפחה', desc: 'פרטי אדם או משפחה שכבר רשומים במערכת (שם וטלפון)' },
    { id: 'day.summary', label: 'שורה בתקציר היום', desc: 'שורה קצרה בכרטיס "☀ תקציר היום" — מה חשוב היום בכלי הזה' },
];
export function inner$plugOrder$i(id) {
    const i = PLUG_TYPES.findIndex((p) => p.id === id);
    return i;
}

export const SIGS = {
  inner$plugOrder$i: [{"name":"id","d":{"t":"str"},"opt":false}],
};
