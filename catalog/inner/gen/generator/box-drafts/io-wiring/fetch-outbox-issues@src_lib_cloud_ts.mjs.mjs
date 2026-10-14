// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:box-drafts/io-wiring/fetch-outbox-issues@src_lib_cloud_ts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fetchOutboxIssues$colName(box) {
    const colName = box === 'sms' ? 'smsOutbox' : 'mailOutbox';
    return colName;
}

export const SIGS = {
  inner$fetchOutboxIssues$colName: [{"name":"box","d":{"t":"str"},"opt":false}],
};
