// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:box-drafts/io-wiring/retry-outbox-item@src_lib_cloud_ts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$retryOutboxItem$colName(box) {
    const colName = box === 'sms' ? 'smsOutbox' : 'mailOutbox';
    return colName;
}

export const SIGS = {
  inner$retryOutboxItem$colName: [{"name":"box","d":{"t":"any"},"opt":false}],
};
