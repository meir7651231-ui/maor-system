// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/config.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const FLAG_DEFAULTS = {
    // ── ליבה (נאכפות בגנרטור) ──
    voice: 'on',
    voicemail: 'on',
    'voicemail.email': 'on',
    outbound: 'on',
    'outbound.default': 'on',
    'outbound.pick': 'on',
    cti: 'on',
    // ── תוספות (opt-in) ──
    'outbound.international': 'off', // בין-לאומי — כבוי כברירת-מחדל (הגנת-toll-fraud)
    'voice.hardening': 'off', // תקרות-toll-fraud קשיחות ליציאה (בו-זמנית+משך) — opt-in
    'voice.kosher': 'off', // מצב-כשר end-to-end: כל חיוג-יוצא רק דרך SIM כשר — opt-in
    'voice.ivr': 'off',
    'voice.queue': 'off',
    'voice.blocklist': 'off',
    'voice.dnd': 'off',
    'voice.park': 'off',
    'voice.greeting': 'off',
    'voicemail.transcription': 'off',
    'cti.namegreeting': 'off',
    emergency: 'off',
    recording: 'off',
    'calendar.hebrew': 'off',
    'calendar.shabbat': 'off',
    'calendar.zmanim': 'off', // זמנים הלכתיים מדויקים (שקיעה→הדלקה/צאת) — מחליף סגירת-יום-מלא
    'calendar.fasts': 'off',
    'calendar.erev': 'off',
    'calendar.cholhamoed': 'off',
    'channels.whatsapp': 'off',
    'channels.sms': 'off',
    reports: 'off',
    billing: 'off',
};
const TERM_DEFS = {
    office: 'משרד',
    manager: 'מנהל',
    org: 'הארגון',
    greetingDay: 'שלום, הגעתם ל%org%. נציג יענה מיד.',
    greetingNight: 'שלום, הגעתם ל%org%. המשרד סגור כעת, נשמח לחזור אליכם.',
    voicemailPrompt: 'לא זמינים כרגע. השאירו הודעה אחרי הצליל.',
    holdMusic: 'ברירת-מחדל',
    callerLine: 'קו',
    shabbatFriEnd: '15:00', // שעת-סגירה בערב-שבת כש-calendar.shabbat דלוק
};
export function inner$flagOn$parts(key) {
    const parts = key.split('.');
    return parts;
}
export function inner$lev$prev(n) {
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    return prev;
}
export function inner$lev$cost(a, b, i, j) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    return cost;
}
export function inner$nearestKey$bestD(max) {
    let bestD = max + 1;
    return bestD;
}
export function inner$reportDroppedKeys$flagKeys() {
    const flagKeys = Object.keys(FLAG_DEFAULTS);
    return flagKeys;
}
export function inner$reportDroppedKeys$termKeys() {
    const termKeys = Object.keys(TERM_DEFS);
    return termKeys;
}
export function inner$migrateConfig$v(c) {
    const v = Number(c.schemaVersion) || 1;
    return v;
}
export function inner$isBaselineConfig$noFeats(tenant) {
    const f = tenant && tenant.features;
    const noFeats = !f || Object.keys(f).length === 0;
    return noFeats;
}
export function inner$isBaselineConfig$noFeats$$step(f) {
    const noFeats = !f || Object.keys(f).length === 0;
    return noFeats;
}
export function inner$isBaselineConfig$noTerms(tenant) {
    const t = tenant && tenant.terms;
    const noTerms = !t || Object.keys(t).length === 0;
    return noTerms;
}
export function inner$isBaselineConfig$noTerms$$step(t) {
    const noTerms = !t || Object.keys(t).length === 0;
    return noTerms;
}
export function inner$lev$prev$$after_loop(a, b, m, n) {
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    let cur = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
        cur[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        [prev, cur] = [cur, prev];
    }
    return prev;
}

export const SIGS = {
  inner$flagOn$parts: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$lev$prev: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$lev$cost: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$nearestKey$bestD: [{"name":"max","d":{"t":"num"},"opt":false}],
  inner$reportDroppedKeys$flagKeys: [],
  inner$reportDroppedKeys$termKeys: [],
  inner$migrateConfig$v: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$isBaselineConfig$noFeats: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$isBaselineConfig$noFeats$$step: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$isBaselineConfig$noTerms: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$isBaselineConfig$noTerms$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$lev$prev$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
};
